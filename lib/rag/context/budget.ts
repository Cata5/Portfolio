import type { Chunk } from "../types/document";
import type { GroundedEvidence } from "../types/retrieval";
import { estimateTokenCount } from "../chunking/tokenizer";
import { parentChildManager } from "../chunking/parent-child";
import { getRAGConfig } from "../config";

export interface ContextAssemblyResult {
  evidenceBlocks: GroundedEvidence[];
  formattedContext: string;
  totalTokens: number;
  maxTokens: number;
  availableForGeneration: number;
}

export function assembleContext(
  candidateChunks: Chunk[],
  options?: {
    maxContextTokens?: number;
    expandParentContext?: boolean;
  }
): ContextAssemblyResult {
  const config = getRAGConfig();
  const maxTokens = options?.maxContextTokens ?? config.context.maxContextTokens;
  const expandParent = options?.expandParentContext ?? config.context.enableParentContextExpansion;

  const evidenceBlocks: GroundedEvidence[] = [];
  const seenChunkIds = new Set<string>();
  const seenContentHashes = new Set<string>();

  let currentTokens = 0;
  let citationId = 1;

  for (const chunk of candidateChunks) {
    if (seenChunkIds.has(chunk.id)) continue;

    // Deduplicate identical content
    const contentSnippet = chunk.cleanContent.slice(0, 100);
    if (seenContentHashes.has(contentSnippet)) continue;

    seenChunkIds.add(chunk.id);
    seenContentHashes.add(contentSnippet);

    let contentToUse = chunk.content;
    if (expandParent) {
      contentToUse = parentChildManager.expandChunkContext(chunk);
    }

    const chunkTokens = estimateTokenCount(contentToUse);

    if (currentTokens + chunkTokens > maxTokens && evidenceBlocks.length > 0) {
      // Exceeded budget, stop adding more evidence
      break;
    }

    evidenceBlocks.push({
      citationId,
      chunkId: chunk.id,
      documentId: chunk.documentId,
      title: chunk.metadata.title,
      heading: chunk.metadata.heading,
      headingPath: chunk.metadata.headingPath,
      filePath: chunk.metadata.filePath,
      fileType: chunk.metadata.fileType,
      language: chunk.metadata.language,
      content: contentToUse,
      score: 1.0,
      metadata: chunk.metadata,
      tokenCount: chunkTokens,
    });

    currentTokens += chunkTokens;
    citationId++;
  }

  // Format deterministic evidence blocks for grounded LLM prompt
  const formattedBlocks = evidenceBlocks
    .map((ev) => {
      const header = `[${ev.citationId}] ${ev.title}${ev.heading ? ` — ${ev.heading}` : ""} (${ev.filePath})`;
      return `--- EVIDENCE ITEM [${ev.citationId}] ---\nSOURCE: ${header}\nCONTENT:\n${ev.content}\n--- END EVIDENCE ITEM [${ev.citationId}] ---`;
    })
    .join("\n\n");

  return {
    evidenceBlocks,
    formattedContext: formattedBlocks,
    totalTokens: currentTokens,
    maxTokens,
    availableForGeneration: Math.max(0, maxTokens - currentTokens),
  };
}
