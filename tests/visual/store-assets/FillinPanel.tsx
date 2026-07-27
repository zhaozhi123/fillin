import {
  ArrowRight,
  Check,
  ChevronDown,
  KeyRound,
  LockKeyhole,
  Settings,
  Sparkles
} from "lucide-react";
import { StoreBrandMark } from "./Brand";
import { PROMO_COPY } from "./content";
import { PANEL_COPY, type PanelViewData } from "./panelContent";
import type { ProductView, StoreLocale } from "./types";

function PanelHeader({ locale }: { locale: StoreLocale }) {
  return (
    <header className="fillin-panel-header">
      <div className="fillin-panel-brand">
        <StoreBrandMark size={31} />
        <div>
          <strong>Fillin</strong>
          <span>{PANEL_COPY[locale].tagline}</span>
        </div>
      </div>
      <Settings size={17} />
    </header>
  );
}

function PageCard({ host, found }: { host: string; found: string }) {
  return (
    <div className="fillin-page-card">
      <div className="fillin-page-icon">F</div>
      <div>
        <strong>{host}</strong>
        <span>{found}</span>
      </div>
      <div className="refresh-mark">↻</div>
    </div>
  );
}

function ResultCard({
  result,
  description,
  recheck
}: {
  result: string;
  description: string;
  recheck: string;
}) {
  return (
    <div className="fillin-result-card">
      <div className="fillin-result-check">
        <Check size={18} strokeWidth={2.6} />
      </div>
      <div>
        <strong>{result}</strong>
        <p>{description}</p>
        <button type="button">{recheck}</button>
      </div>
    </div>
  );
}

function FieldRows({
  data,
  locale
}: {
  data: PanelViewData;
  locale: StoreLocale;
}) {
  const copy = PANEL_COPY[locale];
  return (
    <div className="fillin-field-list">
      <div className="fillin-field-summary">
        <strong>{copy.details}</strong>
        <span>
          {data.fields.length} {copy.itemSuffix} <ChevronDown size={13} />
        </span>
      </div>
      {data.fields.map((field) => (
        <div className="fillin-field-row" key={field.label}>
          <div>
            <strong>{field.label}</strong>
            <span className="field-meaning">{field.meaning}</span>
            {field.value && <span className="field-value">{field.value}</span>}
          </div>
          <span className={field.status === "done" ? "done" : "skip"}>
            {field.status === "done" && <Check size={12} />}
            {field.status === "done" ? copy.complete : copy.skipped}
          </span>
        </div>
      ))}
    </div>
  );
}

function SettingsPanel({ locale }: { locale: StoreLocale }) {
  const copy = PANEL_COPY[locale].settings;
  return (
    <div className="fillin-settings-panel">
      <PanelHeader locale={locale} />
      <div className="settings-panel-title">
        <div>
          <span>{copy.service}</span>
          <h3>{copy.title}</h3>
        </div>
        <div className="settings-close">×</div>
      </div>
      <div className="settings-tabs">
        <span className="active">
          <KeyRound size={14} /> {copy.service}
        </span>
        <span>{copy.profile}</span>
      </div>
      <div className="settings-panel-body">
        <span className="settings-eyebrow">OPENAI-COMPATIBLE API</span>
        <h4>{copy.heading}</h4>
        <p>{copy.description}</p>
        <label>
          {copy.apiUrl}
          <div>https://api.example.com/v1</div>
        </label>
        <label>
          {copy.model}
          <div>gpt-4.1-mini</div>
        </label>
        <label>
          {copy.apiKey}
          <div>sk-••••••••••••</div>
        </label>
        <div className="settings-local-note">
          <LockKeyhole size={17} />
          <span>{copy.localNote}</span>
        </div>
        <button className="settings-save" type="button">
          {copy.save}
        </button>
      </div>
    </div>
  );
}

export function FillinPanel({
  view,
  locale
}: {
  view: ProductView;
  locale: StoreLocale;
}) {
  if (view === "settings") return <SettingsPanel locale={locale} />;
  const copy = PANEL_COPY[locale];
  const data = copy.views[view];

  return (
    <aside className="fillin-panel">
      <PanelHeader locale={locale} />
      <div className="fillin-panel-body">
        <PageCard host={data.host} found={data.found} />
        <ResultCard
          result={data.result}
          description={data.description}
          recheck={copy.recheck}
        />
        <FieldRows data={data} locale={locale} />
      </div>
      <footer className="fillin-panel-footer">
        <LockKeyhole size={12} />
        {copy.footer}
      </footer>
    </aside>
  );
}

export function CompactAgentCard({ locale }: { locale: StoreLocale }) {
  const steps = PROMO_COPY[locale].agentSteps;
  return (
    <div className="compact-agent-card">
      <div className="compact-agent-icon">
        <Sparkles size={16} />
      </div>
      <span>{steps[0]}</span>
      <ArrowRight size={13} />
      <span>{steps[1]}</span>
      <ArrowRight size={13} />
      <span>{steps[2]}</span>
    </div>
  );
}
