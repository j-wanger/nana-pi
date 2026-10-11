# Change declaration — the pi seat installs on Windows

*Lane `pi-cmd-launch` · branch `feat/pi-cmd-launch` · worktree `~/nana-pi-wt/pi-cmd-launch`, based on
`main` at `0110601` (Windows in CI) · 2026-10-11. Features: SUB-013 "Connect hooks and packages
without duplication" (R-323, R-392; new R-1033), FEAT-015 "Diagnose the active environment" (R-952),
and the post-edit feature holding R-105. Order: why → plan → sol plan review (item
`pi-cmd-launch-plan`) → build → a CI run with the Windows leg → seat verification → sol build review →
astra land review → Jake accepts.*

## 1. Why

Jake uses both seats on his Windows work machine (2026-10-11). The first hosted Windows CI run
(triage: `docs/reviews/windows-ci-2026-10-11/windows-triage.md`, lane 1) found that `nana-setup
install` never registers nana-pack or nana-knowledge with pi on Windows: `stepPiRegister` runs a bare
`spawnSync("pi", …)` with no shell (`packages/nana-setup/lib/steps.mjs:984`, `:988`), which cannot
launch npm's `pi.cmd` shim, so install reports "pi is not on PATH" even when pi is installed — and the
pi seat runs without nana. Doctor skips its pi check on Windows (`lib/doctor.mjs:308`). And the
post-edit check reports a missing tool on Windows as a failed check ("exited 1"), not "could not run",
because cmd.exe exits 1 for an unknown command (`extensions/nana-post-edit.ts:155`) — R-105's own test
fails on the Windows leg.

**Observable outcome.**
1. On Windows, install finds pi's JavaScript entry point under the global npm root (the same
   `npm root -g` nana-setup already runs safely there, `lib/npm-root.mjs`) and runs it with Node —
   no `.cmd` shim, no shell, so a path with spaces passes intact — to probe pi and to run
   `pi install <dir>`. On macOS and Linux nothing changes.
2. Doctor reports pi's version on Windows through the same entry point.
3. A missing post-edit tool on Windows is reported as "could not run", never as a failed or passed
   check.
4. The Windows CI leg shows `pi-registration`, `doctor-runtime` and `post-edit-status` passing.

## 2. Requirement delta

| ID | Change | Text (draft) |
|---|---|---|
| R-1033 | added (SUB-013) | WHERE the platform is win32, the installer shall run pi through its installed package's JavaScript entry point, found under the global npm root, with Node, never through the `pi` command shim. |
| R-952 | reworded (FEAT-015; "WHERE the platform is not win32" dropped) | Doctor shall report pi's executable version, through the R-1033 entry point on win32, and use the exported install hint also used by install's missing-pi detail. |
| R-105 | unchanged text; its test must pass on the Windows leg | A missing executable shall be classified error, never passed. |

## 3. Scope

**In.** `packages/nana-setup/lib/` — one module that resolves pi's entry point on win32 (global npm
root → `@earendil-works/pi-coding-agent/package.json` → its `bin.pi` file) with an injectable
platform, environment and spawn, used by `stepPiRegister` and doctor; `packages/nana-pack/extensions/
nana-post-edit.ts` — on win32, exit 1 with cmd.exe's "is not recognized as an internal or external
command" is a missing tool (`error`); tests: `packages/nana-setup/tests/pi-registration.test.mjs`
(forced win32 with a fake global npm root holding a fake pi package whose entry records its argv,
including a directory path with a space; the real Windows leg too), `doctor-runtime.test.mjs` (the
win32 probe; gate the forced-darwin checks to POSIX), `packages/nana-pack/tests/post-edit-status.test.mjs`
(the classification on win32); `REQUIREMENTS.md`; the code map; the setup README's Windows notes if
they claim the pi check is skipped.

**NOT.** The Claude Code seat's hooks on Windows (next lane); the desk's own pi resolver (frozen);
other Windows failures in the triage; the package-coverage rules themselves.

## 4. Verification

`npm run test:locked` (macOS); a CI run on this branch's draft pull request with the three files
green on the Windows leg (needs Jake's approval to push the branch); mutation pairs: spawn `pi` bare on
win32 → the forced-win32 registration test fails; drop the cmd.exe message rule → the post-edit test
fails on Windows; quote-less argument passing → the space-in-path case fails.
