Feature: FEAT-040 · Make and keep memory

Lane making-session-end. Class: hook. Builder: pi-worker (small lane). Build session 3, on branch tip 2bda8638. Round 1: the final reviewer said LAND; the land reviewer sent it back for one MUST and two SHOULDs. Both texts are kept in this folder (`r1-*.md`). This build fixes the MUST and one SHOULD.

## Precedent

- `packages/nana-pack/bin/review-launch.mjs` (`launchClaude`: `findOnPath` plus `winCommand` from `packages/nana-pack/lib/win-command.mjs` to start an npm-installed `claude.cmd` on Windows)
- `scripts/memory-shape-runners.mjs` (`claudeRunner`, the spawn to fix)
- `packages/nana-pack/lib/profile-sync.mjs` (`unpushedProfile`)

Report each departure.

## Build

1. MUST (land reviewer). On Windows with an npm-installed Claude Code, `claudeRunner` calls `spawnSync("claude", …)` and every model call fails, so session-end making never makes memory there. Resolve and launch `claude` the way `review-launch.mjs` does: `findOnPath` with the Claude extensions on win32, then `winCommand` for a `.cmd` or `.bat`; keep `spawnSync("claude", …)` with the same options elsewhere. If `review-launch.mjs`'s launcher logic is a private helper, move it to `packages/nana-pack/lib/win-command.mjs` (or a new lib module) as a named export and import it from both callers; this move is authorized. Keep `windowsHide`, the input on stdin, the timeout and the env exactly. Close the FEAT-040 known-bug line "on Windows an npm-installed `claude.cmd` does not start from `spawnSync("claude")`".
   Add one must-meet test with one new row in this lane's closed range (next free ID after R-3362, at most R-3369): on win32 (injected platform, environment and existence probe), with only a `claude.cmd` on PATH, the runner's spawn receives the `cmd.exe` launch record that `winCommand` builds, and with no Claude on PATH the call fails closed with no spawn. Add one pair to `seat-mutate.mjs` that restores the bare `spawn("claude", …)` and turns the test red.
2. SHOULD (land reviewer). `unpushedProfile` throws when `refs/remotes/origin/<branch>` is missing or HEAD is detached, so `nana-memory status` prints `memory: failed` and exits 1, and doctor shows the note unreadable. Return an unavailable count instead: status keeps its run line and prints the unpushed count as `unknown`, exiting as it would otherwise; doctor keeps the last-run age. Widen the R-row that pins status's unpushed count with that case. Remove the FEAT-040 known-bug line about this throw.

The other SHOULD (a disabled repository still starts the detached run, which exits at the opt-in check) stays as the plan chose; the seat records it.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Green, run locally: the touched test files, the lane's mutation runner, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, the deliverables check and `node scripts/identity-scan.mjs --root .`. Run `node packages/nana-setup/bin/install-check.mjs` and report its exit. Do not run the locked full suite; CI is the suite. Push the branch and stop; the seat waits for CI.
