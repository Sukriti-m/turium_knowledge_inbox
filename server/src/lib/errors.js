import { logError } from './logger.js';

export function notFoundHandler(request, response) {
  response.status(404).json({ error: `Route ${request.method} ${request.path} was not found.` });
}

export function errorHandler(error, _request, response, next) {
  if (response.headersSent) {
    return next(error);
  }

  logError('Unhandled API error', { error: error.message, stack: error.stack });
  response.status(500).json({ error: 'An unexpected server error occurred.' });
}
