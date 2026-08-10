/**
 * Journey — a minimal timeline. Real entries only, backed by git history and
 * project dates from the analyzed projects. Never invent years or roles.
 */

export type JourneyEntry = {
  year: string;
  title: string;
  note: string;
};

export const journey: JourneyEntry[] = [
  {
    year: "2024",
    title: "AI Interface",
    note: "First published experiment — a Flask image classifier with locally loaded TensorFlow models.",
  },
  {
    year: "2025",
    title: "Siteauto",
    note: "Car-parts shop with a custom YOLOv8 model that identifies parts from a photo.",
  },
  {
    year: "2026",
    title: "ATLAS tax portal",
    note: "Municipal declaration portal — scrypt auth, throttling, audit logs, SQLite, Docker.",
  },
  {
    year: "2026",
    title: "Aplicatie-Teka",
    note: "Offline offer generator for Teka — six Excel sources, tiered discounts, Windows + Android.",
  },
  {
    year: "2026",
    title: "OmniStudio",
    note: "Tauri + Rust desktop app for running local AI models, with a Rust core.",
  },
  {
    year: "2026",
    title: "Vortex",
    note: "Self-hosted media streaming for Android and Android TV — Kotlin, Compose, ExoPlayer. In progress.",
  },
  {
    year: "2026",
    title: "Jarvis · OS Helper",
    note: "A local-first AI assistant with a 9B planner, a 26M executor and 56 tools.",
  },
  {
    year: "2026",
    title: "This portfolio",
    note: "Rebuilt from scratch in Next.js with a custom design system. You're looking at it.",
  },
];
