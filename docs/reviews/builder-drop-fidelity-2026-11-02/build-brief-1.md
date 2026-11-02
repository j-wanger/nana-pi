Feature: FEAT-045 · Test which builder context changes builds

Lane builder-drop-fidelity. Class: ordinary. Builder: pi-worker (small lane). An experiment branch (not landing now), built on feat/builder-drop-lessons. A free read-only diagnosis of the lean drop pilot (20 replays) found the replay environment, not the context, stopped most runs. Three harness rules caused almost all early stops; fix exactly these.

## Precedent

- `apps/bench/lib/replay-config.mjs` (`SYSTEM_READ_PATHS` line ~18; stall limit line ~12)
- `apps/bench/lib/replay.mjs` (the child PATH around line 231)
- `apps/bench/lib/replay-isolation.mjs` (suite-lock write rule line ~24; `git init -q` line ~45)
- `scripts/test-locked.mjs` (dead-holder reclaim renames to `suite.lock.stale-*`, lines ~90-94)
- `apps/bench/test/replay.test.mjs`

Report each departure.

## Build

1. git in the sandbox: every replay's git failed within its first 2 to 8 calls because the profile cannot read Apple's Command Line Tools (`/usr/bin/git` is a wrapper that loads `libxcrun.dylib` from there). Add `/Library/Developer/CommandLineTools` to `SYSTEM_READ_PATHS` (read-only) and put `/Library/Developer/CommandLineTools/usr/bin` before `/usr/bin` in the child PATH. A probe under the harness profile showed `git --version`, `init`, `commit` and `submodule` work with both changes.
2. Stale suite lock: a replay builder whose locked suite was SIGKILLed by a bash timeout left `~/.nana/suite.lock` held by a dead pid; later replays could not reclaim it because the profile allows writes only under the lock folder, so the rename to `suite.lock.stale-*` got EPERM and the suite waited silently until the stall kill. Allow writes to `suite.lock.stale-*` siblings in the profile (a regex rule), nothing wider.
3. Checkout shape: `git init -q` makes `master` with one commit; the real builds ran on `feat/<lane>` with a `main`. Initialise on the context record's recorded branch (`git init -q -b <branch>`, falling back to `feat/<lane>`), then create `main` at the start commit.

Add one test per item where the harness tests can reach it (profile text for 1 and 2; branch names for 3). Change nothing else.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Green, run locally: `node --experimental-strip-types apps/bench/test/replay.test.mjs`, `node packages/nana-pack/tests/test-runner.test.mjs`, `npm run map:check`, the requirements trace and `node scripts/identity-scan.mjs --root .` after `git add`. Also run, under the real harness profile with no model call, a probe that does `git init`, `git commit` and the suite-lock stale rename, and paste its exit codes. Commit and stop; do not push (the seat pushes).
