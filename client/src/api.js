export async function getItems() {
  const response = await fetch('/api/items');

  if (!response.ok) {
    throw new Error('Saved items could not be loaded.');
  }

  const payload = await response.json();
  return payload.items;
}
