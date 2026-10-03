import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const roots = ["src", "public", ".github/workflows"];
const forbiddenVisible = ["BeatOne", "EarthBeat", "SpeedMe"];
const textExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".css", ".html", ".yml", ".yaml", ".json", ".svg"]);

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(path));
    else out.push(path);
  }
  return out;
}

const files = [];
for (const root of roots) {
  try { files.push(...await walk(root)); } catch {}
}

const failures = [];
for (const file of files) {
  const ext = file.slice(file.lastIndexOf("."));
  if (!textExtensions.has(ext)) continue;
  const text = await readFile(file, "utf8");
  if (/\\n/.test(text)) failures.push(`${file}: literal backslash-n sequence`);
  if (file.startsWith("src/")) {
    for (const term of forbiddenVisible) {
      if (new RegExp(term).test(text)) failures.push(`${file}: forbidden visible branding token ${term}`);
    }
  }
}

if (failures.length) {
  console.error("Repository integrity failures:");
  for (const failure of failures) console.error(" - " + failure);
  process.exit(1);
}
console.log(`Repository integrity OK (${files.length} text files inspected).`);
