import { useEffect, useState } from 'react';
import { getItems } from './api.js';

export function App() {
  const [items, setItems] = useState([]);
  const [loadState, setLoadState] = useState('loading');

  useEffect(() => {
    getItems()
      .then((savedItems) => {
        setItems(savedItems);
        setLoadState('ready');
      })
      .catch(() => setLoadState('error'));
  }, []);

  return (
    <main className="page-shell">
      <header>
        <h1>Turium Knowledge Inbox</h1>
        <p className="intro">Save useful notes and links. Ask cited questions over what you keep.</p>
      </header>

      <section className="panel" aria-labelledby="saved-items-heading">
        <h2 id="saved-items-heading">Saved items</h2>
        {loadState === 'loading' && <p className="status">Loading saved items…</p>}
        {loadState === 'error' && <p className="error-message">Could not load saved items.</p>}
        {loadState === 'ready' && items.length === 0 && (
          <p className="status">Your inbox is empty.</p>
        )}
        {loadState === 'ready' && items.length > 0 && (
          <ul className="item-list">
            {items.map((item) => (
              <li key={item.id}>
                <strong>{item.title || item.sourceUrl || 'Untitled note'}</strong>
                <p>{item.contentPreview}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
