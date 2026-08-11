/**
 * Custom next/image loader for the GitHub Pages static export.
 *
 * Static export cannot use the default image optimizer, and in this Next
 * version next/image does not automatically prefix `basePath` — so this
 * loader returns every local image with the `/Portofolio-V2` prefix (and the
 * source unchanged in dev, where basePath is off). Remote/data URLs pass
 * through untouched. Images ship as-is: the loader is used for URL building
 * only, so width/quality are intentionally unused.
 */
import { BASE_PATH } from "./base-path";

export default function imageLoader({
  src,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  if (src.startsWith("http") || src.startsWith("data:")) return src;
  return `${BASE_PATH}${src}`;
}
