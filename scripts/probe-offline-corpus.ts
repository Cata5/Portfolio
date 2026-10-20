/**
 * Model-free probe for the static ("offline archive") assistant.
 *
 * Builds the client-side corpus from the CMS content and prints, for each
 * question on the command line, the BM25 ranking and the answer the engine
 * would return. Useful when tuning the corpus chunking or the resolution
 * thresholds - no model server required.
 *
 *   npx tsx scripts/probe-offline-corpus.ts vortex "tell me about siteauto"
 */

import { readFileSync } from "node:fs";

import { BM25Engine } from "../lib/rag/lexical/bm25";
import { answerOfflineQuery } from "../lib/rag/offline/assistant";
import { buildCorpusChunks, type OfflineCorpusSource } from "../lib/rag/offline/corpus";
import type { ArchiveFile } from "../lib/rag/offline/types";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));

const source: OfflineCorpusSource = {
  site: read("content/site.json"),
  copy: read("content/copy.json"),
  skills: read("content/skills.json"),
  ml: read("content/ml.json"),
  journey: read("content/journey.json"),
  activities: read("content/activities.json"),
  certifications: read("content/certifications.json"),
  projects: read("content/projects.json"),
  roadmap: read("content/roadmap.json"),
};

const archive = read("content/rag-archive.json") as ArchiveFile;

const chunks = buildCorpusChunks(source);
const engine = new BM25Engine();
engine.addChunks(chunks);

console.log(`${chunks.length} corpus records\n`);

const questions = process.argv.slice(2);
if (questions.length === 0) {
  console.log("usage: npx tsx scripts/probe-offline-corpus.ts <question> [question ...]");
  process.exit(0);
}

for (const question of questions) {
  console.log(`\nQ: ${question}`);
  for (const result of engine.search(question, 6, 0)) {
    console.log(
      `   ${result.score.toFixed(2).padStart(6)}  ${result.chunk.id.padEnd(30)} ${result.chunk.metadata.title}`
    );
  }
  const answer = answerOfflineQuery(question, { source, archive });
  console.log(
    `   -> ${answer.mode} | ${answer.title} | ${answer.actions.map((a) => `${a.type}:${a.target}`).join(", ")}`
  );
  for (const block of answer.blocks) {
    if (block.kind === "text") console.log(`      ${block.text.slice(0, 160)}`);
    else for (const item of block.items.slice(0, 4)) console.log(`      • ${item.slice(0, 140)}`);
  }
}
