const fs = require("fs");
const path = require("path");
const projects = require(path.join(__dirname, "..", "content", "projects.json"));

const names = new Set();
function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p);
    else names.add(p.split(path.sep).join("/").replace(/^.*public\//, "/"));
  }
}
walk(path.join(__dirname, "..", "public"));

let missing = 0;
for (const p of projects) {
  const refs = [p.image, ...(p.screenshots || []), p.deviceShot, ...(p.runtimes || []).map((r) => r.shot)].filter(Boolean);
  for (const r of refs) {
    if (!names.has(r)) {
      console.log("MISSING:", p.id, "->", r);
      missing++;
    }
  }
}
console.log(missing === 0 ? "all referenced screenshots exist" : missing + " missing");
