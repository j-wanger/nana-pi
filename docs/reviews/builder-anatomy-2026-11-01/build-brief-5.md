Feature: FEAT-042 · Measure what a builder's context is for

Lane builder-anatomy. Class: ordinary. Builder: pi-worker (small lane). Build session 5. Main has moved again to aa530680: lane making-trigger landed (SUB-024 under FEAT-040, R-3290 to R-3309 and R-3340 to R-3342, A-093). 

## Precedent

- `REQUIREMENTS.md`
- `HANDOFF.md`
- `docs/sessions/2026-10.md`

Report each departure.

## Build

1. Merge `origin/main` into `feat/builder-anatomy`. Keep both lanes' content: every landed ID on main as it is (FEAT-043, R-3310 to R-3336, A-095; SUB-024, R-3290 to R-3309, R-3340 to R-3342, A-093), this lane's FEAT-042, R-3270 to R-3278 and A-092, both session entries (newest first, this lane's entry above outcome-meter's only if its date heading sorts that way; keep both whole), and both known-bug files. Renumber nothing.
The seat authorizes you to edit `docs/sessions/2026-10.md` for this merge only: if git's resolution drops or interleaves either 2026-11-01 entry, restore both whole, each word as on its own branch, newest first by the order main already has with this lane's entry placed directly above the newest entry main already has. Verify with a diff that both entries match their sources byte for byte.
2. `HANDOFF.md` has one "Lanes in flight" line; keep this lane's version of that line.
3. Regenerate maps and update heading counts only as the merge requires.

Privacy and limits: no real sessions or private store; never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`. Change no code beyond what the merge itself requires.

## Show your work

The locked full suite in the foreground (`npm run test:locked`).

## Done when

Green: locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs --root .`. Push and report the finished CI run for the new tip, including the Windows suite leg. A Windows R-3104 timeout is a known flake: rerun the failed job once.
