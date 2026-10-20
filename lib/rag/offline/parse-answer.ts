/**
 * Turns a finished assistant answer into the ordered blocks the standby themes
 * render.
 *
 * Answers are compiled into `content/rag-archive.json` as blocks rather than as
 * markdown, because the static themes render plain text: bold markers, heading
 * hashes and bullet glyphs would otherwise be shown literally to a visitor.
 * Relationships preserved here: prose stays in order, bullets stay grouped and
 * in place, section labels stay on their own line.
 */

import type { OfflineBlock } from "./types";

const BULLET = /^(?:[-*•]|\d+[.)])\s+/;
const HEADING = /^#{1,4}\s+/;
const CITATION = /\[\d+(?:\s*,\s*\d+)*\]/g;
const CITATION_ONLY = /^\[[\d,\s]+\]$/;

/** Drops markdown emphasis, which the offline themes do not render. */
function cleanInline(text: string): string {
  return text
    .replace(/\*\*/g, "")
    .replace(/^\*+\s*/, "")
    .replace(/\s*\*+$/, "")
    .replace(/[^\S\n]{2,}/g, " ")
    .trim();
}

/** Identity of a line's text, ignoring the citation markers appended to it. */
function dedupeKey(text: string): string {
  return text
    .replace(CITATION, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** True when a line opened a quote it never closed, so the next line continues it. */
function hasOpenQuote(text: string): boolean {
  return (text.match(/"/g)?.length ?? 0) % 2 === 1;
}

/** Splits a sanitized answer into ordered text and bullet blocks. */
export function answerTextToBlocks(text: string): OfflineBlock[] {
  const blocks: OfflineBlock[] = [];
  let textLines: string[] = [];
  let bullets: string[] = [];

  const flushText = () => {
    const joined = textLines.join("\n").trim();
    // A block holding nothing but a citation marker is the tail of the claim
    // above it; the citation itself is rendered in the sources list.
    if (joined && !CITATION_ONLY.test(joined)) {
      blocks.push({ kind: "text", text: joined });
    }
    textLines = [];
  };

  const flushBullets = () => {
    if (bullets.length > 0) {
      const seen = new Set<string>();
      const kept: string[] = [];
      for (const bullet of bullets) {
        // The pipeline often cites the same sentence from several overlapping
        // chunks, which repeats the bullet. Keep the first occurrence.
        const key = dedupeKey(bullet);
        if (key.length >= 12) {
          if (seen.has(key)) continue;
          seen.add(key);
        }
        kept.push(bullet);
      }
      blocks.push({ kind: "bullets", items: kept });
    }
    bullets = [];
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    if (BULLET.test(line)) {
      flushText();
      const item = cleanInline(line.replace(BULLET, ""));
      if (!item || CITATION_ONLY.test(item)) continue;
      const last = bullets[bullets.length - 1];
      // A continuation line of a quoted sentence the model wrapped mid-quote.
      if (last && hasOpenQuote(last)) {
        bullets[bullets.length - 1] = `${last} ${item}`;
      } else {
        bullets.push(item);
      }
      continue;
    }

    const isHeading = HEADING.test(line);
    const content = cleanInline(line.replace(HEADING, ""));

    // A bullet the model wrapped mid-quote continues on the following line,
    // which carries no bullet marker of its own.
    const last = bullets[bullets.length - 1];
    if (!isHeading && last && hasOpenQuote(last) && content) {
      bullets[bullets.length - 1] = `${last} ${content}`;
      continue;
    }

    flushBullets();
    if (content) textLines.push(content);
  }

  flushBullets();
  flushText();
  return blocks;
}
