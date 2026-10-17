#!/usr/bin/env node
// Seat mutation runner for lane mutate-runner (CHANGE.md §5.3 "Wrong code first": 43 pairs, numbered 1 to 43, as the
// table and seat revision 5's appended rows 36-43 leave them; pairs 34-35 came with seat revision 4). Each pair edits
// packages/nana-pack/lib/mutation-runner.mjs or lib/mutation-runner-config.mjs — the shared runner this lane adds —
// never an assertion. The plan says the seat judges that runner with its OWN old-form runner, never the new shared
// one (S7), so this file is a copy of the landed docs/reviews/roster-notice-2026-10-16/seat-mutate.mjs with three
// edits (CHANGE.md §5.4 item 1): it finds its own repository from this file's path instead of a hardcoded one, it
// names this lane, its branch and the d594894 tip, and this header names the copy it came from. Its runner plumbing
// (scratch worktrees, syntax check, baseline, judging, sharding, the record, the dry option) is otherwise unchanged.
//
// For each pair: apply the wrong code (never a test assertion) in a detached scratch worktree of the lane tip,
// refuse when an anchor does not occur the stated number of times (ANCHOR-MISS = runner bug), syntax-check every
// mutated module (a .ts one with type stripping), run the named test files with node exactly as scripts/test.mjs
// does (package-dir cwd, fresh HOME/USERPROFILE/TMPDIR/TEMP/TMP, NANA_* but NANA_TEST_* and
// PI_CODING_AGENT_DIR scrubbed, gc.auto=0 through GIT_CONFIG_*, --experimental-strip-types, and the npm_config_prefix/globalconfig/userconfig
// that `npm test` exports when the runner itself was not started through npm), and print RED / GREEN (SURVIVED). A RED
// line also lists every named title that stayed GREEN and every UNNAMED red, so "reds exactly the titles named" is
// judged, not assumed.
//
// Pair ids are §5.3's row numbers, "1" to "43"; each row is one pair, its edits applied together.
//
// Seat readings (declared before the run; each prints as a DECLARED line, never hidden): see DECLARED.
//
// Split: SEAT_MUTATE_SHARDS=N (default 5) runs the selected pairs as N parallel child runs of this script: pair ids are
// dealt round-robin in table order, child k starts (k-1) × SEAT_MUTATE_STAGGER_SECS (default 4) seconds after the
// first, and each child has its own scratch worktree and writes its own part file. The parent then writes one merged
// output: its header, the DECLARED lines once, each shard's own lines (header, BASELINE, notes, its RESULT) prefixed
// [k/N], every pair line in table order, and one overall RESULT line summed from the shards' tallies. A selected pair
// that no shard printed reads MISSING. SEAT_MUTATE_SHARDS=1 runs every pair in this process.
//
// Never touches the lane worktree or the main checkout: each run (each shard) applies its pairs in one detached scratch
// worktree in a mkdtemp folder under os.tmpdir() (never inside the lane folder; copier-based suite tests break in a
// nested worktree), removed at the end (SEAT_MUTATE_KEEP=1 keeps it for inspection); git writes only its worktree
// metadata into the shared .git.
// SEAT_MUTATE_DRY=1 applies and syntax-checks every pair's edits and runs no test (an anchor check).
// Usage: SEAT_MUTATE_OUT=<file> [SEAT_MUTATE_TIP=<rev>] [SEAT_MUTATE_DRY=1] [SEAT_MUTATE_SHARDS=N]
//        [SEAT_MUTATE_STAGGER_SECS=S] [SEAT_MUTATE_LOGDIR=<dir>] [SEAT_MUTATE_KEEP=1] node seat-mutate.mjs [pair-id ...]
// Part files: <SEAT_MUTATE_OUT>.part<k>of<N> and its tally <…>.json, kept beside the merged output; without
// SEAT_MUTATE_OUT they go to a mkdtemp folder under os.tmpdir(), named on the last line.
import { spawnSync, spawn } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as readline from "node:readline";
import { fileURLToPath } from "node:url";

const SCRIPT = fileURLToPath(import.meta.url);
const HERE = path.dirname(SCRIPT);
// This lane's own repository, found from this file's own path (CHANGE.md §5.4 item 1: "it finds its repository from
// its own path instead of `:41`") — never a hardcoded checkout path, so this file names no owner's home folder.
const LANE_REPO = (() => {
	const r = spawnSync("git", ["-C", HERE, "rev-parse", "--show-toplevel"], { encoding: "utf8" });
	if (r.status !== 0) { console.error(`seat-mutate: ${HERE} is not inside a git repository`); process.exit(2); }
	return r.stdout.trim();
})();
const LANE_BRANCH = "feat/mutate-runner";
const TIP = process.env.SEAT_MUTATE_TIP || "d594894";
const KEEP = process.env.SEAT_MUTATE_KEEP === "1";
const DRY = process.env.SEAT_MUTATE_DRY === "1";
const LOGDIR = process.env.SEAT_MUTATE_LOGDIR || null; // per-pair test output, for evidence
if (LOGDIR) fs.mkdirSync(LOGDIR, { recursive: true });
// chosen: the regroup runner's per-file bound.
const TIMEOUT_MS = 10 * 60 * 1000;
// "k/N" on a shard child only (set by the parent); a child never splits again.
const SHARD = process.env.SEAT_MUTATE_SHARD || null;
// chosen (seat, 2026-10-16): five shards by default; at most two lanes run on this machine, and five test processes
// at once is the load the seat asked for.
const SHARDS_DEFAULT = "5";
// chosen: a few seconds between shard starts, so five `git worktree add` calls and five first test files do not all
// begin in the same second.
const STAGGER_SECS_DEFAULT = "4";

const DECLARED = [
	"(a) pair ids are §5.3's row numbers 1-43, one pair per row, each row's edits applied together; pairs 34 and 35 came with seat revision 4 (slim) and 36 to 43 with seat revision 5, each appended at the end, so no earlier number moves (CHANGE.md §5.3).",
	"(b) test set: every pair runs only packages/nana-pack/tests/mutation-runner.test.mjs; every edit touches packages/nana-pack/lib/mutation-runner.mjs or lib/mutation-runner-config.mjs, never an assertion (CHANGE.md §5.3).",
	"(c) pair 11 (no taskkill on win32) reds M7 only on Windows: killPid already calls process.kill on POSIX, so dropping the win32 taskkill branch is a no-op on this seat's platform; the pair is kept, applied and syntax-checked here like every other pair, but judged on no title on this leg, per CHANGE.md §5.3's own note that pair 11 can red only on Windows, where no runner runs mutation pairs.",
	"(d) label forms the code shape forces: pair 35's wording (\"one shard runs in the parent's own process\") does not fit this runner, where the parent never judges a pair itself, one shard included (R-1230's S16); the edit instead makes the shard append each line to its part file as it logs, rather than writing it once at the end — the closest reachable form of \"appends the record line by line\", reading M18 the same way. Pair 41's test-path containment check is read off the baseline loop's own guard, not the per-pair run loop's, matching §5.3's recount, which groups pair 41 under \"baseline\".",
];

// ── test file ───────────────────────────────────────────────────────────────────────────────
const TEST = "packages/nana-pack/tests/mutation-runner.test.mjs";

// ── mutated files ───────────────────────────────────────────────────────────────────────────
const LIB = "packages/nana-pack/lib/mutation-runner.mjs";
const CFG = "packages/nana-pack/lib/mutation-runner-config.mjs";

// ── titles (exact, as the suite prints them; seat-titles.mjs and the test file at d594894) ───
const M1 = "mutation runner: a pair's edit lands only in a scratch worktree under the temp folder with the lane repository's git hooks not run, the source checkout stays unchanged, and the next pair in that worktree sees neither the edit nor an untracked or ignored file the test left";
const M2 = "mutation runner: a scratch path that is not its own git root is refused before any reset or clean, and an untracked file in the repository around it survives";
const M3 = "mutation runner: after a run at one shard and at three, and after one whose shard is killed outright, no running test file, scratch folder or git worktree entry is left, and with SEAT_MUTATE_KEEP=1 every scratch worktree is left and its path printed";
const M4 = "mutation runner: SIGTERM during a two-shard run kills every running test file's process tree, leaves no scratch worktree and exits non-zero";
const M5 = "mutation runner: each test file runs as node --experimental-strip-types from its package folder with its own fresh HOME, USERPROFILE, TMPDIR, TEMP and TMP, no ambient NANA_ or SEAT_MUTATE_ variable or PI_CODING_AGENT_DIR, its NANA_TEST_ variables, and gc.auto 0 after the caller's GIT_CONFIG entries";
const M6 = "mutation runner: npm's prefix, global config and user config fill only values the caller lacks, the prefix fills a missing global prefix, and an npm that cannot start prints one line naming each value not read";
const M7 = "mutation runner: a test file past its time limit has its whole process tree killed and is reported timed out";
const M8 = "mutation runner: a child that a test file leaves running after a normal exit is gone when the file's result returns";
const M9 = "mutation runner: after a test file exits, a descendant holding its output delays the result by at most the drain";
const M10 = "mutation runner: an anchor that occurs twice or not at all, or an edit file that does not exist, is ANCHOR-MISS naming the file, runs no test file, and the run exits 3";
const M11 = "mutation runner: an edit that breaks a .mjs module, or a .ts module a test reaches only through a spawned child, is SYNTAX before any test file runs, a valid .ts edit is not, and the run exits 3";
const M12 = "mutation runner: a baseline file red once runs again and the run goes on, while one red on every attempt, or a named title with no matching baseline PASS line, ends the shard with exit 2 before any pair is judged, naming it";
const M13 = "mutation runner judge: with LF or CRLF output, detail after titles and a title given as a pattern, a pair that reds its named title is RED naming it, and a pair with no failing title is GREEN (SURVIVED)";
const M14 = "mutation runner judge: a RED line lists a named title that stayed green, one not reached, an unnamed failing title, a crashed file and a timed-out file, and leaves a declared also-red title out of the unnamed list";
const M15 = "mutation runner: at two shards started a stagger apart, pairs dealt round-robin run at the same time in different scratch worktrees";
const M16 = "mutation runner: the shard count is SEAT_MUTATE_SHARDS, else the configured default, and never more than the selected pair count";
const M17 = "mutation runner: the record holds the header, the DECLARED lines, each selected pair's line once in table order at one shard and at three, and one RESULT line summed over the shards";
const M18 = "mutation runner: at one shard and at two, a pair whose shard dies before printing it is a MISSING line, the record still ends with one RESULT line, and the run exits 2";
const M19 = "mutation runner: an unknown pair id, a repeated or blank table id, an id with white space, a bad shard count or stagger and a tip that names no commit each refuse with exit 2, naming it, before any worktree is created";
const M20 = "mutation runner: sealed values: the option names, exits 2 and 3, the child's node argument, the drain, the taskkill arguments, the .ts checker command, the npm keys and the overridable tunables, and every config value has its provenance beside it";
const M21 = "mutation runner: the dry option applies and syntax-checks every selected pair, prints DRY ok for each pair that applies, and runs no test file";
const M22 = "mutation runner: SEAT_MUTATE_OUT names the record file, SEAT_MUTATE_TIP overrides the table's tip, and a log folder holds each red baseline run's output and each pair's output per test file named by its id with / turned into -, then --, then the file's name";
const M23 = "mutation runner: a second run given the same record file is refused with exit 2, naming it, before it creates any worktree, the first run's record is whole and its lock gone when it ends, and a lock left by a process that no longer runs is reported and replaced";
const M24 = "mutation runner: the record's header names the tip's commit and the pair table's hash, and a shard whose table or tip differs from the parent's refuses before creating its worktree, naming both values, so its pairs read MISSING and the run exits 2";
const M25 = "mutation runner: an edit path that leaves the scratch worktree, by .. or through a symbolic link, is ANCHOR-MISS naming it, a test path that leaves it ends the shard with exit 2 naming it, and nothing outside the worktree is written or run";
const M26 = "mutation runner: a table config that names one overridable tunable changes only that one, and a config key outside the overridable tunables is refused with exit 2, naming it, before any worktree is created";

// ── edits ───────────────────────────────────────────────────────────────────────────────────
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

// Frozen table. `expectRed` are the checks §5.3's "Reds" column names, macOS leg only (DECLARED c).
const PAIRS = [
	// Scratch and cleanup (R-1230, R-1231): 1-6, 39
	{ n: "1", name: "the scratch folder made beside the lane repository, not under the temp folder", edits: [one(LIB, "const scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), ctx.config.SCRATCH_PREFIX));", "const scratchDir = fs.mkdtempSync(path.join(path.dirname(ctx.repoRoot), ctx.config.SCRATCH_PREFIX));")], tests: [TEST], expectRed: [M1] },
	{ n: "2", name: "no git clean between pairs", edits: [one(LIB, "\tconst r2 = sh(\"git\", [...hooksArg, \"-C\", dir, \"clean\", \"-fdxq\"]);\n\tif (r2.status !== 0) throw new Error(`git clean failed: ${r2.stderr}`);\n", "")], tests: [TEST], expectRed: [M1] },
	{ n: "3", name: "git calls without the hooks-off setting", edits: [one(LIB, "const add = sh(\"git\", [\"-c\", `core.hooksPath=${noHooks}`, \"-C\", repoRoot, \"worktree\", \"add\", \"--detach\", wt, tipSha]);", "const add = sh(\"git\", [\"-C\", repoRoot, \"worktree\", \"add\", \"--detach\", wt, tipSha]);")], tests: [TEST], expectRed: [M1] },
	{ n: "4", name: "the own-root check removed before the reset", edits: [one(LIB, "\tif (top.status !== 0 || !realTop || !realDir || realTop !== realDir) {\n\t\tthrow new Error(`scratch worktree is gone or not its own git root: ${(top.stderr || top.stdout || \"\").trim()}`);\n\t}\n", "")], tests: [TEST], expectRed: [M2] },
	{ n: "5", name: "cleanup skips git worktree remove", edits: [one(LIB, "\t\t\ttry { sh(\"git\", [\"-c\", `core.hooksPath=${noHooks}`, \"-C\", repoRoot, \"worktree\", \"remove\", \"--force\", wt]); } catch { /* ignore */ }\n", "")], tests: [TEST], expectRed: [M3, M4] },
	{ n: "6", name: "a shard's signal handler kills no test tree", edits: [one(LIB, "\t\tkillPid(currentPid);\n", "")], tests: [TEST], expectRed: [M4] },
	// One test file's run (R-1232, R-1233, R-1234): 7-13
	{ n: "7", name: "the test file started without --experimental-strip-types", edits: [one(LIB, "[...CHILD_NODE_ARGS, absFile]", "[absFile]")], tests: [TEST], expectRed: [M5] },
	{ n: "8", name: "ambient NANA_ variables kept", edits: [one(LIB, "(/^NANA_/.test(k) && !/^NANA_TEST_/.test(k)) || k === \"PI_CODING_AGENT_DIR\" || /^SEAT_MUTATE_/.test(k)", "k === \"PI_CODING_AGENT_DIR\" || /^SEAT_MUTATE_/.test(k)")], tests: [TEST], expectRed: [M5] },
	{ n: "9", name: "an npm that cannot start skipped with no line (the landed form)", edits: [one(LIB, "else notRead.push(key);", "")], tests: [TEST], expectRed: [M6] },
	{ n: "10", name: "the time limit marks the file timed out but kills nothing", edits: [one(LIB, "{ timedOut = true; killPid(child.pid); }", "{ timedOut = true; }")], tests: [TEST], expectRed: [M7] },
	// Pair 11 is a no-op on darwin (DECLARED c): killPid already calls process.kill(-pid, …) on POSIX, so this edit
	// only changes the win32 branch. Kept, applied and syntax-checked here; reds M7 only on the Windows leg.
	{ n: "11", name: "no taskkill on win32; the POSIX group kill throws there and is caught (the landed form)", edits: [one(LIB, "\t\tif (posix) process.kill(-pid, \"SIGKILL\");\n\t\telse spawnSync(\"taskkill\", [...TASKKILL_ARGS, String(pid)], { stdio: \"ignore\", windowsHide: true });", "\t\tprocess.kill(-pid, \"SIGKILL\");")], tests: [TEST], expectRed: [M7] },
	{ n: "12", name: "no group kill after a normal exit", edits: [one(LIB, "\t\t\tkillPid(child.pid); // R-1234: kill what remains of the group once the result is known\n", "")], tests: [TEST], expectRed: [M8] },
	{ n: "13", name: "the result waits for the output to close, with no drain", edits: [one(LIB, "\t\tchild.on(\"exit\", (code, signal) => {\n\t\t\texitInfo = { code, signal };\n\t\t\tclearTimeout(timeoutTimer);\n\t\t\tdrainTimer = setTimeout(settle, DRAIN_MS); // R-1234: wait for close up to the drain\n\t\t});\n", "\t\tchild.on(\"exit\", (code, signal) => {\n\t\t\texitInfo = { code, signal };\n\t\t\tclearTimeout(timeoutTimer);\n\t\t});\n")], tests: [TEST], expectRed: [M9] },
	// Edits and syntax (R-1235, R-1236): 14-16, 34, 40
	{ n: "14", name: "an anchor counted with includes, not an exact count", edits: [one(LIB, "\t\tconst c = count(text, e.anchor);\n\t\tif (c !== e.times) return { file: e.file, detail: `anchor occurs ${c}× (want ${e.times})` };\n", "\t\tif (!text.includes(e.anchor)) return { file: e.file, detail: `anchor not found (want ${e.times})` };\n")], tests: [TEST], expectRed: [M10] },
	{ n: "15", name: "a mutated .ts file checked with Node's own --experimental-strip-types --check (the landed form)", edits: [one(LIB, "\t\t\tconst checker = path.join(worktreeReal, TS_CHECK_ARGS[2]);\n\t\t\tconst r = sh(process.execPath, [TS_CHECK_ARGS[0], TS_CHECK_ARGS[1], checker, abs]);\n\t\t\tif (r.status !== 0) return { file: f, detail: short(r.stderr || r.stdout, 300) };", "\t\t\tconst r = sh(process.execPath, [\"--experimental-strip-types\", \"--check\", abs]);\n\t\t\tif (r.status !== 0) return { file: f, detail: short(r.stderr || r.stdout, 300) };")], tests: [TEST], expectRed: [M11] },
	{ n: "16", name: "a mutated .mjs file not syntax-checked", edits: [one(LIB, "if (/\\.(mjs|js)$/.test(f)) {", "if (false && /\\.(mjs|js)$/.test(f)) {")], tests: [TEST], expectRed: [M11, M21] },
	// Baseline (R-1236): 17-18, 41
	{ n: "17", name: "no baseline retry", edits: [one(LIB, "for (let attempt = 1; attempt <= 1 + config.BASELINE_RETRIES && !ok; attempt++) {", "for (let attempt = 1; attempt <= 1 && !ok; attempt++) {")], tests: [TEST], expectRed: [M12] },
	{ n: "18", name: "the baseline title check removed", edits: [one(LIB, "\t\t\tfor (const p of pairs) for (const title of [...(p.expectRed ?? []), ...(p.alsoRed ?? [])]) {\n\t\t\t\tif (!p.tests.some((rel) => (basePass[rel] ?? []).some((t) => isTitle(t, title)))) {\n\t\t\t\t\tbaselineOk = false;\n\t\t\t\t\tlog(`BASELINE MISSING title for pair ${p.n}: ${short(titleSource(title), 160)} is not a PASS line in ${p.tests.join(\", \")}`);\n\t\t\t\t}\n\t\t\t}\n", "")], tests: [TEST], expectRed: [M12] },
	// Judging (R-1237): 19-22
	{ n: "19", name: "a pair with no failing title counted RED", edits: [one(LIB, "const verdict = matchedNamed.length || failCount || crashed.length ? \"RED\" : \"GREEN\";", "const verdict = \"RED\";")], tests: [TEST], expectRed: [M13] },
	{ n: "20", name: "a pattern title compared as a string", edits: [one(LIB, "(title instanceof RegExp ? title.test(t) : t === title || t.startsWith(`${title} `))", "(t === title || t.startsWith(`${title} `))")], tests: [TEST], expectRed: [M13] },
	{ n: "21", name: "a declared also-red title listed as unnamed", edits: [one(LIB, "![...judged, ...declared].some((s) => isTitle(t, s))", "![...judged].some((s) => isTitle(t, s))")], tests: [TEST], expectRed: [M14] },
	{ n: "22", name: "a crashed file with no FAIL line counted GREEN", edits: [one(LIB, "const verdict = matchedNamed.length || failCount || crashed.length ? \"RED\" : \"GREEN\";", "const verdict = matchedNamed.length || failCount ? \"RED\" : \"GREEN\";")], tests: [TEST], expectRed: [M14] },
	// Split and record (R-1238, R-1239, R-1243): 23-28, 35, 37-38
	{ n: "23", name: "the parent waits for each shard before starting the next", edits: [one(LIB, "\t\tconst ends = await Promise.all(groups.map((ids, i) => new Promise((resolve) => setTimeout(() => resolve(runShard(i + 1, ids)), i * staggerMs))));\n", "\t\tconst ends = [];\n\t\tfor (let i = 0; i < groups.length; i++) { await new Promise((r) => setTimeout(r, i * staggerMs)); ends.push(await runShard(i + 1, groups[i])); }\n")], tests: [TEST], expectRed: [M4, M15] },
	{ n: "24", name: "the stagger ignored", edits: [one(LIB, "new Promise((resolve) => setTimeout(() => resolve(runShard(i + 1, ids)), i * staggerMs))", "new Promise((resolve) => setTimeout(() => resolve(runShard(i + 1, ids)), 0))")], tests: [TEST], expectRed: [M15] },
	{ n: "25", name: "the shard count not held to the selected pair count", edits: [one(LIB, "return Math.max(1, Math.min(n, selected.length || 1));", "return Math.max(1, n);")], tests: [TEST], expectRed: [M16] },
	{ n: "26", name: "the merged record in shard order, not table order", edits: [one(LIB, "\t\tfor (const p of selected) {\n\t\t\tif (pairLines.has(p.n)) merged.push(pairLines.get(p.n));\n\t\t\telse { missing++; merged.push(`MISSING ${p.n} ${p.name} — shard ${shardOf.get(p.n)}/${n} printed no line for it`); }\n\t\t}\n", "\t\tfor (const pn of groups.flat()) {\n\t\t\tconst p = selected.find((x) => x.n === pn);\n\t\t\tif (pairLines.has(pn)) merged.push(pairLines.get(pn));\n\t\t\telse { missing++; merged.push(`MISSING ${pn} ${p.name} — shard ${shardOf.get(pn)}/${n} printed no line for it`); }\n\t\t}\n")], tests: [TEST], expectRed: [M17] },
	{ n: "27", name: "RESULT sums only the first shard's tally", edits: [one(LIB, "if (t?.tally) { for (const key of Object.keys(total)) total[key] += t.tally[key] ?? 0; survivors.push(...(t.survivors ?? [])); }", "if (t?.tally && end.k === 1) { for (const key of Object.keys(total)) total[key] += t.tally[key] ?? 0; survivors.push(...(t.survivors ?? [])); }")], tests: [TEST], expectRed: [M17] },
	{ n: "28", name: "a pair no shard printed dropped with no MISSING line", edits: [one(LIB, "else { missing++; merged.push(`MISSING ${p.n} ${p.name} — shard ${shardOf.get(p.n)}/${n} printed no line for it`); }", "")], tests: [TEST], expectRed: [M18] },
	// Refusals (R-1240): 29-30
	{ n: "29", name: "unknown pair ids filtered out without a word (the copies' silent filter)", edits: [one(LIB, "\tif (unknown.length) return `unknown pair id ${unknown.join(\", \")} (ids are ${ns.join(\", \")})`;\n", "")], tests: [TEST], expectRed: [M19] },
	{ n: "30", name: "a repeated table id accepted (the landed form)", edits: [one(LIB, "\t\tif (seen.has(n)) return `the table repeats pair id ${JSON.stringify(n)}`;\n", "")], tests: [TEST], expectRed: [M19] },
	// Config and options (R-1241, R-1244): 31-33, 42-43
	{ n: "31", name: "a config value's provenance comment removed", edits: [one(CFG, "// chosen (seat, 2026-10-16), the landed default (seat-mutate.mjs :56): three five-shard records on the\n// 10-core seat machine ran the regroup hand split at five, 8.6 pairs a minute against 2.0 to 3.3 serially\n// (CHANGE.md §1). The claim most likely wrong (CHANGE.md §5.4).\n", "")], tests: [TEST], expectRed: [M20] },
	{ n: "32", name: "the dry option still runs test files", edits: [one(LIB, "\t\t\t\tif (dry) { log(`DRY ok ${p.n} ${p.name} (${diff})`); continue; }\n", "")], tests: [TEST], expectRed: [M21] },
	{ n: "33", name: "SEAT_MUTATE_TIP ignored", edits: [one(LIB, "const tipArg = env[ENV_NAMES.TIP] || table.tip;", "const tipArg = table.tip;")], tests: [TEST], expectRed: [M22] },
	{ n: "42", name: "a red baseline run's output not written to the log folder", edits: [one(LIB, "\t\t\t\t\tif (!ok && logdir) fs.writeFileSync(path.join(logdir, `baseline-${shardTag ? `${shardTag.replace(\"/\", \"of\")}-` : \"\"}${baseName(rel)}${attempt > 1 ? \"-retry\" : \"\"}.log`), res.out);\n", "")], tests: [TEST], expectRed: [M22] },
	{ n: "43", name: "a config key outside the overridable tunables accepted", edits: [one(LIB, "\tconst bad = Object.keys(tableConfig).find((k) => !OVERRIDABLE.includes(k));\n\tif (bad) return { error: `config key '${bad}' is not one of the overridable tunables (${OVERRIDABLE.join(\", \")})` };\n\treturn { value: { ...BASE_CONFIG, ...tableConfig } };", "\treturn { value: { ...BASE_CONFIG, ...tableConfig } };")], tests: [TEST], expectRed: [M26] },
	// The record lock (R-1242): 36
	{ n: "36", name: "no lock: a second run given the same record file runs beside the first (the landed form)", edits: [one(LIB, "\tlet lockPath = null;\n\tif (outFile) {\n\t\tlockPath = outFile + LOCK_SUFFIX;\n\t\tconst lockResult = takeLock(lockPath);\n\t\tif (lockResult.error) { console.error(`seat-mutate: ${lockResult.error}`); return EXIT_REFUSED; }\n\t}\n", "\tconst lockPath = null;\n")], tests: [TEST], expectRed: [M23] },
	// Split and record, continued: 34-35, 37-41 (seat revisions 4 and 5)
	{ n: "34", name: "an edit file read with no guard, so a missing one throws and ends its shard (the landed form)", edits: [one(LIB, "\t\tif (!exists) return { file: e.file, detail: \"does not exist\" };\n\t\tlet text;\n\t\ttry { text = fs.readFileSync(target, \"utf8\"); } catch (err) { return { file: e.file, detail: `cannot be read: ${err.message}` }; }\n", "\t\tconst text = fs.readFileSync(target, \"utf8\");\n")], tests: [TEST], expectRed: [M10] },
	{ n: "35", name: "one shard runs in the parent's own process and appends the record line by line (the landed form, closest form; DECLARED d)", edits: [one(LIB, "\tconst log = (l) => lines.push(l);\n", "\tconst log = (l) => { lines.push(l); if (partFile) fs.appendFileSync(partFile, l + \"\\n\"); };\n")], tests: [TEST], expectRed: [M18] },
	{ n: "37", name: "a shard skips the table-hash comparison (the landed form)", edits: [one(LIB, "\t\tif (parentHash && parentHash !== myHash) { console.error(`seat-mutate: shard table ${myHash} differs from the parent's ${parentHash}`); return EXIT_REFUSED; }\n", "")], tests: [TEST], expectRed: [M24] },
	{ n: "38", name: "a shard skips the tip-commit comparison (the landed form)", edits: [one(LIB, "\t\tif (parentTip && parentTip !== tipInfo.tipSha) { console.error(`seat-mutate: shard tip ${tipInfo.tipSha} differs from the parent's ${parentTip}`); return EXIT_REFUSED; }\n", "")], tests: [TEST], expectRed: [M24] },
	{ n: "39", name: "the parent does no cleanup after a shard ends, so a dead shard's test tree and worktree stay (the landed form)", edits: [one(LIB, "\t\tfor (const end of ends) if (end.scratchDir && fs.existsSync(end.scratchDir)) cleanupDeadShard(ctx.repoRoot, end.scratchDir, ctx.keep, (l) => console.log(l));\n", "")], tests: [TEST], expectRed: [M3] },
	{ n: "40", name: "an edit path joined to the worktree with no containment check (the landed form)", edits: [one(LIB, "\t\tconst { target, exists, within } = realContainment(worktreeReal, e.file);\n\t\tif (!within) return { file: e.file, detail: \"resolves outside the scratch worktree\" };\n\t\tif (!exists) return { file: e.file, detail: \"does not exist\" };\n", "\t\tconst target = path.join(worktreeReal, e.file);\n\t\tconst exists = fs.existsSync(target);\n\t\tif (!exists) return { file: e.file, detail: \"does not exist\" };\n")], tests: [TEST], expectRed: [M25] },
	{ n: "41", name: "a test path joined to the worktree with no containment check (the landed form; baseline instance, DECLARED d)", edits: [one(LIB, "\t\t\t\tconst { within } = realContainment(worktreeReal, rel);\n\t\t\t\tif (!within) { baselineOk = false; log(`seat-mutate: baseline test file resolves outside the scratch worktree: ${rel}`); continue; }\n", "")], tests: [TEST], expectRed: [M25] },
];

// ── plumbing ────────────────────────────────────────────────────────────────────────────────
const sh = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...opts });
const GIT_SAFE = ["-c", "core.hooksPath=/dev/null"];
const git = (...args) => sh("git", [...GIT_SAFE, ...args]);
const count = (hay, needle) => hay.split(needle).length - 1;
const SCRUB = (k) => (/^NANA_/.test(k) && !/^NANA_TEST_/.test(k)) || k === "PI_CODING_AGENT_DIR" || /^SEAT_MUTATE_/.test(k);
let baseEnvCache = null;
function baseEnv() {
	if (baseEnvCache) return baseEnvCache;
	const e = { ...process.env };
	for (const k of Object.keys(e)) if (SCRUB(k) || /^SEAT_MUTATE_/.test(k)) delete e[k];
	const c = Number.isSafeInteger(Number(e.GIT_CONFIG_COUNT)) && Number(e.GIT_CONFIG_COUNT) >= 0 ? Number(e.GIT_CONFIG_COUNT) : 0;
	e[`GIT_CONFIG_KEY_${c}`] = "gc.auto";
	e[`GIT_CONFIG_VALUE_${c}`] = "0";
	e.GIT_CONFIG_COUNT = String(c + 1);
	// The suite runs as `npm test` / `npm run test:locked`, and npm exports its resolved config to the runner and so to
	// every test child. When this runner is started by plain node, it supplies the same three values `npm run` exports,
	// read once under the caller's own HOME.
	for (const key of ["prefix", "globalconfig", "userconfig"]) {
		const name = `npm_config_${key}`;
		if (e[name]) continue;
		const v = sh("npm", ["config", "get", key], { env: process.env }).stdout?.trim();
		if (v && v !== "undefined") e[name] = v;
	}
	if (e.npm_config_prefix && !e.npm_config_global_prefix) e.npm_config_global_prefix = e.npm_config_prefix;
	baseEnvCache = e;
	return e;
}

const lineTitles = (out, tag) => out.split("\n").filter((l) => l.startsWith(`${tag} `)).map((l) => l.slice(tag.length + 1).trim());
// A title is a string (exact, or followed by the check's detail) or a RegExp (DECLARED d).
const isTitle = (t, title) => (title instanceof RegExp ? title.test(t) : t === title || t.startsWith(`${title} `));
const show = (title) => (title instanceof RegExp ? String(title) : JSON.stringify(title));
const short = (s, n = 110) => { s = String(s); return s.length > n ? s.slice(0, n - 1) + "…" : s; };
const fileCrashed = (out) => /^Node\.js v\d+\.\d+\.\d+$/.test(out.trim().split("\n").at(-1) ?? "");
const PAIR_LINE = /^(?:RED|GREEN|ANCHOR-MISS|SYNTAX|DRY ok) (\S+) /;

let logFile = null;
const log = (line) => { console.log(line); if (logFile) fs.appendFileSync(logFile, line + "\n"); };

function resolveTip() {
	const tipSha = git("-C", LANE_REPO, "rev-parse", "--verify", `${TIP}^{commit}`).stdout.trim();
	const mergeBase = tipSha ? git("-C", LANE_REPO, "merge-base", "main", tipSha).stdout.trim() : "";
	const branchHead = git("-C", LANE_REPO, "rev-parse", LANE_BRANCH).stdout.trim();
	return { tipSha, mergeBase, branchHead };
}

/** One run over `pairs` in this process, in its own scratch worktree. Writes SEAT_MUTATE_TALLY when set. */
async function runSingle(pairs, { tipSha, mergeBase, branchHead }) {
	const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "mutate-runner-seat-mutate-"));
	const WT = path.join(SCRATCH, "wt");
	const RUNS = path.join(SCRATCH, "runs");
	fs.mkdirSync(RUNS, { recursive: true });
	let runSeq = 0;
	let current = null; // the running test child, for a signal stop

	const removeWorktree = () => {
		git("-C", LANE_REPO, "worktree", "remove", "--force", WT);
		fs.rmSync(WT, { recursive: true, force: true });
	};
	const resetWorktree = () => {
		// Refuse before any reset or clean when WT is not the scratch worktree's own root (a missing WT or .git file
		// would otherwise let git search upward and clean a parent).
		const top = git("-C", WT, "rev-parse", "--show-toplevel");
		if (top.status !== 0 || fs.realpathSync(top.stdout.trim()) !== fs.realpathSync(WT)) throw new Error(`scratch worktree is gone or not its own root: ${(top.stderr || top.stdout).trim()}`);
		git("-C", WT, "reset", "-q", "--hard", tipSha);
		git("-C", WT, "clean", "-fdq"); // only the scratch worktree; tests may leave untracked files
		const head = git("-C", WT, "rev-parse", "HEAD").stdout.trim();
		if (head !== tipSha) throw new Error(`scratch HEAD ${head} is not the tip ${tipSha} after reset`);
		const st = git("-C", WT, "status", "--porcelain");
		if (st.stdout.trim()) throw new Error(`scratch worktree not clean after reset:\n${st.stdout}`);
	};
	/** Run one test file the way scripts/test.mjs does; resolve { code, out, timedOut, secs }. */
	const runTest = (rel) => {
		const file = path.join(WT, rel);
		const cwd = path.dirname(path.dirname(file)); // the package dir (every test file here is <pkg>/tests/x)
		const id = ++runSeq;
		const home = path.join(RUNS, `home-${id}`);
		const tmp = path.join(RUNS, `tmp-${id}`);
		fs.mkdirSync(home, { recursive: true });
		fs.mkdirSync(tmp, { recursive: true });
		const env = { ...baseEnv(), HOME: home, USERPROFILE: home, TMPDIR: tmp, TEMP: tmp, TMP: tmp };
		const t0 = Date.now();
		return new Promise((resolve) => {
			const child = spawn(process.execPath, ["--experimental-strip-types", file], { cwd, env, stdio: ["ignore", "pipe", "pipe"], detached: true });
			current = child;
			let out = "";
			child.stdout.on("data", (d) => { out += d; });
			child.stderr.on("data", (d) => { out += d; });
			let timedOut = false;
			const timer = setTimeout(() => { timedOut = true; try { process.kill(-child.pid, "SIGKILL"); } catch {} }, TIMEOUT_MS);
			child.on("close", (code, signal) => {
				clearTimeout(timer);
				current = null;
				try { process.kill(-child.pid, "SIGKILL"); } catch {} // stray group members
				fs.rmSync(home, { recursive: true, force: true });
				fs.rmSync(tmp, { recursive: true, force: true });
				resolve({ code: code ?? (signal ? 128 : 1), out, timedOut, secs: ((Date.now() - t0) / 1000).toFixed(1) });
			});
		});
	};
	const applyEdits = (p) => {
		for (const e of p.edits) {
			const abs = path.join(WT, e.file);
			const text = fs.readFileSync(abs, "utf8");
			const c = count(text, e.anchor);
			if (c !== e.times) return `${e.file}: anchor occurs ${c}× (want ${e.times}) — ${short(JSON.stringify(e.anchor), 90)}`;
			fs.writeFileSync(abs, text.split(e.anchor).join(e.replacement));
		}
		return null;
	};
	const syntaxProblem = (p) => {
		for (const f of new Set(p.edits.map((e) => e.file))) {
			const args = /\.(mjs|js)$/.test(f) ? ["--check", path.join(WT, f)] : /\.ts$/.test(f) ? ["--experimental-strip-types", "--check", path.join(WT, f)] : null;
			if (!args) continue;
			const chk = sh(process.execPath, args);
			if (chk.status !== 0) return `${f}: ${chk.stderr.split("\n").slice(0, 4).join(" ")}`;
		}
		return null;
	};

	let stopping = false;
	const onSignal = (sig) => {
		if (stopping) return;
		stopping = true;
		if (current) { try { process.kill(-current.pid, "SIGKILL"); } catch {} }
		log(`seat-mutate: ${sig} — stopping${KEEP ? `; KEEP — scratch left at ${SCRATCH}` : ", removing the scratch worktree"}`);
		if (!KEEP) { try { removeWorktree(); } catch {} fs.rmSync(SCRATCH, { recursive: true, force: true }); }
		process.exit(sig === "SIGINT" ? 130 : 143);
	};
	process.on("SIGINT", () => onSignal("SIGINT"));
	process.on("SIGTERM", () => onSignal("SIGTERM"));

	log(`seat-mutate: lane mutate-runner${SHARD ? `, shard ${SHARD}` : ""}, tip ${tipSha}${branchHead && branchHead !== tipSha ? ` (NOTE: ${LANE_BRANCH} is now ${branchHead})` : ""}, merge-base ${mergeBase}, ${pairs.length} pairs${DRY ? " (DRY: anchors only)" : ""}, ${process.platform}, node ${process.version}, ${new Date().toISOString()}`);
	if (!SHARD) for (const d of DECLARED) log(`DECLARED ${d}`);
	const r = git("-C", LANE_REPO, "worktree", "add", "--detach", WT, tipSha);
	if (r.status !== 0) { log(`seat-mutate: worktree add ${tipSha} failed: ${r.stderr.trim()}`); fs.rmSync(SCRATCH, { recursive: true, force: true }); return { exitCode: 2, tally: null }; }

	const tally = { red: 0, exact: 0, namedGreen: 0, unnamedRed: 0, survived: 0, anchorMiss: 0, syntax: 0, runnable: 0 };
	const survivors = [];
	const basePass = {};
	let baselineOk = true;
	let exitCode = 0;
	try {
		if (!DRY) {
			// Baseline: every named file, unmutated, must exit 0 with no FAIL line. Other jobs share this machine, so a
			// red baseline file is re-run once alone before the runner concludes; the retry's result stands, both logged.
			const files = [...new Set(pairs.flatMap((p) => p.tests))];
			for (const rel of files) {
				let ok = false;
				for (let attempt = 1; attempt <= 2 && !ok; attempt++) {
					resetWorktree();
					const res = await runTest(rel);
					const fl = lineTitles(res.out, "FAIL");
					ok = res.code === 0 && !res.timedOut && fl.length === 0;
					basePass[rel] = lineTitles(res.out, "PASS");
					log(`BASELINE${attempt === 2 ? " RETRY" : ""} ${ok ? "ok  " : "FAIL"} ${rel} (exit ${res.code}, ${basePass[rel].length} PASS, ${fl.length} FAIL, ${lineTitles(res.out, "SKIP").length} SKIP, ${res.secs}s)${ok ? "" : " — " + (fl.slice(0, 3).map((t) => short(t)).join(" | ") || short(res.out.trim().split("\n").slice(-3).join(" / "), 200))}`);
					if (!ok && LOGDIR) fs.writeFileSync(path.join(LOGDIR, `baseline-${SHARD ? SHARD.replace("/", "of") + "-" : ""}${path.basename(rel)}${attempt === 2 ? "-retry" : ""}.log`), res.out);
				}
				if (!ok) baselineOk = false;
			}
			// Every named title must be a PASS line in the baseline of one of the pair's files.
			for (const p of pairs) for (const title of [...p.expectRed, ...(p.alsoRed ?? [])]) {
				if (!p.tests.some((rel) => basePass[rel].some((t) => isTitle(t, title)))) { baselineOk = false; log(`BASELINE MISSING title for pair ${p.n}: ${show(title)} is not a PASS line in ${p.tests.join(", ")}`); }
			}
			resetWorktree();
		}
		if (!baselineOk) { log("seat-mutate: baseline not green — refusing to judge mutations"); exitCode = 2; }
		else {
			for (const p of pairs) {
				resetWorktree();
				const miss = applyEdits(p);
				if (miss) { tally.anchorMiss++; log(`ANCHOR-MISS ${p.n} ${p.name} — ${miss}`); continue; }
				const diff = git("-C", WT, "diff", "--shortstat").stdout.trim() || "no tracked change";
				const bad = syntaxProblem(p);
				if (bad) { tally.syntax++; log(`SYNTAX ${p.n} ${p.name} — ${bad}`); continue; }
				if (DRY) { log(`DRY ok ${p.n} ${p.name} (${diff})`); continue; }
				tally.runnable++;
				const judged = p.expectRed;
				const declared = p.alsoRed ?? [];
				const allFails = [], passTitles = [], crashed = [];
				for (const rel of p.tests) {
					const res = await runTest(rel);
					if (LOGDIR) fs.writeFileSync(path.join(LOGDIR, `${p.n}--${path.basename(rel)}.log`), res.out);
					passTitles.push(...lineTitles(res.out, "PASS"));
					allFails.push(...lineTitles(res.out, "FAIL").map((t) => ({ rel, t })));
					if (fileCrashed(res.out)) crashed.push(`${path.basename(rel)} THREW (later checks never ran): ${short(res.out.trim().split("\n").filter((l) => /^[A-Za-z]*Error\b/.test(l)).at(-1) ?? "", 120)}`);
					else if ((res.code !== 0 || res.timedOut) && !lineTitles(res.out, "FAIL").length) crashed.push(`${path.basename(rel)} exit ${res.code}${res.timedOut ? " (timeout)" : ""}: ${short(res.out.trim().split("\n").slice(-3).join(" / "), 160)}`);
					else if (res.code === 0 && lineTitles(res.out, "FAIL").length) crashed.push(`${path.basename(rel)} printed FAIL lines but exited 0`);
				}
				const failed = (title) => allFails.some(({ t }) => isTitle(t, title));
				const matched = judged.filter(failed);
				const namedGreen = judged.filter((s) => !failed(s) && passTitles.some((t) => isTitle(t, s)));
				const notReached = judged.filter((s) => !failed(s) && !passTitles.some((t) => isTitle(t, s)));
				const declaredRed = declared.filter(failed);
				const declaredGreen = declared.filter((s) => !failed(s));
				const unnamed = allFails.filter(({ t }) => ![...judged, ...declared].some((s) => isTitle(t, s)));
				const extra = `${declaredRed.length ? `; also (declared): ${declaredRed.map((s) => short(s, 80)).join(" | ")}` : ""}${declaredGreen.length ? `; declared but GREEN: ${declaredGreen.map(show).join(", ")}` : ""}${namedGreen.length ? `; named but GREEN: ${namedGreen.map(show).join(", ")}` : ""}${notReached.length ? `; named but NOT REACHED: ${notReached.map(show).join(", ")}` : ""}${unnamed.length ? `; UNNAMED red: ${unnamed.map(({ rel, t }) => `[${path.basename(rel)}] ${short(t, 110)}`).join(" | ")}` : ""}; ${allFails.length} FAIL total (${diff})${crashed.length ? `; CRASH ${crashed.join(" || ")}` : ""}`;
				if (matched.length) {
					tally.red++;
					if (namedGreen.length || notReached.length) tally.namedGreen++;
					if (unnamed.length) tally.unnamedRed++;
					if (!namedGreen.length && !notReached.length && !unnamed.length) tally.exact++;
					log(`RED ${p.n} ${p.name} — ${matched.length}/${judged.length} named: ${matched.map((t) => short(t, 100)).join(" | ")}${extra}`);
				} else if (allFails.length || crashed.length) {
					tally.red++;
					tally.namedGreen++;
					if (unnamed.length) tally.unnamedRed++;
					log(`RED ${p.n} ${p.name} — (no named case)${extra}`);
				} else {
					tally.survived++;
					survivors.push(p.n);
					log(`GREEN ${p.n} ${p.name} — SURVIVED${extra}`);
				}
			}
		}
	} finally {
		if (KEEP) log(`seat-mutate: KEEP — scratch left at ${SCRATCH}`);
		else {
			try { resetWorktree(); } catch (e) { log(`seat-mutate: reset failed at cleanup: ${e.message}`); }
			removeWorktree();
			fs.rmSync(SCRATCH, { recursive: true, force: true });
		}
	}
	log(resultLine(pairs.length, tally, survivors, { missing: 0, shards: 0 }));
	if (tally.anchorMiss || tally.syntax) exitCode = 3;
	return { exitCode, tally, survivors, baselineOk };
}

function resultLine(total, tally, survivors, { missing, shards, interrupted = false }) {
	const tail = `${tally.anchorMiss ? `, ${tally.anchorMiss} ANCHOR-MISS` : ""}${tally.syntax ? `, ${tally.syntax} SYNTAX` : ""}${missing ? `, ${missing} MISSING` : ""}${shards ? `, across ${shards} shards` : ""}${interrupted ? " (INTERRUPTED)" : ""}`;
	if (DRY) return `RESULT (DRY): ${total - tally.anchorMiss - tally.syntax - missing}/${total} pairs apply${tail}`;
	return `RESULT: ${tally.red}/${tally.runnable} red (${tally.exact} exactly their named titles, ${tally.namedGreen} with a named title green, ${tally.unnamedRed} with an unnamed red), ${tally.survived} survived${survivors.length ? ` [${survivors.join(", ")}]` : ""}${tail}`;
}

/** Split `pairs` round-robin into `n` child runs of this script, then merge their part files into one output. */
async function runSharded(pairs, n, staggerMs, { tipSha, mergeBase, branchHead }) {
	const groups = Array.from({ length: n }, () => []);
	pairs.forEach((p, i) => groups[i % n].push(p.n));
	const outFile = process.env.SEAT_MUTATE_OUT || null;
	const partDir = outFile ? null : fs.mkdtempSync(path.join(os.tmpdir(), "mutate-runner-seat-mutate-parts-"));
	const partOf = (k) => (outFile ? `${outFile}.part${k}of${n}` : path.join(partDir, `part${k}of${n}.txt`));
	const header = `seat-mutate: lane mutate-runner, tip ${tipSha}${branchHead && branchHead !== tipSha ? ` (NOTE: ${LANE_BRANCH} is now ${branchHead})` : ""}, merge-base ${mergeBase}, ${pairs.length} pairs in ${n} shards (${groups.map((g) => g.length).join("+")}, round-robin, ${staggerMs / 1000}s apart)${DRY ? " (DRY: anchors only)" : ""}, ${process.platform}, node ${process.version}, ${new Date().toISOString()}`;
	console.log(header);
	for (const d of DECLARED) console.log(`DECLARED ${d}`);

	const kids = new Set();
	let interrupted = false;
	const forward = (sig) => { interrupted = true; for (const c of kids) { try { c.kill(sig); } catch {} } };
	process.on("SIGINT", () => forward("SIGINT"));
	process.on("SIGTERM", () => forward("SIGTERM"));

	const runShard = (k, ids) => new Promise((resolve) => {
		const part = partOf(k);
		for (const f of [part, `${part}.json`]) fs.rmSync(f, { force: true });
		if (interrupted) { resolve({ k, code: null, signal: "not started" }); return; }
		const env = { ...process.env, SEAT_MUTATE_SHARD: `${k}/${n}`, SEAT_MUTATE_SHARDS: "1", SEAT_MUTATE_OUT: part, SEAT_MUTATE_TALLY: `${part}.json` };
		const child = spawn(process.execPath, [SCRIPT, ...ids], { env, stdio: ["ignore", "pipe", "pipe"] });
		kids.add(child);
		readline.createInterface({ input: child.stdout }).on("line", (l) => console.log(`[${k}/${n}] ${l}`));
		readline.createInterface({ input: child.stderr }).on("line", (l) => console.error(`[${k}/${n}] ${l}`));
		child.on("close", (code, signal) => { kids.delete(child); resolve({ k, code, signal }); });
	});
	const ends = await Promise.all(groups.map((ids, i) => new Promise((resolve) => setTimeout(() => resolve(runShard(i + 1, ids)), i * staggerMs))));

	// Merge: shard notes, every pair line in table order, one RESULT summed from the shard tallies.
	const total = { red: 0, exact: 0, namedGreen: 0, unnamedRed: 0, survived: 0, anchorMiss: 0, syntax: 0, runnable: 0 };
	const survivors = [];
	const pairLines = new Map();
	const notes = [];
	let shardFailed = false;
	for (const end of ends) {
		const part = partOf(end.k);
		const lines = fs.existsSync(part) ? fs.readFileSync(part, "utf8").split("\n").filter(Boolean) : [];
		for (const l of lines) {
			const m = PAIR_LINE.exec(l);
			if (m) pairLines.set(m[1], l);
			else if (!l.startsWith("DECLARED ")) notes.push(`[${end.k}/${n}] ${l}`);
		}
		let t = null;
		try { t = JSON.parse(fs.readFileSync(`${part}.json`, "utf8")); } catch {}
		if (t?.tally) { for (const key of Object.keys(total)) total[key] += t.tally[key] ?? 0; survivors.push(...(t.survivors ?? [])); }
		if (end.code !== 0 && end.code !== 3) { shardFailed = true; notes.push(`[${end.k}/${n}] seat-mutate: shard exited ${end.code ?? end.signal}${t ? "" : " with no tally"}`); }
	}
	const order = new Map(PAIRS.map((p, i) => [p.n, i]));
	survivors.sort((a, b) => order.get(a) - order.get(b));
	const shardOf = new Map(groups.flatMap((ids, i) => ids.map((id) => [id, i + 1])));
	const merged = [header, ...DECLARED.map((d) => `DECLARED ${d}`), ...notes];
	let missing = 0;
	for (const p of pairs) {
		if (pairLines.has(p.n)) merged.push(pairLines.get(p.n));
		else { missing++; merged.push(`MISSING ${p.n} ${p.name} — shard ${shardOf.get(p.n)}/${n} printed no line for it`); }
	}
	const result = resultLine(pairs.length, total, survivors, { missing, shards: n, interrupted });
	merged.push(result);
	if (outFile) fs.writeFileSync(outFile, merged.join("\n") + "\n");
	for (const l of merged.slice(1 + DECLARED.length + notes.length)) console.log(l);
	console.log(`seat-mutate: merged output ${outFile ?? "(console only)"}; part files ${outFile ? `${outFile}.part<k>of${n}` : partDir}`);
	if (total.anchorMiss || total.syntax) return 3;
	if (missing || shardFailed || interrupted) return 2;
	return 0;
}

// ── main ────────────────────────────────────────────────────────────────────────────────────
const only = process.argv.slice(2);
const unknown = only.filter((id) => !PAIRS.some((p) => p.n === id));
if (unknown.length) { console.error(`seat-mutate: unknown pair id ${unknown.join(", ")} (ids are 1 to ${PAIRS.length})`); process.exit(2); }
const pairs = only.length ? PAIRS.filter((p) => only.includes(p.n)) : PAIRS;
const shardsRaw = SHARD ? "1" : process.env.SEAT_MUTATE_SHARDS ?? SHARDS_DEFAULT;
const shards = Number(shardsRaw);
const staggerSecs = Number(process.env.SEAT_MUTATE_STAGGER_SECS ?? STAGGER_SECS_DEFAULT);
if (!Number.isSafeInteger(shards) || shards < 1) { console.error(`seat-mutate: SEAT_MUTATE_SHARDS must be a whole number of 1 or more (got ${JSON.stringify(shardsRaw)})`); process.exit(2); }
if (!Number.isFinite(staggerSecs) || staggerSecs < 0) { console.error(`seat-mutate: SEAT_MUTATE_STAGGER_SECS must be 0 or more (got ${JSON.stringify(process.env.SEAT_MUTATE_STAGGER_SECS)})`); process.exit(2); }
const tip = resolveTip();
if (!tip.tipSha || !tip.mergeBase) { console.error(`seat-mutate: tip ${TIP} or its merge-base with main did not resolve in ${LANE_REPO}`); process.exit(2); }
const n = Math.min(shards, pairs.length);
if (n > 1) process.exitCode = await runSharded(pairs, n, staggerSecs * 1000, tip);
else {
	logFile = process.env.SEAT_MUTATE_OUT || null;
	if (logFile) fs.writeFileSync(logFile, "");
	const res = await runSingle(pairs, tip);
	if (process.env.SEAT_MUTATE_TALLY && res.tally) fs.writeFileSync(process.env.SEAT_MUTATE_TALLY, JSON.stringify({ tally: res.tally, survivors: res.survivors, pairs: pairs.length, baselineOk: res.baselineOk }));
	process.exitCode = res.exitCode;
}
