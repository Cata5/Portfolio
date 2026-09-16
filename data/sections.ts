import sectionsJson from "@/content/sections.json";

export type SectionType =
  | "hero"
  | "about"
  | "featured-projects"
  | "projects"
  | "stack"
  | "certifications"
  | "ml"
  | "journey"
  | "activities"
  | "contact"
  | "custom";

export interface PageSection {
  id: string;
  type: SectionType;
  name: string;
  title?: string;
  navLabel?: string;
  enabled: boolean;
  settings?: Record<string, any>;
}

export const sections: PageSection[] = sectionsJson as PageSection[];

export const SECTION_TYPE_META: Record<
  SectionType,
  {
    label: string;
    description: string;
    defaultEyebrow?: string;
    defaultTitle: string;
    defaultNavLabel: string;
    icon?: string;
  }
> = {
  hero: {
    label: "Hero & Banner",
    description: "Introductory header with 3D Earth, animated typography, and workspace telemetry",
    defaultTitle: "SYSTEMS & APPLICATIONS",
    defaultNavLabel: "Home",
  },
  about: {
    label: "About & Bio",
    description: "Personal introduction, educational background, and technical focus areas",
    defaultEyebrow: "About",
    defaultTitle: "I engineer software across web, mobile, desktop, and machine learning.",
    defaultNavLabel: "About",
  },
  "featured-projects": {
    label: "Flagship Work (Vortex)",
    description: "Interactive multi-device stage showcasing Vortex media architecture",
    defaultEyebrow: "Featured Work",
    defaultTitle: "Vortex — Multi-Platform Architecture",
    defaultNavLabel: "Featured Work",
  },
  projects: {
    label: "All Projects Explorer",
    description: "Filterable grid of production software, apps, and experimental tools",
    defaultEyebrow: "All Projects",
    defaultTitle: "Production Systems & Experiments",
    defaultNavLabel: "Projects",
  },
  stack: {
    label: "Core Tech Stack",
    description: "Structured skills and tooling categorized by domain",
    defaultEyebrow: "Stack",
    defaultTitle: "Technologies & Tools",
    defaultNavLabel: "Stack",
  },
  certifications: {
    label: "Accredited Certifications",
    description: "Industry certificates, credentials, and verification badges",
    defaultEyebrow: "Certifications",
    defaultTitle: "Certifications & Credentials",
    defaultNavLabel: "Certs",
  },
  ml: {
    label: "ML / Lab Notebook",
    description: "Machine learning experiment telemetry and hyperparameter tracking",
    defaultEyebrow: "ML / Notebook",
    defaultTitle: "Machine Learning Lab",
    defaultNavLabel: "ML",
  },
  journey: {
    label: "Timeline & Milestones",
    description: "Chronological engineering trajectory, competition achievements, and telemetry metrics",
    defaultEyebrow: "Engineering Trajectory",
    defaultTitle: "Circuit Timeline & Milestones",
    defaultNavLabel: "Journey",
  },
  activities: {
    label: "Hackathons & Activities",
    description: "Extracurricular hackathons, robotics tournaments, and community mentorship",
    defaultEyebrow: "Activities",
    defaultTitle: "Hackathons & Community",
    defaultNavLabel: "Activities",
  },
  contact: {
    label: "Contact & Channels",
    description: "Communication channels, social links, and direct message trigger",
    defaultEyebrow: "Contact",
    defaultTitle: "Let's build something worthwhile.",
    defaultNavLabel: "Contact",
  },
  custom: {
    label: "Custom Section",
    description: "Freeform markdown or card container for additional content",
    defaultEyebrow: "Custom",
    defaultTitle: "Custom Showcase",
    defaultNavLabel: "Custom",
  },
};
