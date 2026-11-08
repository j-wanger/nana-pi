/**
 * @module packages/nana-setup/tests/verifier-pipe.test.mjs
 * @purpose Preserve retired-bash doctor checks and live pi predicate documentation after Claude verifier retirement.
 * @inputs Doctor, temporary settings, and shared runtime documentation.
 * @outputs PASS/FAIL lines and a nonzero exit when any check fails.
 * @effects disk (temporary home), process (doctor probes through pi stub).
 * @errors Failed checks set a nonzero exit code.
 */
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { diagnose } from "../lib/doctor.mjs";
import { resolveLayout } from "../lib/paths.mjs";
import { withPiStub } from "./stub-pi.mjs";
let failures = 0;
const check = (title, pass, extra = "") => { console.log(pass ? "PASS" : "FAIL", title, pass ? "" : extra); if (!pass) failures++; };
const pkg = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const root = path.resolve(pkg, "..", "..");
const home = tmpDir(path.join(os.tmpdir(), "nana-pipe-doctor-"));
const layout = resolveLayout({ home });
fs.mkdirSync(layout.claudeHome, { recursive: true });
const settings = { hooks: {} };
settings.hooks.SessionStart = [{ hooks: [
	{ type: "command", command: "/bin/bash /x/nana-objective.sh", timeout: 5, statusMessage: "nana: objective + current priority" },
	{ type: "command", command: "/bin/sh /other/nana-adoption.sh", timeout: 5, statusMessage: "foreign retired hook" },
] }];
fs.writeFileSync(layout.claudeSettings, JSON.stringify(settings));
const retiredRows = withPiStub(() => diagnose(layout, { projectDir: home })).filter((item) => item.label === "settings SessionStart retired hook");
// req: R-909
check("doctor reports every distinct retired bash script entry as a problem", retiredRows.length === 2 && retiredRows.every((item) => item.status === "fail") && retiredRows.some((item) => item.detail === "retired bash hook still wired: /bin/bash /x/nana-objective.sh") && retiredRows.some((item) => item.detail === "retired bash hook still wired: /bin/sh /other/nana-adoption.sh"));
settings.hooks = { Stop: [{ hooks: [{ type: "command", command: "/bin/bash /x/nana-objective.sh" }] }] };
fs.writeFileSync(layout.claudeSettings, JSON.stringify(settings));
const stopRetired = withPiStub(() => diagnose(layout, { projectDir: home })).filter((item) => item.label.includes("retired") && item.detail.includes("/bin/bash /x/nana-objective.sh"));
// req: R-909
check("doctor finds a retired command under Stop", stopRetired.length > 0 && stopRetired.every((item) => item.status === "fail"));
const savedPlatform = process.env.NANA_SETUP_PLATFORM;
try {
	process.env.NANA_SETUP_PLATFORM = "win32";
	settings.hooks = { SessionStart: [{ hooks: [{ type: "command", command: "/bin/bash /x/nana-objective.sh" }] }] };
	fs.writeFileSync(layout.claudeSettings, JSON.stringify(settings));
	const winRetired = withPiStub(() => diagnose(layout, { projectDir: home })).filter((item) => item.label.includes("retired") && item.detail.includes("/bin/bash /x/nana-objective.sh"));
	// req: R-909
	check("doctor finds retired SessionStart command under forced win32", winRetired.length > 0 && winRetired.every((item) => item.status === "fail"));
} finally {
	if (savedPlatform === undefined) delete process.env.NANA_SETUP_PLATFORM;
	else process.env.NANA_SETUP_PLATFORM = savedPlatform;
}
for (const [name, value] of [["object event", {}], ["string event", "bad"], ["null event", null]]) {
	settings.hooks.SessionStart = value;
	fs.writeFileSync(layout.claudeSettings, JSON.stringify(settings));
	let rows;
	try { rows = withPiStub(() => diagnose(layout, { projectDir: home })); } catch (error) { rows = error; }
	// req: R-909
	check(`doctor diagnoses malformed retired-hook ${name} without throwing`, Array.isArray(rows) && rows.some((item) => item.label === "settings SessionStart objective" && item.status === "fail"), String(rows));
}
for (const [name, group] of [["null group", null], ["string group", "bad"], ["object hooks", { hooks: {} }], ["string hooks", { hooks: "bad" }], ["null hooks", { hooks: null }]]) {
	settings.hooks.SessionStart = [group];
	fs.writeFileSync(layout.claudeSettings, JSON.stringify(settings));
	let rows;
	try { rows = withPiStub(() => diagnose(layout, { projectDir: home })); } catch (error) { rows = error; }
	// req: R-909
	check(`doctor diagnoses malformed retired-hook ${name} without throwing`, Array.isArray(rows) && rows.some((item) => item.label === "settings SessionStart objective" && item.status === "fail"), String(rows));
}
const packReadme = fs.readFileSync(path.join(root, "packages/nana-pack/README.md"), "utf8");
const setupReadme = fs.readFileSync(path.join(pkg, "README.md"), "utf8");
const packDeclaration = packReadme.split("\n").find((line) => line.includes("Verifier-pipe guard")) ?? "";
const setupDeclaration = setupReadme.split("\n").find((line) => line.includes("Verifier-pipe guard")) ?? "";
// req: R-2354
check("both READMEs declare the literal-text later-call gap and the sandbox boundary", [packDeclaration, setupDeclaration].every((line) => /best-effort text check/.test(line) && /not present in the literal command text/.test(line) && /reached through a later call/.test(line) && /sandbox is the boundary/.test(line)));
// req: R-2356
check("both READMEs declare which pipelines the verifier-pipe guard asks on", [packDeclaration, setupDeclaration].every((line) => /a `;` or a newline/.test(line) && /does not prompt/.test(line) && /contains `errexit` anywhere/.test(line) && /in any case and even inside a longer word/.test(line) && /a `set` word at any position/.test(line) && /within the same simple command/.test(line) && /the next `;`, `&`, `\|`, newline or closing bracket/.test(line) && /option word made of `-` and letters including `e`/.test(line) && /`set \+e` or `set \+o errexit` never turns that text flag off/.test(line) && /`\+o errexit` itself counts as enabling/.test(line) && /`git\.exe`/.test(line) && /path/.test(line)));
// req: R-660 R-3740
check("setup README retains context retirement and knowledge retirement guarantees", setupReadme.includes("Install removes only the exact managed tilde form and released quoted absolute-path form for the retired context-size hook; variants are preserved.") && setupReadme.includes("Install removes only complete installer-shaped knowledge entries in shell or exec form"));
if (failures) process.exitCode = 1;
