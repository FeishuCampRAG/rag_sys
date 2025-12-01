import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const vectorsPath = path.join(__dirname, '../../data/vectors.json');

function loadVectors() {
  if (!fs.existsSync(vectorsPath)) {
    return {
      metadata: {
        model: 'text-embedding-ada-002',
        dimension: 1536,
        count: 0,
        last_updated: new Date().toISOString()
      },
      vectors: []
    };
  }
  return JSON.parse(fs.readFileSync(vectorsPath, 'utf-8'));
}

function saveVectors(data) {
  data.metadata.count = data.vectors.length;
  data.metadata.last_updated = new Date().toISOString();
  fs.writeFileSync(vectorsPath, JSON.stringify(data, null, 2));
}

export function addVectors(vectors) {
  const data = loadVectors();
  data.vectors.push(...vectors);
  saveVectors(data);
}

export function deleteVectorsByDocumentId(documentId) {
  const data = loadVectors();
  data.vectors = data.vectors.filter(v => v.document_id !== documentId);
  saveVectors(data);
}

export function searchVectors(queryEmbedding, topK = 3, threshold = 0.7) {
  const data = loadVectors();

  if (data.vectors.length === 0) {
    return [];
  }

  const results = data.vectors.map(vector => {
    const similarity = cosineSimilarity(queryEmbedding, vector.embedding);
    return {
      ...vector,
      similarity
    };
  });

  return results
    .filter(r => r.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)
    .map(({ embedding, ...rest }) => rest);
}

function cosineSimilarity(a, b) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function clearVectors() {
  const data = {
    metadata: {
      model: 'text-embedding-ada-002',
      dimension: 1536,
      count: 0,
      last_updated: new Date().toISOString()
    },
    vectors: []
  };
  saveVectors(data);
}

export function getAllVectors() {
  return loadVectors();
}
