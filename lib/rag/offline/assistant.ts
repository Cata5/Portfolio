/**
 * The static ("offline archive") answer engine.
 *
 * Resolution order for a visitor's question on the GitHub Pages export:
 *
 *  1. **archive** - the question closely matches one of the answers
 *     pre-compiled by the local RAG pipeline at build time. This is the highest
 *     quality path: the text is real model output, with its citations, its
 *     navigation actions and the recorded timing of the live run.
 *  2. **corpus** - a BM25 search over the CMS content that ships with the site.
 *     The answer is extractive: it quotes the matching portfolio records and
 *     links them, so it can never invent a fact that is not in the corpus.
 *  3. **fallback** - nothing matched; the visitor gets starter questions and
 *     direct links instead of a dead end.
 *
 * Everything runs in the browser with no network access.
 */

import { BM25Engine } from "../lexical/bm25";
import { tokenizeLexical } from "../lexical/tokenizer";
import type { Chunk } from "../types/document";
import type { BM25Result } from "../types/retrieval";
import { actionForChunkId, buildCorpusChunks, type OfflineCorpusSource } from "./corpus";
import type {
  ArchiveFile,
  ArchiveEntry,
  OfflineAnswer,
  OfflineBlock,
  OfflineSource,
} from "./types";

/** Minimum share of the question's words an archived question must match. */
const ARCHIVE_COVERAGE = 0.5;

/** ...and the fewest words that must match, so one shared keyword is not enough. */
const ARCHIVE_MIN_HITS = 2;

/** Minimum share of the question's tokens the corpus must match at all. */
const CORPUS_COVERAGE = 0.25;

/** How close a project record must score before it beats a passing mention. */
const PROJECT_PREFERENCE_FLOOR = 0.75;

/** Bullets merged from the corpus before the answer starts to feel like a dump. */
const MAX_BULLETS = 7;

const STARTER_QUESTIONS = [
  "Tell me about the Vortex project and what makes it technically impressive.",
  "What are Catalin's primary programming languages and frameworks?",
  "Which machine learning models has Catalin trained, and on what hardware?",
  "How can I contact Catalin directly?",
];

interface CorpusIndex {
  engine: BM25Engine;
  chunks: Chunk[];
  byId: Map<string, Chunk>;
  size: number;
}

interface ArchiveIndex {
  entries: ArchiveEntry[];
  tokens: Map<string, Set<string>>;
  size: number;
}

const corpusIndexes = new WeakMap<object, CorpusIndex>();
const archiveIndexes = new WeakMap<object, ArchiveIndex>();

function tokenSet(text: string): Set<string> {
  return new Set(tokenizeLexical(text));
}

/** Slice names that name a directory record rather than a single item. */
const DIRECTORY_MODULES = ["projects", "journey", "activities", "certifications"];

/** Words that may accompany a slice name without changing its meaning. */
const DIRECTORY_FILLER = new Set([
  "all",
  "every",
  "list",
  "directory",
  "full",
  "browse",
  "show",
  "me",
  "the",
  "my",
  "his",
]);

/**
 * Resolves "projects" / "all projects" / "project list" to the module's
 * directory record. Length normalization makes the long directory records lose
 * to short entries in BM25, so the slice is matched structurally instead.
 */
function directoryRecordFor(query: string, index: CorpusIndex): Chunk | null {
  const words = query
    .toLowerCase()
    .replace(/[^a-z\s]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0 || words.length > 3) return null;

  const matchesModule = (word: string, moduleName: string) =>
    word === moduleName || word === moduleName.replace(/s$/, "") || `${word}s` === moduleName;

  const moduleName = DIRECTORY_MODULES.find((candidate) =>
    words.some((word) => matchesModule(word, candidate))
  );
  if (!moduleName) return null;

  const rest = words.filter((word) => !matchesModule(word, moduleName));
  if (!rest.every((word) => DIRECTORY_FILLER.has(word))) return null;

  return index.byId.get(`${moduleName}:all`) ?? null;
}

function getCorpusIndex(source: OfflineCorpusSource): CorpusIndex {
  const cached = corpusIndexes.get(source);
  if (cached) return cached;

  const chunks = buildCorpusChunks(source);
  const engine = new BM25Engine();
  engine.addChunks(chunks);

  const index: CorpusIndex = {
    engine,
    chunks,
    byId: new Map(chunks.map((chunk) => [chunk.id, chunk])),
    size: chunks.length,
  };
  corpusIndexes.set(source, index);
  return index;
}

function getArchiveIndex(archive: ArchiveFile): ArchiveIndex {
  const cached = archiveIndexes.get(archive);
  if (cached) return cached;

  const entries = archive.entries ?? [];
  const index: ArchiveIndex = {
    entries,
    tokens: new Map(entries.map((entry) => [entry.id, tokenSet(entry.question)])),
    size: entries.length,
  };
  archiveIndexes.set(archive, index);
  return index;
}

/**
 * Distinct meaningful words in a question, each with the lexical forms it can
 * take. Counting words (not raw tokens) keeps a single word from looking like
 * several: the tokenizer emits the stem and the surface form for plurals.
 */
function queryWords(text: string): Map<string, string[]> {
  const words = new Map<string, string[]>();
  for (const raw of text.toLowerCase().split(/[^a-z0-9]+/)) {
    if (!raw || words.has(raw)) continue;
    const forms = tokenizeLexical(raw);
    if (forms.length === 0) continue;
    words.set(raw, forms);
  }
  return words;
}

/**
 * Best-matching archived question for a query, judged by how much of the
 * *question* the visitor's words cover. Short questions ("tell me about
 * Vortex") deliberately fall through to the corpus: one shared keyword is not
 * enough to pick one archived answer over another.
 */
function matchArchiveQuery(query: string, index: ArchiveIndex): ArchiveEntry | null {
  const words = queryWords(query);
  if (words.size < ARCHIVE_MIN_HITS) return null;

  let best: { entry: ArchiveEntry; coverage: number; hits: number } | null = null;

  for (const entry of index.entries) {
    const entryTokens = index.tokens.get(entry.id);
    if (!entryTokens) continue;

    let hits = 0;
    for (const forms of words.values()) {
      if (forms.some((form) => entryTokens.has(form))) hits += 1;
    }
    const coverage = hits / words.size;

    if (
      !best ||
      coverage > best.coverage ||
      (coverage === best.coverage && hits > best.hits)
    ) {
      best = { entry, coverage, hits };
    }
  }

  if (!best || best.hits < ARCHIVE_MIN_HITS || best.coverage < ARCHIVE_COVERAGE) return null;
  return best.entry;
}

/** Splits a chunk body (lead line + item lines) into its parts. */
function chunkParts(chunk: Chunk): { lead: string; items: string[] } {
  const lines = chunk.cleanContent.split("\n").map((line) => line.trim()).filter(Boolean);
  return { lead: lines[0] ?? "", items: lines.slice(1) };
}

/**
 * Builds the extractive answer for a corpus match: the best record's lead line
 * as prose, then the most relevant record lines as bullets, with the records
 * themselves as sources. Related records from the same slice of the portfolio
 * are merged so multi-item questions ("which models...") answer completely.
 */
function buildCorpusAnswer(query: string, results: BM25Result[], index: CorpusIndex): OfflineAnswer {
  const top = results[0];

  // A project's ":detail" record (limitations & future work) is tagged like its
  // overview, so "tell me about X" can rank the detail first. The overview
  // record reads better as the lead, so prefer it whenever it is also present.
  const overviewId = top.chunk.id.endsWith(":detail")
    ? top.chunk.id.replace(/:detail$/, "")
    : null;
  let primary =
    (overviewId ? results.find((result) => result.chunk.id === overviewId) : null) ?? top;

  // Behavioural records (timeline entries, activities) mention a project's name
  // in passing, so "vortex" can rank a milestone above the project itself. When
  // a project record scores close to the top, it is the better answer.
  if (!top.chunk.id.startsWith("project")) {
    const project = results.find(
      (result) =>
        result.chunk.id.startsWith("project:") &&
        !result.chunk.id.endsWith(":detail") &&
        result.score >= top.score * PROJECT_PREFERENCE_FLOOR
    );
    if (project) primary = project;
  }

  // A query naming a whole slice ("projects", "all projects", "journey") means
  // the directory record, not whichever entry happens to be the shortest.
  const directory = directoryRecordFor(query, index);
  if (directory) {
    primary = { chunk: directory, score: top.score, rank: 0, matchedTerms: top.matchedTerms };
  }

  const primaryChunk = primary.chunk;
  const { lead } = chunkParts(primaryChunk);

  // An aggregate record ("projects:all") already lists every item, so merging
  // is skipped; a specific record merges its closest non-aggregate siblings.
  const isAggregate = primaryChunk.id.endsWith(":all");
  const siblings = isAggregate
    ? []
    : results
        .filter(
          (result) =>
            result.chunk.id !== primaryChunk.id &&
            result.chunk.documentId === primaryChunk.documentId &&
            !result.chunk.id.endsWith(":all") &&
            result.score >= primary.score * 0.3
        )
        .slice(0, 2);

  const chosen = [primary, ...siblings];
  const matchedTerms = new Set(primary.matchedTerms ?? []);

  const seen = new Set<string>();
  const candidates: { text: string; hit: boolean }[] = [];
  for (const result of chosen) {
    for (const item of chunkParts(result.chunk).items) {
      const key = item.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const itemTokens = tokenSet(item);
      let hit = false;
      for (const term of matchedTerms) {
        if (itemTokens.has(term)) {
          hit = true;
          break;
        }
      }
      candidates.push({ text: item, hit });
    }
  }

  // Lines that contain the matched terms answer the question most directly, so
  // they lead; the rest keep their corpus order behind them.
  const ordered = [...candidates.filter((c) => c.hit), ...candidates.filter((c) => !c.hit)];
  const bullets = ordered.slice(0, MAX_BULLETS).map((c) => c.text);

  const sources: OfflineSource[] = chosen.map((result, i) => ({
    citationId: i + 1,
    title: result.chunk.metadata.title,
    heading: result.chunk.metadata.heading,
    filePath: result.chunk.metadata.filePath,
  }));

  const action = actionForChunkId(primaryChunk.id, primaryChunk.metadata.title);

  const blocks: OfflineBlock[] = [];
  if (lead) blocks.push({ kind: "text", text: lead });
  if (bullets.length > 0) blocks.push({ kind: "bullets", items: bullets });

  return {
    mode: "corpus",
    title: primaryChunk.metadata.heading ?? primaryChunk.metadata.title,
    badge: "CORPUS RECORDS",
    blocks,
    sources,
    actions: action ? [action] : [],
    trace: {
      mode: "corpus",
      query,
      consulted: index.size,
      topScore: Number(primary.score.toFixed(2)),
      matchedTerms: (primary.matchedTerms ?? []).slice(0, 8),
    },
  };
}

function buildArchiveAnswer(
  query: string,
  entry: ArchiveEntry,
  index: ArchiveIndex,
  model: string
): OfflineAnswer {
  return {
    mode: "archive",
    title: "Pre-compiled answer",
    badge: "VERIFIED ARCHIVE",
    blocks: entry.blocks,
    sources: entry.sources,
    actions: entry.actions,
    trace: {
      mode: "archive",
      query,
      matchedQuestion: entry.question,
      recordedMs: entry.recordedMs,
      model,
      consulted: index.size,
    },
  };
}

function buildFallbackAnswer(query: string, consulted: number): OfflineAnswer {
  return {
    mode: "fallback",
    title: "No archived match",
    badge: "ARCHIVE MISS",
    blocks: [
      {
        kind: "text",
        text: "That question has no pre-compiled answer and no matching portfolio record. These are the questions this archive answers best:",
      },
      { kind: "bullets", items: STARTER_QUESTIONS },
    ],
    sources: [],
    actions: [
      { id: "scroll-projects", label: "Browse All Projects", type: "scroll", target: "projects" },
      { id: "scroll-contact", label: "View Contact Channels", type: "scroll", target: "contact" },
    ],
    trace: { mode: "fallback", query, consulted },
  };
}

export interface OfflineAnswerOptions {
  /** CMS content to index (the `useEditor().content` object). */
  source: OfflineCorpusSource;
  /** Pre-compiled answers; omit when the archive is empty. */
  archive?: ArchiveFile | null;
}

/**
 * Answers a visitor's question offline. Pure and synchronous: the indexes are
 * built once per content object and reused, so repeated questions are free.
 */
export function answerOfflineQuery(query: string, options: OfflineAnswerOptions): OfflineAnswer {
  const trimmed = query.trim();
  const corpus = getCorpusIndex(options.source);

  if (!trimmed) return buildFallbackAnswer(trimmed, corpus.size);

  if (options.archive && options.archive.entries?.length) {
    const archiveIndex = getArchiveIndex(options.archive);
    const entry = matchArchiveQuery(trimmed, archiveIndex);
    if (entry) return buildArchiveAnswer(trimmed, entry, archiveIndex, options.archive.model ?? "");
  }

  const queryTokens = tokenSet(trimmed);
  const results = corpus.engine.search(trimmed, 12, 0);
  const top = results[0];

  if (top && queryTokens.size > 0) {
    const matched = new Set(top.matchedTerms ?? []);
    let hits = 0;
    for (const token of queryTokens) {
      if (matched.has(token)) hits += 1;
    }
    if (hits > 0 && hits / queryTokens.size >= CORPUS_COVERAGE) {
      return buildCorpusAnswer(trimmed, results, corpus);
    }
  }

  return buildFallbackAnswer(trimmed, corpus.size);
}

/** Number of records the offline corpus index holds (used by tests + trace UI). */
export function corpusRecordCount(source: OfflineCorpusSource): number {
  return getCorpusIndex(source).chunks.length;
}
