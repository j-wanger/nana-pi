#!/usr/bin/env node
// Seat mutation runner for lane seat-guide (frozen table; CHANGE.md §5 "Wrong code first": M1-M13 with M4b and M6b,
// and the "Stays" pairs S1-S5). Form copied from docs/reviews/roster-2026-10-13/seat-mutate.mjs.
// For each pair: apply the wrong guide, template, AGENTS.md, file name or code list (never a test assertion) in a
// detached scratch worktree of the lane tip, refuse when an anchor does not occur exactly once (ANCHOR-MISS = runner
// bug), syntax-check every mutated module, run the named test files with node exactly as scripts/test.mjs does
// (package-dir cwd, fresh HOME/USERPROFILE/TMPDIR/TEMP/TMP, NANA_* but NANA_TEST_* and PI_CODING_AGENT_DIR scrubbed,
// --experimental-strip-types, and the npm_config_prefix/globalconfig/userconfig that `npm test` exports when the
// runner itself was not started through npm), and print RED / GREEN (SURVIVED). A RED line also lists every named title that
// stayed GREEN and every UNNAMED red, so "reds exactly the titles named" is judged, not assumed.
//
// Stay pairs: S1, S2, S3 and S5 are judged like M pairs (their named titles must go red). S4 is a stay-GREEN pair
// (§5: "every R-1140 and R-1141 check stays green"): it prints GREEN S4 … — stays green (expected), or RED S4 …
// UNEXPECTED when anything goes red.
//
// Acceptance (S1 only): §5 says S1 reds "acceptance (f)". The runner runs the lane's own acceptance.mjs from the
// scratch worktree root (its cwd's git root is the build under test), with the same fresh HOME/TMPDIR and scrubbed
// env; an `ok   ` line counts as PASS and a `MISS ` line as FAIL. The scope case reads `git diff --name-only
// <merge-base>..HEAD`, so S1 COMMITS its mutation on the scratch worktree's detached HEAD (identity, signing and
// hooks overridden on the command line); every reset returns the scratch HEAD to the tip with `reset --hard`. That
// commit is an unreachable object in the shared object store; no ref names it.
//
// Test sets (declared before the run): guide pairs run seat-rule.test.mjs; pointer and matrix pairs run
// templates-render and skill-claims (skill-claims judges the shared section's paths, so it shows whether a pointer
// edit reds it too); code-list pairs run the five lane-touched nana-setup files that install or read the manifest
// (install, win32-degrade, state-manifest, uninstall, restore); S1 runs acceptance and templates-render (R-1128).
// M13 runs templates-render and skill-claims only: seat-rule, install and win32-degrade read the guide by its fixed
// path, so a rename reds them by construction and says nothing about R-1142's "present in this checkout" check.
//
// Seat corrections to §5 (declared before the run; each prints as "also (declared)", never hidden):
// (a) M2: §5 names only "…: verify once at the end"; the plan's own sim-guide-v2.mjs shows M2 also reds "no bullet
//     beyond" (nine bullets ≠ eight), so that title is declared.
// (b) M7: CLAUDE_RULES drives the win32 copy too (stepRules), so R-350's new seat-copy title is declared.
// (c) M8: the dry-run label check (R-903–R-907) reads the manifest's labels, which §5 lists as an extended input;
//     declared beside "uninstall's round trip" (named as the snapshot round trip).
// (d) M10: with no seat-guide bullet the second R-1142 check has no named path, so it is declared.
// (e) S5: the first R-1142 check reads the template's pointer line itself, so any template-only pointer edit
//     reds it; declared.
// (f) M9 is applied to nana-seat.md only (`copyInstead: win() && rule !== "nana-seat.md"`): a blanket
//     `copyInstead: false` is already caught by R-350's soul titles, so it could not show the new title bites.
// (g) S3 also places a byte copy of the guide at packages/nana-pack/rules/nana-seat.md, so the rerouted source
//     exists and the pair isolates the routing (without it the win32 copy throws ENOENT and install fails wholesale).
//
// Never touches the lane worktree or the main checkout: everything runs in one detached scratch worktree in a
// mkdtemp folder beside this script (the session scratchpad, under /private/tmp), removed at the end
// (SEAT_MUTATE_KEEP=1 keeps it for inspection); git writes only its worktree metadata (and S1's unreachable commit)
// into the shared .git.
// Usage: SEAT_MUTATE_OUT=<file> [SEAT_MUTATE_TIP=<rev>] node seat-mutate.mjs [pair-id ...]
import { spawnSync, spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const LANE_REPO = "/Users/jwang/nana-pi-wt/seat-guide";
const TIP = process.env.SEAT_MUTATE_TIP || "cac50d7";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRATCH = fs.mkdtempSync(path.join(HERE, "work-"));
const WT = path.join(SCRATCH, "wt");
const RUNS = path.join(SCRATCH, "runs");
const KEEP = process.env.SEAT_MUTATE_KEEP === "1";
const TIMEOUT_MS = 10 * 60 * 1000;

// ── test files ──────────────────────────────────────────────────────────────────────────────
const SR = "packages/nana-setup/tests/seat-rule.test.mjs";
const INST = "packages/nana-setup/tests/install.test.mjs";
const W32D = "packages/nana-setup/tests/win32-degrade.test.mjs";
const SM = "packages/nana-setup/tests/state-manifest.test.mjs";
const UN = "packages/nana-setup/tests/uninstall.test.mjs";
const RE = "packages/nana-setup/tests/restore.test.mjs";
const TR = "packages/nana-pack/tests/templates-render.test.mjs";
const SC = "packages/nana-pack/tests/skill-claims.test.mjs";
const ACC = "docs/reviews/seat-guide-2026-10-14/acceptance.mjs"; // not a *.test.mjs: run from the worktree root

// ── mutated files ───────────────────────────────────────────────────────────────────────────
const GUIDE = "packages/nana-setup/claude/rules/nana-seat.md";
const SHARED = "templates/_shared/working-under-nana-pi.md";
const AGENTS = "AGENTS.md"; // CLAUDE.md is a symlink to it; its marker region is a byte copy of SHARED (R-859)
const SOUL = "packages/nana-setup/claude/rules/nana-soul.md";
const STEPS = "packages/nana-setup/lib/steps.mjs";
const MANIFEST = "packages/nana-setup/lib/state-manifest.mjs";
const PACK_SEAT = "packages/nana-pack/rules/nana-seat.md";

// ── the guide's lines (exact, as shipped at the tip) ────────────────────────────────────────
const SCOPE = "This rule is for the seat, the session that launches builders and reviewers; a session started as a builder or reviewer skips it.";
const RULE_1 = "- In Claude Code, launch each builder or reviewer as a background task and end your turn. In pi, run it as one foreground command with no timeout.";
const RULE_2 = "- While a builder or reviewer runs, do not read or judge its partial output, transcript, diffs or test results. Do not re-run its checks before it ends.";
const RULE_4 = "- Verify once, when the build ends. Re-run the seat checks your brief names, read the builder's report, and look at every page or command output the change produces.";
const POINTER = "- Seat guide: while a builder or reviewer runs, the seat does not read or judge its partial work, and it acts when the run completes. The full guide is `$HOME/nana-pi/packages/nana-setup/claude/rules/nana-seat.md`; Claude Code loads it as a rule.";

// ── titles (exact, as in the suite / acceptance) ────────────────────────────────────────────
const sh = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: "utf8", ...opts });
const GIT_SAFE = ["-c", "core.hooksPath=/dev/null"];
const git = (...args) => sh("git", [...GIT_SAFE, ...args]);
const tipSha = git("-C", LANE_REPO, "rev-parse", "--verify", `${TIP}^{commit}`).stdout.trim();
const mergeBase = git("-C", LANE_REPO, "merge-base", "main", tipSha).stdout.trim();
const T = {
	R1141: "seat guide scopes itself to the seat in one sentence before its first bullet",
	R1140b: "seat guide holds no bullet beyond its eight rules",
	c1: "seat guide carries: launch in the background and end the turn",
	c2: "seat guide carries: no reading or judging partial work mid-run",
	c3: "seat guide carries: act on completion or a monitor's failure or stall",
	c4: "seat guide carries: verify once at the end",
	c5: "seat guide carries: re-run the mutation runner after the seat's own change",
	c6: "seat guide carries: findings back in the next brief",
	c7: "seat guide carries: at most two lanes in flight",
	c8: "seat guide carries: preamble and review standard named, not restated",
	R301seat: "rule nana-seat.md is a symlink into the repo",
	R350seat: "win32: nana-seat.md is installed as a copy matching the repo file",
	R954: "every path created by install maps to a nana-setup-owned manifest row",
	roundTrip: "install --desk then uninstall restores the independent home snapshot",
	dryRun: "dry-run lists manifest pieces without writes and repeated uninstall is empty",
	R1142one: "shared working pattern carries one seat-guide bullet",
	R1142file: "seat-guide bullet names a guide file present in this checkout",
	R680: "shared runtime matrix declares four runtime surfaces, ten capabilities, and the discovered source inventory",
	R859: "AGENTS.md marker-owned section is byte-identical to the shared file",
	R1128: "nana-soul carries the shared default-pattern and seat land review bullets",
	AccF: `(f) git diff --name-only ${mergeBase.slice(0, 7)}..HEAD lists only §4 In paths and this review folder`,
};

// ── edits ───────────────────────────────────────────────────────────────────────────────────
const one = (file, anchor, replacement) => ({ file, anchor, replacement });
const append = (file, text) => ({ file, append: text });
const rename = (from, to) => ({ rename: [from, to] });
const copy = (from, to) => ({ copy: [from, to] });
// Shared-section pairs edit the template and the AGENTS.md region alike, so R-859 stays green (except S5).
const both = (anchor, replacement) => [SHARED, AGENTS].map((file) => one(file, anchor, replacement));

const GUIDE_T = [SR];
const PTR_T = [TR, SC];
const SETUP_T = [INST, W32D, SM, UN, RE];
const ALL_CARRIES = [T.c1, T.c2, T.c3, T.c4, T.c5, T.c6, T.c7, T.c8];

// Frozen table. `expectRed` are the exact titles §5 names; `alsoRed` the seat's declared corrections (header);
// `expectGreen` marks the stay-green pair; `commit` commits the mutation on the scratch HEAD before the run.
const PAIRS = [
	// R-1140 (M1-M4b)
	{ n: "M1", name: "delete the no-reading bullet", edits: [one(GUIDE, `${RULE_2}\n`, "")], tests: GUIDE_T, expectRed: [T.c2, T.R1140b] },
	{ n: "M2", name: "duplicate the verify bullet", edits: [one(GUIDE, `${RULE_4}\n`, `${RULE_4}\n${RULE_4}\n`)], tests: GUIDE_T, expectRed: [T.c4], alsoRed: [T.R1140b] },
	{ n: "M3", name: "add \"- Send reports verdict-first.\"", edits: [append(GUIDE, "- Send reports verdict-first.\n")], tests: GUIDE_T, expectRed: [T.R1140b] },
	{ n: "M4", name: "drop bullet 3's monitor clause", edits: [one(GUIDE, " or a monitor reports a failure or a stall. Then act", ". Then act")], tests: GUIDE_T, expectRed: [T.c3, T.R1140b] },
	{ n: "M4b", name: "add a monitor-ban bullet", edits: [append(GUIDE, "- Arm no monitor or heartbeat on a builder or reviewer run.\n")], tests: GUIDE_T, expectRed: [T.R1140b] },
	// R-1141 (M5-M6b)
	{ n: "M5", name: "delete the scope sentence", edits: [one(GUIDE, `${SCOPE}\n`, "")], tests: GUIDE_T, expectRed: [T.R1141] },
	{ n: "M6", name: "move the scope sentence below the first bullet", edits: [one(GUIDE, `${SCOPE}\n\n${RULE_1}\n`, `${RULE_1}\n${SCOPE}\n`)], tests: GUIDE_T, expectRed: [T.R1141] },
	{ n: "M6b", name: "split the scope sentence (\"; a\" → \". A\")", edits: [one(GUIDE, "reviewers; a session started", "reviewers. A session started")], tests: GUIDE_T, expectRed: [T.R1141] },
	// R-301 / R-954 / R-350 code lists (M7-M9)
	{ n: "M7", name: "drop nana-seat.md from CLAUDE_RULES", edits: [one(STEPS, "export const CLAUDE_RULES = [\"nana-soul.md\", \"nana-standards.md\", \"nana-writing.md\", \"nana-seat.md\"];", "export const CLAUDE_RULES = [\"nana-soul.md\", \"nana-standards.md\", \"nana-writing.md\"];")], tests: SETUP_T, expectRed: [T.R301seat, T.R954], alsoRed: [T.R350seat] },
	{ n: "M8", name: "drop nana-seat.md from the state-manifest rule list", edits: [one(MANIFEST, "for (const name of [\"nana-soul.md\", \"nana-standards.md\", \"nana-writing.md\", \"nana-seat.md\"]) rebuild(`rule link ${name}`", "for (const name of [\"nana-soul.md\", \"nana-standards.md\", \"nana-writing.md\"]) rebuild(`rule link ${name}`")], tests: SETUP_T, expectRed: [T.roundTrip, T.R954], alsoRed: [T.dryRun] },
	{ n: "M9", name: "copyInstead false for nana-seat.md under forced win32", edits: [one(STEPS, "copyInstead: win(),", "copyInstead: win() && rule !== \"nana-seat.md\",")], tests: SETUP_T, expectRed: [T.R350seat] },
	// R-1142 pointer (M10-M13)
	{ n: "M10", name: "delete the pointer (template and AGENTS.md)", edits: both(`${POINTER}\n`, ""), tests: PTR_T, expectRed: [T.R1142one], alsoRed: [T.R1142file] },
	{ n: "M11", name: "duplicate the pointer (template and AGENTS.md)", edits: both(`${POINTER}\n`, `${POINTER}\n${POINTER}\n`), tests: PTR_T, expectRed: [T.R1142one] },
	{ n: "M12", name: "point it at packages/nana-pack/rules/ (template and AGENTS.md)", edits: both("`$HOME/nana-pi/packages/nana-setup/claude/rules/nana-seat.md`", "`$HOME/nana-pi/packages/nana-pack/rules/nana-seat.md`"), tests: PTR_T, expectRed: [T.R1142one, T.R1142file] },
	{ n: "M13", name: "rename the guide file (nana-seat.md → nana-seats.md), pointer kept", edits: [rename(GUIDE, "packages/nana-setup/claude/rules/nana-seats.md")], tests: PTR_T, expectRed: [T.R1142file] },
	// Stays (S1-S5)
	{ n: "S1", name: "append the no-reading bullet to nana-soul.md (committed)", edits: [append(SOUL, `${RULE_2}\n`)], commit: true, tests: [ACC, TR], expectRed: [T.AccF] },
	{ n: "S2", name: "add \"and nana-seat\" to the Claude Code seat's matrix cell (template and AGENTS.md)", edits: both("| Both Claude rules |", "| Both Claude rules and nana-seat |"), tests: PTR_T, expectRed: [T.R680] },
	{ n: "S3", name: "route nana-seat.md to PACK_RULES_DIR in ruleSource (guide copied there)", edits: [one(STEPS, "return rule === \"nana-writing.md\" ? path.join(PACK_RULES_DIR, rule)", "return rule === \"nana-writing.md\" || rule === \"nana-seat.md\" ? path.join(PACK_RULES_DIR, rule)"), copy(GUIDE, PACK_SEAT)], tests: SETUP_T, expectRed: [T.R301seat] },
	{ n: "S4", name: "CRLF guide", edits: [{ file: GUIDE, transform: (s) => s.replace(/\n/g, "\r\n"), label: "LF → CRLF" }], tests: GUIDE_T, expectRed: [], expectGreen: [T.R1141, T.R1140b, ...ALL_CARRIES] },
	{ n: "S5", name: "edit the pointer in the template only (\"completes\" → \"ends\")", edits: [one(SHARED, "and it acts when the run completes. The full guide", "and it acts when the run ends. The full guide")], tests: PTR_T, expectRed: [T.R859], alsoRed: [T.R1142one] },
];

// ── plumbing ────────────────────────────────────────────────────────────────────────────────
const count = (hay, needle) => hay.split(needle).length - 1;
const SCRUB = (k) => (/^NANA_/.test(k) && !/^NANA_TEST_/.test(k)) || k === "PI_CODING_AGENT_DIR";
const BASE_ENV = (() => {
	const e = { ...process.env };
	for (const k of Object.keys(e)) if (SCRUB(k)) delete e[k];
	const c = Number.isSafeInteger(Number(e.GIT_CONFIG_COUNT)) && Number(e.GIT_CONFIG_COUNT) >= 0 ? Number(e.GIT_CONFIG_COUNT) : 0;
	e[`GIT_CONFIG_KEY_${c}`] = "gc.auto";
	e[`GIT_CONFIG_VALUE_${c}`] = "0";
	e.GIT_CONFIG_COUNT = String(c + 1);
	// The suite runs as `npm test` / `npm run test:locked`, and npm exports its resolved config to the runner and so to
	// every test child. restore.test.mjs resolves pi through `npm root -g`, which under a fresh HOME reads no ~/.npmrc
	// and falls back to npm's built-in prefix unless npm_config_prefix is set. When this runner is started by plain
	// node, it supplies the same three values `npm run` exports, read once under the caller's own HOME.
	for (const key of ["prefix", "globalconfig", "userconfig"]) {
		const name = `npm_config_${key}`;
		if (e[name]) continue;
		const v = sh("npm", ["config", "get", key], { env: process.env }).stdout?.trim();
		if (v && v !== "undefined") e[name] = v;
	}
	if (e.npm_config_prefix && !e.npm_config_global_prefix) e.npm_config_global_prefix = e.npm_config_prefix;
	return e;
})();
let runSeq = 0;

function addWorktree(dir, ref) {
	const r = git("-C", LANE_REPO, "worktree", "add", "--detach", dir, ref);
	if (r.status !== 0) throw new Error(`worktree add ${ref} failed: ${r.stderr}`);
}
function removeWorktree(dir) {
	git("-C", LANE_REPO, "worktree", "remove", "--force", dir);
	fs.rmSync(dir, { recursive: true, force: true });
}
function resetWorktree() {
	// Refuse before any reset or clean when WT is not the scratch worktree's own root (a missing WT or .git file would
	// otherwise let git search upward and clean a parent).
	const top = git("-C", WT, "rev-parse", "--show-toplevel");
	if (top.status !== 0 || fs.realpathSync(top.stdout.trim()) !== fs.realpathSync(WT)) throw new Error(`scratch worktree is gone or not its own root: ${(top.stderr || top.stdout).trim()}`);
	git("-C", WT, "reset", "-q", "--hard", tipSha);
	git("-C", WT, "clean", "-fdq"); // only the scratch worktree; tests may leave untracked files
	const head = git("-C", WT, "rev-parse", "HEAD").stdout.trim();
	if (head !== tipSha) throw new Error(`scratch HEAD ${head} is not the tip ${tipSha} after reset`);
	const st = git("-C", WT, "status", "--porcelain");
	if (st.stdout.trim()) throw new Error(`scratch worktree not clean after reset:\n${st.stdout}`);
}

/** Run one test file the way scripts/test.mjs does (acceptance from the worktree root); resolve { code, out, timedOut, secs }. */
function runTest(rel) {
	const file = path.join(WT, rel);
	const isAcc = rel === ACC;
	const cwd = isAcc ? WT : path.dirname(path.dirname(file)); // the package dir (every test file here is <pkg>/tests/x)
	const id = ++runSeq;
	const home = path.join(RUNS, `home-${id}`);
	const tmp = path.join(RUNS, `tmp-${id}`);
	fs.mkdirSync(home, { recursive: true });
	fs.mkdirSync(tmp, { recursive: true });
	const env = { ...BASE_ENV, HOME: home, USERPROFILE: home, TMPDIR: tmp, TEMP: tmp, TMP: tmp };
	const t0 = Date.now();
	return new Promise((resolve) => {
		const child = spawn(process.execPath, ["--experimental-strip-types", file], { cwd, env, stdio: ["ignore", "pipe", "pipe"], detached: true });
		let out = "";
		child.stdout.on("data", (d) => { out += d; });
		child.stderr.on("data", (d) => { out += d; });
		let timedOut = false;
		const timer = setTimeout(() => { timedOut = true; try { process.kill(-child.pid, "SIGKILL"); } catch {} }, TIMEOUT_MS);
		child.on("close", (code, signal) => {
			clearTimeout(timer);
			try { process.kill(-child.pid, "SIGKILL"); } catch {} // stray group members
			fs.rmSync(home, { recursive: true, force: true });
			fs.rmSync(tmp, { recursive: true, force: true });
			// acceptance prints `ok   <title>` / `MISS <title> → …`; read them as PASS / FAIL lines.
			if (isAcc) out = out.split("\n").map((l) => l.startsWith("ok   ") ? `PASS ${l.slice(5)}` : l.startsWith("MISS ") ? `FAIL ${l.slice(5)}` : l).join("\n");
			resolve({ code: code ?? (signal ? 128 : 1), out, timedOut, secs: ((Date.now() - t0) / 1000).toFixed(1) });
		});
	});
}
const lineTitles = (out, tag) => out.split("\n").filter((l) => l.startsWith(`${tag} `)).map((l) => l.slice(tag.length + 1).trim());
const isTitle = (t, title) => t === title || t.startsWith(`${title} `);
const short = (s, n = 110) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const fileCrashed = (out) => /^Node\.js v\d+\.\d+\.\d+$/.test(out.trim().split("\n").at(-1) ?? "");

let logFile = null;
const log = (line) => { console.log(line); if (logFile) fs.appendFileSync(logFile, line + "\n"); };

function applyEdits(p) {
	for (const e of p.edits) {
		if (e.rename || e.copy) {
			const [from, to] = e.rename ?? e.copy;
			if (!fs.existsSync(path.join(WT, from))) return `${from}: source missing`;
			if (fs.existsSync(path.join(WT, to))) return `${to}: destination already exists`;
			if (e.rename) fs.renameSync(path.join(WT, from), path.join(WT, to));
			else fs.copyFileSync(path.join(WT, from), path.join(WT, to));
			continue;
		}
		const abs = path.join(WT, e.file);
		const text = fs.readFileSync(abs, "utf8");
		if (e.append !== undefined) {
			fs.writeFileSync(abs, (text.endsWith("\n") ? text : text + "\n") + e.append);
		} else if (e.transform) {
			const next = e.transform(text);
			if (next === text) return `${e.file}: ${e.label} changed nothing`;
			fs.writeFileSync(abs, next);
		} else {
			const c = count(text, e.anchor);
			if (c !== 1) return `${e.file}: anchor occurs ${c}× — ${short(JSON.stringify(e.anchor), 90)}`;
			fs.writeFileSync(abs, text.replace(e.anchor, () => e.replacement));
		}
	}
	return null;
}
function commitScratch(p) {
	const r = git("-C", WT, "-c", "user.name=seat-mutate", "-c", "user.email=seat-mutate@localhost", "-c", "commit.gpgsign=false",
		"commit", "-q", "--no-verify", "-a", "-m", `seat-mutate ${p.n} (scratch only)`);
	return r.status === 0 ? null : `commit failed: ${(r.stderr || r.stdout).trim()}`;
}

// ── main ────────────────────────────────────────────────────────────────────────────────────
const only = process.argv.slice(2);
const pairs = only.length ? PAIRS.filter((p) => only.includes(p.n)) : PAIRS;
logFile = process.env.SEAT_MUTATE_OUT || null;
if (logFile) fs.writeFileSync(logFile, "");

fs.mkdirSync(RUNS, { recursive: true });
const branchHead = git("-C", LANE_REPO, "rev-parse", "feat/seat-guide").stdout.trim();
log(`seat-mutate: lane seat-guide, tip ${tipSha}${branchHead && branchHead !== tipSha ? ` (NOTE: feat/seat-guide is now ${branchHead})` : ""}, merge-base ${mergeBase}, ${pairs.length} pairs, ${process.platform}, node ${process.version}, ${new Date().toISOString()}`);
if (!tipSha || !mergeBase) { log("seat-mutate: tip or merge-base did not resolve"); process.exit(2); }
addWorktree(WT, tipSha);

const tally = { red: 0, exact: 0, namedGreen: 0, unnamedRed: 0, survived: 0, stayGreen: 0, stayRed: 0, anchorMiss: 0, syntax: 0, runnable: 0 };
const survivors = [], stayRed = [];
const basePass = {};
try {
	// Baseline: every named file, unmutated, must exit 0 with no FAIL line.
	const files = [...new Set(pairs.flatMap((p) => p.tests))];
	let baselineOk = true;
	for (const rel of files) {
		resetWorktree();
		const r = await runTest(rel);
		const fl = lineTitles(r.out, "FAIL");
		const ok = r.code === 0 && !r.timedOut && fl.length === 0;
		basePass[rel] = lineTitles(r.out, "PASS");
		log(`BASELINE ${ok ? "ok  " : "FAIL"} ${rel} (exit ${r.code}, ${basePass[rel].length} PASS, ${fl.length} FAIL, ${r.secs}s)${ok ? "" : " — " + (fl.slice(0, 3).map((t) => short(t)).join(" | ") || short(r.out.trim().split("\n").slice(-3).join(" / "), 200))}`);
		if (!ok) { baselineOk = false; fs.writeFileSync(path.join(HERE, `baseline-${path.basename(rel)}.log`), r.out); }
	}
	// Every named, declared or stay-green title must be a PASS line in the baseline of one of the pair's files.
	for (const p of pairs) for (const title of [...p.expectRed, ...(p.alsoRed ?? []), ...(p.expectGreen ?? [])]) {
		if (!p.tests.some((rel) => basePass[rel].some((t) => isTitle(t, title)))) { baselineOk = false; log(`BASELINE MISSING title for pair ${p.n}: ${JSON.stringify(title)} is not a PASS line in ${p.tests.join(", ")}`); }
	}
	resetWorktree();
	if (!baselineOk) { log("seat-mutate: baseline not green — refusing to judge mutations"); process.exitCode = 2; }
	else {
		for (const p of pairs) {
			resetWorktree();
			const miss = applyEdits(p);
			if (miss) { tally.anchorMiss++; log(`ANCHOR-MISS ${p.n} ${p.name} — ${miss}`); continue; }
			const diff = git("-C", WT, "diff", "--shortstat").stdout.trim() || "untracked only";
			let bad = null;
			for (const f of new Set(p.edits.map((e) => e.file).filter(Boolean))) {
				if (!/\.(mjs|js)$/.test(f)) continue;
				const chk = sh(process.execPath, ["--check", path.join(WT, f)]);
				if (chk.status !== 0) { bad = `${f}: ${chk.stderr.split("\n").slice(0, 4).join(" ")}`; break; }
			}
			if (bad) { tally.syntax++; log(`SYNTAX ${p.n} ${p.name} — ${bad}`); continue; }
			if (p.commit) { const c = commitScratch(p); if (c) { tally.anchorMiss++; log(`ANCHOR-MISS ${p.n} ${p.name} — ${c}`); continue; } }
			tally.runnable++;
			const judged = p.expectRed;
			const declared = p.alsoRed ?? [];
			const allFails = [], passTitles = [], crashed = [];
			for (const rel of p.tests) {
				const r = await runTest(rel);
				passTitles.push(...lineTitles(r.out, "PASS"));
				allFails.push(...lineTitles(r.out, "FAIL").map((t) => ({ rel, t })));
				if (fileCrashed(r.out)) crashed.push(`${path.basename(rel)} THREW (later checks never ran): ${short(r.out.trim().split("\n").filter((l) => /^[A-Za-z]*Error\b/.test(l)).at(-1) ?? "", 120)}`);
				else if ((r.code !== 0 || r.timedOut) && !lineTitles(r.out, "FAIL").length) crashed.push(`${path.basename(rel)} exit ${r.code}${r.timedOut ? " (timeout)" : ""}: ${short(r.out.trim().split("\n").slice(-3).join(" / "), 160)}`);
			}
			const failed = (title) => allFails.some(({ t }) => isTitle(t, title));
			const matched = judged.filter(failed);
			const namedGreen = judged.filter((s) => !failed(s) && passTitles.some((t) => isTitle(t, s)));
			const notReached = judged.filter((s) => !failed(s) && !passTitles.some((t) => isTitle(t, s)));
			const declaredRed = declared.filter(failed);
			const declaredGreen = declared.filter((s) => !failed(s));
			const unnamed = allFails.filter(({ t }) => ![...judged, ...declared].some((s) => isTitle(t, s)));
			const extra = `${declaredRed.length ? `; also (declared): ${declaredRed.map((s) => short(s, 80)).join(" | ")}` : ""}${declaredGreen.length ? `; declared but GREEN: ${declaredGreen.map((s) => JSON.stringify(s)).join(", ")}` : ""}${namedGreen.length ? `; named but GREEN: ${namedGreen.map((s) => JSON.stringify(s)).join(", ")}` : ""}${notReached.length ? `; named but NOT REACHED: ${notReached.map((s) => JSON.stringify(s)).join(", ")}` : ""}${unnamed.length ? `; UNNAMED red: ${unnamed.map(({ rel, t }) => `[${path.basename(rel)}] ${short(t, 110)}`).join(" | ")}` : ""}; ${allFails.length} FAIL total (${diff}${p.commit ? ", committed on the scratch HEAD" : ""})${crashed.length ? `; CRASH ${crashed.join(" || ")}` : ""}`;
			if (p.expectGreen) {
				const greenSeen = p.expectGreen.filter((s) => passTitles.some((t) => isTitle(t, s)));
				if (!allFails.length && !crashed.length && greenSeen.length === p.expectGreen.length) {
					tally.stayGreen++;
					log(`GREEN ${p.n} ${p.name} — stays green (expected): ${greenSeen.length}/${p.expectGreen.length} named titles PASS${extra}`);
				} else {
					tally.stayRed++;
					stayRed.push(p.n);
					const missing = p.expectGreen.filter((s) => !greenSeen.includes(s));
					log(`RED ${p.n} ${p.name} — UNEXPECTED (a stay pair must stay green)${missing.length ? `; not PASS: ${missing.map((s) => JSON.stringify(s)).join(", ")}` : ""}${extra}`);
				}
			} else if (matched.length) {
				tally.red++;
				if (namedGreen.length || notReached.length) tally.namedGreen++;
				if (unnamed.length) tally.unnamedRed++;
				if (!namedGreen.length && !notReached.length && !unnamed.length) tally.exact++;
				log(`RED ${p.n} ${p.name} — ${matched.map((t) => short(t, 100)).join(" | ")}${extra}`);
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
		removeWorktree(WT);
		fs.rmSync(SCRATCH, { recursive: true, force: true });
	}
}
const redRunnable = tally.runnable - tally.stayGreen - tally.stayRed;
log(`RESULT: ${tally.red}/${redRunnable} red (${tally.exact} exactly their named titles, ${tally.namedGreen} with a named title green, ${tally.unnamedRed} with an unnamed red), ${tally.survived} survived${survivors.length ? ` [${survivors.join(", ")}]` : ""}, stay-green ${tally.stayGreen}/${tally.stayGreen + tally.stayRed}${stayRed.length ? ` (RED: ${stayRed.join(", ")})` : ""}${tally.anchorMiss ? `, ${tally.anchorMiss} ANCHOR-MISS` : ""}${tally.syntax ? `, ${tally.syntax} SYNTAX` : ""}`);
if (tally.anchorMiss || tally.syntax) process.exitCode = 3;
