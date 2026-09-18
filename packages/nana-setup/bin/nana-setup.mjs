#!/usr/bin/env node
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
import * as fs from "node:fs";
import * as path from "node:path";
import { diagnose, STATUS } from "../lib/doctor.mjs";
import { repoRoot, resolveLayout, tildeify } from "../lib/paths.mjs";
import { checkProject, projectName, setupProject } from "../lib/project.mjs";
import { SetupError, install } from "../lib/steps.mjs";

const USAGE = `nana-setup — bootstrap the whole nana experience from this repo

  nana-setup install [options]        install / repair every piece (idempotent)
  nana-setup doctor  [options]        one ✓/✗ line per piece; exits 1 on any ✗
  nana-setup project [dir] [options]  make a folder a nana project (idempotent)

Options
  --home <dir>         put every user-scope location under <dir> (tests, dry machines)
  --claude-home <dir>  the .claude directory            (default ~/.claude)
  --pi-home <dir>      the pi agent directory           (default ~/.pi/agent)
  --desk               install + load the desk launchd service (macOS, opt-in)
  --name <n>           project: the project's name      (default: the folder's name)
  --check              project: one ✓/✗ line per file; exits 1 on any ✗
  --dry-run            report what would change, write nothing
  --yes                accepted for scripts; the installer never prompts
  -h, --help

What it never touches: an existing ~/.claude/rules/nana-personal.md (private — it is created
from the example only when absent and never read back), an existing ~/.pi/agent/nana-pack.json,
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
		else if (a === "--dry-run") opts.dryRun = true;
		else if (a === "--yes" || a === "-y") opts.yes = true;
		else if (a === "-h" || a === "--help") opts.help = true;
		else if (a.startsWith("-")) throw new SetupError(`unknown option ${a}`);
		else opts._.push(a);
	}
	return opts;
}

const SYMBOL = { created: "+", updated: "+", unchanged: "·", skipped: "–" };

function runInstall(opts) {
	const layout = resolveLayout(opts);
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
	console.log(
		changed === 0
			? `\n  nothing to do — everything was already in place${skipped ? ` (${skipped} skipped)` : ""}.`
			: `\n  ${changed} ${opts.dryRun ? "would change" : "changed"}, ${results.length - changed - skipped} already in place${skipped ? `, ${skipped} skipped` : ""}.`,
	);
	if (!opts.dryRun) console.log("  next: nana-setup doctor");
	return 0;
}

function runDoctor(opts) {
	const layout = resolveLayout(opts);
	const checks = diagnose(layout);
	const width = Math.max(...checks.map((c) => c.label.length));
	console.log(`nana-setup doctor — ${repoRoot}\n`);
	for (const c of checks) {
		const mark = c.status === STATUS.OK ? "✓" : c.status === STATUS.FAIL ? "✗" : "·";
		console.log(`  ${mark} ${c.label.padEnd(width)}  ${c.detail ?? ""}`);
	}
	const bad = checks.filter((c) => c.status === STATUS.FAIL);
	console.log(bad.length ? `\n  ${bad.length} missing — run: nana-setup install` : "\n  all good.");
	return bad.length ? 1 : 0;
}

function runProject(opts) {
	const dir = path.resolve(opts._[1] || process.cwd());
	if (opts.check) {
		const checks = checkProject(dir);
		const width = Math.max(...checks.map((c) => c.label.length));
		console.log(`nana-setup project --check — ${dir}\n`);
		for (const c of checks) console.log(`  ${c.ok ? "✓" : "✗"} ${c.label.padEnd(width)}  ${c.detail}`);
		const bad = checks.filter((c) => !c.ok);
		console.log(bad.length ? `\n  ${bad.length} missing — run: nana-setup project ${dir}` : "\n  all good.");
		return bad.length ? 1 : 0;
	}
	if (!fs.existsSync(dir)) throw new SetupError(`${dir} does not exist — create the folder first`);
	const layout = resolveLayout(opts);
	console.log(`nana-setup project${opts.dryRun ? " (dry run)" : ""}`);
	console.log(`  project       ${dir}`);
	console.log(`  name          ${projectName(dir, opts)}`);
	console.log(`  seeds from    ${path.join(repoRoot, "templates", "_shared")}\n`);
	const results = setupProject(dir, layout, opts);
	const width = Math.max(...results.map((r) => r.label.length));
	for (const r of results) {
		const detail = r.detail ? `  ${r.detail}` : "";
		console.log(`  ${SYMBOL[r.status] ?? "?"} ${r.label.padEnd(width)}  ${r.status.padEnd(9)}${detail}`);
	}
	const changed = results.filter((r) => r.status === "created" || r.status === "updated").length;
	console.log(changed === 0 ? "\n  nothing to do — everything was already in place." : `\n  ${changed} ${opts.dryRun ? "would change" : "changed"}.`);
	if (!opts.dryRun && changed) {
		console.log("  next: open a session here and ratify the two DRAFT lines in OBJECTIVE.md — they are yours, not a default.");
	}
	return 0;
}

function main(argv) {
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
		if (cmd === "project") return runProject(opts);
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

process.exitCode = main(process.argv.slice(2));
