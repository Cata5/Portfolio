/**
 * Builds the lexical corpus index the static ("offline archive") assistant
 * searches on GitHub Pages.
 *
 * On the static export there is no server, so the real ingestion pipeline
 * (filesystem scan + embeddings + reranker) cannot run. What *is* available is
 * the CMS content itself: every `content/*.json` the site renders already ships
 * in the client bundle. This module flattens that content into the same
 * {@link Chunk} shape `lib/rag/lexical/bm25.ts` consumes, so the exact BM25
 * engine that powers the live retriever also powers the static search - no new
 * runtime, no extra payload, and no second copy of the facts.
 *
 * Chunk body convention: `content` is a lead line followed by one item per
 * line, so the extractive answer builder can use the lead as prose and the
 * remaining lines as bullets.
 */

import type { Chunk } from "../types/document";
import { tokenizeLexical } from "../lexical/tokenizer";
import type { OfflineAction } from "./types";

/** Structural view of the CMS content the offline index needs. */
export interface OfflineCorpusSource {
  site?: {
    name?: string;
    role?: string;
    email?: string;
    github?: string;
    linkedin?: string;
    instagram?: string;
    url?: string;
    tagline?: string;
    description?: string;
    currently?: { label?: string; project?: string; stack?: string; status?: string };
  };
  copy?: {
    about?: { heading?: string; paragraph1?: string; paragraph2?: string };
    contact?: { heading?: string; description?: string };
    journey?: { description?: string };
    activities?: { title?: string };
  };
  skills?: {
    skillGroups?: { label: string; note?: string; items: string[] }[];
  };
  ml?: {
    hardware?: string;
    runs?: {
      model?: string;
      dataset?: string;
      framework?: string;
      hardware?: string;
      training?: string;
      notes?: string;
    }[];
  };
  journey?: {
    date?: string;
    category?: string;
    title?: string;
    note?: string;
    tags?: string[];
  }[];
  activities?: {
    type?: string;
    year?: string;
    location?: string;
    title?: string;
    description?: string;
  }[];
  certifications?: {
    title?: string;
    subtitle?: string;
    issuer?: string;
    year?: string;
    tags?: string[];
  }[];
  projects?: {
    id: string;
    title: string;
    category?: string;
    platform?: string;
    year?: number | null;
    status?: string;
    summary?: string;
    description?: string;
    architecture?: string;
    technologies?: string[];
    features?: string[];
    limitations?: string[];
    futureWork?: string[];
  }[];
  roadmap?: {
    intro?: string;
    stages?: { n?: number; title?: string; status?: string; summary?: string; items?: string[] }[];
    runsSection?: { title?: string; intro?: string };
    runs?: { title?: string; model?: string; config?: string; lossStart?: number; lossEnd?: number; note?: string }[];
  };
}

const FILES = {
  projects: "content/projects.json",
  skills: "content/skills.json",
  ml: "content/ml.json",
  journey: "content/journey.json",
  activities: "content/activities.json",
  certifications: "content/certifications.json",
  copy: "content/copy.json",
  site: "content/site.json",
  roadmap: "content/roadmap.json",
} as const;

interface ChunkDraft {
  id: string;
  title: string;
  heading?: string;
  lead: string;
  items?: string[];
  tags?: string[];
  filePath: string;
}

/** Trims text to a sentence boundary near `max`, so leads never cut mid-word. */
function clip(text: string | undefined, max = 320): string {
  const value = (text ?? "").replace(/\s+/g, " ").trim();
  if (value.length <= max) return value;
  const window = value.slice(0, max);
  const sentence = Math.max(window.lastIndexOf(". "), window.lastIndexOf("! "), window.lastIndexOf("? "));
  if (sentence > max * 0.4) return window.slice(0, sentence + 1).trim();
  const space = window.lastIndexOf(" ");
  return `${window.slice(0, space > 0 ? space : max).trim()}…`;
}

function cleanLine(text: string | undefined, max = 220): string {
  return clip(text, max);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Builds one indexable chunk. Metadata is fully deterministic (no clock, no
 * randomness) so the index is identical on the server, on the client and
 * across rebuilds.
 */
function makeChunk(draft: ChunkDraft): Chunk {
  const items = (draft.items ?? []).map((item) => item.trim()).filter(Boolean);
  const content = [draft.lead.trim(), ...items].filter(Boolean).join("\n");
  const moduleId = draft.id.split(":")[0];

  return {
    id: draft.id,
    documentId: moduleId,
    content,
    cleanContent: content,
    metadata: {
      documentId: moduleId,
      chunkId: draft.id,
      title: draft.title,
      heading: draft.heading,
      headingPath: draft.heading ? [draft.title, draft.heading] : [draft.title],
      source: draft.filePath.split("/").pop() ?? draft.filePath,
      filePath: draft.filePath,
      fileType: "json",
      chunkIndex: 0,
      totalChunks: 1,
      documentHash: draft.id,
      tokenCount: tokenizeLexical(content, { stem: false }).length,
      charCount: content.length,
      tags: draft.tags,
      createdAt: 0,
      updatedAt: 0,
    },
  };
}

/** Site-wide facts: who Catalin is, where he studies, how to reach him. */
function identityChunks(source: OfflineCorpusSource): Chunk[] {
  const chunks: Chunk[] = [];
  const { site, copy } = source;
  const about = copy?.about;

  const bio = [about?.paragraph1, about?.paragraph2].filter(Boolean).join(" ");
  if (bio || site?.tagline) {
    chunks.push(
      makeChunk({
        id: "bio",
        title: "About Catalin",
        heading: "Profile",
        lead: clip(about?.heading ?? site?.tagline, 200),
        items: [
          cleanLine(about?.paragraph1, 400),
          cleanLine(about?.paragraph2, 300),
          site?.tagline ? cleanLine(site.tagline, 300) : "",
        ],
        tags: ["about", "bio", "profile", "background", "who is catalin", "manu catalin-gabriel"],
        filePath: FILES.copy,
      })
    );
  }

  if (site?.role || about?.paragraph1) {
    chunks.push(
      makeChunk({
        id: "education",
        title: "Education",
        heading: "University",
        lead: clip(site?.role, 160),
        items: [
          cleanLine(about?.paragraph1, 400),
          cleanLine(site?.description, 260),
          site?.currently?.project
            ? `Currently building ${site.currently.project} (${site.currently.stack ?? ""}) — ${site.currently.status ?? ""}`.replace(/\s+/g, " ").trim()
            : "",
        ],
        tags: [
          "education",
          "studies",
          "student",
          "university",
          "faculty",
          "etti",
          "politehnica",
          "bucharest",
          "degree",
          "cti",
        ],
        filePath: FILES.site,
      })
    );
  }

  if (site?.email || copy?.contact) {
    chunks.push(
      makeChunk({
        id: "contact",
        title: "Contact & Channels",
        heading: "Contact",
        lead: clip(copy?.contact?.heading ?? "Direct contact channels", 160),
        items: [
          cleanLine(copy?.contact?.description, 260),
          site?.email ? `Email: ${site.email}` : "",
          site?.github ? `GitHub: ${site.github}` : "",
          site?.linkedin ? `LinkedIn: ${site.linkedin}` : "",
          site?.instagram ? `Instagram: ${site.instagram}` : "",
          site?.url ? `Portfolio: ${site.url}` : "",
        ],
        tags: [
          "contact",
          "email",
          "github",
          "linkedin",
          "instagram",
          "reach out",
          "hire",
          "internship",
          "message",
          "socials",
        ],
        filePath: FILES.site,
      })
    );
  }

  return chunks;
}

/** One chunk per skill group, so broad "stack" questions merge several. */
function skillChunks(source: OfflineCorpusSource): Chunk[] {
  return (source.skills?.skillGroups ?? []).map((group) =>
    makeChunk({
      id: `skills:${slugify(group.label)}`,
      title: group.label,
      heading: group.label,
      lead: group.note ? `${group.label} — ${group.note}` : `${group.label} skills`,
      items: group.items,
      tags: [
        "skills",
        "stack",
        "technologies",
        "tech stack",
        "tools",
        "languages",
        "frameworks",
        slugify(group.label),
      ],
      filePath: FILES.skills,
    })
  );
}

function projectChunks(source: OfflineCorpusSource): Chunk[] {
  const projects = source.projects ?? [];
  const chunks: Chunk[] = [];

  for (const project of projects) {
    const meta = Array.from(
      new Set(
        [project.category, project.platform, project.year ? String(project.year) : "", project.status].filter(
          Boolean
        )
      )
    ).join(" · ");

    chunks.push(
      makeChunk({
        id: `project:${project.id}`,
        title: project.title,
        heading: project.title,
        lead: clip(project.summary ?? project.description, 300),
        items: [
          meta ? `${project.title} — ${meta}` : "",
          project.technologies?.length ? `Technologies: ${clip(project.technologies.join(", "), 280)}` : "",
          ...(project.features ?? []).slice(0, 8).map((feature) => cleanLine(feature, 220)),
          project.architecture ? cleanLine(project.architecture, 280) : "",
        ],
        tags: [
          "project",
          "projects",
          "portfolio work",
          project.id,
          project.title,
          project.category ?? "",
          project.platform ?? "",
        ],
        filePath: FILES.projects,
      })
    );

    const detailItems = [
      ...(project.limitations ?? []).slice(0, 6).map((item) => cleanLine(item, 220)),
      ...(project.futureWork ?? []).slice(0, 4).map((item) => `Planned: ${cleanLine(item, 200)}`),
    ].filter(Boolean);

    if (detailItems.length > 0 || project.description) {
      chunks.push(
        makeChunk({
          id: `project:${project.id}:detail`,
          title: project.title,
          heading: `${project.title} — limitations & future work`,
          lead: clip(project.description, 320),
          items: detailItems,
          tags: [
            project.id,
            project.title,
            "challenges",
            "limitations",
            "trade-offs",
            "future work",
            "what went wrong",
          ],
          filePath: FILES.projects,
        })
      );
    }
  }

  chunks.push(
    makeChunk({
      id: "projects:all",
      title: "All Projects",
      heading: "Project directory",
      lead: `Catalin has ${projects.length} projects in the portfolio:`,
      items: projects.map((project) =>
        `${project.title} (${project.id}) — ${clip(project.summary, 140)}`
      ),
      tags: ["projects", "all projects", "project list", "directory", "portfolio", "built", "made"],
      filePath: FILES.projects,
    })
  );

  return chunks;
}

function mlChunks(source: OfflineCorpusSource): Chunk[] {
  const runs = source.ml?.runs ?? [];
  if (runs.length === 0 && !source.ml?.hardware) return [];

  return [
    makeChunk({
      id: "ml:runs",
      title: "Machine Learning Runs",
      heading: "Training runs",
      lead: `Catalin has run ${runs.length} machine learning experiments:`,
      items: runs.map((run) =>
        [
          run.model,
          run.framework ? `framework: ${run.framework}` : "",
          run.dataset ? `dataset: ${run.dataset}` : "",
          run.hardware ? `hardware: ${run.hardware}` : "",
          run.training && run.training !== "-" ? `training: ${run.training}` : "",
          cleanLine(run.notes, 240),
        ]
          .filter(Boolean)
          .join(" — ")
      ),
      tags: [
        "ml",
        "machine learning",
        "models",
        "experiments",
        "trained",
        "training",
        "object detection",
        "yolo",
        "pytorch",
        "unsloth",
        "qlora",
      ],
      filePath: FILES.ml,
    }),
    makeChunk({
      id: "ml:hardware",
      title: "ML Training Hardware",
      heading: "Hardware",
      lead: `Training hardware: ${clip(source.ml?.hardware, 160)}`,
      items: runs.map((run) => `${run.model}: ${cleanLine(run.hardware, 120)}`),
      tags: ["ml", "machine learning", "hardware", "gpu", "rtx", "cuda", "rtx 3060", "ram", "ryzen"],
      filePath: FILES.ml,
    }),
  ];
}

function journeyChunks(source: OfflineCorpusSource): Chunk[] {
  const entries = source.journey ?? [];
  if (entries.length === 0) return [];

  return [
    ...entries.map((entry, index) =>
      makeChunk({
        id: `journey:${index}`,
        title: entry.title ?? `Milestone ${index + 1}`,
        heading: `${entry.title ?? "Milestone"}${entry.date ? ` (${entry.date})` : ""}`,
        lead: clip(entry.note, 280),
        items: [entry.date ? `Date: ${entry.date}` : ""],
        tags: ["journey", "timeline", "experience", "milestone", entry.category ?? "", ...(entry.tags ?? [])],
        filePath: FILES.journey,
      })
    ),
    makeChunk({
      id: "journey:all",
      title: "Engineering Timeline",
      heading: "Timeline & milestones",
      lead: clip(source.copy?.journey?.description, 220) || "Engineering milestones, most recent first:",
      items: entries.map((entry) => `${entry.date ?? ""} — ${entry.title ?? ""}: ${clip(entry.note, 160)}`),
      tags: ["journey", "timeline", "experience", "history", "milestones", "career"],
      filePath: FILES.journey,
    }),
  ];
}

function activityChunks(source: OfflineCorpusSource): Chunk[] {
  const activities = source.activities ?? [];
  if (activities.length === 0) return [];

  return [
    makeChunk({
      id: "activities:all",
      title: "Hackathons & Activities",
      heading: "Competitions & community",
      lead: clip(source.copy?.activities?.title, 120) || "Hackathons, competitions and community work:",
      items: activities.map((activity) =>
        [
          `${activity.year ?? ""} ${activity.title ?? ""}`.trim(),
          activity.type,
          activity.location,
          cleanLine(activity.description, 220),
        ]
          .filter(Boolean)
          .join(" — ")
      ),
      tags: [
        "activities",
        "hackathon",
        "hackathons",
        "competition",
        "awards",
        "unihack",
        "robotics",
        "ftc",
        "first tech challenge",
        "leadership",
      ],
      filePath: FILES.activities,
    }),
  ];
}

function certificationChunks(source: OfflineCorpusSource): Chunk[] {
  const certifications = source.certifications ?? [];
  if (certifications.length === 0) return [];

  return [
    makeChunk({
      id: "certifications:all",
      title: "Certifications",
      heading: "Credentials",
      lead: `${certifications.length} certifications:`,
      items: certifications.map((certification) =>
        [
          [certification.title, certification.subtitle].filter(Boolean).join(" — "),
          certification.issuer,
          certification.year,
          (certification.tags ?? []).join(", "),
        ]
          .filter(Boolean)
          .join(" · ")
      ),
      tags: ["certifications", "certificate", "credentials", "cisco", "ccna", "networking", "course"],
      filePath: FILES.certifications,
    }),
  ];
}

/** The CataAI ("LLM from scratch") build roadmap and recorded runs. */
function roadmapChunks(source: OfflineCorpusSource): Chunk[] {
  const roadmap = source.roadmap;
  if (!roadmap) return [];

  const chunks: Chunk[] = [];
  const stages = roadmap.stages ?? [];

  if (stages.length > 0) {
    chunks.push(
      makeChunk({
        id: "roadmap:stages",
        title: "CataAI — LLM from Scratch",
        heading: "Build roadmap",
        lead: clip(roadmap.intro, 260),
        items: stages.map((stage) =>
          `${stage.n ?? ""}. ${stage.title ?? ""} (${stage.status ?? ""}) — ${cleanLine(stage.summary, 200)}`.trim()
        ),
        tags: [
          "cataai",
          "llm from scratch",
          "from scratch",
          "roadmap",
          "transformer",
          "attention",
          "tokenizer",
          "pytorch",
          "language model",
        ],
        filePath: FILES.roadmap,
      })
    );
  }

  const runs = roadmap.runs ?? [];
  if (runs.length > 0) {
    chunks.push(
      makeChunk({
        id: "roadmap:runs",
        title: "CataAI — Training Runs",
        heading: roadmap.runsSection?.title ?? "Training runs",
        lead: clip(roadmap.runsSection?.intro, 260),
        items: runs.map((run) =>
          [
            run.title,
            run.model,
            run.config,
            typeof run.lossStart === "number" && typeof run.lossEnd === "number"
              ? `loss ${run.lossStart} → ${run.lossEnd}`
              : "",
          ]
            .filter(Boolean)
            .join(" — ")
        ),
        tags: ["cataai", "training runs", "loss", "bigram", "attention", "model", "from scratch"],
        filePath: FILES.roadmap,
      })
    );
  }

  return chunks;
}

/** Flattens the CMS content into BM25-ready chunks. */
export function buildCorpusChunks(source: OfflineCorpusSource): Chunk[] {
  return [
    ...identityChunks(source),
    ...skillChunks(source),
    ...projectChunks(source),
    ...mlChunks(source),
    ...journeyChunks(source),
    ...activityChunks(source),
    ...certificationChunks(source),
    ...roadmapChunks(source),
  ];
}

/**
 * Navigation action for a corpus chunk: a project opens its case study, every
 * other record scrolls to the section that renders it.
 */
export function actionForChunkId(chunkId: string, title: string): OfflineAction | null {
  const [moduleId, key] = chunkId.split(":");

  if (moduleId === "project") {
    return {
      id: `route-/projects/${key}`,
      label: `Open ${title}`,
      type: "route",
      target: `/projects/${key}`,
    };
  }

  const SCROLL_TARGETS: Record<string, { target: string; label: string }> = {
    bio: { target: "about", label: "View the About Section" },
    education: { target: "about", label: "View the About Section" },
    contact: { target: "contact", label: "View Contact Channels" },
    skills: { target: "stack", label: "View the Tech Stack" },
    ml: { target: "ml", label: "View the ML Notebook" },
    journey: { target: "journey", label: "View the Timeline" },
    // The Activities section is disabled on the page; its events live in the
    // Timeline, so that is where the action points.
    activities: { target: "journey", label: "View the Timeline" },
    certifications: { target: "certifications", label: "View Certifications" },
    projects: { target: "projects", label: "Browse All Projects" },
  };

  if (moduleId === "roadmap") {
    return {
      id: "route-/projects/llm-from-scratch",
      label: "Open the CataAI Project Page",
      type: "route",
      target: "/projects/llm-from-scratch",
    };
  }

  const scroll = SCROLL_TARGETS[moduleId];
  if (!scroll) return null;

  return {
    id: `scroll-${scroll.target}`,
    label: scroll.label,
    type: "scroll",
    target: scroll.target,
  };
}
