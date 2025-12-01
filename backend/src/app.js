import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './utils/config.js';
import { getDb } from './db/sqlite.js';
import documentsRouter from './routes/documents.js';
import chatRouter from './routes/chat.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 设置响应编码
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Initialize database
getDb();

// Routes
app.use('/api/documents', documentsRouter);
app.use('/api/chat', chatRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(config.port, () => {
  console.log(`🚀 RAG Demo Backend running at http://localhost:${config.port}`);
});
