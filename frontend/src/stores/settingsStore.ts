import { create } from 'zustand';
import type { SettingsState, RetrievalSettings, ModelSettings } from '../types';
import { api } from '../services/api';

export const DEFAULT_RETRIEVAL_SETTINGS: RetrievalSettings = {
  topK: 3,
  threshold: 0.5
};

export const DEFAULT_MODEL_SETTINGS: ModelSettings = {
  chatModel: 'gpt-5.1',
  embeddingModel: 'text-embedding-ada-002',
  temperature: 0.7,
  maxTokens: 2048,
  chatBaseUrl: '',
  chatApiKey: '',
  embeddingBaseUrl: '',
  embeddingApiKey: ''
};

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  retrieval: DEFAULT_RETRIEVAL_SETTINGS,
  model: DEFAULT_MODEL_SETTINGS,

  updateRetrievalSettings: (newSettings: Partial<RetrievalSettings>) => {
    set(state => ({
      retrieval: { ...state.retrieval, ...newSettings }
    }));
  },

  updateModelSettings: (newSettings: Partial<ModelSettings>) => {
    set(state => ({
      model: { ...state.model, ...newSettings }
    }));
  },

  resetSettings: () => {
    set({
      retrieval: DEFAULT_RETRIEVAL_SETTINGS,
      model: DEFAULT_MODEL_SETTINGS
    });
  },

  fetchSettings: async () => {
    const result = await api.getSettings();
    if (result.success && result.data) {
      set({
        retrieval: result.data.retrieval || DEFAULT_RETRIEVAL_SETTINGS,
        model: result.data.model || DEFAULT_MODEL_SETTINGS
      });
    }
  },

  saveSettings: async (payload) => {
    const state = get();
    const body = {
      retrieval: payload?.retrieval || state.retrieval,
      model: payload?.model || state.model
    };
    await api.saveSettings(body);
  }
}));
