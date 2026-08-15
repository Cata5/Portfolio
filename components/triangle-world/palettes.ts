/**
 * The world's colour palettes. The shared palette is the site's material;
 * the earth, black hole and galaxy each add a dedicated realistic palette
 * indexed after it in one batch key space (see world.tsx). Exported so any
 * page-level code can reference the shared world palette.
 */

// Exported so any page-level code can reference the shared world palette.
export const DARK_PALETTE = [
  "#8052ff", // electric iris — dominant (the portfolio's brand accent)
  "#b88815", // amber
  "#8d47b1", // magenta
  "#378877", // teal
  "#bc7899", // rose
  "#3a749d", // blue
  "#427548", // green
];
export const LIGHT_PALETTE = [
  "#5b2fd6",
  "#8a6410",
  "#6b2f8f",
  "#0f766e",
  "#8f4d63",
  "#1d4ed8",
  "#2f5d3a",
];
export const DARK_GLOW_RGB = "160,130,255"; // atmosphere rim + twinkles
export const LIGHT_GLOW_RGB = "91,47,214";

export const EARTH_DARK = [
  "#2e6da0", // ocean
  "#4f7d47", // forest
  "#7a8a3d", // olive
  "#a8905e", // savanna / tan
  "#c0a878", // sand / desert
  "#6b7f6e", // mountain slate
];
export const EARTH_LIGHT = [
  "#3b82c4", // ocean
  "#4c8f46", // forest
  "#8a9a4a", // olive
  "#b39a68", // savanna / tan
  "#d4bc88", // sand / desert
  "#7f9384", // mountain slate
];

/*
 * Realistic accretion-disc tones — white-hot inner edge cooling through
 * gold and orange to ember at the outer rim, the way a real accretion flow
 * radiates. The black hole's sphere matter (and the overscroll climax's
 * debris) draws in these colours, indexed after the shared palette.
 */
export const HOLE_DARK = [
  "#ffffff", // 0 pure white-hot thermal plasma at the ISCO / photon ring
  "#fff4d4", // 1 incandescent gold
  "#ffcb5c", // 2 bright solar amber
  "#ff9838", // 3 plasma orange
  "#e65c27", // 4 fiery vermilion
  "#9c2416", // 5 gravitationally redshifted crimson
  "#3a0b06", // 6 deep infrared boundary
];
export const HOLE_LIGHT = [
  "#ffffff",
  "#faebd0",
  "#ebbd52",
  "#d67e2a",
  "#be4b1e",
  "#801e12",
  "#300905",
];
/** Warm incandescent photon-ring / Einstein ring light. */
export const HOLE_RIM_RGB = "255, 214, 140";

/*
 * Authentic astrophotography galaxy tones (derived from Hubble & JWST captures):
 * - Brilliant white nuclear core & creamy golden nuclear bulge (Population II stars)
 * - Warm amber stellar bar
 * - Soft diffuse disc starlight
 * - Radiant electric azure & diamond cyan-white young OB star clusters
 * - Vivid magenta-pink & hot ruby H-alpha emission nebulae (active starburst regions)
 * - Deep reddish-brown/charcoal interstellar dust absorption lanes
 * - Faint silver-blue outer halo & globular clusters
 */
export const GALAXY_DARK = [
  "#ffffff", // 0 nuclear core — ultra-luminous incandescent white
  "#ffe39f", // 1 creamy golden core bulge (Population II giants)
  "#f5c873", // 2 warm amber stellar bar
  "#dcd2c4", // 3 diffuse disk — warm ivory starlight
  "#82c8ff", // 4 electric azure young star clusters
  "#b8e2ff", // 5 luminous diamond cyan-white OB associations
  "#ff529a", // 6 vibrant magenta-pink H-alpha emission nebulae
  "#e02868", // 7 hot ruby starburst knots
  "#200d05", // 8 dark chocolate/charcoal interstellar dust lanes
  "#9fbddc", // 9 ethereal silver-blue halo & globular clusters
];
export const GALAXY_LIGHT = [
  "#ffffff",
  "#f5e8c4",
  "#e2be6c",
  "#aba090",
  "#4589d6",
  "#62a8e8",
  "#d83e78",
  "#b82054",
  "#281008",
  "#6d87a4",
];
/** Radiant blue-white starlight glow for the galactic disc halo. */
export const GALAXY_GLOW_RGB = "130, 200, 255";

/*
 * Authentic solar system tones (derived from NASA & JPL planetary captures):
 * - Sun: incandescent gold-white & solar amber
 * - Mercury: slate basalt gray
 * - Venus: sulfuric pearl gold
 * - Earth & Moon: azure blue ocean & white clouds
 * - Mars: rusty iron-red
 * - Asteroid Belt: dark rocky graphite
 * - Jupiter: banded amber-tan
 * - Saturn & Rings: pale gold & glowing cyan/gold ice rings
 * - Uranus & Neptune: cyan & royal azure ice giants
 * - Kuiper Belt & Orbit Tracks: ethereal celestial blue-gray lines
 */
export const SOLAR_DARK = [
  "#ffffff", // 0 Sun core — incandescent white
  "#ffda73", // 1 Sun corona — solar gold
  "#ff9838", // 2 Sun prominence — fiery amber
  "#9fa0a6", // 3 Mercury — slate basalt
  "#e8cf92", // 4 Venus — sulfuric cream
  "#3b82c4", // 5 Earth — azure ocean
  "#c85a38", // 6 Mars — iron rust red
  "#5a5550", // 7 Asteroids — dark graphite
  "#d49f50", // 8 Jupiter — banded amber
  "#ebd89e", // 9 Saturn — golden gas giant
  "#8fe6ea", // 10 Saturn Rings — luminous cyan/gold ice rings
  "#58d5db", // 11 Uranus — cyan ice giant
  "#3866d8", // 12 Neptune — royal azure ice giant
  "#8aaecf", // 13 Kuiper Belt & Orbit Tracks — ethereal celestial lines
];
export const SOLAR_LIGHT = [
  "#ffffff",
  "#e5b842",
  "#d67822",
  "#7a7b80",
  "#c4ab6e",
  "#2868a4",
  "#a84424",
  "#44403c",
  "#b37f34",
  "#caa864",
  "#48a8ac",
  "#32a4aa",
  "#264ca8",
  "#6286a6",
];
/** Warm solar corona glow RGB. */
export const SUN_CORONA_RGB = "255, 200, 80";

/*
 * Authentic 3D neural AI brain tones:
 * - Electric cyan & neon teal synaptic flashes
 * - Luminous royal violet & deep indigo neural cortex
 * - Vivid magenta/pink action potentials & neural axon fibers
 * - Diamond white firing synapses
 * - Deep neural dark matter
 */
export const BRAIN_DARK = [
  "#ffffff", // 0 firing synapse — brilliant white
  "#00f0ff", // 1 active axon — electric cyan
  "#38bdf8", // 2 cortical network — neon sky blue
  "#818cf8", // 3 neural pathways — electric periwinkle
  "#a855f7", // 4 cerebral cortex — royal neon violet
  "#c084fc", // 5 synaptic vesicle — luminous lavender
  "#f43f5e", // 6 action potential — neural pink
  "#1e1b4b", // 7 deep sulcus — deep neural indigo
];
export const BRAIN_LIGHT = [
  "#ffffff",
  "#0284c7",
  "#0369a1",
  "#4338ca",
  "#6d28d9",
  "#7e22ce",
  "#be123c",
  "#1e1b4b",
];
/** Glowing electric cyan / violet neural synapse glow. */
export const BRAIN_GLOW_RGB = "0, 240, 255";

