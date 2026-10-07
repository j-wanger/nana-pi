/**
 * @module packages/nana-pack/tests/post-edit-hardening.test.mjs
 * @purpose Pins that the post-edit checker is bounded — a SIGTERM-ignoring checker and a descendant holding the pipe both end in a recorded timeout with the process really gone
 * @inputs extensions/nana-post-edit.ts and stub checkers that ignore signals or leak descendants, under a temp HOME
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp HOME, stub checker scripts), process (sets HOME, spawns and kills the stub checkers and their descendants)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
// L1 fixture: a nana-only `.pi/` is never nana-trusted (pi auto-trusts it; that is not a
// decision), so this file's config lives at USER scope under an isolated HOME
// (os.homedir() reads HOME on posix, USERPROFILE on win32).
const NANA_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "nana-home-"));
process.env.HOME = NANA_HOME;
process.env.USERPROFILE = NANA_HOME;
const USER_CFG = path.join(NANA_HOME, ".pi", "agent", "nana-pack.json");
fs.mkdirSync(path.dirname(USER_CFG), { recursive: true });
// Liveness + fidelity properties of the post-edit checker, driving the REAL
// registered handler:
//  (a) a checker that IGNORES SIGTERM is still bounded — Node's exec sends one
//      signal and never escalates, so the pre-fix handler stayed pending forever
//      and hung the turn (pi awaits tool_result).
//  (b) the checker's DESCENDANTS are killed too. Pre-fix the run still resolved
//      here (exec destroys the stdio pipes when its own timeout fires) but the
//      grandchild was left running: the deadline killed one pid, not the tree.
//  (c) an aborted turn terminates the checker for real. Pre-fix the handler
//      resolved but a SIGTERM-ignoring checker survived the abort as an orphan.
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
// NOT covered here (darwin): the win32 `taskkill` branch of killTree — including
// its error/non-zero-exit fallback to child.kill(). Needs a real Windows run. The
// property that protects the agent regardless — run() settles anyway — IS covered,
// platform-independently, by (f).
// Run: node --experimental-strip-types <this file>
const ext = (await import(new URL("../extensions/nana-post-edit.ts", import.meta.url).href)).default;
const { loadConfig } = await import(new URL("../lib/config.ts", import.meta.url).href);

let fails = 0;
const check = (n, ok) => { console.log(ok ? "PASS" : "FAIL", n); if (!ok) fails++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const JOURNAL = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "postedit-journal-")), "journal.jsonl");

// Fresh workspace + registered handler + config.
function setup(commands, opts = {}) {
	const td = fs.mkdtempSync(path.join(os.tmpdir(), "postedit-"));
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

// A checker that installs a no-op SIGTERM handler and never exits. The unique
// marker rides in argv so `pgrep -f` can prove nothing was left running.
const POSIX = process.platform !== "win32";
const mark = (tag) => `nana-${tag}-${process.pid}-${Math.random().toString(36).slice(2)}`;
const ignoresSigterm = (marker) => `node -e "process.on('SIGTERM',()=>{});setInterval(()=>{},1000)" ${marker}`;
// checks that the tool argument names an existing file — proves the substituted path
const EXISTS_CHECK = `node -e "process.exit(require('fs').existsSync(process.argv[1])?0:1)" {file}`;
function survivors(marker) {
	if (!POSIX) return "";
	try {
		return execFileSync("pgrep", ["-f", marker], { encoding: "utf-8" }).trim();
	} catch {
		return ""; // pgrep exits 1 when nothing matches
	}
}
function reap(list) {
	for (const pid of list.split("\n").filter(Boolean)) { try { process.kill(Number(pid), "SIGKILL"); } catch { /* gone */ } }
}

// (a) timeout + SIGTERM-ignoring checker: bounded by deadline + kill grace,
// recorded `timeout`, and actually dead. Pre-fix: run() never resolves.
{
	const marker = mark("hang");
	const cmd = ignoresSigterm(marker);
	const { td, cfg, fire } = setup([{ match: "\\.txt$", run: cmd, timeoutMs: 300 }]);
	const file = path.join(td, "hang.txt");
	fs.writeFileSync(file, "one\n");
	const { hung, ret, ms } = await settle(fire(file));
// req: R-787
	check("a: SIGTERM-ignoring checker does not hang the handler", !hung);
// req: R-787
	check(`a: resolved within deadline + kill grace (${ms}ms)`, !hung && ms < 6000);
	check("a: timeout fed back to the model",
		typeof ret?.content?.at(-1)?.text === "string" && ret.content.at(-1).text.includes("check(s) failed"));
	await sleep(200);
	const left = survivors(marker);
	// req: R-093
	check("a: the checker is gone, not just abandoned", left === "");
	reap(left);
	fs.rmSync(td, { recursive: true, force: true });
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
		`spawn(process.execPath, ["-e", "process.on('SIGTERM',()=>{});setInterval(()=>{},1000)", process.argv[2]], { stdio: "inherit" });`,
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
	check(`b: resolved within deadline + kill grace (${ms}ms)`, !hung && ms < 6000);
	await sleep(200);
	const left = survivors(marker);
	check("b: no orphaned grandchild survives the kill", left === "");
	reap(left);
	fs.rmSync(td, { recursive: true, force: true });
}

// (c) an aborted turn with NO deadline (timeoutMs 0) terminates the checker for
// real: the same terminate-then-escalate path runs on abort. Pre-fix the handler
// returned promptly but the SIGTERM-ignoring checker kept running as an orphan.
{
	const marker = mark("abort");
	const cmd = ignoresSigterm(marker);
	const ac = new AbortController();
	const { td, cfg, fire } = setup([{ match: "\\.txt$", run: cmd, timeoutMs: 0 }], { ctx: { signal: ac.signal } });
	const file = path.join(td, "abort.txt");
	fs.writeFileSync(file, "one\n");
	const p = fire(file);
	setTimeout(() => ac.abort(), 200);
	const { hung, ms } = await settle(p);
	check("c: abort does not hang a SIGTERM-ignoring checker", !hung);
	check(`c: aborted run resolved within the kill grace (${ms}ms)`, !hung && ms < 6000);
	await sleep(300);
	const left = survivors(marker);
	// req: R-096
	check("c: the aborted checker is killed, not orphaned", left === "");
	reap(left);
	fs.rmSync(td, { recursive: true, force: true });
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
		`const c = spawn(process.execPath, ["-e", "process.on('SIGTERM',()=>{});setInterval(()=>{},1000)", process.argv[2]], { stdio: "inherit", detached: true });`,
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
	check(`f: settled within deadline + kill grace even though the kill failed (${ms}ms)`, !hung && ms < 6000);
	check("f: forced settlement is fed back to the model",
		typeof ret?.content?.at(-1)?.text === "string" && ret.content.at(-1).text.includes("check(s) failed"));
	reap(survivors(marker)); // known residual: out of reach of the group kill
	fs.rmSync(td, { recursive: true, force: true });
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
