import { create } from 'zustand';
import { api } from '../services/api';
import type { ConversationState, Conversation, Message } from '../types';

const fallbackConversation = (): Conversation => {
  const now = new Date().toISOString();
  return {
    id: `conv-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    title: '对话',
    summary: '新的对话',
    created_at: now,
    updated_at: now,
    messages: undefined,
    message_count: 0
  };
};

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: [],
  activeId: null,
  initialized: false,
  initializing: false,

  init: async () => {
    if (get().initialized || get().initializing) return;
    set({ initializing: true });
    try {
      await get().fetchConversations();
      set({ initialized: true });
    } finally {
      set({ initializing: false });
    }
  },

  fetchConversations: async () => {
    const existingMessages = new Map<string, Message[] | undefined>(
      get().conversations.map(conv => [conv.id, conv.messages])
    );
    const existingCounts = new Map<string, number | undefined>(
      get().conversations.map(conv => [conv.id, conv.message_count])
    );
    const result = await api.getConversations();
    if (result.success && result.data) {
      const conversations = result.data.map(conv => {
        const cachedMessages = existingMessages.get(conv.id);
        const derivedCount = cachedMessages && cachedMessages.length > 0
          ? cachedMessages.length
          : (typeof conv.message_count === 'number' ? conv.message_count : existingCounts.get(conv.id));
        return {
          ...conv,
          messages: cachedMessages && cachedMessages.length > 0 ? cachedMessages : undefined,
          message_count: derivedCount ?? 0
        };
      });

      set(state => {
        const activeExists = state.activeId && conversations.some(conv => conv.id === state.activeId);
        return {
          conversations,
          activeId: activeExists ? state.activeId : conversations[0]?.id ?? null
        };
      });
      return conversations;
    }
    return [];
  },

  ensureActiveConversation: async () => {
    if (get().conversations.length === 0) {
      await get().fetchConversations();
    }
    const current = get();
    return current.activeId ?? null;
  },

  createConversation: async () => {
    const result = await api.createConversation();
    if (result.success && result.data) {
      const conv = { ...result.data, messages: undefined, message_count: 0 };
      set(state => ({ conversations: [conv, ...state.conversations], activeId: conv.id }));
      return conv.id;
    }
    const conv = fallbackConversation();
    set(state => ({ conversations: [conv, ...state.conversations], activeId: conv.id }));
    return conv.id;
  },

  selectConversation: (id: string) => {
    set(state => {
      const exists = state.conversations.some(c => c.id === id);
      return exists ? { ...state, activeId: id } : state;
    });
  },

  getConversationMessages: async (id: string) => {
    const state = get();
    const target = state.conversations.find(conv => conv.id === id);
    if (!target) return [];

    if (target.messages !== undefined) {
      return target.messages;
    }

    const result = await api.getChatHistory(id);
    if (result.success && result.data) {
      const messages = result.data;
      set(s => ({
        conversations: s.conversations.map(conv => {
          if (conv.id !== id) return conv;
          return {
            ...conv,
            messages,
            updated_at: messages.length ? messages[messages.length - 1].created_at : conv.updated_at,
            message_count: messages.length
          };
        })
      }));
      return messages;
    }

    return [];
  },

  updateMessages: (id: string, messages: Message[]) => {
    set(state => ({
      conversations: state.conversations.map(conv =>
        conv.id === id
          ? {
              ...conv,
              messages,
              updated_at: messages.length ? messages[messages.length - 1].created_at : new Date().toISOString(),
              message_count: messages.length
            }
          : conv
      )
    }));
  },

  updateSummary: (id: string, summary: string) => {
    set(state => ({
      conversations: state.conversations.map(conv =>
        conv.id === id
          ? {
              ...conv,
              summary,
              updated_at: conv.updated_at || new Date().toISOString()
            }
          : conv
      )
    }));
  },

  deleteConversation: async (id: string) => {
    await api.deleteConversation(id);
    set(state => {
      const remaining = state.conversations.filter(conv => conv.id !== id);
      const activeId = state.activeId === id ? (remaining[0]?.id ?? null) : state.activeId;
      return { conversations: remaining, activeId };
    });
  }
}));
