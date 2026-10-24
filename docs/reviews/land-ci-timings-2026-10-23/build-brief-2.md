Feature: FEAT-008 · Integrate and clean up reviewed changes. Lane land-ci-timings. Class: land tool. Builder: pi-worker (small lane). Build session 2: four findings on build 1 (14c4c849).

Work in the lane worktree on feat/land-ci-timings. The spec is still `docs/reviews/land-ci-timings-2026-10-23/must-meet.md`. The seat's pairs (`seat-mutate-output-14c4c849.txt`) and the independent check (`independent-check-14c4c849.md`) are in this review folder; read the survivors and NOTE 1 and NOTE 7 there. Do not edit HANDOFF, the session archive, `docs/known-bugs/`, or any file in this review folder.

Precedent:
- packages/nana-pack/lib/land-ci-records.mjs — `keepLandCiRecords` and its budget gate, which F1 tests directly and F4 changes.
- packages/nana-pack/bin/nana-land.mjs — `ghDefault`'s per-call guard (F2) and the guarded `keepCiRecords` call (F3).
- packages/nana-pack/tests/land-ci-records.test.mjs — the R-2752 direct case, the R-2756 cases and the default-runner case, which F1, F2 and F4 extend.

Findings:
- F1 (pair 25b survived). Must-meet S4 says the lib's prune is tested directly with a small keep; R-2752's direct case calls the shared writer instead, so a `keepLandCiRecords` that drops or overrides `keep` passes. Add to the R-2752 check, title unchanged, a case that calls `keepLandCiRecords({ ..., keep: 2 })` over three artifacts with distinct times and asserts the two newest remain.
- F2 (pair S1 survived). Must-meet S1 says the default gh runner never treats a bad per-call limit as "no limit". The default-runner case sends only a fractional limit, which spawnSync rejects by itself, so removing the guard survives. Add `timeoutMs: 0` to that case, expecting the `ERR_OUT_OF_RANGE` error result and no gh started.
- F3 (independent check NOTE 1). nana-land checks only that the keeper's `lines` and `notes` are arrays, then joins them outside the guard, so a non-string entry throws into the `refused:` catch after the merge. Convert both lists to strings inside the try (must-meet S5: the formatting of the result is guarded too), and add one R-2755 case, title unchanged, whose injected keeper returns a list holding a non-string entry: exit 0 and exactly one `CI records` note.
- F4 (independent check NOTE 7). R-2756 says each call's limit is at most the budget's remainder, but `Math.ceil(remaining)` can exceed it by under 1 ms. Since a call starts only when at least 1 ms remains, use `Math.floor(remaining)` (still a whole number of at least 1), and make R-2756's fractional case assert every limit is at most the remainder at its call.

Checks before your one commit: land-ci-records, land and ci-records test files each alone with `CLAUDE_CONFIG_DIR` unset and a scratch TMPDIR; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked`. Confirm by hand that removing `keep` forwarding in the lib turns R-2752 red, that removing ghDefault's guard turns R-2756 red, and that moving the string conversion outside the try turns R-2755 red; say so in the report (do not commit those changes).

Seat check: `node docs/reviews/land-ci-timings-2026-10-23/seat-titles.mjs all` must print `0 missing`.

Done: F1 to F4 are in, the three hand checks are red as stated, the full suite is green, the seat check prints `0 missing`, and the work is committed.

Report (at most 8 lines after the VERDICT line): the commit sha; F1 to F4 done; the hand checks; the full suite's summary line; map, readme, trace, tree and seat-check status.
