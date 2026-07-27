import { CornerDownLeft } from "lucide-react";
import { UI_COPY, type UiLocale } from "../i18n";

export function TaskInput({
  value,
  locale,
  onChange
}: {
  value: string;
  locale: UiLocale;
  onChange: (value: string) => void;
}) {
  const copy = UI_COPY[locale].task;
  return (
    <label className="task-input">
      <span className="task-input-label">
        {copy.label}
        <small>{copy.optional}</small>
      </span>
      <span className="task-input-control">
        <textarea
          value={value}
          rows={2}
          placeholder={copy.placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
        <CornerDownLeft size={13} />
      </span>
      <span className="task-input-hint">
        {copy.hint}
      </span>
    </label>
  );
}
