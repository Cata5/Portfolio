import { rag } from "../lib/rag/rag-facade";
import { generateBenchmarkMarkdown } from "../lib/rag/evaluation/report";

async function main() {
  console.log("\n📊 Running Multi-Configuration RAG Evaluation Benchmark...\n");
  console.log("Evaluating Configurations A through E across ground-truth questions...\n");

  const comparison = await rag.runEvaluation();
  const mdReport = generateBenchmarkMarkdown(comparison);

  console.log(mdReport);
  console.log("\n🏆 Benchmark Run Completed Successfully!\n");
}

main().catch((err) => {
  console.error("Evaluation run failed:", err);
  process.exit(1);
});
