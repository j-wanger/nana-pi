/**
 * @module packages/nana-setup/tests/entry-guidance.test.mjs
 * @purpose Pin adopt-structure step 4's marker fence against the project working-region check.
 * @inputs The adopt-structure skill, project CLI, shared working file and WORKING_BEGIN/WORKING_END.
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
import { WORKING_BEGIN, WORKING_END } from "../lib/project.mjs";
const repo = path.resolve(fileURLToPath(new URL("../../..", import.meta.url)));
const skillText = (name) => fs.readFileSync(path.join(repo, `packages/nana-pack/skills/${name}/SKILL.md`), "utf8");
const check = (name, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail); if (!ok) fails++; };
let fails = 0;
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

fs.rmSync(root, { recursive: true, force: true });
process.exit(fails ? 1 : 0);
