import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Document, Chunk, ChatHistory } from '../types/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../data/rag.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    initTables();
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

function initTables(): void {
  if (!db) return;
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_size INTEGER,
      mime_type TEXT,
      chunk_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'processing',
      error_msg TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chunks (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      content TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      char_count INTEGER,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chat_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export function resetDb(): void {
  if (!db) return;
  
  db.exec(`
    DELETE FROM chunks;
    DELETE FROM documents;
    DELETE FROM chat_history;
  `);
}

// Type-safe database helpers
export const dbHelpers = {
  // Document operations
  insertDocument: (doc: Omit<Document, 'created_at'>): Database.RunResult => {
    const db = getDb();
    return db.prepare(`
      INSERT INTO documents (id, filename, original_name, file_size, mime_type, status, error_msg, chunk_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(doc.id, doc.filename, doc.original_name, doc.file_size, doc.mime_type, doc.status, doc.error_msg, doc.chunk_count);
  },

  getDocument: (id: string): Document | undefined => {
    const db = getDb();
    return db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as Document | undefined;
  },

  getAllDocuments: (): Document[] => {
    const db = getDb();
    return db.prepare('SELECT * FROM documents ORDER BY created_at DESC').all() as Document[];
  },

  updateDocumentStatus: (id: string, status: string, errorMsg?: string): Database.RunResult => {
    const db = getDb();
    return db.prepare('UPDATE documents SET status = ?, error_msg = ? WHERE id = ?')
      .run(status, errorMsg, id);
  },

  updateDocumentChunkCount: (id: string, chunkCount: number): Database.RunResult => {
    const db = getDb();
    return db.prepare('UPDATE documents SET status = ?, chunk_count = ? WHERE id = ?')
      .run('ready', chunkCount, id);
  },

  deleteDocument: (id: string): Database.RunResult => {
    const db = getDb();
    return db.prepare('DELETE FROM documents WHERE id = ?').run(id);
  },

  // Chunk operations
  insertChunk: (chunk: Omit<Chunk, 'char_count'> & { char_count?: number }): Database.RunResult => {
    const db = getDb();
    return db.prepare(`
      INSERT INTO chunks (id, document_id, content, chunk_index, char_count)
      VALUES (?, ?, ?, ?, ?)
    `).run(chunk.id, chunk.document_id, chunk.content, chunk.chunk_index, chunk.char_count);
  },

  getChunksByDocumentId: (documentId: string): Chunk[] => {
    const db = getDb();
    return db.prepare('SELECT * FROM chunks WHERE document_id = ? ORDER BY chunk_index').all(documentId) as Chunk[];
  },

  deleteChunksByDocumentId: (documentId: string): Database.RunResult => {
    const db = getDb();
    return db.prepare('DELETE FROM chunks WHERE document_id = ?').run(documentId);
  },

  // Chat history operations
  insertChatMessage: (role: string, content: string): Database.RunResult => {
    const db = getDb();
    return db.prepare('INSERT INTO chat_history (role, content) VALUES (?, ?)').run(role, content);
  },

  getChatHistory: (): ChatHistory[] => {
    const db = getDb();
    return db.prepare('SELECT * FROM chat_history ORDER BY id').all() as ChatHistory[];
  },

  getRecentChatHistory: (limit: number = 10): ChatHistory[] => {
    const db = getDb();
    return db.prepare('SELECT role, content FROM chat_history ORDER BY id DESC LIMIT ?').all(limit) as ChatHistory[];
  },

  clearChatHistory: (): Database.RunResult => {
    const db = getDb();
    return db.prepare('DELETE FROM chat_history').run();
  }
};