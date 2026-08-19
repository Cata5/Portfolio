import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

const VALID_STORES = [
  "site",
  "projects",
  "skills",
  "journey",
  "activities",
  "certifications",
  "ml",
  "copy",
];

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const contentDir = path.join(process.cwd(), "content");

    // Ensure content directory exists
    await fs.mkdir(contentDir, { recursive: true });

    const saved: string[] = [];

    // Support single store save or multi-store batch save
    if (payload.store && payload.data !== undefined) {
      if (!VALID_STORES.includes(payload.store)) {
        return NextResponse.json(
          { success: false, error: `Invalid store: ${payload.store}` },
          { status: 400 },
        );
      }
      const filePath = path.join(contentDir, `${payload.store}.json`);
      await fs.writeFile(filePath, JSON.stringify(payload.data, null, 2), "utf8");
      saved.push(payload.store);
    } else if (payload.stores && typeof payload.stores === "object") {
      for (const [store, data] of Object.entries(payload.stores)) {
        if (VALID_STORES.includes(store)) {
          const filePath = path.join(contentDir, `${store}.json`);
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

    return NextResponse.json({ success: true, saved });
  } catch (err) {
    console.error("Failed to save content:", err);
    return NextResponse.json(
      { success: false, error: "Failed to write content to disk" },
      { status: 500 },
    );
  }
}
