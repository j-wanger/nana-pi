# Review — win-watchdog-cpu-read (pi-review's and pi-worker's watchdog reads a busy pi's CPU time on Windows under a decimal-comma format, counts an unreadable reading as flat, and ends by pi's own exit when pi exits during a reading), 2026-10-19 (Opus, the final reviewer)

Feature: FEAT-007 · Review a specific revision independently (SUB-008 · Run and stop an isolated reviewer; FEAT-006 ·
Launch builders with execution limits shares all four rows)

Review `git diff 8a9ff9a3..HEAD` on `feat/win-watchdog-cpu-read` (main was `8a9ff9a3` when the lane last merged it;
`git merge-base HEAD main` is `8a9ff9a3`). Main has since moved to `0361bbb7` (the knowledge-unreadable-root,
hook-output-fail-open and install-dry-run-pi-packages lands), and win-claude-skills lands before this lane, so the land
needs a merge of main and a confirmation round on the merged tip. The plan of record is
`docs/reviews/win-watchdog-cpu-read-2026-10-19/must-meet.md`: four must-meet checks M1 to M4 and one seal, rows R-1890
to R-1893 (block R-1890 to R-1899), in SUB-008 after R-1395, shared with FEAT-006. `plan-attack.md` holds the
adversary's AMEND; `probe-p1.log` the seat's probe before the build; `build-brief-1.md` and `build-brief-2.md` the two
builds (59340ee7; b97387a6, tests only). The seat's record is `seat-verify-3e998bf2.md`: CI run 39362479464 on draft
pull request #93 at 3e998bf2 (macOS and Ubuntu 0 failing of 169 files; Windows one failing file, main's mutation runner
lock check; the Windows suite log `ci-windows-3e998bf2.log` beside it, and build 1's `ci-windows-62627846-build1.log`),
the P1 re-run under a de-DE user culture (`probe-p1-tip-62627846.log`), the macOS wrong-code pairs (`seat-mutate.mjs`;
`seat-mutate-output-62627846.txt`, 17 of 18 red, H1 survived; `seat-mutate-output-3e998bf.txt`, 18 of 18 red, 0
survived; four declared items) and the independent check (`independent-check-3e998bf2.md`, run on build 1, 62627846,
macOS only: HOLDS, no MUST, eleven probes). No pair ran on Windows. The seat's notes commit promotes R-1890 from
untested to implemented on the CI run's Windows PASS: one marker line in the test, `req-candidate` to `req`, and one
row status with its evidence. No product code changed after 3e998bf2.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`), run at 49b8581a, before the notes commit:

```
tree movement 8a9ff9a..49b8581: 4 rows in 1 features
FEAT-007 · Review a specific revision independently
  R-1890 new (untested); also applies: FEAT-006
  R-1891 new (implemented); also applies: FEAT-006
  R-1892 new (implemented); also applies: FEAT-006
  R-1893 new (implemented); also applies: FEAT-006
```

The notes commit flips R-1890, so a run on the tip reads `R-1890 new (implemented)`. CAP-02 moves from 180 to 184
rows, FEAT-007 from 121 to 125 and SUB-008 from 34 to 38.

The code under review: in `packages/nana-pack/bin/pi-watchdog.mjs`, the new export `parseCpuSample(raw, platform)`
(win32: trimmed digits divided by `WIN_CPU_TICKS_PER_SECOND`; elsewhere a trimmed `[dd-][hh:]mm:ss[.fraction]`; any
other text null), the win32 read `(Get-Process -Id N).TotalProcessorTime.Ticks` in place of `.CPU`, `cpuSeconds`
returning null on a throw, and the poll loop's one setImmediate yield and exit re-check before a reading counts, with
`cpu=unreadable` counted as flat against the last readable time. `bin/worker-config.mjs` adds the sealed
`WIN_CPU_TICKS_PER_SECOND = 10_000_000`. The pack README gains two sentences. The checks sit in the new
`packages/nana-pack/tests/watchdog-cpu.test.mjs`; `tests/immutable-review.test.mjs` changes only its stall check's fake
lifetime (180 s) and guard (120 s), both chosen, both 30 s before.

Judge whether, on a Windows machine whose format writes a decimal comma, pi-review and pi-worker let a busy pi run to
its exit (R-1890), and whether the parser, the unreadable rule and the exit re-check hold on macOS, Linux and Windows
(R-1891 to R-1893). Judge whether the ruling that an unreadable reading counts as flat can stop a healthy review or
build: a slow PowerShell start, a reading taken as pi exits, ps or PowerShell output this parser refuses on some
honest system. Judge whether each check would fail with its behaviour removed: the seat's pairs cover macOS; on
Windows, R-1890 rests on CI and the two P1 runs, and no wrong-code pair ran there. Judge whether R-1890's wrapper, a
`powershell.cmd` that sets a de-DE thread culture around the real Windows PowerShell 5.1, makes its check stand for a
decimal-comma user format, given the control that must print `1,5`.

Threat model: honest variation in our tools' output and the OS is in scope (Windows PowerShell 5.1 and pwsh 7 output,
the user's format, ps output on macOS and Linux, a slow PowerShell start, a reading that fails or prints nothing, a pi
that exits mid-reading); deliberate forgery, such as a forged reader or process, is out. Lane class: install, hook or
gate — pi-watchdog runs behind pi-review and pi-worker, the review tools.

Check: (1) the five must-meet checks are not vacuous: R-1890's control must print `1,5` and its busy pi must print
four cpu lines with positive seconds, exit 0 and print no STALL; R-1892 must stall after exactly four lines; R-1893
must end both runs by pi's exit; and each named pair turns its check red; (2) the unreadable-counts-as-flat ruling and
the one-yield exit re-check, against a pi-review or pi-worker run that is healthy but slow; (3) nothing main does today
stopped working: the busy-pi and stall paths in win32-launch, watchdog-exit, immutable-review, review-ledger and
worker-lane on all three legs, and the immutable-review fold; (4) the tests write only inside the temp folders they
own and clean up; (5) R-1890's promotion: its marker and row against the CI log beside the record; (6) HANDOFF and
the session entry are true, including the two changed residual lines, the five new lane residuals and the eleven seat
items from other lanes; (7) any MUST.

## Chain note (the seat, after this brief was written)

Since `a3d78f27`, the seat merged `2cd533d9`, the win-hook-settings-repair lane's reviewed tip. Lanes land in order; each land is a fast-forward of main, so `2cd533d9` becomes main before this lane lands. Review this lane's own change as `git diff 2cd533d9...HEAD` (three dots: against the merge base) and the merge itself as `git show --remerge-diff b51a51d0` (the merge commit) if your git supports it; the generated tree, code map and R-291 leaf total were regenerated by the seat's merge helper. Tree movement now (`node scripts/requirements-moved.mjs --root . --base 2cd533d9`):

```
tree movement 2cd533d..b51a51d: 4 rows in 1 features
FEAT-007 · Review a specific revision independently
  R-1890 new (implemented); also applies: FEAT-006
  R-1891 new (implemented); also applies: FEAT-006
  R-1892 new (implemented); also applies: FEAT-006
  R-1893 new (implemented); also applies: FEAT-006
```
