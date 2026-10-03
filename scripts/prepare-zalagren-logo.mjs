import { execFileSync } from "node:child_process";
import { access } from "node:fs/promises";

const input = "public/1.png";
const output = "public/zalagren-emblem.png";

await access(input);

let command = "magick";
try {
  execFileSync(command, ["-version"], { stdio: "ignore" });
} catch {
  command = "convert";
}

const background = execFileSync(
  command,
  [input, "-format", "%[pixel:p{0,0}]", "info:"],
  { encoding: "utf8" }
).trim();

execFileSync(command, [
  input,
  "-alpha", "on",
  "-fuzz", "12%",
  "-transparent", background,
  output
], { stdio: "inherit" });

const channels = execFileSync(
  command,
  [output, "-format", "%[channels]", "info:"],
  { encoding: "utf8" }
).trim();

if (!channels.includes("a")) {
  throw new Error("Zalagren logo background removal produced no alpha channel.");
}

console.log("Prepared transparent Zalagren logo:", output, "channels:", channels);
