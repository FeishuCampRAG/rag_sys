import { config } from '../utils/config.js';
import type { ModelSettings } from '../types/index.js';

interface EmbeddingResponse {
  data: Array<{
    embedding: number[];
  }>;
}

interface EmbeddingRequest {
  model: string;
  input: string | string[];
}

export type EmbeddingOptions = Pick<ModelSettings, 'embeddingModel' | 'embeddingBaseUrl' | 'embeddingApiKey' | 'baseUrl' | 'apiKey'>;

function resolveEmbeddingModel(options?: Partial<EmbeddingOptions>): string {
  return options?.embeddingModel || config.embeddingModel;
}

export async function getEmbedding(text: string, options?: Partial<EmbeddingOptions>): Promise<number[]> {
  const model = resolveEmbeddingModel(options);
  const baseUrl = options?.embeddingBaseUrl || options?.baseUrl || config.openaiBaseUrl;
  const apiKey = options?.embeddingApiKey || options?.apiKey || config.openaiApiKey;
  const response = await fetch(`${baseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      input: text
    } as EmbeddingRequest)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding API error: ${error}`);
  }

  const data: EmbeddingResponse = await response.json();
  if (!data.data[0]) {
    throw new Error('No embedding data returned from API');
  }
  const embedding = data.data[0].embedding;
  if (!embedding || !Array.isArray(embedding)) {
    throw new Error('Invalid embedding data returned from API');
  }
  return embedding;
}

export async function getEmbeddings(texts: string[], options?: Partial<EmbeddingOptions>): Promise<number[][]> {
  const model = resolveEmbeddingModel(options);
  const baseUrl = options?.embeddingBaseUrl || options?.baseUrl || config.openaiBaseUrl;
  const apiKey = options?.embeddingApiKey || options?.apiKey || config.openaiApiKey;
  const response = await fetch(`${baseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      input: texts
    } as EmbeddingRequest)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding API error: ${error}`);
  }

  const data: EmbeddingResponse = await response.json();
  return data.data.map(item => item.embedding);
}
