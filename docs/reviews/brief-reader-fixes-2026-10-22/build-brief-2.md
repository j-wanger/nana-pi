Feature: FEAT-006 · Launch builders with execution limits. Lane brief-reader-fixes, row R-2580. Class: ordinary. Builder: pi-worker (small). Build session 2: one test fix the final review found.

Work in the lane worktree on feat/brief-reader-fixes. Build 1 is a4e0c45f. Do not edit HANDOFF, the session archive or the known-bug files.

Precedent:
- packages/nana-pack/tests/worker-lane.test.mjs — main's copy at 61ac64f3 (`git show 61ac64f3:packages/nana-pack/tests/worker-lane.test.mjs`): the generated fake-pi bodies and R-2580's backslash case, spelled with `\\n` inside the template literals.
- docs/reviews/brief-reader-fixes-2026-10-22/review-brief.md — the round the finding came from.

F1 (must fix). Build 1 turned six `\\n` escapes into `\n` inside template literals in `packages/nana-pack/tests/worker-lane.test.mjs`. The generated scripts then hold raw line breaks inside quoted strings: `mainPosixScript` and `mainNodeBody` (about :52-60), the `laneSpawnCount` stub (about :598) and the `descendantPid` stub (about :645). On Windows the node fake pi no longer parses, so every spawn check there fails. R-2580's "backslash separators" case (about :188) became `tracked\nested.mjs`, a line break, so it no longer tests a backslash.

1. Restore those six spellings exactly as main has them. Change nothing else; keep every line build 1 added.
2. Check: `git diff 61ac64f3 -- packages/nana-pack/tests/worker-lane.test.mjs` shows no removed line except the ones build 1 changed for this lane's own rows and the seal literal. Build `mainNodeBody(true)` the way the test does and run `node --check` on it; it must parse.
3. Run `node packages/nana-pack/tests/worker-lane.test.mjs`, then `npm run test:locked` before your commit. Try this wrong version, see R-2580 go red, then restore: in `packages/nana-pack/lib/brief-precedent.mjs`, drop `.replaceAll("\\", "/")` from the line that strips the line suffix.

Seat check: `node docs/reviews/brief-reader-fixes-2026-10-22/seat-titles.mjs all` must print `0 missing`.

Done:
- The six spellings match main; the generated node body parses; R-2580's backslash case holds a backslash again; the test file and the full suite are green; the work is committed.

Report (at most 8 lines after the VERDICT line): the commit sha; the change; each departure from the Precedent files with its reason; the node --check result; the wrong version tried and its result; the full suite's summary line; the seat-check status.
