# Review — win-watchdog-cpu-read (pi-review's and pi-worker's watchdog reads a busy pi's CPU time on Windows under a decimal-comma format, counts an unreadable reading as flat, and ends by pi's own exit when pi exits during a reading), 2026-10-19 (Fable, the land reviewer)

Feature: FEAT-007 · Review a specific revision independently (SUB-008 · Run and stop an isolated reviewer; FEAT-006 ·
Launch builders with execution limits shares all four rows)

Review `git diff 8a9ff9a3..HEAD` on `feat/win-watchdog-cpu-read` (main was `8a9ff9a3` when the lane last merged it;
`git merge-base HEAD main` is `8a9ff9a3`). Main has since moved to `0361bbb7` (the knowledge-unreadable-root,
hook-output-fail-open and install-dry-run-pi-packages lands), and win-claude-skills lands before this lane, so the land
needs a merge of main and a confirmation round on the merged tip. The plan of record is
`docs/reviews/win-watchdog-cpu-read-2026-10-19/must-meet.md`: four must-meet checks M1 to M4 and one seal, rows R-1890
to R-1893, in SUB-008 after R-1395, shared with FEAT-006. `plan-attack.md` holds the adversary's AMEND; `probe-p1.log`
the seat's probe before the build; `build-brief-1.md` and `build-brief-2.md` the two builds (59340ee7; b97387a6, tests
only). The seat's record is `seat-verify-3e998bf2.md`: CI run 39362479464 at 3e998bf2 on macOS, Ubuntu and Windows
(macOS and Ubuntu 0 failing of 169 files; Windows one failing file, main's mutation runner lock check, which the urgent
mutation-runner-win-lock lane fixes; `ci-windows-3e998bf2.log` beside it), the P1 re-run under a de-DE user culture
(`probe-p1-tip-62627846.log`), the macOS wrong-code pairs (`seat-mutate.mjs`; 18 of 18 red on 3e998bf2, 0 survived;
four declared items; none ran on Windows) and the independent check (`independent-check-3e998bf2.md`, run on build 1,
62627846, macOS only: HOLDS, no MUST, eleven probes; its one known bug is main's and already on HANDOFF). The seat's
notes commit promotes R-1890 to implemented on the CI run's Windows PASS. The final reviewer's brief is
`review-brief.md`.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`), run at 49b8581a, before the notes commit:

```
tree movement 8a9ff9a..49b8581: 4 rows in 1 features
FEAT-007 · Review a specific revision independently
  R-1890 new (untested); also applies: FEAT-006
  R-1891 new (implemented); also applies: FEAT-006
  R-1892 new (implemented); also applies: FEAT-006
  R-1893 new (implemented); also applies: FEAT-006
```

The notes commit flips R-1890, so a run on the tip reads `R-1890 new (implemented)`.

The code under review: `packages/nana-pack/bin/pi-watchdog.mjs`, which runs every pi-review and pi-worker attempt in
both seats: the new `parseCpuSample`, the win32 tick read in place of `.CPU`, a failed read now null instead of 0, and
the poll loop's one setImmediate yield and exit re-check, after which a null reading prints `cpu=unreadable` and counts
as flat against the last readable time. `bin/worker-config.mjs` adds the sealed `WIN_CPU_TICKS_PER_SECOND`; the pack
README gains two sentences. The checks sit in the new `packages/nana-pack/tests/watchdog-cpu.test.mjs`; the
immutable-review test's stall check gets a 180 s fake and a 120 s guard.

Judge whether the lane fails open: an attempt that should end as a stall now runs on, or an attempt pi did not finish
now counts as finished. The exit re-check ends an attempt by pi's own exit status, so judge whether any reading can
end a live pi's attempt, or let a failed pi count as a produced review or a finished lane. Judge whether it leaves a
harm the review standard lists: a healthy review or build stopped as stalled (a slow PowerShell start, a reading that
fails while pi works, ps or PowerShell output this parser refuses on an honest macOS, Linux or Windows system), a
broken review or land tool, or a test writing outside the temp folder it owns. Judge whether anything main does today
stopped working: a busy pi runs to its exit and an idle pi stalls, on macOS, Linux and Windows; the stall, retry,
signal and exit paths in win32-launch, watchdog-exit, immutable-review, review-ledger and worker-lane on all three CI
legs; pi-worker's lane lock and pi-review's reservation after a stall. The plan's known limits that HANDOFF records
(no test changes a real user format; one yield may miss an exit the system has not yet reported; each Windows reading
starts PowerShell and finds programs by name; no wrong-code pair ran on Windows; the rail reads R-1890 implemented
from a run where it skips) are known limits unless the review standard lists them as harms.

Threat model: honest variation in our tools' output and the OS is in scope (Windows PowerShell 5.1 and pwsh 7 output,
the user's format, ps output on macOS and Linux, a slow PowerShell start, a reading that fails or prints nothing, a pi
that exits mid-reading); deliberate forgery, such as a forged reader or process, is out. Lane class: install, hook or
gate — pi-watchdog runs behind pi-review and pi-worker, the review tools.

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.

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
