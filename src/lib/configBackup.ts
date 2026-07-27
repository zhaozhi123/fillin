import type { AIConfig } from "../shared/types";

const BACKUP_FORMAT = "fillin.ai-config";
const BACKUP_VERSION = 1;

type AIConfigBackup = {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  config: AIConfig;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAIConfig(value: unknown): value is AIConfig {
  if (!isRecord(value)) return false;

  return (
    typeof value.baseUrl === "string" &&
    typeof value.apiKey === "string" &&
    typeof value.model === "string" &&
    typeof value.profile === "string" &&
    (value.dataSharingConsent === undefined ||
      typeof value.dataSharingConsent === "boolean")
  );
}

export function serializeAIConfigBackup(config: AIConfig): string {
  const backup: AIConfigBackup = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    config
  };

  return JSON.stringify(backup, null, 2);
}

export function parseAIConfigBackup(contents: string): AIConfig {
  let backup: unknown;

  try {
    backup = JSON.parse(contents);
  } catch {
    throw new Error("备份文件不是有效的 JSON");
  }

  if (
    !isRecord(backup) ||
    backup.format !== BACKUP_FORMAT ||
    backup.version !== BACKUP_VERSION ||
    !isAIConfig(backup.config)
  ) {
    throw new Error("这不是有效的 Fillin 配置备份");
  }

  return {
    ...backup.config,
    dataSharingConsent: Boolean(backup.config.dataSharingConsent)
  };
}

export function downloadAIConfigBackup(config: AIConfig): void {
  const contents = serializeAIConfigBackup(config);
  const blob = new Blob([contents], {
    type: "application/json;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `fillin-settings-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
