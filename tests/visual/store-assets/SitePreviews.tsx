import { Check, ChevronDown, Send } from "lucide-react";
import { SITE_COPY } from "./siteContent";
import type { ProductView, StoreLocale } from "./types";

function FormField({
  label,
  value,
  wide = false
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "fixture-field wide" : "fixture-field"}>
      <span>{label}</span>
      <div className="fixture-input">
        {value}
        <Check size={13} />
      </div>
    </label>
  );
}

function FormPreview({ locale }: { locale: StoreLocale }) {
  const copy = SITE_COPY[locale].form;
  return (
    <div className="site-page form-site">
      <header className="site-nav">
        <div className="site-wordmark">{copy.brand}</div>
        <div className="site-nav-links">
          {copy.nav.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </header>
      <main className="form-page">
        <div className="form-intro">
          <span className="site-kicker">{copy.kicker}</span>
          <h2>{copy.title}</h2>
          <p>{copy.description}</p>
        </div>
        <div className="fixture-form">
          {copy.fields.map(([label, value]) => (
            <FormField key={label} label={label} value={value} />
          ))}
          <FormField
            wide
            label={copy.challengeLabel}
            value={copy.challenge}
          />
          <button type="button">{copy.submit}</button>
        </div>
      </main>
    </div>
  );
}

function CommentPreview({ locale }: { locale: StoreLocale }) {
  const copy = SITE_COPY[locale].comment;
  return (
    <div className="site-page article-site">
      <header className="article-nav">
        <div className="article-logo">{copy.brand}</div>
        <div className="article-search">{copy.search}</div>
        <div className="avatar-dot" />
      </header>
      <main className="article-page">
        <div className="article-meta">{copy.meta}</div>
        <h2>{copy.title}</h2>
        {copy.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <div className="article-divider" />
        <div className="comment-count">{copy.count}</div>
        <div className="comment-editor">
          <p>{copy.comment}</p>
          <div className="comment-tools">
            <span>{copy.guideline}</span>
            <button type="button">
              <Send size={13} />
              {copy.send}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function ArticlePreview({ locale }: { locale: StoreLocale }) {
  const copy = SITE_COPY[locale].article;
  return (
    <div className="site-page editor-site">
      <header className="editor-nav">
        <strong>{copy.brand}</strong>
        <span>{copy.section}</span>
        <div className="editor-actions">{copy.saved}</div>
      </header>
      <div className="editor-toolbar">
        {copy.toolbar.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      <main className="editor-page">
        <h2>{copy.title}</h2>
        <div className="editor-rule" />
        <p>{copy.paragraphs[0]}</p>
        <h3>{copy.headings[0]}</h3>
        <p>{copy.paragraphs[1]}</p>
        <h3>{copy.headings[1]}</h3>
        <p>{copy.paragraphs[2]}</p>
      </main>
      <footer className="editor-footer">
        <span>{copy.count}</span>
        <span>{copy.mode}</span>
        <button type="button">{copy.publish}</button>
      </footer>
    </div>
  );
}

function SettingsPreview({ locale }: { locale: StoreLocale }) {
  const copy = SITE_COPY[locale].settings;
  return (
    <div className="site-page settings-site">
      <header className="settings-site-header">
        <div>
          <span className="site-kicker">{copy.kicker}</span>
          <h2>{copy.title}</h2>
        </div>
        <div className="settings-status">
          <Check size={14} />
          {copy.saved}
        </div>
      </header>
      <main className="settings-form">
        <label>
          <span>{copy.apiUrl}</span>
          <div>https://api.example.com/v1</div>
        </label>
        <label>
          <span>{copy.model}</span>
          <div className="with-chevron">
            gpt-4.1-mini <ChevronDown size={15} />
          </div>
        </label>
        <label>
          <span>{copy.apiKey}</span>
          <div>sk-••••••••••••••••</div>
        </label>
        <div className="privacy-note">
          <div className="privacy-icon">
            <Check size={16} />
          </div>
          <div>
            <strong>{copy.privacyTitle}</strong>
            <p>{copy.privacyDescription}</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export function SitePreview({
  view,
  locale
}: {
  view: ProductView;
  locale: StoreLocale;
}) {
  if (view === "comment") return <CommentPreview locale={locale} />;
  if (view === "article") return <ArticlePreview locale={locale} />;
  if (view === "settings") return <SettingsPreview locale={locale} />;
  return <FormPreview locale={locale} />;
}
