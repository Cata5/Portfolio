import { SECTION_TYPE_META, sections as defaultSections, type PageSection } from "@/data/sections";

export interface NavLink {
  label: string;
  /** Anchor target id (without "#"). */
  target: string;
  /** Ready-to-use href ("#target" on the homepage, basePath-prefixed elsewhere). */
  href: string;
}

/**
 * The nav anchors always exist on the homepage, and the section set is fixed —
 * so nav labels must never depend on CMS-owned fields. A CMS save once stripped
 * `navLabel` from every section in content/sections.json and the deploy shipped
 * an empty production nav. This helper therefore falls back to the hardcoded
 * SECTION_TYPE_META default for every section, making the nav CMS-proof.
 */
export function buildNavLinks(pageSections?: PageSection[]): NavLink[] {
  const sections = pageSections?.length ? pageSections : defaultSections;
  return sections
    .filter((s) => s.enabled && s.type !== "hero" && s.type !== "custom")
    .map((s) => ({
      label: s.navLabel || SECTION_TYPE_META[s.type]?.defaultNavLabel || s.name,
      target: s.type === "featured-projects" ? "work" : s.id,
      href: s.type === "featured-projects" ? "#work" : `#${s.id}`,
    }));
}
