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
    INSERT INTO chunks (item_id, content, position, embedding, embedding_model)
    VALUES (?, ?, ?, ?, ?)
  `);
  const getItem = database.prepare(`
    SELECT id, source_type, source_url, title, substr(raw_content, 1, 240) AS content_preview, created_at
    FROM items WHERE id = ?
  `);
  const listChunksNeedingEmbeddings = database.prepare(`
    SELECT id, content FROM chunks WHERE embedding IS NULL OR embedding_model IS NOT ?
  `);
  const updateChunkEmbedding = database.prepare(`
    UPDATE chunks SET embedding = ?, embedding_model = ? WHERE id = ?
  `);
  const listEmbeddedChunks = database.prepare(`
    SELECT c.id, c.item_id, c.content, c.position, c.embedding, i.source_type, i.source_url, i.title
    FROM chunks c
    JOIN items i ON i.id = c.item_id
    WHERE c.embedding IS NOT NULL AND c.embedding_model = ?
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
        chunks.forEach(({ content, embedding, embeddingModel }, position) => {
          insertChunk.run(itemId, content, position, embedding ? JSON.stringify(embedding) : null, embeddingModel ?? null);
        });
        database.exec('COMMIT');
        return toItem(getItem.get(itemId));
      } catch (error) {
        database.exec('ROLLBACK');
        throw error;
      }
    },
    listChunksNeedingEmbeddings(embeddingModel) {
      return listChunksNeedingEmbeddings.all(embeddingModel);
    },
    saveChunkEmbedding(chunkId, embedding, embeddingModel) {
      updateChunkEmbedding.run(JSON.stringify(embedding), embeddingModel, chunkId);
    },
    listEmbeddedChunks(embeddingModel) {
      return listEmbeddedChunks.all(embeddingModel).map((chunk) => ({
        id: chunk.id,
        itemId: chunk.item_id,
        content: chunk.content,
        position: chunk.position,
        embedding: JSON.parse(chunk.embedding),
        sourceType: chunk.source_type,
        sourceUrl: chunk.source_url,
        title: chunk.title,
      }));
    },
  };
}
