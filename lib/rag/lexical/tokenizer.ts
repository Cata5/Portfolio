/**
 * High-performance symbol-aware lexical tokenizer for BM25 search.
 * Expands camelCase, snake_case, kebab-case, dot-notation, and extracts stems.
 */

const STOPWORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
  "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
  "below", "between", "both", "but", "by", "can", "can't", "cannot", "could",
  "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down",
  "during", "each", "few", "for", "from", "further", "had", "hadn't", "has",
  "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her",
  "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's",
  "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it",
  "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my",
  "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other",
  "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't",
  "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such",
  "than", "that", "that's", "the", "their", "theirs", "them", "themselves",
  "then", "there", "there's", "these", "they", "they'd", "they'll", "they're",
  "they've", "this", "those", "through", "to", "too", "under", "until", "up",
  "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were",
  "weren't", "what", "what's", "when", "when's", "where", "where's", "which",
  "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would",
  "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours",
  "yourself", "yourselves"
]);

// Simple Porter-like suffix stripper for basic stemming in search
export function stemWord(word: string): string {
  if (word.length <= 3) return word;

  let stem = word.toLowerCase();
  if (stem.endsWith("ing") && stem.length > 5) {
    stem = stem.slice(0, -3);
  } else if (stem.endsWith("ies") && stem.length > 4) {
    stem = stem.slice(0, -3) + "y";
  } else if (stem.endsWith("es") && stem.length > 4) {
    stem = stem.slice(0, -2);
  } else if (stem.endsWith("s") && !stem.endsWith("ss") && stem.length > 3) {
    stem = stem.slice(0, -1);
  } else if (stem.endsWith("ed") && stem.length > 4) {
    stem = stem.slice(0, -2);
  } else if (stem.endsWith("ly") && stem.length > 4) {
    stem = stem.slice(0, -2);
  } else if (stem.endsWith("tion") && stem.length > 6) {
    stem = stem.slice(0, -4);
  }

  return stem;
}

export function tokenizeLexical(
  text: string,
  options: { removeStopwords?: boolean; stem?: boolean } = {}
): string[] {
  if (!text) return [];

  const removeStopwords = options.removeStopwords ?? true;
  const doStem = options.stem ?? true;

  const tokens: string[] = [];

  // Match words, code identifiers, symbols, and version numbers
  const rawWords = text.match(/[A-Za-z0-9_#+.\-]{2,}/g) || [];

  for (const raw of rawWords) {
    const lower = raw.toLowerCase();

    // Add full lower token
    if (!removeStopwords || !STOPWORDS.has(lower)) {
      tokens.push(doStem ? stemWord(lower) : lower);
      if (doStem && stemWord(lower) !== lower) {
        tokens.push(lower); // include both raw lower and stem
      }
    }

    // Split camelCase: "vortexStreamProxy" -> ["vortex", "stream", "proxy"]
    const camelParts = raw
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
      .split(/\s+/);

    if (camelParts.length > 1) {
      for (const part of camelParts) {
        const partLower = part.toLowerCase();
        if (partLower.length >= 2 && (!removeStopwords || !STOPWORDS.has(partLower))) {
          tokens.push(doStem ? stemWord(partLower) : partLower);
        }
      }
    }

    // Split snake_case, kebab-case, dots: "media_source_handler" -> ["media", "source", "handler"]
    const symbolParts = raw.split(/[_.\-:/]/);
    if (symbolParts.length > 1) {
      for (const part of symbolParts) {
        const partLower = part.toLowerCase();
        if (partLower.length >= 2 && (!removeStopwords || !STOPWORDS.has(partLower))) {
          tokens.push(doStem ? stemWord(partLower) : partLower);
        }
      }
    }
  }

  return tokens;
}
