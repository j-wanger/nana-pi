/**
 * @module packages/nana-setup/tests/doctor-fix-line.test.mjs
 * @purpose Pin doctor's final repair line, and the `PATH resolves pi-review` row's own advice, to the changes install's dry run can actually make.
 * @inputs The nana-setup CLI, scratch homes and working folders, a pi stub, and PI_SUBAGENTS_FLOOR.
 * @outputs PASS/FAIL lines for R-1990 through R-1997 and R-2320 through R-2325, and a final failure-count summary.
 * @effects disk (temporary fixtures), process (runs install and doctor with sanitized environments).
 * @errors Failed assertions print their observed output and make the test process exit nonzero.
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PI_SUBAGENTS_FLOOR } from "../lib/doctor.mjs";
import { withPiStub } from "./stub-pi.mjs";
import { tmpDir } from "./tmp-dir.mjs";

const cli = fileURLToPath(new URL("../bin/nana-setup.mjs", import.meta.url));
const root = tmpDir(path.join(os.tmpdir(), "nana-doctor-fix-line-"));
let failures = 0;
const check = (title, pass, detail = "") => {
	console.log(pass ? "PASS" : "FAIL", title, pass ? "" : detail);
	if (!pass) failures++;
};

function fixtureHome(name, { subagents = true } = {}) {
	const home = path.join(root, name);
	fs.mkdirSync(path.join(home, ".pi", "agent", "nana-knowledge"), { recursive: true });
	fs.writeFileSync(path.join(home, ".pi", "agent", "nana-knowledge", "sources.json"), '{"roots":[]}');
	if (subagents) {
		const packageDir = path.join(home, ".pi", "agent", "npm", "node_modules", "pi-subagents");
		fs.mkdirSync(packageDir, { recursive: true });
		fs.writeFileSync(path.join(packageDir, "package.json"), JSON.stringify({ name: "pi-subagents", version: PI_SUBAGENTS_FLOOR }));
	}
	return home;
}

function freshCwd(name, projectConfig = false) {
	const cwd = path.join(root, name);
	fs.mkdirSync(cwd, { recursive: true });
	if (projectConfig) {
		fs.mkdirSync(path.join(cwd, ".pi"), { recursive: true });
		fs.writeFileSync(path.join(cwd, ".pi", "nana-pack.json"), "{}\n");
	}
	return cwd;
}

function cleanEnv(home, extra = {}) {
	const env = { ...process.env, HOME: home, USERPROFILE: home, ...extra };
	for (const name of ["PI_CODING_AGENT_DIR", "CLAUDE_CONFIG_DIR", "NANA_SHARED_MEMORY_DIR", "NANA_KNOWLEDGE_HOME", "NANA_SETUP_PLATFORM"]) delete env[name];
	return { ...env, ...extra };
}

function run(args, { home, cwd, extraEnv = {}, nodeOptions = [] }) {
	return withPiStub(() => spawnSync(process.execPath, [...nodeOptions, cli, ...args], {
		cwd,
		env: cleanEnv(home, extraEnv),
		encoding: "utf8",
	}));
}

function summary(result) {
	return result.stdout.split(/\r?\n/).filter((line) => line.trim()).at(-1)?.trim() ?? "";
}

function failedLabels(result) {
	return result.stdout.split(/\r?\n/).flatMap((line) => {
		const match = /^\s*✗ (.*?)(?: {2}|$)/u.exec(line);
		return match ? [match[1].trimEnd()] : [];
	});
}

function rowLabels(result) {
	return result.stdout.split(/\r?\n/).flatMap((line) => {
		const match = /^\s*[✓✗!·] (.*?)(?: {2}|$)/u.exec(line);
		return match ? [match[1].trimEnd()] : [];
	});
}

// Set PATH to exactly `entries` (no stub prepended) and run the CLI directly. withPiStub always
// joins with the HOST's path.delimiter (":" on a POSIX host), which would glue its stub onto a
// forced win32 Path's first entry — so a forced-win32 run never goes through run() or withPiStub.
function runOnPath(args, { home, cwd, entries, extraEnv = {} }) {
	const win = process.platform === "win32" || extraEnv.NANA_SETUP_PLATFORM === "win32";
	const savedPath = process.env.PATH;
	process.env.PATH = entries.join(win ? ";" : path.delimiter);
	try {
		return spawnSync(process.execPath, [cli, ...args], { cwd, env: cleanEnv(home, extraEnv), encoding: "utf8" });
	} finally {
		if (savedPath === undefined) delete process.env.PATH;
		else process.env.PATH = savedPath;
	}
}

function byHandOf(result) {
	return summary(result).match(/fix by hand as each ✗ line says: (.*?)(?:; then run:| \(and see|$)/)?.[1]?.split(", ") ?? [];
}

function byHand(result, label) {
	return failedLabels(result).includes(label) && byHandOf(result).includes(label);
}

const TO_INSTALL_RE = /^(?:\d+ missing — run: nana-setup install|.*; then run: nana-setup install for the other \d+)(?: \(and see the \d+ ! above\))?$/;

function toInstall(result, label) {
	return failedLabels(result).includes(label) && !byHandOf(result).includes(label) && TO_INSTALL_RE.test(summary(result));
}

function pathRowDetail(result) {
	const label = "PATH resolves pi-review";
	const line = result.stdout.split(/\r?\n/).find((l) => l.includes(label));
	return line ? line.slice(line.indexOf(label) + label.length).replace(/^ +/, "") : "";
}

function walkDifference(before, after) {
	const length = Math.max(before.length, after.length);
	for (let i = 0; i < length; i++) {
		if (JSON.stringify(before[i]) !== JSON.stringify(after[i])) {
			const item = (entry) => entry ? `${entry[0]} ${entry[1]}` : "absent";
			return `before ${before.length} entries; after ${after.length} entries; first difference: ${item(before[i])} -> ${item(after[i])}`;
		}
	}
	return `before ${before.length} entries; after ${after.length} entries`;
}

function walk(home) {
	const entries = [];
	const visit = (dir) => {
		for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
			const absolute = path.join(dir, entry.name);
			const relative = path.relative(home, absolute).split(path.sep).join("/");
			const stat = fs.lstatSync(absolute);
			if (stat.isSymbolicLink()) entries.push(["link", relative, fs.readlinkSync(absolute)]);
			else if (stat.isDirectory()) { entries.push(["directory", relative]); visit(absolute); }
			else if (stat.isFile()) entries.push(["file", relative, fs.readFileSync(absolute).toString("base64")]);
			else entries.push(["other", relative]);
		}
	};
	visit(home);
	return entries;
}

// --- shared fixtures for the PATH-row checks (R-2320–R-2325) ---
const stubDir = withPiStub(() => process.env.PATH.split(path.delimiter)[0]);
const nodeDir = path.dirname(process.execPath);
const sysDirs = process.platform === "win32" ? [path.join(process.env.SystemRoot ?? "C:\\Windows", "System32")] : [];
for (const dir of [nodeDir, ...sysDirs]) {
	for (const name of ["pi-review", "pi-review.cmd"]) {
		if (fs.existsSync(path.join(dir, name))) throw new Error(`refusing to run PATH-row fixtures: ${path.join(dir, name)} already exists on this machine`);
	}
}
const otherDir = path.join(root, "other-pi-review");
fs.mkdirSync(otherDir, { recursive: true });
if (process.platform === "win32") {
	fs.writeFileSync(path.join(otherDir, "pi-review.cmd"), "@exit /b 0\r\n");
} else {
	const otherFile = path.join(otherDir, "pi-review");
	fs.writeFileSync(otherFile, "#!/bin/sh\nexit 0\n");
	fs.chmodSync(otherFile, 0o755);
}

const emptyHome = fixtureHome("empty-home");
const emptyCwd = freshCwd("empty-cwd");
const emptyBefore = walk(emptyHome);
const allInstallable = run(["doctor", "--home", emptyHome], { home: emptyHome, cwd: emptyCwd });
const allInstallableLabels = failedLabels(allInstallable);
// req: R-1990
check("R-1990: when install repairs every ✗ row, the summary reads n missing — run: nana-setup install", allInstallable.status === 1 && allInstallableLabels.length > 0 && summary(allInstallable) === `${allInstallableLabels.length} missing — run: nana-setup install`, `${allInstallable.status}\n${allInstallable.stdout}\n${allInstallable.stderr}`);
const emptyAfter = walk(emptyHome);
// req: R-1995
check("R-1995: doctor on a home install would change leaves every file, folder and link unchanged", allInstallable.status === 1 && JSON.stringify(emptyAfter) === JSON.stringify(emptyBefore), `${allInstallable.status}\n${walkDifference(emptyBefore, emptyAfter)}\n${allInstallable.stdout}\n${allInstallable.stderr}`);

const handHome = fixtureHome("hand-home", { subagents: false });
const handCwd = freshCwd("hand-cwd");
const handInstall = run(["install", "--home", handHome], { home: handHome, cwd: handCwd });
const handDoctor = run(["doctor", "--home", handHome], { home: handHome, cwd: handCwd });
// req: R-1991
check("R-1991: when no ✗ row is install's, the summary lists each as a fix by hand and never names install", handInstall.status === 0 && handDoctor.status === 1 && summary(handDoctor) === "1 missing — fix by hand as each ✗ line says: pi pi-subagents", `install ${handInstall.status}\n${handInstall.stdout}\n${handInstall.stderr}\ndoctor ${handDoctor.status}\n${handDoctor.stdout}\n${handDoctor.stderr}`);

const mixedHome = fixtureHome("mixed-home");
const mixedCwd = freshCwd("mixed-cwd");
const foreignSkill = path.join(mixedHome, ".claude", "skills", "spec");
fs.mkdirSync(foreignSkill, { recursive: true });
fs.writeFileSync(path.join(foreignSkill, "SKILL.md"), "owner's skill\n");
const mixedInstall = run(["install", "--home", mixedHome], { home: mixedHome, cwd: mixedCwd });
for (const name of ["nana-soul.md", "nana-standards.md"]) fs.rmSync(path.join(mixedHome, ".claude", "rules", name));
const mixedDoctor = run(["doctor", "--home", mixedHome], { home: mixedHome, cwd: mixedCwd });
// req: R-1992
check("R-1992: a refused skill and two missing rules: the summary lists only the skill by hand and gives install the other 2", mixedInstall.status === 1 && mixedDoctor.status === 1 && summary(mixedDoctor) === "3 missing — fix by hand as each ✗ line says: skill spec; then run: nana-setup install for the other 2", `install ${mixedInstall.status}\n${mixedInstall.stdout}\n${mixedInstall.stderr}\ndoctor ${mixedDoctor.status}\n${mixedDoctor.stdout}\n${mixedDoctor.stderr}`);

const winHome = fixtureHome("win-home");
const winCwd = freshCwd("win-cwd");
const winEnv = { NANA_SETUP_PLATFORM: "win32" };
const winPathEntries = String(process.env.PATH ?? "").split(path.delimiter).map((entry) => path.resolve(entry));
if (winPathEntries.includes(path.resolve(path.join(winHome, ".local", "bin")))) throw new Error("M4 fixture's home bin unexpectedly appears on PATH");
const winDoctor = run(["doctor"], { home: winHome, cwd: winCwd, extraEnv: winEnv });
// req: R-1993
check("R-1993: on win32's real home with its bin folder off the Path, the summary lists PATH resolves pi-review as a fix by hand", winDoctor.status === 1 && byHand(winDoctor, "PATH resolves pi-review"), `doctor ${winDoctor.status}\n${winDoctor.stdout}\n${winDoctor.stderr}`);

const pathRowHome = fixtureHome("path-row-home");
const pathRowCwd = freshCwd("path-row-cwd");
const pathRowInstall = run(["install", "--home", pathRowHome], { home: pathRowHome, cwd: pathRowCwd });
const pathRowBin = path.join(pathRowHome, ".local", "bin");
const pathRowLauncher = path.join(pathRowBin, process.platform === "win32" ? "pi-review.cmd" : "pi-review");
fs.rmSync(pathRowLauncher, { force: true });

const onResult = runOnPath(["doctor"], { home: pathRowHome, cwd: pathRowCwd, entries: [stubDir, pathRowBin, nodeDir, ...sysDirs] });
const offResult = runOnPath(["doctor"], { home: pathRowHome, cwd: pathRowCwd, entries: [stubDir, nodeDir, ...sysDirs] });
const beforeResult = runOnPath(["doctor"], { home: pathRowHome, cwd: pathRowCwd, entries: [stubDir, otherDir, pathRowBin, nodeDir, ...sysDirs] });
const afterResult = runOnPath(["doctor"], { home: pathRowHome, cwd: pathRowCwd, entries: [stubDir, pathRowBin, otherDir, nodeDir, ...sysDirs] });

// req: R-2320
check(
	"R-2320: with the bin folder on PATH and its pi-review launcher removed, the PATH resolves pi-review row names nana-setup install instead of the PATH fix",
	toInstall(onResult, "PATH resolves pi-review") && pathRowDetail(onResult).includes("nana-setup install") && !pathRowDetail(onResult).includes(`add ${pathRowBin} to`),
	`install ${pathRowInstall.status}\ndoctor ${onResult.status}\n${onResult.stdout}\n${onResult.stderr}`,
);
// req: R-2321
check(
	"R-2321: with the bin folder on PATH and its pi-review launcher removed, the summary gives PATH resolves pi-review to install",
	toInstall(onResult, "PATH resolves pi-review"),
	`doctor ${onResult.status}\n${onResult.stdout}\n${onResult.stderr}`,
);
// req: R-2322
check(
	"R-2322: with the bin folder off PATH and its pi-review launcher removed, the summary lists PATH resolves pi-review by hand",
	byHand(offResult, "PATH resolves pi-review") && pathRowDetail(offResult).includes(`add ${pathRowBin} to`),
	`doctor ${offResult.status}\n${offResult.stdout}\n${offResult.stderr}`,
);
// req: R-2324
check(
	"R-2324: with another pi-review on PATH before the bin folder and the launcher removed, the summary lists PATH resolves pi-review by hand",
	byHand(beforeResult, "PATH resolves pi-review"),
	`doctor ${beforeResult.status}\n${beforeResult.stdout}\n${beforeResult.stderr}`,
);
// req: R-2325
check(
	"R-2325: with another pi-review on PATH after the bin folder and the launcher removed, the summary gives PATH resolves pi-review to install",
	toInstall(afterResult, "PATH resolves pi-review"),
	`doctor ${afterResult.status}\n${afterResult.stdout}\n${afterResult.stderr}`,
);

const forcedHome = fixtureHome("path-row-forced-home");
const forcedCwd = freshCwd("path-row-forced-cwd");
const forcedEnv = { NANA_SETUP_PLATFORM: "win32" };
const forcedInstall = run(["install", "--home", forcedHome], { home: forcedHome, cwd: forcedCwd, extraEnv: forcedEnv });
const forcedBin = path.join(forcedHome, ".local", "bin");
fs.rmSync(path.join(forcedBin, "pi-review.cmd"), { force: true });
const forcedResult = runOnPath(["doctor"], { home: forcedHome, cwd: forcedCwd, entries: [forcedBin.toUpperCase(), stubDir, nodeDir, ...sysDirs], extraEnv: forcedEnv });
// req: R-2323
check(
	"R-2323: as win32 with the bin folder on the Path in another letter case and its .cmd shim removed, the summary gives PATH resolves pi-review to install",
	toInstall(forcedResult, "PATH resolves pi-review"),
	`install ${forcedInstall.status}\ndoctor ${forcedResult.status}\n${forcedResult.stdout}\n${forcedResult.stderr}`,
);

const refusedHome = fixtureHome("refused-home");
const refusedCwd = freshCwd("refused-cwd");
const refusedInstall = run(["install", "--home", refusedHome], { home: refusedHome, cwd: refusedCwd });
fs.writeFileSync(path.join(refusedHome, ".claude", "settings.json"), '{"hooks": {},}');
const refusedDoctor = run(["doctor", "--home", refusedHome], { home: refusedHome, cwd: refusedCwd });
// req: R-1994
check("R-1994: when install refuses the home, the summary names the refusal instead of telling the user to run install", refusedInstall.status === 0 && refusedDoctor.status === 1 && /^\d+ missing — nana-setup install will not run until this is fixed: .*settings\.json is not valid JSON/.test(summary(refusedDoctor)), `install ${refusedInstall.status}\n${refusedInstall.stdout}\n${refusedInstall.stderr}\ndoctor ${refusedDoctor.status}\n${refusedDoctor.stdout}\n${refusedDoctor.stderr}`);

const handWarnCwd = freshCwd("hand-warn-cwd", true);
const mixedWarnCwd = freshCwd("mixed-warn-cwd", true);
const handWarn = run(["doctor", "--home", handHome], { home: handHome, cwd: handWarnCwd });
const mixedWarn = run(["doctor", "--home", mixedHome], { home: mixedHome, cwd: mixedWarnCwd });
// req: R-1996
check("R-1996: with a ! row, both by-hand summary forms still end with the ! count", handWarn.status === 1 && mixedWarn.status === 1 && summary(handWarn) === "1 missing — fix by hand as each ✗ line says: pi pi-subagents (and see the 1 ! above)" && summary(mixedWarn) === "3 missing — fix by hand as each ✗ line says: skill spec; then run: nana-setup install for the other 2 (and see the 1 ! above)", `hand ${handWarn.status}\n${handWarn.stdout}\n${handWarn.stderr}\nmixed ${mixedWarn.status}\n${mixedWarn.stdout}\n${mixedWarn.stderr}`);

const unexpectedHome = fixtureHome("unexpected-home");
const unexpectedCwd = freshCwd("unexpected-cwd");
const unexpectedEnv = { NANA_SETUP_PLATFORM: "win32" };
const unexpectedInstall = run(["install", "--home", unexpectedHome], { home: unexpectedHome, cwd: unexpectedCwd, extraEnv: unexpectedEnv });
const unexpectedBaseline = run(["doctor", "--home", unexpectedHome], { home: unexpectedHome, cwd: unexpectedCwd, extraEnv: unexpectedEnv });
const unreadableRule = path.join(unexpectedHome, ".claude", "rules", "nana-soul.md");
fs.writeFileSync(unreadableRule, "stale copy\n");
const preload = path.join(root, "dry-run-read-error.mjs");
fs.writeFileSync(preload, `import fs from "node:fs";\nimport path from "node:path";\nimport { syncBuiltinESMExports } from "node:module";\nconst original = fs.readFileSync;\nconst target = path.resolve(process.env.NANA_DOCTOR_READ_ERROR_TARGET);\nlet reads = 0;\nfs.readFileSync = function (file, ...args) {\n\tif (path.resolve(String(file)) === target && ++reads === 2) throw Object.assign(new Error("injected dry-run read failure"), { code: "EACCES" });\n\treturn original.call(this, file, ...args);\n};\nsyncBuiltinESMExports();\n`);
const unexpectedDoctor = run(["doctor", "--home", unexpectedHome], {
	home: unexpectedHome,
	cwd: unexpectedCwd,
	extraEnv: { ...unexpectedEnv, NANA_DOCTOR_READ_ERROR_TARGET: unreadableRule },
	nodeOptions: ["--import", pathToFileURL(preload).href],
});
const unexpectedText = `${unexpectedDoctor.stdout}\n${unexpectedDoctor.stderr}`;
// req: R-1997
check("R-1997: a non-refusal dry-run error prints every row and bounded fallback advice without a stack", unexpectedInstall.status === 0 && unexpectedBaseline.status === 0 && unexpectedDoctor.status === 1 && JSON.stringify(rowLabels(unexpectedDoctor)) === JSON.stringify(rowLabels(unexpectedBaseline)) && summary(unexpectedDoctor) === "could not predict nana-setup install repairs (EACCES) — 1 missing — run: nana-setup install" && !unexpectedText.includes("Error:") && !/^\s*at /m.test(unexpectedText), `install ${unexpectedInstall.status}\nbaseline ${unexpectedBaseline.status} rows ${rowLabels(unexpectedBaseline).length}\ndoctor ${unexpectedDoctor.status} rows ${rowLabels(unexpectedDoctor).length}\n${unexpectedDoctor.stdout}\n${unexpectedDoctor.stderr}`);

console.log(`${failures ? "FAIL" : "PASS"} summary: ${failures} failures`);
process.exitCode = failures ? 1 : 0;
