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
const T18 = "R-291: every real heading's committed IDs survive expansion and leaf counts total 1,148";

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
	{ n: "2/6", name: "a failed run leaves an earlier page", edits: [one(RGS, "function removeEarlierPage(outPath) {\n  let existing;", "function removeEarlierPage(outPath) {\n  return;\n  let existing;")], tests: RG_T, expectRed: [T21] },
	{ n: "2/7", name: "a failed run removes any file at --out", edits: [one(RGS, "  if (existing.startsWith(PAGE_HEAD)) {", "  if (true) {")], tests: RG_T, expectRed: [T21] },
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
	{ n: "7/23", name: "question without recommendation accepted", edits: [one(RGS, "\"regroup.questions\")) if (!nonEmpty(q.recommendation)) problems.push(", "\"regroup.questions\")) if (false) problems.push(")], tests: RG_T, expectRed: [T13] },
	// Row 8: the page's opening parts (R-1178)
	{ n: "8/1", name: "questions after the table", edits: [one(RGS, "export const PAGE_SECTIONS = [\"header\", \"questions\", \"table\",", "export const PAGE_SECTIONS = [\"header\", \"table\", \"questions\",")], tests: RG_T, expectRed: [T14] },
	{ n: "8/2", name: "proof line omitted", edits: [one(RGS, "ctx.proofLine ?? \"lift proof: (not captured)\", \"\"];", "\"lift proof: (not captured)\", \"\"];")], tests: RG_T, expectRed: [T14] },
	{ n: "8/3", name: "status mix omitted", edits: [one(RGS, "out.push(`| ${x.id} | ${ids.length} | ${statusMixOf(ids, ctx.rowStatus)} |`);", "out.push(`| ${x.id} | ${ids.length} | |`);")], tests: RG_T, expectRed: [T14] },
	{ n: "8/4", name: "gap evidence omitted", edits: [one(RGS, "        out.push(`${indent}Evidence: ${ev.join(\", \")}`);\n", "")], tests: RG_T, expectRed: [T14] },
	{ n: "8/5", name: "claim counts omitted", edits: [one(RGS, "out.push(`Placement verdicts: ${(review.verdicts ?? []).length}`, `Claim verdicts: ${(review.claims ?? []).length}`, \"\");", "out.push(`Placement verdicts: ${(review.verdicts ?? []).length}`, \"\");")], tests: RG_T, expectRed: [T14] },
	{ n: "8/6", name: "same-family printed as another lineage", edits: [one(RGS, "(${ctx.same ? \"same-family review\" : \"another lineage\"})", "(another lineage)")], tests: RG_T, expectRed: [T15] },
	// Row 9: the page's lists (R-1179)
	{ n: "9/1", name: "moved row IDs omitted", edits: [one(RGS, "${r.rows.length ? ` (rows ${r.rows.join(\", \")})` : \"\"}`, `  Reason: ${why}`", "`, `  Reason: ${why}`")], tests: RG_T, expectRed: [T16] },
	{ n: "9/2", name: "share verdicts omitted", edits: [one(RGS, "      if (v.verdict !== \"move\" && v.verdict !== \"share\") continue;", "      if (v.verdict !== \"move\") continue;")], tests: RG_T, expectRed: [T16] },
	{ n: "9/3", name: "share outcome printed per row, not per target", edits: [one(RGS, "        const label = resolveTargetOutcome(ctx.proposal, v.id, t.to) ?? \"unresolved\";", "        const label = resolveTargetOutcome(ctx.proposal, v.id, (v.targets ?? [])[0]?.to) ?? \"unresolved\";")], tests: RG_T, expectRed: [T16] },
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
	{ n: "B2/8", name: "a reason's string line number accepted", edits: [one(RGS, "    if (!Number.isInteger(r.line)) { problems.push(`regroup.reasons: line ${JSON.stringify(r.line)} must be an integer, not its typed value`); continue; }", "    if (false) { continue; }")], tests: RG_T, expectRed: [T5] },
	{ n: "B2/9", name: "a claim's string line number accepted", edits: [one(RGS, "  for (const c of claims) if (c.line !== undefined && !Number.isInteger(c.line)) problems.push(", "  for (const c of claims) if (false) problems.push(")], tests: RG_T, expectRed: [T22] },
	{ n: "B2/10", name: "a refuted entry naming an unknown row accepted", edits: [one(RGS, "    if (!ledgerIds.has(r.id)) problems.push(`regroup.refuted: ${r.id} is not a row in this ledger`);", "    if (false) problems.push(`regroup.refuted: ${r.id} is not a row in this ledger`);")], tests: RG_T, expectRed: [T7] },
	{ n: "B2/11", name: "a placed entry naming an unknown row accepted", edits: [one(RGS, "  for (const id of Object.keys(placed)) if (!ledgerIds.has(id)) problems.push(", "  for (const id of Object.keys(placed)) if (false) problems.push(")], tests: RG_T, expectRed: [T10] },
	{ n: "B2/23", name: "a question's about entry naming an unknown row accepted", edits: [one(RGS, "      if (a.id !== undefined && !ledgerIds.has(a.id)) problems.push(", "      if (false) problems.push(")], tests: RG_T, expectRed: [T7] },
	{ n: "B2/12", name: "carried never reported", edits: [one(RGS, "  if (isCarried(proposal, id, to)) return \"carried\";", "  if (false) return \"carried\";")], tests: RG_T, expectRed: [T36] },
	{ n: "B2/13", name: "a move target counted as carried", edits: [one(RGS, "  return verdictFor(proposal, id)?.verdict === \"share\" && !!target?.node?.also_applies?.includes(id);", "  return !!target?.node?.also_applies?.includes(id);")], tests: RG_T, expectRed: [T36] },
	{ n: "B2/14", name: "lineages compared case-sensitively", edits: [one(RGS, "a.toLowerCase() === b.toLowerCase();", "a === b;")], tests: RG_T, expectRed: [T9] },
	{ n: "B2/15", name: "same_family accepted for different lineages", edits: [one(RGS, "  if (nonEmpty(review.drafter) && nonEmpty(review.reviewer) && !sameLineage(review.drafter, review.reviewer) && flagged) {", "  if (false) {")], tests: RG_T, expectRed: [T9] },
	{ n: "B2/16", name: "an active feature with no rows needs no evidence", edits: [one(RGS, "    if (x.level !== 2 || !(x.node.status === \"proposed\" || featureRowIds(x.node).length === 0)) continue;", "    if (x.level !== 2 || x.node.status !== \"proposed\") continue;")], tests: RG_T, expectRed: [T6] },
	{ n: "B2/17", name: "node labels dropped from the page", edits: [one(RGS, "out.push(`${indent}${mark} ${x.id} — ${x.node.label ?? \"\"}`, ", "out.push(`${indent}${mark} ${x.id}`, ")], tests: RG_T, expectRed: [T14] },
	{ n: "B2/18", name: "nodes listed flat (no indent, one heading level)", edits: [one(RGS, "      const indent = \"  \".repeat(x.level - 1);\n      const mark = \"#\".repeat(x.level + 2);", "      const indent = \"\";\n      const mark = \"###\";")], tests: RG_T, expectRed: [T14] },
	{ n: "B2/19", name: "old heading text dropped from reported lines", edits: [one(RGS, "out.push(`Line ${r.line}: \"${r.heading}\" -> ${r.to}", "out.push(`Line ${r.line} -> ${r.to}")], tests: RG_T, expectRed: [T16] },
	{ n: "B2/20", name: "the refuted-items section dropped", edits: [one(RGS, "\"placed\", \"refuted\", \"appendix\"];", "\"placed\", \"appendix\"];")], tests: RG_T, expectRed: [T16] },
	{ n: "B2/21", name: "a refuted item's reason dropped", edits: [one(RGS, "out.push(`${r.id} -> ${r.to}: refuted — ${r.reason}`, \"\");", "out.push(`${r.id} -> ${r.to}: refuted`, \"\");")], tests: RG_T, expectRed: [T16] },
	{ n: "B2/22", name: "the drafter's lineage dropped from the header", edits: [one(RGS, "    out.push(`Drafter: ${review.drafter}`, `Reviewer:", "    out.push(`Reviewer:")], tests: RG_T, expectRed: [T14] },
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
