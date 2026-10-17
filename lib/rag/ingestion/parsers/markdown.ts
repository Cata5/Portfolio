import { chunkMarkdownDocument } from "../../chunking/markdown-chunker";
import type { MarkdownChunkerOptions } from "../../chunking/markdown-chunker";
import type { Chunk, Document } from "../../types/document";

export function parseMarkdownFile(
  documentId: string,
  filePath: string,
  rawContent: string,
  hash: string,
  customTitle?: string,
  options?: MarkdownChunkerOptions
): { document: Document; chunks: Chunk[] } {
  // Extract title from first # heading or filename
  const titleMatch = rawContent.match(/^#\s+(.+)$/m);
  const title =
    customTitle ||
    (titleMatch ? titleMatch[1].trim() : filePath.split(/[/\\]/).pop() || documentId);

  const { chunks, sections } = chunkMarkdownDocument(
    documentId,
    title,
    filePath,
    rawContent,
    hash,
    options
  );

  const document: Document = {
    id: documentId,
    title,
    filePath,
    fileType: "markdown",
    rawContent,
    hash,
    sections,
    chunks,
    metadata: {
      title,
      source: title,
      filePath,
      status: "indexed",
      indexedAt: Date.now(),
      updatedAt: Date.now(),
      sizeBytes: Buffer.byteLength(rawContent, "utf8"),
    },
  };

  return { document, chunks };
}
