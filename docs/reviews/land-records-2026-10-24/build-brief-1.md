Feature: FEAT-008 · Integrate and clean up reviewed changes. Lane land-records. Class: land tool. Builder: pi-worker (larger lane). Build session 1.

Work in the lane worktree on feat/land-records. The spec is `docs/reviews/land-records-2026-10-24/must-meet.md`; read it whole. `plan-draft.md` and `plan-attack.md` beside it are its inputs; where they differ, the must-meet holds. In particular the must-meet cuts the draft's `pid`, `main`, `tree`, `items`, end `tip` and `ciRuns` fields: do not record them. Do not edit HANDOFF, the session archive, `docs/known-bugs/`, or any file in a review folder. Do not change any page code in `scripts/product-report.mjs`.

Precedent:
- packages/nana-pack/lib/build-records.mjs — the store, append, bounded read, pairing, `no end`, lane and total lines; the helpers that move to `packages/nana-pack/lib/record-ledger.mjs` are named in the must-meet's seat decisions.
- packages/nana-pack/lib/build-records-config.mjs — the config module form and provenance comments.
- packages/nana-pack/bin/pi-worker.mjs — `buildEndLine`: the end line after the record, the lane line from the shared renderer, `lane line unavailable:` on a read failure.
- packages/nana-pack/lib/land-ci-records.mjs — never change the land's verdict; an injected keeper and clock; one note on failure (with `nana-land.mjs` lines 208 to 222).
- packages/nana-pack/lib/land-ci.mjs — `judgeRuns`; its ok result gains the judged runs.
- packages/nana-pack/bin/build-report.mjs — the report command and its `repoKeyOf` lookup.
- packages/nana-pack/tests/land-fixtures.mjs, land-ci-records.test.mjs, land.test.mjs, build-records.test.mjs and build-report.test.mjs — fixtures, spies, the separate-clone case, `nana` as a file, and the worktree-and-main comparison.

The one private-helper move is the record-ledger move the must-meet names; build-records.mjs imports the moved helpers back and keeps its exported names, messages and error codes.

The task:
1. Rows R-2810 to R-2816 under FEAT-008, worded as in the must-meet, `implemented` once their tests pass, and the seal test.
2. `packages/nana-pack/lib/land-records-config.mjs`, `packages/nana-pack/lib/land-records.mjs` and `packages/nana-pack/lib/record-ledger.mjs`, each with the six-tag header.
3. nana-land: the start record, the end record on every ended attempt, the last `[nana-land] land record:` line, all inside guards that never change the exit code, the merge or any earlier line. The lane-name pattern becomes one constant in nana-land.mjs.
4. build-report: the land attempt, land lane and land total lines, and the over-cap line with exit 0.
5. The registry entry A-082 in FEAT-008's span, CAP-02's R-2811 deliverable with its `Made by:` and `Read by:` lines, the regenerated `docs/requirements-tree.md` and code map, and the two README sentences the must-meet names.

Try each must-meet row's red cases by hand, see the named check turn red, restore, and say so in your report; do not commit them.

Checks before your one commit: land-records.test.mjs, land.test.mjs, land-ci-records.test.mjs, path-spelling.test.mjs, build-records.test.mjs and build-report.test.mjs, each alone; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`, whose count line must read 20 of 23; `npm run test:locked`.

Seat check: `node docs/reviews/land-records-2026-10-24/seat-titles.mjs all` must print `0 missing`.

Done: the seven rows, their tests and the seal exist and pass; every land attempt that finds main's clone writes a start and an end record and ends with one record line; the build report prints the land lines; the registry and deliverable lines pass the tree check; no page code changed; the full suite is green; the seat check prints `0 missing`; and the work is committed.

Report (at most 10 lines after the VERDICT line): the commit sha; the rows; each red case's hand check; the record line a landed attempt prints in the R-2814 test; the tree check's count line; the full suite's summary line; map, readme, trace, tree and seat-check status; any departure from the must-meet, with its reason.
