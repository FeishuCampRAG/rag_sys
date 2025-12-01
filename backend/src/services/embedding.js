import { config } from '../utils/config.js';

export async function getEmbedding(text) {
  const response = await fetch(`${config.openaiBaseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.openaiApiKey}`
    },
    body: JSON.stringify({
      model: config.embeddingModel,
      input: text
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding API error: ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

export async function getEmbeddings(texts) {
  const response = await fetch(`${config.openaiBaseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.openaiApiKey}`
    },
    body: JSON.stringify({
      model: config.embeddingModel,
      input: texts
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding API error: ${error}`);
  }

  const data = await response.json();
  return data.data.map(item => item.embedding);
}
