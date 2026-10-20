/**
 * @module packages/nana-setup/tests/linked-claude-folder.test.mjs
 * @purpose Pin install's and doctor's behavior for a Claude home or skills folder that is a link: no retired row for an absent path, a present retired artifact left untouched, and doctor's fix-by-hand guidance naming the folder to move.
 * @inputs The nana-setup CLI, `bin/stale-copies.mjs`, scratch homes and working folders, a pi stub, and PI_SUBAGENTS_FLOOR.
 * @outputs PASS/FAIL lines for R-2290 through R-2294 and a final SUMMARY line.
 * @effects disk (temporary fixtures, including directory junctions/symlinks and file symlinks), process (runs install, doctor and stale-copies with sanitized environments).
 * @errors Failed assertions print their observed output; the test process exits nonzero on any failure.
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { PI_SUBAGENTS_FLOOR } from "../lib/doctor.mjs";
import { pkgRoot } from "../lib/paths.mjs";
import { CLAUDE_SKILLS } from "../lib/steps.mjs";
import { STALE_PREFIX } from "../lib/stale-copies-config.mjs";
import { withPiStub } from "./stub-pi.mjs";
import { tmpDir } from "./tmp-dir.mjs";

const cli = fileURLToPath(new URL("../bin/nana-setup.mjs", import.meta.url));
const staleCli = fileURLToPath(new URL("../bin/stale-copies.mjs", import.meta.url));
const root = tmpDir(path.join(os.tmpdir(), "nana-linked-claude-"));
const linkType = process.platform === "win32" ? "junction" : "dir";

let passes = 0;
let fails = 0;
const skips = 0;
const check = (title, ok, detail = "") => {
	console.log(ok ? "PASS" : "FAIL", title, ok ? "" : detail);
	if (ok) passes++;
	else fails++;
};

function fixtureHome(name) {
	const home = path.join(root, name);
	fs.mkdirSync(path.join(home, ".pi", "agent", "nana-knowledge"), { recursive: true });
	fs.writeFileSync(path.join(home, ".pi", "agent", "nana-knowledge", "sources.json"), '{"roots":[]}');
	const packageDir = path.join(home, ".pi", "agent", "npm", "node_modules", "pi-subagents");
	fs.mkdirSync(packageDir, { recursive: true });
	fs.writeFileSync(path.join(packageDir, "package.json"), JSON.stringify({ name: "pi-subagents", version: PI_SUBAGENTS_FLOOR }));
	return home;
}

function freshCwd(name) {
	const cwd = path.join(root, name);
	fs.mkdirSync(cwd, { recursive: true });
	return cwd;
}

function makeDir(home, name) {
	const dir = path.join(home, name);
	fs.mkdirSync(dir, { recursive: true });
	return dir;
}

function cleanEnv(home, extra = {}) {
	const env = { ...process.env, HOME: home, USERPROFILE: home, ...extra };
	for (const name of ["PI_CODING_AGENT_DIR", "CLAUDE_CONFIG_DIR", "NANA_SHARED_MEMORY_DIR", "NANA_KNOWLEDGE_HOME", "NANA_SETUP_PLATFORM"]) delete env[name];
	return { ...env, ...extra };
}

function runCli(args, { home, cwd, extraEnv = {} }) {
	return withPiStub(() => spawnSync(process.execPath, [cli, ...args, "--home", home], {
		cwd,
		env: cleanEnv(home, extraEnv),
		encoding: "utf8",
	}));
}

function runStale(home, cwd, extraEnv = {}) {
	return spawnSync(process.execPath, [staleCli], { cwd, env: cleanEnv(home, extraEnv), encoding: "utf8" });
}

function tryReadlink(p) {
	try { return fs.readlinkSync(p); } catch { return null; }
}

function tryReadFileBase64(p) {
	try { return fs.readFileSync(p).toString("base64"); } catch { return null; }
}

/** One row of `install`'s `  <mark> <label>  <status>  <detail>` output. */
function parseInstallLine(line) {
	const m = /^ {2}([+·–✗]) (.*)$/u.exec(line);
	if (!m) return null;
	const rest = m[2];
	const labelEnd = rest.search(/ {2}/);
	if (labelEnd === -1) return { mark: m[1], label: rest.trimEnd(), status: "", detail: "" };
	const label = rest.slice(0, labelEnd).trimEnd();
	const after = rest.slice(labelEnd).replace(/^ +/, "");
	const statusEnd = after.search(/ {2}/);
	const status = (statusEnd === -1 ? after : after.slice(0, statusEnd)).trimEnd();
	const detail = statusEnd === -1 ? "" : after.slice(statusEnd).replace(/^ +/, "");
	return { mark: m[1], label, status, detail };
}

function installRows(result) {
	return result.stdout.split(/\r?\n/).map(parseInstallLine).filter(Boolean);
}

function retiredLabels(result) {
	return installRows(result).filter((row) => row.label.startsWith("retired ")).map((row) => row.label);
}

/** One row of `doctor`'s `  <mark> <label>  <detail>` output. */
function parseDoctorLine(line) {
	const m = /^ {2}([✓✗!·]) (.*)$/u.exec(line);
	if (!m) return null;
	const rest = m[2];
	const labelEnd = rest.search(/ {2}/);
	const label = (labelEnd === -1 ? rest : rest.slice(0, labelEnd)).trimEnd();
	const detail = labelEnd === -1 ? "" : rest.slice(labelEnd).replace(/^ +/, "");
	return { mark: m[1], label, detail };
}

function doctorRow(result, label) {
	for (const line of result.stdout.split(/\r?\n/)) {
		const row = parseDoctorLine(line);
		if (row && row.label === label) return row;
	}
	return null;
}

function lastNonEmptyLine(result) {
	const lines = result.stdout.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
	return lines.at(-1) ?? "";
}

function staleLines(result) {
	return String(result.stdout ?? "").split(/\r?\n/).filter((line) => line.startsWith(STALE_PREFIX));
}

function codeSpansOf(line) {
	return [...line.matchAll(/`([^`]*)`/g)].map((m) => m[1]);
}

function firstCodeSpan(text) {
	const m = /`([^`]*)`/.exec(text ?? "");
	return m ? m[1] : null;
}

// ---------------------------------------------------------------- fixtures for R-2290/R-2292

/** `.claude` links to an empty `dotfiles-claude` BEFORE any install. */
function buildHomeA(name) {
	const home = fixtureHome(name);
	const cwd = freshCwd(`${name}-cwd`);
	const claude = path.join(home, ".claude");
	const dotfiles = makeDir(home, "dotfiles-claude");
	fs.symlinkSync(dotfiles, claude, linkType);
	return { home, cwd, linkedFolder: claude };
}

/** Installs normally, then renames `.claude` to `dotfiles-claude` and links it back. */
function buildHomeBD(name, extraEnv = {}) {
	const home = fixtureHome(name);
	const cwd = freshCwd(`${name}-cwd`);
	const first = runCli(["install"], { home, cwd, extraEnv });
	if (first.status !== 0) throw new Error(`fixture ${name}: the first install failed (${first.status})\n${first.stdout}\n${first.stderr}`);
	const claude = path.join(home, ".claude");
	const dotfiles = path.join(home, "dotfiles-claude");
	fs.renameSync(claude, dotfiles);
	fs.symlinkSync(dotfiles, claude, linkType);
	return { home, cwd, linkedFolder: claude };
}

/** A real `.claude` whose `skills` links to an empty `dotfiles-skills`, before any install. */
function buildHomeC(name) {
	const home = fixtureHome(name);
	const cwd = freshCwd(`${name}-cwd`);
	const claude = path.join(home, ".claude");
	fs.mkdirSync(claude, { recursive: true });
	const skills = path.join(claude, "skills");
	const dotfiles = makeDir(home, "dotfiles-skills");
	fs.symlinkSync(dotfiles, skills, linkType);
	return { home, cwd, linkedFolder: skills };
}

const homeA = buildHomeA("home-a");
const dryA = runCli(["install", "--dry-run"], { home: homeA.home, cwd: homeA.cwd });
const installA = runCli(["install"], { home: homeA.home, cwd: homeA.cwd });

const homeB = buildHomeBD("home-b");
const dryB = runCli(["install", "--dry-run"], { home: homeB.home, cwd: homeB.cwd });
const installB = runCli(["install"], { home: homeB.home, cwd: homeB.cwd });

const winEnv = { NANA_SETUP_PLATFORM: "win32" };
const homeD = buildHomeBD("home-d", winEnv);
const dryD = runCli(["install", "--dry-run"], { home: homeD.home, cwd: homeD.cwd, extraEnv: winEnv });
const installD = runCli(["install"], { home: homeD.home, cwd: homeD.cwd, extraEnv: winEnv });

const r2290Facts = {
	A: { dry: retiredLabels(dryA), install: retiredLabels(installA) },
	B: { dry: retiredLabels(dryB), install: retiredLabels(installB) },
	D: { dry: retiredLabels(dryD), install: retiredLabels(installD) },
};
const r2290Pass = Object.values(r2290Facts).every((f) => f.dry.length === 0 && f.install.length === 0);
// req: R-2290
check("R-2290: install through a linked Claude folder prints no retired row for an absent retired path or a skill link or copy install made", r2290Pass, JSON.stringify(r2290Facts));

// --------------------------------------------------------------------------------- R-2291

function buildR2291Home(name, linked) {
	const home = fixtureHome(name);
	const cwd = freshCwd(`${name}-cwd`);
	const claude = path.join(home, ".claude");
	let target = claude;
	if (linked) {
		target = makeDir(home, "dotfiles-claude");
		fs.symlinkSync(target, claude, linkType);
	} else {
		fs.mkdirSync(claude, { recursive: true });
	}
	fs.writeFileSync(path.join(claude, "enforce"), "");
	const hooksDir = path.join(claude, "hooks");
	fs.mkdirSync(hooksDir, { recursive: true });
	const objectiveLink = path.join(hooksDir, "nana-objective.sh");
	const contextLink = path.join(hooksDir, "context-size-check.sh");
	fs.symlinkSync(path.join(pkgRoot, "claude", "hooks", "nana-objective.sh"), objectiveLink);
	fs.symlinkSync(path.join(pkgRoot, "claude", "hooks", "context-size-check.sh"), contextLink);
	return { home, cwd, claude, target, objectiveLink, contextLink };
}

const r2291ProblemLabels = ["retired .claude/enforce", "retired nana-objective.sh link", "retired context-size-check.sh link"];

const r2291Linked = buildR2291Home("r2291-linked", true);
const r2291Before = {
	enforce: tryReadFileBase64(path.join(r2291Linked.claude, "enforce")),
	objective: tryReadlink(r2291Linked.objectiveLink),
	context: tryReadlink(r2291Linked.contextLink),
};
const r2291LinkedInstall = runCli(["install"], { home: r2291Linked.home, cwd: r2291Linked.cwd });
const r2291LinkedRows = installRows(r2291LinkedInstall);
const r2291LinkedStatuses = Object.fromEntries(r2291ProblemLabels.map((label) => [label, r2291LinkedRows.find((row) => row.label === label)?.status ?? null]));
const r2291After = {
	enforce: tryReadFileBase64(path.join(r2291Linked.claude, "enforce")),
	objective: tryReadlink(r2291Linked.objectiveLink),
	context: tryReadlink(r2291Linked.contextLink),
};
const r2291NoBackups = !fs.existsSync(path.join(r2291Linked.target, "backups"));

const r2291Control = buildR2291Home("r2291-control", false);
const r2291ControlInstall = runCli(["install"], { home: r2291Control.home, cwd: r2291Control.cwd });
const r2291ControlRows = installRows(r2291ControlInstall);
const r2291ControlStatuses = Object.fromEntries(r2291ProblemLabels.map((label) => [label, r2291ControlRows.find((row) => row.label === label)?.status ?? null]));

const r2291Pass =
	r2291ProblemLabels.every((label) => r2291LinkedStatuses[label] === "problem") &&
	JSON.stringify(r2291Before) === JSON.stringify(r2291After) &&
	r2291NoBackups &&
	r2291ProblemLabels.every((label) => r2291ControlStatuses[label] === "updated");
// req: R-2291
check("R-2291: through a linked Claude folder each present retired artifact is reported ✗ and left byte-for-byte untouched", r2291Pass, JSON.stringify({ linked: r2291LinkedStatuses, control: r2291ControlStatuses, before: r2291Before, after: r2291After, noBackups: r2291NoBackups }));

// --------------------------------------------------------------------------- R-2292 / R-2294

const homeC = buildHomeC("home-c");
const installC = runCli(["install"], { home: homeC.home, cwd: homeC.cwd });

const doctorA = runCli(["doctor"], { home: homeA.home, cwd: homeA.cwd });
const doctorC = runCli(["doctor"], { home: homeC.home, cwd: homeC.cwd });
const staleA = runStale(homeA.home, homeA.cwd);
const staleC = runStale(homeC.home, homeC.cwd);

function checkLinkedFolderNaming(result, staleResult, folder) {
	const rows = CLAUDE_SKILLS.map((name) => doctorRow(result, `skill ${name}`));
	const rowsOk = rows.length === CLAUDE_SKILLS.length && rows.every((row) =>
		row && row.mark === "✗" && firstCodeSpan(row.detail) === folder && row.detail.includes("move") && !row.detail.includes("missing — run"));
	const lines = staleLines(staleResult);
	const spans = codeSpansOf(lines[0] ?? "");
	const moveSpans = spans.slice(0, -1);
	const staleOk = lines.length === 1 && moveSpans.length === 1 && moveSpans[0] === folder;
	return { folder, rows, rowsOk, staleLine: lines[0] ?? null, staleOk };
}

const r2292A = checkLinkedFolderNaming(doctorA, staleA, homeA.linkedFolder);
const r2292C = checkLinkedFolderNaming(doctorC, staleC, homeC.linkedFolder);
const r2292Pass = r2292A.rowsOk && r2292A.staleOk && r2292C.rowsOk && r2292C.staleOk;
// req: R-2292
check("R-2292: every ✗ skill row doctor prints for a linked Claude or skills folder names the folder the session-start line names, to move aside", r2292Pass, JSON.stringify({ A: r2292A, C: r2292C }));

function fixByHandOk(result) {
	const line = lastNonEmptyLine(result);
	const handIdx = line.indexOf("fix by hand");
	if (handIdx === -1) return { ok: false, line };
	const thenIdx = line.indexOf("; then run");
	const segment = thenIdx === -1 ? line.slice(handIdx) : line.slice(handIdx, thenIdx);
	const labelsPresent = CLAUDE_SKILLS.every((name) => segment.includes(`skill ${name}`));
	const notBareInstall = !line.endsWith("missing — run: nana-setup install");
	return { ok: labelsPresent && notBareInstall, line };
}

const r2294A = fixByHandOk(doctorA);
const r2294C = fixByHandOk(doctorC);
const r2294Pass = r2294A.ok && r2294C.ok;
// req: R-2294
check("R-2294: doctor's last line lists every ✗ skill row under a linked Claude or skills folder as a fix by hand", r2294Pass, JSON.stringify({ A: r2294A, C: r2294C }));

// --------------------------------------------------------------------------------- R-2293

let r2293Pass = false;
let r2293Detail = "skipped: R-2292's facts did not hold, so there is no single folder to move aside";
if (r2292Pass) {
	const scratch = tmpDir(path.join(os.tmpdir(), "nana-linked-claude-moved-"));
	fs.renameSync(homeA.linkedFolder, path.join(scratch, "home-a-claude"));
	runCli(["install"], { home: homeA.home, cwd: homeA.cwd });
	const redoctorA = runCli(["doctor"], { home: homeA.home, cwd: homeA.cwd });

	fs.renameSync(homeC.linkedFolder, path.join(scratch, "home-c-skills"));
	runCli(["install"], { home: homeC.home, cwd: homeC.cwd });
	const redoctorC = runCli(["doctor"], { home: homeC.home, cwd: homeC.cwd });

	const skillRowsAllOk = (result) => CLAUDE_SKILLS.map((name) => doctorRow(result, `skill ${name}`)).every((row) => row && row.mark === "✓");
	r2293Pass = skillRowsAllOk(redoctorA) && skillRowsAllOk(redoctorC);
	r2293Detail = JSON.stringify({ A: redoctorA.stdout, C: redoctorC.stdout });
}
// req: R-2293
check("R-2293: moving aside the folder doctor's skill rows name and running install leaves every skill row ✓", r2293Pass, r2293Detail);

console.log(`SUMMARY  PASS=${passes} FAIL=${fails} SKIP=${skips}`);
process.exitCode = fails ? 1 : 0;
