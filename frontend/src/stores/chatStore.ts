import { create } from 'zustand';
import type { ChatReference, ChatState, Message } from '../types';
import { useConversationStore } from './conversationStore';
import { api } from '../services/api';
import { parseError, logError, createUserMessage } from '../utils/errorHandler';

const createMessageId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
};

const summarize = (text: string): string => {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return '新的对话';
  return clean.length > 42 ? `${clean.slice(0, 42)}...` : clean;
};

const upsertAssistantMessage = (
  set: (fn: (state: ChatState) => Partial<ChatState>) => void,
  id: string,
  content: string,
  streaming: boolean,
  references: ChatReference[],
  sync: (messages: Message[]) => void
) => {
  let nextMessages: Message[] = [];
  set(state => {
    nextMessages = [...state.messages];
    const existingIndex = nextMessages.findIndex(msg => msg.id === id);
    const createdAt = existingIndex >= 0
      ? nextMessages[existingIndex].created_at
      : new Date().toISOString();

    const updated: Message = {
      ...(existingIndex >= 0 ? nextMessages[existingIndex] : {}),
      id,
      role: 'assistant',
      content,
      created_at: createdAt,
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

  sync(nextMessages);
};

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,

  loadHistory: async () => {
    const convStore = useConversationStore.getState();
    const convId = await convStore.ensureActiveConversation();
    if (!convId) {
      set({ messages: [] });
      return;
    }
    const history = await convStore.getConversationMessages(convId);
    set({ messages: history || [] });
  },

  sendMessage: async (content: string, onRagEvent?: (event: string, data: any) => void) => {
    const convStore = useConversationStore.getState();
    const conversationId = await convStore.ensureActiveConversation();
    if (!conversationId) {
      return;
    }
    const syncConversation = (messages: Message[]) => convStore.updateMessages(conversationId, messages);
    set({ isLoading: true });

    const conversation = convStore.conversations.find(c => c.id === conversationId);
    if (!conversation || !conversation.summary || conversation.summary === '新的对话') {
      convStore.updateSummary(conversationId, summarize(content));
    }

    const userMessage: Message = {
      id: createMessageId(),
      role: 'user',
      content,
      created_at: new Date().toISOString()
    };
    const nextMessages = [...get().messages, userMessage];
    set({ messages: nextMessages });
    syncConversation(nextMessages);

    const assistantId = createMessageId();
    let streamedText = '';
    let references: ChatReference[] = [];

    try {
      await api.sendMessage(content, conversationId, (event, data) => {
        if (event === 'step' && data?.step === 'retrieval' && data.status === 'done') {
          references = (data.chunks || []).map((chunk: any, index: number) => ({
            id: chunk.id || `${assistantId}-ref-${index + 1}`,
            document_name: chunk.document_name || '未命名文档',
            similarity: typeof chunk.similarity === 'number' ? chunk.similarity : undefined,
            content: chunk.content,
            index: index + 1
          }));
        }

        if (event === 'step' && data?.step === 'generating') {
          upsertAssistantMessage(set, assistantId, streamedText, true, references, syncConversation);
        }

        if (event === 'token' && typeof data?.token === 'string') {
          streamedText += data.token;
          upsertAssistantMessage(set, assistantId, streamedText, true, references, syncConversation);
        }

        if (event === 'done') {
          const finalContent = typeof data?.fullResponse === 'string' && data.fullResponse.length > 0
            ? data.fullResponse
            : streamedText;
          upsertAssistantMessage(set, assistantId, finalContent, false, references, syncConversation);
        }

        if (event === 'error') {
          upsertAssistantMessage(
            set,
            assistantId,
            data?.error || data?.message || '生成失败，请稍后重试。',
            false,
            references,
            syncConversation
          );
        }

        if (event === 'step' || event === 'token' || event === 'done' || event === 'error') {
          onRagEvent?.(event, data);
        }
      });
    } catch (error) {
      const errorInfo = parseError(error);
      logError('sendMessage', errorInfo);
      const userFriendly = createUserMessage(errorInfo);

      upsertAssistantMessage(
        set,
        assistantId,
        userFriendly,
        false,
        references,
        syncConversation
      );

      set(state => {
        const messages = [...state.messages];
        const idx = messages.findIndex(msg => msg.id === assistantId);
        if (idx >= 0) {
          messages[idx] = { ...messages[idx], error: true };
        }
        return { messages };
      });
    } finally {
      set({ isLoading: false });
    }
  },

  clearHistory: async () => {
    try {
      const convStore = useConversationStore.getState();
      const convId = await convStore.ensureActiveConversation();
      if (!convId) return false;
      const result = await api.clearChatHistory(convId);
      if (result.success) {
        set({ messages: [] });
        convStore.updateMessages(convId, []);
        return true;
      }
      return false;
    } catch (error) {
      logError('clearHistory', parseError(error));
      return false;
    }
  }
}));
