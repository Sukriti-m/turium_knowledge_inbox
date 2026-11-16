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

  return {
    list() {
      return listItems.all().map(toItem);
    },
  };
}
