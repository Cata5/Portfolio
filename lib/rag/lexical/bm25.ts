import type { BM25Result } from "../types/retrieval";
import type { Chunk } from "../types/document";
import { tokenizeLexical } from "./tokenizer";

export interface BM25FieldWeights {
  title: number; // default: 3.0
  heading: number; // default: 2.0
  symbols: number; // default: 2.5
  tags: number; // default: 2.0
  body: number; // default: 1.0
}

export interface BM25Parameters {
  k1: number; // term frequency saturation (default: 1.2 - 1.5)
  b: number; // length normalization (default: 0.75)
  weights?: Partial<BM25FieldWeights>;
}

export class BM25Engine {
  private k1: number;
  private b: number;
  private weights: BM25FieldWeights;

  // Inverted index: term -> Map<chunkId, { rawTf: number; weightedTf: number }>
  private invertedIndex = new Map<string, Map<string, { rawTf: number; weightedTf: number }>>();

  // Chunk metadata cache: chunkId -> { chunk, docLength: number }
  private chunkStore = new Map<string, { chunk: Chunk; docLength: number }>();

  private totalDocLength = 0;

  constructor(params: Partial<BM25Parameters> = {}) {
    this.k1 = params.k1 ?? 1.4;
    this.b = params.b ?? 0.75;
    this.weights = {
      title: params.weights?.title ?? 3.0,
      heading: params.weights?.heading ?? 2.0,
      symbols: params.weights?.symbols ?? 2.5,
      tags: params.weights?.tags ?? 2.0,
      body: params.weights?.body ?? 1.0,
    };
  }

  public addChunk(chunk: Chunk): void {
    // Remove if already exists
    if (this.chunkStore.has(chunk.id)) {
      this.removeChunk(chunk.id);
    }

    const titleTokens = tokenizeLexical(chunk.metadata.title);
    const headingTokens = tokenizeLexical(chunk.metadata.heading || "");
    const symbolsTokens = (chunk.metadata.symbolNames || []).flatMap((s) =>
      tokenizeLexical(s)
    );
    const tagsTokens = (chunk.metadata.tags || []).flatMap((t) => tokenizeLexical(t));
    const bodyTokens = tokenizeLexical(chunk.cleanContent || chunk.content);

    const termMap = new Map<string, { rawTf: number; weightedTf: number }>();

    function addWeightedTokens(tokens: string[], weight: number) {
      for (const t of tokens) {
        const curr = termMap.get(t) || { rawTf: 0, weightedTf: 0 };
        curr.rawTf += 1;
        curr.weightedTf += weight;
        termMap.set(t, curr);
      }
    }

    addWeightedTokens(titleTokens, this.weights.title);
    addWeightedTokens(headingTokens, this.weights.heading);
    addWeightedTokens(symbolsTokens, this.weights.symbols);
    addWeightedTokens(tagsTokens, this.weights.tags);
    addWeightedTokens(bodyTokens, this.weights.body);

    const docLength = bodyTokens.length + titleTokens.length * 2 + headingTokens.length * 2;
    this.chunkStore.set(chunk.id, { chunk, docLength });
    this.totalDocLength += docLength;

    for (const [term, data] of termMap.entries()) {
      let postings = this.invertedIndex.get(term);
      if (!postings) {
        postings = new Map();
        this.invertedIndex.set(term, postings);
      }
      postings.set(chunk.id, data);
    }
  }

  public addChunks(chunks: Chunk[]): void {
    for (const c of chunks) {
      this.addChunk(c);
    }
  }

  public removeChunk(chunkId: string): void {
    const existing = this.chunkStore.get(chunkId);
    if (!existing) return;

    this.totalDocLength -= existing.docLength;
    this.chunkStore.delete(chunkId);

    for (const postings of this.invertedIndex.values()) {
      postings.delete(chunkId);
    }
  }

  public removeDocument(documentId: string): void {
    const toRemove: string[] = [];
    for (const [chunkId, data] of this.chunkStore.entries()) {
      if (data.chunk.documentId === documentId) {
        toRemove.push(chunkId);
      }
    }
    for (const cid of toRemove) {
      this.removeChunk(cid);
    }
  }

  public clear(): void {
    this.invertedIndex.clear();
    this.chunkStore.clear();
    this.totalDocLength = 0;
  }

  public getDocumentCount(): number {
    return this.chunkStore.size;
  }

  public search(
    query: string,
    topK = 30,
    minThreshold = 0.05
  ): BM25Result[] {
    const N = this.chunkStore.size;
    if (N === 0) return [];

    const avgdl = this.totalDocLength / N || 1;
    const queryTokens = tokenizeLexical(query);
    if (queryTokens.length === 0) return [];

    const scores = new Map<string, { score: number; matchedTerms: Set<string> }>();

    for (const term of queryTokens) {
      const postings = this.invertedIndex.get(term);
      if (!postings || postings.size === 0) continue;

      const df = postings.size;
      // Lucene / Robertson-Spärck Jones IDF with smoothing
      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
      if (idf <= 0) continue;

      for (const [chunkId, termData] of postings.entries()) {
        const docEntry = this.chunkStore.get(chunkId);
        if (!docEntry) continue;

        const docLen = docEntry.docLength;
        const norm = 1 - this.b + this.b * (docLen / avgdl);
        const tf = termData.weightedTf;

        const termScore = idf * ((tf * (this.k1 + 1)) / (tf + this.k1 * norm));

        const existing = scores.get(chunkId) || {
          score: 0,
          matchedTerms: new Set<string>(),
        };
        existing.score += termScore;
        existing.matchedTerms.add(term);
        scores.set(chunkId, existing);
      }
    }

    const results: BM25Result[] = [];
    for (const [chunkId, entry] of scores.entries()) {
      if (entry.score >= minThreshold) {
        const docEntry = this.chunkStore.get(chunkId);
        if (docEntry) {
          results.push({
            chunk: docEntry.chunk,
            score: entry.score,
            rank: 0,
            matchedTerms: Array.from(entry.matchedTerms),
          });
        }
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    // Assign rank 1-indexed
    const sliced = results.slice(0, topK);
    for (let i = 0; i < sliced.length; i++) {
      sliced[i].rank = i + 1;
    }

    return sliced;
  }
}

export const defaultBM25Engine = new BM25Engine();
