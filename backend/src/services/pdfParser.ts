import fs from 'fs';
// @ts-ignore - pdf-parse doesn't have TypeScript definitions
import pdf from 'pdf-parse';

export async function parsePdf(filePath: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  const data = await pdf(buffer);
  return data.text;
}

export function parseTxt(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

export function parseMd(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

export async function parseDocument(filePath: string, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    return await parsePdf(filePath);
  } else if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
    return parseTxt(filePath);
  } else {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }
}