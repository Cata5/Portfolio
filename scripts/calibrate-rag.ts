/**
 * RAG calibration harness.
 *
 * Runs three passes against the live local stack so prompt / config tuning can
 * be judged from evidence instead of vibes:
 *
 *  1. Foundation  — embedding provider health, index counts, and per-dataset
 *                   retrieval recall (did we even fetch the right documents?).
 *  2. Generation  — full grounded answers through the real facade for the
 *                   ground-truth dataset plus identity / navigation probes.
 *  3. Scoring     — artifact leakage (raw and post-sanitize), citation use,
 *                   keyword coverage, refusal and persona correctness.
 *
 * Usage:  npx tsx scripts/calibrate-rag.ts [--only=<substring>]
 * Report: written to the OS temp dir; the path is printed at the end.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { rag } from "../lib/rag/rag-facade";
import { getRAGConfig } from "../lib/rag/config";
import { defaultVectorStore } from "../lib/rag/storage/memory-store";
import { generateDeterministicEmbedding } from "../lib/rag/embeddings/qwen-embedding";
import { resolveNavigationActions } from "../lib/rag/navigation-helpers";
import { hybridRetriever } from "../lib/rag/retrieval/hybrid-retriever";
import { assembleContext } from "../lib/rag/context/budget";
import { PORTFOLIO_EVALUATION_DATASET } from "../lib/rag/evaluation/dataset";
import { sanitizeAssistantContent } from "../lib/rag/chat-format";
import type { EvalQuery } from "../lib/rag/types/evaluation";

interface ProbeCase {
  id: string;
  query: string;
  /** Case must be answered with the not-enough-information refusal. */
  shouldRefuse?: boolean;
  /** Case must not impersonate the portfolio owner. */
  expectAssistantPersona?: boolean;
  /** Every keyword is expected somewhere in the answer. */
  expectKeywords?: string[];
  /** Navigation the model must trigger when navigation was requested. */
  expectNav?: string;
}

const EXTRA_CASES: ProbeCase[] = [
  { id: "probe_identity", query: "Who are you?", expectAssistantPersona: true },
  { id: "probe_impersonation", query: "Are you Catalin?", expectAssistantPersona: true },
  { id: "probe_latest", query: "What is the latest project?", expectKeywords: ["CataAI"] },
  { id: "probe_flagship", query: "What is the hardest project?", expectKeywords: ["Vortex"] },
  {
    id: "probe_nav_project",
    query: "Open the project page for Vortex",
    expectNav: "/projects/vortex",
  },
  { id: "probe_capabilities", query: "What can you help me with?", expectAssistantPersona: true },
];

/** Artifact families small local models leak into answers. */
const ARTIFACT_PATTERNS: { name: string; re: RegExp }[] = [
  { name: "action-tag", re: /\[ACTION:[^\]]*\]/i },
  { name: "scaffolding-tag", re: /<\/?(?:user_query|retrieved_evidence|conversation_history)>/i },
  { name: "navigation-header", re: /(?:^|\n)\s*[#*]{0,4}\s*navigation(?:\s+action)?\s*:/i },
  { name: "mangled-bold", re: /(?:^|\n)\s*\*[^*\n]{1,80}\*\*/ },
  { name: "leading-answer-label", re: /^\s*#{0,4}\s*\*{0,2}\s*answer\s*:?\s*\*{0,2}/i },
  { name: "evidence-item-leak", re: /\bEVIDENCE ITEM\s*\[?\d/ },
  { name: "citation-header", re: /(?:^|\n)\s*[#*]{0,4}\s*(?:citation|source|reference)s?\s*:/i },
];

const IMPERSONATION_PATTERNS: RegExp[] = [
  /\bI(?:'m| am)\s+(?:Manu\s+)?Catalin(?!'s)\b/i,
  /\bI(?:'m| am)\s+(?:a|an)\s+(?:CTI|computer|informatics|student)\b/i,
  /\bas an?\s+(?:CTI|computer)\s+student\b/i,
];

function findArtifacts(text: string): string[] {
  return ARTIFACT_PATTERNS.filter((p) => p.re.test(text)).map((p) => p.name);
}

function keywordCoverage(answer: string, keywords: string[]): number {
  if (keywords.length === 0) return 1;
  const lower = answer.toLowerCase();
  return keywords.filter((k) => lower.includes(k.toLowerCase())).length / keywords.length;
}

function formatMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

async function main() {
  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const only = onlyArg ? onlyArg.slice("--only=".length) : null;

  console.log("\n🔬 RAG Calibration Harness\n");

  // ------------------------------------------------------------------
  // 1. Foundation
  // ------------------------------------------------------------------
  const status = await rag.getStatus();
  const config = getRAGConfig();
  await rag.ensureInitialized();
  // Re-read status post-index: embedding health and index counts are only
  // meaningful once the chunks have actually been embedded.
  const indexed = await rag.getStatus();
  const embedding = indexed.embedding ?? {
    mode: "unknown" as const,
    serverOk: null,
    fallbackEmbeddings: 0,
    cacheEnabled: false,
  };
  console.log("--- Foundation ---");
  console.log(`  generation model : ${status.models.generationModel}`);
  console.log(`  temperature      : ${status.models.temperature}   maxTokens: ${status.models.maxTokens}   topP: ${status.models.topP}`);
  console.log(`  embedding model  : ${status.models.embeddingModel} (dim ${status.models.embeddingDimension})`);
  console.log(`  embedding health : ${embedding.mode}   serverOk=${embedding.serverOk}   fallbacks=${embedding.fallbackEmbeddings}`);
  console.log(`  reranker         : ${config.reranker.enabled ? "enabled" : "disabled"} (${status.models.rerankerModel}, finalTopK ${config.reranker.finalTopK}, threshold ${config.reranker.minScoreThreshold})`);
  console.log(`  generation conn  : ${status.status} (loaded=${status.models.modelLoaded})`);
  console.log(`  index            : ${indexed.counts.documents} docs / ${indexed.counts.chunks} chunks / ${indexed.counts.lexicalChunks} lexical`);
  console.log(`  context budget   : ${config.context.maxContextTokens} tokens, chunk ${config.context.targetChunkTokens}/${config.context.chunkOverlapTokens}`);

  // A mismatch here means part of the index was built from hash-fallback
  // vectors while the rest used the server — dense ranking is then garbage.
  const dimCensus = new Map<number, number>();
  let fallbackVectors = 0;
  for (const record of defaultVectorStore.exportState()) {
    dimCensus.set(record.vector.length, (dimCensus.get(record.vector.length) ?? 0) + 1);
    const hashVec = generateDeterministicEmbedding(record.chunk.content, record.vector.length);
    if (record.vector.every((v, i) => Math.abs(v - hashVec[i]) < 1e-9)) fallbackVectors++;
  }
  console.log(
    `  vector dims      : ${[...dimCensus.entries()].map(([dim, n]) => `${dim}-dim ×${n}`).join(", ") || "(none)"}`
  );
  console.log(`  hash-fallback vectors: ${fallbackVectors} / ${indexed.counts.chunks}`);

  const retrievalRuns: { id: string; expected: string[]; top: string[]; hit: boolean }[] = [];
  /**
   * Keyword coverage of the assembled evidence per case. This is the ceiling a
   * generation model can reach: text the retriever never surfaced cannot be in
   * the answer, and an expectation absent from the corpus is a stale probe.
   */
  const evidenceCeilings = new Map<string, number>();
  console.log("\n  retrieval recall (top-8 fused/reranked):");
  for (const test of PORTFOLIO_EVALUATION_DATASET) {
    const result = await hybridRetriever.retrieve(test.query, {
      finalTopK: 8,
      enableMultiQuery: true,
      enableReranker: true,
    });
    const top = result.rerankedResults.map((r) => r.chunk.documentId);
    const hit = test.expectedDocumentIds.some((d) => top.includes(d));
    retrievalRuns.push({ id: test.id, expected: test.expectedDocumentIds, top, hit });
    if (test.expectedKeywords?.length) {
      const ctx = assembleContext(result.rerankedResults.map((r) => r.chunk));
      evidenceCeilings.set(test.id, keywordCoverage(ctx.formattedContext, test.expectedKeywords));
    }
    const marker = test.expectedDocumentIds.length === 0 ? "–" : hit ? "✅" : "❌";
    console.log(`    ${marker} ${test.id.padEnd(26)} ${top.slice(0, 3).join(", ")}`);
  }
  const scored = retrievalRuns.filter((r) => r.expected.length > 0);
  const recall = scored.length ? scored.filter((r) => r.hit).length / scored.length : 1;
  console.log(`  → retrieval document hit rate: ${(recall * 100).toFixed(0)}% (${scored.filter((r) => r.hit).length}/${scored.length})`);

  const lowCeiling = [...evidenceCeilings.entries()].filter(([, c]) => c < 1);
  if (lowCeiling.length) {
    console.log("  → expectations not present in the retrieved evidence (stale probes, not model failures):");
    for (const [id, ceiling] of lowCeiling) {
      console.log(`      ${id.padEnd(26)} evidence contains ${(ceiling * 100).toFixed(0)}% of the expected keywords`);
    }
  }

  // Query-time embedding health (the retriever's own provider instance).
  const postQuery = await rag.getStatus();
  const queryEmbedding = postQuery.embedding;
  console.log(
    `  → query-time embedding: ${queryEmbedding?.mode ?? "unknown"} (serverOk=${queryEmbedding?.serverOk}, fallbacks=${queryEmbedding?.fallbackEmbeddings ?? 0})`
  );

  // ------------------------------------------------------------------
  // 2. Generation + scoring
  // ------------------------------------------------------------------
  const cases: ProbeCase[] = [
    ...PORTFOLIO_EVALUATION_DATASET.map((t: EvalQuery) => ({
      id: t.id,
      query: t.query,
      shouldRefuse: t.shouldRefuse,
      expectKeywords: t.expectedKeywords,
    })),
    ...EXTRA_CASES,
  ].filter((c) => !only || c.id.includes(only));

  console.log(`\n--- Generation & Scoring (${cases.length} cases) ---`);

  interface Row {
    id: string;
    ms: number;
    chars: number;
    citations: number;
    sources: number;
    rawArtifacts: string[];
    leftArtifacts: string[];
    kw: number;
    /** Keyword coverage of the retrieved evidence: the ceiling the model can reach. */
    ceiling: number;
    refusalOk: boolean | null;
    personaOk: boolean | null;
    navOk: boolean | null;
    navActions: string[];
    rawTags: string[];
    answer: string;
  }
  const rows: Row[] = [];

  for (const c of cases) {
    const res = await rag.query(c.query, { skipCache: true });
    const answer = res.answer ?? "";
    const sanitized = sanitizeAssistantContent(answer);
    const rawArtifacts = findArtifacts(answer);
    const leftArtifacts = findArtifacts(sanitized);
    const citationCount = (sanitized.match(/\[\d+(?:\s*,\s*\d+)*\]/g) || []).length;
    const kw = keywordCoverage(sanitized, c.expectKeywords ?? []);
    const refused = /not enough information|does not contain|doesn't contain|no information|portfolio documentation|cannot|don't have|do not have|unable to/i.test(sanitized);
    const refusalOk = c.shouldRefuse ? refused : null;
    const personaOk = c.expectAssistantPersona
      ? !IMPERSONATION_PATTERNS.some((p) => p.test(sanitized))
      : null;
    const navActions = resolveNavigationActions(c.query, answer).map((n) => `${n.type}:${n.target}`);
    const navOk = c.expectNav ? navActions.some((n) => n.includes(c.expectNav!)) : null;
    const rawTags = [...answer.matchAll(/\[ACTION:[^\]]*\]/gi)].map((m) => m[0].trim());

    rows.push({
      id: c.id,
      ms: res.timings?.totalMs ?? 0,
      chars: sanitized.length,
      citations: citationCount,
      sources: res.sources?.length ?? 0,
      rawArtifacts,
      leftArtifacts,
      kw,
      ceiling: evidenceCeilings.get(c.id) ?? 1,
      refusalOk,
      personaOk,
      navOk,
      navActions,
      rawTags,
      answer: sanitized,
    });

    const flags: string[] = [];
    if (leftArtifacts.length) flags.push(`artifacts:${leftArtifacts.join(",")}`);
    if (c.expectKeywords?.length && kw < 1) {
      const ceiling = evidenceCeilings.get(c.id);
      flags.push(
        ceiling !== undefined && ceiling <= kw
          ? `kw:${(kw * 100).toFixed(0)}%=ceiling(stale probe)`
          : `kw:${(kw * 100).toFixed(0)}%${ceiling !== undefined ? `/${(ceiling * 100).toFixed(0)}%` : ""}`
      );
    }
    if (refusalOk === false) flags.push("refusal:MISS");
    if (personaOk === false) flags.push("persona:IMPERSONATED");
    if (navOk === false) flags.push(`nav:MISS(${navActions.join(" ") || "none"})`);
    if (rows[rows.length - 1].sources === 0 && !c.shouldRefuse) flags.push("no-sources");

    console.log(
      `  ${flags.length === 0 ? "✅" : "⚠️ "} ${c.id.padEnd(26)} ${formatMs(rows[rows.length - 1].ms).padStart(6)}  ${String(rows[rows.length - 1].chars).padStart(5)}ch  cites=${rows[rows.length - 1].citations}  ${flags.join("  ")}`
    );
  }

  // ------------------------------------------------------------------
  // 3. Summary + report
  // ------------------------------------------------------------------
  const answered = rows.filter((r) => !r.id.includes("out_of_domain") && !r.id.includes("injection"));
  const clean = rows.filter((r) => r.leftArtifacts.length === 0).length;
  const rawDirty = rows.filter((r) => r.rawArtifacts.length > 0).length;
  const cited = answered.filter((r) => r.sources > 0).length;
  const avgKw = answered.reduce((a, r) => a + r.kw, 0) / Math.max(1, answered.length);
  const scoredCeilings = answered
    .filter((r) => evidenceCeilings.has(r.id))
    .map((r) => evidenceCeilings.get(r.id)!);
  const avgCeiling = scoredCeilings.length
    ? scoredCeilings.reduce((a, c) => a + c, 0) / scoredCeilings.length
    : 1;
  const avgChars = Math.round(answered.reduce((a, r) => a + r.chars, 0) / Math.max(1, answered.length));
  const avgMs = Math.round(answered.reduce((a, r) => a + r.ms, 0) / Math.max(1, answered.length));
  const refusals = rows.filter((r) => r.refusalOk !== null);
  const personas = rows.filter((r) => r.personaOk !== null);

  console.log("\n--- Summary ---");
  console.log(`  answers                 : ${rows.length}`);
  console.log(`  artifact-free (rendered): ${clean}/${rows.length}   (raw leaks: ${rawDirty})`);
  console.log(`  answers with sources    : ${cited}/${answered.length}`);
  console.log(`  avg keyword coverage    : ${(avgKw * 100).toFixed(0)}%`);
  console.log(`  evidence keyword ceiling: ${(avgCeiling * 100).toFixed(0)}%   (what the retrieved evidence can support)`);
  console.log(`  avg answer length       : ${avgChars} chars`);
  console.log(`  avg latency             : ${formatMs(avgMs)}`);
  if (refusals.length) console.log(`  refusals handled        : ${refusals.filter((r) => r.refusalOk).length}/${refusals.length}`);
  if (personas.length) console.log(`  persona correct         : ${personas.filter((r) => r.personaOk).length}/${personas.length}`);

  const reportLines: string[] = [
    `# RAG Calibration Report`,
    ``,
    `- generation model: \`${status.models.generationModel}\` (temp ${status.models.temperature}, maxTokens ${status.models.maxTokens}, topP ${status.models.topP})`,
    `- embedding: \`${status.models.embeddingModel}\` dim ${status.models.embeddingDimension} — mode **${embedding.mode}**, fallbacks ${embedding.fallbackEmbeddings}`,
    `- index: ${indexed.counts.documents} docs / ${indexed.counts.chunks} chunks`,
    `- retrieval doc hit rate: **${(recall * 100).toFixed(0)}%**`,
    `- artifact-free: **${clean}/${rows.length}** (raw leaks ${rawDirty})`,
    `- answers with sources: **${cited}/${answered.length}**`,
    `- avg keyword coverage: **${(avgKw * 100).toFixed(0)}%** (evidence ceiling ${(avgCeiling * 100).toFixed(0)}%) · avg length ${avgChars} chars · avg latency ${formatMs(avgMs)}`,
    refusals.length ? `- refusals: **${refusals.filter((r) => r.refusalOk).length}/${refusals.length}**` : "",
    personas.length ? `- persona: **${personas.filter((r) => r.personaOk).length}/${personas.length}**` : "",
    ``,
    `## Retrieval`,
    ``,
    ...retrievalRuns.map(
      (r) =>
        `- ${r.expected.length === 0 ? "–" : r.hit ? "✅" : "❌"} \`${r.id}\` → ${r.top.slice(0, 4).join(", ")}${r.expected.length ? ` (expected: ${r.expected.join(", ")})` : ""}`
    ),
    ``,
    `## Answers`,
    ``,
  ];
  for (const r of rows) {
    reportLines.push(
      `### ${r.id}`,
      ``,
      `- ${formatMs(r.ms)} · ${r.chars} chars · citations ${r.citations} · sources ${r.sources}`,
      `- raw artifacts: ${r.rawArtifacts.length ? r.rawArtifacts.join(", ") : "none"} · post-sanitize: ${r.leftArtifacts.length ? r.leftArtifacts.join(", ") : "none"}`,
      `- nav: ${r.navActions.join(", ") || "none"} · raw tags: ${r.rawTags.join(" ") || "none"}`,
      ``,
      "```",
      r.answer,
      "```",
      ``
    );
  }

  const reportPath = join(tmpdir(), "rag-calibration-report.md");
  writeFileSync(reportPath, reportLines.filter((l) => l !== undefined).join("\n"), "utf8");
  console.log(`\n  report: ${reportPath}\n`);

  if (queryEmbedding && (queryEmbedding.mode !== "server" || queryEmbedding.fallbackEmbeddings > 0)) {
    console.log("  ⚠️  Embedding fallback active — dense retrieval is degraded, fix the server first.\n");
  }
}

main().catch((err) => {
  console.error("Calibration failed:", err);
  process.exit(1);
});
