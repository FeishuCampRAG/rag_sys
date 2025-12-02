import { create } from 'zustand';
import { ChatReference, ChatState, Message } from '../types';
import { api } from '../services/api';

const createMessageId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
};

const upsertAssistantMessage = (
  set: (fn: (state: ChatState) => Partial<ChatState>) => void,
  id: string,
  content: string,
  streaming: boolean,
  references: ChatReference[]
) => {
  set(state => {
    const nextMessages = [...state.messages];
    const existingIndex = nextMessages.findIndex(msg => msg.id === id);
    const created_at = existingIndex >= 0
      ? nextMessages[existingIndex].created_at
      : new Date().toISOString();

    const updated: Message = {
      ...(existingIndex >= 0 ? nextMessages[existingIndex] : {}),
      id,
      role: 'assistant',
      content,
      created_at,
      streaming,
      references
    };

    if (existingIndex >= 0) {
      nextMessages[existingIndex] = updated;
    } else {
      nextMessages.push(updated);
    }

    return { messages: nextMessages };
  });
};

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,

  loadHistory: async () => {
    const result = await api.getChatHistory();
    if (result.success && result.data) {
      const history = result.data.map((msg: any, index: number) => ({
        ...msg,
        id: String(msg.id ?? index),
      }));
      set({ messages: history });
    }
  },

  sendMessage: async (content: string, onRagEvent?: (event: string, data: any) => void) => {
    set({ isLoading: true });

    const userMessage: Message = {
      id: createMessageId(),
      role: 'user',
      content,
      created_at: new Date().toISOString()
    };
    set(state => ({ messages: [...state.messages, userMessage] }));

    const assistantId = createMessageId();
    let streamedText = '';
    let references: ChatReference[] = [];

    try {
      await api.sendMessage(content, (event, data) => {
        if (event === 'step' && data?.step === 'retrieval' && data.status === 'done') {
          references = (data.chunks || []).map((chunk: any, index: number) => ({
            id: chunk.id || `${assistantId}-ref-${index}`,
            document_name: chunk.document_name || '未命名文档',
            similarity: chunk.similarity,
            content: chunk.content,
            index: index + 1
          }));
        }

        if (event === 'step' && data?.step === 'generating') {
          upsertAssistantMessage(set, assistantId, streamedText, true, references);
        }

        if (event === 'token') {
          streamedText += data.token;
          upsertAssistantMessage(set, assistantId, streamedText, true, references);
        }

        if (event === 'done') {
          const finalContent = data.fullResponse || streamedText;
          upsertAssistantMessage(set, assistantId, finalContent, false, references);
        }

        if (event === 'error') {
          upsertAssistantMessage(
            set,
            assistantId,
            data.error || data.message || '生成失败，请稍后重试。',
            false,
            references
          );
        }

        if (event === 'step' || event === 'token' || event === 'done' || event === 'error') {
          onRagEvent?.(event, data);
        }
      });
    } catch (error) {
      console.error('Send message error:', error);
      upsertAssistantMessage(set, assistantId, '服务异常，请稍后重试。', false, references);
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
