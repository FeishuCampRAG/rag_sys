import type { ChunkResult } from '../types/index.js';

const DEFAULT_CHUNK_SIZE = 500;
const DEFAULT_OVERLAP = 50;

export function chunkText(
  text: string, 
  chunkSize: number = DEFAULT_CHUNK_SIZE, 
  overlap: number = DEFAULT_OVERLAP
): ChunkResult[] {
  const chunks: ChunkResult[] = [];
  const cleanedText = text.replace(/\s+/g, ' ').trim();

  if (cleanedText.length <= chunkSize) {
    return [{
      content: cleanedText,
      index: 0,
      charCount: cleanedText.length
    }];
  }

  let start = 0;
  let index = 0;

  while (start < cleanedText.length) {
    let end = start + chunkSize;

    if (end < cleanedText.length) {
      const lastSpace = cleanedText.lastIndexOf(' ', end);
      if (lastSpace > start) {
        end = lastSpace;
      }
    } else {
      end = cleanedText.length;
    }

    const chunk = cleanedText.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push({
        content: chunk,
        index: index++,
        charCount: chunk.length
      });
    }

    start = end - overlap;
    if (start >= cleanedText.length - overlap) {
      break;
    }
  }

  return chunks;
}