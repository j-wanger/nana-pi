Feature: FEAT-019 · Release usable templates and report support. Lane ci-jobs, row R-2577. Class: ordinary. Builder: pi-worker (small lane). Build session 2: the suite job warms the copier cache before its suite steps.

Work in ~/nana-pi-wt/ci-jobs on feat/ci-jobs. Read `docs/reviews/ci-jobs-2026-10-22/must-meet.md`, its amendment after build 1 above all (R-2577, why D5 fired, the test, the pairs). Follow packages/nana-pack/prompts/builder-preamble.md. Never edit HANDOFF.md, docs/known-bugs/, docs/sessions/, packages/nana-pack/rules/ or docs/reviews/. No push. Keep your ledger edits to FEAT-019's rows.

1. `.github/workflows/ci.yml`, suite job: one step `- run: uvx copier --version` (a `name:` is fine) after the uv setup step and before the first suite step. Keep every existing workflow check green.
2. R-2577's test in `packages/nana-pack/tests/ci-workflow.test.mjs` with the amendment's exact title and `// req:` marker, doing what the amendment says. Add R-2577 to FEAT-019 after R-2558 with the amendment's text, `implemented`, and evidence. `npm run req:tree` regenerates the outline (0 problems).
3. Run the changed test file, `npm run map:check`, `npm run readme:check`, `node scripts/requirements-trace.mjs`, then `npm run test:locked` before your commit. Try these wrong versions, see R-2577 go red, then restore: the step removed; the step after the suite steps. Commit with explicit paths.

Seat check: `node docs/reviews/ci-jobs-2026-10-22/seat-titles.mjs all` must print `0 missing`.

Done: the suite job warms the copier cache before its suite steps; checks and the full suite green; seat check `0 missing`; committed.

Report (at most 8 lines after the VERDICT line): the commit sha; the wrong versions and results; the full suite's summary line; seat-check status.
