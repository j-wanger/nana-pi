# hard-kill-watcher · plan attack · lens: Windows and platforms

Adversary 2026-10-24, against `hard-kill-watcher-plan-draft.md` at main c273b4de. Work folder: `<scratch>/hkw-attack/platforms/` (prototype copy `proto/`, probes `probe-cwd-life.mjs`, `probe-lock-live.mjs`, `rm-order.mjs`, their `*-results.json`, and fetched sources in `src/`). Every probe ran on this Mac (macOS, node 22.22.2, libuv 1.51.0), HOME and TMPDIR in the work folder, `CLAUDE_CONFIG_DIR` and `NANA_*` unset, the planner's fake builders, no model call, no load generator (the seat rule forbids a stress probe beside other lanes). `ps` showed none of my processes left after each probe. Nothing was written in the repo, a worktree, `~/.claude`, `~/.pi` or the global npm prefix.

Every claim is marked **measured** (run here, or read from the named source) or **inferred**.

## Verdict on the riskiest assumption

The assumption holds by mechanism for every parent that spawns through libuv, with three gaps the plan does not name.

- **Measured (read, libuv v1.51.0 `src/win/process.c`, the version node 22.22.2 bundles):** a non-detached child is assigned to the parent's kill-on-close job (`:1082-1101`); that job allows silent breakaway (`:92-96`), and the parent assigns *itself* to it on the first non-detached spawn (`:109`). A detached child gets `DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP` and no job (`:1063`). libuv never sets `CREATE_BREAKAWAY_FROM_JOB` (`:1053-1061`). So the hop leaves every libuv job above it: pi's, pi-worker's own, the node test runner's, and Claude Code's if Bun spawns through libuv (inferred for Bun).
- **Measured (read):** Git for Windows' `bin\bash.exe` wrapper, pi's Windows shell, makes no job (`git-wrapper.c:876-897`). Node clears inheritance on its standard handles at start-up (`node.cc:895-899` at v22.22.2, `uv_disable_stdio_inheritance`), so the hop and watcher inherit none of pi-worker's pipes on Windows either.
- **Gap 1 (S-1):** `taskkill /T` follows stale parent pids with no creation-time check (inferred, from several public reports: stablyai/orca#23415, Kwintspiracy/nodal-agents#844, solutionsunity/acp-patchbay#115). The watcher's recorded parent is the dead hop. If Windows gives that pid to a live process inside pi-worker's tree, `/T` reaches the watcher.
- **Gap 2 (N-3):** a job that forbids breakaway keeps the watcher. Win32-OpenSSH sessions are one (PowerShell/Win32-OpenSSH#1032, inferred); a session drop then kills pi-worker, builder and watcher together.
- **Gap 3 (M-2):** the watcher inherits pi-worker's working folder, which Windows will not let anyone delete while the watcher lives.

## MUST

### M-1 · On Windows the watcher releases the lane lock while a Claude builder started through `claude.cmd` still runs; no test pins the lock-kept rule on any platform

**What I did.** I read the Windows launch path, the prototype watcher and libuv's job code. Then I forced the prototype's win32 branch on macOS. It ends no builder, as the plan says Windows will. I SIGKILLed pi-worker alone and started a second `pi-worker --lane alpha` on the same lane (`probe-lock-live.mjs`, 3 runs).

**What happened.**
- Measured (read): a `claude.cmd` builder (the npm install) launches as `cmd.exe /d /v:off /s /c "…"` with `windowsVerbatimArguments` (`lib/win-command.mjs:58-59`), and pi-worker forces `detached: false` for that launch (`pi-worker.mjs`, `claudeLaunch`). So `cmd.exe` joins pi-worker's libuv kill-on-close job. Claude's own process, a child of `cmd.exe`, silently breaks away (libuv `:92-96`). pi-worker's `onSpawn` records the `cmd.exe` pid.
- Inferred from the above: when pi-worker dies without a tree kill, its job ends `cmd.exe` and claude keeps running. The draft's lock rule is "removed only when it still names workerPid and the recorded builder is gone". The recorded builder is `cmd.exe`, so it is gone, and the watcher removes the lock. Main leaves the lock in this case.
- Measured: the prototype checks no builder at all before `releaseLaneLock` (`lane-watcher-child.mjs`, `clean()`). With the win32 branch forced, 3 of 3 runs removed the lock while the builder ran. In 3 of 3 the second launch took the lane and ran its builder beside the live first one (exit 0, no lock refusal).
- Measured (read): none of R-2720 to R-2725 has a builder still alive when the watcher acts, so the prototype's unconditional release passes all six.

**Why it matters.** The lock exists so one builder writes in one worktree. On Windows, any pi-worker death without `/T` reaches this path: a crash, Task Manager's End task, `Stop-Process`, and possibly Claude Code's task stop (its Windows path is unverified, N-5). A second build then runs in the same worktree as the orphan. That is a lock stolen, and main does not do it. The draft lists it as a known limit. It is a regression against main.

**Change.**
- Design step 4: on win32 the watcher keeps the lock when the recorded builder was launched through `cmd.exe`. pi-worker writes a second line to `builder.pid` naming the launch, for example `cmd`. The watcher also keeps the lock whenever the recorded pid is alive, on every platform. A later lane can record claude's own pid, through one CIM query after the spawn.
- New row R-2726 (win32 only): IF pi-worker lane mode is ended by `taskkill /F /PID` without `/T` while a Claude builder started through `cmd.exe` runs, THEN its lane watcher shall leave the lane lock naming pi-worker. Test: the `claude.cmd` fixture; kill pi-worker without `/T`; after `WATCHER_BOUND_MS`, assert the lock still names pi-worker and the fake claude (pid file) is alive; then end the fake claude by its pid.
- R-2721 changes with it. With the `claude.cmd` fixture, its `/T` case keeps the lock (the watcher cannot tell `/T` from a plain kill). Its "no lane lock" assertion moves to a direct-launch case, a pi builder through `writeFakePi`.
- Optional cross-platform pin of the alive rule: after the spawn, the test rewrites `<folder>/builder.pid` to the pid of its own non-detached child. That child is not a group leader, so `kill(-pid)` fails harmlessly and the child stays alive. Assert the lock stays.
- Pair: "release the lock without the builder check" turns R-2726 red (Windows, seat-run on CI) and the optional pin red everywhere.

### M-2 · The watcher inherits pi-worker's working folder, the lane worktree, and on Windows a live process's working folder cannot be removed; build-records' final cleanup races it every run

**What I did.** I ran `probe-cwd-life.mjs` (8 finished builds) on the prototype copy and read the watcher's working folder with `lsof -a -d cwd`. I put a probe just before `build-records.test.mjs`'s last line, `fs.rmSync(TD, { recursive: true, force: true })`, which has no retries and no try. It lists live watchers whose argv names the test's temp root, with their working folder. I ran that test copy 9 times.

**What happened.**
- Measured: the watcher's working folder was the lane worktree in 8 of 8 runs. It exited 44 to 186 ms after pi-worker exited.
- Measured: in 9 of 9 build-records runs, a watcher was alive at the final `rmSync(TD)`. It was the last run's watcher, its pi-worker already gone, working in `<TD>/lane`. In one run it exited between my two `ps` reads, so the race is close.
- Inferred (Windows semantics: a process's current-folder handle denies deletion, `ERROR_SHARING_VIOLATION`, which Node reports as `EBUSY`): on Windows that `rmSync(TD)` throws when it reaches the lane folder while the watcher lives. The throw is uncaught, so the file fails with every check passed. `worker-claude.test.mjs:694` ends the same way, and any lane-mode test that removes its tree right after pi-worker exits is exposed. The suite runner's own removal has retries (about 1.5 s) and prints one FAIL line if it still fails (R-2666).
- How often this fails on a Windows runner is not measured. The race is between the watcher's last poll (up to 200 ms) plus exit and one node start for the report spawn.

**Why it matters.** The Windows leg blocks release. build-records passes there today. This repo already lost lanes to Windows-only `EBUSY` on runners (FEAT-031 "Review tools test on Windows", and the CI-runner gaps note). The threat model lists "the suite runner removing a test file's temp folder while a watcher cleans", but the draft treats only the ledger re-creation.

**Change.**
- Design step in Part 1: spawn the hop and the watcher with `cwd` set to the root of the temp folder's volume (`path.parse(folder).root`), never the worktree, the temp folder or HOME. The suite runner removes HOME without a try (FEAT-031 "only a finished file's temp folder is guarded"), so HOME is the worst choice.
- First `path.resolve` every path in the spec. Measured: `TMPDIR=rel/` makes `os.tmpdir()` return `rel`, and `mkdtempSync` returns the relative `rel/x-…`. The prototype passes that relative folder and only works because the cwd is inherited. Check that no helper the watcher calls reads `process.cwd()`.
- Pin it off Windows inside R-2724's finished-build run: while the watcher lives, assert its working folder is the volume root. On macOS read it with `lsof -a -d cwd -p <pid> -Fn`; on Linux with `readlink /proc/<pid>/cwd`. The pair "watcher inherits pi-worker's cwd" then turns red on the macOS mutation runner.
- On Windows, the R-2724 finished-build run removes the case root with no retries straight after `runWorker` returns and asserts the removal succeeded.

## SHOULD

### S-1 · `taskkill /T` can reach the watcher through the hop's reused pid; the plan states the opposite as settled

**What I did.** I read how the watcher's parent link looks on Windows after the hop exits. I searched for taskkill's tree semantics. I read Claude Code 2.1.299's Windows tree walk (strings of `~/.local/share/claude/versions/2.1.299`).

**What happened.**
- Measured (read): a Windows process keeps its creator's pid as its parent pid after the creator exits; nothing re-parents it.
- Inferred (public reports above): `taskkill /T` walks parent pids and compares no creation times. If Windows gives the hop's pid to a process inside pi-worker's tree, a later `/T` stop treats the watcher as that process's child and kills it. Candidates: the builder, `cmd.exe`, a builder tool child, or the watchdog's PowerShell CPU sampler (every `--poll` seconds; 0.2 s in worker-claude). That covers pi's Esc, timeout and SIGTERM path (`taskkill.exe /F /T /PID <shell>`, `dist/utils/shell.js:161`, pi 1.0.2), the desk's Windows kill (`apps/desk/server.mjs` `killTree`, `taskkill /t /f`), and the R-2721 test.
- Measured (read): Claude Code's own walk does check creation dates. Its Toolhelp32 walk compares process times, and its CIM fallback filters `CreationDate -ge $parent.CreationDate`. So Claude Code's walk would not adopt the watcher this way.
- Inferred: the chance per stop is small. Windows shares the id space between processes and threads and is believed to reuse ids late. But it is not zero, and a hit gives main's leftovers back.

**Why it matters.** The Windows half of the design rests on this claim, and R-2721 on the release-blocking leg would flake with no way to read the cause.

**Change.**
- Windows notes and Not verified: replace "So `taskkill /T` of the seat's shell does not reach the watcher" with that sentence plus the reused-parent-pid exception. Add a known limit: a `/T` stop can end the watcher when the hop's pid was reused inside the tree.
- R-2721, when it fails, prints the watcher's recorded parent pid and whether a live process in pi-worker's tree held that pid at the kill (one CIM read before the kill).
- Name the fallback to try if CI shows it: start the watcher through WMI `Win32_Process.Create`. Its parent is then the WMI host, outside the tree and outside any job. Claude Code 2.1.299 uses this to start processes outside its own tree (bundle strings, measured).

### S-2 · The Windows kill trigger and R-2724's wait are timing-based where a cheap deadline check removes the race

**What I did.** I timed hop exit, watcher start and the fake builder's pid file on macOS (`probe-cwd-life.mjs`, 8 runs). These are the trigger points R-2721 and R-2722 use.

**What happened.**
- Measured: the hop logged its exit 239 to 258 ms after pi-worker's spawn and the watcher started about 30 ms later. The builder's pid file appeared at 371 to 611 ms. The hop had exited before the pid file in 8 of 8 runs.
- Inferred: Windows timing differs. The hop is one node start plus the watcher module graph; the prototype hop imports build-records and process-tree before it spawns. The builder side is `cmd.exe`, a node start and pi-worker's git calls. A `/T` that lands while the hop lives takes hop and watcher together (the draft names this window). R-2724 sleeps a fixed `LANE_WATCHER_POLL_MS + WATCHER_MARGIN_MS` and asserts once.

**Change.**
- R-2721 and R-2722 kill only after `watchersFor(root)` shows one `--watch` process and no `--hop` process. They fail with that observation if this never happens within the case limit.
- R-2724 polls `watchersFor(root)` until empty up to its bound, then asserts.
- Make the hop a separate entry with no import beyond `node:child_process`, so its life is one bare node start.

### S-3 · The watcher's `git rev-parse` opens a visible console window on Windows

**What I did.** I read the prototype's end record and libuv's window flags.

**What happened.**
- Measured (read): the watcher runs `spawnSync("git", ["rev-parse", "HEAD"], { cwd, encoding })` with no `windowsHide` (`lane-watcher-child.mjs`, `keepWatcherEnd`). libuv adds `CREATE_NO_WINDOW` only when `windowsHide` is set (`process.c:1036-1041`).
- Inferred (Win32 `CreateProcess` rules): the watcher is a `DETACHED_PROCESS` with no console. A console program it starts without `CREATE_NO_WINDOW` gets a new, visible console window. Every hard-killed Windows build then flashes a git window on the owner's desktop.

**Change.** Design step 3: every spawn the watcher makes passes `windowsHide: true`. This applies to the shared end-record helper too if it shells out to git. A source check beside the tree-kill scan can pin it.

### S-4 · `rmSync` stops at the first entry it cannot remove; on Windows the key file goes first only because of its name

**What I did.** `rm-order.mjs`: I built a folder with the lane folder's five entry names and made the `pi-review-*` capture folder unremovable (mode 0555). Then I ran the watcher's `rmSync(…, { recursive, force, maxRetries })`.

**What happened.**
- Measured: `EACCES`; `builder-prompt.md`, `builder-settings.json` and `builder.pid` were removed, and `pi-review-AbC123/` and `preamble.md` stayed. Node 22.22.2's recursive removal stops at the first failure and leaves the entries after it.
- Inferred: NTFS lists a folder in name order. The settings file (the possible key) is removed before the capture folder today only because `builder-settings.json` sorts before `pi-review-`. A rename of `CLAUDE_BUILDER_SETTINGS_FILE` would change that silently.
- The draft's Windows note "the watcher still removes what it can" is wrong as written. Whether a live builder's open `out.txt` blocks removal at all is open: libuv opens files with share-delete, and recent libuv may unlink with POSIX semantics (inferred, not verified).

**Change.** Design step 2: unlink the prompt and settings files by their configured names first, then remove the folder recursively. Fix the limit text: a busy capture folder leaves itself and the entries after it.

### S-5 · Pair 15 will likely survive, and one load-bearing Windows flag has no pair

**What happened (inferred).**
- Pair 15 ("removal without retries → R-2721"): in R-2721 the builder dies by `/T` about one poll before the watcher acts, so no handle is likely left at the first removal. R-2721 stays green without retries. The plan requires every pair to turn its test red every run.
- Measured (read, libuv `:65-121`): `detached: true` on the hop's spawn of the watcher is load-bearing on Windows. A non-detached watcher joins the hop's own kill-on-close job and dies the moment the hop exits. Off Windows, the same variant still survives every group kill, because it shares the hop's session. So no macOS pair catches it; only CI's R-2721 does.

**Change.** Move pair 15 to "Not pairs, declared" (retries unpinned, like the ledger guard). Add pair 16, "the hop spawns the watcher without `detached`", as Windows-only, seat-read from CI's R-2721.

## NOTE

- **N-1 · `kill(pid, 0)` on win32.** Measured (read): libuv 1.51 checks `WaitForSingleObject` after `GetExitCodeProcess` (`process.c:1335-1352`), so the exit-code-259 false positive the draft names is gone. `uv_kill` opens the pid with `PROCESS_TERMINATE` (`:1389`). A reused worker pid owned by an elevated process or a service returns `EPERM`, which the watcher counts as alive. With no ceiling it then waits that process's whole life, which can be until reboot. The known-limit line should say so.
- **N-2 · Windows builder left running.** After a `/T` stop the builder is in the walked tree and dies (inferred, as the draft says). After any other pi-worker death, a pi builder (detached) and claude behind `claude.cmd` keep running with no wall-clock ceiling. That matches main. It is the owner's open question 1, separate from M-1's lock.
- **N-3 · Jobs and cgroups that contain the watcher.** Over Win32-OpenSSH, a session drop kills pi-worker, builder and watcher at once (#1032, inferred); Task Scheduler and some CI runners may be similar (not checked). On Linux, `setsid` does not leave the cgroup (inferred). A unit stop (`systemctl --user stop` of a scope), logind `KillUserProcesses=yes` at logout, systemd-oomd and a container stop all kill the watcher with the builder. Result: main's leftovers without a running builder. Add one known-limit line.
- **N-4 · pi on Windows.** Measured (read, pi 1.0.2): the bash tool spawns its shell non-detached on Windows (`dist/core/tools/bash.js:65`), so the shell sits in pi's kill-on-close job. pi registers no SIGHUP handler on win32 (`interactive-mode.js:3518-3520`). Inferred: a closed terminal or a pi crash ends only the Git wrapper, and pi-worker runs on to its end unsupervised. That is not a hard kill, and the watcher has nothing to do. The threat model's "a closed terminal = group SIGKILL" is POSIX-only.
- **N-5 · Claude Code on Windows.** Measured (bundle strings, 2.1.299): no job-object API names. There is a `taskkill /T /F` for one agent child, and the creation-time-checked walk in S-1 for its auth-refresh commands. I did not find the Bash tool's Windows task-stop path. It stays in Not verified.
- **N-6 · Linux parent and zombie text.** Inferred: on a Linux desktop an orphaned watcher re-parents to the nearest subreaper (`systemd --user`), not pid 1. Nothing depends on it, but the Dropped line "the watcher's parent is pid 1 from the start" is macOS-specific. The zombie limit applies exactly to the pi seat's group kill, where pi-worker's parent shell dies too and reaping falls to PID 1. The limit should say the builder keeps running and the folder stays in that case, which is main's behaviour.
- **N-7 · macOS launchd and the desk.** Measured: the desk spawns pi non-detached (`apps/desk/server.mjs`); grep finds no `AbandonProcessGroup` in nana-setup; `man launchd.plist` says launchd then kills remaining processes in the job's process group. Inferred: a desk service restart SIGKILLs pi, pi's detached shells survive, and pi-worker runs on unsupervised. The watcher leads its own session, so launchd's sweep never reaches it. The desk's DELETE path (SIGTERM, then pi kills its tracked shells by group) matches the draft.
- **N-8 · CI mechanics.** `taskkill` is in System32 on windows-latest and node spawns it without a shell, so the leg's Git Bash does not rewrite `/PID` (inferred). A builder who writes the Windows kill as a `bash -c` string would get MSYS path conversion of `/PID`. Keep it a node `spawnSync` argument list. The 8.3 `RUNNER~1` temp spelling does not affect `watchersFor`'s folder-name match (inferred). Each PowerShell CIM read costs about 1 to 3 s on a hosted runner (inferred). R-2721's case limit (20 s) holds three reads plus the 5.7 s bound.
- **N-9 · R-2724's row text.** "within one poll interval after pi-worker exits" is false when the watcher starts after pi-worker exits. That needs a fast build on a slow runner (inferred). Word the row by the test's bound.
- **N-10 · After a pi `/T` stop.** pi starts `taskkill` detached and does not wait for it. The watcher can begin while `taskkill` is still ending the builder, and the removal retries cover it (inferred).

## Sources read

- libuv v1.51.0 `src/win/process.c` and `src/win/process-stdio.c`; node v22.22.2 `src/node.cc`; git-for-windows MINGW-packages `mingw-w64-git/git-wrapper.c`. All fetched into `<scratch>/hkw-attack/platforms/src/`.
- Installed pi 1.0.2 under the global npm root: `dist/utils/shell.js`, `dist/core/tools/bash.js`, `dist/modes/interactive/interactive-mode.js`.
- Claude Code 2.1.299 binary strings (`~/.local/share/claude/versions/2.1.299`).
- Repo at c273b4de: `pi-worker.mjs`, `pi-watchdog.mjs`, `review-launch.mjs`, `lib/win-command.mjs`, `lib/process-tree.mjs`, `scripts/test.mjs`, `lib/test-runner-config.mjs`, `tests/worker-claude.test.mjs`, `tests/build-records.test.mjs`, `tests/build-report.test.mjs`, `tests/win32-launch.test.mjs`, `apps/desk/server.mjs`, `.github/workflows/ci.yml`, `docs/known-bugs/FEAT-006.md`, `docs/known-bugs/FEAT-031.md`.
- Public reports of `taskkill /T` following reused parent pids: [stablyai/orca#23415](https://github.com/stablyai/orca/issues/23415), [Kwintspiracy/nodal-agents#844](https://github.com/Kwintspiracy/nodal-agents/issues/844), [solutionsunity/acp-patchbay#115](https://github.com/solutionsunity/acp-patchbay/issues/115), [code-yeongyu/senpi#2999](https://github.com/code-yeongyu/senpi/issues/2999). Win32-OpenSSH session job: [PowerShell/Win32-OpenSSH#1032](https://github.com/PowerShell/Win32-OpenSSH/issues/1032).
