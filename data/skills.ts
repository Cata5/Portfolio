/**
 * Technology stack — a structured toolbox, not a wall of logos.
 * Every item here appears in at least one analyzed project (see data/projects.ts).
 * Curated to core, demonstrable tools: one-off or thin exposures (single
 * small project, tiny code footprint) are intentionally left out.
 */

export type SkillGroup = {
  label: string;
  note: string;
  items: string[];
};

export const skillGroups: SkillGroup[] = [
  {
    label: "Languages",
    note: "what I write most",
    items: ["TypeScript", "Python", "Kotlin"],
  },
  {
    label: "Web",
    note: "interfaces and full-stack apps",
    items: ["Next.js", "React", "Tailwind CSS", "Vite", "HTML", "CSS"],
  },
  {
    label: "Backend",
    note: "services behind the apps",
    items: ["Node.js", "Flask", "FastAPI", "SQLite"],
  },
  {
    label: "Mobile & Desktop",
    note: "apps that run on devices",
    items: [
      "Jetpack Compose",
      "ExoPlayer / Media3",
      "Electron",
      "PySide6 / PyQt",
    ],
  },
  {
    label: "AI / ML",
    note: "training and experiments",
    items: ["PyTorch", "Ultralytics YOLO", "llama.cpp", "RAG / Ollama"],
  },
  {
    label: "Systems",
    note: "closer to the metal",
    items: ["ESP32 / PlatformIO", "Docker", "Linux", "Git"],
  },
];

/** The "I work with" list in the about section. */
export const focusAreas: { label: string; note: string }[] = [
  { label: "Web", note: "interfaces and full-stack apps" },
  { label: "AI / ML", note: "training, fine-tuning, local models" },
  { label: "Mobile & Desktop", note: "Compose · Electron · Tauri" },
  { label: "Embedded", note: "ESP32 and vision systems" },
  { label: "Developer tools", note: "things that make building easier" },
];
