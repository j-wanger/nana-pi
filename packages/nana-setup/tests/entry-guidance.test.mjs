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
import { tmpDir } from "./tmp-dir.mjs";
import * as os from "node:os";
import * as path from "node:path";
const repo = path.resolve(new URL("../../..", import.meta.url).pathname);
const skillText = (name) => fs.readFileSync(path.join(repo, `packages/nana-pack/skills/${name}/SKILL.md`), "utf8");
const check = (name, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail); if (!ok) fails++; };
let fails = 0;
const listEntries = (text, heading) => {
 const start = text.indexOf(heading);
 if (start < 0) return null;
 const section = text.slice(start + heading.length).split(/\n\s*\n/)[0];
 return [...section.matchAll(/^\s*(\d+)\.\s+(.+)$/gm)].map((match) => match[1] + ". " + match[2]);
};
const firstTwoSteps = (entries) => entries?.length >= 2 && /^1\. .*ratif.*OBJECTIVE\.md/i.test(entries[0]) && /^2\. .*nana-setup trust <dir>/i.test(entries[1]);
const copier = fs.readFileSync(path.join(repo, "copier.yml"), "utf8");
const starts = [...copier.matchAll(/First two steps:/g)].map((match) => match.index);
const sections = starts.map((start, index) => copier.slice(start, starts[index + 1] ?? copier.length));
// req: R-676
check("copier adopt and scaffold branches number ratification and trust first", starts.length === 3 && sections.every((section) => firstTwoSteps(listEntries(section, "First two steps:"))), `${starts.length} completion lists`);
// req: R-676
check("scaffold-py completion list entries 1 and 2 are ratification and trust", firstTwoSteps(listEntries(skillText("scaffold-py"), "**The first two project steps**:")));
// req: R-676
check("scaffold-ts completion list entries 1 and 2 are ratification and trust", firstTwoSteps(listEntries(skillText("scaffold-ts"), "**The first two project steps**:")));
// req: R-676
check("adopt-py completion list entries 1 and 2 are ratification and trust", firstTwoSteps(listEntries(skillText("adopt-py"), "First two steps:")));
// req: R-676
check("adopt-ts completion list entries 1 and 2 are ratification and trust", firstTwoSteps(listEntries(skillText("adopt-ts"), "First two steps:")));
const root = tmpDir(path.join(os.tmpdir(), "nana-guidance-"));
const dir = path.join(root, "project");
fs.mkdirSync(dir);
const cli = path.join(repo, "packages/nana-setup/bin/nana-setup.mjs");
const result = spawnSync(process.execPath, [cli, "project", dir, "--home", path.join(root, "home")], { encoding: "utf8" });
const outputList = result.stdout.match(/next: 1\. ([^\n]+)\n\s+2\. ([^\n]+)/);
// req: R-676
check("project output entries 1 and 2 are ratification and trust", result.status === 0 && outputList && /ratif.*OBJECTIVE\.md/i.test(outputList[1]) && /nana-setup trust <dir>/.test(outputList[2]), `${result.status} ${result.stdout} ${result.stderr}`);
fs.rmSync(root, { recursive: true, force: true });
process.exit(fails ? 1 : 0);
