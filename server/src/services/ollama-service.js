import { AppError } from '../lib/errors.js';

function createUrl(path) {
  const baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434';
  return new URL(path, baseUrl).toString();
}

async function ollamaRequest(path, body) {
  let response;
  try {
    response = await fetch(createUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AppError('Ollama is not reachable. Start Ollama, then try again.', 503);
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new AppError(payload.error ?? 'Ollama could not complete the request.', 502);
  }
  return payload;
}

export function createOllamaService() {
  const embeddingModel = process.env.OLLAMA_EMBEDDING_MODEL ?? 'nomic-embed-text';
  const chatModel = process.env.OLLAMA_CHAT_MODEL ?? 'qwen3:1.7b';

  return {
    embeddingModel,
    async createEmbeddings(texts) {
      const response = await ollamaRequest('/api/embed', { model: embeddingModel, input: texts });
      return response.embeddings;
    },
    async answerQuestion(question, sources) {
      const context = sources.map((source, index) => `[${index + 1}] ${source.content}`).join('\n\n');
      const modelInstruction = chatModel.startsWith('qwen3') ? '/no_think\n' : '';
      const response = await ollamaRequest('/api/chat', {
        model: chatModel,
        stream: false,
        options: { temperature: 0 },
        messages: [
          {
            role: 'system',
            content: 'Answer using only the supplied sources in no more than three sentences. If they do not answer the question, say so. Cite factual statements using source markers like [1]. Do not mention sources that were not supplied.',
          },
          { role: 'user', content: `${modelInstruction}Sources:\n${context}\n\nQuestion: ${question}` },
        ],
      });
      return response.message?.content?.trim() || 'I could not generate an answer from the saved content.';
    },
  };
}
