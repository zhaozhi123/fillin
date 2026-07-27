import { useCallback, useEffect, useRef, useState } from "react";
import { askAIForFormValues } from "../lib/ai";
import {
  fillPageField,
  observePage,
  restorePageFields,
  scanPage
} from "../lib/browser";
import { runFormAgent } from "../lib/formAgent";
import type {
  AgentField,
  AIConfig,
  PageContext,
  RunPhase
} from "../shared/types";

const isAbortError = (error: unknown) =>
  error instanceof DOMException && error.name === "AbortError";

export function useAgentSession({
  page,
  config,
  instruction
}: {
  page: PageContext | null;
  config: AIConfig;
  instruction: string;
}) {
  const [fields, setFields] = useState<AgentField[]>([]);
  const [phase, setPhase] = useState<RunPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const undoValuesRef = useRef<
    Array<{
      fieldId: string;
      frameId?: number;
      localId?: string;
      value: string;
    }>
  >([]);
  const pageRef = useRef(page);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  const refreshFields = useCallback(async () => {
    if (!page) return;
    setPhase("scanning");
    setError(null);
    setCanUndo(false);
    undoValuesRef.current = [];
    try {
      const scanned = await scanPage(page);
      if (pageRef.current?.tabId !== page.tabId) return;
      setFields(scanned.map((field) => ({ ...field, status: "found" })));
      setPhase("idle");
    } catch (nextError) {
      if (pageRef.current?.tabId !== page.tabId) return;
      setFields([]);
      setPhase("error");
      setError(
        nextError instanceof Error ? nextError.message : "无法读取页面表单"
      );
    }
  }, [page]);

  useEffect(() => {
    setFields([]);
    setCanUndo(false);
    undoValuesRef.current = [];
    if (page) void refreshFields();
    return () => abortRef.current?.abort();
  }, [page?.tabId, page?.url, refreshFields]);

  const start = useCallback(async () => {
    if (!page) return;

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;
    setError(null);
    setCanUndo(false);
    undoValuesRef.current = [];

    try {
      const result = await runFormAgent({
        page,
        config,
        instruction,
        signal: controller.signal,
        dependencies: {
          scan: scanPage,
          observe: observePage,
          generate: askAIForFormValues,
          fill: fillPageField
        },
        onProgress: ({ phase: nextPhase, fields: nextFields }) => {
          if (controller.signal.aborted) return;
          setPhase(nextPhase);
          setFields(nextFields);
        }
      });
      if (controller.signal.aborted) return;
      undoValuesRef.current = result.undoValues;
      setFields(result.fields);
      setCanUndo(result.undoValues.length > 0);
      setPhase(result.fields.length ? "complete" : "idle");
    } catch (nextError) {
      if (isAbortError(nextError) || controller.signal.aborted) {
        setPhase("idle");
        return;
      }
      setPhase("error");
      setError(
        nextError instanceof Error ? nextError.message : "本次填写未能完成"
      );
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, [config, instruction, page]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase("idle");
    setFields((current) =>
      current.map((field) =>
        field.status === "filling" || field.status === "ready"
          ? { ...field, status: "found" }
          : field
      )
    );
  }, []);

  const undo = useCallback(async () => {
    if (!page || !canUndo) return;
    try {
      await restorePageFields(
        page,
        undoValuesRef.current.map((value) => ({
          id: value.fieldId,
          frameId: value.frameId,
          localId: value.localId,
          value: value.value
        }))
      );
      setFields((current) =>
        current.map((field) =>
          field.status === "filled"
            ? {
                ...field,
                status: "found",
                suggestedValue: undefined,
                suggestionAction: undefined,
                businessMeaning: undefined,
                semanticType: undefined,
                lengthGuidance: undefined
              }
            : field
        )
      );
      undoValuesRef.current = [];
      setCanUndo(false);
      setPhase("idle");
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "无法撤销本次填写"
      );
      setPhase("error");
    }
  }, [canUndo, fields, page]);

  const retry = useCallback(() => {
    void start();
  }, [start]);

  const detectedCount = fields.length;
  const filledCount = fields.filter((field) => field.status === "filled").length;
  const updatedCount = fields.filter(
    (field) =>
      field.status === "filled" && field.suggestionAction === "replace"
  ).length;
  const readyCount = fields.filter(
    (field) => field.status === "ready" || field.status === "filling"
  ).length;
  const failedCount = fields.filter((field) => field.status === "error").length;
  const isRunning = ["scanning", "thinking", "filling", "verifying"].includes(
    phase
  );

  return {
    fields,
    phase,
    error,
    canUndo,
    detectedCount,
    filledCount,
    updatedCount,
    readyCount,
    failedCount,
    isRunning,
    actions: {
      start,
      stop,
      undo,
      retry,
      refreshFields
    }
  };
}
