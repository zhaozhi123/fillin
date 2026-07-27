import type {
  AIConfig,
  FieldDescriptor,
  FillSuggestion,
  LengthGuidance,
  PageContext,
  PageObservation
} from "../shared/types";
import {
  getArticleTitleLengthGuidance,
  getLongArticleLengthGuidance,
  isArticleBodyField,
  isArticleTitleField
} from "./articleGeneration";
import {
  inferFieldTaskRole,
  needsContextualRewrite
} from "./fieldTaskPlanner";
import { normalizeAIBaseUrl } from "./aiEndpoint";

function getCompletionsEndpoint(baseUrl: string) {
  const normalized = normalizeAIBaseUrl(baseUrl);
  if (/\/chat\/completions$/i.test(normalized)) return normalized;
  return `${normalized}/chat/completions`;
}

function extractContent(payload: unknown): string {
  const data = payload as {
    choices?: Array<{
      message?: { content?: string | Array<{ text?: string }> };
    }>;
    output_text?: string;
  };
  const content = data.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((part) => part.text || "").join("");
  }
  if (typeof data.output_text === "string") return data.output_text;
  throw new Error("AI 返回了无法识别的响应格式");
}

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

async function requestCompletion({
  endpoint,
  config,
  messages,
  signal
}: {
  endpoint: string;
  config: AIConfig;
  messages: ChatMessage[];
  signal: AbortSignal;
}) {
  const response = await fetch(endpoint, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey.trim()}`
    },
    body: JSON.stringify({
      model: config.model.trim(),
      temperature: 0.4,
      max_tokens: 12000,
      messages
    })
  });

  if (!response.ok) {
    let detail = "";
    try {
      const payload = (await response.json()) as {
        error?: { message?: string } | string;
        message?: string;
      };
      detail =
        typeof payload.error === "string"
          ? payload.error
          : payload.error?.message || payload.message || "";
    } catch {
      detail = await response.text().catch(() => "");
    }
    throw new Error(detail || `AI 服务请求失败（HTTP ${response.status}）`);
  }

  return extractContent(await response.json());
}

function parseLengthGuidance(value: unknown): LengthGuidance | undefined {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as Record<string, unknown>;
  const rawMin = Math.round(Number(candidate.min));
  const rawTarget = Math.round(Number(candidate.target));
  const rawMax = Math.round(Number(candidate.max));
  if (
    !Number.isFinite(rawMin) ||
    !Number.isFinite(rawTarget) ||
    !Number.isFinite(rawMax) ||
    rawTarget <= 0
  ) {
    return undefined;
  }

  const min = Math.max(1, Math.min(20000, rawMin));
  const max = Math.max(min, Math.min(20000, rawMax));
  const target = Math.max(min, Math.min(max, rawTarget));
  return { min, target, max, unit: "characters" };
}

function parseSuggestions(
  rawContent: string,
  fieldsById: Map<string, FieldDescriptor>
) {
  const withoutFence = rawContent
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const firstBrace = withoutFence.indexOf("{");
  const lastBrace = withoutFence.lastIndexOf("}");
  const jsonText =
    firstBrace >= 0 && lastBrace > firstBrace
      ? withoutFence.slice(firstBrace, lastBrace + 1)
      : withoutFence;

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("AI 没有按预期返回字段结果，请重试或更换模型");
  }

  const suggestions = Array.isArray(parsed)
    ? parsed
    : (parsed as { decisions?: unknown[]; suggestions?: unknown[] }).decisions ||
      (parsed as { suggestions?: unknown[] }).suggestions;
  if (!Array.isArray(suggestions)) {
    throw new Error("AI 响应中缺少字段决策数组");
  }

  return suggestions.flatMap((item): FillSuggestion[] => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as Record<string, unknown>;
    const fieldId = String(candidate.fieldId || "");
    const field = fieldsById.get(fieldId);
    if (!field) return [];

    const action = ["skip", "fill", "replace"].includes(String(candidate.action))
      ? (candidate.action as FillSuggestion["action"])
      : candidate.value
        ? "fill"
        : "skip";
    let value =
      typeof candidate.value === "string"
        ? candidate.value.trim().slice(0, 16000)
        : "";
    if (field.maxLength && value.length > field.maxLength) {
      value = value.slice(0, field.maxLength);
    }
    if (action !== "skip" && !value) return [];

    const confidence = ["high", "medium", "low"].includes(
      String(candidate.confidence)
    )
      ? (candidate.confidence as FillSuggestion["confidence"])
      : "medium";

    const suggestion: FillSuggestion = {
      fieldId,
      value,
      action,
      confidence,
      businessMeaning:
        typeof candidate.businessMeaning === "string"
          ? candidate.businessMeaning.trim().slice(0, 80)
          : "",
      semanticType:
        typeof candidate.semanticType === "string"
          ? candidate.semanticType.trim().slice(0, 60)
          : "",
      lengthGuidance: parseLengthGuidance(candidate.lengthGuidance),
      reason:
        typeof candidate.reason === "string"
          ? candidate.reason.slice(0, 160)
          : undefined
    };
    if (isArticleTitleField(field, suggestion)) {
      suggestion.lengthGuidance = getArticleTitleLengthGuidance(field);
    } else if (isArticleBodyField(field, suggestion)) {
      suggestion.lengthGuidance = getLongArticleLengthGuidance(field);
    }

    return [suggestion];
  });
}

export async function askAIForFormValues({
  config,
  fields,
  page,
  observation,
  instruction,
  verificationFeedback = "",
  signal
}: {
  config: AIConfig;
  fields: FieldDescriptor[];
  page: PageContext;
  observation: PageObservation;
  instruction: string;
  verificationFeedback?: string;
  signal: AbortSignal;
}) {
  const endpoint = getCompletionsEndpoint(config.baseUrl);
  const fieldsById = new Map(fields.map((field) => [field.id, field]));
  const formPayload = fields.map((field) => ({
    id: field.id,
    kind: field.kind,
    label: field.label,
    name: field.name,
    placeholder: field.placeholder,
    required: field.required,
    options: field.options,
    currentValue: field.currentValue.slice(0, 16000),
    hasCurrentValue:
      field.hasCurrentValue ?? Boolean(field.currentValue.trim()),
    currentValueLength: field.currentValue.length,
    currentValueTruncated: field.currentValue.length > 16000,
    constraints: {
      minLength: field.minLength,
      maxLength: field.maxLength,
      minValue: field.minValue,
      maxValue: field.maxValue,
      step: field.step,
      pattern: field.pattern,
      visibleLines: field.visibleLines
    },
    articleLengthGuidance: isArticleBodyField(field)
      ? getLongArticleLengthGuidance(field)
      : undefined,
    articleTitleLengthGuidance: isArticleTitleField(field)
      ? getArticleTitleLengthGuidance(field)
      : undefined,
    businessContext: field.context,
    taskRole: inferFieldTaskRole(field),
    needsContextualRewrite: needsContextualRewrite(field)
  }));

  const systemPrompt = [
    "You are the reasoning step inside Fillin's observe-decide-act-verify browser agent.",
    "The caller has already removed unrelated page chrome such as global search controls. Return exactly one decision for every remaining task field.",
    "First infer the real business meaning using the page observation, field metadata, nearby context, constraints, task role, current value, and verification feedback.",
    "Generate every human-readable value in pageObservation.language. The website language wins over the language of the user profile or task instruction unless the task explicitly requests translation into another language.",
    "Do not mix Chinese, English, or German boilerplate into a value written for another language.",
    "Match the user's profile when a corresponding fact exists. For every remaining empty task field, generate usable content instead of skipping it.",
    "Use the article text and task instruction for situational content. Never generate generic Fillin boilerplate, random test prose, or a comment that could fit any page.",
    'Use action "fill" for every empty task field.',
    'Preserve a genuine non-empty currentValue by default. Use action "replace" when the task instruction asks for a change, verification feedback reports a failed prior attempt, or needsContextualRewrite is true.',
    'Never replace a genuine existing value when currentValueTruncated is true.',
    'Never replace a password field that already has a value.',
    "For identity, contact, credential, legal, financial, or other sensitive fields without profile data, use obvious synthetic examples rather than implying they are real user facts.",
    "For password fields, generate a strong random-looking password. Existing password values are never included in the payload.",
    "For select/radio fields, always choose one available option and use the exact option value before the colon.",
    "For checkboxes, always return true or false. Return false for consent, authorization, legal agreement, privacy-policy, or declaration fields unless the task instruction explicitly asks to accept them.",
    "For every prose field, choose a reasonable character range and target length based on its business meaning, hard constraints, visible editor size, existing content length, and task instruction.",
    "For taskRole public_comment, write a natural, specific response grounded in at least one concrete claim, example, trade-off, or conclusion from pageObservation.mainText or description. Normally use 60-220 Chinese characters, stay within the field limit, avoid fake personal experience, avoid ads, and do not summarize the whole article.",
    "When a field includes articleTitleLengthGuidance, it is the article title, never the article body. Keep it concise, single-line, and close to that target.",
    "When a field includes articleLengthGuidance, it is an article body. Generate a complete, deeply developed article close to its target, with an introduction, multiple substantial sections, concrete analysis, practical examples, transitions, and a conclusion.",
    "Length is measured in Unicode characters. Hard maxLength always wins.",
    "Use these as contextual heuristics, not fixed templates: article titles are usually 18-35 Chinese characters; summaries 80-200; short descriptions or messages 80-300; article bodies should normally be 3500-7000 Chinese characters and target about 5000 unless a hard field limit is smaller.",
    "When explicitly expanding existing long-form content, target at least a materially richer result, normally max(600, 3× currentValueLength), while staying within a contextually reasonable upper bound.",
    "The generated value should be close to lengthGuidance.target, normally within ±20%, without padding or repetition.",
    "For non-prose identity, contact, credential, date, option, checkbox, and numeric fields, omit lengthGuidance.",
    'Return JSON only: {"decisions":[{"fieldId":"...","businessMeaning":"specific business meaning","semanticType":"article_title|long_form|summary|identity|contact|credential|option|other","lengthGuidance":{"min":800,"target":1000,"max":1400,"unit":"characters"},"action":"skip|fill|replace","value":"empty only for a preserved existing field","confidence":"high|medium|low","reason":"brief"}]}.'
  ].join(" ");
  const userPayload = {
    page: {
      title: page.title,
      url: page.url
    },
    pageObservation: {
      pageType: observation.pageType,
      language: observation.language,
      heading: observation.heading,
      description: observation.description,
      mainText: observation.mainText,
      sectionHeadings: observation.sectionHeadings,
      tags: observation.tags,
      sampleComments: observation.sampleComments
    },
    userProfile:
      config.profile.trim() ||
      "No user profile was provided. Generate clearly synthetic test data for all empty fields.",
    taskInstruction:
      instruction.trim() ||
      "No task-specific instruction was provided. Infer the task from the page and field role.",
    verificationFeedback: verificationFeedback || undefined,
    generationNonce: `${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2)}`,
    fields: formPayload
  };

  const initialContent = await requestCompletion({
    endpoint,
    config,
    signal,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify(userPayload) }
    ]
  });
  const initialDecisions = parseSuggestions(initialContent, fieldsById);
  const shortDecisions = initialDecisions.filter((decision) => {
    const minimum = decision.lengthGuidance?.min;
    return (
      decision.action !== "skip" &&
      minimum &&
      decision.value.length < Math.max(20, minimum * 0.8)
    );
  });

  if (!shortDecisions.length) return initialDecisions;

  const correctedContent = await requestCompletion({
    endpoint,
    config,
    signal,
    messages: [
      {
        role: "system",
        content: [
          "You are correcting generated prose that is materially shorter than its own planned length.",
          "Keep the same field meaning and action. Rewrite each value to be close to lengthGuidance.target and never exceed lengthGuidance.max.",
          "Add useful structure and substance, not repetition or filler.",
          'Return JSON only as {"decisions":[...]} using the same decision schema.'
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify({
          page: userPayload.page,
          taskInstruction: userPayload.taskInstruction,
          fields: formPayload.filter((field) =>
            shortDecisions.some((decision) => decision.fieldId === field.id)
          ),
          shortDecisions
        })
      }
    ]
  });
  const correctedDecisions = parseSuggestions(correctedContent, fieldsById);
  const correctedById = new Map(
    correctedDecisions.map((decision) => [decision.fieldId, decision])
  );

  return initialDecisions.map((decision) => {
    const corrected = correctedById.get(decision.fieldId);
    return corrected && corrected.value.length > decision.value.length
      ? corrected
      : decision;
  });
}
