# Review — mutation-runner-win-lock (the mutation runner's lock check passes on Windows, and a lock release gets its own five-minute limit), 2026-10-19 (Opus, the lane's one final reviewer)

Feature: FEAT-031 · Run checks reliably and without contaminating work

Review `git diff 6bc2f727..HEAD` on `feat/mutation-runner-win-lock` (main was `6bc2f727` when this brief was written;
`git merge-base HEAD main` is `6bc2f727`). The lane branched from main `d4423eff` and merged main `6bc2f727` at
`0a449584`; that merge's two conflicts, REQUIREMENTS.md and the generated tree, resolve to R-1960 after R-1957 and
the regenerated counts (`git show --remerge-diff 0a449584`). The plan of record is the two build briefs: an urgent fix
with no plan file and no adversary. `build-brief-1.md` names the CI failure and reserves rows R-1960 to R-1969;
`build-brief-2.md` holds the seat's decoded table of build 1's ten Windows failures and the change. The lane uses
R-1960 and rewords R-1778. The seat's record `seat-verify-0a449584.md` holds main's baseline (11 of 12 hosted Windows
runs failed R-1776's check at d4423eff), build 1's 12 runs (`windows-12x-0ad43c1d-build1.log`, 10 of 12 failed),
build 2's 12 runs at 0a449584 (`windows-12x-0a449584-build2.log`, 12 of 12 passed) and CI run 39368972192, 0 failing
files on all three legs (`ci-windows-0a449584.log`). `build-2-suite.txt` is the builder's locked suite run.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, merge base `6bc2f727`):

```
tree movement 6bc2f72..0a44958: 2 rows in 1 features
FEAT-031 · Run checks reliably and without contaminating work
  R-1778 text changed
  R-1960 new (implemented)
```

CAP-07 moves from 300 to 301 rows and FEAT-031 from 85 to 86.

The change under review: in `packages/nana-pack/lib/mutation-runner.mjs`, the owned lock's release retries past the
30 s acquisition limit until the lock is gone or the new sealed `WORKTREE_LOCK_RELEASE_WAIT_LIMIT_MS` (300,000 ms in
`mutation-runner-config.mjs`, chosen) passes, then reports one line and throws. In
`packages/nana-pack/tests/mutation-runner.test.mjs`, R-1776's contention block gets a 120 s budget, a stop file each
worker reads between acquisitions, a 5 s grace before SIGKILL, and `timedOut` and `killedWorkers` in its record; its
strength is unchanged (8 workers, 2,400 acquisitions, zero overlap, complete ownership, the observer). R-1778's check
drops its release half, R-1960 gets its own check, and the sealed-values check pins the new limit.

Judge whether the lock stays mutually exclusive and live on Windows and on every system: no overlap, every worker
finishes, and a live owner never leaves its lock behind unless its release keeps failing for the full release limit.
Judge whether R-1776's check is as strong as before and fails, naming a timeout, when the budget ends; whether R-1960
pins both halves (release outlives the acquisition limit; release stops, reports and throws at its own limit) and
fails on the wrong versions `build-brief-2.md` names; and whether R-1778's new wording matches what the code does.

Threat model: honest variation in our tools' output and the OS is in scope (macOS, Linux and Windows; Windows'
delete-pending files and EPERM, EACCES and EBUSY; slow or loaded hosted runners; process kills); deliberate forgery,
such as a hand-written lock file that names a live pid it does not belong to, is out. Lane class: ordinary — the seat
mutation runner, a seat tool, with no install, hook, gate or land and review tool code; an urgent fix that ships alone.

Check: (1) R-1776's check keeps its strength and the budget, stop file and grace cannot hide an overlap or a hang;
(2) R-1960's check is not vacuous: it fails with release unbounded, with release cut at the acquisition limit and with
an unsealed limit; (3) a release that throws after its limit leaves nothing worse than main does (the lock named, no
critical section left running); (4) nothing else changed: every other mutation-runner check and the runner's other
paths are as they were; (5) no test writes outside the temp folders it owns; (6) HANDOFF and the session entry are
true, including the removed lock residual and queue item, the lane's two residuals, the scratch-branch line and the
other lanes' items; (7) any MUST.
