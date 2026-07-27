import {
  ArrowRight,
  Check,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  Square
} from "lucide-react";
import type { RunPhase } from "../../shared/types";
import { UI_COPY, type UiLocale } from "../i18n";
import { TaskInput } from "./TaskInput";

type AgentPanelProps = {
  phase: RunPhase;
  detectedCount: number;
  filledCount: number;
  updatedCount: number;
  readyCount: number;
  failedCount: number;
  locale: UiLocale;
  instruction: string;
  canUndo: boolean;
  onInstructionChange: (value: string) => void;
  onStart: () => void;
  onStop: () => void;
  onUndo: () => void;
};

const stageIndex: Record<RunPhase, number> = {
  idle: -1,
  scanning: 0,
  thinking: 1,
  filling: 2,
  verifying: 3,
  complete: 4,
  error: -1
};

export function AgentPanel({
  phase,
  detectedCount,
  filledCount,
  updatedCount,
  readyCount,
  failedCount,
  locale,
  instruction,
  canUndo,
  onInstructionChange,
  onStart,
  onStop,
  onUndo
}: AgentPanelProps) {
  const copy = UI_COPY[locale].agent;
  const running = ["scanning", "thinking", "filling", "verifying"].includes(
    phase
  );

  if (phase === "complete") {
    const resultTitle =
      failedCount > 0
        ? copy.filledWithFailures(filledCount, failedCount)
        : updatedCount === filledCount && updatedCount > 0
          ? copy.updated(updatedCount)
          : updatedCount > 0
            ? copy.handled(filledCount)
            : filledCount
              ? copy.filled(filledCount)
              : copy.alreadyComplete;
    return (
      <section className="result-panel" aria-live="polite">
        <div className="result-check">
          <Check size={19} strokeWidth={2.4} />
        </div>
        <div className="result-copy">
          <h1>{resultTitle}</h1>
          <p>
            {failedCount
              ? copy.failureDescription
              : filledCount
                ? copy.completedDescription
                : copy.preservedDescription}
          </p>
          <div className="result-actions">
            <button className="secondary-button compact" type="button" onClick={onStart}>
              {copy.checkAgain}
            </button>
            {canUndo && (
              <button className="ghost-button compact" type="button" onClick={onUndo}>
                <RotateCcw size={14} />
                {copy.undo}
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`agent-panel ${running ? "is-running" : ""}`}>
      <div className="agent-heading">
        <div>
          <span className="eyebrow">AI AGENT</span>
          <h1>{running ? copy.runningTitle : copy.idleTitle}</h1>
          <p>
            {running
              ? phase === "scanning"
                ? copy.scanning
                : phase === "thinking"
                  ? copy.thinking
                  : phase === "verifying"
                    ? copy.verifying
                    : copy.writing(readyCount)
              : detectedCount
                ? copy.ready
                : copy.noFields}
          </p>
        </div>
        <div className="agent-symbol">
          {running ? (
            <LoaderCircle className="spin" size={19} />
          ) : (
            <Sparkles size={18} />
          )}
        </div>
      </div>

      {running && (
        <ol className="agent-stages">
          {copy.stages.map((label, index) => {
            const current = stageIndex[phase];
            const complete = index < current;
            const active = index === current;
            return (
              <li
                key={label}
                className={complete ? "complete" : active ? "active" : ""}
              >
                <span className="stage-dot">
                  {complete ? (
                    <Check size={11} strokeWidth={2.7} />
                  ) : active ? (
                    <span className="pulse-dot" />
                  ) : null}
                </span>
                <span>{label}</span>
              </li>
            );
          })}
        </ol>
      )}

      {running ? (
        <button className="stop-button" type="button" onClick={onStop}>
          <Square size={12} fill="currentColor" />
          {copy.stop}
        </button>
      ) : (
        <>
          {detectedCount > 0 && (
            <TaskInput
              value={instruction}
              locale={locale}
              onChange={onInstructionChange}
            />
          )}
          <button
            className="primary-button"
            type="button"
            onClick={onStart}
            disabled={!detectedCount}
          >
            <span>{copy.start}</span>
            <ArrowRight size={16} />
          </button>
        </>
      )}
    </section>
  );
}
