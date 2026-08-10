import { ImageResponse } from "next/og";

import { site } from "@/data/site";

export const alt = `${site.name} — ${site.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0c0b0a",
          color: "#ede9e3",
          padding: 64,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 12, height: 12, background: "#ff5c1a" }} />
          <span
            style={{
              fontSize: 20,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#938c82",
            }}
          >
            {site.role}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span
            style={{
              fontSize: 104,
              fontWeight: 700,
              letterSpacing: -3,
              lineHeight: 1,
            }}
          >
            {site.name}
          </span>
          <span
            style={{
              fontSize: 26,
              color: "#938c82",
              maxWidth: 680,
              lineHeight: 1.45,
            }}
          >
            {site.tagline}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            gap: 28,
            borderTop: "1px solid #26221a",
            paddingTop: 24,
            fontSize: 18,
            color: "#938c82",
          }}
        >
          <span>web</span>
          <span>ml</span>
          <span>android</span>
          <span>backend</span>
        </div>
      </div>
    ),
    size,
  );
}
