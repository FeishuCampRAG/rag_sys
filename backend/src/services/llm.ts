import { config } from '../utils/config.js';
import type { ChatMessage, SearchResult, ModelSettings } from '../types/index.js';

interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  stream: boolean;
  temperature?: number;
  max_tokens?: number;
}

interface ChatCompletionResponse {
  choices: Array<{
    delta?: {
      content?: string;
    };
  }>;
}

interface ResponsesRequest {
  model: string;
  input: Array<{ role: ChatMessage['role']; content: string }>;
  stream: boolean;
  temperature?: number;
  max_tokens?: number;
}

interface ResponsesStreamEvent {
  type?: string;
  delta?: string;
}

const RESPONSES_ONLY_MODEL_PATTERNS = [
  /^gpt-4\.1/i,
  /^gpt-5/i,
  /^o[1-9]/i,
  /^omni/i
];

function shouldUseResponsesEndpoint(model: string): boolean {
  return RESPONSES_ONLY_MODEL_PATTERNS.some((regex) => regex.test(model));
}

function isResponsesOnlyError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('only supported in v1/responses');
  }
  if (typeof error === 'string') {
    return error.includes('only supported in v1/responses');
  }
  return false;
}

async function* streamWithChatCompletions(
  messages: ChatMessage[],
  modelSettings?: Partial<ModelSettings>
): AsyncGenerator<string, void, unknown> {
  const chatModel = modelSettings?.chatModel || config.chatModel;
  const temperature = modelSettings?.temperature ?? 0.7;
  const maxTokens = modelSettings?.maxTokens ?? 2048;
  const baseUrl = modelSettings?.chatBaseUrl || modelSettings?.baseUrl || config.openaiBaseUrl;
  const apiKey = modelSettings?.chatApiKey || modelSettings?.apiKey || config.openaiApiKey;
  
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: chatModel,
      messages,
      stream: true,
      temperature,
      max_tokens: maxTokens
    } as ChatCompletionRequest)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LLM API error: ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          return;
        }
        try {
          const parsed: ChatCompletionResponse = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            yield content;
          }
        } catch (e) {
          // ignore parse errors
        }
      }
    }
  }
}

async function* streamWithResponses(
  messages: ChatMessage[],
  modelSettings?: Partial<ModelSettings>
): AsyncGenerator<string, void, unknown> {
  const chatModel = modelSettings?.chatModel || config.chatModel;
  const temperature = modelSettings?.temperature ?? 0.7;
  const maxTokens = modelSettings?.maxTokens ?? 2048;
  const baseUrl = modelSettings?.chatBaseUrl || modelSettings?.baseUrl || config.openaiBaseUrl;
  const apiKey = modelSettings?.chatApiKey || modelSettings?.apiKey || config.openaiApiKey;
  
  const response = await fetch(`${baseUrl}/responses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: chatModel,
      input: messages.map((message) => ({
        role: message.role,
        content: message.content
      })),
      stream: true,
      temperature,
      max_tokens: maxTokens
    } as ResponsesRequest)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LLM API error: ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let eventDataParts: string[] = [];

  const flushEvent = (): ResponsesStreamEvent | 'DONE' | null => {
    if (!eventDataParts.length) {
      return null;
    }
    const dataString = eventDataParts.join('\n').trim();
    eventDataParts = [];
    if (!dataString) {
      return null;
    }
    if (dataString === '[DONE]') {
      return 'DONE';
    }
    try {
      return JSON.parse(dataString) as ResponsesStreamEvent;
    } catch {
      return null;
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      if (line.startsWith('data:')) {
        eventDataParts.push(line.slice(5).trimStart());
      } else if (line.trim() === '') {
        const event = flushEvent();
        if (!event) {
          continue;
        }
        if (event === 'DONE') {
          return;
        }
        const eventType = event.type ?? '';
        if (eventType === 'response.output_text.delta' && typeof event.delta === 'string') {
          yield event.delta;
        } else if (eventType === 'response.completed') {
          return;
        }
      }
    }
  }

  const finalEvent = flushEvent();
  if (finalEvent === 'DONE') {
    return;
  }
  if (finalEvent?.type === 'response.output_text.delta' && typeof finalEvent.delta === 'string') {
    yield finalEvent.delta;
  }
}

export async function* streamChat(
  messages: ChatMessage[],
  modelSettings?: Partial<ModelSettings>
): AsyncGenerator<string, void, unknown> {
  const chatModel = modelSettings?.chatModel || config.chatModel;
  
  if (shouldUseResponsesEndpoint(chatModel)) {
    yield* streamWithResponses(messages, modelSettings);
    return;
  }

  try {
    yield* streamWithChatCompletions(messages, modelSettings);
  } catch (error) {
    if (isResponsesOnlyError(error)) {
      yield* streamWithResponses(messages, modelSettings);
    } else {
      throw error;
    }
  }
}

export function buildPrompt(query: string, chunks: SearchResult[]): string {
  const context = chunks
    .map((chunk, i) => `[${i + 1}] ${chunk.content}`)
    .join('\n\n');

  return `你是一个专业的知识库问答助手。请根据以下检索到的上下文信息来回答用户的问题。
如果上下文信息不足以回答问题，请如实告知。回答时请引用相关来源，格式为 [1]、[2] 等。

上下文信息：
${context}

用户问题：${query}

请用中文回答：`;
}
