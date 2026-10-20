/**
 * @module packages/nana-pack/tests/mutation-runner-takeover.test.mjs
 * @purpose Pin exclusive and recoverable takeover of dead or old unreadable mutation-runner worktree-operation locks.
 * @inputs ../lib/mutation-runner.mjs, ../lib/mutation-runner-config.mjs, and disposable lock fixtures under the OS temp directory
 * @outputs three PASS/FAIL lines, one for each of R-2170 to R-2172, and a non-zero exit when any check fails
 * @effects disk (temporary lock, marker and child-script files), process (spawns and safety-kills waiter children)
 * @errors a FAIL line names the broken takeover case; unexpected case errors are captured into that line
 */
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";
import { withWorktreeOperationLock } from "../lib/mutation-runner.mjs";
import * as CFG from "../lib/mutation-runner-config.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const RUNNER_LIB = path.join(REPO, "packages", "nana-pack", "lib", "mutation-runner.mjs");
const Q = '"';
const importLine = (bindings, specifier) => `import ${bindings} from ${Q}${specifier}${Q};`;

// chosen: the same impossible owner used by the R-1778 lock check, outside the platform process-id range.
const DEAD_PID = 2_147_483_647;
// chosen: one second beyond the configured stale boundary avoids filesystem timestamp rounding.
const OLD_MTIME_MARGIN_MS = 1_000;
// chosen: ten milliseconds polls promptly without making the parent or child spin hot.
const POLL_MS = 10;
// chosen: eight seconds allows process startup on a shared CI host while exposing a stuck schedule quickly.
const CASE_LIMIT_MS = 8_000;
// chosen: one second beyond the case limit guarantees every child has an independent safety kill.
const CHILD_SAFETY_MS = CASE_LIMIT_MS + 1_000;

let failures = 0;
const check = (name, ok, why = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : why); if (!ok) failures++; };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitUntil(predicate) {
	const end = Date.now() + CASE_LIMIT_MS;
	while (Date.now() < end) {
		if (predicate()) return true;
		await sleep(POLL_MS);
	}
	return false;
}
async function limited(label, action) {
	let timer;
	try {
		return await Promise.race([
			Promise.resolve().then(action),
			new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${label} exceeded ${CASE_LIMIT_MS} milliseconds`)), CASE_LIMIT_MS); }),
		]);
	} finally {
		clearTimeout(timer);
	}
}
async function capture(action) {
	try { return { ok: true, value: await action() }; }
	catch (error) { return { ok: false, error: error?.stack ?? String(error) }; }
}
const exists = (file) => fs.existsSync(file);
const read = (file) => { try { return fs.readFileSync(file, "utf8"); } catch { return ""; } };
const touch = (file, text = "1") => fs.writeFileSync(file, text);
const owner = (pid, label) => JSON.stringify({ pid, started: new Date().toISOString(), owner: label });
function putDeadLock(lockPath, kind, label = "dead-owner") {
	if (kind === "dead-pid") {
		fs.writeFileSync(lockPath, owner(DEAD_PID, label));
		return;
	}
	fs.writeFileSync(lockPath, `unreadable-${label}`);
	const old = new Date(Date.now() - CFG.WORKTREE_LOCK_UNREADABLE_STALE_MS - OLD_MTIME_MARGIN_MS);
	fs.utimesSync(lockPath, old, old);
}
function child(script, args) {
	const proc = spawn(process.execPath, [script, ...args], { stdio: ["ignore", "pipe", "pipe"] });
	let output = "";
	proc.stdout.on("data", (data) => { output += data; });
	proc.stderr.on("data", (data) => { output += data; });
	const done = new Promise((resolve) => {
		let settled = false;
		const safety = setTimeout(() => { try { proc.kill("SIGKILL"); } catch { /* already ended */ } }, CHILD_SAFETY_MS);
		const finish = (code, signal) => {
			if (settled) return;
			settled = true;
			clearTimeout(safety);
			resolve({ code, signal, output });
		};
		proc.on("error", (error) => finish(null, error.message));
		proc.on("close", finish);
	});
	return { proc, done };
}

const root = tmpDir(path.join(os.tmpdir(), "mutation-runner-takeover-"));
const waiterScript = path.join(root, "waiter.mjs");
fs.writeFileSync(waiterScript, [
	importLine("{ withWorktreeOperationLock }", pathToFileURL(RUNNER_LIB).href),
	importLine("* as fs", "node:fs"),
	"const [id, lockPath, markerPath, eventDir, schedule, expected, waitLimitRaw, pollRaw] = process.argv.slice(2);",
	"const waitLimitMs = Number(waitLimitRaw); const pollMs = Number(pollRaw);",
	"const sleeper = new Int32Array(new SharedArrayBuffer(4));",
	"const event = (name, text = '1') => fs.writeFileSync(`${eventDir}/${id}-${name}`, text, { flag: 'wx' });",
	"const pause = () => {",
	"  event('paused');",
	"  const end = Date.now() + waitLimitMs;",
	"  while (!fs.existsSync(`${eventDir}/release-${id}`) && Date.now() < end) Atomics.wait(sleeper, 0, 0, pollMs);",
	"  if (!fs.existsSync(`${eventDir}/release-${id}`)) throw new Error('pause release did not arrive');",
	"};",
	"let firstExpectedRead = true; let firstLockUnlink = true;",
	"const io = {",
	"  readFileSync: (...args) => {",
	"    const text = fs.readFileSync(...args);",
	"    if (id === 'B' && args[0] === lockPath && firstExpectedRead && text === expected) {",
	"      firstExpectedRead = false;",
	"      if (schedule === 'after-read') pause();",
	"    }",
	"    return text;",
	"  },",
	"  unlinkSync: (...args) => {",
	"    if (id === 'B' && args[0] === lockPath && firstLockUnlink) {",
	"      firstLockUnlink = false;",
	"      if (schedule === 'before-removal') pause();",
	"    }",
	"    return fs.unlinkSync(...args);",
	"  },",
	"};",
	"withWorktreeOperationLock(lockPath, () => {",
	"  let mine = false;",
	"  try { fs.writeFileSync(markerPath, id, { flag: 'wx' }); mine = true; }",
	"  catch (error) { if (error.code !== 'EEXIST') throw error; fs.appendFileSync(`${eventDir}/overlap`, `${id} found ${fs.readFileSync(markerPath, 'utf8')}\\n`); }",
	"  fs.appendFileSync(`${eventDir}/entered`, `${id}\\n`); event('entered');",
	"  const end = Date.now() + waitLimitMs;",
	"  while (!fs.existsSync(`${eventDir}/go-${id}`) && Date.now() < end) Atomics.wait(sleeper, 0, 0, pollMs);",
	"  if (mine) fs.unlinkSync(markerPath);",
	"}, { ...io, wait: (ms) => { try { event('wait'); } catch (error) { if (error.code !== 'EEXIST') throw error; } Atomics.wait(sleeper, 0, 0, ms); } });",
	"",
].join("\n"));

async function overlapCase(kind, schedule) {
	const td = path.join(root, `overlap-${kind}-${schedule}`);
	const events = path.join(td, "events");
	fs.mkdirSync(events, { recursive: true });
	const lockPath = path.join(td, "operation.lock");
	const markerPath = path.join(td, "inside.marker");
	putDeadLock(lockPath, kind);
	const expected = read(lockPath);
	const childBounds = [String(CASE_LIMIT_MS), String(POLL_MS)];
	const b = child(waiterScript, ["B", lockPath, markerPath, events, schedule, expected, ...childBounds]);
	const paused = await waitUntil(() => exists(path.join(events, "B-paused")));
	if (!paused) return { kind, schedule, paused, b: await b.done };
	const a = child(waiterScript, ["A", lockPath, markerPath, events, schedule, expected, ...childBounds]);
	const aSignalled = await waitUntil(() => exists(path.join(events, "A-entered")) || exists(path.join(events, "A-wait")));
	touch(path.join(events, "release-B"));
	const bSignalled = await waitUntil(() => exists(path.join(events, "B-entered")) || exists(path.join(events, "B-wait")));
	touch(path.join(events, "go-A"));
	touch(path.join(events, "go-B"));
	const [aResult, bResult] = await Promise.all([a.done, b.done]);
	const entries = read(path.join(events, "entered")).trim().split(/\r?\n/).filter(Boolean);
	return {
		kind, schedule, paused, aSignalled, bSignalled, aResult, bResult, entries,
		overlap: read(path.join(events, "overlap")), lockLeft: exists(lockPath),
	};
}

const overlapResults = [];
for (const schedule of ["after-read", "before-removal"]) {
	for (const kind of ["dead-pid", "old-unreadable"]) {
		overlapResults.push(await capture(() => limited(`${kind}/${schedule}`, () => overlapCase(kind, schedule))));
	}
}
const overlapOk = overlapResults.every((result) => result.ok
	&& result.value.paused && result.value.aSignalled && result.value.bSignalled
	&& result.value.overlap === "" && result.value.entries.filter((id) => id === "A").length === 1
	&& result.value.entries.filter((id) => id === "B").length === 1
	&& result.value.aResult.code === 0 && result.value.bResult.code === 0 && !result.value.lockLeft);
// req: R-2170
check("R-2170: two waiters taking over one dead or old unreadable lock never overlap when one stalls after its read or before its removal", overlapOk, JSON.stringify(overlapResults));

const killedScript = path.join(root, "killed-waiter.mjs");
fs.writeFileSync(killedScript, [
	importLine("{ withWorktreeOperationLock }", pathToFileURL(RUNNER_LIB).href),
	importLine("* as fs", "node:fs"),
	"const [lockPath] = process.argv.slice(2);",
	"withWorktreeOperationLock(lockPath, () => undefined, { unlinkSync: (...args) => { if (args[0] === lockPath) process.kill(process.pid, 'SIGKILL'); return fs.unlinkSync(...args); } });",
	"",
].join("\n"));

const recovery = await capture(() => limited("killed takeover recovery", async () => {
	const td = path.join(root, "killed-recovery");
	fs.mkdirSync(td, { recursive: true });
	const lockPath = path.join(td, "operation.lock");
	putDeadLock(lockPath, "dead-pid", "first-dead");
	const deadText = read(lockPath);
	const killed = child(killedScript, [lockPath]);
	const killedResult = await killed.done;
	const lockUnchanged = read(lockPath) === deadText;
	let clock = Date.now();
	const started = clock;
	let entered = 0;
	const reports = [];
	withWorktreeOperationLock(lockPath, () => { entered++; }, {
		now: () => clock,
		wait: (ms) => { clock += ms; },
		report: (line) => reports.push(line),
	});
	return {
		killedResult, lockUnchanged, entered, reports, elapsed: clock - started,
		lockLeft: exists(lockPath), breakerLeft: exists(`${lockPath}${CFG.WORKTREE_LOCK_BREAKER_SUFFIX}`),
	};
}));
const recoveryOk = recovery.ok && recovery.value.lockUnchanged && recovery.value.entered === 1
	&& recovery.value.reports.length === 0 && recovery.value.elapsed < CFG.WORKTREE_LOCK_WAIT_LIMIT_MS
	&& !recovery.value.lockLeft && !recovery.value.breakerLeft;
// req: R-2171
check("R-2171: a waiter killed just before it removes a dead owner's lock leaves that lock to the next waiter before the wait limit", recoveryOk, JSON.stringify(recovery));

const operationNames = ["readFileSync", "statSync", "linkSync", "unlinkSync"];
function sweepTakeover(kind, fault) {
	const td = path.join(root, `sweep-${kind}-${fault ? `${fault.code}-${fault.at}` : "baseline"}-${Math.random()}`);
	fs.mkdirSync(td, { recursive: true });
	const lockPath = path.join(td, "operation.lock");
	putDeadLock(lockPath, kind, "sweep-first");
	let clock = Date.now();
	const started = clock;
	let entered = 0;
	let laterEntered = 0;
	let call = 0;
	const calls = [];
	const reports = [];
	let faultEnabled = Boolean(fault);
	const io = {};
	for (const name of operationNames) {
		io[name] = (...args) => {
			call++;
			calls.push({ call, name, path: args[0] });
			if (faultEnabled && call === fault.at) {
				const error = Object.assign(new Error(`injected ${fault.code}`), { code: fault.code });
				throw error;
			}
			return fs[name](...args);
		};
	}
	const options = { ...io, now: () => clock, wait: (ms) => { clock += ms; }, report: (line) => reports.push(line) };
	withWorktreeOperationLock(lockPath, () => { entered++; }, options);
	const firstCallCount = calls.length;
	faultEnabled = false;
	putDeadLock(lockPath, kind, "sweep-next");
	withWorktreeOperationLock(lockPath, () => { laterEntered++; }, options);
	return {
		entered, laterEntered, firstCallCount, calls, reports, elapsed: clock - started,
		lockLeft: exists(lockPath), breakerLeft: exists(`${lockPath}${CFG.WORKTREE_LOCK_BREAKER_SUFFIX}`),
	};
}

const sweep = await capture(() => limited("transient operation sweep", async () => {
	const reasons = [];
	let cases = 0;
	for (const kind of ["dead-pid", "old-unreadable"]) {
		const baseline = sweepTakeover(kind, null);
		const n = baseline.firstCallCount;
		const baselineOk = baseline.entered === 1 && baseline.laterEntered === 1 && baseline.reports.length === 0
			&& baseline.elapsed < CFG.WORKTREE_LOCK_WAIT_LIMIT_MS && !baseline.lockLeft && !baseline.breakerLeft;
		cases++;
		if (!baselineOk) { reasons.push(`${kind}/no-error ${JSON.stringify(baseline)}`); break; }
		for (const code of ["EPERM", "EACCES", "EBUSY"]) {
			for (let at = 1; at <= n; at++) {
				const result = await capture(() => limited(`${kind}/${code}/${at}`, () => sweepTakeover(kind, { code, at })));
				cases++;
				const ok = result.ok && result.value.entered === 1 && result.value.laterEntered === 1
					&& result.value.reports.length === 0 && result.value.elapsed < CFG.WORKTREE_LOCK_WAIT_LIMIT_MS
					&& !result.value.lockLeft && !result.value.breakerLeft;
				if (!ok) { reasons.push(`${kind}/${code}/${at} ${JSON.stringify(result)}`); break; }
			}
			if (reasons.length) break;
		}
		if (reasons.length) break;
	}
	return { cases, reasons };
}));
const sweepOk = sweep.ok && sweep.value.reasons.length === 0;
// req: R-2172
check("R-2172: a takeover with no error or one transient error at any file operation still finishes, and so does the next takeover at that path, before the wait limit", sweepOk, JSON.stringify(sweep));

process.exitCode = failures ? 1 : 0;
