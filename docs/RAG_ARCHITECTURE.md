# Local-First Production RAG Architecture

This document describes the production-quality, local-first Retrieval-Augmented Generation (RAG) system built into Catalin's portfolio.

---

## 1. System Overview & Design Philosophy

The portfolio RAG engine provides grounded, citation-validated conversational intelligence over all portfolio data, project analyses, verified technical claims, machine learning experiments, and codebase architecture. Every bracketed citation in an answer is checked against the retrieved evidence, and fabricated references are stripped before display.

### Key Highlights
- **100% Local Inference**: Zero third-party API dependencies. Fully compatible with LM Studio (`http://127.0.0.1:1234/v1`) and Unsloth / vLLM (`http://127.0.0.1:8000/v1`).
- **Hybrid Retrieval**: Combines Dense Vector embeddings (Qwen3-Embedding / cosine similarity) with an in-memory Okapi BM25 engine with field-specific term boosting.
- **Reciprocal Rank Fusion (RRF)**: Merges dense and lexical candidate pools without arbitrary score calibration ($RRF(d) = \sum \frac{w_i}{k + r_i(d)}$).
- **Cross-Encoder Reranking**: Re-scores top candidates in batches (config: `reranker.batchSize`); falls back to a local lexical-semantic scorer when the server exposes no `/rerank` endpoint.
- **Strict Citation Validation**: Every claim is mapped to bracketed citations (`[1]`, `[2]`), and hallucinated source references are stripped automatically.
- **Heuristic Prompt-Injection Defense**: Suspicious queries are logged, answered with delimited (`<retrieved_evidence>`) evidence treated as data, and excluded from the answer cache. This is a heuristic, not a guarantee.

---

## 2. Pipeline Stages

```
User Query
    │
    ▼
[1. Query Understanding & Normalization]
    ├── Lowercase, punctuation cleaning, typo tolerance
    ├── Intent classification (factoid / comparison / technical / code)
    └── Optional Multi-Query Expansion (up to 3 semantic variants)
    │
    ▼
[2. Parallel Hybrid Retrieval]
    ├── Dense Vector Search: Cosine similarity over 768-dim embeddings (Top-30)
    └── Lexical BM25 Search: Okapi BM25 with title(3x), symbols(2.5x), heading(2x) (Top-30)
    │
    ▼
[3. Reciprocal Rank Fusion (RRF)]
    └── Fuses candidate pools with k=60, balancing dense recall and lexical precision
    │
    ▼
[4. Cross-Encoder Reranker]
    └── Re-scores top 25 candidates to extract the most salient Top-8 chunks
    │
    ▼
[5. Context Budget & Delimited Assembly]
    ├── Heading-based parent-child context expansion (sections are collected per heading during chunking)
    └── Token budget packing (3072 tokens max) with isolated <retrieved_evidence> tags
    │
    ▼
[6. Local LLM Generation & Streaming]
    └── OpenAI-compatible SSE streaming (Gemma 4 / Qwen2.5-Coder / local models) with verified citations
    │
    ▼
[7. Citation Validation & Source Attribution]
    └── Validates all bracketed citations [X] against provided evidence IDs
```

---

## 3. Supported Local LLM Backends

The engine works out-of-the-box with any OpenAI-compatible local inference server:

| Server | Default Endpoint | Recommended Models |
| :--- | :--- | :--- |
| **LM Studio** | `http://127.0.0.1:1234/v1` | `qwen2.5-coder-1.5b-instruct`, `qwen3-1.7b` |
| **Unsloth / vLLM** | `http://127.0.0.1:8000/v1` | `qwen2.5-coder-7b-instruct`, `qwen3-embedding-0.6b` |
| **Ollama** | `http://127.0.0.1:11434/v1` | `qwen2.5-coder:1.5b`, `nomic-embed-text` |

### Environment Variables (`.env.local`)
```env
ADMIN_PASSWORD=choose-a-strong-passphrase   # required for admin APIs; unset = no admin sessions in production

LOCAL_LLM_BASE_URL=http://127.0.0.1:1234/v1
LOCAL_LLM_MODEL=qwen2.5-coder-1.5b-instruct
LOCAL_LLM_TEMPERATURE=0.2
LOCAL_LLM_MAX_TOKENS=1024
LOCAL_LLM_API_KEY=                          # only if your server requires a key

LOCAL_EMBEDDING_BASE_URL=http://127.0.0.1:1234/v1
LOCAL_EMBEDDING_MODEL=text-embedding-nomic-embed-text-v1.5
LOCAL_EMBEDDING_DIM=768

RAG_ENABLE_MULTI_QUERY=true
RAG_DENSE_TOP_K=30
RAG_BM25_TOP_K=30
RAG_RRF_K=60
RAG_FINAL_TOP_K=8
RAG_MAX_CONTEXT_TOKENS=3072
RAG_INDEX_BATCH_SIZE=32
RAG_ENABLE_EMBEDDING_CACHE=true
RAG_INCREMENTAL=true
```

---

## 4. Benchmark Evaluation Results

> ⚠️ **Sample output — not a current claim.** The table below is from an earlier local run and is kept only to show the report format. Benchmark numbers are only meaningful with a real embedding model loaded: until then dense retrieval runs on the deterministic hash fallback (see §7) and the dense rows measure hash noise. Re-run `npm run rag:eval` against your own loaded models before quoting any number.

Evaluated across 17 ground-truth queries covering projects, architecture, ML experiments, and security jailbreaks:

| Configuration | Recall@3 | Recall@5 | Precision@3 | MRR | nDCG@5 | Groundedness | Citation Acc. | Avg Latency |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **A: Dense-Only** | 45.6% | 51.1% | 51.1% | 0.813 | 0.949 | 55.8% | 100.0% | 2 ms |
| **B: BM25-Only** | 74.4% | 80.0% | 68.9% | 0.831 | 1.108 | 57.3% | 100.0% | 1 ms |
| **C: Hybrid + RRF** | 60.0% | 71.1% | 75.6% | **0.880** | **1.131** | **58.0%** | **100.0%** | 1 ms |
| **D: Hybrid + RRF + Reranker** | 58.9% | 73.3% | 64.4% | 0.799 | 1.107 | 57.3% | 100.0% | 2 ms |
| **E: Full Pipeline (+Multi-Query)** | **58.9%** | **73.3%** | **64.4%** | 0.799 | 1.123 | 55.3% | **100.0%** | 2 ms |

---

## 5. API Endpoints

All **mutating** endpoints require an admin session: `Authorization: Bearer <ADMIN_PASSWORD>`. The read endpoints used by the public chat stay public.

Mutations live on their own POST/DELETE-only subpaths so the public GET route files can stay `force-static` (required by the GitHub Pages export, which blanks request headers — see §7):

- `POST /api/rag/query` — streaming SSE / JSON RAG query. Public.
- `GET /api/rag/status` — health check: hardware, per-model tri-state (`reachable` / `authorized` / `modelLoaded`), embedding mode, index counts. Public; secrets are stripped.
- `GET /api/rag/config` — current configuration. Public.
- `POST /api/rag/config/update` — update hyperparameters (persisted, see §7). **Admin.**
- `GET /api/rag/documents` — list indexed documents. Public.
- `DELETE /api/rag/documents/delete` — `{id}` removes a document from vector + lexical indices. **Admin.**
- `POST /api/rag/index` — incremental SHA-256 sync of all portfolio files. **Admin.**
- `POST /api/rag/reindex` — full re-indexing of the knowledge base. **Admin.**
- `POST /api/rag/eval` — run the multi-configuration benchmark suite. **Admin.**
- `GET /api/rag/models` — list models on the inference server. Public (no credentials in the listing).
- `POST /api/rag/models/reload` — `{baseUrl?, apiKey?, modelName?, reload?}` lists a (candidate) server's models and, with `reload: true`, asks it to load the model. **Admin.**

---

## 6. CLI Tools

```bash
# Unit/integration suite. Runs without a live model server;
# the end-to-end query check is skipped automatically when no model is loaded.
npm run rag:test

# Sync & index portfolio markdown, JSON, and source code
npm run rag:index

# Run benchmark across Configurations A through E
npm run rag:eval
```

---

## 7. Operational Notes & Security

### Configuration persistence
- Admin console changes to hyperparameters are merged into the running config **and persisted** to `.rag/config.json` (gitignored). Restarting the server keeps them.
- The API key is never written to disk — `state-store.ts` strips `models.apiKey` before saving; keys come from env (`LOCAL_LLM_API_KEY`) or the console session only.
- Embedding and reranker providers are rebuilt automatically when the relevant model settings change; the query cache is cleared on any config update, index sync, document deletion, or content save, so answers can't go stale across changes.
- Console "Save & Apply" reports exactly what the server confirmed: success only when the reload endpoint acknowledged the load; a warning otherwise.

### Embedding degradation (hash fallback)
- If the embedding server is unreachable or returns an error, the provider substitutes deterministic hash vectors so indexing can finish.
- Fallback vectors are **never cached**, and a one-time loud warning is logged. `GET /api/rag/status` reports `embedding.mode` (`server` | `hash-fallback` | `unknown`) plus a fallback counter.
- Retrieval quality in `hash-fallback` mode is degraded — the KB answers are still grounded by BM25, but dense similarity is noise. Re-index after fixing the server to replace fallback vectors.

### Admin auth
- `ADMIN_PASSWORD` gates every mutating RAG route, content save/upload, and the eval suite. In production an unset password **fails closed** (no admin sessions); development falls back to `admin` with a console warning.
- The console stores the verified password in `sessionStorage` and sends it as `Authorization: Bearer …`.

### GitHub Pages static export
- With `NEXT_PUBLIC_DEPLOY_TARGET=gh-pages`, the four public GET routes (`status`, `config`, `documents`, `models`) are baked at build time by `lib/rag/gh-pages-stubs.ts` into neutral offline payloads — no hardware details, no keys, `isServerConnected: false`. Mutating routes do not exist on the static site.
- Static export requires `export const dynamic = "force-static"` on **every route module that exports a GET handler**; Next then blanks request headers for that module on any build. That is why mutations live on separate POST/DELETE-only modules (`config/update`, `documents/delete`, `models/reload`, `eval`, `index`, `reindex`), which the export skips: they stay dynamic and header auth works. The frozen-GET limitation only applies to a `next start` server build; `next dev` (the local admin console's native mode) is fully live.
