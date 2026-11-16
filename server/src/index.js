import 'dotenv/config';
import { createApp } from './app.js';
import { openDatabase } from './db/database.js';
import { logInfo } from './lib/logger.js';
import { createItemRepository } from './repositories/item-repository.js';

const port = Number(process.env.PORT ?? 3001);
const database = openDatabase();
const app = createApp({ itemRepository: createItemRepository(database) });

app.listen(port, () => {
  logInfo('API listening', { port });
});
