import { projects, type Project } from "@/data/projects";

/**
 * Honesty notes for projects whose source is not public. The projects.json
 * "limitations" arrays are technical limitations; these are disclosure notes
 * about the code itself. Kept separate so content edits and disclosure edits
 * don't collide.
 */
export const sourceAvailability: Partial<Record<Project["id"], string>> = {
  cheltuieli: "Source is not public - walks through a real client project. Happy to show the code privately or discuss it in an interview.",
  "apps-manager": "Source is not public. Happy to show the code privately or discuss it in an interview.",
  "dataset-generator": "Source is not public. Happy to show the code privately or discuss it in an interview.",
  detectie: "Source is not public. Happy to show the code privately or discuss it in an interview.",
  coraltech: "Client project - source not public. Happy to walk through the code privately.",
  "yolo-trainer": "Source is not public. Happy to show the code privately or discuss it in an interview.",
  siteauto: "Source is not public. Happy to show the code privately or discuss it in an interview.",
  "llm-finetuner": "Source is not public. Happy to show the code privately or discuss it in an interview.",
  neuroshell: "Source is not public. Happy to show the code privately or discuss it in an interview.",
  "ocr-pdf": "Source is not public. Happy to show the code privately or discuss it in an interview.",
};

const byId = new Map(projects.map((p) => [p.id, p]));

/**
 * Returns the project's limitations with the source-availability note
 * appended (when applicable) so the "Known limitations" list reads as
 * honest disclosure rather than hiding where the code lives.
 */
export function limitationsWithSource(project: Project): string[] {
  const base = project.limitations ?? [];
  const note = sourceAvailability[project.id];
  if (!note || !byId.has(project.id)) return base;
  return [...base, note];
}
