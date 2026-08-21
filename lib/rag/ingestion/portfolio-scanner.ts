import { promises as fs } from "fs";
import path from "path";
import { computeContentHash } from "./registry";
import { parseMarkdownFile } from "./parsers/markdown";
import { parseJsonFile } from "./parsers/json";
import { parseCodeFile } from "./parsers/code";
import { parseTextFile } from "./parsers/text";
import type { Chunk, Document } from "../types/document";

export interface ScannedFile {
  id: string;
  filePath: string;
  relativePath: string;
  title: string;
  content: string;
  hash: string;
  fileType: "markdown" | "code" | "json" | "text";
}

export async function scanPortfolioFiles(rootDir?: string): Promise<ScannedFile[]> {
  const cwd = rootDir || process.cwd();
  const scanned: ScannedFile[] = [];

  const candidatePaths = [
    // Markdown docs
    { rel: "PROJECT_ANALYSIS.md", title: "Project Analysis (Verified Claims)", type: "markdown" as const },
    { rel: "PRODUCT.md", title: "Product Strategy & Brand Commitments", type: "markdown" as const },
    { rel: "README.md", title: "Portfolio Repository Overview", type: "markdown" as const },
    { rel: "AGENTS.md", title: "Next.js Agent Guidelines", type: "markdown" as const },

    // Content JSON files
    { rel: "content/projects.json", title: "Portfolio Projects Directory", type: "json" as const },
    { rel: "content/skills.json", title: "Technical Skills & Competencies", type: "json" as const },
    { rel: "content/journey.json", title: "Professional Journey & Milestones", type: "json" as const },
    { rel: "content/ml.json", title: "Machine Learning Experiments & Notebook", type: "json" as const },
    { rel: "content/site.json", title: "Site Profile & Contact Information", type: "json" as const },
    { rel: "content/activities.json", title: "Activities & Extracurriculars", type: "json" as const },
    { rel: "content/certifications.json", title: "Certifications & Credentials", type: "json" as const },
    { rel: "content/copy.json", title: "Portfolio Copy & Text Content", type: "json" as const },

    // Data TS files
    { rel: "data/projects.ts", title: "Projects Data Model & Helpers", type: "code" as const },
    { rel: "data/site.ts", title: "Site Configuration & Socials", type: "code" as const },
    { rel: "data/skills.ts", title: "Skills Data Types & Helpers", type: "code" as const },
    { rel: "data/journey.ts", title: "Journey Timeline Types", type: "code" as const },
    { rel: "data/ml.ts", title: "Machine Learning Types", type: "code" as const },

    // Core application architecture
    { rel: "next.config.ts", title: "Next.js Build & Export Configuration", type: "code" as const },
    { rel: "app/page.tsx", title: "Portfolio Home Page Layout", type: "code" as const },
    { rel: "app/layout.tsx", title: "Root Layout & Schema.org Metadata", type: "code" as const },
    { rel: "app/projects/[slug]/page.tsx", title: "Project Detail Dynamic Route", type: "code" as const },
    { rel: "components/triangle-world/world.tsx", title: "WebGL Triangle World Background Simulation", type: "code" as const },
    { rel: "components/ml/ml-notebook.tsx", title: "ML Notebook Component & Visualizer", type: "code" as const },
    { rel: "components/hero/hero.tsx", title: "Hero Section with GSAP Animations", type: "code" as const },
  ];

  for (const item of candidatePaths) {
    const fullPath = path.join(cwd, item.rel);
    try {
      const content = await fs.readFile(fullPath, "utf8");
      const hash = computeContentHash(content);
      const id = item.rel.replace(/[/\\]/g, "_").replace(/\.[a-zA-Z0-9]+$/, "");

      scanned.push({
        id,
        filePath: item.rel,
        relativePath: item.rel,
        title: item.title,
        content,
        hash,
        fileType: item.type,
      });
    } catch {
      // File not found or not accessible, skip gracefully
    }
  }

  return scanned;
}

export function parseScannedFile(scanned: ScannedFile): { document: Document; chunks: Chunk[] } {
  switch (scanned.fileType) {
    case "markdown":
      return parseMarkdownFile(
        scanned.id,
        scanned.filePath,
        scanned.content,
        scanned.hash,
        scanned.title
      );
    case "json":
      return parseJsonFile(
        scanned.id,
        scanned.filePath,
        scanned.content,
        scanned.hash,
        scanned.title
      );
    case "code":
      return parseCodeFile(
        scanned.id,
        scanned.filePath,
        scanned.content,
        scanned.hash,
        scanned.title
      );
    case "text":
    default:
      return parseTextFile(
        scanned.id,
        scanned.filePath,
        scanned.content,
        scanned.hash,
        scanned.title
      );
  }
}
