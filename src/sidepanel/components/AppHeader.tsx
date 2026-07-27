import { Settings } from "lucide-react";
import { UI_COPY, type UiLocale } from "../i18n";
import { BrandMark } from "./BrandMark";

export function AppHeader({
  locale,
  onOpenSettings
}: {
  locale: UiLocale;
  onOpenSettings: () => void;
}) {
  const copy = UI_COPY[locale].header;
  return (
    <header className="app-header">
      <div className="brand-lockup">
        <BrandMark />
        <div>
          <div className="brand-name">Fillin</div>
          <div className="brand-tagline">{copy.tagline}</div>
        </div>
      </div>
      <button
        className="icon-button"
        type="button"
        aria-label={copy.settings}
        title={copy.settings}
        onClick={onOpenSettings}
      >
        <Settings size={17} strokeWidth={1.8} />
      </button>
    </header>
  );
}
