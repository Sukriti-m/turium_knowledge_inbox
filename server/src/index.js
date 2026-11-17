import 'dotenv/config';
import { createApp } from './app.js';
import { openDatabase } from './db/database.js';
import { logInfo } from './lib/logger.js';
import { createItemRepository } from './repositories/item-repository.js';
import { createIngestionService } from './services/ingestion-service.js';
import { createOllamaService } from './services/ollama-service.js';
import { createRagService } from './services/rag-service.js';

const port = Number(process.env.PORT ?? 3001);
const database = openDatabase();
const itemRepository = createItemRepository(database);
const ollamaService = createOllamaService();
const ragService = createRagService(itemRepository, ollamaService);
const app = createApp({
  itemRepository,
  ingestionService: createIngestionService(itemRepository, ragService),
  ragService,
});

app.listen(port, () => {
  logInfo('API listening', { port });
});
