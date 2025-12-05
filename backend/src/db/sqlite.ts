import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  Document,
  Chunk,
  Conversation,
  ChatMessageRecord,
  ChatReference,
  MessageReferenceRecord,
  ChatMessageWithReferences
} from '../types/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../data/rag.db');

let db: Database.Database | null = null;

const ensureIsoTimestamp = (value: string | undefined | null): string | null => {
  if (!value) return null;
  if (/Z$|[+\-]\d{2}:\d{2}$/.test(value)) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  const normalized = value.replace(' ', 'T');
  const candidate = normalized.endsWith('Z') ? normalized : `${normalized}Z`;
  const parsed = new Date(candidate);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const mapConversationRow = (row: Conversation): Conversation => {
  const created = ensureIsoTimestamp(row.created_at) ?? row.created_at;
  const updated = ensureIsoTimestamp(row.updated_at) ?? row.updated_at;
  const messageCount =
    typeof (row as any).message_count === 'number'
      ? (row as any).message_count
      : (row as any).message_count != null
        ? Number((row as any).message_count)
        : row.message_count;

  return {
    ...row,
    created_at: created,
    updated_at: updated,
    message_count: messageCount
  };
};

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
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

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS message_references (
      id TEXT PRIMARY KEY,
      message_id TEXT NOT NULL,
      ref_index INTEGER NOT NULL,
      chunk_id TEXT,
      document_name TEXT NOT NULL,
      content TEXT,
      similarity REAL,
      FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_message_references_message ON message_references(message_id);
  `);
}

export function resetDb(): void {
  if (!db) return;
  
  db.exec(`
    DELETE FROM chunks;
    DELETE FROM documents;
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

  // Conversation operations
  createConversation: (conv: Conversation): Database.RunResult => {
    const db = getDb();
    return db.prepare(`
      INSERT INTO conversations (id, title, summary, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(conv.id, conv.title, conv.summary, conv.created_at, conv.updated_at);
  },

  getConversation: (id: string): Conversation | undefined => {
    const db = getDb();
    const row = db.prepare(`
      SELECT
        c.*,
        (
          SELECT COUNT(*)
          FROM messages m
          WHERE m.conversation_id = c.id
        ) AS message_count
      FROM conversations c
      WHERE c.id = ?
    `).get(id) as Conversation | undefined;
    if (!row) return undefined;
    return mapConversationRow(row);
  },

  getAllConversations: (): Conversation[] => {
    const db = getDb();
    const rows = db.prepare(`
      SELECT
        c.*,
        (
          SELECT COUNT(*)
          FROM messages m
          WHERE m.conversation_id = c.id
        ) AS message_count
      FROM conversations c
      ORDER BY c.updated_at DESC
    `).all() as Conversation[];
    return rows.map(mapConversationRow);
  },

  updateConversationSummary: (id: string, summary: string): Database.RunResult => {
    const db = getDb();
    return db.prepare('UPDATE conversations SET summary = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(summary, id);
  },

  touchConversation: (id: string): Database.RunResult => {
    const db = getDb();
    return db.prepare('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(id);
  },

  deleteConversation: (id: string): Database.RunResult => {
    const db = getDb();
    return db.prepare('DELETE FROM conversations WHERE id = ?').run(id);
  },

  // Message operations
  insertMessage: (msg: ChatMessageRecord & { references?: ChatReference[] }): Database.RunResult => {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO messages (id, conversation_id, role, content, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(msg.id, msg.conversation_id, msg.role, msg.content, msg.created_at);

    if (msg.references && msg.references.length > 0) {
      db.prepare('DELETE FROM message_references WHERE message_id = ?').run(msg.id);
      const insertReference = db.prepare(`
        INSERT INTO message_references (id, message_id, ref_index, chunk_id, document_name, content, similarity)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const insertMany = db.transaction((references: ChatReference[]) => {
        references.forEach((ref, idx) => {
          const storedIndex = Number.isFinite(ref.index) ? Number(ref.index) : idx + 1;
          const storedId = `${msg.id}-ref-${storedIndex}-${idx}`;
          insertReference.run(
            storedId,
            msg.id,
            storedIndex,
            ref.chunk_id ?? null,
            ref.document_name,
            ref.content ?? null,
            typeof ref.similarity === 'number' ? ref.similarity : null
          );
        });
      });

      insertMany(msg.references);
    }

    return result;
  },

  getMessagesByConversationId: (conversationId: string): ChatMessageWithReferences[] => {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC')
      .all(conversationId) as ChatMessageRecord[];

    const messages = rows.map(row => {
      const created = ensureIsoTimestamp(row.created_at) ?? row.created_at;
      return { ...row, created_at: created };
    });

    const referenceStmt = db.prepare('SELECT * FROM message_references WHERE message_id = ? ORDER BY ref_index ASC');

    return messages.map(message => {
      const refs = referenceStmt.all(message.id) as MessageReferenceRecord[];
      if (!refs.length) {
        return message;
      }

      return {
        ...message,
        references: refs.map(ref => {
          const reference: ChatReference = {
            id: ref.id,
            index: ref.ref_index,
            document_name: ref.document_name
          };

          if (ref.content !== undefined && ref.content !== null) {
            reference.content = ref.content;
          }

          if (typeof ref.similarity === 'number') {
            reference.similarity = ref.similarity;
          }

          if (ref.chunk_id) {
            reference.chunk_id = ref.chunk_id;
          }

          return reference;
        })
      };
    });
  },

  getRecentMessagesByConversationId: (conversationId: string, limit: number = 10): Array<Pick<ChatMessageRecord, 'role' | 'content'>> => {
    const db = getDb();
    return db.prepare('SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ?')
      .all(conversationId, limit) as Array<Pick<ChatMessageRecord, 'role' | 'content'>>;
  },

  deleteMessagesByConversationId: (conversationId: string): Database.RunResult => {
    const db = getDb();
    return db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(conversationId);
  }
};
