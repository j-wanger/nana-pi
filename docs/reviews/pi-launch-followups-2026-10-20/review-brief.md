# Review — pi-launch-followups (on macOS and Linux, killing install ends its pi launch too, with pi's grace kept, and pi output up to 1 MiB a stream reads as pi's own result again), 2026-10-20 (Opus, the final reviewer)

Feature: FEAT-013 · Install and connect harness runtimes

Review `git diff 54f1271f..HEAD` on `feat/pi-launch-followups` (`git merge-base HEAD main` is `54f1271f`, the
config-advice-fixes land tip, which the lane merged at `86240f7f`; main was `54f1271f` then and has since moved to
`54433844` through four lands that touch no lane module or test file). The lane branched from main `15703d8d`, the
pi-probe-timeout land tip. The plan of record is `docs/reviews/pi-launch-followups-2026-10-20/must-meet.md`: four
must-meet checks, rows R-2130 to R-2133. `plan-attack.md` holds the adversary's AMEND, which added R-2133 and the hang
fixture's SIGINT-ignoring switch; `build-brief-1.md` is the one build (8ec28199). The seat's record is
`seat-verify-86240f7f.md`: CI run 39399980825 on draft pull request #120 at 86240f7f, 0 failing files on all three
legs (the Windows suite log `ci-windows-86240f7f.log` beside it), the wrong-code pairs (`seat-mutate.mjs`;
`seat-mutate-output-86240f7f.txt`, 9 of 10 red, pair 6 a declared survivor) and the independent check
(`independent-check-86240f7f.md`: HOLDS, no MUST, 7 probes, run on 86240f7f). The local macOS install check runs
before the land.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, which reads from the merge base):

```
tree movement 54f1271..8d4783e: 4 rows in 1 features
FEAT-013 · Install and connect harness runtimes
  R-2130 new (implemented)
  R-2131 new (implemented)
  R-2132 new (implemented)
  R-2133 new (implemented)
```

CAP-04 moves from 464 to 468 rows, FEAT-013 from 172 to 176 (SUB-013 from 41 to 45). No existing row changed.

The code under review: in `packages/nana-setup/lib/bounded-spawn.mjs`, the outer spawnSync that starts the relay is
`detached` on POSIX only, takes `maxBuffer: RELAY_RESULT_MAX_BYTES` (16 MiB, chosen) and passes
`parentPid: process.pid` in the launch spec; `RELAY_PARENT_POLL_MS` (200 ms, chosen) is new. In
`packages/nana-setup/lib/bounded-spawn-child.mjs`, POSIX only, an unref'd interval compares `process.ppid` with
`spec.parentPid`; on a change it clears itself and calls `terminate("SIGINT")` only when no termination is in
progress. The deadline, Windows and signal-handler paths are unchanged. Tests:
`packages/nana-setup/tests/pi-launch-limits.test.mjs` gains the hang fixture's `IGNORE_SIGINT`, the cleanup
fixture's `CLEANUP_DELAY_MS`, a large-output fixture, four checks, and a skip result for each win32 skip. The setup README gains one Idempotence
sentence and extends the pi-launch-limits row of its test table.

Judge whether, on macOS and Linux, a SIGKILL of install's whole process group or of install alone now ends every
process the pi launch started within one parent check plus the signal grace; whether pi still gets its full signal
grace on Ctrl-C, alone or when a supervisor signals install and the relay together; whether a `pi install` that writes
up to 1 MiB to each stream now reads from pi's exit status and last error line on every platform; whether Windows
behaves as main apart from the larger output cap; and whether every result main gives today is unchanged: a working,
hung, missing, refused or failing pi, in install, the dry run and doctor, and Ctrl-C, SIGTERM and SIGHUP to install's
group.

Threat model: honest variation in our tools' output and the OS is in scope (a pi hung on a lock or the network, a pi
that cannot run its signal handlers, a pi slow to clean up, large pi output, a supervisor or `timeout -s KILL` that
kills install by process group, a kill of install alone, a supervisor that signals install and the relay at once;
macOS, Linux and native win32); deliberate forgery is out, and a pi that leaves its own group or session is a
residual.
Lane class: install, hook or gate — the relay behind every pi launch of install, its dry run and doctor in
nana-setup.

Check: (1) the must-meet checks are not vacuous: each fails on main's code or on the wrong code its pair names, and
R-2133 tells the fixed watch from the watch as first worded (W7) and from one that ignores a termination in progress
(W8); (2) no process outlives an ended launch on macOS and Linux, and no relay is left behind once install dies; (3)
the signal path: pi's full grace on the new path, one termination when install and the relay are both signalled, and
the deadline path unchanged; (4) nothing main does today stopped working: a working pi's rows on all three legs,
R-2026 and R-2027's signal checks, the R-1034 ComSpec launch and the R-1035 refusal, `PI_CODING_AGENT_DIR` on
`pi install`, the exit codes, and both CI install checks; (5) the declared Windows result: pi-launch-limits prints 8 PASS
and 5 SKIP lines there, each skip one line with its reason; (6) the tests write only inside the temp folders and temp
homes they own, and kill every process they start; (7) the declared survivor (pair 6, a watch for a parent of pid 1)
and the known limits are recorded honestly; (8) HANDOFF and the session entry are true, including the two removed
residuals, the four reworded ones and the new ones; (9) any MUST.
