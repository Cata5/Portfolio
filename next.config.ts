import type { NextConfig } from "next";

// GitHub Pages build — the deploy workflow sets NEXT_PUBLIC_DEPLOY_TARGET=gh-pages.
// This repo publishes as a *project site* at https://cata5.github.io/Portofolio-V2/,
// so the build switches to a full static export: `output: "export"` emits `out/`,
// `basePath` + `assetPrefix` prefix every link and asset with the sub-path, and
// `trailingSlash: true` emits `<route>/index.html` files that GitHub Pages can
// serve directly. Static export cannot use the default image optimizer, and in
// this Next version next/image does NOT auto-prefix basePath — so a tiny custom
// loader (lib/image-loader.ts) renders every image with the basePath prefix.
const isGhPages = process.env.NEXT_PUBLIC_DEPLOY_TARGET === "gh-pages";
const BASE_PATH = "/Portofolio-V2";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.101.11"],
  ...(isGhPages
    ? {
        output: "export" as const,
        basePath: BASE_PATH,
        assetPrefix: `${BASE_PATH}/`,
        trailingSlash: true,
        images: {
          loader: "custom" as const,
          loaderFile: "./lib/image-loader.ts",
        },
      }
    : {}),
};

export default nextConfig;
