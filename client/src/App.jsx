import { useEffect, useState } from 'react';
import { getItems, ingestItem, queryInbox } from './api.js';

export function App() {
  const [items, setItems] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [contentType, setContentType] = useState('note');
  const [content, setContent] = useState('');
  const [saveState, setSaveState] = useState('idle');
  const [saveError, setSaveError] = useState('');
  const [question, setQuestion] = useState('');
  const [queryState, setQueryState] = useState('idle');
  const [queryError, setQueryError] = useState('');
  const [answer, setAnswer] = useState(null);

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

  async function handleQuestion(event) {
    event.preventDefault();
    setQueryState('asking');
    setQueryError('');
    setAnswer(null);

    try {
      setAnswer(await queryInbox(question));
      setQueryState('idle');
    } catch (error) {
      setQueryError(error.message);
      setQueryState('idle');
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

      <section className="panel" aria-labelledby="ask-heading">
        <h2 id="ask-heading">Ask your inbox (Kindly wait for 10-15 sec for response) </h2>
        <form onSubmit={handleQuestion}>
          <textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="What should I verify before releasing?" rows="3" required />
          {queryError && <p className="error-message">{queryError}</p>}
          <button className="primary-button" type="submit" disabled={queryState === 'asking'}>
            {queryState === 'asking' ? 'Searching...' : 'Ask question'}
          </button>
        </form>

        {answer && (
          <div className="answer" aria-live="polite">
            <h3>Answer</h3>
            <p>{answer.answer}</p>
            {answer.sources.length > 0 && (
              <>
                <h3>Sources</h3>
                <ol className="source-list">
                  {answer.sources.map((source) => (
                    <li key={source.chunkId}>
                      <strong>{source.title}</strong>
                      <p>{source.snippet}</p>
                      {source.sourceUrl && <a href={source.sourceUrl} target="_blank" rel="noreferrer">Open source</a>}
                    </li>
                  ))}
                </ol>
              </>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
