import type { Chunk, ChunkMetadata, FileType } from "../types/document";
import { estimateTokenCount } from "./tokenizer";

export interface TextChunkerOptions {
  targetChunkTokens?: number; // default: 250
  maxChunkTokens?: number; // default: 450
  overlapTokens?: number; // default: 40
  fileType?: FileType;
  language?: string;
}

export function chunkTextDocument(
  documentId: string,
  title: string,
  filePath: string,
  rawContent: string,
  documentHash: string,
  options: TextChunkerOptions = {}
): Chunk[] {
  const targetTokens = options.targetChunkTokens || 250;
  const maxTokens = options.maxChunkTokens || 450;
  const overlapTokens = options.overlapTokens || 40;
  const fileType = options.fileType || "text";
  const language = options.language;

  // Split on paragraphs or double newlines
  const paragraphs = rawContent.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks: Chunk[] = [];
  let chunkIndex = 0;
  const now = Date.now();

  let currentParagraphs: string[] = [];
  let currentTokens = 0;

  function flushChunk() {
    if (currentParagraphs.length === 0) return;

    const body = currentParagraphs.join("\n\n");
    const header = `[Document: ${title} (${filePath})]\n\n`;
    const fullContent = `${header}${body}`;
    const tokenCount = estimateTokenCount(fullContent);

    const chunkId = `${documentId}_txt_c${chunkIndex}`;
    const metadata: ChunkMetadata = {
      documentId,
      chunkId,
      parentId: documentId,
      title,
      heading: title,
      headingPath: [title],
      source: title,
      filePath,
      fileType,
      language,
      chunkIndex,
      totalChunks: 0,
      documentHash,
      tokenCount,
      charCount: fullContent.length,
      tags: [fileType],
      createdAt: now,
      updatedAt: now,
    };

    chunks.push({
      id: chunkId,
      documentId,
      parentId: documentId,
      content: fullContent,
      cleanContent: body,
      metadata,
    });

    chunkIndex++;

    // Retain overlap if possible
    if (currentParagraphs.length > 1 && overlapTokens > 0) {
      const lastP = currentParagraphs[currentParagraphs.length - 1];
      const lastPTokens = estimateTokenCount(lastP);
      if (lastPTokens <= overlapTokens * 1.5) {
        currentParagraphs = [lastP];
        currentTokens = lastPTokens;
        return;
      }
    }

    currentParagraphs = [];
    currentTokens = 0;
  }

  for (const para of paragraphs) {
    const paraTokens = estimateTokenCount(para);

    // If paragraph is huge, split by sentences
    if (paraTokens > maxTokens) {
      flushChunk();
      const sentences = para.split(/(?<=[.?!])\s+/);
      let sentBuffer: string[] = [];
      let sentTokens = 0;

      for (const sent of sentences) {
        const stTokens = estimateTokenCount(sent);
        if (sentTokens + stTokens > targetTokens && sentBuffer.length > 0) {
          currentParagraphs.push(sentBuffer.join(" "));
          flushChunk();
          sentBuffer = [];
          sentTokens = 0;
        }
        sentBuffer.push(sent);
        sentTokens += stTokens;
      }

      if (sentBuffer.length > 0) {
        currentParagraphs.push(sentBuffer.join(" "));
        currentTokens = sentTokens;
      }
      continue;
    }

    if (currentTokens + paraTokens > maxTokens && currentParagraphs.length > 0) {
      flushChunk();
    }

    currentParagraphs.push(para);
    currentTokens += paraTokens;

    if (currentTokens >= targetTokens) {
      flushChunk();
    }
  }

  flushChunk();

  const total = chunks.length;
  for (const chunk of chunks) {
    chunk.metadata.totalChunks = total;
  }

  return chunks;
}
