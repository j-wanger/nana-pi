#!/usr/bin/env node
// Seat mutation runner for lane process (frozen table; CHANGE.md §5 "Wrong code first", 47 row-clause
// pairs + 6 kept-clause pairs K1-K6). For each pair: apply the wrong CODE or shipped TEXT in a detached
// scratch worktree of the lane tip, refuse when an anchor does not occur exactly once (ANCHOR-MISS =
// runner bug), syntax-check a mutated module, run the named test files with node exactly as
// scripts/test.mjs does (package-dir cwd, fresh HOME/TMPDIR, NANA_* but NANA_TEST_* and
// PI_CODING_AGENT_DIR scrubbed, --experimental-strip-types), and print RED / GREEN (SURVIVED).
// A RED line also lists every named title that stayed GREEN and every UNNAMED red, so "reds exactly
// the titles named" is judged, not assumed.
//
// Seat correction to §5 (known before this runner was written): copier renders UNCOMMITTED template
// changes (copier _vcs.py:421-442), so a shared-text pair does NOT red the python/typescript
// "rendered AGENTS.md marker region matches shared bytes and follows a paragraph" titles. Those
// titles are therefore not expected here; if one goes red it shows as an UNNAMED red. Every pair
// below keeps a direct title of its own, so none is left with a rendered title as its only red.
//
// Never touches the lane worktree or the main checkout: everything runs in one detached scratch
// worktree under the OS temp folder, removed at the end.
// Usage: SEAT_MUTATE_OUT=<file> [SEAT_MUTATE_TIP=<rev>] node seat-mutate.mjs [pair-id ...]
import { spawnSync, spawn } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const LANE_REPO = "/Users/example/nana-pi-wt/process";
// The tip under test: SEAT_MUTATE_TIP, else the lane branch head (written against fdfe9fe).
const TIP = process.env.SEAT_MUTATE_TIP || "feat/process";
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "proc-seat-mutate-"));
const WT = path.join(SCRATCH, "wt");
const RUNS = path.join(SCRATCH, "runs");
const TIMEOUT_MS = 10 * 60 * 1000;

// ── test files ──────────────────────────────────────────────────────────────────────────────
const TR = "packages/nana-pack/tests/templates-render.test.mjs";
const IR = "packages/nana-pack/tests/immutable-review.test.mjs";
const RS = "packages/nana-pack/tests/review-standard.test.mjs";
const WL = "packages/nana-pack/tests/worker-lane.test.mjs";
const FM = "packages/nana-setup/tests/fresh-machine.test.mjs";

// ── mutated files ───────────────────────────────────────────────────────────────────────────
const SHARED = "templates/_shared/working-under-nana-pi.md";
const AGENTS = "AGENTS.md"; // CLAUDE.md is a symlink to it; holds the marker region copy (R-859)
const STANDARD = "packages/nana-pack/prompts/review-standard.md";
const PREAMBLE = "packages/nana-pack/prompts/builder-preamble.md";
const PIREVIEW = "packages/nana-pack/bin/pi-review.mjs";
const README = "README.md";

// ── titles (exact, as frozen in seat-titles.mjs / the suite) ────────────────────────────────
const T = {
	R1100: "shared working pattern requires a threat model per plan",
	R1101: "shared working pattern caps plan review at one or two rounds",
	R1102: "shared working pattern freezes edits after an all-LAND review",
	R1103: "shared working pattern ships urgent fixes alone",
	R1104: "shared working pattern states the review bar for seats",
	R1105: "pi-review appends the review standard text once after the immutable sentence",
	R1106m: "missing review standard is refused before admission",
	R1106d: "directory at the review standard path is refused before admission",
	R1106b: "blank review standard is refused before admission",
	R1107: "review standard asks for a last-line LAND or SEND-BACK verdict",
	R1108: "review standard defines a MUST and limits confirmation rounds to the delta",
	R1109: "AGENTS.md carries the macOS install check outside the shared region",
	R1111: "fresh-machine step 8 trusts the clone before doctor",
	R683: "shared working pattern names generic defaults and local overrides",
	R859: "AGENTS.md marker-owned section is byte-identical to the shared file",
	R974: "dirty working state is reproduced exactly and reviewer runs in the immutable checkout",
	R628: "lane preamble forbids the named package-manager operations at a worktree root",
	R961: "verified lane passes preamble and validated brief as ordered file paths",
	R950: "fresh-machine checklist has eight ordered actions",
};
const P = (key) => `lane preamble carries: ${key}`; // R-1110 titles

// Shared-text pairs edit the shared file and the AGENTS.md region alike, so root R-859 stays green.
const both = (anchor, replacement) => [{ file: SHARED, anchor, replacement }, { file: AGENTS, anchor, replacement }];
const one = (file, anchor, replacement) => [{ file, anchor, replacement }];

// ── pi-review.mjs anchors (R-1105, R-1106, K2) ──────────────────────────────────────────────
const IMMUTABLE_ARG = "'--append-system-prompt', `Your cwd is an immutable checkout of revision ${sourceRevision} at ${tempRoot}; read files there, not in other worktrees`, ";
const STANDARD_ARG_TAIL = ", '--append-system-prompt', reviewStandardText]";
const CATCH_HEAD = "} catch (e) {\n  process.stderr.write(`pi-review: review standard refused: ${e.code === 'ENOENT'";
const CATCH_TAIL = "  process.exit(1);\n}\nif (!reviewStandardText.trim()) {";
const BLANK_CHECK = "if (!reviewStandardText.trim()) {\n  process.stderr.write(`pi-review: review standard refused: ${reviewStandardPath} is blank\\n`);\n  process.exit(1);\n}\n";
const READ_BLOCK = "try {\n  if (!statSync(REVIEW_STANDARD_URL).isFile()) throw new Error(`${reviewStandardPath} is not a regular file`);\n  reviewStandardText = readFileSync(REVIEW_STANDARD_URL, 'utf8');\n} catch (e) {\n  process.stderr.write(`pi-review: review standard refused: ${e.code === 'ENOENT' ? `${reviewStandardPath} is missing` : e.message}\\n`);\n  process.exit(1);\n}\n" + BLANK_CHECK;
const ADM_WARNING = "  if (adm.warning) process.stderr.write(`pi-review: WARNING: ${adm.warning}\\n`);\n";
// "go on without the standard": the read sets null, the blank check skips null, the argv omits it.
const goOn = (cond) => [
	{ file: PIREVIEW, anchor: CATCH_HEAD, replacement: `} catch (e) {\n  if (${cond}) reviewStandardText = null; else {\n  process.stderr.write(\`pi-review: review standard refused: \${e.code === 'ENOENT'` },
	{ file: PIREVIEW, anchor: CATCH_TAIL, replacement: "  process.exit(1);\n  }\n}\nif (reviewStandardText !== null && !reviewStandardText.trim()) {" },
	{ file: PIREVIEW, anchor: STANDARD_ARG_TAIL, replacement: ", ...(reviewStandardText === null ? [] : ['--append-system-prompt', reviewStandardText])]" },
];

// ── the shipped text anchors ────────────────────────────────────────────────────────────────
const INSTALL_STEP = "### Install check before a land\n\nLand checklist, nana-pi only (Owner, 2026-10-12): a lane that touches `packages/nana-setup/` or a hook runs `node packages/nana-setup/bin/install-check.mjs` locally on macOS before `nana-land`, because `nana-land` reads no CI result.\n\n";
const REGION_END = "<!-- nana:working-under-nana-pi end -->";
const STEP8 = "8. Run `nana-setup trust ~/nana-pi` (it asks before it records), then `nana-setup doctor` from `~/nana-pi`; expect `all good`.";
const pre = (line) => `- ${line}\n`;
const L = {
	wrong: "Wrong code first: run each new test against the obvious wrong implementation and see it fail before you write the code.",
	cls: "Fix the class, not the named example: cover every alias, option form and input shape the rule names.",
	await: "A test harness awaits every async case under a per-case limit.",
	crlf: "A change that reads text line by line gets CRLF, trailing space or tab, and no-final-newline cases.",
	ids: "New requirement rows take IDs only from the range your brief names.",
	seat: "No suite test runs, imports or copies a seat script.",
	del: "Never delete a test your brief does not name.",
	touched: "Each commit follows a green run of the tests your change touches; your last commit follows a green full suite.",
	done: "Run every seat check your brief names on your last commit. DONE means each one passes; a title check passes only at `0 missing`.",
	long: "Send long script output to a committed file and paste only the lines your brief asks for.",
	ci: "When your brief asks for CI, read the finished run once and report. Do not wait for another notification.",
	pm: "Never run pnpm, npm, or npx install, exec, add, or dlx at a worktree root; render a template project into a temp directory and use that project's toolchain there.",
};
const REPORT_LINE = "Then commits; per item, files, rows, mutation pairs, commands and exit codes; the suite summary line with its check count; and what was not done.\n";

// Frozen table. `edits` are applied in order; `expectRed` are exact titles the CHANGE says go red.
const PAIRS = [
	// R-1100 (3) — shared file + region
	{ n: "1100a", name: "delete \"every plan names its threat model\"", edits: both("- Plans: every plan names its threat model: honest", "- Plans: honest"), tests: [TR], expectRed: [T.R1100] },
	{ n: "1100b", name: "delete \"deliberate forgery is out\"", edits: both("is in scope, deliberate forgery is out, and a finding", "is in scope, and a finding"), tests: [TR], expectRed: [T.R1100] },
	{ n: "1100c", name: "delete \"a finding outside the model is a residual\"", edits: both("deliberate forgery is out, and a finding outside the model is a residual.", "deliberate forgery is out."), tests: [TR], expectRed: [T.R1100] },
	// R-1101 (2)
	{ n: "1101a", name: "gate-or-format plan rounds \"two\" -> \"three\"", edits: both("a gate or format lane two;", "a gate or format lane three;"), tests: [TR], expectRed: [T.R1101] },
	{ n: "1101b", name: "delete \"only a named fail-open bug reopens the plan\"", edits: both("lane two; after that only a named fail-open bug reopens the plan.", "lane two."), tests: [TR], expectRed: [T.R1101] },
	// R-1102 (1)
	{ n: "1102", name: "delete the LAND-freeze sentence", edits: both(" Once every reviewer says LAND, nothing more is edited.", ""), tests: [TR], expectRed: [T.R1102] },
	// R-1103 (2)
	{ n: "1103a", name: "delete \"Urgent fixes ship alone\"", edits: both("Urgent fixes ship alone and are hardened in a later lane.", "Fixes are hardened in a later lane."), tests: [TR], expectRed: [T.R1103] },
	{ n: "1103b", name: "delete \"are hardened in a later lane\"", edits: both("Urgent fixes ship alone and are hardened in a later lane.", "Urgent fixes ship alone."), tests: [TR], expectRed: [T.R1103] },
	// R-1104 (4)
	{ n: "1104a", name: "delete the `pi-review` appends-the-standard sentence", edits: both("- Review bar: `pi-review` appends the review standard to every review it runs, so its briefs state the threat model and lane class but not the bar. A review", "- Review bar: A review"), tests: [TR], expectRed: [T.R1104] },
	{ n: "1104b", name: "delete \"no MUST finding says LAND\"", edits: both("A review with no MUST finding says LAND; LAND-WITH-FIXES", "LAND-WITH-FIXES"), tests: [TR], expectRed: [T.R1104] },
	{ n: "1104c", name: "delete \"LAND-WITH-FIXES is retired\"", edits: both("says LAND; LAND-WITH-FIXES is retired because `nana-land` accepts only LAND.", "says LAND; `nana-land` accepts only LAND."), tests: [TR], expectRed: [T.R1104] },
	{ n: "1104d", name: "delete the confirmation-round sentence", edits: both(" A confirmation round reviews only the change since the last round, and its brief names that revision.", ""), tests: [TR], expectRed: [T.R1104] },
	// R-1105 (4) — pi-review.mjs
	{ n: "1105a", name: "no second --append-system-prompt (standard never appended)", edits: one(PIREVIEW, STANDARD_ARG_TAIL, "]"), tests: [IR, RS], expectRed: [T.R1105] },
	{ n: "1105b", name: "append the standard twice", edits: one(PIREVIEW, STANDARD_ARG_TAIL, ", '--append-system-prompt', reviewStandardText, '--append-system-prompt', reviewStandardText]"), tests: [IR, RS], expectRed: [T.R1105] },
	{ n: "1105c", name: "append the standard's PATH instead of its text", edits: one(PIREVIEW, STANDARD_ARG_TAIL, ", '--append-system-prompt', reviewStandardPath]"), tests: [IR, RS], expectRed: [T.R1105] },
	// 1105d: §5 also names R-974's title; that check reads includes(immutable sentence), not its position,
	// so the runner keeps §5's expectation and reports the R-974 title as "named but GREEN" if it holds.
	{ n: "1105d", name: "append the standard before the immutable sentence", edits: one(PIREVIEW, IMMUTABLE_ARG + "'--append-system-prompt', reviewStandardText]", "'--append-system-prompt', reviewStandardText, " + IMMUTABLE_ARG.replace(/, $/, "") + "]"), tests: [IR, RS], expectRed: [T.R1105, T.R974] },
	// R-1106 (4) — pi-review.mjs
	{ n: "1106a", name: "skip the read when the file is missing (go on without it)", edits: goOn("e.code === 'ENOENT'"), tests: [RS, IR], expectRed: [T.R1106m] },
	{ n: "1106b", name: "on a read error other than ENOENT append nothing and go on", edits: goOn("e.code !== 'ENOENT'"), tests: [RS, IR], expectRed: [T.R1106d] },
	{ n: "1106c", name: "no blank check", edits: one(PIREVIEW, BLANK_CHECK, ""), tests: [RS, IR], expectRed: [T.R1106b] },
	{ n: "1106d", name: "read the standard after admit()", edits: [{ file: PIREVIEW, anchor: READ_BLOCK, replacement: "" }, { file: PIREVIEW, anchor: ADM_WARNING, replacement: ADM_WARNING + READ_BLOCK }], tests: [RS, IR], expectRed: [T.R1106m, T.R1106d, T.R1106b] },
	// R-1107 (4) — review-standard.md
	{ n: "1107a", name: "\"last line\" -> \"first line\"", edits: one(STANDARD, "The last line of your answer", "The first line of your answer"), tests: [RS, IR], expectRed: [T.R1107] },
	{ n: "1107b", name: "`SEND-BACK` -> `BLOCK`", edits: one(STANDARD, "`VERDICT: SEND-BACK`", "`VERDICT: BLOCK`"), tests: [RS, IR], expectRed: [T.R1107] },
	{ n: "1107c", name: "delete the score clause", edits: one(STANDARD, ", optionally followed by a score such as 9/10", ""), tests: [RS, IR], expectRed: [T.R1107] },
	{ n: "1107d", name: "delete \"Do not use LAND-WITH-FIXES\"", edits: one(STANDARD, " Do not use LAND-WITH-FIXES.", ""), tests: [RS, IR], expectRed: [T.R1107] },
	// R-1108 (3) — review-standard.md
	{ n: "1108a", name: "delete \"a realistic input under the brief's threat model\"", edits: one(STANDARD, "A MUST names a realistic input under the brief's threat model and a consequence", "A MUST names a consequence"), tests: [RS, IR], expectRed: [T.R1108] },
	{ n: "1108b", name: "delete the consequence list", edits: one(STANDARD, "a consequence that matters: data lost or corrupted, a security or review boundary bypassed in practice, wrong output someone acts on, a broken install or hook, or a regression of behaviour main has today.", "a consequence that matters."), tests: [RS, IR], expectRed: [T.R1108] },
	{ n: "1108c", name: "delete the confirmation-round sentence", edits: one(STANDARD, "A confirmation round reviews only the change since the revision the brief names as the last round, and whether the named MUSTs are closed.\n", ""), tests: [RS, IR], expectRed: [T.R1108] },
	// R-1109 (5) — AGENTS.md outside the region
	{ n: "1109a", name: "install-check subsection inside the shared region (AGENTS.md only)", edits: [{ file: AGENTS, anchor: INSTALL_STEP, replacement: "" }, { file: AGENTS, anchor: REGION_END, replacement: "\n" + INSTALL_STEP.replace(/\n\n$/, "\n") + REGION_END }], tests: [TR], expectRed: [T.R1109, T.R859] },
	{ n: "1109b", name: "install-check path misspelt", edits: one(AGENTS, "`node packages/nana-setup/bin/install-check.mjs`", "`node packages/nana-setup/bin/install-chek.mjs`"), tests: [TR], expectRed: [T.R1109] },
	{ n: "1109c", name: "delete \"on macOS\"", edits: one(AGENTS, " locally on macOS before `nana-land`", " locally before `nana-land`"), tests: [TR], expectRed: [T.R1109] },
	{ n: "1109d", name: "delete \"before `nana-land`\"", edits: one(AGENTS, "locally on macOS before `nana-land`, because", "locally on macOS, because"), tests: [TR], expectRed: [T.R1109] },
	{ n: "1109e", name: "delete \"or a hook\"", edits: one(AGENTS, "touches `packages/nana-setup/` or a hook runs", "touches `packages/nana-setup/` runs"), tests: [TR], expectRed: [T.R1109] },
	// R-1110 (13) — builder-preamble.md: delete each pinned rule line; duplicate one line
	{ n: "1110a", name: "delete the wrong-code-first line", edits: one(PREAMBLE, pre(L.wrong), ""), tests: [WL], expectRed: [P("wrong code first")] },
	{ n: "1110b", name: "delete the fix-the-class line", edits: one(PREAMBLE, pre(L.cls), ""), tests: [WL], expectRed: [P("fix the class")] },
	{ n: "1110c", name: "delete the await-every-async-case line", edits: one(PREAMBLE, pre(L.await), ""), tests: [WL], expectRed: [P("await every async case")] },
	{ n: "1110d", name: "delete the CRLF-and-whitespace line", edits: one(PREAMBLE, pre(L.crlf), ""), tests: [WL], expectRed: [P("CRLF and whitespace cases")] },
	{ n: "1110e", name: "delete the IDs-from-the-brief's-range line", edits: one(PREAMBLE, pre(L.ids), ""), tests: [WL], expectRed: [P("IDs from the brief's range")] },
	{ n: "1110f", name: "delete the no-seat-script line", edits: one(PREAMBLE, pre(L.seat), ""), tests: [WL], expectRed: [P("no suite test runs a seat script")] },
	{ n: "1110g", name: "delete the no-unnamed-test-deleted line", edits: one(PREAMBLE, pre(L.del), ""), tests: [WL], expectRed: [P("no unnamed test deleted")] },
	{ n: "1110h", name: "delete the touched-tests/full-suite line", edits: one(PREAMBLE, pre(L.touched), ""), tests: [WL], expectRed: [P("touched tests before each commit and the full suite before the last")] },
	{ n: "1110i", name: "delete the seat-checks-before-DONE line", edits: one(PREAMBLE, pre(L.done), ""), tests: [WL], expectRed: [P("seat checks before DONE")] },
	{ n: "1110j", name: "delete the long-output line", edits: one(PREAMBLE, pre(L.long), ""), tests: [WL], expectRed: [P("long output to a committed file")] },
	{ n: "1110k", name: "delete the read-CI-once line", edits: one(PREAMBLE, pre(L.ci), ""), tests: [WL], expectRed: [P("read CI once")] },
	{ n: "1110l", name: "delete the report line carrying the suite check count", edits: one(PREAMBLE, REPORT_LINE, ""), tests: [WL], expectRed: [P("the suite check count in the report")] },
	{ n: "1110m", name: "duplicate one rule line (fix the class)", edits: one(PREAMBLE, pre(L.cls), pre(L.cls) + pre(L.cls)), tests: [WL], expectRed: [P("fix the class")] },
	// R-1111 (2) — README step 8
	{ n: "1111a", name: "no trust command in step 8", edits: one(README, STEP8, "8. Run `nana-setup doctor` from `~/nana-pi`; expect `all good`."), tests: [FM], expectRed: [T.R1111] },
	{ n: "1111b", name: "trust after doctor in step 8", edits: one(README, STEP8, "8. Run `nana-setup doctor` from `~/nana-pi`, then `nana-setup trust ~/nana-pi` (it asks before it records); expect `all good`."), tests: [FM], expectRed: [T.R1111] },
	// Kept clauses K1-K6
	{ n: "K1", name: "\"three rounds\" -> \"two rounds\" in both copies", edits: both("Maximum three rounds per item", "Maximum two rounds per item"), tests: [TR], expectRed: [T.R683] },
	{ n: "K2", name: "no immutable sentence", edits: one(PIREVIEW, IMMUTABLE_ARG, ""), tests: [IR, RS], expectRed: [T.R974, T.R1105] },
	{ n: "K3", name: "the R-628 package-manager line deleted", edits: one(PREAMBLE, pre(L.pm), ""), tests: [WL], expectRed: [T.R628] },
	{ n: "K4", name: "\"on branch {{BRANCH}}\" dropped", edits: one(PREAMBLE, "{{WORKTREE}} on branch {{BRANCH}}.", "{{WORKTREE}}."), tests: [WL], expectRed: [T.R961] },
	{ n: "K5", name: "a space inside the region only (AGENTS.md)", edits: one(AGENTS, "- Review bar: `pi-review`", "- Review bar:  `pi-review`"), tests: [TR], expectRed: [T.R859] },
	{ n: "K6", name: "step 8 split in two", edits: one(README, STEP8, "8. Run `nana-setup trust ~/nana-pi` (it asks before it records).\n9. Run `nana-setup doctor` from `~/nana-pi`; expect `all good`."), tests: [FM], expectRed: [T.R950, T.R1111] },
];

// ── plumbing ────────────────────────────────────────────────────────────────────────────────
const sh = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: "utf8", ...opts });
const git = (...args) => sh("git", args);
const count = (hay, needle) => hay.split(needle).length - 1;
const SCRUB = (k) => (/^NANA_/.test(k) && !/^NANA_TEST_/.test(k)) || k === "PI_CODING_AGENT_DIR";
const BASE_ENV = (() => {
	const e = { ...process.env };
	for (const k of Object.keys(e)) if (SCRUB(k)) delete e[k];
	const c = Number.isSafeInteger(Number(e.GIT_CONFIG_COUNT)) && Number(e.GIT_CONFIG_COUNT) >= 0 ? Number(e.GIT_CONFIG_COUNT) : 0;
	e[`GIT_CONFIG_KEY_${c}`] = "gc.auto";
	e[`GIT_CONFIG_VALUE_${c}`] = "0";
	e.GIT_CONFIG_COUNT = String(c + 1);
	return e;
})();
let runSeq = 0;

function addWorktree(dir, ref) {
	if (fs.existsSync(dir)) { git("-C", LANE_REPO, "worktree", "remove", "--force", dir); fs.rmSync(dir, { recursive: true, force: true }); }
	git("-C", LANE_REPO, "worktree", "prune");
	const r = git("-C", LANE_REPO, "worktree", "add", "--detach", dir, ref);
	if (r.status !== 0) throw new Error(`worktree add ${ref} failed: ${r.stderr}`);
}
function removeWorktree(dir) {
	git("-C", LANE_REPO, "worktree", "remove", "--force", dir);
	fs.rmSync(dir, { recursive: true, force: true });
	git("-C", LANE_REPO, "worktree", "prune");
}
function resetWorktree() {
	git("-C", WT, "checkout", "--", ".");
	git("-C", WT, "clean", "-fdq"); // only the scratch worktree; tests may leave untracked files
	const st = git("-C", WT, "status", "--porcelain");
	if (st.stdout.trim()) throw new Error(`scratch worktree not clean after reset:\n${st.stdout}`);
}

/** Run one test file the way scripts/test.mjs does; resolve { code, out, timedOut, secs }. */
function runTest(rel) {
	const file = path.join(WT, rel);
	const cwd = path.dirname(path.dirname(file)); // the package dir (every file here is <pkg>/tests/x)
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
			fs.rmSync(home, { recursive: true, force: true });
			fs.rmSync(tmp, { recursive: true, force: true });
			resolve({ code: code ?? (signal ? 128 : 1), out, timedOut, secs: ((Date.now() - t0) / 1000).toFixed(1) });
		});
	});
}
const lineTitles = (out, tag) => out.split("\n").filter((l) => l.startsWith(`${tag} `)).map((l) => l.slice(tag.length + 1).trim());
const isTitle = (t, title) => t === title || t.startsWith(`${title} `);
const short = (s, n = 110) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

let logFile = null;
const log = (line) => { console.log(line); if (logFile) fs.appendFileSync(logFile, line + "\n"); };

// ── main ────────────────────────────────────────────────────────────────────────────────────
const only = process.argv.slice(2);
const pairs = only.length ? PAIRS.filter((p) => only.includes(p.n)) : PAIRS;
logFile = process.env.SEAT_MUTATE_OUT || null;
if (logFile) fs.writeFileSync(logFile, "");

fs.rmSync(RUNS, { recursive: true, force: true });
fs.mkdirSync(RUNS, { recursive: true });
const tipSha = git("-C", LANE_REPO, "rev-parse", TIP).stdout.trim();
log(`seat-mutate: lane process, tip ${tipSha}, ${pairs.length} pairs, node ${process.version}, ${new Date().toISOString()}`);
addWorktree(WT, tipSha);

const tally = { red: 0, exact: 0, namedGreen: 0, unnamedRed: 0, survived: 0, anchorMiss: 0, syntax: 0, runnable: 0 };
const survivors = [];
const basePass = {};
try {
	// Baseline: every named file, unmutated, must exit 0 with no FAIL line.
	const files = [...new Set(pairs.flatMap((p) => p.tests))];
	let baselineOk = true;
	for (const rel of files) {
		const r = await runTest(rel);
		const fl = lineTitles(r.out, "FAIL");
		const ok = r.code === 0 && !r.timedOut && fl.length === 0;
		log(`BASELINE ${ok ? "ok  " : "FAIL"} ${rel} (exit ${r.code}, ${lineTitles(r.out, "PASS").length} PASS, ${lineTitles(r.out, "SKIP").length} SKIP, ${fl.length} FAIL, ${r.secs}s)${ok ? "" : " — " + fl.slice(0, 3).map((t) => short(t)).join(" | ")}`);
		if (!ok) baselineOk = false;
		basePass[rel] = lineTitles(r.out, "PASS");
	}
	// Every expected title must be a PASS line in the baseline, or the pair cannot be judged.
	for (const p of pairs) for (const title of p.expectRed) {
		const seen = p.tests.some((rel) => (basePass[rel] ?? []).some((t) => isTitle(t, title)));
		if (!seen) { baselineOk = false; log(`BASELINE MISSING title for pair ${p.n}: ${JSON.stringify(title)} is not a PASS line in ${p.tests.join(", ")}`); }
	}
	resetWorktree();
	if (!baselineOk) { log("seat-mutate: baseline not green — refusing to judge mutations"); process.exitCode = 2; }
	else {
		for (const p of pairs) {
			resetWorktree();
			let miss = null;
			for (const e of p.edits) {
				const abs = path.join(WT, e.file);
				const text = fs.readFileSync(abs, "utf8");
				const c = count(text, e.anchor);
				if (c !== 1) { miss = `${e.file}: anchor occurs ${c}× — ${short(JSON.stringify(e.anchor), 90)}`; break; }
				fs.writeFileSync(abs, text.replace(e.anchor, () => e.replacement));
			}
			if (miss) { tally.anchorMiss++; log(`ANCHOR-MISS ${p.n} ${p.name} — ${miss}`); continue; }
			const diff = git("-C", WT, "diff", "--shortstat").stdout.trim();
			let bad = null;
			for (const f of new Set(p.edits.map((e) => e.file))) {
				if (!/\.(mjs|js)$/.test(f)) continue;
				const chk = sh(process.execPath, ["--check", path.join(WT, f)]);
				if (chk.status !== 0) { bad = `${f}: ${chk.stderr.split("\n").slice(0, 4).join(" ")}`; break; }
			}
			if (bad) { tally.syntax++; log(`SYNTAX ${p.n} ${p.name} — ${bad}`); continue; }
			tally.runnable++;
			const allFails = [];
			const passTitles = [];
			const crashed = [];
			for (const rel of p.tests) {
				const r = await runTest(rel);
				passTitles.push(...lineTitles(r.out, "PASS"));
				allFails.push(...lineTitles(r.out, "FAIL").map((t) => ({ rel, t })));
				// An uncaught throw ends the file early: checks after it never print, so a named case
				// that is absent from the output was NOT green — it was never reached.
				const thrown = r.out.split("\n").find((l) => /^[A-Za-z]*Error\b[^\n]*:/.test(l));
				if (thrown) crashed.push(`${path.basename(rel)} THREW (later checks never ran): ${short(thrown, 120)}`);
				else if ((r.code !== 0 || r.timedOut) && !lineTitles(r.out, "FAIL").length) crashed.push(`${path.basename(rel)} exit ${r.code}${r.timedOut ? " (timeout)" : ""}: ${short(r.out.trim().split("\n").slice(-3).join(" / "), 160)}`);
			}
			const failed = (title) => allFails.some(({ t }) => isTitle(t, title));
			const matched = p.expectRed.filter(failed);
			const namedGreen = p.expectRed.filter((s) => !failed(s) && passTitles.some((t) => isTitle(t, s)));
			const notReached = p.expectRed.filter((s) => !failed(s) && !passTitles.some((t) => isTitle(t, s)));
			const unnamed = allFails.filter(({ t }) => !p.expectRed.some((s) => isTitle(t, s)));
			const extra = `${namedGreen.length ? `; named but GREEN: ${namedGreen.map((s) => JSON.stringify(s)).join(", ")}` : ""}${notReached.length ? `; named but NOT REACHED: ${notReached.map((s) => JSON.stringify(s)).join(", ")}` : ""}${unnamed.length ? `; UNNAMED red: ${unnamed.map(({ rel, t }) => `[${path.basename(rel)}] ${short(t, 90)}`).join(" | ")}` : ""}; ${allFails.length} FAIL total (${diff})${crashed.length ? `; CRASH ${crashed.join(" || ")}` : ""}`;
			if (matched.length) {
				tally.red++;
				if (namedGreen.length || notReached.length) tally.namedGreen++;
				if (unnamed.length) tally.unnamedRed++;
				if (!namedGreen.length && !notReached.length && !unnamed.length) tally.exact++;
				log(`RED ${p.n} ${p.name} — ${matched.map((t) => short(t, 90)).join(" | ")}${extra}`);
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
	try { resetWorktree(); } catch (e) { log(`seat-mutate: reset failed at cleanup: ${e.message}`); }
	removeWorktree(WT);
	fs.rmSync(SCRATCH, { recursive: true, force: true });
}
log(`seat-mutate: ${tally.red}/${tally.runnable} red (${tally.exact} exactly their named titles, ${tally.namedGreen} with a named title green, ${tally.unnamedRed} with an unnamed red), ${tally.survived} survived${survivors.length ? ` [${survivors.join(", ")}]` : ""}${tally.anchorMiss ? `, ${tally.anchorMiss} ANCHOR-MISS` : ""}${tally.syntax ? `, ${tally.syntax} SYNTAX` : ""}`);
if (tally.anchorMiss || tally.syntax) process.exitCode = 3;
