import { config } from '../utils/config.js';

export async function* streamChat(messages) {
  const response = await fetch(`${config.openaiBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.openaiApiKey}`
    },
    body: JSON.stringify({
      model: config.chatModel,
      messages,
      stream: true
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LLM API error: ${error}`);
  }

  const reader = response.body.getReader();
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
          const parsed = JSON.parse(data);
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

export function buildPrompt(query, chunks) {
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
