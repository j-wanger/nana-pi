Feature: FEAT-040 · Make and keep memory

Lane making-trigger. Class: gate (`packages/nana-pack/bin/nana-land.mjs — land tool`). Builder: pi-worker (larger lane). Build session 5, on branch tip bb55e311 (main b10761b1).

Review round 1: the final reviewer said LAND; the land reviewer sent the lane back for one MUST. Fix it, plus the final reviewer's one SHOULD and its first NOTE. The round-1 review texts will be kept in this folder by the seat.

## Precedent

- `packages/nana-pack/lib/memory-run.mjs`
- `packages/nana-pack/lib/profile-sync.mjs`
- `packages/nana-pack/tests/memory-run-recovery.test.mjs`

Report each departure.

## Build

1. MUST (land reviewer): a shutdown during a rebase can leave the private clone on a detached HEAD. `makeMemory` calls `fetchProfile` before `recoverProfile`, and the fetch needs `symbolic-ref --short HEAD`, so recovery is never reached and every later run reports `memory: failed` until a seat save repairs the clone. Reproduction: in the synthetic fixture, pause a real rebase (`git rebase --exec false HEAD~1`), then run `make` twice. Fix: recover the clone under its lock before anything requires an attached branch; keep network steps outside the lock. Add a regression test: after a paused rebase, a later making run recovers and processes its pending units. Show it red on bb55e311, then green.
2. SHOULD (final reviewer): `pendingUnits` lists every landed review file with one `git ls-tree -r --name-only refs/heads/main -- docs/reviews/` through `profileGit`, whose output cap is 1 MiB. The listing is 255 KB and grows 8 to 13 KB a day, so review units would silently stop in about 80 days. List only the lane folders a run needs, or otherwise make the listing bounded, and make an over-cap listing fail loudly in `status` rather than skip silently. Pin it with a test that a listing past the cap is not reported as zero pending.
3. NOTE 1 (final reviewer): the first lock step reports `memory: busy` for any failure (a dirty clone, a failed rebase or commit). Report a non-lock failure with its own fixed outcome word, as build 4 did for the second step. Pin it.
4. Re-run the mutation runner; add pairs for items 1 and 2.

Privacy and limits: unchanged. Synthetic fixtures and a scratch home only; no real profile clone, transcripts or model calls. Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`. Do not edit `HANDOFF.md`, `docs/sessions/` or `docs/known-bugs/`.

## Show your work

The red-then-green runs, the locked full suite in the foreground (`npm run test:locked`), the mutation runner and `node packages/nana-setup/bin/install-check.mjs` (a `pi post-edit` `write-error` is the known builder-environment failure).

## Done when

Green: locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, the deliverables check and `node scripts/identity-scan.mjs --root .`. Push and report the finished CI run for the new tip, including the Windows suite leg. A Windows R-3104 timeout is a known flake: rerun the failed job once.
