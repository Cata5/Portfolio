import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";

const CDP = "http://localhost:9222";
const PROFILE = "/tmp/gal-check";
mkdirSync(PROFILE, { recursive: true });

const chrome = spawn(
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  [
    "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
    "--disable-background-networking", "--window-size=1440,900",
    "--user-data-dir=" + PROFILE, "--remote-debugging-port=9222", "about:blank",
  ],
  { detached: true, stdio: "ignore" }
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitFor = async (fn, ms = 25000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { const v = await fn(); if (v) return v; } catch {}
    await sleep(300);
  }
  throw new Error("timeout");
};

await waitFor(async () => (await (await fetch(CDP + "/json")).json()).some((p) => p.type === "page"));
const pages = await (await fetch(CDP + "/json")).json();
const page = pages.find((p) => p.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));

let id = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
};
const send = (method, params = {}) => new Promise((res) => {
  const mid = ++id; pending.set(mid, res);
  ws.send(JSON.stringify({ id: mid, method, params }));
});

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: "http://localhost:3000/" });
await sleep(6000);

const evalJs = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true });
  return r.result?.result?.value;
};

// Roundness metrics on bright pixels: bbox aspect, plus radial fill — the
// fraction of the galaxy's bounding circle radius that holds 90% of pixels.
const metrics = () => evalJs(`(() => {
  const c = document.querySelector('canvas');
  const ctx = c.getContext('2d');
  const { width: w, height: h } = c;
  const img = ctx.getImageData(0, 0, w, h).data;
  let minX = w, maxX = 0, minY = h, maxY = 0;
  const pts = [];
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      if (img[(y * w + x) * 4 + 3] < 150) continue;
      pts.push([x, y]);
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  if (pts.length < 50) return { count: pts.length };
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const rs = pts.map(([x, y]) => Math.hypot(x - cx, y - cy)).sort((a, b) => a - b);
  const r90 = rs[Math.floor(rs.length * 0.9)];
  const rMax = rs[rs.length - 1];
  return {
    count: pts.length,
    aspect: +(((maxY - minY) / (maxX - minX)).toFixed(3)),
    // how much of the outer radius the bulk fills (1 = disc-like, low = spiky)
    fill: +(r90 / rMax).toFixed(3),
  };
})()`);

// Scroll to the middle of the About section — the galaxy's steady state.
await send("Runtime.evaluate", { expression: `(() => {
  const el = document.getElementById('about');
  if (el) window.scrollTo(0, el.offsetTop + 300);
})()` });
await sleep(2500);
console.log("baseline:", JSON.stringify(await metrics()));

// Sweep page time: 0 → 40s in steps; the arms wind via differential rotation.
for (let i = 0; i <= 8; i++) {
  await send("Emulation.setVirtualTimePolicy", { policy: "advance", budget: i === 0 ? 0 : 5000 });
  await sleep(800);
  const t = await evalJs("Math.round(performance.now() / 1000)");
  const m = await metrics();
  console.log(`s=${t} count=${m.count} aspect=${m.aspect} fill=${m.fill}`);
}
process.exit(0);
