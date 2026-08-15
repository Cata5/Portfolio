import { mulberry32, pickColor } from "@/lib/triangles";

/*
 * A second, much quieter cloud of the same triangle material that fills the
 * negative space of the whole page. Three depth layers (far / mid / near),
 * natural clustering with empty regions, extremely slow independent drift,
 * and parallax that scales with depth. It never competes with the forms.
 */

export type Ambient = {
  bx: number;
  by: number;
  bz: number;
  size: number;
  speed: number;
  ph: number;
  dir: number;
  rot: number;
  rotSpeed: number;
  color: number;
  pull: number; // 0..1 — a few pieces lean toward the main structure mid-dispersion
  layer: number; // 0 far · 1 mid · 2 near
};

export function buildAmbient(count: number): Ambient[] {
  const rand = mulberry32(7733551);
  // Clusters now reach edge-to-edge: four clusters pin the left/right margins
  // (centered just inside the viewport edge, so they fill the sides instead of
  // pooling mid-screen), and the rest scatter across the middle — the cloud
  // spans the full page width. Seeded, so the arrangement is reproducible.
  const sideCluster = (side: number) => ({
    x: side * (1.55 + rand() * 0.3),
    y: (rand() - 0.5) * 1.7,
    r: 0.18 + rand() * 0.45,
  });
  const clusters = [
    sideCluster(-1),
    sideCluster(-1),
    sideCluster(1),
    sideCluster(1),
    { x: (rand() - 0.5) * 1.1, y: (rand() - 0.5) * 1.5, r: 0.18 + rand() * 0.5 },
    { x: (rand() - 0.5) * 1.1, y: (rand() - 0.5) * 1.5, r: 0.18 + rand() * 0.5 },
    { x: (rand() - 0.5) * 1.9, y: (rand() - 0.5) * 1.8, r: 0.16 + rand() * 0.45 },
  ];
  const pts: Ambient[] = [];
  for (let i = 0; i < count; i++) {
    let bx: number;
    let by: number;
    if (rand() < 0.88) {
      const c = clusters[Math.floor(rand() * clusters.length)];
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * c.r;
      bx = c.x + Math.cos(a) * r;
      by = c.y + Math.sin(a) * r * 0.8;
    } else {
      // Wide scatter — lone motes reach both edges too.
      bx = (rand() - 0.5) * 4.4;
      by = (rand() - 0.5) * 1.8;
    }
    const layer = rand() < 0.45 ? 0 : rand() < 0.8 ? 1 : 2;
    const bz =
      layer === 0
        ? 0.05 + rand() * 0.25
        : layer === 1
          ? 0.3 + rand() * 0.35
          : 0.65 + rand() * 0.3;
    pts.push({
      bx,
      by,
      bz,
      size: (layer === 0 ? 1.4 : layer === 1 ? 2.0 : 2.8) + rand() * 1.1,
      speed: 0.02 + rand() * 0.06,
      ph: rand() * Math.PI * 2,
      dir: rand() * Math.PI * 2,
      rot: rand() * Math.PI,
      rotSpeed: (rand() - 0.5) * 0.06,
      color: pickColor(rand()),
      pull: rand() < 0.2 ? 0.35 + rand() * 0.65 : 0,
      layer,
    });
  }
  return pts;
}
