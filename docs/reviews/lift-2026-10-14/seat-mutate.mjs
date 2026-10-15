#!/usr/bin/env node
// Seat mutation runner for lane lift (CHANGE.md §5 "Wrong code first": 58 pairs in six rows, as revised by the "Seat
// revision", "Seat revision 2" and "Plan review r1-r2" sections appended at the end; plus build brief 2's pair P).
// Form copied from docs/reviews/tree-2026-10-14/seat-mutate.mjs.
// For each pair: apply the wrong code or shipped text (never a test assertion) in a detached scratch worktree of the
// lane tip, refuse when an anchor does not occur the stated number of times (ANCHOR-MISS = runner bug), syntax-check
// every mutated module, run the named test files with node exactly as scripts/test.mjs does (package-dir cwd, fresh
// HOME/USERPROFILE/TMPDIR/TEMP/TMP, NANA_* but NANA_TEST_* and PI_CODING_AGENT_DIR scrubbed, gc.auto=0 through
// GIT_CONFIG_*, --experimental-strip-types, and the npm_config_prefix/globalconfig/userconfig that `npm test` exports
// when the runner itself was not started through npm), and print RED / GREEN (SURVIVED). A RED line also lists every
// named title that stayed GREEN and every UNNAMED red, so "reds exactly the titles named" is judged, not assumed.
//
// Pair ids: §5's "/"-separated variants run as separate pairs "row/k" (k = position in that row), each judged alone.
// Pair P is build brief 2 §1's pair (the path canonicalisation dropped).
//
// Test sets (declared before the run):
//   lift and proof pairs (rows 1-5, P) → requirements-lift.test.mjs (the only test that runs the lift or the proof;
//                                        templates-render reads only the lift source's flag spellings, which no pair
//                                        here changes)
//   skill pairs (6/1-6/3)              → templates-render, skill-claims, readme-check (all three read the skill)
//   ledger-row pair (6/4)              → requirements-tree
//
// Seat corrections to §5 (declared before the run; each prints as a DECLARED line, never hidden):
// (a) Row 2 says "T6 (the first ten) / T7", but the row holds twelve variants: eleven proof variants, then the import.
//     "the first ten" predates plan review r1/r2, which added the unterminated-row and mapping-run placement variants
//     (58 = 8 + 12 + 11 + 17 + 6 + 4). All eleven proof variants (2/1-2/11) name T6; 2/12 names T7.
// (b) 2/4, 2/5, 2/7: the proof has ONE prose rule for every node (proseMatches, requirements-lift-proof.mjs:309-319,
//     applied at :336-337) with no in-place / re-laid split. These pairs compute in-placeness inside the mutated proof
//     with the lift's own rule (a node whose declared rows equal its `from` sections' rows in input order) and loosen
//     the prose rule only for that kind of node.
// (c) 2/9: "the default's input-derived placement" is check 9 (the heading sequence derived from the input alone);
//     the pair applies check 9 to a --mapping run and leaves check 8 (input order) default-only.
// (d) 3/6: "a null or 128 git status read as clean" is applied to every status the gate judges (gitClean and
//     worktreeScan, requirements-lift.mjs:579-604). repoRootFor (:621-624) returns a path, not a verdict; left as is.
// (e) 3/7: the lift runs git from the repository top with a repo-relative path (requirements-lift.mjs:748, :765), so
//     dropping only "./" from `HEAD:./${relLedger}` changes nothing. The pair makes the wrong read the label names: the
//     expected ledger read as `HEAD:REQUIREMENTS.md`, which git resolves at the repository root.
// (f) 6/4: the row is added under FEAT-032 after R-1169 and the outline regenerated with
//     `node scripts/requirements-tree.mjs --write` (how a row is added), so only the leaf-total literal is stale.
// (g) Labels the code shape forces (no change to the wrong behaviour named): 1/1 drops the last row in both the
//     in-place and re-laid emitters; 1/2 holds back every in-place leaf's prose line (blank lines included) and emits
//     it at the start of the next node's body; 2/1 makes check 3 compare row IDs, not bytes; 2/2 makes check 6
//     compare each node's rows as sets; 5/4 replaces the seed's purpose and outcome with UNSORTED_TEXT where apply
//     reads them (seedNodeText), since the default mapping carries no text for a reserved node (§3.2).
//
// Never touches the lane worktree or the main checkout: everything runs in one detached scratch worktree in a
// mkdtemp folder under os.tmpdir() (never inside the lane folder), removed at the end
// (SEAT_MUTATE_KEEP=1 keeps it for inspection); git writes only its worktree metadata into the shared .git.
// SEAT_MUTATE_DRY=1 applies and syntax-checks every pair's edits and runs no test (an anchor check).
// Usage: SEAT_MUTATE_OUT=<file> [SEAT_MUTATE_TIP=<rev>] [SEAT_MUTATE_DRY=1] node seat-mutate.mjs [pair-id ...]
import { spawnSync, spawn } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const LANE_REPO = "/Users/jwang/nana-pi-wt/lift";
const LANE_BRANCH = "feat/lift";
const TIP = process.env.SEAT_MUTATE_TIP || "f6b34d4";
const HERE = path.dirname(fileURLToPath(import.meta.url));
// os.tmpdir(), never beside this script: a scratch git worktree inside the lane folder breaks copier-based suite
// tests run there ("No url found for submodule path …/wt"). The tree lane's runner ran from the session scratchpad.
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "lift-seat-mutate-"));
const WT = path.join(SCRATCH, "wt");
const RUNS = path.join(SCRATCH, "runs");
const KEEP = process.env.SEAT_MUTATE_KEEP === "1";
const DRY = process.env.SEAT_MUTATE_DRY === "1";
const LOGDIR = process.env.SEAT_MUTATE_LOGDIR || null; // per-pair test output, for evidence (seat copy only)
if (LOGDIR) fs.mkdirSync(LOGDIR, { recursive: true });
const TIMEOUT_MS = 10 * 60 * 1000;

const DECLARED = [
	"(a) row 2: all eleven proof variants (2/1-2/11) name T6, not \"the first ten\"; 2/12 names T7",
	"(b) 2/4, 2/5, 2/7: the proof has one prose rule for every node (matchProse, proof :377-386, applied at :405-406 at 0dc5d1d); the pairs compute in-placeness in the mutated proof and loosen the rule for that kind only",
	"(c) 2/9: check 9 (input-derived heading sequence) applied to a --mapping run; check 8 stays default-only",
	"(d) 3/6: null/128 read as clean in gitClean and worktreeScan (lift :579-604); repoRootFor (:621-624) left as is",
	"(e) 3/7: dropping only \"./\" is a no-op (git runs at the repo top with a repo-relative path, lift :748, :765); the pair reads the expected ledger as HEAD:REQUIREMENTS.md",
	"(f) 6/4: row added after R-1169 and the outline regenerated, so only the 1,136 literal is stale",
	"(g) 1/1 both emitters; 1/2 in-place prose (blanks included) emitted at the next node; 2/1 check 3 by ID; 2/2 check 6 as sets; 5/4 at seedNodeText",
	"(h) build 3 re-anchors: 2/3 skips every stray-line check the proof now has (matchProse's non-blank refusal, interleaved and trailing, proof :380, :384, with the skipped lines marked consumed, and the whole-output stray scan, :450); 2/4, 2/5, 2/7 at matchProse (:405-406), 2/5 sorting the region's {seg, idx} entries by seg; 3/4 at writeLedgerAtomic's re-read (lift :673)",
	"(j) build 5 (tip f6b34d4): 5/5 re-anchored to its original two default-mapping sites (`(h) => h.level === 2 && KEPT_SECTIONS.includes(h.label)`, lift :273, :340); build 5's structuralTailLines (lift :234) uses the same filter text and is left unmutated. New pairs: T1 isTableHeaderAt's row check dropped in lift and proof (T1/1 lift only, T1/2 proof only); T2 base refusals reported alone before the later stage again; T3 head/tail field-label exemption removed (T3/1 head only, T3/2 tail only); T4/1-T4/4 --verify's mapping-blob NUL, encoding, JSON and version refusals each dropped (lift :991, :993, :996, :998)",
	"(i) build 4/4b re-anchors (tip 9eadde0): 4/17 at validateMapping's new last-emitted-line rule (`if (!nothingAfter) problems.push(`, lift :541), disabled whole as before; new pair M (build brief 4 §A \"Rule\"): the proof's input-derived multiset comparison (proof :591) disabled; judged on T6 and, inside T6's FAIL detail, the three tz labels the build added for it",
];

// ── test files ──────────────────────────────────────────────────────────────────────────────
const LT = "packages/nana-pack/tests/requirements-lift.test.mjs";
const TR = "packages/nana-pack/tests/templates-render.test.mjs";
const SC = "packages/nana-pack/tests/skill-claims.test.mjs";
const RC = "packages/nana-pack/tests/readme-check.test.mjs";
const RT = "packages/nana-pack/tests/requirements-tree.test.mjs";

// ── mutated files ───────────────────────────────────────────────────────────────────────────
const LIFT = "scripts/requirements-lift.mjs";
const PROOF = "scripts/requirements-lift-proof.mjs";
const REQ_SKILL = "packages/nana-pack/skills/requirements/SKILL.md";
const LEDGER = "REQUIREMENTS.md";

// ── titles (exact, as the suite prints them; seat-titles.mjs build 1 plus build brief 2's) ─────
const T1 = "R-1162: a dry run prints one line per planned heading, no move, and the proof line, and writes nothing";
const T2 = "R-1162: --emit-mapping writes only the named new file and refuses one that exists";
const T3 = "R-1162: run through a symlink to the script, the dry run still prints its plan";
const T31 = "R-1162: --emit-mapping on a lifted ledger writes the identity mapping, which --mapping applies with no move line and the same bytes";
const T4 = "R-1163: the default lift passes its proof, keeps every row line byte-identical and in file order, the row-ID multiset equal and the tree checker clean";
const T5 = "R-1163: CRLF, BOM-and-CRLF, mixed-ending and unterminated ledgers keep every row line byte-identical with its own ending";
const T6 = "R-1163: the proof names a dropped row, a changed byte, a stripped CR, a new row-shaped line, a reordered leaf, a lost prose line, prose moved to another node, a dropped blank line and two swapped lines in an in-place leaf, and, with no mapping, a leaf's rows and a section's lines out of input order";
const T7 = "R-1163: the proof module imports nothing from the lift module";
const T8 = "R-1164: --write replaces a clean tracked ledger with the proved bytes in a project in a subfolder of its repository";
const T9 = "R-1164: --write refuses an uncommitted, staged-only, untracked or git-less ledger, an unborn HEAD, git missing from PATH and an uncommitted ledger edit in a second worktree, naming that worktree, and leaves the ledger unchanged";
const T10 = "R-1164: --write refuses a mapping file in a subfolder that is untracked or differs from HEAD, and one outside the repository, naming the reason, and accepts a committed one";
const T11 = "R-1164: --write accepts a clean CRLF checkout under core.autocrlf=true and keeps its CRLF rows";
const T12 = "R-1164: --write refuses when the ledger changes between the proof and the rename";
const T32 = "R-1164: --write and --verify relate the ledger and mapping to the repository when --root is spelled differently from git's top level";
const T13 = "R-1165: the default makes each Part a capability and each ## and ### a feature and subgroup in file order, keeping old heading text as labels and the title and intro in place";
const T14 = 'R-1165: every default purpose and outcome starts with the unsorted prefix, and the prefix is "Not yet sorted:"';
const T15 = "R-1165: sections under no Part, and sections after the general-engineering sections, open a Not yet sorted capability";
const T16 = "R-1165: the general-engineering sections take the seed's CAP-90, FEAT-900 and SUB-900 to SUB-904 headings, purposes and row homes";
const T17 = "R-1165: Open questions and Deliberate omissions stay verbatim under the seed's closing heading";
const T18 = "R-1165: prose between table fragments stays between them, and each headless or padded fragment gets the exact table header";
const T19 = "R-1166: the mapping --emit-mapping writes, passed back with --mapping, gives the default lift's bytes";
const T20 = "R-1166: a mapping applies to a lifted ledger, moving rows between features in its order and naming each move";
const T21 = "R-1166: one mapping applies to a ledger's LF and CRLF copies";
const T22 = "R-1167: the lift refuses a UTF-16 ledger, an ANSI line that is not valid UTF-8, a ledger with no rows, a fenced row, a level-4 or setext heading, an Also applies line and a carried field line, naming each line";
const T23 = "R-1167: without --mapping, the lift refuses a ledger with a tree or near-tree heading, or a row the default cannot place, naming them";
const T24 = "R-1167: a mapping is refused, each problem named, for another ledger's pin, a missing, repeated or unknown row, an old heading named twice or never, a G row outside its seed subgroup, an R row in a reserved node and a row under a proposed feature";
const T25 = "R-1167: a UTF-16, ANSI or line-broken mapping file, or one outside the root, is refused naming the reason, and one with a BOM is accepted";
const T26 = "R-1167: a mapping missing 1,000 rows prints at most the problem-line cap and the count of the rest";
const T27 = "R-1167 fixture: a run without --root, or with --write and --emit-mapping together, exits 2 with usage";
const T28 = "R-1168: --verify passes a committed lift with its mapping in a subfolder against its base and names a hand-edited one's first differing line, in a project in a subfolder";
const T29 = "requirements skill names the lift's dry run, the owner's yes before --write, a clean ledger in every worktree, never discarding another session's lines, and only flags the lift has";
const T33 = "R-1163: a 4-column table that holds no requirement row keeps its header and delimiter lines, flat and tree-form";
const T34 = "R-1167: one refusal names every base problem, and a field-labelled line in the head or tail is not one";
const T35 = "R-1168: --verify refuses an ANSI byte or a repeated row ID in the ledger blob, and a NUL byte, an encoding mismatch, invalid JSON or another lift version in the mapping blob, exactly as --write would for the same bytes on disk";
const T30 = "R-291: every real heading's committed IDs survive expansion and leaf counts total 1,136";
void T1; void T14; void T19; void T23; void T27; // titles §5 names in no pair; kept for the record

// ── edits ───────────────────────────────────────────────────────────────────────────────────
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const times = (file, anchor, replacement, n) => ({ file, anchor, replacement, times: n });
const regex = (file, re, replacement, n) => ({ file, re, replacement, times: n });
const run = (args) => ({ run: args });

const LIFT_T = [LT];
const SKILL_T = [TR, SC, RC];
const LEDGER_T = [RT];

// The lift's own in-place rule, written inside the mutated proof for 2/4, 2/5, 2/7 (correction (b)).
const IN_PLACE = "    const __inRows = [];\n    for (const f of node.from ?? []) { const hl = scanHeadings(inBare, inFenced).map((x) => x.line).filter((l) => l > f.line).sort((a, b) => a - b); const e = hl.length ? hl[0] - 1 : inBare.length; for (let k = f.line; k < e; k++) { const r = requirementRowId(inBare[k]); if (r) __inRows.push(r); } }\n    const __inPlace = JSON.stringify(__inRows) === JSON.stringify(nodeRows(node));\n";
const PROSE_AT = "    const expected = expectedProseFor(node.from);\n    if (!matchProse(expected, prose)) problems.push(";
const ROW_KEPT = "    if (o === seg) keptCount++;";
const ROW_CHECK = "  return Boolean(requirementRowId(bareLines[j] ?? \"\"));"; // isTableHeaderAt's build-5 row check (lift :105, proof :84)
const HEADTAIL = "    if (i < headEnd || tailLines.has(i)) continue; // head/tail prose: carried verbatim, never replaced\n";
const CHECK8_ROWS = "    if (JSON.stringify(got) !== JSON.stringify(fromRows)) problems.push(";

const sh = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...opts });
const GIT_SAFE = ["-c", "core.hooksPath=/dev/null"];
const git = (...args) => sh("git", [...GIT_SAFE, ...args]);
const tipSha = git("-C", LANE_REPO, "rev-parse", "--verify", `${TIP}^{commit}`).stdout.trim();
const mergeBase = git("-C", LANE_REPO, "merge-base", "main", tipSha).stdout.trim();

// Frozen table. `expectRed` are the titles §5 names; `alsoRed` the seat's declared corrections (none for this lane).
const PAIRS = [
	// Row 1: apply
	{ n: "1/1", name: "apply drops a leaf's last row", edits: [one(LIFT, "          out.push(segs[i]); inTable = true; i++; continue;", "          if (bareLines.slice(i + 1, end).some((l) => requirementRowId(l))) out.push(segs[i]); inTable = true; i++; continue;"), one(LIFT, "...rows.map((id) => rowSegs.get(id) ?? \"\")]", "...rows.slice(0, -1).map((id) => rowSegs.get(id) ?? \"\")]")], tests: LIFT_T, expectRed: [T4, T8] },
	{ n: "1/2", name: "apply carries a section's prose into the next node", edits: [one(LIFT, "function sectionBody(node, segs, bareLines, fenced, allHeadingLines, mode) {\n  const out = [];", "let __CARRY = [];\nfunction sectionBody(node, segs, bareLines, fenced, allHeadingLines, mode) {\n  const out = __CARRY.splice(0);"), one(LIFT, "        out.push(segs[i]); inTable = false; i++;", "        __CARRY.push(segs[i]); inTable = false; i++;")], tests: LIFT_T, expectRed: [T4, T8] },
	{ n: "1/3", name: "apply rejoins lines with one ending", edits: [one(LIFT, "  return (text.startsWith(BOM) ? BOM : \"\") + out.join(\"\");", "  return (text.startsWith(BOM) ? BOM : \"\") + out.map(bare).join(eol) + (out.length ? eol : \"\");")], tests: LIFT_T, expectRed: [T5] },
	{ n: "1/4", name: "apply trims trailing space on copied lines", edits: [one(LIFT, "  const segs = segments(text);\n  const bareLines = segs.map(bare);", "  const segs = segments(text).map((s) => s.replace(/[ \\t]+(\\r?\\n)?$/, \"$1\"));\n  const bareLines = segs.map(bare);")], tests: LIFT_T, expectRed: [T4] },
	{ n: "1/5", name: "apply sorts a leaf by ID", edits: [one(LIFT, "  const emitBody = (node) => {\n    const rows = expandRowIds((node.rows ?? []).join(\",\"));", "  const emitBody = (node) => {\n    node = { ...node, rows: expandRowIds((node.rows ?? []).join(\",\")).sort() };\n    const rows = node.rows;")], tests: LIFT_T, expectRed: [T4, T20] },
	{ n: "1/6", name: "apply puts an in-place section's prose above one table", edits: [one(LIFT, "    if (isInPlace(node, bareLines, allHeadingLines)) return sectionBody(", "    if (false && isInPlace(node, bareLines, allHeadingLines)) return sectionBody(")], tests: LIFT_T, expectRed: [T18] },
	{ n: "1/7", name: "apply keeps a padded header", edits: [one(LIFT, "          const eol = eolOf(segs[i + 1]);\n          out.push(`${TABLE_HEADER}${eol}`, `${TABLE_DELIMITER_TEXT}${eol}`);", "          const eol = eolOf(segs[i + 1]);\n          out.push(segs[i], segs[i + 1]);")], tests: LIFT_T, expectRed: [T18, T4] },
	{ n: "1/8", name: "apply inserts no header before a headless fragment", edits: [one(LIFT, "          if (!inTable) { const eol = eolOf(segs[i]); out.push(`${TABLE_HEADER}${eol}`, `${TABLE_DELIMITER_TEXT}${eol}`); }\n", "")], tests: LIFT_T, expectRed: [T18, T4] },
	// Row 2: proof
	{ n: "2/1", name: "proof compares IDs only (check 3 by ID, not bytes)", edits: [one(PROOF, ROW_KEPT, "    if (requirementRowId(bare(o)) === id) keptCount++;")], tests: LIFT_T, expectRed: [T6] },
	{ n: "2/2", name: "proof skips the order check (check 6 compares sets)", edits: [one(PROOF, "    if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(", "    if (JSON.stringify([...got].sort()) !== JSON.stringify([...want].sort())) problems.push(")], tests: LIFT_T, expectRed: [T6] },
	{ n: "2/3", name: "proof skips the stray-line check", edits: [one(PROOF, "      while (j < actual.length && actual[j].seg !== e && isBlankSeg(actual[j].seg) && !isBlankSeg(e)) { consumed[actual[j].idx] = true; j++; }", "      while (j < actual.length && actual[j].seg !== e) { consumed[actual[j].idx] = true; j++; }"), one(PROOF, "    while (j < actual.length) { if (!isBlankSeg(actual[j].seg)) return false; consumed[actual[j].idx] = true; j++; }", "    while (j < actual.length) { consumed[actual[j].idx] = true; j++; }"), one(PROOF, "  if (strayLines.length) problems.push(", "  if (false) problems.push(")], tests: LIFT_T, expectRed: [T6] },
	{ n: "2/4", name: "proof skips blank lines in an in-place leaf", edits: [one(PROOF, PROSE_AT, IN_PLACE + "    const expected = expectedProseFor(node.from).filter((s) => !(__inPlace && isBlankSeg(s)));\n    if (!matchProse(expected, prose)) problems.push(")], tests: LIFT_T, expectRed: [T6] },
	{ n: "2/5", name: "proof ignores line order in an in-place leaf", edits: [one(PROOF, PROSE_AT, IN_PLACE + "    const expected = expectedProseFor(node.from);\n    if (!(__inPlace ? matchProse([...expected].sort(), [...prose].sort((a, b) => (a.seg < b.seg ? -1 : a.seg > b.seg ? 1 : 0))) : matchProse(expected, prose))) problems.push(")], tests: LIFT_T, expectRed: [T6] },
	{ n: "2/6", name: "proof skips the default's input-order check (check 8)", edits: [one(PROOF, CHECK8_ROWS, "    if (false) problems.push(")], tests: LIFT_T, expectRed: [T6] },
	{ n: "2/7", name: "proof skips blank lines in a re-laid leaf", edits: [one(PROOF, PROSE_AT, IN_PLACE + "    const expected = expectedProseFor(node.from).filter((s) => !(!__inPlace && isBlankSeg(s)));\n    if (!matchProse(expected, prose)) problems.push(")], tests: LIFT_T, expectRed: [T6] },
	{ n: "2/8", name: "proof derives the default's headings from the mapping", edits: [one(PROOF, "    const derived = deriveDefaultSequence(inputText, seed);", "    const derived = mappingNodes(mapping).map(({ id, level, parent }) => ({ id, level, parent }));")], tests: LIFT_T, expectRed: [T6] },
	{ n: "2/9", name: "proof applies the default's input-derived placement to a --mapping run", edits: [one(PROOF, "  if (fromDefault) {\n    const derived = deriveDefaultSequence(inputText, seed);", "  {\n    const derived = deriveDefaultSequence(inputText, seed);"), one(PROOF, "      if (!(node.from ?? []).length) continue;\n      const fromRows = [];", "      if (!fromDefault || !(node.from ?? []).length) continue;\n      const fromRows = [];")], tests: LIFT_T, expectRed: [T6] },
	{ n: "2/10", name: "proof skips the reserved-node row check", edits: [one(PROOF, "  for (const row of outRows) {", "  for (const row of []) {")], tests: LIFT_T, expectRed: [T6] },
	{ n: "2/11", name: "proof lets an unterminated last row gain an ending", edits: [one(PROOF, ROW_KEPT, "    if (o === seg || (!/\\n$/.test(seg) && (o === seg + \"\\n\" || o === seg + \"\\r\\n\"))) keptCount++;")], tests: LIFT_T, expectRed: [T6] },
	{ n: "M", name: "proof skips the input-derived line-accounting count (the multiset of non-blank segments)", edits: [one(PROOF, "    if (JSON.stringify([...inMulti].sort()) !== JSON.stringify([...outMulti].sort())) {", "    if (false) {")], tests: LIFT_T, expectRed: [T6], expectWhy: ["an extra, rowless header pair appended after a table", "a second Purpose: line in a node", "a stray fenced block between the head and the first node"] },
	{ n: "2/12", name: "proof imports a helper from the lift module", edits: [one(PROOF, "import { requirementRowId } from \"./requirements-trace.mjs\";\n", "import { requirementRowId } from \"./requirements-trace.mjs\";\nimport { isFlatLedger } from \"./requirements-lift.mjs\";\n")], tests: LIFT_T, expectRed: [T7] },
	// Row 3: gate, verify, emit, guard, identity
	{ n: "3/1", name: "gate drops `ls-files`", edits: [one(LIFT, "  const lsErr = git(cwd, [\"ls-files\", \"--error-unmatch\", \"--\", relPath]);\n  if (lsErr.status === null) return { ok: false, reason: \"git is not on PATH\" };\n  if (lsErr.status !== 0) return { ok: false, reason: `${relPath} is untracked` };\n", "")], tests: LIFT_T, expectRed: [T9] },
	{ n: "3/2", name: "gate byte-compares with `git show`", edits: [one(LIFT, "  const diff = git(cwd, [\"diff\", \"--quiet\", \"HEAD\", \"--\", relPath]);", "  const diff = (() => { const s = spawnSync(\"git\", [\"show\", `HEAD:./${relPath}`], { cwd }); if (s.status !== 0) return { status: s.status }; let cur; try { cur = readFileSync(join(cwd, relPath)); } catch { return { status: 1 }; } return { status: s.stdout.equals(cur) ? 0 : 1 }; })();")], tests: LIFT_T, expectRed: [T11] },
	{ n: "3/3", name: "gate skips the mapping", edits: [one(LIFT, "  if (mappingPath) {\n    const relMap", "  if (false && mappingPath) {\n    const relMap")], tests: LIFT_T, expectRed: [T10] },
	{ n: "3/4", name: "gate skips the re-read", edits: [one(LIFT, "  if (!reread.equals(provedBuf)) return { ok: false, reason:", "  if (false && !reread.equals(provedBuf)) return { ok: false, reason:")], tests: LIFT_T, expectRed: [T12] },
	{ n: "3/5", name: "gate skips the worktree scan", edits: [one(LIFT, "  const wtScan = worktreeScan(repoRoot, relLedger);", "  const wtScan = { ok: true };")], tests: LIFT_T, expectRed: [T9] },
	{ n: "3/6", name: "gate reads a null or 128 git status as clean", edits: [one(LIFT, "  if (lsErr.status === null) return { ok: false, reason: \"git is not on PATH\" };\n  if (lsErr.status !== 0) return", "  if (lsErr.status !== 0 && lsErr.status !== null && lsErr.status !== 128) return"), one(LIFT, "  if (diff.status === null) return { ok: false, reason: \"git is not on PATH\" };\n  if (diff.status === 128) return { ok: false, reason: \"HEAD has no commit yet; commit the ledger first\" };\n  if (diff.status !== 0) return", "  if (diff.status !== 0 && diff.status !== null && diff.status !== 128) return"), one(LIFT, "  if (list.status !== 0) return", "  if (list.status !== 0 && list.status !== null && list.status !== 128) return"), one(LIFT, "    if (diff.status === 0) continue;", "    if (diff.status === 0 || diff.status === null || diff.status === 128) continue;")], tests: LIFT_T, expectRed: [T9] },
	{ n: "3/7", name: "verify reads `HEAD:REQUIREMENTS.md` without `./`", edits: [one(LIFT, "  const expected = git(repoRoot, [\"show\", `HEAD:./${relLedger}`]);", "  const expected = git(repoRoot, [\"show\", \"HEAD:REQUIREMENTS.md\"]);")], tests: LIFT_T, expectRed: [T28] },
	{ n: "3/8", name: "`--emit-mapping` overwrites", edits: [one(LIFT, "    if (existsSync(dest)) { console.error(`${dest}: already exists`); return 1; }\n", "")], tests: LIFT_T, expectRed: [T2] },
	{ n: "3/9", name: "the guard uses the resolve form", edits: [one(LIFT, "if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) process.exit(main());", "if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) process.exit(main());")], tests: LIFT_T, expectRed: [T3] },
	{ n: "3/10", name: "`--emit-mapping` refuses a ledger the tree checker passes", edits: [one(LIFT, "    if (ct.problems.length === 0) {\n      mapping = buildIdentityMapping(text);", "    if (ct.problems.length === 0) {\n      if (args.emitMapping) { console.error(`${ledgerPath}: --emit-mapping refuses a ledger that already passes the tree checker`); return 1; }\n      mapping = buildIdentityMapping(text);")], tests: LIFT_T, expectRed: [T31] },
	{ n: "3/11", name: "the identity mapping lists a leaf's rows sorted by ID", edits: [one(LIFT, "  const rowsFor = (h) => h.rows.slice();", "  const rowsFor = (h) => h.rows.slice().sort();")], tests: LIFT_T, expectRed: [T31] },
	// Build brief 2 §1
	{ n: "P", name: "the path canonicalisation dropped (canonical() returns its input)", edits: [one(LIFT, "function canonical(p) { try { return REALPATH(p); } catch { return p; } }", "function canonical(p) { return p; }")], tests: LIFT_T, expectRed: [T32] },
	// Row 4: refusals
	{ n: "4/1", name: "ledger byte round-trip dropped", edits: [one(LIFT, "  const encLine = firstEncodingMismatchLine(buf);\n  if (encLine !== null) problems.push(", "  const encLine = null;\n  if (encLine !== null) problems.push(")], tests: LIFT_T, expectRed: [T22] },
	{ n: "4/2", name: "mapping byte round-trip dropped", edits: [one(LIFT, "  const encLine = firstEncodingMismatchLine(buf);\n  if (encLine !== null) return { problems:", "  const encLine = null;\n  if (encLine !== null) return { problems:")], tests: LIFT_T, expectRed: [T25] },
	{ n: "4/3", name: "mapping BOM kept", edits: [one(LIFT, "  let raw = buf.toString(\"utf8\");\n  if (raw.startsWith(BOM)) raw = raw.slice(1);\n", "  let raw = buf.toString(\"utf8\");\n")], tests: LIFT_T, expectRed: [T25] },
	{ n: "4/4", name: "`--mapping` outside `--root` accepted", edits: [one(LIFT, "    if (!realMap.startsWith(realRoot + sep) && realMap !== realRoot) {", "    if (false) {")], tests: LIFT_T, expectRed: [T25] },
	{ n: "4/5", name: "the flat test counts with `readRequirementRows`", edits: [one(LIFT, "  const n = countRequirementRowLines(ct.parsed);", "  const n = readRequirementRows(ct.parsed).length;")], tests: LIFT_T, expectRed: [T18] },
	{ n: "4/6", name: "pin hashes raw bytes", edits: [one(LIFT, "  const lf = stripBom(text).replace(/\\r\\n/g, \"\\n\").replace(/\\r/g, \"\\n\");", "  const lf = text;")], tests: LIFT_T, expectRed: [T21] },
	{ n: "4/7", name: "`--mapping` refuses a tree input", edits: [one(LIFT, "    mapping = read.mapping;\n", "    if (checkTree(text).problems.length === 0) { console.error(`${ledgerPath}: --mapping refuses a ledger that already holds a tree`); return 1; }\n    mapping = read.mapping;\n")], tests: LIFT_T, expectRed: [T20] },
	{ n: "4/8", name: "validator accepts a G row in another reserved subgroup", edits: [one(LIFT, "        else if (level === 3 ? id !== wantSub : (node.subgroups ?? []).length === 0 && wantSub) problems.push(", "        else if (false) problems.push(")], tests: LIFT_T, expectRed: [T24] },
	{ n: "4/9", name: "validator accepts a heading named twice", edits: [one(LIFT, "      else if (n > 1) problems.push(", "      else if (false) problems.push(")], tests: LIFT_T, expectRed: [T24] },
	{ n: "4/10", name: "fenced-row check dropped", edits: [one(LIFT, "    if (fenced[i]) { problems.push(`line ${i + 1}: requirement row ${id} is inside a code fence`); continue; }", "    if (fenced[i]) { continue; }")], tests: LIFT_T, expectRed: [T22] },
	{ n: "4/11", name: "setext check dropped", edits: [one(LIFT, "    if (h.setext) { problems.push(`line ${h.line}: setext heading is not supported; use an ATX \"#\" heading`); continue; }", "    if (h.setext) { continue; }")], tests: LIFT_T, expectRed: [T22] },
	{ n: "4/12", name: "mapping NUL check dropped", edits: [one(LIFT, "  if (buf.includes(0)) return { problems: [`${path}: NUL byte; likely UTF-16 from Windows PowerShell 5.1; save it as UTF-8`] };\n", "")], tests: LIFT_T, expectRed: [T25] },
	{ n: "4/13", name: "cap removed", edits: [one(LIFT, "  if (problems.length <= PROBLEM_LINE_CAP) return problems;", "  return problems;")], tests: LIFT_T, expectRed: [T26] },
	{ n: "4/14", name: "repeated-row-ID check dropped", edits: [one(LIFT, "    if (seenIds.has(id)) problems.push(`line ${i + 1}: requirement row ${id} repeats line ${seenIds.get(id)}`);\n    else seenIds.set(id, i + 1);", "    seenIds.set(id, i + 1);")], tests: LIFT_T, expectRed: [T22] },
	{ n: "4/15", name: "invalid-JSON check dropped", edits: [one(LIFT, "  try { parsed = JSON.parse(raw); } catch (e) { return { problems: [`${path}: not valid JSON (${e.message})`] }; }", "  parsed = JSON.parse(raw);")], tests: LIFT_T, expectRed: [T25] },
	{ n: "4/16", name: "mapping version check dropped", edits: [one(LIFT, "  if (parsed.lift !== MAPPING_FORMAT) return { problems: [`${path}: mapping is lift version ${JSON.stringify(parsed.lift)}, not ${MAPPING_FORMAT}`] };\n", "")], tests: LIFT_T, expectRed: [T25] },
	{ n: "4/17", name: "a line after an unterminated last row accepted", edits: [one(LIFT, "      if (!nothingAfter) problems.push(", "      if (false) problems.push(")], tests: LIFT_T, expectRed: [T24] },
	// Row 5: the default mapping
	{ n: "5/1", name: "the title becomes a capability", edits: [one(LIFT, "  const title = all[0] && all[0].level === 1 && all[0].line === 1 ? all[0] : null;", "  const title = null;")], tests: LIFT_T, expectRed: [T13] },
	{ n: "5/2", name: "labels drop \"1. \"", edits: [times(LIFT, "label: h.label, purpose: `${UNSORTED_PREFIX}", "label: h.label.replace(/^\\d+[a-z]?\\.\\s*/, \"\"), purpose: `${UNSORTED_PREFIX}", 3)], tests: LIFT_T, expectRed: [T13] },
	{ n: "5/3", name: "sections after the general run nest under CAP-90", edits: [one(LIFT, "    if (cap === null || cap.id === \"CAP-90\") {", "    if (cap === null) {")], tests: LIFT_T, expectRed: [T15] },
	{ n: "5/4", name: "reserved nodes get the placeholder", edits: [one(LIFT, "  return { label: h?.label ?? \"\", purpose: h?.purpose ?? \"\", outcome: h?.outcome ?? \"\", status: h?.status ?? \"\" };", "  return { label: h?.label ?? \"\", purpose: UNSORTED_TEXT, outcome: UNSORTED_TEXT, status: h?.status ?? \"\" };")], tests: LIFT_T, expectRed: [T16] },
	{ n: "5/5", name: "Open questions becomes a feature", edits: [times(LIFT, "(h) => h.level === 2 && KEPT_SECTIONS.includes(h.label)", "(h) => h.level === 2 && KEPT_SECTIONS.slice(1).includes(h.label)", 2)], tests: LIFT_T, expectRed: [T17] },
	{ n: "5/6", name: "the closing heading is retyped differently", edits: [one(LIFT, "export const CLOSING_HEADING = \"# Open questions and deliberate omissions\";", "export const CLOSING_HEADING = \"# Open Questions and Deliberate Omissions\";")], tests: LIFT_T, expectRed: [T17] },
	// Build brief 5 (tip f6b34d4)
	{ n: "T1", name: "the requirement-table test back to any 4-cell header, no row check (lift and proof)", edits: [one(LIFT, ROW_CHECK, "  return true;"), one(PROOF, ROW_CHECK, "  return true;")], tests: LIFT_T, expectRed: [T33] },
	{ n: "T1/1", name: "the requirement-table test back to any 4-cell header, no row check (lift only)", edits: [one(LIFT, ROW_CHECK, "  return true;")], tests: LIFT_T, expectRed: [T33] },
	{ n: "T1/2", name: "the requirement-table test back to any 4-cell header, no row check (proof only)", edits: [one(PROOF, ROW_CHECK, "  return true;")], tests: LIFT_T, expectRed: [T33] },
	{ n: "T2", name: "refusal stages stop at the first stage again (base refusals reported alone)", edits: [one(LIFT, "    const stageProblems = [...base];", "    if (base.length) { for (const p of capProblems(base)) console.error(p); return 1; }\n    const stageProblems = [];")], tests: LIFT_T, expectRed: [T34] },
	{ n: "T3", name: "the head/tail field-label exemption removed", edits: [one(LIFT, HEADTAIL, "")], tests: LIFT_T, expectRed: [T34] },
	{ n: "T3/1", name: "the head half of the field-label exemption removed", edits: [one(LIFT, HEADTAIL, "    if (tailLines.has(i)) continue; // head/tail prose: carried verbatim, never replaced\n")], tests: LIFT_T, expectRed: [T34] },
	{ n: "T3/2", name: "the tail half of the field-label exemption removed", edits: [one(LIFT, HEADTAIL, "    if (i < headEnd) continue; // head/tail prose: carried verbatim, never replaced\n")], tests: LIFT_T, expectRed: [T34] },
	{ n: "T4/1", name: "--verify's mapping-blob NUL refusal dropped", edits: [one(LIFT, "    if (buf.includes(0)) { console.error(`--verify refused: HEAD:./${relMap}: NUL byte; likely UTF-16 from Windows PowerShell 5.1; save it as UTF-8`); return 1; }\n", "")], tests: LIFT_T, expectRed: [T35] },
	{ n: "T4/2", name: "--verify's mapping-blob encoding refusal dropped", edits: [one(LIFT, "    if (mapEncLine !== null) { console.error(", "    if (false) { console.error(")], tests: LIFT_T, expectRed: [T35] },
	{ n: "T4/3", name: "--verify's mapping-blob invalid-JSON refusal dropped", edits: [one(LIFT, "    try { mapping = JSON.parse(raw); } catch (e) { console.error(`--verify refused: HEAD:./${relMap} is not valid JSON (${e.message})`); return 1; }", "    mapping = JSON.parse(raw);")], tests: LIFT_T, expectRed: [T35] },
	{ n: "T4/4", name: "--verify's mapping-blob lift-version refusal dropped", edits: [one(LIFT, "    if (mapping.lift !== MAPPING_FORMAT) { console.error(", "    if (false) { console.error(")], tests: LIFT_T, expectRed: [T35] },
	// Row 6: skill and ledger literal
	{ n: "6/1", name: "skill drops \"only after the owner's yes\"", edits: [one(REQ_SKILL, "Run `--write` only after the owner's yes, and only while", "Run `--write` once the owner has seen the plan, and only while")], tests: SKILL_T, expectRed: [T29] },
	{ n: "6/2", name: "skill drops \"in every worktree\"", edits: [one(REQ_SKILL, "matches HEAD in every worktree of the repository", "matches HEAD in this worktree")], tests: SKILL_T, expectRed: [T29] },
	{ n: "6/3", name: "skill shows a flag the script lacks (`--force`)", edits: [one(REQ_SKILL, "the lift refuses otherwise, naming the reason.", "the lift refuses otherwise, naming the reason; `--force` skips that check.")], tests: SKILL_T, expectRed: [T29] },
	{ n: "6/4", name: "a row added without the literal update (R-1170 after R-1169, outline regenerated)", edits: [regex(LEDGER, /^(\| R-1169 \| .*\n)/gm, (_m, line) => `${line}| R-1170 | The lift shall carry one seat mutation row. | planned | — |\n`, 1), run(["scripts/requirements-tree.mjs", "--write"])], tests: LEDGER_T, expectRed: [T30] },
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
		if (e.restore) {
			const r = git("-C", WT, "show", `${e.restore}:${e.file}`);
			if (r.status !== 0) return `${e.file}: not at ${e.restore.slice(0, 7)}`;
			if (r.stdout === text) return `${e.file}: identical at ${e.restore.slice(0, 7)}, restore changes nothing`;
			fs.writeFileSync(abs, r.stdout);
		} else if (e.re) {
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
log(`seat-mutate: lane lift, tip ${tipSha}${branchHead && branchHead !== tipSha ? ` (NOTE: ${LANE_BRANCH} is now ${branchHead})` : ""}, merge-base ${mergeBase}, ${pairs.length} pairs${DRY ? " (DRY: anchors only)" : ""}, ${process.platform}, node ${process.version}, ${new Date().toISOString()}`);
for (const d of DECLARED) log(`DECLARED ${d}`);
if (!tipSha || !mergeBase) { log("seat-mutate: tip or merge-base did not resolve"); process.exit(2); }
addWorktree(WT, tipSha);

const tally = { red: 0, exact: 0, namedGreen: 0, unnamedRed: 0, survived: 0, anchorMiss: 0, syntax: 0, runnable: 0 };
const survivors = [];
const basePass = {};
try {
	let baselineOk = true;
	if (!DRY) {
		// Baseline: every named file, unmutated, must exit 0 with no FAIL line.
		const files = [...new Set(pairs.flatMap((p) => p.tests))];
		for (const rel of files) {
			resetWorktree();
			const r = await runTest(rel);
			const fl = lineTitles(r.out, "FAIL");
			const ok = r.code === 0 && !r.timedOut && fl.length === 0;
			basePass[rel] = lineTitles(r.out, "PASS");
			log(`BASELINE ${ok ? "ok  " : "FAIL"} ${rel} (exit ${r.code}, ${basePass[rel].length} PASS, ${fl.length} FAIL, ${lineTitles(r.out, "SKIP").length} SKIP, ${r.secs}s)${ok ? "" : " — " + (fl.slice(0, 3).map((t) => short(t)).join(" | ") || short(r.out.trim().split("\n").slice(-3).join(" / "), 200))}`);
			if (!ok) { baselineOk = false; fs.writeFileSync(path.join(HERE, `baseline-${path.basename(rel)}.log`), r.out); }
		}
		// Every named or declared title must be a PASS line in the baseline of one of the pair's files.
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
			// expectWhy (pair M): labels that must appear in the judged title's own FAIL detail, so "reds the cases the build
			// added" is judged on the aggregate test's named sub-cases, not only on its title.
			const whyText = allFails.filter(({ t }) => judged.some((s) => isTitle(t, s))).map(({ t }) => t).join("\n");
			const whyMissing = (p.expectWhy ?? []).filter((l) => !whyText.includes(`${l}: `));
			const whyNote = p.expectWhy ? `; FAIL detail names ${p.expectWhy.length - whyMissing.length}/${p.expectWhy.length} expected labels${whyMissing.length ? ` (MISSING: ${whyMissing.map((l) => JSON.stringify(l)).join(", ")})` : ""}` : "";
			const extra = `${whyNote}${declaredRed.length ? `; also (declared): ${declaredRed.map((s) => short(s, 80)).join(" | ")}` : ""}${declaredGreen.length ? `; declared but GREEN: ${declaredGreen.map((s) => JSON.stringify(s)).join(", ")}` : ""}${namedGreen.length ? `; named but GREEN: ${namedGreen.map((s) => JSON.stringify(s)).join(", ")}` : ""}${notReached.length ? `; named but NOT REACHED: ${notReached.map((s) => JSON.stringify(s)).join(", ")}` : ""}${unnamed.length ? `; UNNAMED red: ${unnamed.map(({ rel, t }) => `[${path.basename(rel)}] ${short(t, 110)}`).join(" | ")}` : ""}; ${allFails.length} FAIL total (${diff})${crashed.length ? `; CRASH ${crashed.join(" || ")}` : ""}`;
			if (matched.length) {
				tally.red++;
				if (namedGreen.length || notReached.length || whyMissing.length) tally.namedGreen++;
				if (unnamed.length) tally.unnamedRed++;
				if (!namedGreen.length && !notReached.length && !whyMissing.length && !unnamed.length) tally.exact++;
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
