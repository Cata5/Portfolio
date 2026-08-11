import { spawn } from "node:child_process";

const chrome = spawn(
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--remote-debugging-port=9339",
    "--user-data-dir=C:/Users/Public/pace-chrome-profile",
    "about:blank",
  ],
  { stdio: "ignore" },
);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJson(url) {
  const res = await fetch(url);
  return res.json();
}
let ws;
async function connect() {
  for (let i = 0; i < 40; i++) {
    try {
      const list = await getJson("http://localhost:9339/json/list");
      const page = list.find((t) => t.type === "page");
      if (page) {
        ws = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((r, j) => {
          ws.onopen = r;
          ws.onerror = j;
        });
        return;
      }
    } catch {}
    await sleep(250);
  }
  throw new Error("no chrome target");
}
let msgId = 0;
const pending = new Map();
function wire() {
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m);
      pending.delete(m.id);
    }
  };
}
function send(method, params = {}) {
  return new Promise((r) => {
    const id = ++msgId;
    pending.set(id, r);
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evalJs(expression) {
  const r = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return r.result?.result?.value;
}

await connect();
wire();
await send("Runtime.enable");
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await send("Page.navigate", { url: "http://localhost:3001" });
await sleep(5000);

const geo = await evalJs(`(() => {
  const pick = (id) => { const el = document.getElementById(id); return el ? el.getBoundingClientRect().top + window.scrollY : 0; };
  const about = pick('about'), work = pick('work'), stack = pick('stack'),
    ml = pick('ml-notebook') || pick('ml') || 0,
    contact = pick('contact');
  const footer = document.querySelector('footer') ? document.querySelector('footer').getBoundingClientRect().top + window.scrollY : 0;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const ih = window.innerHeight;
  // Mirror the current halfW formula
  const raw = [about, work, stack, ml, contact, footer];
  const B = raw.map((v, i) => {
    if (i === 4) return Math.min(v, Math.max(maxScroll - 0.85 * ih, raw[3] + 1.2 * ih));
    return v;
  });
  const halfW = B.map((b, i) => {
    const prevGap = i === 0 ? b : b - B[i - 1];
    const nextGap = i === B.length - 1 ? Math.max(prevGap, ih) : B[i + 1] - b;
    const room = Math.max(1, Math.min(prevGap, nextGap));
    const roomVH = room / ih;
    const wVH = Math.max(0.55, Math.min(1.4, roomVH * 0.45));
    return Math.min(room / 2, wVH * ih);
  });
  const spans = B.map((b, i) => {
    const start = i === 0 ? 0 : B[i - 1] + halfW[i - 1];
    const end = b - halfW[i];
    return { form: ['earth','orbit','spiral','wave','brain','final'][i], start: Math.round(start), end: Math.round(end), life: Math.round(Math.max(0, end - start)) };
  });
  return { maxScroll, about, work, stack, ml, contact, footer, spans,
    pct: spans.map((s) => ({ ...s, pct: (s.life / maxScroll * 100).toFixed(1) })) };
})()`);
console.log(JSON.stringify(geo, null, 1));
chrome.kill();
process.exit(0);
