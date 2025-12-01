import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { VectorData, VectorStore, SearchResult } from '../types/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const vectorsPath = path.join(__dirname, '../../data/vectors.json');

function loadVectors(): VectorStore {
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
  return JSON.parse(fs.readFileSync(vectorsPath, 'utf-8')) as VectorStore;
}

function saveVectors(data: VectorStore): void {
  data.metadata.count = data.vectors.length;
  data.metadata.last_updated = new Date().toISOString();
  fs.writeFileSync(vectorsPath, JSON.stringify(data, null, 2));
}

export function addVectors(vectors: VectorData[]): void {
  const data = loadVectors();
  data.vectors.push(...vectors);
  saveVectors(data);
}

export function deleteVectorsByDocumentId(documentId: string): void {
  const data = loadVectors();
  data.vectors = data.vectors.filter(v => v.document_id !== documentId);
  saveVectors(data);
}

export function searchVectors(
  queryEmbedding: number[], 
  topK: number = 3, 
  threshold: number = 0.7
): SearchResult[] {
  const data = loadVectors();

  if (data.vectors.length === 0) {
    return [];
  }

  const results = data.vectors.map(vector => {
    const similarity = cosineSimilarity(queryEmbedding, vector.embedding);
    return {
      id: vector.id,
      document_id: vector.document_id,
      document_name: vector.document_name,
      content: vector.content,
      chunk_index: vector.chunk_index,
      similarity
    };
  });

  return results
    .filter(r => r.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const aVal = a[i];
    const bVal = b[i];
    if (aVal !== undefined && bVal !== undefined) {
      dotProduct += aVal * bVal;
      normA += aVal * aVal;
      normB += bVal * bVal;
    }
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function clearVectors(): void {
  const data: VectorStore = {
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

export function getAllVectors(): VectorStore {
  return loadVectors();
}