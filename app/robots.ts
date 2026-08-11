import type { MetadataRoute } from "next";

import { site } from "@/data/site";

// Required for `output: "export"` (GitHub Pages build) — the route is
// generated at build time into a static robots.txt.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${site.url.replace(/\/$/, "")}/sitemap.xml`,
  };
}
