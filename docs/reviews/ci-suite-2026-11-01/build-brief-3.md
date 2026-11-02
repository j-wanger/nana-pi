Feature: FEAT-008 · Integrate and clean up reviewed changes

Lane ci-suite. Class: gate. Builder: pi-worker (small lane). Build session 3, on branch tip fffb9fcd. Round 1: both reviewers said LAND (texts kept in this folder as `r1-*.md`). Main has moved to 81b78dfa (audit-test-speed landed). This build merges main and takes one SHOULD from the final review.

## Precedent

- `packages/nana-pack/prompts/builder-preamble.md` (line 31)
- `packages/nana-pack/tests/worker-lane.test.mjs` (R-3436's pins)
- `docs/sessions/2026-10.md`

Report each departure.

## Build

1. Merge `origin/main` into `feat/ci-suite`. Keep both sides: every landed ID on main as it is, this lane's R-3430 to R-3437 and R-1110's retirement; all session entries whole, byte for byte as on their branches, newest first; known-bug files as the union of both sides; this branch's HANDOFF "Lanes in flight" line. You may edit `docs/sessions/2026-10.md`, `HANDOFF.md` and `docs/known-bugs/*.md` only as the merge requires. Renumber nothing.
2. SHOULD (final review): the preamble line "Run the repository's full suite only where its `AGENTS.md` says CI does not cover it" reverses the default for projects whose AGENTS.md says nothing about CI. Reword it so a builder runs the full suite unless the repository's `AGENTS.md` says CI covers it, keeping the lock and exit-code sentences. Update R-3436's text and pins to match, and make sure nana-pi's own `AGENTS.md` (and its shared source `templates/_shared/working-under-nana-pi.md`, if it holds the CI sentence) still says CI covers the suite here, so nana-pi builders keep pushing and stopping. Add one pair to `seat-mutate.mjs` restoring the old wording that turns R-3436 red.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Green, run locally: the touched test files, the mutation runner, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, the deliverables check and `node scripts/identity-scan.mjs --root .`. Run `node packages/nana-setup/bin/install-check.mjs` and report its exit. This lane changes the test runner, so run `npm run test:locked` once in the foreground on the final tip and report its summary. Push the branch and stop.
