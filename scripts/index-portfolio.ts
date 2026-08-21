import { rag } from "../lib/rag/rag-facade";

async function main() {
  console.log("\n📦 Indexing Portfolio Knowledge Base...\n");
  const result = await rag.syncPortfolio(true);

  console.log(`✅ Indexing completed in ${result.durationMs}ms:`);
  console.log(`   - Documents Indexed: ${result.indexedCount}`);
  console.log(`   - Documents Skipped (Unchanged): ${result.skippedCount}`);
  console.log(`   - Total Chunks Created: ${result.totalChunks}`);

  if (result.errors.length > 0) {
    console.warn(`\n⚠️ Encountered ${result.errors.length} errors:`);
    for (const err of result.errors) {
      console.warn(`   - [${err.documentId}]: ${err.error}`);
    }
  }

  console.log("\nIndexed Documents:");
  for (const doc of result.entries) {
    console.log(`   📄 [${doc.fileType.toUpperCase()}] ${doc.title} (${doc.chunkCount} chunks, ~${doc.tokenCount} tokens)`);
  }
  console.log("");
}

main().catch((err) => {
  console.error("Indexing failed:", err);
  process.exit(1);
});
