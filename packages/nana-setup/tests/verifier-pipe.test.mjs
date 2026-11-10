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
if (failures) process.exitCode = 1;
