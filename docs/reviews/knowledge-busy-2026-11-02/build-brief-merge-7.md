Feature: FEAT-013 · Install and connect harness runtimes

Lane knowledge-busy. Class: hook. Builder: pi-worker (small lane). Merge build, on branch tip ed4a399d. Every reviewer said LAND at the previous round (kept in this folder), but main moved to 5e7b779b before the land. This build merges main and records the last review's notes.

## Precedent

- `docs/sessions/2026-10.md`

Report each departure.

## Build

Merge `origin/main` into `feat/knowledge-busy`. Every file this lane did not set out to change must end identical to `origin/main`, including lines main deleted. Keep this lane's changes: its rows, code, tests, READMEs, known-bug lines, session entry and review folder. In `docs/sessions/2026-10.md` keep every entry whole, newest first. Regenerate `docs/code-map.md` and `docs/requirements-tree.md` with their generators rather than hand-merging them. Change no behaviour.

Also add one line to `docs/known-bugs/FEAT-013.md`, in its existing line style, naming "(knowledge-busy, CI round 6)": M2 still missed one stale hook pull (noPull=1) on the macOS CI leg at tip ed4a399d after the bounded retry, and passed on re-run; the summary-mode CI log does not show its reason or retried detail.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

`git diff origin/main HEAD --stat` lists only this lane's files. Green, run locally: every test file this lane touched, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs --root .`. Do not run the locked full suite; CI is the suite. Push and stop.
