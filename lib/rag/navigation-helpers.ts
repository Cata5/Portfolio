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

  const routeMatch = responseContent.match(/\[ACTION:\s*route\s*([a-zA-Z0-9_/.-]+)\]/i);
  if (routeMatch) {
    const targetPath = routeMatch[1];
    return [
      {
        id: `route-${targetPath}`,
        label: `Open ${targetPath}`,
        type: "route",
        target: targetPath,
        description: `Navigate to ${targetPath}`,
        icon: "rocket",
      },
    ];
  }

  // If model explicitly specified none or did not output a tag, do not hardcode a scroll
  return [];
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
