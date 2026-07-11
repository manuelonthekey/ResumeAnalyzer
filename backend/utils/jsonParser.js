export function extractJSON(text) {
  // Try to find JSON object (not array)
  const matches = text.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
  
  if (!matches) return null;

  for (const match of matches) {
    try {
      return JSON.parse(match);
    } catch {
      continue; // try next match
    }
  }

  return null;
}
