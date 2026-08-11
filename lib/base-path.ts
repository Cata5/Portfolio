/**
 * GitHub Pages serves this repo as a *project site* at /Portofolio-V2/, so
 * every absolute URL must carry that prefix in the deployed build.
 *
 * This file is the single source of truth for the deploy base path — the
 * build config (next.config.ts), the next/image loader (lib/image-loader.ts)
 * and raw `<a href>` anchors all derive it from here.
 *
 * next/image (custom loader) and next/link handle the prefix automatically;
 * withBasePath exists for raw anchors (certificate PDFs, the custom
 * ProjectLink wrapper). In dev and normal deploys (no
 * NEXT_PUBLIC_DEPLOY_TARGET=gh-pages) everything is a pass-through.
 */
export const isGhPages =
  process.env.NEXT_PUBLIC_DEPLOY_TARGET === "gh-pages";

/** Base path prefix for the GitHub Pages build (empty elsewhere). */
export const BASE_PATH = isGhPages ? "/Portofolio-V2" : "";

/**
 * Prefix an internal absolute path with the GitHub Pages base path.
 * External schemes (http, mailto, tel, data) and relative paths are left
 * untouched; already-prefixed paths are idempotent.
 */
export function withBasePath(href: string): string {
  if (!BASE_PATH) return href;
  if (/^(https?:|mailto:|tel:|data:)/i.test(href)) return href;
  if (!href.startsWith("/")) return href;
  if (href === BASE_PATH || href.startsWith(`${BASE_PATH}/`)) return href;
  return `${BASE_PATH}${href}`;
}
