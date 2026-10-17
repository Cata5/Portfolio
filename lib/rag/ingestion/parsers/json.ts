import { chunkMarkdownDocument } from "../../chunking/markdown-chunker";
import type { MarkdownChunkerOptions } from "../../chunking/markdown-chunker";
import { chunkTextDocument } from "../../chunking/text-chunker";
import type { Chunk, Document } from "../../types/document";

interface ParsedChallenge {
  problem: string;
  solution: string;
}

export function parseJsonFile(
  documentId: string,
  filePath: string,
  rawContent: string,
  hash: string,
  customTitle?: string,
  options?: MarkdownChunkerOptions
): { document: Document; chunks: Chunk[] } {
  const fileName = filePath.split(/[/\\]/).pop() || documentId;
  const title = customTitle || fileName.replace(/\.json$/i, "");
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawContent);
  } catch {
    // Fallback to text chunking if JSON invalid
    const chunks = chunkTextDocument(documentId, title, filePath, rawContent, hash, {
      fileType: "json",
    });
    return {
      document: {
        id: documentId,
        title,
        filePath,
        fileType: "json",
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
      },
      chunks,
    };
  }

  // Convert structured JSON to rich semantic markdown representation
  let markdown = `# ${title}\n\n`;

  if (Array.isArray(parsed)) {
    // Array of objects (e.g. projects, journey, activities)
    for (const item of parsed) {
      if (item && typeof item === "object") {
        const itemObj = item as Record<string, unknown>;
        const itemTitle = String(itemObj.title || itemObj.name || itemObj.role || itemObj.id || "Item");
        markdown += `## ${itemTitle}\n\n`;

        if (itemObj.summary) markdown += `**Summary:** ${itemObj.summary}\n\n`;
        if (itemObj.category) markdown += `**Category:** ${itemObj.category}\n\n`;
        if (itemObj.technologies && Array.isArray(itemObj.technologies)) {
          markdown += `**Technologies:** ${itemObj.technologies.join(", ")}\n\n`;
        }
        if (itemObj.status) markdown += `**Status:** ${itemObj.status}\n\n`;
        if (itemObj.year) markdown += `**Year:** ${itemObj.year}\n\n`;
        if (itemObj.period) markdown += `**Period:** ${itemObj.period}\n\n`;
        if (itemObj.company) markdown += `**Company / Organization:** ${itemObj.company}\n\n`;
        if (itemObj.github) markdown += `**GitHub:** ${itemObj.github}\n\n`;
        if (itemObj.demo) markdown += `**Demo:** ${itemObj.demo}\n\n`;
        if (itemObj.description) markdown += `**Description:** ${itemObj.description}\n\n`;

        if (itemObj.features && Array.isArray(itemObj.features) && itemObj.features.length > 0) {
          markdown += `### Features\n${itemObj.features.map((f: unknown) => `- ${String(f)}`).join("\n")}\n\n`;
        }
        if (itemObj.partialFeatures && Array.isArray(itemObj.partialFeatures) && itemObj.partialFeatures.length > 0) {
          markdown += `### Partial / In-Progress Features\n${itemObj.partialFeatures.map((f: unknown) => `- ${String(f)}`).join("\n")}\n\n`;
        }
        if (itemObj.plannedFeatures && Array.isArray(itemObj.plannedFeatures) && itemObj.plannedFeatures.length > 0) {
          markdown += `### Planned Features\n${itemObj.plannedFeatures.map((f: unknown) => `- ${String(f)}`).join("\n")}\n\n`;
        }
        if (itemObj.architecture) {
          markdown += `### Architecture\n${itemObj.architecture}\n\n`;
        }
        if (itemObj.challenges && Array.isArray(itemObj.challenges) && itemObj.challenges.length > 0) {
          const challenges = itemObj.challenges as ParsedChallenge[];
          markdown += `### Challenges & Solutions\n${challenges.map((c) => `- **${c.problem}:** ${c.solution}`).join("\n")}\n\n`;
        }
        if (itemObj.learned && Array.isArray(itemObj.learned) && itemObj.learned.length > 0) {
          markdown += `### What Was Learned\n${itemObj.learned.map((l: unknown) => `- ${String(l)}`).join("\n")}\n\n`;
        }
        if (itemObj.limitations && Array.isArray(itemObj.limitations) && itemObj.limitations.length > 0) {
          markdown += `### Known Limitations\n${itemObj.limitations.map((lim: unknown) => `- ${String(lim)}`).join("\n")}\n\n`;
        }

        // Generic field fallback for other properties
        for (const [k, v] of Object.entries(itemObj)) {
          if (
            ![
              "title",
              "name",
              "role",
              "id",
              "summary",
              "category",
              "technologies",
              "status",
              "year",
              "period",
              "company",
              "github",
              "demo",
              "description",
              "features",
              "partialFeatures",
              "plannedFeatures",
              "architecture",
              "challenges",
              "learned",
              "limitations",
              "screenshots",
              "image",
            ].includes(k) &&
            v !== undefined &&
            v !== null
          ) {
            markdown += `**${k}:** ${typeof v === "object" ? JSON.stringify(v) : String(v)}\n\n`;
          }
        }
      }
    }
  } else if (typeof parsed === "object" && parsed !== null) {
    const parsedObj = parsed as Record<string, unknown>;

    // 1. Special handling for content/skills.json
    if (Array.isArray(parsedObj.skillGroups)) {
      markdown += `Catalin's primary programming languages, frameworks, libraries, and technical competencies:\n\n`;
      for (const group of parsedObj.skillGroups as Array<{ label: string; note?: string; items?: string[] }>) {
        markdown += `## ${group.label}\n`;
        if (group.note) markdown += `*${group.note}*\n\n`;
        if (Array.isArray(group.items)) {
          markdown += `Primary ${group.label.toLowerCase()}: **${group.items.join(", ")}**\n\n`;
          markdown += `${group.items.map((it) => `- ${it}`).join("\n")}\n\n`;
        }
      }
      if (Array.isArray(parsedObj.focusAreas)) {
        markdown += `## Focus Areas\n`;
        for (const fa of parsedObj.focusAreas as Array<{ label: string; note?: string }>) {
          markdown += `- **${fa.label}:** ${fa.note || ""}\n`;
        }
        markdown += `\n`;
      }
    }
    // 2. Special handling for content/site.json
    else if (parsedObj.name && (parsedObj.role || parsedObj.tagline)) {
      markdown += `## Profile & Contact\n`;
      markdown += `**Name:** ${parsedObj.name}\n`;
      markdown += `**Role & Education:** ${parsedObj.role}\n`;
      markdown += `**Tagline:** ${parsedObj.tagline}\n`;
      markdown += `**Description:** ${parsedObj.description}\n`;
      markdown += `**Email:** ${parsedObj.email}\n`;
      markdown += `**GitHub:** ${parsedObj.github}\n`;
      markdown += `**LinkedIn:** ${parsedObj.linkedin}\n\n`;

      if (parsedObj.currently && typeof parsedObj.currently === "object") {
        const cur = parsedObj.currently as Record<string, string>;
        markdown += `### Currently Building\n`;
        markdown += `**Project:** ${cur.project}\n`;
        markdown += `**Stack:** ${cur.stack}\n`;
        markdown += `**Status:** ${cur.status}\n\n`;
      }
    }
    // 3. Special handling for content/ml.json
    else if (Array.isArray(parsedObj.runs)) {
      markdown += `Machine Learning experiments, trained architectures, datasets, and local inference runs:\n\n`;
      if (parsedObj.hardware) {
        markdown += `**Training & Inference Hardware:** ${parsedObj.hardware}\n\n`;
      }
      for (const run of parsedObj.runs as Array<{ model: string; dataset?: string; framework?: string; training?: string; notes?: string }>) {
        markdown += `## ${run.model}\n`;
        if (run.dataset) markdown += `**Dataset:** ${run.dataset}\n`;
        if (run.framework) markdown += `**Framework & Libraries:** ${run.framework}\n`;
        if (run.training && run.training !== "—") markdown += `**Training Configuration:** ${run.training}\n`;
        if (run.notes) markdown += `**Details & Integration:** ${run.notes}\n`;
        markdown += `\n`;
      }
    }
    // 4. Generic JSON object fallback
    else {
      for (const [key, value] of Object.entries(parsedObj)) {
        markdown += `## ${key}\n\n`;
        if (typeof value === "object" && value !== null) {
          markdown += `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\`\n\n`;
        } else {
          markdown += `${String(value)}\n\n`;
        }
      }
    }
  }

  const { chunks, sections } = chunkMarkdownDocument(
    documentId,
    title,
    filePath,
    markdown,
    hash,
    options
  );

  const document: Document = {
    id: documentId,
    title,
    filePath,
    fileType: "json",
    rawContent,
    hash,
    sections,
    chunks,
    metadata: {
      title,
      source: title,
      filePath,
      tags: ["json", "portfolio_data"],
      status: "indexed",
      indexedAt: Date.now(),
      updatedAt: Date.now(),
      sizeBytes: Buffer.byteLength(rawContent, "utf8"),
    },
  };

  return { document, chunks };
}
