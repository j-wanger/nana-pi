Feature: FEAT-019 · Release usable templates and report support. Lane ci-jobs. Class: ordinary. Builder: pi-worker (small lane). Build session 3: one load-sensitive test file joins the run-alone list.

Work in ~/nana-pi-wt/ci-jobs on feat/ci-jobs. Read `docs/reviews/ci-jobs-2026-10-22/must-meet.md`, its amendment after build 2 above all. Follow packages/nana-pack/prompts/builder-preamble.md. Never edit HANDOFF.md, docs/known-bugs/, docs/sessions/, packages/nana-pack/rules/ or docs/reviews/. No push.

1. `packages/nana-pack/lib/test-runner-config.mjs`: add `"packages/nana-pack/tests/post-edit-utf8.test.mjs"` to `RUN_ALONE` with a reason in the style of the others (a load-sensitive 3000 ms post-edit check that starts a Python parent and child), and extend the list's provenance comment with the CI run (run 39785202152, Windows at four jobs, 2026-10-22). Change no bound in the test file.
2. Run `packages/nana-pack/tests/test-runner-parallel.test.mjs` and `packages/nana-pack/tests/post-edit-utf8.test.mjs`, `npm run map:check`, `npm run readme:check`, `node scripts/requirements-trace.mjs`, then `npm run test:locked` before your commit. Commit with explicit paths.

Seat check: `node docs/reviews/ci-jobs-2026-10-22/seat-titles.mjs all` must print `0 missing`.

Done: the file runs alone at four jobs; checks and the full suite green; committed.

Report (at most 6 lines after the VERDICT line): the commit sha; the two test files' results; the full suite's summary line; seat-check status.
