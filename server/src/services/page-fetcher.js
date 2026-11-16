import { lookup } from 'node:dns/promises';
import { AppError } from '../lib/errors.js';

const maxPageSizeBytes = 2_000_000;
const requestTimeoutMs = 10_000;

function isPrivateAddress(address) {
  return address === '::1' || address.startsWith('fc') || address.startsWith('fd') ||
    address.startsWith('fe80:') || /^127\./.test(address) || /^10\./.test(address) ||
    /^192\.168\./.test(address) || /^169\.254\./.test(address) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(address);
}

async function assertSafeUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new AppError('Enter a valid URL.', 400);
  }

  if (!['http:', 'https:'].includes(url.protocol)) throw new AppError('Only http and https URLs are supported.', 400);
  if (url.hostname === 'localhost') throw new AppError('Local network URLs are not allowed.', 400);

  const addresses = await lookup(url.hostname, { all: true });
  if (addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new AppError('Local network URLs are not allowed.', 400);
  }
  return url;
}

function decodeEntities(text) {
  return text.replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'");
}

function extractPageContent(html) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const text = decodeEntities(html.replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|nav|footer|header)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

  return { title: titleMatch ? decodeEntities(titleMatch[1].replace(/<[^>]+>/g, ' ').trim()) : null, text };
}

export async function fetchPageContent(rawUrl) {
  let url = await assertSafeUrl(rawUrl);

  for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
    let response;
    try {
      response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(requestTimeoutMs) });
    } catch {
      throw new AppError('The URL could not be fetched.', 422);
    }

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) throw new AppError('The URL redirected without a destination.', 422);
      url = await assertSafeUrl(new URL(location, url).toString());
      continue;
    }
    if (!response.ok) throw new AppError(`The URL returned HTTP ${response.status}.`, 422);
    if (!response.headers.get('content-type')?.includes('text/html')) {
      throw new AppError('The URL must return an HTML page.', 422);
    }
    if (Number(response.headers.get('content-length') ?? 0) > maxPageSizeBytes) {
      throw new AppError('The page is too large to ingest.', 422);
    }

    const html = await response.text();
    if (Buffer.byteLength(html) > maxPageSizeBytes) throw new AppError('The page is too large to ingest.', 422);
    const page = extractPageContent(html);
    if (!page.text) throw new AppError('No readable text was found on the page.', 422);
    return { ...page, url: url.toString() };
  }
  throw new AppError('The URL redirected too many times.', 422);
}
