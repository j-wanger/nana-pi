#!/usr/bin/env node
// Seat mutation runner for lane tree (frozen table; CHANGE.md §5 "Wrong code first": pairs 1-14, 11b, 11c and K1-K3,
// as revised by the "Seat revision" and "Plan review r1-r3" sections appended at the end, plan frozen at afb4c01).
// Form copied from docs/reviews/seat-guide-2026-10-14/seat-mutate.mjs.
// For each pair: apply the wrong seed, include, skill or code (never a test assertion) in a detached scratch worktree
// of the lane tip, refuse when an anchor does not occur the stated number of times (ANCHOR-MISS = runner bug),
// syntax-check every mutated module, run the named test files with node exactly as scripts/test.mjs does (package-dir
// cwd, fresh HOME/USERPROFILE/TMPDIR/TEMP/TMP, NANA_* but NANA_TEST_* and PI_CODING_AGENT_DIR scrubbed, gc.auto=0
// through GIT_CONFIG_*, --experimental-strip-types, and the npm_config_prefix/globalconfig/userconfig that `npm test`
// exports when the runner itself was not started through npm), and print RED / GREEN (SURVIVED). A RED line also
// lists every named title that stayed GREEN and every UNNAMED red, so "reds exactly the titles named" is judged, not
// assumed.
//
// Template pairs: templates-render.test.mjs and templates-update.test.mjs render with `uvx copier copy --vcs-ref HEAD`
// from the checkout under test (here the scratch worktree), under the fresh HOME the runner gives them (as
// scripts/test.mjs does). copier 9.19.1 (_vcs.py: `if ref == "HEAD" and url_abspath.is_dir()` … "Dirty template
// changes included automatically") commits a dirty local template's working tree into its clone, so an uncommitted
// mutation IS what copier renders; no pair commits.
//
// Pair ids: §5's "/"-separated variants run as separate pairs "n/1", "n/2", … each judged alone ("(each)" in §5).
//
// Test sets (declared before the run):
//   seed pairs (1, 4, 6, K2)                       → templates-render
//   include pairs (2, 3, 5, K1)                    → templates-render, templates-update (R-581/R-582 read the include)
//   skill pairs (8)                                → templates-render, skill-claims
//   requirements-skill pairs (7, 9, K3)            → templates-render, skill-claims, readme-check (R-657 reads it)
//   checker --root pairs (10)                      → requirements-tree (only it spawns the checker CLI)
//   ledgerReadProblem pairs (11)                   → requirements-tree, product-report (both call it)
//   buildReport pair (11b)                         → product-report
//   checkTree/parseLedger pairs (11c, 12, 13, 14)  → requirements-tree, product-report, templates-render (T1/T2 call
//                                                    checkTree on the renders)
//
// Seat corrections to §5 (declared before the run; each prints as "also (declared)", never hidden):
// (a) K4: the frozen §5 at be19808 holds K1-K3 only. factcheck-repo.md's "K4 (R-599)" is today's K3 (renumbered when
//     the seat revision dropped the old K1 at product-report.test.mjs:78). The runner runs K1-K3; there is no K4.
// (b) Pair 1 runs on the Python seed ("one language"), both branches; it names T1 python scaffold/adopt and T3 python.
// (c) Pair 2 restores templates/_shared/requirements-general.md from the merge base: the build's only change to that
//     file is the headings and their Purpose/Outcome/Status lines (diff checked), so that IS "the include keeps".
// (d) Pairs 4 and K2 and every pair-6 variant edit both language seeds (pair 6: both branches too), so they name the
//     title in each render they reach: pair 4 T3 ×2; K2 T1 adopt ×2, T3 ×2, "no product row is invented" ×2; pair 6 T4 ×4.
// (e) 7/3 restores the base's own wrapped text ("at the end as its own\nPart"), so it also proves the whitespace
//     collapse (factcheck-repo.md: the wrapped phrase made the base's absence check vacuous).
// (f) 10/1: every --root check spawns `--root <dir>`, so ignoring the argument also reds T9, T11, T15 and the unmarked
//     check "R-1157 fixture: a row outside its feature exits 1 naming it"; declared.
// (g) 10/3: §5's T8 clause "`--root <dir> --write`: exit 2" sits in the unmarked check "R-1157 fixture: --root <dir>
//     --write exits 2 with usage" (requirements-tree.test.mjs:262), not under T8's title. That check is declared; T8
//     stays named per §5, and if it stays GREEN the line says "named but GREEN" (not hidden).
// (h) 13/2: T15's near-miss ledger has headings, so "fires only when there is no heading at all" also returns T15's
//     per-row lines; T15 declared.
// (i) K1: T2 (22 G rows), "${language} adopt: every Part G row starts untested" (22 statuses) and R-581's two
//     "… rendered Jinja includes the shared source" checks (sharedRequirements.size === 22) count the G rows too;
//     declared.
// (j) K3: claims() reads `node scripts/requirements-tree.mjs --root .` as a command, a flag claim and a path claim
//     (probe run on the tip). The path fails in the requirements surface's two scaffold targets (R-598); R-629's flag
//     judge passes, since `--root` is in the script's source. So K3 names the two R-598 scaffold titles; T7 (the exact
//     string) is declared.
// (k) Pair 9: claims() reads `node ~/nana-pi/scripts/product-report.mjs --root .` as one unjudged command (probe), so
//     only T7 is named.
//
// Never touches the lane worktree or the main checkout: everything runs in one detached scratch worktree in a
// mkdtemp folder beside this script (the session scratchpad, under /private/tmp), removed at the end
// (SEAT_MUTATE_KEEP=1 keeps it for inspection); git writes only its worktree metadata into the shared .git.
// SEAT_MUTATE_DRY=1 applies and syntax-checks every pair's edits and runs no test (an anchor check).
// Usage: SEAT_MUTATE_OUT=<file> [SEAT_MUTATE_TIP=<rev>] [SEAT_MUTATE_DRY=1] node seat-mutate.mjs [pair-id ...]
import { spawnSync, spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const LANE_REPO = "/Users/jwang/nana-pi-wt/tree";
const LANE_BRANCH = "feat/tree";
const TIP = process.env.SEAT_MUTATE_TIP || "be19808";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRATCH = fs.mkdtempSync(path.join(HERE, "work-"));
const WT = path.join(SCRATCH, "wt");
const RUNS = path.join(SCRATCH, "runs");
const KEEP = process.env.SEAT_MUTATE_KEEP === "1";
const DRY = process.env.SEAT_MUTATE_DRY === "1";
const TIMEOUT_MS = 10 * 60 * 1000;

// ── test files ──────────────────────────────────────────────────────────────────────────────
const TR = "packages/nana-pack/tests/templates-render.test.mjs";
const TU = "packages/nana-pack/tests/templates-update.test.mjs";
const SC = "packages/nana-pack/tests/skill-claims.test.mjs";
const RC = "packages/nana-pack/tests/readme-check.test.mjs";
const RT = "packages/nana-pack/tests/requirements-tree.test.mjs";
const PR = "packages/nana-pack/tests/product-report.test.mjs";

// ── mutated files ───────────────────────────────────────────────────────────────────────────
const PY_SEED = "templates/python/template/REQUIREMENTS.md.jinja";
const TS_SEED = "templates/typescript/template/REQUIREMENTS.md.jinja";
const SEEDS = [TS_SEED, PY_SEED];
const INCL = "templates/_shared/requirements-general.md";
const SK = (name) => `packages/nana-pack/skills/${name}/SKILL.md`;
const REQ_SKILL = SK("requirements");
const TREE = "scripts/requirements-tree.mjs";
const REPORT = "scripts/product-report.mjs";

// ── shipped text at the tip (exact) ─────────────────────────────────────────────────────────
const ADOPT_PRODUCT = "# CAP-01 · What the product does\n\nPurpose: DRAFT — name what this product does and who it serves.\nOutcome: DRAFT — name the outcome this capability delivers.\n\n## FEAT-001 · First feature\n\nPurpose: DRAFT — name the first feature the audit finds.\nStatus: proposed\n";
const SCAFFOLD_PRODUCT = "# CAP-01 · Use the package\n\nPurpose: DRAFT — name why this product exists and who it serves.\nOutcome: DRAFT — name the outcome this capability delivers.\n\n## FEAT-001 · Report the package version\n\nPurpose: DRAFT — name why reporting the version matters here.\nStatus: active\n";
const ADOPT_TABLE = "table.\n\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n{% else %}";
const FEAT900 = "## FEAT-900 · Adopt the general engineering requirements\n\nPurpose: hold the general engineering rows every nana project ships, unedited per project.\nStatus: active\n\n";
const CHECKER_CMD = '`node "$HOME/nana-pi/scripts/requirements-tree.mjs" --root .`';
const REPORT_CMD = '`node "$HOME/nana-pi/scripts/product-report.mjs" --root .`';
const CARVE_REQ = "A ledger without a requirements tree keeps its numbered sections; its next step is a lift into the tree, with every row kept byte-identical, then a regroup into capabilities and features that the owner approves. ";

// ── titles (exact, as the suite prints them) ────────────────────────────────────────────────
const LANGS = ["typescript", "python"];
const MODES = ["scaffold", "adopt"];
const each = (f) => LANGS.flatMap((l) => MODES.map((m) => f(l, m)));
const T1 = (l, m) => `${l} ${m}: REQUIREMENTS.md passes the requirements tree checker`;
const T2 = (l, m) => `${l} ${m}: every G row is homed in FEAT-900 under CAP-90 with no R row`;
const T3 = (l) => `${l} adopt: the product feature is proposed and holds no row`;
const T4 = (l, m) => `${l} ${m}: REQUIREMENTS.md says how rows are grouped, where a new row goes, who decides and how to check`;
const T5 = "requirements skill directs every row into the feature it serves, keeps a flat ledger's sections and names the owner";
const T6 = "scaffold and adopt skills direct rows into the feature each serves, keep a flat ledger's sections and name no Part G";
const T7 = "requirements skill names the tree check and the product report with a project root";
const T8 = "R-1157: --root checks another project's ledger, names its problems and writes no outline";
const T8out = "R-1157 fixture: a row outside its feature exits 1 naming it";
const T8write = "R-1157 fixture: --root <dir> --write exits 2 with usage";
const T9 = "R-1160: --root refuses a UTF-16 ledger and a ledger with no rows, naming the reason";
const T10 = "R-1158: a CRLF ledger gives the same problems and line numbers as its LF copy";
const T11 = "R-1159: a ledger with rows and no tree gets one line naming the row count and the next step";
const T15 = 'R-1161: a tree heading typed with "-" for "·" is named with its line and the expected form, not taken for a flat ledger';
const T13 = "a ledger with rows and no tree is refused with one problem line, not one per row";
const T14 = "a UTF-16 ledger and a ledger with no rows are refused by the report, naming the reason, and build no page";
const R737 = (l, m) => `${l} ${m}: Part G ships G-001..G-022 unrenumbered`;
const UNTESTED22 = (l) => `${l} adopt: every Part G row starts untested`;
const NO_INVENT = (l) => `${l} adopt: no product row is invented`;
const R598 = (l) => `${l} scaffold: all declared skill paths resolve independently`;
const R581 = ["Python rendered Jinja includes the shared source", "TypeScript rendered Jinja includes the shared source"];

// ── edits ───────────────────────────────────────────────────────────────────────────────────
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const times = (file, anchor, replacement, n) => ({ file, anchor, replacement, times: n });
const regex = (file, re, replacement, n) => ({ file, re, replacement, times: n });
const restore = (file, rev) => ({ file, restore: rev });

const SEED_T = [TR];
const INCL_T = [TR, TU];
const SKILL_T = [TR, SC];
const REQSKILL_T = [TR, SC, RC];
const CLI_T = [RT];
const READ_T = [RT, PR];
const REPORT_T = [PR];
const TREE_T = [RT, PR, TR];

const sh = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...opts });
const GIT_SAFE = ["-c", "core.hooksPath=/dev/null"];
const git = (...args) => sh("git", [...GIT_SAFE, ...args]);
const tipSha = git("-C", LANE_REPO, "rev-parse", "--verify", `${TIP}^{commit}`).stdout.trim();
const mergeBase = git("-C", LANE_REPO, "merge-base", "main", tipSha).stdout.trim();

// Frozen table. `expectRed` are the titles §5 names; `alsoRed` the seat's declared corrections (header).
const PAIRS = [
	// Seeds and include (1-6)
	{ n: "1", name: "the Python seed keeps `## 1. The product` (both branches)", edits: [one(PY_SEED, ADOPT_PRODUCT, "## 1. The product\n"), one(PY_SEED, SCAFFOLD_PRODUCT, "## 1. The product\n")], tests: SEED_T, expectRed: [T1("python", "scaffold"), T1("python", "adopt"), T3("python")] },
	{ n: "2", name: "the include keeps `# Part G.` and `## G1.`–`## G5.` (restored from the merge base)", edits: [restore(INCL, mergeBase)], tests: INCL_T, expectRed: [...each(T1), ...each(T2)] },
	{ n: "3/1", name: "G1–G5 become five `## FEAT-90n` headings, each with `Purpose:` and `Status: active`", edits: [one(INCL, FEAT900, ""), regex(INCL, /^### SUB-90(\d) · (.+)\n\n(Purpose: .+)\n/gm, (_m, d, label, purpose) => `## FEAT-90${d} · ${label}\n\n${purpose}\nStatus: active\n`, 5)], tests: INCL_T, expectRed: each(T2) },
	{ n: "3/2", name: "Part G numbered CAP-02, FEAT-002, SUB-001–SUB-005", edits: [one(INCL, "# CAP-90 · Keep", "# CAP-02 · Keep"), one(INCL, "## FEAT-900 · Adopt", "## FEAT-002 · Adopt"), regex(INCL, /^### SUB-90(\d) · /gm, (_m, d) => `### SUB-00${Number(d) + 1} · `, 5)], tests: INCL_T, expectRed: each(T2) },
	{ n: "4", name: "adopt FEAT-001 reads `Status: active` (both seeds)", edits: SEEDS.map((f) => one(f, "Status: proposed\n", "Status: active\n")), tests: SEED_T, expectRed: LANGS.map(T3) },
	{ n: "5", name: "SUB-903 loses its `Purpose:` line", edits: [one(INCL, "### SUB-903 · Documentation\n\nPurpose: the README states and honours what the project is, and how to install, run and test it.\n", "### SUB-903 · Documentation\n")], tests: INCL_T, expectRed: each(T1) },
	{ n: "6/1", name: "the seed says \"Jake decides\" (both seeds, both branches)", edits: SEEDS.map((f) => times(f, "The\nproject owner decides every change to the tree.", "Jake\ndecides every change to the tree.", 2)), tests: SEED_T, expectRed: each(T4) },
	{ n: "6/2", name: "the seed drops \"Add each new row to the table of the feature it serves.\" (both seeds, both branches)", edits: SEEDS.map((f) => times(f, "Add each new row to the table of the\nfeature it serves. ", "", 2)), tests: SEED_T, expectRed: each(T4) },
	{ n: "6/3", name: "the seed writes `~/nana-pi/` (both seeds, both branches)", edits: SEEDS.map((f) => times(f, CHECKER_CMD, "`node ~/nana-pi/scripts/requirements-tree.mjs --root .`", 2)), tests: SEED_T, expectRed: each(T4) },
	// Skills (7-9)
	{ n: "7/1", name: "requirements skill keeps \"Jake decides tree changes\"", edits: [one(REQ_SKILL, "The project owner decides every change to the tree; the seat proposes a change and declares it.", "Jake decides tree changes; declare them.")], tests: REQSKILL_T, expectRed: [T5] },
	{ n: "7/2", name: "requirements skill drops the carve-out", edits: [one(REQ_SKILL, CARVE_REQ, "")], tests: REQSKILL_T, expectRed: [T5] },
	{ n: "7/3", name: "requirements skill keeps \"at the end as its own Part\" (the base's wrapped text)", edits: [one(REQ_SKILL, "The seed's general-engineering feature (configuration and provenance,\nmodule boundaries, the code map, documentation — the README contract, G-012 — and the\nrequirement set itself) already holds the G rows; the audit does not add them again.", "Put a general-engineering block (G1 configuration and provenance, G2 module\nboundaries, G3 the code map, G4 documentation — the README contract, G-012) at the end as its own\nPart, so the engineering bar is rows too.")], tests: REQSKILL_T, expectRed: [T5] },
	{ n: "8/1", name: "adopt-structure keeps \"add the standard `Part G` engineering block\"", edits: [one(SK("adopt-structure"), "   workers, place the `req:` markers, each row in the table of the feature it\n", "   workers, add the standard `Part G` engineering block, place the `req:`\n   markers, each row in the table of the feature it\n")], tests: SKILL_T, expectRed: [T6] },
	{ n: "8/2", name: "scaffold-ts drops \"the table of the feature it serves\"", edits: [one(SK("scaffold-ts"), "pins it, each in the table of the feature it\n   serves. Do this", "pins it. Do this")], tests: SKILL_T, expectRed: [T6] },
	{ n: "8/3", name: "adopt-py drops the carve-out", edits: [one(SK("adopt-py"), "A ledger without a requirements\n   tree keeps its numbered sections; its next step is a lift into the tree,\n   with every row kept byte-identical, then a regroup into capabilities and\n   features that the owner approves. Generate", "Generate")], tests: SKILL_T, expectRed: [T6] },
	{ n: "9", name: "the skill writes `~/nana-pi/scripts/product-report.mjs`", edits: [one(REQ_SKILL, REPORT_CMD, "`node ~/nana-pi/scripts/product-report.mjs --root .`")], tests: REQSKILL_T, expectRed: [T7] },
	// Checker and report (10-14)
	{ n: "10/1", name: "`--root` ignored (reads REPO_ROOT)", edits: [one(TREE, 'const ledgerPath = resolve(process.cwd(), argv[1], "REQUIREMENTS.md");', 'const ledgerPath = resolve(REPO_ROOT, "REQUIREMENTS.md");')], tests: CLI_T, expectRed: [T8], alsoRed: [T8out, T9, T11, T15] },
	{ n: "10/2", name: "`--root` also compares the outline (<dir>/docs/requirements-tree.md)", edits: [one(TREE, "    const { problems } = checkTree(text);\n    if (problems.length) { for (const p of problems) console.error(p); return 1; }\n", "    const { problems, outline } = checkTree(text);\n    if (problems.length) { for (const p of problems) console.error(p); return 1; }\n    let committedOutline = null;\n    try { committedOutline = readFileSync(resolve(process.cwd(), argv[1], \"docs/requirements-tree.md\"), \"utf8\"); } catch {}\n    if (committedOutline !== outline) { console.error(\"docs/requirements-tree.md: differs from rendered outline\"); return 1; }\n")], tests: CLI_T, expectRed: [T8] },
	{ n: "10/3", name: "`--root <dir> --write` accepted", edits: [one(TREE, "if (argv.length !== 2 || !argv[1]) return usage();", "if (argv.length < 2 || !argv[1]) return usage();")], tests: CLI_T, expectRed: [T8], alsoRed: [T8write] },
	{ n: "11/1", name: "the NUL check dropped (in ledgerReadProblem)", edits: [one(TREE, '  if (text.includes("\\u0000")) return "REQUIREMENTS.md: NUL byte; likely UTF-16 from Windows PowerShell 5.1; save it as UTF-8";\n', "")], tests: READ_T, expectRed: [T9, T14] },
	{ n: "11/2", name: "the no-row check dropped (in ledgerReadProblem)", edits: [one(TREE, '  if (readRequirementRows(parsed).length === 0) return "REQUIREMENTS.md: no requirement rows";\n', "")], tests: READ_T, expectRed: [T9, T14] },
	{ n: "11b", name: "buildReport skips ledgerReadProblem", edits: [one(REPORT, "  const readProblem = ledgerReadProblem(ledgerText, parseLedger(ledgerText));\n  if (readProblem) throw new Error(readProblem);\n", "")], tests: REPORT_T, expectRed: [T14] },
	{ n: "11c/1", name: "the near-miss scan dropped", edits: [one(TREE, "  const nearMiss = checkNearMissHeadings(parsed);\n", "  const nearMiss = [];\n")], tests: TREE_T, expectRed: [T15] },
	{ n: "11c/2", name: "the near-miss scan matches CAP headings only", edits: [one(TREE, "const TREE_HEADING_LIKE = /^#{1,3}\\s*(CAP|FEAT|SUB)-\\d+/;", "const TREE_HEADING_LIKE = /^#{1,3}\\s*(CAP)-\\d+/;")], tests: TREE_T, expectRed: [T15] },
	{ n: "12", name: "parseLedger splits on \"\\n\" only", edits: [one(TREE, ".split(/\\r?\\n/);", '.split("\\n");')], tests: TREE_T, expectRed: [T10] },
	{ n: "13/1", name: "checkTree keeps one problem per row with no tree", edits: [one(TREE, "nearMiss.length ? nearMiss : [noTreeProblem(rows)]", "nearMiss.length ? nearMiss : checkRowsUnderFeatures(parsed)")], tests: TREE_T, expectRed: [T11, T13] },
	{ n: "13/2", name: "the no-tree rule fires only when the ledger has no heading at all", edits: [one(TREE, "const problems = parsed.headings.length === 0 && rows.length > 0", "const problems = parsed.allHeadings.length === 0 && rows.length > 0")], tests: TREE_T, expectRed: [T11, T13], alsoRed: [T15] },
	{ n: "14", name: "the no-tree line drops its row count", edits: [one(TREE, "holds ${rows.length} requirement rows and no", "holds requirement rows and no")], tests: TREE_T, expectRed: [T11, T13] },
	// Keeps (K1-K3)
	{ n: "K1", name: "a G row (G-017) dropped from the include", edits: [one(INCL, "| G-017 | WHEN a tunable changes, the suite shall pass against the new value or fail naming the row the value violates. | untested | split from G-003 2026-10-04 (EARS form batch 0): no test pins this clause |\n", "")], tests: INCL_T, expectRed: each(R737), alsoRed: [...each(T2), ...LANGS.map(UNTESTED22), ...R581] },
	{ n: "K2", name: "the adopt seed emits R-001 under FEAT-001 (both seeds)", edits: SEEDS.map((f) => one(f, ADOPT_TABLE, "table.\n\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-001 | The package shall report its version. | untested | — |\n{% else %}")), tests: SEED_T, expectRed: [...LANGS.map((l) => T1(l, "adopt")), ...LANGS.map(T3), ...LANGS.map(NO_INVENT)] },
	{ n: "K3", name: "R-1156's checker command written with a bare `.mjs` path token (requirements skill)", edits: [one(REQ_SKILL, CHECKER_CMD, "`node scripts/requirements-tree.mjs --root .`")], tests: REQSKILL_T, expectRed: LANGS.map(R598), alsoRed: [T7] },
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
log(`seat-mutate: lane tree, tip ${tipSha}${branchHead && branchHead !== tipSha ? ` (NOTE: ${LANE_BRANCH} is now ${branchHead})` : ""}, merge-base ${mergeBase}, ${pairs.length} pairs${DRY ? " (DRY: anchors only)" : ""}, ${process.platform}, node ${process.version}, ${new Date().toISOString()}`);
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
			for (const f of new Set(p.edits.map((e) => e.file))) {
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
