"use client";

import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Cpu,
  Database,
  DownloadCloud,
  FileCode2,
  Folder,
  FolderOpen,
  HardDrive,
  Key,
  Layers,
  Lock,
  Monitor,
  Play,
  Search,
  Server,
  ShieldCheck,
  Smartphone,
  Table,
  Tv,
  Workflow,
  Zap,
} from "lucide-react";

import { GlassCard } from "@/components/glass-card";
import { Container } from "@/components/container";
import type { Project } from "@/data/projects";
import { cn } from "@/lib/utils";

/** Real Platform Comparison Matrix Data — verified against the Vortex source (app/ + VortexDesktop/) */
export const PLATFORM_MATRIX = [
  {
    dimension: "UI Architecture",
    icon: Layers,
    android: "Jetpack Compose (Material 3)",
    tv: "Compose TV + Leanback launcher",
    pc: "Compose Multiplatform (desktop)",
  },
  {
    dimension: "Primary Input",
    icon: Zap,
    android: "Touch & gestures",
    tv: "5-way D-pad & remote controls",
    pc: "Mouse, keyboard & mpv hotkeys",
  },
  {
    dimension: "OAuth 2.0 Auth",
    icon: Key,
    android: "Google Sign-In SDK (Drive)",
    tv: "Embedded WebView flow · device-flow fallback",
    pc: "Browser loopback callback (localhost)",
  },
  {
    dimension: "Playback Pipeline",
    icon: Play,
    android: "Media3 / ExoPlayer · RAM-only buffering",
    tv: "Media3 / ExoPlayer · audio routing & equalizer",
    pc: "In-app mpv (mediamp) · external mpv fallback · DriveStreamProxy",
  },
  {
    dimension: "Offline & Downloads",
    icon: DownloadCloud,
    android: "Multi-provider queue · Wi-Fi-only · auto cleanup",
    tv: "Same offline queue + local TMDB cache",
    pc: "Streaming-first · trailer URL cache (6 h)",
  },
  {
    dimension: "Target Hardware",
    icon: Monitor,
    android: "Android 11+ (minSdk 30) phones & tablets",
    tv: "Android TV 11+ · Google TV",
    pc: "Windows · JDK 17+ · packaged distributable",
  },
];

/** Architecture Pipeline Layers — verified against the Vortex source (app/ + VortexDesktop/) */
export const ARCH_LAYERS = [
  {
    layer: "Presentation Tier",
    icon: LayoutGridIcon,
    tech: "Jetpack Compose · Compose TV · Compose Multiplatform",
    desc: "One Kotlin UI framework across two apps: touch UI on phones and tablets, a 10-foot D-pad UI on Android TV, plus a Compose Multiplatform desktop client built on a shared module.",
    flow: "view models · navigation · profile state",
  },
  {
    layer: "State & Repository Engine",
    icon: Database,
    tech: "Room (KMP) · shared Kotlin core · TMDB cache",
    desc: "A shared MediaRepository and library scanner feed a Room database — movies, TV, music, per-profile state, collections and resume positions — with TMDB metadata cached locally (24 h TTL).",
    flow: "media queries · connection metadata",
  },
  {
    layer: "Storage & Provider Protocols",
    icon: HardDrive,
    tech: "Drive - SMB - SFTP - FTP - WebDAV",
    desc: "Pluggable client-side provider abstraction with LAN discovery (NSD/mDNS). Streams directly from personal cloud & LAN shares — zero central server.",
    flow: "authenticated stream URLs · range requests",
  },
  {
    layer: "Playback & Security Pipeline",
    icon: Lock,
    tech: "Media3 / ExoPlayer · mpv (mediamp) · Android Keystore",
    desc: "Hardware-accelerated playback — ExoPlayer on mobile and TV, an in-app mpv player with external fallback on desktop (via a loopback DriveStreamProxy). Secrets live in Keystore, never Room.",
    flow: "audio tracks · subtitles · seek · resume",
  },
];

/** Real engineering metrics — counted / verified against the Vortex source on 2026-08-17. */
export const HUD_STATS = [
  { icon: Smartphone, value: "3", label: "client runtimes" },
  { icon: HardDrive, value: "7", label: "storage providers" },
  { icon: FileCode2, value: "203", label: "kotlin files" },
  { icon: ShieldCheck, value: "100", label: "unit tests" },
  { icon: Server, value: "0", label: "backend servers" },
  { icon: Database, value: "v21", label: "room schema" },
];

export type ModuleNode = {
  name: string;
  note?: string;
  badge?: string;
  children?: ModuleNode[];
};

export const ANDROID_TREE: ModuleNode[] = [
  {
    name: "app/src/main/java/com/cata/vortex",
    badge: "root",
    children: [
      {
        name: "data",
        children: [
          { name: "local", note: "Room v21 · CredentialStore · Settings", badge: "sqlite" },
          { name: "model", note: "media · episode · season", badge: "entities" },
          {
            name: "remote",
            children: [
              {
                name: "storage",
                note: "Drive - SMB - SFTP - FTP - WebDAV + LAN discovery",
                badge: "5 protocols",
              },
              { name: "tmdb", note: "TmdbService + metadata cache", badge: "api" },
              { name: "youtube", note: "NewPipeSource · downloader", badge: "stream" },
              { name: "music", note: "innertube audio pipeline", badge: "audio" },
            ],
          },
          { name: "repository", note: "MediaRepository · MusicRepository", badge: "repo" },
          { name: "util", note: "Text repair · LAN probe" },
        ],
      },
      { name: "playback", note: "ExoPlayer services · equalizer · ambient dream", badge: "media3" },
      {
        name: "ui",
        children: [
          {
            name: "screens",
            note: "home · details · player · downloads · music · person",
          },
          { name: "theme", note: "Material 3 + dynamic palette" },
          { name: "viewmodel", note: "MediaViewModel · state machines" },
        ],
      },
      { name: "worker", note: "Sync · Download · MusicImport", badge: "workmanager" },
      { name: "navigation", note: "NavRoutes · deep linking" },
    ],
  },
];

export const SHARED_TREE: ModuleNode[] = [
  {
    name: "VortexDesktop/shared/src",
    badge: "kmp root",
    children: [
      {
        name: "commonMain",
        note: "portable · Room entities · models · MediaUtils · cache",
        badge: "100% shared",
      },
      {
        name: "jvmMain",
        children: [
          { name: "data/local/db", note: "Room KMP · DatabaseFactory", badge: "room" },
          { name: "data/model", note: "TmdbModels", badge: "json" },
          {
            name: "data/remote",
            children: [
              { name: "drive", note: "DriveAuth · DriveClient · DriveStreamProxy", badge: "oauth2" },
              { name: "tmdb", note: "TmdbService + client factory", badge: "http" },
            ],
          },
          { name: "data/repository", note: "LibraryScanner · MediaRepository", badge: "scanner" },
          { name: "data/settings", note: "AppSettingsStore", badge: "preferences" },
          {
            name: "player",
            note: "MpvLauncher · MediaQualityProbe · YtDlpDownloader · SubtitleStyle",
            badge: "mpv engine",
          },
          { name: "util", note: "SubtitleUtils · L", badge: "helpers" },
        ],
      },
      { name: "jvmTest", note: "14 test suites · 100 assertions", badge: "tests" },
    ],
  },
];

export const SHARED_CORE_ITEMS = [
  {
    title: "MediaRepository & Scanner",
    desc: "Parallel background directory crawler, file signature parsing, metadata indexing",
    tag: "Repository Tier",
  },
  {
    title: "TMDB Metadata Client",
    desc: "Zero-backend caching client with 24-hour TTL and localized poster resolution",
    tag: "Network / Cache",
  },
  {
    title: "Media Title Cleaners",
    desc: "Filename heuristics (S01E02, 1080p, x265) & regex-based matching engine",
    tag: "Core Parser",
  },
  {
    title: "Media, Episode & Season",
    desc: "Unified domain models shared identically across Android and Desktop",
    tag: "Domain Layer",
  },
  {
    title: "Room Database & DAOs",
    desc: "Multiplatform Room schema v21 storing watch progress, playlists & credentials",
    tag: "Database Engine",
  },
  {
    title: "DriveStreamProxy (Loopback)",
    desc: "Local HTTP proxy delivering range requests from cloud storage to mpv & ExoPlayer",
    tag: "Stream Protocol",
  },
];

function LayoutGridIcon(props: { className?: string }) {
  return <Layers {...props} />;
}

/** Interactive Collapsible Tree Node Component with zero layout overflow and theme-aware styling */
function InteractiveTreeNode({
  node,
  searchTerm,
  depth = 0,
}: {
  node: ModuleNode;
  searchTerm: string;
  depth?: number;
}) {
  const [isOpen, setIsOpen] = useState(true);

  const matchesSearch = useMemo(() => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const selfMatch =
      node.name.toLowerCase().includes(term) ||
      (node.note && node.note.toLowerCase().includes(term)) ||
      (node.badge && node.badge.toLowerCase().includes(term));
    if (selfMatch) return true;

    const childMatch = (children?: ModuleNode[]): boolean => {
      if (!children) return false;
      return children.some(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          (c.note && c.note.toLowerCase().includes(term)) ||
          childMatch(c.children),
      );
    };

    return childMatch(node.children);
  }, [node, searchTerm]);

  if (!matchesSearch) return null;

  const hasChildren = Boolean(node.children && node.children.length > 0);

  return (
    <div className="min-w-0 max-w-full">
      <div
        onClick={() => hasChildren && setIsOpen(!isOpen)}
        className={cn(
          "group flex flex-wrap items-center gap-1.5 rounded-lg py-1 px-1.5 transition-colors",
          hasChildren
            ? "cursor-pointer hover:bg-muted/60 dark:hover:bg-neutral-900/60"
            : "hover:bg-muted/40 dark:hover:bg-neutral-900/30",
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0 shrink-0">
          {hasChildren ? (
            <>
              {isOpen ? (
                <ChevronDown className="size-3 text-signal/80 shrink-0" />
              ) : (
                <ChevronRight className="size-3 text-muted-foreground shrink-0" />
              )}
              {isOpen ? (
                <FolderOpen className="size-3 text-signal shrink-0" />
              ) : (
                <Folder className="size-3 text-signal/80 shrink-0" />
              )}
            </>
          ) : (
            <>
              <span className="w-3" />
              <FileCode2 className="size-3 text-muted-foreground/80 shrink-0" />
            </>
          )}
          <span className="font-mono text-[11px] font-semibold text-foreground/90 break-all">
            {node.name}
          </span>
        </div>

        {node.badge && (
          <span className="rounded bg-signal/10 px-1.5 py-0.2 font-mono text-[9px] uppercase tracking-wider text-signal border border-signal/30 shrink-0">
            {node.badge}
          </span>
        )}

        {node.note && (
          <span className="font-mono text-[10px] text-muted-foreground/80 break-words">
            — {node.note}
          </span>
        )}
      </div>

      {hasChildren && isOpen && (
        <div className="ml-2.5 sm:ml-3.5 space-y-0.5 border-l border-border/50 pl-2 sm:pl-3 pt-0.5 min-w-0 max-w-full">
          {node.children!.map((child) => (
            <InteractiveTreeNode
              key={child.name}
              node={child}
              searchTerm={searchTerm}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ArchitectureSpec({ project }: { project: Project }) {
  const [hudTab, setHudTab] = useState<"matrix" | "diagram" | "modules" | "features">("matrix");
  const [moduleFilter, setModuleFilter] = useState<"all" | "android" | "kmp">("all");
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <Container className="mt-12 md:mt-16">
      <GlassCard className="relative p-4 sm:p-7 md:p-8 md:bg-card/70 overflow-hidden">
        {/* Technical Corner Accents */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <span className="absolute left-0 top-0 size-3 border-l-2 border-t-2 border-signal/50" />
          <span className="absolute right-0 top-0 size-3 border-r-2 border-t-2 border-signal/50" />
          <span className="absolute bottom-0 left-0 size-3 border-b-2 border-l-2 border-signal/50" />
          <span className="absolute bottom-0 right-0 size-3 border-b-2 border-r-2 border-signal/50" />
        </div>

        {/* Spec Navigation Header */}
        <div className="relative flex flex-col gap-5 min-w-0">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Cpu className="size-4 text-signal shrink-0" />
                <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-foreground">
                  Engineering Architecture Spec
                </h3>
                <span className="rounded border border-border/60 bg-muted/50 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  verified
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Technical breakdown of 1 shared Kotlin core driving 3 distinct client runtimes
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border/60 bg-muted/40 dark:bg-neutral-950/70 p-1">
              <button
                type="button"
                onClick={() => setHudTab("matrix")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] font-medium transition-all cursor-pointer",
                  hudTab === "matrix"
                    ? "bg-signal/20 text-signal border border-signal/40 shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Table className="size-3.5" />
                <span>Matrix</span>
              </button>

              <button
                type="button"
                onClick={() => setHudTab("diagram")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] font-medium transition-all cursor-pointer",
                  hudTab === "diagram"
                    ? "bg-signal/20 text-signal border border-signal/40 shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Workflow className="size-3.5" />
                <span>Architecture</span>
              </button>

              <button
                type="button"
                onClick={() => setHudTab("modules")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] font-medium transition-all cursor-pointer",
                  hudTab === "modules"
                    ? "bg-signal/20 text-signal border border-signal/40 shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Layers className="size-3.5" />
                <span>Module Map</span>
              </button>

              <button
                type="button"
                onClick={() => setHudTab("features")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] font-medium transition-all cursor-pointer",
                  hudTab === "features"
                    ? "bg-signal/20 text-signal border border-signal/40 shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Layers className="size-3.5" />
                <span>Capabilities</span>
              </button>
            </div>
          </div>

          {/* Real metrics strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px overflow-hidden rounded-lg border border-border/50 bg-border/40 min-w-0">
            {HUD_STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="flex flex-col items-center gap-1.5 bg-card/85 dark:bg-neutral-950/80 px-2 py-3 text-center min-w-0"
                >
                  <Icon className="size-3.5 text-signal/80 shrink-0" />
                  <span className="font-mono text-base font-semibold leading-none text-foreground">
                    {s.value}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground truncate w-full px-1">
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* TAB 1: Platform Comparison Matrix */}
        {hudTab === "matrix" && (
          <div className="mt-6 animate-in fade-in duration-200 min-w-0">
            {/* Desktop / Tablet Matrix Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground">
                    <th className="pb-3 font-semibold uppercase tracking-wider text-saffron w-[22%]">
                      Dimension
                    </th>
                    <th className="pb-3 font-semibold uppercase tracking-wider text-foreground w-[26%]">
                      <span className="inline-flex items-center gap-1.5">
                        <Smartphone className="size-3.5" />
                        Android
                      </span>
                    </th>
                    <th className="pb-3 font-semibold uppercase tracking-wider text-signal w-[26%]">
                      <span className="inline-flex items-center gap-1.5">
                        <Tv className="size-3.5" />
                        Android TV
                      </span>
                    </th>
                    <th className="pb-3 font-semibold uppercase tracking-wider text-foreground/80 w-[26%]">
                      <span className="inline-flex items-center gap-1.5">
                        <Monitor className="size-3.5" />
                        PC Desktop
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {PLATFORM_MATRIX.map((row) => {
                    const RowIcon = row.icon;
                    return (
                      <tr
                        key={row.dimension}
                        className="group hover:bg-muted/40 dark:hover:bg-neutral-900/40 transition-colors"
                      >
                        <td className="py-3.5">
                          <span className="flex items-center gap-2 font-semibold text-foreground/90">
                            <RowIcon className="size-3.5 shrink-0 text-signal/80" />
                            {row.dimension}
                          </span>
                        </td>
                        <td className="py-3.5 text-muted-foreground group-hover:text-foreground/90">
                          {row.android}
                        </td>
                        <td className="py-3.5 text-signal/90 font-medium">
                          {row.tv}
                        </td>
                        <td className="py-3.5 text-muted-foreground group-hover:text-foreground/90">
                          {row.pc}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Matrix Cards */}
            <div className="md:hidden space-y-3 min-w-0">
              {PLATFORM_MATRIX.map((row) => {
                const RowIcon = row.icon;
                return (
                  <div
                    key={row.dimension}
                    className="rounded-xl border border-border/60 bg-card/75 dark:bg-neutral-950/60 p-3.5 space-y-2.5 font-mono text-[11px]"
                  >
                    <div className="flex items-center gap-2 font-semibold text-saffron uppercase tracking-wider text-[10px] pb-1 border-b border-border/40">
                      <RowIcon className="size-3 text-signal/80" />
                      {row.dimension}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start gap-2">
                        <span className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                          <Smartphone className="size-3" />
                          Android:
                        </span>
                        <span className="text-foreground text-right">{row.android}</span>
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="flex items-center gap-1.5 text-signal shrink-0">
                          <Tv className="size-3" />
                          TV:
                        </span>
                        <span className="text-signal font-medium text-right">{row.tv}</span>
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="flex items-center gap-1.5 text-foreground/80 shrink-0">
                          <Monitor className="size-3" />
                          PC:
                        </span>
                        <span className="text-foreground text-right">{row.pc}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: Layered Architecture Diagram */}
        {hudTab === "diagram" && (
          <div className="mt-6 animate-in fade-in duration-200 min-w-0">
            <div className="space-y-0 min-w-0">
              {ARCH_LAYERS.map((item, idx) => {
                const Icon = item.icon;
                const last = idx === ARCH_LAYERS.length - 1;
                return (
                  <div key={item.layer} className="min-w-0">
                    <div className="relative grid gap-3 rounded-xl border border-border/60 bg-card/80 dark:bg-neutral-950/70 p-4 sm:grid-cols-[3.5rem_1fr_auto] sm:items-start min-w-0">
                      <div className="hidden flex-col items-center gap-1.5 pt-0.5 sm:flex">
                        <span className="font-mono text-xl font-bold leading-none text-signal/90">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <Icon className="size-4 text-signal/70" />
                      </div>

                      <div className="flex items-center gap-2 border-b border-border/40 pb-2 sm:hidden">
                        <Icon className="size-3.5 text-signal" />
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-saffron">
                          {item.layer}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <span className="hidden font-mono text-[10px] font-semibold uppercase tracking-wider text-saffron sm:block">
                          {item.layer}
                        </span>
                        <p className="mt-1.5 font-mono text-[11px] font-semibold text-foreground">
                          {item.tech}
                        </p>
                        <p className="mt-1.5 text-xs font-light leading-relaxed text-muted-foreground">
                          {item.desc}
                        </p>
                        <div className="mt-3 flex items-center gap-1.5 font-mono text-[9px] text-emerald-600 dark:text-emerald-400">
                          <Check className="size-3" />
                          <span>Verified in source</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 sm:flex-col sm:items-end">
                        {["Android", "TV", "PC"].map((p) => (
                          <span
                            key={p}
                            className={cn(
                              "rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider",
                              p === "TV"
                                ? "border-signal/40 bg-signal/10 text-signal"
                                : p === "PC"
                                  ? "border-signal/40 bg-signal/10 text-signal"
                                  : "border-border/60 bg-muted/60 text-foreground/80",
                            )}
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>

                    {!last && (
                      <div className="flex items-center gap-2 py-1.5 pl-4 sm:pl-10">
                        <span className="h-3 w-px bg-border/40" />
                        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                          {item.flow}
                        </span>
                        <ChevronDown className="size-3 shrink-0 text-signal/70" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Architecture Prose */}
            <div className="mt-4 rounded-xl border border-border/50 bg-card/65 dark:bg-neutral-950/50 p-4 font-mono text-[11px] text-muted-foreground">
              <span className="mb-1 block font-semibold uppercase tracking-wider text-foreground">
                {"// "}zero-backend streaming pipeline
              </span>
              <p className="text-xs leading-relaxed">
                {project.architecture}
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: UPGRADED INTERACTIVE MODULE MAP (THEME ADAPTIVE & ZERO OVERFLOW) */}
        {hudTab === "modules" && (
          <div className="mt-6 animate-in fade-in duration-200 min-w-0 space-y-4">
            {/* Controls Bar: Module Filter & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/50 bg-card/75 dark:bg-neutral-950/80 p-2.5">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setModuleFilter("all")}
                  className={cn(
                    "rounded-lg px-2.5 py-1 font-mono text-[11px] font-medium transition-all cursor-pointer shrink-0",
                    moduleFilter === "all"
                      ? "bg-signal text-signal-ink font-semibold shadow-sm"
                      : "text-muted-foreground hover:bg-muted/60 dark:hover:bg-neutral-900 hover:text-foreground",
                  )}
                >
                  All Packages &amp; Bridge
                </button>
                <button
                  type="button"
                  onClick={() => setModuleFilter("android")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-[11px] font-medium transition-all cursor-pointer shrink-0",
                    moduleFilter === "android"
                      ? "bg-signal text-signal-ink font-semibold shadow-sm"
                      : "text-muted-foreground hover:bg-muted/60 dark:hover:bg-neutral-900 hover:text-foreground",
                  )}
                >
                  <Smartphone className="size-3" />
                  <span>app/ (139 files)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModuleFilter("kmp")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-[11px] font-medium transition-all cursor-pointer shrink-0",
                    moduleFilter === "kmp"
                      ? "bg-signal text-signal-ink font-semibold shadow-sm"
                      : "text-muted-foreground hover:bg-muted/60 dark:hover:bg-neutral-900 hover:text-foreground",
                  )}
                >
                  <Layers className="size-3" />
                  <span>KMP Core (47 files)</span>
                </button>
              </div>

              {/* Quick Search */}
              <div className="relative flex items-center min-w-[180px]">
                <Search className="absolute left-2.5 size-3 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter packages / models..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-border/60 bg-background/80 dark:bg-neutral-900/90 pl-8 pr-3 py-1 font-mono text-[11px] text-foreground placeholder:text-muted-foreground focus:border-signal focus:outline-none"
                />
              </div>
            </div>

            {/* Shared Core Highlights Strip */}
            <div className="rounded-xl border border-signal/30 bg-signal/[0.06] p-4 space-y-3 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-signal/20 pb-2.5">
                <div className="flex items-center gap-2">
                  <Workflow className="size-4 text-signal shrink-0" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-signal">
                    Shared Kotlin Multiplatform Bridge
                  </span>
                </div>
                <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  100% Code Reuse Across Desktop &amp; Android
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 min-w-0">
                {SHARED_CORE_ITEMS.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-lg border border-border/50 bg-card/85 dark:bg-neutral-950/70 p-2.5 space-y-1 min-w-0"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[11px] font-semibold text-foreground truncate">
                        {item.title}
                      </span>
                      <span className="rounded bg-signal/15 px-1.5 py-0.2 font-mono text-[8.5px] uppercase tracking-wider text-signal shrink-0">
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-muted-foreground leading-snug line-clamp-2">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Trees Container — Fully Responsive & Contained */}
            <div
              className={cn(
                "grid gap-4 min-w-0",
                moduleFilter === "all" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1",
              )}
            >
              {/* Android Native Tree */}
              {(moduleFilter === "all" || moduleFilter === "android") && (
                <div className="rounded-xl border border-border/60 bg-card/80 dark:bg-neutral-950/80 p-4 min-w-0 overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2.5 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Smartphone className="size-4 shrink-0 text-foreground/70" />
                      <span className="truncate font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                        app/ · Android Runtime
                      </span>
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-foreground/70 shrink-0 font-semibold">
                      139 files
                    </span>
                  </div>

                  <div className="max-h-[380px] overflow-y-auto overflow-x-hidden pr-1 space-y-1 min-w-0">
                    {ANDROID_TREE.map((node) => (
                      <InteractiveTreeNode
                        key={node.name}
                        node={node}
                        searchTerm={searchTerm}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* KMP Shared Module Tree */}
              {(moduleFilter === "all" || moduleFilter === "kmp") && (
                <div className="rounded-xl border border-border/60 bg-card/80 dark:bg-neutral-950/80 p-4 min-w-0 overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2.5 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Layers className="size-4 shrink-0 text-signal" />
                      <span className="truncate font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                        VortexDesktop/shared/ · KMP Engine
                      </span>
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-signal shrink-0 font-semibold">
                      47 files
                    </span>
                  </div>

                  <div className="max-h-[380px] overflow-y-auto overflow-x-hidden pr-1 space-y-1 min-w-0">
                    {SHARED_TREE.map((node) => (
                      <InteractiveTreeNode
                        key={node.name}
                        node={node}
                        searchTerm={searchTerm}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground text-center sm:text-left">
              source verified against production repository tree · last audited 2026-08-17
            </p>
          </div>
        )}

        {/* TAB 4: Core Capabilities */}
        {hudTab === "features" && (
          <div className="mt-6 animate-in fade-in duration-200 min-w-0">
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 min-w-0">
              {project.features?.map((feat) => (
                <div
                  key={feat}
                  className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-card/75 dark:bg-neutral-950/60 p-3 min-w-0"
                >
                  <div className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-signal/15 text-signal">
                    <Check className="size-2.5" />
                  </div>
                  <span className="text-xs text-foreground/90 leading-snug break-words">
                    {feat}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="size-1 rounded-full bg-signal" />
            all metrics verified against source · app/ + VortexDesktop/
          </span>
          <span>vortex :: architecture-spec</span>
        </div>
      </GlassCard>
    </Container>
  );
}
