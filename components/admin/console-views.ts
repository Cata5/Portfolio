/**
 * The console's information architecture, in one place.
 *
 * The admin console is an operations surface: it owns the RAG engine, page
 * structure and deployment. Narrative content (projects, skills, ML logs,
 * journey, copy) is edited in place on the public site with the inline editor,
 * not here — so it deliberately has no home in this list.
 */

export type AdminView =
  | "overview"
  | "rag-pipeline"
  | "rag-eval"
  | "rag-kb"
  | "rag-source"
  | "rag-models"
  | "sections"
  | "identity"
  | "ops";

export type AdminViewGroup = "System" | "RAG engine" | "Structure" | "Site";

export interface AdminViewMeta {
  id: AdminView;
  label: string;
  /** Short line shown under the view title in the command bar. */
  description: string;
  group: AdminViewGroup;
}

export const ADMIN_VIEW_GROUP_ORDER: AdminViewGroup[] = [
  "System",
  "RAG engine",
  "Structure",
  "Site",
];

export const ADMIN_VIEWS: AdminViewMeta[] = [
  {
    id: "overview",
    label: "Overview",
    description:
      "Engine health, index size and content-store counts for the whole system.",
    group: "System",
  },
  {
    id: "rag-pipeline",
    label: "Pipeline & traces",
    description:
      "Every stage of a retrieval run, from query rewrite to grounded answer.",
    group: "RAG engine",
  },
  {
    id: "rag-eval",
    label: "Evaluation",
    description:
      "Five-way benchmark of the retrieval strategies against the eval set.",
    group: "RAG engine",
  },
  {
    id: "rag-kb",
    label: "Knowledge base",
    description: "Indexed documents, chunks and re-indexing controls.",
    group: "RAG engine",
  },
  {
    id: "rag-source",
    label: "Source explorer",
    description: "The raw evidence behind a retrieved answer.",
    group: "RAG engine",
  },
  {
    id: "rag-models",
    label: "Models & parameters",
    description: "Local inference endpoint, sampling parameters and retrieval budget.",
    group: "RAG engine",
  },
  {
    id: "sections",
    label: "Page sections",
    description:
      "Order, visibility and layout of the sections on the public homepage.",
    group: "Structure",
  },
  {
    id: "identity",
    label: "Identity & links",
    description:
      "Name, headline, contact links and social profiles used across the site.",
    group: "Site",
  },
  {
    id: "ops",
    label: "Deploy & offline mode",
    description:
      "Static-deploy simulation, standby interface presets and their copy.",
    group: "Site",
  },
];

export const ADMIN_VIEW_IDS: AdminView[] = ADMIN_VIEWS.map((v) => v.id);

export function isAdminView(value: string | null | undefined): value is AdminView {
  return Boolean(value) && ADMIN_VIEW_IDS.includes(value as AdminView);
}
