import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { extractBearerToken, verifyAdminAuth } from "@/lib/auth-guard";
import { queryCache } from "@/lib/rag/caching/query-cache";

const VALID_STORES: Record<string, string> = {
  site: "site.json",
  projects: "projects.json",
  skills: "skills.json",
  journey: "journey.json",
  activities: "activities.json",
  certifications: "certifications.json",
  ml: "ml.json",
  roadmap: "roadmap.json",
  copy: "copy.json",
  sections: "sections.json",
  offlineThemes: "offline-themes.json",
  "offline-themes": "offline-themes.json",
};

export async function POST(request: Request) {
  try {
    const token = extractBearerToken(request);
    if (!verifyAdminAuth(token)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Valid admin credentials required" },
        { status: 401 },
      );
    }

    const payload = await request.json();
    const contentDir = path.join(process.cwd(), "content");

    // Ensure content directory exists
    await fs.mkdir(contentDir, { recursive: true });

    const saved: string[] = [];

    // Support single store save or multi-store batch save
    if (payload.store && payload.data !== undefined) {
      const fileName = VALID_STORES[payload.store];
      if (!fileName) {
        return NextResponse.json(
          { success: false, error: `Invalid store: ${payload.store}` },
          { status: 400 },
        );
      }
      const filePath = path.join(contentDir, fileName);
      await fs.writeFile(filePath, JSON.stringify(payload.data, null, 2), "utf8");
      saved.push(payload.store);
    } else if (payload.stores && typeof payload.stores === "object") {
      for (const [store, data] of Object.entries(payload.stores)) {
        const fileName = VALID_STORES[store];
        if (fileName) {
          const filePath = path.join(contentDir, fileName);
          await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
          saved.push(store);
        }
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Missing store or stores in request body" },
        { status: 400 },
      );
    }

    // Content changed on disk: cached answers referencing it are stale.
    queryCache.clear();

    return NextResponse.json({ success: true, saved });
  } catch (err) {
    console.error("Failed to save content:", err);
    return NextResponse.json(
      { success: false, error: "Failed to write content to disk" },
      { status: 500 },
    );
  }
}
