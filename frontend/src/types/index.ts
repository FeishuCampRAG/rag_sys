// Message types
export interface ChatReference {
  id: string;
  document_name: string;
  similarity?: number;
  content?: string;
  index: number;
}

export interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  streaming?: boolean;
  error?: boolean;
  references?: ChatReference[];
}

export interface Conversation {
  id: string;
  title: string;
  summary: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
  message_count?: number;
}

// Document types
export interface Document {
  id: string;
  filename: string;
  original_name: string;
  status: 'processing' | 'ready' | 'error';
  created_at: string;
  updated_at: string;
  file_size?: number;
  error_message?: string;
  chunk_count?: number;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  document_name: string;
  content: string;
  similarity: number;
  metadata?: Record<string, any>;
  created_at: string;
}

export type RAGProcessStep = 'embedding' | 'retrieval' | 'prompt' | 'generating' | 'done' | 'error';
export type StepStatus = 'pending' | 'processing' | 'done' | 'error';
export type RAGWorkStep = Exclude<RAGProcessStep, 'done' | 'error'>;

export interface DocumentContent {
  content: string;
  filename?: string;
  original_name?: string;
  mime_type?: string;
}

// RAG Process types
export interface RAGStep {
  step: 'embedding' | 'retrieval' | 'prompt' | 'generating';
  status: 'start' | 'done';
  dimension?: number;
  chunks?: DocumentChunk[];
  content?: string;
}

export interface RAGToken {
  token: string;
}

export interface RAGDone {
  fullResponse: string;
}

export interface RAGError {
  error: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Store types
export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  loadHistory: () => Promise<void>;
  sendMessage: (content: string, onRagEvent?: (event: string, data: any) => void) => Promise<void>;
  clearHistory: () => Promise<boolean>;
}

export interface ConversationState {
  conversations: Conversation[];
  activeId: string | null;
  initialized: boolean;
  initializing: boolean;
  init: () => Promise<void>;
  ensureActiveConversation: () => Promise<string | null>;
  fetchConversations: () => Promise<Conversation[]>;
  createConversation: () => Promise<string>;
  selectConversation: (id: string) => void;
  getConversationMessages: (id: string) => Promise<Message[]>;
  updateMessages: (id: string, messages: Message[]) => void;
  updateSummary: (id: string, summary: string) => void;
  deleteConversation: (id: string) => Promise<void>;
}

export interface DocumentState {
  documents: Document[];
  uploading: boolean;
  selectedDocId: string | null;
  selectedDocChunks: DocumentChunk[];
  chunksLoading: boolean;
  selectedDocContent: string | null;
  selectedDocLoading: boolean;
  selectedDocError: string | null;
  fetchDocuments: () => Promise<void>;
  uploadDocument: (file: File) => Promise<ApiResponse<Document>>;
  pollDocumentStatus: (docId: string) => Promise<void>;
  deleteDocument: (id: string) => Promise<ApiResponse>;
  selectDocument: (id: string | null) => Promise<void>;
}

export interface RAGState {
  currentStep: RAGProcessStep | null;
  failedStep: RAGWorkStep | null;
  query: string;
  embeddingDone: boolean;
  embeddingDimension: number;
  retrievedChunks: DocumentChunk[];
  prompt: string;
  generating: boolean;
  generatedTokens: string;
  errorMessage: string | null;
  reset: () => void;
  setQuery: (query: string) => void;
  updateStep: (event: string, data: any) => void;
}

// Component Props types
export interface MessageItemProps {
  message: Message;
}

export interface MainLayoutProps {
  children: React.ReactNode;
}

export interface UploadButtonProps {
  onUploadSuccess?: (document: Document) => void;
}

export interface DocumentItemProps {
  document: Document;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export interface StepCardProps {
  step: number;
  title: string;
  status: StepStatus;
  children?: React.ReactNode;
}

export interface ChunkPreviewProps {
  chunk: DocumentChunk;
  index: number;
  onSelect?: () => void;
}

export interface QueryStepProps {
  query: string;
}

export interface EmbeddingStepProps {
  status: StepStatus;
  embeddingDone: boolean;
  dimension: number;
  errorMessage?: string | null;
}

export interface RetrievalStepProps {
  status: StepStatus;
  chunks: DocumentChunk[];
  errorMessage?: string | null;
  onSelectChunk?: (index: number) => void;
  onViewAllChunks?: () => void;
}

export interface PromptStepProps {
  status: StepStatus;
  prompt: string;
  errorMessage?: string | null;
}

export interface GeneratingStepProps {
  status: StepStatus;
  generating: boolean;
  tokens: string;
  errorMessage?: string | null;
}

// UI types
export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastOptions {
  id?: string;
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export interface ToastMessage extends ToastOptions {
  id: string;
  type: ToastType;
}

export interface LoadingState {
  open: boolean;
  message?: string;
}

export interface ConfirmModalState {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm?: () => Promise<void> | void;
  onCancel?: () => void;
}

export interface ConfirmDialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export interface ChunkViewState {
  open: boolean;
  chunks: DocumentChunk[];
  activeIndex: number;
}

export interface UploadProgressState {
  open: boolean;
  completed: boolean;
  result: 'success' | 'error' | null;
  documentName: string | null;
  currentStep: number;
}

export interface UIState {
  loading: LoadingState;
  toastQueue: ToastMessage[];
  confirm: ConfirmModalState;
  chunkView: ChunkViewState;
  uploadProgress: UploadProgressState;
  setLoading: (open: boolean, message?: string) => void;
  showToast: (toast: Omit<ToastMessage, 'id'> & { id?: string }) => string;
  hideToast: (id: string) => void;
  pushToast: (toast: ToastOptions) => string;
  removeToast: (id: string) => void;
  openConfirm: (options: Omit<ConfirmModalState, 'open'>) => void;
  closeConfirm: () => void;
  showConfirm: (options: ConfirmDialogOptions) => Promise<boolean>;
  openChunkView: (chunks: DocumentChunk[], activeIndex?: number) => void;
  closeChunkView: () => void;
  setActiveChunk: (index: number) => void;
  openUploadProgress: (documentName?: string | null) => void;
  setUploadProgressStep: (step: number) => void;
  completeUploadProgress: (result: 'success' | 'error', documentName?: string | null) => void;
  closeUploadProgress: () => void;
}
