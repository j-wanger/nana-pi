Feature: FEAT-019 · Release usable templates and report support. Lane ci-jobs, rows R-2556 to R-2558, and R-1313's check. Class: ordinary. Builder: pi-worker (small lane). One build: the CI suite job runs four test files at a time on every leg, with a longer per-file time limit.

Work in ~/nana-pi-wt/ci-jobs on feat/ci-jobs. The plan of record is `docs/reviews/ci-jobs-2026-10-22/must-meet.md`: read its measurements, decisions D1 to D5, rows, what each test does, tunables and known limits first, then `plan-attack.md`. Follow packages/nana-pack/prompts/builder-preamble.md. Never edit HANDOFF.md, docs/known-bugs/, docs/sessions/, packages/nana-pack/rules/ or docs/reviews/. No push. Two other lanes build in parallel (suite-records, report-deliverables); keep your ledger edits to FEAT-019's rows.

1. `.github/workflows/ci.yml`, suite job only (D1, D2): add `NANA_CI_JOBS: "4"` and `NANA_TEST_TIMEOUT_MS: "900000"` to the job's `env`, each with its `chosen` comment directly above it carrying the provenance the tunables list. Keep every existing check on the job's `env` green (R-996's included). The two suite steps become `npm test -- --jobs=${{ env.NANA_CI_JOBS }}` and `npm test -- --verbose --jobs=${{ env.NANA_CI_JOBS }}`, with their `if:` lines unchanged. D4: add one sentence to the `timeout-minutes: 90` comment saying the suite legs run four files at a time since this lane; R-2061's check stays green.
2. Tests in `packages/nana-pack/tests/ci-workflow.test.mjs` with the must-meet's exact titles and `// req:` markers, doing what "What each test does" says: R-2556 splits each run line at the first standalone `--`; R-2558 scans the whole file, workflow `env`, every job's and step's `env` and inline assignments in run lines. Each test spells its sealed literal once. R-1313's check matches the new Windows step line and still requires `--verbose`; its title stays.
3. Add R-2556 to R-2558 to FEAT-019 after its last row with the must-meet's texts, `implemented`, and evidence. `npm run req:tree` regenerates the outline and prints 0 problems.
4. Run the changed test file, `npm run map`, `npm run map:check`, `npm run readme:check`, `node scripts/requirements-trace.mjs`, then `npm run test:locked` before your last commit. Try these wrong versions, see each go red, then restore: `npm test --jobs=…` with no `--`; a literal `--jobs=4` in one step; `NANA_CI_JOBS` at 3; the limit moved to the workflow-level `env`; the limit inline in the non-Windows run line; the Windows step without `--verbose`. Commit with explicit paths.

Seat check: `node docs/reviews/ci-jobs-2026-10-22/seat-titles.mjs 1` must print `0 missing`.

Done:
- Every suite step passes the job count after npm's separator; both values are sealed once in the suite job's `env` with their comments; R-1313 still pins `--verbose`.
- map:check, req:tree, readme:check, the trace and the full suite are green; the seat check prints `0 missing`; the work is committed.

Report (at most 10 lines after the VERDICT line): the commit sha; the check results; the wrong versions tried; the full suite's summary line; map, readme, trace and seat-check status.
