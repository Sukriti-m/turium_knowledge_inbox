import { useEffect, useState } from 'react';
import { getItems, ingestItem } from './api.js';

export function App() {
  const [items, setItems] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [contentType, setContentType] = useState('note');
  const [content, setContent] = useState('');
  const [saveState, setSaveState] = useState('idle');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    getItems()
      .then((savedItems) => {
        setItems(savedItems);
        setLoadState('ready');
      })
      .catch(() => setLoadState('error'));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaveState('saving');
    setSaveError('');

    try {
      const result = await ingestItem(contentType === 'note'
        ? { type: 'note', content }
        : { type: 'url', url: content });
      setItems((currentItems) => [result.item, ...currentItems]);
      setLoadState('ready');
      setContent('');
      setSaveState('idle');
    } catch (error) {
      setSaveError(error.message);
      setSaveState('idle');
    }
  }

  return (
    <main className="page-shell">
      <header>
        <h1>Turium Knowledge Inbox</h1>
        <p className="intro">Save useful notes and links. Ask cited questions over what you keep.</p>
      </header>

      <section className="panel" aria-labelledby="add-content-heading">
        <h2 id="add-content-heading">Add to inbox</h2>
        <form onSubmit={handleSubmit}>
          <div className="type-picker" aria-label="Content type">
            <button type="button" className={contentType === 'note' ? 'selected' : ''} onClick={() => setContentType('note')}>Note</button>
            <button type="button" className={contentType === 'url' ? 'selected' : ''} onClick={() => setContentType('url')}>URL</button>
          </div>
          {contentType === 'note' ? (
            <textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Paste a short note..." rows="6" required />
          ) : (
            <input value={content} onChange={(event) => setContent(event.target.value)} placeholder="https://example.com/article" type="url" required />
          )}
          {saveError && <p className="error-message">{saveError}</p>}
          <button className="primary-button" type="submit" disabled={saveState === 'saving'}>
            {saveState === 'saving' ? 'Saving...' : 'Save content'}
          </button>
        </form>
      </section>

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
