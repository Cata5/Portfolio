import { ingestionPipeline } from "./ingestion/pipeline";
import { hybridRetriever } from "./retrieval/hybrid-retriever";
import { assembleContext } from "./context/budget";
import { buildGroundedSystemPrompt, buildGroundedUserPrompt } from "./generation/prompts";
import { OpenAIGenerationProvider } from "./generation/qwen-generator";
import { validateCitations, type ValidatedCitation } from "./citations/validator";
import { detectPromptInjection } from "./security/injection-guard";
import { queryCache } from "./caching/query-cache";
import { detectHardwareSpecs } from "./hardware/detector";
import { defaultVectorStore } from "./storage/memory-store";
import { lexicalIndex } from "./lexical/index";
import { documentRegistry } from "./ingestion/registry";
import { evaluationRunner } from "./evaluation/runner";
import { getRAGConfig, updateRAGConfig } from "./config";
import type { RetrievalDiagnostics } from "./types/retrieval";
import type { PipelineTimings, RAGStreamEvent } from "./types/events";

export interface RAGQueryOptions {
  debug?: boolean;
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
  skipCache?: boolean;
  history?: { role: "user" | "assistant"; content: string }[];
  onEvent?: (event: RAGStreamEvent) => void;
}

export interface RAGQueryResponse {
  answer: string;
  citations: ValidatedCitation[];
  sources: {
    citationId: number;
    title: string;
    filePath: string;
    heading?: string;
    preview: string;
  }[];
  diagnostics?: RetrievalDiagnostics;
  timings: PipelineTimings;
}

export class RAGFacade {
  private generator: OpenAIGenerationProvider;
  private isInitialized = false;

  constructor() {
    const config = getRAGConfig();
    this.generator = new OpenAIGenerationProvider({
      baseUrl: config.models.generationBaseUrl,
      modelName: config.models.generationModel,
      apiKey: config.models.apiKey,
    });
  }

  private getGenerator(): OpenAIGenerationProvider {
    const config = getRAGConfig();
    if (
      this.generator.baseUrl !== config.models.generationBaseUrl ||
      this.generator.modelName !== config.models.generationModel ||
      this.generator.apiKey !== config.models.apiKey
    ) {
      this.generator = new OpenAIGenerationProvider({
        baseUrl: config.models.generationBaseUrl,
        modelName: config.models.generationModel,
        apiKey: config.models.apiKey,
      });
    }
    return this.generator;
  }

  public async ensureInitialized(): Promise<void> {
    if (this.isInitialized) return;
    const entries = documentRegistry.getAllEntries();
    if (entries.length === 0) {
      await ingestionPipeline.syncPortfolio();
    }
    this.isInitialized = true;
  }

  public async query(
    userQuery: string,
    options: RAGQueryOptions = {}
  ): Promise<RAGQueryResponse> {
    await this.ensureInitialized();
    // Bring the index in step with on-disk sources before answering. The
    // scan is a cheap read+hash pass and unchanged documents are skipped,
    // so editor / CMS / script edits made while the process has been running
    // are picked up here. Cached answers are dropped once anything changed.
    const syncResult = await ingestionPipeline.syncIfChanged(process.cwd());
    if (syncResult && syncResult.indexedCount > 0) {
      queryCache.clear();
    }
    const config = getRAGConfig();
    const isDebug = options.debug ?? config.debug;

    const tStart = Date.now();

    // Check query cache (only for isolated initial queries without conversation history).
    // Debug callers only accept hits that carry stored diagnostics so the
    // pipeline view still has a trace to render.
    if (!options.skipCache && (!options.history || options.history.length === 0)) {
      const cached = queryCache.get(userQuery);
      if (cached && (!isDebug || cached.diagnostics)) {
        const diagnostics = isDebug && cached.diagnostics
          ? { ...cached.diagnostics, cacheHit: true }
          : cached.diagnostics;
        const timings: PipelineTimings = {
          queryUnderstandingMs: 0,
          denseRetrievalMs: 0,
          bm25RetrievalMs: 0,
          fusionMs: 0,
          rerankingMs: 0,
          contextAssemblyMs: 0,
          generationMs: 0,
          citationValidationMs: 0,
          totalMs: Date.now() - tStart,
        };
        // Stream consumers render from events, not the return value: replay
        // the cached answer so a cache hit can't produce an empty stream.
        options.onEvent?.({ type: "delta", content: cached.answer });
        options.onEvent?.({ type: "citations", citations: cached.sources });
        if (isDebug && diagnostics) {
          options.onEvent?.({ type: "debug", diagnostics });
        }
        options.onEvent?.({ type: "done", timings });
        return {
          answer: cached.answer,
          citations: cached.citations,
          sources: cached.sources,
          diagnostics,
          timings,
        };
      }
    }

    // 1. Prompt injection security check
    const injectionCheck = detectPromptInjection(userQuery);
    if (injectionCheck.isSuspicious) {
      console.warn(
        `[RAG security] Suspicious query flagged (${injectionCheck.reason}): ${userQuery.slice(0, 200)}`
      );
    }
    options.onEvent?.({
      type: "status",
      stage: "query_understanding",
      message: "Analyzing query & checking security boundaries...",
    });

    // 2. Hybrid Retrieval (Dense + BM25 + RRF + Reranking)
    options.onEvent?.({
      type: "status",
      stage: "retrieval",
      message: "Performing hybrid dense & BM25 lexical retrieval...",
    });

    const retResult = await hybridRetriever.retrieve(userQuery, {
      history: options.history,
    });

    options.onEvent?.({
      type: "status",
      stage: "fusion",
      message: "Executing Reciprocal Rank Fusion (RRF)...",
    });

    options.onEvent?.({
      type: "status",
      stage: "reranking",
      message: "Running cross-encoder reranking...",
    });

    // 3. Context Assembly
    const tContext = Date.now();
    options.onEvent?.({
      type: "status",
      stage: "context_assembly",
      message: "Allocating token budget & restoring parent context...",
    });

    const candidateChunks = retResult.rerankedResults.map((r) => r.chunk);
    const contextRes = assembleContext(candidateChunks);
    const contextAssemblyMs = Date.now() - tContext;

    options.onEvent?.({
      type: "evidence",
      evidence: contextRes.evidenceBlocks,
    });

    // 4. Grounded Generation
    const tGen = Date.now();
    options.onEvent?.({
      type: "status",
      stage: "generation",
      message: "Generating grounded answer...",
    });

    const sysPrompt = buildGroundedSystemPrompt();
    const userPrompt = buildGroundedUserPrompt(
      userQuery,
      contextRes.formattedContext,
      options.history
    );

    let rawAnswer = "";
    const generator = this.getGenerator();
    if (options.stream) {
      const stream = await generator.generateStream(sysPrompt, userPrompt, {
        temperature: options.temperature ?? config.models.temperature,
        maxTokens: options.maxTokens ?? config.models.maxTokens,
        topP: config.models.topP,
        frequencyPenalty: config.models.frequencyPenalty,
        presencePenalty: config.models.presencePenalty,
        onDelta: (delta) => {
          rawAnswer += delta;
          options.onEvent?.({ type: "delta", content: delta });
        },
      });
      // Consume stream to completion
      for await (const chunk of stream) {
        if (chunk.done) break;
      }
    } else {
      rawAnswer = await generator.generate(sysPrompt, userPrompt, {
        temperature: options.temperature ?? config.models.temperature,
        maxTokens: options.maxTokens ?? config.models.maxTokens,
        topP: config.models.topP,
        frequencyPenalty: config.models.frequencyPenalty,
        presencePenalty: config.models.presencePenalty,
      });
    }
    const generationMs = Date.now() - tGen;

    // 5. Post-generation Citation Validation
    const tVal = Date.now();
    options.onEvent?.({
      type: "status",
      stage: "citation_validation",
      message: "Validating citations & filtering hallucinations...",
    });

    const valResult = validateCitations(rawAnswer, contextRes.evidenceBlocks);
    const citationValidationMs = Date.now() - tVal;

    const sources = valResult.validCitations.map((c) => ({
      citationId: c.citationId,
      title: c.title,
      filePath: c.filePath,
      heading: c.heading,
      preview: c.preview,
    }));

    options.onEvent?.({
      type: "citations",
      citations: sources,
    });

    const timings: PipelineTimings = {
      queryUnderstandingMs: retResult.timings.queryUnderstandingMs,
      denseRetrievalMs: retResult.timings.denseRetrievalMs,
      bm25RetrievalMs: retResult.timings.bm25RetrievalMs,
      fusionMs: retResult.timings.fusionMs,
      rerankingMs: retResult.timings.rerankingMs,
      contextAssemblyMs,
      generationMs,
      citationValidationMs,
      totalMs: Date.now() - tStart,
    };

    let diagnostics: RetrievalDiagnostics | undefined;
    if (isDebug) {
      diagnostics = {
        query: userQuery,
        normalizedQuery: retResult.query.normalizedQuery,
        rewrittenQueries: retResult.query.rewrittenQueries || [],
        denseResults: retResult.diagnostics.denseResults || [],
        bm25Results: retResult.diagnostics.bm25Results || [],
        fusedResults: retResult.diagnostics.fusedResults || [],
        rerankedResults: retResult.diagnostics.rerankedResults || [],
        finalEvidence: contextRes.evidenceBlocks,
        timings: timings as unknown as Record<string, number>,
        tokenBudget: {
          maxTokens: contextRes.maxTokens,
          usedTokens: contextRes.totalTokens,
          availableForGeneration: contextRes.availableForGeneration,
        },
        cacheHit: false,
        securityFlags: injectionCheck.isSuspicious
          ? ["prompt-injection-pattern", "excluded-from-cache"]
          : undefined,
      };
      options.onEvent?.({
        type: "debug",
        diagnostics,
      });
    }

    options.onEvent?.({
      type: "done",
      timings,
    });

    const response: RAGQueryResponse = {
      answer: valResult.validatedText,
      citations: valResult.validCitations,
      sources,
      diagnostics,
      timings,
    };

    // Cache answer if non-empty
    if (valResult.validatedText && !injectionCheck.isSuspicious) {
      queryCache.set(userQuery, {
        answer: valResult.validatedText,
        citations: valResult.validCitations,
        sources,
        diagnostics,
      });
    }

    return response;
  }

  public async syncPortfolio(forceReindex = false) {
    const result = await ingestionPipeline.syncPortfolio(process.cwd(), forceReindex);
    queryCache.clear();
    return result;
  }

  public async deleteDocument(id: string) {
    const deleted = await ingestionPipeline.deleteDocument(id);
    queryCache.clear();
    return deleted;
  }

  public getDocuments() {
    return documentRegistry.getAllEntries();
  }

  public async getStatus() {
    const hw = detectHardwareSpecs();
    const config = getRAGConfig();
    const vectorCount = await defaultVectorStore.count();
    const bm25Stats = lexicalIndex.getStats();
    const docEntries = documentRegistry.getAllEntries();
    const connection = await this.getGenerator().getConnectionInfo();
    const embedding = hybridRetriever.getEmbeddingHealth();

    const status = !connection.reachable
      ? "offline"
      : !connection.authorized
        ? "auth-error"
        : connection.modelLoaded === false
          ? "model-unloaded"
          : "healthy";

    return {
      status,
      hardware: hw,
      models: {
        ...config.models,
        isServerConnected: connection.reachable && connection.authorized,
        modelLoaded: connection.modelLoaded,
        connectionState: connection,
      },
      embedding,
      counts: {
        documents: docEntries.length,
        chunks: vectorCount,
        lexicalChunks: bm25Stats.indexedChunks,
      },
      index: {
        lastSyncedAt: ingestionPipeline.getLastSyncAt() || null,
      },
      cache: {
        queries: queryCache.getStats(),
      },
    };
  }

  public getConfig() {
    return getRAGConfig();
  }

  public updateConfig(patch: Parameters<typeof updateRAGConfig>[0]) {
    return updateRAGConfig(patch);
  }

  public async runEvaluation() {
    await this.ensureInitialized();
    return evaluationRunner.runFullComparison();
  }

  /** Connectivity/auth/model state of the generation server (for scripts & diagnostics). */
  public async getGenerationConnection() {
    return this.getGenerator().getConnectionInfo();
  }
}

export const rag = new RAGFacade();
