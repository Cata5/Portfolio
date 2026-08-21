/**
 * High-accuracy, fast token estimation for BPE/WordPiece tokenizers (Qwen / GPT / LLaMA style).
 * Takes into account whitespace, punctuation, camelCase/snake_case splits, numbers, and code syntax.
 */

export function estimateTokenCount(text: string): number {
  if (!text || text.length === 0) return 0;

  // Split on whitespace, punctuation boundaries, and camelCase transitions
  const words = text
    .replace(/([a-z])([A-Z])/g, "$1 $2") // split camelCase
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[_.\-:/\\()[\]{}<>=+*&^%$#@!~`?|;,"]/g, " ") // separate symbols
    .trim()
    .split(/\s+/);

  let tokens = 0;
  for (const word of words) {
    if (!word) continue;
    const len = word.length;
    if (len <= 4) {
      tokens += 1;
    } else if (len <= 8) {
      tokens += 2;
    } else if (len <= 14) {
      tokens += 3;
    } else {
      tokens += Math.ceil(len / 4);
    }
  }

  // Account for syntax symbols and newlines
  const specialChars = (text.match(/[{}[\]()<>=;:,.*+\-_&|^%$#@!~`/\\?]/g) || []).length;
  const newlines = (text.match(/\n/g) || []).length;

  return Math.max(1, Math.round(tokens + specialChars * 0.5 + newlines * 0.5));
}

export function truncateToTokenBudget(
  text: string,
  maxTokens: number
): { text: string; tokenCount: number; truncated: boolean } {
  const currentTokens = estimateTokenCount(text);
  if (currentTokens <= maxTokens) {
    return { text, tokenCount: currentTokens, truncated: false };
  }

  // Binary search to find cut point
  const chars = text.length;
  const targetChars = Math.floor((maxTokens / currentTokens) * chars * 0.95);
  let cut = text.lastIndexOf(" ", targetChars);
  if (cut <= 0) cut = targetChars;

  let truncatedText = text.slice(0, cut).trim() + " ... [truncated]";
  let count = estimateTokenCount(truncatedText);

  while (count > maxTokens && cut > 50) {
    cut = Math.floor(cut * 0.85);
    truncatedText = text.slice(0, cut).trim() + " ... [truncated]";
    count = estimateTokenCount(truncatedText);
  }

  return { text: truncatedText, tokenCount: count, truncated: true };
}
