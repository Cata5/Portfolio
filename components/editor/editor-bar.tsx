"use client";

import { useEffect, useState } from "react";
import {
  Award,
  Check,
  ChevronUp,
  Cpu,
  Edit2,
  Eye,
  FolderPlus,
  Lock,
  Milestone,
  Plus,
  Save,
  Trophy,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { useEditor } from "./editor-context";
import { cn } from "@/lib/utils";

export function EditorBar() {
  const {
    isAuthenticated,
    isEditing,
    toggleEdit,
    lockEditor,
    isDirty,
    isSaving,
    saveStatus,
    saveChanges,
    addNewProject,
    addNewJourneyItem,
    addNewActivity,
    addNewCert,
    addNewMlRun,
  } = useEditor();

  const [showAddMenu, setShowAddMenu] = useState(false);

  // Global Ctrl+S / ⌘S save shortcut when editing
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "s" && (e.metaKey || e.ctrlKey)) {
        if (isAuthenticated && isDirty) {
          e.preventDefault();
          saveChanges();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isAuthenticated, isDirty, saveChanges]);

  // If not authenticated, render nothing on screen (access via Ctrl+E or Command Palette Ctrl+K)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <aside aria-label="Visual Editor Controls" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center gap-2 rounded-full border border-border/80 bg-neutral-950/90 px-3.5 py-2 shadow-2xl shadow-black/80 ring-1 ring-white/10 backdrop-blur-xl"
      >
        {/* Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleEdit}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] font-medium transition-colors",
            isEditing
              ? "bg-signal text-white shadow-sm"
              : "bg-neutral-900 text-muted-foreground hover:text-foreground",
          )}
        >
          {isEditing ? (
            <>
              <Edit2 className="size-3" />
              <span>Editing</span>
            </>
          ) : (
            <>
              <Eye className="size-3" />
              <span>Preview</span>
            </>
          )}
        </button>

        {/* Quick Add Menu */}
        {isEditing && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAddMenu((s) => !s)}
              className="flex items-center gap-1 rounded-full border border-border/60 bg-neutral-900/80 px-2.5 py-1 font-mono text-[11px] text-foreground transition-colors hover:border-signal/40 hover:bg-neutral-800"
            >
              <Plus className="size-3 text-signal" />
              <span>Add</span>
              <ChevronUp
                className={cn(
                  "size-3 text-muted-foreground transition-transform duration-200",
                  showAddMenu ? "rotate-180" : "",
                )}
              />
            </button>

            <AnimatePresence>
              {showAddMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-0 mb-2 w-48 overflow-hidden rounded-xl border border-border bg-neutral-950/95 p-1.5 shadow-xl ring-1 ring-white/10 backdrop-blur-xl"
                >
                  <button
                    type="button"
                    onClick={() => {
                      addNewProject();
                      setShowAddMenu(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left font-mono text-[12px] text-foreground/90 transition-colors hover:bg-neutral-900 hover:text-signal"
                  >
                    <FolderPlus className="size-3.5 text-signal" />
                    <span>Project</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      addNewJourneyItem();
                      setShowAddMenu(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left font-mono text-[12px] text-foreground/90 transition-colors hover:bg-neutral-900 hover:text-saffron"
                  >
                    <Milestone className="size-3.5 text-saffron" />
                    <span>Timeline Milestone</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      addNewActivity();
                      setShowAddMenu(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left font-mono text-[12px] text-foreground/90 transition-colors hover:bg-neutral-900 hover:text-foreground"
                  >
                    <Trophy className="size-3.5 text-foreground/70" />
                    <span>Activity / Event</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      addNewCert();
                      setShowAddMenu(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left font-mono text-[12px] text-foreground/90 transition-colors hover:bg-neutral-900 hover:text-signal"
                  >
                    <Award className="size-3.5 text-signal/80" />
                    <span>Certification</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      addNewMlRun();
                      setShowAddMenu(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left font-mono text-[12px] text-foreground/90 transition-colors hover:bg-neutral-900 hover:text-saffron"
                  >
                    <Cpu className="size-3.5 text-saffron" />
                    <span>ML Log Run</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="h-4 w-px bg-border/80" />

        {/* Save button & Status */}
        <button
          type="button"
          onClick={() => saveChanges()}
          disabled={!isDirty || isSaving}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] font-medium transition-all",
            isDirty
              ? "bg-saffron text-black shadow-md shadow-saffron/20 hover:brightness-110"
              : "bg-neutral-900 text-muted-foreground opacity-60",
          )}
        >
          {isSaving ? (
            <>
              <span className="size-3 animate-spin rounded-full border-2 border-black border-t-transparent" />
              <span>Saving…</span>
            </>
          ) : saveStatus === "saved" ? (
            <>
              <Check className="size-3 text-green-400" />
              <span>Saved</span>
            </>
          ) : (
            <>
              <Save className="size-3" />
              <span>{isDirty ? "Save" : "Saved"}</span>
            </>
          )}
        </button>

        {/* Lock button */}
        <button
          type="button"
          onClick={lockEditor}
          title="Lock / Exit Editor"
          className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-neutral-900 hover:text-foreground"
        >
          <Lock className="size-3.5" />
        </button>
      </motion.div>
    </aside>
  );
}
