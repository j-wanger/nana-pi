Feature: FEAT-029 · Navigate code and investigate impact. Lane impact-artifacts. Class: ordinary. Builder: pi-worker (small lane). Build session 1.

Work in the lane worktree on feat/impact-artifacts. The spec is `docs/reviews/impact-artifacts-2026-10-24/must-meet.md`; read it whole. `design-report.md` and `plan-attack.md` beside it are its inputs; where they differ, the must-meet holds. Do not edit HANDOFF, the session archive, `docs/known-bugs/`, any file under `templates/`, `scripts/product-report.mjs`, or any file in a review folder.

Precedent:
- scripts/code-map.mjs — `runtimeBlock`, `resolveImpactPaths` and the `--impact` tail: the block's home, placement and note style.
- scripts/requirement-rows.mjs — the existing graph-to-ledger join and its uncertainty label.
- scripts/deliverables.mjs — `artifactRegistry` and `artifactReads`, imported, never copied, called as in scripts/requirements-moved.mjs with no tracked set.
- scripts/requirements-tree.mjs — `parseLedger` and `ledgerReadProblem`, the latter used as in scripts/product-report.mjs.
- scripts/product-report.mjs — the `no live entry` display, read only.
- packages/nana-pack/lib/runtime-map-config.mjs — `NOTE_PREFIX` and the config form for the new labels.
- packages/nana-pack/tests/runtime-map.test.mjs — `runCodeMap`, the R-1272 and R-1273 prefix checks, `relationRoot` and R-1278's copied-shim fixture.

No private helper moves to a shared module, unless you lift the `no live entry` text into scripts/deliverables.mjs as a constant; if you do, say so in your report.

The task:
1. Rows R-2820 to R-2823 under FEAT-029, worded as in the must-meet, `implemented` once their tests pass, and the seal test.
2. `artifactBlock(root, argv, { load })` in scripts/code-map.mjs as the must-meet's Seam decision says: a caught dynamic import with literal relative specifiers, one graph per run, the CLI tail awaiting it between the generator and the runtime block and keeping its synchronous `process.exit`.
3. The labels in packages/nana-pack/lib/runtime-map-config.mjs with provenance, its purpose sentence widened as the must-meet says.
4. R-1272's and R-1273's wording, and R-1272's test title, as the must-meet says; FEAT-029's `Reads: A-030` line gains scripts/code-map.mjs; README.md's code-map clause names the artifacts the impact command prints; the shim's header names the ledger; `npm run map` regenerated.

Try each must-meet row's red cases by hand, see the named check turn red, restore, and say so in your report; do not commit them.

Checks before your one commit: runtime-map.test.mjs alone; code-map.test.mjs alone; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run map:impact -- packages/nana-pack/lib/build-records.mjs`, and confirm the block lists A-006 with its readers and prints no `artifact note:` line; `npm run test:locked`, with its output kept out of the worktree; then `git status --short` must print nothing.

Seat check: `node docs/reviews/impact-artifacts-2026-10-24/seat-titles.mjs all` must print `0 missing`.

Done: the four rows, their tests and the seal exist and pass; the impact command prints the block between the generator output and the runtime block; an unusable ledger gives one note; the map, readme, trace and tree checks are green; the full suite is green; the seat check prints `0 missing`; `git status --short` is empty; and the work is committed.

Report (at most 10 lines after the VERDICT line): the commit sha; the rows; each red case's hand check; the block printed for packages/nana-pack/lib/build-records.mjs; the full suite's summary line; map, readme, trace, tree and seat-check status; any departure from the must-meet, with its reason.
