import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";

const CDP = "http://localhost:9222";
const PROFILE = "/tmp/freeze-check";
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
await sleep(9000);

const evalJs = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  return r.result?.result?.value;
};

// Full + core diff over 1.5s, and the warm-pixel centroid (galaxy body).
const measure = () => evalJs(`(async () => {
  const c = document.querySelector('canvas');
  const ctx = c.getContext('2d');
  const { width: w, height: h } = c;
  const grab = () => ctx.getImageData(0, 0, w, h).data;
  const a = grab();
  const c0 = grab();
  // warm centroid now
  let wx = 0, wy = 0, wn = 0;
  for (let y = 0; y < h; y += 3) {
    for (let x = 0; x < w; x += 3) {
      const i = (y * w + x) * 4;
      if (c0[i + 3] < 140) continue;
      if (c0[i] > 150 && c0[i + 1] > 90 && c0[i + 2] < 150) { wx += x; wy += y; wn++; }
    }
  }
  await new Promise((r) => setTimeout(r, 1500));
  const b = grab();
  let full = 0, core = 0, coreTotal = 0;
  const x0 = Math.round(w * 0.35), y0 = Math.round(h * 0.3), x1 = Math.round(w * 0.65), y1 = Math.round(h * 0.7);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const d = Math.abs(a[i]-b[i])>12 || Math.abs(a[i+1]-b[i+1])>12 || Math.abs(a[i+2]-b[i+2])>12 || Math.abs(a[i+3]-b[i+3])>12;
      if (d) full++;
      if (x >= x0 && x < x1 && y >= y0 && y < y1) {
        coreTotal++;
        if (d) core++;
      }
    }
  }
  return {
    fullPct: +((full / (w * h)) * 100).toFixed(3),
    corePct: +((core / coreTotal) * 100).toFixed(3),
    centroid: wn ? [Math.round(wx / wn), Math.round(wy / wn)] : null,
  };
})()`);

// Scroll to the About section centre, settle fully, measure twice 6s apart.
await send("Runtime.evaluate", { expression: `(() => {
  const el = document.getElementById('about');
  window.scrollTo(0, el.offsetTop + 400);
})()` });
await sleep(5000);
console.log("t0:", JSON.stringify(await measure()));
await sleep(6000);
console.log("t+6s:", JSON.stringify(await measure()));
process.exit(0);
