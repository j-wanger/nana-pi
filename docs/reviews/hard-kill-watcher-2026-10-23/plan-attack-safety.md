# hard-kill-watcher · plan attack: wrong-kill and cleanup safety

Adversary lens: make the watcher kill the wrong thing or remove live files. Draft attacked: `lanes/hard-kill-watcher-plan-draft.md` (main c273b4de).

## Setup

- Work folder `<scratch>/hkw-attack/safety/`. It holds `proto/`, a copy of the planner's prototype, and `proto-fix/`, the same copy with the M-1 and S-1 fix sketched in.
- The `proto/` copy has two probe-only edits. `lane-watcher-child.mjs` logs the leader's liveness, a `ps` line and `killProcessTree`'s return value just before the group signal. The `ps` call adds about 10 ms. `pi-worker.mjs` gets an `HKW_PAUSE_AT` hook that stops pi-worker at one named point, so the probe can SIGKILL it there.
- Every run used macOS and node 22 from the planner's fixture, with HOME and TMPDIR inside the work folder. `CLAUDE_CONFIG_DIR` and `NANA_*` were unset. Builders were fake, and no model was called.
- After every probe, `ps` showed no process of mine left: no watcher, no decoy, no fake builder, no perl parent (measured).
- Probes and their result files sit side by side in the work folder: `probe-*.mjs` and `probe-*-results.json` (or `*-proto.json` / `*-proto-fix.json`).

## What I measured

| Probe | Question | Result (measured) |
|---|---|---|
| A `probe-treekill-window` | R-2720 case d (parent-pid tree kill via `killTree`). When is the builder pid freed, and when does the watcher signal it? | 8 of 8 runs: `killTree` signalled the builder's group itself. The builder pid read ESRCH 21–30 ms after the kill. The watcher sent `kill(-pid)` 87–193 ms after the kill, which is **57–170 ms after the pid was free**. The leader was dead every time, and `killProcessTree` returned false (ESRCH). |
| B `probe-reuse-sim` | Simulated honest reuse: `builder.pid` (mtime 30 s back) names a live group leader started now. Does the watcher check identity? | proto, 2 of 2: it SIGKILLed the stranger's whole group, the lone leader in one run and the leader plus its member in the other. The `ps` line it logged showed a start time 30 s after the record. proto-fix: both groups untouched. |
| C `probe-term-then-kill` | SIGTERM, then SIGKILL d ms later. Does a handled stop leave a stale `builder.pid`? | d = 1 ms: 4 of 4 stale (the watcher signalled a dead leader). d = 2 ms: 2 of 4. d = 0, 5, 10, 20, 50 ms: none. |
| G `probe-exit-to-unlink` | With pi-worker alive, the builder group dies. How long until `builder.pid` is gone? | Pid freed 1.1–3.7 ms after the kill. File removed 0.3–0.8 ms after the pid was free (6 runs). |
| F `probe-zombie-worker` | pi-worker's parent never reaps it. | Watcher waited; pi-worker showed `Z`. 5 s after the kill, with a 3 s `--max-secs`, the builder and its grandchild were **still running past the ceiling**, and the folder and lock remained. Cleanup came 177 ms after the parent exited. |
| F2 `probe-zombie-builder-exits` | As F, but the builder finishes on its own during the wait. | The builder exited about 2 s after the kill and launchd reaped it. About 3 s later the watcher read `builder.pid` and group-signalled a pid that had been free all that time (`leaderAlive=false`). |
| D `probe-pause-points` | SIGKILL at three points in pi-worker's lifecycle. | After the start record: watcher wrote `stopped`, removed the folder, released the lock. After the folder removal: watcher wrote `stopped` for a build whose builder had finished ok, and `out.md` was never written (the draft's known limit). After the end record: no second end record, lock released. 2 of 2 at each point. |
| E `probe-two-lanes` | Two worktrees building at once, and back-to-back builds in one worktree. | 3 of 3 two-lane runs: killing lane A left B's builder, grandchild, folder, lock and watcher alone; then B cleaned up. 4 of 4 back-to-back runs: one end record per build (`ok`, then `stopped`); B's lock was never touched by A's watcher. |
| H `probe-survivor-lock` | The recorded builder is still alive after the signal and the stop wait (simulated with a live process that leads no group). | proto: **lock released** while the recorded builder ran. proto-fix: lock kept. |
| I `probe-survivor-writes` | A tool command the builder started in its own group (as pi's bash tool does) inherits the capture file and keeps writing. | Folder removed and never re-created (6 samples over 1.5 s). The writer kept running, and the lock was released while it ran. |
| fix regression | The planner's `probe-proto.mjs` ×2 (14 cases), probe A ×3 and `probe-sibling.mjs` ×3 on proto-fix. | All clean: empty temp, lock gone (the foreign lock kept), builder and grandchild dead, decoy and shell alive, one `stopped` record. Cleanup took 58–253 ms. |

Other facts:
- macOS pids here are handed out in sequence: three shells got 94704, 94705, 94706 (measured).
- Live pids went up to 99,377 while new pids were at about 94.7k. So the counter has wrapped at least once (measured). XNU's ceiling is 99,999 (inferred).
- Idle allocation rate was 4 pids in 10 s (measured).
- `bash -c '<node> …'` with one command execs node in place. Node then holds bash's pid and leads the group (measured).

## Findings

### M-1 · The watcher group-SIGKILLs a stale builder pid with no identity check, and the draft understates the window

**What I did.** Ran probes A, F2, C and B, listed above.

**What happened.**
- In R-2720 case d, a parent-pid tree kill that is in the draft's own threat model, the builder dies together with pi-worker. `builder.pid` is never removed.
- The watcher then sends `kill(-pid, SIGKILL)` to a pid that has been free for 57–170 ms. That happened in 8 of 8 runs (measured).
- When the watcher is delayed, the free-pid window lasts the whole delay. A zombie pi-worker gave about 3 s (measured, F2). A reused worker pid or a zombie that never goes away makes it unbounded (inferred).
- The watcher does not check what process now holds the pid. In simulation it killed an unrelated leader and its member, 2 of 2 (measured, B).
- Part 3 step 1 and R-2723 ("signal only the process group led by the builder pid pi-worker recorded at spawn") require exactly this.
- The draft's known limit says the window is "the milliseconds between the builder's exit and pi-worker's removal of builder.pid … not reproducible". That window does exist, but it is sub-millisecond with pi-worker alive (G). The wide windows above are reproducible every time.
- Part 2's "a reuse only delays cleanup; it never causes a kill" is also wrong. The delay is what lets the builder exit and free its pid before the watcher signals it (F2).

**Why it matters.**
- A wrong target is SIGKILL of an entire unrelated process group, which cannot be undone. Many new processes on these machines lead their own group: pi's bash tool commands, every detached spawn in this repo, interactive shell jobs.
- The chance per event is small but real. For the tree-kill window it is about allocation rate × window ÷ pid space: roughly 1e-5 to 1e-3 per tree kill, depending on load (inferred).
- After a long delay, the chance approaches the share of the pid space held by group leaders at that moment, roughly 0.1–0.5% on this Mac (inferred).
- The threat model puts pid reuse in scope, and the fix is cheap.

**Change to the plan.**
- Design, Part 3 step 1. Signal group `pid` only if one of two holds:
  - (a) the leader no longer runs. A dead leader's group id cannot be reused while any member lives, so any survivors are the builder's (POSIX, inferred).
  - (b) the leader runs, and its start time is not after the write time of `builder.pid`.
- Read the start time with `LC_ALL=C ps -o lstart= -p <pid>`. Take the write time from the file's mtime, rounded down to the second, with a 1 s tolerance.
- If the leader started later, or its start time cannot be read, signal nothing and keep the lock. A kept lock is main's behaviour and falls back to the manual rule.
- Precedent for the read: `pi-watchdog.mjs` `cpuSeconds` (`ps -o time= -p <pid>`).
- Sketched in `proto-fix/…/lane-watcher-child.mjs`. It spared the stranger in 2 of 2 runs, and all 20 regression cases stayed clean (measured). The sketch releases the lock on "reused". Prefer keeping it, because a clock step can make a real builder look reused (inferred).
- New row R-2726: "WHERE the platform is not win32, IF the builder pid pi-worker recorded names a live process that started after pi-worker recorded it, THEN the lane watcher shall signal no process and leave that process and its process group running."
- R-2726 test: `worker-claude.test.mjs::R-2726: off Windows, a recorded builder pid now held by a process-group leader started after the record is not signalled`. The test runs `lane-watcher-child.mjs --watch` directly with a dead worker pid. Its folder holds a `builder.pid` with mtime set 30 s back, naming a fresh detached decoy that has one member. Assert that the decoy and its member are alive after the watcher exits, and that the folder is gone (probe B's shape).
- R-2726 pair: drop the start-time check. The decoy group dies, so the test goes red (measured on proto).
- R-2723 text: append "and only while that pid still names the builder or no longer runs".
- Known limits: replace the pid-reuse line with the measured facts. A tree kill or a delayed watcher leaves a stale pid for up to one poll interval, or for the whole delay. The start-time check closes it. A residual of microseconds remains between the check and the signal.
- Part 2: replace "never causes a kill" with that same fact.

### S-1 · "Release the lock only when the recorded builder is gone" has no row, test or pair, and the prototype releases it unconditionally

**What I did.** Read `proto/…/lane-watcher-child.mjs`. It calls `releaseLaneLock(spec.lock, spec.workerPid)` after the stop wait whatever the wait found. Then I ran probe H.

**What happened.** The prototype released the lock while the recorded builder was still running (measured, H). proto-fix kept it.

**Why it matters.**
- This is the one guard that stops a second build from starting in the same worktree while the first builder still writes there.
- It matters most on Windows, where the watcher ends no process. Take a forced kill of pi-worker alone, without `/T`, with a pi builder: that builder is detached and keeps running (the draft's own Windows notes).
- On POSIX it matters for a leader stuck in the kernel, or a zombie under a container init that does not reap (inferred).
- Main keeps the lock in all these cases.
- No must-meet row or pair would turn red if a builder copies the prototype's unconditional release.

**Change to the plan.**
- New row R-2727: "IF the recorded builder still runs when the lane watcher's stop wait ends, THEN the watcher shall leave the lane lock in place."
- R-2727 test: `worker-claude.test.mjs::R-2727: a recorded builder still running after the stop wait keeps the lane lock`. Run the watcher directly. Its `builder.pid`, written after the process started, names a live child of the test that leads no group (probe H's shape). Assert that the lock still names the worker pid.
- Add a win32 case: `--lane-size small`, then `taskkill /PID <worker> /F` without `/T`. Assert that the lock is kept and the builder is alive, then kill the builder.
- Pair: release the lock without the builder check, and the test goes red (measured on proto against proto-fix).
- If the brief points the builder at `proto/`, treat this as MUST.

### S-2 · No must-meet test runs two lanes at once, though the threat model names it

**What I did.** Probe E (two worktrees at once, and back-to-back builds in one worktree).

**What happened.** The design kept the lanes apart in 7 of 7 runs (measured). But nothing in R-2720 to R-2725 would fail if a watcher reached another lane.

**Why it matters.**
- One plausible wrong build would pass every single-lane test: `builder.pid` written to a shared path such as `path.join(tmpdir(), LANE_BUILDER_PID_FILE)` instead of the lane folder. The tunable invites that spelling.
- With two lanes, lane A's watcher would then SIGKILL lane B's live builder group (inferred from code).
- The same goes for any watcher that sweeps temp folders by prefix.

**Change to the plan.**
- New row R-2728: "WHEN two lane builds run at once on one machine and one pi-worker is killed hard, its lane watcher shall leave the other lane's builder process group, temp folder, lane lock and watcher unchanged."
- R-2728 test: `worker-claude.test.mjs::R-2728: a hard kill of one of two concurrent lane builds leaves the other lane's builder, temp folder, lock and watcher untouched`. Use a second `git worktree add`, a second `WC_PID_FILE`, and SIGKILL of lane A only. Assert on B, then end B (probe E1's shape).
- Pair: `builder.pid` at a shared temp-folder path. Lane B's builder dies, so the test goes red (inferred).

### NOTE

- **N-1 · A delayed watcher lets the builder run past the wall-clock ceiling (measured, F).** A zombie pi-worker kept the builder running 5 s after the kill against a 3 s ceiling. A reused worker pid is the same and unbounded (inferred). Add this to the zombie and reuse known limits. Optional, not cheap: pass the ceiling deadline in the spec. At deadline plus a margin, the watcher would end only the identity-checked builder group, removing no files while pi-worker's pid still reads alive. The draft's "A ceiling on the watcher" item dropped a different thing.
- **N-2 · Worker-pid reuse within the watcher's life can match another build's start record (inferred).** The trigger is Windows, which reuses pids fast, with a second pi-worker in the same worktree inside about 200 ms, for example an outside retry loop. Watcher A then keeps watching B under A's pid. On B's hard kill it can write B's end record and release B's lock without knowing B's builder. A simpler match: make the build id before starting the watcher, pass it in the spec, and match end records by id only. That one id replaces the pid, lock and `since` rule. The lock half stays a residual, because the lock holds only a pid.
- **N-3 · The lock is released while the builder's own-group tool commands still run (measured, I).** pi's bash tool starts every command detached, so a pi builder's running command outlives the watcher's group kill. That command can be a long build or a full suite. Main's SIGTERM path does the same (inferred from code). So this is not new, but the hard-kill path used to keep the lock. The README lock paragraph and the known limit should say the lock goes once the builder's group is gone, even if its own-group commands still run.
- **N-4 · Windows: the watcher deletes the carried settings file and the prompt file while the Claude builder still runs (inferred).** On win32 the watcher ends no process. The draft does not say whether Claude Code re-reads its `--settings` file mid-run. If it does, the surviving builder could lose the sealed env (`NANA_ROLE`, the bash limits). Name it in the Windows limit, or mark it not verified.
- **N-5 · A stop that escalates fast also leaves a stale pid (measured, C).** SIGTERM followed by SIGKILL 1–2 ms later left a stale `builder.pid` in 6 of 8 runs. Real escalations wait seconds, so this only supports M-1.
- **N-6 · Pair 5's stated reason is wrong (measured).** Under `bash -c '…; sleep 30'`, pi-worker leads no group. So `killProcessTree(workerPid)` gets ESRCH and the shell survives. Under a single-command `bash -c`, pi-worker is the group leader and the group holds nothing else. The pair still goes red, but through "builder alive". Fix the reason text.
- **N-7 · I found no case where the watcher reads a live pi-worker as dead.** pi-worker spawns the watcher, so they share a pid namespace. EPERM counts as alive. ESRCH needs a reaped process, so the watcher can never run during pi-worker's own handled cleanup (inferred from code; D and the SIGTERM cases agree, measured). If a pid namespace's init exits (`bwrap --unshare-pid`, a container stop), the kernel kills the watcher with everything else and leaves the lock (inferred).
- **N-8 · The single-build end-record paths are sound (measured, D).** Pausing pi-worker after its end record gave no duplicate. A kill before its end record gave one `stopped` record. Duplicates need N-2's pid reuse.

## Not verified

- An actual OS pid reuse that hits a stranger. I forced none. Cycling about 100k pids on a shared machine could have sent other running probes' stale-pid kills into strangers.
- Linux and Windows. The start-time rule's `ps -o lstart=` needs procps on Linux, and busybox ps lacks it, so it would fail closed.
- Real pi or Claude builders. Whether Claude Code re-reads `--settings` (N-4).
