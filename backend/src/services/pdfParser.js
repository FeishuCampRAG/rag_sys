import fs from 'fs';
import pdf from 'pdf-parse';

export async function parsePdf(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdf(buffer);
  return data.text;
}

export function parseTxt(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

export function parseMd(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

export async function parseDocument(filePath, mimeType) {
  if (mimeType === 'application/pdf') {
    return await parsePdf(filePath);
  } else if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
    return parseTxt(filePath);
  } else {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }
}
