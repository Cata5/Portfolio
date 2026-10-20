/**
 * Compiles `content/rag-archive.json` - the pre-generated answers the static
 * GitHub Pages assistant replays.
 *
 * The static export has no server and no local model, so the chat there can
 * only be as good as what was baked at build time. This script runs the real
 * pipeline (same retriever, same prompts, same config as the live widget) over
 * a set of recruiter-grade questions and stores the finished answers, their
 * citations, their navigation actions and the recorded run time.
 *
 * Answers that came back as a refusal, or without a single validated citation,
 * are dropped: those questions are answered better by the client-side corpus
 * search, which quotes the portfolio records directly instead of guessing.
 *
 * Usage:
 *   npx tsx scripts/build-rag-archive.ts
 *   npx tsx scripts/build-rag-archive.ts --model unsloth/Qwen3.5-4B-MTP-GGUF
 *   npx tsx scripts/build-rag-archive.ts --only=vortex --limit=3
 *   npx tsx scripts/build-rag-archive.ts --resume
 *   npx tsx scripts/build-rag-archive.ts --dry-run
 *
 * A model server (Unsloth Studio / LM Studio) must be running and serving the
 * requested model; nothing is downloaded here.
 *
 * Safety: a run that compiles nothing, that fails questions, or that comes out
 * smaller than the archive already on disk leaves that file untouched (and
 * exits non-zero). Partial runs (`--only`, `--limit`) merge into the output
 * file: entries they do not cover are kept. `--resume` keeps finished answers,
 * writes progress as it goes, and is the way to finish a run that a flaky model
 * server interrupted; `--force` writes a partial result on purpose.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { getRAGConfig, updateRAGConfig } from "../lib/rag/config";
import { normalizeAssistantStructure, sanitizeAssistantContent } from "../lib/rag/chat-format";
import { PORTFOLIO_EVALUATION_DATASET } from "../lib/rag/evaluation/dataset";
import { resolveNavigationActions } from "../lib/rag/navigation-helpers";
import { answerTextToBlocks } from "../lib/rag/offline/parse-answer";
import type { ArchiveEntry, ArchiveFile, OfflineAction, OfflineSource } from "../lib/rag/offline/types";
import { rag } from "../lib/rag/rag-facade";

/** Questions beyond the evaluation set, phrased the way a recruiter asks. */
const CURATED_QUESTIONS = [
  "Tell me about the Vortex project and what makes it technically impressive.",
  "What are the limitations of Vortex and what is planned next?",
  "What is CataAI and how was it built?",
  "What is the LLM from Scratch build roadmap and what training runs are recorded?",
  "Tell me about the Cheltuieli expense tracker.",
  "What is Apps Manager and what does it do?",
  "What is the Dataset Generator project used for?",
  "How does Detectie detect and read license plates?",
  "What is the Primarie E-Services Portal?",
  "What is the Liceul Teoretic Ion Cantacuzino website?",
  "What is YOLO Trainer and how does its training interface work?",
  "What is Jarvis, the OS Helper?",
  "What is the AI Interface project?",
  "What is LLM Finetuner and how does it fine-tune models locally?",
  "What is NeuroShell and what is it used for?",
  "Which projects involve computer vision or YOLO?",
  "Which of Catalin's projects are Android or Android TV apps?",
  "What desktop applications has Catalin built?",
  "Does Catalin have experience with embedded systems or ESP32?",
  "What experience does Catalin have with Docker and Linux?",
  "What is the hardest project Catalin has built?",
  "Which of Catalin's projects is the most technically complex, and why?",
  "What is Catalin's latest or most recent project?",
  "Summarize Catalin's portfolio for a recruiter.",
  "What are Catalin's strongest technical skills?",
  "What did Catalin win at UniHack?",
  "What is Catalin's FIRST Tech Challenge robotics experience?",
  "What certifications does Catalin hold?",
  "What is Catalin's engineering timeline from 2023 to 2026?",
  "Is Catalin available for internships or software engineering roles?",
  "How many machine learning models did Catalin train and on what hardware?",
  "What is the tech stack of this portfolio website itself?",
];

const REFUSAL = /not enough information|there is no information|cannot find|unable to answer/i;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const raw = argv[i];
    const match = raw.match(/^--([^=]+)(?:=(.*))?$/);
    if (!match) continue;
    const key = match[1];
    if (match[2] !== undefined) {
      args[key] = match[2];
      continue;
    }
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith("--")) {
      args[key] = next;
      i += 1;
      continue;
    }
    args[key] = true;
  }
  return args;
}

interface PlannedQuestion {
  id: string;
  question: string;
  source: "eval" | "curated";
}

/** Evaluation-set questions first, then the curated list, deduplicated. */
function planQuestions(): PlannedQuestion[] {
  const planned: PlannedQuestion[] = [];
  const seen = new Set<string>();

  const add = (id: string, question: string, source: PlannedQuestion["source"]) => {
    const key = question.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (seen.has(key)) return;
    seen.add(key);
    planned.push({ id, question, source });
  };

  for (const item of PORTFOLIO_EVALUATION_DATASET) {
    // Injection probes exist to test the guard, not to be replayed to a
    // visitor who types the same jailbreak; the guard refuses them live.
    if (/injection/i.test(item.id)) continue;
    add(item.id, item.query, "eval");
  }
  for (const question of CURATED_QUESTIONS) {
    add(`curated-${slugify(question)}`, question, "curated");
  }

  return planned;
}

function toAction(action: ReturnType<typeof resolveNavigationActions>[number]): OfflineAction {
  return { id: action.id, label: action.label, type: action.type, target: action.target };
}

async function compileEntry(
  planned: PlannedQuestion
): Promise<{ entry: ArchiveEntry | null; reason?: string }> {
  const deltas: string[] = [];

  const response = await rag.query(planned.question, {
    stream: true,
    skipCache: true,
    onEvent: (event) => {
      if (event.type === "delta") deltas.push(event.content);
    },
  });

  const raw = deltas.join("");
  const text = normalizeAssistantStructure(sanitizeAssistantContent(response.answer));

  if (REFUSAL.test(text)) return { entry: null, reason: "refusal" };
  if (response.sources.length === 0) return { entry: null, reason: "no citations" };

  const blocks = answerTextToBlocks(text);
  if (blocks.length === 0) return { entry: null, reason: "empty answer" };

  const allSources: OfflineSource[] = response.sources.map((source) => ({
    citationId: source.citationId,
    title: source.title,
    heading: source.heading,
    filePath: source.filePath,
  }));

  // Deduplication above can drop the claim behind a citation, so only sources
  // the answer still refers to are kept. A reply that cites nothing keeps the
  // full validated list (the pipeline attaches one when the model forgot).
  const referenced = new Set<number>();
  for (const block of blocks) {
    const text = block.kind === "text" ? block.text : block.items.join(" ");
    for (const match of text.matchAll(/\[(\d+(?:\s*,\s*\d+)*)\]/g)) {
      for (const id of match[1].split(",")) referenced.add(Number.parseInt(id.trim(), 10));
    }
  }
  const sources =
    referenced.size > 0 ? allSources.filter((source) => referenced.has(source.citationId)) : allSources;

  const actions = resolveNavigationActions(planned.question, raw).map(toAction);

  return {
    entry: {
      id: planned.id,
      question: planned.question,
      blocks,
      sources,
      actions,
      recordedMs: response.timings.totalMs,
    },
  };
}

/** The archive already on disk, so a resumed run can keep finished answers. */
function readExistingArchive(outPath: string): ArchiveFile | null {
  if (!existsSync(outPath)) return null;
  try {
    const parsed = JSON.parse(readFileSync(outPath, "utf8")) as ArchiveFile;
    return Array.isArray(parsed.entries) ? parsed : null;
  } catch {
    return null;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outPath = path.resolve(
    process.cwd(),
    typeof args.out === "string" ? args.out : "content/rag-archive.json"
  );
  const resume = Boolean(args.resume);
  const force = Boolean(args.force);

  const previousModel = getRAGConfig().models.generationModel;
  const model = typeof args.model === "string" ? args.model : previousModel;

  let planned = planQuestions();
  if (typeof args.only === "string") {
    const needle = args.only.toLowerCase();
    planned = planned.filter((item) => item.question.toLowerCase().includes(needle));
  }
  if (typeof args.limit === "string") {
    planned = planned.slice(0, Number.parseInt(args.limit, 10));
  }

  const existing = readExistingArchive(outPath);

  console.log(`\n🗂  Compiling static RAG archive`);
  console.log(`   model:     ${model}${model === previousModel ? " (configured)" : ""}`);
  console.log(`   questions: ${planned.length}`);
  console.log(`   output:    ${path.relative(process.cwd(), outPath)}`);
  if (resume && existing) console.log(`   resume:    keeping ${existing.entries.length} answers already compiled`);
  console.log("");

  if (args["dry-run"]) {
    for (const item of planned) console.log(`   [${item.source}] ${item.question}`);
    console.log("");
    return;
  }

  if (model !== previousModel) {
    updateRAGConfig({ models: { generationModel: model } });
  }

  const entries: ArchiveEntry[] = [];
  const skipped: { question: string; reason: string }[] = [];
  const failures: { question: string; error: string }[] = [];

  const priorById = new Map((existing?.entries ?? []).map((entry) => [entry.id, entry]));
  const plannedIds = new Set(planned.map((item) => item.id));
  // Entries outside this run's question set (a `--only` run) must survive.
  const carriedOver = (existing?.entries ?? []).filter((entry) => !plannedIds.has(entry.id));

  const writeArchive = () => {
    const archive: ArchiveFile = {
      version: 1,
      generatedAt: new Date().toISOString(),
      model,
      entries: [...carriedOver, ...entries],
    };
    writeFileSync(outPath, `${JSON.stringify(archive, null, 2)}\n`, "utf8");
  };

  try {
    for (let i = 0; i < planned.length; i++) {
      const item = planned[i];
      const label = `[${String(i + 1).padStart(2, " ")}/${planned.length}]`;

      const prior = resume ? priorById.get(item.id) : undefined;
      if (prior) {
        entries.push(prior);
        console.log(`${label} keep ${prior.sources.length} src  ${item.question}`);
        continue;
      }

      const started = Date.now();

      try {
        const { entry, reason } = await compileEntry(item);
        const took = Date.now() - started;
        if (!entry) {
          skipped.push({ question: item.question, reason: reason ?? "skipped" });
          console.log(`${label} SKIP (${reason}) ${item.question}`);
          continue;
        }
        entries.push(entry);
        console.log(
          `${label} ok  ${String(entry.recordedMs ?? took).padStart(5, " ")}ms  ` +
            `${entry.sources.length} src  ${entry.blocks.length} blocks  ${item.question}`
        );
        // Keep finished work on disk so an interrupted run is not wasted.
        if (resume) writeArchive();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failures.push({ question: item.question, error: message });
        console.log(`${label} FAIL ${message}  ${item.question}`);
      }
    }
  } finally {
    if (model !== previousModel) {
      updateRAGConfig({ models: { generationModel: previousModel } });
    }
  }

  if (entries.length === 0) {
    console.error(
      `\n❌ Nothing was compiled; ${path.relative(process.cwd(), outPath)} was left untouched.\n` +
        "   Is the model server running with a model loaded?"
    );
    process.exitCode = 1;
    return;
  }

  if (!force && !resume && failures.length > 0) {
    console.error(
      `\n❌ ${failures.length} question(s) failed; the archive was left untouched.\n` +
        "   Re-run with --resume to keep the answers that did compile and fill the rest."
    );
    process.exitCode = 1;
    return;
  }

  if (
    !force &&
    existing &&
    existing.entries.length > 0 &&
    entries.length + carriedOver.length < existing.entries.length
  ) {
    console.error(
      `\n❌ Only ${entries.length + carriedOver.length} of ${existing.entries.length} entries compiled; ` +
        "the archive was left untouched.\n" +
        "   Re-run with --resume to fill the gaps, or --force to overwrite anyway."
    );
    process.exitCode = 1;
    return;
  }

  writeArchive();

  const withActions = entries.filter((entry) => entry.actions.length > 0).length;
  console.log(`\n✅ Wrote ${entries.length} entries`);
  console.log(`   with navigation actions: ${withActions}`);
  if (skipped.length > 0) {
    console.log(`   skipped: ${skipped.length} (${skipped.map((s) => s.reason).join(", ")})`);
    for (const item of skipped) console.log(`     - [${item.reason}] ${item.question}`);
  }
  if (failures.length > 0) {
    console.log(`   failures: ${failures.length} - re-run with --resume to fill them`);
    for (const item of failures) console.log(`     - ${item.question}: ${item.error}`);
    process.exitCode = 1;
  }
  console.log("");
}

main().catch((error) => {
  console.error("Archive compilation failed:", error);
  process.exit(1);
});
