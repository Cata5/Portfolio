import { projects } from "@/data/projects";

export interface NavigationAction {
  id: string;
  label: string;
  type: "scroll" | "route" | "external";
  target: string;
  description?: string;
  icon?: "rocket" | "code" | "cpu" | "mail" | "external" | "terminal" | "folder";
}

// Section anchors defined in the portfolio
const PORTFOLIO_SECTIONS: {
  id: string;
  label: string;
  keywords: string[];
  description: string;
  icon: NavigationAction["icon"];
}[] = [
  {
    id: "contact",
    label: "Contact & Reach Channels",
    keywords: ["contact", "email", "hire", "message", "social", "github", "linkedin", "reach out", "connect", "instagram", "phone"],
    description: "Scroll to contact channels and form",
    icon: "mail",
  },
  {
    id: "stack",
    label: "Tech Stack & Skills",
    keywords: ["stack", "skills", "technologies", "tech stack", "languages", "frameworks", "libraries", "competencies"],
    description: "Scroll to skills & competencies grid",
    icon: "code",
  },
  {
    id: "ml",
    label: "ML Experiments Notebook",
    keywords: ["ml", "machine learning", "notebook", "yolo", "mnist", "experiment", "experiments", "pytorch", "train", "training", "weights"],
    description: "Scroll to interactive machine learning visualizer",
    icon: "cpu",
  },
  {
    id: "work",
    label: "Featured Project (Vortex)",
    keywords: ["vortex", "flagship", "best project", "featured project", "main project", "star project", "featured work"],
    description: "Scroll to featured case study",
    icon: "rocket",
  },
  {
    id: "projects",
    label: "All Projects Explorer",
    keywords: ["all projects", "project list", "projects directory", "explorer", "browse projects", "portfolio work"],
    description: "Scroll to project explorer directory",
    icon: "folder",
  },
  {
    id: "about",
    label: "About & Education",
    keywords: ["about", "bio", "education", "university", "faculty", "etti", "who is", "background", "cv", "resume"],
    description: "Scroll to background, timeline & education",
    icon: "terminal",
  },
  {
    id: "journey",
    label: "Journey & Milestones",
    keywords: ["journey", "career", "milestones", "timeline", "history"],
    description: "Scroll to journey timeline",
    icon: "terminal",
  },
  {
    id: "certifications",
    label: "Certifications",
    keywords: ["certifications", "certificate", "credentials", "diploma", "cisco", "ccna"],
    description: "Scroll to certifications & credentials",
    icon: "code",
  },
  {
    id: "activities",
    label: "Activities & Leadership",
    keywords: ["activities", "extracurricular", "leadership", "volunteering", "clubs", "hackathon"],
    description: "Scroll to activities section",
    icon: "terminal",
  },
];

/**
 * Resolves navigation action solely based on the AI model's explicit decision tag.
 * E.g. [ACTION: scroll #work], [ACTION: scroll #stack], [ACTION: scroll #contact], [ACTION: none].
 */
export function detectNavigationActions(
  _query: string,
  responseContent: string
): NavigationAction[] {
  if (!responseContent) return [];

  // An explicit route tag is the most specific instruction the model can give,
  // so it wins over a section scroll when the reply contains both.
  const routeMatch = responseContent.match(/\[ACTION:\s*route\s*([a-zA-Z0-9_/.-]+)\]/i);
  if (routeMatch) {
    const targetPath = routeMatch[1];
    return [
      {
        id: `route-${targetPath}`,
        label: `Open ${projectTitleForRoute(targetPath)}`,
        type: "route",
        target: targetPath,
        description: `Navigate to ${targetPath}`,
        icon: "rocket",
      },
    ];
  }

  // Check for explicit model action tag
  const scrollMatch = responseContent.match(/\[ACTION:\s*scroll\s*#?([a-zA-Z0-9_-]+)\]/i);
  if (scrollMatch) {
    const targetId = scrollMatch[1].toLowerCase().replace(/^#/, "");
    if (targetId === "none") return [];

    const section = PORTFOLIO_SECTIONS.find((s) => s.id === targetId);
    if (section) {
      return [
        {
          id: `scroll-${section.id}`,
          label: `View ${section.label}`,
          type: "scroll",
          target: section.id,
          description: section.description,
          icon: section.icon,
        },
      ];
    }

    // Custom or dynamic section anchor
    return [
      {
        id: `scroll-${targetId}`,
        label: `View #${targetId}`,
        type: "scroll",
        target: targetId,
        description: `Scroll to ${targetId} section`,
        icon: "terminal",
      },
    ];
  }

  // If model explicitly specified none or did not output a tag, do not hardcode a scroll
  return [];
}

/** Ver/verbs that mean "take me to that page" rather than "tell me about it". */
const OPEN_PAGE_INTENT =
  /\b(?:open|go\s+to|navigate\s+to|take\s+me\s+to|bring\s+me\s+to|head\s+to|jump\s+to|visit|show\s+me\s+the\s+page)\b/i;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Visitor-facing name for a `/projects/<id>` route, falling back to the path. */
function projectTitleForRoute(targetPath: string): string {
  const id = targetPath.replace(/^\/?projects\//, "").replace(/\/+$/, "");
  return projects.find((p) => p.id === id)?.title ?? targetPath;
}

/**
 * Resolves an explicit "open the X project page" request to that project's
 * route.
 *
 * Small local models answer these with a generic `[ACTION: scroll #work]`
 * (the flagship-case-study section) instead of the sub-route they were asked
 * for, so the intent is derived from the query, which is unambiguous.
 */
export function resolveExplicitProjectRoute(query: string): NavigationAction | null {
  if (!query || !OPEN_PAGE_INTENT.test(query)) return null;
  const q = query.toLowerCase();

  const matches = projects
    .filter((project) => !!project.id && !project.placeholder)
    .map((project) => {
      const tokens = project.title
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length >= 4);
      return { project, tokens, titleLength: project.title.length };
    })
    .filter(
      ({ project, tokens }) =>
        new RegExp(`\\b${escapeRegExp(project.id)}\\b`, "i").test(q) ||
        tokens.some((token) => new RegExp(`\\b${escapeRegExp(token)}\\b`, "i").test(q))
    )
    // The most specific match wins ("Coral Tech" over a bare "tech").
    .sort((a, b) => b.titleLength - a.titleLength);

  const hit = matches[0];
  if (!hit) return null;

  return {
    id: `route-/projects/${hit.project.id}`,
    label: `Open ${hit.project.title}`,
    type: "route",
    target: `/projects/${hit.project.id}`,
    description: `Navigate to the ${hit.project.title} case study`,
    icon: "rocket",
  };
}

/**
 * The navigation actions for one assistant reply.
 *
 * The model's own tag is honoured, except for an explicit "open the X project
 * page" request, where the query is authoritative (see
 * {@link resolveExplicitProjectRoute}).
 */
export function resolveNavigationActions(
  query: string,
  responseContent: string
): NavigationAction[] {
  const detected = detectNavigationActions(query, responseContent);
  if (detected.some((action) => action.type === "route")) return detected;
  const explicitRoute = resolveExplicitProjectRoute(query);
  if (!explicitRoute) return detected;
  return [explicitRoute];
}

/** Visitor-facing label for a section anchor, when one is known. */
export function getSectionLabel(sectionId: string): string | undefined {
  return PORTFOLIO_SECTIONS.find((s) => s.id === sectionId)?.label;
}

/**
 * Dynamically gets starter prompt suggestions based on active project data and focus areas.
 */
export function getDynamicStarterPrompts(): { label: string; query: string; icon: NavigationAction["icon"] }[] {
  const featured = projects.find((p) => p.featured) || projects[0];

  return [
    {
      label: "Contact & Socials",
      query: "How can I contact Catalin directly?",
      icon: "mail",
    },
    {
      label: "Tech Stack & Skills",
      query: "What are Catalin's primary programming languages and frameworks?",
      icon: "code",
    },
    {
      label: `Flagship: ${featured?.title || "Featured"}`,
      query: `Tell me about ${featured?.title || "your best project"}: how does it work and what technologies are used?`,
      icon: "rocket",
    },
    {
      label: "Machine Learning",
      query: "What machine learning models and experiments has Catalin trained?",
      icon: "cpu",
    },
  ];
}
