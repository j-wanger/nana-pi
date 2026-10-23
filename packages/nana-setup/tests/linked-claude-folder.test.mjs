/**
 * @module packages/nana-setup/tests/linked-claude-folder.test.mjs
 * @purpose Pin install's and doctor's behavior for linked Claude folders, including retired-artifact advice, healthy-row parity, and unreachable-folder preflight refusals.
 * @inputs The nana-setup CLI, `bin/stale-copies.mjs`, scratch homes and working folders, a pi stub, and PI_SUBAGENTS_FLOOR.
 * @outputs PASS/FAIL lines for R-2290 through R-2294 and R-2701 through R-2705, and a final SUMMARY line.
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

function copyTree(from, to) {
	const stat = fs.lstatSync(from);
	if (stat.isDirectory()) {
		fs.mkdirSync(to, { recursive: true });
		for (const name of fs.readdirSync(from)) copyTree(path.join(from, name), path.join(to, name));
	} else fs.copyFileSync(from, to);
}

function walk(home) {
	const entries = [];
	const visit = (dir) => {
		for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
			const absolute = path.join(dir, entry.name);
			const relative = path.relative(home, absolute).split(path.sep).join("/");
			const stat = fs.lstatSync(absolute);
			if (stat.isSymbolicLink()) entries.push(["link", relative, tryReadlink(absolute)]);
			else if (stat.isDirectory()) { entries.push(["directory", relative]); visit(absolute); }
			else if (stat.isFile()) entries.push(["file", relative, fs.readFileSync(absolute).toString("base64")]);
			else entries.push(["other", relative]);
		}
	};
	visit(home);
	return entries;
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

// -------------------------------------------------------------------------- R-2701 / R-2702

const retiredFixture = path.join(pkgRoot, "tests", "fixtures", "retired", "py-init");
const legacyRows = [
	{ label: "legacy enforcement flags", folder: (item) => item.claude, names: (item) => item.flags },
	{ label: "legacy scaffolders", folder: (item) => item.skills, names: () => ["py-init"] },
];

function buildLegacyHome(name, linked) {
	const home = fixtureHome(name);
	const cwd = freshCwd(`${name}-cwd`);
	const claude = path.join(home, ".claude");
	let linkedFolder = null;
	if (linked === "claude") {
		const target = makeDir(home, `${name}-dotfiles-claude`);
		fs.symlinkSync(target, claude, linkType);
		linkedFolder = claude;
	} else {
		fs.mkdirSync(claude, { recursive: true });
	}
	const skills = path.join(claude, "skills");
	if (linked === "skills") {
		const target = makeDir(home, `${name}-dotfiles-skills`);
		fs.symlinkSync(target, skills, linkType);
		linkedFolder = skills;
	} else fs.mkdirSync(skills, { recursive: true });
	const flags = linked === "claude" ? ["enforce-memory"] : ["enforce", "enforce-memory"];
	for (const flag of flags) fs.writeFileSync(path.join(claude, flag), "");
	copyTree(retiredFixture, path.join(skills, "py-init"));
	return { home, cwd, claude, skills, flags, linked, linkedFolder };
}

const legacyHomes = [
	buildLegacyHome("legacy-claude", "claude"),
	buildLegacyHome("legacy-skills", "skills"),
	buildLegacyHome("legacy-none", "none"),
];
const legacyFacts = legacyHomes.map((item) => {
	const doctor = runCli(["doctor"], item);
	const dry = runCli(["install", "--dry-run"], item);
	const rows = installRows(dry);
	const facts = legacyRows.map((spec) => {
		const names = spec.names(item);
		const paths = names.map((name) => path.join(spec.folder(item), name));
		const dryRows = paths.map((presentPath) => rows.find((row) => row.label === `retired ${path.relative(item.home, presentPath).split(path.sep).join("/")}`));
		const refused = item.linked === "claude" || item.linked === "skills" && spec.label === "legacy scaffolders";
		const row = doctorRow(doctor, spec.label);
		const spans = codeSpansOf(row?.detail ?? "");
		const dryOk = dryRows.length === paths.length && dryRows.every((dryRow) => dryRow?.status === (refused ? "problem" : "updated"));
		const adviceOk = refused
			? row?.mark === "!" && spans[0] === item.linkedFolder && JSON.stringify(spans.slice(1)) === JSON.stringify(paths) && row.detail.includes("install will not back these up through the linked folder") && row.detail.includes("out of the way by hand") && !row.detail.includes("nana-setup install")
			: row?.mark === "!" && row.detail.includes("run nana-setup install");
		return { label: spec.label, paths, refused, dryRows, row, dryOk, adviceOk };
	});
	return { linked: item.linked, doctorStatus: doctor.status, dryStatus: dry.status, facts };
});
const r2701Pass = legacyFacts.every((item) => item.facts.every((fact) => fact.dryOk && fact.adviceOk));
// req: R-2701
check("R-2701: under a linked Claude or skills folder, each legacy row install's dry run refuses names that folder and every present path to move by hand, and a row install would move keeps its install advice", r2701Pass, JSON.stringify(legacyFacts));

const movedRoot = tmpDir(path.join(os.tmpdir(), "nana-linked-legacy-moved-"));
const r2702Facts = legacyHomes.filter((item) => item.linkedFolder).map((item) => {
	const before = runCli(["doctor"], item);
	const byHand = legacyRows.flatMap((spec) => {
		const row = doctorRow(before, spec.label);
		if (!row || row.detail.includes("nana-setup install")) return [];
		return [{ label: spec.label, paths: codeSpansOf(row.detail).slice(1) }];
	});
	let moves = 0;
	for (const row of byHand) for (const source of row.paths) {
		fs.renameSync(source, path.join(movedRoot, `${item.linked}-${moves}-${path.basename(source)}`));
		moves++;
	}
	const after = runCli(["doctor"], item);
	const rowsOk = byHand.every(({ label }) => {
		const row = doctorRow(after, label);
		return row?.mark === "✓" && row.detail === "none present";
	});
	return { linked: item.linked, byHand, moves, rowsOk, afterStatus: after.status };
});
const r2702Pass = r2702Facts.length === 2 && r2702Facts.every((item) => item.byHand.length > 0 && item.moves > 0 && item.rowsOk);
// req: R-2702
check("R-2702: moving every path a legacy row names to move by hand leaves that row ✓", r2702Pass, JSON.stringify(r2702Facts));

// --------------------------------------------------------------------------------- R-2703

function buildInstalledSkillsLink(name, extraEnv = {}) {
	const home = fixtureHome(name);
	const cwd = freshCwd(`${name}-cwd`);
	const installed = runCli(["install"], { home, cwd, extraEnv });
	if (installed.status !== 0) throw new Error(`fixture ${name}: install failed (${installed.status})\n${installed.stdout}\n${installed.stderr}`);
	const skills = path.join(home, ".claude", "skills");
	const target = path.join(home, `${name}-dotfiles-skills`);
	fs.renameSync(skills, target);
	fs.symlinkSync(target, skills, linkType);
	return { home, cwd, linkedFolder: skills };
}

const parityLabels = [...CLAUDE_SKILLS.map((name) => `skill ${name}`), "legacy enforcement flags", "legacy scaffolders"];
const r2703Facts = [
	{ name: "native", extraEnv: {} },
	{ name: "forced-win32", extraEnv: winEnv },
].map(({ name, extraEnv }) => {
	const controlHome = fixtureHome(`parity-${name}-control`);
	const controlCwd = freshCwd(`parity-${name}-control-cwd`);
	const controlInstall = runCli(["install"], { home: controlHome, cwd: controlCwd, extraEnv });
	const claude = buildHomeBD(`parity-${name}-claude`, extraEnv);
	const skills = buildInstalledSkillsLink(`parity-${name}-skills`, extraEnv);
	const controlDoctor = runCli(["doctor"], { home: controlHome, cwd: controlCwd, extraEnv });
	const linkedDoctors = [
		runCli(["doctor"], { ...claude, extraEnv }),
		runCli(["doctor"], { ...skills, extraEnv }),
	];
	const rowsOk = controlInstall.status === 0 && linkedDoctors.every((doctor) => parityLabels.every((label) => {
		const expected = doctorRow(controlDoctor, label);
		const actual = doctorRow(doctor, label);
		return expected?.mark === "✓" && actual?.mark === "✓" && actual.detail === expected.detail;
	}));
	return { name, controlInstall: controlInstall.status, controlDoctor: controlDoctor.status, linkedStatuses: linkedDoctors.map((doctor) => doctor.status), rowsOk };
});
const r2703Pass = r2703Facts.every((item) => item.rowsOk);
// req: R-2703
check("R-2703: in a home whose Claude or skills folder is a link, every ✓ skill and legacy row reads as it does in an unlinked home", r2703Pass, JSON.stringify(r2703Facts));

// -------------------------------------------------------------------------- R-2704 / R-2705

function buildBrokenFolder(name, relative, extraEnv = {}, { loop = false } = {}) {
	const home = fixtureHome(name);
	const cwd = freshCwd(`${name}-cwd`);
	const claude = path.join(home, ".claude");
	if (relative) fs.mkdirSync(path.dirname(path.join(claude, relative)), { recursive: true });
	const link = relative ? path.join(claude, relative) : claude;
	if (loop) fs.symlinkSync(link, link, "dir");
	else {
		const target = makeDir(home, `${name}-target`);
		fs.symlinkSync(target, link, linkType);
		fs.rmSync(target, { recursive: true });
	}
	return { name, home, cwd, link, extraEnv, loop };
}

function firstRefusalLine(result) {
	return String(result.stderr ?? "").split(/\r?\n/).map((line) => line.trim()).find((line) => line.startsWith("nana-setup: "))?.slice("nana-setup: ".length) ?? "";
}

function failedDoctorCount(result) {
	return result.stdout.split(/\r?\n/).filter((line) => /^\s*✗ /u.test(line)).length;
}

const brokenCases = [
	buildBrokenFolder("broken-native-claude", ""),
	buildBrokenFolder("broken-native-rules", "rules"),
	buildBrokenFolder("broken-native-memory", "nana-memory"),
	buildBrokenFolder("broken-native-shared", path.join("nana-memory", "shared")),
	...(process.platform === "win32" ? [] : [buildBrokenFolder("broken-native-hooks", "hooks")]),
	buildBrokenFolder("broken-win32-claude", "", winEnv),
	buildBrokenFolder("broken-win32-rules", "rules", winEnv),
	buildBrokenFolder("broken-win32-memory", "nana-memory", winEnv),
	buildBrokenFolder("broken-win32-shared", path.join("nana-memory", "shared"), winEnv),
	...(process.platform === "win32" ? [] : [buildBrokenFolder("broken-native-rules-loop", "rules", {}, { loop: true })]),
];
const brokenFacts = brokenCases.map((item) => {
	const before = walk(item.home);
	const install = runCli(["install"], item);
	const after = walk(item.home);
	const refusal = firstRefusalLine(install);
	const unchanged = JSON.stringify(after) === JSON.stringify(before);
	const noStack = !/^\s+at /m.test(`${install.stdout}\n${install.stderr}`);
	return { ...item, before, after, install, refusal, unchanged, noStack };
});

const skillsControl = buildBrokenFolder("broken-control-skills", "skills");
const skillsInstall = runCli(["install"], skillsControl);
const skillsDoctor = runCli(["doctor"], skillsControl);
const skillsSummary = lastNonEmptyLine(skillsDoctor);
const skillsControlOk = skillsInstall.status === 1 && !/^\s+at /m.test(`${skillsInstall.stdout}\n${skillsInstall.stderr}`) && fs.existsSync(path.join(skillsControl.home, ".claude", "rules")) && CLAUDE_SKILLS.every((name) => skillsSummary.includes(`skill ${name}`)) && skillsSummary.includes("fix by hand") && !skillsSummary.includes("will not run until this is fixed");

const hooksControl = buildBrokenFolder("broken-control-win32-hooks", "hooks", winEnv);
const hooksInstall = runCli(["install"], hooksControl);
const hooksControlOk = hooksInstall.status === 0 && !/^\s+at /m.test(`${hooksInstall.stdout}\n${hooksInstall.stderr}`) && !hooksInstall.stderr.includes(hooksControl.link);

const r2704Pass = brokenFacts.every((item) => item.install.status === 2 && item.refusal.startsWith(`${item.link} `) && item.refusal.includes("move") && (item.loop ? item.refusal.includes("(ELOOP)") : true) && item.noStack && item.unchanged) && skillsControlOk && hooksControlOk;
// req: R-2704
check("R-2704: a Claude home, or its rules, shared-memory or (off win32) hooks folder, that is a link whose target cannot be reached makes install refuse before any write, naming that link, and a broken skills or win32 hooks link does not", r2704Pass, JSON.stringify({ broken: brokenFacts.map((item) => ({ name: item.name, link: item.link, status: item.install.status, refusal: item.refusal, unchanged: item.unchanged, noStack: item.noStack, stderr: item.install.stderr })), skills: { status: skillsInstall.status, summary: skillsSummary, stderr: skillsInstall.stderr, ok: skillsControlOk }, hooks: { status: hooksInstall.status, stderr: hooksInstall.stderr, ok: hooksControlOk } }));

const r2705Facts = brokenFacts.map((item) => {
	const doctor = runCli(["doctor"], item);
	const count = failedDoctorCount(doctor);
	const summary = lastNonEmptyLine(doctor);
	const expected = `${count} missing — nana-setup install will not run until this is fixed: ${item.refusal}`;
	return { name: item.name, status: doctor.status, count, summary, expected, ok: doctor.status === 1 && count > 0 && summary.startsWith(expected) };
});
const r2705Pass = r2705Facts.every((item) => item.ok);
// req: R-2705
check("R-2705: for such a broken link, doctor's last line names install's refusal instead of telling the user to run install", r2705Pass, JSON.stringify(r2705Facts));

console.log(`SUMMARY  PASS=${passes} FAIL=${fails} SKIP=${skips}`);
process.exitCode = fails ? 1 : 0;
