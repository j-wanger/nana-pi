Feature: FEAT-008 · Integrate and clean up reviewed changes. Lane land-ci-timings, rows R-2750 to R-2756 (R-2753 in FEAT-031). Class: land tool (nana-land changes). Builder: pi-worker (larger lane). Build session 1 of 1: the whole lane.

Work in the lane worktree on feat/land-ci-timings. The spec is `docs/reviews/land-ci-timings-2026-10-23/must-meet.md`: read it whole before designing. It holds over `plan-draft.md` where they differ: downloads name the github.com host (M1); no `Made by: R-2632 · land:` line and no `ci-runs` artifact name (M2); the budget never hands gh a zero or fractional limit (S1); the store name goes through `storeSuiteRecord`'s existing `pid` option, and the only new store option is the folder (S3, N1); the failure rules and the narrowed R-2755 (S5, S7); test boundaries derived from imported names (S6). Read the draft for its measurements, design D1 to D9 and D11, Windows notes and docs list, and `plan-attack.md` for the findings and pairs the must-meet adopts. Before editing, run the map impact command on packages/nana-pack/bin/nana-land.mjs, packages/nana-pack/lib/ci-records.mjs and packages/nana-pack/lib/suite-records.mjs, and work from the blast radius. Do not edit HANDOFF, the session archive, `docs/known-bugs/`, or any file in this review folder.

Precedent:
- packages/nana-pack/bin/nana-land.mjs — `ghEnvironment` (wraps every records call), `ghDefault` (gains a per-call limit that must be a positive integer), the CI read and `judgeRuns`, the ledger lock that ends with the merge, the post-merge checks, containment and the never-refusing release-status read (the model for the new step's place and its own catch), the land notes and success text, and the one `refused:` catch the new step must never reach.
- packages/nana-pack/lib/ci-records.mjs — `readCiRecords`, called with the tip's full SHA and nana-land's wrapped runner; it returns its parsed records beside `code` and `records`; its download names the github.com host.
- packages/nana-pack/lib/suite-records.mjs — `suiteRecordsDir`, `storeSuiteRecord` and `readSuiteRecords` gain a store-folder option, default the local store; `finalFiles` feeds the new pure `slowFiles`, beside `recordCounts`; `numberText` is exported for the new lib's note text.
- packages/nana-pack/lib/suite-records-config.mjs — the form of `CI_STORE_SUBPATH`, `CI_RECORDS_KEEP` and `CI_SLOW_SHARE`, with provenance.
- packages/nana-pack/lib/land-config.mjs — the form of `CI_RECORDS_BUDGET_MS`; `CI_READ_TIMEOUT_MS`, `LAND_NOTE_PREFIX` and `TIP_DIGITS` reused.
- packages/nana-pack/lib/release-status.mjs — the never-throw reader with an injected runner: the model for the new lib `packages/nana-pack/lib/land-ci-records.mjs` and its failure lines.
- scripts/test-locked.mjs — `finishSuiteRecord`: a record stored at land whose failures become lines and never change the verdict.
- scripts/test.mjs — the run record write, which gains the default per-file limit.
- packages/nana-pack/tests/land.test.mjs — `workflowRun`, `runList`, `ciFixture`, `executeCi`, the lock stub's event log, and R-2591's env assertion; its fixture helpers move to the new shared test module.
- packages/nana-pack/tests/ci-records.test.mjs — the fake gh state shape for runs, artifacts, jobs and downloads.
- packages/nana-pack/tests/test-runner.test.mjs — the record-knob case and `recordsMatchOutput`.
- packages/nana-pack/tests/suite-records.test.mjs — the store and retention cases.
- packages/nana-pack/tests/tmp-dir.mjs — the shape of a shared test module.

Named moves the brief accepts: suite-records.mjs's private `numberText` is exported (ci-records.mjs keeps its own copy, a known limit); land.test.mjs's fixture helpers move to `packages/nana-pack/tests/land-fixtures.mjs`, imported back. `ghEnvironment` stays private. No other helper moves.

Traps:
- Nothing in the new step may reach nana-land's `refused:` catch: guard the call and the formatting of its result.
- A per-call limit of 0 means "no limit" to spawnSync, and a fraction throws: never pass either.
- Three existing land assertions count every gh call (R-2588, R-2590, R-2591): narrow each to the calls before the suite and keep each row's text and title.
- Keep every escaped `\n` in test template literals that you do not mean to change.
- The README check resolves backticked paths: write the store's name in prose.
- A needed change to review-launch, review-round, pi-review, claude-review, any hook, any extension or nana-setup stops the build: report it instead.

Steps, in order:
1. Rows first: R-2750 to R-2752 and R-2754 to R-2756 in FEAT-008 after its last row, R-2753 in FEAT-031 after R-2546, each `untested`. Replace R-2632's person reader line with `Read by: R-2632 · code: packages/nana-pack/bin/nana-land.mjs, packages/nana-pack/lib/land-ci-records.mjs`.
2. Tests with `// req:` markers directly above and the must-meet's exact titles (the seal test's markers name R-2751, R-2752, R-2754 and R-2756), every case the must-meet and the draft list. Check by hand once that each new check is red on main's code, and say so in the report (do not commit those checks).
3. Code as the must-meet's decisions say.
4. Docs: both READMEs and the module headers as the draft's docs list says, narrowed by the must-meet. Regenerate `docs/code-map.md` and `docs/requirements-tree.md` (`npm run map`, `npm run req:tree`).
5. Checks before your one commit: land-ci-records, land, ci-records, suite-records, test-runner and release-status test files each alone with `CLAUDE_CONFIG_DIR` unset and a scratch TMPDIR; `node scripts/requirements-tree.mjs --check` (no `deliverable note:` line); `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `npm run test:locked`. You cannot run Windows or a real gh land here; reason about those paths from the code and say what you could not run.

Seat check: `node docs/reviews/land-ci-timings-2026-10-23/seat-titles.mjs all` must print `0 missing`.

Done: every must-meet test passes and was red on main, the three narrowed assertions keep their titles, the tree check prints no note, the full suite is green, the seat check prints `0 missing`, and the work is committed.

Report (at most 12 lines after the VERDICT line): the commit sha; each must-meet title's result; the hand check against main; the tree check's deliverable line; each departure from the Precedent files or the must-meet, with its reason; the full suite's summary line; map, readme, trace and seat-check status; what you could not run.
