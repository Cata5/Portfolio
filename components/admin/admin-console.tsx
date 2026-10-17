"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Lock,
  MessageSquare,
  RefreshCw,
  Save,
  ShieldAlert,
} from "lucide-react";

import { useEditor } from "@/components/editor/editor-context";
import { useRAG } from "@/components/rag/rag-context";
import { CLogo } from "@/components/rag/c-logo";
import { GlassCard } from "@/components/glass-card";
import { PipelineView } from "@/components/rag/pipeline-view";
import { SourceView } from "@/components/rag/source-view";
import { EvalView } from "@/components/rag/eval-view";
import { KBView } from "@/components/rag/kb-view";
import { SettingsView } from "@/components/rag/settings-view";
import { SectionsManager } from "@/components/admin/sections-manager";
import { OverviewPanel } from "@/components/admin/panels/overview-panel";
import { SitePanel } from "@/components/admin/panels/site-panel";
import { OpsPanel } from "@/components/admin/panels/ops-panel";
import {
  StatusDot,
  btnGhost,
  btnPrimary,
  controlClass,
  frostControl,
} from "@/components/admin/console-ui";
import {
  ADMIN_VIEWS,
  ADMIN_VIEW_GROUP_ORDER,
  isAdminView,
  type AdminView,
  type AdminViewGroup,
} from "@/components/admin/console-views";
import { cn } from "@/lib/utils";

export function AdminConsole() {
  const {
    isAuthenticated,
    unlockWithPassword,
    lockEditor,
    isDirty,
    isSaving,
    saveStatus,
    saveMessage,
    saveChanges,
  } = useEditor();
  const { status, setIsOpen: setChatOpen, triggerReindex } = useRAG();

  // Deep link support: /admin?tab=rag-kb. Read once from the URL; the mounted
  // guard below keeps the server and first client paint identical, so this
  // value is not rendered until after hydration.
  const [view, setView] = useState<AdminView>(() => {
    if (typeof window === "undefined") return "overview";
    const requested = new URLSearchParams(window.location.search).get("tab");
    return isAdminView(requested) ? requested : "overview";
  });
  const [mounted, setMounted] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncNote, setSyncNote] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- mounted-guard pattern: server and first client paint render the same placeholder so the localStorage-backed auth state can restore before the gate renders
  useEffect(() => setMounted(true), []);

  const selectView = useCallback((next: AdminView) => {
    setView(next);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (next === "overview") url.searchParams.delete("tab");
    else url.searchParams.set("tab", next);
    window.history.replaceState(null, "", url.toString());
  }, []);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setSubmitting(true);
    setAuthError("");
    const res = await unlockWithPassword(password);
    setSubmitting(false);
    if (res.success) setPassword("");
    else setAuthError(res.error || "Incorrect password");
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncNote(null);
    try {
      const outcome = await triggerReindex();
      if (outcome.ok) {
        const indexed = Number(outcome.data?.indexedCount ?? 0);
        const skipped = Number(outcome.data?.skippedCount ?? 0);
        setSyncNote({
          tone: "success",
          text: `Index synced — ${indexed} indexed, ${skipped} unchanged.`,
        });
      } else {
        setSyncNote({ tone: "error", text: outcome.error || "Sync failed." });
      }
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncNote(null), 8000);
    }
  };

  const connected = status?.models?.isServerConnected === true;
  const model = (status?.models?.generationModel as string) || "";
  const docs = status?.counts?.documents;
  const chunks = status?.counts?.chunks;

  // Avoid flashing the login form before the provider restores the session.
  if (!mounted) {
    return <div className="min-h-[70vh]" aria-hidden="true" />;
  }

  if (!isAuthenticated) {
    return (
      <div className="relative flex min-h-[80vh] items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2.5">
            <span
              className={cn(
                frostControl,
                "flex size-9 items-center justify-center rounded-xl text-signal",
              )}
            >
              <CLogo className="size-4" />
            </span>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Portfolio
              </p>
              <p className="text-sm font-semibold text-foreground">Console</p>
            </div>
          </div>

          <GlassCard className="rounded-2xl">
            <form onSubmit={handleUnlock} className="p-5">
              <h1 className="text-sm font-semibold text-foreground">
                Restricted operations
              </h1>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                The console exposes the RAG engine, retrieval index and deploy
                controls. Enter the admin passphrase to continue.
              </p>

              <div className="mt-5 space-y-3">
                <label className="block space-y-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    Passphrase
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoFocus
                    autoComplete="current-password"
                    className={controlClass}
                  />
                </label>

                {authError && (
                  <p className="flex items-center gap-1.5 font-mono text-[11px] text-destructive">
                    <ShieldAlert className="size-3.5" />
                    {authError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting || !password}
                  className={cn(btnPrimary, "w-full py-2.5 text-xs")}
                >
                  {submitting ? "Verifying…" : "Unlock console"}
                </button>
              </div>
            </form>
          </GlassCard>

          <Link
            href="/"
            className="mt-5 inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3" />
            Back to portfolio
          </Link>
        </div>
      </div>
    );
  }

  const active = ADMIN_VIEWS.find((v) => v.id === view) ?? ADMIN_VIEWS[0];

  return (
    <div className="mx-auto w-full max-w-[1480px] px-3 pb-24 pt-4 sm:px-6 lg:pt-6">
      <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start lg:gap-6">
        {/* ---------------------------------------------------------------- */}
        {/* Rail                                                             */}
        {/* ---------------------------------------------------------------- */}
        <aside
          aria-label="Console navigation"
          className="hidden lg:sticky lg:top-20 lg:block lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1"
        >
          <div className="flex items-center gap-2.5 px-2 pb-4">
            <span
              className={cn(
                frostControl,
                "flex size-8 items-center justify-center rounded-lg text-signal",
              )}
            >
              <CLogo className="size-3.5" />
            </span>
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Portfolio
              </p>
              <p className="truncate text-[13px] font-semibold text-foreground">
                Console
              </p>
            </div>
          </div>

          <nav className="space-y-4">
            {ADMIN_VIEW_GROUP_ORDER.map((group: AdminViewGroup) => (
              <div key={group}>
                <p className="px-2.5 pb-1.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground/70">
                  {group}
                </p>
                <ul className="space-y-0.5">
                  {ADMIN_VIEWS.filter((v) => v.group === group).map((item) => {
                    const selected = item.id === view;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => selectView(item.id)}
                          aria-current={selected ? "page" : undefined}
                          className={cn(
                            "group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left font-mono text-[11.5px] transition-colors",
                            selected
                              ? "bg-signal/12 text-foreground"
                              : "text-muted-foreground hover:bg-card/50 hover:text-foreground",
                          )}
                        >
                          <span
                            className={cn(
                              "h-4 w-0.5 shrink-0 rounded-full transition-colors",
                              selected ? "bg-signal" : "bg-transparent",
                            )}
                          />
                          <span className="truncate">{item.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* Machine rail — the console's one flourish. Live engine + index state. */}
          <GlassCard className="mt-5 rounded-xl p-3.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground/70">
                Machine
              </span>
              <span className="flex items-center gap-1.5">
                <StatusDot tone={connected ? "positive" : "negative"} />
                <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
                  {connected ? "online" : "offline"}
                </span>
              </span>
            </div>
            <div className="mt-2.5 space-y-2">
              <RailRow
                label="Model"
                value={model ? (model.split("/").pop() ?? model) : "—"}
              />
              <RailRow
                label="Index"
                value={
                  docs === undefined
                    ? "—"
                    : `${docs} docs · ${chunks ?? 0} chunks`
                }
              />
              <RailRow
                label="Deploy"
                value={process.env.NEXT_PUBLIC_DEPLOY_TARGET ?? "local-dev"}
              />
            </div>
          </GlassCard>
        </aside>

        {/* ---------------------------------------------------------------- */}
        {/* Content                                                          */}
        {/* ---------------------------------------------------------------- */}
        <div className="min-w-0">
          {/* Mobile nav — the rail collapses into a scrollable strip. */}
          <nav
            aria-label="Console navigation"
            className="no-scrollbar -mx-3 mb-4 flex gap-1 overflow-x-auto px-3 pb-1 lg:hidden"
          >
            {ADMIN_VIEWS.map((item) => {
              const selected = item.id === view;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectView(item.id)}
                  aria-current={selected ? "page" : undefined}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 font-mono text-[11px] transition-colors",
                    frostControl,
                    selected
                      ? "border-signal/60 bg-signal/12 text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="lg:sticky lg:top-20 z-20 -mx-3 mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border/40 bg-card/40 px-3 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:mx-0 lg:rounded-xl lg:border lg:border-border/40 lg:bg-card/50 lg:px-4">
            <div className="min-w-0">
              <h1 className="text-sm font-semibold tracking-tight text-foreground">
                {active.label}
              </h1>
              <p className="mt-0.5 hidden max-w-xl text-xs text-muted-foreground sm:block">
                {active.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => saveChanges()}
                disabled={!isDirty || isSaving}
                title={isDirty ? "Save content changes" : "No unsaved changes"}
                className={cn(
                  isDirty ? btnPrimary : btnGhost,
                  !isDirty && "cursor-default",
                )}
              >
                {isSaving ? (
                  <RefreshCw className="size-3.5 animate-spin" />
                ) : saveStatus === "saved" ? (
                  <Check className="size-3.5" />
                ) : (
                  <Save className="size-3.5" />
                )}
                {isSaving
                  ? "Saving…"
                  : saveStatus === "saved"
                    ? "Saved"
                    : isDirty
                      ? "Save changes"
                      : "Saved"}
              </button>

              <button
                type="button"
                onClick={handleSync}
                disabled={syncing}
                title="Re-index the portfolio content"
                className={btnGhost}
              >
                <RefreshCw className={cn("size-3.5", syncing && "animate-spin")} />
                <span className="hidden sm:inline">
                  {syncing ? "Syncing…" : "Sync index"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setChatOpen(true)}
                title="Open the assistant"
                aria-label="Open the assistant"
                className={cn(btnGhost, "px-2.5")}
              >
                <MessageSquare className="size-3.5" />
              </button>

              <Link
                href="/"
                className={cn(btnGhost, "px-2.5")}
                title="View the live site"
                aria-label="View the live site"
              >
                <ExternalLink className="size-3.5" />
              </Link>

              <button
                type="button"
                onClick={lockEditor}
                title="Lock the console"
                aria-label="Lock the console"
                className={cn(btnGhost, "px-2.5")}
              >
                <Lock className="size-3.5" />
              </button>
            </div>
          </div>

          {saveStatus === "error" && saveMessage && (
            <p className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 font-mono text-[11px] text-destructive">
              <ShieldAlert className="size-3.5 shrink-0" />
              {saveMessage}
            </p>
          )}

          {syncNote && (
            <p
              className={cn(
                "mb-4 flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-[11px]",
                syncNote.tone === "error"
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : "border-signal/40 bg-signal/10 text-signal",
              )}
            >
              <RefreshCw className="size-3.5 shrink-0" />
              {syncNote.text}
            </p>
          )}

          <div>
            {view === "overview" && <OverviewPanel onNavigate={selectView} />}

            {view === "sections" && <SectionsManager />}

            {view === "identity" && <SitePanel />}

            {view === "ops" && <OpsPanel />}

            {(view === "rag-pipeline" ||
              view === "rag-eval" ||
              view === "rag-kb" ||
              view === "rag-source" ||
              view === "rag-models") && (
              <GlassCard className="min-h-[520px] overflow-hidden rounded-2xl">
                {view === "rag-pipeline" && <PipelineView />}
                {view === "rag-eval" && <EvalView />}
                {view === "rag-kb" && <KBView />}
                {view === "rag-source" && <SourceView />}
                {view === "rag-models" && <SettingsView />}
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/80">
        {label}
      </span>
      <span className="truncate font-mono text-[11px] tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
}
