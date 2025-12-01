import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../../.env');

// Simple .env parser
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

export const config = {
  openaiBaseUrl: process.env.OPENAI_BASE_URL || 'http://34.44.70.146:3000/v1',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-ada-002',
  chatModel: process.env.CHAT_MODEL || 'gpt-5.1',
  port: parseInt(process.env.PORT || '3001', 10)
};
