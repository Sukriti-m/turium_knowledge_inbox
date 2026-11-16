export function logInfo(message, details = {}) {
  console.log(JSON.stringify({ level: 'info', message, ...details }));
}

export function logError(message, details = {}) {
  console.error(JSON.stringify({ level: 'error', message, ...details }));
}
