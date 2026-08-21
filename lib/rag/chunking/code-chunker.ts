import type { Chunk, ChunkMetadata } from "../types/document";
import { estimateTokenCount } from "./tokenizer";

export interface CodeChunkerOptions {
  targetChunkTokens?: number; // default: 280
  maxChunkTokens?: number; // default: 480
}

interface CodeDeclaration {
  kind: "import" | "class" | "interface" | "type" | "function" | "method" | "block" | "comment";
  name?: string;
  signature?: string;
  startLine: number;
  endLine: number;
  lines: string[];
}

export function detectLanguageFromPath(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  switch (ext) {
    case "ts":
    case "tsx":
      return "typescript";
    case "js":
    case "jsx":
      return "javascript";
    case "py":
      return "python";
    case "kt":
    case "kts":
      return "kotlin";
    case "rs":
      return "rust";
    case "json":
      return "json";
    case "sql":
      return "sql";
    case "css":
      return "css";
    case "html":
      return "html";
    default:
      return ext || "plaintext";
  }
}

export function parseCodeDeclarations(
  code: string
): { imports: string[]; declarations: CodeDeclaration[] } {
  const lines = code.split(/\r?\n/);
  const imports: string[] = [];
  const declarations: CodeDeclaration[] = [];

  let currentBlock: string[] = [];
  let blockStartLine = 0;
  let currentKind: CodeDeclaration["kind"] = "block";
  let currentName: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check for imports
    if (
      trimmed.startsWith("import ") ||
      trimmed.startsWith("from ") ||
      trimmed.startsWith("require(") ||
      trimmed.startsWith("package ") ||
      trimmed.startsWith("use ")
    ) {
      imports.push(line);
      continue;
    }

    // Function/Class/Interface declarations
    const fnMatch =
      trimmed.match(/(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)/) ||
      trimmed.match(/(?:export\s+)?(?:const|let)\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\(/) ||
      trimmed.match(/def\s+([A-Za-z0-9_]+)\s*\(/) || // Python
      trimmed.match(/fun\s+([A-Za-z0-9_]+)\s*\(/) || // Kotlin
      trimmed.match(/fn\s+([A-Za-z0-9_]+)\s*\(/); // Rust

    const classMatch =
      trimmed.match(/(?:export\s+)?(?:abstract\s+)?class\s+([A-Za-z0-9_]+)/) ||
      trimmed.match(/interface\s+([A-Za-z0-9_]+)/) ||
      trimmed.match(/type\s+([A-Za-z0-9_]+)\s*=/) ||
      trimmed.match(/struct\s+([A-Za-z0-9_]+)/) ||
      trimmed.match(/enum\s+([A-Za-z0-9_]+)/);

    if (classMatch || fnMatch) {
      if (currentBlock.length > 0) {
        declarations.push({
          kind: currentKind,
          name: currentName,
          startLine: blockStartLine,
          endLine: i - 1,
          lines: currentBlock,
        });
        currentBlock = [];
      }
      blockStartLine = i;
      currentKind = classMatch ? "class" : "function";
      currentName = classMatch ? classMatch[1] : fnMatch ? fnMatch[1] : undefined;
    }

    currentBlock.push(line);
  }

  if (currentBlock.length > 0) {
    declarations.push({
      kind: currentKind,
      name: currentName,
      startLine: blockStartLine,
      endLine: lines.length - 1,
      lines: currentBlock,
    });
  }

  return { imports, declarations };
}

export function chunkCodeDocument(
  documentId: string,
  title: string,
  filePath: string,
  rawContent: string,
  documentHash: string,
  options: CodeChunkerOptions = {}
): Chunk[] {
  const targetTokens = options.targetChunkTokens || 280;
  const maxTokens = options.maxChunkTokens || 480;
  const language = detectLanguageFromPath(filePath);

  const { imports, declarations } = parseCodeDeclarations(rawContent);
  const importsHeader =
    imports.length > 0 ? `// Imports:\n${imports.slice(0, 10).join("\n")}\n\n` : "";

  const chunks: Chunk[] = [];
  let chunkIndex = 0;
  const now = Date.now();

  let currentLines: string[] = [];
  let currentSymbols: string[] = [];
  let currentHeading = "Source Code";

  function flushChunk() {
    if (currentLines.length === 0) return;

    const codeSnippet = currentLines.join("\n").trim();
    const header = `// [File: ${filePath}] [Lang: ${language}] [Symbols: ${currentSymbols.join(", ") || "module"}]\n`;
    const fullContent = `${header}${importsHeader}${codeSnippet}`;
    const tokenCount = estimateTokenCount(fullContent);

    // Extract all identifiers
    const symbolMatches = Array.from(
      new Set([
        ...currentSymbols,
        ...(codeSnippet.match(/\b([A-Za-z_][A-Za-z0-9_]{3,})\b/g) || []).filter(
          (w) => /[A-Z]/.test(w) || w.includes("_")
        ),
      ])
    ).slice(0, 20);

    const chunkId = `${documentId}_code_c${chunkIndex}`;
    const metadata: ChunkMetadata = {
      documentId,
      chunkId,
      parentId: documentId,
      title,
      heading: currentHeading,
      headingPath: [title, currentHeading],
      source: title,
      filePath,
      fileType: "code",
      language,
      chunkIndex,
      totalChunks: 0,
      documentHash,
      tokenCount,
      charCount: fullContent.length,
      symbolNames: symbolMatches,
      tags: [language, ...currentSymbols],
      createdAt: now,
      updatedAt: now,
    };

    chunks.push({
      id: chunkId,
      documentId,
      parentId: documentId,
      content: fullContent,
      cleanContent: codeSnippet,
      metadata,
    });

    chunkIndex++;
    currentLines = [];
    currentSymbols = [];
  }

  for (const decl of declarations) {
    const declText = decl.lines.join("\n");
    const declTokens = estimateTokenCount(declText);

    if (decl.name) {
      currentSymbols.push(decl.name);
      currentHeading = `${decl.kind}: ${decl.name}`;
    }

    if (declTokens > maxTokens) {
      // Flush anything pending
      flushChunk();
      // Split large declaration by lines
      let subBuffer: string[] = [];
      let subTokens = 0;

      for (const line of decl.lines) {
        const lineTokens = estimateTokenCount(line);
        if (subTokens + lineTokens > targetTokens && subBuffer.length > 0) {
          currentLines = subBuffer;
          if (decl.name) currentSymbols = [decl.name];
          flushChunk();
          subBuffer = [];
          subTokens = 0;
        }
        subBuffer.push(line);
        subTokens += lineTokens;
      }

      if (subBuffer.length > 0) {
        currentLines = subBuffer;
        if (decl.name) currentSymbols = [decl.name];
      }
      continue;
    }

    const currentTokens = estimateTokenCount(currentLines.join("\n"));
    if (currentTokens + declTokens > maxTokens && currentLines.length > 0) {
      flushChunk();
    }

    currentLines.push(...decl.lines);
    if (decl.name && !currentSymbols.includes(decl.name)) {
      currentSymbols.push(decl.name);
    }

    if (estimateTokenCount(currentLines.join("\n")) >= targetTokens) {
      flushChunk();
    }
  }

  flushChunk();

  // Patch totalChunks
  const total = chunks.length;
  for (const chunk of chunks) {
    chunk.metadata.totalChunks = total;
  }

  return chunks;
}
