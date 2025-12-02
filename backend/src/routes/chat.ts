import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { dbHelpers } from '../db/sqlite.js';
import { getEmbedding } from '../services/embedding.js';
import { searchVectors } from '../services/vectorStore.js';
import { streamChat, buildPrompt } from '../services/llm.js';
import type { ApiResponse, ChatStepEvent, ChatTokenEvent, ChatDoneEvent, ChatErrorEvent, Conversation } from '../types/index.js';

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
    updated_at: now
  };
  dbHelpers.createConversation(conversation);
  return conversation;
};

// Send message (SSE)
router.post('/', async (req: Request, res: Response) => {
  const { message, conversationId } = req.body;

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
    const conversation = ensureConversation(conversationId, message);

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
    const queryEmbedding = await getEmbedding(message);
    sendEvent('step', { 
      step: 'embedding', 
      status: 'done', 
      dimension: queryEmbedding.length 
    } as ChatStepEvent);

    // Step 2: Retrieval
    sendEvent('step', { step: 'retrieval', status: 'processing' } as ChatStepEvent);
    const chunks = searchVectors(queryEmbedding, 3, 0.5);
    sendEvent('step', {
      step: 'retrieval',
      status: 'done',
      chunks: chunks.map(c => ({
        id: c.id,
        content: c.content,
        document_name: c.document_name,
        similarity: Math.round(c.similarity * 100) / 100
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

    // Add conversation history
    const history = dbHelpers.getRecentMessagesByConversationId(conversation.id, 10).reverse();
    for (const msg of history) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    let fullResponse = '';
    for await (const token of streamChat(messages)) {
      fullResponse += token;
      sendEvent('token', { token } as ChatTokenEvent);
    }

    // Save assistant response
    dbHelpers.insertMessage({
      id: randomUUID(),
      conversation_id: conversation.id,
      role: 'assistant',
      content: fullResponse,
      created_at: new Date().toISOString()
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
    updated_at: now
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
