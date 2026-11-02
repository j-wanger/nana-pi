Feature: FEAT-045 · Test which builder context changes builds

Lane builder-drop. Class: ordinary. Builder: pi-worker (small lane). Build session 4, on the merged branch tip b2f142f8. CI run 41442937091 failed on two causes, both in this lane's harness:

1. All three systems: `packages/nana-pack/tests/process-tree.test.mjs` R-2661. `apps/bench/lib/replay.mjs:138` probes a process group with `process.kill(-group, 0)`; the repository allows negative-pid and taskkill lines only in the shared process-tree module and its declared exceptions.
2. Windows only: `apps/bench/test/replay.test.mjs` fails 2 of 8 checks. Read their names and messages with `gh run view 41442937091 --log-failed` (the windows-latest leg). The replay itself runs only inside the macOS sandbox.

## Precedent

- `packages/nana-pack/lib/process-tree.mjs` (the shared tree probe and kill; import it, never copy it)
- `packages/nana-pack/lib/tree-kill-scan.mjs` (`TREE_KILL_EXCEPTIONS`; do not add an exception)
- the runner's declared Windows skip list in `packages/nana-pack/tests/test-runner.test.mjs` (case J) and any existing `process.platform` skip in `apps/bench/test/`

Standing authorization: when a Precedent file has a private helper this lane needs, export it from its own module (never copy, never move it) and report each export as a departure.

Report each departure.

## Build

1. Make `replay.mjs`'s liveness probe use the shared process-tree module's probe instead of its own negative-pid call; keep the same behaviour on macOS.
2. For each failing Windows check: if it depends on the macOS sandbox, skip it off darwin with a stated reason, the way the precedent skips platform-only checks; if it is a real Windows bug in code that should run there, fix it. Report which and why for each.

Change nothing else. Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Green, run locally: `node packages/nana-pack/tests/process-tree.test.mjs`, `node apps/bench/test/replay.test.mjs`, `node packages/nana-pack/tests/test-runner.test.mjs`, `npm run map:check`, the requirements trace, the known-bugs check and `node scripts/identity-scan.mjs --root .` after `git add`. Do not run the locked full suite; CI is the suite. Push and stop.
