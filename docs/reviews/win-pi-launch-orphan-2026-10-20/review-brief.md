# Review — win-pi-launch-orphan (on Windows, a kill of install or of its relay ends an npm-installed pi, because install, its dry run and doctor start it through its Node entry), 2026-10-20 (Opus, the final reviewer)

Feature: FEAT-013 · Install and connect harness runtimes (SUB-013 · Connect hooks and packages without duplication)

Review `git diff 5ef07f7f..HEAD` on `feat/win-pi-launch-orphan` (main was `5ef07f7f` when this brief was written;
`git merge-base HEAD main` is `5ef07f7f`, the objective-path-shapes land tip). Main was `72abe19a` when the lane
branched; the seat merged `5ef07f7f` into the lane at `39c0db9f`, and main has since fast-forwarded to it. The plan of
record is `docs/reviews/win-pi-launch-orphan-2026-10-20/must-meet.md`: four must-meet checks, rows R-2300 to R-2303,
and the rewording of R-1034, R-1035 and R-1690. `plan-attack.md` holds the adversary's AMEND. The seat's Windows probe
(`win-orphan-probe.mjs`, output `win-orphan-probe-output.txt`, run 39437686060) chose BRANCH 1 before the build.
`build-brief-1.md` and `build-brief-2.md` are the two builds (c0856720; ee6b3b6c, markers, rows and one README sentence
only). The seat's record is `seat-verify-ee6b3b6c.md`: CI run 39441915006 on draft pull request #139 at c0856720, 0
failing files on macOS, Ubuntu and Windows (`ci-windows-c0856720.log` beside it; R-2300 and R-2303 pass on Windows;
install-check green on macOS and Windows with a real npm pi 1.0.2), the macOS wrong-code pairs (`seat-mutate.mjs`; 12 of
12 red on c0856720, record `seat-mutate-output-c0856720.txt`) and the independent check
(`independent-check-ee6b3b6c.md`: HOLDS, no MUST, run on c0856720). CI has not run on ee6b3b6c or 39c0db9f; the land
runs the locked suite on the reviewed tip, and the local macOS install check runs before the land.

Tree movement (`node scripts/requirements-moved.mjs --root . --base 5ef07f7f`; run at 39c0db9f, before the seat's
notes commit):

```
tree movement 5ef07f7..39c0db9: 7 rows in 1 features
FEAT-013 · Install and connect harness runtimes
  R-1034 text changed
  R-1035 text changed
  R-1690 text changed
  R-2300 new (implemented)
  R-2301 new (implemented)
  R-2302 new (implemented)
  R-2303 new (implemented)
```

CAP-04 moves from 500 to 504 rows, FEAT-013 from 189 to 193 and SUB-013 from 47 to 51. R-1034, R-1035 and R-1690 now
cover only the ComSpec route; their tests are unchanged. R-2300 and R-2303 run only on Windows and read
Windows-leg-only.

The code under review: the new `packages/nana-setup/lib/pi-invocation.mjs` (`piInvocation`: off win32 pi by name, as
main; on win32 pi-watchdog's `piLaunch`, and when pi's npm package resolves, the running Node on the package's bin entry
with empty options; any piLaunch refusal falls back to `winCommand` with ComSpec in any key case), and its two callers:
`stepPiRegister` in `packages/nana-setup/lib/steps.mjs` and doctor's pi block in `packages/nana-setup/lib/doctor.mjs`,
which loses its inline ComSpec block. Both pass `isFile` and `readText` beside `exists`. `bounded-spawn.mjs`, its relay,
`win-command.mjs` and `pi-watchdog.mjs` are unchanged. Tests: `packages/nana-setup/tests/pi-launch-limits.test.mjs`
(R-2300 to R-2303, a new npm fixture option, `observeParentKill` taking it). The setup README's Windows lookup paragraph,
Idempotence and Known limits change with it. The rest of the diff is the plan, the probe, the seat's records, the
generated code map and tree, HANDOFF and the session entry, plus what the merge of 5ef07f7f brought.

Judge whether, on Windows, a kill of install alone, or of the relay alone, now ends every process an npm pi launch
started; whether install, its dry run and doctor start that pi with its arguments, time limit and install's agent folder
unchanged and without ComSpec, a checkout path holding `%` and `!` included; whether every pi with no resolvable npm
package (none beside the shim, another package, a missing or folder entry, a bad package.json) still takes main's
ComSpec route with R-1035's refusals intact; whether macOS and Linux launch pi exactly as main does; and whether the
tests' child processes stay inside the temp folders they own and end.

Threat model: honest variation in our tools' output and the OS is in scope (process deaths such as Task Manager's end
task, a parent tool's or CI's kill of install and install's backstop kill of an overrunning relay; npm, pnpm, Volta and
pi.dev layouts; checkout paths holding `%` or `!`; ComSpec in any key case; macOS, Linux and Windows); deliberate
forgery is out, such as a pi that leaves its job on purpose or a forged package manifest.
Lane class: install, hook or gate — how nana-setup install, its dry run and doctor launch pi on Windows.

Check: (1) the must-meet checks are not vacuous: each macOS pair turns its named checks red (M1 to M12), R-2300 and
R-2303 pass on the Windows leg, and their red half rests on the seat's probe of main's route on a stand-in, not on a pair
against the lane's code — judge whether any must-meet check is still unproven; (2) no fail-open: a refused direct route
always falls back to main's route, never surfaces a piLaunch refusal, and never launches a folder or a file outside
pi's package; (3) the direct route keeps the arguments, the limit and the agent folder, and drops the verbatim-arguments
flag; (4) nothing main does today stopped working: pi by name off Windows, a pi.exe or pi.com run directly, a .cmd or
.bat with no npm package through ComSpec, doctor's rows and exit codes, the dry run's stop before the first pi install,
the relay's parent check and signal grace, and both CI install-check legs; (5) the tests write only inside the temp
folders they own and leave no process running; (6) every README command and path it names runs as written, and the
README's Windows sentences now match the rows' status; (7) HANDOFF and the session entry are true, including the four
rewritten lines, the seven new residuals and the seat items; (8) any MUST.

## Chain note (the seat, after this brief was written)

Since `3405fac9`, the seat merged `5e3ae8f5`, the doctor-path-row-remedy lane's reviewed tip. Lanes land in order; each land is a fast-forward of main, so `5e3ae8f5` becomes main before this lane lands. Review this lane's own change as `git diff 5e3ae8f5...HEAD` (three dots: against the merge base) and the merge itself as `git show --remerge-diff 853cf81e` (the merge commit) if your git supports it; the generated tree, code map and R-291 leaf total were regenerated by the seat's merge helper. Tree movement now (`node scripts/requirements-moved.mjs --root . --base 5e3ae8f5`):

```
tree movement 5e3ae8f..853cf81: 7 rows in 1 features
FEAT-013 · Install and connect harness runtimes
  R-1034 text changed
  R-1035 text changed
  R-1690 text changed
  R-2300 new (implemented)
  R-2301 new (implemented)
  R-2302 new (implemented)
  R-2303 new (implemented)
```
