# Local-First Production RAG Architecture

This document describes the production-quality, local-first Retrieval-Augmented Generation (RAG) system built into Catalin's portfolio.

---

## 1. System Overview & Design Philosophy

The portfolio RAG engine provides grounded, zero-hallucination conversational intelligence over all portfolio data, project analyses, verified technical claims, machine learning experiments, and codebase architecture.

### Key Highlights
- **100% Local Inference**: Zero third-party API dependencies. Fully compatible with LM Studio (`http://127.0.0.1:1234/v1`) and Unsloth / vLLM (`http://127.0.0.1:8000/v1`).
- **Hybrid Retrieval**: Combines Dense Vector embeddings (Qwen3-Embedding / cosine similarity) with an in-memory Okapi BM25 engine with field-specific term boosting.
- **Reciprocal Rank Fusion (RRF)**: Merges dense and lexical candidate pools without arbitrary score calibration ($RRF(d) = \sum \frac{w_i}{k + r_i(d)}$).
- **Cross-Encoder Reranking**: Re-scores top candidates using token coverage and semantic cross-attention.
- **Strict Citation Validation**: Every claim is mapped to bracketed citations (`[1]`, `[2]`), and hallucinated source references are stripped automatically.
- **Prompt Injection Defense**: Multi-layered sanitization, delimiter isolation (`<retrieved_evidence>`), and jailbreak detection.

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
    ├── Hierarchical parent-child context expansion
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
LOCAL_LLM_BASE_URL=http://127.0.0.1:1234/v1
LOCAL_LLM_MODEL=qwen2.5-coder-1.5b-instruct
LOCAL_LLM_TEMPERATURE=0.2
LOCAL_LLM_MAX_TOKENS=1024

LOCAL_EMBEDDING_BASE_URL=http://127.0.0.1:1234/v1
LOCAL_EMBEDDING_MODEL=text-embedding-nomic-embed-text-v1.5
LOCAL_EMBEDDING_DIM=768

RAG_ENABLE_MULTI_QUERY=true
RAG_DENSE_TOP_K=30
RAG_BM25_TOP_K=30
RAG_RRF_K=60
RAG_FINAL_TOP_K=8
RAG_MAX_CONTEXT_TOKENS=3072
```

---

## 4. Benchmark Evaluation Results

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

- `POST /api/rag/query`: Streaming SSE and non-streaming RAG query endpoint.
- `GET /api/rag/documents`: List all indexed documents with chunk counts.
- `POST /api/rag/index`: Incremental SHA-256 sync of all portfolio files.
- `POST /api/rag/reindex`: Full re-indexing of knowledge base.
- `DELETE /api/rag/document/:id`: Remove document from vector and lexical indices.
- `GET /api/rag/status`: Health check, model status, and hardware stats.
- `GET / POST /api/rag/config`: Retrieve or update retrieval hyperparameters.
- `GET / POST /api/rag/eval`: Run multi-configuration benchmark suite.

---

## 6. CLI Tools

```bash
# Run unit test suite (36 tests)
npm run rag:test

# Sync & index portfolio markdown, JSON, and source code
npm run rag:index

# Run benchmark across Configurations A through E
npm run rag:eval
```
