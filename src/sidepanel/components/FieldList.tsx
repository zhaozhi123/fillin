import {
  AlertCircle,
  Check,
  ChevronDown,
  Circle,
  LoaderCircle
} from "lucide-react";
import type { AgentField, RunPhase } from "../../shared/types";
import { UI_COPY, type UiLocale } from "../i18n";

function FieldStatus({
  field,
  locale
}: {
  field: AgentField;
  locale: UiLocale;
}) {
  const copy = UI_COPY[locale].fields;
  const statusLabels = copy.statuses;
  const { status } = field;
  const isReplace = field.suggestionAction === "replace";
  if (status === "filled") {
    return (
      <span className="field-status success">
        <Check size={13} />
        {isReplace ? copy.updated : statusLabels[status]}
      </span>
    );
  }
  if (status === "filling") {
    return (
      <span className="field-status active">
        <LoaderCircle className="spin" size={13} />
        {isReplace ? copy.updating : statusLabels[status]}
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="field-status danger">
        <AlertCircle size={13} />
        {statusLabels[status]}
      </span>
    );
  }
  if (status === "preserved" || status === "skipped") {
    return (
      <span className="field-status muted">
        <Check size={13} />
        {statusLabels[status]}
      </span>
    );
  }
  return (
    <span className="field-status">
      <Circle size={10} />
      {status === "ready" && isReplace
        ? copy.readyToUpdate
        : statusLabels[status]}
    </span>
  );
}

function getLengthLabel(field: AgentField, locale: UiLocale) {
  const guidance = field.lengthGuidance;
  if (!guidance) return "";
  const actualLength = field.suggestedValue?.length;
  return UI_COPY[locale].fields.length(guidance.target, actualLength);
}

export function FieldList({
  fields,
  locale,
  phase
}: {
  fields: AgentField[];
  locale: UiLocale;
  phase: RunPhase;
}) {
  if (!fields.length || phase === "scanning") return null;
  const copy = UI_COPY[locale].fields;

  return (
    <details
      className="field-list"
      open={
        phase === "filling" ||
        phase === "complete"
      }
    >
      <summary>
        <span>{copy.details}</span>
        <span className="summary-meta">
          {copy.count(fields.length)}
          <ChevronDown className="summary-chevron" size={14} />
        </span>
      </summary>
      <div className="field-rows">
        {fields.map((field) => (
          <div className="field-row" key={field.id}>
            <div className="field-copy">
              <div className="field-label">
                {field.label}
                {field.required && <span className="required-mark">*</span>}
              </div>
              {(field.businessMeaning || field.lengthGuidance) && (
                <div className="field-analysis">
                  {field.businessMeaning && <span>{field.businessMeaning}</span>}
                  {field.businessMeaning && field.lengthGuidance && (
                    <span className="analysis-separator">·</span>
                  )}
                  {field.lengthGuidance && (
                    <span>{getLengthLabel(field, locale)}</span>
                  )}
                </div>
              )}
              {(field.suggestedValue || field.currentValue) && (
                <div className="field-value">
                  {field.suggestedValue || field.currentValue}
                </div>
              )}
            </div>
            <FieldStatus field={field} locale={locale} />
          </div>
        ))}
      </div>
    </details>
  );
}
