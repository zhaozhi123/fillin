import type { AIConfig } from "../shared/types";

const CONFIG_KEY = "fillin.aiConfig";

export const DEFAULT_AI_CONFIG: AIConfig = {
  baseUrl: "https://api.openai.com/v1",
  apiKey: "",
  model: "gpt-4.1-mini",
  profile: "",
  dataSharingConsent: false
};

export async function loadAIConfig(): Promise<AIConfig> {
  const result = await chrome.storage.local.get(CONFIG_KEY);
  return {
    ...DEFAULT_AI_CONFIG,
    ...(result[CONFIG_KEY] as Partial<AIConfig> | undefined)
  };
}

export async function saveAIConfig(config: AIConfig) {
  await chrome.storage.local.set({ [CONFIG_KEY]: config });
}
