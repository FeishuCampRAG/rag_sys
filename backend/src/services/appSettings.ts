import { dbHelpers } from '../db/sqlite.js';
import { config } from '../utils/config.js';
import type { RetrievalSettings, ModelSettings } from '../types/index.js';

const SETTINGS_KEY = 'app_settings';

export const DEFAULT_RETRIEVAL_SETTINGS: RetrievalSettings = {
  topK: 3,
  threshold: 0.5
};

export const DEFAULT_MODEL_SETTINGS: ModelSettings = {
  chatModel: config.chatModel,
  embeddingModel: config.embeddingModel,
  temperature: 0.7,
  maxTokens: 2048,
  chatBaseUrl: config.openaiBaseUrl,
  chatApiKey: config.openaiApiKey,
  embeddingBaseUrl: config.openaiBaseUrl,
  embeddingApiKey: config.openaiApiKey,
  baseUrl: config.openaiBaseUrl,
  apiKey: config.openaiApiKey
};

export function loadSettings(): { retrieval: RetrievalSettings; model: ModelSettings } {
  const raw = dbHelpers.getSetting(SETTINGS_KEY);
  if (!raw) {
    return {
      retrieval: DEFAULT_RETRIEVAL_SETTINGS,
      model: DEFAULT_MODEL_SETTINGS
    };
  }

  try {
    const parsed = JSON.parse(raw) as { retrieval?: Partial<RetrievalSettings>; model?: Partial<ModelSettings> };
    return {
      retrieval: { ...DEFAULT_RETRIEVAL_SETTINGS, ...(parsed.retrieval || {}) },
      model: { ...DEFAULT_MODEL_SETTINGS, ...(parsed.model || {}) }
    };
  } catch (error) {
    console.error('Failed to parse settings from DB:', error);
    return {
      retrieval: DEFAULT_RETRIEVAL_SETTINGS,
      model: DEFAULT_MODEL_SETTINGS
    };
  }
}

export function saveSettings(payload: { retrieval?: Partial<RetrievalSettings>; model?: Partial<ModelSettings> }): void {
  const merged = {
    retrieval: { ...DEFAULT_RETRIEVAL_SETTINGS, ...(payload.retrieval || {}) },
    model: { ...DEFAULT_MODEL_SETTINGS, ...(payload.model || {}) }
  };
  dbHelpers.setSetting(SETTINGS_KEY, JSON.stringify(merged));
}

export { SETTINGS_KEY };
