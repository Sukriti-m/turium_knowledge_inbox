import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const serverDirectory = dirname(fileURLToPath(import.meta.url));
const defaultDatabasePath = join(serverDirectory, '..', '..', 'data', 'inbox.db');

export function openDatabase(databasePath = process.env.DATABASE_PATH ?? defaultDatabasePath) {
  mkdirSync(dirname(databasePath), { recursive: true });

  const database = new DatabaseSync(databasePath);
  database.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY,
      source_type TEXT NOT NULL CHECK (source_type IN ('note', 'url')),
      source_url TEXT,
      title TEXT,
      raw_content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chunks (
      id INTEGER PRIMARY KEY,
      item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      position INTEGER NOT NULL,
      embedding TEXT,
      embedding_model TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (item_id, position)
    );
  `);

  const chunkColumns = database.prepare('PRAGMA table_info(chunks)').all();
  if (!chunkColumns.some((column) => column.name === 'embedding_model')) {
    database.exec('ALTER TABLE chunks ADD COLUMN embedding_model TEXT');
  }

  return database;
}
