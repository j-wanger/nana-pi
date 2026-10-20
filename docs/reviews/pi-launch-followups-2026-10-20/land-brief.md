# Review — pi-launch-followups (on macOS and Linux, killing install ends its pi launch too, with pi's grace kept, and pi output up to 1 MiB a stream reads as pi's own result again), 2026-10-20 (Fable, the land reviewer)

Feature: FEAT-013 · Install and connect harness runtimes

Review `git diff 54f1271f..HEAD` on `feat/pi-launch-followups` (`git merge-base HEAD main` is `54f1271f`, the
config-advice-fixes land tip, which the lane merged at `86240f7f`; main was `54f1271f` then and has since moved to
`54433844` through four lands that touch no lane module or test file). The lane branched from main `15703d8d`, the
pi-probe-timeout land tip. The plan of record is `docs/reviews/pi-launch-followups-2026-10-20/must-meet.md`: four
must-meet checks, rows R-2130 to R-2133. `plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` is the one
build (8ec28199). The seat's record is `seat-verify-86240f7f.md`: CI run 39399980825 at 86240f7f, 0 failing files on
macOS, Ubuntu and Windows (`ci-windows-86240f7f.log` beside it), the wrong-code pairs (`seat-mutate.mjs`; 9 of 10 red
on 86240f7f, pair 6 a declared survivor) and the independent check (`independent-check-86240f7f.md`: HOLDS, no MUST,
7 probes, run on 86240f7f). The final reviewer's brief is `review-brief.md`. The local macOS install check runs
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

The code under review: every `pi --version` and `pi install` that install, its dry run and doctor start runs through
`boundedSpawnSync` in `packages/nana-setup/lib/bounded-spawn.mjs`, which starts the relay
`packages/nana-setup/lib/bounded-spawn-child.mjs`. On POSIX the relay now starts detached, in its own session, so a
kill of install's process group no longer reaches it; it learns of install's death by comparing `process.ppid` with
the parent pid in its spec every `RELAY_PARENT_POLL_MS` (200 ms), then passes SIGINT to pi's group, waits up to
`RELAY_SIGNAL_GRACE_MS` (1 s) and kills the tree. On every platform the outer spawnSync takes
`RELAY_RESULT_MAX_BYTES` (16 MiB) as its output cap. Windows is otherwise unchanged. The test file is
`packages/nana-setup/tests/pi-launch-limits.test.mjs`.

Judge whether the lane fails open: a relay that ends a working pi while install still runs (so install reads a stop or
a failure), a relay that outlives install with no end, a launch whose processes outlive an ended launch, a failed
`pi install` reading `created`, install or its dry run exiting 0 after a failed launch, or doctor reading all good
with pi stopped. Judge whether it leaves a harm the review standard lists: data lost or corrupted in an owner's home
(pi's settings file or settings lock when pi's grace is cut short), a broken install or doctor run, or a test writing
outside the temp folders and temp homes it owns or leaving a process behind. Judge whether anything main does today
stopped working: install, `install --dry-run` and doctor with a working, missing, refused, failing or hung pi on
macOS, Linux and Windows; Ctrl-C, SIGTERM and SIGHUP during install (R-2026, R-2027); the R-1034 ComSpec launch and
the R-1035 refusal; `PI_CODING_AGENT_DIR` on `pi install`; and both CI install-check legs, which run a real install
and doctor.

Known gaps the seat records as residuals; judge whether each is a harm the standard lists or a known bug: the deadline
kill still gives pi no grace (not built: by pi 1.0.2's source, pi holds its settings lock only inside one synchronous
read and write); output above 16 MiB once escaped still reads ENOBUFS with status 0, and the relay holds pi's output
in memory until pi ends; Ctrl-Z stops only install, so the relay and pi run on until the limit; a second Ctrl-C no
longer cuts pi's grace short, since install is gone and the shell gets it; Ctrl-C reaches pi up to one parent check
later, and pi gets SIGINT whatever signal ended install; a SIGKILL of the relay itself leaves pi running; on Windows a
kill of install alone still leaves pi until its limit, and a stuck relay's backstop ends only the relay; a launch
error from `pi install` reads `failed:` where the version checks say `could not start`; pair 6 (a watch for a parent
of pid 1) survives on macOS, and could differ on Linux under a subreaper or a container's init (inferred, not run);
the independent check and the pairs ran on macOS only, so CI's Ubuntu leg, which does not block release, is the only
Linux run, and CI is the only Windows run.

Threat model: honest variation in our tools' output and the OS is in scope (a pi hung on a lock or the network, a pi
that cannot run its signal handlers, a pi slow to clean up, large pi output, a supervisor or `timeout -s KILL` that
kills install by process group, a kill of install alone, a supervisor that signals install and the relay at once;
macOS, Linux and native win32); deliberate forgery is out, and a pi that leaves its own group or session is a
residual.
Lane class: install, hook or gate — the relay behind every pi launch of install, its dry run and doctor in
nana-setup.

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.

## Chain note (the seat, after this brief was written)

Since `5b18f8ba`, the seat merged `07f8f6f9`, the post-edit-timeout-name lane's reviewed tip. Lanes land in order; each land is a fast-forward of main, so `07f8f6f9` becomes main before this lane lands. Review this lane's own change as `git diff 07f8f6f9...HEAD` (three dots: against the merge base) and the merge itself as `git show --remerge-diff f6bed495` (the merge commit) if your git supports it; the generated tree, code map and R-291 leaf total were regenerated by the seat's merge helper. Tree movement now (`node scripts/requirements-moved.mjs --root . --base 07f8f6f9`):

```
tree movement 07f8f6f..f6bed49: 4 rows in 1 features
FEAT-013 · Install and connect harness runtimes
  R-2130 new (implemented)
  R-2131 new (implemented)
  R-2132 new (implemented)
  R-2133 new (implemented)
```
