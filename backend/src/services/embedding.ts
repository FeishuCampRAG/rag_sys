import { config } from '../utils/config.js';

interface EmbeddingResponse {
  data: Array<{
    embedding: number[];
  }>;
}

interface EmbeddingRequest {
  model: string;
  input: string | string[];
}

export async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${config.openaiBaseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.openaiApiKey}`
    },
    body: JSON.stringify({
      model: config.embeddingModel,
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
  return data.data[0].embedding;
}

export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await fetch(`${config.openaiBaseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.openaiApiKey}`
    },
    body: JSON.stringify({
      model: config.embeddingModel,
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