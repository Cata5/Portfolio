# RAG & Admin System Audit

**Repo:** `D:\proiecte\Portfolio`  
**Date:** 2026-10-17  
**Method:** full source read of `lib/rag/**`, `app/api/**`, `components/{rag,admin,editor}/**`, `scripts/**`, `docs/**`; `npx tsc --noEmit`; `npm run rag:index`; `npm run rag:test`; live HTTP probes against the already-running dev server (`localhost:3000`) and the local Unsloth Studio server (`127.0.0.1:8888`); git state review.  
**Changes made:** none. During the unauthenticated-mutation proof, `models.temperature` was set `0.2 → 0.19 → 0.2` on the running dev process (in-memory only) and the hit-LLM-a-non-existent-document DELETE deleted nothing.

---

## A. Executive summary

The system is **half-real and half-displayed**. The index/retrieval half genuinely runs (scanner → chunker → BM25 + vectors → RRF → reranker → budget → grounded prompt → citation validation). The other halves are broken, decorative, or lying about their state:

1. **The assistant's happy path is broken right now and fails in layers.** The hardcoded Unsloth key (`config.ts:32`, `config.ts:85`, `models/route.ts:7`) is rejected with 401, so every chat request ends in a 500; the auto-load recovery never fires because the retry matches `"No model loaded"` while the server says `"No model is **loaded**"`; and the health check probes `/v1/models` *with* that bad key, so `isServerConnected:false` is reported even though the server is up.
2. **The API has no authorization on the RAG engine.** Every `/api/rag/*` mutating route is open (`verifyAdminAuth` is used only by `content/save`, `content/upload`, `auth/verify`). Runtime-proved: unauthenticated `POST /api/rag/config` mutated the live config, and unauthenticated `DELETE /api/rag/documents` executed. The admin console's password gate is client-side only.
3. **`GET /api/rag/status` leaks the API key in plaintext** (`route.ts:15` spreads the config without `stripSecrets`, unlike the config route). This was runtime-confirmed: the literal `sk-unsloth-…26` appeared in the response. Query errors also echo the internal URL and upstream body to callers.
4. **Embeddings are silently faked when the server is unwell.** `/v1/embeddings` returns HTTP 503 today; the provider quietly substitutes deterministic hash vectors and caches them with no TTL or origin tag, so they shadow real vectors for the whole process lifetime. Retrieval/tests "pass" while measuring hash noise + BM25.
5. **"Apply settings" — and most of the console — reports success that was never verified.** Reindex feedback, model restart, hyperparameter apply, and the eval "Citation Accuracy 100%" are all unconditional; embedding/reranker config changes are accepted but ignored until restart; config itself is in-memory only and resets on restart.
6. **Several advertised features are no-ops or unreachable:** parent-child context expansion (chunker never populates `sections`), chunker/reranker config knobs, the persistence layer (`state-store.ts`, `qdrant-store.ts` never imported), the query cache (write-only for the only caller), and multi-turn chat history (never sent — stale closure).

**Deployment stance:** don't deploy a non-static, network-reachable build without first fixing S1–S3. The GitHub Pages static export is currently safe **because of the stubs** (`gh-pages-stubs.ts`), not because the real routes are safe.

---

## B. Architecture & execution map

### B.1 Nominal pipeline (as designed)

```mermaid
flowchart LR
  subgraph ING[Ingestion — npm run rag:index / POST /api/rag/reindex]
    SC[portfolio-scanner.ts<br/>FIXED list of 24 paths] --> PR[parsers]
    PR --> CH[markdown-chunker<br/>sections: [] always]
    CH --> EM[embedBatch]
    EM -->|"server ok"| VS[(memory vector store)]
    EM -->|"server fail → silent"| HASH[deterministic hash vectors<br/>qwen-embedding.ts:132]
    HASH --> VS
    CH --> BM[(BM25 index)]
    CH --> RG[(document registry)]
    CH -.->|"empty sections"| PC[parentChildManager]
  end
  subgraph QRY[Query — POST /api/rag/query]
    Q[query] --> NORM[normalize + multi-query variants]
    NORM --> DEN[dense retrieval<br/>provider frozen at module load]
    Q --> BMQ[BM25 retrieval]
    DEN --> RRF[RRF fusion] --> RR[reranker<br/>provider frozen at module load]
    BMQ --> RRF
    RR --> BUD[assembleContext<br/>parent expansion = no-op]
    BUD --> GEN[generation<br/>provider refreshed per config]
    GEN -->|"TODAY: HTTP 401"| CIT[citation validation] --> OUT[answer + citations]
  end
  subgraph ADM[Admin console /admin — 9 views]
    UI[admin-console.tsx] -->|"NO server auth"| API[/api/rag/*/]
    UI -->|"Bearer token"| CS["/api/content/save + upload"]
    API --> LEAK["/api/rag/status → leaks apiKey"]
    API --> MEM["/api/rag/config → in-memory only"]
    API --> REL["/api/rag/models reload → proxied,<br/>result ignored by UI"]
  end
```

### B.2 Runtime state observed (2026-10-17)

| Component | State |
|---|---|
| Dev server `:3000` | Running (pre-existing, this repo). Routes redirect 308 → trailing slash (`next.config.ts` `trailingSlash:true`). |
| Unsloth Studio `:8888` | Up. 3 models listed, **all `loaded:false`**. `/v1/models`: 200 without key, **401 with the hardcoded key**, `/v1/chat/completions`: 401 (key) / 400 "No model is loaded…" (keyless), `/v1/embeddings`: **503 "No GGUF model loaded"**. |
| Index | 24 docs / 230 chunks / 230 lexical chunks (from `npm run rag:index`, 13.4 s; same via `/status`). |
| Config in the running process | Non-default vs `getDefaultRAGConfig()`: model `Qwen3.5-0.8B.Q4_K_M`, maxTokens 3072, frequency/presence 0.05, context 8192 — memory-only, lost on restart. |
| `.env.local` | Only `NEXT_PUBLIC_GOOGLE_SCRIPT_URL`; no `LOCAL_LLM_API_KEY`, no `ADMIN_PASSWORD`. |
| Git | HEAD `fe9db95`; uncommitted console refactor (S×). |

---

## C. Findings

Severity: **Critical / High / Medium / Low / Info**. Verification: **[R]** = reproduced at runtime, **[C]** = code-inspected only.

### C.1 Security & secrets

| ID | Sev | Finding | Evidence | Failure point / impact | Ver. | Fix |
|---|---|---|---|---|---|---|
| S1 | **Critical** | All `/api/rag/*` mutating + eval + models routes lack server-side auth. | `verifyAdminAuth` only in `app/api/content/save/route.ts:4,24`, `upload/route.ts:4,21`, `auth/verify/route.ts:2,8` — none under `app/api/rag/`. Runtime: `POST /api/rag/config {}` → 200; `POST /api/rag/config {"models":{"temperature":0.19}}` → 200 and **mutated** the live process; `DELETE /api/rag/documents` fake id → 404 (handler ran). | Anyone who can reach the port can rewrite engine config, wipe/rebuild the index, select models/keys, invoke 17-query eval (LLM cost), delete documents. Console gate is client-side only. | **[R]** | Wrap every mutating handler with `extractBearerToken` + `verifyAdminAuth`; require `ADMIN_PASSWORD`; fail closed when unset in non-dev. |
| S2 | **High** | `GET /api/rag/status` returns `models.apiKey` + internal base URLs + hardware. | `app/api/rag/status/route.ts:15` (`...status` spread, no `stripSecrets`; contrast `config/route.ts:12` which strips). Runtime: response contained `"apiKey":"sk-unsloth-…26"`. Query errors leak internals too: `query/route.ts:74-79` → 500 body with full upstream URL + 401 text. | Secret disclosure to any caller; facilitates S1 abuse. (GH Pages bake leak is separately mitigated by stubs.) | **[R]** | `stripSecrets` on status (and anywhere config is serialized); return generic client errors, log details server-side. |
| S3 | **High** | Stale Unsloth key hardcoded in three places. | `lib/rag/config.ts:32`, `config.ts:85`, `app/api/rag/models/route.ts:7`. | 401 on every generation; key is invalid (Runtime probe). | **[R]** | Delete literals; env-only; rotate. |
| S4 | **Medium** | Admin password defaults to `"admin"`. | `lib/auth-guard.ts:9` (`process.env.ADMIN_PASSWORD || "admin"`); no `ADMIN_PASSWORD` in `.env.local`. | Default credentials for content save/upload (the only guarded routes). | **[C]**+env | Fail closed when unset (non-dev); document setup. |
| S5 | **Low** | Upload allows `image/svg+xml`. | `app/api/content/upload/route.ts:12`; files written under `public/`. | SVG can carry script; served same-origin. Admin-only path, low. | **[C]** | Drop SVG or sanitize. |
| S6 | **Low** | Injection guard is advisory: never blocks, never logs; `sanitizeTextForPreview` unused. | `rag-facade.ts:115` (result only gates cache writes, `:281`), `security/injection-guard.ts:11-24`, `security/sanitizer.ts:1` (no refs). | "Security boundaries" messaging is decorative. | **[C]** | Block/log, or relabel as heuristic. |

### C.2 Broken & silently-wrong behavior

| ID | Sev | Finding | Evidence | Failure point / impact | Ver. | Fix |
|---|---|---|---|---|---|---|
| B1 | **Critical** | Chat path is broken: 401 → HTTP 500 for every query; recovery logic can never fire. | `qwen-generator.ts:144-147` (401 → raw error). Retry conditions `:131` and `:206` match `"No model loaded"`; server says `"No model is **loaded**"` → never matched. Auto-load `:59-62` would send the same bad key. Runtime: `POST /api/rag/query {stream:false}` → `500 {"error":"[RAG LLM] http://127.0.0.1:8888/v1/chat/completions returned HTTP 401: … Invalid or expired API key …"}`; `npm run rag:test` → 33/34 asserts then E2E #10 threw on 401, exit 1. | Primary user feature dead; recovery path unreachable. | **[R]** | Fix match (`/No model.*loaded/` or structured check), handle 401 distinctly, clear/rotate key, load a model. |
| B2 | **High** | Health check conflates "auth broken" with "server down"; status misleading. | `rag-facade.ts:311` → `qwen-generator.ts:36-49` (`GET /models` with `Authorization: Bearer <stale key>`). Runtime: keyless `/v1/models` = 200; with key = 401 → `isServerConnected:false` while server and models-list are fine. | Operators chase "offline server" instead of "bad key". | **[R]** | Report tri-state: reachable / authorized / model-loaded. |
| B3 | **High** | Embedding failures are silent and cached, poisoning retrieval until restart. | `qwen-embedding.ts:118-135` (any failure → `generateDeterministicEmbedding`, cached at `:134`), `embeddings/cache.ts:8-27` (no TTL, key = model+dim+text, no origin tag). Batch path `:176-187` accepts partial/out-of-order `data.data` without length/index validation → `undefined` holes; `pipeline.ts:74` stores `vector: vectors[idx]` unchecked. Runtime: `/v1/embeddings` = 503 with and without key → fallback is the active path today. Default embedding auth key is `"lm-studio"` (`:72`). | Semantic quality can't be claimed; a cache filled while the server was down shadows real embeddings later; partial responses can corrupt the store. | **[R]** (503), **[C]** (cache/partial) | Log + surface fallback in status; don't cache fallback (or tag origin & re-embed); validate `data.length === inputs.length` and honor `data[j].index`; fail indexing loud. |
| B4 | **High** | Multi-turn history is never sent to the server (stale closure). | `rag-context.tsx:201-228` reads `messages` to build `currentHistory`; `sendMessage` is `useCallback(..., [])` at `:337` → closure frozen at first render where `messages` = [welcome] → history always `[]`. Facade supports history (`rag-facade.ts:129-131`) but never receives it. | Chat is stateless; follow-ups ("and its tech stack?") lose context; `history` handling untestable in-app. | **[C]** | Use functional updates / ref for history, or include `messages` via ref. |
| B5 | **Medium** | Query cache: write-only for the only caller, never invalidated. | Chat sends `debug:true` (`rag-context.tsx:240`) → read skipped (`rag-facade.ts:91`) but write still happens (`:281-288`). `queryCache.clear()` has **no callers** (`query-cache.ts:69-73`; grep). Config updates and reindex don't touch it. | Non-chat/API consumers can get 10-min-stale answers across config/index changes; cache stats shown in consoles are misleading. | **[C]** | Decouple `debug` from cache; invalidate on config/reindex/content change; skip writes in debug. |
| B6 | **Medium** | Config changes are partly ignored and reset on restart. | In-memory only: `config.ts:79` (module-level `activeConfig`), no persistence; `state-store.ts` never imported (see D1). Embedding+reranker providers built once at module load: `ingestion/pipeline.ts:30-37` + singleton `:148`; `retrieval/hybrid-retriever.ts:47-63` + singleton `:248`. Only the generator refreshes (`rag-facade.ts:55-68`). Runtime: live process holds non-default model/temperature/maxTokens (see B.2) — memory-only. | Settings UI implies hot-apply; retrieval/reranker edits do nothing until restart; restart silently reverts to defaults. | **[R]**+[C] | Rebuild providers on config change (getter pattern like generator) or clearly persist config + document restart. |
| B7 | **Medium** | Parent-child context expansion is a no-op while reported as enabled. | `markdown-chunker.ts:148,307` (`sections` declared, never pushed, returned empty); `pipeline.ts:60-65` registers empty map; `parent-child.ts:26-34` falls back to chunk; `budget.ts:44-46` calls it; `enableParentContextExpansion` default true (`config.ts:65`). Also `budget.ts:88` `availableForGeneration` = `max(512, reserved)` — a constant, not remaining budget. | Docs/UI advertise hierarchical expansion; retrieval gets none; debug token budget is misleading. | **[C]** | Populate sections in the chunker (heading → content map) or remove flag + claims. |
| B8 | **Medium** | Indexing covers a fixed list of 24 files; console-edited stores are invisible to RAG. | `portfolio-scanner.ts:24-56` (hardcoded). Verified **not** indexed: `content/roadmap.json`, `content/sections.json`, `content/offline-themes.json`, `data/roadmap.ts` — all exist and are edited by the console editor (`editor-context.tsx:21-23,29`). `indexing.autoScanIntervalMinutes` = 0 and never consumed. Missing files silently skipped (`:74-76`). | RAG can never answer about (or cite) roadmap, page structure, or standby copy; "Knowledge base" view cannot show them; edits don't propagate. | **[C]** | Extend/glob with allowlist + warnings for missing; optionally re-sync on content save. |
| B9 | **Low** | Config knobs accepted but unused. | Chunker called without options: `parsers/markdown.ts:17-23`, `parsers/json.ts:203` → `context.targetChunkTokens/chunkOverlapTokens`, `indexing.chunkSizeTokens/chunkOverlapTokens/batchSize/enable*` are decorative; reranker `batchSize` (`config.ts:58`, `types/config.ts:28`) unused — `embedBatch` hardcodes 16 (`qwen-embedding.ts:139`). `indexing.*` appears only in config.ts/types (grep). | Admins tune settings that do nothing. | **[C]** | Thread config through, or delete the knobs from the UI/schema. |
| B10 | **Low** | `GET /api/rag/eval` runs the full 17-query benchmark — a state-changing, expensive GET. | `app/api/rag/eval/route.ts:7-29`; dataset size 17 (`evaluation/dataset.ts`, counted). No auth (S1), no caching. | Anyone can trigger LLM-cost runs via a GET (CSRF-able). | **[C]** | POST-only, auth, rate-limit/cache. |

### C.3 Dead, disconnected, or unused code

| ID | Sev | Item | Evidence | Impact | Fix |
|---|---|---|---|---|---|
| D1 | **Medium** | Persistence layer never wired. | `storage/state-store.ts` (`stateStore` at `:49`) and `storage/qdrant-store.ts` (`QdrantVectorStore` at `:20`) have zero imports anywhere (grep finds only their own definitions). Registry, vectors, BM25, caches are all in-memory singletons. | No durability by design or accident; dead code implies intent; B6 amplifies. | Delete, or wire `stateStore` for config + index persistence. |
| D2 | **Low** | Security helpers unused. | `sanitizeTextForPreview` (`sanitizer.ts:1`) unreferenced; `isPathSafe` (`path-guard.ts:3`) referenced only by `scripts/run-rag-tests.ts:138-139`. Production file access uses the fixed scanner list instead. | Dead weight; tests exercise code that never ships. | Delete or integrate into scanner/upload. |
| D3 | **Low** | Exposed-but-unused endpoints. | No client calls `POST /api/rag/index` (UI calls `reindex` only — grep) or `DELETE /api/rag/documents` (no `method:"DELETE"` in components). Docs advertise both. | Extra unauthenticated attack surface. | Auth + keep for CLI parity, or remove. |
| D4 | **Info** | `hardware.recommendedBatchSize/recommendedMaxContext` presented in status but never consumed by the pipeline. | `rag-facade.ts:315`, detector output only. | Cosmetic. | Use where relevant or label as advisory. |

### C.4 Admin console misreporting (user-visible lies)

| ID | Sev | Item | Evidence | Impact | Fix |
|---|---|---|---|---|---|
| U1 | **Medium** | Reindex success is unconditional; console "Sync index" gives no feedback at all. | `overview-panel.tsx:54-63` sets "Portfolio synced…" in `finally`-ish flow; `triggerReindex` swallows all failures and returns void (`rag-context.tsx:127-137`); console button `admin-console.tsx:116-123` just stops spinning. | Users believe edits are indexed when the sync may have failed. | Return result (counts/errors), surface it. |
| U2 | **Medium** | Model "restart"/hyperparameter apply reports success regardless of outcome. | `settings-view.tsx:121-183` — `setSavedSuccess(true)` at `:168` before knowing reload result; fallback message claims "successfully restarted & online" (`:171`); `overview-panel.tsx:66-84` same pattern. `/api/rag/models` returns `reload:null` on any non-OK load (`models/route.ts:110-132,143-153`). Also Settings silently overwrites embedding/reranker base URLs with the generation URL (`settings-view.tsx:130-131`). | Admins can't tell a dead engine from a working one. | Gate messaging on payload; separate statuses; don't clobber sibling URLs. |
| U3 | **Medium** | Eval summary asserts uncomputed results. | `eval-view.tsx:70-74` hardcodes "Citation Accuracy 100% / Zero Hallucinations"; `:54` "Highest MRR" / `:62` "Top Recall@5" assert superiority without comparing; `:64-66` shows `bm25Only` value under "BM25 / Hybrid". Values otherwise come from the real runner (`evaluation/runner.ts`). | Benchmark surface overstates certainty (and currently measures hash-embedding retrieval, B3). | Compute or label "target"; pick actual best config. |
| U4 | **Low** | KB rows show a static "indexed" badge; no per-document actions. | `kb-view.tsx:139`; no delete/refresh UI despite API. Scanner's silent skips mean missing files are invisible (`:74-76`). | Misleading completeness signal. | Derive status; add actions/empty-state diagnostics. |
| U5 | **Low** | "Back to Chat" looks dead inside the console. | `source-view.tsx:35` calls `setActiveTab("chat")` only (never `setIsOpen`); console embeds it at `admin-console.tsx:459` where the modal isn't open. | Confusing affordance. | `setChatOpen(true)` or relabel. |

### C.5 Docs & tests drift

| ID | Sev | Item | Evidence | Fix |
|---|---|---|---|---|
| X1 | **Medium** | `docs/RAG_ARCHITECTURE.md` diverges from code. | `:112` documents `DELETE /api/rag/document/:id` (actual: `DELETE /api/rag/documents` with `{id}`); `:122` "36 tests" (script has 37 `assert(` sites; run showed 33/34 passed then crash); `:47` advertises parent-child expansion (no-op, B7); `:100-102` static benchmark table incl. 100% citation accuracy presented as results; no mention of hash fallback or in-memory config. | Regenerate or annotate stale sections; add CI doc check if practical. |
| X2 | **Medium** | `npm run rag:test` hard-fails in normal dev environments. | E2E #10 requires a live, keyed LLM; observed crash: `HTTP 401 … Invalid or expired API key` → exit 1 after 33/34 assertions. | Skip/mock when `/models` unhealthy; assert the graceful-error path instead. |
| X3 | **Info** | Uncommitted console refactor in the tree. | `git status`: modified `app/admin/page.tsx`, `app/admin/rag/page.tsx`, `components/admin/sections-manager.tsx`, `components/editor/editor-bar.tsx`; deleted `admin-dashboard.tsx`, `rag-admin-dashboard.tsx`; untracked `admin-console.tsx`, `console-ui.tsx`, `console-views.ts`, `panels/`. | Commit once verified (or stash) so HEAD builds include the console. |

---

## D. Admin functionality inventory

Nine console views (`console-views.ts:38-99`) + inline editor. "Real" = does what it says; classification per item.

| # | Surface / action | What it does (data path) | Classification | Evidence |
|---|---|---|---|---|
| D-1 | Console gate: unlock | `POST /api/auth/verify` → `verifyAdminAuth`; stores the **raw password** in `sessionStorage` as the bearer token. | **Working, weak storage** | `admin-console.tsx:105-114`, `editor-context.tsx:247-272` (token at `:262`), `auth-guard.ts:9` (default `admin`). |
| D-2 | Global: Save changes | Serializes whole content store → `POST /api/content/save {stores}`; server writes per-store JSON files; **server-auth enforced**; unknown stores silently skipped. | **Working** | `editor-context.tsx:295-333`, `save/route.ts:6-67` (`VALID_STORES`, `:53-58` skip). |
| D-3 | Global: Sync index | `POST /api/rag/reindex` → `forceReindex=true`; failures swallowed; no result surfaced. | **Disconnected feedback** | `admin-console.tsx:116-123`, `rag-context.tsx:127-137`, `reindex/route.ts:4-12`. |
| D-4 | Global: Open assistant / live site / lock | Opens RAG modal / external link / clears session. | **Working** | `admin-console.tsx:403-430`. |
| D-5 | Overview: engine status cards | `GET /api/rag/status` → hardware, model, counts, cache; rail dot = `isServerConnected`. | **Real data, semantics flawed** (B2, S2) | `overview-panel.tsx:36-52`, `rag-facade.ts:305-329`. |
| D-6 | Overview: Sync portfolio button | `triggerReindex()` → unconditional "Portfolio synced to the vector and lexical index." | **Misreported success** | `overview-panel.tsx:54-63`. |
| D-7 | Overview: Restart model | `POST /api/rag/models {reload:true}` → proxies Unsloth `/api/inference/load`; message falls back to "Model instance restarted…" even when `reload:null`. | **Misreported success** | `overview-panel.tsx:66-84`, `models/route.ts:110-132,143-153`. |
| D-8 | Overview: navigation cards | `onNavigate` → deep-links `?tab=…`. | **Working** | `admin-console.tsx:442`, `:79-103`. |
| D-9 | Pipeline & traces | Renders last chat `diagnostics` (fused/reranked lists, timings, token budget); empty until a chat query ran; debug data only because chat forces `debug:true`. | **Working when used; inert otherwise** | `pipeline-view.tsx:6-25`, `rag-context.tsx:240`. |
| D-10 | Evaluation: run benchmark | `POST /api/rag/eval` → 5 configs × 17 queries (A–E); real runner. Numbers currently reflect hash-vector retrieval (B3). | **Real, degraded by B3** | `eval/route.ts:19-29`, `evaluation/runner.ts`, dataset count 17. |
| D-11 | Evaluation: summary cards | "Citation Accuracy 100%" hardcoded; MRR/Recall labels assertive; caption mismatch. | **Misleading** | `eval-view.tsx:54-74`. |
| D-12 | Knowledge base: document table | `GET /api/rag/documents` → registry; chunk/token counts real; per-row "indexed" badge static; no delete/refresh rows. | **Real list, static status** | `kb-view.tsx:119-143`, `rag-facade.ts:301-303`. |
| D-13 | KB: expected coverage | Scanner's 24 paths only; roadmap/page-sections/offline-themes absent → console edits to those stores never appear. | **Disconnected** | `portfolio-scanner.ts:24-56` vs `content/*.json` list; B8. |
| D-14 | Source explorer | Shows citation preview/file path; copy button works. | **Working** | `source-view.tsx:23-44`. |
| D-15 | Source: "Back to Chat" | Switches RAG active tab; modal not opened from console context → appears dead. | **Mismatched affordance** | `source-view.tsx:35`, `admin-console.tsx:459`. |
| D-16 | Models: fetch/select models | `POST /api/rag/models` (list) → real Unsloth `/models`; shows loaded/quant; failure returns HTTP 200 `success:false` (UI maps to "No models returned"). | **Working (odd error channel)** | `settings-view.tsx:62-87`, `models/route.ts:44-54` (`status:200` on error). |
| D-17 | Models: Test connection | Same `fetchModels`; honest success/failure chip. | **Working** | `settings-view.tsx:185-200`. |
| D-18 | Models: Save & Apply Hyperparams | `updateConfig` → in-memory config (partial effect, B6); then `models {reload:true}`; success unconditional; clobbers embedding/reranker base URLs with generation URL. | **Partially effective, misreported** | `settings-view.tsx:121-181` (`:130-131`, `:168`, `:171`). |
| D-19 | Sections manager | Add/edit/duplicate/delete/reorder/hide homepage sections → editor store → `sections.json` on Save (auth). Not RAG-indexed. | **Working for the site; disconnected from RAG** | `sections-manager.tsx:28-60`, `save/route.ts:16`. |
| D-20 | Identity & links | Edits `site.json` fields → Save (auth). site.json **is** RAG-indexed but not auto re-synced. | **Working; stale index until manual reindex** | `site-panel.tsx:11-70`, scanner `:36`. |
| D-21 | Deploy & offline mode: simulation | Client-only "glitch/simulated 503" preview (`use-glitch-mode`); does not build/validate the GH Pages export. | **Preview only** | `ops-panel.tsx:51-80`, `use-glitch-mode` import; `console-views.ts:93-98`. |
| D-22 | Ops: standby preset + copy | Presets switch standby UI style; copy edits → `offline-themes.json` → Save (auth). Not RAG-indexed. | **Working for deploy UI; disconnected from RAG** | `ops-panel.tsx:122-289`, `save/route.ts:17-18`. |
| D-23 | Inline editor (public site) | Same auth/save path as D-2; uploads via `content/upload` (mime/size/folder/filename sanitization). | **Working** | `upload/route.ts:20-71`; `editor-bar.tsx` (modified, uncommitted). |
| D-24 | `/admin/rag` legacy URL | Hard redirect → `/admin/?tab=rag-pipeline`. | **Working** | `app/admin/rag/page.tsx:16-19`. |

---

## E. Verification log & limitations

### Executed (evidence trail)

1. `npx tsc --noEmit` → exit 0 (clean).
2. `npm run rag:index` → 24 docs / 230 chunks, 13 426 ms.
3. `npm run rag:test` → 33/34 assertions passed, then E2E #10 threw `HTTP 401 {"error":{"message":"Invalid or expired API key",…}}`, exit 1.
4. `POST /api/rag/query {stream:false}` → `500` with upstream 401 + internal URL.
5. `GET /api/rag/status` → `200`, body includes the hardcoded **apiKey**, `isServerConnected:false`, counts 24/230/230.
6. Unauthenticated `POST /api/rag/config {}` → 200; `{temperature:0.19}` → 200 and visible in a follow-up `GET /api/rag/config`; restored to 0.2.
7. Unauthenticated `DELETE /api/rag/documents {id:"__audit_nonexistent__"}` → `404 "Document not found"` (handler ran, deleted nothing).
8. LLM probes: `/v1/models` 200 keyless / 401 with key (3 models, all unloaded); `/v1/embeddings` 503 keyless and keyed; `/v1/chat/completions` 401 keyed.
9. Dev-server requests 308-redirect to trailing slash (`trailingSlash:true`).

### Not verified (and why)

- **GitHub Pages static export build** was not re-run (`NEXT_PUBLIC_DEPLOY_TARGET=gh-pages npm run build`). Stub safety (`gh-pages-stubs.ts`) is code-inspected; the historical "key baked into out/" leak is guarded by those stubs, but no build artifact was audited today.
- **Production server semantics** (`dynamic="force-static"` routes outside dev) untested; findings about the live routes are dev-runtime.
- **Browser UI behavior** was not re-driven; console-view findings are code inspection of the logic that renders them.
- **Live embedding/reranker quality** is unmeasurable in the current server state (no GGUF model loaded → embeddings 503 → hash fallback; reranker path never reached because generation 401s first). The reranker's failure behavior with a loaded model remains unknown.
- **Intent questions**: whether `roadmap/sections/offline-themes` *should* be RAG-visible is a product decision; the audit treats it as a gap because the console presents one "whole-system" knowledge base and the scanner silently omits console-edited stores.

---

## F. Prioritized remediation

**P0 — before any non-static deployment**

1. Add server auth to all `/api/rag/*` mutations (`config`, `index`, `reindex`, `documents` DELETE, `models`, `eval`) and fail closed when `ADMIN_PASSWORD` is unset; consider namespacing under `/api/admin/`.
2. Stop secret/internal leakage: `stripSecrets` on `/status`, generic client-facing errors, rotate the leaked key, delete the three hardcoded literals.
3. Restore generation: valid key via env (or keyless loaded model), fix the retry match (`/No model.*loaded/i`), distinguish 401 from 400.
4. Make embedding degradation loud: log + status flag, don't cache fallback vectors (or tag + re-embed), validate batch responses (`length`, `index`), fail indexing when the server is required-but-down.

**P1 — trusting the console**

5. Fix chat history (stale closure) and assess cache policy (read/write/invalidate).
6. Make provider instances config-reactive or clearly persist config + show "restart required".
7. Bind all success messaging (reindex, reload, apply, eval cards) to actual payloads; fix "100%"/"Highest" claims.
8. Decide persistence: wire `state-store` (config + index) or delete it and document in-memory limits.

**P2 — completeness & hygiene**

9. Index coverage: dynamic/allowlisted content set incl. roadmap/sections/offline-themes + missing-file warnings; optional re-sync after content save.
10. Parent-child expansion: implement `sections` collection or drop the flag + docs claims; fix `availableForGeneration`.
11. Prune/connect dead code (`sanitizeTextForPreview`, `isPathSafe`, unused knobs, unused endpoints) and sync `docs/RAG_ARCHITECTURE.md`.
12. Make `rag:test` env-tolerant (skip/mocked E2E; assert graceful 401 handling), and commit the console refactor (X3).

### Regression tests to add

- Auth matrix: every mutating route → 401 without token, 200 with (route-handler level).
- Secret scan: `/api/rag/status` response must not match `/sk-|apiKey/`.
- Generator: mock 400 `"No model is loaded"` → auto-load attempted once; mock 401 → typed auth error surfaced.
- History: two chat turns → second request body includes the first turn (component test with mocked fetch).
- Cache: `debug:true` does not write; config update/reindex invalidates; non-debug read returns cached.
- Embeddings: partial server response (`n-1` vectors) → no `undefined` vectors stored; fallback not cache-shared with real vectors.
- Embedding fallback visibility: status exposes `embeddingMode: server | hash-fallback`.
- Reindex failure: HTTP 500 → UI shows error, not success.
- Scanner: content-store parity test (every `VALID_STORES` file is either indexed or explicitly excluded with a reason).
