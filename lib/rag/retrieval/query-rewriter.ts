import type { RetrievalQuery } from "../types/retrieval";

const KNOWN_PROJECTS = [
  { name: "Vortex", keys: ["vortex", "media player", "exoplayer", "streaming", "compose multiplatform"] },
  { name: "Aplicatie Teka", keys: ["teka", "aplicatie-teka", "industrial", "machine automation"] },
  { name: "Coral Tech", keys: ["coral", "coraltech", "underwater"] },
  { name: "Siteauto", keys: ["siteauto", "car", "auto"] },
  { name: "Liceul", keys: ["liceul", "high school"] },
  { name: "Primarie", keys: ["primarie", "municipal", "e-services"] },
  { name: "Jarvis", keys: ["jarvis", "os helper", "agent"] },
  { name: "Detectie", keys: ["detectie", "yolo", "detection"] },
  { name: "OmniStudio", keys: ["omnistudio"] },
];

export function generateQueryVariants(
  query: RetrievalQuery,
  maxVariants = 3
): string[] {
  const normalized = query.normalizedQuery;
  const lower = normalized.toLowerCase();
  const variants: Set<string> = new Set([normalized]);

  // 1. Check if query is a conversational follow-up relying on history (e.g. "open the project page", "tell me more about it")
  let activeTopic = "";
  if (query.history && query.history.length > 0) {
    const recentText = query.history
      .slice(-3)
      .map((t) => t.content.toLowerCase())
      .join(" ");

    for (const p of KNOWN_PROJECTS) {
      if (p.keys.some((k) => recentText.includes(k))) {
        activeTopic = p.name;
        break;
      }
    }

    const isFollowUp =
      lower.includes("the project") ||
      lower.includes("project page") ||
      lower.includes("open it") ||
      lower.includes("open the page") ||
      lower.includes("tell me more") ||
      lower.includes("show me") ||
      lower.includes("what stack") ||
      lower.includes("how does it work") ||
      lower.includes("case study");

    if (isFollowUp && activeTopic) {
      variants.add(`${activeTopic} project case study overview architecture features`);
      variants.add(`${activeTopic} ${normalized}`);
    }
  }

  // 2. Specific domain expansions for portfolio projects & technologies
  const effectiveSubject = lower.includes("vortex") || activeTopic === "Vortex" ? "vortex" : lower;

  if (effectiveSubject.includes("vortex")) {
    if (lower.includes("stream") || lower.includes("play") || lower.includes("media") || lower.includes("page")) {
      variants.add("Vortex Media3 ExoPlayer mpv DriveStreamProxy streaming architecture");
      variants.add("Vortex video playback subtitle audio routing remote storage");
    } else if (lower.includes("download") || lower.includes("offline")) {
      variants.add("Vortex WorkManager offline download queue pause resume retry");
    } else if (lower.includes("auth") || lower.includes("google") || lower.includes("drive")) {
      variants.add("Vortex Google Drive OAuth device flow loopback credentials");
    } else {
      variants.add("Vortex media streaming Kotlin Multiplatform Android TV desktop");
    }
  } else if (lower.includes("teka") || lower.includes("aplicatie") || activeTopic === "Aplicatie Teka") {
    variants.add("Aplicatie Teka industrial machine automation monitoring React");
  } else if (lower.includes("coral") || lower.includes("underwater") || activeTopic === "Coral Tech") {
    variants.add("Coral Tech underwater discovery marine biology Next.js website");
  } else if (lower.includes("ml") || lower.includes("machine learning") || lower.includes("yolo")) {
    variants.add("Machine learning models YOLO detection PyTorch training runs dataset");
  } else if (lower.includes("skills") || lower.includes("stack") || lower.includes("technologies")) {
    variants.add("Software developer skills Kotlin TypeScript Python React Next.js C++");
  } else if (lower.includes("education") || lower.includes("etti") || lower.includes("student")) {
    variants.add("ETTI CTI Bucharest Computer Information Technology student education");
  } else if (lower.includes("contact") || lower.includes("email") || lower.includes("hire")) {
    variants.add("Catalin contact email github linkedin software engineer");
  }

  // If query is very short (1-2 words), expand with synonyms
  const words = normalized.split(/\s+/);
  if (words.length <= 2) {
    variants.add(`${normalized} project features architecture implementation`);
  }

  return Array.from(variants).slice(0, maxVariants);
}
