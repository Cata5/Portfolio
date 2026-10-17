import type { Chunk, ChunkMetadata, Section } from "../types/document";
import { estimateTokenCount } from "./tokenizer";

export interface MarkdownChunkerOptions {
  targetChunkTokens?: number; // default: 250
  maxChunkTokens?: number; // default: 450
  overlapTokens?: number; // default: 40
}

interface ParsedMarkdownBlock {
  type: "heading" | "paragraph" | "code" | "table" | "list" | "other";
  level?: number;
  headingText?: string;
  raw: string;
  lines: string[];
}

export function parseMarkdownBlocks(markdown: string): ParsedMarkdownBlock[] {
  const lines = markdown.split(/\r?\n/);
  const blocks: ParsedMarkdownBlock[] = [];
  let currentLines: string[] = [];
  let inCodeBlock = false;
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code block fences
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        currentLines.push(line);
        blocks.push({
          type: "code",
          raw: currentLines.join("\n"),
          lines: [...currentLines],
        });
        currentLines = [];
        inCodeBlock = false;
        continue;
      } else {
        if (currentLines.length > 0) {
          blocks.push({
            type: "paragraph",
            raw: currentLines.join("\n"),
            lines: [...currentLines],
          });
          currentLines = [];
        }
        inCodeBlock = true;
        currentLines.push(line);
        continue;
      }
    }

    if (inCodeBlock) {
      currentLines.push(line);
      continue;
    }

    // Markdown Headings: #, ##, ###, ####
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      if (currentLines.length > 0) {
        blocks.push({
          type: inTable ? "table" : "paragraph",
          raw: currentLines.join("\n"),
          lines: [...currentLines],
        });
        currentLines = [];
        inTable = false;
      }
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        headingText: headingMatch[2].trim(),
        raw: line,
        lines: [line],
      });
      continue;
    }

    // Markdown Table lines
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      if (!inTable && currentLines.length > 0) {
        blocks.push({
          type: "paragraph",
          raw: currentLines.join("\n"),
          lines: [...currentLines],
        });
        currentLines = [];
      }
      inTable = true;
      currentLines.push(line);
      continue;
    } else if (inTable) {
      blocks.push({
        type: "table",
        raw: currentLines.join("\n"),
        lines: [...currentLines],
      });
      currentLines = [];
      inTable = false;
    }

    // Empty lines trigger block boundary
    if (trimmed === "") {
      if (currentLines.length > 0) {
        blocks.push({
          type: "paragraph",
          raw: currentLines.join("\n"),
          lines: [...currentLines],
        });
        currentLines = [];
      }
      continue;
    }

    // List item or normal paragraph line
    currentLines.push(line);
  }

  if (currentLines.length > 0) {
    blocks.push({
      type: inCodeBlock ? "code" : inTable ? "table" : "paragraph",
      raw: currentLines.join("\n"),
      lines: [...currentLines],
    });
  }

  return blocks;
}

export function chunkMarkdownDocument(
  documentId: string,
  title: string,
  filePath: string,
  rawContent: string,
  documentHash: string,
  options: MarkdownChunkerOptions = {}
): { chunks: Chunk[]; sections: Section[] } {
  const targetTokens = options.targetChunkTokens || 250;
  const maxTokens = options.maxChunkTokens || 450;
  const overlapTokens = options.overlapTokens || 40;

  const blocks = parseMarkdownBlocks(rawContent);
  const chunks: Chunk[] = [];
  const sections: Section[] = [];

  // Heading hierarchy stack: { level, text, slug, path }
  const headingStack: { level: number; text: string }[] = [];

  // Section tracking: each heading opens a section; flushed chunks feed its
  // content so parent-context expansion has something to expand with.
  let currentSection: Section | null = null;

  function slugifyHeading(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function closeSection() {
    if (currentSection && currentSection.content.trim().length > 0) {
      sections.push(currentSection);
    }
    currentSection = null;
  }

  function getCurrentHeadingPath(): string[] {
    return headingStack.map((h) => h.text);
  }

  let currentChunkBlocks: ParsedMarkdownBlock[] = [];
  let currentChunkTokens = 0;
  let chunkIndex = 0;
  const now = Date.now();

  function flushChunk() {
    if (currentChunkBlocks.length === 0) return;

    const path = getCurrentHeadingPath();
    const heading = path.length > 0 ? path[path.length - 1] : undefined;
    const breadcrumbPrefix =
      path.length > 0 ? `[${title} > ${path.join(" > ")}]\n\n` : `[${title}]\n\n`;

    const rawBlockContent = currentChunkBlocks.map((b) => b.raw).join("\n\n");
    const fullContent = breadcrumbPrefix + rawBlockContent;
    const cleanContent = rawBlockContent.trim();
    const tokenCount = estimateTokenCount(fullContent);

    // Extract any identifiers or code symbols from code blocks and text
    const symbolMatches = Array.from(
      new Set(
        (cleanContent.match(/\b([A-Za-z_][A-Za-z0-9_]{3,})\b/g) || []).filter(
          (w) => /[A-Z]/.test(w) || w.includes("_")
        )
      )
    ).slice(0, 15);

    const chunkId = `${documentId}_c${chunkIndex}`;
    const metadata: ChunkMetadata = {
      documentId,
      chunkId,
      parentId: documentId,
      title,
      heading,
      headingPath: path,
      source: title,
      filePath,
      fileType: "markdown",
      chunkIndex,
      totalChunks: 0, // will patch after loop
      documentHash,
      tokenCount,
      charCount: fullContent.length,
      symbolNames: symbolMatches,
      tags: path,
      createdAt: now,
      updatedAt: now,
    };

    chunks.push({
      id: chunkId,
      documentId,
      parentId: documentId,
      content: fullContent,
      cleanContent,
      metadata,
    });

    // Feed the current heading section for parent-context expansion
    if (currentSection) {
      currentSection.content += (currentSection.content ? "\n\n" : "") + cleanContent;
    }

    chunkIndex++;

    // Retain overlap if last block was a paragraph
    if (currentChunkBlocks.length > 1 && overlapTokens > 0) {
      const lastBlock = currentChunkBlocks[currentChunkBlocks.length - 1];
      const lastBlockTokens = estimateTokenCount(lastBlock.raw);
      if (lastBlockTokens <= overlapTokens * 1.5 && lastBlock.type !== "heading") {
        currentChunkBlocks = [lastBlock];
        currentChunkTokens = lastBlockTokens;
        return;
      }
    }

    currentChunkBlocks = [];
    currentChunkTokens = 0;
  }

  for (const block of blocks) {
    if (block.type === "heading") {
      const level = block.level || 1;
      // Adjust heading hierarchy stack
      while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= level) {
        headingStack.pop();
      }
      headingStack.push({ level, text: block.headingText || "" });

      // If current chunk has significant content, flush before starting new section
      if (currentChunkTokens >= targetTokens * 0.6) {
        flushChunk();
      }

      // Open a fresh section for the heading that just started
      closeSection();
      const headingPath = getCurrentHeadingPath();
      currentSection = {
        heading: {
          level,
          text: block.headingText || "",
          slug: slugifyHeading(block.headingText || ""),
          path: headingPath,
        },
        content: "",
      };

      currentChunkBlocks.push(block);
      currentChunkTokens += estimateTokenCount(block.raw);
      continue;
    }

    const blockTokens = estimateTokenCount(block.raw);

    // If single block is huge (e.g. large code block or paragraph), split it
    if (blockTokens > maxTokens) {
      flushChunk();
      const subLines = block.lines;
      let subBuffer: string[] = [];
      let subTokens = 0;

      for (const line of subLines) {
        const lineTokens = estimateTokenCount(line);
        if (subTokens + lineTokens > targetTokens && subBuffer.length > 0) {
          currentChunkBlocks.push({
            type: block.type,
            raw: subBuffer.join("\n"),
            lines: subBuffer,
          });
          flushChunk();
          subBuffer = [];
          subTokens = 0;
        }
        subBuffer.push(line);
        subTokens += lineTokens;
      }

      if (subBuffer.length > 0) {
        currentChunkBlocks.push({
          type: block.type,
          raw: subBuffer.join("\n"),
          lines: subBuffer,
        });
        currentChunkTokens += subTokens;
      }
      continue;
    }

    if (currentChunkTokens + blockTokens > maxTokens && currentChunkBlocks.length > 0) {
      flushChunk();
    }

    currentChunkBlocks.push(block);
    currentChunkTokens += blockTokens;

    if (currentChunkTokens >= targetTokens) {
      flushChunk();
    }
  }

  flushChunk();
  closeSection();

  // Patch totalChunks in all chunk metadata
  const total = chunks.length;
  for (const chunk of chunks) {
    chunk.metadata.totalChunks = total;
  }

  return { chunks, sections };
}
