# Review — pi-probe-timeout (install, its dry run and doctor stop waiting for a hung pi at a named limit and end every process that launch started), 2026-10-20 (Fable, the land reviewer)

Feature: FEAT-013 · Install and connect harness runtimes (doctor rows shared with FEAT-015 · Diagnose the active environment)

Review `git diff 385c633f..HEAD` on `feat/pi-probe-timeout` (main was `385c633f` when this brief was written; `git
merge-base HEAD main` is `385c633f`). The lane branched from main `cdf4b098`, merged main `8466795b` at `4dcc19b5`
and main `385c633f` at `4d04b56e`. The plan of record is `docs/reviews/pi-probe-timeout-2026-10-20/must-meet.md`:
seven must-meet checks, rows R-2020 to R-2026; build 2 added R-2027. `plan-attack.md` holds the adversary's AMEND;
`build-brief-1.md` and `build-brief-2.md` are the two builds (4c67ba2c, then 5389875b). The seat's record is
`seat-verify-4d04b56e.md`: CI run 39384200809 at 4d04b56e, 0 failing files on macOS, Ubuntu and Windows
(`ci-windows-4d04b56e.log` beside it), the wrong-code pairs (`seat-mutate.mjs`; 23 of 24 red on 4c67ba2c, B3
survived; 27 of 29 red on 4d04b56e, S4 and S5 declared survivors) and the independent check
(`independent-check-4c67ba2c.md`: HOLDS, no MUST, 11 probes, run on build 1). The final reviewer's brief is
`review-brief.md`. The local macOS install check runs before the land.

Tree movement (`node scripts/requirements-moved.mjs --root . --base 385c633f`, the merge base):

```
tree movement 385c633..cee8967: 8 rows in 2 features
FEAT-013 · Install and connect harness runtimes
  R-2020 new (implemented)
  R-2022 new (implemented)
  R-2023 new (implemented); also applies: FEAT-015
  R-2024 new (implemented); also applies: FEAT-015
  R-2025 new (implemented)
  R-2026 new (implemented)
  R-2027 new (implemented)
FEAT-015 · Diagnose the active environment
  R-2021 new (implemented)
```

The code under review: every `pi --version` and `pi install` that install, its dry run and doctor start now runs
through `boundedSpawnSync` in the new `packages/nana-setup/lib/bounded-spawn.mjs`, which starts the relay
`packages/nana-setup/lib/bounded-spawn-child.mjs`. The relay starts pi detached on POSIX, kills pi's tree at the
limit (`PI_LAUNCH_LIMITS_MS` in `packages/nana-setup/lib/steps.mjs`: 30 s for `--version`, 120 s per `pi install`),
and on a signal passes it to pi's group and waits up to one second before the kill. `stepPiRegister` and diagnose
in `packages/nana-setup/lib/doctor.mjs` turn its ETIMEDOUT into a ✗ row naming the command and the limit. The new
test file is `packages/nana-setup/tests/pi-launch-limits.test.mjs`.

Judge whether the lane fails open: a hung pi reading ✓ or `created`, install or its dry run exiting 0 after a
stopped launch, doctor reading `all good` with pi stopped, a relay failure read as success, or a stop that leaves pi,
pi's child or the relay running. Judge whether it leaves a harm the review standard lists: data lost or corrupted in
an owner's home (pi's settings file or settings lock after a kill at the limit or on Ctrl-C), a broken install or
doctor run, or a test writing outside the temp folders and temp homes it owns or leaving a process behind. Judge
whether anything main does today stopped working: install, `install --dry-run` and doctor with a working, missing,
refused, failing or non-executable pi on macOS, Linux and Windows; the R-1034 ComSpec launch and the R-1035 refusal;
`PI_CODING_AGENT_DIR` on `pi install`; Ctrl-C during install; and both CI install-check legs, which run a real install
and doctor.

Known gaps the seat records as residuals; judge whether each is a harm the standard lists or a known bug: the relay
puts pi's stdout and stderr into one line capped at 1 MiB, so larger output reads could not start with ENOBUFS (the
independent check's known bug 2); the deadline kill gives pi no grace, by design, so a `pi install` stopped at its
limit can leave pi's settings lock (stale after about 10 s), and on a signal pi gets only one second; nobody re-ran
the independent check on build 2; a non-executable pi's message changes from `spawnSync pi EACCES` to `spawn pi
EACCES`; a pi that leaves a child holding stdout now reads as stopped at the limit; without taskkill, or with it
denied, only cmd.exe ends; Windows Ctrl-C is untested; killing nana-setup alone leaves pi until the limit; a hung pi
costs doctor two version limits on a real home with pi's packages unregistered; one more node process per launch,
about 30 ms on macOS; doctor's `node -p` and `launchctl print` probes stay unbounded; no check sends a second signal
during the grace (pair S4) or reads the relay's result after a signal (pair S5). The seat's record also notes that on
Windows the two skipped signal checks print PASS after their SKIP lines, so the file's 9 PASS lines count them; that
is not yet a HANDOFF line, so judge whether it misleads.

Threat model: honest variation in our tools' output and the OS is in scope (a pi that hangs on `--version` or
`pi install` on a stuck lock, the network or a broken install; a shim that runs pi as a child; a slow Windows cold
start; a `.cmd` pi run through cmd.exe; the owner pressing Ctrl-C; macOS, Linux, native win32 and forced win32);
deliberate forgery is out, and a pi that leaves its process group or job to escape the kill is a residual.
Lane class: install, hook or gate — install, its dry run and doctor in nana-setup.

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.
