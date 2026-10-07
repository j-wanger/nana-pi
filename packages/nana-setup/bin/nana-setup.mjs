#!/usr/bin/env node
/**
 * @module packages/nana-setup/bin/nana-setup.mjs
 * @purpose The nana-setup CLI: parse argv, resolve one layout, run the install / doctor / project
 *  command it names, and print one marked line per piece.
 * @inputs argv (`install` | `doctor` | `project [dir]`, plus --home, --claude-home, --pi-home,
 *  --desk, --name, --check, --not-a-project, --dry-run, --yes, -h/--help); process.cwd() for a
 *  defaulted project dir; whatever resolveLayout reads (HOME, PI_CODING_AGENT_DIR,
 *  NANA_SETUP_PLATFORM); the step and check reports returned by lib/steps, lib/doctor, lib/project.
 * @outputs stdout: the install root / claude home / pi home banner, a "<mark> <label> <status>
 *  <detail>" line per result (+ created|updated, · unchanged, – skipped, ✗ problem; ✓/✗/!/· for
 *  doctor), a closing summary and the "next:" hint; stderr: the usage text and error messages;
 *  process.exitCode.
 * @effects disk (through install / setupProject / dismissProject), process (the child processes
 *  those steps spawn; sets process.exitCode)
 * @errors exit 2 for an unknown option or command, no command, a SetupError (including a relative
 *  ambient PI_CODING_AGENT_DIR, a .nana-not-a-project marker, a missing parent directory); exit 1
 *  when any row is ✗ or, for doctor, any ✗/! row, and for an unexpected throw (stack on stderr);
 *  exit 0 otherwise
 */
// nana-setup — one command that makes this repo own the WHOLE nana experience: the Claude Code
// half (hooks, rules, settings wiring, two-tier auto-memory), the user-scope pi config, the
// PATH entry for pi-review, and — opt-in — the desk service.
//
//   node packages/nana-setup/bin/nana-setup.mjs install
//   node packages/nana-setup/bin/nana-setup.mjs doctor
//   node packages/nana-setup/bin/nana-setup.mjs project [dir]
//
// Run it as often as you like: it only ever ADDS, it backs up anything it replaces, and a
// second run reports "nothing to do".
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import { createInterface } from "node:readline/promises";
import { diagnose, STATUS } from "../lib/doctor.mjs";
import { repoRoot, resolveLayout, tildeify } from "../lib/paths.mjs";
import { checkProject, dismissProject, projectName, refuseIfDismissed, setupProject } from "../lib/project.mjs";
import { SetupError, install, installExitCode } from "../lib/steps.mjs";

const USAGE = `nana-setup — bootstrap the whole nana experience from this repo

  nana-setup install [options]        install / repair every piece (idempotent)
  nana-setup doctor  [options]        one ✓/✗/! line per piece; exits 1 on any ✗ or !
  nana-setup project [dir] [options]  make a folder a nana project (idempotent)
  nana-setup trust <dir> [--yes]      record pi project trust after confirmation

Options
  --home <dir>         put every user-scope location under <dir> (tests, dry machines)
  --claude-home <dir>  the .claude directory            (default ~/.claude)
  --pi-home <dir>      the pi agent directory           (default: PI_CODING_AGENT_DIR, else ~/.pi/agent)
  --desk               install + load the desk launchd service (macOS, opt-in)
  --name <n>           project: the project's name      (default: the folder's name)
  --check              project: one ✓/✗ line per file; exits 1 on any ✗
  --not-a-project      project: dismiss a git repository root once (writes .nana-not-a-project,
                       commit it); the seat stops reporting it. Delete the file to adopt later.
  --dry-run            report what would change, write nothing
  --yes                accepted for scripts; the installer never prompts
  -h, --help

What it never touches: an existing ~/.claude/rules/nana-personal.md (private — it is created
from the example only when absent and never read back), an existing nana-pack.json in the pi agent dir,
and any hook, setting or package entry that is already there.
`;

function parse(argv) {
	const opts = { _: [] };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === "--home" || a === "--claude-home" || a === "--pi-home") {
			const key = a === "--home" ? "home" : a === "--claude-home" ? "claudeHome" : "piHome";
			opts[key] = argv[++i];
			if (!opts[key]) throw new SetupError(`${a} needs a directory`);
		} else if (a === "--name") {
			opts.name = argv[++i];
			if (!opts.name) throw new SetupError("--name needs a value");
		} else if (a === "--check") opts.check = true;
		else if (a === "--desk") opts.desk = true;
		else if (a === "--not-a-project") opts.notAProject = true;
		else if (a === "--dry-run") opts.dryRun = true;
		else if (a === "--yes" || a === "-y") opts.yes = true;
		else if (a === "-h" || a === "--help") opts.help = true;
		else if (a.startsWith("-")) throw new SetupError(`unknown option ${a}`);
		else opts._.push(a);
	}
	return opts;
}

const SYMBOL = { created: "+", updated: "+", unchanged: "·", skipped: "–", problem: "✗" };

/**
 * An AMBIENT relative PI_CODING_AGENT_DIR resolves against THIS process's cwd, so any command that
 * reads or writes the user-scope pi directory would act on a directory pi started elsewhere never
 * sees. Every such command refuses (sol r2/r3); an explicit --pi-home / --home is the user's own
 * decision and never sets the flag. `doctor` warns instead, because its job is to report.
 */
function refuseCwdRelativePiHome(layout, what) {
	if (!layout.piHomeCwdRelative) return;
	throw new SetupError(
		`PI_CODING_AGENT_DIR is a relative path; here it resolves to ${layout.piHome}, which is specific to the ` +
			`current working directory (${layout.piHomeCwdRelative}) — pi started in any other folder reads a different ` +
			`directory, so ${what} would act on the wrong one. Pass --pi-home <absolute dir>, or set ` +
			"PI_CODING_AGENT_DIR to an absolute path, and re-run.",
	);
}

function runInstall(opts) {
	const layout = resolveLayout(opts);
	refuseCwdRelativePiHome(layout, "this install");
	console.log(`nana-setup install${opts.dryRun ? " (dry run)" : ""}`);
	console.log(`  install root  ${repoRoot}`);
	console.log(`  claude home   ${tildeify(layout.claudeHome)}`);
	console.log(`  pi home       ${tildeify(layout.piHome)}\n`);
	const results = install(layout, opts);
	const width = Math.max(...results.map((r) => r.label.length));
	for (const r of results) {
		const detail = r.detail ? `  ${r.detail}` : "";
		console.log(`  ${SYMBOL[r.status] ?? "?"} ${r.label.padEnd(width)}  ${r.status.padEnd(9)}${detail}`);
	}
	const changed = results.filter((r) => r.status === "created" || r.status === "updated").length;
	const skipped = results.filter((r) => r.status === "skipped").length;
	// A ✗ line means something on disk is wrong and only the owner can fix it. Never let the
	// summary call such a run "everything was already in place" (sol r2).
	const problems = results.filter((r) => r.status === "problem").length;
	console.log(
		changed === 0
			? problems
				? `\n  nothing changed — ${problems} ✗ needs your attention (above).`
				: `\n  nothing to do — everything was already in place${skipped ? ` (${skipped} skipped)` : ""}.`
			: `\n  ${changed} ${opts.dryRun ? "would change" : "changed"}, ${results.length - changed - skipped - problems} already in place${skipped ? `, ${skipped} skipped` : ""}${problems ? `, ${problems} ✗ needs your attention` : ""}.`,
	);
	if (!opts.dryRun) console.log("  next: nana-setup doctor");
	// A ✗ row is a machine that is NOT set up. Exiting 0 there tells automation the install
	// succeeded (sol r3) — the dry run included, since it reports the same ✗.
	return installExitCode(results);
}

function runDoctor(opts) {
	const layout = resolveLayout(opts);
	const checks = diagnose(layout);
	const width = Math.max(...checks.map((c) => c.label.length));
	console.log(`nana-setup doctor — ${repoRoot}\n`);
	for (const c of checks) {
		const mark = c.status === STATUS.OK ? "✓" : c.status === STATUS.FAIL ? "✗" : c.status === STATUS.WARN ? "!" : "·";
		console.log(`  ${mark} ${c.label.padEnd(width)}  ${c.detail ?? ""}`);
	}
	const bad = checks.filter((c) => c.status === STATUS.FAIL);
	// A ! line is never "all good": it means what was checked may not be what pi reads.
	const warn = checks.filter((c) => c.status === STATUS.WARN);
	console.log(
		bad.length
			? `\n  ${bad.length} missing — run: nana-setup install${warn.length ? ` (and see the ${warn.length} ! above)` : ""}`
			: warn.length
				? `\n  NOT verified — ${warn.length} ! above.`
				: "\n  all good.",
	);
	return bad.length || warn.length ? 1 : 0;
}

async function runProject(opts) {
	const dir = path.resolve(opts._[1] || process.cwd());
	if (opts.check) {
		// The same layout the setup used: `--check` reads the user-scope pi config so it can
		// mirror the one decision that depends on it (the pack-config omission) — so it needs the
		// same refusal as `install` (sol r3).
		const checkLayout = resolveLayout(opts);
		refuseCwdRelativePiHome(checkLayout, "this check");
		const checks = await checkProject(dir, checkLayout);
		const width = Math.max(...checks.map((c) => c.label.length));
		console.log(`nana-setup project --check — ${dir}\n`);
		for (const c of checks) console.log(`  ${c.ok ? "✓" : c.label === "post-edit commands" || c.label === "project trust" ? "!" : "✗"} ${c.label.padEnd(width)}  ${c.detail}`);
		const bad = checks.filter((c) => !c.ok);
		console.log(bad.length ? `\n  ${bad.length} missing — run: nana-setup project ${dir}` : "\n  all good.");
		return bad.length ? 1 : 0;
	}
	if (opts.notAProject) {
		const r = dismissProject(dir, opts);
		console.log(`nana-setup project --not-a-project${opts.dryRun ? " (dry run)" : ""}\n\n  ${SYMBOL[r.status] ?? "?"} ${r.label}  ${r.status}  ${path.join(dir, r.label)}`);
		if (!opts.dryRun && r.status === "created") console.log("  next: commit it, so every clone inherits the decision.");
		return r.status === "problem" ? 1 : 0;
	}
	refuseIfDismissed(dir); // before the mkdir / any seed: a recorded decision is never overridden
	// The user-scope read happens before anything is created, so refuse before the mkdir below.
	refuseCwdRelativePiHome(resolveLayout(opts), "this project setup");
	// A missing LEAF folder is created (this is "initiate a project"); a missing parent is the
	// user's typo, so it still aborts. Dry run reports instead of creating.
	if (!fs.existsSync(dir)) {
		const parent = path.dirname(dir);
		if (!fs.existsSync(parent)) throw new SetupError(`${parent} does not exist — check the path`);
		if (opts.dryRun) console.log(`  + folder        ${dir}  would create`);
		else fs.mkdirSync(dir);
	}
	const layout = resolveLayout(opts);
	console.log(`nana-setup project${opts.dryRun ? " (dry run)" : ""}`);
	console.log(`  project       ${dir}`);
	console.log(`  name          ${projectName(dir, opts)}`);
	console.log(`  seeds from    ${path.join(repoRoot, "templates", "_shared")}\n`);
	const results = await setupProject(dir, layout, opts);
	const width = Math.max(...results.map((r) => r.label.length));
	for (const r of results) {
		const detail = r.detail ? `  ${r.detail}` : "";
		console.log(`  ${SYMBOL[r.status] ?? "?"} ${r.label.padEnd(width)}  ${r.status.padEnd(9)}${detail}`);
	}
	const changed = results.filter((r) => r.status === "created" || r.status === "updated").length;
	const problems = results.filter((r) => r.status === "problem").length;
	console.log(
		problems
			? `\n  ${changed ? `${changed} ${opts.dryRun ? "would change" : "changed"}; ` : "nothing changed; "}${problems} ✗ needs your attention (above).`
			: changed === 0
				? "\n  nothing to do — everything was already in place."
				: `\n  ${changed} ${opts.dryRun ? "would change" : "changed"}.`,
	);
	if (!opts.dryRun) {
		console.log(`  next: 1. ratify the seeded OBJECTIVE.md: fill the date; the DRAFT lines are yours to ratify.\n        2. trust this folder: nana-setup trust <dir>`);
	}
	// Same rule as `install`: a ✗ row means this is not a set-up project (sol r3).
	return problems ? 1 : 0;
}

async function runTrust(opts) {
	const dirArg = opts._[1];
	if (!dirArg) throw new SetupError("trust needs a directory");
	const dir = path.resolve(dirArg);
	const layout = resolveLayout(opts);
	refuseCwdRelativePiHome(layout, "this trust decision");
	if (!opts.yes) {
		if (!process.stdin.isTTY || !process.stdout.isTTY) throw new SetupError("trust needs --yes when no interactive confirmation is available");
		const prompt = createInterface({ input: process.stdin, output: process.stdout });
		let answer;
		try { answer = await prompt.question(`Record affirmative pi trust for ${dir}? [y/N] `); } finally { prompt.close(); }
		if (!/^y(es)?$/i.test(answer.trim())) throw new SetupError("trust decision not recorded (confirmation declined)");
	}
	const root = spawnSync("npm", ["root", "-g"], { encoding: "utf8" });
	if (root.status !== 0 || !root.stdout.trim()) throw new SetupError("cannot locate the globally installed pi package");
	const trustModule = await import(pathToFileURL(path.join(root.stdout.trim(), "@earendil-works", "pi-coding-agent", "dist", "core", "trust-manager.js")).href);
	const store = new trustModule.ProjectTrustStore(layout.piHome);
	store.set(dir, true);
	console.log(`Recorded affirmative pi project trust for ${dir}`);
	console.log(`Trust store: ${store.trustPath}`);
}

async function main(argv) {
	let opts;
	try {
		opts = parse(argv);
	} catch (err) {
		console.error(err.message);
		return 2;
	}
	const cmd = opts._[0];
	if (opts.help || !cmd) {
		console.log(USAGE);
		return cmd ? 0 : 2;
	}
	try {
		if (cmd === "install") return runInstall(opts);
		if (cmd === "doctor") return runDoctor(opts);
		if (cmd === "project") return await runProject(opts);
		if (cmd === "trust") { await runTrust(opts); return 0; }
	} catch (err) {
		if (err instanceof SetupError) {
			console.error(`\nnana-setup: ${err.message}`);
			return 2;
		}
		throw err;
	}
	console.error(`unknown command ${cmd}\n\n${USAGE}`);
	return 2;
}

// `project` awaits a child process, so main is async: same exit codes, same error text.
main(process.argv.slice(2)).then(
	(code) => {
		process.exitCode = code;
	},
	(err) => {
		console.error(err?.stack || String(err));
		process.exitCode = 1;
	},
);
