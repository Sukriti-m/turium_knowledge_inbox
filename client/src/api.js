export async function getItems() {
  const response = await fetch('/api/items');

  if (!response.ok) {
    throw new Error('Saved items could not be loaded.');
  }

  const payload = await response.json();
  return payload.items;
}

export async function ingestItem(input) {
  const response = await fetch('/api/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const payload = await response.json();

  if (!response.ok) throw new Error(payload.error ?? 'Content could not be saved.');
  return payload;
}
