# making-session-end — plan (revision 2)

Worktree `~/nana-pi-wt/making-session-end`, branch `feat/making-session-end`, based on main ad9612dd (contains the making-trigger land aa530680).
Grounding: `docs/reviews/making-trigger-2026-11-01/plan.md` ("The split", Residuals), its `plan-attack.md` (N5, N6, S11, S12, M6), `docs/known-bugs/FEAT-040.md`, the landed code in `packages/nana-pack/lib/memory-run.mjs`, `packages/nana-pack/bin/nana-memory.mjs` and `packages/nana-pack/lib/profile-sync.mjs`, the installed Claude Code 2.1.310, and the private profile clone's reflogs plus its GitHub push log (times and SHAs only; no record text read). Revision 2 takes every MUST (M1 to M5) and every SHOULD (S1 to S6) of `plan-attack.md` in this folder, and NOTEs N1 to N6.

## Purpose

Agreed reading (owner, 2026-10-31 and 2026-11-01, recorded in the making-trigger plan): memory making runs at the end of each seat session and as part of each land, never nightly. The making-trigger plan's split names this lane: "The Claude Code `SessionEnd` hook with its install, uninstall, install-check, stale-copies and win32 repair wiring; its stdin deadline, import safety, cwd passing and recursion guards; a `nana-setup doctor` row for the last making run; and the Windows check under a real Claude Code parent. It calls the run and starter this lane builds."

Must-fix scope added by the seat: the first real runs on 2026-11-01 left the profile clone showing `ahead 1` with no failure in the run line, and `nana-profile sync` appeared to push the commit.

### Root cause of the "unpushed" commit (found, with evidence)

The commits were pushed by the runs themselves. The clone only looked unpushed.

- GitHub's push log for the private repository shows `7f44164 -> 02d5bfa` at 13:23:15Z and `02d5bfa -> ba8e34d` at 13:59:12Z. The clone's reflog shows the two `Make project memory` commits at 13:23:14Z and 13:59:11Z. Each push came one second after its commit, from the run.
- The clone's `refs/remotes/origin/main` reflog has only `fetch origin: fast-forward` entries. The fast-forwards to 02d5bfa and ba8e34d came 22 s and 16 s after the commits, from the seat's later `nana-profile sync` fetches, which found the commit already on the remote.
- Cause: `pushProfile` pushes to the verified URL (`git push <url> <sha>:refs/heads/<branch>`), not to the remote name. Git updates `refs/remotes/origin/<branch>` only on a push to a named remote. A scratch repository reproduces it (planner and adversary both). `syncProfile` uses the same call, so seat saves also show `ahead 1` until the next fetch.
- The "no failure" half: `makeMemory` ignores `pushProfile`'s result, so a real push failure would also print `memory: complete`.

### Decisions, with reasons

- **One new hook, `packages/nana-setup/claude/hooks/nana-memory-end.mjs`, on Claude Code `SessionEnd` with no matcher.** It fires on every reason (`clear`, `resume`, `logout`, `prompt_input_exit`, `other`). A `logout` run's model calls fail, and the landed failed-versus-malformed split (R-3291) leaves those units pending. A matcher would add a sealed list for no gain.
- **Entry `timeout: 1.5` (M1).** The installed binary kills each entry at `min(timeout × 1000, …)`, or 1,500 ms when the field is absent. All SessionEnd entries share one bound, `max(1500, min(largest entry timeout, 60 s))`. So `timeout: 1` would kill this hook at 1,000 ms. `1.5` gives a 1,500 ms per-entry kill and leaves the shared exit limit at its 1,500 ms floor, so the owner's exit is never delayed past today's floor. The settings schema accepts a non-integer number. The field stays explicit (rather than absent) because the installer recognises its entries by their timeout (M2).
- **Budget, recomputed for 1,500 ms.** Claude Code writes the input and ends stdin at once, so the read normally costs nothing. Node start is the main cost: on macOS tens of ms. The worst measured Windows stall was about 1.36 s for a whole one-process hook (R-2674 notes). That leaves about 140 ms for read, spawn and exit in the worst measured case. The stdin deadline, which matters only if stdin stays open, is sealed at 300 ms (chosen: inside the limit after a typical start, and short enough that an open pipe still lets the hook spawn and exit). A start stalled past 1,500 ms is killed before it spawns, and Claude Code prints `Hook cancelled` at that exit. The units stay pending for the next run. That case stays a residual.
- **What the hook does, in order (S1).** It reads stdin under its deadline and parses `transcript_path` and `cwd`. It returns at once, writing nothing, under `CI`, under any `NANA_ROLE` (an empty value included, as `startMemory` already does), or when `transcript_path` is missing or not a string. For `--repo` it uses the input `cwd` when that folder exists, else `CLAUDE_PROJECT_DIR` from its env (S4); with neither, it returns. Its last act is the spawn: `process.execPath <checkout>/packages/nana-pack/bin/nana-memory.mjs make --repo <folder> --session <transcript_path>` with `detached: true, stdio: "ignore", windowsHide: true`, `cwd` set to the home folder, an `error` listener and `unref()`. It then calls `process.exit(0)` at once. It never waits on the child or on the stdin stream. Reason: Claude Code's timeout kill walks descendants by parent pid while the hook is alive, so `detached` protects the run only after the hook has exited and the run has been reparented.
- **It does not check opt-in itself.** The run already prints `memory: not enabled` for a repository that is not enabled. A second copy of that check would be a duplicate.
- **Import safety (S11 of the earlier attack).** The hook's static imports are `node:` built-ins only. It finds the CLI by a path relative to its own real file, as `nana-roster-notice.mjs` finds its modules. Any shared helper loads by dynamic `import()` inside the hook's try, so a checkout mid-rebase or a renamed module means no start, not a stack trace at the owner's exit.
- **One starter, two callers (2026-10-22 ruling).** The spawn part of `startMemory` (land) moves into a new built-ins-only module `packages/nana-pack/lib/memory-start.mjs`. It exports one function that takes the CLI arguments and the env, spawn and home seams, applies the `CI` and `NANA_ROLE` guards, and spawns. `startMemory` keeps its last-run lookup and fixed land line and calls it. The hook imports it dynamically. Neither copies the option object.
- **Recursion guards (N1).** Already in place and confirmed by the adversary: the model runner sets `NANA_ROLE=worker`, `--setting-sources ""`, `--no-session-persistence` and a temp `cwd`. `claude-review`, visual-reader and pi-worker set `NANA_ROLE`. The hook inherits Claude Code's env, so its guard sees the role. This lane adds the hook-side guard and its test only.
- **The installer recognises its entries by each row's own timeout (M2).** `mergeRepoHooks` in `settings.mjs` compares an entry's timeout with the wanted row's `w.entry.timeout`, not the literal 5 (three places). The legacy migration's literal 5 stays: it concerns only pre-exec entries that predate this hook. Then a win32 SessionEnd entry that names a moved or deleted checkout is rewritten on the next `nana-setup install`, as the other win32 entries are.
- **Push honesty, with a compare-and-swap ref update (M3).** `pushProfile` reads `refs/remotes/origin/<branch>` before the push. After a successful push it runs `git update-ref -m push refs/remotes/origin/<branch> <sha> <old>`. If a concurrent save or run moved the ref in between, the update is refused and the ref stays where the other writer put it. A refused or failed `update-ref` never changes the push result: the push succeeded. `syncProfile` resolves `HEAD` to a SHA once and pushes that SHA, so the pushed commit and the ref agree. The push still goes to the verified URL, so the privacy contract is unchanged.
- **Where the push outcome shows (S6).** The `make` run line carries `pushed` or `not pushed: <reason>` (the existing `PROFILE_WORDS.notPushed` and reasons), where a person reads it at once. Nothing stores the push word. `nana-memory status` and the doctor note show only `unpushed <n>`, the count of commits on the branch not on its tracking ref. With the compare-and-swap update, that count is the truth about the remote until the next fetch.
- **A run with nothing to make writes nothing to the store (S3).** When the run has zero pending units, it keeps only the local last-run file in the clone's git directory. It skips the store run file, the commit and the push. Reason: at session-end cadence an always-commit run adds a fetch, a commit and a GitHub push per `/clear`, and widens the clone-lock windows named in the residuals. The fetch and recovery before the unit listing stay as they are.
- **Doctor note: this machine's own last run (M5, N5, S5).** `nana-setup doctor` gains one informational row, `memory making`. It reads the local last-run file in the clone's git directory for each enabled repository (machine-local by construction), never the synced run files. It prints the number of enabled repositories, the newest local run's age and outcome word, and `unpushed <n>`. It prints no repository id, because doctor output gets pasted into public issues and a root-commit id is linkable. With no pointer or nothing enabled it reads `not enabled`; with no local file, `never`. A pointer to a missing clone, an unparseable local file or a failing `git` each give a fixed word (`unreadable`), never a throw. A note never fails doctor. `nana-memory status` uses the same local file for its age. The land line keeps `lastMemoryRun` (newest across machines), which is fine there.
- **Install wiring follows the roster-notice hook (commit 9a121ffd).** `desiredHooks` gains the SessionEnd entry: shell form on darwin and linux through the `~/.claude/hooks` link, exec form on win32 naming the checkout copy, `timeout: 1.5`, status message `nana: memory` (N3: short and neutral; it is the one visible trace at `/clear` and exit). `steps.mjs` `HOOKS` gains the file, so the link step, `hookLinkRows`, the stale-copy producer and uninstall pick it up. `state-manifest.mjs` gains it in its rebuild list. `install-check-config.mjs` `HOOKS` gains a row (event `SessionEnd`, matcher `null`, timeout 1.5, the three forms), and `DOCTOR_NOTES` gains `memory making` on all three platforms.
- **The install check exercises the start path (M4).** For the SessionEnd row only, the install check removes `CI` from the hook's env, as `buildEnvironment` already removes `NANA_ROLE`. So on all three CI legs the row runs the import, the guards and the spawn, not just the guard. It expects exit 0, empty stdout and stderr, and an exit inside 1,500 ms (its existing `expected.timeout * 1000`). The started run finds no profile pointer in the isolated home and exits with its fixed word; its stdio is ignored. The install check proves the hook ran and returned cleanly. Must-meet 6, with its marker file, proves the spawn.
- **Windows.** The Windows CI leg runs the real-process survival test (must-meet 6), whose Windows pin is weaker than POSIX (stated there). The owner's machine under a real Claude Code is the only place the full parent can be checked (the question below). The owner's checklist names: no window at exit, and no window during the run, including its git calls (N2: `profileGit` spawns git without `windowsHide`, inheriting a hidden console through the hop).

## Assumptions

- A1. A session whose input `cwd` was removed falls back to `CLAUDE_PROJECT_DIR` (S4). If both are gone, the hook starts nothing and the next land sweeps the units.
- A2. `transcript_path` may name a file that does not exist yet (a session with no turns). The run already skips a missing session file and sweeps the rest.
- A3. The hook reads no agent dir and no profile. The spawned run reads pi's active agent dir from the inherited env. The making-trigger caveat holds: a Claude Code env without `PI_CODING_AGENT_DIR` reads `~/.pi/agent` (pack README contract notes).
- A4. The "Working under nana-pi" table in AGENTS.md has no column for memory making, so it does not change. The pack README contract notes and the nana-setup README hook list name the new hook.
- A5. Node resolves a symlinked main module to its real path, so the relative CLI path works from the `~/.claude/hooks` link. The local macOS install check runs the hook through that link.
- A6. Session-end runs draw on the seat's Claude account at each exit, under the landed per-run and per-day caps. The owner ruled this cadence.
- A7. Untrusted workspaces skip SessionEnd hooks in Claude Code. A session in an untrusted folder starts no run; the next land sweeps it.
- A8. The user value (the named transcript's units get made) is already pinned by the landed `--session` tests: `packages/nana-pack/tests/memory-run.test.mjs` "R-3290: each owner and ask unit is made once" and the R-3291 sweep test, which call `make --session <file>`. This lane adds no test for it (N4).

## Open choices

- O1. Exact names: the stdin-deadline constant and where the hook's sealed values live (the hook may not statically import a config module, so they live in `memory-start.mjs` or a built-ins-only config module loaded dynamically). Seal tests pin the values and words.
- O2. How A-093 names its second maker. Today the line says `land:`. The builder adds the hook as a `Made by:` line or in whatever form the deliverables check accepts for two makers. No new artifact.
- O3. Whether the unpushed count uses `rev-list --count refs/remotes/origin/<branch>..HEAD` or `status --porcelain=v2 --branch`. Both are local.
- O4. How the install check removes `CI` for the SessionEnd row: a per-row env removal list in `install-check-config.mjs`, or a one-row branch in `install-check.mjs`. A per-row list is preferred if it is no larger.

## Questions for the owner

Question: Does this land wait for your check on your Windows machine, under a real Claude Code?
Default: after. The lane lands on the three CI legs, including the Windows real-process survival test. You run the short check when convenient: exit a Claude Code session in nana-pi, then `nana-memory status` shows a new run, and no window appeared at exit or during the run. A failure opens a fix lane.
What the default gains and misses: It lands today without your time, but it may miss a Windows-only way Claude Code kills the started run that a node parent does not reproduce.
Cost of a wrong guess: easy to undo — a run that never starts loses nothing, because the next land sweeps pending units; uninstall removes the hook.
If answered otherwise: The seat writes the checklist into the lane folder and holds the land until you report the result.

## Feature

Feature: FEAT-040 · Make and keep memory

Subgroup SUB-024 · Make memory when sessions and lands end. This lane's rows are R-3350 to R-3369 (closed range). The planned rows use R-3350 to R-3362. No new artifact: A-093 · project memory store gains the session-end hook as its second maker (O2).

Lane class, from `node scripts/lane-class.mjs --root . --files <final file list>` on 2026-11-01 (rerun for revision 2). The file list is the new `packages/nana-setup/claude/hooks/nana-memory-end.mjs` and `packages/nana-pack/lib/memory-start.mjs`, plus `packages/nana-pack/lib/memory-run.mjs`, `memory-run-config.mjs`, `profile-sync.mjs`, `packages/nana-pack/bin/nana-memory.mjs`, `packages/nana-setup/lib/settings.mjs`, `steps.mjs`, `state-manifest.mjs`, `install-check-config.mjs`, `install-check.mjs`, `doctor.mjs`, `packages/nana-pack/README.md`, `packages/nana-setup/README.md`, `REQUIREMENTS.md` and `docs/known-bugs/FEAT-040.md`:

`hook: packages/nana-setup/claude/hooks/nana-memory-end.mjs — Claude Code hook`

Hook lane: final reviewer, land reviewer (or the seat land review when the roster prints `land: seat`), the seat's wrong-code pairs, one independent check, the Windows CI leg, and the local macOS install check before the land (2026-10-12 ruling). Size: medium.

## Threat model

In scope, honest variation in our tools' output and the machine:
- every SessionEnd reason, including `logout` after the credentials are gone;
- stdin closed at once, never closed, empty, malformed, truncated at the input cap, or a TTY;
- input with a missing, non-string or stale `transcript_path` or `cwd`, including a removed worktree;
- a checkout mid-rebase or with a renamed module, so a dynamic import fails;
- Claude Code's per-entry kill at the timeout, which kills the hook's group and its descendants by parent pid while the hook is alive; a slow Windows Node start;
- hook entries under `CI` and under builder and reviewer roles;
- two session ends a few seconds apart, a session end during a land run, and a seat save between a run's push and its ref update;
- a push that succeeds, is rejected or fails on the network, and a fetch that never comes;
- a moved or re-cloned checkout with a stale win32 entry;
- doctor with no pointer, nothing enabled, a missing clone, an unparseable local run file or a failing `git`; two machines sharing one store;
- Windows paths, exec-form entries and console windows.

Out of scope, deliberate forgery: forged hook input naming another repository or transcript; a planted transcript; a hand-edited settings entry pointing at another script; a hand-moved tracking ref. Findings here are residuals.

## Precedent

- `packages/nana-setup/claude/hooks/nana-roster-notice.mjs` — the newest Claude Code hook: an exported run function with injected input and write seams, a CLI entry guarded by its real path, modules loaded inside a try, and `process.exit(0)` at the end. The new hook takes this shape; it writes nothing.
- `packages/nana-setup/lib/shared-memory-input.mjs` — `readHookInput` and `STDIN_CAP`, reused for the bounded read. The hook races it against its own deadline and exits without waiting on the stream; the module is unchanged, since two SessionStart hooks rely on it.
- `packages/nana-pack/lib/memory-run.mjs` — `startMemory` (guards, detached option object, `error` listener, `unref`, home `cwd`), whose spawn part moves to `memory-start.mjs` (helper move, 2026-10-22 ruling). Also `makeMemory`'s push call and its local last-run file (`RUN_LAYOUT.lastRun`), and `healthWords`, which status and doctor reuse.
- `packages/nana-knowledge/lib/hook.ts` — `spawnBuild`, the first detached hook child; `packages/nana-pack/lib/lane-watcher.mjs` — `startLaneWatcher`, the same pattern with `windowsHide: true` and a root `cwd`.
- `packages/nana-knowledge/tests/hook.test.mjs` — "a stale CLI pull survives teardown while its detached build finishes": a process-group kill on POSIX and a plain kill on win32, then the detached child still finishes. Must-meet 6 follows it and adds the descendant kill at the limit.
- `packages/nana-setup/tests/roster-notice-hook.test.mjs` — the isolated-copy test (a hook copy with no siblings) that must-meet 3 follows.
- Commit 9a121ffd (roster-notice group 4) — the wiring list for a new hook: `settings.mjs` `desiredHooks`, `steps.mjs` `HOOKS`, `state-manifest.mjs`, `install-check-config.mjs` `HOOKS`, `install-check.mjs`, `doctor.mjs`, and the tests `hooks-win32-exec`, `install-check`, `install`, `restore`, `settings-merge`, `state-manifest`, `uninstall` and `win32-degrade`.
- `packages/nana-setup/lib/settings.mjs` — `mergeRepoHooks` (the win32 repair, whose timeout literal changes to the row's own) and `removeInstallerHooks` (uninstall matches the canonical entry, so it needs no change).
- `packages/nana-setup/lib/hook-health.mjs` and `packages/nana-setup/lib/stale-copies.mjs` — they iterate `HOOKS` and `desiredHooks`, so the link row, settings row, stale-copy report and win32 repair detail come from the list entries.
- `packages/nana-setup/lib/install-check.mjs` — `buildEnvironment` (strips `OVERRIDE_ENV`, which includes `NANA_ROLE`) and the hook invocation with `CLAUDE_PROJECT_DIR`; the SessionEnd row adds `CI` removal.
- `packages/nana-setup/lib/doctor.mjs` — its informational rows and `DOCTOR_NOTES` are the precedent for a note row.
- `packages/nana-pack/lib/profile-sync.mjs` — `pushProfile` and `syncProfile`; the compare-and-swap ref update goes in `pushProfile`, so both callers get it.
- `packages/nana-pack/lib/profile-config.mjs` — `PROFILE_WORDS.notPushed` and its reasons, reused for the run line.
- `packages/nana-pack/bin/nana-memory.mjs` — the run and status lines.

From `npm run map:search` (2026-11-01; queries: SessionEnd detached spawn, hook stdin deadline, doctor row last run, push tracking): `hook-health.mjs`, `stale-copies.mjs`, `lane-watcher.mjs`, `shared-memory-input.mjs`, `nana-roster-notice.mjs`, `nana-shared-memory.mjs`, `doctor.mjs`, `profile-sync.mjs`, `profile-guards.mjs`. Added from them: `lane-watcher.mjs`. Imports between packages are free in `code-map.config.json` (one `packages` layer), so no cross-component declaration is needed.

Private helper moves: the spawn part of `startMemory` moves to the new `memory-start.mjs`. Nothing else moves.

## Outside precedent

claude-mem (thedotmack/claude-mem, Apache-2.0) — borrow: its plugin registers a `SessionEnd` hook with no matcher that only hands the session to background work and returns, the same shape as this hook. Skip its long-lived worker service and its `async: true` hook field: the installer's allowed hook keys exclude fields that change dispatch, and a detached child needs no daemon.
Also read: the Claude Code hooks reference for SessionEnd input fields; the bound and per-entry kill were read from the installed 2.1.310 binary by the adversary.

## Must-meet

Every test uses synthetic input, temporary homes, a temporary profile clone with a local bare remote, and injected spawners or fixture CLIs. None starts a real making run, spends, or reads owner text. Every real-process hook test builds the hook's env explicitly, without `CI` or `NANA_ROLE`, so the start path runs on the CI legs and under a builder; no test skips under `CI`.

1. **A session end starts one quiet run.** Given SessionEnd JSON with `transcript_path`, an existing `cwd` and each of the five reasons, the hook calls the spawner once with `process.execPath`, the arguments `<checkout>/packages/nana-pack/bin/nana-memory.mjs make --repo <cwd> --session <transcript_path>`, and options `detached: true`, `stdio: "ignore"`, `windowsHide: true`, `cwd` set to the home folder and the inherited env. It attaches an `error` listener and calls `unref`. With `cwd` naming a removed folder, `--repo` is `CLAUDE_PROJECT_DIR`; with neither, nothing starts. The land starter, given its lane, spawns with the same option object. Pins: R-3350, the start, its folder fallback and its hidden Windows window, shared by both starters.

2. **Guarded, bounded and quick to exit.** The spawner is never called under `CI`, under `NANA_ROLE` set to `worker`, `reviewer` or the empty string, for empty, malformed or TTY input, or with `transcript_path` missing or not a string. In each case stdout and stderr are empty and the exit code is 0. With stdin left open and never written, the injected clock shows the hook gives up at its sealed deadline. A real child-process run with its stdin pipe held open exits by itself under a 5-second ceiling. A spawner that throws, or a child that emits `error`, still gives exit 0 and no output. Pins: R-3351, the guards, the stdin deadline and the self-exit.

3. **A broken checkout never shows a stack at exit.** A copy of the hook placed in a temporary folder with no sibling packages, run as a real process with valid SessionEnd input, exits 0 with empty stdout and stderr. Pins: R-3352, import safety.

4. **The hook is installed, checked, repaired and removed like the other hooks.** After `nana-setup install` into a temporary home: on darwin and linux, settings carry one SessionEnd group with no matcher and a shell-form entry through the `~/.claude/hooks` link, `timeout: 1.5`. On win32 (forced platform), the entry is exec form naming the checkout copy. Doctor shows healthy link and settings rows for it. Removing the link makes the stale-copy report name it. On win32, an existing SessionEnd entry naming a missing checkout path is rewritten to the current checkout by the next install, with exactly one SessionEnd entry afterwards. `nana-setup uninstall` removes the entry and the link and leaves other SessionEnd entries alone. A second install changes nothing. The install check's SessionEnd row runs the hook without `CI` and passes on the fixture; a scripted hook that prints output or exits 1 fails only that row. Pins: R-3353, the install, uninstall, install-check, stale-copies and win32 repair wiring.

5. **A push result is visible, and the clone tells the truth.** After a run whose push succeeds, the run line ends with `pushed`, and the clone counts 0 commits ahead of its tracking ref. After a run whose push is rejected (the bare remote refuses through a pre-receive hook), the run line carries `not pushed: rejected` and `nana-memory status` shows `unpushed 1`. The next run, or `nana-profile sync`, pushes the commit, and status then shows `unpushed 0`. In the late-update case, a save fetches, commits, pushes and moves the ref between a run's push and its ref update (injected `runGit` seam); afterwards the ref equals the remote and the count is 0. A refused ref update still reports `pushed`. After a `nana-profile save` with a successful sync, nothing is ahead. No output contains a canary owner string. Pins: R-3354, the push honesty fix from the 2026-11-01 runs.

6. **The started run outlives Claude Code's kill.** A real parent process plays Claude Code. The hook file is copied into a temporary tree whose `packages/nana-pack/bin/nana-memory.mjs` is a fixture that waits 3 s, past the 1,500 ms exit limit, then writes a marker file. The parent sends SessionEnd input. At 1,500 ms it kills the hook's process group and every process whose parent is the hook (POSIX: a `ps` walk by parent pid; win32: a tree kill of the hook pid), whether or not the hook is still alive. The marker appears within 10 s. The hook's exit came before the kill, and within a small ceiling after the spawn. A hook that awaits its child is still alive at the kill, and the descendant kill takes the child, so the marker never appears. On win32 the tree kill of an exited hook is a no-op, so the Windows leg pins only "the run outlives a normal hook exit"; the owner's check covers the rest. Pins: R-3355, detached survival, the automated half of the Windows check.

7. **Doctor shows when this machine last made memory, in counts only.** With a temporary agent dir holding a profile pointer, one enabled repository and a local last-run file, `nana-setup doctor` prints one `memory making` note with the enabled count, the run's age and outcome words, and `unpushed <n>`, with no repository id. A committed run file from another machine, newer than the local file, does not change the age. With no pointer or nothing enabled it reads `not enabled`; with no local file, `never`. A pointer to a missing clone, an unparseable local file and a failing `git` each give `unreadable`. The note never fails doctor in any case, and the install check's doctor-notes list accepts it on all three platforms. A canary owner string in the store appears in no doctor output. Pins: R-3356, the making health surface.

8. **A run with nothing to make leaves no trace in the store.** A run with zero pending units writes the local last-run file only. The clone's HEAD, its store files and the remote are unchanged, and no push is attempted. A run with one pending unit still commits and pushes. Pins: R-3357, quiet empty runs at session-end cadence.

Order if the builder must split: must-meets 1 to 4 and 6 (the hook and its wiring) come first; 5, 7 and 8 (push honesty, doctor, empty runs) follow in a second build. Eight tests fit one lane, so no split is planned.

Sealed tunables, each pinned by one seal test naming its row:
- R-3358: SessionEnd entry timeout, 1.5 seconds. Contract: the installed Claude Code 2.1.310 kills an entry at `min(timeout × 1000, …)` and bounds all SessionEnd hooks at `max(1500, …)`, so 1.5 gives a 1,500 ms per-entry kill with no longer exit delay (binary read, plan-attack, 2026-11-01).
- R-3359: hook stdin deadline, 300 ms. Chosen: Claude Code ends stdin at once, so this only bounds an open pipe, and leaves room for spawn and exit inside 1,500 ms after a typical start.
- R-3360: the SessionEnd hook entry: event `SessionEnd`, no matcher, file `nana-memory-end.mjs`, status message `nana: memory`. Contract for the installer and install check.
- R-3361: the run line's `pushed` and existing `not pushed: <reason>` words, and the `unpushed` word in status and doctor. Contract: fixed public vocabulary.
- R-3362: the doctor note label `memory making` and its `not enabled`, `never` and `unreadable` words. Contract: fixed vocabulary in `DOCTOR_NOTES`.

R-3363 to R-3369 stay free for a row the builder must split.

Expected changes to existing tests (a forecast, not a limit): `settings-merge.test.mjs` (desired list, the timeout gate), `install.test.mjs`, `restore.test.mjs`, `state-manifest.test.mjs`, `uninstall.test.mjs`, `hooks-win32-exec.test.mjs`, `win32-degrade.test.mjs`, `install-check.test.mjs` (hook row table, doctor notes, CI removal), `doctor-detail.test.mjs` if it counts rows, `memory-run.test.mjs` (land starter after the move, run line, status age from the local file, empty runs), `profile-sync.test.mjs` (ref update after push, the `HEAD` SHA in sync), and `skill-claims.mjs` and `templates-render.test.mjs` only if a README hook list they pin changes. The pack README contract notes gain the hook, the push word, the unpushed count and the empty-run behaviour. The nana-setup README hook list gains the SessionEnd entry.

Seat's wrong-code pairs (hook lane):
- The hook awaits the child, or `close`, or the stdin stream after the spawn.
- `windowsHide` is dropped from the shared option object.
- The guard checks `NANA_ROLE === "worker"` only, or treats an empty `NANA_ROLE` as unset.
- The hook statically imports a nana module.
- The stdin read has no deadline.
- The entry timeout is 1 (or 5).
- `mergeRepoHooks` keeps the literal `timeout === 5`.
- `update-ref` without the old value; or the ref moves before the push succeeds, or on failure; or a failed ref update reports `not pushed`.
- `makeMemory` drops the push result again.
- The doctor note reads `lastMemoryRun` (all machines) instead of the local file.
- The doctor note fails doctor when the last run failed, or throws on an unparseable file.
- An empty run commits.
- A real-process test inherits `CI`.

## Residuals

For the seat to record as known-bug lines in `docs/known-bugs/FEAT-040.md` at land:
- The review reader asks `refs/heads/main`, so an enabled repository with `docs/reviews/` and no `main` branch fails every manual make and status. With this hook it also fails every session-end run there. Widening that line is out of this lane.
- When the listing fails during make, `memory: failed; … pending 0` prints the starting value, not the true pending count.
- `status`, and `make` without a lane, start one git process per review folder.
- Two zero-wait clone-lock windows make a concurrent seat save report busy more often. Session-end runs make this more frequent; the empty-run skip (must-meet 8) narrows it but does not remove the fetch and recovery steps.
- A Windows start stalled past the 1,500 ms per-entry kill is cancelled before it spawns, and Claude Code prints `SessionEnd hook [...] failed: Hook cancelled` at that exit. The units wait for the next run. The worst measured whole-hook start was 1.36 s (R-2674 notes).
- Whether Claude Code on Windows kills the detached run some other way stays unchecked until the owner's machine check. The making-trigger known-bug line about this closes only after that check.
- The tracking-ref update assumes the default `origin` fetch refspec. A clone with a custom refspec keeps the old `ahead` display; the push itself is unaffected.
- `profileGit` spawns git without `windowsHide`. A visible window is not expected, through the hidden hop, but CI cannot see windows; the owner's check names it.
- The legacy hook migration in `settings.mjs` still gates on `timeout === 5`. It does not concern this hook, but a future hook with another timeout would meet it.
