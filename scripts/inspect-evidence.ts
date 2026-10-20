/**
 * Dumps the assembled evidence for one query so retrieval gaps can be told
 * apart from generation gaps. Read-only.
 *
 * Usage: npx tsx scripts/inspect-evidence.ts "your query" [topK]
 */
import { rag } from "../lib/rag/rag-facade";
import { hybridRetriever } from "../lib/rag/retrieval/hybrid-retriever";
import { assembleContext } from "../lib/rag/context/budget";

async function main() {
  const query = process.argv[2] ?? "What is Aplicatie Teka and what was the main challenge in building it?";
  const topK = Number(process.argv[3] ?? 8);

  await rag.ensureInitialized();
  const ret = await hybridRetriever.retrieve(query);
  const ctx = assembleContext(ret.rerankedResults.slice(0, topK).map((r) => r.chunk));

  console.log(`\nQuery: ${query}\nReranked chunks: ${ret.rerankedResults.length}\n`);
  ret.rerankedResults.slice(0, topK).forEach((r, i) => {
    console.log(
      `  ${String(i + 1).padStart(2)}. score=${r.rerankerScore.toFixed(3)}  ${r.chunk.metadata.filePath} :: ${r.chunk.metadata.heading ?? "(no heading)"}  (${r.chunk.content.length}ch)`
    );
  });
  console.log(`\n--- Evidence blocks handed to the model (${ctx.evidenceBlocks.length}) ---\n`);
  for (const b of ctx.evidenceBlocks) {
    console.log(`[${b.citationId}] ${b.title} — ${b.heading} (${b.filePath})`);
    console.log(b.content.replace(/\n{2,}/g, "\n").slice(0, 700));
    console.log("");
  }
}

main().catch((err) => {
  console.error("inspect failed:", err);
  process.exit(1);
});
