import { Router } from 'express';
import { getDb } from '../db/sqlite.js';
import { getEmbedding } from '../services/embedding.js';
import { searchVectors } from '../services/vectorStore.js';
import { streamChat, buildPrompt } from '../services/llm.js';

const router = Router();

// Send message (SSE)
router.post('/', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const db = getDb();

    // Save user message
    db.prepare('INSERT INTO chat_history (role, content) VALUES (?, ?)').run('user', message);

    // Step 1: Embedding
    sendEvent('step', { step: 'embedding', status: 'processing' });
    const queryEmbedding = await getEmbedding(message);
    sendEvent('step', { step: 'embedding', status: 'done', dimension: queryEmbedding.length });

    // Step 2: Retrieval
    sendEvent('step', { step: 'retrieval', status: 'processing' });
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
    });

    // Step 3: Build prompt
    sendEvent('step', { step: 'prompt', status: 'processing' });
    const prompt = buildPrompt(message, chunks);
    sendEvent('step', { step: 'prompt', status: 'done', content: prompt });

    // Step 4: Generate response
    sendEvent('step', { step: 'generating', status: 'processing' });

    const messages = [
      { role: 'system', content: prompt }
    ];

    // Add conversation history
    const history = db.prepare('SELECT role, content FROM chat_history ORDER BY id DESC LIMIT 10').all().reverse();
    for (const msg of history.slice(0, -1)) {
      messages.push({ role: msg.role, content: msg.content });
    }
    messages.push({ role: 'user', content: message });

    let fullResponse = '';
    for await (const token of streamChat(messages)) {
      fullResponse += token;
      sendEvent('token', { token });
    }

    // Save assistant response
    db.prepare('INSERT INTO chat_history (role, content) VALUES (?, ?)').run('assistant', fullResponse);

    sendEvent('done', { fullResponse });
    res.end();

  } catch (error) {
    console.error('Chat error:', error);
    sendEvent('error', { message: error.message });
    res.end();
  }
});

// Get chat history
router.get('/history', (req, res) => {
  const db = getDb();
  const history = db.prepare('SELECT * FROM chat_history ORDER BY id').all();
  res.json({ success: true, data: history });
});

// Clear chat history
router.delete('/history', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM chat_history').run();
  res.json({ success: true });
});

export default router;
