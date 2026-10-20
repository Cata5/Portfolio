/**
 * Generation-parameter sweep for the RAG answer model.
 *
 * The answer prompt is intentionally frozen (prompt edits were measured to
 * collapse quality), so the only levers left for "make the model answer better"
 * are sampling parameters and how much evidence is put in front of it. This
 * harness isolates generation from retrieval: it retrieves once per probe case,
 * then replays the exact production prompts through the chat endpoint for every
 * candidate configuration and scores the raw output.
 *
 * Usage:  npx tsx scripts/tune-rag-generation.ts [--only=params|context|both]
 *         npx tsx scripts/tune-rag-generation.ts --config=baseline   (single row, verbose)
 */
import { rag } from "../lib/rag/rag-facade";
import { getRAGConfig } from "../lib/rag/config";
import { hybridRetriever } from "../lib/rag/retrieval/hybrid-retriever";
import { assembleContext } from "../lib/rag/context/budget";
import { buildGroundedSystemPrompt, buildGroundedUserPrompt } from "../lib/rag/generation/prompts";
import { sanitizeAssistantContent } from "../lib/rag/chat-format";
import { resolveNavigationActions } from "../lib/rag/navigation-helpers";
import type { Chunk } from "../lib/rag/types/document";

interface ProbeCase {
  id: string;
  query: string;
  expectKeywords?: string[];
  shouldRefuse?: boolean;
  expectNav?: string;
}

const PROBE_CASES: ProbeCase[] = [
  {
    id: "vortex_stream",
    query: "How does Vortex handle video streaming and playback on desktop?",
    expectKeywords: ["mpv", "mediamp", "streaming"],
  },
  {
    id: "vortex_downloads",
    query: "Does Vortex support offline downloads and how are they managed?",
    expectKeywords: ["WorkManager", "queue", "pause", "resume", "offline"],
  },
  {
    id: "vortex_protocols",
    query: "Which remote storage protocols does Vortex support for streaming?",
    expectKeywords: ["Google Drive", "SMB", "SFTP", "WebDAV", "FTP"],
  },
  {
    id: "teka",
    query: "What is Aplicatie Teka and what was the main challenge in building it?",
    expectKeywords: ["Teka", "industrial", "machine", "monitoring"],
  },
  {
    id: "ml",
    query: "What machine learning models and experiments has Catalin worked on?",
    expectKeywords: ["YOLO", "PyTorch", "dataset", "training"],
  },
  {
    id: "skills",
    query: "What programming languages does Catalin specialize in?",
    expectKeywords: ["Kotlin", "TypeScript", "Python", "C++", "JavaScript"],
  },
  {
    id: "education",
    query: "Where does Catalin study and what is his degree?",
    expectKeywords: ["ETTI", "CTI", "Bucharest", "Computer", "Information Technology"],
  },
  {
    id: "contact",
    query: "How can I contact Catalin or find his GitHub and LinkedIn?",
    expectKeywords: ["github.com/Cata5", "email"],
  },
  { id: "identity", query: "Who are you?", expectKeywords: ["Assistant"] },
  { id: "latest", query: "What is the latest project?", expectKeywords: ["CataAI"] },
  {
    id: "nav",
    query: "Open the project page for Vortex",
    expectNav: "/projects/vortex",
  },
  {
    id: "refusal",
    query: "What is the capital city of Australia and what is its GDP?",
    shouldRefuse: true,
  },
];

interface SweepConfig {
  name: string;
  /** Evidence blocks kept from the reranked list (default 8 = production). */
  topK: number;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  maxTokens: number;
  /** Evidence serialization: the production fences or a leaner block header. */
  evidenceFormat?: "verbose" | "compact" | "lean";
}

const PARAM_CONFIGS: SweepConfig[] = [
  { name: "baseline", topK: 8, temperature: 0.2, topP: 0.95, frequencyPenalty: 0.05, presencePenalty: 0.05, maxTokens: 900 },
  { name: "greedy", topK: 8, temperature: 0.0, topP: 1.0, frequencyPenalty: 0.0, presencePenalty: 0.0, maxTokens: 900 },
  { name: "cool", topK: 8, temperature: 0.1, topP: 0.9, frequencyPenalty: 0.0, presencePenalty: 0.0, maxTokens: 900 },
  { name: "nucleus80", topK: 8, temperature: 0.2, topP: 0.8, frequencyPenalty: 0.0, presencePenalty: 0.0, maxTokens: 900 },
  { name: "freqPen30", topK: 8, temperature: 0.2, topP: 0.95, frequencyPenalty: 0.3, presencePenalty: 0.0, maxTokens: 900 },
  { name: "presPen30", topK: 8, temperature: 0.2, topP: 0.95, frequencyPenalty: 0.0, presencePenalty: 0.3, maxTokens: 900 },
  { name: "bothPen20", topK: 8, temperature: 0.2, topP: 0.95, frequencyPenalty: 0.2, presencePenalty: 0.2, maxTokens: 900 },
  { name: "warm", topK: 8, temperature: 0.4, topP: 0.95, frequencyPenalty: 0.1, presencePenalty: 0.1, maxTokens: 900 },
  { name: "longer", topK: 8, temperature: 0.2, topP: 0.95, frequencyPenalty: 0.05, presencePenalty: 0.05, maxTokens: 1400 },
];

const CONTEXT_CONFIGS: SweepConfig[] = [
  { name: "ctx4", topK: 4, temperature: 0.2, topP: 0.95, frequencyPenalty: 0.05, presencePenalty: 0.05, maxTokens: 900 },
  { name: "ctx6", topK: 6, temperature: 0.2, topP: 0.95, frequencyPenalty: 0.05, presencePenalty: 0.05, maxTokens: 900 },
  { name: "ctx12", topK: 12, temperature: 0.2, topP: 0.95, frequencyPenalty: 0.05, presencePenalty: 0.05, maxTokens: 900 },
];

/** Evidence-format variants, measured at the production sampling parameters. */
const FORMAT_CONFIGS: SweepConfig[] = [
  { name: "compact", topK: 8, temperature: 0.2, topP: 0.95, frequencyPenalty: 0.05, presencePenalty: 0.05, maxTokens: 900, evidenceFormat: "compact" },
  { name: "compact-ctx5", topK: 5, temperature: 0.2, topP: 0.95, frequencyPenalty: 0.05, presencePenalty: 0.05, maxTokens: 900, evidenceFormat: "compact" },
  { name: "freqPen30-compact", topK: 8, temperature: 0.2, topP: 0.95, frequencyPenalty: 0.3, presencePenalty: 0.0, maxTokens: 900, evidenceFormat: "compact" },
  { name: "lean", topK: 8, temperature: 0.2, topP: 0.95, frequencyPenalty: 0.05, presencePenalty: 0.05, maxTokens: 900, evidenceFormat: "lean" },
  { name: "freqPen30-lean", topK: 8, temperature: 0.2, topP: 0.95, frequencyPenalty: 0.3, presencePenalty: 0.0, maxTokens: 900, evidenceFormat: "lean" },
];

const ARTIFACT_PATTERNS: RegExp[] = [
  /\[ACTION:[^\]]*\]/i,
  /<\/?(?:user_query|retrieved_evidence|conversation_history)>/i,
  /(?:^|\n)\s*[#*]{0,4}\s*navigation(?:\s+action)?\s*:/i,
  /(?:^|\n)\s*\*[^*\n]{1,80}\*\*/,
  /\bEVIDENCE ITEM\s*\[?\d/,
  /(?:^|\n)\s*[#*]{0,4}\s*(?:citation|source|reference)s?\s*:/i,
];

const REFUSAL_RE = /not enough information|does not contain|doesn't contain|no information|cannot|can't|don't have|do not have|unable to/i;
const IMPERSONATION: RegExp[] = [
  /\bI(?:'m| am)\s+Catalin(?!'s)\b/i,
  /\bI(?:'m| am)\s+(?:a|an)\s+(?:CTI|computer|informatics|student)\b/i,
];

function keywordCoverage(answer: string, keywords: string[]): number {
  if (!keywords.length) return 1;
  const lower = answer.toLowerCase();
  return keywords.filter((k) => lower.includes(k.toLowerCase())).length / keywords.length;
}

/** Header-only evidence serialization: the citation id sits next to its content. */
function compactEvidence(
  blocks: { citationId: number; title: string; heading?: string; filePath: string; content: string }[],
  keepEvidenceLabel = false
): string {
  return blocks
    .map((b) => {
      const head = `${b.title}${b.heading ? ` — ${b.heading}` : ""} (${b.filePath})`;
      return keepEvidenceLabel
        ? `EVIDENCE ITEM [${b.citationId}] — ${head}:\n${b.content}`
        : `[${b.citationId}] ${head}\n${b.content}`;
    })
    .join("\n\n");
}

function artifactLeaks(text: string): number {
  return ARTIFACT_PATTERNS.filter((re) => re.test(text)).length;
}

async function callModel(
  baseUrl: string,
  apiKey: string,
  model: string,
  system: string,
  user: string,
  cfg: SweepConfig
): Promise<{ text: string; ms: number }> {
  const t0 = Date.now();
  const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: cfg.temperature,
      top_p: cfg.topP,
      frequency_penalty: cfg.frequencyPenalty,
      presence_penalty: cfg.presencePenalty,
      max_tokens: cfg.maxTokens,
      stream: false,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`chat/completions ${res.status}: ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = json.choices?.[0]?.message?.content?.trim() ?? "";
  return { text, ms: Date.now() - t0 };
}

interface CaseScore {
  id: string;
  kw: number;
  cited: boolean;
  chars: number;
  leaks: number;
  refusalOk: boolean | null;
  personaOk: boolean | null;
  navOk: boolean | null;
  ms: number;
}

async function main() {
  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const only = onlyArg ? onlyArg.slice("--only=".length) : "both";
  const singleArg = process.argv.find((a) => a.startsWith("--config="));
  const single = singleArg ? singleArg.slice("--config=".length) : null;

  const config = getRAGConfig();
  const baseUrl = config.models.generationBaseUrl;
  const apiKey = config.models.apiKey ?? "";
  const model = config.models.generationModel;

  let configs: SweepConfig[];
  if (single) {
    const wanted = new Set(single.split(",").map((s) => s.trim()).filter(Boolean));
    configs = [...PARAM_CONFIGS, ...CONTEXT_CONFIGS, ...FORMAT_CONFIGS].filter((c) => wanted.has(c.name));
    if (configs.length !== wanted.size) {
      console.warn(`  ⚠️  unknown config name(s): ${[...wanted].filter((n) => !configs.some((c) => c.name === n)).join(", ")}`);
    }
  } else {
    configs =
      only === "params"
        ? PARAM_CONFIGS
        : only === "context"
          ? CONTEXT_CONFIGS
          : only === "format"
            ? FORMAT_CONFIGS
            : [...PARAM_CONFIGS, ...CONTEXT_CONFIGS, ...FORMAT_CONFIGS];
  }

  console.log("\n🎛️  RAG Generation Parameter Sweep\n");
  console.log(`  model      : ${model}`);
  console.log(`  endpoint   : ${baseUrl}`);
  console.log(`  configs    : ${configs.map((c) => c.name).join(", ")}`);
  console.log(`  probe cases: ${PROBE_CASES.length}\n`);

  await rag.ensureInitialized();

  // Retrieval runs once per case; every config then replays the same prompts.
  const prepared: { probe: ProbeCase; chunks: Chunk[] }[] = [];
  for (const probe of PROBE_CASES) {
    const ret = await hybridRetriever.retrieve(probe.query);
    prepared.push({ probe, chunks: ret.rerankedResults.map((r) => r.chunk) });
    process.stdout.write(`  retrieved ${probe.id.padEnd(18)} ${ret.rerankedResults.length} chunks\r`);
  }
  console.log(`\n  retrieval cached for ${prepared.length} probes\n`);

  const summary: {
    name: string;
    scores: CaseScore[];
  }[] = [];

  for (const cfg of configs) {
    const scores: CaseScore[] = [];
    for (const { probe, chunks } of prepared) {
      const ctx = assembleContext(chunks.slice(0, cfg.topK));
      const system = buildGroundedSystemPrompt();
      const evidenceText =
        cfg.evidenceFormat === "compact"
          ? compactEvidence(ctx.evidenceBlocks)
          : cfg.evidenceFormat === "lean"
            ? compactEvidence(ctx.evidenceBlocks, true)
            : ctx.formattedContext;
      const user = buildGroundedUserPrompt(probe.query, evidenceText);
      const { text, ms } = await callModel(baseUrl, apiKey, model, system, user, cfg);
      const clean = sanitizeAssistantContent(text);
      const refused = REFUSAL_RE.test(clean);
      const navActions = resolveNavigationActions(probe.query, text).map((a) => `${a.type}:${a.target}`);
      scores.push({
        id: probe.id,
        kw: keywordCoverage(clean, probe.expectKeywords ?? []),
        cited: /\[\d+(?:\s*,\s*\d+)*\]/.test(clean),
        chars: clean.length,
        leaks: artifactLeaks(clean),
        refusalOk: probe.shouldRefuse ? refused : null,
        personaOk: probe.id === "identity" ? !IMPERSONATION.some((p) => p.test(clean)) : null,
        navOk: probe.expectNav ? navActions.some((n) => n.includes(probe.expectNav!)) : null,
        ms,
      });
      process.stdout.write(
        `  ${cfg.name.padEnd(10)} ${probe.id.padEnd(18)} kw=${(keywordCoverage(clean, probe.expectKeywords ?? []) * 100).toFixed(0).padStart(3)}%  cites=${/\[\d+/.test(clean) ? "y" : "n"}  ${String(clean.length).padStart(4)}ch  ${(ms / 1000).toFixed(1)}s\r`
      );
    }
    summary.push({ name: cfg.name, scores });
    console.log("");
  }

  console.log("\n=== Results (higher keyword coverage / more citations is better) ===\n");
  console.log(
    "  " +
      "config".padEnd(12) +
      "kwAvg".padStart(7) +
      "cited".padStart(7) +
      "leaks".padStart(7) +
      "avgCh".padStart(7) +
      "avgSec".padStart(7) +
      "refus".padStart(7) +
      "persona".padStart(9) +
      "nav".padStart(6)
  );
  for (const row of summary) {
    const scored = row.scores.filter((s) => s.id !== "refusal" && s.id !== "nav");
    const kw = scored.reduce((a, s) => a + s.kw, 0) / Math.max(1, scored.length);
    const cited = scored.filter((s) => s.cited).length;
    const leaks = row.scores.reduce((a, s) => a + s.leaks, 0);
    const chars = Math.round(scored.reduce((a, s) => a + s.chars, 0) / Math.max(1, scored.length));
    const secs = row.scores.reduce((a, s) => a + s.ms, 0) / Math.max(1, row.scores.length) / 1000;
    const refus = row.scores.filter((s) => s.refusalOk !== null);
    const persona = row.scores.filter((s) => s.personaOk !== null);
    const nav = row.scores.filter((s) => s.navOk !== null);
    console.log(
      "  " +
        row.name.padEnd(12) +
        `${(kw * 100).toFixed(0)}%`.padStart(7) +
        `${cited}/${scored.length}`.padStart(7) +
        String(leaks).padStart(7) +
        String(chars).padStart(7) +
        secs.toFixed(1).padStart(7) +
        `${refus.filter((s) => s.refusalOk).length}/${refus.length}`.padStart(7) +
        `${persona.filter((s) => s.personaOk).length}/${persona.length}`.padStart(9) +
        `${nav.filter((s) => s.navOk).length}/${nav.length}`.padStart(6)
    );
  }

  if (single || summary.length === 1) {
    console.log("\n--- Per-case detail ---");
    for (const s of summary[0].scores) {
      console.log(
        `  ${s.id.padEnd(18)} kw=${(s.kw * 100).toFixed(0).padStart(3)}%  cites=${s.cited ? "y" : "n"}  ${String(s.chars).padStart(4)}ch  leaks=${s.leaks}  ${(s.ms / 1000).toFixed(1)}s`
      );
    }
  }

  console.log(
    "\n  Note: single-run deltas within ~±8pp keyword coverage / ±2 citations are noise on a\n" +
      "  0.8B model — re-run a promising config with --config=<name> to confirm before adopting.\n"
  );
}

main().catch((err) => {
  console.error("\n❌ Sweep failed:", err);
  process.exit(1);
});
