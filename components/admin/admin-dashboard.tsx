"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  User,
  FolderGit2,
  Cpu,
  Brain,
  Milestone,
  Award,
  Type,
  Save,
  Check,
  RefreshCw,
  ArrowLeft,
  Plus,
  Trash2,
  Lock,
  ShieldAlert,
  Server,
  Database,
  ExternalLink,
  FlaskConical,
  Radio,
  ShieldCheck,
  Terminal,
  Layers,
} from "lucide-react";
import { useEditor } from "@/components/editor/editor-context";
import { useRAG } from "@/components/rag/rag-context";
import { useGlitchMode } from "@/components/rag/use-glitch-mode";
import { CLogo } from "@/components/rag/c-logo";
import { withBasePath, BASE_PATH, isGhPages } from "@/lib/base-path";
import { PipelineView } from "@/components/rag/pipeline-view";
import { SourceView } from "@/components/rag/source-view";
import { EvalView } from "@/components/rag/eval-view";
import { KBView } from "@/components/rag/kb-view";
import { SettingsView } from "@/components/rag/settings-view";
import { SectionsManager } from "@/components/admin/sections-manager";
import { TagInput } from "@/components/ui/tag-input";
import type { ProjectCategory, ProjectStatus } from "@/data/projects";

type MainTab =
  | "overview"
  | "sections"
  | "profile"
  | "projects"
  | "skills"
  | "ml"
  | "journey"
  | "activities"
  | "rag"
  | "tests"
  | "copy";

const PROJECT_CATEGORIES: ProjectCategory[] = [
  "Web",
  "AI / ML",
  "Android",
  "iOS",
  "Desktop",
  "Backend",
  "Systems",
  "Experiments",
  "Developer Tools",
];

const PROJECT_STATUSES: ProjectStatus[] = [
  "Active",
  "Completed",
  "Experimental",
  "In Development",
  "Archived",
];

export function MainAdminDashboard() {
  const {
    isAuthenticated,
    unlockWithPassword,
    content,
    updateField,
    isDirty,
    isSaving,
    saveStatus,
    saveChanges,
    addNewProject,
    deleteProject,
    addNewJourneyItem,
    deleteJourneyItem,
    addNewActivity,
    deleteActivity,
    addNewCert,
    deleteCert,
    addNewMlRun,
    deleteMlRun,
  } = useEditor();

  const { status, triggerReindex, fetchStatus, fetchConfig, setIsOpen: setChatOpen } = useRAG();
  const { isGlitchActive, isSimulated, toggleGlitchMode, offlineStyle, setOfflineStyle } = useGlitchMode();

  const [activeTab, setActiveTab] = useState<MainTab>("overview");
  const [ragSubTab, setRagSubTab] = useState<"settings" | "pipeline" | "eval" | "kb" | "source">("settings");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);
  const [isRestartingModel, setIsRestartingModel] = useState(false);
  const [restartFeedback, setRestartFeedback] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Selected project for editing
  const selectedProject = content.projects?.find((p) => p.id === selectedProjectId) || content.projects?.[0];

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setIsSubmitting(true);
    setAuthError("");

    const res = await unlockWithPassword(password);
    setIsSubmitting(false);

    if (!res.success) {
      setAuthError(res.error || "Incorrect password");
    }
  };

  const handleManualReindex = async () => {
    setIsReindexing(true);
    try {
      await triggerReindex();
    } finally {
      setIsReindexing(false);
    }
  };

  const handleRestartModel = async () => {
    setIsRestartingModel(true);
    setRestartFeedback("Restarting local model instance & applying parameters...");
    try {
      const res = await fetch(withBasePath("/api/rag/models"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reload: true }),
      });
      const data = await res.json().catch(() => ({}));
      await fetchStatus?.();
      await fetchConfig?.();
      setRestartFeedback(
        data?.reload?.message || "Model instance successfully restarted and primed with active parameters!"
      );
    } catch (err) {
      console.error("Model restart failed:", err);
      setRestartFeedback("Failed to restart model.");
    } finally {
      setIsRestartingModel(false);
      setTimeout(() => setRestartFeedback(null), 5000);
    }
  };

  // Auth Gate
  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-border/50 bg-card/40 p-6 md:p-8 backdrop-blur-2xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] ring-1 ring-white/10 text-center space-y-6">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-border/60 bg-neutral-900/80 text-signal shadow-lg ring-1 ring-white/10">
            <Lock className="size-6" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
              <CLogo className="size-5 text-signal" />
              <span>Portfolio Admin Console</span>
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Authenticate with your master password to configure projects, profile data, skills, ML runs, and AI telemetry across the site.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-3">
            <div className="space-y-1 text-left">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter master password..."
                className="w-full rounded-xl border border-border/60 bg-neutral-950/80 px-3.5 py-2.5 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-signal/80 focus:outline-none focus:ring-1 focus:ring-signal/30"
                autoFocus
              />
              {authError && (
                <p className="text-[11px] text-destructive flex items-center gap-1 font-mono pt-1">
                  <ShieldAlert className="size-3" />
                  <span>{authError}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !password}
              className="w-full rounded-xl bg-signal py-2.5 font-mono text-xs font-semibold text-signal-ink transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-md shadow-signal/20"
            >
              {isSubmitting ? "Authenticating..." : "Unlock Control Center"}
            </button>
          </form>

          <div className="pt-2 border-t border-border/40">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3" /> Back to Portfolio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isConnected = status?.models?.isServerConnected ?? false;
  const projectCount = content.projects?.length || 0;
  const journeyCount = content.journey?.length || 0;
  const mlCount = content.ml?.runs?.length || 0;
  const activityCount = content.activities?.length || 0;
  const certCount = content.certifications?.length || 0;
  const sectionCount = content.sections?.length || 0;

  return (
    <div className="min-h-screen text-foreground pb-20 pt-4 sm:pt-6 px-3 sm:px-6 max-w-7xl mx-auto space-y-6">
      {/* Top Main Glass Header */}
      <header className="rounded-2xl border border-border/50 bg-card/40 p-4 sm:p-5 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] ring-1 ring-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            title="Back to Portfolio"
            className="flex size-10 items-center justify-center rounded-xl border border-border/60 bg-card/60 text-muted-foreground hover:border-signal/40 hover:text-foreground transition-all shrink-0 shadow-sm"
          >
            <ArrowLeft className="size-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span
                className={`size-2 rounded-full ${
                  isConnected ? "bg-signal" : "bg-destructive"
                }`}
              />
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <CLogo className="size-4 text-signal" />
                <span>Portfolio Control Center</span>
              </h1>
              <span className="rounded border border-signal/40 bg-signal/15 px-2 py-0.5 font-mono text-[10px] font-bold text-signal">
                ADMIN
              </span>
            </div>
            <p className="text-xs text-muted-foreground pt-0.5">
              Unified configuration management across portfolio content, machine learning notebooks, and local AI telemetry.
            </p>
          </div>
        </div>

        {/* Action Controls & Save Button */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => saveChanges()}
            disabled={!isDirty || isSaving}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-xs font-semibold transition-all shadow-md cursor-pointer ${
              isDirty
                ? "bg-saffron text-black shadow-saffron/20 hover:brightness-110"
                : "border border-border/50 bg-card/60 text-muted-foreground opacity-70"
            }`}
          >
            {isSaving ? (
              <>
                <RefreshCw className="size-3.5 animate-spin" />
                <span>Saving to Disk...</span>
              </>
            ) : saveStatus === "saved" ? (
              <>
                <Check className="size-3.5 text-green-400" />
                <span>All Changes Saved</span>
              </>
            ) : (
              <>
                <Save className="size-3.5" />
                <span>{isDirty ? "Save Content Changes" : "Up to Date"}</span>
              </>
            )}
          </button>

          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 rounded-xl border border-border/50 bg-card/60 px-3.5 py-2 font-mono text-xs text-muted-foreground hover:border-signal/40 hover:text-foreground transition-all"
          >
            <ExternalLink className="size-3" />
            <span className="hidden sm:inline">Live Site</span>
          </Link>
        </div>
      </header>

      {/* Redesigned Modern Categorized Navigation Bar */}
      <nav
        className="rounded-2xl border border-border/40 bg-card/30 p-2 sm:p-2.5 backdrop-blur-xl ring-1 ring-white/5 shadow-xl"
        aria-label="Admin Navigation"
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Group 1: Structure & Overview */}
          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-neutral-950/40 p-1 border border-border/30">
            <span className="hidden xl:inline-flex items-center px-2 font-mono text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider">
              Structure
            </span>
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-xs font-medium transition-all cursor-pointer ${
                activeTab === "overview"
                  ? "bg-signal text-signal-ink font-semibold shadow-md shadow-signal/20 scale-[1.02]"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              }`}
            >
              <LayoutDashboard className="size-3.5" />
              <span>Overview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("sections")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-xs font-medium transition-all cursor-pointer ${
                activeTab === "sections"
                  ? "bg-signal text-signal-ink font-semibold shadow-md shadow-signal/20 scale-[1.02]"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              }`}
            >
              <Layers className="size-3.5" />
              <span>Page Builder</span>
              <span
                className={`ml-1 rounded px-1.5 py-0.2 text-[10px] font-mono ${
                  activeTab === "sections"
                    ? "bg-black/25 text-signal-ink font-bold"
                    : "bg-signal/15 text-signal font-semibold"
                }`}
              >
                {sectionCount}
              </span>
            </button>
          </div>

          <div className="h-6 w-px bg-border/40 hidden lg:block" />

          {/* Group 2: Content Stores */}
          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-neutral-950/40 p-1 border border-border/30">
            <span className="hidden xl:inline-flex items-center px-2 font-mono text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider">
              Content
            </span>
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-xs font-medium transition-all cursor-pointer ${
                activeTab === "profile"
                  ? "bg-signal text-signal-ink font-semibold shadow-md shadow-signal/20 scale-[1.02]"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              }`}
            >
              <User className="size-3.5" />
              <span>Profile</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("projects")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-xs font-medium transition-all cursor-pointer ${
                activeTab === "projects"
                  ? "bg-signal text-signal-ink font-semibold shadow-md shadow-signal/20 scale-[1.02]"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              }`}
            >
              <FolderGit2 className="size-3.5" />
              <span>Projects</span>
              <span
                className={`ml-1 rounded px-1.5 py-0.2 text-[10px] font-mono ${
                  activeTab === "projects"
                    ? "bg-black/25 text-signal-ink font-bold"
                    : "bg-muted/60 text-muted-foreground"
                }`}
              >
                {projectCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("skills")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-xs font-medium transition-all cursor-pointer ${
                activeTab === "skills"
                  ? "bg-signal text-signal-ink font-semibold shadow-md shadow-signal/20 scale-[1.02]"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              }`}
            >
              <Cpu className="size-3.5" />
              <span>Stack</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("ml")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-xs font-medium transition-all cursor-pointer ${
                activeTab === "ml"
                  ? "bg-signal text-signal-ink font-semibold shadow-md shadow-signal/20 scale-[1.02]"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              }`}
            >
              <Brain className="size-3.5" />
              <span>ML Runs</span>
              <span
                className={`ml-1 rounded px-1.5 py-0.2 text-[10px] font-mono ${
                  activeTab === "ml"
                    ? "bg-black/25 text-signal-ink font-bold"
                    : "bg-muted/60 text-muted-foreground"
                }`}
              >
                {mlCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("journey")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-xs font-medium transition-all cursor-pointer ${
                activeTab === "journey"
                  ? "bg-signal text-signal-ink font-semibold shadow-md shadow-signal/20 scale-[1.02]"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              }`}
            >
              <Milestone className="size-3.5" />
              <span>Journey</span>
              <span
                className={`ml-1 rounded px-1.5 py-0.2 text-[10px] font-mono ${
                  activeTab === "journey"
                    ? "bg-black/25 text-signal-ink font-bold"
                    : "bg-muted/60 text-muted-foreground"
                }`}
              >
                {journeyCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("activities")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-xs font-medium transition-all cursor-pointer ${
                activeTab === "activities"
                  ? "bg-signal text-signal-ink font-semibold shadow-md shadow-signal/20 scale-[1.02]"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              }`}
            >
              <Award className="size-3.5" />
              <span>Activities &amp; Certs</span>
              <span
                className={`ml-1 rounded px-1.5 py-0.2 text-[10px] font-mono ${
                  activeTab === "activities"
                    ? "bg-black/25 text-signal-ink font-bold"
                    : "bg-muted/60 text-muted-foreground"
                }`}
              >
                {activityCount + certCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("copy")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-xs font-medium transition-all cursor-pointer ${
                activeTab === "copy"
                  ? "bg-signal text-signal-ink font-semibold shadow-md shadow-signal/20 scale-[1.02]"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              }`}
            >
              <Type className="size-3.5" />
              <span>Copy &amp; Headers</span>
            </button>
          </div>

          <div className="h-6 w-px bg-border/40 hidden lg:block" />

          {/* Group 3: System, AI & Ops */}
          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-neutral-950/40 p-1 border border-border/30">
            <span className="hidden xl:inline-flex items-center px-2 font-mono text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider">
              System
            </span>
            <button
              type="button"
              onClick={() => setActiveTab("rag")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-xs font-medium transition-all cursor-pointer ${
                activeTab === "rag"
                  ? "bg-signal text-signal-ink font-semibold shadow-md shadow-signal/20 scale-[1.02]"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              }`}
            >
              <Radio className="size-3.5" />
              <span>RAG AI &amp; Telemetry</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("tests")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-xs font-medium transition-all cursor-pointer ${
                activeTab === "tests"
                  ? "bg-signal text-signal-ink font-semibold shadow-md shadow-signal/20 scale-[1.02]"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              }`}
            >
              <FlaskConical className="size-3.5" />
              <span>Tests &amp; Deploy</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Tab Content Panel */}
      <main className="rounded-2xl border border-border/50 bg-card/40 p-4 sm:p-6 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] ring-1 ring-white/10 min-h-[560px]">
        {/* ======================= TAB 1: OVERVIEW ======================= */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground">
                System Overview & Content Health
              </h2>
              <p className="text-xs text-muted-foreground">
                Snapshot of active portfolio data stores, local AI model health, and document indexing metrics.
              </p>
            </div>

            {/* Quick Stat Cards in Frosted Glass */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-md">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="font-mono text-xs">Projects</span>
                  <FolderGit2 className="size-4 text-signal" />
                </div>
                <p className="mt-2 text-2xl font-bold text-foreground">{projectCount}</p>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {content.projects?.filter((p) => p.featured).length || 0} featured
                </span>
              </div>

              <div className="rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-md">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="font-mono text-xs">ML Experiments</span>
                  <Brain className="size-4 text-saffron" />
                </div>
                <p className="mt-2 text-2xl font-bold text-foreground">{mlCount}</p>
                <span className="font-mono text-[11px] text-muted-foreground">Trained architectures</span>
              </div>

              <div className="rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-md">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="font-mono text-xs">RAG Knowledge</span>
                  <Database className="size-4 text-signal" />
                </div>
                <p className="mt-2 text-2xl font-bold text-foreground">
                  {status?.counts?.documents ?? 24} docs
                </p>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {status?.counts?.chunks ?? 212} indexed chunks
                </span>
              </div>

              <div className="rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-md">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="font-mono text-xs">Local Inference</span>
                  <Server className={`size-4 ${status?.models?.isServerConnected !== false ? "text-green-400" : "text-destructive"}`} />
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className={`size-2 rounded-full ${status?.models?.isServerConnected !== false ? "bg-green-400 animate-pulse" : "bg-destructive"}`} />
                  <span className="text-sm font-bold text-foreground truncate">
                    {status?.models?.isServerConnected !== false ? "Online & Ready" : "Offline"}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-muted-foreground font-mono text-[10.5px]">
                  <span className="truncate" title={status?.models?.generationModel as string}>
                    {((status?.models?.generationModel as string) || "Gemma 4").split("/").pop()}
                  </span>
                  {status?.models && (
                    <span className="text-signal font-semibold">
                      T: {String(status.models.temperature ?? 0.2)} · M: {String(status.models.maxTokens ?? 2048)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Restart Feedback Toast */}
            {restartFeedback && (
              <div
                className={`flex items-center gap-2 rounded-xl border p-3 font-mono text-xs shadow-md transition-all ${
                  isRestartingModel
                    ? "border-signal/50 bg-signal/15 text-signal animate-pulse"
                    : "border-green-500/50 bg-green-950/40 text-green-300"
                }`}
              >
                <RefreshCw className={`size-3.5 shrink-0 ${isRestartingModel ? "animate-spin" : ""}`} />
                <span>{restartFeedback}</span>
              </div>
            )}

            {/* Quick Actions Panel */}
            <div className="rounded-xl border border-border/50 bg-card/30 p-5 backdrop-blur-md space-y-3">
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Operations & Maintenance
              </h3>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleRestartModel}
                  disabled={isRestartingModel}
                  className="flex items-center gap-2 rounded-xl border border-signal/40 bg-signal/15 px-4 py-2 font-mono text-xs font-semibold text-signal hover:bg-signal hover:text-signal-ink transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  <RefreshCw className={`size-3.5 ${isRestartingModel ? "animate-spin" : ""}`} />
                  <span>{isRestartingModel ? "Restarting Model..." : "Restart Model (Apply Params)"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleManualReindex}
                  disabled={isReindexing}
                  className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/60 px-4 py-2 font-mono text-xs text-foreground hover:border-signal/40 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`size-3.5 ${isReindexing ? "animate-spin" : ""}`} />
                  <span>{isReindexing ? "Re-indexing Portfolio..." : "Sync Portfolio to RAG"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("projects")}
                  className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/60 px-4 py-2 font-mono text-xs text-foreground hover:border-signal/40 transition-all cursor-pointer"
                >
                  <FolderGit2 className="size-3.5 text-signal" />
                  <span>Manage Projects</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("rag")}
                  className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/60 px-4 py-2 font-mono text-xs text-foreground hover:border-signal/40 transition-all cursor-pointer"
                >
                  <Cpu className="size-3.5 text-signal" />
                  <span>Open AI Telemetry Suite</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 2: SECTIONS & PAGE BUILDER ======================= */}
        {activeTab === "sections" && (
          <SectionsManager onNavigateTab={(tab) => setActiveTab(tab as MainTab)} />
        )}

        {/* ======================= TAB 3: PROFILE ======================= */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground">
                Site Profile & Personal Information
              </h2>
              <p className="text-xs text-muted-foreground">
                Author name, role headline, contact links, status pill, and SEO metadata stored in content/site.json.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-mono text-xs text-muted-foreground">Full Name</label>
                <input
                  type="text"
                  value={content.site?.name || ""}
                  onChange={(e) => updateField("site.name", e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-card/50 px-3.5 py-2 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs text-muted-foreground">Headline Role</label>
                <input
                  type="text"
                  value={content.site?.role || ""}
                  onChange={(e) => updateField("site.role", e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-card/50 px-3.5 py-2 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="font-mono text-xs text-muted-foreground">Tagline / Mission</label>
                <input
                  type="text"
                  value={content.site?.tagline || ""}
                  onChange={(e) => updateField("site.tagline", e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-card/50 px-3.5 py-2 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="font-mono text-xs text-muted-foreground">Description / Bio</label>
                <textarea
                  rows={3}
                  value={content.site?.description || ""}
                  onChange={(e) => updateField("site.description", e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-card/50 p-3 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs text-muted-foreground">Email</label>
                <input
                  type="email"
                  value={content.site?.email || ""}
                  onChange={(e) => updateField("site.email", e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-card/50 px-3.5 py-2 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs text-muted-foreground">Canonical Website URL</label>
                <input
                  type="text"
                  value={content.site?.url || ""}
                  onChange={(e) => updateField("site.url", e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-card/50 px-3.5 py-2 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs text-muted-foreground">GitHub URL</label>
                <input
                  type="text"
                  value={content.site?.github || ""}
                  onChange={(e) => updateField("site.github", e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-card/50 px-3.5 py-2 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs text-muted-foreground">LinkedIn URL</label>
                <input
                  type="text"
                  value={content.site?.linkedin || ""}
                  onChange={(e) => updateField("site.linkedin", e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-card/50 px-3.5 py-2 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs text-muted-foreground">Instagram URL</label>
                <input
                  type="text"
                  value={content.site?.instagram || ""}
                  onChange={(e) => updateField("site.instagram", e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-card/50 px-3.5 py-2 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs text-muted-foreground">Repository Source URL</label>
                <input
                  type="text"
                  value={content.site?.source || ""}
                  onChange={(e) => updateField("site.source", e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-card/50 px-3.5 py-2 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="font-mono text-xs text-muted-foreground">Hero Status: Current Project</label>
                <input
                  type="text"
                  value={content.site?.currently?.project || ""}
                  onChange={(e) => updateField("site.currently.project", e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-card/50 px-3.5 py-2 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 3: PROJECTS ======================= */}
        {activeTab === "projects" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold tracking-tight text-foreground">
                  Projects Management
                </h2>
                <p className="text-xs text-muted-foreground">
                  Edit project descriptions, confirmed technical claims, tech tags, demo links, and featured status.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newId = addNewProject();
                  setSelectedProjectId(newId);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-signal px-3.5 py-2 font-mono text-xs font-semibold text-signal-ink hover:opacity-90 transition-all cursor-pointer shadow-md shadow-signal/20"
              >
                <Plus className="size-3.5" />
                <span>New Project</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Project Selection List */}
              <div
                data-lenis-prevent
                onWheel={(e) => e.stopPropagation()}
                className="rounded-xl border border-border/50 bg-card/30 p-2 space-y-1.5 max-h-[520px] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-border hover:scrollbar-thumb-muted-foreground/40"
              >
                {content.projects?.map((proj) => {
                  const isSel = (selectedProject?.id === proj.id);
                  return (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() => setSelectedProjectId(proj.id)}
                      className={`w-full flex items-center justify-between rounded-lg p-2.5 text-left transition-all cursor-pointer ${
                        isSel
                          ? "bg-signal/15 border border-signal/40 text-foreground"
                          : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-semibold truncate text-foreground">
                            {proj.title || "Untitled Project"}
                          </span>
                          {proj.featured && (
                            <span className="size-1.5 rounded-full bg-signal shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{proj.category} • {proj.status}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Project Editor Form */}
              {selectedProject && (
                <div className="lg:col-span-2 rounded-xl border border-border/50 bg-card/50 p-4 sm:p-5 backdrop-blur-md space-y-4">
                  <div className="flex items-center justify-between border-b border-border/40 pb-3">
                    <span className="font-mono text-xs font-bold text-signal uppercase tracking-wider">
                      Editing: {selectedProject.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteProject(selectedProject.id)}
                      className="flex items-center gap-1 font-mono text-xs text-destructive hover:underline cursor-pointer"
                    >
                      <Trash2 className="size-3" />
                      <span>Delete</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="font-mono text-[11px] text-muted-foreground">Title</label>
                      <input
                        type="text"
                        value={selectedProject.title || ""}
                        onChange={(e) => {
                          const idx = content.projects.findIndex((p) => p.id === selectedProject.id);
                          if (idx !== -1) updateField(`projects.${idx}.title`, e.target.value);
                        }}
                        className="w-full rounded-lg border border-border/60 bg-neutral-950/60 px-3 py-1.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[11px] text-muted-foreground">Category</label>
                      <select
                        value={selectedProject.category || "Web"}
                        onChange={(e) => {
                          const idx = content.projects.findIndex((p) => p.id === selectedProject.id);
                          if (idx !== -1) updateField(`projects.${idx}.category`, e.target.value as ProjectCategory);
                        }}
                        className="w-full rounded-lg border border-border/60 bg-neutral-950/60 px-3 py-1.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                      >
                        {PROJECT_CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[11px] text-muted-foreground">Status</label>
                      <select
                        value={selectedProject.status || "Active"}
                        onChange={(e) => {
                          const idx = content.projects.findIndex((p) => p.id === selectedProject.id);
                          if (idx !== -1) updateField(`projects.${idx}.status`, e.target.value as ProjectStatus);
                        }}
                        className="w-full rounded-lg border border-border/60 bg-neutral-950/60 px-3 py-1.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                      >
                        {PROJECT_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="font-mono text-[11px] text-muted-foreground">Technologies &amp; Tags</label>
                      <TagInput
                        placeholder="e.g. Next.js, TypeScript, Tailwind, Python"
                        value={selectedProject.technologies}
                        onChange={(tags) => {
                          const idx = content.projects.findIndex((p) => p.id === selectedProject.id);
                          if (idx !== -1) updateField(`projects.${idx}.technologies`, tags);
                        }}
                        className="w-full rounded-lg border border-border/60 bg-neutral-950/60 px-3 py-1.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="font-mono text-[11px] text-muted-foreground">Short Summary</label>
                      <input
                        type="text"
                        value={selectedProject.summary || ""}
                        onChange={(e) => {
                          const idx = content.projects.findIndex((p) => p.id === selectedProject.id);
                          if (idx !== -1) updateField(`projects.${idx}.summary`, e.target.value);
                        }}
                        className="w-full rounded-lg border border-border/60 bg-neutral-950/60 px-3 py-1.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="font-mono text-[11px] text-muted-foreground">Full Description (Markdown)</label>
                      <textarea
                        rows={3}
                        value={selectedProject.description || ""}
                        onChange={(e) => {
                          const idx = content.projects.findIndex((p) => p.id === selectedProject.id);
                          if (idx !== -1) updateField(`projects.${idx}.description`, e.target.value);
                        }}
                        className="w-full rounded-lg border border-border/60 bg-neutral-950/60 p-2.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[11px] text-muted-foreground">GitHub URL</label>
                      <input
                        type="text"
                        value={selectedProject.github || ""}
                        onChange={(e) => {
                          const idx = content.projects.findIndex((p) => p.id === selectedProject.id);
                          if (idx !== -1) updateField(`projects.${idx}.github`, e.target.value);
                        }}
                        className="w-full rounded-lg border border-border/60 bg-neutral-950/60 px-3 py-1.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[11px] text-muted-foreground">Live Demo URL</label>
                      <input
                        type="text"
                        value={selectedProject.demo || ""}
                        onChange={(e) => {
                          const idx = content.projects.findIndex((p) => p.id === selectedProject.id);
                          if (idx !== -1) updateField(`projects.${idx}.demo`, e.target.value);
                        }}
                        className="w-full rounded-lg border border-border/60 bg-neutral-950/60 px-3 py-1.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="featuredProj"
                        checked={Boolean(selectedProject.featured)}
                        onChange={(e) => {
                          const idx = content.projects.findIndex((p) => p.id === selectedProject.id);
                          if (idx !== -1) updateField(`projects.${idx}.featured`, e.target.checked);
                        }}
                        className="rounded border-border size-4 accent-signal"
                      />
                      <label htmlFor="featuredProj" className="font-mono text-xs text-foreground cursor-pointer">
                        Featured Project (Promoted on homepage hero & work sections)
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================= TAB 4: TECH STACK ======================= */}
        {activeTab === "skills" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground">
                Technical Stack & Competencies
              </h2>
              <p className="text-xs text-muted-foreground">
                Manage skill groups and items stored in content/skills.json.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {content.skills?.skillGroups?.map((group, gIdx) => (
                <div key={gIdx} className="rounded-xl border border-border/50 bg-card/40 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-signal uppercase tracking-wider">
                        {group.label}
                      </span>
                      <p className="text-[10.5px] text-muted-foreground">{group.note}</p>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {group.items?.length || 0} items
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {group.items?.map((item, iIdx) => (
                      <div
                        key={iIdx}
                        className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-neutral-950/60 px-2.5 py-1 font-mono text-[11px] text-foreground"
                      >
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = group.items.filter((_, i) => i !== iIdx);
                            updateField(`skills.skillGroups.${gIdx}.items`, updated);
                          }}
                          className="text-muted-foreground hover:text-destructive cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="pt-1">
                    <input
                      type="text"
                      placeholder="Type skill & press Enter..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const val = e.currentTarget.value.trim();
                          if (val && !group.items?.includes(val)) {
                            updateField(`skills.skillGroups.${gIdx}.items`, [...(group.items || []), val]);
                            e.currentTarget.value = "";
                          }
                        }
                      }}
                      className="w-full rounded-lg border border-border/60 bg-neutral-950/60 px-3 py-1.5 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-signal/70 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================= TAB 5: ML RUNS ======================= */}
        {activeTab === "ml" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold tracking-tight text-foreground">
                  Machine Learning Experiments & Notebooks
                </h2>
                <p className="text-xs text-muted-foreground">
                  Model architectures, fine-tuning datasets, training hardware setups, and evaluation metrics stored in content/ml.json.
                </p>
              </div>
              <button
                type="button"
                onClick={addNewMlRun}
                className="flex items-center gap-1.5 rounded-xl bg-signal px-3.5 py-2 font-mono text-xs font-semibold text-signal-ink hover:opacity-90 transition-all cursor-pointer shadow-md shadow-signal/20"
              >
                <Plus className="size-3.5" />
                <span>New ML Run</span>
              </button>
            </div>

            <div className="space-y-3">
              {content.ml?.runs?.map((run, rIdx) => (
                <div
                  key={rIdx}
                  className="rounded-xl border border-border/50 bg-card/40 p-4 backdrop-blur-md space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <span className="font-mono text-xs font-bold text-saffron">
                      Run #{rIdx + 1}: {run.model || "Untitled Model"}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteMlRun(rIdx)}
                      className="text-xs text-destructive hover:underline font-mono cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="size-3" /> Delete
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="font-mono text-[10.5px] text-muted-foreground">Model Name</label>
                      <input
                        type="text"
                        value={run.model || ""}
                        onChange={(e) => updateField(`ml.runs.${rIdx}.model`, e.target.value)}
                        className="w-full rounded-lg border border-border/60 bg-neutral-950/60 px-3 py-1.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[10.5px] text-muted-foreground">Framework</label>
                      <input
                        type="text"
                        value={run.framework || ""}
                        onChange={(e) => updateField(`ml.runs.${rIdx}.framework`, e.target.value)}
                        className="w-full rounded-lg border border-border/60 bg-neutral-950/60 px-3 py-1.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[10.5px] text-muted-foreground">Dataset</label>
                      <input
                        type="text"
                        value={run.dataset || ""}
                        onChange={(e) => updateField(`ml.runs.${rIdx}.dataset`, e.target.value)}
                        className="w-full rounded-lg border border-border/60 bg-neutral-950/60 px-3 py-1.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="font-mono text-[10.5px] text-muted-foreground">Notes & Details</label>
                      <input
                        type="text"
                        value={run.notes || ""}
                        onChange={(e) => updateField(`ml.runs.${rIdx}.notes`, e.target.value)}
                        className="w-full rounded-lg border border-border/60 bg-neutral-950/60 px-3 py-1.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[10.5px] text-muted-foreground">Hardware Setup</label>
                      <input
                        type="text"
                        value={run.hardware || ""}
                        onChange={(e) => updateField(`ml.runs.${rIdx}.hardware`, e.target.value)}
                        className="w-full rounded-lg border border-border/60 bg-neutral-950/60 px-3 py-1.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================= TAB 6: JOURNEY ======================= */}
        {activeTab === "journey" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold tracking-tight text-foreground">
                  Journey &amp; Milestone Timeline
                </h2>
                <p className="text-xs text-muted-foreground">
                  Circuit timeline header, telemetry metrics, and career milestones stored in content/copy.json and content/journey.json.
                </p>
              </div>
              <button
                type="button"
                onClick={addNewJourneyItem}
                className="flex items-center gap-1.5 rounded-xl bg-signal px-3.5 py-2 font-mono text-xs font-semibold text-signal-ink hover:opacity-90 transition-all cursor-pointer shadow-md shadow-signal/20"
              >
                <Plus className="size-3.5" />
                <span>New Milestone</span>
              </button>
            </div>

            {/* Timeline Header & Telemetry Card */}
            <div className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-md space-y-4">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-signal flex items-center gap-2">
                <Milestone className="size-4" />
                <span>Circuit Timeline Header &amp; Telemetry Metrics</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-[10.5px] text-muted-foreground">Section Eyebrow</label>
                  <input
                    type="text"
                    value={content.copy?.journey?.eyebrow || ""}
                    onChange={(e) => updateField("copy.journey.eyebrow", e.target.value)}
                    className="w-full rounded-lg border border-border/60 bg-neutral-950/60 px-3 py-1.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10.5px] text-muted-foreground">Section Title</label>
                  <input
                    type="text"
                    value={content.copy?.journey?.title || ""}
                    onChange={(e) => updateField("copy.journey.title", e.target.value)}
                    className="w-full rounded-lg border border-border/60 bg-neutral-950/60 px-3 py-1.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10.5px] text-muted-foreground">Status Badge</label>
                  <input
                    type="text"
                    value={content.copy?.journey?.status || ""}
                    onChange={(e) => updateField("copy.journey.status", e.target.value)}
                    className="w-full rounded-lg border border-border/60 bg-neutral-950/60 px-3 py-1.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10.5px] text-muted-foreground">Section Description</label>
                <textarea
                  rows={2}
                  value={content.copy?.journey?.description || ""}
                  onChange={(e) => updateField("copy.journey.description", e.target.value)}
                  className="w-full rounded-lg border border-border/60 bg-neutral-950/60 p-2.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-[10.5px] text-muted-foreground">Stream Prefix Label</label>
                  <input
                    type="text"
                    value={content.copy?.journey?.streamLabel || ""}
                    onChange={(e) => updateField("copy.journey.streamLabel", e.target.value)}
                    className="w-full rounded-lg border border-border/60 bg-neutral-950/60 px-3 py-1.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10.5px] text-muted-foreground">All Filter Label</label>
                  <input
                    type="text"
                    value={content.copy?.journey?.allBranchesLabel || ""}
                    onChange={(e) => updateField("copy.journey.allBranchesLabel", e.target.value)}
                    className="w-full rounded-lg border border-border/60 bg-neutral-950/60 px-3 py-1.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                  />
                </div>
              </div>

              {/* 5 Telemetry Metrics Grid */}
              <div className="border-t border-border/40 pt-3 space-y-2">
                <label className="font-mono text-[11px] font-semibold text-foreground uppercase tracking-wider block">
                  Header Telemetry Cards (5 Metrics)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Span */}
                  <div className="rounded-xl border border-border/50 bg-neutral-950/40 p-3 space-y-1.5">
                    <span className="font-mono text-[10px] text-signal uppercase font-bold">1. Span Metric</span>
                    <input
                      type="text"
                      placeholder="Label (e.g. Span)"
                      value={content.copy?.journey?.statSpanLabel || ""}
                      onChange={(e) => updateField("copy.journey.statSpanLabel", e.target.value)}
                      className="w-full rounded border border-border/60 bg-neutral-900 px-2 py-1 font-mono text-xs text-foreground"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. 2023 – 2026)"
                      value={content.copy?.journey?.statSpanValue || ""}
                      onChange={(e) => updateField("copy.journey.statSpanValue", e.target.value)}
                      className="w-full rounded border border-border/60 bg-neutral-900 px-2 py-1 font-mono text-xs text-foreground"
                    />
                    <input
                      type="text"
                      placeholder="Subtitle (e.g. 4 Years)"
                      value={content.copy?.journey?.statSpanSub || ""}
                      onChange={(e) => updateField("copy.journey.statSpanSub", e.target.value)}
                      className="w-full rounded border border-border/60 bg-neutral-900 px-2 py-1 font-mono text-xs text-foreground"
                    />
                  </div>

                  {/* Milestones */}
                  <div className="rounded-xl border border-border/50 bg-neutral-950/40 p-3 space-y-1.5">
                    <span className="font-mono text-[10px] text-signal uppercase font-bold">2. Milestones (Dynamic)</span>
                    <input
                      type="text"
                      placeholder="Label (e.g. Milestones)"
                      value={content.copy?.journey?.statMilestonesLabel || ""}
                      onChange={(e) => updateField("copy.journey.statMilestonesLabel", e.target.value)}
                      className="w-full rounded border border-border/60 bg-neutral-900 px-2 py-1 font-mono text-xs text-foreground"
                    />
                    <p className="font-mono text-[10.5px] text-muted-foreground italic py-1">
                      Count: {journeyCount} Records (Calculated)
                    </p>
                    <input
                      type="text"
                      placeholder="Subtitle (e.g. Records)"
                      value={content.copy?.journey?.statMilestonesSub || ""}
                      onChange={(e) => updateField("copy.journey.statMilestonesSub", e.target.value)}
                      className="w-full rounded border border-border/60 bg-neutral-900 px-2 py-1 font-mono text-xs text-foreground"
                    />
                  </div>

                  {/* Hackathons */}
                  <div className="rounded-xl border border-border/50 bg-neutral-950/40 p-3 space-y-1.5">
                    <span className="font-mono text-[10px] text-signal uppercase font-bold">3. Hackathons</span>
                    <input
                      type="text"
                      placeholder="Label (e.g. Hackathons)"
                      value={content.copy?.journey?.statHackathonsLabel || ""}
                      onChange={(e) => updateField("copy.journey.statHackathonsLabel", e.target.value)}
                      className="w-full rounded border border-border/60 bg-neutral-900 px-2 py-1 font-mono text-xs text-foreground"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. 1st Place)"
                      value={content.copy?.journey?.statHackathonsValue || ""}
                      onChange={(e) => updateField("copy.journey.statHackathonsValue", e.target.value)}
                      className="w-full rounded border border-border/60 bg-neutral-900 px-2 py-1 font-mono text-xs text-foreground"
                    />
                    <input
                      type="text"
                      placeholder="Subtitle (e.g. UniHack Winner)"
                      value={content.copy?.journey?.statHackathonsSub || ""}
                      onChange={(e) => updateField("copy.journey.statHackathonsSub", e.target.value)}
                      className="w-full rounded border border-border/60 bg-neutral-900 px-2 py-1 font-mono text-xs text-foreground"
                    />
                  </div>

                  {/* Robotics */}
                  <div className="rounded-xl border border-border/50 bg-neutral-950/40 p-3 space-y-1.5">
                    <span className="font-mono text-[10px] text-signal uppercase font-bold">4. Robotics</span>
                    <input
                      type="text"
                      placeholder="Label (e.g. Robotics)"
                      value={content.copy?.journey?.statRoboticsLabel || ""}
                      onChange={(e) => updateField("copy.journey.statRoboticsLabel", e.target.value)}
                      className="w-full rounded border border-border/60 bg-neutral-900 px-2 py-1 font-mono text-xs text-foreground"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. FTC)"
                      value={content.copy?.journey?.statRoboticsValue || ""}
                      onChange={(e) => updateField("copy.journey.statRoboticsValue", e.target.value)}
                      className="w-full rounded border border-border/60 bg-neutral-900 px-2 py-1 font-mono text-xs text-foreground"
                    />
                    <input
                      type="text"
                      placeholder="Subtitle (e.g. Nationals & Mentor)"
                      value={content.copy?.journey?.statRoboticsSub || ""}
                      onChange={(e) => updateField("copy.journey.statRoboticsSub", e.target.value)}
                      className="w-full rounded border border-border/60 bg-neutral-900 px-2 py-1 font-mono text-xs text-foreground"
                    />
                  </div>

                  {/* Open Source */}
                  <div className="rounded-xl border border-border/50 bg-neutral-950/40 p-3 space-y-1.5">
                    <span className="font-mono text-[10px] text-signal uppercase font-bold">5. Open Source</span>
                    <input
                      type="text"
                      placeholder="Label (e.g. Open Source)"
                      value={content.copy?.journey?.statOpenSourceLabel || ""}
                      onChange={(e) => updateField("copy.journey.statOpenSourceLabel", e.target.value)}
                      className="w-full rounded border border-border/60 bg-neutral-900 px-2 py-1 font-mono text-xs text-foreground"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. 40+)"
                      value={content.copy?.journey?.statOpenSourceValue || ""}
                      onChange={(e) => updateField("copy.journey.statOpenSourceValue", e.target.value)}
                      className="w-full rounded border border-border/60 bg-neutral-900 px-2 py-1 font-mono text-xs text-foreground"
                    />
                    <input
                      type="text"
                      placeholder="Subtitle (e.g. Repositories)"
                      value={content.copy?.journey?.statOpenSourceSub || ""}
                      onChange={(e) => updateField("copy.journey.statOpenSourceSub", e.target.value)}
                      className="w-full rounded border border-border/60 bg-neutral-900 px-2 py-1 font-mono text-xs text-foreground"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-1.5">
                Milestone Items ({journeyCount})
              </h3>
              {content.journey?.map((item, jIdx) => (
                <div
                  key={jIdx}
                  className="rounded-xl border border-border/50 bg-card/40 p-4 backdrop-blur-md space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <span className="font-mono text-xs font-bold text-signal">
                      {item.date || "Date"} • {item.title || "Milestone Title"}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteJourneyItem(jIdx)}
                      className="text-xs text-destructive hover:underline font-mono cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="size-3" /> Delete
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="font-mono text-[10.5px] text-muted-foreground">Date / Period</label>
                      <input
                        type="text"
                        value={item.date || ""}
                        onChange={(e) => updateField(`journey.${jIdx}.date`, e.target.value)}
                        className="w-full rounded-lg border border-border/60 bg-neutral-950/60 px-3 py-1.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[10.5px] text-muted-foreground">Category</label>
                      <input
                        type="text"
                        value={item.category || "main"}
                        onChange={(e) => updateField(`journey.${jIdx}.category`, e.target.value)}
                        className="w-full rounded-lg border border-border/60 bg-neutral-950/60 px-3 py-1.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[10.5px] text-muted-foreground">Title</label>
                      <input
                        type="text"
                        value={item.title || ""}
                        onChange={(e) => updateField(`journey.${jIdx}.title`, e.target.value)}
                        className="w-full rounded-lg border border-border/60 bg-neutral-950/60 px-3 py-1.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-3 space-y-1">
                      <label className="font-mono text-[10.5px] text-muted-foreground">Note / Summary</label>
                      <textarea
                        rows={2}
                        value={item.note || ""}
                        onChange={(e) => updateField(`journey.${jIdx}.note`, e.target.value)}
                        className="w-full rounded-lg border border-border/60 bg-neutral-950/60 p-2.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================= TAB 7: ACTIVITIES & CERTS ======================= */}
        {activeTab === "activities" && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold tracking-tight text-foreground">
                  Activities, Competitions &amp; Certifications
                </h2>
                <p className="text-xs text-muted-foreground">
                  Extracurricular competitions, hackathons, and accredited licenses in content/activities.json and content/certifications.json.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addNewActivity}
                  className="flex items-center gap-1.5 rounded-xl border border-signal/40 bg-signal/15 px-3 py-1.5 font-mono text-xs font-semibold text-signal hover:bg-signal hover:text-signal-ink transition-all cursor-pointer"
                >
                  <Plus className="size-3" />
                  <span>New Activity</span>
                </button>
                <button
                  type="button"
                  onClick={addNewCert}
                  className="flex items-center gap-1.5 rounded-xl bg-signal px-3.5 py-1.5 font-mono text-xs font-semibold text-signal-ink hover:opacity-90 transition-all cursor-pointer shadow-md shadow-signal/20"
                >
                  <Plus className="size-3" />
                  <span>New Certification</span>
                </button>
              </div>
            </div>

            {/* Extracurricular Activities Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-signal flex items-center gap-2">
                  <Award className="size-4" />
                  <span>Extracurricular Activities &amp; Competitions ({activityCount})</span>
                </h3>
                <button
                  type="button"
                  onClick={addNewActivity}
                  className="text-signal hover:underline text-[11px] font-mono cursor-pointer flex items-center gap-1"
                >
                  <Plus className="size-3" /> Add Activity
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {content.activities?.map((act, aIdx) => (
                  <div key={act.id || aIdx} className="rounded-xl border border-border/50 bg-card/40 p-4 space-y-3">
                    <div className="flex justify-between items-center border-b border-border/40 pb-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-xs font-semibold text-foreground truncate max-w-[180px]">
                          {act.title || "Activity Title"}
                        </span>
                        <span className="rounded bg-signal/15 px-1.5 py-0.5 font-mono text-[10px] text-signal uppercase tracking-wider shrink-0">
                          {act.type || "Event"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteActivity(act.id)}
                        className="text-xs text-destructive hover:underline font-mono cursor-pointer"
                      >
                        × Delete
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="space-y-1">
                        <label className="font-mono text-[10px] text-muted-foreground">Title</label>
                        <input
                          type="text"
                          placeholder="Title"
                          value={act.title || ""}
                          onChange={(e) => updateField(`activities.${aIdx}.title`, e.target.value)}
                          className="w-full rounded border border-border/60 bg-neutral-950/60 px-2.5 py-1.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-mono text-[10px] text-muted-foreground">Type (e.g. Hackathon)</label>
                        <input
                          type="text"
                          placeholder="Type"
                          value={act.type || ""}
                          onChange={(e) => updateField(`activities.${aIdx}.type`, e.target.value)}
                          className="w-full rounded border border-border/60 bg-neutral-950/60 px-2.5 py-1.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="space-y-1">
                        <label className="font-mono text-[10px] text-muted-foreground">Year</label>
                        <input
                          type="text"
                          placeholder="Year (e.g. 2025)"
                          value={act.year || ""}
                          onChange={(e) => updateField(`activities.${aIdx}.year`, e.target.value)}
                          className="w-full rounded border border-border/60 bg-neutral-950/60 px-2.5 py-1.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-mono text-[10px] text-muted-foreground">Location</label>
                        <input
                          type="text"
                          placeholder="Location (e.g. Romania, Timisoara)"
                          value={act.location || ""}
                          onChange={(e) => updateField(`activities.${aIdx}.location`, e.target.value)}
                          className="w-full rounded border border-border/60 bg-neutral-950/60 px-2.5 py-1.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="space-y-1">
                        <label className="font-mono text-[10px] text-muted-foreground">Link / URL (Optional)</label>
                        <input
                          type="text"
                          placeholder="https://..."
                          value={act.link || ""}
                          onChange={(e) => updateField(`activities.${aIdx}.link`, e.target.value || undefined)}
                          className="w-full rounded border border-border/60 bg-neutral-950/60 px-2.5 py-1.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-mono text-[10px] text-muted-foreground">Image Path (Optional)</label>
                        <input
                          type="text"
                          placeholder="/activities/photo.webp"
                          value={act.image || ""}
                          onChange={(e) => updateField(`activities.${aIdx}.image`, e.target.value || undefined)}
                          className="w-full rounded border border-border/60 bg-neutral-950/60 px-2.5 py-1.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[10px] text-muted-foreground">Description</label>
                      <textarea
                        rows={2}
                        placeholder="Description"
                        value={act.description || ""}
                        onChange={(e) => updateField(`activities.${aIdx}.description`, e.target.value)}
                        className="w-full rounded border border-border/60 bg-neutral-950/60 p-2 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications Section */}
            <div className="space-y-4 pt-4 border-t border-border/40">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-saffron flex items-center gap-2">
                  <Award className="size-4" />
                  <span>Accredited Certifications ({certCount})</span>
                </h3>
                <button
                  type="button"
                  onClick={addNewCert}
                  className="text-saffron hover:underline text-[11px] font-mono cursor-pointer flex items-center gap-1"
                >
                  <Plus className="size-3" /> Add Certificate
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {content.certifications?.map((cert, cIdx) => (
                  <div key={cert.id || cIdx} className="rounded-xl border border-border/50 bg-card/40 p-4 space-y-3">
                    <div className="flex justify-between items-center border-b border-border/40 pb-2">
                      <span className="font-mono text-xs font-semibold text-foreground truncate max-w-[200px]">
                        {cert.title || "Certification"}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteCert(cert.id)}
                        className="text-xs text-destructive hover:underline font-mono cursor-pointer"
                      >
                        × Delete
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="space-y-1">
                        <label className="font-mono text-[10px] text-muted-foreground">Title</label>
                        <input
                          type="text"
                          placeholder="Title"
                          value={cert.title || ""}
                          onChange={(e) => updateField(`certifications.${cIdx}.title`, e.target.value)}
                          className="w-full rounded border border-border/60 bg-neutral-950/60 px-2.5 py-1.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-mono text-[10px] text-muted-foreground">Subtitle</label>
                        <input
                          type="text"
                          placeholder="Subtitle"
                          value={cert.subtitle || ""}
                          onChange={(e) => updateField(`certifications.${cIdx}.subtitle`, e.target.value)}
                          className="w-full rounded border border-border/60 bg-neutral-950/60 px-2.5 py-1.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="space-y-1">
                        <label className="font-mono text-[10px] text-muted-foreground">Issuer</label>
                        <input
                          type="text"
                          placeholder="Issuer"
                          value={cert.issuer || ""}
                          onChange={(e) => updateField(`certifications.${cIdx}.issuer`, e.target.value)}
                          className="w-full rounded border border-border/60 bg-neutral-950/60 px-2.5 py-1.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-mono text-[10px] text-muted-foreground">Year</label>
                        <input
                          type="text"
                          placeholder="Year"
                          value={cert.year || ""}
                          onChange={(e) => updateField(`certifications.${cIdx}.year`, e.target.value)}
                          className="w-full rounded border border-border/60 bg-neutral-950/60 px-2.5 py-1.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="space-y-1">
                        <label className="font-mono text-[10px] text-muted-foreground">Poster Thumbnail (Optional)</label>
                        <input
                          type="text"
                          placeholder="/certificates/ccna.webp"
                          value={cert.poster || ""}
                          onChange={(e) => updateField(`certifications.${cIdx}.poster`, e.target.value || undefined)}
                          className="w-full rounded border border-border/60 bg-neutral-950/60 px-2.5 py-1.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-mono text-[10px] text-muted-foreground">PDF File (Optional)</label>
                        <input
                          type="text"
                          placeholder="/certificates/ccna.pdf"
                          value={cert.file || ""}
                          onChange={(e) => updateField(`certifications.${cIdx}.file`, e.target.value || undefined)}
                          className="w-full rounded border border-border/60 bg-neutral-950/60 px-2.5 py-1.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="font-mono text-[10px] text-muted-foreground">Tags (comma-separated)</label>
                      <TagInput
                        placeholder="Networking, TCP/IP, Routing"
                        value={cert.tags}
                        onChange={(tags) =>
                          updateField(`certifications.${cIdx}.tags`, tags)
                        }
                        className="w-full rounded border border-border/60 bg-neutral-950/60 px-2.5 py-1.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 8: RAG & AI SUITE ======================= */}
        {activeTab === "rag" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/40 pb-4">
              <div>
                <h2 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Cpu className="size-4 text-signal" />
                  <span>RAG Engine Operations & Benchmarks</span>
                </h2>
                <p className="text-xs text-muted-foreground">
                  Configure local generation hyperparameters, inspect hybrid retrieval DAG execution, and run automated 5-way benchmarks.
                </p>
              </div>

              {/* RAG Sub-tabs */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden rounded-lg border border-border/50 bg-card/60 p-1 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => setRagSubTab("settings")}
                  className={`rounded px-2.5 py-1 transition-all cursor-pointer ${
                    ragSubTab === "settings"
                      ? "bg-signal text-signal-ink font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Models & Settings
                </button>
                <button
                  type="button"
                  onClick={() => setRagSubTab("pipeline")}
                  className={`rounded px-2.5 py-1 transition-all cursor-pointer ${
                    ragSubTab === "pipeline"
                      ? "bg-signal text-signal-ink font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  DAG Traces
                </button>
                <button
                  type="button"
                  onClick={() => setRagSubTab("eval")}
                  className={`rounded px-2.5 py-1 transition-all cursor-pointer ${
                    ragSubTab === "eval"
                      ? "bg-signal text-signal-ink font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  5-Way Eval
                </button>
                <button
                  type="button"
                  onClick={() => setRagSubTab("kb")}
                  className={`rounded px-2.5 py-1 transition-all cursor-pointer ${
                    ragSubTab === "kb"
                      ? "bg-signal text-signal-ink font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Knowledge Base
                </button>
                <button
                  type="button"
                  onClick={() => setRagSubTab("source")}
                  className={`rounded px-2.5 py-1 transition-all cursor-pointer ${
                    ragSubTab === "source"
                      ? "bg-signal text-signal-ink font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Source Explorer
                </button>
              </div>
            </div>

            {/* Sub-tab view container */}
            <div className="rounded-xl border border-border/40 bg-neutral-950/50 min-h-[480px] overflow-hidden">
              {ragSubTab === "settings" && <SettingsView />}
              {ragSubTab === "pipeline" && <PipelineView />}
              {ragSubTab === "eval" && <EvalView />}
              {ragSubTab === "kb" && <KBView />}
              {ragSubTab === "source" && <SourceView />}
            </div>
          </div>
        )}

        {/* ======================= TAB 9: COPY & HEADLINES ======================= */}
        {activeTab === "copy" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground">
                Section Headlines & Copywriting
              </h2>
              <p className="text-xs text-muted-foreground">
                Customize titles, introductory subtitles, and section copy stored in content/copy.json.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(content.copy || {}).map(([secKey, secValue]) => {
                if (typeof secValue === "string") {
                  return (
                    <div key={secKey} className="space-y-1.5">
                      <label className="font-mono text-xs text-muted-foreground uppercase">
                        {secKey.replace(/([A-Z])/g, " $1").trim()}
                      </label>
                      <input
                        type="text"
                        value={secValue}
                        onChange={(e) => updateField(`copy.${secKey}`, e.target.value)}
                        className="w-full rounded-xl border border-border/60 bg-card/50 px-3.5 py-2 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                      />
                    </div>
                  );
                } else if (typeof secValue === "object" && secValue !== null) {
                  return (
                    <div key={secKey} className="md:col-span-2 rounded-xl border border-border/50 bg-card/30 p-4 space-y-3">
                      <span className="font-mono text-xs font-bold text-signal uppercase tracking-wider">
                        {secKey} Section
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(secValue as Record<string, string>).map(([subKey, subVal]) => (
                          <div key={subKey} className="space-y-1">
                            <label className="font-mono text-[11px] text-muted-foreground">
                              {subKey}
                            </label>
                            <input
                              type="text"
                              value={subVal || ""}
                              onChange={(e) => updateField(`copy.${secKey}.${subKey}`, e.target.value)}
                              className="w-full rounded-lg border border-border/60 bg-neutral-950/60 px-3 py-1.5 font-mono text-xs text-foreground focus:border-signal/70 focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}

        {/* ======================= TAB 10: TESTS & DEPLOY SIMULATION ======================= */}
        {activeTab === "tests" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground">
                Testing, Diagnostics & Deploy Simulation
              </h2>
              <p className="text-xs text-muted-foreground">
                Simulate GitHub Pages static standalone mode, test glitched standby fallbacks, and inspect deployment telemetry without pushing to remote servers.
              </p>
            </div>

            {/* Master Toggle Card */}
            <div className="rounded-2xl border border-border/50 bg-neutral-950/60 p-5 backdrop-blur-xl ring-1 ring-white/5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="size-4 text-signal" />
                    <span className="font-mono text-sm font-bold text-foreground">
                      GitHub Pages Glitched Mode Simulation
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-xl">
                    Forces the AI Chat Assistant into its cybernetic glitched / offline standby interface with CRT scanlines, telemetry matrix, and pre-cached project quick-actions.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleGlitchMode()}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-xs font-bold transition-all cursor-pointer shadow-md ${
                      isSimulated
                        ? "bg-amber-400 text-black shadow-amber-400/25 ring-2 ring-amber-400/50"
                        : "border border-border/60 bg-card/60 text-muted-foreground hover:border-signal/50 hover:text-foreground"
                    }`}
                  >
                    <Radio className={`size-3.5 ${isSimulated ? "animate-pulse" : ""}`} />
                    <span>{isSimulated ? "SIMULATION ON (GLITCHED)" : "SIMULATION OFF (LIVE)"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChatOpen(true)}
                    className="flex items-center gap-1.5 rounded-xl border border-signal/40 bg-signal/15 px-3.5 py-2 font-mono text-xs font-semibold text-signal hover:bg-signal hover:text-signal-ink transition-all cursor-pointer"
                  >
                    <Radio className="size-3.5" />
                    <span>Open Chat</span>
                  </button>
                </div>
              </div>

              {/* Status Readout Banner */}
              <div
                className={`rounded-xl border p-3 font-mono text-xs flex items-center justify-between ${
                  isGlitchActive
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                    : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`size-2 rounded-full ${
                      isGlitchActive ? "bg-amber-400" : "bg-emerald-400"
                    }`}
                  />
                  <span>
                    Current Assistant State:{" "}
                    <strong>{isGlitchActive ? "Cybernetic Glitched Mode (Standby)" : "Live Unsloth Inference (Online)"}</strong>
                  </span>
                </div>
                <span className="text-[10.5px] opacity-80">
                  {isSimulated ? "Controlled by Local Admin Override" : isGhPages ? "Auto-Engaged by GitHub Pages Build" : "Local Development Environment"}
                </span>
              </div>
            </div>

            {/* Offline Design Style Selector Card */}
            <div className="rounded-2xl border border-border/50 bg-neutral-950/60 p-5 backdrop-blur-xl ring-1 ring-white/5 space-y-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div className="space-y-0.5">
                  <span className="font-mono text-sm font-bold text-foreground flex items-center gap-2">
                    <Layers className="size-4 text-signal" />
                    Select Standby / Glitched Design Preset
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Choose which custom visual interface is activated during static GitHub Pages hosting.
                  </p>
                </div>
                <span className="rounded-full border border-signal/40 bg-signal/15 px-2.5 py-0.5 font-mono text-[10.5px] font-bold text-signal">
                  ACTIVE: {offlineStyle.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Style 1: Cyberpunk CRT Terminal */}
                <button
                  type="button"
                  onClick={() => setOfflineStyle("cyberpunk")}
                  className={`rounded-xl border p-4 text-left space-y-2 transition-all cursor-pointer ${
                    offlineStyle === "cyberpunk"
                      ? "border-amber-400 bg-amber-500/15 shadow-lg shadow-amber-400/20 ring-2 ring-amber-400/50"
                      : "border-border/60 bg-card/40 hover:border-amber-400/40 hover:bg-card/70"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-300">
                      Option 1: Cyberpunk CRT
                    </span>
                    <Radio className="size-3.5 text-amber-400" />
                  </div>
                  <p className="text-[11.5px] text-muted-foreground leading-relaxed">
                    Frosted glass terminal with cyber text scramble decode, amber telemetry badges, and simulated query fallbacks.
                  </p>
                </button>

                {/* Style 2: Seamless Glitched Assistant */}
                <button
                  type="button"
                  onClick={() => setOfflineStyle("holographic")}
                  className={`rounded-xl border p-4 text-left space-y-2 transition-all cursor-pointer ${
                    offlineStyle === "holographic"
                      ? "border-signal bg-signal/15 shadow-lg shadow-signal/25 ring-2 ring-signal/50"
                      : "border-border/60 bg-card/40 hover:border-signal/40 hover:bg-card/70"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-signal">
                      Option 2: Glitched Glass Assistant (Default)
                    </span>
                    <Layers className="size-3.5 text-signal" />
                  </div>
                  <p className="text-[11.5px] text-muted-foreground leading-relaxed">
                    Matches the exact default website glass UI with live text glitching, simulated HTTP 503 error handshake diagnostics, and verified dossier reveals.
                  </p>
                </button>

                {/* Style 3: Cyber-Deck Glass Shell */}
                <button
                  type="button"
                  onClick={() => setOfflineStyle("cyberdeck")}
                  className={`rounded-xl border p-4 text-left space-y-2 transition-all cursor-pointer ${
                    offlineStyle === "cyberdeck"
                      ? "border-signal bg-signal/15 shadow-lg shadow-signal/20 ring-2 ring-signal/50"
                      : "border-border/60 bg-card/40 hover:border-signal/40 hover:bg-card/70"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-signal">
                      Option 3: Cyber-Deck Glass Shell
                    </span>
                    <Terminal className="size-3.5 text-signal" />
                  </div>
                  <p className="text-[11.5px] text-muted-foreground leading-relaxed">
                    Interactive command-line shell formatted to fit the website&apos;s dark glass design ($ vortex, $ stack, $ contact, $ ping).
                  </p>
                </button>
              </div>
            </div>

            {/* Offline Themes Text & Diagnostics Editor */}
            <div className="rounded-2xl border border-border/50 bg-neutral-950/60 p-5 backdrop-blur-xl ring-1 ring-white/5 space-y-5">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div className="space-y-0.5">
                  <span className="font-mono text-sm font-bold text-foreground flex items-center gap-2">
                    <Type className="size-4 text-signal" />
                    Customize Standby Theme Copy & Handshake Messages
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Edit the exact texts, glitch headlines, 503 error logs, and dossier summaries stored in content/offline-themes.json.
                  </p>
                </div>
                <span className="font-mono text-[10.5px] text-muted-foreground">
                  Stored in content/offline-themes.json
                </span>
              </div>

              {/* Common Theme Copy */}
              <div className="space-y-3">
                <span className="font-mono text-xs font-bold text-signal uppercase tracking-wider">
                  1. Common Standby Headers & Prompts
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">Assistant Standby Title</label>
                    <input
                      type="text"
                      value={content.offlineThemes?.common?.assistantTitle || ""}
                      onChange={(e) => updateField("offlineThemes.common.assistantTitle", e.target.value)}
                      className="w-full rounded-lg border border-border/60 bg-card/50 px-3 py-1.5 text-foreground focus:border-signal focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">Status Badge Text</label>
                    <input
                      type="text"
                      value={content.offlineThemes?.common?.status || ""}
                      onChange={(e) => updateField("offlineThemes.common.status", e.target.value)}
                      className="w-full rounded-lg border border-border/60 bg-card/50 px-3 py-1.5 text-foreground focus:border-signal focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] text-muted-foreground">Welcome Standby Description</label>
                    <textarea
                      rows={2}
                      value={content.offlineThemes?.common?.welcomeDescription || ""}
                      onChange={(e) => updateField("offlineThemes.common.welcomeDescription", e.target.value)}
                      className="w-full rounded-lg border border-border/60 bg-card/50 px-3 py-1.5 text-foreground font-sans text-xs focus:border-signal focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">Input Placeholder</label>
                    <input
                      type="text"
                      value={content.offlineThemes?.common?.inputPlaceholder || ""}
                      onChange={(e) => updateField("offlineThemes.common.inputPlaceholder", e.target.value)}
                      className="w-full rounded-lg border border-border/60 bg-card/50 px-3 py-1.5 text-foreground focus:border-signal focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">Footer Host Tag</label>
                    <input
                      type="text"
                      value={content.offlineThemes?.common?.footerHost || ""}
                      onChange={(e) => updateField("offlineThemes.common.footerHost", e.target.value)}
                      className="w-full rounded-lg border border-border/60 bg-card/50 px-3 py-1.5 text-foreground focus:border-signal focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Option 2: Glitched Glass Fallback Summaries */}
              <div className="space-y-3 pt-2 border-t border-border/40">
                <span className="font-mono text-xs font-bold text-amber-400 uppercase tracking-wider">
                  2. Option 2: Glitched Glass Error Banner & Dossier Summaries
                </span>
                <div className="space-y-3 font-mono text-xs">
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">HTTP 503 Top Banner Text</label>
                    <input
                      type="text"
                      value={content.offlineThemes?.glitchedAssistant?.bannerText || ""}
                      onChange={(e) => updateField("offlineThemes.glitchedAssistant.bannerText", e.target.value)}
                      className="w-full rounded-lg border border-border/60 bg-card/50 px-3 py-1.5 text-foreground focus:border-signal focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] text-muted-foreground">Vortex Dossier Summary</label>
                      <textarea
                        rows={3}
                        value={content.offlineThemes?.glitchedAssistant?.vortexSummary || ""}
                        onChange={(e) => updateField("offlineThemes.glitchedAssistant.vortexSummary", e.target.value)}
                        className="w-full rounded-lg border border-border/60 bg-card/50 px-3 py-1.5 text-foreground font-sans text-xs focus:border-signal focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-muted-foreground">Tech Stack Dossier Summary</label>
                      <textarea
                        rows={3}
                        value={content.offlineThemes?.glitchedAssistant?.stackSummary || ""}
                        onChange={(e) => updateField("offlineThemes.glitchedAssistant.stackSummary", e.target.value)}
                        className="w-full rounded-lg border border-border/60 bg-card/50 px-3 py-1.5 text-foreground font-sans text-xs focus:border-signal focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-muted-foreground">Contact Dossier Summary</label>
                      <textarea
                        rows={3}
                        value={content.offlineThemes?.glitchedAssistant?.contactSummary || ""}
                        onChange={(e) => updateField("offlineThemes.glitchedAssistant.contactSummary", e.target.value)}
                        className="w-full rounded-lg border border-border/60 bg-card/50 px-3 py-1.5 text-foreground font-sans text-xs focus:border-signal focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Option 3: Cyber-Deck CLI & Option 1 Titles */}
              <div className="space-y-3 pt-2 border-t border-border/40">
                <span className="font-mono text-xs font-bold text-signal uppercase tracking-wider">
                  3. Option 1 & 3: Telemetry & CLI Titles
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">Option 1 Telemetry Header</label>
                    <input
                      type="text"
                      value={content.offlineThemes?.cyberpunk?.telemetryTitle || ""}
                      onChange={(e) => updateField("offlineThemes.cyberpunk.telemetryTitle", e.target.value)}
                      className="w-full rounded-lg border border-border/60 bg-card/50 px-3 py-1.5 text-foreground focus:border-signal focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">Option 3 CLI Header Title</label>
                    <input
                      type="text"
                      value={content.offlineThemes?.cyberdeck?.headerTitle || ""}
                      onChange={(e) => updateField("offlineThemes.cyberdeck.headerTitle", e.target.value)}
                      className="w-full rounded-lg border border-border/60 bg-card/50 px-3 py-1.5 text-foreground focus:border-signal focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Architecture Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Local Full Inference Stack */}
              <div className="rounded-xl border border-border/50 bg-card/30 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <span className="font-mono text-xs font-bold text-signal flex items-center gap-1.5">
                    <Server className="size-3.5" />
                    Local Workstation Mode
                  </span>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-300">
                    Full AI Pipeline
                  </span>
                </div>
                <ul className="space-y-2 text-xs text-muted-foreground font-mono">
                  <li className="flex items-start gap-2">
                    <Check className="size-3.5 text-signal shrink-0 mt-0.5" />
                    <span>Real-time Unsloth Studio LLM generation (Gemma 4 Q4_K_M)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="size-3.5 text-signal shrink-0 mt-0.5" />
                    <span>Dense embeddings + BM25 reciprocal rank fusion</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="size-3.5 text-signal shrink-0 mt-0.5" />
                    <span>Cross-encoder reranker + parent document context expansion</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="size-3.5 text-signal shrink-0 mt-0.5" />
                    <span>Model-driven in-page scroll and dynamic project sub-route navigation</span>
                  </li>
                </ul>
              </div>

              {/* GitHub Pages Standalone Stack */}
              <div className="rounded-xl border border-border/50 bg-card/30 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <span className="font-mono text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Radio className="size-3.5" />
                    GitHub Pages Static Deploy
                  </span>
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-300">
                    Glitched Standby Mode
                  </span>
                </div>
                <ul className="space-y-2 text-xs text-muted-foreground font-mono">
                  <li className="flex items-start gap-2">
                    <ShieldCheck className="size-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>Authentic cyberpunk CRT scanlines & telemetry diagnostics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ShieldCheck className="size-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>Interactive simulated query fallback for questions & project topics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ShieldCheck className="size-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>Direct jump action pills for Vortex case study, contact & stack</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ShieldCheck className="size-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>Zero 404/500 console crashes on static export hosting</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Runtime Telemetry Diagnostics */}
            <div className="rounded-xl border border-border/50 bg-card/20 p-4 space-y-3">
              <span className="font-mono text-xs font-bold text-foreground flex items-center gap-1.5">
                <Terminal className="size-3.5 text-signal" />
                Environment & Deployment Telemetry
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="rounded-lg border border-border/40 bg-neutral-950/60 p-2.5 space-y-1">
                  <div className="text-[10.5px] text-muted-foreground">DEPLOY TARGET</div>
                  <div className="font-bold text-foreground">{process.env.NEXT_PUBLIC_DEPLOY_TARGET || "local-dev"}</div>
                </div>
                <div className="rounded-lg border border-border/40 bg-neutral-950/60 p-2.5 space-y-1">
                  <div className="text-[10.5px] text-muted-foreground">BASE PATH</div>
                  <div className="font-bold text-foreground">{BASE_PATH || "/"}</div>
                </div>
                <div className="rounded-lg border border-border/40 bg-neutral-950/60 p-2.5 space-y-1">
                  <div className="text-[10.5px] text-muted-foreground">IS GH-PAGES</div>
                  <div className="font-bold text-foreground">{isGhPages ? "True" : "False"}</div>
                </div>
                <div className="rounded-lg border border-border/40 bg-neutral-950/60 p-2.5 space-y-1">
                  <div className="text-[10.5px] text-muted-foreground">BACKEND LINK</div>
                  <div className={`font-bold ${isConnected ? "text-emerald-400" : "text-amber-400"}`}>
                    {isConnected ? "Connected" : "Offline"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
