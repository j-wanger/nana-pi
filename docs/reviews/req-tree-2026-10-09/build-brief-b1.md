# Lane req-tree — increment B: apply the placement review, shared requirements, statuses, lifecycle governance   (2026-10-10 · feat/req-tree)

## Contract
`docs/reviews/req-tree-2026-10-09/CHANGE-B.md` (read in full; where this brief and CHANGE-B differ,
CHANGE-B wins — report the difference). Frozen inputs at commit
**`9e415db252464d47515f83a7b793569163a79a22`** (call it INPUTS): `tree-b.json`, `fixed-text-b.md`,
`placement-review.md`/`.json`, `seat-verify-b.sh`, this brief. The original ledger stays the proof
base: **`6b9202a501a7fe03dfc834ab34cdfc212f6d92ce`** (BASE). Increment 1 is built and reviewed on this
branch; extend it, do not rewrite it.

## Goal (what is TRUE when done)
`REQUIREMENTS.md` is exactly what the extended `move.mjs` renders from BASE's ledger with
`tree-b.json` and `fixed-text-b.md` at INPUTS, except the Status and Evidence cells of R-287–R-294;
the extended `prove.mjs` exits 0; the tree checker enforces R-292–R-294 and the extended R-291; the
outline and section map are regenerated; the suite is green; `seat-verify-b.sh` prints every line as
wanted.

## Work
1. **Read before writing** (cite file:line in the report): `tree-b.json` (new keys: `moves`,
   per-feature `status` and `also_applies`, `intro_edits` replacing `intro_edit`, `new_rows` with
   R-291's new text and R-292–R-294; `see_also` is gone); `fixed-text-b.md`; the current
   `move.mjs`, `prove.mjs`, `scripts/requirements-tree.mjs` and its test; `seat-verify-b.sh` (it is
   your acceptance test — read what it expects).
2. **Layout** (CHANGE-B §4). Feature block: heading · `Purpose: …` · `Status: <tree-b status>` ·
   `Also applies: <ids joined by ", ">` (only when the feature has `also_applies`) · moved notes ·
   tables. No `See also:` lines. Capability and subgroup blocks unchanged. Moved rows are appended to
   their target table in ID order (already reflected in `tree-b.json` row lists — render the lists
   in order). Both `intro_edits` apply to BASE's intro, each exactly once.
3. **`move.mjs`**: render from BASE + INPUTS (read both with `git show`). R-287–R-294 rows: ID and
   Requirement from `new_rows`; you keep/write Status `implemented` and Evidence.
4. **`prove.mjs`**: new CLI `--approved <BASE> --inputs <INPUTS> <after> <section-map>`; drop
   `--amendment`. Reads BASE's `REQUIREMENTS.md` and `tree.json`, INPUTS' `tree-b.json` and
   `fixed-text-b.md`. Accounts for every physical line (Status and Also applies lines included, exact
   text). Validates R-287–R-294 rows (canonical four cells, `implemented`, evidence citing
   `packages/nana-pack/tests/requirements-tree.test.mjs::`) BEFORE any equality shortcut. NEW: checks
   `tree-b.json` against BASE's `tree.json`: labels, purposes, outcomes and heading order identical;
   each feature/subgroup row list differs from tree.json's by exactly the `moves` and the added
   R-292–R-294; every ID of a removed `see_also` is in that feature's `also_applies`. Each
   `intro_edits` `from` must occur exactly once in BASE's intro. Shares no code with `move.mjs`.
5. **`scripts/requirements-tree.mjs`**: parse `Status:` and `Also applies:` lines (every ATX/SETEXT
   heading still a boundary). Checks: R-292 (each Also-applies ID exists, listed once, not retired,
   homed in another feature — one problem message per clause); R-293 (feature has a `Status:` line
   before any table, matching `proposed | active | frozen (<non-blank reason>) | retired (<non-blank
   reason>)`); R-294 (a proposed or retired feature holds no rows). Outline: each feature shows its
   status and its also-applies list; the outline ENDS with a markdown table
   `| ID | Home | Also applies to | Count |` whose rows start `| <ID> |`, sorted by count descending
   then ID (R before G, by number). Extend the R-291 field check (independent of the renderer) to
   status, also-applies and the index.
6. **Test** (`packages/nana-pack/tests/requirements-tree.test.mjs`): pin R-291–R-294 on the real
   ledger and on fixtures; every CHANGE-B §5 mutation as a fixture or a code mutation. Real-ledger
   leaf total 1,012. `checkTree(real).problems` stays empty.
7. **Skill paragraph** in `packages/nana-pack/skills/requirements/SKILL.md`: extend the existing
   tree paragraph with the governance essentials (statuses; `Also applies:`; before changing a row,
   find it in the outline's shared index; a new row names its shares in its requirement diff; tree
   changes are Jake's and are declared). Keep it short; do not copy the whole governance text.
8. Regenerate: `node docs/reviews/req-tree-2026-10-09/move.mjs …` (as you designed it),
   `npm run req:tree`, the section map, `npm run map`.
9. Run: the proof (`--approved` BASE `--inputs` INPUTS) → save to `prove-output.txt`;
   `npm run map:check`; `npm run test:locked`; then `bash docs/reviews/req-tree-2026-10-09/seat-verify-b.sh`
   from the worktree root and paste its full output VERBATIM. Every line must read as wanted; if one
   does not, fix the code (never the script) and re-run.

## Rules
- Mutation breaks the code or a scratch copy, never an assertion. No test writes the repository.
- NOT: any pre-existing (main) row's cells; IDs other than R-292–R-294; R-291's text beyond
  `tree-b.json`; the trace rail; templates; `package.json`; any README; frozen inputs.
- Allowlist (exact): `REQUIREMENTS.md`, `scripts/requirements-tree.mjs`,
  `packages/nana-pack/tests/requirements-tree.test.mjs`, `docs/requirements-tree.md`,
  `docs/requirements-sections-2026-10-09.md`, `packages/nana-pack/skills/requirements/SKILL.md`,
  `docs/code-map.md`, and in the review folder `move.mjs`, `prove.mjs`, `prove-output.txt`.
- Appetite (advisory): ≤ 6 hand-written files, ≤ 600 lines, not counting regenerated files.
- Commit with explicit paths; message file under `$TMPDIR`.

## Report
≤ 40 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; files; rows flipped and the
clause each test pins; the proof command and summary line; the suite summary line; the VERBATIM
`seat-verify-b.sh` output; scope check (`git diff --stat 9e415db..HEAD`); the one claim most likely
wrong.
