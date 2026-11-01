Feature: FEAT-040 · Make and keep memory

Lane making-session-end. Class: hook (`packages/nana-setup/claude/hooks/nana-memory-end.mjs — Claude Code hook`). Builder: pi-worker (larger lane). Build session 1, on main ad9612dd.

The owner ruled that memory making runs at the end of each seat session and as part of each land, never nightly. Lane making-trigger built the run, the store and the land trigger; this lane adds the Claude Code SessionEnd hook, its install wiring and a doctor row, and fixes the push status the first real runs showed. The plan's one owner question is posted as optional issue 292; build on its default (land on CI, Windows check after).

Build the plan of record, `docs/reviews/making-session-end-2026-11-01/plan.md` (revised after `plan-attack.md`). Build every must-meet test (1 to 8) and the seal test for each sealed value it lists. Follow its decisions, Assumptions, Threat model and Precedent. IDs: rows R-3350 to R-3369 only, in SUB-024 under FEAT-040; no new artifact (A-093 gains the hook as a maker). Do not use any other row number.

## Precedent

- `packages/nana-setup/claude/hooks/nana-roster-notice.mjs`
- `packages/nana-setup/tests/roster-notice-hook.test.mjs`
- `packages/nana-setup/lib/settings.mjs`
- `packages/nana-setup/lib/install-check.mjs`
- `packages/nana-setup/lib/doctor.mjs`
- `packages/nana-setup/lib/hook-health.mjs`
- `packages/nana-setup/lib/stale-copies.mjs`
- `packages/nana-setup/lib/shared-memory-input.mjs`
- `packages/nana-knowledge/lib/hook.ts`
- `packages/nana-knowledge/tests/hook.test.mjs`
- `packages/nana-pack/bin/nana-memory.mjs`
- `packages/nana-pack/lib/memory-run.mjs`
- `packages/nana-pack/lib/profile-sync.mjs`
- `packages/nana-pack/lib/profile-config.mjs`
- `packages/nana-pack/lib/lane-watcher.mjs`

Report each departure.

## Build

Helper moves authorized: exactly the plan's list (the land starter's spawn options move into a new `memory-start.mjs` shared by the land and the hook, and any other move the plan's Precedent names). No other private helper moves; ask in your report if you need one.

Privacy: never read the real profile clone, transcripts or `~/.claude` settings; never run `nana-setup install` against the real home; tests use a scratch HOME, a temporary profile clone with a local bare remote, and synthetic transcripts. No test calls a model. Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

Hook lane extras: add wrong-code pairs for the hook's guards and spawn-last exit (must-meets 1, 2, 6), the timeout-based entry recognition and Windows repair (4), the compare-and-swap ref update (5) and the local last-run read (7), to the lane's mutation runner, and report the run. Run `node packages/nana-setup/bin/install-check.mjs` and report its exit; a `pi post-edit` `write-error` is the known builder-environment failure.

## Show your work

The locked full suite in the foreground (`npm run test:locked`), the mutation runner and the install check.

## Done when

Rows `implemented` with backticked evidence. Green: locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, the deliverables check and `node scripts/identity-scan.mjs --root .`. Push the branch, open a draft pull request at build 1, and report the finished CI run for the new tip, including the Windows suite leg and all install-check legs. A Windows R-3104 timeout is a known flake: rerun the failed job once.
