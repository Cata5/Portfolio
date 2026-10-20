import type { RAGPipelineStage } from "./types/events";

/**
 * Cleans assistant markdown before it reaches the renderer.
 *
 * Small local models occasionally leak artifacts into the stream: prompt
 * scaffolding tags ("<user_query>", "</retrieved_evidence>"), botched
 * pseudo-headers such as "*Navigation:**" or "*Citation:**", mangled
 * "*Label:**" bold markers, and "### Answer" labels copied from the section
 * markers in their prompt. None of these should ever be shown to a visitor,
 * and the inline renderer cannot style them, so they are removed here.
 */
export function sanitizeAssistantContent(raw: string): string {
  let text = raw;

  // Navigation decision tags are consumed by detectNavigationActions.
  text = text.replace(/\[ACTION:[^\]]+\]/gi, "");

  // XML-style control blocks the model improvises instead of the documented
  // tag ("<action>none</action>", "<navigation>scroll #stack</navigation>").
  text = text.replace(/<action\b[^>]*>[\s\S]*?<\/action>/gi, "");
  text = text.replace(/<\/?(?:action|navigation|nav_action)\b[^>]*>/gi, "");

  // Prompt-scaffolding delimiters the model sometimes echoes back.
  text = text.replace(/<\/?(?:user_query|retrieved_evidence|conversation_history)>/gi, "");

  // Meta narration about the navigation directive itself, e.g.
  // "The navigation action tag is ." after the tag was stripped above.
  text = text.replace(/^[^\S\n]*[^\n]*\bnavigation (?:action )?tag\b[^\n]*$/gim, "");

  // Pseudo-header artifacts around the word "Navigation" ("*Navigation:**",
  // "**Navigation:**", "### Navigation Action:"). Standalone marker lines are
  // dropped; the same markers mid-line are stripped so the text still reads
  // cleanly. The colon-less heading form ("### Navigation Action") is dropped
  // too: it is always a section label copied from the prompt.
  text = text.replace(
    /^[^\S\n]*[#*]+[^\S\n]*navigation(?:\s+action)?[^\S\n]*:[^\S\n]*[#*]*[^\S\n]*$/gim,
    ""
  );
  text = text.replace(
    /^[^\S\n]*[#*]+[^\S\n]*navigation(?:\s+action)?[^\S\n]*[#*]*[^\S\n]*$/gim,
    ""
  );
  text = text.replace(
    /[#*]+[^\S\n]*navigation(?:\s+action)?[^\S\n]*:[^\S\n]*[#*]+[^\S\n]*/gi,
    ""
  );

  // Trailing navigation narration the model writes next to its action tag
  // ("To navigate to the Vortex project page:", "Scroll to the **Contact**
  // section:"). The action itself renders as a chip, so the sentence is noise;
  // only standalone narration lines are dropped.
  text = text.replace(
    /^[^\S\n]*(?:to\s+)?(?:navigate|navigating|scroll|scrolling|jump|jumping|route|routing|go|going)\s+(?:you\s+)?(?:to\s+|into\s+|down to\s+|up to\s+)?(?:the\s+)?[^\n:]{0,60}?[^\S\n]*:[^\S\n]*$/gim,
    ""
  );

  // Pseudo-header artifacts around "Citation"/"Source"/"Reference"
  // ("*Citation:**", "**Citation:**", "### Citations:") the model copies from
  // its prompt's citation section. Standalone marker lines are dropped; the
  // markers around the word are stripped so trailing [n] chips still render.
  text = text.replace(
    /^[^\S\n]*[#*]+[^\S\n]*(?:citation|source|reference)s?[^\S\n]*:[^\S\n]*[#*]*[^\S\n]*$/gim,
    ""
  );
  text = text.replace(
    /[#*]+[^\S\n]*(?:citation|source|reference)s?[^\S\n]*:[^\S\n]*[#*]+[^\S\n]*/gi,
    ""
  );

  // "[EVIDENCE ITEM 5]" phrasing leaks into prose ("According to EVIDENCE
  // ITEM [5], ..."). Drop the internal label, keep the citation chip.
  text = text.replace(/\bevidence items?\s*(?=\[\d)/gi, "");

  // Mangled bold markers: the model writes section labels as "*Label:**"
  // (single-star open, double-star close), which markdown reads as italic
  // plus a stray asterisk. A single-open/double-close run is never anything
  // else, so normalize it to real bold. The lookbehind keeps proper
  // "**bold**" pairs intact.
  text = text.replace(/(?<!\*)\*([^*\n]+)\*\*/g, "**$1**");

  // Mangled list items: the model opens a bullet with an empty bold run
  // ("**   **Kotlin 2.2** (primary language)"), which renders as stray
  // asterisks. Rebuild the bullet so the label still reads as bold.
  text = text.replace(/^([^\S\n]*)\*\*[^\S\n]+\*\*/gm, "$1- **");
  text = text.replace(/^([^\S\n]*)\*[^\S\n]+\*(?=\S)/gm, "$1- *");

  // Navigation cheat-sheet echo: the model copies its prompt's list of jump
  // targets ("*   **Tech Stack:** [ACTION: scroll #stack]"). The action tag is
  // stripped above, leaving a bullet that is only a label, and the navigation
  // itself already renders as chips from the detected actions. Labels with
  // content after them are kept.
  text = text.replace(/^[^\S\n]*(?:[-*•]|\d+\.)[^\S\n]+\*\*[^*\n]{1,80}:\*\*[^\S\n]*$/gm, "");

  // Lone marker lines left behind by the removals above ("**", "###", "---").
  text = text.replace(/^[^\S\n]*(?:[#*]{1,4}|-{3,}|_{3,})[^\S\n]*$/gm, "");

  // A citation marker alone on its own line ("... in Python/PyTorch.\n\n[2]")
  // renders as a chip floating on a blank line instead of sitting at the end of
  // the claim it supports. Pull it up onto the previous line; validation still
  // decides whether it becomes a source chip or muted text. Only a directly
  // attached marker (no break, or one blank line) is pulled up: a wider gap is
  // either a deliberate section break or the hole left by removing a
  // "**Citations:**" line above it, and both read better left alone.
  text = text.replace(/(?<!\n)\n{1,2}(?!\n)(?=\[\d+(?:\s*,\s*\d+)*\][^\S\n]*(?:\n|$))/g, " ");

  // Leading "### Answer" / "**Answer:**" scaffolding labels the model copies
  // from the section markers it sees in its prompt. Only stripped at the very
  // start of the reply, where they are always artifacts; the word boundary
  // keeps real headings like "### Responses to common questions" intact.
  text = text.replace(/^\s*#{1,4}[^\S\n]*(?:answer|response)\b[^\S\n]*:?[^\S\n]*/i, "");
  text = text.replace(/^\s*\*\*[^\S\n]*(?:answer|response)\b[^\S\n]*:?[^\S\n]*\*\*[^\S\n]*/i, "");

  // Leaked evidence dumps: the model echoes retrieved blocks back verbatim.
  // Two shapes are recognised — the legacy fenced form ("--- [1] --- /
  // SOURCE: ... / CONTENT: ...") and the current compact header
  // ("[1] Title — Heading (path/to/file.md)"). Cut from the first such block
  // when real answer content precedes it.
  const dumpMatch = text.match(
    /(?:^|\n)[^\S\n]*-{2,}[^\S\n]*\[\d+\][^\S\n]*-{2,}[^\S\n]*(?:\n|$)|(?:^|\n)[^\S\n]*(?:SOURCE|CONTENT)\s*:\s*\[?\d|(?:^|\n)[^\S\n]*\[\d+\][^\S\n][^\n]*\([^)\n]*\.(?:md|markdown|json|jsonc|tsx?|jsx?|py|ya?ml|toml|txt|dart|kt|swift|cpp|cs|java|rb|go|rs|php|sql|sh|css|html)\)[^\S\n]*(?:\n|$)/
  );
  if (dumpMatch && dumpMatch.index !== undefined && dumpMatch.index > 0) {
    const before = text.slice(0, dumpMatch.index).trim();
    if (before.replace(/[\s*#_>-]/g, "").length >= 10) {
      // Drop any separator line the cut left dangling.
      text = before.replace(/(?:\n\s*)+(?:-{3,}|\*{3,}|_{3,})\s*$/, "").trim();
    }
  }

  // Small models bolt their "no evidence" boilerplate onto answers that did
  // contain facts (rule 5 fires as a closing line). Drop it when real content
  // remains; a genuine refusal is that sentence on its own and survives.
  if (/based on the portfolio documentation,?\s*there is not enough information available to answer this question/i.test(text)) {
    const withoutRefusal = text
      .replace(
        /based on the portfolio documentation,?\s*there is not enough information available to answer this question\.?/gi,
        ""
      )
      .trim();
    // Only a short closing line is removed: a real refusal (that sentence
    // alone) leaves nothing behind, so it survives the guard.
    if (withoutRefusal.replace(/[\s*#_>-]/g, "").length >= 60) {
      text = withoutRefusal;
    }
  }

  // Collapse the blank lines those removals can leave behind.
  // A marker-only line can also survive earlier cleanup when the text it
  // wrapped is dropped later ("**<boilerplate>**" -> "****" once the sentence
  // between the asterisks was removed), so the check runs once more here.
  text = text.replace(/^[^\S\n]*(?:[#*]{1,4}|-{3,}|_{3,})[^\S\n]*$/gm, "");
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Normalizes a sanitized answer into renderable structure: trailing punctuation
 * is re-attached after citation spacing, inline bullets are split onto their own
 * lines, and colon-terminated section labels are isolated as their own blocks.
 *
 * Shared by the live renderer and the offline archive compiler so an answer
 * reads the same whether it is streamed from the model or replayed from the
 * pre-compiled archive.
 */
export function normalizeAssistantStructure(sanitized: string): string {
  let text = sanitized;

  // Orphan punctuation left on its own line by citation spacing ("[1]\n,").
  text = text.replace(/(\[\d+(?:\s*,\s*\d+)*\])\s*\n+\s*([,.;:!?])/g, "$1$2 ");
  text = text.replace(/([^\n])\s*\n+\s*([,.;:!?])/g, "$1$2 ");
  text = text.replace(/\n\s*([,.;:!?])\s*/g, "$1 ");

  // List bullets welded to a bold header ("**Languages:** * TypeScript").
  text = text.replace(/(\*\*[^*]+:\*\*)\s*([*-]|\d+\.)\s*/g, "$1\n$2 ");

  // Several bullets concatenated on one line.
  text = text.replace(/([^\n])\s+([*-]|\d+\.)\s+/g, "$1\n$2 ");

  // Category headers ending in a colon become their own blocks.
  text = text.replace(/([^\n])\n+([A-Za-z\s()/-]{2,35}:)\s*\n+/g, "$1\n\n$2\n");

  return text;
}

/**
 * Splits a markdown heading line ("### Key Facts & Highlights:") into the
 * label it should render as and any leftover prose. Small models like to weld
 * body text onto heading markers ("### Answer **CataAI** is ..."); short or
 * colon-terminated lines are labels, longer ones are body text with the
 * markers merely stripped.
 */
export function parseHeadingLine(line: string): { heading: string | null; rest: string } {
  const match = line.match(/^#{1,4}\s+(.+)$/);
  if (!match) return { heading: null, rest: line };
  const rest = match[1].trim();
  // Labels are colon-terminated or short and unpunctuated; bold spans,
  // citations and sentence endings mean the marker was welded onto prose.
  const isLabel =
    rest.endsWith(":") ||
    (rest.length <= 64 && !/[.!?]$/.test(rest) && !rest.includes("**") && !/\[\d/.test(rest));
  return isLabel ? { heading: rest, rest: "" } : { heading: null, rest };
}

/** Visitor-facing label for each pipeline stage shown in the thinking feed. */
export const STAGE_LABELS: Record<RAGPipelineStage, string> = {
  query_understanding: "Understanding the question",
  retrieval: "Searching the knowledge base",
  fusion: "Merging search results",
  reranking: "Ranking the best matches",
  context_assembly: "Reading matching sources",
  generation: "Writing the answer",
  citation_validation: "Verifying citations",
  completed: "Answer ready",
  error: "Something went wrong",
};

/** Pipeline order for the progress rail in the thinking indicator. */
export const STAGE_ORDER: RAGPipelineStage[] = [
  "query_understanding",
  "retrieval",
  "fusion",
  "reranking",
  "context_assembly",
  "generation",
  "citation_validation",
];
