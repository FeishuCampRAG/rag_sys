import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { dbHelpers } from '../db/sqlite.js';
import { parseDocument } from '../services/pdfParser.js';
import { chunkText } from '../services/chunker.js';
import { getEmbeddings } from '../services/embedding.js';
import { addVectors, deleteVectorsByDocumentId } from '../services/vectorStore.js';
import type { ApiResponse, UploadResponse, MulterFile } from '../types/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../data/uploads');

const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const docId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${docId}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
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
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' } as ApiResponse);
    }

    const docId = path.basename(req.file.filename, path.extname(req.file.filename));
    const mimeType = req.file.mimetype || getMimeType(req.file.originalname);

    // Insert document record
    dbHelpers.insertDocument({
      id: docId,
      filename: req.file.filename,
      original_name: req.file.originalname,
      file_size: req.file.size,
      mime_type: mimeType,
      status: 'processing'
    });

    // Return immediately and process in background
    res.json({
      success: true,
      data: {
        id: docId,
        filename: req.file.filename,
        original_name: req.file.originalname,
        status: 'processing'
      }
    } as ApiResponse<UploadResponse>);

    // Process document asynchronously
    processDocument(docId, req.file.path, mimeType).catch(err => {
      console.error('Document processing error:', err);
      dbHelpers.updateDocumentStatus(docId, 'error', err.message);
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    } as ApiResponse);
  }
});

async function processDocument(docId: string, filePath: string, mimeType: string): Promise<void> {
  // Parse document
  const text = await parseDocument(filePath, mimeType);

  // Chunk text
  const chunks = chunkText(text);

  // Store chunks in database
  const chunkIds: string[] = [];
  for (const chunk of chunks) {
    const chunkId = uuidv4();
    chunkIds.push(chunkId);
    dbHelpers.insertChunk({
      id: chunkId,
      document_id: docId,
      content: chunk.content,
      chunk_index: chunk.index,
      char_count: chunk.charCount
    });
  }

  // Get document info
  const doc = dbHelpers.getDocument(docId);
  if (!doc) {
    throw new Error('Document not found');
  }

  // Get embeddings
  const texts = chunks.map(c => c.content);
  const embeddings = await getEmbeddings(texts);

  // Store vectors
  const vectors = chunks.map((chunk, i) => {
    const chunkId = chunkIds[i];
    const embedding = embeddings[i];
    if (!chunkId || !embedding) {
      throw new Error('Missing chunk ID or embedding');
    }
    return {
      id: chunkId,
      document_id: docId,
      document_name: doc.original_name,
      content: chunk.content,
      chunk_index: chunk.index,
      embedding
    };
  });
  addVectors(vectors);

  // Update document status
  dbHelpers.updateDocumentChunkCount(docId, chunks.length);
}

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.md': 'text/markdown'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// Get all documents
router.get('/', (req: Request, res: Response) => {
  const documents = dbHelpers.getAllDocuments();
  res.json({ success: true, data: documents } as ApiResponse);
});

// Get document by id
router.get('/:id', (req: Request, res: Response) => {
  const document = dbHelpers.getDocument(req.params.id!);
  if (!document) {
    return res.status(404).json({ success: false, error: 'Document not found' } as ApiResponse);
  }
  res.json({ success: true, data: document } as ApiResponse);
});

// Get document chunks
router.get('/:id/chunks', (req: Request, res: Response) => {
  const chunks = dbHelpers.getChunksByDocumentId(req.params.id!);
  res.json({ success: true, data: chunks } as ApiResponse);
});

// Get original document content
router.get('/:id/content', async (req: Request, res: Response) => {
  try {
    const document = dbHelpers.getDocument(req.params.id!);
    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' } as ApiResponse);
    }

    const filePath = path.join(uploadsDir, document.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Document file not found' } as ApiResponse);
    }

    const mimeType = document.mime_type || getMimeType(document.filename);
    const content = await parseDocument(filePath, mimeType);

    res.json({
      success: true,
      data: {
        content,
        mime_type: mimeType,
        filename: document.filename,
        original_name: document.original_name
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Fetch document content error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
});

// Delete document
router.delete('/:id', (req: Request, res: Response) => {
  const document = dbHelpers.getDocument(req.params.id!);

  if (!document) {
    return res.status(404).json({ success: false, error: 'Document not found' } as ApiResponse);
  }

  // Delete file
  const filePath = path.join(uploadsDir, document.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Delete vectors
  deleteVectorsByDocumentId(req.params.id!);

  // Delete from database
  dbHelpers.deleteChunksByDocumentId(req.params.id!);
  dbHelpers.deleteDocument(req.params.id!);

  res.json({ success: true } as ApiResponse);
});

export default router;
