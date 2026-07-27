import { useEffect, useRef, useState } from "react";
import {
  Check,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  Upload,
  UserRound,
  X
} from "lucide-react";
import {
  downloadAIConfigBackup,
  parseAIConfigBackup
} from "../../lib/configBackup";
import { normalizeAIBaseUrl } from "../../lib/aiEndpoint";
import type { AIConfig } from "../../shared/types";
import { UI_COPY, type UiLocale } from "../i18n";

type SettingsTab = "service" | "profile";

export function SettingsPanel({
  open,
  locale,
  config,
  onClose,
  onSave
}: {
  open: boolean;
  locale: UiLocale;
  config: AIConfig;
  onClose: () => void;
  onSave: (config: AIConfig) => Promise<void>;
}) {
  const copy = UI_COPY[locale].settings;
  const [tab, setTab] = useState<SettingsTab>("service");
  const [draft, setDraft] = useState(config);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [backupMessage, setBackupMessage] = useState("");
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(config);
    setSaved(false);
    setValidationError("");
    setBackupMessage("");
  }, [config, open]);

  if (!open) return null;

  const save = async () => {
    if (!draft.baseUrl.trim() || !draft.model.trim() || !draft.apiKey.trim()) {
      setTab("service");
      setValidationError(copy.incomplete);
      return;
    }
    if (!draft.dataSharingConsent) {
      setTab("service");
      setValidationError(copy.consentRequired);
      return;
    }
    let normalizedBaseUrl: string;
    try {
      normalizedBaseUrl = normalizeAIBaseUrl(draft.baseUrl);
    } catch {
      setTab("service");
      setValidationError(copy.invalidUrl);
      return;
    }

    setSaving(true);
    setValidationError("");
    try {
      await onSave({
        ...draft,
        baseUrl: normalizedBaseUrl,
        model: draft.model.trim(),
        apiKey: draft.apiKey.trim(),
        profile: draft.profile.trim()
      });
      setSaved(true);
      window.setTimeout(onClose, 420);
    } finally {
      setSaving(false);
    }
  };

  const exportBackup = () => {
    const confirmed = window.confirm(copy.backupConfirm);
    if (!confirmed) return;

    downloadAIConfigBackup(draft);
    setBackupMessage(copy.backupSaved);
  };

  const importBackup = async (file: File | undefined) => {
    if (!file) return;

    try {
      const importedConfig = parseAIConfigBackup(await file.text());
      setDraft(importedConfig);
      setValidationError("");
      setBackupMessage(copy.backupImported);
    } catch {
      setBackupMessage("");
      setValidationError(copy.backupInvalid);
    } finally {
      if (importInputRef.current) {
        importInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="sheet-backdrop" role="presentation">
      <section
        className="settings-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`Fillin ${copy.title}`}
      >
        <header className="sheet-header">
          <div>
            <span className="eyebrow">SETTINGS</span>
            <h1>{copy.title}</h1>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label={copy.close}
          >
            <X size={18} />
          </button>
        </header>

        <nav className="settings-tabs" aria-label={copy.categories}>
          <button
            className={tab === "service" ? "active" : ""}
            type="button"
            onClick={() => setTab("service")}
          >
            <KeyRound size={15} />
            {copy.service}
          </button>
          <button
            className={tab === "profile" ? "active" : ""}
            type="button"
            onClick={() => setTab("profile")}
          >
            <UserRound size={15} />
            {copy.profile}
          </button>
        </nav>

        <div className="sheet-body">
          {tab === "service" ? (
            <div className="settings-section">
              <div className="section-intro">
                <h2>OpenAI-Compatible API</h2>
                <p>{copy.serviceDescription}</p>
              </div>

              <label className="form-field">
                <span>{copy.apiUrl}</span>
                <input
                  type="url"
                  value={draft.baseUrl}
                  placeholder="https://api.openai.com/v1"
                  spellCheck={false}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      baseUrl: event.target.value
                    }))
                  }
                />
                <small>{copy.apiHint}</small>
              </label>

              <label className="form-field">
                <span>{copy.model}</span>
                <input
                  value={draft.model}
                  placeholder="gpt-4.1-mini"
                  spellCheck={false}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      model: event.target.value
                    }))
                  }
                />
              </label>

              <label className="form-field">
                <span>{copy.apiKey}</span>
                <div className="password-input">
                  <input
                    type={showKey ? "text" : "password"}
                    value={draft.apiKey}
                    placeholder="sk-••••••••"
                    autoComplete="off"
                    spellCheck={false}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        apiKey: event.target.value
                      }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((current) => !current)}
                    aria-label={showKey ? copy.hideKey : copy.showKey}
                  >
                    {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </label>

              <div className="privacy-note">
                <ShieldCheck size={16} />
                <p>{copy.privacy}</p>
              </div>

              <label className="privacy-consent">
                <input
                  type="checkbox"
                  checked={draft.dataSharingConsent}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      dataSharingConsent: event.target.checked
                    }))
                  }
                />
                <span>{copy.consent}</span>
              </label>

              <div className="backup-card">
                <div className="backup-copy">
                  <strong>{copy.backupTitle}</strong>
                  <p>{copy.backupDescription}</p>
                </div>
                <div className="backup-actions">
                  <button
                    className="secondary-button compact"
                    type="button"
                    onClick={exportBackup}
                  >
                    <Download size={13} />
                    {copy.export}
                  </button>
                  <button
                    className="secondary-button compact"
                    type="button"
                    onClick={() => importInputRef.current?.click()}
                  >
                    <Upload size={13} />
                    {copy.import}
                  </button>
                  <input
                    ref={importInputRef}
                    className="visually-hidden"
                    type="file"
                    accept="application/json,.json"
                    onChange={(event) =>
                      void importBackup(event.target.files?.[0])
                    }
                  />
                </div>
                {backupMessage && (
                  <span className="backup-message" role="status">
                    {backupMessage}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="settings-section">
              <div className="section-intro">
                <h2>{copy.profileTitle}</h2>
                <p>{copy.profileDescription}</p>
              </div>
              <label className="form-field profile-field">
                <span>{copy.profileLabel}</span>
                <textarea
                  value={draft.profile}
                  placeholder={copy.profilePlaceholder}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      profile: event.target.value
                    }))
                  }
                />
                <small>{copy.profileHint}</small>
              </label>
            </div>
          )}
        </div>

        <footer className="sheet-footer">
          {validationError ? (
            <span className="validation-error">{validationError}</span>
          ) : (
            <span className="save-hint">{copy.saveHint}</span>
          )}
          <button
            className={`save-button ${saved ? "saved" : ""}`}
            type="button"
            onClick={() => void save()}
            disabled={saving}
          >
            {saved ? (
              <>
                <Check size={15} />
                {copy.saved}
              </>
            ) : saving ? (
              copy.saving
            ) : (
              copy.save
            )}
          </button>
        </footer>
      </section>
    </div>
  );
}
