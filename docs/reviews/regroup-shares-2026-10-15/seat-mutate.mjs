#!/usr/bin/env node
// Seat mutation runner for lane regroup-shares (CHANGE.md §5 "Wrong code first": 34 pairs in six rows, as revised by
// the "Seat revision (2026-10-15)" and "Seat amendment (2026-10-15): R-1181 one shall" sections appended at the end;
// plus build brief 1's two seat clarifications as pairs B1 and B2/1-B2/3 -- declared in (k)).
// Form copied from docs/reviews/lift-2026-10-14/seat-mutate.mjs (main checkout).
// For each pair: apply the wrong code (never a test, never an assertion) in a detached scratch worktree of the lane tip,
// refuse when an anchor does not occur exactly the stated number of times (ANCHOR-MISS = runner bug), syntax-check every
// mutated module, run the named test files with node exactly as scripts/test.mjs does (package-dir cwd, fresh
// HOME/USERPROFILE/TMPDIR/TEMP/TMP, NANA_* but NANA_TEST_* and PI_CODING_AGENT_DIR scrubbed, gc.auto=0 through
// GIT_CONFIG_*, --experimental-strip-types, and the npm_config_prefix/globalconfig/userconfig that `npm test` exports
// when the runner itself was not started through npm), and print RED / GREEN (SURVIVED). A RED line also lists every
// named title that stayed GREEN and every UNNAMED red, so "reds exactly the titles named" is judged, not assumed.
//
// Pair ids: §5's "/"-separated variants run as separate pairs "row/k" (k = position in that row), each judged alone.
// Row 6 (the PROPOSAL_KEYS step) belongs to the second lander: it is SKIPPED, never run, while the regroup lane is not
// on main (scripts/requirements-regroup.mjs absent at the merge base, checked below).
//
// Test sets (declared before the run):
//   lift, proof, validator and plan pairs (rows 1-4, B) → requirements-lift.test.mjs (the only test that runs the lift
//                                                         or the proof; templates-render reads only the lift source's
//                                                         flag spellings, which no pair here changes)
//   ledger-row pair (5/1)                               → requirements-tree.test.mjs
//
// Seat corrections and readings (declared before the run; each prints as a DECLARED line, never hidden): see DECLARED.
//
// Never touches the lane worktree or the main checkout: everything runs in one detached scratch worktree in a mkdtemp
// folder under os.tmpdir() (never inside the lane folder), removed at the end (SEAT_MUTATE_KEEP=1 keeps it for
// inspection); git writes only its worktree metadata into the shared .git.
// SEAT_MUTATE_DRY=1 applies and syntax-checks every pair's edits and runs no test (an anchor check).
// Usage: SEAT_MUTATE_OUT=<file> [SEAT_MUTATE_TIP=<rev>] [SEAT_MUTATE_DRY=1] [SEAT_MUTATE_LOGDIR=<dir>] node seat-mutate.mjs [pair-id ...]
import { spawnSync, spawn } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const LANE_REPO = "/Users/jwang/nana-pi-wt/regroup-shares";
const LANE_BRANCH = "feat/regroup-shares";
const TIP = process.env.SEAT_MUTATE_TIP || "28d53c7";
const HERE = path.dirname(fileURLToPath(import.meta.url));
// os.tmpdir(), never beside the lane: a scratch git worktree inside the lane folder breaks copier-based suite tests run
// there ("No url found for submodule path …/wt").
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "shares-seat-mutate-"));
const WT = path.join(SCRATCH, "wt");
const RUNS = path.join(SCRATCH, "runs");
const KEEP = process.env.SEAT_MUTATE_KEEP === "1";
const DRY = process.env.SEAT_MUTATE_DRY === "1";
const LOGDIR = process.env.SEAT_MUTATE_LOGDIR || null; // per-pair test output, for evidence
if (LOGDIR) fs.mkdirSync(LOGDIR, { recursive: true });
const TIMEOUT_MS = 10 * 60 * 1000;

const DECLARED = [
	"(a) pair ids: each \"/\"-separated variant of a §5 row runs alone as \"row/k\"; 32 of §5's 34 pairs run, row 6's two are SKIPPED (second lander; regroup lane not on main)",
	"(b) 1/1 \"a lift finder\": a fence-aware lift-side scan (the lift's scanHeadings spans, first unfenced \"Also applies:\" line per FEAT heading) replaces parseLedger's alsoAppliesLines[0] in both readers the lift has -- shareLineRefusals' allowed set and shareInfoOf (validator and writer sources)",
	"(c) 1/2 restores the base's refusal line (`/^(Purpose|Outcome|Status|Also applies):/` in baseRefusals' carried-prose loop) and drops its §3.1 skip; shareLineRefusals is left as is",
	"(d) 1/3 \"each test built from an emitted identity\" read as the share tests whose buildIdentityMapping-built mapping passes through the lift CLI's validator: T2, T3, T6 (with T1). T4 and T5 call applyMapping/proveLift directly and T8's cases are refusals either way; they are not named",
	"(e) 1/6, 1/7 edit the lift's shared carry helpers (shareSourcesOf's subgroup loop / carriedSharesOf takes the first source only), which the lift's validator and writer both read; the proof's own copies are untouched",
	"(f) 1/8 and B1 edit only the lift writer's kept test (shareLineFor's `changes`); the proof's isKeptFeature is untouched",
	"(g) 2/x edit the proof only: 2/1 the recount's push disabled; 2/2 the recount's expected set read from node.also_applies; 2/3 the §3.4c set-aside loop runs for kept features too; 2/4 it skips every feature; 2/5 expectedProseFor's §3.4a share-line skip removed",
	"(h) row 3's refusal pairs edit shareLineRefusals (the one reader's refusal): 3/8 every alsoAppliesLines entry allowed; 3/9 an unfenced line whose nearest heading above (parseLedger allHeadings) is CAP- or SUB- accepted; 3/11 opaque (fenced) lines skipped; 3/12 lines before the first tree heading skipped (none in a flat ledger); 3/13 the lift's structuralTailLines skipped; 3/14 the no-ending refusal disabled. Validator pairs 3/1-3/7, 3/10 disable exactly one push in shareProblems/shapeProblems",
	"(i) 4/3 \"prints a line for merged shares\": for a feature with two or more source share lines, the plan prints \"FEAT: share R added\" for each carried share its first source lacks; 4/4 moves the share loop after `console.log(proof.summary)`",
	"(j) 5/1: rows R-1184 to R-1186 added after R-1183 and the outline regenerated with `node scripts/requirements-tree.mjs --write` (how a row is added), so only the 1,139 literal is stale",
	"(k) build brief 1's seat clarifications as pairs: B1 a declared empty shares_added/shares_dropped read as a change (clarification 1, T1's empty-array case); B2/1-B2/3 the validator accepts a repeated ID in also_applies / shares_added / shares_dropped (clarification 2, T8's three repeat cases)",
	"(l) expectWhy: where §5 names a sub-case in parentheses (1/1, 2/1, 2/2, 2/3), and for each row-3 or B2 pair, the T4/T7/T8 case label it targets must appear among the failing labels in that aggregate title's own FAIL detail; a missing one counts as a named case green",
];

// ── test files ──────────────────────────────────────────────────────────────────────────────
const LT = "packages/nana-pack/tests/requirements-lift.test.mjs";
const RT = "packages/nana-pack/tests/requirements-tree.test.mjs";

// ── mutated files ───────────────────────────────────────────────────────────────────────────
const LIFT = "scripts/requirements-lift.mjs";
const PROOF = "scripts/requirements-lift-proof.mjs";
const LEDGER = "REQUIREMENTS.md";
const REGROUP_SCRIPT = "scripts/requirements-regroup.mjs";

// ── titles (exact, as the suite prints them; seat-titles.mjs build 1) ──────────────────────────
const T1 = "R-1181: the identity mapping of a tree-form ledger with shares writes each Also applies line byte-identical, LF, CRLF, mixed-ending, BOM and no-space lists included, and a line after its table moves up with its bytes kept";
const T2 = "R-1181: a feature merged with another, or demoted to a subgroup, carries the shares of every old feature heading it names to the feature that holds it";
const T3 = "R-1181: --write lifts a committed ledger with shares through a committed mapping that declares a drop and an add, and --verify with --mapping passes it";
const T4 = "R-1182: the proof names an undeclared dropped share, an undeclared added share, a share lost beside a declared drop, a changed byte in a kept share line, a kept line moved to another feature, a kept line copied under a capability and an added share naming no input row";
const T5 = "R-1182: a declared drop and a declared add prove, and a row moved into the feature that shares it proves only with that share declared dropped";
const T6 = "R-1183: a mapping's dry run prints one line per declared added or dropped share before the proof line, and none for a kept, merged or demoted feature's shares";
const T7 = "R-1167: an Also applies line that is not a feature heading's first as the tree checker reads it (a second one, one under a capability or subgroup, in the head, a kept section or the closing heading's span, a fenced one, one under a fence closer underlined by ---) and a share line with no line ending are refused naming the line in the dry run, --emit-mapping, --write and --verify";
const T8 = "R-1167: a mapping that drops or adds a share without declaring it, declares a drop it does not carry or an add it carries or of an unknown row, names a sharing feature heading in a capability or the tail, or holds shares_added as a string is refused, each named, and --write and --verify leave the ledger unchanged";
const T9 = "R-291: every real heading's committed IDs survive expansion and leaf counts total 1,139";
const NAME = new Map([[T1, "T1"], [T2, "T2"], [T3, "T3"], [T4, "T4"], [T5, "T5"], [T6, "T6"], [T7, "T7"], [T8, "T8"], [T9, "T9"]]);

// ── edits ───────────────────────────────────────────────────────────────────────────────────
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const regex = (file, re, replacement, n) => ({ file, re, replacement, times: n });
const run = (args) => ({ run: args });

const LIFT_T = [LT];
const LEDGER_T = [RT];

// 1/1: the lift-side finder (correction (b)).
const FINDER = "function __liftShareFinder(bareLines) {\n  const fenced = fenceMask(bareLines);\n  const hs = scanHeadings(bareLines, fenced).slice().sort((a, b) => a.line - b.line);\n  const out = new Map();\n  hs.forEach((h, k) => {\n    if (!h.id || !h.id.startsWith(\"FEAT-\")) return;\n    const end = k + 1 < hs.length ? hs[k + 1].line - 1 : bareLines.length;\n    for (let i = h.line; i < end; i++) if (!fenced[i] && /^Also applies:/.test(bareLines[i])) { out.set(h.id, { line: i + 1, value: bareLines[i].slice(\"Also applies:\".length).trim(), headingLine: h.line }); break; }\n  });\n  return out;\n}\n";
const ALLOWED_BLOCK = "  const allowed = new Set();\n  for (const h of parsed.headings) {\n    if (!h.id?.startsWith(\"FEAT-\")) continue;\n    const first = h.alsoAppliesLines?.[0];\n    if (first) allowed.add(first.line);\n  }\n";
const SHAREINFO_BLOCK = "function shareInfoOf(parsed, segs) {\n  const map = new Map();\n  for (const h of parsed.headings) {\n    if (!h.id?.startsWith(\"FEAT-\")) continue;\n    const first = h.alsoAppliesLines?.[0];\n    if (!first) continue;\n    map.set(h.id, { shares: h.alsoApplies.slice(), line: first.line, headingLine: h.line, seg: segs[first.line - 1] });\n  }\n  return map;\n}\n";
const SHAREINFO_FINDER = "function shareInfoOf(parsed, segs) {\n  const map = new Map();\n  for (const [id, v] of __liftShareFinder(segs.map(bare))) map.set(id, { shares: v.value ? v.value.split(/,\\s*/) : [], line: v.line, headingLine: v.headingLine, seg: segs[v.line - 1] });\n  return map;\n}\n";
// shareLineRefusals' loop head (row 3's refusal pairs insert after it).
const REFUSAL_LOOP = "    if (!/^Also applies:/.test(bareLines[i])) continue;\n    const lineNo = i + 1;\n";
const NOT_FIRST_PUSH = "    problems.push(`line ${lineNo}: \"Also applies:\" is not";
const KEPT_CHANGES = "    const changes = (feat.shares_added?.length ?? 0) > 0 || (feat.shares_dropped?.length ?? 0) > 0;\n";
const ADDED_LINE = "    for (const r of node.shares_added ?? []) console.log(`${id}: share ${r} added`);\n";
const DROPPED_LINE = "    for (const r of node.shares_dropped ?? []) console.log(`${id}: share ${r} dropped`);\n";
const SHARE_LOOP = "  // R-1183: one line per share a feature's shares_added or shares_dropped declares, mapping order.\n  for (const { id, node, level } of flattenNodes(mapping)) {\n    if (level !== 2) continue;\n" + ADDED_LINE + DROPPED_LINE + "  }\n";
const PROOF_TAIL = "  if (proof.problems.length) { for (const p of capProblems(proof.problems)) console.error(p); return 1; }\n  console.log(proof.summary);\n";
const MERGED_LINES = "  { const __si = shareInfoOf(parseLedger(text), segments(text)); for (const { id, node, level } of flattenNodes(mapping)) { if (level !== 2) continue; const __src = shareSourcesOf(node, __si); if (__src.length < 2) continue; for (const r of carriedSharesOf(node, __si)) if (!__src[0].shares.includes(r)) console.log(`${id}: share ${r} added`); } }\n";
const SET_ASIDE = "      if (level !== 2 || isKeptFeature(node, shareInfo)) continue;";

const sh = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...opts });
const GIT_SAFE = ["-c", "core.hooksPath=/dev/null"];
const git = (...args) => sh("git", [...GIT_SAFE, ...args]);
const tipSha = git("-C", LANE_REPO, "rev-parse", "--verify", `${TIP}^{commit}`).stdout.trim();
const mergeBase = git("-C", LANE_REPO, "merge-base", "main", tipSha).stdout.trim();
const regroupOnMain = Boolean(mergeBase) && git("-C", LANE_REPO, "cat-file", "-e", `${mergeBase}:${REGROUP_SCRIPT}`).status === 0;

// Frozen table. `expectRed` are the titles §5 names (as read in DECLARED); `expectWhy` the case labels (l).
const PAIRS = [
	// Row 1: the lift (reader, base refusal, identity, writer)
	{ n: "1/1", name: "share line read by a lift finder, not parseLedger", edits: [one(LIFT, "function shareLineRefusals(", FINDER + "function shareLineRefusals("), one(LIFT, ALLOWED_BLOCK, "  const allowed = new Set([...__liftShareFinder(bareLines).values()].map((v) => v.line));\n"), one(LIFT, SHAREINFO_BLOCK, SHAREINFO_FINDER)], tests: LIFT_T, expectRed: [T7], expectWhy: ["one under a fence closer underlined by ---"] },
	{ n: "1/2", name: "base refusal of the first share line restored", edits: [one(LIFT, "    if (/^Also applies:/.test(bareLines[i])) continue; // §3.1: checked separately below, every span included\n    if (!/^(Purpose|Outcome|Status):/.test(bareLines[i])) continue;\n", "    if (!/^(Purpose|Outcome|Status|Also applies):/.test(bareLines[i])) continue;\n")], tests: LIFT_T, expectRed: [T1, T2, T3, T5, T6, T8] },
	{ n: "1/3", name: "identity stops writing also_applies", edits: [one(LIFT, "...(h.alsoApplies?.length ? { also_applies: h.alsoApplies.slice() } : {}), ", "")], tests: LIFT_T, expectRed: [T1, T2, T3, T6] },
	{ n: "1/4", name: "writer regenerates a kept line", edits: [one(LIFT, "    if (sources.length === 1 && !changes) return sources[0].seg;\n", "")], tests: LIFT_T, expectRed: [T1] },
	{ n: "1/5", name: "kept copy takes the first line ending", edits: [one(LIFT, "return sources[0].seg;", "return bare(sources[0].seg) + eol;")], tests: LIFT_T, expectRed: [T1] },
	{ n: "1/6", name: "a demoted feature's shares dropped", edits: [one(LIFT, "  for (const sub of node.subgroups ?? []) for (const f of sub.from ?? []) { const id = oldFeatIdOf(f); if (id && shareInfo.has(id)) out.push(shareInfo.get(id)); }\n", "")], tests: LIFT_T, expectRed: [T2] },
	{ n: "1/7", name: "a merge keeps only its first source's shares", edits: [one(LIFT, "  for (const src of shareSourcesOf(node, shareInfo)) for (const id of src.shares)", "  for (const src of shareSourcesOf(node, shareInfo).slice(0, 1)) for (const id of src.shares)")], tests: LIFT_T, expectRed: [T2] },
	{ n: "1/8", name: "the kept test ignores declarations", edits: [one(LIFT, KEPT_CHANGES, "    const changes = false;\n")], tests: LIFT_T, expectRed: [T3, T5] },
	// Row 2: the proof
	{ n: "2/1", name: "proof: recount skipped", edits: [one(PROOF, "    if (missing.length || extra.length) problems.push(", "    if (false) problems.push(")], tests: LIFT_T, expectRed: [T4], expectWhy: ["kept line moved to another feature", "share lost beside a declared drop"] },
	{ n: "2/2", name: "proof: recount derives expected from also_applies", edits: [one(PROOF, "    const want = new Set(wantedSharesOf(node, shareInfo));", "    const want = new Set(node.also_applies ?? []);")], tests: LIFT_T, expectRed: [T4], expectWhy: ["share lost beside a declared drop"] },
	{ n: "2/3", name: "proof: accounting sets aside every feature's share line", edits: [one(PROOF, SET_ASIDE, "      if (level !== 2) continue;")], tests: LIFT_T, expectRed: [T4], expectWhy: ["changed byte in a kept share line"] },
	{ n: "2/4", name: "proof: accounting sets aside none", edits: [one(PROOF, SET_ASIDE, "      if (true) continue;")], tests: LIFT_T, expectRed: [T2, T3, T5, T6] },
	{ n: "2/5", name: "proof: expectedProseFor keeps the share line", edits: [one(PROOF, "        if (/^Also applies:/.test(inBare[i])) continue; // §3.4a: the feature's share line, never positional prose\n", "")], tests: LIFT_T, expectRed: [T1, T2, T3, T4, T5, T6] },
	// Row 3: the validator and the one reader's refusals
	{ n: "3/1", name: "validator accepts an undeclared drop", edits: [one(LIFT, "for (const id of want) if (!alsoSet.has(id)) problems.push(", "for (const id of want) if (false) problems.push(")], tests: LIFT_T, expectRed: [T8], expectWhy: ["an undeclared drop"] },
	{ n: "3/2", name: "validator accepts an undeclared add", edits: [one(LIFT, "for (const id of alsoSet) if (!want.has(id)) problems.push(", "for (const id of alsoSet) if (false) problems.push(")], tests: LIFT_T, expectRed: [T8], expectWhy: ["an undeclared add"] },
	{ n: "3/3", name: "validator accepts a drop it does not carry", edits: [one(LIFT, "for (const d of dropped) if (!carried.includes(d)) problems.push(", "for (const d of dropped) if (false) problems.push(")], tests: LIFT_T, expectRed: [T8], expectWhy: ["a declared drop it does not carry"] },
	{ n: "3/4", name: "validator accepts an add it carries", edits: [one(LIFT, "if (carried.includes(a)) problems.push(", "if (false) problems.push(")], tests: LIFT_T, expectRed: [T8], expectWhy: ["a declared add it already carries"] },
	{ n: "3/5", name: "validator accepts an add of an unknown row", edits: [one(LIFT, "else if (!realRowIds.has(a)) problems.push(", "else if (false) problems.push(")], tests: LIFT_T, expectRed: [T8], expectWhy: ["a declared add of an unknown row"] },
	{ n: "3/6", name: "validator accepts a sharing heading under a capability", edits: [one(LIFT, "if (oldId && shareInfo.has(oldId)) problems.push(`${cap.id}:", "if (false) problems.push(`${cap.id}:")], tests: LIFT_T, expectRed: [T8], expectWhy: ["a sharing feature heading named by a capability"] },
	{ n: "3/7", name: "validator accepts a sharing heading in the tail", edits: [one(LIFT, "if (oldId && shareInfo.has(oldId)) problems.push(`tail:", "if (false) problems.push(`tail:")], tests: LIFT_T, expectRed: [T8], expectWhy: ["a sharing feature heading named by the tail"] },
	{ n: "3/8", name: "refusal accepts a second share line", edits: [one(LIFT, "    if (first) allowed.add(first.line);", "    for (const e of h.alsoAppliesLines ?? []) allowed.add(e.line);")], tests: LIFT_T, expectRed: [T7], expectWhy: ["a second one", "a second one after a feature's table"] },
	{ n: "3/9", name: "refusal accepts a share under a capability or subgroup", edits: [one(LIFT, NOT_FIRST_PUSH, "    const __near = parsed.allHeadings.filter((h) => h.line < lineNo).sort((a, b) => b.line - a.line)[0];\n    if (__near && __near.id && /^(CAP|SUB)-/.test(__near.id) && !parsed.opaque[i]) continue;\n" + NOT_FIRST_PUSH)], tests: LIFT_T, expectRed: [T7], expectWhy: ["one under a capability", "one under a subgroup"] },
	{ n: "3/10", name: "validator accepts a string shares_added (crash)", edits: [one(LIFT, "      checkShareList(feat.shares_added, feat.id, \"shares_added\");\n", "")], tests: LIFT_T, expectRed: [T8], expectWhy: ["shares_added held as a string"] },
	{ n: "3/11", name: "refusal accepts a fenced line", edits: [one(LIFT, REFUSAL_LOOP, REFUSAL_LOOP + "    if (parsed.opaque[i]) continue;\n")], tests: LIFT_T, expectRed: [T7], expectWhy: ["a fenced one"] },
	{ n: "3/12", name: "refusal accepts a head line", edits: [one(LIFT, REFUSAL_LOOP, REFUSAL_LOOP + "    if (parsed.headings.length && i < Math.min(...parsed.headings.map((h) => h.line)) - 1) continue;\n")], tests: LIFT_T, expectRed: [T7], expectWhy: ["one in the head"] },
	{ n: "3/13", name: "refusal accepts a kept-section or closing-heading line", edits: [one(LIFT, REFUSAL_LOOP, REFUSAL_LOOP + "    if (structuralTailLines(bareLines, scanHeadings(bareLines, fenceMask(bareLines))).has(i)) continue;\n")], tests: LIFT_T, expectRed: [T7], expectWhy: ["one under a kept section", "one in the closing heading's span"] },
	{ n: "3/14", name: "refusal accepts an unterminated share line", edits: [one(LIFT, "      if (i === bareLines.length - 1 && !/\\n$/.test(segs[i] ?? \"\")) problems.push(", "      if (false) problems.push(")], tests: LIFT_T, expectRed: [T7], expectWhy: ["a share line with no line ending"] },
	// Row 4: the plan's share lines
	{ n: "4/1", name: "plan omits dropped lines", edits: [one(LIFT, DROPPED_LINE, "")], tests: LIFT_T, expectRed: [T6] },
	{ n: "4/2", name: "plan omits added lines", edits: [one(LIFT, ADDED_LINE, "")], tests: LIFT_T, expectRed: [T6] },
	{ n: "4/3", name: "plan prints a line for merged shares", edits: [one(LIFT, DROPPED_LINE + "  }\n", DROPPED_LINE + "  }\n" + MERGED_LINES)], tests: LIFT_T, expectRed: [T6] },
	{ n: "4/4", name: "plan prints after the proof line", edits: [one(LIFT, SHARE_LOOP + PROOF_TAIL, PROOF_TAIL + SHARE_LOOP)], tests: LIFT_T, expectRed: [T6] },
	// Row 5: the ledger literal
	{ n: "5/1", name: "three rows added without the literal update (R-1184 to R-1186 after R-1183, outline regenerated)", edits: [regex(LEDGER, /^(\| R-1183 \| .*\n)/gm, (_m, line) => `${line}| R-1184 | The lift shall carry seat mutation row one. | planned | — |\n| R-1185 | The lift shall carry seat mutation row two. | planned | — |\n| R-1186 | The lift shall carry seat mutation row three. | planned | — |\n`, 1), run(["scripts/requirements-tree.mjs", "--write"])], tests: LEDGER_T, expectRed: [T9] },
	// Row 6: the second lander's PROPOSAL_KEYS step (never run here while the regroup lane is not on main)
	{ n: "6/1", name: "PROPOSAL_KEYS lacks shares_added", skip: "second lander", expectRed: ["T10"] },
	{ n: "6/2", name: "PROPOSAL_KEYS lacks shares_dropped", skip: "second lander", expectRed: ["T10"] },
	// Build brief 1's seat clarifications (correction (k))
	{ n: "B1", name: "a declared empty shares_added/shares_dropped read as a change (kept line regenerated)", edits: [one(LIFT, KEPT_CHANGES, "    const changes = feat.shares_added !== undefined || feat.shares_dropped !== undefined;\n")], tests: LIFT_T, expectRed: [T1] },
	{ n: "B2/1", name: "validator accepts a repeated ID in also_applies", edits: [one(LIFT, "      checkRepeat(also, \"also_applies\", feat.id);\n", "")], tests: LIFT_T, expectRed: [T8], expectWhy: ["a repeated ID in also_applies"] },
	{ n: "B2/2", name: "validator accepts a repeated ID in shares_added", edits: [one(LIFT, "      checkRepeat(added, \"shares_added\", feat.id);\n", "")], tests: LIFT_T, expectRed: [T8], expectWhy: ["a repeated ID in shares_added"] },
	{ n: "B2/3", name: "validator accepts a repeated ID in shares_dropped", edits: [one(LIFT, "      checkRepeat(dropped, \"shares_dropped\", feat.id);\n", "")], tests: LIFT_T, expectRed: [T8], expectWhy: ["a repeated ID in shares_dropped"] },
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
const nameOf = (title) => NAME.get(title) ?? short(title, 100);
const fileCrashed = (out) => /^Node\.js v\d+\.\d+\.\d+$/.test(out.trim().split("\n").at(-1) ?? "");
/** The case labels an aggregate title's FAIL detail names: T7/T8's {"label":…} objects and T4's leading JSON array. */
function labelsOf(detail) {
	const out = [...detail.matchAll(/"label":"((?:[^"\\]|\\.)*)"/g)].map((m) => JSON.parse(`"${m[1]}"`));
	const lead = /^\s*(\[(?:"(?:[^"\\]|\\.)*"(?:,"(?:[^"\\]|\\.)*")*)?\])/.exec(detail);
	if (lead) { try { out.push(...JSON.parse(lead[1])); } catch {} }
	return out;
}

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
const runnable = pairs.filter((p) => !p.skip || regroupOnMain);
log(`seat-mutate: lane regroup-shares, tip ${tipSha}${branchHead && branchHead !== tipSha ? ` (NOTE: ${LANE_BRANCH} is now ${branchHead})` : ""}, merge-base ${mergeBase}, ${pairs.length} pairs (${runnable.length} to run)${DRY ? " (DRY: anchors only)" : ""}, ${process.platform}, node ${process.version}, ${new Date().toISOString()}`);
log(`seat-mutate: scratch ${SCRATCH}`);
for (const d of DECLARED) log(`DECLARED ${d}`);
for (const [title, n] of NAME) log(`TITLE ${n} = ${title}`);
if (!tipSha || !mergeBase) { log("seat-mutate: tip or merge-base did not resolve"); process.exit(2); }
addWorktree(WT, tipSha);

const tally = { red: 0, exact: 0, namedGreen: 0, unnamedRed: 0, survived: 0, anchorMiss: 0, syntax: 0, runnable: 0, skipped: 0 };
const survivors = [];
const basePass = {};
try {
	let baselineOk = true;
	if (!DRY) {
		// Baseline: every named file, unmutated, must exit 0 with no FAIL line.
		const files = [...new Set(runnable.flatMap((p) => p.tests ?? []))];
		for (const rel of files) {
			resetWorktree();
			const r = await runTest(rel);
			const fl = lineTitles(r.out, "FAIL");
			const ok = r.code === 0 && !r.timedOut && fl.length === 0;
			basePass[rel] = lineTitles(r.out, "PASS");
			log(`BASELINE ${ok ? "ok  " : "FAIL"} ${rel} (exit ${r.code}, ${basePass[rel].length} PASS, ${fl.length} FAIL, ${lineTitles(r.out, "SKIP").length} SKIP, ${r.secs}s)${ok ? "" : " — " + (fl.slice(0, 3).map((t) => short(t)).join(" | ") || short(r.out.trim().split("\n").slice(-3).join(" / "), 200))}`);
			if (!ok) { baselineOk = false; fs.writeFileSync(path.join(HERE, `baseline-${path.basename(rel)}.log`), r.out); }
		}
		// Every named title must be a PASS line in the baseline of one of the pair's files.
		for (const p of runnable) for (const title of p.expectRed) {
			if (!p.tests.some((rel) => basePass[rel].some((t) => isTitle(t, title)))) { baselineOk = false; log(`BASELINE MISSING title for pair ${p.n}: ${JSON.stringify(title)} is not a PASS line in ${p.tests.join(", ")}`); }
		}
		resetWorktree();
	}
	if (!baselineOk) { log("seat-mutate: baseline not green — refusing to judge mutations"); process.exitCode = 2; }
	else {
		for (const p of pairs) {
			if (p.skip && !regroupOnMain) {
				tally.skipped++;
				log(`SKIPPED ${p.n} ${p.name} — ${p.skip}: ${REGROUP_SCRIPT} is absent at merge-base ${mergeBase.slice(0, 7)}, so the regroup lane is not on main and its merge owns the PROPOSAL_KEYS step and ${p.expectRed.join(", ")}`);
				continue;
			}
			if (p.skip) { tally.anchorMiss++; log(`ANCHOR-MISS ${p.n} ${p.name} — the regroup lane is on main at the merge base; this runner holds no edit for the second lander's step`); continue; }
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
			const unnamed = allFails.filter(({ t }) => !judged.some((s) => isTitle(t, s)));
			// expectWhy: the case labels that must fail inside the judged aggregate title's own FAIL detail (correction (l)).
			const judgedFails = allFails.filter(({ t }) => judged.some((s) => isTitle(t, s)));
			const labelNotes = judgedFails.map(({ t }) => { const title = judged.find((s) => isTitle(t, s)); const ls = labelsOf(t.slice(title.length)); return ls.length ? `${nameOf(title)} cases red: ${ls.map((l) => JSON.stringify(l)).join(", ")}` : null; }).filter(Boolean);
			const redLabels = judgedFails.flatMap(({ t }) => { const title = judged.find((s) => isTitle(t, s)); return labelsOf(t.slice(title.length)); });
			const whyMissing = (p.expectWhy ?? []).filter((l) => !redLabels.includes(l));
			const whyNote = p.expectWhy ? `; FAIL detail names ${p.expectWhy.length - whyMissing.length}/${p.expectWhy.length} expected cases${whyMissing.length ? ` (GREEN: ${whyMissing.map((l) => JSON.stringify(l)).join(", ")})` : ""}` : "";
			const extra = `${whyNote}${labelNotes.length ? `; ${labelNotes.join("; ")}` : ""}${namedGreen.length ? `; named but GREEN: ${namedGreen.map(nameOf).join(", ")}` : ""}${notReached.length ? `; named but NOT REACHED: ${notReached.map(nameOf).join(", ")}` : ""}${unnamed.length ? `; UNNAMED red: ${unnamed.map(({ rel, t }) => `[${path.basename(rel)}] ${short(t, 110)}`).join(" | ")}` : ""}; ${allFails.length} FAIL total (${diff})${crashed.length ? `; CRASH ${crashed.join(" || ")}` : ""}`;
			if (matched.length) {
				tally.red++;
				if (namedGreen.length || notReached.length || whyMissing.length) tally.namedGreen++;
				if (unnamed.length) tally.unnamedRed++;
				if (!namedGreen.length && !notReached.length && !whyMissing.length && !unnamed.length) tally.exact++;
				log(`RED ${p.n} ${p.name} — ${matched.length}/${judged.length} named: ${matched.map(nameOf).join(", ")}${extra}`);
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
const skipNote = tally.skipped ? `, ${tally.skipped} skipped (second lander)` : "";
if (DRY) log(`RESULT (DRY): ${runnable.length - tally.anchorMiss - tally.syntax}/${runnable.length} pairs apply${tally.anchorMiss ? `, ${tally.anchorMiss} ANCHOR-MISS` : ""}${tally.syntax ? `, ${tally.syntax} SYNTAX` : ""}${skipNote}`);
else log(`RESULT: ${tally.red}/${tally.runnable} red (${tally.exact} exactly their named titles, ${tally.namedGreen} with a named title or case green, ${tally.unnamedRed} with an unnamed red), ${tally.survived} survived${survivors.length ? ` [${survivors.join(", ")}]` : ""}${tally.anchorMiss ? `, ${tally.anchorMiss} ANCHOR-MISS` : ""}${tally.syntax ? `, ${tally.syntax} SYNTAX` : ""}${skipNote}`);
if (tally.anchorMiss || tally.syntax) process.exitCode = 3;
