Feature: FEAT-040 · Make and keep memory

Lane memory-curation. Class: ordinary. Builder: pi-worker (small lane). Merge build, on branch tip fe2a8849, before the first review. Main moved to 5e7b779b, and the branch now conflicts with it, so GitHub runs no CI on it.

## Precedent

- `docs/sessions/2026-10.md`
- `packages/nana-pack/tests/requirements-tree.test.mjs` on `origin/main` (ledger-heading-count derived the R-288 and R-1158 heading checks from the ledger; no pinned count remains)

Report each departure.

## Build

Merge `origin/main` into `feat/memory-curation`. In `requirements-tree.test.mjs` take main's version whole and drop this lane's heading-count pin edits; the derived checks must pass with this lane's new headings. Every other file this lane did not set out to change must end identical to `origin/main`, including lines main deleted. Keep this lane's changes: its rows, code, tests, READMEs, known-bug lines, session entry and review folder. In `docs/sessions/2026-10.md` keep every entry whole, newest first. Regenerate `docs/code-map.md` and `docs/requirements-tree.md` with their generators rather than hand-merging them. Change no behaviour.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

`git diff origin/main HEAD --stat` lists only this lane's files. Green, run locally: every test file this lane touched, `node packages/nana-pack/tests/requirements-tree.test.mjs`, `node packages/nana-pack/tests/test-runner.test.mjs`, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs --root .`. Do not run the locked full suite; CI is the suite. Push and stop.
