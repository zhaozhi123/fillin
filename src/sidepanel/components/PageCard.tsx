import { FileText, RefreshCw } from "lucide-react";
import type { PageContext, RunPhase } from "../../shared/types";
import { UI_COPY, type UiLocale } from "../i18n";

export function PageCard({
  page,
  locale,
  fieldCount,
  phase,
  onRefresh
}: {
  page: PageContext | null;
  locale: UiLocale;
  fieldCount: number;
  phase: RunPhase;
  onRefresh: () => void;
}) {
  const isScanning = phase === "scanning";
  const copy = UI_COPY[locale].page;

  return (
    <section className="page-card" aria-label={copy.aria}>
      <div className="page-icon">
        {page?.faviconUrl ? (
          <img src={page.faviconUrl} alt="" />
        ) : (
          <FileText size={16} />
        )}
      </div>
      <div className="page-copy">
        <div className="page-domain">{page?.hostname || copy.loading}</div>
        <div className="page-meta">
          {isScanning
            ? copy.scanning
            : fieldCount > 0
              ? copy.found(fieldCount)
              : copy.empty}
        </div>
      </div>
      <button
        className="page-refresh"
        type="button"
        onClick={onRefresh}
        disabled={!page || isScanning}
        aria-label={copy.rescan}
        title={copy.rescan}
      >
        <RefreshCw className={isScanning ? "spin" : ""} size={15} />
      </button>
    </section>
  );
}
