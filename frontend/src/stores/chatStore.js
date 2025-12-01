import { create } from 'zustand';
import { api } from '../services/api';

export const useChatStore = create((set, get) => ({
  messages: [],
  isLoading: false,

  loadHistory: async () => {
    const result = await api.getChatHistory();
    if (result.success) {
      set({ messages: result.data });
    }
  },

  sendMessage: async (content, onRagEvent) => {
    set({ isLoading: true });

    // Add user message optimistically
    const userMessage = { role: 'user', content, created_at: new Date().toISOString() };
    set(state => ({ messages: [...state.messages, userMessage] }));

    try {
      let fullResponse = '';

      await api.sendMessage(content, (event, data) => {
        if (event === 'step' || event === 'token' || event === 'done' || event === 'error') {
          onRagEvent?.(event, data);
        }

        if (event === 'token') {
          fullResponse += data.token;
        }

        if (event === 'done') {
          const assistantMessage = {
            role: 'assistant',
            content: data.fullResponse,
            created_at: new Date().toISOString()
          };
          set(state => ({ messages: [...state.messages, assistantMessage] }));
        }
      });
    } catch (error) {
      console.error('Send message error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  clearHistory: async () => {
    const result = await api.clearChatHistory();
    if (result.success) {
      set({ messages: [] });
    }
  }
}));
