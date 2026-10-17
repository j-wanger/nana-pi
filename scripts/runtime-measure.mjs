#!/usr/bin/env node
/**
 * @module scripts/runtime-measure.mjs
 * @purpose Run the suite once under per-file coverage and write the runtime-map data file.
 * @inputs the repo root, env (passed to the suite, with the coverage knob added), and injectable suite
 *  start, signal source, process listing and kill calls for tests
 * @outputs the runtime data file (schema 1 JSON: tracked-file hashes and per-test label/seconds/ran) and
 *  the suite's own exit code
 * @effects process (spawns git and the locked suite, forwards SIGINT/SIGTERM, lists and kills the suite's
 *  process tree), disk (a temp coverage folder under the OS temp folder, the runtime data file)
 * @errors leaves earlier runtime data unchanged and exits non-zero when the suite's completion record is
 *  missing or disagrees with the records read, or when a stop signal arrives before the suite finishes;
 *  otherwise exits with the suite's own exit code
 */
// must-meet.md (docs/reviews/runtime-map-2026-10-17/) R-1271, R-1275, R-1277, R-1278 — the write half of
// the runtime map. `npm run map:measure` runs this with no arguments; scripts/code-map.mjs's --impact
// reads what this writes through packages/nana-pack/lib/runtime-map.mjs, the shared reader.
import { spawn, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import {
	COMPLETION_FILE,
	COVERAGE_ENV,
	COVERAGE_PREFIX,
	RECORD_FILE,
	RUNTIME_SCHEMA,
	STOP_SIGNALS,
	STOP_WAIT_MS,
	TREE_LIST,
} from "../packages/nana-pack/lib/runtime-map-config.mjs";
import { dataPath, hashFile } from "../packages/nana-pack/lib/runtime-map.mjs";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Every file git tracks in `root`, repo-relative POSIX paths. */
export function trackedFiles(root, { git = (args) => spawnSync("git", args, { encoding: "utf8", cwd: root }) } = {}) {
	const r = git(["ls-files"]);
	if (r.status !== 0) throw new Error(`git ls-files failed in ${root}: ${(r.stderr ?? "").trim()}`);
	return r.stdout.split("\n").filter(Boolean);
}

/** The default suite: test-locked, no filter argument, the coverage knob pointed at `coverageDir`. */
export function suiteCommand(root, env, coverageDir) {
	return {
		command: process.execPath,
		args: [path.join(root, "scripts", "test-locked.mjs")],
		options: { cwd: root, env: { ...env, [COVERAGE_ENV]: coverageDir }, stdio: "inherit" },
	};
}

function defaultStart({ root, env, coverageDir }) {
	const spec = suiteCommand(root, env, coverageDir);
	return spawn(spec.command, spec.args, spec.options);
}

/**
 * One V8 coverage result's url mapped to a repo-relative tracked path, or null for anything else:
 * a node: or eval entry, a file outside `root`, or a file `tracked` (a Set) does not hold.
 */
export function repoFileOf(url, root, tracked) {
	let file;
	try {
		file = fileURLToPath(url);
	} catch {
		return null;
	}
	const relPath = path.relative(root, file).split(path.sep).join("/");
	if (!relPath || relPath.startsWith("..") || path.isAbsolute(relPath)) return null;
	return tracked.has(relPath) ? relPath : null;
}

/** Every repo-relative tracked file a run-position folder's coverage files name, deduplicated. */
export function readFolder(dir, root, tracked, { readdir = fs.readdirSync, readFile = (f) => fs.readFileSync(f, "utf8") } = {}) {
	let entries;
	try {
		entries = readdir(dir);
	} catch {
		return { ran: [] };
	}
	const ran = new Set();
	for (const name of entries) {
		if (!name.startsWith("coverage-") || !name.endsWith(".json")) continue;
		let parsed;
		try {
			parsed = JSON.parse(readFile(path.join(dir, name)));
		} catch {
			continue; // a half-written or unreadable coverage file is left out, never thrown (R-1271)
		}
		for (const r of parsed.result ?? []) {
			const f = repoFileOf(r.url, root, tracked);
			if (f) ran.add(f);
		}
	}
	return { ran: [...ran].sort() };
}

/** pid -> {ppid, pgid} from a `ps -A -o pid=,ppid=,pgid=`-shaped listing. */
function parseTree(output) {
	const procs = new Map();
	for (const line of output.split("\n")) {
		const m = /^\s*(\d+)\s+(\d+)\s+(\d+)\s*$/.exec(line);
		if (m) procs.set(Number(m[1]), { ppid: Number(m[2]), pgid: Number(m[3]) });
	}
	return procs;
}

/** `rootPid` and every process reachable by following parent links down from it. */
function descendantsOf(rootPid, procs) {
	const children = new Map();
	for (const [pid, info] of procs) {
		if (!children.has(info.ppid)) children.set(info.ppid, []);
		children.get(info.ppid).push(pid);
	}
	const seen = new Set();
	const queue = [rootPid];
	while (queue.length) {
		const pid = queue.shift();
		if (seen.has(pid)) continue;
		seen.add(pid);
		for (const child of children.get(pid) ?? []) queue.push(child);
	}
	return seen;
}

/**
 * End the suite's whole process tree rooted at `rootPid` (R-1277, seat amendment 1): kill by
 * process group every group whose members all lie in the tree, and by pid any tree process
 * whose group also holds a process outside the tree — so a group shared with this command's own
 * caller, which always holds a process outside the tree, is never signalled as a group.
 */
export function killTree(rootPid, { run = (args) => spawnSync(args[0], args.slice(1), { encoding: "utf8" }), kill = process.kill } = {}) {
	const listing = run(TREE_LIST);
	if (listing.status !== 0 || !listing.stdout) return;
	const procs = parseTree(listing.stdout);
	const tree = descendantsOf(rootPid, procs);
	const groupHasOutsider = new Set();
	for (const [pid, info] of procs) if (!tree.has(pid)) groupHasOutsider.add(info.pgid);
	const killedGroups = new Set();
	for (const pid of tree) {
		const info = procs.get(pid);
		if (!info) continue;
		if (groupHasOutsider.has(info.pgid)) {
			try { kill(pid, "SIGKILL"); } catch {}
		} else if (!killedGroups.has(info.pgid)) {
			killedGroups.add(info.pgid);
			try { kill(-info.pgid, "SIGKILL"); } catch {}
		}
	}
}

/**
 * Run the suite once under per-file coverage and write the runtime data (R-1271, R-1275, R-1277,
 * R-1278). Every dependency is injectable so a check can drive both the happy path and a stop
 * signal without a real suite.
 */
export async function measure({
	root = ROOT,
	env = process.env,
	dataFile,
	start = defaultStart,
	onSignal = (sig, handler) => process.on(sig, handler),
	stopWaitMs = STOP_WAIT_MS,
	platform = process.platform,
	run,
	kill = process.kill,
} = {}) {
	const resolvedDataFile = dataFile ?? dataPath(root, { env });
	const tracked = trackedFiles(root);
	const trackedSet = new Set(tracked);
	const hashes = {};
	for (const f of tracked) hashes[f] = hashFile(path.join(root, f));

	const coverageDir = fs.mkdtempSync(path.join(os.tmpdir(), COVERAGE_PREFIX));
	const cleanupCoverage = () => { try { fs.rmSync(coverageDir, { recursive: true, force: true }); } catch {} };

	let stopping = false;
	let stopPromise = null;
	let child;
	let exitResolve;
	const exited = new Promise((resolve) => { exitResolve = resolve; });

	// Runs the tree kill synchronously (before this function's first `await`) so a second
	// signal delivered moments later always finds `stopping` already true. The MAIN flow below
	// awaits `stopPromise` itself before exiting, so cleanup always finishes before the process
	// does — it never races a trailing exit from the caller against this handler's own.
	const stop = () => {
		if (stopping) return; // once or twice (R-1277): the second delivery is a no-op
		stopping = true;
		stopPromise = (async () => {
			if (child?.pid != null) {
				if (platform !== "win32") killTree(child.pid, { run, kill });
				else { try { kill(child.pid, "SIGKILL"); } catch {} }
			}
			await Promise.race([exited, sleep(stopWaitMs)]);
			cleanupCoverage();
		})();
	};
	for (const sig of STOP_SIGNALS) onSignal(sig, stop);

	child = start({ root, env, coverageDir });
	child.once("exit", (code) => exitResolve(code ?? 1));
	child.once("error", () => exitResolve(1));
	const suiteCode = await exited;
	if (stopping) {
		await stopPromise; // let the kill, wait and coverage cleanup finish before exiting
		process.exit(1);
	}

	const positions = fs.existsSync(coverageDir) ? fs.readdirSync(coverageDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort() : [];
	const tests = {};
	for (const name of positions) {
		const dir = path.join(coverageDir, name);
		let record;
		try {
			record = JSON.parse(fs.readFileSync(path.join(dir, RECORD_FILE), "utf8"));
		} catch {
			continue; // no readable record for this position: it does not count toward "records read"
		}
		const { ran } = readFolder(dir, root, trackedSet);
		tests[record.path] = { label: record.label, seconds: record.seconds, ran };
	}
	let completion = null;
	try {
		completion = JSON.parse(fs.readFileSync(path.join(coverageDir, COMPLETION_FILE), "utf8"));
	} catch {
		completion = null;
	}
	if (!completion || completion.files !== Object.keys(tests).length) {
		cleanupCoverage();
		process.exitCode = suiteCode !== 0 ? suiteCode : 1;
		return;
	}

	const data = { schema: RUNTIME_SCHEMA, hashes, tests };
	fs.mkdirSync(path.dirname(resolvedDataFile), { recursive: true });
	const tmp = `${resolvedDataFile}.tmp-${process.pid}`;
	fs.writeFileSync(tmp, JSON.stringify(data));
	fs.renameSync(tmp, resolvedDataFile);
	cleanupCoverage();
	process.exitCode = suiteCode;
}

const invokedDirectly = process.argv[1] && fs.existsSync(process.argv[1]) && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
if (invokedDirectly) await measure({ root: ROOT });
