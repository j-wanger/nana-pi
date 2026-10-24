Feature: FEAT-028 · Maintain requirement identity and trace links. Lane park-honestly, row R-2730. Class: ordinary. Builder: pi-worker (small lane). Build session 1 of 1: the suite check that this repository's ledger draws no deliverable note, ten park lines, two CI maker lines and one reader fix.

Work in the lane worktree on feat/park-honestly. The plan of record is `docs/reviews/park-honestly-2026-10-23/must-meet.md`: read it whole first. It holds over `plan-draft.md` where they differ: R-2731 and R-2732 drop, R-301 and R-1150 get CI maker lines instead of park lines, and the park reasons are the must-meet's exact texts. Read `plan-attack.md` for the findings it adopts and the draft for its measurements. Do not edit HANDOFF, the session archive, `docs/known-bugs/`, or any file in this review folder.

Precedent:
- packages/nana-pack/tests/requirements-deliverables.test.mjs — R-2539's repository block (`repositoryLedger`, `repositoryParsed`, `repositoryFields`); R-2730's check goes directly after it and reuses those names. R-2641's case shows how a test injects a git runner into `deliverableReportLines`.
- packages/nana-pack/tests/writing-check.test.mjs — R-2503's control-plus-repository shape: a fixture that must fail, then the repository that must pass.
- scripts/deliverables.mjs — `deliverableReportLines` and its injectable git runner; unchanged by this lane.
- REQUIREMENTS.md — the existing `Parked:` lines (the park-deliverables lane's eight) and the CI maker lines of R-341 and R-596, whose form the new lines copy.
- docs/reviews/park-deliverables-2026-10-22/ — the same lane shape: ordinary, small builder, park lines after each row's last `Read by:` line.

No helper moves between modules.

Steps, in order:
1. REQUIREMENTS.md: R-2730 in FEAT-028 directly after R-2643, `untested`. Then the must-meet's ledger lines, each at the place it names, with the exact texts it gives (four separate bench park lines for R-509, R-532, R-507 and R-535), and the R-1272 reader change.
2. The test: R-2730's check with its `// req: R-2730` marker directly above and the must-meet's exact title, as "What the test does" says. The runner it injects lists `git ls-files -z --cached --others --exclude-standard` from the repository root and ignores the arguments it is passed. The assertion names no count and no row. The control is a fixture ledger, never a rewrite of a real line. Before the ledger lines land, confirm by hand once that the check is red on a ledger with one malformed park line (do not commit that), and say so in the report.
3. R-2730 flips to `implemented` with backticked `file::title` evidence when its check passes. Regenerate `docs/requirements-tree.md` with `npm run req:tree` if it changes.
4. Checks before your one commit: the test file alone; `node scripts/requirements-tree.mjs --check`, which must print exactly `deliverables: 18 of 23 made and read by code, 18 parked` and no `deliverable note:` line; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `npm run test:locked`.

Seat check: `node docs/reviews/park-honestly-2026-10-23/seat-titles.mjs all` must print `0 missing`.

Done: R-2730 passes, its control fails as designed, the tree check prints the count line above with no note, the full suite is green, the seat check prints `0 missing`, and the work is committed.

Report (at most 10 lines after the VERDICT line): the commit sha; R-2730's result and the hand check; the tree check's deliverable line; each departure from the Precedent files or the must-meet, with its reason; the full suite's summary line; map, readme, trace and seat-check status.
