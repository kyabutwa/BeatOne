import { execFileSync } from "node:child_process";
import { access } from "node:fs/promises";

const input = "public/1.png";
const output = "public/zalagren-emblem.png";

await access(input);
execFileSync("magick", [
  input,
  "-alpha", "on",
  "-fuzz", "8%",
  "-fill", "none",
  "-draw", "matte 0,0 floodfill",
  output
], { stdio: "inherit" });

console.log("Prepared transparent Zalagren logo:", output);
