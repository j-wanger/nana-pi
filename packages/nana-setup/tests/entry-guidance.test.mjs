/**
 * @module packages/nana-setup/tests/entry-guidance.test.mjs
 * @purpose Pins that each scaffold, adopt, copier and project completion path prompts objective ratification before trust.
 * @inputs copier.yml, four pack skill files, and nana-setup project CLI output.
 * @outputs PASS/FAIL lines and a nonzero process exit when any assertion fails.
 * @effects disk (temporary project and home), process (runs the CLI).
 * @errors a failed assertion prints FAIL and exits nonzero.
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
const repo = path.resolve(new URL("../../..", import.meta.url).pathname);
const concepts = [/(?:ratif|DRAFT)/i, /nana-setup trust <dir>/];
const ordered = (text) => { const objective = concepts[0].exec(text)?.index ?? -1; const trust = concepts[1].exec(text)?.index ?? -1; return objective >= 0 && trust > objective; };
const files = ["copier.yml", ...["scaffold-py", "scaffold-ts", "adopt-py", "adopt-ts"].map((name) => `packages/nana-pack/skills/${name}/SKILL.md`)];
let fails = 0;
const check = (name, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail); if (!ok) fails++; };
for (const rel of files) {
 const text = fs.readFileSync(path.join(repo, rel), "utf8");
 // req: R-676
 check(`${rel}: completion path names ratification then trust`, ordered(text), rel);
 if (rel === "copier.yml") {
  const starts = [...text.matchAll(/First two steps:/g)].map((match) => match.index);
  // req: R-676
  check("copier has aligned instructions in adopt and both scaffold completion branches", starts.length === 3 && starts.every((start, index) => ordered(text.slice(start, starts[index + 1] ?? text.length))), text);
 }
}
const root = fs.mkdtempSync(path.join(os.tmpdir(), "nana-guidance-"));
const dir = path.join(root, "project");
fs.mkdirSync(dir);
const cli = path.join(repo, "packages/nana-setup/bin/nana-setup.mjs");
const result = spawnSync(process.execPath, [cli, "project", dir, "--home", path.join(root, "home")], { encoding: "utf8" });
// req: R-676
check("project output names ratification and trust", result.status === 0 && /(?:ratif|DRAFT)/i.test(result.stdout) && result.stdout.includes("nana-setup trust <dir>") && result.stdout.indexOf("ratify") < result.stdout.indexOf("nana-setup trust"), `${result.status} ${result.stdout} ${result.stderr}`);
fs.rmSync(root, { recursive: true, force: true });
process.exit(fails ? 1 : 0);
