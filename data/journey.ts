/**
 * Journey — the milestones from the old portfolio's timeline page
 * (cata5.github.io/Portofolio/timeline), scraped verbatim (light copy-edit
 * only) and ordered newest first. Categories mirror the source's filter:
 * main / education / competitions / side.
 */

export type JourneyCategory = "main" | "education" | "competitions" | "side";

export type JourneyEntry = {
  /** Verbatim from the source — "May 2026", or just "2023" when no month. */
  date: string;
  category: JourneyCategory;
  title: string;
  note: string;
  tags: string[];
};

export const journey: JourneyEntry[] = [
  {
    date: "May 2026",
    category: "main",
    title: "NeuroShell CLI",
    note: "Self-improving AI assistant — autonomous, model-swapping, tool-using CLI that runs locally.",
    tags: ["Python", "AI", "LLM", "CLI"],
  },
  {
    date: "Apr 2026",
    category: "main",
    title: "Vortex",
    note: "Android app for cloud media streaming with Google Drive as a cloud supplier.",
    tags: ["Kotlin", "OAuth", "Android"],
  },
  {
    date: "Mar 2026",
    category: "main",
    title: "Portfolio Launch",
    note: "Designed and built this futuristic modular developer portfolio.",
    tags: ["Next.js", "TypeScript", "Framer Motion"],
  },
  {
    date: "Jan 2026",
    category: "education",
    title: "CCNA 1 Certification",
    note: "Earned Cisco CCNA 1 — Introduction to Networks certification.",
    tags: ["Cisco", "Networking", "TCP/IP"],
  },
  {
    date: "Feb 2025",
    category: "education",
    title: "IC3 GS6 Certification",
    note: "Earned IC3 Global Standard 6 digital literacy certification.",
    tags: ["IC3", "Digital Literacy", "Certiport"],
  },
  {
    date: "Jan 2025",
    category: "competitions",
    title: "FTC Robotics — Regionals (Mentor)",
    note: "Mentored the next generation of FTC robotics competitors.",
    tags: ["Robotics", "FTC", "Mentoring"],
  },
  {
    date: "Nov 2024",
    category: "main",
    title: "UniHack — 1st Place",
    note: "Won first place at UniHack hackathon on my second participation.",
    tags: ["Hackathon", "Winner", "Teamwork"],
  },
  {
    date: "Nov 2024",
    category: "main",
    title: "AI / ML Project Spree",
    note: "Built multiple AI projects: LLM Finetuner, YOLO Trainer, SLM Maker, Dataset Generator.",
    tags: ["AI", "Python", "PyTorch", "YOLO"],
  },
  {
    date: "Mar 2024",
    category: "competitions",
    title: "FTC Robotics — Nationals",
    note: "Competed in FIRST Tech Challenge and qualified for the National Championship.",
    tags: ["Robotics", "FTC", "Java"],
  },
  {
    date: "Nov 2023",
    category: "competitions",
    title: "UniHack — First Participation",
    note: "First time competing at UniHack hackathon.",
    tags: ["Hackathon", "Learning", "Teamwork"],
  },
  {
    date: "2023",
    category: "side",
    title: "Desktop Apps & Developer Tools",
    note: "Built SSH Electron, rclone Upload UI, Google Drive Player, and more.",
    tags: ["Electron", "Node.js", "Desktop"],
  },
  {
    date: "2023",
    category: "main",
    title: "Started Open Source Journey",
    note: "Published first repositories on GitHub, beginning a growing collection of 40+ projects.",
    tags: ["GitHub", "Open Source"],
  },
];
