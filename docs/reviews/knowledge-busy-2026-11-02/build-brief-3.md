Feature: FEAT-013 · Install and connect harness runtimes

Lane knowledge-busy. Class: hook. Builder: pi-worker (small lane). Build session 3. This build runs on the reference Windows 11 laptop; shell commands run in PowerShell or Git Bash, and Node is on PATH.

The plan of record is `docs/reviews/knowledge-busy-2026-11-02/plan.md` (revision 2). Build 2 is committed (1db2dd34): every seat pair is red. This session is three mechanical fixes. Change no product code and no test.

## Findings

1. **`npm run map:check` fails.** Brief 2 did not allow the generated map. Run `npm run map`, commit `docs/code-map.md` (and `code-map.config.json` only if the map requires it), and confirm `npm run map:check` exits 0.
2. **The session entry is in the wrong file (the seat, PR #319).** This repository keeps November entries in `docs/sessions/2026-10.md`, newest first, as every other lane this week did.
   - Move build 1's entry from `docs/sessions/2026-11.md` to the top of the entry list in `docs/sessions/2026-10.md`, keeping its words, and add one line for builds 2 and 3.
   - Delete `docs/sessions/2026-11.md`, unless a check requires it. If one does, keep the file and name the check.
   - Run `nana-writing` on the moved entry.
3. **Two seat pairs name the wrong expected titles.** P5 and P6 went red through build 2's new checks, while their named titles stayed green (`seat-mutate-win32.txt`). In `docs/reviews/knowledge-busy-2026-11-02/seat-mutate.mjs`:
   - add a regex for "M3: recovery refuses a late writer without a build busy wait and keeps the index" (R-3592), and make it P5's `expectRed`;
   - add a regex for "M1: sources-problem probe waits out a transient lock and keeps the index" (R-3590), and make it P6's `expectRed`;
   - update the `tip` line to your commit if the runner needs it.

   Re-run the pairs with `SEAT_MUTATE_SHARDS=2` and `SEAT_MUTATE_OUT=docs/reviews/knowledge-busy-2026-11-02/seat-mutate-win32.txt`. The result must read 8/8 red with every named title red.

## Constraints

- Edit only:
  - `docs/code-map.md` (and `code-map.config.json` only if the map requires it);
  - `docs/sessions/2026-10.md` and `docs/sessions/2026-11.md`;
  - `seat-mutate.mjs`, and the lane folder.
- No committed text names a person or a machine path.

## Done when

- These are green:
  - `npm run map:check`;
  - `npm run readme:check`;
  - `node scripts/requirements-trace.mjs`;
  - `node scripts/requirements-tree.mjs --check`;
  - `node scripts/known-bugs.mjs --root .`;
  - `node scripts/identity-scan.mjs --root .`.
- The seat pairs read 8/8 red, each with its named title red.
- Commit explicit paths on `feat/knowledge-busy`. Do not push.

Report the map result, the session-file outcome and the mutation result line.

## Precedent

- `docs/sessions/2026-10.md`: the newest-first November entries this entry joins.
- `docs/reviews/knowledge-busy-2026-11-02/seat-mutate.mjs`: the table being corrected.
