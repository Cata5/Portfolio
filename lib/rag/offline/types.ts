/**
 * Types for the static ("offline archive") assistant.
 *
 * The GitHub Pages export has no server and no local model, so the chat there
 * cannot answer from a live pipeline. Instead it answers from two built-in
 * sources:
 *
 *  1. `archive` - real answers pre-compiled at build time by the local RAG
 *     pipeline (`npm run rag:archive`), committed as `content/rag-archive.json`.
 *  2. `corpus` - a lexical BM25 search over the CMS content that already ships
 *     with the site, rendered as an extractive answer with source chips.
 *
 * Both modes produce the same {@link OfflineAnswer} shape, so every standby
 * theme renders them identically.
 */

/** Where an offline answer came from. */
export type OfflineMode = "archive" | "corpus" | "fallback";

/**
 * One rendered piece of an answer. Keeping blocks ordered means prose and
 * bullets stay in the order the answer was written, in every theme.
 */
export type OfflineBlock =
  | { kind: "text"; text: string }
  | { kind: "bullets"; items: string[] };

export interface OfflineAction {
  id: string;
  label: string;
  type: "scroll" | "route" | "external";
  target: string;
}

/** A source behind an answer, mirroring the live citation chips. */
export interface OfflineSource {
  citationId: number;
  title: string;
  heading?: string;
  filePath: string;
}

/** One pre-compiled answer in `content/rag-archive.json`. */
export interface ArchiveEntry {
  id: string;
  /** The question this answer was generated for; also the match key. */
  question: string;
  blocks: OfflineBlock[];
  sources: OfflineSource[];
  actions: OfflineAction[];
  /** Wall-clock time of the live run that produced this answer. */
  recordedMs?: number;
}

export interface ArchiveFile {
  version: number;
  generatedAt: string;
  /** Model that produced the answers (recorded for honesty in the UI). */
  model: string;
  entries: ArchiveEntry[];
}

/** How an offline answer was resolved, surfaced in each theme's trace panel. */
export interface OfflineTrace {
  mode: OfflineMode;
  query: string;
  /** Archive mode: the stored question this query matched. */
  matchedQuestion?: string;
  recordedMs?: number;
  /** Archive mode: the model that compiled the answer. */
  model?: string;
  /** Corpus mode: chunks consulted and the BM25 terms that matched. */
  consulted: number;
  topScore?: number;
  matchedTerms?: string[];
}

export interface OfflineAnswer {
  mode: OfflineMode;
  title: string;
  badge?: string;
  blocks: OfflineBlock[];
  sources: OfflineSource[];
  actions: OfflineAction[];
  trace: OfflineTrace;
}
