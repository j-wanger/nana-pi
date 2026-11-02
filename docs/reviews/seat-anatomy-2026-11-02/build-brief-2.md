Feature: FEAT-042 · Measure what each role's context is for

Lane seat-anatomy. Class: ordinary. Builder: pi-worker (larger lane). Build session 2. Build 1 stopped BLOCKED (`build-report.md`): the new `messageText` duplicates the private `textOnly` in `packages/nana-pack/lib/memory-making.mjs`. Its draft is uncommitted in this worktree; continue from it and finish `build-brief-1.md`.

Authorization: export `textOnly` from `packages/nana-pack/lib/memory-making.mjs` unchanged in behaviour and import it where `messageText` would have copied it; delete the duplicate. Standing authorization for this lane: when a Precedent file has a private helper this lane needs, export it from its own module (never copy, never move it to another module) and report each export as a departure. Keep every existing caller and test green.

## Precedent

- `packages/nana-pack/lib/memory-making.mjs`
- `apps/bench/lib/anatomy-pulls.mjs`
- `apps/bench/anatomy.mjs`

Report each departure.

## Build

Everything `build-brief-1.md` asks, from where build 1 stopped: the eleven mutation pairs red against the wrong code and green after, the regenerated map and tree, the session entry in `docs/sessions/2026-10.md` (this brief authorizes that one archive edit), and every check on the last commit. Synthetic transcripts only; no model calls; never read or copy real transcripts or owner text into the repository.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

As `build-brief-1.md` says, with the identity scan run after `git add`. Push the branch, open a draft PR against main with `gh`, and stop.
