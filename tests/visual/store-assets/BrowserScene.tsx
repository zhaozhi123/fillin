import { CircleDot } from "lucide-react";
import { VIEW_URLS } from "./content";
import { FillinPanel } from "./FillinPanel";
import { SitePreview } from "./SitePreviews";
import type { ProductView, StoreLocale } from "./types";

export function BrowserScene({
  view,
  locale,
  compact = false
}: {
  view: ProductView;
  locale: StoreLocale;
  compact?: boolean;
}) {
  return (
    <div className={`browser-scene ${compact ? "compact" : ""}`}>
      <div className="browser-chrome">
        <span className="traffic red" />
        <span className="traffic yellow" />
        <span className="traffic green" />
        <div className="address-bar">{VIEW_URLS[view]}</div>
        <CircleDot size={13} />
      </div>
      <div className="browser-content">
        {!compact && <SitePreview view={view} locale={locale} />}
        <FillinPanel view={view} locale={locale} />
      </div>
    </div>
  );
}
