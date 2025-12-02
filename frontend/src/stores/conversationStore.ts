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
    messages: []
  };
};

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: [],
  activeId: null,

  init: async () => {
    const list = await get().fetchConversations();
    if (list.length === 0) {
      const id = await get().createConversation();
      set({ activeId: id });
      return;
    }
    set(state => ({ ...state, activeId: state.activeId || list[0]?.id || null }));
  },

  fetchConversations: async () => {
    const existingMessages = new Map<string, Message[] | undefined>(
      get().conversations.map(conv => [conv.id, conv.messages])
    );
    const result = await api.getConversations();
    if (result.success && result.data) {
      const conversations = result.data.map(conv => ({
        ...conv,
        messages: existingMessages.get(conv.id)
      }));

      set(state => {
        const activeExists = state.activeId && conversations.some(conv => conv.id === state.activeId);
        return {
          conversations,
          activeId: activeExists ? state.activeId : conversations[0]?.id || null
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
    if (current.activeId) return current.activeId;
    if (current.conversations.length > 0) {
      const id = current.conversations[0].id;
      set({ activeId: id });
      return id;
    }
    return get().createConversation();
  },

  createConversation: async () => {
    const result = await api.createConversation();
    if (result.success && result.data) {
      const conv = { ...result.data, messages: [] };
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
        conversations: s.conversations.map(conv => conv.id === id ? { ...conv, messages } : conv)
      }));
      return messages;
    }

    return [];
  },

  updateMessages: (id: string, messages: Message[]) => {
    set(state => ({
      conversations: state.conversations.map(conv =>
        conv.id === id ? { ...conv, messages, updated_at: new Date().toISOString() } : conv
      )
    }));
  },

  updateSummary: (id: string, summary: string) => {
    set(state => ({
      conversations: state.conversations.map(conv =>
        conv.id === id ? { ...conv, summary, updated_at: new Date().toISOString() } : conv
      )
    }));
  },

  deleteConversation: async (id: string) => {
    await api.deleteConversation(id);
    set(state => {
      const remaining = state.conversations.filter(conv => conv.id !== id);
      const activeId = state.activeId === id ? (remaining[0]?.id || null) : state.activeId;
      return { conversations: remaining, activeId };
    });

    const updated = get();
    if (!updated.activeId) {
      const newId = await get().createConversation();
      set({ activeId: newId });
    }
  }
}));
