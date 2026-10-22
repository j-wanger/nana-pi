Feature: FEAT-006 · Launch builders with execution limits. Lane precedent-first, row R-2579. Class: ordinary. Builder: pi-worker (small). Build session 3: one test fix the seat's wrong-code pairs found.

Work in the lane worktree on feat/precedent-first. Builds 1 and 2 are f3c4a763 and 14d8c810. Do not edit HANDOFF, the session archive or the known-bug files.

Precedent:
- packages/nana-pack/tests/worker-lane.test.mjs — R-2579's check (about :144-168), whose `goodNotNamed` line already matches an entry in its quoted form.
- docs/reviews/precedent-first-2026-10-22/seat-mutate-output-14d8c810.txt — the seat's run: 18 of 19 red; p16 survived.

F1 (must fix). The seat's pair p16 (a folder match with no `/` boundary, so the partial name `tracke` passes because `tracked/nested.mjs` starts with it) left every check green. R-2579's `namedAll` tests `result.stderr.includes(entry)` with the bare entry, and `tracke` is a substring of the refusal's own words "is not tracked". The partial-folder case, which the must-meet's threat model lists, is therefore not pinned.

1. Make `namedAll` match each bad entry in the quoted form the refusal prints (`JSON.stringify(entry)` followed by ` is not tracked`), as `goodNotNamed` already does. Change nothing else.
2. Run `node packages/nana-pack/tests/worker-lane.test.mjs`, then `npm run test:locked` before your commit. Try this wrong version, see R-2579 go red, then restore: in `packages/nana-pack/lib/brief-precedent.mjs`, `candidate.startsWith(folder)` in place of ``candidate.startsWith(`${folder}/`)``.

Seat check: `node docs/reviews/precedent-first-2026-10-22/seat-titles.mjs all` must print `0 missing`.

Done:
- R-2579 fails when a partial folder name passes; the test file and the full suite are green; the work is committed.

Report (at most 8 lines after the VERDICT line): the commit sha; the change; each departure from the Precedent files with its reason; the wrong version tried and its result; the full suite's summary line; the seat-check status.
