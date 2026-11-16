import cors from 'cors';
import express from 'express';
import { errorHandler, notFoundHandler } from './lib/errors.js';
import { createIngestRouter } from './routes/ingest.js';
import { createItemsRouter } from './routes/items.js';

export function createApp({ itemRepository, ingestionService }) {
  const app = express();

  app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  app.use('/api/items', createItemsRouter(itemRepository));
  app.use('/api/ingest', createIngestRouter(ingestionService));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
