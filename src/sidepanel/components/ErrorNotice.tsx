import { AlertCircle, RotateCcw, X } from "lucide-react";
import { UI_COPY, type UiLocale } from "../i18n";

export function ErrorNotice({
  message,
  locale,
  onRetry,
  onDismiss
}: {
  message: string;
  locale: UiLocale;
  onRetry?: () => void;
  onDismiss?: () => void;
}) {
  const copy = UI_COPY[locale].error;
  return (
    <section className="error-notice" role="alert">
      <AlertCircle size={17} />
      <div>
        <strong>{copy.title}</strong>
        <p>{message}</p>
        {onRetry && (
          <button type="button" onClick={onRetry}>
            <RotateCcw size={13} />
            {copy.retry}
          </button>
        )}
      </div>
      {onDismiss && (
        <button className="error-dismiss" type="button" onClick={onDismiss}>
          <X size={14} />
        </button>
      )}
    </section>
  );
}
