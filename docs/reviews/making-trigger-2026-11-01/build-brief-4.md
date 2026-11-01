Feature: FEAT-040 · Make and keep memory

Lane making-trigger. Class: gate (`packages/nana-pack/bin/nana-land.mjs — land tool`). Builder: pi-worker (larger lane). Build session 4, on branch tip 78968f59 (main b10761b1).

The lane's independent check (`independent-check-78968f59.md` in this folder) found one MUST and two SHOULD points. Fix all three.

## Precedent

- `packages/nana-pack/lib/profile-store.mjs`
- `packages/nana-pack/lib/memory-store.mjs`
- `packages/nana-pack/lib/memory-run.mjs`
- `packages/nana-pack/lib/profile-sync.mjs`

Report each departure.

## Build

1. MUST: one torn JSON file under the profile clone's `projects/` blocks `nana-profile save` (it exits with `profile refused: git failed`, hiding the cause) and makes every later making run spend, then report `busy`.
   - Write store files so a kill never leaves a torn file: write to a temp name, then link or rename it into the exclusive final name, keeping the never-overwrite rule.
   - Make the project-store readers (`readMemoryFiles`, and the path `mergeMemory` takes for seat saves) skip an unparseable file and count it, so one bad file never blocks a save or a run. `nana-memory status` shows the count with a fixed word.
   - An error in the merge step is reported as its own fixed outcome word, never as `busy`.
   - Tests: a torn records file and an empty `seen` file each leave `nana-profile save` working and a later run completing without re-sending done units; the status count shows them. Show each red on the build-3 code, then green.
2. SHOULD S1: a model call may start only if elapsed time plus the batch timeout stays within the maximum run time, so a live run's lock can never look stale. Pin it.
3. SHOULD S2: the run's second, local-only clone-lock step waits a short sealed time instead of zero, with provenance, so a seat save holding the lock for a moment does not discard a run's spend. Pin it.
4. Re-run the lane's mutation runner and add a pair for the torn-file case.

Privacy and limits: unchanged from build brief 1. Synthetic fixtures and a scratch home only; no real profile clone, transcripts or model calls. Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`. Do not edit `HANDOFF.md`, `docs/sessions/` or `docs/known-bugs/`; the seat updates them.

## Show your work

The red-then-green runs, the locked full suite in the foreground (`npm run test:locked`), the mutation runner and `node packages/nana-setup/bin/install-check.mjs` (a `pi post-edit` `write-error` is the known builder-environment failure).

## Done when

Green: locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, the deliverables check and `node scripts/identity-scan.mjs --root .`. Push and report the finished CI run for the new tip, including the Windows suite leg. A Windows R-3104 timeout is a known flake: rerun the failed job once.
