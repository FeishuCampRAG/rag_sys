import { Router, Request, Response } from 'express';
import { dbHelpers } from '../db/sqlite.js';
import { getEmbedding } from '../services/embedding.js';
import { searchVectors } from '../services/vectorStore.js';
import { streamChat, buildPrompt } from '../services/llm.js';
import type { ApiResponse, ChatHistory, ChatStepEvent, ChatTokenEvent, ChatDoneEvent, ChatErrorEvent } from '../types/index.js';

const router = Router();

// Send message (SSE)
router.post('/', async (req: Request, res: Response) => {
  const { message } = req.body;

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
    // Save user message
    dbHelpers.insertChatMessage('user', message);

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
    const history = dbHelpers.getRecentChatHistory(10).reverse();
    for (const msg of history.slice(0, -1)) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
    messages.push({ role: 'user', content: message });

    let fullResponse = '';
    for await (const token of streamChat(messages)) {
      fullResponse += token;
      sendEvent('token', { token } as ChatTokenEvent);
    }

    // Save assistant response
    dbHelpers.insertChatMessage('assistant', fullResponse);

    sendEvent('done', { fullResponse } as ChatDoneEvent);
    res.end();

  } catch (error) {
    console.error('Chat error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    sendEvent('error', { message: errorMessage } as ChatErrorEvent);
    res.end();
  }
});

// Get chat history
router.get('/history', (req: Request, res: Response) => {
  const history = dbHelpers.getChatHistory();
  res.json({ success: true, data: history } as ApiResponse<ChatHistory[]>);
});

// Clear chat history
router.delete('/history', (req: Request, res: Response) => {
  dbHelpers.clearChatHistory();
  res.json({ success: true } as ApiResponse);
});

export default router;