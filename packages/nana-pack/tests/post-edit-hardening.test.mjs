/**
 * @module packages/nana-pack/tests/post-edit-hardening.test.mjs
 * @purpose Pins that the post-edit checker ends a timed-out or aborted command's process tree on every platform
 * @inputs extensions/nana-post-edit.ts and stub checkers that ignore signals, leak descendants or record a two-level process tree, under a temp HOME
 * @outputs PASS/FAIL/SKIP lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp HOME, stub checker scripts), process (sets HOME and Windows PATH, spawns and kills the stub checkers and their descendants)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
import { tmpDir } from "./tmp-dir.mjs";
import { execFileSync, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
// L1 fixture: a nana-only `.pi/` is never nana-trusted (pi auto-trusts it; that is not a
// decision), so this file's config lives at USER scope under an isolated HOME
// (os.homedir() reads HOME on posix, USERPROFILE on win32).
const NANA_HOME = tmpDir(path.join(os.tmpdir(), "nana-home-"));
process.env.HOME = NANA_HOME;
process.env.USERPROFILE = NANA_HOME;
const USER_CFG = path.join(NANA_HOME, ".pi", "agent", "nana-pack.json");
fs.mkdirSync(path.dirname(USER_CFG), { recursive: true });
// Liveness + fidelity properties of the post-edit checker, driving the REAL
// registered handler:
//  (a) a timed-out checker that IGNORES SIGTERM is bounded and its recorded pid
//      is gone on every platform after the run settles.
//  (b) the checker's DESCENDANTS are killed too. Pre-fix the run still resolved
//      here (exec destroys the stdio pipes when its own timeout fires) but the
//      grandchild was left running: the deadline killed one pid, not the tree.
//  (c) an aborted turn ends a SIGTERM-ignoring checker and its still-running
//      child, found by their recorded pids on every platform.
//  (f) the run SETTLES within timeout + grace even when the kill cannot reach
//      what is holding it open — pinned with a descendant that re-parents into
//      its own process group, the platform-native equivalent of win32 `taskkill`
//      being absent or denied.
//  (g,h,i) `{file}` uses pi's OWN path normalization
//      (resolveToCwd: `~`, a leading `@`, Unicode spaces), so the checker and the
//      binding target the file pi actually edited.
//  (d) that resolution is against the workspace cwd, and (e) survives a filename
//      containing `$&` (a string replacement would treat it as a replaceAll
//      pattern and rewrite the command).
//  (j) pi's file-mutation queue being unavailable is reported, not swallowed.
//
// NOT covered on this darwin run: executing the win32 `taskkill` branch. Windows
// CI runs both its successful tree kill and its missing-taskkill fallback. The
// property that protects the agent regardless — run() settles anyway — is also
// covered platform-independently by (f).
// Run: node --experimental-strip-types <this file>
const ext = (await import(new URL("../extensions/nana-post-edit.ts", import.meta.url).href)).default;
const { loadConfig } = await import(new URL("../lib/config.ts", import.meta.url).href);
const { POST_EDIT_KILL_GRACE_MS } = await import(new URL("../lib/post-edit-config.mjs", import.meta.url).href);
// chosen: today's settle bound (deadline + kill grace), read from the named grace so retuning
// POST_EDIT_KILL_GRACE_MS changes this bound too, rather than the checks going red on a value
// the extension no longer uses (post-edit-values-named's R-2210 probe).
const SETTLE_BOUND_MS = POST_EDIT_KILL_GRACE_MS + 4000;

let fails = 0;
const check = (n, ok) => { console.log(ok ? "PASS" : "FAIL", n); if (!ok) fails++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const JOURNAL = path.join(tmpDir(path.join(os.tmpdir(), "postedit-journal-")), "journal.jsonl");

// Fresh workspace + registered handler + config.
function setup(commands, opts = {}) {
	const td = tmpDir(path.join(os.tmpdir(), "postedit-"));
	fs.mkdirSync(path.join(td, ".pi"));
	fs.writeFileSync(USER_CFG, JSON.stringify({
		journal: { enabled: true, path: JOURNAL },
		receipts: { enabled: true, dir: path.join(td, "receipts") },
		postEdit: { commands },
	}));
	const handlers = {};
	ext({ on: (name, fn) => { handlers[name] = fn; } });
	const ctx = { cwd: td, hasUI: false, isProjectTrusted: () => true, signal: new AbortController().signal, ...(opts.ctx ?? {}) };
	const cfg = loadConfig(ctx);
	const fire = (file) => handlers.tool_result(
		{ toolName: "edit", isError: false, input: { path: file }, content: [{ type: "text", text: "edited" }] },
		ctx,
	);
	return { td, ctx, cfg, fire };
}

// Never let a hung handler hang the SUITE: a pending run must be reported as a
// failure, not as a test that never returns.
const WATCHDOG_MS = 15_000;
async function settle(promise) {
	const started = Date.now();
	const stuck = Symbol("stuck");
	let timer;
	const ret = await Promise.race([promise, new Promise((r) => { timer = setTimeout(() => r(stuck), WATCHDOG_MS); })]);
	clearTimeout(timer);
	return { hung: ret === stuck, ret, ms: Date.now() - started };
}

// The pgrep marker probes are POSIX-only and support only (b) and (f); the
// cross-platform timeout and abort probes use pid files instead.
const POSIX = process.platform !== "win32";
const FIXTURE_EXIT_MS = 30_000; // chosen: self-reap well after WATCHDOG_MS so broken kill paths stay observable.
const TREE_DEADLINE_MS = 2500; // chosen: about 6x the observed Windows checker-run time, leaving ample process-tree startup margin.
const POST_KILL_POLL_MS = 2000; // chosen: gives platform process tables time to observe taskkill or signal completion without hiding a survivor.
const mark = (tag) => `nana-${tag}-${process.pid}-${Math.random().toString(36).slice(2)}`;
// checks that the tool argument names an existing file — proves the substituted path
const EXISTS_CHECK = `node -e "process.exit(require('fs').existsSync(process.argv[1])?0:1)" {file}`;
function survivors(marker) {
	if (!POSIX) throw new Error("survivors() uses pgrep and is POSIX-only");
	try {
		return execFileSync("pgrep", ["-f", marker], { encoding: "utf-8" }).trim();
	} catch {
		return ""; // pgrep exits 1 when nothing matches
	}
}
function reap(list) {
	for (const pid of list.split("\n").filter(Boolean)) { try { process.kill(Number(pid), "SIGKILL"); } catch { /* gone */ } }
}
function pidAlive(pid) {
	if (!Number.isInteger(pid) || pid <= 0) return false;
	try { process.kill(pid, 0); return true; } catch { return false; }
}
async function waitUntil(predicate, timeoutMs) {
	const started = Date.now();
	while (Date.now() - started < timeoutMs) {
		if (predicate()) return true;
		await sleep(20);
	}
	return predicate();
}
function readPid(file) {
	try { return Number(fs.readFileSync(file, "utf8").trim()); } catch { return undefined; }
}
function writeTreeFixture(td, { ignoreSigterm = false, child = true } = {}) {
	const script = path.join(td, "tree.cjs");
	fs.writeFileSync(script, [
		'const { spawn } = require("node:child_process");',
		'const fs = require("node:fs");',
		'const path = require("node:path");',
		...(ignoreSigterm ? ['process.on("SIGTERM", () => {});'] : []),
		'const dir = process.argv[2];',
		'if (process.argv[3] === "level-b") {',
		'  fs.writeFileSync(path.join(dir, "level-b.pid"), String(process.pid));',
		'} else {',
		'  fs.writeFileSync(path.join(dir, "level-a.pid"), String(process.pid));',
		'  fs.writeFileSync(path.join(dir, "level-a.ppid"), String(process.ppid));',
		...(child ? ['  spawn(process.execPath, [__filename, dir, "level-b"], { stdio: "inherit" });'] : []),
		'}',
		'setInterval(() => {}, 1000);',
		`setTimeout(() => process.exit(0), ${FIXTURE_EXIT_MS});`,
	].join("\n"));
	return script;
}
async function reapTree(pids) {
	for (const pid of pids.filter(Number.isInteger)) {
		if (pidAlive(pid)) { try { process.kill(pid, "SIGKILL"); } catch { /* gone */ } }
	}
	return waitUntil(() => pids.filter(Number.isInteger).every((pid) => !pidAlive(pid)), POST_KILL_POLL_MS);
}
function removeTreeFixture(td) {
	if (process.platform === "win32") {
		try { fs.rmSync(td, { recursive: true, force: true }); } catch { /* tmpDir exit cleanup retries busy folders */ }
	} else {
		fs.rmSync(td, { recursive: true, force: true });
	}
}

// (a) timeout + one-level SIGTERM-ignoring checker: bounded by deadline +
// kill grace, recorded `timeout`, and found gone by pid on every platform.
{
	const { td, cfg, fire } = setup([]);
	const script = writeTreeFixture(td, { ignoreSigterm: true, child: false });
	const levelAFile = path.join(td, "level-a.pid");
	const command = `"${process.execPath}" "${script}" "${td}"`;
	fs.writeFileSync(USER_CFG, JSON.stringify({
		journal: { enabled: true, path: JOURNAL },
		receipts: { enabled: true, dir: path.join(td, "receipts") },
		postEdit: { commands: [{ match: "\\.txt$", run: command, timeoutMs: 300 }] },
	}));
	const file = path.join(td, "hang.txt");
	fs.writeFileSync(file, "one\n");
	let hung = true;
	let ret;
	let ms = WATCHDOG_MS;
	let levelA;
	let ended = false;
	let aliveBeforeReap = [];
	try {
		({ hung, ret, ms } = await settle(fire(file)));
		levelA = readPid(levelAFile);
		ended = await waitUntil(() => !pidAlive(levelA), POST_KILL_POLL_MS);
	} finally {
		aliveBeforeReap = [levelA].filter((pid) => Number.isInteger(pid) && pidAlive(pid));
		const cleanupEnded = await reapTree([levelA]);
		if (cleanupEnded) removeTreeFixture(td);
	}
// req: R-787
	check("a: SIGTERM-ignoring checker does not hang the handler", !hung);
// req: R-787
	check(`a: resolved within deadline + kill grace (${ms}ms)`, !hung && ms < SETTLE_BOUND_MS);
	check("a: timeout fed back to the model",
		typeof ret?.content?.at(-1)?.text === "string" && ret.content.at(-1).text.includes("check(s) failed"));
	// req: R-787
	check("a: the checker is gone, not just abandoned", ended);
	if (!ended) console.log(`a: pids alive before reap: ${aliveBeforeReap.join(", ") || "none"}`);
}

// (b) posix tree kill: the checker exits immediately but leaves a SIGTERM-ignoring
// grandchild in the SAME process group holding the inherited stdout pipe. The
// group-wide kill reaches it, so the run resolves AND no orphan survives.
if (POSIX) {
	const marker = mark("treekill");
	const { td, cfg, fire } = setup([]);
	const spawner = path.join(td, "spawner.cjs");
	fs.writeFileSync(spawner, [
		'const { spawn } = require("node:child_process");',
		"// grandchild ignores SIGTERM and inherits stdout, so the pipe stays open",
		`spawn(process.execPath, ["-e", "process.on('SIGTERM',()=>{});setInterval(()=>{},1000);setTimeout(()=>process.exit(0),${FIXTURE_EXIT_MS})", process.argv[2]], { stdio: "inherit" });`,
	].join("\n"));
	const cmd = `node "${spawner}" ${marker}`;
	fs.writeFileSync(USER_CFG, JSON.stringify({
		journal: { enabled: true, path: JOURNAL },
		receipts: { enabled: true, dir: path.join(td, "receipts") },
		postEdit: { commands: [{ match: "\\.txt$", run: cmd, timeoutMs: 300 }] },
	}));
	const file = path.join(td, "tree.txt");
	fs.writeFileSync(file, "one\n");
	const { hung, ms } = await settle(fire(file));
	// req: R-094
	check("b: descendant holding the pipe does not hang the handler", !hung);
	check(`b: resolved within deadline + kill grace (${ms}ms)`, !hung && ms < SETTLE_BOUND_MS);
	await sleep(200);
	const left = survivors(marker);
	check("b: no orphaned grandchild survives the kill", left === "");
	reap(left);
	fs.rmSync(td, { recursive: true, force: true });
} else {
	console.log("SKIP b: descendant holding the pipe does not hang the handler — pgrep and POSIX process groups");
	console.log("SKIP b: resolved within deadline + kill grace — pgrep and POSIX process groups");
	console.log("SKIP b: no orphaned grandchild survives the kill — pgrep and POSIX process groups");
}

// Every platform builds the same two-level checker tree. The pending-run probe
// proves both processes existed before the timeout; the post-run probe names any
// survivor without relying on a platform process-list command.
{
	const { td, cfg, fire } = setup([]);
	const script = writeTreeFixture(td);
	const levelAFile = path.join(td, "level-a.pid");
	const levelBFile = path.join(td, "level-b.pid");
	const command = `"${process.execPath}" "${script}" "${td}"`;
	fs.writeFileSync(USER_CFG, JSON.stringify({
		journal: { enabled: true, path: JOURNAL },
		receipts: { enabled: true, dir: path.join(td, "receipts") },
		postEdit: { commands: [{ match: "\\.txt$", run: command, timeoutMs: TREE_DEADLINE_MS }] },
	}));
	const file = path.join(td, "cross-platform-tree.txt");
	fs.writeFileSync(file, "one\n");
	let levelA;
	let levelB;
	let builtAlive = false;
	let ended = false;
	try {
		const started = Date.now();
		const pending = fire(file);
		builtAlive = await waitUntil(() => {
			levelA = readPid(levelAFile);
			levelB = readPid(levelBFile);
			return Date.now() - started < TREE_DEADLINE_MS && pidAlive(levelA) && pidAlive(levelB);
		}, TREE_DEADLINE_MS);
		const { hung } = await settle(pending);
		ended = !hung && await waitUntil(() => !pidAlive(levelA) && !pidAlive(levelB), POST_KILL_POLL_MS);
	} finally {
		const cleanupEnded = await reapTree([levelA, levelB]);
		if (cleanupEnded) removeTreeFixture(td);
	}
	// req: R-1700
	check("tree: a timed-out check's process and that process's still-running child are both ended", TREE_DEADLINE_MS === 2500 && POST_KILL_POLL_MS === 2000 && builtAlive && ended);
}

// On Windows, removing taskkill from PATH exercises both asynchronous ENOENT
// fallbacks. cmd.exe must die and the handler must settle; its node descendants
// are the documented residual and are reaped explicitly before fixture cleanup.
if (process.platform === "win32") {
	const originalPath = process.env.PATH;
	let td;
	let shellPid;
	let levelA;
	let levelB;
	let precondition = false;
	let preconditionCause = "taskkill probe did not run";
	let shellWasAlive = false;
	let shellEnded = false;
	let descendantsSurvived = false;
	let settledTimedOut = false;
	let cleanupEnded = false;
	try {
		process.env.PATH = path.dirname(process.execPath);
		const taskkillProbe = spawnSync("taskkill", ["/?"], { stdio: "ignore" });
		precondition = taskkillProbe.error?.code === "ENOENT";
		preconditionCause = taskkillProbe.error
			? `taskkill spawn error was ${taskkillProbe.error.code ?? taskkillProbe.error.message}`
			: `taskkill unexpectedly started and exited ${taskkillProbe.status}`;
		if (precondition) {
			({ td } = setup([]));
			const handlers = {};
			const script = writeTreeFixture(td);
			const levelAFile = path.join(td, "level-a.pid");
			const levelBFile = path.join(td, "level-b.pid");
			const ppidFile = path.join(td, "level-a.ppid");
			const command = `"${process.execPath}" "${script}" "${td}"`;
			fs.writeFileSync(USER_CFG, JSON.stringify({
				journal: { enabled: true, path: JOURNAL },
				receipts: { enabled: true, dir: path.join(td, "receipts") },
				postEdit: { commands: [{ match: "\\.txt$", run: command, timeoutMs: TREE_DEADLINE_MS }] },
			}));
			ext({ on: (name, fn) => { handlers[name] = fn; } });
			const ctx = { cwd: td, hasUI: false, isProjectTrusted: () => true, signal: new AbortController().signal };
			const file = path.join(td, "missing-taskkill.txt");
			fs.writeFileSync(file, "one\n");
			const started = Date.now();
			const pending = handlers.tool_result(
				{ toolName: "edit", isError: false, input: { path: file }, content: [{ type: "text", text: "edited" }] },
				ctx,
			);
			shellWasAlive = await waitUntil(() => {
				levelA = readPid(levelAFile);
				levelB = readPid(levelBFile);
				shellPid = readPid(ppidFile);
				return Date.now() - started < TREE_DEADLINE_MS && shellPid !== process.pid && pidAlive(shellPid) && pidAlive(levelA) && pidAlive(levelB);
			}, TREE_DEADLINE_MS);
			const { hung, ret } = await settle(pending);
			shellEnded = await waitUntil(() => !pidAlive(shellPid), POST_KILL_POLL_MS);
			descendantsSurvived = pidAlive(levelA) && pidAlive(levelB);
			settledTimedOut = !hung && ret?.content?.at(-1)?.text?.includes("did not complete (timed out)") === true;
		}
	} finally {
		if (originalPath === undefined) delete process.env.PATH; else process.env.PATH = originalPath;
		cleanupEnded = await reapTree([levelA, levelB, shellPid]);
		if (td && cleanupEnded) removeTreeFixture(td);
	}
	if (!precondition) console.log(`taskkill-off-PATH precondition failed: ${preconditionCause}`);
	// req: R-1701
	check("win32: with taskkill off PATH the timed-out check's shell is killed and the run settles", precondition && shellWasAlive && shellEnded && descendantsSurvived && settledTimedOut && cleanupEnded);
} else {
	console.log("SKIP win32: with taskkill off PATH the timed-out check's shell is killed and the run settles — taskkill is Windows-only");
}

// (c) an aborted turn with NO deadline (timeoutMs 0) ends a two-level,
// SIGTERM-ignoring checker tree whose pids were alive before the abort.
{
	const ac = new AbortController();
	const { td, cfg, fire } = setup([], { ctx: { signal: ac.signal } });
	const script = writeTreeFixture(td, { ignoreSigterm: true });
	const levelAFile = path.join(td, "level-a.pid");
	const levelBFile = path.join(td, "level-b.pid");
	const command = `"${process.execPath}" "${script}" "${td}"`;
	fs.writeFileSync(USER_CFG, JSON.stringify({
		journal: { enabled: true, path: JOURNAL },
		receipts: { enabled: true, dir: path.join(td, "receipts") },
		postEdit: { commands: [{ match: "\\.txt$", run: command, timeoutMs: 0 }] },
	}));
	const file = path.join(td, "abort.txt");
	fs.writeFileSync(file, "one\n");
	let levelA;
	let levelB;
	let builtAlive = false;
	let hung = true;
	let ms = WATCHDOG_MS;
	let ended = false;
	let aliveBeforeReap = [];
	try {
		const started = Date.now();
		const pending = fire(file);
		builtAlive = await waitUntil(() => {
			levelA = readPid(levelAFile);
			levelB = readPid(levelBFile);
			return Date.now() - started < TREE_DEADLINE_MS && pidAlive(levelA) && pidAlive(levelB);
		}, TREE_DEADLINE_MS);
		ac.abort();
		({ hung, ms } = await settle(pending));
		ended = !hung && await waitUntil(() => !pidAlive(levelA) && !pidAlive(levelB), POST_KILL_POLL_MS);
	} finally {
		ac.abort();
		aliveBeforeReap = [levelA, levelB].filter((pid) => Number.isInteger(pid) && pidAlive(pid));
		const cleanupEnded = await reapTree([levelA, levelB]);
		if (cleanupEnded) removeTreeFixture(td);
	}
	check("c: abort does not hang a SIGTERM-ignoring checker", !hung);
	check(`c: aborted run resolved within the kill grace (${ms}ms)`, !hung && ms < SETTLE_BOUND_MS);
	// req: R-1820
	check("c: an aborted turn ends the check's process and that process's still-running child", builtAlive && ended);
	if (!(builtAlive && ended)) console.log(`c: pids alive before reap: ${aliveBeforeReap.join(", ") || "none"}`);
}

// (f) FORCED SETTLEMENT. The grandchild is spawned DETACHED, so it leaves our
// process group: the group-wide SIGKILL cannot reach it and it holds the
// inherited stdout pipe open forever, so `close` never fires. This is the
// platform-native stand-in for win32 taskkill being unavailable or denied — the
// kill fails, and run() must resolve anyway, within timeout + grace.
// The unreachable descendant is a KNOWN residual: it leaks, and the test reaps it.
if (POSIX) {
	const marker = mark("unreachable");
	const { td, cfg, fire } = setup([]);
	const spawner = path.join(td, "detached-spawner.cjs");
	fs.writeFileSync(spawner, [
		'const { spawn } = require("node:child_process");',
		"// detached => its OWN process group, out of reach of our group kill, and it",
		"// keeps the inherited stdout pipe open so the run never closes on its own",
		`const c = spawn(process.execPath, ["-e", "process.on('SIGTERM',()=>{});setInterval(()=>{},1000);setTimeout(()=>process.exit(0),${FIXTURE_EXIT_MS})", process.argv[2]], { stdio: "inherit", detached: true });`,
		"c.unref();",
	].join("\n"));
	const cmd = `node "${spawner}" ${marker}`;
	fs.writeFileSync(USER_CFG, JSON.stringify({
		journal: { enabled: true, path: JOURNAL },
		receipts: { enabled: true, dir: path.join(td, "receipts") },
		postEdit: { commands: [{ match: "\\.txt$", run: cmd, timeoutMs: 300 }] },
	}));
	const file = path.join(td, "unreachable.txt");
	fs.writeFileSync(file, "one\n");
	const { hung, ret, ms } = await settle(fire(file));
	// req: R-094
	check("f: unkillable pipe-holder does not hang the handler", !hung);
	// req: R-094
	check(`f: settled within deadline + kill grace even though the kill failed (${ms}ms)`, !hung && ms < SETTLE_BOUND_MS);
	check("f: forced settlement is fed back to the model",
		typeof ret?.content?.at(-1)?.text === "string" && ret.content.at(-1).text.includes("check(s) failed"));
	reap(survivors(marker)); // known residual: out of reach of the group kill
	fs.rmSync(td, { recursive: true, force: true });
} else {
	console.log("SKIP f: unkillable pipe-holder does not hang the handler — pgrep and POSIX process groups");
	console.log("SKIP f: settled within deadline + kill grace even though the kill failed — pgrep and POSIX process groups");
	console.log("SKIP f: forced settlement is fed back to the model — pgrep and POSIX process groups");
}

// (d) a RELATIVE tool path is resolved against ctx.cwd for BOTH the digest and the
// shell substitution: the checker sees the absolute file it should check.
// Pre-fix the raw relative path went to the shell while the digest used the joined one.
{
	const { td, cfg, fire } = setup([{ match: "\\.txt$", run: EXISTS_CHECK }]);
	fs.mkdirSync(path.join(td, "sub"));
	const abs = path.join(td, "sub", "rel.txt");
	fs.writeFileSync(abs, "one\n");
	const result = await fire(path.join("sub", "rel.txt")); // relative, as a model may emit it

	// req: R-089 R-783
	check("d: relative path checker received the cwd-resolved file", result === undefined);
	fs.rmSync(td, { recursive: true, force: true });
}

// (e) `$&` in a filename must not be interpreted as a replaceAll substitution
// pattern. Pre-fix the command received `a{file}b.txt` and the checker failed.
{
	const { td, cfg, fire } = setup([{ match: "\\.txt$", run: EXISTS_CHECK }]);
	const name = "a$&b.txt";
	const abs = path.join(td, name);
	fs.writeFileSync(abs, "one\n");
	const result = await fire(abs);

	// req: R-088
	check("e: dollar ampersand filename survives shell substitution", result === undefined);
	fs.rmSync(td, { recursive: true, force: true });
}

// (g,h,i) pi's edit/write tools resolve the model's `path` with resolveToCwd,
// which expands `~`, strips a leading `@`, and folds Unicode spaces. A plain
// path.resolve() misses all three, so the checker would receive a
// DIFFERENT file than the one pi edited. Each case names the file the way a model
// may, and the checker passes only if it received the real path.
{
	const cases = [
		["g", "~ expansion", (td) => ["tilde.txt", "~/tilde.txt"]],
		["h", "leading @ stripped", (td) => ["at.txt", "@at.txt"]],
		["i", "Unicode space folded to ASCII", (td) => ["uni space.txt", "uni space.txt"]],
	];
	const origHome = process.env.HOME;
	const origUserProfile = process.env.USERPROFILE;
	for (const [tag, label, mk] of cases) {
		const { td, cfg, fire } = setup([{ match: "\\.txt$", run: EXISTS_CHECK }]);
		const [real, asModelWrites] = mk(td);
		const abs = path.join(td, real);
		fs.writeFileSync(abs, "one\n");
		fs.mkdirSync(path.join(td, ".pi", "agent"), { recursive: true }); // L1: HOME→td below reads user config from td
		fs.copyFileSync(USER_CFG, path.join(td, ".pi", "agent", "nana-pack.json"));
		let result;
		try {
			// os.homedir() reads HOME (posix) / USERPROFILE (win32), so `~` lands in the workspace
			process.env.HOME = td;
			process.env.USERPROFILE = td;
			result = await fire(asModelWrites);
		} finally {
			if (origHome === undefined) delete process.env.HOME; else process.env.HOME = origHome;
			if (origUserProfile === undefined) delete process.env.USERPROFILE; else process.env.USERPROFILE = origUserProfile;
		}
		// req: R-092 R-103
		check(`${tag}: ${label} — checker received the real file`, result === undefined);
		fs.rmSync(td, { recursive: true, force: true });
	}
}

// The malformed file URL uses the same total shared resolver as the gate.
{
	const { resolveToolPath } = await import(new URL("../lib/gate-paths.ts", import.meta.url).href);
	const source = fs.readFileSync(new URL("../extensions/nana-post-edit.ts", import.meta.url), "utf8");
	// req: R-644
	check("path: post-edit imports the shared resolver and defines no local resolver", /import\s*\{\s*resolveToolPath\s*\}\s*from\s*["']\.\.\/lib\/gate-paths\.ts["']/.test(source) && !/(?:function|const|let)\s+(?:resolveToolPath|resolveToCwd|normalizePath|normalizeWindowsShellPath)\b|UNICODE_SPACES/.test(source));
	const malformed = "file:///%%";
	const { td, cfg, fire } = setup([{ match: ".*", run: 'node -e "require(\'fs\').writeFileSync(\'observed-path.txt\', process.argv[1])" {file}' }]);
	const expected = resolveToolPath(malformed, td);
	await fire(malformed);
	const observed = fs.readFileSync(path.join(td, "observed-path.txt"), "utf8");
	// req: R-644
	check("path: malformed file URL checker receives the shared resolver result", observed === expected);
	fs.rmSync(td, { recursive: true, force: true });
}

// (j) running outside pi means no file-mutation queue, so checks are NOT
// serialized against edits. That has to be visible, and reported once per load
// rather than once per check.
{
	const entries = (fs.existsSync(JOURNAL) ? fs.readFileSync(JOURNAL, "utf-8") : "")
		.split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return {}; } });
	const reports = entries.filter((e) => e.event === "postedit_file_queue_unavailable");
// req: R-786
	check("j: an unavailable file-mutation queue is journaled, not swallowed", reports.length === 1);
	fs.rmSync(path.dirname(JOURNAL), { recursive: true, force: true });
}

process.exit(fails);
