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
const cli = path.join(repo, "packages/nana-setup/bin/nana-setup.mjs");
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
