"use client";

import { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Plus,
  Sliders,
  Sparkles,
  GripVertical,
  Check,
  X,
  ExternalLink,
  Layers,
  ArrowRight,
  Info,
} from "lucide-react";
import { useEditor } from "@/components/editor/editor-context";
import {
  PageSection,
  SectionType,
  SECTION_TYPE_META,
} from "@/data/sections";

interface SectionsManagerProps {
  onNavigateTab?: (tab: string) => void;
}

export function SectionsManager({ onNavigateTab }: SectionsManagerProps) {
  const {
    content,
    moveSection,
    toggleSectionVisibility,
    duplicateSection,
    deleteSection,
    addSection,
    updateSection,
  } = useEditor();

  const sections: PageSection[] = content.sections || [];

  const [editingSection, setEditingSection] = useState<PageSection | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const activeCount = sections.filter((s) => s.enabled).length;
  const hiddenCount = sections.length - activeCount;

  const handleOpenEdit = (section: PageSection) => {
    setEditingSection({
      ...section,
      title: section.title || section.name || "",
      navLabel: section.navLabel || "",
      settings: { ...(section.settings || {}) },
    });
  };

  const handleSaveEdit = () => {
    if (!editingSection) return;
    updateSection(editingSection.id, {
      name: editingSection.title || editingSection.name,
      title: editingSection.title,
      navLabel: editingSection.navLabel,
      enabled: editingSection.enabled,
      settings: editingSection.settings,
    });
    setEditingSection(null);
  };

  const handleCreateNewSection = (type: SectionType) => {
    const meta = SECTION_TYPE_META[type] || {
      label: "Custom Section",
      description: "Custom content section",
      defaultTitle: "New Section",
      defaultNavLabel: "New",
      icon: "Layers",
    };

    const newId = `${type}-${Date.now().toString().slice(-4)}`;
    const newSection: PageSection = {
      id: newId,
      type,
      name: meta.defaultTitle,
      title: meta.defaultTitle,
      navLabel: meta.defaultNavLabel,
      enabled: true,
      settings: {
        backgroundVariant: "default",
        padding: "md",
        containerWidth: "normal",
        showSubtitle: true,
        maxItems: type === "featured-projects" ? 3 : type === "activities" ? 6 : undefined,
        layout: "grid",
        showFilters: true,
      },
    };

    addSection(newSection);
    setIsAddModalOpen(false);
    // Open edit dialog for newly created section
    setEditingSection(newSection);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-signal/15 text-signal ring-1 ring-signal/30">
              <Layers className="size-4" />
            </div>
            <h2 className="text-base font-bold tracking-tight text-foreground">
              Page Sections & Structure Builder
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Drag, reorder, toggle, duplicate, or customize any section on the homepage. Everything updates dynamically in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-border/50 bg-card/60 px-3 py-1.5 font-mono text-xs">
            <span className="size-2 rounded-full bg-signal" />
            <span className="text-foreground font-semibold">{activeCount}</span>
            <span className="text-muted-foreground">Visible</span>
            <span className="text-border">|</span>
            <span className="text-muted-foreground font-medium">{hiddenCount} Hidden</span>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-signal px-3.5 py-2 font-mono text-xs font-semibold text-signal-ink transition-all hover:opacity-90 shadow-md shadow-signal/20 cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Add Section</span>
          </button>
        </div>
      </div>

      {/* Sections List */}
      <div className="space-y-2.5">
        {sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-border/60 bg-card/20">
            <Layers className="size-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm font-semibold text-foreground">No sections configured</p>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
              Add your first section to start constructing the main portfolio page.
            </p>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-signal px-4 py-2 font-mono text-xs font-semibold text-signal-ink cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Add First Section</span>
            </button>
          </div>
        ) : (
          sections.map((section, index) => {
            const meta = SECTION_TYPE_META[section.type] || {
              label: section.type,
              description: "",
              icon: "Layers",
            };
            const isFirst = index === 0;
            const isLast = index === sections.length - 1;

            return (
              <div
                key={section.id}
                className={`group flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border p-3.5 sm:p-4 backdrop-blur-md transition-all ${
                  section.enabled
                    ? "border-border/60 bg-card/50 hover:border-signal/40 hover:bg-card/70 shadow-sm"
                    : "border-border/30 bg-muted/10 opacity-60 hover:opacity-90"
                }`}
              >
                {/* Left side: Order number, Type pill, Section Title & ID */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                    <GripVertical className="size-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                    <span className="flex size-6 items-center justify-center rounded-md bg-muted/40 font-mono text-xs font-bold text-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="rounded border border-signal/30 bg-signal/10 px-2 py-0.5 font-mono text-[10px] font-bold text-signal uppercase">
                        {meta.label}
                      </span>
                      <span className="font-semibold text-sm text-foreground truncate">
                        {section.title || meta.label}
                      </span>
                      {!section.enabled && (
                        <span className="rounded border border-destructive/30 bg-destructive/10 px-2 py-0.5 font-mono text-[10px] font-bold text-destructive">
                          HIDDEN
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground mt-0.5">
                      <span>id: #{section.id}</span>
                      {section.navLabel && (
                        <>
                          <span>•</span>
                          <span>Nav: &quot;{section.navLabel}&quot;</span>
                        </>
                      )}
                      {section.settings?.backgroundVariant && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{section.settings.backgroundVariant} style</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Reorder, Visibility, Edit, Duplicate, Delete actions */}
                <div className="flex items-center gap-1 self-end md:self-auto shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-border/30 w-full md:w-auto justify-end">
                  {/* Move Up */}
                  <button
                    type="button"
                    onClick={() => moveSection(section.id, "up")}
                    disabled={isFirst}
                    title="Move up"
                    className="flex size-8 items-center justify-center rounded-lg border border-border/40 bg-card/60 text-muted-foreground hover:border-signal/40 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    <ChevronUp className="size-4" />
                  </button>

                  {/* Move Down */}
                  <button
                    type="button"
                    onClick={() => moveSection(section.id, "down")}
                    disabled={isLast}
                    title="Move down"
                    className="flex size-8 items-center justify-center rounded-lg border border-border/40 bg-card/60 text-muted-foreground hover:border-signal/40 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    <ChevronDown className="size-4" />
                  </button>

                  {/* Toggle Visibility */}
                  <button
                    type="button"
                    onClick={() => toggleSectionVisibility(section.id)}
                    title={section.enabled ? "Hide section" : "Show section"}
                    className={`flex size-8 items-center justify-center rounded-lg border transition-all cursor-pointer ${
                      section.enabled
                        ? "border-border/40 bg-card/60 text-signal hover:bg-signal/15 hover:border-signal/50"
                        : "border-border/40 bg-muted/20 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {section.enabled ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </button>

                  {/* Edit Settings */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(section)}
                    title="Configure section settings"
                    className="flex items-center gap-1.5 rounded-lg border border-border/40 bg-card/60 px-2.5 py-1.5 font-mono text-xs text-foreground hover:border-signal/40 hover:bg-signal/10 transition-all cursor-pointer"
                  >
                    <Sliders className="size-3.5 text-signal" />
                    <span>Configure</span>
                  </button>

                  {/* Duplicate */}
                  <button
                    type="button"
                    onClick={() => duplicateSection(section.id)}
                    title="Duplicate section"
                    className="flex size-8 items-center justify-center rounded-lg border border-border/40 bg-card/60 text-muted-foreground hover:border-signal/40 hover:text-foreground transition-all cursor-pointer"
                  >
                    <Copy className="size-3.5" />
                  </button>

                  {/* Delete */}
                  {deleteConfirmId === section.id ? (
                    <div className="flex items-center gap-1 bg-destructive/10 border border-destructive/40 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          deleteSection(section.id);
                          setDeleteConfirmId(null);
                        }}
                        className="px-2 py-1 font-mono text-[10px] font-bold bg-destructive text-destructive-foreground rounded hover:opacity-90 cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(null)}
                        className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(section.id)}
                      title="Delete section"
                      className="flex size-8 items-center justify-center rounded-lg border border-border/40 bg-card/60 text-muted-foreground hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ================= EDIT SECTION MODAL ================= */}
      {editingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div
            data-lenis-prevent
            onWheel={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-2xl border border-border/60 bg-neutral-950 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-border ring-1 ring-white/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded border border-signal/30 bg-signal/10 px-2 py-0.5 font-mono text-[10px] font-bold text-signal uppercase">
                    {editingSection.type}
                  </span>
                  <h3 className="text-base font-bold text-foreground">
                    Section Configuration: {editingSection.title}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Adjust section display parameters, navigation anchor, and visual styling.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingSection(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/40 hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* General Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-mono text-xs text-muted-foreground">Section Title</label>
                  <input
                    type="text"
                    value={editingSection.title}
                    onChange={(e) =>
                      setEditingSection({ ...editingSection, title: e.target.value })
                    }
                    placeholder="e.g. Featured Projects"
                    className="w-full rounded-xl border border-border/60 bg-card/60 px-3.5 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-signal/80 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono text-xs text-muted-foreground">
                    Navigation Label (Top Header)
                  </label>
                  <input
                    type="text"
                    value={editingSection.navLabel || ""}
                    onChange={(e) =>
                      setEditingSection({ ...editingSection, navLabel: e.target.value })
                    }
                    placeholder="e.g. Work (leave blank to hide from nav)"
                    className="w-full rounded-xl border border-border/60 bg-card/60 px-3.5 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-signal/80 focus:outline-none"
                  />
                </div>
              </div>

              {/* Visibility Switch */}
              <div className="flex items-center justify-between rounded-xl border border-border/40 bg-card/30 p-3.5">
                <div>
                  <p className="font-mono text-xs font-semibold text-foreground">
                    Section Visibility
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    When disabled, this section is hidden from the public page and navigation without deleting its data.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditingSection({
                      ...editingSection,
                      enabled: !editingSection.enabled,
                    })
                  }
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs font-semibold cursor-pointer transition-all ${
                    editingSection.enabled
                      ? "bg-signal text-signal-ink"
                      : "bg-muted/40 text-muted-foreground"
                  }`}
                >
                  {editingSection.enabled ? (
                    <>
                      <Eye className="size-3.5" />
                      <span>Visible</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="size-3.5" />
                      <span>Hidden</span>
                    </>
                  )}
                </button>
              </div>

              {/* Layout & Styling Options */}
              <div className="rounded-xl border border-border/40 bg-card/30 p-4 space-y-3.5">
                <h4 className="font-mono text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="size-3.5 text-signal" />
                  <span>Visual Layout & Styling</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-mono text-[11px] text-muted-foreground">
                      Background Style
                    </label>
                    <select
                      value={editingSection.settings?.backgroundVariant || "default"}
                      onChange={(e) =>
                        setEditingSection({
                          ...editingSection,
                          settings: {
                            ...editingSection.settings,
                            backgroundVariant: e.target.value as any,
                          },
                        })
                      }
                      className="w-full rounded-lg border border-border/60 bg-neutral-900 px-2.5 py-1.5 font-mono text-xs text-foreground focus:border-signal/80 focus:outline-none cursor-pointer"
                    >
                      <option value="default">Default (Seamless)</option>
                      <option value="glass">Frosted Glass</option>
                      <option value="elevated">Elevated Contrast</option>
                      <option value="bordered">Bordered Container</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-mono text-[11px] text-muted-foreground">
                      Vertical Padding
                    </label>
                    <select
                      value={editingSection.settings?.padding || "md"}
                      onChange={(e) =>
                        setEditingSection({
                          ...editingSection,
                          settings: {
                            ...editingSection.settings,
                            padding: e.target.value as any,
                          },
                        })
                      }
                      className="w-full rounded-lg border border-border/60 bg-neutral-900 px-2.5 py-1.5 font-mono text-xs text-foreground focus:border-signal/80 focus:outline-none cursor-pointer"
                    >
                      <option value="none">None (0px)</option>
                      <option value="sm">Small (Compact)</option>
                      <option value="md">Medium (Standard)</option>
                      <option value="lg">Large (Spacious)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-mono text-[11px] text-muted-foreground">
                      Container Width
                    </label>
                    <select
                      value={editingSection.settings?.containerWidth || "normal"}
                      onChange={(e) =>
                        setEditingSection({
                          ...editingSection,
                          settings: {
                            ...editingSection.settings,
                            containerWidth: e.target.value as any,
                          },
                        })
                      }
                      className="w-full rounded-lg border border-border/60 bg-neutral-900 px-2.5 py-1.5 font-mono text-xs text-foreground focus:border-signal/80 focus:outline-none cursor-pointer"
                    >
                      <option value="normal">Normal (1120px)</option>
                      <option value="wide">Wide (1440px)</option>
                      <option value="full">Full Width (100%)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Type-Specific Settings */}
              {(editingSection.type === "projects" ||
                editingSection.type === "featured-projects" ||
                editingSection.type === "activities") && (
                <div className="rounded-xl border border-border/40 bg-card/30 p-4 space-y-3">
                  <h4 className="font-mono text-xs font-bold text-foreground uppercase tracking-wider">
                    Content Display Settings
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-mono text-[11px] text-muted-foreground">
                        Max Items To Display
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={editingSection.settings?.maxItems ?? ""}
                        placeholder="6"
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingSection({
                            ...editingSection,
                            settings: {
                              ...editingSection.settings,
                              maxItems: val === "" ? undefined : parseInt(val, 10),
                            },
                          });
                        }}
                        className="w-full rounded-lg border border-border/60 bg-neutral-900 px-3 py-1.5 font-mono text-xs text-foreground focus:border-signal/80 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[11px] text-muted-foreground">
                        Category Filters
                      </label>
                      <select
                        value={editingSection.settings?.showFilters !== false ? "true" : "false"}
                        onChange={(e) =>
                          setEditingSection({
                            ...editingSection,
                            settings: {
                              ...editingSection.settings,
                              showFilters: e.target.value === "true",
                            },
                          })
                        }
                        className="w-full rounded-lg border border-border/60 bg-neutral-900 px-2.5 py-1.5 font-mono text-xs text-foreground focus:border-signal/80 focus:outline-none cursor-pointer"
                      >
                        <option value="true">Enabled (Show filter chips)</option>
                        <option value="false">Disabled (Show all items)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Section Specific Fields */}
              {editingSection.type === "custom" && (
                <div className="rounded-xl border border-border/40 bg-card/30 p-4 space-y-3">
                  <h4 className="font-mono text-xs font-bold text-foreground uppercase tracking-wider">
                    Custom Content
                  </h4>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="font-mono text-[11px] text-muted-foreground">
                        Subtitle / Eyebrow Text
                      </label>
                      <input
                        type="text"
                        value={editingSection.settings?.subtitle || ""}
                        onChange={(e) =>
                          setEditingSection({
                            ...editingSection,
                            settings: {
                              ...editingSection.settings,
                              subtitle: e.target.value,
                            },
                          })
                        }
                        placeholder="e.g. Highlights & Announcements"
                        className="w-full rounded-lg border border-border/60 bg-neutral-900 px-3 py-1.5 font-mono text-xs text-foreground focus:border-signal/80 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[11px] text-muted-foreground">
                        Body Content / Description
                      </label>
                      <textarea
                        rows={3}
                        value={editingSection.settings?.customContent || ""}
                        onChange={(e) =>
                          setEditingSection({
                            ...editingSection,
                            settings: {
                              ...editingSection.settings,
                              customContent: e.target.value,
                            },
                          })
                        }
                        placeholder="Write announcement, personal notice, or custom callout text..."
                        className="w-full rounded-lg border border-border/60 bg-neutral-900 px-3 py-2 font-mono text-xs text-foreground focus:border-signal/80 focus:outline-none resize-y"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <label className="font-mono text-[11px] text-muted-foreground">
                          Button Text
                        </label>
                        <input
                          type="text"
                          value={editingSection.settings?.buttonText || ""}
                          onChange={(e) =>
                            setEditingSection({
                              ...editingSection,
                              settings: {
                                ...editingSection.settings,
                                buttonText: e.target.value,
                              },
                            })
                          }
                          placeholder="e.g. Read Blog Post"
                          className="w-full rounded-lg border border-border/60 bg-neutral-900 px-3 py-1.5 font-mono text-xs text-foreground focus:border-signal/80 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-mono text-[11px] text-muted-foreground">
                          Button URL
                        </label>
                        <input
                          type="text"
                          value={editingSection.settings?.buttonUrl || ""}
                          onChange={(e) =>
                            setEditingSection({
                              ...editingSection,
                              settings: {
                                ...editingSection.settings,
                                buttonUrl: e.target.value,
                              },
                            })
                          }
                          placeholder="https://... or #contact"
                          className="w-full rounded-lg border border-border/60 bg-neutral-900 px-3 py-1.5 font-mono text-xs text-foreground focus:border-signal/80 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Jump to Dedicated Content Tab */}
              {onNavigateTab && (
                <div className="rounded-xl border border-signal/30 bg-signal/5 p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Info className="size-4 text-signal shrink-0" />
                    <p className="text-xs text-foreground font-medium">
                      Need to add or edit data items for this section?
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const tabMap: Record<string, string> = {
                        projects: "projects",
                        "featured-projects": "projects",
                        activities: "activities",
                        certifications: "activities",
                        stack: "skills",
                        ml: "ml",
                        journey: "journey",
                        hero: "copy",
                        about: "copy",
                        contact: "profile",
                      };
                      const targetTab = tabMap[editingSection.type] || "overview";
                      setEditingSection(null);
                      onNavigateTab(targetTab);
                    }}
                    className="flex items-center gap-1 font-mono text-xs font-semibold text-signal hover:underline shrink-0 cursor-pointer"
                  >
                    <span>Jump to Content Tab</span>
                    <ArrowRight className="size-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2.5 border-t border-border/40 pt-4">
              <button
                type="button"
                onClick={() => setEditingSection(null)}
                className="rounded-xl border border-border/60 bg-card/60 px-4 py-2 font-mono text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="flex items-center gap-1.5 rounded-xl bg-signal px-4 py-2 font-mono text-xs font-semibold text-signal-ink hover:opacity-90 cursor-pointer shadow-md shadow-signal/20"
              >
                <Check className="size-3.5" />
                <span>Apply Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ADD NEW SECTION MODAL ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div
            data-lenis-prevent
            onWheel={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-2xl border border-border/60 bg-neutral-950 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-border ring-1 ring-white/10"
          >
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Add Section to Main Page
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select a section component to insert into your portfolio layout.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/40 hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Grid of section types */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {(Object.keys(SECTION_TYPE_META) as SectionType[]).map((type) => {
                const meta = SECTION_TYPE_META[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleCreateNewSection(type)}
                    className="flex flex-col text-left p-3.5 rounded-xl border border-border/50 bg-card/40 hover:border-signal/50 hover:bg-signal/5 transition-all group cursor-pointer shadow-sm"
                  >
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <span className="font-mono text-xs font-bold text-foreground group-hover:text-signal transition-colors">
                        {meta.label}
                      </span>
                      <Plus className="size-3.5 text-muted-foreground group-hover:text-signal transition-colors" />
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {meta.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
