import { documentRegistry } from "./registry";
import { scanPortfolioFiles, parseScannedFile, type ScannedFile } from "./portfolio-scanner";
import { parentChildManager } from "../chunking/parent-child";
import { lexicalIndex } from "../lexical/index";
import { defaultVectorStore } from "../storage/memory-store";
import type { IVectorStore, VectorRecord } from "../storage/interface";
import type { IEmbeddingProvider } from "../embeddings/interface";
import { OpenAICompatibleEmbeddingProvider } from "../embeddings/qwen-embedding";
import { getRAGConfig } from "../config";
import type { Document, DocumentRegistryEntry } from "../types/document";

export interface IngestionResult {
  indexedCount: number;
  skippedCount: number;
  totalChunks: number;
  entries: DocumentRegistryEntry[];
  errors: { documentId: string; error: string }[];
  durationMs: number;
}

export class IngestionPipeline {
  private vectorStore: IVectorStore;
  private embeddingProvider: IEmbeddingProvider | null = null;
  private embeddingProviderKey = "";
  private injectedEmbeddingProvider: IEmbeddingProvider | null;
  /** Wall-clock start of the most recent sync; 0 until one has run. */
  private lastSyncAt = 0;
  /** Shared in-flight auto re-sync so concurrent queries trigger only one. */
  private autoSyncPromise: Promise<IngestionResult | null> | null = null;

  constructor(
    vectorStore?: IVectorStore,
    embeddingProvider?: IEmbeddingProvider
  ) {
    this.vectorStore = vectorStore || defaultVectorStore;
    this.injectedEmbeddingProvider = embeddingProvider || null;
  }

  /** Rebuilds the provider when model settings change (admin console tuning). */
  private resolveEmbeddingProvider(): IEmbeddingProvider {
    if (this.injectedEmbeddingProvider) return this.injectedEmbeddingProvider;
    const config = getRAGConfig();
    const key = [
      config.models.embeddingBaseUrl,
      config.models.embeddingModel,
      config.models.embeddingDimension,
      config.indexing.enableEmbeddingCache ? "cache" : "nocache",
    ].join("|");
    if (!this.embeddingProvider || this.embeddingProviderKey !== key) {
      this.embeddingProvider = new OpenAICompatibleEmbeddingProvider({
        baseUrl: config.models.embeddingBaseUrl,
        modelName: config.models.embeddingModel,
        dimension: config.models.embeddingDimension,
        cacheEnabled: config.indexing.enableEmbeddingCache,
      });
      this.embeddingProviderKey = key;
    }
    return this.embeddingProvider;
  }

  public async indexDocument(
    scanned: ScannedFile,
    forceReindex = false
  ): Promise<{ document: Document; chunkCount: number; skipped: boolean }> {
    const config = getRAGConfig();
    const isChanged = documentRegistry.hasChanged(scanned.id, scanned.hash);
    if (!forceReindex && config.indexing.enableIncremental && !isChanged) {
      const existingDoc = documentRegistry.getDocument(scanned.id);
      if (existingDoc) {
        return { document: existingDoc, chunkCount: existingDoc.chunks.length, skipped: true };
      }
    }

    // 1. Remove old version from vector store and BM25 index
    await this.vectorStore.deleteByDocumentId(scanned.id);
    lexicalIndex.deleteDocument(scanned.id);

    // 2. Parse and chunk (chunk size/overlap come from the context budget config)
    const { document, chunks } = parseScannedFile(scanned, {
      targetChunkTokens: config.context.targetChunkTokens,
      overlapTokens: config.context.chunkOverlapTokens,
    });

    // 3. Register parent context
    parentChildManager.registerParent(
      document.id,
      document.title,
      document.rawContent,
      document.sections?.map((s) => ({ heading: s.heading.text, content: s.content }))
    );

    // 4. Batch embeddings (batch size from `indexing.batchSize`)
    const chunkTexts = chunks.map((c) => c.content);
    const vectors = await this.resolveEmbeddingProvider().embedBatch(
      chunkTexts,
      config.indexing.batchSize
    );

    if (vectors.length !== chunks.length || vectors.some((v) => !Array.isArray(v) || v.length === 0)) {
      throw new Error(
        `Embedding batch returned ${vectors.length} valid vectors for ${chunks.length} chunks`
      );
    }

    // 5. Build vector records
    const vectorRecords: VectorRecord[] = chunks.map((chunk, idx) => ({
      id: chunk.id,
      vector: vectors[idx],
      chunk,
      metadata: chunk.metadata,
    }));

    // 6. Upsert to vector store
    await this.vectorStore.upsert(vectorRecords);

    // 7. Update BM25 lexical index
    lexicalIndex.indexChunks(chunks);

    // 8. Register in document registry
    documentRegistry.register(document);

    return { document, chunkCount: chunks.length, skipped: false };
  }

  public async deleteDocument(documentId: string): Promise<boolean> {
    await this.vectorStore.deleteByDocumentId(documentId);
    lexicalIndex.deleteDocument(documentId);
    return documentRegistry.remove(documentId);
  }

  public async syncPortfolio(
    rootDir?: string,
    forceReindex = false
  ): Promise<IngestionResult> {
    const startTime = Date.now();
    const scannedFiles = await scanPortfolioFiles(rootDir);
    // Recorded from the sync's start time so edits landing *during* this
    // sync still trip the next staleness probe.
    this.lastSyncAt = startTime;

    let indexedCount = 0;
    let skippedCount = 0;
    let totalChunks = 0;
    const errors: { documentId: string; error: string }[] = [];

    // Track active IDs to detect deletions
    const activeIds = new Set<string>();

    for (const file of scannedFiles) {
      activeIds.add(file.id);
      try {
        const res = await this.indexDocument(file, forceReindex);
        totalChunks += res.chunkCount;
        if (res.skipped) {
          skippedCount++;
        } else {
          indexedCount++;
        }
      } catch (err: unknown) {
        errors.push({
          documentId: file.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // Delete documents that no longer exist on disk
    for (const entry of documentRegistry.getAllEntries()) {
      if (!activeIds.has(entry.id)) {
        await this.deleteDocument(entry.id);
      }
    }

    return {
      indexedCount,
      skippedCount,
      totalChunks,
      entries: documentRegistry.getAllEntries(),
      errors,
      durationMs: Date.now() - startTime,
    };
  }

  public getLastSyncAt(): number {
    return this.lastSyncAt;
  }

  /**
   * Brings the index in step with the sources before a query. The scan is a
   * cheap read+hash pass (~20ms over the whole knowledge base), and unchanged
   * documents are skipped by hash, so re-embedding only happens for files
   * that actually changed. Concurrent callers share one in-flight run, and
   * failures never propagate to the query that triggered the check.
   */
  public async syncIfChanged(rootDir?: string): Promise<IngestionResult | null> {
    const cwd = rootDir || process.cwd();
    if (this.autoSyncPromise) return this.autoSyncPromise;
    this.autoSyncPromise = this.syncPortfolio(cwd, false)
      .catch((err: unknown) => {
        console.warn(
          "[RAG ingestion] Auto re-sync failed:",
          err instanceof Error ? err.message : err
        );
        return null;
      })
      .finally(() => {
        this.autoSyncPromise = null;
      });
    return this.autoSyncPromise;
  }
}

export const ingestionPipeline = new IngestionPipeline();
