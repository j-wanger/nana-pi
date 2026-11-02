Feature: FEAT-002 · Resume decisions and next actions

Lane issue-watch-cli-limit. Class: ordinary. Builder: pi-worker (small lane). Build session 2, on branch tip d88c5e46 after build 1. This build runs on the reference Windows 11 laptop; shell commands run in PowerShell or Git Bash, and Node is on PATH.

The plan of record is unchanged: `docs/reviews/issue-watch-cli-limit-2026-11-02/plan.md`, with Revision 2 overriding the sections above it. The seat verified build 1. Its design holds, with two findings.

Standing authorization: when a Precedent file has a private helper this lane needs, export it from its own module (never copy, never move it) and report each export as a departure.

## Build

1. MUST: the R-3704 hang check waits out the whole `CLI_DEADLINE_MS` (20 s). That makes `issue-watch.test.mjs` take 27 s on every suite run instead of about 4 s (`timing.txt`). Fix it so a hang after the restart line fails fast:
   - Once the restart line has appeared on stdout, the child must close within a new sealed `CLI_EXIT_GRACE_MS`. Choose its value with provenance: exit after the restart line spawns nothing, so a few seconds is generous.
   - If the child does not close in time, the same timeout owner diagnoses "no exit after restart", kills the tree, waits for close within `CLI_CLEANUP_MS`, and rejects.
   - `CLI_DEADLINE_MS` still bounds every other missing signal.
   - R-3704's elapsed-time assertion uses the grace path.
   - Add the new value to R-3705's seal.
   - Record the file's 10-run wall times again in `timing.txt`. Target: under 15 s per run.
2. SHOULD: recompute the case-guard sum in `timing.txt` with the new value. If the worst case leaves less than 30 s spare under the 300 s per-file limit, say so in the report. Do not change other checks' limits.

Change nothing else.

## Done when

- `wrong-code.txt` gains R-3704 run against build 1's harness (passes only after the full deadline, so it fails the new elapsed bound) and against yours (passes).
- Green, run locally: `node packages/nana-pack/tests/issue-watch.test.mjs` 10 times; `node packages/nana-pack/tests/frontier-summary.test.mjs`; `node packages/nana-pack/tests/test-runner.test.mjs`; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `node scripts/known-bugs.mjs --root .`; and `node scripts/identity-scan.mjs --root .` after `git add`.
- Commit explicit paths on `feat/issue-watch-cli-limit`.

Report the grace value and its provenance, the new times, the guard sum and each departure. Commit, do not push, and stop. Report the full tip.

## Precedent

- `packages/nana-pack/tests/issue-watch.test.mjs`: `runCli`, its timeout owner, and the R-3703 to R-3705 checks from build 1.
- `packages/nana-pack/tests/issue-watch-timing.mjs`: the sealed values and their provenance comments.
- `docs/reviews/issue-watch-cli-limit-2026-11-02/timing.txt`: build 1's times and guard sum.
