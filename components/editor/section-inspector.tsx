"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react";

import { useEditor } from "./editor-context";
import { Button } from "@/components/ui/button";
import { TagInput } from "@/components/ui/tag-input";
import { cn } from "@/lib/utils";
import type { Project, ProjectCategory, ProjectStatus } from "@/data/projects";
import type { Activity } from "@/data/activities";
import type { Certification } from "@/data/certifications";
import type { JourneyEntry } from "@/data/journey";
import type { MlRun } from "@/data/ml";

interface SectionInspectorProps {
  sectionId: string;
  label: string;
}

export function SectionInspector({ sectionId, label }: SectionInspectorProps) {
  const {
    content,
    updateField,
    updateStore,
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

  const id = sectionId.toLowerCase();

  return (
    <div className="dark text-neutral-100 space-y-6 animate-in fade-in duration-150">
      <div className="rounded-xl border border-signal/30 bg-signal/10 p-3.5 flex items-center justify-between">
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-signal">
          Whole Section Selected
        </span>
        <span className="rounded bg-signal/20 px-2 py-0.5 font-mono text-[10px] text-signal font-bold uppercase">
          {id}
        </span>
      </div>

      {/* RENDER BY SECTION ID */}
      {id === "top" || id === "hero" ? (
        <HeroSectionForm content={content} updateField={updateField} />
      ) : id === "about" ? (
        <AboutSectionForm content={content} updateField={updateField} />
      ) : id === "work" ? (
        <WorkSectionForm content={content} updateField={updateField} />
      ) : id === "projects" ? (
        <ProjectsSectionForm
          content={content}
          updateField={updateField}
          addNewProject={addNewProject}
          deleteProject={deleteProject}
        />
      ) : id === "stack" ? (
        <StackSectionForm content={content} updateField={updateField} />
      ) : id === "certifications" ? (
        <CertificationsSectionForm
          content={content}
          updateField={updateField}
          addNewCert={addNewCert}
          deleteCert={deleteCert}
        />
      ) : id === "ml" ? (
        <MLSectionForm
          content={content}
          updateField={updateField}
          addNewMlRun={addNewMlRun}
          deleteMlRun={deleteMlRun}
        />
      ) : id === "journey" ? (
        <JourneySectionForm
          content={content}
          updateField={updateField}
          addNewJourneyItem={addNewJourneyItem}
          deleteJourneyItem={deleteJourneyItem}
        />
      ) : id === "activities" ? (
        <ActivitiesSectionForm
          content={content}
          updateField={updateField}
          addNewActivity={addNewActivity}
          deleteActivity={deleteActivity}
        />
      ) : id === "contact" ? (
        <ContactSectionForm content={content} updateField={updateField} />
      ) : (
        <GenericSectionForm content={content} updateField={updateField} sectionId={id} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1. HERO SECTION FORM
// ---------------------------------------------------------------------------
function HeroSectionForm({
  content,
  updateField,
}: {
  content: ReturnType<typeof useEditor>["content"];
  updateField: (path: string, val: unknown) => void;
}) {
  return (
    <div className="space-y-4">
      <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-saffron">
        Hero Typography &amp; Identity
      </h4>

      <div className="space-y-1.5">
        <label className="font-mono text-[11px] text-muted-foreground">Author Name</label>
        <input
          type="text"
          value={content.site.name || ""}
          onChange={(e) => updateField("site.name", e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-sans text-xs text-foreground focus:border-signal focus:outline-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="font-mono text-[11px] text-muted-foreground">Role / Headline Title</label>
        <input
          type="text"
          value={content.site.role || ""}
          onChange={(e) => updateField("site.role", e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-sans text-xs text-foreground focus:border-signal focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-1.5">
          <label className="font-mono text-[11px] text-muted-foreground">Hero Word 1</label>
          <input
            type="text"
            value={content.copy?.hero?.word1 || ""}
            onChange={(e) => updateField("copy.hero.word1", e.target.value)}
            className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none"
          />
        </div>
        <div className="space-y-1.5">
          <label className="font-mono text-[11px] text-muted-foreground">Hero Word 2</label>
          <input
            type="text"
            value={content.copy?.hero?.word2 || ""}
            onChange={(e) => updateField("copy.hero.word2", e.target.value)}
            className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="font-mono text-[11px] text-muted-foreground">Tagline / Mission</label>
        <textarea
          rows={3}
          value={content.site.tagline || ""}
          onChange={(e) => updateField("site.tagline", e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 p-3 font-sans text-xs text-foreground focus:border-signal focus:outline-none"
        />
      </div>

      <h4 className="pt-3 border-t border-border/40 font-mono text-xs font-bold uppercase tracking-wider text-saffron">
        Currently Building Widget
      </h4>

      <div className="space-y-1.5">
        <label className="font-mono text-[11px] text-muted-foreground">Widget Label</label>
        <input
          type="text"
          value={content.site.currently?.label || ""}
          onChange={(e) => updateField("site.currently.label", e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="font-mono text-[11px] text-muted-foreground">Project Name</label>
        <input
          type="text"
          value={content.site.currently?.project || ""}
          onChange={(e) => updateField("site.currently.project", e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="font-mono text-[11px] text-muted-foreground">Stack</label>
        <input
          type="text"
          value={content.site.currently?.stack || ""}
          onChange={(e) => updateField("site.currently.stack", e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="font-mono text-[11px] text-muted-foreground">Status</label>
        <input
          type="text"
          value={content.site.currently?.status || ""}
          onChange={(e) => updateField("site.currently.status", e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. ABOUT SECTION FORM
// ---------------------------------------------------------------------------
function AboutSectionForm({
  content,
  updateField,
}: {
  content: ReturnType<typeof useEditor>["content"];
  updateField: (path: string, val: unknown) => void;
}) {
  const focusAreas = content.skills.focusAreas || [];

  return (
    <div className="space-y-4">
      <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-saffron">
        Bio &amp; Narrative
      </h4>

      <div className="space-y-1.5">
        <label className="font-mono text-[11px] text-muted-foreground">Heading</label>
        <textarea
          rows={2}
          value={content.copy?.about?.heading || ""}
          onChange={(e) => updateField("copy.about.heading", e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 p-3 font-sans text-xs text-foreground focus:border-signal focus:outline-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="font-mono text-[11px] text-muted-foreground">Paragraph 1</label>
        <textarea
          rows={4}
          value={content.copy?.about?.paragraph1 || ""}
          onChange={(e) => updateField("copy.about.paragraph1", e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 p-3 font-sans text-xs text-foreground focus:border-signal focus:outline-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="font-mono text-[11px] text-muted-foreground">Paragraph 2</label>
        <textarea
          rows={3}
          value={content.copy?.about?.paragraph2 || ""}
          onChange={(e) => updateField("copy.about.paragraph2", e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 p-3 font-sans text-xs text-foreground focus:border-signal focus:outline-none"
        />
      </div>

      <div className="pt-3 border-t border-border/40 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-saffron">
            Focus Areas ({focusAreas.length})
          </h4>
          <button
            type="button"
            onClick={() => {
              const updated = [...focusAreas, { label: "New Area", note: "technology note" }];
              updateField("skills.focusAreas", updated);
            }}
            className="inline-flex items-center gap-1 font-mono text-[11px] text-signal hover:underline cursor-pointer"
          >
            <Plus className="size-3" /> Add Focus Area
          </button>
        </div>

        {focusAreas.map((area, idx) => (
          <div key={idx} className="rounded-xl border border-border/60 bg-neutral-950/70 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10.5px] text-signal font-semibold">Area #{idx + 1}</span>
              <button
                type="button"
                onClick={() => {
                  const updated = focusAreas.filter((_, i) => i !== idx);
                  updateField("skills.focusAreas", updated);
                }}
                className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Label"
                value={area.label || ""}
                onChange={(e) => updateField(`skills.focusAreas.${idx}.label`, e.target.value)}
                className="rounded-lg border border-border/60 bg-neutral-900/90 px-2.5 py-1.5 font-sans text-xs text-foreground"
              />
              <input
                type="text"
                placeholder="Note"
                value={area.note || ""}
                onChange={(e) => updateField(`skills.focusAreas.${idx}.note`, e.target.value)}
                className="rounded-lg border border-border/60 bg-neutral-900/90 px-2.5 py-1.5 font-mono text-xs text-muted-foreground"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. FEATURED WORK (VORTEX & LLM FROM SCRATCH) SECTION FORM
// ---------------------------------------------------------------------------
function WorkSectionForm({
  content,
  updateField,
}: {
  content: ReturnType<typeof useEditor>["content"];
  updateField: (path: string, val: unknown) => void;
}) {
  const [activeTab, setActiveTab] = useState<"vortex" | "llm">("vortex");

  const vortexIndex = content.projects.findIndex((p) => p.id === "vortex");
  const vortex = vortexIndex !== -1 ? content.projects[vortexIndex] : content.projects[0];
  const vortexPath = vortexIndex !== -1 ? `projects.${vortexIndex}` : "projects.0";

  const llmIndex = content.projects.findIndex((p) => p.id === "llm-from-scratch");
  const llm = llmIndex !== -1 ? content.projects[llmIndex] : content.projects.find((p) => p.id === "llm-from-scratch");
  const llmPath = llmIndex !== -1 ? `projects.${llmIndex}` : "projects.1";

  const roadmap = content.roadmap;
  const stages = roadmap?.stages || [];

  return (
    <div className="space-y-5">
      {/* Flagship Switcher Tabs */}
      <div className="flex rounded-xl border border-border/60 bg-neutral-900/60 p-1">
        <button
          type="button"
          onClick={() => setActiveTab("vortex")}
          className={cn(
            "flex-1 rounded-lg py-1.5 font-mono text-xs font-semibold transition-all cursor-pointer",
            activeTab === "vortex"
              ? "bg-signal text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          01. {vortex?.tabLabel || vortex?.title || "Vortex"}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("llm")}
          className={cn(
            "flex-1 rounded-lg py-1.5 font-mono text-xs font-semibold transition-all cursor-pointer",
            activeTab === "llm"
              ? "bg-signal text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          02. {llm?.tabLabel || llm?.title || "LLM from Scratch"}
        </button>
      </div>

      {activeTab === "vortex" ? (
        vortex ? (
          <div className="space-y-4 animate-in fade-in duration-150">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-saffron">
              Flagship 01: Vortex ({vortex.title})
            </h4>

            <div className="space-y-1.5">
              <label className="font-mono text-[11px] text-muted-foreground">Tab Switcher Label</label>
              <input
                type="text"
                placeholder="e.g. Vortex"
                value={vortex.tabLabel ?? ""}
                onChange={(e) => updateField(`${vortexPath}.tabLabel`, e.target.value)}
                className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-sans text-xs text-foreground focus:border-signal focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[11px] text-muted-foreground">Title</label>
              <input
                type="text"
                value={vortex.title || ""}
                onChange={(e) => updateField(`${vortexPath}.title`, e.target.value)}
                className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-sans text-xs text-foreground focus:border-signal focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[11px] text-muted-foreground">Summary</label>
              <textarea
                rows={3}
                value={vortex.summary || ""}
                onChange={(e) => updateField(`${vortexPath}.summary`, e.target.value)}
                className="w-full rounded-xl border border-border bg-neutral-900/90 p-3 font-sans text-xs text-foreground focus:border-signal focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[11px] text-muted-foreground">Detailed Description</label>
              <textarea
                rows={5}
                value={vortex.description || ""}
                onChange={(e) => updateField(`${vortexPath}.description`, e.target.value)}
                className="w-full rounded-xl border border-border bg-neutral-900/90 p-3 font-sans text-xs text-foreground focus:border-signal focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[11px] text-muted-foreground">Architecture Narrative</label>
              <textarea
                rows={4}
                value={vortex.architecture || ""}
                onChange={(e) => updateField(`${vortexPath}.architecture`, e.target.value)}
                className="w-full rounded-xl border border-border bg-neutral-900/90 p-3 font-sans text-xs text-foreground focus:border-signal focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[11px] text-muted-foreground">Technologies (comma separated)</label>
              <TagInput
                value={vortex.technologies}
                onChange={(tags) => updateField(`${vortexPath}.technologies`, tags)}
                className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-border/40">
              <label className="font-mono text-[11px] font-semibold text-muted-foreground">
                Runtime Tab Targets (Android, TV, Desktop)
              </label>
              {vortex.runtimes?.map((r, i) => (
                <div key={r.id || i} className="rounded-xl border border-border/60 bg-neutral-900/60 p-2.5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-signal font-semibold uppercase shrink-0">{r.device}</span>
                    <input
                      type="text"
                      placeholder="Tab Name (e.g. Android TV)"
                      value={r.label || ""}
                      onChange={(e) => updateField(`${vortexPath}.runtimes.${i}.label`, e.target.value)}
                      className="flex-1 rounded-lg border border-border bg-neutral-900 px-2.5 py-1.5 font-sans text-xs text-foreground focus:border-signal focus:outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Short description"
                    value={r.description || ""}
                    onChange={(e) => updateField(`${vortexPath}.runtimes.${i}.description`, e.target.value)}
                    className="w-full rounded-lg border border-border bg-neutral-900 px-2.5 py-1 font-sans text-[11px] text-muted-foreground focus:border-signal focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null
      ) : (
        <div className="space-y-4 animate-in fade-in duration-150">
          <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-saffron">
            Flagship 02: {llm?.tabLabel || llm?.title || "LLM from Scratch"}
          </h4>

          {llm && (
            <>
              <div className="space-y-1.5">
                <label className="font-mono text-[11px] text-muted-foreground">Tab Switcher Label</label>
                <input
                  type="text"
                  placeholder="e.g. CataAI or LLM from Scratch"
                  value={llm.tabLabel ?? ""}
                  onChange={(e) => updateField(`${llmPath}.tabLabel`, e.target.value)}
                  className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-sans text-xs text-foreground focus:border-signal focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-[11px] text-muted-foreground">Project Title</label>
                <input
                  type="text"
                  value={llm.title || ""}
                  onChange={(e) => updateField(`${llmPath}.title`, e.target.value)}
                  className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-sans text-xs text-foreground focus:border-signal focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <label className="font-mono text-[11px] text-muted-foreground">Status Badge</label>
                  <input
                    type="text"
                    value={llm.status || ""}
                    onChange={(e) => updateField(`${llmPath}.status`, e.target.value)}
                    className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-mono text-[11px] text-muted-foreground">Year</label>
                  <input
                    type="number"
                    value={llm.year ?? 2026}
                    onChange={(e) => updateField(`${llmPath}.year`, parseInt(e.target.value, 10))}
                    className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-[11px] text-muted-foreground">Summary (One-liner)</label>
                <textarea
                  rows={2}
                  value={llm.summary || ""}
                  onChange={(e) => updateField(`${llmPath}.summary`, e.target.value)}
                  className="w-full rounded-xl border border-border bg-neutral-900/90 p-3 font-sans text-xs text-foreground focus:border-signal focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-[11px] text-muted-foreground">Detailed Description</label>
                <textarea
                  rows={4}
                  value={llm.description || ""}
                  onChange={(e) => updateField(`${llmPath}.description`, e.target.value)}
                  className="w-full rounded-xl border border-border bg-neutral-900/90 p-3 font-sans text-xs text-foreground focus:border-signal focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-[11px] text-muted-foreground">Technologies</label>
                <TagInput
                  value={llm.technologies}
                  onChange={(tags) => updateField(`${llmPath}.technologies`, tags)}
                  className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none"
                />
              </div>
            </>
          )}

          {roadmap && (
            <div className="pt-3 border-t border-border/40 space-y-3">
              <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-saffron">
                Roadmap Board Copy
              </h4>

              <div className="space-y-1.5">
                <label className="font-mono text-[11px] text-muted-foreground">Roadmap Eyebrow</label>
                <input
                  type="text"
                  value={roadmap.eyebrow || ""}
                  onChange={(e) => updateField("roadmap.eyebrow", e.target.value)}
                  className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-[11px] text-muted-foreground">Roadmap Intro</label>
                <textarea
                  rows={3}
                  value={roadmap.intro || ""}
                  onChange={(e) => updateField("roadmap.intro", e.target.value)}
                  className="w-full rounded-xl border border-border bg-neutral-900/90 p-3 font-sans text-xs text-foreground focus:border-signal focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-[11px] text-muted-foreground">Status Chip Label</label>
                <input
                  type="text"
                  value={roadmap.statusLabel || ""}
                  onChange={(e) => updateField("roadmap.statusLabel", e.target.value)}
                  className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none"
                />
              </div>

              {/* Stages List */}
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-foreground">
                    Roadmap Stages ({stages.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextN = stages.length + 1;
                      const newStage = {
                        n: nextN,
                        id: `stage-${nextN}`,
                        title: `Stage ${nextN}`,
                        short: `stage ${nextN}`,
                        file: "",
                        status: "planned" as const,
                        summary: "Stage description",
                        items: [],
                      };
                      updateField("roadmap.stages", [...stages, newStage]);
                    }}
                    className="inline-flex items-center gap-1 font-mono text-[11px] text-signal hover:underline cursor-pointer"
                  >
                    <Plus className="size-3" /> Add Stage
                  </button>
                </div>

                {stages.map((stage, idx) => (
                  <div key={idx} className="rounded-xl border border-border/60 bg-neutral-950/70 p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-signal">
                        Stage {stage.n}: {stage.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = stages.filter((_, i) => i !== idx);
                          updateField("roadmap.stages", updated);
                        }}
                        className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2 space-y-1">
                        <label className="font-mono text-[10px] text-muted-foreground">Title</label>
                        <input
                          type="text"
                          value={stage.title || ""}
                          onChange={(e) => updateField(`roadmap.stages.${idx}.title`, e.target.value)}
                          className="w-full rounded-lg border border-border/60 bg-neutral-900/90 px-2.5 py-1.5 font-sans text-xs text-foreground"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-mono text-[10px] text-muted-foreground">Status</label>
                        <select
                          value={stage.status}
                          onChange={(e) => updateField(`roadmap.stages.${idx}.status`, e.target.value)}
                          className="w-full rounded-lg border border-border/60 bg-neutral-900/90 px-2.5 py-1.5 font-mono text-xs text-foreground"
                        >
                          <option value="done">done</option>
                          <option value="current">current</option>
                          <option value="planned">planned</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[10px] text-muted-foreground">Summary</label>
                      <textarea
                        rows={2}
                        value={stage.summary || ""}
                        onChange={(e) => updateField(`roadmap.stages.${idx}.summary`, e.target.value)}
                        className="w-full rounded-lg border border-border/60 bg-neutral-900/90 p-2 font-sans text-xs text-foreground"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. PROJECTS DIRECTORY FORM
// ---------------------------------------------------------------------------
function ProjectsSectionForm({
  content,
  updateField,
  addNewProject,
  deleteProject,
}: {
  content: ReturnType<typeof useEditor>["content"];
  updateField: (path: string, val: unknown) => void;
  addNewProject: () => string;
  deleteProject: (id: string) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-saffron">
          All Projects ({content.projects?.length || 0})
        </h4>
        <button
          type="button"
          onClick={() => {
            const newId = addNewProject();
            setExpandedId(newId);
          }}
          className="inline-flex items-center gap-1 font-mono text-[11px] text-signal hover:underline cursor-pointer"
        >
          <Plus className="size-3" /> Add Project
        </button>
      </div>

      <div
        data-lenis-prevent
        onWheel={(e) => e.stopPropagation()}
        className="space-y-2.5 max-h-[500px] overflow-y-auto overscroll-contain pr-1 scrollbar-thin scrollbar-thumb-border"
      >
        {content.projects?.map((proj, idx) => {
          const isExpanded = expandedId === proj.id;
          return (
            <div key={proj.id} className="rounded-xl border border-border/60 bg-neutral-950/70 p-3 space-y-2">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : proj.id)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isExpanded ? <ChevronDown className="size-3.5 text-signal" /> : <ChevronRight className="size-3.5 text-muted-foreground" />}
                  <span className="font-mono text-xs font-semibold text-foreground truncate">
                    {proj.title || "Untitled Project"}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">({proj.category})</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteProject(proj.id);
                  }}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>

              {isExpanded && (
                <div className="pt-2 border-t border-border/40 space-y-2.5 text-xs">
                  <div className="space-y-1">
                    <label className="font-mono text-[10.5px] text-muted-foreground">Title</label>
                    <input
                      type="text"
                      value={proj.title || ""}
                      onChange={(e) => updateField(`projects.${idx}.title`, e.target.value)}
                      className="w-full rounded-lg border border-border/60 bg-neutral-900 px-2.5 py-1.5 text-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono text-[10.5px] text-muted-foreground">Summary</label>
                    <textarea
                      rows={2}
                      value={proj.summary || ""}
                      onChange={(e) => updateField(`projects.${idx}.summary`, e.target.value)}
                      className="w-full rounded-lg border border-border/60 bg-neutral-900 p-2 text-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono text-[10.5px] text-muted-foreground">Technologies (comma separated)</label>
                    <TagInput
                      value={proj.technologies}
                      onChange={(tags) => updateField(`projects.${idx}.technologies`, tags)}
                      className="w-full rounded-lg border border-border/60 bg-neutral-900 px-2.5 py-1.5 font-mono text-[11px] text-foreground"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. STACK SECTION FORM
// ---------------------------------------------------------------------------
function StackSectionForm({
  content,
  updateField,
}: {
  content: ReturnType<typeof useEditor>["content"];
  updateField: (path: string, val: unknown) => void;
}) {
  const groups = content.skills?.skillGroups || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-saffron">
          Skill Groups ({groups.length})
        </h4>
        <button
          type="button"
          onClick={() => {
            const updated = [...groups, { label: "New Category", note: "tools", items: ["Tool 1", "Tool 2"] }];
            updateField("skills.skillGroups", updated);
          }}
          className="inline-flex items-center gap-1 font-mono text-[11px] text-signal hover:underline cursor-pointer"
        >
          <Plus className="size-3" /> Add Group
        </button>
      </div>

      <div className="space-y-3">
        {groups.map((grp, gIdx) => (
          <div key={gIdx} className="rounded-xl border border-border/60 bg-neutral-950/70 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={grp.label || ""}
                onChange={(e) => updateField(`skills.skillGroups.${gIdx}.label`, e.target.value)}
                className="font-mono text-xs font-bold text-saffron bg-transparent border-b border-border/40 focus:outline-none focus:border-signal pb-0.5"
              />
              <button
                type="button"
                onClick={() => {
                  const updated = groups.filter((_, i) => i !== gIdx);
                  updateField("skills.skillGroups", updated);
                }}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Note (e.g. daily drivers)"
              value={grp.note || ""}
              onChange={(e) => updateField(`skills.skillGroups.${gIdx}.note`, e.target.value)}
              className="w-full rounded-lg border border-border/60 bg-neutral-900 px-2.5 py-1 font-mono text-[11px] text-muted-foreground"
            />
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-muted-foreground">Items (comma separated)</label>
              <TagInput
                value={grp.items}
                onChange={(items) => updateField(`skills.skillGroups.${gIdx}.items`, items)}
                className="w-full rounded-lg border border-border/60 bg-neutral-900 px-2.5 py-1.5 font-sans text-xs text-foreground"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 6. CERTIFICATIONS SECTION FORM
// ---------------------------------------------------------------------------
function CertificationsSectionForm({
  content,
  updateField,
  addNewCert,
  deleteCert,
}: {
  content: ReturnType<typeof useEditor>["content"];
  updateField: (path: string, val: unknown) => void;
  addNewCert: () => string;
  deleteCert: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-saffron">
          Accredited Certifications ({content.certifications?.length || 0})
        </h4>
        <button
          type="button"
          onClick={addNewCert}
          className="inline-flex items-center gap-1 font-mono text-[11px] text-signal hover:underline cursor-pointer"
        >
          <Plus className="size-3" /> Add Certificate
        </button>
      </div>

      <div
        data-lenis-prevent
        onWheel={(e) => e.stopPropagation()}
        className="space-y-3 max-h-[500px] overflow-y-auto overscroll-contain pr-1 scrollbar-thin scrollbar-thumb-border"
      >
        {content.certifications?.map((cert, cIdx) => (
          <div key={cert.id || cIdx} className="rounded-xl border border-border/60 bg-neutral-950/70 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-foreground truncate max-w-[220px]">
                {cert.title || "Certification"}
              </span>
              <button
                type="button"
                onClick={() => deleteCert(cert.id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <input
                type="text"
                placeholder="Title"
                value={cert.title || ""}
                onChange={(e) => updateField(`certifications.${cIdx}.title`, e.target.value)}
                className="rounded-lg border border-border/60 bg-neutral-900 px-2.5 py-1.5 text-foreground"
              />
              <input
                type="text"
                placeholder="Subtitle"
                value={cert.subtitle || ""}
                onChange={(e) => updateField(`certifications.${cIdx}.subtitle`, e.target.value)}
                className="rounded-lg border border-border/60 bg-neutral-900 px-2.5 py-1.5 text-foreground"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <input
                type="text"
                placeholder="Issuer"
                value={cert.issuer || ""}
                onChange={(e) => updateField(`certifications.${cIdx}.issuer`, e.target.value)}
                className="rounded-lg border border-border/60 bg-neutral-900 px-2.5 py-1.5 text-foreground"
              />
              <input
                type="text"
                placeholder="Year"
                value={cert.year || ""}
                onChange={(e) => updateField(`certifications.${cIdx}.year`, e.target.value)}
                className="rounded-lg border border-border/60 bg-neutral-900 px-2.5 py-1.5 text-foreground"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <input
                type="text"
                placeholder="Poster (/certificates/ccna.webp)"
                value={cert.poster || ""}
                onChange={(e) => updateField(`certifications.${cIdx}.poster`, e.target.value || undefined)}
                className="rounded-lg border border-border/60 bg-neutral-900 px-2.5 py-1.5 text-foreground font-mono text-[11px]"
              />
              <input
                type="text"
                placeholder="PDF File (/certificates/ccna.pdf)"
                value={cert.file || ""}
                onChange={(e) => updateField(`certifications.${cIdx}.file`, e.target.value || undefined)}
                className="rounded-lg border border-border/60 bg-neutral-900 px-2.5 py-1.5 text-foreground font-mono text-[11px]"
              />
            </div>
            <TagInput
              placeholder="Tags (comma-separated)"
              value={cert.tags}
              onChange={(tags) => updateField(`certifications.${cIdx}.tags`, tags)}
              className="w-full rounded-lg border border-border/60 bg-neutral-900 px-2.5 py-1.5 text-xs text-foreground"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 7. ML NOTEBOOK SECTION FORM
// ---------------------------------------------------------------------------
function MLSectionForm({
  content,
  updateField,
  addNewMlRun,
  deleteMlRun,
}: {
  content: ReturnType<typeof useEditor>["content"];
  updateField: (path: string, val: unknown) => void;
  addNewMlRun: () => void;
  deleteMlRun: (idx: number) => void;
}) {
  return (
    <div className="space-y-4">
      <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-saffron">
        Machine Learning Setup &amp; Runs
      </h4>

      <div className="space-y-1.5">
        <label className="font-mono text-[11px] text-muted-foreground">Hardware Spec</label>
        <input
          type="text"
          value={content.ml.hardware || ""}
          onChange={(e) => updateField("ml.hardware", e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none"
        />
      </div>

      <div className="pt-3 border-t border-border/40 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-saffron">
            Experiment Runs ({content.ml.runs?.length || 0})
          </h4>
          <button
            type="button"
            onClick={addNewMlRun}
            className="inline-flex items-center gap-1 font-mono text-[11px] text-signal hover:underline cursor-pointer"
          >
            <Plus className="size-3" /> Log New Run
          </button>
        </div>

        {content.ml.runs?.map((run, rIdx) => (
          <div key={rIdx} className="rounded-xl border border-border/60 bg-neutral-950/70 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-signal">Run #{rIdx + 1} - {run.model}</span>
              <button
                type="button"
                onClick={() => deleteMlRun(rIdx)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <input
                type="text"
                placeholder="Model Name"
                value={run.model || ""}
                onChange={(e) => updateField(`ml.runs.${rIdx}.model`, e.target.value)}
                className="rounded-lg border border-border/60 bg-neutral-900 px-2.5 py-1.5 text-foreground"
              />
              <input
                type="text"
                placeholder="Dataset"
                value={run.dataset || ""}
                onChange={(e) => updateField(`ml.runs.${rIdx}.dataset`, e.target.value)}
                className="rounded-lg border border-border/60 bg-neutral-900 px-2.5 py-1.5 text-foreground"
              />
              <input
                type="text"
                placeholder="Framework"
                value={run.framework || ""}
                onChange={(e) => updateField(`ml.runs.${rIdx}.framework`, e.target.value)}
                className="rounded-lg border border-border/60 bg-neutral-900 px-2.5 py-1.5 text-foreground"
              />
              <input
                type="text"
                placeholder="Training / Params"
                value={run.training || ""}
                onChange={(e) => updateField(`ml.runs.${rIdx}.training`, e.target.value)}
                className="rounded-lg border border-border/60 bg-neutral-900 px-2.5 py-1.5 text-foreground"
              />
            </div>
            <textarea
              rows={2}
              placeholder="Run Notes"
              value={run.notes || ""}
              onChange={(e) => updateField(`ml.runs.${rIdx}.notes`, e.target.value)}
              className="w-full rounded-lg border border-border/60 bg-neutral-900 p-2 font-mono text-xs text-muted-foreground"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 8. JOURNEY SECTION FORM
// ---------------------------------------------------------------------------
function JourneySectionForm({
  content,
  updateField,
  addNewJourneyItem,
  deleteJourneyItem,
}: {
  content: ReturnType<typeof useEditor>["content"];
  updateField: (path: string, val: unknown) => void;
  addNewJourneyItem: () => void;
  deleteJourneyItem: (idx: number) => void;
}) {
  return (
    <div className="space-y-5">
      {/* Section Header & Telemetry Configuration */}
      <div className="rounded-xl border border-border/60 bg-neutral-950/70 p-3.5 space-y-3">
        <h5 className="font-mono text-xs font-bold uppercase tracking-wider text-signal">
          Header Copy &amp; Telemetry
        </h5>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <input
            type="text"
            placeholder="Eyebrow"
            value={content.copy?.journey?.eyebrow || ""}
            onChange={(e) => updateField("copy.journey.eyebrow", e.target.value)}
            className="rounded-lg border border-border/60 bg-neutral-900 px-2.5 py-1.5 text-foreground"
          />
          <input
            type="text"
            placeholder="Status Badge"
            value={content.copy?.journey?.status || ""}
            onChange={(e) => updateField("copy.journey.status", e.target.value)}
            className="rounded-lg border border-border/60 bg-neutral-900 px-2.5 py-1.5 text-foreground"
          />
        </div>
        <input
          type="text"
          placeholder="Section Title"
          value={content.copy?.journey?.title || ""}
          onChange={(e) => updateField("copy.journey.title", e.target.value)}
          className="w-full rounded-lg border border-border/60 bg-neutral-900 px-2.5 py-1.5 text-xs text-foreground"
        />
        <textarea
          rows={2}
          placeholder="Section Description"
          value={content.copy?.journey?.description || ""}
          onChange={(e) => updateField("copy.journey.description", e.target.value)}
          className="w-full rounded-lg border border-border/60 bg-neutral-900 p-2 text-xs text-muted-foreground"
        />
        <div className="grid grid-cols-2 gap-2 text-xs">
          <input
            type="text"
            placeholder="Filter Prefix (Stream:)"
            value={content.copy?.journey?.streamLabel || ""}
            onChange={(e) => updateField("copy.journey.streamLabel", e.target.value)}
            className="rounded-lg border border-border/60 bg-neutral-900 px-2.5 py-1.5 text-foreground"
          />
          <input
            type="text"
            placeholder="All Label (All Branches)"
            value={content.copy?.journey?.allBranchesLabel || ""}
            onChange={(e) => updateField("copy.journey.allBranchesLabel", e.target.value)}
            className="rounded-lg border border-border/60 bg-neutral-900 px-2.5 py-1.5 text-foreground"
          />
        </div>

        {/* Telemetry Metric inputs */}
        <div className="pt-2 border-t border-border/40 space-y-2">
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
            Telemetry Cards (Span, Hackathons, Robotics, Open Source)
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <input
              type="text"
              placeholder="Span Value (2023 – 2026)"
              value={content.copy?.journey?.statSpanValue || ""}
              onChange={(e) => updateField("copy.journey.statSpanValue", e.target.value)}
              className="rounded border border-border/60 bg-neutral-900 px-2 py-1 text-foreground"
            />
            <input
              type="text"
              placeholder="Span Sub (4 Years)"
              value={content.copy?.journey?.statSpanSub || ""}
              onChange={(e) => updateField("copy.journey.statSpanSub", e.target.value)}
              className="rounded border border-border/60 bg-neutral-900 px-2 py-1 text-foreground"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <input
              type="text"
              placeholder="Hackathons Value (1st Place)"
              value={content.copy?.journey?.statHackathonsValue || ""}
              onChange={(e) => updateField("copy.journey.statHackathonsValue", e.target.value)}
              className="rounded border border-border/60 bg-neutral-900 px-2 py-1 text-foreground"
            />
            <input
              type="text"
              placeholder="Hackathons Sub (UniHack Winner)"
              value={content.copy?.journey?.statHackathonsSub || ""}
              onChange={(e) => updateField("copy.journey.statHackathonsSub", e.target.value)}
              className="rounded border border-border/60 bg-neutral-900 px-2 py-1 text-foreground"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <input
              type="text"
              placeholder="Robotics Value (FTC)"
              value={content.copy?.journey?.statRoboticsValue || ""}
              onChange={(e) => updateField("copy.journey.statRoboticsValue", e.target.value)}
              className="rounded border border-border/60 bg-neutral-900 px-2 py-1 text-foreground"
            />
            <input
              type="text"
              placeholder="Robotics Sub (Nationals & Mentor)"
              value={content.copy?.journey?.statRoboticsSub || ""}
              onChange={(e) => updateField("copy.journey.statRoboticsSub", e.target.value)}
              className="rounded border border-border/60 bg-neutral-900 px-2 py-1 text-foreground"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <input
              type="text"
              placeholder="Open Source Value (40+)"
              value={content.copy?.journey?.statOpenSourceValue || ""}
              onChange={(e) => updateField("copy.journey.statOpenSourceValue", e.target.value)}
              className="rounded border border-border/60 bg-neutral-900 px-2 py-1 text-foreground"
            />
            <input
              type="text"
              placeholder="Open Source Sub (Repositories)"
              value={content.copy?.journey?.statOpenSourceSub || ""}
              onChange={(e) => updateField("copy.journey.statOpenSourceSub", e.target.value)}
              className="rounded border border-border/60 bg-neutral-900 px-2 py-1 text-foreground"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-saffron">
          Timeline Milestones ({content.journey?.length || 0})
        </h4>
        <button
          type="button"
          onClick={addNewJourneyItem}
          className="inline-flex items-center gap-1 font-mono text-[11px] text-signal hover:underline cursor-pointer"
        >
          <Plus className="size-3" /> Add Milestone
        </button>
      </div>

      <div
        data-lenis-prevent
        onWheel={(e) => e.stopPropagation()}
        className="space-y-3 max-h-[400px] overflow-y-auto overscroll-contain pr-1 scrollbar-thin scrollbar-thumb-border"
      >
        {content.journey?.map((item, jIdx) => (
          <div key={jIdx} className="rounded-xl border border-border/60 bg-neutral-950/70 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-signal">{item.date || "Date"} • {item.title || "Milestone"}</span>
              <button
                type="button"
                onClick={() => deleteJourneyItem(jIdx)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <input
                type="text"
                placeholder="Date"
                value={item.date || ""}
                onChange={(e) => updateField(`journey.${jIdx}.date`, e.target.value)}
                className="rounded-lg border border-border/60 bg-neutral-900 px-2.5 py-1.5 text-foreground"
              />
              <input
                type="text"
                placeholder="Category"
                value={item.category || ""}
                onChange={(e) => updateField(`journey.${jIdx}.category`, e.target.value)}
                className="rounded-lg border border-border/60 bg-neutral-900 px-2.5 py-1.5 text-foreground"
              />
            </div>
            <input
              type="text"
              placeholder="Title"
              value={item.title || ""}
              onChange={(e) => updateField(`journey.${jIdx}.title`, e.target.value)}
              className="w-full rounded-lg border border-border/60 bg-neutral-900 px-2.5 py-1.5 text-xs text-foreground"
            />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <input
                type="text"
                placeholder="Location (e.g. Romania, Timisoara)"
                value={item.location || ""}
                onChange={(e) => updateField(`journey.${jIdx}.location`, e.target.value)}
                className="rounded-lg border border-border/60 bg-neutral-900 px-2.5 py-1.5 text-foreground"
              />
              <input
                type="text"
                placeholder="Link (https://...)"
                value={item.link || ""}
                onChange={(e) => updateField(`journey.${jIdx}.link`, e.target.value)}
                className="rounded-lg border border-border/60 bg-neutral-900 px-2.5 py-1.5 text-foreground"
              />
            </div>
            <input
              type="text"
              placeholder="Image path (/activities/photo.webp)"
              value={item.image || ""}
              onChange={(e) => updateField(`journey.${jIdx}.image`, e.target.value)}
              className="w-full rounded-lg border border-border/60 bg-neutral-900 px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground"
            />
            <textarea
              rows={2}
              placeholder="Note"
              value={item.note || ""}
              onChange={(e) => updateField(`journey.${jIdx}.note`, e.target.value)}
              className="w-full rounded-lg border border-border/60 bg-neutral-900 p-2 text-xs text-muted-foreground"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 9. ACTIVITIES SECTION FORM
// ---------------------------------------------------------------------------
function ActivitiesSectionForm({
  content,
  updateField,
  addNewActivity,
  deleteActivity,
}: {
  content: ReturnType<typeof useEditor>["content"];
  updateField: (path: string, val: unknown) => void;
  addNewActivity: () => string;
  deleteActivity: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-saffron">
          Activities &amp; Hackathons ({content.activities?.length || 0})
        </h4>
        <button
          type="button"
          onClick={addNewActivity}
          className="inline-flex items-center gap-1 font-mono text-[11px] text-signal hover:underline cursor-pointer"
        >
          <Plus className="size-3" /> Add Activity
        </button>
      </div>

      <div
        data-lenis-prevent
        onWheel={(e) => e.stopPropagation()}
        className="space-y-3 max-h-[500px] overflow-y-auto overscroll-contain pr-1 scrollbar-thin scrollbar-thumb-border"
      >
        {content.activities?.map((act, aIdx) => (
          <div key={act.id || aIdx} className="rounded-xl border border-border/60 bg-neutral-950/70 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-foreground truncate max-w-[220px]">
                {act.title || "Activity"}
              </span>
              <button
                type="button"
                onClick={() => deleteActivity(act.id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <input
                type="text"
                placeholder="Title"
                value={act.title || ""}
                onChange={(e) => updateField(`activities.${aIdx}.title`, e.target.value)}
                className="rounded-lg border border-border/60 bg-neutral-900 px-2.5 py-1.5 text-foreground"
              />
              <input
                type="text"
                placeholder="Type (e.g. Hackathon)"
                value={act.type || ""}
                onChange={(e) => updateField(`activities.${aIdx}.type`, e.target.value)}
                className="rounded-lg border border-border/60 bg-neutral-900 px-2.5 py-1.5 text-foreground"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <input
                type="text"
                placeholder="Year (e.g. 2025)"
                value={act.year || ""}
                onChange={(e) => updateField(`activities.${aIdx}.year`, e.target.value)}
                className="rounded-lg border border-border/60 bg-neutral-900 px-2.5 py-1.5 text-foreground"
              />
              <input
                type="text"
                placeholder="Location (e.g. Romania, Pitesti)"
                value={act.location || ""}
                onChange={(e) => updateField(`activities.${aIdx}.location`, e.target.value)}
                className="rounded-lg border border-border/60 bg-neutral-900 px-2.5 py-1.5 text-foreground"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <input
                type="text"
                placeholder="Link (https://...)"
                value={act.link || ""}
                onChange={(e) => updateField(`activities.${aIdx}.link`, e.target.value || undefined)}
                className="rounded-lg border border-border/60 bg-neutral-900 px-2.5 py-1.5 text-foreground"
              />
              <input
                type="text"
                placeholder="Image (/activities/photo.webp)"
                value={act.image || ""}
                onChange={(e) => updateField(`activities.${aIdx}.image`, e.target.value || undefined)}
                className="rounded-lg border border-border/60 bg-neutral-900 px-2.5 py-1.5 text-foreground font-mono text-[11px]"
              />
            </div>
            <textarea
              rows={2}
              placeholder="Description"
              value={act.description || ""}
              onChange={(e) => updateField(`activities.${aIdx}.description`, e.target.value)}
              className="w-full rounded-lg border border-border/60 bg-neutral-900 p-2 text-xs text-muted-foreground"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 10. CONTACT SECTION FORM
// ---------------------------------------------------------------------------
function ContactSectionForm({
  content,
  updateField,
}: {
  content: ReturnType<typeof useEditor>["content"];
  updateField: (path: string, val: unknown) => void;
}) {
  return (
    <div className="space-y-4">
      <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-saffron">
        Contact Headlines &amp; Channels
      </h4>

      <div className="space-y-1.5">
        <label className="font-mono text-[11px] text-muted-foreground">Heading</label>
        <input
          type="text"
          value={content.copy?.contact?.heading || ""}
          onChange={(e) => updateField("copy.contact.heading", e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-sans text-xs text-foreground focus:border-signal focus:outline-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="font-mono text-[11px] text-muted-foreground">Description</label>
        <textarea
          rows={3}
          value={content.copy?.contact?.description || ""}
          onChange={(e) => updateField("copy.contact.description", e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 p-3 font-sans text-xs text-foreground focus:border-signal focus:outline-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="font-mono text-[11px] text-muted-foreground">Email Address</label>
        <input
          type="email"
          value={content.site.email || ""}
          onChange={(e) => updateField("site.email", e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="font-mono text-[11px] text-muted-foreground">GitHub URL</label>
        <input
          type="text"
          value={content.site.github || ""}
          onChange={(e) => updateField("site.github", e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="font-mono text-[11px] text-muted-foreground">LinkedIn URL</label>
        <input
          type="text"
          value={content.site.linkedin || ""}
          onChange={(e) => updateField("site.linkedin", e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="font-mono text-[11px] text-muted-foreground">Instagram URL</label>
        <input
          type="text"
          value={content.site.instagram || ""}
          onChange={(e) => updateField("site.instagram", e.target.value)}
          className="w-full rounded-xl border border-border bg-neutral-900/90 px-3 py-2 font-mono text-xs text-foreground focus:border-signal focus:outline-none"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 11. GENERIC FALLBACK SECTION FORM
// ---------------------------------------------------------------------------
function GenericSectionForm({
  content,
  updateField,
  sectionId,
}: {
  content: ReturnType<typeof useEditor>["content"];
  updateField: (path: string, val: unknown) => void;
  sectionId: string;
}) {
  return (
    <div className="space-y-3">
      <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-saffron">
        Section Data: {sectionId}
      </h4>
      <p className="text-xs text-muted-foreground">
        Select specific items or inspect section variables directly.
      </p>
    </div>
  );
}
