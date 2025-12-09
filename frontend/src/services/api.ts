import { ApiResponse, Document, DocumentChunk, DocumentContent, Message, Conversation, RetrievalSettings, ModelSettings, EmbeddingInfo } from '../types';
const API_BASE = '/api';
export const api = {
  // Documents
  async uploadDocument(
    file: File,
    embeddingSettings?: {
      embeddingModel?: string;
      embeddingBaseUrl?: string;
      embeddingApiKey?: string;
      baseUrl?: string;
      apiKey?: string;
    }
  ): Promise<ApiResponse<Document>> {
    const formData = new FormData();
    formData.append('file', file);
    if (embeddingSettings) {
      const {
        embeddingModel,
        embeddingBaseUrl,
        embeddingApiKey,
        baseUrl,
        apiKey
      } = embeddingSettings;
      if (embeddingModel) formData.append('embeddingModel', embeddingModel);
      if (embeddingBaseUrl) formData.append('embeddingBaseUrl', embeddingBaseUrl);
      if (embeddingApiKey) formData.append('embeddingApiKey', embeddingApiKey);
      if (baseUrl) formData.append('baseUrl', baseUrl);
      if (apiKey) formData.append('apiKey', apiKey);
    }
    const response = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData
    });
    return response.json();
  },
  async getDocuments(): Promise<ApiResponse<Document[]>> {
    const response = await fetch(`${API_BASE}/documents`);
    return response.json();
  },
  async getDocument(id: string): Promise<ApiResponse<Document>> {
    const response = await fetch(`${API_BASE}/documents/${id}`);
    return response.json();
  },
  async getDocumentChunks(id: string): Promise<ApiResponse<DocumentChunk[]>> {
    const response = await fetch(`${API_BASE}/documents/${id}/chunks`);
    return response.json();
  },
  async getDocumentContent(id: string): Promise<ApiResponse<DocumentContent>> {
    const response = await fetch(`${API_BASE}/documents/${id}/content`);
    return response.json();
  },
  async deleteDocument(id: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE}/documents/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  },
  async getEmbeddingInfo(): Promise<ApiResponse<EmbeddingInfo>> {
    const response = await fetch(`${API_BASE}/documents/embedding-info`);
    return response.json();
  },
  // Chat
  sendMessage(
    message: string,
    conversationId: string,
    onEvent: (event: string, data: any) => void,
    retrievalSettings?: { topK: number; threshold: number },
    modelSettings?: {
      chatModel: string;
      embeddingModel: string;
      temperature: number;
      maxTokens: number;
      chatBaseUrl?: string;
      chatApiKey?: string;
      embeddingBaseUrl?: string;
      embeddingApiKey?: string;
    },
    signal?: AbortSignal
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          message,
          conversationId,
          retrievalSettings,
          modelSettings
        }),
        signal
      }).then(response => {
        const reader = response.body?.getReader();
        if (!reader) {
          reject(new Error('Response body is not readable'));
          return;
        }
        
        const decoder = new TextDecoder();
        let buffer = '';

        const processText = (): void => {
          reader.read().then(({ done, value }) => {
            if (done) {
              resolve();
              return;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            let currentEvent = '';
            for (const line of lines) {
              if (line.startsWith('event: ')) {
                currentEvent = line.slice(7);
              } else if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  onEvent(currentEvent, data);
                } catch (e) {
                  // ignore
                }
              }
            }

            processText();
          }).catch(reject);
        }

        processText();
      }).catch(reject);
    });
  },
  async getChatHistory(conversationId: string): Promise<ApiResponse<Message[]>> {
    const response = await fetch(`${API_BASE}/chat/history?conversationId=${encodeURIComponent(conversationId)}`);
    return response.json();
  },
  async clearChatHistory(conversationId: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE}/chat/history?conversationId=${encodeURIComponent(conversationId)}`, {
      method: 'DELETE'
    });
    return response.json();
  },
  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    const response = await fetch(`${API_BASE}/chat/conversations`);
    return response.json();
  },
  async createConversation(): Promise<ApiResponse<Conversation>> {
    const response = await fetch(`${API_BASE}/chat/conversations`, { method: 'POST' });
    return response.json();
  },
  async deleteConversation(id: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE}/chat/conversations/${id}`, { method: 'DELETE' });
    return response.json();
  },
  async getSettings(): Promise<ApiResponse<{ retrieval: RetrievalSettings; model: ModelSettings }>> {
    const response = await fetch(`${API_BASE}/settings`);
    return response.json();
  },
  async saveSettings(payload: { retrieval: RetrievalSettings; model: ModelSettings }): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    return response.json();
  }
};
