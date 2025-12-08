import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { dbHelpers } from '../db/sqlite.js';
import { getEmbedding } from '../services/embedding.js';
import { searchVectors } from '../services/vectorStore.js';
import { streamChat, buildPrompt } from '../services/llm.js';
import { config } from '../utils/config.js';
import { loadSettings } from '../services/appSettings.js';
import type {
  ApiResponse,
  ChatStepEvent,
  ChatTokenEvent,
  ChatDoneEvent,
  ChatErrorEvent,
  Conversation,
  ChatReference,
  ChatRequest,
  RetrievalSettings,
  ModelSettings
} from '../types/index.js';

const router = Router();

const summarize = (text: string): string => {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return '新的对话';
  return clean.length > 42 ? `${clean.slice(0, 42)}...` : clean;
};

const ensureConversation = (conversationId: string, firstMessage?: string): Conversation => {
  const existing = conversationId ? dbHelpers.getConversation(conversationId) : undefined;
  if (existing) return existing;

  const now = new Date().toISOString();
  const id = conversationId || randomUUID();
  const summary = summarize(firstMessage || '新的对话');
  const conversation: Conversation = {
    id,
    title: '对话',
    summary,
    created_at: now,
    updated_at: now,
    message_count: 0
  };
  dbHelpers.createConversation(conversation);
  return conversation;
};

// Send message (SSE)
router.post('/', async (req: Request, res: Response) => {
  const { message, conversationId, retrievalSettings, modelSettings } = req.body as ChatRequest;

  if (!message) {
    return res.status(400).json({ success: false, error: 'Message is required' } as ApiResponse);
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const appSettings = loadSettings();
    const conversation = ensureConversation(conversationId || '', message);
    let retrievalReferences: ChatReference[] = [];
    const embeddingModel = modelSettings?.embeddingModel || appSettings.model.embeddingModel || config.embeddingModel;
    const embeddingBaseUrl = modelSettings?.embeddingBaseUrl || modelSettings?.baseUrl || appSettings.model.embeddingBaseUrl || appSettings.model.baseUrl || config.openaiBaseUrl;
    const embeddingApiKey = modelSettings?.embeddingApiKey || modelSettings?.apiKey || appSettings.model.embeddingApiKey || appSettings.model.apiKey || config.openaiApiKey;
    const chatBaseUrl = modelSettings?.chatBaseUrl || modelSettings?.baseUrl || appSettings.model.chatBaseUrl || appSettings.model.baseUrl || config.openaiBaseUrl;
    const chatApiKey = modelSettings?.chatApiKey || modelSettings?.apiKey || appSettings.model.chatApiKey || appSettings.model.apiKey || config.openaiApiKey;

    // Save user message
    dbHelpers.insertMessage({
      id: randomUUID(),
      conversation_id: conversation.id,
      role: 'user',
      content: message,
      created_at: new Date().toISOString()
    });

    // Update summary when it's still the default
    if (!conversation.summary || conversation.summary === '新的对话') {
      dbHelpers.updateConversationSummary(conversation.id, summarize(message));
    } else {
      dbHelpers.touchConversation(conversation.id);
    }

    // Step 1: Embedding
    sendEvent('step', { step: 'embedding', status: 'processing' } as ChatStepEvent);
    const queryEmbedding = await getEmbedding(message, { embeddingModel, embeddingBaseUrl, embeddingApiKey, baseUrl: embeddingBaseUrl, apiKey: embeddingApiKey });
    sendEvent('step', { 
      step: 'embedding', 
      status: 'done', 
      dimension: queryEmbedding.length 
    } as ChatStepEvent);

    // Step 2: Retrieval
    sendEvent('step', { step: 'retrieval', status: 'processing' } as ChatStepEvent);
    const topK = retrievalSettings?.topK || appSettings.retrieval.topK || 3;
    const threshold = retrievalSettings?.threshold || appSettings.retrieval.threshold || 0.5;
    const chunks = searchVectors(queryEmbedding, topK, threshold);
    retrievalReferences = chunks.map((chunk, index) => ({
      id: chunk.id || randomUUID(),
      chunk_id: chunk.id,
      index: index + 1,
      document_name: chunk.document_name,
      content: chunk.content,
      similarity: Math.round(chunk.similarity * 100) / 100
    }));
    sendEvent('step', {
      step: 'retrieval',
      status: 'done',
      chunks: retrievalReferences.map(ref => ({
        id: ref.chunk_id ?? ref.id,
        content: ref.content,
        document_name: ref.document_name,
        similarity: ref.similarity
      }))
    } as ChatStepEvent);

    // Step 3: Build prompt
    sendEvent('step', { step: 'prompt', status: 'processing' } as ChatStepEvent);
    const prompt = buildPrompt(message, chunks);
    sendEvent('step', { step: 'prompt', status: 'done', content: prompt } as ChatStepEvent);

    // Step 4: Generate response
    sendEvent('step', { step: 'generating', status: 'processing' } as ChatStepEvent);

    const messages: Array<{role: 'system' | 'user' | 'assistant', content: string}> = [
      { role: 'system', content: prompt }
    ];

    // Use custom model settings if provided
    const chatModel = modelSettings?.chatModel || config.chatModel;
    const temperature = modelSettings?.temperature || 0.7;
    const maxTokens = modelSettings?.maxTokens || 2048;

    // Add conversation history
    const history = dbHelpers.getRecentMessagesByConversationId(conversation.id, 10).reverse();
    for (const msg of history) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    let fullResponse = '';
    for await (const token of streamChat(messages, { chatModel, temperature, maxTokens, chatBaseUrl, chatApiKey, baseUrl: chatBaseUrl, apiKey: chatApiKey })) {
      fullResponse += token;
      sendEvent('token', { token } as ChatTokenEvent);
    }

    // Save assistant response
    const assistantMessageId = randomUUID();
    dbHelpers.insertMessage({
      id: assistantMessageId,
      conversation_id: conversation.id,
      role: 'assistant',
      content: fullResponse,
      created_at: new Date().toISOString(),
      references: retrievalReferences.map(ref => ({
        ...ref,
        id: ref.id || `${assistantMessageId}-ref-${ref.index}`
      }))
    });
    dbHelpers.touchConversation(conversation.id);

    sendEvent('done', { fullResponse, conversationId: conversation.id } as ChatDoneEvent);
    res.end();

  } catch (error) {
    console.error('Chat error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    sendEvent('error', { message: errorMessage } as ChatErrorEvent);
    res.end();
  }
});

// Get messages for a conversation
router.get('/history', (req: Request, res: Response) => {
  const { conversationId } = req.query;
  if (!conversationId || typeof conversationId !== 'string') {
    return res.status(400).json({ success: false, error: 'conversationId is required' } as ApiResponse);
  }
  const messages = dbHelpers.getMessagesByConversationId(conversationId);
  res.json({ success: true, data: messages } as ApiResponse);
});

// Clear messages for a conversation
router.delete('/history', (req: Request, res: Response) => {
  const { conversationId } = req.query;
  if (!conversationId || typeof conversationId !== 'string') {
    return res.status(400).json({ success: false, error: 'conversationId is required' } as ApiResponse);
  }
  dbHelpers.deleteMessagesByConversationId(conversationId);
  dbHelpers.touchConversation(conversationId);
  res.json({ success: true } as ApiResponse);
});

// Conversation list
router.get('/conversations', (req: Request, res: Response) => {
  const list = dbHelpers.getAllConversations();
  res.json({ success: true, data: list } as ApiResponse<Conversation[]>);
});

router.post('/conversations', (req: Request, res: Response) => {
  const now = new Date().toISOString();
  const conversation: Conversation = {
    id: randomUUID(),
    title: '对话',
    summary: '新的对话',
    created_at: now,
    updated_at: now,
    message_count: 0
  };
  dbHelpers.createConversation(conversation);
  res.json({ success: true, data: conversation } as ApiResponse<Conversation>);
});

router.delete('/conversations/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ success: false, error: 'Conversation ID is required' } as ApiResponse);
  }
  dbHelpers.deleteConversation(id);
  res.json({ success: true } as ApiResponse);
});

export default router;
