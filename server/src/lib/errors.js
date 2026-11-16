import { logError } from './logger.js';

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function notFoundHandler(request, response) {
  response.status(404).json({ error: `Route ${request.method} ${request.path} was not found.` });
}

export function errorHandler(error, _request, response, next) {
  if (response.headersSent) {
    return next(error);
  }

  const statusCode = error instanceof AppError ? error.statusCode : 500;
  logError('API request failed', { error: error.message, statusCode, stack: error.stack });
  response.status(statusCode).json({ error: error.message });
}
