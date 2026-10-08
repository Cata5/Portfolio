"use client";

import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";

import { useEditor } from "./editor-context";
import { SectionInspector } from "./section-inspector";
import { Button } from "@/components/ui/button";
import { TagInput } from "@/components/ui/tag-input";
import { getLenis } from "@/components/motion/lenis";
import { withBasePath } from "@/lib/base-path";
import type { Project, ProjectCategory, ProjectStatus } from "@/data/projects";
import type { Activity } from "@/data/activities";
import type { Certification } from "@/data/certifications";
import type { JourneyEntry } from "@/data/journey";
import type { MlRun } from "@/data/ml";

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

export function InspectorDrawer() {
  const {
    isEditing,
    selectedField,
    setSelectedField,
    content,
    updateField,
    deleteProject,
    deleteJourneyItem,
    deleteActivity,
    deleteCert,
    deleteMlRun,
  } = useEditor();

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prevent background page scrolling while inspector drawer is active
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isEditing && selectedField) {
      getLenis()?.stop();
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
        getLenis()?.start();
      };
    }
  }, [isEditing, selectedField]);

  // Resolve current value from deep path
  const getNestedValue = (path: string): unknown => {
    return path.split(".").reduce((acc: unknown, part: string) => {
      if (acc != null && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, content as unknown);
  };

  const currentValue = selectedField ? getNestedValue(selectedField.path) : undefined;

  const handleTextChange = (val: unknown) => {
    if (!selectedField) return;
    updateField(selectedField.path, val);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetPath: string, folder = "projects") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    try {
      const token = typeof window !== "undefined" ? sessionStorage.getItem("portfolio_admin_token") : "";
      const res = await fetch(withBasePath("/api/content/upload"), {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        updateField(targetPath, data.url);
      } else {
        alert(data.error || "Upload failed");
      }
    } catch {
      alert("Error connecting to upload endpoint");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isEditing && selectedField && (
        <>
          {/* Dimmed Backdrop Lock - Prevents background interaction & scrolling */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSelectedField(null)}
            className="fixed inset-0 z-[65] bg-black/60 backdrop-blur-[2px] cursor-pointer"
          />

          {/* Drawer Panel */}
          <div
            data-lenis-prevent="true"
            className="fixed inset-y-0 right-0 z-[70] flex max-w-full pl-10 pointer-events-auto"
          >
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="w-screen max-w-md border-l border-border/80 bg-neutral-950/95 shadow-2xl shadow-black/90 ring-1 ring-white/10 backdrop-blur-2xl"
            >
              <div className="flex h-full flex-col">
                {/* Drawer Header */}
                <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-signal">
                      Inspector
                    </span>
                    <h3 className="truncate text-base font-semibold text-foreground">
                      {selectedField.label}
                    </h3>
                    <p className="truncate font-mono text-[10px] text-muted-foreground/70">
                      {selectedField.path}
                    </p>
                  </div>
              <button
                type="button"
                onClick={() => setSelectedField(null)}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-neutral-900 hover:text-foreground"
                aria-label="Close inspector"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Drawer Body Content */}
            <div
              data-lenis-prevent
              onWheel={(e) => e.stopPropagation()}
              className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-6"
            >
              {/* Specialized Section Form (Edit all text in section) */}
              {selectedField.type === "section" ? (
                <SectionInspector
                  sectionId={(selectedField.meta as { sectionId?: string })?.sectionId || selectedField.path.replace(/^section\./, "")}
                  label={selectedField.label}
                />
              ) : selectedField.type === "project" ? (
                <ProjectInspector
                  path={selectedField.path}
                  project={currentValue as Project}
                  updateField={updateField}
                  onDelete={() => deleteProject((currentValue as Project)?.id)}
                  onUpload={(e) => handleFileUpload(e, `${selectedField.path}.image`, "projects")}
                  uploading={uploading}
                  fileInputRef={fileInputRef}
                />
              ) : selectedField.type === "journeyItem" ? (
                <JourneyInspector
                  path={selectedField.path}
                  item={currentValue as JourneyEntry}
                  updateField={updateField}
                  onDelete={() => {
                    const idx = parseInt(selectedField.path.split(".")[1], 10);
                    deleteJourneyItem(idx);
                  }}
                />
              ) : selectedField.type === "activity" ? (
                <ActivityInspector
                  path={selectedField.path}
                  activity={currentValue as Activity}
                  updateField={updateField}
                  onDelete={() => deleteActivity((currentValue as Activity)?.id)}
                  onUpload={(e) => handleFileUpload(e, `${selectedField.path}.image`, "activities")}
                  uploading={uploading}
                  fileInputRef={fileInputRef}
                />
              ) : selectedField.type === "cert" ? (
                <CertInspector
                  path={selectedField.path}
                  cert={currentValue as Certification}
                  updateField={updateField}
                  onDelete={() => deleteCert((currentValue as Certification)?.id)}
                  onUpload={(e) => handleFileUpload(e, `${selectedField.path}.poster`, "certificates")}
                  uploading={uploading}
                  fileInputRef={fileInputRef}
                />
              ) : selectedField.type === "mlRun" ? (
                <MlRunInspector
                  path={selectedField.path}
                  run={currentValue as MlRun}
                  updateField={updateField}
                  onDelete={() => {
                    const idx = parseInt(selectedField.path.split(".")[2], 10);
                    deleteMlRun(idx);
                  }}
                />
              ) : selectedField.type === "textarea" || selectedField.type === "rich" ? (
                <div>
                  <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                    Content
                  </label>
                  <textarea
                    rows={6}
                    value={typeof currentValue === "string" ? currentValue : ""}
                    onChange={(e) => handleTextChange(e.target.value)}
                    className="w-full rounded-xl border border-border bg-neutral-900/90 p-3.5 font-sans text-sm text-foreground placeholder:text-muted-foreground focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
                  />
                </div>
              ) : selectedField.type === "image" ? (
                <div className="space-y-4">
                  <label className="block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                    Image Source
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={typeof currentValue === "string" ? currentValue : ""}
                      onChange={(e) => handleTextChange(e.target.value)}
                      placeholder="/projects/example.webp"
                      className="flex-1 rounded-xl border border-border bg-neutral-900/90 px-3.5 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, selectedField.path, "projects")}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-1.5"
                    >
                      <Upload className="size-3.5" />
                      Upload
                    </Button>
                  </div>
                  {typeof currentValue === "string" && currentValue && (
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
                      <Image
                        src={currentValue}
                        alt="Preview"
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                </div>
              ) : selectedField.type === "array" ? (
                <ArrayInspector
                  value={Array.isArray(currentValue) ? (currentValue as string[]) : []}
                  onChange={handleTextChange}
                />
              ) : (
                <div>
                  <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                    Value
                  </label>
                  <input
                    type="text"
                    value={typeof currentValue === "string" ? currentValue : String(currentValue ?? "")}
                    onChange={(e) => handleTextChange(e.target.value)}
                    className="w-full rounded-xl border border-border bg-neutral-900/90 px-3.5 py-2.5 font-sans text-sm text-foreground focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border/60 bg-neutral-950 px-6 py-3.5 text-right">
              <Button
                type="button"
                onClick={() => setSelectedField(null)}
                className="bg-signal text-white hover:bg-signal/90"
              >
                Done
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )}
</AnimatePresence>
  );
}

// Sub-inspector for Projects
function ProjectInspector({
  path,
  project,
  updateField,
  onDelete,
  onUpload,
  uploading,
  fileInputRef,
}: {
  path: string;
  project: Project;
  updateField: (p: string, v: unknown) => void;
  onDelete: () => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  if (!project) return null;

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Project ID
        </label>
        <input
          type="text"
          value={project.id}
          onChange={(e) => updateField(`${path}.id`, e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
        />
      </div>

      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Title
        </label>
        <input
          type="text"
          value={project.title}
          onChange={(e) => updateField(`${path}.title`, e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 text-sm text-foreground focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            Category
          </label>
          <select
            value={project.category}
            onChange={(e) => updateField(`${path}.category`, e.target.value)}
            className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
          >
            {PROJECT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            Status
          </label>
          <select
            value={project.status}
            onChange={(e) => updateField(`${path}.status`, e.target.value)}
            className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
          >
            {PROJECT_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            Year
          </label>
          <input
            type="number"
            value={project.year ?? ""}
            onChange={(e) =>
              updateField(`${path}.year`, e.target.value ? parseInt(e.target.value, 10) : null)
            }
            className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
          />
        </div>
        <div className="flex items-center gap-3 pt-6">
          <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={project.featured}
              onChange={(e) => updateField(`${path}.featured`, e.target.checked)}
              className="size-4 rounded border-border text-signal focus:ring-signal"
            />
            Featured Project
          </label>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Summary (One-liner)
        </label>
        <textarea
          rows={3}
          value={project.summary}
          onChange={(e) => updateField(`${path}.summary`, e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 p-3 text-xs text-foreground focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
        />
      </div>

      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Full Description
        </label>
        <textarea
          rows={4}
          value={project.description ?? ""}
          onChange={(e) => updateField(`${path}.description`, e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 p-3 text-xs text-foreground focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
        />
      </div>

      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Technologies (comma-separated)
        </label>
        <TagInput
          value={project.technologies}
          onChange={(tags) => updateField(`${path}.technologies`, tags)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
        />
      </div>

      <div className="space-y-2">
        <label className="block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Image / Poster
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={project.image ?? ""}
            onChange={(e) => updateField(`${path}.image`, e.target.value || null)}
            placeholder="/projects/example.webp"
            className="flex-1 rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onUpload}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="gap-1.5"
          >
            <Upload className="size-3.5" />
            Upload
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            GitHub URL
          </label>
          <input
            type="text"
            value={project.github ?? ""}
            onChange={(e) => updateField(`${path}.github`, e.target.value || undefined)}
            className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            Demo URL
          </label>
          <input
            type="text"
            value={project.demo ?? ""}
            onChange={(e) => updateField(`${path}.demo`, e.target.value || undefined)}
            className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-border/40">
        <Button
          type="button"
          variant="destructive"
          onClick={() => {
            if (confirm(`Delete project "${project.title}"?`)) {
              onDelete();
            }
          }}
          className="w-full gap-2"
        >
          <Trash2 className="size-4" />
          Delete Project
        </Button>
      </div>
    </div>
  );
}

// Sub-inspector for Journey
function JourneyInspector({
  path,
  item,
  updateField,
  onDelete,
}: {
  path: string;
  item: JourneyEntry;
  updateField: (p: string, v: unknown) => void;
  onDelete: () => void;
}) {
  if (!item) return null;

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Date
        </label>
        <input
          type="text"
          value={item.date}
          onChange={(e) => updateField(`${path}.date`, e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Category
        </label>
        <select
          value={item.category}
          onChange={(e) => updateField(`${path}.category`, e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none"
        >
          <option value="main">main (Core & AI Systems)</option>
          <option value="competitions">competitions (Hackathons & Contests)</option>
          <option value="community">community (Robotics Mentorship & Community)</option>
          <option value="education">education (Certifications & Education)</option>
          <option value="side">side (Open Source & Developer Tools)</option>
        </select>
      </div>
      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Title
        </label>
        <input
          type="text"
          value={item.title}
          onChange={(e) => updateField(`${path}.title`, e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 text-sm text-foreground focus:border-signal focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Location (optional)
        </label>
        <input
          type="text"
          placeholder="e.g. Romania, Timisoara"
          value={item.location ?? ""}
          onChange={(e) => updateField(`${path}.location`, e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Action Link (optional)
        </label>
        <input
          type="text"
          placeholder="https://..."
          value={item.link ?? ""}
          onChange={(e) => updateField(`${path}.link`, e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Image Path (optional)
        </label>
        <input
          type="text"
          placeholder="/activities/photo.webp"
          value={item.image ?? ""}
          onChange={(e) => updateField(`${path}.image`, e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Note
        </label>
        <textarea
          rows={3}
          value={item.note}
          onChange={(e) => updateField(`${path}.note`, e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 p-3 text-xs text-foreground focus:border-signal focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Tags (comma-separated)
        </label>
        <TagInput
          value={item.tags}
          onChange={(tags) => updateField(`${path}.tags`, tags)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none"
        />
      </div>
      <div className="pt-4 border-t border-border/40">
        <Button
          type="button"
          variant="destructive"
          onClick={() => {
            if (confirm("Delete milestone?")) onDelete();
          }}
          className="w-full gap-2"
        >
          <Trash2 className="size-4" />
          Delete Milestone
        </Button>
      </div>
    </div>
  );
}

// Sub-inspector for Activities
function ActivityInspector({
  path,
  activity,
  updateField,
  onDelete,
  onUpload,
  uploading,
  fileInputRef,
}: {
  path: string;
  activity: Activity;
  updateField: (p: string, v: unknown) => void;
  onDelete: () => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  if (!activity) return null;

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Title
        </label>
        <input
          type="text"
          value={activity.title}
          onChange={(e) => updateField(`${path}.title`, e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 text-sm text-foreground focus:border-signal focus:outline-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            Type
          </label>
          <input
            type="text"
            value={activity.type}
            onChange={(e) => updateField(`${path}.type`, e.target.value)}
            className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            Year
          </label>
          <input
            type="text"
            value={activity.year}
            onChange={(e) => updateField(`${path}.year`, e.target.value)}
            className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Location
        </label>
        <input
          type="text"
          value={activity.location}
          onChange={(e) => updateField(`${path}.location`, e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Description
        </label>
        <textarea
          rows={3}
          value={activity.description}
          onChange={(e) => updateField(`${path}.description`, e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 p-3 text-xs text-foreground focus:border-signal focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Link URL
        </label>
        <input
          type="text"
          value={activity.link ?? ""}
          onChange={(e) => updateField(`${path}.link`, e.target.value || undefined)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none"
        />
      </div>
      <div className="space-y-2">
        <label className="block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Image
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={activity.image ?? ""}
            onChange={(e) => updateField(`${path}.image`, e.target.value || undefined)}
            className="flex-1 rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onUpload}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="gap-1.5"
          >
            <Upload className="size-3.5" />
            Upload
          </Button>
        </div>
      </div>
      <div className="pt-4 border-t border-border/40">
        <Button
          type="button"
          variant="destructive"
          onClick={() => {
            if (confirm("Delete activity?")) onDelete();
          }}
          className="w-full gap-2"
        >
          <Trash2 className="size-4" />
          Delete Activity
        </Button>
      </div>
    </div>
  );
}

// Sub-inspector for Certifications
function CertInspector({
  path,
  cert,
  updateField,
  onDelete,
  onUpload,
  uploading,
  fileInputRef,
}: {
  path: string;
  cert: Certification;
  updateField: (p: string, v: unknown) => void;
  onDelete: () => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  if (!cert) return null;

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Title
        </label>
        <input
          type="text"
          value={cert.title}
          onChange={(e) => updateField(`${path}.title`, e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 text-sm text-foreground focus:border-signal focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Subtitle
        </label>
        <input
          type="text"
          value={cert.subtitle}
          onChange={(e) => updateField(`${path}.subtitle`, e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 text-xs text-foreground focus:border-signal focus:outline-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            Issuer
          </label>
          <input
            type="text"
            value={cert.issuer}
            onChange={(e) => updateField(`${path}.issuer`, e.target.value)}
            className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            Year
          </label>
          <input
            type="text"
            value={cert.year}
            onChange={(e) => updateField(`${path}.year`, e.target.value)}
            className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Tags (comma-separated)
        </label>
        <TagInput
          value={cert.tags}
          onChange={(tags) => updateField(`${path}.tags`, tags)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none"
        />
      </div>
      <div className="space-y-2">
        <label className="block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Poster Thumbnail (Optional)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. /certificates/name.webp (optional)"
            value={cert.poster ?? ""}
            onChange={(e) => updateField(`${path}.poster`, e.target.value)}
            className="flex-1 rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onUpload}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="gap-1.5"
          >
            <Upload className="size-3.5" />
            Upload
          </Button>
        </div>
      </div>
      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          PDF File Path (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g. /certificates/name.pdf (optional)"
          value={cert.file ?? ""}
          onChange={(e) => updateField(`${path}.file`, e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none"
        />
      </div>
      <div className="pt-4 border-t border-border/40">
        <Button
          type="button"
          variant="destructive"
          onClick={() => {
            if (confirm("Delete certification?")) onDelete();
          }}
          className="w-full gap-2"
        >
          <Trash2 className="size-4" />
          Delete Certification
        </Button>
      </div>
    </div>
  );
}

// Sub-inspector for ML Runs
function MlRunInspector({
  path,
  run,
  updateField,
  onDelete,
}: {
  path: string;
  run: MlRun;
  updateField: (p: string, v: unknown) => void;
  onDelete: () => void;
}) {
  if (!run) return null;

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Model
        </label>
        <input
          type="text"
          value={run.model}
          onChange={(e) => updateField(`${path}.model`, e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 text-xs text-foreground focus:border-signal focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Dataset
        </label>
        <input
          type="text"
          value={run.dataset}
          onChange={(e) => updateField(`${path}.dataset`, e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 text-xs text-foreground focus:border-signal focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Dataset URL (optional)
        </label>
        <input
          type="text"
          value={run.datasetUrl ?? ""}
          onChange={(e) => updateField(`${path}.datasetUrl`, e.target.value || undefined)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            Framework
          </label>
          <input
            type="text"
            value={run.framework}
            onChange={(e) => updateField(`${path}.framework`, e.target.value)}
            className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            Hardware
          </label>
          <input
            type="text"
            value={run.hardware}
            onChange={(e) => updateField(`${path}.hardware`, e.target.value)}
            className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Training Details
        </label>
        <input
          type="text"
          value={run.training}
          onChange={(e) => updateField(`${path}.training`, e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 text-xs text-foreground focus:border-signal focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
          Notes
        </label>
        <textarea
          rows={3}
          value={run.notes}
          onChange={(e) => updateField(`${path}.notes`, e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 p-3 text-xs text-foreground focus:border-signal focus:outline-none"
        />
      </div>
      <div className="pt-4 border-t border-border/40">
        <Button
          type="button"
          variant="destructive"
          onClick={() => {
            if (confirm("Delete ML run?")) onDelete();
          }}
          className="w-full gap-2"
        >
          <Trash2 className="size-4" />
          Delete Run
        </Button>
      </div>
    </div>
  );
}

// Array tag inspector
function ArrayInspector({
  value,
  onChange,
}: {
  value: string[];
  onChange: (val: string[]) => void;
}) {
  const [newItem, setNewItem] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    onChange([...value, newItem.trim()]);
    setNewItem("");
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Add new item…"
          className="flex-1 rounded-xl border border-border bg-neutral-900/90 px-3.5 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
        />
        <Button type="submit" size="sm" className="bg-signal text-white hover:bg-signal/90">
          <Plus className="size-3.5" />
        </Button>
      </form>

      <ul className="space-y-2">
        {value.map((item, idx) => (
          <li
            key={idx}
            className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-neutral-900/60 px-3 py-1.5 font-mono text-xs text-foreground"
          >
            <span className="truncate">{item}</span>
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="size-3" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
