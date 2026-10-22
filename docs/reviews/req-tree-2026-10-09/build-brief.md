# Lane req-tree — move every REQUIREMENTS.md row under its capability and feature   (2026-10-09 · nana-pi · feat/req-tree in ~/nana-pi-wt/req-tree)

## Contract
The contract is `docs/reviews/req-tree-2026-10-09/CHANGE.md`, agreed by the owner at checkpoint 1. Read
it in full first, then `tree.json`, `fixed-text.md` and `outline.md` beside it. Where this brief
and CHANGE.md differ, CHANGE.md wins; report the difference.

**Approved commit: `6b9202a501a7fe03dfc834ab34cdfc212f6d92ce`.** The base ledger, `tree.json` and
`fixed-text.md` are read from it with `git show 6b9202a501a7fe03dfc834ab34cdfc212f6d92ce:<path>`.

## Goal
What is TRUE when the lane is done (CHANGE §1 outcome 1–4):
- `REQUIREMENTS.md` has the CHANGE §4 layout: the base intro (one declared phrase edit), the
  `fixed-text.md` block, then every capability, feature and subgroup of `tree.json` in order with
  heading, `Purpose:` (and `Outcome:` for a capability), `See also:` and moved notes where
  declared, and its rows byte-identical to the base; R-287–R-291 end FEAT-028; then the tail.
- `prove.mjs --approved 6b9202a501a7fe03dfc834ab34cdfc212f6d92ce` exits 0 on the result.
- `scripts/requirements-tree.mjs` checks R-287–R-290 and renders `docs/requirements-tree.md`;
  `packages/nana-pack/tests/requirements-tree.test.mjs` pins R-287–R-291; the suite is green.

## Appetite
Advisory: hand-written changes ≤ 8 files and ≤ 700 lines, not counting the moved ledger, the
generated outline, the regenerated map and the proof output. On crossing it, write a one-paragraph
CHECKPOINT into your report naming what remains and what it would cost, and continue only if the
remainder is mechanical. Never expand the scope to fit.

## Work, in this order
1. **Read the tools you depend on before writing code** (cite file:line in your report):
   the rail's row and ID regexes and how it reads cells
   (`templates/typescript/template/tests/requirements-trace.ts`, shim `scripts/requirements-trace.mjs`);
   the README check's documented-script rule (`templates/typescript/template/scripts/readme-check.mjs`
   `documentedProblems`, config `readme-check.config.json`); the code map's roots and header rule
   (`code-map.config.json`, `scripts/code-map.mjs`); a script module in house style
   (`scripts/requirement-rows.mjs`: six-tag header, named exports, `REPO_ROOT`); a test module in
   house style (`packages/nana-pack/tests/requirements-trace.test.mjs`: header, `check(name, ok, why)`,
   `// req: R-nnn` directly above each `check(` call, fixtures under the OS temp dir via `tmp-dir.mjs`).
2. **`docs/reviews/req-tree-2026-10-09/move.mjs`** (one-off, outside the map): reads the base ledger
   at the approved commit, `tree.json` and `fixed-text.md`; writes the new `REQUIREMENTS.md` in the
   canonical layout (CHANGE §4 "prove.mjs" paragraph defines it, blank lines included). New rows
   R-287–R-291: ID and Requirement cell exactly from `tree.json` → `new_rows`; you write Status and
   Evidence. Exit non-zero if any base row is not placed exactly once. Also writes
   `docs/requirements-sections-2026-10-09.md`: a short header paragraph, then one table row per
   `old_sections` entry (old heading, package, new homes with row counts, and whether a note moved
   and where), then the §10 note verbatim under a line naming its old heading.
3. **`docs/reviews/req-tree-2026-10-09/prove.mjs`** (one-off): exactly CHANGE §4. Write it from the
   contract, not by calling `move.mjs` — the two must not share code. It accounts for every
   physical line and checks the section map. Save its output as `prove-output.txt`.
4. **`scripts/requirements-tree.mjs`** (mapped module): named exports for parsing the ledger's
   headings and tables, the four checks (R-287 row under FEAT/SUB; R-288 non-empty `Purpose:` line
   before any table or heading; R-289 unique CAP/FEAT/SUB IDs; R-290 FEAT under CAP, SUB under FEAT),
   and rendering the outline. CLI: `--write` writes `docs/requirements-tree.md`; `--check` exits 1
   when the committed file differs or a structure check fails, naming the line. The outline lists,
   for every capability, feature and subgroup heading: ID, label, purpose, parent, row count, and
   row IDs compressed to ranges (e.g. `R-001–R-023, R-130`). No statuses. Nesting shown by heading
   level. It is read by people: keep it plain and short (about 200 lines).
5. **`packages/nana-pack/tests/requirements-tree.test.mjs`**: pins R-287–R-291 on the real ledger
   and, with negative fixtures, proves each check fails when its rule is broken. R-291: the committed
   outline equals a fresh render, and on fixtures a render missing or altering each field (ID, label,
   purpose, parent, row count, row IDs) fails the field check.
6. `package.json`: `"req:tree": "node scripts/requirements-tree.mjs --write"`. Root `README.md`: one
   sentence beside the `req:rows` sentence naming `npm run req:tree` and
   `scripts/requirements-tree.mjs`. `packages/nana-pack/skills/requirements/SKILL.md`: the one
   paragraph CHANGE §3 describes.
7. Flip R-287–R-291 to `implemented` only with a cited, marked test that pins the row's clause.
8. `npm run req:tree`, `npm run map`, then the doneWhen.

## doneWhen (run from ~/nana-pi-wt/req-tree; read every exit code standalone, no pipes before && or a commit)
1. `node docs/reviews/req-tree-2026-10-09/prove.mjs --approved 6b9202a501a7fe03dfc834ab34cdfc212f6d92ce REQUIREMENTS.md docs/requirements-sections-2026-10-09.md` → exit 0 (adjust the argument order only if CHANGE §4's signature says otherwise, and report it).
2. `npm run map:check` → exit 0.
3. `npm run test:locked` → exit 0 (the machine-wide lock may make you wait; that is expected).
4. The CHANGE §5 mutation pairs, each red then green again, recorded in the report. Mutation
   breaks the CODE or the ledger fixture, never inverts an assertion.

## NOT (touching one is a scope defect)
- Any pre-existing row's Requirement, Status or Evidence cell. Any new ID other than R-287–R-291.
- The frozen inputs: `CHANGE.md`, `tree.json`, `fixed-text.md`, `mapping-astra.json`, `outline.md`,
  this brief. If one looks wrong, stop and report; do not fix it.
- The 15 confirmed issues, the ID format, the trace rail (`templates/*/tests/requirements-trace.*`,
  `scripts/requirements-trace.mjs`), any template or copier file, splitting the ledger, new columns.
- `AGENTS.md`, `CLAUDE.md`, `HANDOFF.md`, session archives, any README other than the one root
  sentence, the lane brief template.

## Allowlist
`REQUIREMENTS.md` · `scripts/requirements-tree.mjs` (new) · `package.json` (the one script entry) ·
`docs/requirements-tree.md` (new, generated) · `packages/nana-pack/tests/requirements-tree.test.mjs`
(new) · `packages/nana-pack/skills/requirements/SKILL.md` (one paragraph) ·
`docs/requirements-sections-2026-10-09.md` (new) · `docs/code-map.md` (regenerated) · `README.md`
(one sentence) · new files in `docs/reviews/req-tree-2026-10-09/`: `move.mjs`, `prove.mjs`,
`prove-output.txt`, `builder-report.md` (optional copy of your report).

## Constraints
- The rail reads any line shaped `| R-nnn | … |` anywhere in the file as a row; no new table may
  carry R- or G- IDs in its first column.
- `node_modules` in this worktree is a symlink to the main checkout's; never install anything.
- Commit on `feat/req-tree` with explicit paths; message file under `$TMPDIR`.
- macOS host; the scripts must also run on Linux CI (no platform-specific shell in the new script).

## Roles
builder: pi gpt-6-luna (you) · slice review: sol, item `req-tree` (scope + adversarial: try to lose
or alter a byte, try to break a structure rule unseen) · land: astra on the same revision.

## Report
≤ 40 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`. Then: commits; files; rows flipped and
the clause each cited test pins; every mutation pair with its red and green; the doneWhen commands
with exit codes; the suite summary line; the prove summary line; residuals; the scope check ("I
touched nothing outside the allowlist", `git diff --stat 6b9202a..HEAD`); the one claim most likely
wrong.
