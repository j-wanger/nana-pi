/**
 * @module packages/nana-pack/tests/mutation-runner.test.mjs
 * @purpose Pin the shared mutation runner's scratch-worktree isolation, test-file run, timeout/drain,
 *  edit/syntax/containment refusals, baseline, judging, sharding, record, refusals, dry/log, lock, tip/table
 *  identity and config-merge contracts (R-1230 to R-1244) against a disposable git fixture.
 * @inputs ../lib/mutation-runner.mjs, ../lib/mutation-runner-config.mjs, and a throwaway git repository this
 *  file builds under the OS temp directory for every run
 * @outputs PASS/FAIL lines for each marked check and a non-zero exit when any fails
 * @effects disk (a throwaway git repo, scratch worktrees and records under the OS temp directory), process
 *  (spawns shard and test-file children; two checks send SIGTERM/SIGKILL to processes this file started)
 * @errors a FAIL line naming the broken behaviour; a non-zero exit code
 */
// Every fixture lives under tmpDir() (R-917); nothing here reaches the real home folder or ~/.pi. Fixture
// import lines are built by joining a quote character at run time (the `Q` helper below), never written as
// a literal `from "./x"`/`import "./x"` in this file's own source, so the code map's raw-text scanner and
// the requirements-trace rail never read a fixture specifier or a fixture `// req:`-shaped line as real
// (build-brief rule 5, CHANGE.md §5 and the M1 fact-check finding). Each fixture run gets its own TMPDIR
// (a check-owned folder under tmpDir()), so a leftover-scan stays local to that check.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";
import { judgePair, resetScratch, runMutations, shardCount } from "../lib/mutation-runner.mjs";
import * as CFG from "../lib/mutation-runner-config.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const RUNNER_LIB = path.join(REPO, "packages", "nana-pack", "lib", "mutation-runner.mjs");
const TS_CHECKER_REAL = path.join(REPO, "scripts", "ts-syntax-check.mjs");
const posix = process.platform !== "win32";

let fails = 0;
const check = (name, ok, why = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : why); if (!ok) fails++; };
const skip = (name, why) => console.log("SKIP", name, "—", why);

/** Never throws; collects a thrown error into a readable `why`. */
async function attempt(fn) {
	try { return { ok: true, value: await fn() }; } catch (e) { return { ok: false, error: e?.stack ?? String(e) }; }
}

/** Collects every console.log/error line produced while `fn` runs (the parent relays a shard's own lines). */
async function captured(fn) {
	const lines = [];
	const origLog = console.log;
	const origErr = console.error;
	console.log = (...a) => lines.push(a.join(" "));
	console.error = (...a) => lines.push(a.join(" "));
	try {
		const result = await fn();
		return { result, lines, text: lines.join("\n") };
	} catch (e) {
		// a stub or a regression that throws reads as a clean FAIL here, never a crashed test file.
		lines.push(`[captured] threw: ${e?.stack ?? e}`);
		return { result: undefined, error: e, lines, text: lines.join("\n") };
	} finally {
		console.log = origLog;
		console.error = origErr;
	}
}
/** Guards a synchronous pure-function call the same way, for the few checks that call one directly. */
function safely(fn, fallback) {
	try { return fn(); } catch { return fallback; }
}
const EMPTY_JUDGE = { verdict: "ERROR", matchedNamed: [], namedButGreen: [], notReached: [], declaredRed: [], declaredGreen: [], unnamedRed: [], crashed: [], failCount: 0 };

const sh = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: "utf8", ...opts });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitUntil(fn, limitMs, stepMs = 20) {
	const until = Date.now() + limitMs;
	for (;;) {
		const v = await fn();
		if (v) return v;
		if (Date.now() >= until) return false;
		await sleep(stepMs);
	}
}

// ── a quoted-specifier builder that stays invisible to the code map's raw-text scanner ─────────
const Q = '"';
const importLine = (bindings, spec) => `import ${bindings} from ${Q}${spec}${Q};`;

// ── the fixture git repository ──────────────────────────────────────────────────────────────────
/**
 * A throwaway `git init -b main` repository: one package, a.mjs/b.mjs (tiny, mutable), a probe-config.mjs
 * (mutable knobs a pair's own edits adjust), c.ts (one valid TypeScript module), a copy of the repo's real
 * TypeScript syntax checker, one generic probe test file, and a `post-checkout` hook that writes a mark —
 * used to prove the runner's scratch git calls never run repository hooks.
 */
function buildFixtureRepo(root, initialProbeMode = "plain") {
	const pkg = path.join(root, "pkg");
	fs.mkdirSync(path.join(pkg, "lib"), { recursive: true });
	fs.mkdirSync(path.join(pkg, "tests"), { recursive: true });
	fs.mkdirSync(path.join(root, "scripts"), { recursive: true });
	fs.mkdirSync(path.join(root, ".git", "hooks"), { recursive: true });

	sh("git", ["init", "-q", "-b", "main", root]);
	sh("git", ["-C", root, "config", "user.email", "fixture@example.invalid"]);
	sh("git", ["-C", root, "config", "user.name", "fixture"]);

	fs.writeFileSync(path.join(pkg, "lib", "a.mjs"), ["export function valueA() {", '  return "A-ORIGINAL";', "}", ""].join("\n"));
	fs.writeFileSync(path.join(pkg, "lib", "b.mjs"), ["export function valueB() {", '  return "B-ORIGINAL";', "}", ""].join("\n"));
	fs.writeFileSync(path.join(pkg, "lib", "probe-config.mjs"), [
		'export const PROBE_KEY = "k0";',
		'export const PROBE_PARTNER_KEY = "";',
		`export const PROBE_MODE = ${JSON.stringify(initialProbeMode)};`,
		"export const PROBE_SLEEP_MS = 0;",
		"",
	].join("\n"));
	fs.writeFileSync(path.join(pkg, "lib", "c.ts"), ["export function valueC(): string {", '  return "C-ORIGINAL";', "}", ""].join("\n"));
	fs.copyFileSync(TS_CHECKER_REAL, path.join(root, "scripts", "ts-syntax-check.mjs"));

	const oneLines = [
		importLine("{ valueA }", "../lib/a.mjs"),
		importLine("* as fs", "node:fs"),
		importLine("* as path", "node:path"),
		"const litterPath = path.join(process.cwd(), \"litter.tmp\");",
		"const noLitter = !fs.existsSync(litterPath);",
		'console.log(noLitter ? "PASS" : "FAIL", "fixture: no leftover litter from a previous pair");',
		'fs.writeFileSync(litterPath, "x");',
		'const okA = valueA() === "A-ORIGINAL";',
		'console.log(okA ? "PASS" : "FAIL", "fixture: a returns ORIGINAL");',
		"",
	];
	fs.writeFileSync(path.join(pkg, "tests", "one.test.mjs"), oneLines.join("\n"));

	const probeLines = [
		importLine("{ PROBE_KEY, PROBE_PARTNER_KEY, PROBE_MODE, PROBE_SLEEP_MS }", "../lib/probe-config.mjs"),
		importLine("* as fs", "node:fs"),
		importLine("* as path", "node:path"),
		importLine("{ spawn, spawnSync }", "node:child_process"),
		'const marks = process.env.NANA_TEST_MARKS || null;',
		"const waitLimitMs = Number(process.env.NANA_TEST_WAIT_MS || 4000);",
		'function mark(name, content = "") { if (marks) fs.writeFileSync(path.join(marks, name), content); }',
		"function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }",
		"async function waitFor(name, limitMs) {",
		"  const until = Date.now() + limitMs;",
		"  while (Date.now() < until) {",
		"    if (marks && fs.existsSync(path.join(marks, name))) return true;",
		"    await sleep(15);",
		"  }",
		"  return false;",
		"}",
		`mark(\`start-\${PROBE_KEY}\`, String(Date.now()));`,
		`mark(\`pid-\${PROBE_KEY}\`, String(process.pid));`,
		"const worktreeRoot = path.resolve(process.cwd(), \"..\");",
		`mark(\`wt-\${PROBE_KEY}\`, worktreeRoot);`,
		'if (PROBE_MODE === "rendezvous") {',
		"  const met = await waitFor(`start-${PROBE_PARTNER_KEY}`, waitLimitMs);",
		'  console.log(met ? "PASS" : "FAIL", "fixture: probe met its rendezvous partner");',
		'} else if (PROBE_MODE === "rendezvous-lock") {',
		`  mark(\`lockheld-\${PROBE_KEY}\`, "1");`,
		"  const released = await waitFor(`release-${PROBE_KEY}`, waitLimitMs);",
		'  console.log(released ? "PASS" : "FAIL", "fixture: probe was released");',
		'} else if (PROBE_MODE === "sleep") {',
		"  await sleep(PROBE_SLEEP_MS);",
		'  console.log("PASS", "fixture: probe slept");',
		'} else if (PROBE_MODE === "hang") {',
		"  await sleep(99999999);",
		'} else if (PROBE_MODE === "selfkill") {',
		'  try { process.kill(process.ppid, "SIGKILL"); } catch {}',
		"  await sleep(99999999);",
		'} else if (["drop-dotgit", "drop-dotgit-selfkill", "lock-self", "lock-self-selfkill"].includes(PROBE_MODE)) {',
		'  if (PROBE_MODE.startsWith("drop-dotgit")) fs.rmSync(path.join(worktreeRoot, ".git"), { force: true });',
		'  else spawnSync("git", ["-C", worktreeRoot, "worktree", "lock", worktreeRoot]);',
		'  if (PROBE_MODE.endsWith("selfkill")) {',
		'    try { process.kill(process.ppid, "SIGKILL"); } catch {}',
		"    await sleep(99999999);",
		"  }",
		'  console.log("PASS", "fixture: probe ran");',
		'} else if (PROBE_MODE === "stray-pipe") {',
		"  const sl = spawn(process.execPath, [\"-e\", `setTimeout(()=>{}, ${PROBE_SLEEP_MS || 15000})`], { stdio: \"inherit\", detached: true });",
		"  sl.unref();", // the test file itself must exit right away; only the detached grandchild holds the pipe
		"  mark(`sleeper-pid-${PROBE_KEY}`, String(sl.pid));",
		'  console.log("PASS", "fixture: probe left a pipe-holding descendant");',
		'} else if (PROBE_MODE === "stray-group") {',
		'  const g = spawn(process.execPath, ["-e", "setTimeout(()=>{}, 8000)"], { stdio: "ignore" });',
		"  g.unref();", // the test file exits at once; the stray stays in its process group
		"  mark(`stray-pid-${PROBE_KEY}`, String(g.pid));",
		'  console.log("PASS", "fixture: probe left a non-pipe stray in its group");',
		'} else if (PROBE_MODE === "flaky-once") {',
		'  const flagFile = path.join(marks, `flaky-${PROBE_KEY}`);',
		"  if (!fs.existsSync(flagFile)) {",
		'    fs.writeFileSync(flagFile, "1");',
		'    console.log("FAIL", "fixture: probe is flaky on its first attempt");',
		"  } else {",
		'    console.log("PASS", "fixture: probe is flaky on its first attempt");',
		"  }",
		'} else if (PROBE_MODE === "fail") {',
		'  console.log("FAIL", "fixture: probe always fails");',
		'} else if (PROBE_MODE === "envdump") {',
		"  const n = Number(process.env.GIT_CONFIG_COUNT || 0);",
		"  const pairs = [];",
		"  for (let i = 0; i < n; i++) pairs.push([process.env[`GIT_CONFIG_KEY_${i}`], process.env[`GIT_CONFIG_VALUE_${i}`]]);",
		"  const dump = {",
		"    home: process.env.HOME, userprofile: process.env.USERPROFILE,",
		"    tmpdir: process.env.TMPDIR, temp: process.env.TEMP, tmp: process.env.TMP,",
		"    nana: Object.keys(process.env).filter((k) => k.startsWith(\"NANA_\")),",
		"    seatMutate: Object.keys(process.env).filter((k) => k.startsWith(\"SEAT_MUTATE_\")),",
		"    agentDir: process.env.PI_CODING_AGENT_DIR ?? null,",
		"    gitConfigPairs: pairs,",
		"    npmPrefix: process.env.npm_config_prefix ?? null,",
		"    npmGlobalPrefix: process.env.npm_config_global_prefix ?? null,",
		"    npmGlobalConfig: process.env.npm_config_globalconfig ?? null,",
		"    npmUserConfig: process.env.npm_config_userconfig ?? null,",
		"    execArgv: process.execArgv,",
		"  };",
		"  fs.writeFileSync(process.env.NANA_TEST_ENV_DUMP, JSON.stringify(dump));",
		'  console.log("PASS", "fixture: probe dumped its environment");',
		"} else {",
		'  console.log("PASS", "fixture: probe ran");',
		"}",
		"",
	];
	fs.writeFileSync(path.join(pkg, "tests", "probe.test.mjs"), probeLines.join("\n"));

	const hookMark = path.join(root, ".git", "hook-ran.mark");
	const hookLines = ["#!/bin/sh", `echo ran >> ${JSON.stringify(hookMark)}`, ""];
	fs.writeFileSync(path.join(root, ".git", "hooks", "post-checkout"), hookLines.join("\n"));
	fs.chmodSync(path.join(root, ".git", "hooks", "post-checkout"), 0o755);

	sh("git", ["-C", root, "add", "-A"]);
	sh("git", ["-C", root, "commit", "-q", "-m", "fixture init"]);
	const tipSha = sh("git", ["-C", root, "rev-parse", "HEAD"]).stdout.trim();
	return { root, tipSha, hookMark, pkg };
}

/** A fresh fixture repo plus a run-scoped TMPDIR so leftover scans never see another check's state. */
function newFixture(label, initialProbeMode = "plain") {
	const td = tmpDir(path.join(os.tmpdir(), `mutrun-${label}-`));
	const repo = buildFixtureRepo(path.join(td, "repo"), initialProbeMode);
	const runTmp = path.join(td, "run-tmp");
	fs.mkdirSync(runTmp, { recursive: true });
	const marks = path.join(td, "marks");
	fs.mkdirSync(marks, { recursive: true });
	return { td, ...repo, runTmp, marks };
}

/** Adds a tracked symlink inside the fixture repo pointing OUTSIDE it, at a target under the check's own
 * temp folder; commits it so it survives `git worktree add`. POSIX only (M25). */
function addSymlinkEscape(fx) {
	const target = path.join(fx.td, "outside-target.txt");
	fs.writeFileSync(target, "ORIGINAL-OUTSIDE");
	const linkPath = path.join(fx.pkg, "lib", "escape-link.txt");
	fs.symlinkSync(target, linkPath);
	sh("git", ["-C", fx.root, "add", "-A"]);
	sh("git", ["-C", fx.root, "commit", "-q", "-m", "add escape symlink"]);
	fx.tipSha = sh("git", ["-C", fx.root, "rev-parse", "HEAD"]).stdout.trim();
	return target;
}

/** Swap TMPDIR/TEMP/TMP to `dir` for the duration of `fn` (R-1230's scratch folder stays check-local). */
async function withTmp(dir, fn) {
	const saved = { TMPDIR: process.env.TMPDIR, TEMP: process.env.TEMP, TMP: process.env.TMP };
	process.env.TMPDIR = dir;
	process.env.TEMP = dir;
	process.env.TMP = dir;
	try { return await fn(); } finally {
		for (const k of Object.keys(saved)) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }
	}
}

/** Swap SEAT_MUTATE_/NANA_TEST_ env for the call, restoring afterward, so checks never leak into each other. */
async function withEnv(vars, fn) {
	const keys = Object.keys(vars);
	const saved = {};
	for (const k of keys) saved[k] = process.env[k];
	for (const k of keys) { if (vars[k] === undefined) delete process.env[k]; else process.env[k] = String(vars[k]); }
	try { return await fn(); } finally {
		for (const k of keys) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }
	}
}

const one = (file, anchor, replacement, times = 1) => ({ file, anchor, replacement, times });
const probeKeyEdit = (key, partner = "") => [
	one("pkg/lib/probe-config.mjs", 'export const PROBE_KEY = "k0";', `export const PROBE_KEY = ${JSON.stringify(key)};`),
	one("pkg/lib/probe-config.mjs", 'export const PROBE_PARTNER_KEY = "";', `export const PROBE_PARTNER_KEY = ${JSON.stringify(partner)};`),
];
const probeModeEdit = (mode) => one("pkg/lib/probe-config.mjs", 'export const PROBE_MODE = "plain";', `export const PROBE_MODE = ${JSON.stringify(mode)};`);
const probeSleepEdit = (ms) => one("pkg/lib/probe-config.mjs", "export const PROBE_SLEEP_MS = 0;", `export const PROBE_SLEEP_MS = ${Number(ms)};`);

/** Writes a runnable lane table script inside the fixture repo; its `self` is this very file's URL. */
function writeTable(fx, name, def) {
	const marker = "@@REGEXP@@";
	const json = JSON.stringify(def, (k, v) => (v instanceof RegExp ? `${marker}${v.source}${marker}${v.flags}${marker}` : v), 2)
		.replace(new RegExp(`"${marker}([\\s\\S]*?)${marker}([a-z]*)${marker}"`, "g"), (_, src, flags) => `new RegExp(${JSON.stringify(src)}, ${JSON.stringify(flags)})`);
	const lines = [importLine("{ runMutations }", pathToFileURL(RUNNER_LIB).href), `const table = ${json};`, "table.self = import.meta.url;", "process.exitCode = await runMutations(table);", ""];
	const file = path.join(fx.root, name);
	fs.writeFileSync(file, lines.join("\n"));
	return pathToFileURL(file).href;
}

const T1 = path.posix.join("pkg", "tests", "one.test.mjs");
const T2 = path.posix.join("pkg", "tests", "probe.test.mjs");

/** Build a minimal table def; `self` is filled by writeTable. */
function table(fx, pairs, extra = {}) {
	return { lane: "fixture", tip: "main", pairs, declared: [], ...extra };
}

async function run(fx, name, def, env = {}) {
	const selfUrl = writeTable(fx, name, def);
	def.self = selfUrl;
	const withMarks = { NANA_TEST_MARKS: fx.marks, ...env };
	return withTmp(fx.runTmp, () => withEnv(withMarks, () => captured(() => runMutations({ ...def, self: selfUrl }))));
}

const outFile = (fx, name) => path.join(fx.td, name);
const readOut = (fx, name) => { try { return fs.readFileSync(outFile(fx, name), "utf8"); } catch { return ""; } };
const readMark = (fx, name) => { try { return fs.readFileSync(path.join(fx.marks, name), "utf8"); } catch { return null; } };
const isAlive = (pid) => { if (!pid) return false; try { process.kill(Number(pid), 0); return true; } catch { return false; } };
const PAIR_LINE_RE = /^(?:RED|GREEN|ANCHOR-MISS|SYNTAX|DRY ok) \S+ /m;
/** Scratch dirs left under a check-owned TMPDIR after a run; Node's own compile-cache dir is not ours. */
const leftoverScratch = (fx) => fs.readdirSync(fx.runTmp).filter((d) => d !== "node-compile-cache");
/** git status, ignoring the table harness scripts WE placed at the fixture repo's root (never the runner's). */
const repoStatus = (fx) => sh("git", ["-C", fx.root, "status", "--porcelain"]).stdout.split("\n").filter((l) => l && !/^\?\? [^/]+\.mjs$/.test(l)).join("\n");
const worktreePaths = (fx) => sh("git", ["-C", fx.root, "worktree", "list", "--porcelain"]).stdout.split(/\r?\n/).filter((l) => l.startsWith("worktree ")).map((l) => l.slice("worktree ".length).replace(/[ \t]+$/, ""));
const cleanupFaultPair = (n, key, mode) => ({ n: String(n), name: mode, edits: [...probeKeyEdit(key), probeModeEdit(mode)], tests: [T2], expectRed: [] });

// ── R-1230: scratch worktrees ────────────────────────────────────────────────────────────────────
{
	const fx = newFixture("m1");
	const r = await run(fx, "t.mjs", table(fx, [
		{ n: "1", name: "mutate a", edits: [one("pkg/lib/a.mjs", 'return "A-ORIGINAL";', 'return "A-MUTATED";')], tests: [T1], expectRed: ["fixture: a returns ORIGINAL"] },
		{ n: "2", name: "no-op sees a clean worktree", edits: [], tests: [T1], expectRed: [] },
	]), { [CFG.ENV_NAMES.OUT]: outFile(fx, "r.txt"), [CFG.ENV_NAMES.STAGGER_SECS]: "0" });
	const rec = readOut(fx, "r.txt");
	const aUnchanged = fs.readFileSync(path.join(fx.pkg, "lib", "a.mjs"), "utf8").includes("A-ORIGINAL");
	const repoClean = repoStatus(fx).trim() === "";
	const noHook = !fs.existsSync(fx.hookMark);
	const wtList = sh("git", ["-C", fx.root, "worktree", "list"]).stdout.trim().split("\n");
	const ok = r.result === 0
		&& /^RED 1 .*fixture: a returns ORIGINAL/m.test(rec)
		&& /^GREEN 2 /m.test(rec)
		&& aUnchanged && repoClean && noHook
		&& wtList.length === 1 && leftoverScratch(fx).length === 0;
	// req: R-1230
	check("mutation runner: a pair's edit lands only in a scratch worktree under the temp folder with the lane repository's git hooks not run, the source checkout stays unchanged, and the next pair in that worktree sees neither the edit nor an untracked or ignored file the test left", ok, JSON.stringify({ exitCode: r.result, aUnchanged, repoClean, noHook, wtList, leftover: leftoverScratch(fx), rec }));
}

{
	const fx = newFixture("m2");
	fs.writeFileSync(path.join(fx.root, "untracked.txt"), "keep me");
	const before = sh("git", ["-C", fx.root, "status", "--porcelain"]).stdout;
	const a = await attempt(() => resetScratch(fx.pkg, fx.tipSha, {}));
	const after = sh("git", ["-C", fx.root, "status", "--porcelain"]).stdout;
	const ok = a.ok === false && fs.existsSync(path.join(fx.root, "untracked.txt")) && before === after && before.includes("untracked.txt");
	// req: R-1230
	check("mutation runner: a scratch path that is not its own git root is refused before any reset or clean, and an untracked file in the repository around it survives", ok, JSON.stringify({ threw: a.ok === false, before, after }));
}

// ── R-1231: cleanup, keep, dead-shard cleanup ───────────────────────────────────────────────────
{
	const reasons = [];

	// (a) one shard, (b) three shards: plain pairs, cleanup after a normal run.
	for (const shards of [1, 3]) {
		const fx = newFixture(`m3-${shards}`);
		const pairs = Array.from({ length: 3 }, (_, i) => ({ n: String(i + 1), name: `pair ${i + 1}`, edits: [], tests: [T1], expectRed: [] }));
		const r = await run(fx, "t.mjs", table(fx, pairs), { [CFG.ENV_NAMES.OUT]: outFile(fx, "r.txt"), [CFG.ENV_NAMES.SHARDS]: String(shards), [CFG.ENV_NAMES.STAGGER_SECS]: "0" });
		const wtList = sh("git", ["-C", fx.root, "worktree", "list"]).stdout.trim().split("\n");
		if (r.result !== 0) reasons.push(`shards=${shards}: exit ${r.result}`);
		if (leftoverScratch(fx).length) reasons.push(`shards=${shards}: leftover ${JSON.stringify(leftoverScratch(fx))}`);
		if (wtList.length !== 1) reasons.push(`shards=${shards}: worktree list ${JSON.stringify(wtList)}`);
	}

	// (c) a shard killed outright leaves an orphaned test file; the parent kills it and cleans up.
	{
		const fx = newFixture("m3-dead");
		const pairs = [{ n: "1", name: "selfkill", edits: [...probeKeyEdit("dead"), probeModeEdit("selfkill")], tests: [T2], expectRed: [] }];
		const r = await run(fx, "t.mjs", table(fx, pairs), { [CFG.ENV_NAMES.OUT]: outFile(fx, "r.txt"), [CFG.ENV_NAMES.SHARDS]: "1", [CFG.ENV_NAMES.STAGGER_SECS]: "0" });
		const probePid = readMark(fx, "pid-dead");
		const stillAlive = await waitUntil(() => !isAlive(probePid), 4000).then(() => isAlive(probePid));
		if (r.result === 0) reasons.push("dead shard: exit code was 0");
		if (stillAlive) reasons.push(`dead shard: orphaned probe pid ${probePid} is still alive`);
		if (leftoverScratch(fx).length) reasons.push(`dead shard: leftover ${JSON.stringify(leftoverScratch(fx))}`);
		const wtList = sh("git", ["-C", fx.root, "worktree", "list"]).stdout.trim().split("\n");
		if (wtList.length !== 1) reasons.push(`dead shard: worktree list ${JSON.stringify(wtList)}`);
	}

	// (d) SEAT_MUTATE_KEEP=1 leaves the scratch worktree and prints its path.
	{
		const fx = newFixture("m3-keep");
		const pairs = [{ n: "1", name: "keep", edits: [], tests: [T1], expectRed: [] }];
		const r = await run(fx, "t.mjs", table(fx, pairs), { [CFG.ENV_NAMES.OUT]: outFile(fx, "r.txt"), [CFG.ENV_NAMES.SHARDS]: "1", [CFG.ENV_NAMES.STAGGER_SECS]: "0", [CFG.ENV_NAMES.KEEP]: "1" });
		const left = leftoverScratch(fx);
		const printed = /seat-mutate: KEEP — scratch left at (\S+)/.exec(r.text);
		const wtStillThere = printed && fs.existsSync(path.join(printed[1], "wt", "pkg", "tests", "one.test.mjs"));
		if (!left.length) reasons.push("keep: no scratch dir left");
		if (!printed) reasons.push("keep: no KEEP line printed");
		if (printed && !wtStillThere) reasons.push(`keep: worktree not found at ${printed?.[1]}`);
	}

	// req: R-1231
	check("mutation runner: after a run at one shard and at three, and after one whose shard is killed outright, no running test file, scratch folder or git worktree entry is left, and with SEAT_MUTATE_KEEP=1 every scratch worktree is left and its path printed", reasons.length === 0, reasons.join("; "));
}

// ── R-1770 to R-1774: cleanup after git refuses its first removal ───────────────────────────────
{
	const reasons = [];
	for (const shards of [1, CFG.WORKTREE_REMOVE_RETRIES]) {
		const fx = newFixture(`cleanup-retry-${shards}`);
		const pairs = Array.from({ length: shards }, (_, i) => cleanupFaultPair(i + 1, `drop-${i}`, "drop-dotgit"));
		const r = await run(fx, "t.mjs", table(fx, pairs), { [CFG.ENV_NAMES.OUT]: outFile(fx, "r.txt"), [CFG.ENV_NAMES.SHARDS]: String(shards), [CFG.ENV_NAMES.STAGGER_SECS]: "0" });
		const paths = worktreePaths(fx);
		if (r.result !== 0) reasons.push(`shards=${shards}: exit ${r.result}`);
		if (paths.length !== 1 || safely(() => fs.realpathSync.native(paths[0]) === fs.realpathSync.native(fx.root), false) !== true) reasons.push(`shards=${shards}: worktrees ${JSON.stringify(paths)}`);
		if (leftoverScratch(fx).length) reasons.push(`shards=${shards}: leftover ${JSON.stringify(leftoverScratch(fx))}`);
	}
	// req: R-1770
	check("mutation runner: when git's first remove of a scratch worktree fails at a shard's end, at one shard and at three, git worktree list names only the lane repository and no scratch folder is left", reasons.length === 0, reasons.join("; "));
}

{
	const fx = newFixture("cleanup-dead-retry");
	const r = await run(fx, "t.mjs", table(fx, [cleanupFaultPair("1", "drop-dead", "drop-dotgit-selfkill")]), { [CFG.ENV_NAMES.OUT]: outFile(fx, "r.txt"), [CFG.ENV_NAMES.SHARDS]: "1", [CFG.ENV_NAMES.STAGGER_SECS]: "0" });
	const paths = worktreePaths(fx);
	const onlyLaneRepo = paths.length === 1 && safely(() => fs.realpathSync.native(paths[0]) === fs.realpathSync.native(fx.root), false) === true;
	const ok = r.result !== 0 && onlyLaneRepo && leftoverScratch(fx).length === 0;
	// req: R-1771
	check("mutation runner: when git's first remove of a dead shard's scratch worktree fails, the parent leaves git worktree list naming only the lane repository and no scratch folder", ok, JSON.stringify({ exitCode: r.result, paths, leftover: leftoverScratch(fx), text: r.text }));
}

{
	const fx = newFixture("cleanup-decoys");
	const live = path.join(fx.td, "live-decoy");
	const missing = path.join(fx.td, "missing-decoy");
	sh("git", ["-C", fx.root, "worktree", "add", "-q", "--detach", live, fx.tipSha]);
	sh("git", ["-C", fx.root, "worktree", "add", "-q", "--detach", missing, fx.tipSha]);
	fs.rmSync(missing, { recursive: true, force: true });
	const r = await run(fx, "t.mjs", table(fx, [cleanupFaultPair("1", "drop-own", "drop-dotgit")]), { [CFG.ENV_NAMES.OUT]: outFile(fx, "r.txt"), [CFG.ENV_NAMES.SHARDS]: "1", [CFG.ENV_NAMES.STAGGER_SECS]: "0" });
	const paths = worktreePaths(fx);
	const listedSuffixes = paths.map((p) => p.replace(/\\/g, "/"));
	const ok = r.result === 0 && listedSuffixes.some((p) => p.endsWith("/live-decoy")) && listedSuffixes.some((p) => p.endsWith("/missing-decoy"));
	// req: R-1772
	check("mutation runner: a worktree entry the runner did not create, live or with its folder missing, is still listed after a run whose own first remove failed", ok, JSON.stringify({ exitCode: r.result, live, missing, paths, text: r.text }));
}

let lockedCleanupRun = null;
{
	const traceTimes = (traceFile) => fs.readFileSync(traceFile, "utf8").split(/\r?\n/).filter((l) => l.includes("trace: built-in: git worktree remove")).map((l) => {
		const m = /(\d{2}):(\d{2}):(\d{2})\.(\d{6})/.exec(l);
		return m ? (((Number(m[1]) * 60 + Number(m[2])) * 60 + Number(m[3])) * 1000 + Number(m[4]) / 1000) : null;
	}).filter((v) => v !== null);
	const gaps = (times) => times.slice(1).map((t, i) => { const raw = t - times[i]; return raw < 0 ? raw + 24 * 60 * 60 * 1000 : raw; });

	const lockFx = newFixture("cleanup-lock-trace");
	const lockTrace = outFile(lockFx, "git.trace");
	const lockResult = await run(lockFx, "t.mjs", table(lockFx, [cleanupFaultPair("1", "lock", "lock-self")]), { GIT_TRACE: lockTrace, [CFG.ENV_NAMES.OUT]: outFile(lockFx, "r.txt"), [CFG.ENV_NAMES.SHARDS]: "1", [CFG.ENV_NAMES.STAGGER_SECS]: "0" });
	const lockTimes = traceTimes(lockTrace);
	const lockGaps = gaps(lockTimes);
	lockedCleanupRun = { fx: lockFx, r: lockResult, record: readOut(lockFx, "r.txt") };

	const dropFx = newFixture("cleanup-drop-trace");
	const dropTrace = outFile(dropFx, "git.trace");
	const dropResult = await run(dropFx, "t.mjs", table(dropFx, [cleanupFaultPair("1", "drop-trace", "drop-dotgit")]), { GIT_TRACE: dropTrace, [CFG.ENV_NAMES.OUT]: outFile(dropFx, "r.txt"), [CFG.ENV_NAMES.SHARDS]: "1", [CFG.ENV_NAMES.STAGGER_SECS]: "0" });
	const dropTimes = traceTimes(dropTrace);
	const ok = lockTimes.length === 1 + CFG.WORKTREE_REMOVE_RETRIES && lockGaps.length === CFG.WORKTREE_REMOVE_RETRIES && lockGaps.every((gap) => gap >= CFG.WORKTREE_REMOVE_RETRY_MS) && dropResult.result === 0 && dropTimes.length === 2;
	// req: R-1773
	check("mutation runner: a scratch worktree entry git keeps refusing to remove is removed again exactly the configured retry count of times, at least the configured delay apart, and one the first retry removes is not removed again", ok, JSON.stringify({ lockExit: lockResult.result, lockTimes, lockGaps, dropExit: dropResult.result, dropTimes, lockText: lockResult.text, dropText: dropResult.text }));
}

{
	const cases = [];
	if (lockedCleanupRun) cases.push({ label: "shard", ...lockedCleanupRun, wt: readMark(lockedCleanupRun.fx, "wt-lock") });
	const deadFx = newFixture("cleanup-dead-lock");
	const deadResult = await run(deadFx, "t.mjs", table(deadFx, [cleanupFaultPair("1", "dead-lock", "lock-self-selfkill")]), { [CFG.ENV_NAMES.OUT]: outFile(deadFx, "r.txt"), [CFG.ENV_NAMES.SHARDS]: "1", [CFG.ENV_NAMES.STAGGER_SECS]: "0" });
	cases.push({ label: "dead", fx: deadFx, r: deadResult, record: readOut(deadFx, "r.txt"), wt: readMark(deadFx, "wt-dead-lock") });
	const reasons = [];
	for (const c of cases) {
		const suffix = `/${path.basename(path.dirname(c.wt ?? ""))}/wt is still listed after ${CFG.WORKTREE_REMOVE_RETRIES} retries`;
		const outputLines = c.r.text.split(/\r?\n/).filter((l) => l.includes("seat-mutate: git worktree entry ") && l.replace(/\\/g, "/").endsWith(suffix));
		const recordLines = c.record.split(/\r?\n/).filter((l) => l.includes("seat-mutate: git worktree entry ") && l.replace(/\\/g, "/").endsWith(suffix));
		if (!c.wt) reasons.push(`${c.label}: no worktree mark`);
		if (outputLines.length !== 1) reasons.push(`${c.label}: output count ${outputLines.length} in ${c.r.text}`);
		if (recordLines.length !== 1) reasons.push(`${c.label}: record count ${recordLines.length} in ${c.record}`);
	}
	// req: R-1774
	check("mutation runner: a scratch worktree entry still listed after the last retry, at a shard's end and after a dead shard, is named with its retry count once in the output and once in the record", reasons.length === 0, reasons.join("; "));
}

{
	const ok = CFG.WORKTREE_REMOVE_RETRIES === 3 && CFG.WORKTREE_REMOVE_RETRY_MS === 250;
	// req: R-1773
	check("mutation runner: sealed cleanup values: the retry count and the retry delay", ok, JSON.stringify({ retries: CFG.WORKTREE_REMOVE_RETRIES, retryMs: CFG.WORKTREE_REMOVE_RETRY_MS }));
}

if (!posix) {
	skip("mutation runner: SIGTERM during a two-shard run kills every running test file's process tree, leaves no scratch worktree and exits non-zero", "POSIX only");
} else {
	const fx = newFixture("m4");
	const pairs = [
		{ n: "1", name: "sleeper 1", edits: [...probeKeyEdit("s1"), probeModeEdit("sleep"), probeSleepEdit(60000)], tests: [T2], expectRed: [] },
		{ n: "2", name: "sleeper 2", edits: [...probeKeyEdit("s2"), probeModeEdit("sleep"), probeSleepEdit(60000)], tests: [T2], expectRed: [] },
	];
	const selfUrl = writeTable(fx, "t.mjs", table(fx, pairs));
	const started = Date.now();
	const timer = setTimeout(() => process.kill(process.pid, "SIGTERM"), 1500);
	const r = await withTmp(fx.runTmp, () => withEnv({ [CFG.ENV_NAMES.OUT]: outFile(fx, "r.txt"), [CFG.ENV_NAMES.SHARDS]: "2", [CFG.ENV_NAMES.STAGGER_SECS]: "0" }, () => captured(() => runMutations({ ...table(fx, pairs), self: selfUrl }))));
	clearTimeout(timer);
	const pid1 = readMark(fx, "pid-s1");
	const pid2 = readMark(fx, "pid-s2");
	const dead1 = await waitUntil(() => !isAlive(pid1), 2000).then(() => !isAlive(pid1));
	const dead2 = await waitUntil(() => !isAlive(pid2), 2000).then(() => !isAlive(pid2));
	const ok = r.result !== 0 && (Date.now() - started) < 15000 && dead1 && dead2 && leftoverScratch(fx).length === 0;
	// req: R-1231
	check("mutation runner: SIGTERM during a two-shard run kills every running test file's process tree, leaves no scratch worktree and exits non-zero", ok, JSON.stringify({ exitCode: r.result, dead1, dead2, leftover: leftoverScratch(fx) }));
}

// ── R-1232: the test-file run environment ───────────────────────────────────────────────────────
const NPM_ENV_KEYS = { npm_config_prefix: undefined, npm_config_global_prefix: undefined, npm_config_globalconfig: undefined, npm_config_userconfig: undefined };

{
	const fx = newFixture("m5");
	const dumpFile = outFile(fx, "dump.json");
	const pairs = [{ n: "1", name: "dump", edits: [...probeKeyEdit("d1"), probeModeEdit("envdump")], tests: [T2], expectRed: [] }];
	const outerHome = process.env.HOME;
	const r = await run(fx, "t.mjs", table(fx, pairs), {
		...NPM_ENV_KEYS,
		NANA_FOO: "leak-me-not",
		PI_CODING_AGENT_DIR: "/should/not/leak",
		NANA_TEST_ENV_DUMP: dumpFile,
		GIT_CONFIG_COUNT: "1",
		GIT_CONFIG_KEY_0: "foo.bar",
		GIT_CONFIG_VALUE_0: "baz",
		[CFG.ENV_NAMES.OUT]: outFile(fx, "r.txt"),
		[CFG.ENV_NAMES.SHARDS]: "1",
	});
	let dump = {};
	try { dump = JSON.parse(fs.readFileSync(dumpFile, "utf8")); } catch { /* left empty on failure */ }
	const gitPairs = (dump.gitConfigPairs ?? []).map((p) => p.join("="));
	const ok = r.result === 0
		&& dump.home && dump.home !== outerHome
		&& dump.tmpdir && dump.tmpdir !== process.env.TMPDIR
		&& !(dump.nana ?? []).includes("NANA_FOO")
		&& (dump.seatMutate ?? []).length === 0
		&& dump.agentDir === null
		&& gitPairs[0] === "foo.bar=baz"
		&& gitPairs.includes("gc.auto=0")
		&& (dump.execArgv ?? []).includes("--experimental-strip-types");
	// req: R-1232
	check("mutation runner: each test file runs as node --experimental-strip-types from its package folder with its own fresh HOME, USERPROFILE, TMPDIR, TEMP and TMP, no ambient NANA_ or SEAT_MUTATE_ variable or PI_CODING_AGENT_DIR, its NANA_TEST_ variables, and gc.auto 0 after the caller's GIT_CONFIG entries", ok, JSON.stringify(dump));
}

{
	const reasons = [];
	// The fake-npm stub is an extensionless `#!/usr/bin/env node` script started with no shell
	// (lib/mutation-runner.mjs spawns NPM_COMMAND directly): Windows cannot launch it, and the
	// pack README already declares npm's config values unread there (packages/nana-pack/README.md:
	// "npm's config values are not read there"), so this half is POSIX-only; the missing-npm half
	// below names the same gap through a command that cannot start on any platform, and still runs.
	if (posix) {
		const fakeNpm = outFile({ td: tmpDir(path.join(os.tmpdir(), "mutrun-fakenpm-")) }, "fake-npm.mjs");
		fs.writeFileSync(fakeNpm, ["#!/usr/bin/env node", 'if (process.argv[2] === "config" && process.argv[3] === "get" && process.argv[4] === "prefix") { console.log("/fake/prefix"); process.exit(0); }', "process.exit(1);", ""].join("\n"));
		fs.chmodSync(fakeNpm, 0o755);

		const fx = newFixture("m6-fake");
		const dumpFile = outFile(fx, "dump.json");
		const r = await run(fx, "t.mjs", table(fx, [{ n: "1", name: "dump", edits: [...probeKeyEdit("n1"), probeModeEdit("envdump")], tests: [T2], expectRed: [] }], { config: { NPM_COMMAND: fakeNpm } }), { ...NPM_ENV_KEYS, NANA_TEST_ENV_DUMP: dumpFile, [CFG.ENV_NAMES.OUT]: outFile(fx, "r.txt"), [CFG.ENV_NAMES.SHARDS]: "1" });
		let dump = {};
		try { dump = JSON.parse(fs.readFileSync(dumpFile, "utf8")); } catch { /* left empty */ }
		if (dump.npmPrefix !== "/fake/prefix") reasons.push(`fake npm: prefix ${dump.npmPrefix}`);
		if (dump.npmGlobalPrefix !== "/fake/prefix") reasons.push(`fake npm: global_prefix ${dump.npmGlobalPrefix}`);
		if (dump.npmGlobalConfig !== null) reasons.push(`fake npm: globalconfig ${dump.npmGlobalConfig}`);
		if (!/npm could not give[^\n]*globalconfig/.test(r.text) || !/npm could not give[^\n]*userconfig/.test(r.text)) reasons.push(`fake npm: no "npm could not give" line in ${r.text}`);
	} else {
		skip("mutation runner: fake npm emulates a readable prefix", "Windows cannot launch an extensionless shebang script with no shell, and npm's config values are not read there (packages/nana-pack/README.md)");
	}
	{
		const fx = newFixture("m6-missing");
		const dumpFile = outFile(fx, "dump.json");
		const r = await run(fx, "t.mjs", table(fx, [{ n: "1", name: "dump", edits: [...probeKeyEdit("n2"), probeModeEdit("envdump")], tests: [T2], expectRed: [] }], { config: { NPM_COMMAND: "/definitely/not/a/real/npm-command-xyz" } }), { ...NPM_ENV_KEYS, NANA_TEST_ENV_DUMP: dumpFile, [CFG.ENV_NAMES.OUT]: outFile(fx, "r.txt"), [CFG.ENV_NAMES.SHARDS]: "1" });
		let dump = {};
		try { dump = JSON.parse(fs.readFileSync(dumpFile, "utf8")); } catch { /* left empty */ }
		if (dump.npmPrefix !== null) reasons.push(`missing npm: prefix ${dump.npmPrefix}`);
		if (!/npm could not give/.test(r.text) || !/prefix/.test(r.text) || !/global_prefix/.test(r.text)) reasons.push(`missing npm: line missing names: ${r.text}`);
	}
	// req: R-1232
	check("mutation runner: npm's prefix, global config and user config fill only values the caller lacks, the prefix fills a missing global prefix, and an npm that cannot start prints one line naming each value not read", reasons.length === 0, reasons.join("; "));
}

// ── R-1233: per-file timeout ─────────────────────────────────────────────────────────────────────
{
	const fx = newFixture("m7");
	const pairs = [{ n: "1", name: "hang", edits: [...probeKeyEdit("h1"), probeModeEdit("hang")], tests: [T2], expectRed: [] }];
	const r = await run(fx, "t.mjs", table(fx, pairs, { config: { FILE_TIMEOUT_MS: 400 } }), { [CFG.ENV_NAMES.OUT]: outFile(fx, "r.txt"), [CFG.ENV_NAMES.SHARDS]: "1" });
	const pid = readMark(fx, "pid-h1");
	const dead = await waitUntil(() => !isAlive(pid), 3000).then(() => !isAlive(pid));
	const ok = r.result === 0 && /\(timeout\)/.test(r.text) && dead;
	// req: R-1233
	check("mutation runner: a test file past its time limit has its whole process tree killed and is reported timed out", ok, JSON.stringify({ exitCode: r.result, dead, text: r.text }));
}

// ── R-1234: drain, stray kill after exit ────────────────────────────────────────────────────────
if (!posix) {
	skip("mutation runner: a child that a test file leaves running after a normal exit is gone when the file's result returns", "POSIX only");
} else {
	const fx = newFixture("m8");
	const pairs = [{ n: "1", name: "stray-group", edits: [...probeKeyEdit("g1"), probeModeEdit("stray-group")], tests: [T2], expectRed: [] }];
	const r = await run(fx, "t.mjs", table(fx, pairs), { [CFG.ENV_NAMES.OUT]: outFile(fx, "r.txt"), [CFG.ENV_NAMES.SHARDS]: "1" });
	const pid = readMark(fx, "stray-pid-g1");
	const dead = !isAlive(pid); // the call already returned; R-1234 kills the group once the result is known
	const ok = r.result === 0 && pid && dead;
	// req: R-1234
	check("mutation runner: a child that a test file leaves running after a normal exit is gone when the file's result returns", ok, JSON.stringify({ exitCode: r.result, pid, dead }));
}

{
	const fx = newFixture("m9");
	const pairs = [{ n: "1", name: "stray-pipe", edits: [...probeKeyEdit("p1"), probeModeEdit("stray-pipe"), probeSleepEdit(6000)], tests: [T2], expectRed: [] }];
	const t0 = Date.now();
	const r = await run(fx, "t.mjs", table(fx, pairs), { [CFG.ENV_NAMES.OUT]: outFile(fx, "r.txt"), [CFG.ENV_NAMES.SHARDS]: "1" });
	const elapsed = Date.now() - t0;
	const sleeperPid = readMark(fx, "sleeper-pid-p1");
	const stillAliveAtReturn = isAlive(sleeperPid);
	const ok = r.result === 0 && stillAliveAtReturn && elapsed < CFG.FILE_TIMEOUT_MS;
	if (posix && sleeperPid) { try { process.kill(Number(sleeperPid), "SIGKILL"); } catch { /* best effort */ } }
	// req: R-1234
	check("mutation runner: after a test file exits, a descendant holding its output delays the result by at most the drain", ok, JSON.stringify({ exitCode: r.result, elapsed, stillAliveAtReturn }));
}

// ── R-1235: ANCHOR-MISS and SYNTAX ──────────────────────────────────────────────────────────────
{
	const fx = newFixture("m10");
	const pairs = [
		{ n: "1", name: "anchor not at all", edits: [one("pkg/lib/a.mjs", "definitely-not-present-xyz", "x")], tests: [T1], expectRed: [] },
		{ n: "2", name: "anchor twice", edits: [one("pkg/lib/a.mjs", "A", "A")], tests: [T1], expectRed: [] },
		{ n: "3", name: "healthy pair after the misses", edits: [one("pkg/lib/a.mjs", 'return "A-ORIGINAL";', 'return "A-MUTATED";')], tests: [T1], expectRed: ["fixture: a returns ORIGINAL"] },
		{ n: "4", name: "edit file missing", edits: [one("pkg/lib/does-not-exist.mjs", "x", "y")], tests: [T1], expectRed: [] },
	];
	const r = await run(fx, "t.mjs", table(fx, pairs), { [CFG.ENV_NAMES.OUT]: outFile(fx, "r.txt"), [CFG.ENV_NAMES.SHARDS]: "1" });
	const ok = r.result === CFG.EXIT_TABLE_FAULT
		&& /^ANCHOR-MISS 1 /m.test(r.text)
		&& /^ANCHOR-MISS 2 /m.test(r.text)
		&& /^ANCHOR-MISS 4 .*does-not-exist\.mjs/m.test(r.text)
		&& /^RED 3 .*fixture: a returns ORIGINAL/m.test(r.text);
	// req: R-1235
	check("mutation runner: an anchor that occurs twice or not at all, or an edit file that does not exist, is ANCHOR-MISS naming the file, runs no test file, and the run exits 3", ok, JSON.stringify({ exitCode: r.result, text: r.text }));
}

{
	const fx = newFixture("m11");
	const pairs = [
		{ n: "1", name: "break a.mjs", edits: [one("pkg/lib/a.mjs", 'return "A-ORIGINAL";', 'return "A-ORIGINAL" that is not valid js (')], tests: [T1], expectRed: [] },
		{ n: "2", name: "break c.ts at module level", edits: [one("pkg/lib/c.ts", 'return "C-ORIGINAL";\n}', ['return "C-ORIGINAL";', "}", "export function valueC(): string {", '  return "C-DUPLICATE";', "}"].join("\n"))], tests: [T1], expectRed: [] },
		{ n: "3", name: "a valid c.ts edit is not SYNTAX", edits: [one("pkg/lib/c.ts", 'return "C-ORIGINAL";', 'return "C-CHANGED";')], tests: [T1], expectRed: [] },
	];
	const r = await run(fx, "t.mjs", table(fx, pairs), { [CFG.ENV_NAMES.OUT]: outFile(fx, "r.txt"), [CFG.ENV_NAMES.SHARDS]: "1" });
	const ok = r.result === CFG.EXIT_TABLE_FAULT
		&& /^SYNTAX 1 .*a\.mjs/m.test(r.text)
		&& /^SYNTAX 2 .*c\.ts/m.test(r.text)
		&& !/^SYNTAX 3 /m.test(r.text);
	// req: R-1235
	check("mutation runner: an edit that breaks a .mjs module, or a .ts module a test reaches only through a spawned child, is SYNTAX before any test file runs, a valid .ts edit is not, and the run exits 3", ok, JSON.stringify({ exitCode: r.result, text: r.text }));
}

// ── R-1322: scratch worktrees hold the committed bytes under core.autocrlf=true ────────────────
{
	const fx = newFixture("m-crlf");
	// Git for Windows' installer default, reproducible on any platform: the fixture repo's OWN
	// config, not the caller's environment, is what lib/mutation-runner.mjs's worktree add and
	// reset must now override.
	sh("git", ["-C", fx.root, "config", "core.autocrlf", "true"]);
	const pairs = [
		{ n: "1", name: "a line-break anchor applies under core.autocrlf=true", edits: [one("pkg/lib/c.ts", 'return "C-ORIGINAL";\n}', 'return "C-RECHECKED";\n}')], tests: [T1], expectRed: [] },
	];
	const r = await run(fx, "t.mjs", table(fx, pairs), { [CFG.ENV_NAMES.OUT]: outFile(fx, "r.txt"), [CFG.ENV_NAMES.SHARDS]: "1" });
	const ok = r.result === 0 && /^GREEN 1 /m.test(r.text) && !/ANCHOR-MISS/.test(r.text);
	// req: R-1322
	check("R-1322: a scratch worktree from a repository with core.autocrlf=true holds the committed LF bytes, and a pair whose anchor spans a line break applies", ok, JSON.stringify({ exitCode: r.result, text: r.text }));
}

// ── R-1236: baseline ─────────────────────────────────────────────────────────────────────────────
{
	const reasons = [];
	{
		const fx = newFixture("m12-retry", "flaky-once");
		const r = await run(fx, "t.mjs", table(fx, [{ n: "1", name: "no-op", edits: [], tests: [T2], expectRed: [] }]), { [CFG.ENV_NAMES.OUT]: outFile(fx, "r.txt"), [CFG.ENV_NAMES.SHARDS]: "1" });
		if (r.result !== 0) reasons.push(`retry: exit ${r.result}`);
		if (!/BASELINE RETRY ok\s/.test(r.text)) reasons.push(`retry: no retry-ok baseline line in ${r.text}`);
		if (!/^GREEN 1 /m.test(r.text)) reasons.push(`retry: pair was not judged: ${r.text}`);
	}
	{
		const fx = newFixture("m12-alwaysred", "fail");
		const r = await run(fx, "t.mjs", table(fx, [{ n: "1", name: "no-op", edits: [], tests: [T2], expectRed: [] }]), { [CFG.ENV_NAMES.OUT]: outFile(fx, "r.txt"), [CFG.ENV_NAMES.SHARDS]: "1" });
		if (r.result === 0) reasons.push("always-red: exit was 0");
		if (!/baseline not green/.test(r.text)) reasons.push(`always-red: no refusal line in ${r.text}`);
		if (PAIR_LINE_RE.test(r.text)) reasons.push(`always-red: a pair was judged: ${r.text}`);
	}
	{
		const fx = newFixture("m12-missingtitle");
		const r = await run(fx, "t.mjs", table(fx, [{ n: "1", name: "names an impossible title", edits: [], tests: [T2], expectRed: ["fixture: this title never appears"] }]), { [CFG.ENV_NAMES.OUT]: outFile(fx, "r.txt"), [CFG.ENV_NAMES.SHARDS]: "1" });
		if (r.result === 0) reasons.push("missing title: exit was 0");
		if (!/BASELINE MISSING title/.test(r.text)) reasons.push(`missing title: no BASELINE MISSING line in ${r.text}`);
		if (PAIR_LINE_RE.test(r.text)) reasons.push(`missing title: a pair was judged: ${r.text}`);
	}
	// req: R-1236
	check("mutation runner: a baseline file red once runs again and the run goes on, while one red on every attempt, or a named title with no matching baseline PASS line, ends the shard with exit 2 before any pair is judged, naming it", reasons.length === 0, reasons.join("; "));
}

// ── R-1237: judging (pure — no git) ─────────────────────────────────────────────────────────────
{
	const reasons = [];
	const j1 = safely(() => judgePair({ expectRed: ["some title"] }, [{ rel: "f.mjs", out: "FAIL some title\n", code: 1, timedOut: false }]), EMPTY_JUDGE);
	if (j1.verdict !== "RED" || !j1.matchedNamed.includes("some title")) reasons.push(`LF: ${JSON.stringify(j1)}`);

	const j2 = safely(() => judgePair({ expectRed: ["some title"] }, [{ rel: "f.mjs", out: "FAIL some title\r\n", code: 1, timedOut: false }]), EMPTY_JUDGE);
	if (j2.verdict !== "RED" || !j2.matchedNamed.includes("some title")) reasons.push(`CRLF: ${JSON.stringify(j2)}`);

	const j3 = safely(() => judgePair({ expectRed: ["some title"] }, [{ rel: "f.mjs", out: "FAIL some title extra detail here\n", code: 1, timedOut: false }]), EMPTY_JUDGE);
	if (j3.verdict !== "RED" || !j3.matchedNamed.includes("some title")) reasons.push(`detail-after-title: ${JSON.stringify(j3)}`);

	const j4 = safely(() => judgePair({ expectRed: [/some.*title/] }, [{ rel: "f.mjs", out: "FAIL something about a title\n", code: 1, timedOut: false }]), EMPTY_JUDGE);
	if (j4.verdict !== "RED" || j4.matchedNamed.length !== 1) reasons.push(`pattern-title: ${JSON.stringify(j4)}`);

	const j5 = safely(() => judgePair({ expectRed: ["some title"] }, [{ rel: "f.mjs", out: "PASS some title\n", code: 0, timedOut: false }]), EMPTY_JUDGE);
	if (j5.verdict !== "GREEN") reasons.push(`survives: ${JSON.stringify(j5)}`);

	// req: R-1237
	check("mutation runner judge: with LF or CRLF output, detail after titles and a title given as a pattern, a pair that reds its named title is RED naming it, and a pair with no failing title is GREEN (SURVIVED)", reasons.length === 0, reasons.join("; "));
}

{
	const pair = { expectRed: ["TitleA (stays green)", "TitleB (not reached)"], alsoRed: ["TitleC (declared)"] };
	const runs = [
		{ rel: "f1.mjs", out: "PASS TitleA (stays green)\nFAIL TitleC (declared)\nFAIL Unnamed title here\n", code: 0, timedOut: false },
		{ rel: "f2.mjs", out: `console garbage\nNode.js v${process.versions.node}`, code: 1, timedOut: false },
		{ rel: "f3.mjs", out: "", code: null, timedOut: true },
	];
	const j = safely(() => judgePair(pair, runs), EMPTY_JUDGE);
	const ok = j.verdict === "RED"
		&& j.namedButGreen.includes("TitleA (stays green)")
		&& j.notReached.includes("TitleB (not reached)")
		&& j.declaredRed.includes("TitleC (declared)")
		&& j.unnamedRed.some((u) => u.t === "Unnamed title here")
		&& !j.unnamedRed.some((u) => u.t === "TitleC (declared)")
		&& j.crashed.some((c) => /f2\.mjs/.test(c))
		&& j.crashed.some((c) => /f3\.mjs.*timeout/.test(c));
	// req: R-1237
	check("mutation runner judge: a RED line lists a named title that stayed green, one not reached, an unnamed failing title, a crashed file and a timed-out file, and leaves a declared also-red title out of the unnamed list", ok, JSON.stringify(j));
}

// ── R-1235, R-1236: path containment ────────────────────────────────────────────────────────────
{
	const reasons = [];
	{
		const fx = newFixture("m25-dotdot");
		const r = await run(fx, "t.mjs", table(fx, [{ n: "1", name: "edit escapes by ..", edits: [one("../escape.txt", "x", "y")], tests: [T1], expectRed: [] }]), { [CFG.ENV_NAMES.OUT]: outFile(fx, "r.txt"), [CFG.ENV_NAMES.SHARDS]: "1" });
		if (r.result !== CFG.EXIT_TABLE_FAULT) reasons.push(`dotdot: exit ${r.result}`);
		if (!/^ANCHOR-MISS 1 .*escape\.txt.*outside/m.test(r.text)) reasons.push(`dotdot: no ANCHOR-MISS line in ${r.text}`);
	}
	if (posix) {
		const fx = newFixture("m25-symlink");
		const target = addSymlinkEscape(fx);
		const r = await run(fx, "t.mjs", table(fx, [{ n: "1", name: "edit escapes by a symlink", edits: [one("pkg/lib/escape-link.txt", "ORIGINAL-OUTSIDE", "CHANGED")], tests: [T1], expectRed: [] }]), { [CFG.ENV_NAMES.OUT]: outFile(fx, "r.txt"), [CFG.ENV_NAMES.SHARDS]: "1" });
		if (r.result !== CFG.EXIT_TABLE_FAULT) reasons.push(`symlink: exit ${r.result}`);
		if (!/^ANCHOR-MISS 1 .*escape-link\.txt.*outside/m.test(r.text)) reasons.push(`symlink: no ANCHOR-MISS line in ${r.text}`);
		if (fs.readFileSync(target, "utf8") !== "ORIGINAL-OUTSIDE") reasons.push("symlink: the outside target was written");
	}
	{
		const fx = newFixture("m25-testescape");
		const r = await run(fx, "t.mjs", table(fx, [{ n: "1", name: "test path escapes", edits: [], tests: [path.posix.join("..", "outside.test.mjs")], expectRed: [] }]), { [CFG.ENV_NAMES.OUT]: outFile(fx, "r.txt"), [CFG.ENV_NAMES.SHARDS]: "1" });
		if (r.result === 0) reasons.push("test-escape: exit was 0");
		if (!/outside\.test\.mjs/.test(r.text) || !/outside the scratch worktree/.test(r.text)) reasons.push(`test-escape: no containment refusal in ${r.text}`);
		if (PAIR_LINE_RE.test(r.text)) reasons.push(`test-escape: a pair was judged: ${r.text}`);
	}
	// req: R-1235 R-1236
	check("mutation runner: an edit path that leaves the scratch worktree, by .. or through a symbolic link, is ANCHOR-MISS naming it, a test path that leaves it ends the shard with exit 2 naming it, and nothing outside the worktree is written or run", reasons.length === 0, reasons.join("; "));
}

// ── R-1238: shard count (pure) ───────────────────────────────────────────────────────────────────
{
	const base = { SHARDS_DEFAULT: 5 };
	const eight = Array.from({ length: 8 }, (_, i) => ({ n: String(i + 1) }));
	const three = Array.from({ length: 3 }, (_, i) => ({ n: String(i + 1) }));
	const ok = safely(() => shardCount({}, eight, base), -1) === 5
		&& safely(() => shardCount({ [CFG.ENV_NAMES.SHARDS]: "2" }, eight, base), -1) === 2
		&& safely(() => shardCount({ [CFG.ENV_NAMES.SHARDS]: "10" }, three, base), -1) === 3
		&& safely(() => shardCount({ [CFG.ENV_NAMES.SHARD]: "1/5" }, eight, base), -1) === 1;
	// req: R-1238
	check("mutation runner: the shard count is SEAT_MUTATE_SHARDS, else the configured default, and never more than the selected pair count", ok);
}

// ── R-1230 R-1231 R-1232 R-1233 R-1234 R-1235 R-1236 R-1238 R-1239 R-1240 R-1241 R-1243 R-1244: sealed config ──
{
	const reasons = [];
	const names = CFG.ENV_NAMES;
	for (const [k, v] of Object.entries({ OUT: "SEAT_MUTATE_OUT", TIP: "SEAT_MUTATE_TIP", DRY: "SEAT_MUTATE_DRY", KEEP: "SEAT_MUTATE_KEEP", LOGDIR: "SEAT_MUTATE_LOGDIR", SHARDS: "SEAT_MUTATE_SHARDS", STAGGER_SECS: "SEAT_MUTATE_STAGGER_SECS", SHARD: "SEAT_MUTATE_SHARD", TALLY: "SEAT_MUTATE_TALLY", SCRATCH: "SEAT_MUTATE_SCRATCH", TIP_COMMIT: "SEAT_MUTATE_TIP_COMMIT", TABLE_HASH: "SEAT_MUTATE_TABLE_HASH" })) {
		if (names[k] !== v) reasons.push(`ENV_NAMES.${k} is ${names[k]}`);
	}
	if (CFG.EXIT_REFUSED !== 2) reasons.push(`EXIT_REFUSED ${CFG.EXIT_REFUSED}`);
	if (CFG.EXIT_TABLE_FAULT !== 3) reasons.push(`EXIT_TABLE_FAULT ${CFG.EXIT_TABLE_FAULT}`);
	if (JSON.stringify(CFG.CHILD_NODE_ARGS) !== JSON.stringify(["--experimental-strip-types"])) reasons.push(`CHILD_NODE_ARGS ${CFG.CHILD_NODE_ARGS}`);
	if (CFG.DRAIN_MS !== 2000) reasons.push(`DRAIN_MS ${CFG.DRAIN_MS}`);
	if (JSON.stringify(CFG.TASKKILL_ARGS) !== JSON.stringify(["/T", "/F", "/PID"])) reasons.push(`TASKKILL_ARGS ${CFG.TASKKILL_ARGS}`);
	if (JSON.stringify(CFG.TS_CHECK_ARGS) !== JSON.stringify(["--no-warnings", "--experimental-vm-modules", "scripts/ts-syntax-check.mjs"])) reasons.push(`TS_CHECK_ARGS ${CFG.TS_CHECK_ARGS}`);
	if (JSON.stringify(CFG.NPM_KEYS) !== JSON.stringify(["prefix", "globalconfig", "userconfig"])) reasons.push(`NPM_KEYS ${CFG.NPM_KEYS}`);
	if (JSON.stringify(CFG.OVERRIDABLE) !== JSON.stringify(["SHARDS_DEFAULT", "STAGGER_SECS_DEFAULT", "FILE_TIMEOUT_MS", "BASELINE_RETRIES", "NPM_COMMAND"])) reasons.push(`OVERRIDABLE ${CFG.OVERRIDABLE}`);

	const src = fs.readFileSync(path.join(REPO, "packages", "nana-pack", "lib", "mutation-runner-config.mjs"), "utf8").split("\n");
	const exported = [];
	src.forEach((line, i) => { const m = /^export (?:const|function) (\w+)/.exec(line); if (m) exported.push({ name: m[1], line: i }); });
	for (const { name, line } of exported) {
		const nearby = src.slice(Math.max(0, line - 6), line).join("\n");
		if (!/chosen|contract/i.test(nearby)) reasons.push(`${name} has no provenance comment nearby`);
	}
	if (exported.length < 15) reasons.push(`only ${exported.length} exports found — scan regressed`);

	// req: R-1230 R-1231 R-1232 R-1233 R-1234 R-1235 R-1236 R-1238 R-1239 R-1240 R-1241 R-1243 R-1244
	check("mutation runner: sealed values: the option names, exits 2 and 3, the child's node argument, the drain, the taskkill arguments, the .ts checker command, the npm keys and the overridable tunables, and every config value has its provenance beside it", reasons.length === 0, reasons.join("; "));
}

// ── R-1238: round-robin dealing, concurrency and stagger ────────────────────────────────────────
{
	const fx = newFixture("m15");
	const pairs = [
		{ n: "1", name: "rendezvous with 2", edits: [...probeKeyEdit("p1", "p2"), probeModeEdit("rendezvous")], tests: [T2], expectRed: [] },
		{ n: "2", name: "rendezvous with 1", edits: [...probeKeyEdit("p2", "p1"), probeModeEdit("rendezvous")], tests: [T2], expectRed: [] },
		{ n: "3", name: "shares shard 1's worktree", edits: [...probeKeyEdit("p3", "")], tests: [T2], expectRed: [] },
	];
	const t0 = Date.now();
	const staggerMs = 300;
	const r = await run(fx, "t.mjs", table(fx, pairs), { [CFG.ENV_NAMES.OUT]: outFile(fx, "r.txt"), [CFG.ENV_NAMES.SHARDS]: "2", [CFG.ENV_NAMES.STAGGER_SECS]: String(staggerMs / 1000) });
	const wt1 = readMark(fx, "wt-p1");
	const wt2 = readMark(fx, "wt-p2");
	const wt3 = readMark(fx, "wt-p3");
	const headerTimes = [...r.text.matchAll(/shard (\d+)\/(\d+)[^\n]*?, (\d{4}-\d{2}-\d{2}T[\d:.]+Z)/g)].reduce((m, x) => (m.set(x[1], new Date(x[3]).getTime()), m), new Map());
	const gap = headerTimes.has("2") && headerTimes.has("1") ? headerTimes.get("2") - headerTimes.get("1") : -1;
	const ok = r.result === 0
		&& wt1 && wt3 && wt1 === wt3
		&& wt2 && wt2 !== wt1
		&& /^GREEN 1 /m.test(readOut(fx, "r.txt")) && /^GREEN 2 /m.test(readOut(fx, "r.txt"))
		&& gap >= staggerMs / 2;
	// req: R-1238
	check("mutation runner: at two shards started a stagger apart, pairs dealt round-robin run at the same time in different scratch worktrees", ok, JSON.stringify({ wt1, wt2, wt3, gap, t0: t0 - t0 }));
}

// ── R-1239: the record ───────────────────────────────────────────────────────────────────────────
{
	const reasons = [];
	for (const shards of [1, 3]) {
		const fx = newFixture(`m17-${shards}`);
		const pairs = Array.from({ length: 4 }, (_, i) => ({ n: String(i + 1), name: `pair ${i + 1}`, edits: [], tests: [T1], expectRed: [] }));
		const r = await run(fx, "t.mjs", table(fx, pairs, { declared: ["(a) a declared reading"] }), { [CFG.ENV_NAMES.OUT]: outFile(fx, "r.txt"), [CFG.ENV_NAMES.SHARDS]: String(shards), [CFG.ENV_NAMES.STAGGER_SECS]: "0" });
		const rec = readOut(fx, "r.txt");
		if (!/^seat-mutate: lane fixture, tip \S+, table \S+/m.test(rec)) reasons.push(`shards=${shards}: no header: ${rec.slice(0, 80)}`);
		if (!rec.includes("DECLARED (a) a declared reading")) reasons.push(`shards=${shards}: no DECLARED line`);
		const ids = [...rec.matchAll(/^(?:RED|GREEN) (\d+) /gm)].map((m) => m[1]);
		if (ids.join(",") !== "1,2,3,4") reasons.push(`shards=${shards}: pair order ${ids.join(",")}`);
		const resultLines = rec.split("\n").filter((l) => l.startsWith("RESULT"));
		if (resultLines.length !== 1) reasons.push(`shards=${shards}: ${resultLines.length} RESULT lines`);
		if (r.result !== 0) reasons.push(`shards=${shards}: exit ${r.result}`);
	}
	// req: R-1239
	check("mutation runner: the record holds the header, the DECLARED lines, each selected pair's line once in table order at one shard and at three, and one RESULT line summed over the shards", reasons.length === 0, reasons.join("; "));
}

{
	const reasons = [];
	for (const shards of [1, 2]) {
		const fx = newFixture(`m18-${shards}`);
		const pairs = [
			{ n: "1", name: "selfkill", edits: [...probeKeyEdit("dead18"), probeModeEdit("selfkill")], tests: [T2], expectRed: [] },
			{ n: "2", name: "fine", edits: [], tests: [T1], expectRed: [] },
		];
		const r = await run(fx, "t.mjs", table(fx, pairs), { [CFG.ENV_NAMES.OUT]: outFile(fx, "r.txt"), [CFG.ENV_NAMES.SHARDS]: String(shards), [CFG.ENV_NAMES.STAGGER_SECS]: "0" });
		const rec = readOut(fx, "r.txt");
		if (!/^MISSING 1 /m.test(rec)) reasons.push(`shards=${shards}: pair 1 not MISSING: ${rec}`);
		if (rec.split("\n").filter((l) => l.startsWith("RESULT")).length !== 1) reasons.push(`shards=${shards}: not exactly one RESULT line`);
		if (r.result === 0) reasons.push(`shards=${shards}: exit was 0`);
	}
	// req: R-1239
	check("mutation runner: at one shard and at two, a pair whose shard dies before printing it is a MISSING line, the record still ends with one RESULT line, and the run exits 2", reasons.length === 0, reasons.join("; "));
}

// ── R-1240: refusals before any worktree ────────────────────────────────────────────────────────
{
	const reasons = [];
	const basePairs = [{ n: "1", name: "a", edits: [], tests: [T1], expectRed: [] }, { n: "2", name: "b", edits: [], tests: [T1], expectRed: [] }];
	const noWorktree = (fx) => sh("git", ["-C", fx.root, "worktree", "list"]).stdout.trim().split("\n").length === 1;
	const sub = async (label, pairsOrEnvFn, envExtra = {}) => {
		const fx = newFixture(`m19-${label}`);
		const pairs = typeof pairsOrEnvFn === "function" ? pairsOrEnvFn(basePairs) : pairsOrEnvFn;
		const selfUrl = writeTable(fx, "t.mjs", table(fx, pairs));
		const argv = envExtra.__argv ?? [];
		const savedArgv = process.argv;
		process.argv = [savedArgv[0], savedArgv[1], ...argv];
		const r = await withTmp(fx.runTmp, () => withEnv(envExtra, () => captured(() => runMutations({ ...table(fx, pairs), self: selfUrl }))));
		process.argv = savedArgv;
		if (r.result !== CFG.EXIT_REFUSED) reasons.push(`${label}: exit ${r.result}`);
		if (!noWorktree(fx)) reasons.push(`${label}: a worktree was created`);
		return r;
	};
	await sub("unknown-id", basePairs, { __argv: ["no-such-id"] });
	await sub("repeated-id", [basePairs[0], { ...basePairs[0] }]);
	await sub("blank-id", [{ ...basePairs[0], n: "" }, basePairs[1]]);
	await sub("whitespace-id", [{ ...basePairs[0], n: "1 2" }, basePairs[1]]);
	await sub("bad-shards", basePairs, { [CFG.ENV_NAMES.SHARDS]: "0" });
	await sub("bad-stagger", basePairs, { [CFG.ENV_NAMES.STAGGER_SECS]: "-1" });
	{
		const fx = newFixture("m19-bad-tip");
		const r = await run(fx, "t.mjs", table(fx, basePairs, { tip: "no-such-tip-ref" }), {});
		if (r.result !== CFG.EXIT_REFUSED) reasons.push(`bad-tip: exit ${r.result}`);
		if (!noWorktree(fx)) reasons.push("bad-tip: a worktree was created");
	}
	// req: R-1240
	check("mutation runner: an unknown pair id, a repeated or blank table id, an id with white space, a bad shard count or stagger and a tip that names no commit each refuse with exit 2, naming it, before any worktree is created", reasons.length === 0, reasons.join("; "));
}

// ── R-1241: dry option and log naming ───────────────────────────────────────────────────────────
{
	const fx = newFixture("m21");
	const pairs = [
		{ n: "1", name: "good", edits: [one("pkg/lib/a.mjs", 'return "A-ORIGINAL";', 'return "A-MUTATED";')], tests: [T1], expectRed: [] },
		{ n: "2", name: "broken mjs", edits: [one("pkg/lib/a.mjs", 'return "A-ORIGINAL";', 'return "A-ORIGINAL" that is not valid js (')], tests: [T1], expectRed: [] },
	];
	const r = await run(fx, "t.mjs", table(fx, pairs), { [CFG.ENV_NAMES.OUT]: outFile(fx, "r.txt"), [CFG.ENV_NAMES.SHARDS]: "1", [CFG.ENV_NAMES.DRY]: "1" });
	const rec = readOut(fx, "r.txt");
	const ok = r.result === CFG.EXIT_TABLE_FAULT
		&& /^DRY ok 1 /m.test(rec)
		&& /^SYNTAX 2 /m.test(rec)
		&& !/^RED |^GREEN |^BASELINE/m.test(rec);
	// req: R-1241
	check("mutation runner: the dry option applies and syntax-checks every selected pair, prints DRY ok for each pair that applies, and runs no test file", ok, rec);
}

{
	const reasons = [];
	{
		const fx = newFixture("m22-tip");
		const r = await run(fx, "t.mjs", table(fx, [{ n: "1", name: "good", edits: [], tests: [T1], expectRed: [] }], { tip: "no-such-ref-at-all" }), { [CFG.ENV_NAMES.OUT]: outFile(fx, "r.txt"), [CFG.ENV_NAMES.TIP]: "main", [CFG.ENV_NAMES.SHARDS]: "1" });
		if (r.result !== 0) reasons.push(`tip override: exit ${r.result}: ${r.text}`);
		if (!fs.existsSync(outFile(fx, "r.txt"))) reasons.push("tip override: SEAT_MUTATE_OUT did not name the record file");
	}
	{
		const fx = newFixture("m22-log", "flaky-once");
		const logdir = outFile(fx, "logs");
		const pairs = [{ n: "a/b", name: "slash id", edits: [], tests: [T2], expectRed: [] }];
		await run(fx, "t.mjs", table(fx, pairs), { [CFG.ENV_NAMES.OUT]: outFile(fx, "r.txt"), [CFG.ENV_NAMES.SHARDS]: "1", [CFG.ENV_NAMES.LOGDIR]: logdir });
		const entries = fs.existsSync(logdir) ? fs.readdirSync(logdir) : [];
		const baselineLogs = entries.filter((e) => e.startsWith("baseline-"));
		if (baselineLogs.length !== 1) reasons.push(`log: expected exactly one baseline log, got ${JSON.stringify(entries)}`);
		if (baselineLogs.length === 1 && !/FAIL/.test(fs.readFileSync(path.join(logdir, baselineLogs[0]), "utf8"))) reasons.push("log: baseline log does not hold the FAIL line");
		if (baselineLogs.some((e) => e.includes("retry"))) reasons.push(`log: the green retry was logged too: ${baselineLogs}`);
		const expectedPairLog = CFG.logName("a/b", "probe.test.mjs");
		if (!entries.includes(expectedPairLog)) reasons.push(`log: missing pair log ${expectedPairLog} among ${JSON.stringify(entries)}`);
	}
	// req: R-1230 R-1239 R-1241
	check("mutation runner: SEAT_MUTATE_OUT names the record file, SEAT_MUTATE_TIP overrides the table's tip, and a log folder holds each red baseline run's output and each pair's output per test file named by its id with / turned into -, then --, then the file's name", reasons.length === 0, reasons.join("; "));
}

// ── R-1242: the record lock ──────────────────────────────────────────────────────────────────────
{
	const reasons = [];
	{
		const fx = newFixture("m23-contend");
		const out = outFile(fx, "r.txt");
		const pairs = [{ n: "1", name: "holds the lock", edits: [...probeKeyEdit("lock1"), probeModeEdit("rendezvous-lock")], tests: [T2], expectRed: [] }];
		const run1 = run(fx, "t1.mjs", table(fx, pairs), { [CFG.ENV_NAMES.OUT]: out, [CFG.ENV_NAMES.SHARDS]: "1" });
		const held = await waitUntil(() => fs.existsSync(path.join(fx.marks, "lockheld-lock1")), 4000);
		if (!held) reasons.push("contend: run1 never reached its rendezvous");
		const run2 = await run(fx, "t2.mjs", table(fx, [{ n: "1", name: "refused", edits: [], tests: [T1], expectRed: [] }]), { [CFG.ENV_NAMES.OUT]: out, [CFG.ENV_NAMES.SHARDS]: "1" });
		if (run2.result !== CFG.EXIT_REFUSED) reasons.push(`contend: second run exit ${run2.result}`);
		if (!/refusing a second run/.test(run2.text)) reasons.push(`contend: no refusal line: ${run2.text}`);
		fs.writeFileSync(path.join(fx.marks, "release-lock1"), "1");
		const run1Result = await run1;
		if (run1Result.result !== 0) reasons.push(`contend: run1 exit ${run1Result.result}`);
		if (!/^GREEN 1 /m.test(readOut(fx, "r.txt"))) reasons.push(`contend: run1's record incomplete: ${readOut(fx, "r.txt")}`);
		if (fs.existsSync(`${out}${CFG.LOCK_SUFFIX}`)) reasons.push("contend: the lock file is still there");
	}
	{
		const fx = newFixture("m23-stale");
		const out = outFile(fx, "r.txt");
		const dead = spawnSync(process.execPath, ["-e", "process.exit(0)"]);
		fs.writeFileSync(`${out}${CFG.LOCK_SUFFIX}`, JSON.stringify({ pid: dead.pid, started: new Date().toISOString() }), { flag: "wx" });
		const r = await run(fx, "t.mjs", table(fx, [{ n: "1", name: "ok", edits: [], tests: [T1], expectRed: [] }]), { [CFG.ENV_NAMES.OUT]: out, [CFG.ENV_NAMES.SHARDS]: "1" });
		if (!/stale lock reported and replaced/.test(r.text)) reasons.push(`stale: no report line: ${r.text}`);
		if (r.result !== 0) reasons.push(`stale: exit ${r.result}`);
	}
	// req: R-1242
	check("mutation runner: a second run given the same record file is refused with exit 2, naming it, before it creates any worktree, the first run's record is whole and its lock gone when it ends, and a lock left by a process that no longer runs is reported and replaced", reasons.length === 0, reasons.join("; "));
}

// ── R-1243: tip and table identity ──────────────────────────────────────────────────────────────
function writeShardAwareTable(fx, name, testRel) {
	const lines = [
		importLine("{ runMutations }", pathToFileURL(RUNNER_LIB).href),
		"const isShard = Boolean(process.env.SEAT_MUTATE_SHARD);",
		`const testRel = ${JSON.stringify(testRel)};`,
		"const pairs = [",
		'  { n: "1", name: "p1", edits: [], tests: [testRel], expectRed: [] },',
		'  { n: "2", name: isShard ? "p2-shard" : "p2-parent", edits: [], tests: [testRel], expectRed: [] },',
		"];",
		'const table = { lane: "fixture", self: import.meta.url, tip: "main", pairs, declared: [] };',
		"process.exitCode = await runMutations(table);",
		"",
	];
	const file = path.join(fx.root, name);
	fs.writeFileSync(file, lines.join("\n"));
	return pathToFileURL(file).href;
}

{
	const fx = newFixture("m24");
	const selfUrl = writeShardAwareTable(fx, "t.mjs", T1);
	const parentDef = { lane: "fixture", tip: "main", declared: [], pairs: [
		{ n: "1", name: "p1", edits: [], tests: [T1], expectRed: [] },
		{ n: "2", name: "p2-parent", edits: [], tests: [T1], expectRed: [] },
	] };
	const r = await withTmp(fx.runTmp, () => withEnv({ [CFG.ENV_NAMES.OUT]: outFile(fx, "r.txt"), [CFG.ENV_NAMES.SHARDS]: "2", [CFG.ENV_NAMES.STAGGER_SECS]: "0" }, () => captured(() => runMutations({ ...parentDef, self: selfUrl }))));
	const ok = r.result === CFG.EXIT_REFUSED
		&& /^MISSING 1 /m.test(readOut(fx, "r.txt"))
		&& /^MISSING 2 /m.test(readOut(fx, "r.txt"))
		&& /differs from the parent's/.test(r.text);
	// req: R-1243
	check("mutation runner: the record's header names the tip's commit and the pair table's hash, and a shard whose table or tip differs from the parent's refuses before creating its worktree, naming both values, so its pairs read MISSING and the run exits 2", ok, JSON.stringify({ exitCode: r.result, rec: readOut(fx, "r.txt"), text: r.text }));
}

// ── R-1244: config merge and allowlist ──────────────────────────────────────────────────────────
{
	const reasons = [];
	{
		const fx = newFixture("m26-merge", "flaky-once");
		const r = await run(fx, "t.mjs", table(fx, [{ n: "1", name: "ok", edits: [], tests: [T2], expectRed: [] }], { config: { STAGGER_SECS_DEFAULT: 0.01 } }), { [CFG.ENV_NAMES.OUT]: outFile(fx, "r.txt"), [CFG.ENV_NAMES.SHARDS]: "1" });
		if (r.result !== 0) reasons.push(`merge: exit ${r.result}: ${r.text}`);
		if (!/BASELINE RETRY ok\s/.test(r.text)) reasons.push(`merge: BASELINE_RETRIES was not left at its module default: ${r.text}`);
	}
	{
		const fx = newFixture("m26-bad-key");
		const r = await run(fx, "t.mjs", table(fx, [{ n: "1", name: "ok", edits: [], tests: [T1], expectRed: [] }], { config: { DRAIN_MS: 1 } }), { [CFG.ENV_NAMES.OUT]: outFile(fx, "r.txt"), [CFG.ENV_NAMES.SHARDS]: "1" });
		if (r.result !== CFG.EXIT_REFUSED) reasons.push(`bad-key: exit ${r.result}`);
		if (!/DRAIN_MS/.test(r.text)) reasons.push(`bad-key: key not named: ${r.text}`);
		if (sh("git", ["-C", fx.root, "worktree", "list"]).stdout.trim().split("\n").length !== 1) reasons.push("bad-key: a worktree was created");
	}
	// req: R-1244
	check("mutation runner: a table config that names one overridable tunable changes only that one, and a config key outside the overridable tunables is refused with exit 2, naming it, before any worktree is created", reasons.length === 0, reasons.join("; "));
}

process.exitCode = fails ? 1 : 0;

