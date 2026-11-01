VERDICT: DONE

# Making trigger — build 3 technical record

## Commits and scope

- `4570afe8`: merge `origin/main` at `b10761b1`, preserving both memory lanes. The merge follows a green focused run: six files, 192 checks, exit 0; map and README checks also exited 0.
- The following evidence-only commit retains the post-merge mutation, locked suite, install rehearsal and checks. Its hash and the finished hosted run are reported in the final worker response.
- Feature: FEAT-040; subgroup SUB-024; artifact A-093. R-3290 through R-3309 are unchanged. Only this lane's unlanded R-3310/R-3311/R-3312 became R-3340/R-3341/R-3342. R-3337 through R-3339 remain unused. Main's FEAT-043, R-3310 through R-3336 and A-095 remain unchanged.

## Files and behavior

- `REQUIREMENTS.md`: keep both sections; renumber only the three maker seals and their evidence titles.
- `packages/nana-pack/lib/memory-making.mjs`: retain exported `sourceFiles` and `unitsIn`, post-start filtering, and main's optional entry observer in `unitsIn` and `transcriptUnits`.
- `scripts/memory-shape-runners.mjs`: accept main's runner options and pi refusal unchanged; no alternate runner or copied helper.
- `packages/nana-pack/lib/memory-run-config.mjs`, `lib/land-config.mjs`: update seal provenance references only.
- `packages/nana-pack/README.md`: one sentence states that a land makes its own lane and remembered earlier lands, while only no-lane commands sweep all landed review folders.
- `docs/code-map.md` and `docs/requirements-tree.md`: regenerate from the merged sources and ledger.
- Lane `build-notes.md`, `wrong-first.txt` and `tree-movement.md`: update maker IDs. The wrong-first transcript retains its original failures with the current IDs. The seat's brief files retain their instructions and historical collision descriptions unchanged.
- Main's `HANDOFF.md`, session archive and known-bug file changes enter only through the merge, byte-identical to main. No builder edit touched them.

## Existing tests edited

- `packages/nana-pack/tests/memory-run-seals.test.mjs`: change only three markers and their title IDs to R-3340/R-3341/R-3342; assertions are unchanged.
- `packages/nana-pack/tests/requirements-tree.test.mjs`: update the two real-ledger heading counts, R-288 and R-1158, from 73 to 74. Both lanes each added one heading above their common base.
- No new tests, no weakened assertion and no deleted test. No new tunable.
- Must-meet 2 (R-3291) remains unchanged and green: a capped `deferred-a` land is remembered, and a `later-b` land makes both review titles in later-first order. Must-meet 4 still excludes a different, unremembered lane.

## Wrong-code proof

Command: `SEAT_MUTATE_OUT=docs/reviews/making-trigger-2026-11-01/build3-mutation-result.txt node docs/reviews/making-trigger-2026-11-01/seat-mutate.mjs`, exit 0, against merge tip `4570afe899f3db1f12fb1769447c33319f495748`.

- 8-isolation: rethrow starter failure → R-3297 red.
- 8-placement: start before merge → R-3297 red.
- 2-split: mark failed calls done → R-3291 red, with declared R-3295 red.
- 3-unknown: charge zero for unknown usage → R-3292 red.
- 4-start: bypass the start filter → R-3293 red.

`RESULT: 5/5 red (5 exactly their named titles, 0 with a named title green, 0 with an unnamed red), 0 survived, across 5 shards`

Every shard first passed its eight-case baseline. The runner mutates code in scratch worktrees, not assertions. The canonical suite never imports or executes the lane script. No additional wrong-code campaign was needed for ID-only changes; build 1's wrong-first evidence already pins the unchanged must-meets and seals.

## Commands and exit codes

- `npm test -- memory-run memory-making memory-shaping outcome-meter requirements-tree`: 0; six files, 192 checks.
- `npm run test:locked` in the foreground: 0; one machine lock, no concurrent full suite.
- `npm run map`, `npm run req:tree`: each 0; map has 551 modules, no header or layer problems. The initial pre-merge-commit tree write could not yet resolve main's new tracked paths at HEAD; the post-merge tree check has no such notes.
- `npm run map:check`: 0.
- `npm run readme:check`: 0; 999 claims, zero problems.
- `node --experimental-strip-types scripts/requirements-trace.mjs`: 0; 2341 rows, 2087 implemented and traced, zero EARS problems.
- `node scripts/requirements-tree.mjs --root .`: 0; zero problems, 42 features; deliverables 21 of 21 made and read by code, 21 more parked.
- `node scripts/known-bugs.mjs --root .`: 0; names=0, sizes=0.
- `npm test -- requirements-deliverables`: 0; 21 checks.
- `node scripts/requirements-moved.mjs --root . --base origin/main`: 0; 23 new rows in FEAT-040 and A-093 only. See `build3-tree-movement.md`.
- `node scripts/lane-class.mjs --root . --base origin/main`: 0; `gate: packages/nana-pack/bin/nana-land.mjs — land tool`.
- `node packages/nana-setup/bin/install-check.mjs`: 1; only `FAIL pi post-edit — write-error: write tool result is marked as an error`, the brief's allowed builder-environment failure. Every other rehearsal check passed. Builder-home prefixes in retained output are redacted.
- Identity scan and all required seat checks are repeated on the final commit before the worker report. Their final exits and finished CI result are reported there rather than making a self-referential evidence commit.

Suite summary: `250 files: 248 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8890 pass, 0 fail, 44 skip · 662.1s`.

## Precedent and known bugs

No new departure from the build 3 precedents: reuse the shared unit walk and runner, keep both lanes' contracts, and regenerate the existing map and tree. The brief explicitly authorizes the three unlanded ID changes. The build 1 departures remain documented in `build-notes.md`; the seat has now accepted the remembered-lands design.

No known bug is fixed or newly touched by build 3 beyond carrying the already documented build 1 behavior and main's accepted outcome-meter work. No real transcript, real profile clone, owner quote, production opt-in, real making run or model classification call was used.

## Not done

- No SessionEnd hook, setup wiring, doctor work, or independent review session; these remain outside this brief.
- No GitHub issue was created, edited, commented on or closed.
- The known local install-check environment failure remains unchanged.
- The two pre-existing untracked seat briefs remain unmodified and uncommitted.
- No open design question remains from the remembered-lands ruling. Push and finished hosted CI, including Windows, are reported in the final worker response.
