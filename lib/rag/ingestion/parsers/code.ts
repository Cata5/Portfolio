import { chunkCodeDocument, detectLanguageFromPath } from "../../chunking/code-chunker";
import type { Chunk, Document } from "../../types/document";

export function parseCodeFile(
  documentId: string,
  filePath: string,
  rawContent: string,
  hash: string,
  customTitle?: string
): { document: Document; chunks: Chunk[] } {
  const fileName = filePath.split(/[/\\]/).pop() || documentId;
  const language = detectLanguageFromPath(filePath);
  const title = customTitle || `${fileName} (${language})`;

  const chunks = chunkCodeDocument(documentId, title, filePath, rawContent, hash);

  const document: Document = {
    id: documentId,
    title,
    filePath,
    fileType: "code",
    language,
    rawContent,
    hash,
    chunks,
    metadata: {
      title,
      source: title,
      filePath,
      tags: [language, "source_code"],
      status: "indexed",
      indexedAt: Date.now(),
      updatedAt: Date.now(),
      sizeBytes: Buffer.byteLength(rawContent, "utf8"),
    },
  };

  return { document, chunks };
}
