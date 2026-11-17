# Turium Knowledge Inbox

A small, single-user knowledge inbox for saving notes or web pages, then asking cited questions over that content.

## Run locally

1. Install [Ollama](https://ollama.com).
2. Pull the local chat and embedding models:

   ```powershell
   ollama pull qwen3:1.7b
   ollama pull nomic-embed-text
   ```

3. Copy `.env.example` to `server/.env`.
4. Run `npm install` at the repository root.
5. Run `npm run dev`.
6. Open `http://localhost:5173`.

Ollama runs locally, so no API key is required.

## Architecture

```text
React UI
  ├─ POST /api/ingest -> Express -> validate/fetch -> chunk/embed -> SQLite
  └─ POST /api/query  -> Express -> embed question -> cosine search -> Ollama chat
                                                                    -> cited answer
```

`items` stores the original normalized note or readable page content. `chunks` stores the smaller retrieval units, their position, embedding vector, and the embedding-model identifier. The identifier lets the app re-embed old chunks automatically if the embedding model changes.

## API

### `POST /api/ingest`

Save a note:

```json
{ "type": "note", "content": "Verify the rollback plan before deployment." }
```

Save a URL:

```json
{ "type": "url", "url": "https://example.com/article" }
```

Returns `201` with the saved item and its chunk count. Notes derive their title from the first non-empty line. URLs are fetched server-side and use the HTML title when present.

### `GET /api/items`

Returns newest-first item metadata and content previews.

### `POST /api/query`

```json
{ "question": "What should I verify before deploying?" }
```

Returns an `answer` with inline model citations such as `[1]`, plus the retrieved `sources` containing exact snippets, titles, URLs, and similarity scores.

## Retrieval decisions

Content is normalized and split into approximately 900-character chunks with a 150-character overlap. The code prefers a sentence boundary near the size limit, falling back to whitespace. This preserves context spanning chunk edges without duplicating too much text.

SQLite is deliberately used as both the application database and vector store. Embeddings are JSON arrays and cosine similarity runs in Node.

## Error handling and safety

- Invalid input returns `400`; unreachable/unreadable URLs return `422`; unavailable Ollama returns `503`.
- API errors are structured JSON with an `error` message; server logs are JSON for easy filtering.
- URL ingestion allows only HTTP(S), rejects obvious local/private addresses, validates redirect targets, applies a 10-second timeout, and limits HTML pages to 2 MB.