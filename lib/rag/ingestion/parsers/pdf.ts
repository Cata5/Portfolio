import { chunkTextDocument } from "../../chunking/text-chunker";
import type { Chunk, Document } from "../../types/document";

export function parsePdfText(
  documentId: string,
  filePath: string,
  extractedText: string,
  hash: string,
  customTitle?: string
): { document: Document; chunks: Chunk[] } {
  const fileName = filePath.split(/[/\\]/).pop() || documentId;
  const title = customTitle || fileName.replace(/\.pdf$/i, "");

  const chunks = chunkTextDocument(documentId, title, filePath, extractedText, hash, {
    fileType: "pdf",
  });

  const document: Document = {
    id: documentId,
    title,
    filePath,
    fileType: "pdf",
    rawContent: extractedText,
    hash,
    chunks,
    metadata: {
      title,
      source: title,
      filePath,
      tags: ["pdf"],
      status: "indexed",
      indexedAt: Date.now(),
      updatedAt: Date.now(),
      sizeBytes: Buffer.byteLength(extractedText, "utf8"),
    },
  };

  return { document, chunks };
}
