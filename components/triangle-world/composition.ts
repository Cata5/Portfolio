import { finalForm } from "./black-hole";
import { brainForm } from "./brain";
import { earthForm } from "./earth";
import { galaxyForm } from "./galaxy";
import { solarForm } from "./solar";
import { waveForm } from "./wave";
import type { FormFn } from "./types";

/** Composition — screen-x fraction (earth uses a responsive value), screen-y fraction, zoom, size. */
export type FormDef = {
  key: string;
  cx: number;
  oy: number;
  zoom: number;
  size: number;
};

/** The six forms in scroll order — the scene's shape sequence. */
export const FORMS: FormDef[] = [
  { key: "earth", cx: 0, oy: 0.5, zoom: 1, size: 1 },
  { key: "galaxy", cx: 0.5, oy: 0.48, zoom: 1.05, size: 1 },
  { key: "brain", cx: 0.68, oy: 0.50, zoom: 1.38, size: 1.18 },
  { key: "wave", cx: 0.5, oy: 0.34, zoom: 1, size: 0.9 },
  { key: "solar", cx: 0.5, oy: 0.5, zoom: 1, size: 1 },
  { key: "final", cx: 0.84, oy: 0.5, zoom: 0.9, size: 0.9 },
];

/** boundary[i] = the scroll position where form i hands over to form i+1. */
export const BOUNDARY_KEYS: ("about" | "work" | "stack" | "ml" | "contact" | "footer")[] = [
  "about",
  "work",
  "stack",
  "ml",
  "contact",
  "footer",
];

/** The layout functions, in the same order as FORMS. */
export const FORM_FNS: FormFn[] = [
  (p, _t, wR) => earthForm(p, wR),
  (p, t) => galaxyForm(p, t),
  (p, t) => brainForm(p, t),
  (p, t) => waveForm(p, t),
  (p, t) => solarForm(p, t),
  (p, t) => finalForm(p, t),
];
