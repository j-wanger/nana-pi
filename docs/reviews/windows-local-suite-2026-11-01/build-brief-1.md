Feature: FEAT-031 · Run checks reliably and without contaminating work

Lane windows-local-suite. Class: ordinary. Builder: pi-worker (small lane). Build session 1. This build runs on a Windows 11 laptop. Shell commands run in PowerShell or Git Bash; Node is on PATH.

Build to the plan of record, `docs/reviews/windows-local-suite-2026-11-01/plan.md` (revision 2), which has taken the adversary's attack in `plan-attack.md`. Build rows R-3450 to R-3455 and must-meet M1 to M6 exactly as its Must-meet section says. Requirements first: add the six rows to the FEAT-031 table in `REQUIREMENTS.md` as `planned`, then write the tagged tests, then the changes, then set each row `implemented` with backticked `file::title` evidence.

Why this lane exists: on a Windows laptop whose environment spells the variable `Path`, whose `tar` is the System32 bsdtar, and which is slower than the seat Mac, the locked suite fails in `restore`, the three pi lookup tests, and two files over the 300 s default per-file limit. Issue #213 holds the evidence. `timings-before.txt` in the lane folder holds per-check timings. It is a test-only lane: change no file under `packages/*/lib`, `packages/*/bin` or `scripts`. Never edit `packages/nana-pack/lib/test-runner-config.mjs`; if a must-meet seems to need it, stop and report.

## Show your work

- Before moving any check, record the check-name lists of `profile-store.test.mjs` and `review-ledger.test.mjs` from a run on this machine (every `PASS`/`FAIL`/`SKIP` line's name, sorted) to `names-before-win32.txt` in the lane folder. After the split, record the same for the new file set to `names-after-win32.txt`. The two must be equal multisets. The seat supplies the POSIX lists.
- For each review-ledger block A3 names that you move, record repo A's `git rev-parse HEAD` and `git status --porcelain` at the block's entry, before and after the split, into `repo-a-state.txt`. They must be equal. Use a temporary print you remove before committing.
- For M2's mutation, remove the slash normalization temporarily, run `restore.test.mjs`, save its output to `m2-mutation-win32.txt`, then restore the code.
- Save local runs of `restore`, `env-path`, `pi-launch-limits`, `pi-registration` and `win32-launch` to `local-runs-win32.txt`.
- Run the locked full suite as a plain foreground command with its output on screen, `npm run test:locked` with no filter, and save its file table to `suite-run-win32.txt`. This is M5's and M6's 240 s evidence.

## Done when

- M1 to M6 hold.
- `RUN_ALONE` is unchanged.
- Every moved check keeps its `// req:` tag, and every `REQUIREMENTS.md` evidence cell and `packages/nana-pack/README.md` line that names a moved check or file points at its new home.
- The locked full suite passes on this machine except these known failures: `post-edit-utf8` (no Python here) and `template-acceptance` (no uv here). Do not install Python or uv.
- `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs --root .` are green.
- `docs/known-bugs/FEAT-031.md` has its time-out lines updated, and `docs/known-bugs/FEAT-013.md` has one new line for `envValue`'s first-match rule (plan, Purpose).
- No committed text names a person or a machine path: write `%APPDATA%` or `<home>`.
- Commit explicit paths on `feat/windows-local-suite`. Do not push; the seat pushes.

Report: every row and test changed; the before/after name counts; the per-file seconds for every profile-store and review-ledger file in the full run; whether O2's fallback was needed; each departure from the Precedent.

## Precedent

- `packages/nana-setup/tests/restore.test.mjs`: the archive check, its split (line 128), forbidden list (line 104) and guard (line 152).
- `packages/nana-setup/lib/state-manifest.mjs`: the secret and disposable rows the forbidden list derives from.
- `packages/nana-pack/tests/pi-install.mjs`: line 44 already splits command output on `/\r?\n/`.
- `packages/nana-pack/lib/win-command.mjs`: `envValue` and `findOnPath`, the lookup the helper feeds (unchanged).
- `packages/nana-setup/lib/install-check.mjs`: lines 333-336, the spelling-preserving env pattern the helper deliberately does not copy.
- `packages/nana-pack/tests/memory-run.test.mjs`: with its `-recovery`, `-seals` and `-fixture` siblings, the split-suite shape both splits follow.
- `packages/nana-pack/tests/profile-fixture.mjs`: the shared fixture both profile-store files import.
- `packages/nana-pack/lib/test-runner-config.mjs`: `RUN_ALONE`, read-only for this lane.
