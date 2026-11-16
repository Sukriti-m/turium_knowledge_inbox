import { AppError } from '../lib/errors.js';
import { chunkText } from './chunking.js';
import { fetchPageContent } from './page-fetcher.js';

const maxContentLength = 100_000;

function validateNoteContent(content) {
  if (typeof content !== 'string' || !content.trim()) throw new AppError('A note must contain text.', 400);
  if (content.length > maxContentLength) throw new AppError('A note must be 100,000 characters or fewer.', 400);
  return content.trim();
}

function createNoteTitle(content) {
  const firstLine = content.split(/\r?\n/).find((line) => line.trim())?.trim() ?? 'Untitled note';
  const normalizedTitle = firstLine.replace(/\s+/g, ' ');
  return normalizedTitle.length > 100 ? `${normalizedTitle.slice(0, 97)}...` : normalizedTitle;
}

export function createIngestionService(itemRepository) {
  return {
    async ingest(input) {
      if (!input || typeof input !== 'object') throw new AppError('A request body is required.', 400);
      if (input.type === 'note') {
        const rawContent = validateNoteContent(input.content);
        const chunks = chunkText(rawContent);
        const item = itemRepository.create({
          sourceType: 'note',
          title: createNoteTitle(rawContent),
          rawContent,
          chunks,
        });
        return { item, chunkCount: chunks.length };
      }
      if (input.type === 'url') {
        if (typeof input.url !== 'string' || !input.url.trim()) throw new AppError('A URL is required.', 400);
        const page = await fetchPageContent(input.url.trim());
        const chunks = chunkText(page.text);
        const item = itemRepository.create({
          sourceType: 'url', sourceUrl: page.url, title: page.title, rawContent: page.text, chunks,
        });
        return { item, chunkCount: chunks.length };
      }
      throw new AppError('Type must be either "note" or "url".', 400);
    },
  };
}
