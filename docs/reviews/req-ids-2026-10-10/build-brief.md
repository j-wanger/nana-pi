# Lane req-ids — four-digit requirement IDs   (2026-10-10 · feat/req-ids in ~/nana-pi-wt/req-ids, stacked on feat/req-tree)

## Contract
`docs/reviews/req-ids-2026-10-10/CHANGE.md` — read it in full; it wins over this brief (report any
difference). Frozen, seat-owned, never edit: `CHANGE.md`, `fable-consult.md`, the `sol-plan-*`
files, `seat-verify-ids.mjs`, this brief. Feature: FEAT-028. Requirement delta: add R-1000 and
R-1001 (text final in CHANGE §2) at the end of FEAT-028's table, after R-294.

## Goal
Both trace rails (TypeScript and Python templates) accept three-digit and four-digit ASCII IDs
(four digits never starting with zero) in rows and markers, and fail — naming `<file>:<line>` — any
column-zero line matching `^\|\s*[RG]-\S` that is not a requirement row, reading each ledger file
raw before the Part G merge. nana-pi's tree checker uses the rail's exported `ID`. Every test that
carries its own three-digit pattern is widened. The ledger, the template ledgers, the README and
four skills describe the new grammar. Suite and template acceptance green.

## Work, in this order
1. Read first, cite file:line in the report: the TS rail (`ID`/`ROW` ~:45–46, `loadRequirements`
   ~:184, the marker parser and its error ~:269, `check` ~:466 and the Part G merge), the Python
   conftest (`ID_RE` :54, `load_requirements` :129, `_row_cells` :346, `check` :361 and its merge
   :373–397), both template self-tests, `scripts/requirements-trace.mjs`, `scripts/requirements-tree.mjs`
   (`ROW` :18, :52, :129, :197, :280, both compressors), and the tests listed in CHANGE §3.
2. Requirement rows first: add R-1000 and R-1001 to FEAT-028 as `untested` with `—`; then the
   tests (TS fixtures in `packages/nana-pack/tests/requirements-trace.test.mjs` through the shim,
   Python through `uvx pytest` against the template conftest, skip-gated when `uvx` is absent, as
   `templates-update.test.mjs` does; plus the template self-tests); see them fail on today's code;
   then the code; then flip both rows to `implemented` citing the tests that pin each clause.
3. The rails: grammar `^[RG]-(?:[0-9]{3}|[1-9][0-9]{3})$` (ASCII in both languages; Python must not
   use `\d`); a requirement row = column zero, opening and closing pipe, exactly four cells, valid
   ID; the raw-file near-miss reader for `REQUIREMENTS.md` and `REQUIREMENTS-general.md`; the
   error text names the format ("R-NNN or R-NNNN, four digits never starting with 0"). Markers
   refuse leading-zero, five-digit and non-ASCII-digit IDs in both languages. Export `ID` from the
   TS rail; re-export it from `scripts/requirements-trace.mjs`.
4. `scripts/requirements-tree.mjs`: build its row-PREFIX pattern from `ID` (it stays a prefix match
   used to spot row-shaped lines); the `Also applies:` share validator (:197) uses `ID` too; the
   range parser and both compressors accept four digits, including a range crossing R-999 to R-1000.
   Widen `requirements-tree.test.mjs:72,75` and add a fixture where another feature lists
   `Also applies: R-1000`.
5. Widen `templates-render.test.mjs` (:167, :188, :196, :611, :612, :614) and
   `templates-update.test.mjs` (:108, :109) to the new grammar (import `ID` or use the same ASCII
   pattern). Do not touch `requirement-rows.test.mjs`.
6. Text: the two template ledgers' ID line (incl. the reserved-prefix note: indent an example
   that would start `| R-` or `| G-`); `REQUIREMENTS.md` intro ID paragraph and open question
   9 exactly as CHANGE §4 says; "R-nnn" grammar wording in `README.md:49` and the four skills
   (examples like `R-001` stay).
7. `npm run req:tree`, `npm run map`, `npm run map:check`, `npm run test:locked`; commit; then
   `npm run template:accept`; then `node docs/reviews/req-ids-2026-10-10/seat-verify-ids.mjs` from
   the worktree root — paste its FULL output VERBATIM. It must exit 0 with `0 mismatch(es)`; a
   skipped Python run counts as a mismatch. Fix the code, never the script.

## Rules
- Mutation pairs as CHANGE §5 lists: break the code or a scratch copy, never an assertion; record
  red and green for each.
- No test writes the repository; fixtures in the OS temp dir.
- NOT and allowlist exactly as CHANGE §3. Do not touch `HANDOFF.md`, session archives, frozen files,
  the historical lane tools under `docs/reviews/`, or other repos.
- Commit with explicit paths, message file under `$TMPDIR`. Template change: commit BEFORE
  `template:accept`.

## Report
≤ 40 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; files; rows flipped and the
clause each test pins; mutation pairs red/green; `test:locked` and `template:accept` summary lines;
the VERBATIM `seat-verify-ids.mjs` output; scope check (`git diff --stat HEAD-at-launch..HEAD`); the one
claim most likely wrong.
