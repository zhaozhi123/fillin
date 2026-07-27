import { useCallback, useEffect, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { useAgentSession } from "../hooks/useAgentSession";
import { usePageContext } from "../hooks/usePageContext";
import {
  DEFAULT_AI_CONFIG,
  loadAIConfig,
  saveAIConfig
} from "../lib/storage";
import type { AIConfig } from "../shared/types";
import { getUiLocale, UI_COPY } from "./i18n";
import { AgentPanel } from "./components/AgentPanel";
import { AppHeader } from "./components/AppHeader";
import { ErrorNotice } from "./components/ErrorNotice";
import { FieldList } from "./components/FieldList";
import { PageCard } from "./components/PageCard";
import { SettingsPanel } from "./components/SettingsPanel";
import { SetupNotice } from "./components/SetupNotice";

export default function App() {
  const locale = getUiLocale();
  const copy = UI_COPY[locale].app;
  const [config, setConfig] = useState<AIConfig>(DEFAULT_AI_CONFIG);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const { page, pageError, refreshPage } = usePageContext();

  useEffect(() => {
    loadAIConfig()
      .then(setConfig)
      .finally(() => setConfigLoaded(true));
  }, []);

  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const agent = useAgentSession({
    page,
    config,
    instruction
  });

  const handleSaveSettings = async (nextConfig: AIConfig) => {
    await saveAIConfig(nextConfig);
    setConfig(nextConfig);
  };

  const hasConfiguration = Boolean(
    configLoaded &&
      config.apiKey.trim() &&
      config.baseUrl.trim() &&
      config.model.trim() &&
      config.dataSharingConsent
  );

  return (
    <div className="app-shell">
      <AppHeader locale={locale} onOpenSettings={openSettings} />

      <main className="app-main">
        <PageCard
          page={page}
          locale={locale}
          fieldCount={agent.detectedCount}
          phase={agent.phase}
          onRefresh={() => {
            void refreshPage();
            void agent.actions.refreshFields();
          }}
        />

        {!hasConfiguration && configLoaded && (
          <SetupNotice locale={locale} onSetup={openSettings} />
        )}

        {(pageError || agent.error) && (
          <ErrorNotice
            message={pageError || agent.error || copy.unknownError}
            locale={locale}
            onRetry={
              pageError
                ? () => void refreshPage()
                : () => void agent.actions.retry()
            }
          />
        )}

        <AgentPanel
          phase={agent.phase}
          detectedCount={agent.detectedCount}
          filledCount={agent.filledCount}
          updatedCount={agent.updatedCount}
          readyCount={agent.readyCount}
          failedCount={agent.failedCount}
          locale={locale}
          instruction={instruction}
          canUndo={agent.canUndo}
          onInstructionChange={setInstruction}
          onStart={() => void agent.actions.start()}
          onStop={agent.actions.stop}
          onUndo={() => void agent.actions.undo()}
        />

        <FieldList fields={agent.fields} phase={agent.phase} locale={locale} />
      </main>

      <footer className="app-footer">
        <LockKeyhole size={12} />
        <span>{copy.footer}</span>
      </footer>

      <SettingsPanel
        open={settingsOpen}
        locale={locale}
        config={config}
        onClose={() => setSettingsOpen(false)}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
