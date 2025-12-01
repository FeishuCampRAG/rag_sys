import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/sqlite.js';
import { parseDocument } from '../services/pdfParser.js';
import { chunkText } from '../services/chunker.js';
import { getEmbeddings } from '../services/embedding.js';
import { addVectors, deleteVectorsByDocumentId } from '../services/vectorStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../data/uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const docId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${docId}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // 解码中文文件名
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');

    const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(file.mimetype) || ['.pdf', '.txt', '.md'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'));
    }
  }
});

const router = Router();

// Upload document
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const db = getDb();
    const docId = path.basename(req.file.filename, path.extname(req.file.filename));
    const mimeType = req.file.mimetype || getMimeType(req.file.originalname);

    // Insert document record
    db.prepare(`
      INSERT INTO documents (id, filename, original_name, file_size, mime_type, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(docId, req.file.filename, req.file.originalname, req.file.size, mimeType, 'processing');

    // Return immediately and process in background
    res.json({
      success: true,
      data: {
        id: docId,
        filename: req.file.filename,
        original_name: req.file.originalname,
        status: 'processing'
      }
    });

    // Process document asynchronously
    processDocument(docId, req.file.path, mimeType).catch(err => {
      console.error('Document processing error:', err);
      db.prepare('UPDATE documents SET status = ?, error_msg = ? WHERE id = ?')
        .run('error', err.message, docId);
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

async function processDocument(docId, filePath, mimeType) {
  const db = getDb();

  // Parse document
  const text = await parseDocument(filePath, mimeType);

  // Chunk text
  const chunks = chunkText(text);

  // Store chunks in database
  const insertChunk = db.prepare(`
    INSERT INTO chunks (id, document_id, content, chunk_index, char_count)
    VALUES (?, ?, ?, ?, ?)
  `);

  const chunkIds = [];
  for (const chunk of chunks) {
    const chunkId = uuidv4();
    chunkIds.push(chunkId);
    insertChunk.run(chunkId, docId, chunk.content, chunk.index, chunk.charCount);
  }

  // Get embeddings
  const texts = chunks.map(c => c.content);
  const embeddings = await getEmbeddings(texts);

  // Get document info
  const doc = db.prepare('SELECT original_name FROM documents WHERE id = ?').get(docId);

  // Store vectors
  const vectors = chunks.map((chunk, i) => ({
    id: chunkIds[i],
    document_id: docId,
    document_name: doc.original_name,
    content: chunk.content,
    chunk_index: chunk.index,
    embedding: embeddings[i]
  }));
  addVectors(vectors);

  // Update document status
  db.prepare('UPDATE documents SET status = ?, chunk_count = ? WHERE id = ?')
    .run('ready', chunks.length, docId);
}

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.md': 'text/markdown'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// Get all documents
router.get('/', (req, res) => {
  const db = getDb();
  const documents = db.prepare('SELECT * FROM documents ORDER BY created_at DESC').all();
  res.json({ success: true, data: documents });
});

// Get document by id
router.get('/:id', (req, res) => {
  const db = getDb();
  const document = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!document) {
    return res.status(404).json({ success: false, error: 'Document not found' });
  }
  res.json({ success: true, data: document });
});

// Get document chunks
router.get('/:id/chunks', (req, res) => {
  const db = getDb();
  const chunks = db.prepare('SELECT * FROM chunks WHERE document_id = ? ORDER BY chunk_index').all(req.params.id);
  res.json({ success: true, data: chunks });
});

// Delete document
router.delete('/:id', (req, res) => {
  const db = getDb();
  const document = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);

  if (!document) {
    return res.status(404).json({ success: false, error: 'Document not found' });
  }

  // Delete file
  const filePath = path.join(uploadsDir, document.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Delete vectors
  deleteVectorsByDocumentId(req.params.id);

  // Delete from database
  db.prepare('DELETE FROM chunks WHERE document_id = ?').run(req.params.id);
  db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);

  res.json({ success: true });
});

export default router;
