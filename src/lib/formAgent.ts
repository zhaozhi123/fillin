import type {
  AgentField,
  AIConfig,
  FieldDescriptor,
  FillSuggestion,
  PageContext,
  PageObservation,
  RunPhase
} from "../shared/types";
import {
  needsContextualRewrite,
  planFieldTask,
  type FieldTaskPlan
} from "./fieldTaskPlanner";
import {
  completeFillSuggestions,
  hasCurrentFieldValue
} from "./syntheticValues";

const MAX_AGENT_STEPS = 3;

export type FormAgentProgress = {
  phase: RunPhase;
  fields: AgentField[];
};

export type FormAgentResult = {
  fields: AgentField[];
  undoValues: Array<{
    fieldId: string;
    frameId?: number;
    localId?: string;
    value: string;
  }>;
};

export type FormAgentDependencies = {
  scan: (page: PageContext) => Promise<FieldDescriptor[]>;
  observe: (page: PageContext) => Promise<PageObservation>;
  generate: (input: {
    config: AIConfig;
    fields: FieldDescriptor[];
    page: PageContext;
    observation: PageObservation;
    instruction: string;
    verificationFeedback: string;
    signal: AbortSignal;
  }) => Promise<FillSuggestion[]>;
  fill: (
    page: PageContext,
    field: FieldDescriptor,
    value: string
  ) => Promise<void>;
};

function valuesEquivalent(field: FieldDescriptor | undefined, expected: string) {
  if (!field) return false;
  if (field.kind === "checkbox") {
    return field.currentValue.toLowerCase() === expected.toLowerCase();
  }
  const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
  return normalize(field.currentValue) === normalize(expected);
}

function getSuggestionMetadata(
  _field: FieldDescriptor,
  suggestion: FillSuggestion | undefined
) {
  return {
    suggestedValue: suggestion?.value,
    suggestionAction: suggestion?.action,
    confidence: suggestion?.confidence,
    businessMeaning: suggestion?.businessMeaning,
    semanticType: suggestion?.semanticType,
    lengthGuidance: suggestion?.lengthGuidance
  } satisfies Partial<AgentField>;
}

export function prepareAgentFields({
  fields,
  plan,
  suggestions,
  filledValues = new Map<string, string>(),
  allowExistingReplacement = false
}: {
  fields: FieldDescriptor[];
  plan: FieldTaskPlan;
  suggestions: FillSuggestion[];
  filledValues?: Map<string, string>;
  allowExistingReplacement?: boolean;
}): AgentField[] {
  const targetIds = new Set(plan.targetFields.map((field) => field.id));
  const suggestionsById = new Map(
    suggestions.map((suggestion) => [suggestion.fieldId, suggestion])
  );

  return fields.map((field) => {
    const suggestion = suggestionsById.get(field.id);
    const metadata = getSuggestionMetadata(field, suggestion);
    const taskRole = plan.rolesById.get(field.id);
    if (!targetIds.has(field.id)) {
      return {
        ...field,
        ...metadata,
        taskRole,
        status: "skipped"
      };
    }

    const successfullyFilled = filledValues.get(field.id);
    if (successfullyFilled && valuesEquivalent(field, successfullyFilled)) {
      return {
        ...field,
        ...metadata,
        suggestedValue: successfullyFilled,
        taskRole,
        status: "filled"
      };
    }

    const hasCurrentValue = hasCurrentFieldValue(field);
    const contextualRewrite = needsContextualRewrite(field);
    const changesValue =
      Boolean(suggestion?.value.trim()) &&
      suggestion?.value.trim() !== field.currentValue.trim();
    const shouldFill =
      Boolean(suggestion) &&
      ((!hasCurrentValue &&
        suggestion?.action === "fill" &&
        Boolean(suggestion.value.trim())) ||
        (contextualRewrite &&
          suggestion?.action === "replace" &&
          changesValue) ||
        (hasCurrentValue &&
          field.kind !== "password" &&
          allowExistingReplacement &&
          suggestion?.action === "replace" &&
          changesValue));

    return {
      ...field,
      ...metadata,
      taskRole,
      status: shouldFill
        ? "ready"
        : hasCurrentValue
          ? "preserved"
          : "error"
    };
  });
}

function markField(
  fields: AgentField[],
  fieldId: string,
  status: AgentField["status"]
) {
  return fields.map((field) =>
    field.id === fieldId ? { ...field, status } : field
  );
}

function abortIfNeeded(signal: AbortSignal) {
  if (signal.aborted) throw new DOMException("已停止", "AbortError");
}

export async function runFormAgent({
  page,
  config,
  instruction,
  signal,
  dependencies,
  onProgress
}: {
  page: PageContext;
  config: AIConfig;
  instruction: string;
  signal: AbortSignal;
  dependencies: FormAgentDependencies;
  onProgress: (progress: FormAgentProgress) => void;
}): Promise<FormAgentResult> {
  const undoById = new Map<
    string,
    {
      fieldId: string;
      frameId?: number;
      localId?: string;
      value: string;
    }
  >();
  const filledValues = new Map<string, string>();
  let verificationFeedback = "";
  let latestFields: AgentField[] = [];
  let latestFailure = "页面没有接受生成内容";

  for (let step = 1; step <= MAX_AGENT_STEPS; step += 1) {
    abortIfNeeded(signal);
    onProgress({ phase: "scanning", fields: latestFields });
    const [scanned, observation] = await Promise.all([
      dependencies.scan(page),
      dependencies.observe(page)
    ]);
    abortIfNeeded(signal);

    if (!scanned.length) {
      return { fields: [], undoValues: [] };
    }

    const plan = planFieldTask({ fields: scanned, observation, instruction });
    onProgress({
      phase: "thinking",
      fields: scanned.map((field) => ({
        ...field,
        taskRole: plan.rolesById.get(field.id),
        status: plan.skippedFields.some((item) => item.id === field.id)
          ? "skipped"
          : "found"
      }))
    });

    let suggestions: FillSuggestion[] = [];
    const hasAIConfiguration = Boolean(
      config.apiKey.trim() &&
        config.baseUrl.trim() &&
        config.model.trim() &&
        config.dataSharingConsent
    );
    if (hasAIConfiguration && plan.targetFields.length) {
      try {
        suggestions = await dependencies.generate({
          config,
          fields: plan.targetFields,
          page,
          observation,
          instruction,
          verificationFeedback,
          signal
        });
      } catch (error) {
        abortIfNeeded(signal);
        verificationFeedback = `第 ${step} 次生成失败：${
          error instanceof Error ? error.message : "模型未返回可用内容"
        }`;
      }
    }

    const completedSuggestions = completeFillSuggestions(
      plan.targetFields,
      suggestions,
      instruction,
      observation
    );
    latestFields = prepareAgentFields({
      fields: scanned,
      plan,
      suggestions: completedSuggestions,
      filledValues,
      allowExistingReplacement: Boolean(instruction.trim())
    });
    onProgress({ phase: "thinking", fields: latestFields });

    const candidates = latestFields.filter(
      (field) => field.status === "ready"
    );
    if (!candidates.length) {
      return {
        fields: latestFields,
        undoValues: Array.from(undoById.values())
      };
    }

    onProgress({ phase: "filling", fields: latestFields });
    const failures: string[] = [];
    for (const candidate of candidates) {
      abortIfNeeded(signal);
      latestFields = markField(latestFields, candidate.id, "filling");
      onProgress({ phase: "filling", fields: latestFields });
      if (!undoById.has(candidate.id)) {
        undoById.set(candidate.id, {
          fieldId: candidate.id,
          frameId: candidate.frameId,
          localId: candidate.localId,
          value: candidate.currentValue
        });
      }
      try {
        await dependencies.fill(
          page,
          candidate,
          candidate.suggestedValue || ""
        );
        filledValues.set(candidate.id, candidate.suggestedValue || "");
        latestFields = markField(latestFields, candidate.id, "filled");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : `${candidate.label} 填写失败`;
        failures.push(`${candidate.label}: ${message}`);
        latestFailure = message;
        latestFields = markField(latestFields, candidate.id, "error");
      }
      onProgress({ phase: "filling", fields: latestFields });
    }

    abortIfNeeded(signal);
    onProgress({ phase: "verifying", fields: latestFields });
    const verifiedFields = await dependencies.scan(page);
    const verificationFailures = candidates.flatMap((candidate) => {
      const expected = filledValues.get(candidate.id);
      if (!expected) return [];
      const observed = verifiedFields.find((field) => field.id === candidate.id);
      return valuesEquivalent(observed, expected)
        ? []
        : [`${candidate.label}: 写入后重新扫描未发现目标内容`];
    });
    failures.push(...verificationFailures);

    if (!failures.length) {
      const verifiedPlan = planFieldTask({
        fields: verifiedFields,
        observation,
        instruction
      });
      latestFields = prepareAgentFields({
        fields: verifiedFields,
        plan: verifiedPlan,
        suggestions: completedSuggestions,
        filledValues,
        allowExistingReplacement: Boolean(instruction.trim())
      });
      onProgress({ phase: "complete", fields: latestFields });
      return {
        fields: latestFields,
        undoValues: Array.from(undoById.values())
      };
    }

    verificationFeedback = [
      `第 ${step} 次执行后任务仍未完成。`,
      ...failures
    ].join(" ");
    latestFailure = failures[0] || latestFailure;
  }

  throw new Error(`经过 ${MAX_AGENT_STEPS} 次检查仍未完成：${latestFailure}`);
}
