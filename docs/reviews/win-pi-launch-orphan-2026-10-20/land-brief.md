# Review — win-pi-launch-orphan (on Windows, a kill of install or of its relay ends an npm-installed pi, because install, its dry run and doctor start it through its Node entry), 2026-10-20 (pi gpt-6-astra, the land reviewer)

Feature: FEAT-013 · Install and connect harness runtimes (SUB-013 · Connect hooks and packages without duplication)

Review `git diff 5ef07f7f..HEAD` on `feat/win-pi-launch-orphan` (main was `5ef07f7f` when this brief was written;
`git merge-base HEAD main` is `5ef07f7f`, the objective-path-shapes land tip). Main was `72abe19a` when the lane
branched; the seat merged `5ef07f7f` into the lane at `39c0db9f`, and main has since fast-forwarded to it. The plan of
record is `docs/reviews/win-pi-launch-orphan-2026-10-20/must-meet.md`: four must-meet checks, rows R-2300 to R-2303,
and the rewording of R-1034, R-1035 and R-1690. `plan-attack.md` holds the adversary's AMEND. The seat's Windows probe
(`win-orphan-probe.mjs`, output beside it, run 39437686060) chose BRANCH 1 before the build: main's Command Prompt route
left pi and its child alive 5 s after a kill of install or of the relay; the direct Node route ended them all within
about 51 ms. `build-brief-1.md` and `build-brief-2.md` are the two builds (c0856720; ee6b3b6c, markers, rows and one
README sentence only). The seat's record is `seat-verify-ee6b3b6c.md`: CI run 39441915006 at c0856720, 0 failing files
on macOS, Ubuntu and Windows (`ci-windows-c0856720.log` beside it; R-2300 and R-2303 pass on Windows; install-check green
on macOS and Windows with a real npm pi 1.0.2), the macOS wrong-code pairs (`seat-mutate.mjs`; 12 of 12 red on
c0856720) and the independent check (`independent-check-ee6b3b6c.md`: HOLDS, no MUST, run on c0856720). The final
reviewer's brief is `review-brief.md`. CI has not run on ee6b3b6c or 39c0db9f; the land runs the locked suite on the
reviewed tip, and the local macOS install check runs before the land.

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

The code under review: the new `packages/nana-setup/lib/pi-invocation.mjs`, which every pi launch in install, its dry
run and doctor now goes through, and its two callers, `stepPiRegister` in `lib/steps.mjs` and doctor's pi block in
`lib/doctor.mjs`. Off Windows it starts pi by name, as main does. On Windows it asks pi-watchdog's `piLaunch` for pi's
npm package; when that resolves, it starts the running Node on the package's bin entry, with no ComSpec. Any refusal
falls back to main's `winCommand` route through ComSpec, with R-1035's character refusals. The relay
(`bounded-spawn.mjs` and its child), `win-command.mjs` and `pi-watchdog.mjs` are unchanged.

Judge whether the lane fails open: a pi launched outside the relay or without its time limit, a pi package install that
reports created when pi did not run, a ComSpec launch that skips R-1035's refusals, a launch of a folder or of a file
outside pi's package, a refusal that surfaces where main fell back, or a check that passes with the change removed.
Judge whether it leaves a harm the review standard lists, such as a broken install or doctor on any platform, a pi
settings file or lock left damaged by the new kill path, a test writing outside its temp folders, or a test leaving a
process running. Judge whether anything main does today stopped working: pi by name on macOS and Linux, a pi.exe or
pi.com on Windows, a .cmd or .bat pi with no npm package, install's rows and exit codes, the dry run's stop before the
first pi install, doctor's pi executable row, the relay's parent check and signal grace on macOS and Linux, and both CI
install-check legs.

Known gaps the seat records as residuals; judge whether each is a harm the standard lists or a known limit: a `.cmd` pi
with no resolvable npm package (pi.dev installer, pnpm, Volta) keeps the Command Prompt route, so a kill of install or of
the relay still leaves it running; on Windows a kill of install, or Ctrl-C, now ends an npm pi with no grace, and pi
writes its settings file with a plain write, so a kill during that write could cut it short (inferred; macOS and Linux
have the same exposure after the one-second grace); the launch sends a `.bat` pi with its npm package to the Node entry,
while R-2301 and R-1690 say `.cmd`; when both routes refuse, only the ComSpec reason shows, as on main; pi runs on the
Node that runs install; a process pi starts through Command Prompt leaves the chain Windows ends with install; no check
kills doctor alone; on macOS and Linux a kill of the relay alone still leaves pi running. The pairs and the independent
check ran on macOS only, so CI is the only Linux and native Windows run.

Threat model: honest variation in our tools' output and the OS is in scope (process deaths such as Task Manager's end
task, a parent tool's or CI's kill of install and install's backstop kill of an overrunning relay; npm, pnpm, Volta and
pi.dev layouts; checkout paths holding `%` or `!`; ComSpec in any key case; macOS, Linux and Windows); deliberate
forgery is out, such as a pi that leaves its job on purpose or a forged package manifest.
Lane class: install, hook or gate — how nana-setup install, its dry run and doctor launch pi on Windows.

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.

## Chain note (the seat, after this brief was written)

Since `73664ff7`, the seat merged main `2cc63e65`, which brought linked-claude-folder-remedy (landed at 2cc63e65). Lanes land by fast-forward, so all of it is main before this lane lands. Review this lane's own change as `git diff 2cc63e65...HEAD` (three dots: against the merge base) and the merge itself as `git show --remerge-diff f28b4d60` (the merge commit) if your git supports it; the generated tree, code map and R-291 leaf total were regenerated by the seat's merge helper. Tree movement now (`node scripts/requirements-moved.mjs --root . --base 2cc63e65`):

```
tree movement 2cc63e6..f28b4d6: 7 rows in 1 features
FEAT-013 · Install and connect harness runtimes
  R-1034 text changed
  R-1035 text changed
  R-1690 text changed
  R-2300 new (implemented)
  R-2301 new (implemented)
  R-2302 new (implemented)
  R-2303 new (implemented)
```
