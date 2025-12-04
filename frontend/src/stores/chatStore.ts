import { create } from 'zustand';
import { ChatReference, ChatState, Message } from '../types';
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

  sync(nextMessages);
};

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,

  loadHistory: async () => {
    const convStore = useConversationStore.getState();
    const convId = await convStore.ensureActiveConversation();
    const history = await convStore.getConversationMessages(convId);
    set({ messages: history || [] });
  },

  sendMessage: async (content: string, onRagEvent?: (event: string, data: any) => void) => {
    const convStore = useConversationStore.getState();
    const conversationId = await convStore.ensureActiveConversation();
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
            id: chunk.id || `${assistantId}-ref-${index}`,
            document_name: chunk.document_name || '未命名文档',
            similarity: chunk.similarity,
            content: chunk.content,
            index: index + 1
          }));
        }

        if (event === 'step' && data?.step === 'generating') {
          upsertAssistantMessage(set, assistantId, streamedText, true, references, syncConversation);
        }

        if (event === 'token') {
          streamedText += data.token;
          upsertAssistantMessage(set, assistantId, streamedText, true, references, syncConversation);
        }

        if (event === 'done') {
          const finalContent = data.fullResponse || streamedText;
          upsertAssistantMessage(set, assistantId, finalContent, false, references, syncConversation);
        }

        if (event === 'error') {
          upsertAssistantMessage(
            set,
            assistantId,
            data.error || data.message || '生成失败，请稍后重试。',
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
      // Parse and categorize the error
      const errorInfo = parseError(error);
      
      // Log detailed error information for debugging
      logError('sendMessage', errorInfo);
      
      // Create user-friendly error message
      const userMessage = createUserMessage(errorInfo);
      
      // Create error message with proper error state
      upsertAssistantMessage(
        set,
        assistantId,
        userMessage,
        false,
        references,
        syncConversation
      );
      
      // Mark the message as having an error for UI styling
      set(state => {
        const messages = [...state.messages];
        const errorIndex = messages.findIndex(msg => msg.id === assistantId);
        if (errorIndex >= 0) {
          messages[errorIndex] = {
            ...messages[errorIndex],
            error: true
          };
        }
        return { messages };
      });
    } finally {
      // Ensure loading state is always reset
      set({ isLoading: false });
    }
  },

  clearHistory: async () => {
    const convStore = useConversationStore.getState();
    const convId = await convStore.ensureActiveConversation();
    const result = await api.clearChatHistory(convId);
    if (result.success) {
      set({ messages: [] });
      convStore.updateMessages(convId, []);
    }
  }
}));
