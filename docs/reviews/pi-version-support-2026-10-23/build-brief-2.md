Feature: FEAT-013 · Install and connect harness runtimes (rows also in FEAT-015 · Diagnose the active environment and FEAT-019 · Release usable templates and report support). Lane pi-version-support. Class: install. Builder: pi-worker (small lane). Build session 2: one finding on build 1 (291f8a14).

Work in the lane worktree on feat/pi-version-support, on top of 291f8a14. Read `docs/reviews/pi-version-support-2026-10-23/must-meet.md` section "Build 1 finding, adopted": it holds over everything above it. Do not edit HANDOFF, the session archive, `docs/known-bugs/`, or any file in this review folder.

The finding, in one sentence: doctor already prints a `pi packages` row (nana-pi's registration, also install's step label), and build 1 gave the new row the same label, so the new row's label becomes `pi dependencies` and nothing else in doctor's or install's output changes.

Precedent:
- packages/nana-setup/lib/doctor.mjs — the registration row `add(…, "pi packages", …)` under "pi package registration", unchanged; the new row's `add` call after `pi executable`, whose label changes.
- packages/nana-setup/lib/steps.mjs — install's `pi packages` step labels, unchanged.
- packages/nana-setup/tests/doctor-package-source.test.mjs at main (`git show main:packages/nana-setup/tests/doctor-package-source.test.mjs`) — the text this file returns to.
- packages/nana-setup/tests/doctor-pi-packages.test.mjs at 291f8a14 — the fixtures and checks that move to the renamed file.

Steps, in order:
1. Rows first: in `REQUIREMENTS.md`, R-2713 to R-2715 say `pi dependencies` row instead of `pi packages` row, and their evidence names the new file and titles. Keep each row `implemented` only once its check passes again.
2. Tests: `git mv` the test file to `packages/nana-setup/tests/doctor-pi-dependencies.test.mjs`; its lookup reads the `pi dependencies` label; the three titles become the must-meet's titles of record. R-2714's check adds: in that fixture's doctor output exactly one row carries `pi dependencies` and exactly one carries `pi packages`. Restore `doctor-package-source.test.mjs` to main's text exactly: `git diff main -- packages/nana-setup/tests/doctor-package-source.test.mjs` must print nothing.
3. Code: `git mv` the module to `packages/nana-setup/lib/pi-dependencies.mjs` (header `@module` updated); doctor's import and the new row's label `pi dependencies`; doctor's `@outputs` line names the `pi dependencies` row.
4. Docs: every README sentence about the new row names `pi dependencies` and drops "first", "the later `pi packages` registration row" and "the later row with the same label"; the setup README's test table names the renamed test file. Regenerate `docs/code-map.md` and `docs/requirements-tree.md` (`npm run map`, `npm run req:tree`).
5. Checks before your one commit: `doctor-pi-dependencies`, `doctor-package-source`, `pi-registration`, `pi-launch-limits`, `copy-record`, `doctor-runtime` and `pi-install-pin` test files each alone; `grep -rn "first \`pi packages\`\|same label" README.md packages/nana-setup/README.md` prints nothing; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked`.

Seat check: `node docs/reviews/pi-version-support-2026-10-23/seat-titles.mjs all` must print `0 missing`.

Done: every must-meet test passes under the new titles, `doctor-package-source.test.mjs` matches main, the seat check prints `0 missing`, the full suite is green, and the work is committed.

Report (at most 8 lines after the VERDICT line): the commit sha; each renamed title's result; any departure from this brief, with its reason; the full suite's summary line; map, readme, trace, tree and seat-check status.
