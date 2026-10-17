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

  // Prompt-scaffolding delimiters the model sometimes echoes back.
  text = text.replace(/<\/?(?:user_query|retrieved_evidence|conversation_history)>/gi, "");

  // Meta narration about the navigation directive itself, e.g.
  // "The navigation action tag is ." after the tag was stripped above.
  text = text.replace(/^[^\S\n]*[^\n]*\bnavigation (?:action )?tag\b[^\n]*$/gim, "");

  // Pseudo-header artifacts around the word "Navigation" ("*Navigation:**",
  // "**Navigation:**", "### Navigation Action:"). Standalone marker lines are
  // dropped; the same markers mid-line are stripped so the text still reads
  // cleanly.
  text = text.replace(
    /^[^\S\n]*[#*]+[^\S\n]*navigation(?:\s+action)?[^\S\n]*:[^\S\n]*[#*]*[^\S\n]*$/gim,
    ""
  );
  text = text.replace(
    /[#*]+[^\S\n]*navigation(?:\s+action)?[^\S\n]*:[^\S\n]*[#*]+[^\S\n]*/gi,
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

  // Leading "### Answer" / "**Answer:**" scaffolding labels the model copies
  // from the section markers it sees in its prompt. Only stripped at the very
  // start of the reply, where they are always artifacts; the word boundary
  // keeps real headings like "### Responses to common questions" intact.
  text = text.replace(/^\s*#{1,4}[^\S\n]*(?:answer|response)\b[^\S\n]*:?[^\S\n]*/i, "");
  text = text.replace(/^\s*\*\*[^\S\n]*(?:answer|response)\b[^\S\n]*:?[^\S\n]*\*\*[^\S\n]*/i, "");

  // Collapse the blank lines those removals can leave behind.
  return text.replace(/\n{3,}/g, "\n\n").trim();
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
