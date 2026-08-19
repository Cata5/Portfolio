"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import siteData from "@/content/site.json";
import copyData from "@/content/copy.json";
import skillsData from "@/content/skills.json";
import journeyData from "@/content/journey.json";
import activitiesData from "@/content/activities.json";
import certsData from "@/content/certifications.json";
import mlData from "@/content/ml.json";
import projectsData from "@/content/projects.json";
import type { Project } from "@/data/projects";
import type { Activity } from "@/data/activities";
import type { Certification } from "@/data/certifications";
import type { JourneyEntry } from "@/data/journey";
import type { MlRun } from "@/data/ml";
import { ScrollTrigger } from "@/components/motion/gsap";

export type ContentState = {
  site: typeof siteData;
  copy: typeof copyData;
  skills: typeof skillsData;
  journey: JourneyEntry[];
  activities: Activity[];
  certifications: Certification[];
  ml: typeof mlData;
  projects: Project[];
};

export type FieldType =
  | "text"
  | "textarea"
  | "rich"
  | "image"
  | "array"
  | "project"
  | "activity"
  | "cert"
  | "mlRun"
  | "journeyItem";

export type SelectedField = {
  path: string;
  label: string;
  type?: FieldType;
  value?: unknown;
  meta?: unknown;
};

interface EditorContextValue {
  isAuthenticated: boolean;
  isEditing: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  selectedField: SelectedField | null;
  setSelectedField: (field: SelectedField | null) => void;
  content: ContentState;
  isDirty: boolean;
  isSaving: boolean;
  saveStatus: "idle" | "saving" | "saved" | "error";
  saveMessage: string | null;
  updateField: (path: string, value: unknown) => void;
  updateStore: (store: keyof ContentState, data: unknown) => void;
  saveChanges: () => Promise<boolean>;
  toggleEdit: () => void;
  unlockWithPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  lockEditor: () => void;
  addNewProject: () => string;
  deleteProject: (id: string) => void;
  addNewJourneyItem: () => void;
  deleteJourneyItem: (index: number) => void;
  addNewActivity: () => string;
  deleteActivity: (id: string) => void;
  addNewCert: () => string;
  deleteCert: (id: string) => void;
  addNewMlRun: () => void;
  deleteMlRun: (index: number) => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

const SESSION_AUTH_KEY = "portfolio_admin_auth";

// Deep immutable set helper
function setByPath<T>(obj: T, path: string, value: unknown): T {
  const parts = path.split(".");
  const cloned = JSON.parse(JSON.stringify(obj));
  let curr: Record<string, unknown> = cloned;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (curr[part] === undefined || curr[part] === null) {
      curr[part] = /^\d+$/.test(parts[i + 1]) ? [] : {};
    }
    curr = curr[part] as Record<string, unknown>;
  }
  curr[parts[parts.length - 1]] = value;
  return cloned;
}

export function EditorProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem(SESSION_AUTH_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<SelectedField | null>(null);

  const [content, setContent] = useState<ContentState>(() => ({
    site: siteData,
    copy: copyData,
    skills: skillsData,
    journey: journeyData as JourneyEntry[],
    activities: activitiesData as Activity[],
    certifications: certsData as Certification[],
    ml: mlData,
    projects: projectsData as unknown as Project[],
  }));

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Sync HTML data attribute for CSS mask clipping prevention in edit mode
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dataset.cmsEditing = isEditing ? "true" : "false";
    }
  }, [isEditing]);

  // Keyboard shortcut Ctrl+E / ⌘E to toggle edit mode
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "e" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isAuthenticated) {
          setIsEditing((prev) => !prev);
        } else {
          setIsAuthModalOpen(true);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isAuthenticated]);

  // Refresh GSAP ScrollTrigger whenever content changes to prevent layout bugs
  const refreshScrollTrigger = useCallback(() => {
    if (typeof window !== "undefined" && ScrollTrigger) {
      setTimeout(() => {
        try {
          ScrollTrigger.refresh();
        } catch {
          // ignore
        }
      }, 50);
    }
  }, []);

  const updateField = useCallback(
    (path: string, value: unknown) => {
      setContent((prev) => {
        const next = setByPath(prev, path, value);
        return next;
      });
      setIsDirty(true);
      setSaveStatus("idle");
      refreshScrollTrigger();
    },
    [refreshScrollTrigger],
  );

  const updateStore = useCallback(
    (store: keyof ContentState, data: unknown) => {
      setContent((prev) => ({
        ...prev,
        [store]: data,
      }));
      setIsDirty(true);
      setSaveStatus("idle");
      refreshScrollTrigger();
    },
    [refreshScrollTrigger],
  );

  const unlockWithPassword = useCallback(async (password: string) => {
    try {
      const res = await fetch("/api/auth/verify/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setIsEditing(true);
        setIsAuthModalOpen(false);
        try {
          sessionStorage.setItem(SESSION_AUTH_KEY, "true");
        } catch {
          // ignore
        }
        return { success: true };
      }
      return { success: false, error: data.error || "Incorrect password" };
    } catch {
      return { success: false, error: "Network error during password verification" };
    }
  }, []);

  const lockEditor = useCallback(() => {
    setIsEditing(false);
    setIsAuthenticated(false);
    setSelectedField(null);
    try {
      sessionStorage.removeItem(SESSION_AUTH_KEY);
    } catch {
      // ignore
    }
  }, []);

  const toggleEdit = useCallback(() => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
    } else {
      setIsEditing((prev) => !prev);
    }
  }, [isAuthenticated]);

  const saveChanges = useCallback(async () => {
    setIsSaving(true);
    setSaveStatus("saving");
    setSaveMessage("Saving to filesystem...");

    try {
      const res = await fetch("/api/content/save/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stores: content }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setIsDirty(false);
        setSaveStatus("saved");
        setSaveMessage("All changes saved to disk!");
        setTimeout(() => {
          setSaveStatus("idle");
          setSaveMessage(null);
        }, 3000);
        return true;
      } else {
        setSaveStatus("error");
        setSaveMessage(data.error || "Failed to save");
        return false;
      }
    } catch {
      setSaveStatus("error");
      setSaveMessage("Error connecting to save endpoint");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [content]);

  // Project actions
  const addNewProject = useCallback(() => {
    const newId = `project-${Date.now().toString(36)}`;
    const newProject: Project = {
      id: newId,
      title: "New Project",
      category: "Web",
      platform: "Web",
      year: new Date().getFullYear(),
      status: "In Development",
      summary: "Short summary of this project.",
      description: "Detailed description of what this project accomplishes.",
      technologies: ["React", "TypeScript"],
      image: null,
      featured: false,
    };

    setContent((prev) => ({
      ...prev,
      projects: [newProject, ...prev.projects],
    }));
    setIsDirty(true);
    setSelectedField({
      path: `projects.0`,
      label: "New Project",
      type: "project",
      value: newProject,
    });
    refreshScrollTrigger();
    return newId;
  }, [refreshScrollTrigger]);

  const deleteProject = useCallback(
    (id: string) => {
      setContent((prev) => ({
        ...prev,
        projects: prev.projects.filter((p) => p.id !== id),
      }));
      setIsDirty(true);
      setSelectedField((curr) => {
        const val = curr?.value as { id?: string } | undefined;
        return val?.id === id ? null : curr;
      });
      refreshScrollTrigger();
    },
    [refreshScrollTrigger],
  );

  // Journey actions
  const addNewJourneyItem = useCallback(() => {
    const newItem: JourneyEntry = {
      date: `${new Date().toLocaleString("en-US", { month: "short" })} ${new Date().getFullYear()}`,
      category: "main",
      title: "New Milestone",
      note: "Description of what was achieved or built.",
      tags: ["Achievement"],
    };

    setContent((prev) => ({
      ...prev,
      journey: [newItem, ...prev.journey],
    }));
    setIsDirty(true);
    setSelectedField({
      path: `journey.0`,
      label: "New Milestone",
      type: "journeyItem",
      value: newItem,
    });
    refreshScrollTrigger();
  }, [refreshScrollTrigger]);

  const deleteJourneyItem = useCallback(
    (index: number) => {
      setContent((prev) => ({
        ...prev,
        journey: prev.journey.filter((_, i) => i !== index),
      }));
      setIsDirty(true);
      setSelectedField(null);
      refreshScrollTrigger();
    },
    [refreshScrollTrigger],
  );

  // Activity actions
  const addNewActivity = useCallback(() => {
    const newId = `activity-${Date.now().toString(36)}`;
    const newActivity: Activity = {
      id: newId,
      type: "Hackathon",
      year: new Date().getFullYear().toString(),
      location: "City, Country",
      title: "New Competition / Event",
      description: "Summary of participation and outcome.",
    };

    setContent((prev) => ({
      ...prev,
      activities: [newActivity, ...prev.activities],
    }));
    setIsDirty(true);
    setSelectedField({
      path: `activities.0`,
      label: "New Activity",
      type: "activity",
      value: newActivity,
    });
    refreshScrollTrigger();
    return newId;
  }, [refreshScrollTrigger]);

  const deleteActivity = useCallback(
    (id: string) => {
      setContent((prev) => ({
        ...prev,
        activities: prev.activities.filter((a) => a.id !== id),
      }));
      setIsDirty(true);
      setSelectedField((curr) => {
        const val = curr?.value as { id?: string } | undefined;
        return val?.id === id ? null : curr;
      });
      refreshScrollTrigger();
    },
    [refreshScrollTrigger],
  );

  // Certification actions
  const addNewCert = useCallback(() => {
    const newId = `cert-${Date.now().toString(36)}`;
    const newCert: Certification = {
      id: newId,
      title: "New Certification",
      subtitle: "Course / Specialization",
      issuer: "Issuing Organization",
      year: new Date().getFullYear().toString(),
      tags: ["Certification"],
      poster: "/certificates/ccna.webp",
      file: "/certificates/ccna.pdf",
    };

    setContent((prev) => ({
      ...prev,
      certifications: [newCert, ...prev.certifications],
    }));
    setIsDirty(true);
    setSelectedField({
      path: `certifications.0`,
      label: "New Certification",
      type: "cert",
      value: newCert,
    });
    refreshScrollTrigger();
    return newId;
  }, [refreshScrollTrigger]);

  const deleteCert = useCallback(
    (id: string) => {
      setContent((prev) => ({
        ...prev,
        certifications: prev.certifications.filter((c) => c.id !== id),
      }));
      setIsDirty(true);
      setSelectedField((curr) => {
        const val = curr?.value as { id?: string } | undefined;
        return val?.id === id ? null : curr;
      });
      refreshScrollTrigger();
    },
    [refreshScrollTrigger],
  );

  // ML run actions
  const addNewMlRun = useCallback(() => {
    const newRun: MlRun = {
      model: "New Model — Fine-tune / Experiment",
      dataset: "Dataset Name",
      framework: "PyTorch",
      hardware: "GPU specs",
      training: "Batch size, epochs, lr",
      notes: "Experiment notes and findings.",
    };

    setContent((prev) => ({
      ...prev,
      ml: {
        ...prev.ml,
        runs: [...prev.ml.runs, newRun],
      },
    }));
    setIsDirty(true);
    setSelectedField({
      path: `ml.runs.${content.ml.runs.length}`,
      label: "New ML Run",
      type: "mlRun",
      value: newRun,
    });
    refreshScrollTrigger();
  }, [content.ml.runs.length, refreshScrollTrigger]);

  const deleteMlRun = useCallback(
    (index: number) => {
      setContent((prev) => ({
        ...prev,
        ml: {
          ...prev.ml,
          runs: prev.ml.runs.filter((_, i) => i !== index),
        },
      }));
      setIsDirty(true);
      setSelectedField(null);
      refreshScrollTrigger();
    },
    [refreshScrollTrigger],
  );

  const value = useMemo(
    () => ({
      isAuthenticated,
      isEditing,
      isAuthModalOpen,
      setIsAuthModalOpen,
      selectedField,
      setSelectedField,
      content,
      isDirty,
      isSaving,
      saveStatus,
      saveMessage,
      updateField,
      updateStore,
      saveChanges,
      toggleEdit,
      unlockWithPassword,
      lockEditor,
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
    }),
    [
      isAuthenticated,
      isEditing,
      isAuthModalOpen,
      selectedField,
      content,
      isDirty,
      isSaving,
      saveStatus,
      saveMessage,
      updateField,
      updateStore,
      saveChanges,
      toggleEdit,
      unlockWithPassword,
      lockEditor,
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
    ],
  );

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditor must be used within an EditorProvider");
  }
  return context;
}
