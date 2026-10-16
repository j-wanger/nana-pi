#!/usr/bin/env node
// Seat mutation runner for lane regroup (CHANGE.md §5 "Wrong code first": 80 pairs in nine table rows, as revised by the
// "Seat revision" and "Plan review r1" sections appended at its end; plus build brief 1's clarification 5 pair C5).
// Form copied from docs/reviews/lift-2026-10-14/seat-mutate.mjs.
// For each pair: apply the wrong code or shipped text (never a test assertion) in a detached scratch worktree of the
// lane tip, refuse when an anchor does not occur the stated number of times (ANCHOR-MISS = runner bug), syntax-check
// every mutated module, run the named test files with node exactly as scripts/test.mjs does (package-dir cwd, fresh
// HOME/USERPROFILE/TMPDIR/TEMP/TMP, NANA_* but NANA_TEST_* and PI_CODING_AGENT_DIR scrubbed, gc.auto=0 through
// GIT_CONFIG_*, --experimental-strip-types, and the npm_config_prefix/globalconfig/userconfig that `npm test` exports
// when the runner itself was not started through npm), and print RED / GREEN (SURVIVED). A RED line also lists every
// named title that stayed GREEN and every UNNAMED red, so "reds exactly the titles named" is judged, not assumed.
//
// Pair ids: §5's table rows are numbered 1, 2, 4, 5, ..., 10 (there is no row 3); each "/"- or "·"-separated variant
// runs as a separate pair "row/k" (k = position in that row, counting across its "·" groups), each judged alone.
//
// Seat corrections and readings (declared before the run; each prints as a DECLARED line, never hidden): see DECLARED.
//
// Never touches the lane worktree or the main checkout: everything runs in one detached scratch worktree in a
// mkdtemp folder under os.tmpdir() (never inside the lane folder), removed at the end
// (SEAT_MUTATE_KEEP=1 keeps it for inspection); git writes only its worktree metadata into the shared .git.
// SEAT_MUTATE_DRY=1 applies and syntax-checks every pair's edits and runs no test (an anchor check).
// Usage: SEAT_MUTATE_OUT=<file> [SEAT_MUTATE_TIP=<rev>] [SEAT_MUTATE_DRY=1] [SEAT_MUTATE_LOGDIR=<dir>] node seat-mutate.mjs [pair-id ...]
import { spawnSync, spawn } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const LANE_REPO = "/Users/jwang/nana-pi-wt/regroup";
const LANE_BRANCH = "feat/regroup";
const TIP = process.env.SEAT_MUTATE_TIP || "f9ed5500a950d7b3b9931be8d342908a8c3aac42";
const HERE = path.dirname(fileURLToPath(import.meta.url));
// os.tmpdir(), never beside this script or inside the lane folder (copier-based suite tests break in a nested worktree).
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "regroup-seat-mutate-"));
const WT = path.join(SCRATCH, "wt");
const RUNS = path.join(SCRATCH, "runs");
const KEEP = process.env.SEAT_MUTATE_KEEP === "1";
const DRY = process.env.SEAT_MUTATE_DRY === "1";
const LOGDIR = process.env.SEAT_MUTATE_LOGDIR || null; // per-pair test output, for evidence
if (LOGDIR) fs.mkdirSync(LOGDIR, { recursive: true });
const TIMEOUT_MS = 10 * 60 * 1000;

const DECLARED = [
	"(i) build brief 5 (seat, 2026-10-16): B4/1 re-anchored to build 5's code (item 1 split the status line into a block; the str() exact-type call is still dropped alone, so a [\"proposed\"] status is still accepted); no title renamed (every constant checked against the test files at cd8991b). B5/1-B5/14 cover build 5's item behaviours, judged on the titles build brief 5 names plus T61-T66, the titles build 5 added: build 5 put item 3(a), item 3(b), item 4's exemption and item 5's question-2 case under titles of their own (T64, T65, T66, T63), not inside T24, the R-1170 test and T16 as the brief says, so those pairs are judged on the new titles. Item 1 B5/1 (T62); item 2 B5/2 (T61); item 3 B5/3 (T64) and B5/4 (T65); item 4 B5/5 (T66) and B5/6 (T1); item 5 B5/7 FEAT-900's table status (T14, T55), B5/8 a capability's label (T14), B5/9 a subgroup's purpose (T14), B5/10 SUB-900's seed text (T14), B5/11 the appendix's subgroup rows (T16), B5/12 the question number (T63); item 6 B5/13 (T22); item 7 B5/14 (T7). B5/5 is 1/4's behaviour (the identity exemption dropped) at a second site, the heading's own tree ID never read, and declares T31 too; 1/4 is expected (by reading, not yet run) to red T66 as an unnamed red. B5/8 names CAP-02 by ID and keeps CAP-01's label, which T57 already reads, since the clause is that every node's own text is pinned, not the first one's. Item 8 (citations; T11's cap by name) changes no behaviour and has no pair",
	"(h) build brief 4 (seat, 2026-10-16): 8/4, 8/5, 9/1, 9/2, B2/22, B2/23, B3/3, B3/5, B3/28, B3/29, B3/31, B3/33 and B3/36 re-anchored to build 4's code, each keeping its wrong behaviour (B3/5 now skips the also_applies loop that replaced the shares_added one; B3/3 and B3/5 also name the merge and demotion titles T58 and T59, which pin the same R-1187 check); T39 follows build 4's shortened title; T18's leaf total stays 1,152 (build 4 adds no row). Retired, not re-pointed: B3/9, because brief item 10 removed main's early evidence-shape refusal on purpose (the shape bucket inside regroupProblems is now the only refusal, judged by B3/7 and B3/8; a failed run's page removal is 2/6's); B3/40, because brief item 1 removed the copied STATUS pattern and statusProblems on purpose (the lift's own tree check now refuses a bad status before the regroup runs, so T44 keeps no regroup pair). Item 8's nine survivors keep their existing pairs (B2/4, B2/23, B3/8, B3/20, B3/22-B3/26), which build 4's new cases now judge; no duplicate pair is added. B4/1-B4/49 cover build 4's new checks and strengthened tests, judged on the titles build brief 4 names (T48-T60 added): item 1 B4/1, item 2 B4/2, item 3 B4/3, item 4 B4/4-B4/18, item 5 B4/19-B4/21, item 6 B4/22, item 7 B4/23-B4/24 (the lift's plan print only), item 9 B4/25-B4/33, item 10 B4/34-B4/49. alsoRed lists the build 4 tests that read the same page text on another fixture (T8's carried share through the command, T58, T59, T55, T57, T60), declared on 8/4, 9/2, B3/28, B3/29, B3/31, B4/5, B4/9, B4/33 and B4/35",
	"(g) build brief 3 (seat, 2026-10-16): 2/6, 2/7, 7/23, 8/3, 8/4, 9/3, B2/8, B2/9, B2/14, B2/16, B2/17 and B2/18 re-anchored to build 3's code, each keeping its wrong behaviour (B2/8 and B2/9 now drop the reason and claim line sites of the shape bucket's exact-type check, which replaced build 2's in-check integer tests; 9/3 keys the outcome by the row's first target before the label and question number are derived; B2/18 forces one heading level, since build 3 nests by heading level with no indent); T18 follows the merge's leaf total to 1,152; B3/1-B3/44 cover build 3's new checks, judged on the titles build brief 3 names (T10S, T24 and T38-T47 added): item 1 B3/1-B3/2 (both also red T24, declared), item 2 B3/3-B3/6, item 3 B3/7-B3/9, item 4 B3/10-B3/14, item 5 one exact-type site per pair B3/15-B3/26, item 6 B3/27, item 7 B3/28-B3/33, item 9 B3/34-B3/44",
	"(f) build brief 2 (seat, 2026-10-16): 2/4, 2/5, 5/1, 6/10, 7/23, 8/4, 8/6, 9/1, 9/6 and 10/5 re-anchored to build 2's code (2/5 now forces the real-path fallback by blinding the inode compare, since an existing alias is otherwise caught by inode); B2/1-B2/23 cover build 2's new checks (B2/10, B2/11 and B2/23 are the unknown-row refusals (d) found missing at build 1), judged on the titles build brief 2 names (T32-T37 added)",
	"(a) test sets: row 1 (the lift) runs requirements-lift.test.mjs AND requirements-regroup.test.mjs, because the checker imports detectMoves and spawns the lift; rows 2-9 run requirements-regroup.test.mjs (templates-render reads only the regroup source's --root/--proposal/--out spellings, which no pair changes); row 10's skill pairs run templates-render, skill-claims and readme-check (all three read the skill); 10/6 runs requirements-tree",
	"(b) §5's table numbers its rows 1, 2, 4, 5, 6, 7, 8, 9, 10 (no row 3); ids follow those numbers and count across a row's \"·\" groups: 2/8-2/9 are row 2's T4 pairs, 6/1-6/5 T7, 6/6-6/9 T8, 6/10 T9, 6/11-6/17 T22, 6/18 T23, 7/1-7/2 T10, 7/3 T11, 7/4 T12, 7/5-7/22 T13's 18 levels, 7/23 T13's recommendation, 8/1-8/5 T14, 8/6 T15, 9/1-9/6 T16, 10/1-10/5 T17, 10/6 T18 (80 pairs)",
	"(c) label forms the code shape forces: 1/1 gives each record the first line holding its heading text and keeps one record per heading text, node and kind; 1/3 drops row IDs from the lift's printed line only (records keep them; the page is row 9); 1/4 prints a heading record for every named heading; 4/4 keys reasons by the heading text at their line, counted as a multiset so two same-text reasons still match two same-text lines; 6/8 resolves a target once when any refuted or asked entry names its row; 6/11-6/13 accept a missing claim verdict of that kind only; 7/5-7/22 skip checkObj for that level's PROPOSAL_KEYS entry at every site of the level; 9/3 prints each target with its row's first target's outcome; 10/5 adds a second regroup-command span carrying --force; 10/6 adds R-1185 after R-1180 and regenerates the outline",
	"(d) pair C5 (build brief 1 clarification 5, added by the seat): the verdict unknown-row refusal (\"is not a row in this ledger\", regroup :270) dropped; judged on T7, the R-1175 title the brief names for its test case. The checker holds no unknown-row refusal for a placed, refuted or question-about entry, so no pair can drop one (seat probe at the tip: each such entry for R-099 exits 0 and writes the page)",
	"(e) 5/4, 6/17 and 7/2 break the honest fixture itself (FEAT-005's evidence is written with backslashes; it holds no claim for a reserved node; R-005 names a missing path and carries a placed reason), so every test that runs the honest proposal reds too; judged on the named title, the rest listed as UNNAMED red",
];

// ── test files ──────────────────────────────────────────────────────────────────────────────
const LT = "packages/nana-pack/tests/requirements-lift.test.mjs";
const RG = "packages/nana-pack/tests/requirements-regroup.test.mjs";
const TR = "packages/nana-pack/tests/templates-render.test.mjs";
const SC = "packages/nana-pack/tests/skill-claims.test.mjs";
const RC = "packages/nana-pack/tests/readme-check.test.mjs";
const RT = "packages/nana-pack/tests/requirements-tree.test.mjs";

// ── mutated files ───────────────────────────────────────────────────────────────────────────
const LIFT = "scripts/requirements-lift.mjs";
const RGS = "scripts/requirements-regroup.mjs";
const REQ_SKILL = "packages/nana-pack/skills/requirements/SKILL.md";
const LEDGER = "REQUIREMENTS.md";

// ── titles (exact, as the suite prints them; CHANGE.md §5 and seat-titles.mjs) ───────────────
const T1 = "R-1170: on a flat ledger whose two sections share one heading text, a mapping's dry run prints each named heading's line, text and node, and each row move by old line with its row IDs";
const T31 = "R-1162: --emit-mapping on a lifted ledger writes the identity mapping, which --mapping applies with no move line and the same bytes";
const T2 = "R-1171: a passing proposal writes the review page, and one the lift's dry run refuses writes no page and names the lift's problem";
const T3 = "R-1171: run through a symlink to the script, the command still writes its page";
const T19 = "R-1171: an --out naming the ledger or the proposal is refused and leaves that file byte-identical";
const T20 = "R-1171: an --out that is a symlink to the proposal is refused and leaves the proposal byte-identical";
const T21 = "R-1171: a failing run removes an earlier review page at --out and leaves a file there that is not a review page unchanged";
const T4 = 'R-1172: a node outside the reserved general-engineering nodes that keeps a "Not yet sorted:" purpose or outcome is refused';
const T5 = "R-1173: each line the lift reports needs exactly one reason by old line and node, a missing, repeated or stale reason is refused, and two same-text headings are reasoned apart";
const T6 = "R-1174: a proposed feature with no evidence path, a missing path or a path leaving the root is refused, and an existing path written with backslashes passes";
const T7 = "R-1175: a review record missing a row, repeating one, naming a stale home, an unknown verdict or target, an empty reason or a target without its own reason is refused";
const T8 = "R-1175: each move or share target needs exactly one outcome keyed by row and target, so a share carried to one feature and refuted for another passes, and a target left unresolved or resolved twice is refused";
const T9 = "R-1175: a record whose drafter and reviewer share a lineage is refused unless it declares same-family";
const T10 = "R-1176: a text-placed row without a placed reason, or a placed reason for a row with local evidence, is refused";
const T11 = "R-1177: a proposal with more problems than the cap prints at most the problem-line cap and the count of the rest";
const T12 = "R-1177 fixture: a run missing --root, --proposal or --out exits 2 with usage";
const T13 = "R-1177: a misspelled key in any object level of a proposal is refused naming its path, and so is a question without a recommendation";
const T14 = "R-1178: the page opens with both hashes, the proof line, the lineages and the placement and claim verdict counts, then the numbered questions, the feature table with status mix, and every node with its purpose and each proposed feature's evidence";
const T15 = 'R-1178: a same-family record reads "same-family review" on the page and never "another lineage"';
const T16 = "R-1179: the page lists each reported line with its reason and rows, each move and share target with its own outcome, each rejected claim with its reason, each text-placed row with its reason, and every row only in the appendix after them";
const T32 = "R-1171: an --out that is a case-only alias of the ledger is refused and leaves the ledger byte-identical";
const T33 = "R-1171: an --out that is a hard link to the proposal is refused and leaves the proposal byte-identical";
const T34 = "R-1171: an --out naming a directory is refused, never a crash";
const T35 = "R-1171: an --out naming the lift script or a proposal's evidence path is refused and leaves that file byte-identical";
const T36 = "R-1175: regroupProblems called directly accepts a share's target carried in also_applies, and a move target never counts as carried even when also_applies names it";
const T37 = "R-1176: a row whose evidence names an existing path in the trace rail's plain or backtick form is evidence-placed";
const T22 = "R-1184: each purpose and outcome outside the reserved nodes and each reported line's reason needs exactly one accept or reject verdict with a reason and the claim's current text, a missing, repeated, stale or reasonless one is refused, and a reserved node needs none";
const T23 = "R-1184: a rejected claim named in no question is refused, and one named in a question passes";
const T17 = "requirements skill's regroup paragraph names the regroup check, what the agent reads, a review of every placement and every purpose, outcome and section reason, the owner's yes before --write, --verify with --mapping and gaps as proposed features, and only flags the regroup has";
const T18 = "R-291: every real heading's committed IDs survive expansion and leaf counts total 1,152";
// Build brief 3's titles (copied from requirements-regroup.test.mjs at 656dc86). T10S is amendment 2's "T10" (the shares
// plan's title); this runner's T10 is already R-1176's placed title.
const T10S = "R-1177: a proposal whose feature declares shares_added and shares_dropped holds no unknown key and passes the regroup checker";
const T24 = "R-1187: a share added or dropped with no share verdict targeting its feature is refused, an added one with that verdict passes as carried, and a dropped one passes only refuted or asked";
const T38 = "R-1171: an --out the command cannot write is refused by name, exit 1, with no stack trace";
// Build 4 dropped "before the --out pre-check reads it" from T39's title (brief 4 item 10).
const T39 = "R-1177: an evidence value written as an object, a number or a boolean is refused by name, for a gap or a non-gap feature, and a failing run still removes an earlier page";
const T40 = "R-1175: a refuted entry or a question about entry naming no move or share target of its row is refused";
const T41 = "R-1184: a claim verdict matching no required purpose, outcome or reason is refused";
const T42 = "R-1175: a keep verdict carrying targets is refused";
const T43 = "R-1177: a question without ask is refused";
const T44 = "R-1177: a feature status the tree checker's status pattern refuses is refused";
const T45 = "R-1174: a frozen or retired feature with no rows is not a gap and needs no evidence";
const T46 = "R-1176: an evidence citation's path is read before the first space, less a trailing :<line> or :<line>-<line>, so a locator does not make the row text-placed";
const T47 = 'R-1176: the text-placed refusal says the Evidence cell "names no path that exists", not that it has no evidence';
// Build brief 4's titles (copied from requirements-regroup.test.mjs at 8c7ed24).
const T48 = "R-1171: a run the lift's dry run refuses removes an earlier review page at --out, same as a regroup-level refusal";
const T49 = "R-1171: a failing run reads --out for an earlier page only when it is a regular file, so a FIFO (standing in for a terminal) never hangs";
const T50 = 'R-1179: an empty "Reported lines" or "Move and share targets" section prints "(none)", same as every other empty section';
const T51 = 'R-1179: a bare <placeholder> in row text is escaped ("&lt;placeholder&gt;") in its gist and the appendix, never a literal, vanishing HTML tag';
const T52 = "R-1173: line 30's reason for -> FEAT-002 given at line 15 instead is refused naming both line 15's excess reason and line 30's missing one";
const T53 = "R-1175: a review record names no drafter or an empty reviewer lineage is refused";
const T54 = 'R-1177: a feature status written as a one-element array (["proposed"] or ["active"]) on a feature with no rows and no evidence is refused in the shape check';
const T55 = "R-1178: the feature table shows FEAT-900's label and status from the lift's seed, never other text a proposal gives it";
const T56 = "R-1178: the header's hashes and proof line, and a question's ask and recommendation, are each their own paragraph, never merged by a Markdown renderer";
const T57 = "R-1179: a node's Purpose and Outcome, and a reported line and its reason, are each their own paragraph, never merged by a Markdown renderer";
const T58 = "R-1187: a feature's merge that carries another feature's share onto also_applies is refused with no share verdict and passes, carried, with one";
const T59 = "R-1187: a feature's demotion to a subgroup that carries its share onto the absorbing feature's also_applies is refused with no share verdict and passes, carried, with one";
const T60 = "R-1178: an active feature with no rows (a gap) shows its evidence on the page, the same way a proposed one's is shown";
// Build brief 5's titles (copied from requirements-regroup.test.mjs and, for T66, requirements-lift.test.mjs at cd8991b).
const T61 = "R-1179: a row holding both a bare <placeholder> and a code span naming <provider> shows the first escaped and the second verbatim, in its gist and the appendix";
const T62 = "R-1177: a feature status that differs from its own trimmed self (a trailing space, a leading space or a trailing tab) is refused in the shape check, with no evidence ever demanded for it";
const T63 = 'R-1179: an asked target named in the SECOND question reads "asked in question 2", not a constant "question 1"';
const T64 = "R-1187: a feature that keeps an existing share unchanged (also_applies names it still, no shares_dropped) needs no share verdict for it";
const T65 = "R-1187: a merge's carried share is refused when its row's share verdict targets a feature other than the one actually absorbing it, naming the absorbing feature";
const T66 = "R-1170: a heading whose own tree ID equals the ID of the node naming it prints no line, and only the one heading a merge actually renames does";

// ── edits ───────────────────────────────────────────────────────────────────────────────────
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const regex = (file, re, replacement, n) => ({ file, re, replacement, times: n });
const run = (args) => ({ run: args });

const LIFT_T = [LT, RG];
const RG_T = [RG];
const SKILL_T = [TR, SC, RC];
const LEDGER_T = [RT];

const CLAIM_MISSING = "    if (hit.length === 0) { problems.push(`regroup.review.claims: ${label} has no claim verdict`); continue; }";
const claimMissingSkip = (cond) => `    if (hit.length === 0) { if (${cond}) continue; problems.push(\`regroup.review.claims: \${label} has no claim verdict\`); continue; }`;
const KEY_SITE = "    if (!isPlainObject(obj)) return;\n";
const KEY_LEVELS = ["top", "pin", "head", "capability", "feature", "subgroup", "from", "tail", "keep", "regroup", "reason", "review", "verdict", "target", "claim", "refuted", "question", "about"];
const SKILL_REVIEW = "checks every row's placement and every purpose, outcome and section reason before the owner sees the page";

const sh = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...opts });
const GIT_SAFE = ["-c", "core.hooksPath=/dev/null"];
const git = (...args) => sh("git", [...GIT_SAFE, ...args]);
const tipSha = git("-C", LANE_REPO, "rev-parse", "--verify", `${TIP}^{commit}`).stdout.trim();
const mergeBase = git("-C", LANE_REPO, "merge-base", "main", tipSha).stdout.trim();

// Frozen table. `expectRed` are the titles §5 names (C5: the title build brief 1 names).
const PAIRS = [
	// Row 1: the lift's line-keyed report (R-1170)
	{ n: "1/1", name: "lift keys by heading text again", edits: [one(LIFT, "  return records.sort((a, b) => a.line - b.line);\n}", "  const __first = new Map(); for (const h of allHeadings) if (!__first.has(bareLines[h.line - 1])) __first.set(bareLines[h.line - 1], h.line);\n  const __seen = new Set();\n  return records.map((r) => ({ ...r, line: __first.get(r.heading) ?? r.line })).filter((r) => { const k = `${r.heading}|${r.to}|${r.rows.length ? \"m\" : \"h\"}`; if (__seen.has(k)) return false; __seen.add(k); return true; }).sort((a, b) => a.line - b.line);\n}")], tests: LIFT_T, expectRed: [T1] },
	{ n: "1/2", name: "flat heading lines dropped (a heading record only for a tree ID that differs)", edits: [one(LIFT, "      if (oldId !== id) records.push({ line: f.line, heading: f.heading, to: id, rows: [] });", "      if (oldId && oldId !== id) records.push({ line: f.line, heading: f.heading, to: id, rows: [] });")], tests: LIFT_T, expectRed: [T1] },
	{ n: "1/3", name: "row IDs dropped from the lift's move lines", edits: [one(LIFT, "console.log(r.rows.length ? `line ${r.line}: ${r.heading} -> ${r.to} (rows ${r.rows.join(\", \")})` : `line ${r.line}: ${r.heading} -> ${r.to}`);", "console.log(`line ${r.line}: ${r.heading} -> ${r.to}`);")], tests: LIFT_T, expectRed: [T1] },
	{ n: "1/4", name: "a heading line printed for an identity heading", edits: [one(LIFT, "      if (oldId !== id) records.push(", "      if (true) records.push(")], tests: LIFT_T, expectRed: [T31] },
	// Row 2: output, the lift, the guard (R-1171) · placeholder (R-1172)
	{ n: "2/1", name: "the lift's dry run skipped", edits: [one(RGS, "  const liftRun = spawnSync(process.execPath, [LIFT_SCRIPT, \"--root\", rootDir, \"--mapping\", proposalPath], { encoding: \"utf8\" });", "  const liftRun = { status: 0, stdout: \"\", stderr: \"\" };")], tests: RG_T, expectRed: [T2] },
	{ n: "2/2", name: "the lift's exit ignored", edits: [one(RGS, "  if (liftRun.status !== 0) {", "  if (false && liftRun.status !== 0) {")], tests: RG_T, expectRed: [T2] },
	{ n: "2/3", name: "the guard uses the resolve form", edits: [one(RGS, "if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) process.exit(main());", "if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) process.exit(main());")], tests: RG_T, expectRed: [T3] },
	{ n: "2/4", name: "the --out clash check dropped", edits: [one(RGS, "  if (inputPaths.some((p) => samePath(outPath, p))) {", "  if (false) {")], tests: RG_T, expectRed: [T19, T20, T32, T33, T35] },
	{ n: "2/5", name: "the clash compared without realpath (inodes unavailable, so the fallback decides)", edits: [one(RGS, "function statId(p) { try {", "function statId(p) { return null; try {"), one(RGS, "  return nearestRealPath(a) === nearestRealPath(b);", "  return resolve(a) === resolve(b);")], tests: RG_T, expectRed: [T20] },
	{ n: "2/6", name: "a failed run leaves an earlier page", edits: [one(RGS, "function removeEarlierPage(outPath) {\n", "function removeEarlierPage(outPath) {\n  return;\n")], tests: RG_T, expectRed: [T21] },
	{ n: "2/7", name: "a failed run removes any file at --out", edits: [one(RGS, "  if (firstLineOf(existing) === PAGE_HEAD) {", "  if (true) {")], tests: RG_T, expectRed: [T21] },
	{ n: "2/8", name: "placeholder check dropped", edits: [one(RGS, "    ...placeholderProblems(proposal),\n", "")], tests: RG_T, expectRed: [T4] },
	{ n: "2/9", name: "placeholder check applied to reserved nodes too", edits: [one(RGS, "    if (RESERVED_NODES.has(x.id)) continue;\n    if (String(x.node.purpose", "    if (String(x.node.purpose")], tests: RG_T, expectRed: [T4] },
	// Row 4: reasons (R-1173)
	{ n: "4/1", name: "missing reason accepted", edits: [one(RGS, "    if (n === 0) problems.push(`regroup.reasons: line ${line} -> ${to} has no reason`);", "    if (false) problems.push(`regroup.reasons: line ${line} -> ${to} has no reason`);")], tests: RG_T, expectRed: [T5] },
	{ n: "4/2", name: "repeated reason accepted", edits: [one(RGS, "    else if (n > 1) problems.push(`regroup.reasons: line ${line} -> ${to} has more than one reason`);", "    else if (false) problems.push(`regroup.reasons: line ${line} -> ${to} has more than one reason`);")], tests: RG_T, expectRed: [T5] },
	{ n: "4/3", name: "stale reason accepted", edits: [one(RGS, "    if (!want.has(key)) { problems.push(`regroup.reasons: line ${r.line} -> ${r.to} is not a line the lift reports (a stale reason)`); continue; }", "    if (!want.has(key)) { continue; }")], tests: RG_T, expectRed: [T5] },
	{ n: "4/4", name: "reasons keyed by heading text", edits: [one(RGS, "  const want = new Set(records.map((r) => `${r.line}|${r.to}`));", "  const __text = new Map(records.map((r) => [r.line, r.heading]));\n  const __k = (line, to) => `${__text.has(line) ? __text.get(line) : line}|${to}`;\n  const __want = new Map(); for (const r of records) __want.set(__k(r.line, r.to), (__want.get(__k(r.line, r.to)) ?? 0) + 1);\n  const want = new Set(__want.keys());"), one(RGS, "    const key = `${r.line}|${r.to}`;\n    if (!want.has(key))", "    const key = __k(r.line, r.to);\n    if (!want.has(key))"), one(RGS, "    else if (n > 1) problems.push(`regroup.reasons:", "    else if (n > __want.get(key)) problems.push(`regroup.reasons:")], tests: RG_T, expectRed: [T5] },
	// Row 5: proposed-feature evidence (R-1174)
	{ n: "5/1", name: "empty evidence accepted", edits: [one(RGS, "    if (!Array.isArray(paths) || paths.length === 0) { problems.push(`${x.id}: a gap feature with no rows names no evidence path`); continue; }", "    if (!Array.isArray(paths) || paths.length === 0) { continue; }")], tests: RG_T, expectRed: [T6] },
	{ n: "5/2", name: "missing path accepted", edits: [one(RGS, "    for (const raw of paths) if (!existsUnder(rootDir, raw)) problems.push(", "    for (const raw of paths) if (underRoot(rootDir, raw) === null) problems.push(")], tests: RG_T, expectRed: [T6] },
	{ n: "5/3", name: "`..` accepted", edits: [one(RGS, "  if (rel === \"\" || rel.startsWith(\"..\") || isAbsolute(rel)) return null;", "  if (rel === \"\" || isAbsolute(rel)) return null;")], tests: RG_T, expectRed: [T6] },
	{ n: "5/4", name: "`\\` not normalised", edits: [one(RGS, "  const norm = String(raw).replace(/\\\\/g, \"/\");", "  const norm = String(raw);")], tests: RG_T, expectRed: [T6] },
	// Row 6: the review record (R-1175) · claims (R-1184)
	{ n: "6/1", name: "missing row accepted", edits: [one(RGS, "    if (n === 0) problems.push(`regroup.review.verdicts: row ${r.id} has no verdict`);", "    if (false) problems.push(`regroup.review.verdicts: row ${r.id} has no verdict`);")], tests: RG_T, expectRed: [T7] },
	{ n: "6/2", name: "repeated row accepted", edits: [one(RGS, "    else if (n > 1) problems.push(`regroup.review.verdicts: row ${r.id} is repeated`);", "    else if (false) problems.push(`regroup.review.verdicts: row ${r.id} is repeated`);")], tests: RG_T, expectRed: [T7] },
	{ n: "6/3", name: "stale `at` accepted", edits: [one(RGS, "    if (wantHome !== undefined && v.at !== wantHome) problems.push(", "    if (false) problems.push(")], tests: RG_T, expectRed: [T7] },
	{ n: "6/4", name: "empty (keep) reason accepted", edits: [one(RGS, "      if (!nonEmpty(v.reason)) problems.push(`regroup.review.verdicts: ${v.id}'s keep verdict has an empty reason`);\n", "")], tests: RG_T, expectRed: [T7] },
	{ n: "6/5", name: "a target without its own reason accepted", edits: [one(RGS, "      if (!nonEmpty(t.reason)) problems.push(`regroup.review.verdicts: ${v.id} -> ${t.to}: target has an empty reason`);\n", "")], tests: RG_T, expectRed: [T7] },
	{ n: "6/6", name: "unresolved move target accepted", edits: [one(RGS, "      if (n === 0) problems.push(`regroup: ${v.id} -> ${t.to} target is left unresolved", "      if (n === 0 && v.verdict !== \"move\") problems.push(`regroup: ${v.id} -> ${t.to} target is left unresolved")], tests: RG_T, expectRed: [T8] },
	{ n: "6/7", name: "unresolved share target accepted", edits: [one(RGS, "      if (n === 0) problems.push(`regroup: ${v.id} -> ${t.to} target is left unresolved", "      if (n === 0 && v.verdict !== \"share\") problems.push(`regroup: ${v.id} -> ${t.to} target is left unresolved")], tests: RG_T, expectRed: [T8] },
	{ n: "6/8", name: "outcome keyed by row alone", edits: [one(RGS, "  n += (proposal.regroup?.refuted ?? []).filter((r) => r.id === id && r.to === to).length;\n  for (const q of proposal.regroup?.questions ?? []) n += (q.about ?? []).filter((a) => a.id === id && a.to === to).length;\n  return n;", "  if ((proposal.regroup?.refuted ?? []).some((r) => r.id === id) || (proposal.regroup?.questions ?? []).some((q) => (q.about ?? []).some((a) => a.id === id))) n++;\n  return n;")], tests: RG_T, expectRed: [T8] },
	{ n: "6/9", name: "a target resolved twice accepted", edits: [one(RGS, "      else if (n > 1) problems.push(`regroup: ${v.id} -> ${t.to} target is resolved more than once`);", "      else if (false) problems.push(`regroup: ${v.id} -> ${t.to} target is resolved more than once`);")], tests: RG_T, expectRed: [T8] },
	{ n: "6/10", name: "same lineage accepted without same-family", edits: [one(RGS, "  if (sameLineage(review.drafter, review.reviewer) && !flagged) {", "  if (false) {")], tests: RG_T, expectRed: [T9] },
	{ n: "6/11", name: "a purpose without a claim verdict accepted", edits: [one(RGS, CLAIM_MISSING, claimMissingSkip("req.kind === \"node\" && req.field === \"purpose\""))], tests: RG_T, expectRed: [T22] },
	{ n: "6/12", name: "an outcome without a claim verdict accepted", edits: [one(RGS, CLAIM_MISSING, claimMissingSkip("req.kind === \"node\" && req.field === \"outcome\""))], tests: RG_T, expectRed: [T22] },
	{ n: "6/13", name: "a section reason without a claim verdict accepted", edits: [one(RGS, CLAIM_MISSING, claimMissingSkip("req.kind === \"reason\""))], tests: RG_T, expectRed: [T22] },
	{ n: "6/14", name: "a repeated claim verdict accepted", edits: [one(RGS, "    if (hit.length > 1) { problems.push(", "    if (false) { problems.push(")], tests: RG_T, expectRed: [T22] },
	{ n: "6/15", name: "stale claim text accepted", edits: [one(RGS, "    if (req.text !== null && c.text !== req.text) problems.push(", "    if (false) problems.push(")], tests: RG_T, expectRed: [T22] },
	{ n: "6/16", name: "an empty claim reason accepted", edits: [one(RGS, "    if (!nonEmpty(c.reason)) problems.push(`regroup.review.claims: ${label}'s claim has an empty reason`);\n", "")], tests: RG_T, expectRed: [T22] },
	{ n: "6/17", name: "reserved nodes demanded a claim verdict", edits: [one(RGS, "    if (RESERVED_NODES.has(x.id)) continue;\n    keys.push(", "    keys.push(")], tests: RG_T, expectRed: [T22] },
	{ n: "6/18", name: "a rejected claim named in no question accepted", edits: [one(RGS, "    if (!referenced) {", "    if (false) {")], tests: RG_T, expectRed: [T23] },
	// Build brief 1, clarification 5 (seat-added)
	{ n: "C5", name: "a verdict naming a row the ledger does not hold accepted (unknown-row refusal dropped)", edits: [one(RGS, "  for (const id of seenRow.keys()) if (!ledgerIds.has(id)) problems.push(", "  for (const id of seenRow.keys()) if (false) problems.push(")], tests: RG_T, expectRed: [T7] },
	// Row 7: placed (R-1176) · cap, usage, keys, recommendation (R-1177)
	{ n: "7/1", name: "missing `placed` reason accepted", edits: [one(RGS, "      if (!nonEmpty(reason)) problems.push(`regroup.placed:", "      if (false) problems.push(`regroup.placed:")], tests: RG_T, expectRed: [T10] },
	{ n: "7/2", name: "Evidence path existence ignored (any named path counts as evidence)", edits: [one(RGS, "function isTextPlaced(dir, row) { return !evidencePathsOfCell(row.evidence).some((p) => existsUnder(dir, p)); }", "function isTextPlaced(dir, row) { return evidencePathsOfCell(row.evidence).length === 0; }")], tests: RG_T, expectRed: [T10] },
	{ n: "7/3", name: "cap removed", edits: [one(RGS, "  if (problems.length <= PROBLEM_LINE_CAP) return problems;", "  return problems;")], tests: RG_T, expectRed: [T11] },
	{ n: "7/4", name: "missing --out accepted", edits: [one(RGS, "  if (!args.root || !args.proposal || !args.out) return usage();", "  if (!args.root || !args.proposal) return usage();")], tests: RG_T, expectRed: [T12] },
	...KEY_LEVELS.map((level, i) => ({ n: `7/${5 + i}`, name: `the key check skipped at the ${level} level`, edits: [one(RGS, KEY_SITE, `${KEY_SITE}    if (allowed === PROPOSAL_KEYS.${level}) return;\n`)], tests: RG_T, expectRed: [T13] })),
	{ n: "7/23", name: "question without recommendation accepted", edits: [one(RGS, "    if (!nonEmpty(q.recommendation)) problems.push(", "    if (false) problems.push(")], tests: RG_T, expectRed: [T13] },
	// Row 8: the page's opening parts (R-1178)
	{ n: "8/1", name: "questions after the table", edits: [one(RGS, "export const PAGE_SECTIONS = [\"header\", \"questions\", \"table\",", "export const PAGE_SECTIONS = [\"header\", \"table\", \"questions\",")], tests: RG_T, expectRed: [T14] },
	{ n: "8/2", name: "proof line omitted", edits: [one(RGS, "ctx.proofLine ?? \"lift proof: (not captured)\", \"\"];", "\"lift proof: (not captured)\", \"\"];")], tests: RG_T, expectRed: [T14] },
	{ n: "8/3", name: "status mix omitted", edits: [one(RGS, "| ${ids.length} | ${statusMixOf(ids, ctx.rowStatus)} |`);", "| ${ids.length} | |`);")], tests: RG_T, expectRed: [T14] },
	{ n: "8/4", name: "gap evidence omitted", edits: [one(RGS, "        out.push(\"\", `Evidence: ${ev.join(\", \")}`);\n", "")], tests: RG_T, expectRed: [T14], alsoRed: [T60] },
	{ n: "8/5", name: "claim counts omitted", edits: [one(RGS, "out.push(`Placement verdicts: ${(review.verdicts ?? []).length}`, \"\", `Claim verdicts: ${(review.claims ?? []).length}`, \"\");", "out.push(`Placement verdicts: ${(review.verdicts ?? []).length}`, \"\");")], tests: RG_T, expectRed: [T14] },
	{ n: "8/6", name: "same-family printed as another lineage", edits: [one(RGS, "(${ctx.same ? \"same-family review\" : \"another lineage\"})", "(another lineage)")], tests: RG_T, expectRed: [T15] },
	// Row 9: the page's lists (R-1179)
	{ n: "9/1", name: "moved row IDs omitted", edits: [one(RGS, "${r.rows.length ? ` (rows ${r.rows.join(\", \")})` : \"\"}`, `- Reason: ${why}`", "`, `- Reason: ${why}`")], tests: RG_T, expectRed: [T16] },
	{ n: "9/2", name: "share verdicts omitted", edits: [one(RGS, "const moveOrShare = verdicts.filter((v) => v.verdict === \"move\" || v.verdict === \"share\");", "const moveOrShare = verdicts.filter((v) => v.verdict === \"move\");")], tests: RG_T, expectRed: [T16], alsoRed: [T8, T58, T59] },
	{ n: "9/3", name: "share outcome printed per row, not per target", edits: [one(RGS, "        const outcome = resolveTargetOutcome(ctx.proposal, v.id, t.to);", "        const outcome = resolveTargetOutcome(ctx.proposal, v.id, (v.targets ?? [])[0]?.to);")], tests: RG_T, expectRed: [T16] },
	{ n: "9/4", name: "rejected claims omitted", edits: [one(RGS, "    const rejected = (ctx.proposal.regroup?.review?.claims ?? []).filter((c) => c.verdict === \"reject\");", "    const rejected = [];")], tests: RG_T, expectRed: [T16] },
	{ n: "9/5", name: "text-placed list omitted", edits: [one(RGS, "      if (reason === undefined) continue;\n      any = true;", "      if (true) continue;\n      any = true;")], tests: RG_T, expectRed: [T16] },
	{ n: "9/6", name: "appendix before the lists", edits: [one(RGS, "\"table\", \"nodes\", \"lines\", \"targets\", \"claims\", \"placed\", \"refuted\", \"appendix\"];", "\"table\", \"nodes\", \"appendix\", \"lines\", \"targets\", \"claims\", \"placed\", \"refuted\"];")], tests: RG_T, expectRed: [T16] },
	// Row 10: the skill (R-1180) and the ledger literal (R-291)
	{ n: "10/1", name: "regroup paragraph drops the placement review", edits: [one(REQ_SKILL, SKILL_REVIEW, "checks every purpose, outcome and section reason before the owner sees the page")], tests: SKILL_T, expectRed: [T17] },
	{ n: "10/2", name: "regroup paragraph drops the claim review", edits: [one(REQ_SKILL, SKILL_REVIEW, "checks every row's placement before the owner sees the page")], tests: SKILL_T, expectRed: [T17] },
	{ n: "10/3", name: "regroup paragraph drops \"only after the owner's yes\"", edits: [one(REQ_SKILL, "`--write` with the proposal as `--mapping` runs only after the owner's yes, with the proposal committed", "`--write` with the proposal as `--mapping` runs once the owner has seen the page, with the proposal committed")], tests: SKILL_T, expectRed: [T17] },
	{ n: "10/4", name: "regroup paragraph shows `--verify <base>` without `--mapping`", edits: [one(REQ_SKILL, "the reviewer then runs `--verify <base> --mapping <proposal>`.", "the reviewer then runs `--verify <base>`.")], tests: SKILL_T, expectRed: [T17] },
	{ n: "10/5", name: "regroup paragraph shows a flag the source lacks (`--force`)", edits: [one(REQ_SKILL, "--proposal <file> --out <page>`. The proposal is", "--proposal <file> --out <page>` (to overwrite a page, `node \"$HOME/nana-pi/scripts/requirements-regroup.mjs\" --root . --proposal <file> --out <page> --force`). The proposal is")], tests: SKILL_T, expectRed: [T17] },
	{ n: "10/6", name: "a row added without the literal update (R-1185 after R-1180, outline regenerated)", edits: [regex(LEDGER, /^(\| R-1180 \| .*\n)/gm, (_m, line) => `${line}| R-1185 | The regroup checker shall carry one seat mutation row. | planned | — |\n`, 1), run(["scripts/requirements-tree.mjs", "--write"])], tests: LEDGER_T, expectRed: [T18] },
	// Build brief 2 (seat, 2026-10-16): pairs for the checks build 2 added.
	{ n: "B2/1", name: "evidence read backtick-only again (citesOf bypassed)", edits: [one(RGS, "  return citesOf(String(cell ?? \"\"))", "  return [...String(cell ?? \"\").matchAll(/`([^`]+)`/g)].map((c) => c[1])")], tests: RG_T, expectRed: [T37] },
	{ n: "B2/2", name: "a citation's ::title kept as part of its path", edits: [one(RGS, "    .map((c) => (c.includes(\"::\") ? c.split(\"::\")[0] : c))", "    .map((c) => c)")], tests: RG_T, expectRed: [T37] },
	{ n: "B2/3", name: "the clash compared without device+inode", edits: [one(RGS, "  if (ai !== null && bi !== null) return ai === bi;\n", "")], tests: RG_T, expectRed: [T32, T33] },
	{ n: "B2/4", name: "a directory at --out not refused", edits: [one(RGS, "  if (existsSync(outPath) && statSync(outPath).isDirectory()) {", "  if (false) {")], tests: RG_T, expectRed: [T34] },
	{ n: "B2/5", name: "the lift and evidence paths left out of the clash inputs", edits: [one(RGS, "const inputPaths = [ledgerPath, proposalPath, LIFT_SCRIPT, ...evidenceInputs];", "const inputPaths = [ledgerPath, proposalPath];")], tests: RG_T, expectRed: [T35] },
	{ n: "B2/6", name: "a non-array field accepted silently", edits: [one(RGS, "    if (!Array.isArray(value)) { problems.push(`${path}: expected an array, not an object`); return []; }", "    if (!Array.isArray(value)) return [];")], tests: RG_T, expectRed: [T13] },
	{ n: "B2/7", name: "a null entry skipped silently", edits: [one(RGS, "      if (!isPlainObject(item)) { problems.push(`${path}[${i}]: entry is not an object`); continue; }", "      if (!isPlainObject(item)) continue;")], tests: RG_T, expectRed: [T13] },
	{ n: "B2/8", name: "a reason's string line number accepted", edits: [one(RGS, "int(`regroup.reasons[${i}].line`, r.line); ", "")], tests: RG_T, expectRed: [T5] },
	{ n: "B2/9", name: "a claim's string line number accepted", edits: [one(RGS, " int(`regroup.review.claims[${i}].line`, c.line);", "")], tests: RG_T, expectRed: [T22] },
	{ n: "B2/10", name: "a refuted entry naming an unknown row accepted", edits: [one(RGS, "    if (!ledgerIds.has(r.id)) problems.push(`regroup.refuted: ${r.id} is not a row in this ledger`);", "    if (false) problems.push(`regroup.refuted: ${r.id} is not a row in this ledger`);")], tests: RG_T, expectRed: [T7] },
	{ n: "B2/11", name: "a placed entry naming an unknown row accepted", edits: [one(RGS, "  for (const id of Object.keys(placed)) if (!ledgerIds.has(id)) problems.push(", "  for (const id of Object.keys(placed)) if (false) problems.push(")], tests: RG_T, expectRed: [T10] },
	{ n: "B2/23", name: "a question's about entry naming an unknown row accepted", edits: [one(RGS, "        if (!ledgerIds.has(a.id)) { problems.push(", "        if (false) { problems.push(")], tests: RG_T, expectRed: [T7] },
	{ n: "B2/12", name: "carried never reported", edits: [one(RGS, "  if (isCarried(proposal, id, to)) return \"carried\";", "  if (false) return \"carried\";")], tests: RG_T, expectRed: [T36] },
	{ n: "B2/13", name: "a move target counted as carried", edits: [one(RGS, "  return verdictFor(proposal, id)?.verdict === \"share\" && !!target?.node?.also_applies?.includes(id);", "  return !!target?.node?.also_applies?.includes(id);")], tests: RG_T, expectRed: [T36] },
	{ n: "B2/14", name: "lineages compared case-sensitively", edits: [one(RGS, "a.trim().toLowerCase() === b.trim().toLowerCase();", "a.trim() === b.trim();")], tests: RG_T, expectRed: [T9] },
	{ n: "B2/15", name: "same_family accepted for different lineages", edits: [one(RGS, "  if (nonEmpty(review.drafter) && nonEmpty(review.reviewer) && !sameLineage(review.drafter, review.reviewer) && flagged) {", "  if (false) {")], tests: RG_T, expectRed: [T9] },
	{ n: "B2/16", name: "an active feature with no rows needs no evidence", edits: [one(RGS, "    const isGap = x.node.status === \"proposed\" || (x.node.status === \"active\" && featureRowIds(x.node).length === 0);", "    const isGap = x.node.status === \"proposed\";")], tests: RG_T, expectRed: [T6] },
	{ n: "B2/17", name: "node labels dropped from the page", edits: [one(RGS, "out.push(`${mark} ${x.id} — ${text.label ?? \"\"}`, ", "out.push(`${mark} ${x.id}`, ")], tests: RG_T, expectRed: [T14] },
	{ n: "B2/18", name: "nodes listed flat (one heading level; build 3 carries no indent to drop)", edits: [one(RGS, "      const mark = \"#\".repeat(x.level + 2);", "      const mark = \"###\";")], tests: RG_T, expectRed: [T14] },
	{ n: "B2/19", name: "old heading text dropped from reported lines", edits: [one(RGS, "out.push(`Line ${r.line}: \"${r.heading}\" -> ${r.to}", "out.push(`Line ${r.line} -> ${r.to}")], tests: RG_T, expectRed: [T16] },
	{ n: "B2/20", name: "the refuted-items section dropped", edits: [one(RGS, "\"placed\", \"refuted\", \"appendix\"];", "\"placed\", \"appendix\"];")], tests: RG_T, expectRed: [T16] },
	{ n: "B2/21", name: "a refuted item's reason dropped", edits: [one(RGS, "out.push(`${r.id} -> ${r.to}: refuted — ${r.reason}`, \"\");", "out.push(`${r.id} -> ${r.to}: refuted`, \"\");")], tests: RG_T, expectRed: [T16] },
	{ n: "B2/22", name: "the drafter's lineage dropped from the header", edits: [one(RGS, "    out.push(`Drafter: ${review.drafter}`, \"\", `Reviewer:", "    out.push(`Reviewer:")], tests: RG_T, expectRed: [T14] },
	// Build brief 3 (seat, 2026-10-16): pairs for the checks build 3 added, in the brief's item order.
	// Item 1 (T10, M5): the shares keys. T24's honest tree proposal carries both keys, so it reds too (declared).
	{ n: "B3/1", name: "PROPOSAL_KEYS.feature lacks shares_added", edits: [one(RGS, "\"subgroups\", \"shares_added\", \"shares_dropped\"],", "\"subgroups\", \"shares_dropped\"],")], tests: RG_T, expectRed: [T10S], alsoRed: [T24] },
	{ n: "B3/2", name: "PROPOSAL_KEYS.feature lacks shares_dropped", edits: [one(RGS, "\"subgroups\", \"shares_added\", \"shares_dropped\"],", "\"subgroups\", \"shares_added\"],")], tests: RG_T, expectRed: [T10S], alsoRed: [T24] },
	// Item 2 (R-1187, M6)
	{ n: "B3/3", name: "R-1187's share-declaration check dropped", edits: [one(RGS, "    ...shareDeclarationProblems(proposal, ledgerText),\n", "")], tests: RG_T, expectRed: [T24, T58, T59] },
	{ n: "B3/4", name: "R-1187 applied to shares_added only", edits: [one(RGS, "x.node.shares_dropped ?? []", "[]")], tests: RG_T, expectRed: [T24] },
	{ n: "B3/5", name: "R-1187 applied to shares_dropped only (build 4: the also_applies loop skipped)", edits: [one(RGS, "    for (const id of x.node.also_applies ?? []) {", "    for (const id of []) {")], tests: RG_T, expectRed: [T24, T58, T59] },
	{ n: "B3/6", name: "a move verdict accepted in place of share for a declared share", edits: [one(RGS, "const sharesTo = (id, to) => verdictFor(proposal, id)?.verdict === \"share\" &&", "const sharesTo = (id, to) => [\"share\", \"move\"].includes(verdictFor(proposal, id)?.verdict) &&")], tests: RG_T, expectRed: [T24] },
	// Item 3 (M1): evidence values
	{ n: "B3/7", name: "evidence values not shape-checked", edits: [one(RGS, "    if (!Array.isArray(paths) || paths.some((p) => typeof p !== \"string\")) problems.push(`regroup.evidence.${id}:", "    if (false) problems.push(`regroup.evidence.${id}:")], tests: RG_T, expectRed: [T39] },
	{ n: "B3/8", name: "an evidence array's entries not checked as strings", edits: [one(RGS, "!Array.isArray(paths) || paths.some((p) => typeof p !== \"string\")", "!Array.isArray(paths)")], tests: RG_T, expectRed: [T39] },
	// B3/9 retired at build 4 (DECLARED h): brief item 10 removed main's early evidence-shape refusal on purpose.
	// Item 4 (M2): only a review page is removed
	{ n: "B3/10", name: "an earlier page recognised by prefix again", edits: [one(RGS, "  if (firstLineOf(existing) === PAGE_HEAD) {", "  if (firstLineOf(existing).startsWith(PAGE_HEAD)) {")], tests: RG_T, expectRed: [T21] },
	{ n: "B3/11", name: "the BOM not stripped before the first-line compare", edits: [one(RGS, "  const line = stripBom(text)", "  const line = (text)")], tests: RG_T, expectRed: [T21] },
	{ n: "B3/12", name: "the trailing CR not stripped before the first-line compare", edits: [one(RGS, "  return line.endsWith(\"\\r\") ? line.slice(0, -1) : line;", "  return line;")], tests: RG_T, expectRed: [T21] },
	{ n: "B3/13", name: "a symlinked --out: the link removed instead of its target", edits: [one(RGS, "  try { if (lstatSync(outPath).isSymbolicLink()) real = realpathSync(outPath); } catch { return; }", "  try { lstatSync(outPath); } catch { return; }")], tests: RG_T, expectRed: [T21] },
	{ n: "B3/14", name: "an unwritable --out not refused (the write error thrown)", edits: [one(RGS, "  } catch (e) {\n    console.error(`${outPath}: refused — could not write the review page", "  } catch (e) { throw e;\n    console.error(`${outPath}: refused — could not write the review page")], tests: RG_T, expectRed: [T38] },
	// Item 5 (M3): each exact-type check, one site per pair (B2/8 and B2/9 are the reason and claim line sites)
	...[
		["a reason's to", "str(`regroup.reasons[${i}].to`, r.to);", [T5]],
		["a verdict's id", "str(`regroup.review.verdicts[${i}].id`, v.id);", [T13]],
		["a verdict's at", "str(`regroup.review.verdicts[${i}].at`, v.at);", [T13]],
		["a target's to", "str(`regroup.review.verdicts[${i}].targets[${j}].to`, t.to);", [T13]],
		["a claim's node", "str(`regroup.review.claims[${i}].node`, c.node);", [T13]],
		["a claim's to", "str(`regroup.review.claims[${i}].to`, c.to);", [T13]],
		["a refuted entry's id", "str(`regroup.refuted[${i}].id`, r.id);", [T13]],
		["a refuted entry's to", "str(`regroup.refuted[${i}].to`, r.to);", [T13]],
		["a question about entry's id", "str(`regroup.questions[${i}].about[${j}].id`, a.id);", [T13]],
		["a question about entry's to", "str(`regroup.questions[${i}].about[${j}].to`, a.to);", [T13]],
		["a question about entry's node", "str(`regroup.questions[${i}].about[${j}].node`, a.node);", [T13]],
		["a question about entry's line", "int(`regroup.questions[${i}].about[${j}].line`, a.line);", [T13]],
	].map(([what, call, titles], k) => ({ n: `B3/${15 + k}`, name: `${what}'s exact-type check dropped`, edits: [one(RGS, call, ";")], tests: RG_T, expectRed: titles })), // ";" keeps a bare `if (...)` a statement
	// Item 6 (M4): reserved nodes as the lift writes them
	{ n: "B3/27", name: "reserved nodes printed from the proposal again", edits: [one(RGS, "      const text = reserved ? seedNodeText(x.id, ctx.seed) : x.node;", "      const text = x.node;")], tests: RG_T, expectRed: [T14] },
	// Item 7: the page per R-1178 and R-1179 as reworded
	{ n: "B3/28", name: "feature label dropped from the table", edits: [one(RGS, "| ${x.id} | ${text.label ?? \"\"} | ${text.status ?? \"\"} |", "| ${x.id} | | ${text.status ?? \"\"} |")], tests: RG_T, expectRed: [T14], alsoRed: [T55] },
	{ n: "B3/29", name: "feature status dropped from the table", edits: [one(RGS, "| ${text.status ?? \"\"} | ${ids.length} |", "| | ${ids.length} |")], tests: RG_T, expectRed: [T14], alsoRed: [T55] },
	{ n: "B3/30", name: "node headings indented by level again", edits: [one(RGS, "      out.push(`${mark} ${x.id} — ", "      out.push(`${\"  \".repeat(x.level - 1)}${mark} ${x.id} — ")], tests: RG_T, expectRed: [T14] },
	{ n: "B3/31", name: "a target line's move/share mark dropped", edits: [one(RGS, " -> ${t.to} [${v.verdict}]: proposed because", " -> ${t.to}: proposed because")], tests: RG_T, expectRed: [T16], alsoRed: [T8, T58, T59] },
	{ n: "B3/32", name: "a target line's current home dropped", edits: [one(RGS, "out.push(`${v.id} (home ${v.at}) -> ${t.to}", "out.push(`${v.id} -> ${t.to}")], tests: RG_T, expectRed: [T16] },
	{ n: "B3/33", name: "an asked target's question number dropped", edits: [one(RGS, "        const label = outcome === \"asked\" ? `asked in question ${qNum}`\n", "        const label = outcome === \"asked\" ? \"asked\"\n")], tests: RG_T, expectRed: [T16] },
	// Item 9: smaller refusals
	{ n: "B3/34", name: "lineage names compared untrimmed", edits: [one(RGS, "a.trim().toLowerCase() === b.trim().toLowerCase();", "a.toLowerCase() === b.toLowerCase();")], tests: RG_T, expectRed: [T9] },
	{ n: "B3/35", name: "a stray refuted entry accepted", edits: [one(RGS, "    if (ledgerIds.has(r.id) && !isDeclaredTarget(r.id, r.to)) problems.push(", "    if (false) problems.push(")], tests: RG_T, expectRed: [T40] },
	{ n: "B3/36", name: "a stray question about entry accepted", edits: [one(RGS, "        if (!isDeclaredTarget(a.id, a.to)) problems.push(", "        if (false) problems.push(")], tests: RG_T, expectRed: [T40] },
	{ n: "B3/37", name: "a stray claim verdict accepted", edits: [one(RGS, "    if (required.some((req) => matches(c, req))) continue;", "    continue;")], tests: RG_T, expectRed: [T41] },
	{ n: "B3/38", name: "a keep verdict carrying targets accepted", edits: [one(RGS, "      if ((v.targets ?? []).length > 0) problems.push(`regroup.review.verdicts: ${v.id}'s keep verdict carries a target", "      if (false) problems.push(`regroup.review.verdicts: ${v.id}'s keep verdict carries a target")], tests: RG_T, expectRed: [T42] },
	{ n: "B3/39", name: "a question without ask accepted", edits: [one(RGS, "    if (!nonEmpty(q.ask)) problems.push(", "    if (false) problems.push(")], tests: RG_T, expectRed: [T43] },
	// B3/40 retired at build 4 (DECLARED h): brief item 1 removed the copied STATUS pattern and statusProblems on purpose.
	{ n: "B3/41", name: "a frozen or retired feature with no rows counted as a gap", edits: [one(RGS, "    const isGap = x.node.status === \"proposed\" || (x.node.status === \"active\" && featureRowIds(x.node).length === 0);", "    const isGap = x.node.status === \"proposed\" || featureRowIds(x.node).length === 0;")], tests: RG_T, expectRed: [T45] },
	{ n: "B3/42", name: "an evidence citation's path not cut at the first space", edits: [one(RGS, "    .map((c) => c.split(\" \")[0])\n", "")], tests: RG_T, expectRed: [T46] },
	{ n: "B3/43", name: "an evidence citation's trailing :<line> or :<line>-<line> kept", edits: [one(RGS, "    .map((c) => c.replace(/:\\d+(?:-\\d+)?$/, \"\"))\n", "")], tests: RG_T, expectRed: [T46] },
	{ n: "B3/44", name: "the text-placed refusal's old wording (no \"names no path that exists\")", edits: [one(RGS, "${row.id}'s Evidence cell names no path that exists under the root, so it is text-placed, but regroup.placed has no reason for it", "${row.id} is text-placed (no evidence path under the root) but has no placed reason")], tests: RG_T, expectRed: [T47] },
	// Build brief 4 (seat, 2026-10-16): pairs for build 4's new checks and strengthened tests, in the brief's item order.
	// Item 1 (M1): a status is a string
	{ n: "B4/1", name: "a feature status's exact-type check dropped (a [\"proposed\"] status accepted)", edits: [one(RGS, "str(`tree[${ci}].features[${fj}].status`, feat.status);", ";")], tests: RG_T, expectRed: [T54] },
	// Item 2 (M2): the reserved rows in the feature table
	{ n: "B4/2", name: "FEAT-900's table row printed from the proposal again", edits: [one(RGS, "      const text = RESERVED_NODES.has(x.id) ? seedNodeText(x.id, ctx.seed) : x.node;", "      const text = x.node;")], tests: RG_T, expectRed: [T14, T55] },
	// Item 3 (M7, seat amendment 3): a share a merge or a demotion carries
	{ n: "B4/3", name: "R-1187 reads shares_added again, not also_applies against the input ledger (a merge's or a demotion's carried share unreviewed)", edits: [one(RGS, "    for (const id of x.node.also_applies ?? []) {", "    for (const id of x.node.shares_added ?? []) {")], tests: RG_T, expectRed: [T58, T59] },
	// Item 4 (M3): T14 and T16 pin the page
	{ n: "B4/4", name: "a question's recommendation dropped from the page", edits: [one(RGS, "`   Recommendation: ${q.recommendation}`", "`   Recommendation:`")], tests: RG_T, expectRed: [T14] },
	{ n: "B4/5", name: "a non-reserved node's purpose blanked on the page", edits: [one(RGS, "`Purpose: ${text.purpose ?? \"\"}`", "`Purpose: ${reserved ? text.purpose ?? \"\" : \"\"}`")], tests: RG_T, expectRed: [T14], alsoRed: [T57] },
	{ n: "B4/6", name: "a capability's outcome blanked on the page", edits: [one(RGS, "`Outcome: ${text.outcome ?? \"\"}`", "`Outcome: ${reserved ? text.outcome ?? \"\" : \"\"}`")], tests: RG_T, expectRed: [T14] },
	{ n: "B4/7", name: "a reserved node's seed outcome blanked on the page", edits: [one(RGS, "`Outcome: ${text.outcome ?? \"\"}`", "`Outcome: ${reserved ? \"\" : text.outcome ?? \"\"}`")], tests: RG_T, expectRed: [T14] },
	{ n: "B4/8", name: "a reported line's reason dropped from the page", edits: [one(RGS, "`- Reason: ${why}`", "`- Reason: `")], tests: RG_T, expectRed: [T16] },
	{ n: "B4/9", name: "a target's own reason dropped from the page", edits: [one(RGS, "proposed because ${t.reason} — ${label}", "proposed because — ${label}")], tests: RG_T, expectRed: [T16], alsoRed: [T8, T58, T59] },
	{ n: "B4/10", name: "a text-placed row's gist dropped from the page", edits: [one(RGS, ": \"${gist}\" — ${reason}`", ": \"\" — ${reason}`")], tests: RG_T, expectRed: [T16] },
	{ n: "B4/11", name: "a text-placed row's home dropped from the page", edits: [one(RGS, "`${row.id} -> ${home.get(row.id) ?? \"?\"}: \"${gist}\"", "`${row.id}: \"${gist}\"")], tests: RG_T, expectRed: [T16] },
	{ n: "B4/12", name: "a text-placed row's reason dropped from the page", edits: [one(RGS, ": \"${gist}\" — ${reason}`, \"\");", ": \"${gist}\"`, \"\");")], tests: RG_T, expectRed: [T16] },
	{ n: "B4/13", name: "the header's claim-verdict count wrong (one short)", edits: [one(RGS, "`Claim verdicts: ${(review.claims ?? []).length}`", "`Claim verdicts: ${(review.claims ?? []).length - 1}`")], tests: RG_T, expectRed: [T14] },
	{ n: "B4/14", name: "a feature's status mix wrong (each status counted once)", edits: [one(RGS, "counts.set(s, (counts.get(s) ?? 0) + 1);", "counts.set(s, 1);")], tests: RG_T, expectRed: [T14] },
	{ n: "B4/15", name: "a feature's row count its own rows only, not its subtree", edits: [one(RGS, "| ${ids.length} | ${statusMixOf(ids, ctx.rowStatus)} |", "| ${expandRowIds((x.node.rows ?? []).join(\",\")).length} | ${statusMixOf(ids, ctx.rowStatus)} |")], tests: RG_T, expectRed: [T14] },
	{ n: "B4/16", name: "the rejected claim's name dropped from the page", edits: [one(RGS, "`Rejected claim: ${label}`", "`Rejected claim:`")], tests: RG_T, expectRed: [T16] },
	{ n: "B4/17", name: "the appendix not grouped by node (its per-node headings dropped)", edits: [one(RGS, "      out.push(`### Appendix — ${x.id}`, \"\");\n", "")], tests: RG_T, expectRed: [T16] },
	{ n: "B4/18", name: "an asked target's question number dropped (\"asked in question\" kept)", edits: [one(RGS, "`asked in question ${qNum}`", "`asked in question`")], tests: RG_T, expectRed: [T16] },
	// Item 5 (M4): R-1172 per level, each case's claim kept in step
	{ n: "B4/19", name: "R-1172's outcome check dropped", edits: [one(RGS, "    if (x.level === 1 && String(x.node.outcome ?? \"\").startsWith(UNSORTED_PREFIX)) problems.push(", "    if (false) problems.push(")], tests: RG_T, expectRed: [T4] },
	{ n: "B4/20", name: "R-1172's purpose check skipped for a subgroup", edits: [one(RGS, "    if (String(x.node.purpose ?? \"\").startsWith(UNSORTED_PREFIX)) problems.push(", "    if (x.level !== 3 && String(x.node.purpose ?? \"\").startsWith(UNSORTED_PREFIX)) problems.push(")], tests: RG_T, expectRed: [T4] },
	{ n: "B4/21", name: "R-1172's purpose check skipped for a capability", edits: [one(RGS, "    if (String(x.node.purpose ?? \"\").startsWith(UNSORTED_PREFIX)) problems.push(", "    if (x.level !== 1 && String(x.node.purpose ?? \"\").startsWith(UNSORTED_PREFIX)) problems.push(")], tests: RG_T, expectRed: [T4] },
	// Item 6 (M5): the moved reason. Unlike 4/4, the multiset also checks a shortfall, so only a per-key count catches the move.
	{ n: "B4/22", name: "reasons keyed by heading text, counted as a multiset with a shortfall check (a moved reason passes)", edits: [
		one(RGS, "  const want = new Set(records.map((r) => `${r.line}|${r.to}`));", "  const __text = new Map(records.map((r) => [r.line, r.heading]));\n  const __k = (line, to) => `${__text.has(line) ? __text.get(line) : line}|${to}`;\n  const __want = new Map(); for (const lk of new Set(records.map((r) => `${r.line}|${r.to}`))) { const r = records.find((x) => `${x.line}|${x.to}` === lk); __want.set(__k(r.line, r.to), (__want.get(__k(r.line, r.to)) ?? 0) + 1); }\n  const want = new Set(__want.keys());"),
		one(RGS, "    const key = `${r.line}|${r.to}`;\n    if (!want.has(key))", "    const key = __k(r.line, r.to);\n    if (!want.has(key))"),
		one(RGS, "    if (n === 0) problems.push(`regroup.reasons: line ${line} -> ${to} has no reason`);\n    else if (n > 1) problems.push(", "    if (n < __want.get(key)) problems.push(`regroup.reasons: line ${line} -> ${to} has no reason`);\n    else if (n > __want.get(key)) problems.push("),
	], tests: RG_T, expectRed: [T52] },
	// Item 7 (M6): R-1170's plan print names every heading (print only; detectMoves's records are untouched)
	{ n: "B4/23", name: "capability heading lines dropped from the lift's plan print", edits: [one(LIFT, "  if (args.mapping) for (const r of detectMoves(text, mapping)) console.log(", "  if (args.mapping) for (const r of detectMoves(text, mapping).filter((r) => r.rows.length > 0 || !r.to.startsWith(\"CAP-\"))) console.log(")], tests: LIFT_T, expectRed: [T1] },
	{ n: "B4/24", name: "subgroup heading lines dropped from the lift's plan print", edits: [one(LIFT, "  if (args.mapping) for (const r of detectMoves(text, mapping)) console.log(", "  if (args.mapping) for (const r of detectMoves(text, mapping).filter((r) => r.rows.length > 0 || !r.to.startsWith(\"SUB-\"))) console.log(")], tests: LIFT_T, expectRed: [T1] },
	// Item 9: untested clauses
	{ n: "B4/25", name: "a review record naming no drafter lineage accepted", edits: [one(RGS, "  if (!nonEmpty(review.drafter)) problems.push(\"regroup.review: names no drafter lineage\");\n", "")], tests: RG_T, expectRed: [T53] },
	{ n: "B4/26", name: "a review record with an empty reviewer lineage accepted", edits: [one(RGS, "  if (!nonEmpty(review.reviewer)) problems.push(\"regroup.review: names no reviewer lineage\");\n", "")], tests: RG_T, expectRed: [T53] },
	{ n: "B4/27", name: "a refuted entry's empty reason accepted", edits: [one(RGS, "    if (!nonEmpty(r.reason)) problems.push(`regroup.refuted: ${r.id} -> ${r.to} has an empty reason`);\n", "")], tests: RG_T, expectRed: [T7] },
	{ n: "B4/28", name: "a move or share verdict with an empty targets array accepted", edits: [one(RGS, "    if (!targets.length) { problems.push(`regroup.review.verdicts: ${v.id}'s ${v.verdict} verdict names no target`); continue; }", "    if (!targets.length) { continue; }")], tests: RG_T, expectRed: [T7] },
	{ n: "B4/29", name: "a target refuted twice counted once", edits: [one(RGS, "  n += (proposal.regroup?.refuted ?? []).filter((r) => r.id === id && r.to === to).length;", "  n += (proposal.regroup?.refuted ?? []).some((r) => r.id === id && r.to === to) ? 1 : 0;")], tests: RG_T, expectRed: [T7] },
	{ n: "B4/30", name: "a run the lift refuses leaves an earlier page", edits: [one(RGS, "    if (liftRun.error) console.error(String(liftRun.error.message ?? liftRun.error));\n    removeEarlierPage(outPath);\n", "    if (liftRun.error) console.error(String(liftRun.error.message ?? liftRun.error));\n")], tests: RG_T, expectRed: [T48] },
	{ n: "B4/31", name: "the cap line prints the total, not the count of the rest", edits: [one(RGS, "`… and ${problems.length - PROBLEM_LINE_CAP} more problem(s)`", "`… and ${problems.length} more problem(s)`")], tests: RG_T, expectRed: [T11] },
	{ n: "B4/32", name: "a rejected claim's question matched by node alone, not node and field", edits: [one(RGS, "(c.node !== undefined ? a.node === c.node && a.field === c.field : a.line === c.line && a.to === c.to)", "(c.node !== undefined ? a.node === c.node : a.line === c.line && a.to === c.to)")], tests: RG_T, expectRed: [T23] },
	{ n: "B4/33", name: "a carried target printed unresolved on the page (T8's share through the command)", edits: [one(RGS, "          : outcome ?? \"unresolved\";", "          : outcome === \"carried\" ? \"unresolved\" : outcome ?? \"unresolved\";")], tests: RG_T, expectRed: [T8], alsoRed: [T58, T59] },
	// Item 10: page and behaviour fixes
	{ n: "B4/34", name: "an earlier page read at --out without the regular-file check (a FIFO hangs)", edits: [one(RGS, "  try { if (!statSync(real).isFile()) return; } catch { return; }\n", "")], tests: RG_T, expectRed: [T49] },
	{ n: "B4/35", name: "a target line's \"proposed because\" label dropped (the old bare-dash form)", edits: [one(RGS, "[${v.verdict}]: proposed because ${t.reason} — ${label}", "[${v.verdict}]: ${t.reason} — ${label}")], tests: RG_T, expectRed: [T16], alsoRed: [T8, T58, T59] },
	{ n: "B4/36", name: "a refuted target line without the refutation's own reason", edits: [one(RGS, "? `refuted — ${refuted.find((r) => r.id === v.id && r.to === t.to)?.reason ?? \"\"}`", "? \"refuted\"")], tests: RG_T, expectRed: [T16] },
	{ n: "B4/37", name: "a question about entry with an id but no to accepted", edits: [one(RGS, "        if (a.to === undefined) { problems.push(`regroup.questions: about entry names row ${a.id} but no target (\"to\")`); continue; }\n", "")], tests: RG_T, expectRed: [T7] },
	{ n: "B4/38", name: "an empty question about entry accepted", edits: [one(RGS, "      problems.push(\"regroup.questions: about entry names nothing (no id, node or line)\");\n", "")], tests: RG_T, expectRed: [T7] },
	{ n: "B4/39", name: "a claim-style about entry naming no rejected claim accepted", edits: [one(RGS, "        if (!matches.some((c) => c.verdict === \"reject\")) {", "        if (false) {")], tests: RG_T, expectRed: [T7] },
	{ n: "B4/40", name: "a citation's path after a \"·\" join not read", edits: [one(RGS, "    .flatMap((c) => c.split(\" · \"))\n", "")], tests: RG_T, expectRed: [T46] },
	{ n: "B4/41", name: "an active gap's evidence not shown on the page", edits: [one(RGS, "      const isGap = x.level === 2 && (x.node.status === \"proposed\" || (x.node.status === \"active\" && featureRowIds(x.node).length === 0));", "      const isGap = x.level === 2 && x.node.status === \"proposed\";")], tests: RG_T, expectRed: [T60] },
	{ n: "B4/42", name: "an empty reported-lines section prints no \"(none)\"", edits: [one(RGS, "return [\"## Reported lines (R-1170)\", \"\", \"(none)\", \"\"].join(", "return [\"## Reported lines (R-1170)\", \"\"].join(")], tests: RG_T, expectRed: [T50] },
	{ n: "B4/43", name: "an empty targets section prints no \"(none)\"", edits: [one(RGS, "return [\"## Move and share targets\", \"\", \"(none)\", \"\"].join(", "return [\"## Move and share targets\", \"\"].join(")], tests: RG_T, expectRed: [T50] },
	{ n: "B4/44", name: "the header's hash lines merged into one paragraph", edits: [one(RGS, "`Proposal SHA-256: ${sha}`, \"\", `Ledger pin SHA-256:", "`Proposal SHA-256: ${sha}`, `Ledger pin SHA-256:")], tests: RG_T, expectRed: [T56] },
	{ n: "B4/45", name: "a question's ask and recommendation merged into one paragraph", edits: [one(RGS, "`${i + 1}. ${q.ask}`, \"\", `   Recommendation:", "`${i + 1}. ${q.ask}`, `   Recommendation:")], tests: RG_T, expectRed: [T56] },
	{ n: "B4/46", name: "a node's Purpose and Outcome merged into one paragraph", edits: [one(RGS, "if (x.level === 1) out.push(\"\", `Outcome:", "if (x.level === 1) out.push(`Outcome:")], tests: RG_T, expectRed: [T57] },
	{ n: "B4/47", name: "a reported line's reason not a list item (merged into the line above)", edits: [one(RGS, "`- Reason: ${why}`", "`  Reason: ${why}`")], tests: RG_T, expectRed: [T57] },
	{ n: "B4/48", name: "a <placeholder> in a text-placed gist not escaped", edits: [one(RGS, "      const gist = escapeAngles(row.requirement.split(/\\s+/).slice(0, GIST_WORDS).join(\" \"));", "      const gist = row.requirement.split(/\\s+/).slice(0, GIST_WORDS).join(\" \");")], tests: RG_T, expectRed: [T51] },
	{ n: "B4/49", name: "a <placeholder> in the appendix not escaped", edits: [one(RGS, "${escapeAngles(row.requirement)}", "${row.requirement}")], tests: RG_T, expectRed: [T51] },
	// Build brief 5 (seat, 2026-10-16): one pair per item behaviour, in the brief's item order (DECLARED i).
	// Item 1: a padded status
	{ n: "B5/1", name: "a padded feature status accepted (the trimmed-self check dropped)", edits: [one(RGS, "      if (typeof feat.status === \"string\" && feat.status !== feat.status.trim()) {", "      if (false) {")], tests: RG_T, expectRed: [T62] },
	// Item 2: code spans on the page
	{ n: "B5/2", name: "angle brackets escaped inside code spans again", edits: [one(RGS, "  .map((part, i) => (i % 2 === 1 ? part : part.replace(/</g, \"&lt;\").replace(/>/g, \"&gt;\")))", "  .map((part) => part.replace(/</g, \"&lt;\").replace(/>/g, \"&gt;\"))")], tests: RG_T, expectRed: [T61] },
	// Item 3: R-1187's two clauses
	{ n: "B5/3", name: "R-1187's same-ID exemption dropped (a share the input ledger's feature already held, kept unchanged, refused)", edits: [one(RGS, "      if (alreadyShared.has(id)) continue;\n", "")], tests: RG_T, expectRed: [T64] },
	{ n: "B5/4", name: "R-1187 accepts any share verdict of the row, not one with that feature among its targets", edits: [one(RGS, "verdictFor(proposal, id)?.verdict === \"share\" && (verdictFor(proposal, id)?.targets ?? []).some((t) => t.to === to);", "verdictFor(proposal, id)?.verdict === \"share\";")], tests: RG_T, expectRed: [T65] },
	// Item 4: R-1170's exemption and heading text
	{ n: "B5/5", name: "R-1170's identity exemption dropped at the tree-ID read (a heading whose own tree ID equals its node prints a line)", edits: [one(LIFT, "      const oldId = treeIdAt.get(f.line) ?? null;", "      const oldId = null;")], tests: LIFT_T, expectRed: [T66], alsoRed: [T31] },
	{ n: "B5/6", name: "a printed heading line's text replaced (its Markdown marks dropped, so same-text headings still match)", edits: [one(LIFT, ": `line ${r.line}: ${r.heading} -> ${r.to}`);", ": `line ${r.line}: ${r.heading.replace(/^#+ /, \"\")} -> ${r.to}`);")], tests: LIFT_T, expectRed: [T1] },
	// Item 5: the page clauses, each for every node
	{ n: "B5/7", name: "FEAT-900's table status blanked (its row keeps the seed label)", edits: [one(RGS, "| ${text.status ?? \"\"} | ${ids.length} |", "| ${RESERVED_NODES.has(x.id) ? \"\" : text.status ?? \"\"} | ${ids.length} |")], tests: RG_T, expectRed: [T14, T55] },
	{ n: "B5/8", name: "a capability's label blanked on the page (CAP-02's; CAP-01's, which T57 reads, kept)", edits: [one(RGS, "${x.id} — ${text.label ?? \"\"}`", "${x.id} — ${x.level === 1 && !reserved && x.id !== \"CAP-01\" ? \"\" : text.label ?? \"\"}`")], tests: RG_T, expectRed: [T14] },
	{ n: "B5/9", name: "a subgroup's purpose blanked on the page (non-reserved subgroups only)", edits: [one(RGS, "`Purpose: ${text.purpose ?? \"\"}`", "`Purpose: ${x.level === 3 && !reserved ? \"\" : text.purpose ?? \"\"}`")], tests: RG_T, expectRed: [T14] },
	{ n: "B5/10", name: "a reserved subgroup (SUB-900) printed from the proposal, not the seed", edits: [one(RGS, "      const text = reserved ? seedNodeText(x.id, ctx.seed) : x.node;", "      const text = reserved && x.level !== 3 ? seedNodeText(x.id, ctx.seed) : x.node;")], tests: RG_T, expectRed: [T14] },
	{ n: "B5/11", name: "the appendix lists a subgroup's rows under its parent feature (no subgroup heading)", edits: [one(RGS, "      const ids = expandRowIds((x.node.rows ?? []).join(\",\"));\n      if (!ids.length) continue;\n      out.push(`### Appendix — ${x.id}`", "      if (x.level === 3) continue;\n      const ids = x.level === 2 ? featureRowIds(x.node) : expandRowIds((x.node.rows ?? []).join(\",\"));\n      if (!ids.length) continue;\n      out.push(`### Appendix — ${x.id}`")], tests: RG_T, expectRed: [T16] },
	{ n: "B5/12", name: "an asked target's question number fixed at 1", edits: [one(RGS, "`asked in question ${qNum}`", "`asked in question 1`")], tests: RG_T, expectRed: [T63] },
	// Item 6: a stale reason claim
	{ n: "B5/13", name: "a reason's claim never compared to the reason's current text (a reason reworded after review accepted)", edits: [one(RGS, "    if (req.text !== null && c.text !== req.text) problems.push(", "    if (req.text !== null && req.kind !== \"reason\" && c.text !== req.text) problems.push(")], tests: RG_T, expectRed: [T22] },
	// Item 7: the refusal rule, finished
	{ n: "B5/14", name: "the unknown-verdict refusal dropped (an unknown verdict falls through to \"names no target\")", edits: [one(RGS, "    if (!VERDICTS.includes(v.verdict)) { problems.push(`regroup.review.verdicts: ${v.id}'s verdict \"${v.verdict}\" is neither keep, move nor share`); continue; }\n", "")], tests: RG_T, expectRed: [T7] },
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
	// every test child. When this runner is started by plain node, it supplies the same three values `npm run` exports,
	// read once under the caller's own HOME.
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

/** Run one test file the way scripts/test.mjs does; resolve { code, out, timedOut, secs }. */
function runTest(rel) {
	const file = path.join(WT, rel);
	const cwd = path.dirname(path.dirname(file)); // the package dir (every test file here is <pkg>/tests/x)
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
		if (e.run) {
			const r = sh(process.execPath, e.run, { cwd: WT });
			if (r.status !== 0) return `run ${e.run.join(" ")} failed (exit ${r.status}): ${short((r.stderr || r.stdout).trim(), 160)}`;
			continue;
		}
		const abs = path.join(WT, e.file);
		const text = fs.readFileSync(abs, "utf8");
		if (e.re) {
			const c = [...text.matchAll(e.re)].length;
			if (c !== e.times) return `${e.file}: pattern matches ${c}× (want ${e.times}) — ${e.re}`;
			fs.writeFileSync(abs, text.replace(e.re, e.replacement));
		} else {
			const c = count(text, e.anchor);
			if (c !== e.times) return `${e.file}: anchor occurs ${c}× (want ${e.times}) — ${short(JSON.stringify(e.anchor), 90)}`;
			fs.writeFileSync(abs, text.split(e.anchor).join(e.replacement));
		}
	}
	return null;
}

// ── main ────────────────────────────────────────────────────────────────────────────────────
const only = process.argv.slice(2);
const pairs = only.length ? PAIRS.filter((p) => only.includes(p.n)) : PAIRS;
logFile = process.env.SEAT_MUTATE_OUT || null;
if (logFile) fs.writeFileSync(logFile, "");

fs.mkdirSync(RUNS, { recursive: true });
const branchHead = git("-C", LANE_REPO, "rev-parse", LANE_BRANCH).stdout.trim();
log(`seat-mutate: lane regroup, tip ${tipSha}${branchHead && branchHead !== tipSha ? ` (NOTE: ${LANE_BRANCH} is now ${branchHead})` : ""}, merge-base ${mergeBase}, ${pairs.length} pairs${DRY ? " (DRY: anchors only)" : ""}, ${process.platform}, node ${process.version}, ${new Date().toISOString()}`);
for (const d of DECLARED) log(`DECLARED ${d}`);
if (!tipSha || !mergeBase) { log("seat-mutate: tip or merge-base did not resolve"); process.exit(2); }
addWorktree(WT, tipSha);

const tally = { red: 0, exact: 0, namedGreen: 0, unnamedRed: 0, survived: 0, anchorMiss: 0, syntax: 0, runnable: 0 };
const survivors = [];
const basePass = {};
try {
	let baselineOk = true;
	if (!DRY) {
		// Baseline: every named file, unmutated, must exit 0 with no FAIL line. Another heavy job shares this machine, so a
		// red baseline file is re-run once alone before the runner concludes; the retry's result stands, both are logged.
		const files = [...new Set(pairs.flatMap((p) => p.tests))];
		for (const rel of files) {
			let ok = false;
			for (let attempt = 1; attempt <= 2 && !ok; attempt++) {
				resetWorktree();
				const r = await runTest(rel);
				const fl = lineTitles(r.out, "FAIL");
				ok = r.code === 0 && !r.timedOut && fl.length === 0;
				basePass[rel] = lineTitles(r.out, "PASS");
				log(`BASELINE${attempt === 2 ? " RETRY" : ""} ${ok ? "ok  " : "FAIL"} ${rel} (exit ${r.code}, ${basePass[rel].length} PASS, ${fl.length} FAIL, ${lineTitles(r.out, "SKIP").length} SKIP, ${r.secs}s)${ok ? "" : " — " + (fl.slice(0, 3).map((t) => short(t)).join(" | ") || short(r.out.trim().split("\n").slice(-3).join(" / "), 200))}`);
				if (!ok) fs.writeFileSync(path.join(HERE, `baseline-${path.basename(rel)}${attempt === 2 ? "-retry" : ""}.log`), r.out);
			}
			if (!ok) baselineOk = false;
		}
		// Every named title must be a PASS line in the baseline of one of the pair's files.
		for (const p of pairs) for (const title of [...p.expectRed, ...(p.alsoRed ?? [])]) {
			if (!p.tests.some((rel) => basePass[rel].some((t) => isTitle(t, title)))) { baselineOk = false; log(`BASELINE MISSING title for pair ${p.n}: ${JSON.stringify(title)} is not a PASS line in ${p.tests.join(", ")}`); }
		}
		resetWorktree();
	}
	if (!baselineOk) { log("seat-mutate: baseline not green — refusing to judge mutations"); process.exitCode = 2; }
	else {
		for (const p of pairs) {
			resetWorktree();
			const miss = applyEdits(p);
			if (miss) { tally.anchorMiss++; log(`ANCHOR-MISS ${p.n} ${p.name} — ${miss}`); continue; }
			const diff = git("-C", WT, "diff", "--shortstat").stdout.trim() || "no tracked change";
			let bad = null;
			for (const f of new Set(p.edits.map((e) => e.file).filter(Boolean))) {
				if (!/\.(mjs|js)$/.test(f)) continue;
				const chk = sh(process.execPath, ["--check", path.join(WT, f)]);
				if (chk.status !== 0) { bad = `${f}: ${chk.stderr.split("\n").slice(0, 4).join(" ")}`; break; }
			}
			if (bad) { tally.syntax++; log(`SYNTAX ${p.n} ${p.name} — ${bad}`); continue; }
			if (DRY) { log(`DRY ok ${p.n} ${p.name} (${diff})`); continue; }
			tally.runnable++;
			const judged = p.expectRed;
			const declared = p.alsoRed ?? [];
			const allFails = [], passTitles = [], crashed = [];
			for (const rel of p.tests) {
				const r = await runTest(rel);
				if (LOGDIR) fs.writeFileSync(path.join(LOGDIR, `${p.n.replace(/\//g, "-")}--${path.basename(rel)}.log`), r.out);
				passTitles.push(...lineTitles(r.out, "PASS"));
				allFails.push(...lineTitles(r.out, "FAIL").map((t) => ({ rel, t })));
				if (fileCrashed(r.out)) crashed.push(`${path.basename(rel)} THREW (later checks never ran): ${short(r.out.trim().split("\n").filter((l) => /^[A-Za-z]*Error\b/.test(l)).at(-1) ?? "", 120)}`);
				else if ((r.code !== 0 || r.timedOut) && !lineTitles(r.out, "FAIL").length) crashed.push(`${path.basename(rel)} exit ${r.code}${r.timedOut ? " (timeout)" : ""}: ${short(r.out.trim().split("\n").slice(-3).join(" / "), 160)}`);
				else if (r.code === 0 && lineTitles(r.out, "FAIL").length) crashed.push(`${path.basename(rel)} printed FAIL lines but exited 0`);
			}
			const failed = (title) => allFails.some(({ t }) => isTitle(t, title));
			const matched = judged.filter(failed);
			const namedGreen = judged.filter((s) => !failed(s) && passTitles.some((t) => isTitle(t, s)));
			const notReached = judged.filter((s) => !failed(s) && !passTitles.some((t) => isTitle(t, s)));
			const declaredRed = declared.filter(failed);
			const declaredGreen = declared.filter((s) => !failed(s));
			const unnamed = allFails.filter(({ t }) => ![...judged, ...declared].some((s) => isTitle(t, s)));
			const extra = `${declaredRed.length ? `; also (declared): ${declaredRed.map((s) => short(s, 80)).join(" | ")}` : ""}${declaredGreen.length ? `; declared but GREEN: ${declaredGreen.map((s) => JSON.stringify(s)).join(", ")}` : ""}${namedGreen.length ? `; named but GREEN: ${namedGreen.map((s) => JSON.stringify(s)).join(", ")}` : ""}${notReached.length ? `; named but NOT REACHED: ${notReached.map((s) => JSON.stringify(s)).join(", ")}` : ""}${unnamed.length ? `; UNNAMED red: ${unnamed.map(({ rel, t }) => `[${path.basename(rel)}] ${short(t, 110)}`).join(" | ")}` : ""}; ${allFails.length} FAIL total (${diff})${crashed.length ? `; CRASH ${crashed.join(" || ")}` : ""}`;
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
		removeWorktree(WT);
		fs.rmSync(SCRATCH, { recursive: true, force: true });
	}
}
if (DRY) log(`RESULT (DRY): ${pairs.length - tally.anchorMiss - tally.syntax}/${pairs.length} pairs apply${tally.anchorMiss ? `, ${tally.anchorMiss} ANCHOR-MISS` : ""}${tally.syntax ? `, ${tally.syntax} SYNTAX` : ""}`);
else log(`RESULT: ${tally.red}/${tally.runnable} red (${tally.exact} exactly their named titles, ${tally.namedGreen} with a named title green, ${tally.unnamedRed} with an unnamed red), ${tally.survived} survived${survivors.length ? ` [${survivors.join(", ")}]` : ""}${tally.anchorMiss ? `, ${tally.anchorMiss} ANCHOR-MISS` : ""}${tally.syntax ? `, ${tally.syntax} SYNTAX` : ""}`);
if (tally.anchorMiss || tally.syntax) process.exitCode = 3;
