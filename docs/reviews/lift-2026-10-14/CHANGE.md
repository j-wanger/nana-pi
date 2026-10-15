# Change declaration — lift: one tool applies a tree mapping to a project's REQUIREMENTS.md and proves every row survives unchanged

*Lane `lift` (the tree plan's `tree-lift`) · `feat/lift` · `~/nana-pi-wt/lift`, from `main` `d9cf0bc` (tree landed) · 2026-10-14 · seat draft 2 (the fact-check revision, last
section), not reviewed. Features: FEAT-028 (new R-1162 to R-1168), FEAT-032 (new R-1169). No reworded or retired row, no tree change, no share. Class GATE (it rewrites another
project's contract file): two plan-review rounds. Builder: Claude Sonnet 5 (`sonnet`), a subagent in the lane worktree. No `packages/nana-setup/` or hook change, so no install
check. Stakes: high blast — a lost or changed row in another project's ledger stays silent without a proof. Evidence: the `research-*.md` and `factcheck-*.md` files beside this
file; ledger copies and probes stay in the seat's scratch, uncommitted. Cites are at `d9cf0bc`; "Ran" = run on this Mac by those probes; INFERRED = not read or run.*

## 1. Why

Jake, 2026-10-14: "Lift is the tool that enables better regroup, but this is a core feature for nana, understanding existing repo and turn into feature trees, then development
really becomes feature oriented". The queue puts the lift first (`HANDOFF.md:78-79`; tree `CHANGE.md:210-212`).
- **The gap.** A flat ledger gets one line from the checker and report: no tree yet, see the skill (`requirements-tree.mjs:416-418`). The skill names "a lift into the tree, with
  every row kept byte-identical" and no command (`SKILL.md:128`); copier never rewrites a ledger (tree `CHANGE.md:26`); a hand sort has no proof (tree residual 1, `:224`).
- **The users (Ran, `research-ledgers.md` §1–§5).** Flat: aml-desk (365 rows, Parts A–F, 3 headless fragments), basketball-geek (171 rows, 6 uncommitted), trading-zone (197 rows,
  a template general block mid-file, 7 product sections after it). yokai-world is a hand-built partial tree with 35 problems.
- **The regroup needs it.** The regroup lane's agent proposes a tree; Jake approves; this tool applies it (`HANDOFF.md:79`). So one mapping format must serve the mechanical
  default and the agent's proposal, and the tool must take a tree as input.

**Threat model.** In scope: honest variation in our tools' output and our users' files — CRLF, a BOM, a UTF-16 file (Windows PowerShell 5.1 `>`), an ANSI ledger line or mapping
(5.1 `Add-Content`, `Set-Content`), a mapping BOM (5.1 `-Encoding UTF8`), padded table headers, headless table fragments, repeated section labels, uncommitted ledger edits in any
worktree, a staged-only or untracked ledger, an unborn HEAD, git missing from PATH, a project in a subfolder of its repo, a hand-built partial tree, `core.autocrlf=true`, Bash or
PowerShell, Node 22.18 or later. Out: deliberate forgery — a mapping or ledger built to fool the proof, a lying git, a hand-edited file engineered past the parser.

## 2. Requirement delta

Main's highest ID is R-1161 (`REQUIREMENTS.md:1341`); R-1162 to R-1169 are unused (grep count 0). One `shall` per row; each starts `planned`.

| ID | Change | Text |
|---|---|---|
| R-1162 | added, FEAT-028 after R-1161 | WHEN `scripts/requirements-lift.mjs` runs with `--root <dir>` and neither `--write` nor `--verify`, it shall print one line per capability, feature and subgroup of the planned tree with its row count, one line per pair of old and new headings between which rows move, and the proof's summary line, writing no file except a new mapping file that `--emit-mapping <file>` names, which holds the identity mapping when the tree checker passes the ledger. |
| R-1163 | added, FEAT-028 | The lift shall report success, or write, only when its proof, computed by a module that imports nothing from the lift module, finds that the output keeps the input's BOM and each input row line byte-identical with its own line ending, holds the same multiset of row IDs, carries every other non-blank input line once except the heading, field and requirement-table header and delimiter lines the mapping replaces, carries every input line of an in-place leaf, blank lines included, in input order, adds only lines the mapping declares, places each row in its mapped leaf in mapping order and, with no `--mapping`, each leaf's rows and each old section's lines in input order, and passes the tree checker with no problem. |
| R-1164 | added, FEAT-028 | WHEN run with `--write`, the lift shall replace `<dir>/REQUIREMENTS.md` through a temporary file and a rename only when the proof passes, git runs and HEAD has a commit, git tracks the ledger and any `--mapping` file and finds neither different from HEAD, no other worktree of the repository holds an uncommitted ledger edit, and the ledger's bytes still equal the bytes it proved, and otherwise refuse with exit 1 naming the reason and any such worktree's path, and leave the ledger unchanged. |
| R-1165 | added, FEAT-028 | WHEN no `--mapping` is given and the tree checker finds only R-1159's no-tree problem and no subgroup heading in the ledger, the lift shall build a default mapping that keeps the title and the lines before the first section holding rows, turns each later section into a capability, feature or subgroup by heading level in file order with its old heading text as label and a `Purpose:` starting `Not yet sorted:`, opens a `Not yet sorted` capability before sections no other capability holds, gives the sections holding G rows the seed's CAP-90, FEAT-900 and SUB-900 to SUB-904 headings, keeps `## Open questions` and `## Deliberate omissions` verbatim under the seed's closing heading, and moves no line out of its section's order. |
| R-1166 | added, FEAT-028 | WHEN `--mapping <file>` is given, read with any BOM removed, and its pin equals the SHA-256 of the ledger's text with the BOM removed and LF line endings, the lift shall apply that mapping to the ledger, with or without a tree, placing each node's rows in the order it lists them and each named old heading's other lines under that node. |
| R-1167 | added, FEAT-028 | The lift shall refuse with exit 2 and its usage line a run without `--root` or with conflicting flags, and otherwise with exit 1, naming each problem and its line in at most `PROBLEM_LINE_CAP` lines plus the count of the rest, a ledger or mapping file whose bytes differ from their UTF-8 re-encoding, a ledger holding a NUL byte, no row, a repeated row ID, a fenced row, a level 4 to 6 or setext heading, an `Also applies:` line, carried prose starting with a field label, or, without `--mapping`, a ledger neither flat under R-1165 nor, for `--emit-mapping`, passed by the tree checker, or a row the default cannot place, and a `--mapping` file outside `<dir>`, not valid JSON, of another `lift` version, or holding a NUL byte, a U+FFFD or a line break in a string, another ledger's pin, a missing, repeated or unknown row, an old heading named other than once, a G row outside its seed subgroup, an R row in a reserved node, or a row under a `proposed` or `retired` feature. |
| R-1168 | added, FEAT-028 | WHEN run with `--verify <rev>`, the lift shall exit 0 only when git tracks the ledger and any `--mapping` file with no difference from HEAD and that mapping, or the default, applied to `REQUIREMENTS.md` at `<rev>` gives HEAD's `REQUIREMENTS.md` byte for byte with a passing proof, and otherwise exit 1 naming the first differing line. |
| R-1169 | added, FEAT-032 after R-1156 | The requirements skill shall name the lift's dry run as `node "$HOME/nana-pi/scripts/requirements-lift.mjs" --root .`, show no lift flag that the lift's source lacks, say that `--write` runs only after the owner's yes and only while REQUIREMENTS.md matches HEAD in every worktree of the repository, and say that the seat reports uncommitted ledger edits to the owner and never commits, stashes or discards another session's lines. |

No row changes text or status; R-287–R-294, R-1151, R-1154 and R-1157–R-1161 keep theirs. Leaf total 1,128 → **1,136**; headings stay 68.

## 3. Design

**3.1 Two modules, nothing copied (`research-code.md` §2).** `scripts/requirements-lift.mjs` — *@purpose* "Lift a project's REQUIREMENTS.md into the requirements tree through a
mapping, writing it only when proved and matching HEAD." It builds the default mapping, validates a mapping, applies it, runs the git gate, writes, verifies, and holds the CLI.
- `scripts/requirements-lift-proof.mjs` — *@purpose* "Prove that a lifted ledger keeps every row and line of its input where a mapping places them." It imports only the tree
  module and the trace shim, never the lift module, so an apply bug cannot pass both (R-1163; T7); a default-builder bug meets check (8) of §3.5 (factcheck W4).
- Both import `parseLedger`, `checkTree`, `noTreeProblem`, `ledgerReadProblem`, `readRequirementRows`, `expandRowIds`, `REPO_ROOT` (`requirements-tree.mjs:15,60,416,423,
  428,231,296`) and `requirementRowId`, `ID` (`requirements-trace.mjs:21,25`). The tree module gains `export` on `TABLE_HEADER`, `TABLE_DELIMITER`, `markdownTableCells` (`:20-27`)
  and `countRequirementRowLines` (`:407`), nothing else. Not reused: `compressRowIds` sorts (`:218`); req-tree's `prove.mjs` sees 3-digit IDs only (`research-design.md` §6).
- **Tunables** atop the lift module, read by name, with provenance: `UNSORTED_PREFIX = "Not yet sorted:"` (contract, sealed by T14); `UNSORTED_LABEL`, `UNSORTED_TEXT` (chosen: one
  recognisable placeholder; tree `CHANGE.md:210`); `CLOSING_HEADING`, `KEPT_SECTIONS` (contract: Python seed `REQUIREMENTS.md.jinja:110,112,119`, TypeScript `:108,110,117`; pinned
  by T17 against both); `GENERAL_SEED` (path); `CANONICAL_DELIMITER` `|---|---|---|---|` (contract: matches `TABLE_DELIMITER`); `MAPPING_FORMAT = 1`; `PROBLEM_LINE_CAP = 40`
  (chosen: 40 lines of about 200 characters sit far under Claude Code's 30,000 characters and pi's 2,000 lines, tree `CHANGE.md:14-15`).

**3.2 The mapping (JSON, one format for the default and a proposal; values illustrative).** Row text never appears in it (req-tree `CHANGE.md:124-127`).
```json
{ "lift": 1, "pin": { "sha256": "<ledger text, BOM removed, LF endings>", "rows": 197 }, "head": { "through": 54 }, "tree": [
  { "id": "CAP-01", "label": "Not yet sorted", "purpose": "Not yet sorted: …", "outcome": "Not yet sorted: …", "from": [], "features": [ { "id": "FEAT-001",
    "label": "1. Ingest", "purpose": "Not yet sorted: …", "status": "active", "from": [{ "line": 55, "heading": "## 1. Ingest" }], "rows": ["R-001", "R-120", "R-002"], "subgroups": [] } ] },
  { "id": "CAP-90", "from": [], "features": [ { "id": "FEAT-900", "from": [{ "line": 151, "heading": "# Part G. …" }], "rows": [], "subgroups": [ { "id": "SUB-900",
    "from": [{ "line": 161, "heading": "## G1. …" }], "rows": ["G-001", "G-016", "G-002", "G-003", "G-017"] } ] } ] } ],
  "tail": { "heading": "# Open questions and deliberate omissions", "from": [], "keep": [{ "line": 363, "heading": "## Open questions" }, …] } }
```
- **Pin.** SHA-256 of `parsed.lines.join("\n")` plus the row count. Line numbers are `parseLedger`'s, which split on `/\r?\n/` after the BOM strip (`:61`), so a mapping drawn on
  macOS applies to a Windows CRLF checkout (R-1166, T21). Any ledger edit voids the mapping: re-emit or re-propose.
- **Reads.** Ledger and mapping, files or blobs, are read as bytes; bytes that differ from `Buffer.from(text, "utf8")` refuse, naming the first such line (R-1167; a cp1252 `0xE9`
  row decodes to U+FFFD with no NUL, and the proof alone passes the changed bytes; factcheck-external top 1). A mapping's BOM is then stripped before `JSON.parse` (R-1166).
- **Old headings** are every ATX heading at levels 1–3 outside a fence. Each is named exactly once: inside `head`, in a node's `from`, in `tail.from` or in `tail.keep`. `{line,
  heading}` keeps repeated labels apart (aml-desk's two `## 36b.`); the heading text must equal that line, so a shifted line is named.
- **Nodes** carry `id`, `label`, `purpose`; a capability adds `outcome`, `features`; a feature adds `status`, optional `also_applies`, `rows` and `subgroups`; a subgroup, `rows`.
  `rows` lists IDs or en-dash ranges (`expandRowIds`) in authoritative order. An empty `from` is a new heading; a rowless `proposed` feature is a regroup plan (R-294).
- **Reserved nodes** (CAP-90, FEAT-900, SUB-900 to SUB-904) carry only `id`, `from`, `rows` and children. Their headings, purposes, outcome and status come from the seed's parse
  (`templates/_shared/requirements-general.md:13-86`), and each G row's subgroup is the seed table that holds it (R-1151's shape).
- `head.through` ends just before an old heading and holds no row. `tail` is the generated closing heading, the prose of `tail.from` headings, then each `tail.keep` section
  verbatim with its heading; kept sections hold no row. The tool writes the file itself (UTF-8, LF, two-space indent), never through `>`.
- **Identity (R-1162).** On a passing tree, `--emit-mapping` maps each heading to itself, rows in file order — the regroup's start; it round-trips a lifted ledger (T31).

**3.3 The default mapping (R-1165).** Flat ledgers only: `checkTree(text).problems` deep-equals `[noTreeProblem(n)]`, `n` from `countRequirementRowLines(parsed)`
(`readRequirementRows` gives aml-desk 338 of 365; factcheck G1), and no SUB heading (`:428-446`), so R-1161's near-miss heading is not flat. Rules keep file order; no row moves.
1. **Head.** The title (a level-1 first heading) and all lines before the outermost non-title heading above the first row stay verbatim, so a prose-only `## The product` stays.
2. **Levels.** Each later `#` heading becomes `# CAP-nn`, `##` becomes `## FEAT-nnn`, `###` becomes `### SUB-nnn`, numbered from 01, 001 and 001 in file order. The label is the
   parser's label, verbatim (`36b. Build at production size`, `Part F. …`), so files that cite "section 8" or "Part F" still find it. Each node gets `Purpose: <UNSORTED_TEXT>`; a
   capability also `Outcome:`; a feature `Status: active`, prose-only ones included.
3. **No capability above.** Sections under the title alone, or after the general sections, get a `# CAP-nn · Not yet sorted` opened just before them. basketball-geek gets one;
   trading-zone gets CAP-01 (sections 1–4), CAP-90, then CAP-02 (5–11). No product feature nests under CAP-90, a case the checker passes silently today (tree residual 11,
   `CHANGE.md:234`; the sim's trading-zone run, `research-ledgers.md` §4).
4. **General sections.** The `##` sections holding G rows must form one run with no R row; each maps to the seed subgroup holding its G rows. A `#` heading with only prose between
   it and the run becomes CAP-90, its prose going to FEAT-900 as the seed places it; otherwise CAP-90 and FEAT-900 open before the run. aml-desk's Part F holds R rows and no G
   row, so it stays a product capability (`research-ledgers.md` §7 item 4).
5. **Closing.** `## Open questions` and `## Deliberate omissions` move under `CLOSING_HEADING` verbatim, in file order; `SKILL.md:126` names the first, the seeds both.
6. **Refused, naming the line** (R-1167): a tree heading, a row before the first section or directly under a `#`, a `###` with no `##` above it, G rows outside one run, mixed with
   R rows, spanning two seed subgroups or unknown to the seed, and a row in a kept section. The owner then supplies a mapping.

**3.4 Apply and layout.** Raw segments come from `body.split(/(?<=\n)/)` after the BOM strip, which lines up 1:1 with `parsed.lines` for LF and CRLF+BOM (Ran, `research-code.md`
§3.1). Copied lines keep their own bytes and ending; generated lines take the input's first line ending; the BOM stays.
- Each node prints its heading, `Purpose:`, then `Outcome:` or `Status:`, an optional `Also applies:`, then its body. A leaf whose rows equal its `from` sections' rows in old
  order keeps those bodies **in place**: prose stays between its table fragments (aml-desk §36's six lane notes keep their rows), a padded header pair becomes `TABLE_HEADER` plus
  `CANONICAL_DELIMITER`, and a headless fragment gets that pair inserted (`:68` needs the byte-exact header). Any other leaf is **re-laid**: its `from` prose first, in old order
  with blank runs collapsed, then one table in mapping order. An old tree heading's own field lines are replaced with it. Every default node is in place, so its diff is heading
  rewrites plus inserted lines (Ran, simulated without `Outcome:`: aml-desk 49 rewritten, 147 inserted, 0 problems; `research-ledgers.md` §2).

**3.5 The proof (R-1163; `proveLift(input, mapping, output, seedText, { fromDefault })`).** Its standard is req-tree's — independent of the writer, every line accounted (req-tree
`CHANGE.md:199-217`) — in full for in-place leaves (every default node); a re-laid leaf skips blank lines (residual 1). It checks: (1) BOM out iff BOM in; (2) the sorted
`requirementRowId` list over all lines, fences included, is equal; (3) each output row's raw segment equals the input's for that ID, terminator included, save an unterminated last
input line, which gains the ending; (4) every input line of an in-place leaf, blank lines included, appears once in its node's region in input order, save replaced heading, field,
header and delimiter lines; elsewhere each non-blank input line is a row, a named heading, a replaced field, header or delimiter line, head, tail, or prose found once in its
node's region in old relative order; (5) each non-blank output line is a consumed input line or one the mapping declares: heading, field line, `TABLE_HEADER`, a `TABLE_DELIMITER`
line, closing heading; (6) `readRequirementRows(parseLedger(out))` puts each ID in its leaf in mapping order, and the headings equal the mapping's nodes, labels and purposes in
order; (7) `checkTree(out).problems` is empty; (8) with `fromDefault` (set by the CLI), each leaf's rows and each old section's lines follow input order, read from the input,
never the mapping. Its one line: `lift proof: <n> rows kept byte-identical; <p> prose lines carried; <h> headings replaced; <i> lines inserted; tree check 0 problems`.

**3.6 Command, gate, verify.** Forms, identical in Bash and both PowerShells (`$HOME` expands in 5.1; roster `CHANGE.md:166-167`):
`node "$HOME/nana-pi/scripts/requirements-lift.mjs" --root <dir> [--mapping <file> | --emit-mapping <file>] [--write | --verify <rev>]`.
- `--root` is required (req-tree's mover defaulted to nana-pi, `research-design.md` §2). `--emit-mapping` joins no `--mapping`, `--write` or `--verify` and never overwrites. A
  `<rev>` starting `-` is a usage error. Exits 0/1/2 as the checker (`:447-485`). Plan to stdout, problems to stderr. `--mapping` lies inside `--root` by realpath (R-1167). Each
  git path is relative (to `--root`, or to a worktree's top) and `/`-joined: `<rev>:<path>` takes `/` only, and `path.relative` gives `\` on win32 (factcheck-external top 3).
- **Gate (R-1164)** via `spawnSync("git", ["-C", …])`, no shell. Any status but 0, or none (git not on PATH), refuses naming the reason: git missing, HEAD unborn ("commit the
  ledger first"), untracked, or different. `ls-files --error-unmatch` and `diff --quiet HEAD --` on ledger and mapping. Ran: `diff --quiet` alone passes an untracked file, catches
  a staged-only edit, and is clean for a CRLF file under `core.autocrlf=true`, where a byte compare refuses every clean Windows checkout (`research-design.md` §2;
  `nana-land.mjs:25-28`). Then `worktree list --porcelain` and, in each non-bare worktree, `diff --quiet HEAD -- <prefix>REQUIREMENTS.md` (`rev-parse --show-prefix`); a fresh lane
  worktree never sees the main checkout's edits (factcheck-external top 2), so a dirty one refuses naming its path. Then: temp file beside the ledger, read back, re-read the
  ledger against the proved bytes, rename; a failed rename removes the temp file and refuses naming the reason. The write step takes its file functions as a parameter (T12).
- **Verify (R-1168)** reads only blobs: input `<rev>:./REQUIREMENTS.md`, expected `HEAD:./REQUIREMENTS.md`, mapping `HEAD:./<path>` (the `./` form works from a subfolder; Ran,
  `research-code.md` §8). Blobs on both sides share git's stored form, so line-ending conversion cannot differ. This is `prove.mjs --approved`'s role.
- **Main guard** compares realpaths (`requirements-trace.mjs:58`), not `:487`'s resolve form, which exits 0 silently through a link (tree `CHANGE.md:229`). Every run prints a
  summary or a named refusal. Node 22.18 or later, for the `.ts` rail behind the shim.

**3.7 Skill (R-1169).** The description gains "requirements tree" and "lift", so either seat loads the skill for this flow (unpinned). §4 keeps the carve-out R-1154 and R-1155 pin
(`templates-render.test.mjs:453`) and adds the flow: dry run in a lane worktree of the project; show the owner the plan, every purpose "Not yet sorted:"; `--write` "only after the
owner's yes", while REQUIREMENTS.md "matches HEAD in every worktree" (else the tool refuses, naming it); on uncommitted edits, tell the owner and "never commit, stash or discard
another session's lines"; a shape the default refuses takes `--emit-mapping`, an edit, a commit, then `--mapping`; tree check; commit by path with the proof line; the reviewer
runs `--verify <base>`; lift when no other lane edits the ledger (unpinned). Only this skill reaches both seats (`steps.mjs:58`); the five pi skills keep their carve-out.

**3.8 What NOT to do.** No change to the checker's behaviour (invalid UTF-8 included), `main` or guard; `scripts/product-report.mjs`; the seeds and templates; the five pi skills;
`packages/nana-setup/**`; any other project's files. No `git add` or commit in the tool; no warning scan of other branches; no nana-pi root refusal (S9); no LLM step.

## 4. Scope

**In.** New `scripts/requirements-lift.mjs`, `scripts/requirements-lift-proof.mjs`, `packages/nana-pack/tests/requirements-lift.test.mjs` (six-tag headers).
`scripts/requirements-tree.mjs`: four `export` keywords. `packages/nana-pack/skills/requirements/SKILL.md`: the frontmatter description and §4. Tests: `templates-render.test.mjs`
(T29 in `checkRequirementsSkillTreeText`, `:452-470`), `requirements-tree.test.mjs` (R-291's literal, `:40,54,55`). `README.md` names both new scripts — `:64` gains the lift
command, its git need and the proof module by name — so readme-check's every-script rule passes (`readme-check.mjs:456-463`; factcheck W2). `REQUIREMENTS.md`, regenerated
`docs/requirements-tree.md` and `docs/code-map.md`, `HANDOFF.md`, `docs/sessions/2026-10.md`, this corpus.
**NOT.** §3.8; the report's subfolder residual (tree residual 2); downstream ledgers — each project's lift is its own lane with Jake's yes on its dry run.
**Overlap.** None in flight (`git worktree list`); the stale `feat/t3-land-b` (2026-10-08) edits REQUIREMENTS.md and the code map, outside this lane.

## 5. Verification

Exact titles under `// req:` lines, red before the code, frozen in `seat-titles.mjs` (DONE = `0 missing`). Fixtures are built in the test, G rows from the seed's parse; no other
project's ledger enters nana-pi. Spawned runs drop Node's `(node:` lines (tree test's `own()`); git repos are temp folders, each pinning `core.autocrlf=false` except T11, which
sets `true`. Tunables are imported by name; T14 alone holds the prefix literal. **`requirements-lift.test.mjs`:**
- T1 `R-1162: a dry run prints one line per planned heading, no move, and the proof line, and writes nothing` (ledger bytes and folder listing unchanged). T2 `R-1162:
  --emit-mapping writes only the named new file and refuses one that exists`. T3 `R-1162: run through a symlink to the script, the dry run still prints its plan` (skipped on
  win32). T31 `R-1162: --emit-mapping on a lifted ledger writes the identity mapping, which --mapping applies with no move line and the same bytes`.
- T4 `R-1163: the default lift passes its proof, keeps every row line byte-identical and in file order, the row-ID multiset equal and the tree checker clean` (the fixture holds a
  trailing-space row; oracles are the test's own segment split and sort). T5 `R-1163: CRLF, BOM-and-CRLF, mixed-ending and unterminated ledgers keep every row line byte-identical
  with its own ending`. T6 `R-1163: the proof names a dropped row, a changed byte, a stripped CR, a new row-shaped line, a reordered leaf, a lost prose line, prose moved to
  another node, a dropped blank line and two swapped lines in an in-place leaf, and, with no mapping, a leaf's rows and a section's lines out of input order` (fifteen tampered
  outputs, each named — the eleven above plus a duplicated row, a renumbered ID, a row moved into a fence and a heading-ID collision; the true output gives none). T7 `R-1163: the proof module imports nothing from the lift module`.
- T8 `R-1164: --write replaces a clean tracked ledger with the proved bytes in a project in a subfolder of its repository`. T9 `R-1164: --write refuses an uncommitted,
  staged-only, untracked or git-less ledger, an unborn HEAD, git missing from PATH and an uncommitted ledger edit in a second worktree, naming that worktree, and leaves the ledger
  unchanged` (PATH set to an empty folder). T10 `R-1164: --write refuses a mapping file in a subfolder that is untracked or differs from HEAD, and one outside the repository,
  naming the reason, and accepts a committed one`. T11 `R-1164: --write accepts a clean CRLF checkout under core.autocrlf=true and keeps its CRLF rows`. T12 `R-1164: --write
  refuses when the ledger changes between the proof and the rename`.
- T13 `R-1165: the default makes each Part a capability and each ## and ### a feature and subgroup in file order, keeping old heading text as labels and the title and intro in
  place`. T14 `R-1165: every default purpose and outcome starts with the unsorted prefix, and the prefix is "Not yet sorted:"`. T15 `R-1165: sections under no Part, and sections
  after the general-engineering sections, open a Not yet sorted capability`. T16 `R-1165: the general-engineering sections take the seed's CAP-90, FEAT-900 and SUB-900 to SUB-904
  headings, purposes and row homes`. T17 `R-1165: Open questions and Deliberate omissions stay verbatim under the seed's closing heading`. T18 `R-1165: prose between table
  fragments stays between them, and each headless or padded fragment gets the exact table header`.
- T19 `R-1166: the mapping --emit-mapping writes, passed back with --mapping, gives the default lift's bytes`. T20 `R-1166: a mapping applies to a lifted ledger, moving rows
  between features in its order and naming each move` (a merge, a moved row, a proposed empty feature). T21 `R-1166: one mapping applies to a ledger's LF and CRLF copies`.
- T22 `R-1167: the lift refuses a UTF-16 ledger, an ANSI line that is not valid UTF-8, a ledger with no rows, a fenced row, a level-4 or setext heading, an Also applies line and a
  carried field line, naming each line`. T23 `R-1167: without --mapping, the lift refuses a ledger with a tree or near-tree heading, or a row the default cannot place, naming
  them`. T24 `R-1167: a mapping is refused, each problem named, for another ledger's pin, a missing, repeated or unknown row, an old heading named twice or never, a G row outside
  its seed subgroup, an R row in a reserved node and a row under a proposed feature`. T25 `R-1167: a UTF-16, ANSI or line-broken mapping file, or one outside the root, is refused
  naming the reason, and one with a BOM is accepted` (the BOM case also cites R-1166). T26 `R-1167: a mapping missing 1,000 rows prints at most the problem-line cap and the count
  of the rest`. T27 `R-1167 fixture: a run without --root, or with --write and --emit-mapping together, exits 2 with usage`.
- T28 `R-1168: --verify passes a committed lift with its mapping in a subfolder against its base and names a hand-edited one's first differing line, in a project in a subfolder`.
**`templates-render.test.mjs`:** T29 · R-1169 `requirements skill names the lift's dry run, the owner's yes before --write, a clean ledger in every worktree, never discarding
another session's lines, and only flags the lift has` (phrases: `LIFT_SKILL_CMD`, `only after the owner's yes`, `matches HEAD in every worktree`, `never commit, stash or discard
another session's lines`; every `--flag` the skill shows for the lift appears in the source at `LIFT_SCRIPT`, the path imported by name).
**`requirements-tree.test.mjs`:** T30 · R-291 rename: `…leaf counts total 1,128` → `1,136` (title, `:54`, `:55`).

**Wrong code first.** Each pair edits code or text, never an assertion, and must red exactly the named titles (N/N in `seat-mutate.mjs`). 49 pairs.

| # | Wrong code | Reds |
|---|---|---|
| 1 | apply drops a leaf's last row / carries a section's prose into the next node / rejoins lines with one ending / trims trailing space on copied lines / sorts a leaf by ID / puts an in-place section's prose above one table / keeps a padded header / inserts no header before a headless fragment | T4, T8 / T4, T8 (the proof refuses) / T5 / T4 / T4, T20 / T18 / T18, T4 / T18, T4 |
| 2 | proof compares IDs only / skips the order check / skips the stray-line check / skips blank lines in an in-place leaf / ignores line order in an in-place leaf / skips the default's input-order check / imports a helper from the lift module | T6 (the first six) / T7 |
| 3 | gate drops `ls-files` / byte-compares with `git show` / skips the mapping / skips the re-read / skips the worktree scan / reads a null or 128 git status as clean / verify reads `HEAD:REQUIREMENTS.md` without `./` / `--emit-mapping` overwrites / the guard uses the resolve form / `--emit-mapping` refuses a ledger the tree checker passes / the identity mapping lists a leaf's rows sorted by ID | T9 / T11 / T10 / T12 / T9 / T9 / T28 / T2 / T3 / T31 / T31 |
| 4 | ledger byte round-trip dropped / mapping byte round-trip dropped / mapping BOM kept / `--mapping` outside `--root` accepted / the flat test counts with `readRequirementRows` / pin hashes raw bytes / `--mapping` refuses a tree input / validator accepts a G row in another reserved subgroup / validator accepts a heading named twice / fenced-row check dropped / setext check dropped / mapping NUL check dropped / cap removed | T22 / T25 / T25 / T25 / T18 / T21 / T20 / T24 / T24 / T22 / T22 / T25 / T26 |
| 5 | the title becomes a capability / labels drop "1. " / sections after the general run nest under CAP-90 / reserved nodes get the placeholder / Open questions becomes a feature / the closing heading is retyped differently | T13 / T13 / T15 / T16 / T17 / T17 |
| 6 | skill drops "only after the owner's yes" / skill drops "in every worktree" / skill shows a flag the script lacks / a row added without the literal update | T29 / T29 / T29 / T30 |

**Seat acceptance** (on copies in the seat's scratch, never in the projects; seen failing at the base).
- Dry runs: aml-desk → 6 capabilities, 41 features, 2 subgroups, 3 header pairs, proof clean; basketball-geek's HEAD copy → 1/9/0; trading-zone → CAP-01, CAP-90, CAP-02 with
  FEAT-005–FEAT-011 under CAP-02, 0 checker problems; yokai-world → refused naming its tree-heading count; a prose-only ledger → no rows.
- basketball-geek's CRLF, BOM+CRLF and mixed copies keep 171/171 rows byte-identical; a scratch git copy: `--write`, commit, `--verify <base>` exits 0. An ANSI-appended copy is
  refused naming its line; with its six uncommitted rows in a scratch main checkout, `--write` from a lane worktree refuses, naming it. **Regroup rehearsal:** hand-edit the lifted
  copy's identity mapping into a proposal (two capabilities, one merge, three moved rows, one proposed feature). It must validate, prove and print its moves with no tool change.
- Suite: `npm run test:locked`, `map:check`, `readme:check`, `node scripts/requirements-tree.mjs --check`, `node scripts/requirements-trace.mjs`; an empty merge-base diff on
  §3.8's files. Windows: the PR's non-blocking leg must pass T1–T28 and T31 (T3 skipped); it runs Git Bash, not PowerShell, and alone runs the `/`-joined git paths on win32.

**The claim most likely wrong:** that every default node is in place, so the full-line proof covers the whole default lift. Rule 4 re-homes a Part's prose under FEAT-900, and
aml-desk's 19 padded delimiters under exact headers (factcheck G4) must stay in place; a default node re-laid instead reopens residual 1 for the default. The trading-zone and
aml-desk dry runs test it. Next: the matches-HEAD test under `eol=` attributes on Git for Windows (unrun).

## 6. Decisions and residuals (each becomes one HANDOFF line)

**Jake's ruling (2026-10-14)** set the direction (§1). No question stays open for him in this plan. Each project's lift is his call at its own dry run, by the tool's design:
aml-desk, basketball-geek once its six uncommitted rows are settled, then trading-zone.
**Seat decisions (declared, not asked).** S1 Two modules; the proof never imports the lift module. S2 JSON mapping pinned to the LF form, old headings by line and text, no row
text. S3 Labels keep the old heading text and number; the regroup renames. S4 Reserved nodes take the seed's text at run time. S5 Product sections after the general run get a new
capability and no row moves, so CAP-90 is not last until the regroup (tree S2 stays for seeds). S6 In place for an unchanged leaf, else prose first and one table. S7 Shares,
setext and level 4–6 headings and fenced rows are refused. S8 `--emit-mapping` on a ledger the tree checker passes writes the identity mapping, the regroup's starting point. S9 No
nana-pi root refusal: `--root` is required, the default refuses any tree, and a mapping write needs that mapping committed; a refusal would block a later nana-pi regroup. S10
Generated lines take the first line ending. S11 Lifted features read `active`.
**Residuals and carries.**
1. The proof skips blank lines in a re-laid leaf (a mapping's moved or reordered rows); a dropped one there could join two prose paragraphs. Default nodes are in place.
2. A regroup that splits a section with prose between fragments puts that prose above one table; aml-desk §36's lane notes would lose their rows' position.
3. A ledger with `Also applies:` lines is refused, so a ledger with shares (nana-pi's form) cannot be regrouped by this tool yet. Tree residuals 5 and 6 stay.
4. yokai-world needs its hand fix or a hand-written mapping (tree residual 10). trading-zone keeps CAP-90 mid-file until its regroup. FEAT numbers stop matching section numbers
   once a section is lettered or repeated (aml-desk from 36b on); the labels keep the old numbers.
5. A flat branch merged after a lift leaves its new `## N.` section outside the tree; the checker names its rows (INFERRED). Lift when no lane edits the ledger. The worktree scan
   sees worktrees only; an edit in a separate clone surfaces at its merge.
6. A Windows rename may fail while antivirus or the indexer holds the fresh file (likelier than an editor; Node will not retry, nodejs/node#29481); the tool refuses by name and
   removes the temp file. ASCII-only ANSI is valid UTF-8 and passes. Project rails are heading-blind (`research-adopt.md` §5.4); no project suite has run on a lifted ledger.
7. HANDOFF line for Jake, written before the final round: re-run `nana-setup install` on the Windows Claude Code seat so its requirements skill copy updates (`steps.mjs:217-226`);
   the PowerShell form of the command has not run on Windows.
- **Scope kept (seat; factcheck-external's list).** `--mapping` on a tree input: the regroup lane applies its mapping to a lifted, tree-form ledger through this tool.
- `--verify`: the reviewer's deterministic check of a committed lift, req-tree's `prove.mjs --approved` role.
- `--emit-mapping`: the starting point for a shape the default refuses, and for the regroup.
- A committed mapping: it makes `--verify` reproducible.

## Seat revision (2026-10-14)

1. README: §4 names both new scripts in `README.md` (the lift command at `:64` and the proof module), so readme-check's every-script rule passes.
2. K1 dropped (it cannot red); T29 checks every lift flag the skill shows against `LIFT_SCRIPT`'s source; mutation row 6.
3. Proof: in-place leaves (every default node) account every input line, blanks included, in order; with no `--mapping`, check (8) holds input order; row 2.
4. Encoding: a ledger or mapping whose bytes differ from their UTF-8 re-encoding is refused (R-1167, T22, T25, row 4); the checker, which only reads, is unchanged.
5. Worktrees: the `--write` gate checks the ledger in every worktree and names a dirty one (R-1164, T9, row 3); the skill says so (R-1169, T29).
6. Paths: `--mapping` lies inside `--root`; git gets relative, `/`-joined paths; T10 and T28 put the mapping in a subfolder.
7. A mapping's BOM is stripped before parsing (R-1166); T25 accepts a mapping with a BOM.
8. Git edge cases: an unborn HEAD, git missing and a mapping outside the repo refuse by name (T9, T10); git tests pin `core.autocrlf`, T11 to `true`.
9. `countRequirementRowLines` is exported (four exports); the flat test uses it, never `readRequirementRows` (row 4).
10. The skill description gains "requirements tree" and "lift"; TypeScript seed cites fixed; `## Deliberate omissions` named at the `SKILL.md:126` cite.
11. Scope kept, one line each in §6; `--emit-mapping` on a passing tree writes the identity mapping (R-1162, T31, row 3; S8; a new claim most likely wrong).
12. Residual 6 names antivirus or the indexer as the likelier rename failure (nodejs/node#29481); a failed rename refuses and removes the temp file.
13. Kept: class GATE, two plan rounds, builder Claude Sonnet 5, rows R-1162–R-1169 with one `shall` each; new clauses folded into those rows.

## Seat revision 2 (2026-10-14)

Repo fact-check gaps G2 and G3 folded in: R-1167 also refuses a ledger with a repeated row ID (the proof's per-ID byte
check needs one line per ID) and a mapping that is not valid JSON or names another `lift` version, each named (T22 and
T25 gain the cases; one mutation pair each in the refusal row). T6 also tampers a duplicated row, a renumbered ID, a row
moved into a fence and a heading-ID collision. G5 (the tree lane's acceptance reads R-1162–R-1169 as unused) is outside
the suite and harmless. G6 (FEAT-028 and FEAT-032 assessments may read out of date in the product report) is a HANDOFF
line at land.
