# making-session-end — plan attack

Adversary for the plan in this folder. Facts were checked against the installed Claude Code 2.1.310 binary (strings at `~/.local/share/claude/versions/2.1.310`), the worktree at ad9612dd, and two scratch Git repositories. No paid session was started. No profile clone contents, transcripts or owner text were read.

## Verified facts (from the binary)

- SessionEnd bound: `$Me()` returns `max(1500, min(largest entry timeout ms, 60000), env override)`. All SessionEnd hooks share one `AbortSignal.timeout(bound)`. The plan states this correctly.
- **Per-entry kill: each entry runs with `an = entry.timeout ? min(entry.timeout*1000, …) : lFs()`, and `lFs()` is 1500 by default.** So an entry with `timeout: 1` is killed at **1000 ms**, not 1500. With no `timeout` field, or `timeout: 1.5`, it is killed at 1500 ms. The settings schema is `number().positive()` with no `int()`, so `1.5` is valid.
- A timed-out entry returns `{succeeded:false, output:"Hook cancelled"}`. `executeSessionEndHooks` then writes `SessionEnd hook [<command>] failed: Hook cancelled` to stderr unless Claude Code is in its quiet mode. `<command>` holds the absolute hook path.
- Timeout kill (`#E` → `Dw` → `MF`): Claude Code runs `ps` to list descendants **by parent PID**, then kills the hook's process group and every listed descendant. While the hook is alive, a `detached: true` grandchild is still its PPID-descendant and gets killed. `detached` protects the run only after the hook has exited and the run has been reparented.
- The hook process is spawned with `detached: !windows`, `windowsHide: true`, and stdin is written and ended at once. Completion waits for exit plus a stdout/stderr settle (500 ms quiet window, 10 s cap). `stdio: "ignore"` on the grandchild keeps the settle fast.
- Untrusted workspace: SessionEnd hooks are skipped (`workspace trust not accepted`). This is not a problem, just a fact.
- The owner's `~/.claude/settings.json` has no SessionEnd entry today, so this lane adds the first exit-time hook.

## Verified (scratch repo, git 2.50.1)

- The planner is right. `git push <url> <sha>:refs/heads/main` updates the remote but leaves `## main...origin/main [ahead 1]`. Pushing to the named remote updates the tracking ref. `git update-ref refs/remotes/origin/main <sha>` afterwards gives `count=0`.
- **The proposed fix has a race** (see M3). The scratch sequence was: the run pushes A; a concurrent save fetches, commits C, pushes C and moves the ref to C; then the run's late `update-ref … A` moves the ref back. The result was `[ahead 1]` / `unpushed=1` while the remote held C. A compare-and-swap `update-ref <ref> A <old>` refused the move, and the ref stayed correct.

---

## MUST

### M1. `timeout: 1` kills the hook at 1000 ms, not 1500; the plan's budget is wrong, and slow Windows starts become a noisy exit
**Failing case.** The plan budgets "500 ms stdin deadline, about 1,000 ms for Node start, spawn and exit" inside 1,500 ms. The binary kills a `timeout: 1` entry at 1,000 ms. Its own residual cites Windows hook runs of 1.36 s (R-2674 notes). On such a run, Claude Code kills the hook before or just after the spawn. It then prints `SessionEnd hook [node C:/…/nana-memory-end.mjs] failed: Hook cancelled` at the owner's exit, which is the "noisy exit" this lane must avoid. The run is also lost (see M2). The same 1,000 ms limit applies in the install check: `invoke(…, { timeout: expected.timeout * 1000 })`. The Windows install-check leg, which blocks release, becomes flaky.
**Fix.** Set the entry to `timeout: 1.5` (or omit the field; both give a 1,500 ms per-entry kill and the same 1,500 ms bound, so exit delay does not grow). Re-seal R-3357 at 1.5 with the binary reading as provenance (`an = min(timeout*1000, …)`, `lFs()=1500`). Keep the stdin deadline at 500 ms, or lower it, since Claude Code ends stdin at once.

### M2. The installer's ownership gate is hard-coded to `timeout === 5`, so a win32 SessionEnd entry is never repaired
**Failing case.** `mergeRepoHooks` (settings.mjs:481, 489, 519) skips any entry whose `timeout !== 5`, and the legacy migration (582) does the same. On win32 every entry names the checkout copy. After the owner moves or re-clones the checkout, the next `nana-setup install` finds the SessionEnd entry by `hasHook` (script name), so it adds nothing. The repair then skips the entry because its timeout is 1 (or 1.5). The stale entry stays. At every exit Claude Code runs `node <old path>`, which fails with `Cannot find module`, and Claude Code prints `SessionEnd hook [...] failed: …` on every exit, indefinitely. Must-meet 4 checks that the repair *detail* names the install command, but not that the repair happens.
**Fix.** Compare against each wanted row's own `w.entry.timeout` in `mergeRepoHooks` instead of the literal 5. Add a win32 case to must-meet 4: a SessionEnd entry that names a missing checkout path is rewritten to the current checkout on re-install, with exactly one entry afterwards. Add the timeout-literal pair to the seat's wrong-code pairs.

### M3. The tracking-ref update races a concurrent fetch and can report "unpushed" for commits that are on the remote
**Failing case.** `makeMemory` pushes after releasing the clone lock, by design, so the planned `update-ref` also runs outside the lock. A seat `nana-profile save`, or a second session-end run from `/clear` twice, can hold the lock meanwhile. It fetches, rebases, commits C, pushes C and moves the ref to C. The first run's late plain `update-ref … A` then moves the ref backwards. The scratch repo shows `[ahead 1]` and `unpushed 1` while the remote holds C. Doctor and status now say a pushed commit is unpushed. That is a wrong push status, and it persists until the next fetch.
**Fix.** Read `refs/remotes/origin/<branch>` before the push, then run `git update-ref -m "push" refs/remotes/origin/<branch> <sha> <old>` (compare-and-swap; the `-m` keeps the reflog readable, as the root-cause investigation relied on). A refused or failed `update-ref` must not change the push result: the push succeeded. In `syncProfile`, resolve `HEAD` once and push that SHA instead of `HEAD`, so the pushed commit and the ref agree. Add the late-update case to must-meet 5 and a pair: "update-ref without the old value".

### M4. Must-meet 6 (and every real-process hook test) runs under `CI` and `NANA_ROLE`, so it either fails or is written to be vacuous
**Failing case.** The hosted legs set `CI`. Builder runs set `NANA_ROLE=worker` (pi-worker). The hook's own guard returns without a spawn in both cases. So must-meet 6's marker never appears in CI or under the builder. The easy repair, skipping under CI, removes "the automated half of the Windows check" that the owner question's default depends on. The same applies to the install check. `buildEnvironment` strips `NANA_ROLE` (OVERRIDE_ENV) but not `CI`. On all three CI install-check legs the SessionEnd row therefore passes through the guard alone, and never exercises the import, the spawn or the CLI path.
**Fix.** The real-process tests must build the hook's env explicitly, without `CI` or `NANA_ROLE`. They must also assert that the marker appears in CI. In the install check, either strip `CI` for the SessionEnd invocation only, or state in the plan that only the local macOS install check exercises the spawn path. A third option is to add `CI` to the row's own env removal. The plan's claim "In that home the run it starts finds no pointer" is false in CI today.

### M5. The doctor note reads the newest run from any machine, so it cannot show that this machine's hook never starts
**Failing case.** `lastMemoryRun` merges the local last-run file with every committed run file for the repository and returns the newest. The run files are synced through the shared private repository. The owner runs on a Mac and on a Windows machine. Suppose the Windows hook never starts (the unverified Windows risk this plan names), while the Mac makes a run each session. Then `nana-setup doctor` on Windows reads "last 1200s complete" from the Mac's committed run. The one health surface that should catch "making never runs here" reads healthy. The owner's Windows check ("`nana-memory status` shows a new run") has the same blind spot whenever a Mac run arrives through the run's fetch.
**Fix.** The doctor note and the status age read this machine's last-run file in the clone's git directory. That file is machine-local by construction. With no file, the note shows `never`. Keep `lastMemoryRun` for the land line if wanted. Must-meet 7 gains a case: a committed run from another machine newer than the local file does not change the note's age.

---

## SHOULD

### S1. Exit promptly after the spawn; a hook still alive at the kill takes its run with it
Claude Code's timeout kill lists descendants by PPID (see the facts above). `detached: true` saves the run only once the hook has exited. The plan says "exits 0" but never says how. The `for await` over stdin in `readHookInput`, raced against a deadline, keeps the event loop alive when stdin stays open. The roster-notice precedent calls `process.exit(0)`. **Fix:** spawn last, then `unref()` and `process.exit(0)` at once. In must-meet 2, state that the real-process stdin-open run keeps the pipe open, and that the hook exits by itself under the ceiling.

### S2. Must-meet 6 does not model the kills that matter
(a) It kills the hook's group *after* the hook has exited. On POSIX that catches a missing `detached`, but not the real Claude Code kill, which is a descendant walk while the hook is still alive. (b) On win32, a tree kill of an already-exited PID is a no-op. The test then passes for any code that spawns at all, because Windows children never die with their parent. (c) The fixture waits 1 s, which is less than the 1.5 s bound. A hook that awaits its child then still "exits inside the bound", so this test alone does not catch the first wrong-code pair. **Fix:** make the fixture wait 3 s. Assert that the time from spawn to hook exit stays under a small ceiling. On win32, state plainly that the test pins only "the child outlives a normal hook exit", and leave the residual open.

### S3. A run commits and pushes even when it found nothing
`makeMemory` always writes a run file, commits `Make project memory` and pushes, even with zero units. At land cadence that was cheap. At every `/clear`, `/resume` and exit, it means one fetch, one commit and one GitHub push per session end. It also widens the clone-lock windows that the residuals already name, and grows the run-file set that status and doctor parse on every call. **Fix (choose one, and state it in the plan):** when `units.length === 0`, keep only the local last-run file and skip the commit and push. Or record this as an accepted cost in the residuals.

### S4. Input `cwd` may name a removed worktree; the hook has a better folder in its environment
A1 accepts that the run fails when the seat's worktree was removed before exit, and the land cleanup does exactly that. Claude Code sets `CLAUDE_PROJECT_DIR` in every hook's env. **Fix:** `--repo` uses the input `cwd` when it exists, else `CLAUDE_PROJECT_DIR`. This is one line, and it retires A1's residual.

### S5. Doctor note error paths the threat model names but no test pins
The threat model lists "a run file it cannot parse". Must-meet 7 tests no pointer, nothing enabled and no run. **Add:** a pointer to a missing clone, an unparseable local last-run file and a failing `git` each give a note with a fixed word, never a throw or a failed doctor.

### S6. The push word duplicates the unpushed count
Once M3 is fixed, the unpushed count is the truth about the remote. The push word in the local last-run file adds a second store of the same fact, and a busy or early-failed run overwrites it with nothing. **Subtraction:** keep the push word on the `make` run line, where a person reads it at once. Let status and doctor show only `unpushed <n>`. That drops one stored field, one doctor detail and part of R-3360.

---

## NOTE

- N1. Recursion guards hold. The memory runner sets `NANA_ROLE=worker`, `--setting-sources ""` and the temp `cwd`. claude-review and visual-reader pass `REVIEWER_CHILD_ENV`. pi-worker sets `NANA_ROLE=worker`. The hook inherits Claude Code's env (`{...process.env}` in the hook spawner), so the guard sees the role.
- N2. Windows windows. The run's `profileGit` spawns `git` without `windowsHide`. It inherits a hidden console through the `memory-run.mjs` hop (spawned with `windowsHide`), so I expect no flash, but CI cannot see windows. The owner's Windows checklist should name "no window during the run, including its git calls", not only "no window at exit".
- N3. `statusMessage` (R-3359) appears in Claude Code's UI while the hook runs at `/clear` and at exit. Pick a short neutral message. It is the one visible trace of the hook.
- N4. Must-meet 1 pins the option object, which restates the implementation. That is acceptable as the contract for `windowsHide` and `detached`, but no must-meet pins the user value: that the named transcript's units get made. The landed `--session` tests cover it. Name them in the plan so the reviewer does not look for a new one.
- N5. The doctor note prints a 16-hex folder id per enabled repository, and doctor output is sometimes pasted into public issues. An id derived from a work repository's root commit is not text, but it is linkable. Consider printing a count of enabled repositories, plus the id only under a flag.
- N6. Residual wording. "A Windows start stalled past the 1,500 ms bound is killed before it spawns" becomes accurate only after M1. Today the limit is 1,000 ms.
