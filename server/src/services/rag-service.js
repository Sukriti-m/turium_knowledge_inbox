import { AppError } from '../lib/errors.js';

const embeddingBatchSize = 50;
const retrievalLimit = 3;

function cosineSimilarity(left, right) {
  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    dotProduct += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }
  return dotProduct / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

function validateQuestion(question) {
  if (typeof question !== 'string' || !question.trim()) throw new AppError('A question is required.', 400);
  if (question.length > 2_000) throw new AppError('A question must be 2,000 characters or fewer.', 400);
  return question.trim();
}

function toSource(chunk, score) {
  return {
    itemId: chunk.itemId,
    chunkId: chunk.id,
    title: chunk.title || chunk.sourceUrl || 'Untitled note',
    sourceType: chunk.sourceType,
    sourceUrl: chunk.sourceUrl,
    snippet: chunk.content.slice(0, 400),
    score: Number(score.toFixed(3)),
  };
}

export function createRagService(itemRepository, aiService) {
  async function backfillMissingEmbeddings() {
    const missingChunks = itemRepository.listChunksNeedingEmbeddings(aiService.embeddingModel);

    for (let start = 0; start < missingChunks.length; start += embeddingBatchSize) {
      const batch = missingChunks.slice(start, start + embeddingBatchSize);
      const embeddings = await aiService.createEmbeddings(batch.map(({ content }) => content));
      batch.forEach((chunk, index) => itemRepository.saveChunkEmbedding(chunk.id, embeddings[index], aiService.embeddingModel));
    }
  }

  return {
    async embedChunks(chunks) {
      const embeddings = [];
      for (let start = 0; start < chunks.length; start += embeddingBatchSize) {
        const batch = chunks.slice(start, start + embeddingBatchSize);
        embeddings.push(...await aiService.createEmbeddings(batch));
      }
      return chunks.map((content, index) => ({
        content,
        embedding: embeddings[index],
        embeddingModel: aiService.embeddingModel,
      }));
    },
    async query(input) {
      const question = validateQuestion(input?.question);
      await backfillMissingEmbeddings();

      const chunks = itemRepository.listEmbeddedChunks(aiService.embeddingModel);
      if (chunks.length === 0) throw new AppError('Save content before asking a question.', 422);

      const [questionEmbedding] = await aiService.createEmbeddings([question]);
      const matches = chunks
        .map((chunk) => ({ chunk, score: cosineSimilarity(questionEmbedding, chunk.embedding) }))
        .sort((left, right) => right.score - left.score)
        .slice(0, retrievalLimit);

      if (matches[0].score < 0.15) {
        return { answer: 'I could not find relevant information in your saved content.', sources: [] };
      }

      const answer = await aiService.answerQuestion(question, matches.map(({ chunk }) => chunk));
      return { answer, sources: matches.map(({ chunk, score }) => toSource(chunk, score)) };
    },
  };
}
