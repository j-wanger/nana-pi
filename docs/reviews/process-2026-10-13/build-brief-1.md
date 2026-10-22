# Lane process — build brief 1 (2026-10-13 · feat/process · worktree ~/nana-pi-wt/process)

**Builder: Claude Sonnet 5.5** (Owner's 2026-10-13 split: this lane changes what every reviewer is told). The
contract is `CHANGE.md` in this folder — sol plan r1 LAND 98/100 (`sol-plan-r1.md`). Build ALL of it. Threat model:
honest variation in our tools' output in scope; deliberate forgery out. New IDs: R-1100–R-1111 only.

## What to build (CHANGE §2–§4)
1. **Rows** R-1100–R-1111 exactly as §2, one `shall` each; `npm run req:tree`; the tree total 1,088 → 1,100.
2. **The texts, byte for byte:** `packages/nana-pack/prompts/review-standard.md` = `review-standard.proposed.md`;
   the builder preamble = `builder-preamble.proposed.md`; the shared working-pattern bullets =
   `shared-text.proposed.md`, inserted where §3 says, then the same bytes in `AGENTS.md`'s shared region (by hand;
   `CLAUDE.md` stays a symlink). The install-check step (R-1109) goes in `AGENTS.md` OUTSIDE the shared markers.
3. **pi-review** appends the standard's TEXT once, after the immutable-checkout sentence, and refuses before
   admission (exit 1, no reservation, no pi child) when the file is missing, a directory or blank (§3).
4. **Fresh-machine step 8** in `README.md` as §3 says (trust the clone, then doctor).
5. **Tests** with the exact titles `seat-titles.mjs 1` lists (26: 25 new, 1 renamed), each with its `// req:` line.
6. Adopted plan SHOULD (sol plan r1): the ordering mutation must not expect R-974's test to go red; R-974 pins
   the immutable path's presence, not its position — R-1105's title pins the order. Do not widen R-974's test.

## Rules
- Wrong code first for every new case; a mutation breaks code, never an assertion.
- No suite test runs, imports or copies a seat script (`acceptance.mjs`, `seat-titles.mjs` here).
- No test deletion; the renamed tree-test title is the only rename.
- Do not touch `scripts/test.mjs` (lane `test-jobs` owns it), `.github/`, the desk, or anything §4 does not name.
  Do not edit `CHANGE.md`, the seat scripts, the `*.proposed.md` files, `HANDOFF.md` or `docs/sessions/`.
- Commit with explicit paths; message file under `$TMPDIR`; end each message with
  `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## Done — do not report DONE until all of these pass on your last commit
`node docs/reviews/process-2026-10-13/seat-titles.mjs 1` → `0 missing`;
`node docs/reviews/process-2026-10-13/acceptance.mjs > docs/reviews/process-2026-10-13/acceptance-output.txt 2>&1`
→ exit 0, `process acceptance: 0 mismatch(es)` (13/51 at launch — `acceptance-launch.txt`);
`npm run test:locked` (0 failed); `npm run map:check`; `npm run readme:check`;
`node scripts/requirements-tree.mjs --check`; `npm run template:accept`; and, because this lane edits nana-setup
tests, the local install check `node packages/nana-setup/bin/install-check.mjs` (every line PASS). Commit the
outputs. Push the branch and open a DRAFT pull request "process (draft, for CI)" (pre-approved); when its CI run
completes, read it and REPORT (do not wait for another notification): the macOS suite and both install-check jobs.

## Report
≤ 30 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each row and the title that pins it; the
`test:locked` summary line; the last line of each seat output; the CI run ID with the macOS suite and install-check
results; the one claim most likely wrong.
