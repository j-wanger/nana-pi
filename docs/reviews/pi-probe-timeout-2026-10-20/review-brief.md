# Review — pi-probe-timeout (install, its dry run and doctor stop waiting for a hung pi at a named limit and end every process that launch started), 2026-10-20 (Opus, the final reviewer)

Feature: FEAT-013 · Install and connect harness runtimes (doctor rows shared with FEAT-015 · Diagnose the active environment)

Review `git diff 385c633f..HEAD` on `feat/pi-probe-timeout` (main was `385c633f` when this brief was written; `git
merge-base HEAD main` is `385c633f`). The lane branched from main `cdf4b098`, merged main `8466795b` (the
doctor-fix-line land) at `4dcc19b5` and main `385c633f` (the hook-deadlines land tip) at `4d04b56e`. The plan of
record is `docs/reviews/pi-probe-timeout-2026-10-20/must-meet.md`: seven must-meet checks, rows R-2020 to R-2026;
build 2 added R-2027. `plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` and `build-brief-2.md` are the
two builds (4c67ba2c, then 5389875b). The seat's record is `seat-verify-4d04b56e.md`: CI run 39384200809 on draft pull
request #107 at 4d04b56e, 0 failing files on all three legs (the Windows suite log `ci-windows-4d04b56e.log` beside
it), the wrong-code pairs (`seat-mutate.mjs`; `seat-mutate-output-4c67ba2c.txt`, 23 of 24 red, B3 survived;
`seat-mutate-output-4d04b56.txt`, 27 of 29 red, S4 and S5 declared survivors) and the independent check
(`independent-check-4c67ba2c.md`: HOLDS, no MUST, 11 probes, run on build 1; its known bug 1 is fixed in build 2
with R-2027, and its known bug 2 is a HANDOFF residual). The local macOS install check runs before the land.

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

CAP-04 moves from 443 to 451 rows, FEAT-013 from 165 to 172 (SUB-013 from 34 to 41) and FEAT-015 from 113 to 114.
No existing row changed.

The code under review: the new `packages/nana-setup/lib/bounded-spawn.mjs` (`boundedSpawnSync`, spawnSync's result
shape, the relay started through `process.execPath` with the spec on stdin, `env: options.env ?? process.env`, an
outer timeout of the limit plus `RELAY_BACKSTOP_MS`, and the chosen `RELAY_SETTLE_MS`, `RELAY_SIGNAL_GRACE_MS` and
`RELAY_BACKSTOP_MS`) and the new `packages/nana-setup/lib/bounded-spawn-child.mjs` (pi detached on POSIX, no
`windowsHide`, `windowsVerbatimArguments` passed through; at the deadline SIGKILL to pi's group or taskkill with
`TASKKILL_ARGS` on win32, falling back to the child alone, then ETIMEDOUT after the pipes close or
`RELAY_SETTLE_MS`; on SIGINT, SIGTERM or SIGHUP the signal passed to pi's group, up to `RELAY_SIGNAL_GRACE_MS` for pi
to close, then the tree kill and exit 128 + the signal number; one JSON line, then `process.exit`). In
`packages/nana-setup/lib/steps.mjs`: `PI_LAUNCH_LIMITS_MS` above `stepPiRegister`, which now defaults its spawn to
`boundedSpawnSync`, takes an injectable `limits`, passes a timeout per launch and returns a PROBLEM row on ETIMEDOUT
for `pi --version` and for each `pi install <dir>`. In `packages/nana-setup/lib/doctor.mjs`: diagnose's pi probe
uses `opts.pi.spawn ?? boundedSpawnSync` and `opts.pi.limits ?? PI_LAUNCH_LIMITS_MS`, with an ETIMEDOUT detail. Tests:
the new `packages/nana-setup/tests/pi-launch-limits.test.mjs`. The setup README gains one Idempotence sentence and a
tests-table row.

Judge whether a hung `pi --version` or `pi install` now stops install, the dry run and doctor at the named limit with
a ✗ row that names the command and the limit, and install and the dry run exit 1; whether every process that launch
started ends, pi's own child included, on macOS, Linux and native Windows; whether Ctrl-C, SIGTERM and SIGHUP still
end pi's launch, with SIGINT reaching pi before the kill; and whether every result main gives today for a working,
missing, refused, failing or non-executable pi is unchanged apart from the declared EACCES wording.

Threat model: honest variation in our tools' output and the OS is in scope (a pi that hangs on `--version` or
`pi install` on a stuck lock, the network or a broken install; a shim that runs pi as a child; a slow Windows cold
start; a `.cmd` pi run through cmd.exe; the owner pressing Ctrl-C; macOS, Linux, native win32 and forced win32);
deliberate forgery is out, and a pi that leaves its process group or job to escape the kill is a residual.
Lane class: install, hook or gate — install, its dry run and doctor in nana-setup.

Check: (1) the must-meet checks and R-2027's two checks are not vacuous: each fails on main's code or on the wrong
code its pair names, and R-2020 to R-2022's elapsed bound now tells the relay's own stop from the backstop's; (2) no
process outlives a stopped launch, and no relay is left behind, on any platform the checks run; (3) the signal path:
SIGINT reaches pi's group before the kill, a pi that ignores the signal still ends after the grace, and a second
signal kills at once; (4) nothing main does today stopped working: a working pi's rows on macOS, Linux and Windows,
the ENOENT skip, the R-1035 refusal that spawns nothing, the R-1034 ComSpec launch, `PI_CODING_AGENT_DIR` on
`pi install`, the exit codes, doctor under `--home`, and both CI install checks; (5) the declared Windows result:
pi-launch-limits prints 9 PASS and 2 SKIP lines there, and the two skipped checks also print PASS, so seven checks ran
natively; judge whether that count misleads; (6) the tests write only inside the temp folders and temp homes they
own, and clean up, killing any process they started; (7) HANDOFF and the session entry are true, including the
removed install-dry-run-pi-packages residual, the lane's new residuals and the edited builder-briefs line; (8) any
MUST.
