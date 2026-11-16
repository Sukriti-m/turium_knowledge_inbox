function toItem(row) {
  return {
    id: row.id,
    sourceType: row.source_type,
    sourceUrl: row.source_url,
    title: row.title,
    contentPreview: row.content_preview,
    createdAt: row.created_at,
  };
}

export function createItemRepository(database) {
  const listItems = database.prepare(`
    SELECT
      id,
      source_type,
      source_url,
      title,
      substr(raw_content, 1, 240) AS content_preview,
      created_at
    FROM items
    ORDER BY datetime(created_at) DESC, id DESC
  `);
  const insertItem = database.prepare(`
    INSERT INTO items (source_type, source_url, title, raw_content)
    VALUES (?, ?, ?, ?)
  `);
  const insertChunk = database.prepare(`
    INSERT INTO chunks (item_id, content, position)
    VALUES (?, ?, ?)
  `);
  const getItem = database.prepare(`
    SELECT id, source_type, source_url, title, substr(raw_content, 1, 240) AS content_preview, created_at
    FROM items WHERE id = ?
  `);

  return {
    list() {
      return listItems.all().map(toItem);
    },
    create({ sourceType, sourceUrl = null, title = null, rawContent, chunks }) {
      database.exec('BEGIN');

      try {
        const result = insertItem.run(sourceType, sourceUrl, title, rawContent);
        const itemId = Number(result.lastInsertRowid);
        chunks.forEach((chunk, position) => insertChunk.run(itemId, chunk, position));
        database.exec('COMMIT');
        return toItem(getItem.get(itemId));
      } catch (error) {
        database.exec('ROLLBACK');
        throw error;
      }
    },
  };
}
