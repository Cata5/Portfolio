import { chunkTextDocument } from "../../chunking/text-chunker";
import type { Chunk, Document, FileType } from "../../types/document";

export function parseTextFile(
  documentId: string,
  filePath: string,
  rawContent: string,
  hash: string,
  customTitle?: string,
  fileType: FileType = "text"
): { document: Document; chunks: Chunk[] } {
  const fileName = filePath.split(/[/\\]/).pop() || documentId;
  const title = customTitle || fileName;

  // If HTML, strip script/style tags and clean
  let cleanContent = rawContent;
  if (fileType === "html" || filePath.endsWith(".html") || filePath.endsWith(".htm")) {
    cleanContent = rawContent
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim();
  }

  const chunks = chunkTextDocument(documentId, title, filePath, cleanContent, hash, {
    fileType,
  });

  const document: Document = {
    id: documentId,
    title,
    filePath,
    fileType,
    rawContent,
    hash,
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
