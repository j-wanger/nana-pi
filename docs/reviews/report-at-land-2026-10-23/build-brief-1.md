Feature: FEAT-039 · See the product and its decisions in one report. Lane report-at-land, rows R-2740 to R-2745. Class: ordinary (the write runs inside every land's locked suite, so treat the guard as load-bearing). Builder: pi-worker (larger lane). Build session 1 of 1: the whole lane.

Work in the lane worktree on feat/report-at-land. The spec is `docs/reviews/report-at-land-2026-10-23/must-meet.md`: read it whole before designing. It holds over `plan-draft.md` where they differ: no `product-report` artifact name and no self-provenance age (R-2746 drops), a hand measure never writes the page, the machine-local artifact map replaces a name list, the page write is atomic, and R-1014's land line names no artifact. Read the draft for its measurements, design D1 to D8, Windows notes and docs list, and `plan-attack.md` for the findings the must-meet adopts. The planner's prototype under the scratch folder is evidence, not the design. Before editing, run the map impact command on scripts/test-locked.mjs, scripts/product-report.mjs and scripts/deliverables.mjs and work from the blast radius. Do not edit HANDOFF, the session archive, `docs/known-bugs/`, or any file in this review folder.

Precedent:
- scripts/test-locked.mjs — `finishSuiteRecord` and its inline land trigger (lifts into one exported predicate both callers use), the runtime-map write at a land and its `note()` guard, the three passing exits, and the Windows branch.
- packages/nana-pack/lib/suite-records.mjs — `suiteRecordsDir`, whose common-directory resolution lifts into an exported `gitCommonDir(root, { runGit })` in the same module; `readSuiteRecords`; `storeSuiteRecord`.
- packages/nana-pack/lib/runtime-map.mjs — `dataPath` (R-1278's rule for a linked worktree).
- scripts/runtime-measure.mjs — the runtime map's temp-file-then-rename write, which the page write copies.
- packages/nana-pack/lib/build-records.mjs — `buildRecordsPath` and `readBuildLedger`.
- packages/nana-pack/bin/build-report.mjs — how it finds the common directory and reads the ledger.
- scripts/product-report.mjs — `generateReport`, `DEFAULT_OUT`, the exported age labels, and `artifactAges` with its runtime-map branch, the shape for the store ages.
- scripts/deliverables.mjs — `RUNTIME_MAP_ARTIFACT` and its exemption, which the machine-local artifact map replaces (the constant stays exported).
- packages/nana-pack/tests/runtime-land.test.mjs — the fake suite, the injected-options wrapper, `runCase`, `HAND_WRAPPER`, R-2526's `platform: "win32"` injection, and the R-2525 case that now counts only runtime-map notes.
- packages/nana-pack/tests/suite-records.test.mjs — the fake suite's runner-record write that the runtime-land fake gains.
- packages/nana-pack/tests/product-report.test.mjs — `writeRuntimeFile`, `historyFixture`, `commitAt`, `renderedClaims`, and R-2545's cases.
- packages/nana-pack/tests/requirements-deliverables.test.mjs — R-2537's sealed values and the artifact-path cases.

Named moves the brief accepts: the inline land trigger → an exported predicate in test-locked.mjs; the common-directory resolution in `suiteRecordsDir` → exported `gitCommonDir` in suite-records.mjs. No other helper moves.

Traps:
- The page write must never change the land's exit code or escape as a rejection; after the report build, re-check the stop flag.
- Tests compare page paths through `fs.realpathSync.native` (Windows runners use short 8.3 temp paths).
- Keep every escaped `\n` in test template literals that you do not mean to change.
- R-2730 (park-honestly, landing on main soon) fails the suite on any deliverable note; the seat merges main after it lands. Your ledger lines must draw no note under the map.
- The README check resolves backticked paths: write the store path in prose.

Steps, in order:
1. Rows first: R-2740 to R-2745 in FEAT-039 directly after R-2545, `untested`; R-1012's condition as the must-meet says. The ledger lines: R-1014's four lines (land maker with no artifact, manual publish maker, person reader, the park line with the must-meet's reason, dated 2026-10-23); ` · suite-runs` on R-2547's maker line and ` · build-records` on R-2597's.
2. Tests with `// req:` markers directly above and the must-meet's exact titles, every case "What each test does" lists. Check by hand once that each new check is red on main's code, and say so in the report (do not commit those checks).
3. Code as the must-meet's decisions say.
4. Docs: both READMEs, the requirements skill text and the module headers as the draft's docs list says, narrowed by the must-meet. Regenerate `docs/code-map.md` and `docs/requirements-tree.md` (`npm run map`, `npm run req:tree`).
5. Checks before your one commit: runtime-land, suite-records, test-locked, product-report, requirements-deliverables and requirements-tree test files each alone with `CLAUDE_CONFIG_DIR` unset; `npm run report` into a scratch path; `node scripts/requirements-tree.mjs --check` (no `deliverable note:` line); `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `npm run test:locked`. You cannot run Windows here; reason about its paths from the code and say what you could not run.

Seat check: `node docs/reviews/report-at-land-2026-10-23/seat-titles.mjs all` must print `0 missing`.

Done: every must-meet test passes and was red on main, the tree check prints no note, the full suite is green, the seat check prints `0 missing`, and the work is committed.

Report (at most 12 lines after the VERDICT line): the commit sha; each must-meet title's result; the hand check against main; the tree check's deliverable line; the ages shown on the page built at your tip (count of 41); each departure from the Precedent files or the must-meet, with its reason; the full suite's summary line; map, readme, trace and seat-check status; what you could not run.
