import projectsJson from "@/content/projects.json";

export type ProjectCategory =
  | "Web"
  | "AI / ML"
  | "Android"
  | "iOS"
  | "Desktop"
  | "Backend"
  | "Systems"
  | "Experiments"
  | "Developer Tools";

export type ProjectStatus =
  | "Active"
  | "Completed"
  | "Experimental"
  | "In Development"
  | "Archived";

export type Project = {
  id: string;
  title: string;
  category: ProjectCategory;
  platform?: string;
  year: number | null;
  status: ProjectStatus;
  summary: string;
  description?: string;
  technologies: string[];
  image: string | null;
  github?: string;
  demo?: string;
  featured: boolean;
  placeholder?: boolean;
  features?: string[];
  partialFeatures?: string[];
  plannedFeatures?: string[];
  architecture?: string;
  architectureDiagram?: string;
  challenges?: { problem: string; solution: string }[];
  learned?: string[];
  screenshots?: string[];
  deviceFrame?: "phone" | "tablet";
  deviceShot?: string;
  appsTitle?: string;
  runtimes?: {
    id: string;
    label: string;
    device: "phone" | "tv" | "desktop";
    shot: string;
    description?: string;
  }[];
  limitations?: string[];
  futureWork?: string[];
  excludeFromRelated?: boolean;
};

export const projects: Project[] = (projectsJson as unknown as Project[]).slice();

projects.sort((a, b) => {
  if (a.year !== null && b.year !== null) return b.year - a.year;
  if (a.year === null && b.year === null) return 0;
  return a.year === null ? 1 : -1;
});

export function getProject(id: string) {
  return projects.find((p) => p.id === id);
}

export const realProjects = projects.filter((p) => !p.placeholder);

const FEATURED_ORDER = [
  "vortex",
  "aplicatie-teka",
  "coraltech",
  "liceul",
  "siteauto",
];

export const featuredProjects = projects
  .filter((p) => p.featured)
  .sort((a, b) => {
    const ia = FEATURED_ORDER.indexOf(a.id);
    const ib = FEATURED_ORDER.indexOf(b.id);
    if (ia === -1 && ib === -1) return 0;
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

export const projectCategories = Array.from(
  new Set(projects.map((p) => p.category)),
);

export function getRelatedProjects(id: string, count = 3) {
  const project = getProject(id);
  if (!project) return [];
  const others = projects.filter(
    (p) => p.id !== id && !p.placeholder && !p.excludeFromRelated,
  );
  const scored = others
    .map((p) => {
      let score = 0;
      if (p.category === project.category) score += 2;
      const shared = p.technologies.filter((t) =>
        project.technologies.includes(t),
      ).length;
      score += shared;
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
  return scored.map((x) => x.p);
}
