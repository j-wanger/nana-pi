Feature: FEAT-045 · Test which builder context changes builds

Lane builder-drop. Class: ordinary. Builder: pi-worker (larger lane). Build session 2. Build 1 stopped BLOCKED (`build-report.md`): it needs the build-number parser that is private in `apps/bench/lib/anatomy-sessions.mjs`. Its draft is uncommitted in this worktree; continue from it, keep what is right, and finish the brief of `build-brief-1.md`.

Authorization: export that parser from `apps/bench/lib/anatomy-sessions.mjs` under a clear name, unchanged in behaviour, and import it from the replay harness. Do not copy it. Keep its existing callers working and its tests green. This follows the 2026-10-22 ruling that a helper's second caller imports it.

## Precedent

- `apps/bench/lib/anatomy-sessions.mjs`
- `apps/bench/anatomy.mjs`
- `apps/bench/run.mjs`

Report each departure.

## Build

Everything `build-brief-1.md` asks, from where build 1 stopped: finish the tests (every must-meet red on main's code first; the build 1 red baseline counts), the harness, the README, the generated maps and the session entry. Verify the later path fix build 1 left unverified. Make no paid model call and start no real pi builder.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

As `build-brief-1.md` says: every touched test file green, map, README, trace, tree, known-bugs, writing and identity checks (identity after `git add`). Do not run the locked full suite. Push the branch, open a draft PR against main, and stop.
