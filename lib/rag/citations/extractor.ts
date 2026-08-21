export interface ExtractedCitation {
  raw: string; // e.g. "[1]" or "[1, 2]"
  ids: number[]; // e.g. [1, 2]
  index: number;
}

export function extractCitations(text: string): ExtractedCitation[] {
  const citations: ExtractedCitation[] = [];
  const regex = /\[(\d+(?:\s*,\s*\d+)*)\]/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const raw = match[0];
    const ids = match[1]
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));

    if (ids.length > 0) {
      citations.push({
        raw,
        ids,
        index: match.index,
      });
    }
  }

  return citations;
}
