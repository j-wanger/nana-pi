Feature: FEAT-008 · Integrate and clean up reviewed changes

Lane land-clean-merge. Class: gate. Builder: pi-worker (small lane). Build session 2, on branch tip after build 1. Build 1 finished the code and tests and stopped PARTIAL only because brief 1 did not authorize the session archive and known-bug edits. This build is authorized to make exactly those.

## Precedent

- `docs/reviews/land-clean-merge-2026-11-02/session-entry.md`
- `docs/reviews/land-clean-merge-2026-11-02/known-bug-updates.md`
- `docs/sessions/2026-10.md`

Report each departure.

## Build

Apply `session-entry.md` as the newest entry in `docs/sessions/2026-10.md`, in that file's entry format, and apply the five changes in `known-bug-updates.md` to `docs/known-bugs/`, each in its file's existing line style. Change nothing else.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Green, run locally: the known-bugs check, `nana-writing` on the new session entry, the requirements trace, `npm run readme:check`, and `node scripts/identity-scan.mjs --root .` after `git add`. Do not run the locked full suite; CI is the suite. Push and stop.
