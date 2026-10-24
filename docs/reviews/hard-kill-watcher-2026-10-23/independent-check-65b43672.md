# hard-kill-watcher · independent check at 65b43672

Lane class: gate. Feature: FEAT-006. Checked on macOS (darwin 25.2, node 22.22.2), in a scratch clone at 65b43672 (`git clone --no-hardlinks` of the lane worktree into `<scratch>/ic-clone`). No model calls were made. Every run used `env -u CLAUDE_CONFIG_DIR`, a scratch TMPDIR per case, a scratch HOME and a scratch `PI_CODING_AGENT_DIR`. The lane worktree, the main checkout, `~/.claude` and `~/.pi` were only read.

Verdict: no MUST finding. Every probe the seat asked for ended clean, and I found no unbounded loop. Two SHOULD findings: a lock released while the builder still runs, after the lane folder or `builder.pid` is deleted by hand; and a dead-leader branch that signals a process group nobody verified. Four NOTEs.

## Setup

- Harness: `<scratch>/ic/harness.mjs`. It builds a fixture like `worker-claude.test.mjs`: a repo, a linked worktree `feat/alpha`, a brief with Feature and Precedent lines, and a roster whose `largerBuilder` is `claude-code`. A fake `claude` on PATH records its pid and can start a grandchild that ignores SIGTERM. pi-worker runs from the clone with `--lane alpha --lane-size larger --poll 0.2 --stall-secs 10 --max-secs 60`.
- Each probe is `env -u CLAUDE_CONFIG_DIR node <scratch>/ic/probe-<name>.mjs`; outputs are in `<scratch>/ic/probe-*.txt`.
- Process audit: the harness records every pid it starts or finds: pi-worker, builder, grandchild, decoys, hops and watchers. At the end of each probe it SIGKILLs those pids and their groups, then lists any survivor and any process whose argv names the scratch folder. **Every probe reported `survivors: []` and `strays: []`.** A final `ps` showed no process naming the scratch folder, and no recorded pid was alive.
- Baseline: `tests/lane-watcher.test.mjs` passed. `tests/worker-claude.test.mjs` passed R-2720, R-2722, R-2723, R-2724, R-2726 and R-2728, and skipped R-2721 off Windows. Afterwards TMPDIR was empty and no watcher remained.

## Probes and measured results

| Probe | What was done | Result |
|---|---|---|
| Smoke | SIGKILL of pi-worker alone while a Claude builder and its grandchild ran | Lock and folder appeared at 320 ms, builder at 616 ms, watcher ready at 722 ms. 580 ms after the kill: temp empty, lock gone, builder and grandchild gone, one `stopped` end with exit null and signal null, no watcher. |
| A · pid reuse, full run (3 runs) | Builder and watcher ready. SIGSTOP pi-worker so it cannot remove `builder.pid`. SIGKILL the builder group, so the recorded builder exits. Start an unrelated decoy (group leader plus one member) 2.3 s after the record. Rewrite `builder.pid` to name the decoy and restore the file's original mtime. SIGKILL pi-worker. | 3 of 3: decoy and member alive, lock kept (still names the dead pi-worker), temp empty, one end record, watcher gone. The start-time check refuses a stranger that started after the record. |
| A2 · tolerance window (direct `--watch`, dead worker pid) | Decoy started at a chosen fraction of a second; `builder.pid` mtime set x s before the decoy's start | Fraction .95: x = 1.9 s **signalled** (decoy and member killed, lock released); x = 2.05 s refused. Fraction .05: x = 0.9 s signalled; x = 1.2 s refused. Fraction .5: x = 1.4 s signalled; x = 1.6 s refused. The refusal edge is 1 s plus the fraction of the stranger's start second, up to 2 s (see NOTE-1). |
| B · SIGKILL in the first second (51 runs) | Kills at fixed delays (0 to 900 ms) and at events: lock created, folder created, folder plus 0 to 8 ms (the hop window), preamble written, `builder.pid` written, `--watch` visible. | 51 of 51 clean: no lock, temp empty, no watcher, hop or builder left. Every run with a start record got exactly one `stopped` end; runs killed before the start record got none. The declared empty-folder leftover did not appear. |
| B2 · parent-pid tree kill in the hop window (14 runs) | `killTree` from `scripts/runtime-measure.mjs` 0 to 160 ms after the folder appeared; one run caught the hop itself in the tree | 14 of 14 clean: no lock, temp empty, no watcher, no builder. |
| C · SIGTERM then SIGKILL (20 runs) | SIGTERM to pi-worker, then SIGKILL d ms later, d = 0, 1, 2, 3, 5, 10, 20, 50, 100, 300, two runs each; builder grandchild ignores SIGTERM | 20 of 20: temp empty, lock gone, builder group and grandchild gone, watcher gone, **exactly one end record**. d ≤ 10 gave the watcher's `stopped/null`; d ≥ 20 gave pi-worker's own `stopped/SIGTERM`. No duplicate end in any run. |
| D · lane temp folder deleted by hand mid-build | Delete the TMPDIR contents while the builder runs; then (i) let the build finish, or (ii) SIGKILL pi-worker. Main's code (`git archive c273b4de`) ran as comparison. | (i) tip and main: pi-worker exits 1, "FAILED after 1 attempt(s)" (the capture file was deleted), one `failed` end, lock gone, watcher gone. (ii) tip, 2 of 2: **lock released while the builder and its grandchild keep running**; end record `stopped`. Main: lock kept, builder running, no end. See SHOULD-1. |
| D2 · relaunch after D(ii) | Same, deleting (a) the whole folder or (b) only `builder.pid`; then start a second pi-worker on the same lane | 2 of 2: the second launch acquired the lock and started its builder while the first builder still ran: two builders in one worktree. |
| E · normal exit, builder leaves a grandchild | Builder starts an unreferenced grandchild in its group, prints its report, exits after 1.5 s | Tip, 2 of 2: pi-worker exit 0, one `ok` end, watcher gone 131 and 137 ms after pi-worker exited, temp empty, lock gone. The grandchild survives on tip **and on main**, so that is not new behaviour (NOTE-4). The watcher signals nothing after a normal end. |
| H · dead leader, stranger's group (direct `--watch`, 2 runs) | A stranger leads its own group, starts one member, then exits; its member keeps the group id. `builder.pid` names the dead leader's pid, mtime 30 s back. | 2 of 2: the watcher SIGKILLed the stranger's surviving member and released the lock. See SHOULD-2. |

## Code read: signals, locks, loops

- Every signal the watcher sends is `killProcessTree(builder.pid)`, which is `kill(-pid, SIGKILL)` off Windows. No path signals a bare pid or the worker's group. pid 0, 1 and negatives are refused twice: by `readBuilder` (`pid <= 1`) and by `validPid`. On win32 the watcher signals nothing.
- Verified before signalling: a live leader, by start time within the tolerance. **Not verified: a dead leader** (`identitySafe = !leaderAlive || …`), which signals `-pid` with no check (SHOULD-2). There is also a check-to-signal race of microseconds; the plan declares it.
- Lock: `releaseLaneLock` removes the lock only when its content equals the worker pid. A new pi-worker cannot create the lock while the old one exists (`wx`), so the read-then-remove has no honest race. The watcher never removes a lock naming another process; R-2722 and my audit agree.
- Loops: `watchLane` polls the worker pid every 200 ms, so it ends when the worker ends. The worker carries its own 8-hour ceiling. The poll is unbounded only for a zombie worker or a reused worker pid, and both are declared limits. `defaultWaitForExit` stops at a deadline. `ps` and `git` run with timeouts. Folder removal retries at most 5 times. Ledger and session reads have byte caps. I found no other loop.

## Findings

### SHOULD-1 · A missing `builder.pid` releases the lock while the builder still runs

`cleanLane` sets `mayRelease = true` whenever `readBuilder` returns null (`lib/lane-watcher.mjs` lines 167–168 and 185). Deleting the lane temp folder, or only `builder.pid`, mid-build, followed by a hard kill of pi-worker, therefore releases the lock. The watcher never signals the builder, so the builder and its group keep running past the lane ceiling. The ledger records `stopped`. A second pi-worker then launches on the same lane, measured 2 of 2 (D2), and two builders write in one worktree. On main the lock stays, which refuses the relaunch.

The plan's declared limit has the same outcome, but only for "a kill between the spawn and the write", a microsecond window. This trigger is wider: any outside removal of pi-worker's private temp folder or of that one file. A failed `builder.pid` write would do it too, since `onSpawn` swallows the error (inferred, not run). Not MUST: it needs an outside actor removing pi-worker's private files plus a hard kill. That is outside "honest variation in our tools' output", and its outcome equals a declared residual.

Options, none built or tested:

- Widen the known-limit line to this trigger.
- Keep the lock when no builder identity is readable and the folder was already gone before cleanup. The cost is a kept lock in the brief window where pi-worker dies between its own folder removal and its lock release.
- Keep the lock when any running process's argv still names the lane folder. A Claude builder's argv carries the prompt and settings paths in it; a pi builder's carries the preamble path.

### SHOULD-2 · The dead-leader branch signals an unverified process group

When the recorded leader no longer runs, the watcher still signals `-pid` (line 175 then 178). The plan rests this on "a dead leader's group id cannot be reused while any member lives, so any survivors are the builder's". That holds only while no stranger has taken the pid in between. A stranger can take the freed pid, lead a group, and exit with a member still running. The group id then survives with only the stranger's member in it, and the watcher kills that member: 2 of 2 in simulation (probe H). Real pid reuse was not forced.

This branch is the ordinary path after a parent-pid tree kill. The attack file measured the signal reaching an already-freed pid 57 to 170 ms after it was freed. Under a zombie pi-worker it can be the whole delay. A real hit needs pid reuse, plus a group leader on that pid, plus that leader exiting, all inside that window. The probability is very low, but the outcome is a SIGKILL of unrelated work. The must-meet's rewritten known-limit line covers only a live leader within the tolerance, and the attack's "microseconds" residual understates this window.

Options:

- Add a known-limit line for this case.
- Signal only a live, identity-checked leader. Inferred: R-2720 case d would still pass, because the tree kill itself ends the builder's group. Orphans of a builder whose leader died first would then survive, as they do after a normal finish today (NOTE-4).

### NOTE-1 · The tolerance window is up to 2 s, not 1 s, and its reason is off

`ps -o lstart=` truncates to whole seconds, which can only make a start time read earlier. An honest builder therefore always passes on macOS with zero tolerance. The 1 s tolerance widens the reuse window to 1 s plus the fraction of the stranger's start second (A2: 1.9 s signalled, 2.05 s refused). The tunable's provenance says the second covers whole-second output, which it does not need to. A forward wall-clock step on Linux, where lstart is derived from boot time, would still justify some tolerance (inferred). Fix the known-limit text ("within one second") and the provenance reason. lstart is also local time without an offset: in the repeated DST hour, V8 parses the earlier reading, which can only widen the window, by one hour once a year.

### NOTE-2 · A `stopped` end can be written for a builder that still runs

The watcher writes `stopped` whenever a start record has no end. That includes the lock-kept paths (R-2726, R-2727, an unreadable start time) and SHOULD-1. The README's build-record paragraph explains an unpaired start. It does not say that a paired `stopped` can belong to a builder still running.

### NOTE-3 · The `ps` call borrows the git timeout

`defaultProcessStartedAt` uses `LANE_WATCHER_GIT_TIMEOUT_MS` (line 92). Retuning the git timeout silently retunes the start-time read.

### NOTE-4 · Earlier behaviour, outside this lane

- After a normal finish, a grandchild in the builder's group survives, on tip and on main alike (probe E): `runOnce` does not end the group when the leader exits on its own.
- The capture folder now lives inside the lane folder. A hand delete of only the lane folder now also loses the builder's output; on main the capture sat beside it. Inferred from the code: my D(i) run deleted both locations on main too.

## Not covered

- Windows: R-2721, R-2727's win32 half and `taskkill /T` behaviour are CI's evidence, not mine.
- Linux lstart and clock behaviour: inferred, not run.
- Real OS pid reuse: simulated by rewriting `builder.pid` (A, A2) and by a stranger's orphaned group (H). No pid space was cycled.
