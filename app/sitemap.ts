import type { MetadataRoute } from "next";

import { realProjects } from "@/data/projects";
import { site } from "@/data/site";

// Required for `output: "export"` (GitHub Pages build) — the route is
// generated at build time into a static sitemap.xml.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url.replace(/\/$/, "");
  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    ...realProjects.map((p) => ({
      url: `${base}/projects/${p.id}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
