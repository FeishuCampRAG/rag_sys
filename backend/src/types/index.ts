export interface Config {
  openaiBaseUrl: string;
  openaiApiKey: string;
  embeddingModel: string;
  chatModel: string;
  port: number;
}

export interface Document {
  id: string;
  filename: string;
  original_name: string;
  file_size?: number;
  mime_type?: string;
  chunk_count?: number;
  status: 'processing' | 'ready' | 'error';
  error_msg?: string;
  created_at: string;
}

export interface Chunk {
  id: string;
  document_id: string;
  content: string;
  chunk_index: number;
  char_count?: number;
}

export interface ChatHistory {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface VectorData {
  id: string;
  document_id: string;
  document_name: string;
  content: string;
  chunk_index: number;
  embedding: number[];
}

export interface VectorStore {
  metadata: {
    model: string;
    dimension: number;
    count: number;
    last_updated: string;
  };
  vectors: VectorData[];
}

export interface SearchResult {
  id: string;
  document_id: string;
  document_name: string;
  content: string;
  chunk_index: number;
  similarity: number;
}

export interface ChunkResult {
  content: string;
  index: number;
  charCount: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatStepEvent {
  step: 'embedding' | 'retrieval' | 'prompt' | 'generating';
  status: 'processing' | 'done';
  dimension?: number;
  chunks?: Array<{
    id: string;
    content: string;
    document_name: string;
    similarity: number;
  }>;
  content?: string;
}

export interface ChatTokenEvent {
  token: string;
}

export interface ChatDoneEvent {
  fullResponse: string;
}

export interface ChatErrorEvent {
  message: string;
}

export interface UploadResponse {
  id: string;
  filename: string;
  original_name: string;
  status: string;
}

export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}