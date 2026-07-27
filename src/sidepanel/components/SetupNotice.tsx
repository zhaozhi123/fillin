import { ArrowRight, KeyRound } from "lucide-react";
import { UI_COPY, type UiLocale } from "../i18n";

export function SetupNotice({
  locale,
  onSetup
}: {
  locale: UiLocale;
  onSetup: () => void;
}) {
  const copy = UI_COPY[locale].setup;
  return (
    <section className="setup-notice">
      <div className="setup-icon">
        <KeyRound size={17} />
      </div>
      <div className="setup-content">
        <h2>{copy.title}</h2>
        <p>{copy.description}</p>
        <button className="text-action" type="button" onClick={onSetup}>
          {copy.action}
          <ArrowRight size={14} />
        </button>
      </div>
    </section>
  );
}
