const targetChunkSize = 900;
const overlapSize = 150;

export function chunkText(text) {
  const normalizedText = text.replace(/\s+/g, ' ').trim();
  const chunks = [];
  let start = 0;

  while (start < normalizedText.length) {
    const targetEnd = Math.min(start + targetChunkSize, normalizedText.length);
    let end = targetEnd;

    if (targetEnd < normalizedText.length) {
      const breakpoint = normalizedText.slice(start, targetEnd).search(/[.!?]\s(?=[^.!?]*$)/);
      end = breakpoint > 0 ? start + breakpoint + 1 : normalizedText.lastIndexOf(' ', targetEnd);
      if (end <= start) end = targetEnd;
    }

    chunks.push(normalizedText.slice(start, end).trim());
    start = end >= normalizedText.length ? normalizedText.length : end - overlapSize;
  }

  return chunks.filter(Boolean);
}
