"use client";

import { useEditor } from "@/components/editor/editor-context";
import { Field, Panel, controlClass } from "@/components/admin/console-ui";

/**
 * Site-wide identity and links. These fields have no single section on the
 * homepage (they surface in the header, footer, SEO metadata and social
 * previews), so they live in the console rather than the inline editor.
 */
export function SitePanel() {
  const { content, updateField } = useEditor();
  const site = content.site;

  return (
    <div className="space-y-5">
      <Panel
        title="Identity"
        description="How you are introduced in the hero, page titles and search results."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <input
              type="text"
              value={site?.name ?? ""}
              onChange={(e) => updateField("site.name", e.target.value)}
              className={controlClass}
            />
          </Field>
          <Field label="Role / headline">
            <input
              type="text"
              value={site?.role ?? ""}
              onChange={(e) => updateField("site.role", e.target.value)}
              className={controlClass}
            />
          </Field>
          <Field
            label="Meta description"
            hint="search + social previews"
            className="sm:col-span-2"
          >
            <textarea
              rows={2}
              value={site?.description ?? ""}
              onChange={(e) => updateField("site.description", e.target.value)}
              className={controlClass}
            />
          </Field>
          <Field label="Tagline" className="sm:col-span-2">
            <textarea
              rows={3}
              value={site?.tagline ?? ""}
              onChange={(e) => updateField("site.tagline", e.target.value)}
              className={controlClass}
            />
          </Field>
        </div>
      </Panel>

      <Panel
        title="Contact & profiles"
        description="Rendered in the contact section, footer, and structured data."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Email">
            <input
              type="email"
              value={site?.email ?? ""}
              onChange={(e) => updateField("site.email", e.target.value)}
              className={controlClass}
            />
          </Field>
          <Field label="Canonical URL">
            <input
              type="text"
              value={site?.url ?? ""}
              onChange={(e) => updateField("site.url", e.target.value)}
              className={controlClass}
            />
          </Field>
          <Field label="GitHub">
            <input
              type="text"
              value={site?.github ?? ""}
              onChange={(e) => updateField("site.github", e.target.value)}
              className={controlClass}
            />
          </Field>
          <Field label="LinkedIn">
            <input
              type="text"
              value={site?.linkedin ?? ""}
              onChange={(e) => updateField("site.linkedin", e.target.value)}
              className={controlClass}
            />
          </Field>
          <Field label="Instagram">
            <input
              type="text"
              value={site?.instagram ?? ""}
              onChange={(e) => updateField("site.instagram", e.target.value)}
              className={controlClass}
            />
          </Field>
          <Field label="Repository source">
            <input
              type="text"
              value={site?.source ?? ""}
              onChange={(e) => updateField("site.source", e.target.value)}
              className={controlClass}
            />
          </Field>
        </div>
      </Panel>

      <Panel
        title="Current status pill"
        description="The small “currently building” widget in the hero."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Label">
            <input
              type="text"
              value={site?.currently?.label ?? ""}
              onChange={(e) => updateField("site.currently.label", e.target.value)}
              className={controlClass}
            />
          </Field>
          <Field label="Project">
            <input
              type="text"
              value={site?.currently?.project ?? ""}
              onChange={(e) => updateField("site.currently.project", e.target.value)}
              className={controlClass}
            />
          </Field>
          <Field label="Stack">
            <input
              type="text"
              value={site?.currently?.stack ?? ""}
              onChange={(e) => updateField("site.currently.stack", e.target.value)}
              className={controlClass}
            />
          </Field>
          <Field label="Status">
            <input
              type="text"
              value={site?.currently?.status ?? ""}
              onChange={(e) => updateField("site.currently.status", e.target.value)}
              className={controlClass}
            />
          </Field>
        </div>
      </Panel>
    </div>
  );
}
