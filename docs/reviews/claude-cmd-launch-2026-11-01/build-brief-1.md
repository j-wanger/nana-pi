Feature: FEAT-040 · Make and keep memory

Lane claude-cmd-launch. Class: ordinary. Builder: pi-worker (small lane). Build session 1. This build runs on a Windows 11 laptop; shell commands run in PowerShell or Git Bash, and Node is on PATH. This laptop has a native `claude.exe` on PATH; do not change that install.

Build to the plan of record, `docs/reviews/claude-cmd-launch-2026-11-01/plan.md` (revision 2), which has taken the adversary's attack in `plan-attack.md`. Build rows R-3470 to R-3474 and must-meet M1 to M4 exactly as its Must-meet section says. M5 is the seat's: add row R-3474 as `untested`, with evidence `docs/reviews/claude-cmd-launch-2026-11-01/real-npm-claude-win32.txt`, but do not install Claude Code or make model calls yourself. Requirements first: rows, then tagged tests, then code.

Why this lane exists: memory making never makes memory on a Windows machine whose only Claude Code is npm-installed. `spawnSync("claude")` fails with ENOENT there, and the shared `winCommand` refuses the runner's quoted JSON schema. `probe-npm-claude.txt` in the lane folder shows the real npm layout and a successful direct start of the package's `bin/claude.exe`.

Constraints:
- Do not edit `packages/nana-pack/lib/win-command.mjs`, `win-command-config.mjs`, `packages/nana-pack/bin/review-launch.mjs`, `pi-worker.mjs`, `claude-review.mjs` or any hook or extension; that would change the lane class.
- Existing runner tests must pass without edits: an injected spawn keeps receiving `("claude", args, options)`.
- Off win32 the runner's spawn is unchanged.

## Show your work

- Before writing code, run the new `claude-launch.test.mjs` checks against a stub resolver and save the failing output (red) to `build-1-red.txt`; after, save the passing output to `build-1-green.txt`.
- For M3, run `memory-shaping.test.mjs`, `outcome-meter.test.mjs` and `memory-replay.test.mjs` unchanged and save their summary lines to `build-1-runner-tests.txt`.
- Run the locked full suite as a plain foreground command, `npm run test:locked` with no filter, with its output on screen.

## Done when

- M1 to M4 hold; R-3470 to R-3473 are `implemented` with backticked `file::title` evidence; R-3474 is `untested` with its evidence path.
- FEAT-040's A6 line is removed, and one line records that a scripts-disabled npm install fails safe and makes no memory (plan A2).
- The locked full suite passes on this machine except these known failures: `post-edit-utf8` (no Python) and `template-acceptance` (no uv). `land.test.mjs` may time out under load here; report its time.
- `npm run map:check`, `npm run readme:check`, `node scripts/requirements-trace.mjs`, `node scripts/requirements-tree.mjs --check`, `node scripts/known-bugs.mjs --root .` and `node scripts/identity-scan.mjs --root .` are green.
- No committed text names a person or a machine path: write `%APPDATA%` or `<prefix>`.
- Commit explicit paths on `feat/claude-cmd-launch`. Do not push; the seat pushes.

Report: every row and test changed; the red and green check names; the suite summary line; each departure from the Precedent.

## Precedent

- `packages/nana-pack/bin/pi-watchdog.mjs`: `piLaunch` (lines 52-93), the npm-shim resolution the new resolver follows step for step.
- `packages/nana-pack/bin/worker-config.mjs`: `NPM_DIRS`, the shared npm folder names.
- `packages/nana-pack/lib/win-command.mjs`: `findOnPath`, imported and unchanged.
- `scripts/memory-shape-runners.mjs`: `claudeRunner` and `options()`; only the default spawn changes.
- `apps/bench/lib/catch-judge.mjs`: `callJudge`, the argument list that must arrive unchanged.
- `packages/nana-pack/tests/memory-shaping.test.mjs`: the existing runner tests that must pass unedited.
