/**
 * @module packages/nana-setup/tests/entry-guidance.test.mjs
 * @purpose Pins the completion guidance each scaffold, adopt, copier and project path gives: ratification before trust, the adopt skills' closing project check, and adopt-structure step 4's marker fence and fallback commands.
 * @inputs copier.yml, four pack skill files, nana-setup project CLI output, and the shared working file and project lib's WORKING_BEGIN/WORKING_END/agentsStub.
 * @outputs PASS/FAIL lines and a nonzero process exit when any assertion fails.
 * @effects disk (temporary project and home), process (runs the CLI).
 * @errors a failed assertion prints FAIL and exits nonzero.
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import { tmpDir } from "./tmp-dir.mjs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { WORKING_BEGIN, WORKING_END, agentsStub } from "../lib/project.mjs";
const repo = path.resolve(fileURLToPath(new URL("../../..", import.meta.url)));
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
for (const skill of ["scaffold-py", "scaffold-ts", "adopt-py", "adopt-ts", "adopt-structure"]) {
 const text = skillText(skill);
 const entries = skill === "scaffold-py" || skill === "scaffold-ts"
  ? listEntries(text, "**The first two project steps**:")
  : listEntries(text, "First two steps:");
 // req: R-676
 check(`${skill} ratification asks owner for both lines and forbids inventing`,
  Boolean(entries?.[0] && /ask the owner/i.test(entries[0]) && /objective/i.test(entries[0]) && /current[- ]priority/i.test(entries[0]) && /write their words/i.test(entries[0]) && /never invent/i.test(entries[0])));
}
const structure = skillText("adopt-structure");
const structureEntries = listEntries(structure, "First two steps:");
const structureFlat = structure.replace(/\s+/g, " ");
// req: R-676
check("adopt-structure ratifies after seed handling without contradictory guidance",
 firstTwoSteps(structureEntries) && /ask the owner/i.test(structureEntries[0] ?? "") &&
 structure.indexOf("**First two steps:** after seed handling") > structure.indexOf("6. **The three frontier seeds") &&
 structureFlat.includes("The seed step never replaces an existing file") &&
 structureFlat.includes("replace only those seeded placeholder lines and their DRAFT suffix with the owner's words") &&
 structureFlat.includes("Leave owner-written lines unchanged") &&
 !structureFlat.includes("existing seeded placeholders require asking without overwriting") &&
 structureFlat.includes("leave owner-written lines unchanged") &&
 !structureFlat.includes("leave every other `<…>`") && !structureFlat.includes("an existing `OBJECTIVE.md` is a ratified decision") && !structureFlat.includes("two edits they still owe"),
 "ratification must follow seeding, preserve existing files, and not describe placeholders as already ratified");
const lastStep = (raw) => {
 const text = raw.replace(/\r\n/g, "\n");
 const marker = "\n## Steps\n";
 const start = text.indexOf(marker);
 if (start < 0) return "";
 const after = text.slice(start + marker.length);
 const endIndex = after.search(/\n## /);
 const section = endIndex < 0 ? after : after.slice(0, endIndex);
 const lines = section.split("\n");
 let lastLineIndex = -1;
 for (let i = 0; i < lines.length; i++) {
  if (/^\d+\.\s\*\*/.test(lines[i])) lastLineIndex = i;
 }
 if (lastLineIndex < 0) return "";
 return lines.slice(lastLineIndex).join("\n").replace(/\s+/g, " ").trim();
};
const closingParts = [
 "`nana-setup project <dir> --check`",
 `\`node "$HOME/nana-pi/packages/nana-setup/bin/nana-setup.mjs" project <dir> --check\``,
 "ready only when it exits 0",
 "every ✗ and ! line",
 "only with the owner's yes",
];
const closingMissing = {};
for (const skill of ["adopt-py", "adopt-ts", "adopt-structure"]) {
 const step = lastStep(skillText(skill));
 const missing = closingParts.filter((part) => !step.includes(part));
 if (missing.length) closingMissing[skill] = missing;
}
const closingBinExists = fs.existsSync(path.join(repo, "packages/nana-setup/bin/nana-setup.mjs"));
// req: R-1670
check("R-1670: adopt-py, adopt-ts and adopt-structure each end on the project check, ready only on exit 0, repairs only with the owner's yes", Object.keys(closingMissing).length === 0 && closingBinExists, `${closingBinExists ? "" : "bin missing; "}${Object.entries(closingMissing).map(([skill, missing]) => `${skill} missing: ${missing.join(" | ")}`).join("; ")}`);
const root = tmpDir(path.join(os.tmpdir(), "nana-guidance-"));
const dir = path.join(root, "project");
fs.mkdirSync(dir);
const cli = path.join(repo, "packages/nana-setup/bin/nana-setup.mjs");
const result = spawnSync(process.execPath, [cli, "project", dir, "--home", path.join(root, "home")], { encoding: "utf8" });
const outputList = result.stdout.match(/next: 1\. ([^\n]+)\n\s+2\. ([^\n]+)/);
// req: R-676
check("project output entries 1 and 2 are ratification and trust", result.status === 0 && outputList && /ratif.*OBJECTIVE\.md/i.test(outputList[1]) && /nana-setup trust <dir>/.test(outputList[2]), `${result.status} ${result.stdout} ${result.stderr}`);
const setupReadme = fs.readFileSync(path.join(repo, "packages/nana-setup/README.md"), "utf8");
// req: R-676
check("README limits fill-the-date guidance to scaffold and adopt", setupReadme.includes("Scaffold and adopt messages also say\nto fill the date; project setup already fills it.") && !setupReadme.includes("seeded `OBJECTIVE.md` (fill the date; the DRAFT lines are yours)"));
/* --- adopt-structure step 4: the marker fence and its fallback commands ------------------- */
const structureText = skillText("adopt-structure").replace(/\r\n/g, "\n");
const step4Start = structureText.indexOf("\n4. **");
const step4EndAt = structureText.indexOf("\n5. **");
const step4 = step4Start >= 0 && step4EndAt > step4Start ? structureText.slice(step4Start, step4EndAt) : "";
const sharedWorking = fs.readFileSync(path.join(repo, "templates/_shared/working-under-nana-pi.md"), "utf8");

const dedent = (text, indent) => (indent ? text.split("\n").map((line) => (line.startsWith(indent) ? line.slice(indent.length) : line)).join("\n") : text);
const fenceMatch = step4.match(/^([ \t]*)```markdown\n([\s\S]*?)\n\1```[ \t]*$/m);
let r1780ok = false;
let r1780detail = "no ```markdown fence found in adopt-structure step 4";
if (fenceMatch) {
	const fenceLines = dedent(fenceMatch[2], fenceMatch[1]).split("\n");
	const middle = fenceLines.slice(1, -1);
	const nonBlankMiddle = middle.filter((line) => line.trim() !== "");
	if (fenceLines[0] === WORKING_BEGIN && fenceLines[fenceLines.length - 1] === WORKING_END && nonBlankMiddle.length === 1) {
		const placeholderIndex = fenceLines.findIndex((line, index) => index > 0 && index < fenceLines.length - 1 && line.trim() !== "");
		const rebuilt = fenceLines.slice();
		rebuilt[placeholderIndex] = sharedWorking.replace(/\n$/, "");
		const demoDir = path.join(root, "r1780-project");
		fs.mkdirSync(demoDir, { recursive: true });
		fs.writeFileSync(path.join(demoDir, "AGENTS.md"), `# demo\n\n${rebuilt.join("\n")}\n`);
		const demoCheck = spawnSync(process.execPath, [cli, "project", demoDir, "--check", "--home", path.join(root, "home")], { encoding: "utf8" });
		const regionLine = (demoCheck.stdout || "").split("\n").find((line) => line.includes("AGENTS.md working region"));
		r1780ok = Boolean(regionLine && regionLine.trim().startsWith("✓"));
		r1780detail = regionLine ? regionLine.trim() : `no working-region line; exit ${demoCheck.status}; ${demoCheck.stderr || ""}`;
	} else {
		r1780detail = `fence shape mismatch: first=${JSON.stringify(fenceLines[0])} last=${JSON.stringify(fenceLines[fenceLines.length - 1])} nonBlankMiddle=${nonBlankMiddle.length}`;
	}
}
// req: R-1780
check("adopt-structure step 4 marked block passes the working region project check", r1780ok, r1780detail);

const step4Flat = step4.replace(/\s+/g, " ");
// req: R-1781
check("adopt-structure step 4 replaces an unmarked working section instead of adding a second copy", step4Flat.includes("replace that copy with the marked block") && step4Flat.includes("never add a second copy"), step4Flat);

const nodeDashELines = [...step4.matchAll(/^[ \t]*node -e "(.*)"[ \t]*$/gm)].map((match) => match[1]);
let r1782ok = nodeDashELines.length === 2;
let r1782detail = r1782ok ? "" : `expected 2 node -e lines in step 4, found ${nodeDashELines.length}`;
if (r1782ok) {
	const fixture = `${agentsStub("demo")}## Trailing section\nproject line\n`;
	const expected = `${WORKING_BEGIN}\n${sharedWorking}${WORKING_END}\n`;
	const problems = [];
	const callRe = /(require\(['"]fs['"]\)\.readFileSync\()(.+?)(,\s*['"]utf8['"]\))/;
	for (const line of nodeDashELines) {
		const callMatch = line.match(callRe);
		if (!callMatch) {
			problems.push(`no readFileSync call found: ${line}`);
			continue;
		}
		const withoutArg = line.slice(0, callMatch.index) + callMatch[1] + callMatch[3] + line.slice(callMatch.index + callMatch[0].length);
		if (/[$`%"]/.test(withoutArg)) problems.push(`forbidden $, backtick, % or " outside the readFileSync argument: ${line}`);
		if (/!(?!=)/.test(withoutArg)) problems.push(`! not immediately before = outside the readFileSync argument: ${line}`);
		if (/\\(?!n)/.test(withoutArg)) problems.push(`backslash not immediately before n outside the readFileSync argument: ${line}`);
		const modifiedLine = line.slice(0, callMatch.index) + JSON.stringify(fixture) + line.slice(callMatch.index + callMatch[0].length);
		const nodeRun = spawnSync(process.execPath, ["-e", modifiedLine], { encoding: "utf8" });
		if (nodeRun.status !== 0) problems.push(`node exited ${nodeRun.status} on: ${line} :: ${nodeRun.stderr}`);
		else if (nodeRun.stdout !== expected) problems.push(`stdout mismatch for: ${line} :: got ${JSON.stringify(nodeRun.stdout)}`);
	}
	r1782ok = problems.length === 0;
	r1782detail = problems.join(" | ");
}
// req: R-1782
check("adopt-structure fallback commands print only the marked working block", r1782ok, r1782detail);

fs.rmSync(root, { recursive: true, force: true });
process.exit(fails ? 1 : 0);
