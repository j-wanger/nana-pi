# making-trigger — plan attack

Adversary pass over `plan.md` (2026-11-01), against main 8c665dcd code and the installed Claude Code 2.1.310 binary (read with `strings`; no paid session started).

Facts checked in the installed Claude Code, used below:
- SessionEnd reasons are `clear`, `resume`, `logout`, `prompt_input_exit`, `other`; the input is the base hook input plus `reason`, and the reason is also the matcher query.
- The shared SessionEnd bound is `max(1500 ms, min(largest per-hook timeout, 60 s))`, or `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS`. A 1-second entry timeout leaves the bound at 1500 ms, as the plan says.
- A failed SessionEnd hook with output is printed to the owner's terminal at exit (`SessionEnd hook [<command>] failed: <output>`).
- Hooks are spawned in their own process group, and Claude Code registers an exit cleanup that kills that group. A grandchild survives only if it is `detached: true` (its own session and group).
- The extractor's `claude -p` call (`callJudge`) passes `--setting-sources ""` and `--no-session-persistence`, so it loads no user hooks and writes no transcript. That, and its `cwd: os.tmpdir()`, are the operative recursion guards; `NANA_ROLE` is the third.
- `claude-review` reviewers (`REVIEWER_CHILD_ENV`) and `pi-worker` builders set `NANA_ROLE`, so the hook's `NANA_ROLE` guard covers them.

## MUST

### M1. "The next run sends them" has no next run: busy, capped and failed sources are never revisited

Every run is scoped to one source: `make --session <transcript_path>` or `make --lane <lane>`. A session that has ended is never ended again (unless resumed), and a lane lands once. So the units a run leaves above the watermark wait for a run over the same source that never comes.

Failing cases:
- Two lanes land five minutes apart (normal on a slate). Land 1's run holds the per-repository lock for several minutes of model calls. Land 2's run finds it held, prints `busy` and exits (A10). Land 2's review lessons are never made.
- The seat runs `/clear` twice in a minute. The second session's run is `busy`; that session is never made.
- The per-day cap is reached at 4 pm. Every later session that day prints the cap line; none of them is ever made.

Must-meet 2 ("the next run sends exactly them") and must-meet 1's overlap case pass only because the test re-runs the same transcript, which does not happen in production.

Fix: keep a per-machine pending list (in the clone's git directory, beside the day counter, never in the work tree) of sources whose run was busy, capped or failed. Every run drains the pending list under its caps before or after its own source. Change must-meet 1 and 2: a busy or capped run over session A, then a run over session B, sends A's units; a capped land, then a later session run, sends the land's units.

### M2. A failed model call marks units processed, so an offline or logged-out session end loses them

O1 marks a rejected batch "processed once". In `extractShaped`, a runner that fails (`ok: false`: auth failure, network down, timeout, CLI missing) and a reply that fails validation both land in the same `unclassified` count. `claudeRunner` returns `failed()` for every `callJudge` throw.

Failing cases:
- The owner runs `/logout`. SessionEnd fires with reason `logout`, after the credentials are gone. Every batch fails auth, every unit is marked processed, and that session is never made.
- The laptop lid closes at exit; the network drops; every call fails; same loss.
- On Windows with an npm-installed Claude Code, `spawnSync("claude")` cannot start `claude.cmd`; every automatic run marks everything processed.

Fix: split the count. A batch whose call did not complete (`ok: false`, no reply text) stays unsent and goes to the pending list (M1). Only a completed call whose reply fails validation is marked processed once. Add a must-meet: a runner returning `ok: false` leaves every unit unsent; a runner returning malformed JSON marks the batch processed once.

### M3. Calls with unknown usage cost nothing against either cap

`extractShaped` adds spend only when `usage.tokens` is a finite number. A call with unknown usage adds zero tokens, so `totalTokens(spend) >= cap` never trips. The day ledger fed from the same total also gets zero.

Failing case: a Claude Code release renames `modelUsage` or its bucket fields (honest variation in our tools' output, in scope). Every call parses as unknown usage. The per-run and per-day caps never trip, and only the per-call `--max-budget-usd 0.50` bounds spend, per call, unbounded in count, at every session end and land.

Fix: charge each unknown-usage call a sealed worst-case token amount against both caps (for example the token equivalent of the per-call dollar cap, named and pinned), or stop the run after the first unknown-usage call and leave the rest unsent. Add the case to must-meet 2.

### M4. The run reads every transcript and every review folder, so the first automatic run is the backfill

`extractShaped` always walks `transcriptUnits` (every transcript under the folder key for the repository and its `-wt` worktrees) and then `reviewUnits` (every folder under `docs/reviews/`). The plan says the run "passes a unit filter", but no must-meet pins that the filter excludes the other source.

Failing cases:
- The first land run, with an empty watermark, sends all 146 historical review titles plus every owner turn in every nana-pi transcript.
- The first session run also sends every review title in the repository.
- With M1's deferral rule, the units over the cap are then re-sent by each later run. The history is backfilled piecemeal across sessions, which the plan reserves for slice 4 "under its own cap".

Fix: a session run reads exactly one transcript file and no reviews. A land run reads only `docs/reviews/<lane>-<date>/` and no transcripts. Add a must-meet: with other transcripts and other review folders present, each trigger sends only its own units.

### M5. One shared rewritten file or a lock file in the work tree poisons the profile's two-machine sync for seat saves

The store shares the profile clone, so any rebase conflict in `projects/` breaks the existing `nana-profile save` sync. `syncProfile` aborts a failed rebase and returns `rejected`, and the local commit stays, so every later sync from that machine fails the same way. O1, O4 and O5 leave open whether files are rewritten, and the plan does not say where the per-repository run lock lives.

Failing cases:
- The builder picks one watermark file per repository (`projects/<id>/seen.json`). Both machines make memory for nana-pi and both modify it. The second machine's rebase conflicts, and from then on its seat saves report `not pushed: rejected`.
- The run lock is written as `projects/<id>/run.lock`. A concurrent `nana-profile save` runs `commitProfile`, whose allowed folders now include `projects`. It commits and pushes the lock, and the other machine's runs see it as held.
- The run writes unit copies while it calls the model (outside the clone lock). A concurrent save commits a half-written JSON file.

Fix: seal three rules. Every file under `projects/<id>/` is exclusive-create, named with a machine-unique part, and never modified. Locks, the day ledger, the pending list and scratch files live in the clone's git directory. The run writes store files only inside `withProfileLock`. Add a must-meet with two clones of one bare remote: each makes memory for the same repository, then both sync, then both `nana-profile save` and sync, all without a conflict.

### M6. On Windows, every detached run opens a console window that stays open for the whole run

Node documents that `detached: true` on Windows gives the child its own console window. The precedent `spawnBuild` sets no `windowsHide`. The run lasts minutes (300 s timeout per batch). So every seat exit and every land on Windows would open a visible console window. Windows testing is required here, and the Windows suite leg blocks release.

Fix: both starters spawn `process.execPath` with `detached: true, stdio: "ignore", windowsHide: true`, an `error` listener and `unref()`. Pin the option object in the hook and land starter tests on all platforms.

## SHOULD

### S1. The land starter's default would spawn real runs from about 60 in-process `runLand` calls in the suite

`runLand` is called in-process by `land.test.mjs` (39 calls), `land-records`, `land-ci-records`, `path-spelling`, `land-fixtures` and others. The plan relies on each test injecting a no-op starter. One missed call starts a real detached `nana-memory make` with `cwd` in a temporary checkout. On Windows that child holds the folder, and the test's cleanup fails with `EBUSY`, the class behind the known Windows leg failures. On the owner's machine it starts a node process per call.

Fix: `runLand` gets no real starter by default (no-op). Only `main()`, the CLI entry, passes the real starter. That leaves existing tests untouched. The real starter also checks `CI` and `NANA_ROLE` before it spawns, and starts the child with `cwd` set to the home folder, not the main checkout.

### S2. Placing the starter "after the end line" skips making whenever the land record is not kept

`runLand` returns early when the start record was not kept, and again when the end record was not kept, before the land-record line. A starter placed after the end line never runs on those lands, although the merge landed. Must-meet 7 does not cover it.

Fix: decide "start" from `result.code === 0 && start?.lane` independently of the record outcome, and append the fixed line after whichever closing line was written. Add a must-meet case with an unwritable land ledger: still one start.

### S3. Watermark and dedup must key on the owner unit, not on the file, evidence or record id

- O1's "one file per transcript session" re-sends a forked or copied session. A forked transcript carries the same entry `uuid`s under a new file.
- A record's `evidence` is `<unit>+<seat uuid>`, and the seat entry depends on the kind the model chose (`pairedSeat`). A record's `id` hashes evidence and the model's claim, which varies between calls. So "the same source unit twice leaves one record" fails if dedup uses either. That happens when a unit is re-sent after M1 or M2.

Fix: the watermark and the dedup key are the owner unit key `claude-code:<session>#<uuid>` (the evidence before `+`) and the review key `review:<folder>/<file>#<index>`, kept repository-wide.

### S4. AskUserQuestion answers become records without a model call, so a watermark over "sent" units misses them

`extractShaped` emits an ask record directly. If the watermark records only units sent to the model, every run re-emits every ask in the transcript. Must-meet 1 ("a second run writes no record") then fails only if the fixture has an ask.

Fix: the watermark covers ask units. Must-meet 1's fixture includes one ask.

### S5. The day cap is per machine, but the lock is per repository, so concurrent runs overshoot by more than one batch

Two repositories ending sessions at once, or a land run and a session run in different repositories, each read the day ledger below the cap and each spend up to their per-run cap. Must-meet 2's "never passes either cap by more than one batch" is false for N concurrent runs.

Fix: reserve each batch's tokens in the day ledger under a short machine-wide lock before the call, then settle to the reported amount after it.

### S6. The root-commit id moves under shallow clones and merged histories

- In a shallow clone, `rev-list --max-parents=0 HEAD` returns the shallow boundary commit, and the id changes again after `fetch --deepen`.
- "Lowest sorted root" changes when an unrelated history with a lower-sorting root is merged in, for example a subtree import. The store splits silently, and the old folder's watermark is orphaned.
- Forks share the root by design. A repository started by cloning another and keeping its history collides with its parent. No two of the 30 repositories on this machine share a root today, so this is a residual, not a current case.

Fix: `nana-memory enable` records the id it computed. Resolution picks the root that is already in the enabled list, not the lowest. A shallow repository (`rev-parse --is-shallow-repository`) is skipped with a fixed line.

### S7. The private unit copy should keep only what evidence needs

`unitsIn` carries the full owner text and up to three full seat messages per owner unit (`substantial`, `question`, `lastSeat`), uncapped. "A private copy of the units it read" therefore copies every owner turn of every session, including turns that produce no record. It also copies a pasted log, or a pasted token, into the private remote's history, where it cannot be removed without a history rewrite. If O4 picks "one file per session rewritten per run", git history keeps each version, so size grows with the square of resumes.

Fix: copy only units that produced a record, and only the two texts `resolveEvidence` returns (owner text and the one paired seat entry), each under a sealed byte cap. Write one exclusive file per run with only that run's new units. Add the honest case "the owner pastes a secret in a turn that yields no record" to the threat model, with the expectation that it is not copied.

### S8. The run lock needs a staleness rule that survives pid reuse

`lane-lock.mjs` only releases; it has no acquire or staleness logic. `withProfileLock` evicts only dead pids older than 120 s. A run legitimately lasts many minutes, and a run killed at logout or shutdown leaves its lock. After a reboot the stored pid can belong to another live process, so `kill(pid, 0)` says alive, every later run prints `busy`, and making stops for good, silently.

Fix: store the pid with a start time (or boot id), and treat a lock older than a sealed maximum run time as stale. Derive that maximum from the batch timeout and the per-run cap, named in config.

### S9. The run should not hold the clone lock across network fetch and push while the seat saves

`withProfileLock` waits up to `PROFILE_LOCK_WAIT_MS` (420 s). The run's sync does a fetch, a rebase, a push and one retry, each up to 15 s, under the lock. A seat `nana-profile save` issued then blocks the seat's shell for that time. Several queued runs after a burst of `/clear`s stack up.

Fix: the run commits locally under the lock with a non-blocking try. On contention it skips and leaves the commit for the next sync. It pushes in a separate short lock hold, or leaves the push to the seat's next save or sync.

### S10. An interrupted git step in the detached run breaks later seat saves

SessionEnd often fires at logout, terminal close or shutdown. A run killed mid-`git add` or mid-`commit` leaves `.git/index.lock`. `recoverProfile` repairs only a stopped rebase, so every later `nana-profile save` fails with `git failed` until someone removes the lock file by hand.

Fix: under the profile lock, remove an `index.lock` older than the git timeout when no git process owns the clone. Or skip the store write when the reason is `logout`, leaving the source pending (M1).

### S11. The hook needs its own stdin deadline, must not crash on import, and should pass the session's cwd

- `readHookInput` reads until EOF. If stdin stays open, the hook sits until Claude Code kills it at 1500 ms. Must-meet 6 should include an open, never-closed stdin and assert the sealed bound by the hook's own deadline.
- A static import that fails (the main checkout mid-rebase, a renamed module) throws before any try/catch. Claude Code then prints `SessionEnd hook [...] failed: <stack>` on every exit. Keep the hook's static imports to `node:` built-ins and load the rest inside a try, or make the hook self-contained.
- The plan's child command passes only `--session <transcript_path>`. Pass the input's `cwd` explicitly too. The child's inherited cwd can be a worktree the seat has since removed.

### S12. Making fails silently, with no health surface

The hook and the starter print nothing, and the child's stdio is ignored. A Windows parent that kills detached grandchildren (A2 is checked in CI only with node as the parent, not Claude Code's own process tree), a Claude CLI change, a dirty clone (`commitProfile` refuses `dirty`) or a stuck lock (S8) would all stop making with no sign. Principle 3 asks every station to emit numbers.

Fix: the run log already planned (O5) records the last run's time and counts. Add one `nana-setup doctor` row (or a hook-health line) for "last making run: <age>, <outcome>". Record A2 on Windows under a real Claude Code parent as unverified until checked on a machine.

### S13. Helper moves the plan does not name

The Precedent section names only `exclusiveJson`. The builder will also need:
- `profileGuard` in `nana-profile.mjs`. It is private and computes `checkout` relative to its own file (`../../..`), so moving it to a lib changes that path.
- `dailyCounter`, the precedent for the day ledger, and `seatGuard`. Both are private in `nana-profile.mjs`.
- `unitsIn` and `sourceFiles` in `memory-making.mjs`. Both are private, and the run needs a one-file walk and the private-copy fallback.
- `LANE_NAME_PATTERN` in `nana-land.mjs`. The run validates `--lane`, so it is a second caller; move it to `land-config.mjs`.

Name each move in Precedent, per the 2026-10-22 ruling.

### S14. Must-meet tests that restate the implementation, and the missing ones

- Must-meet 4's "`nana-profile save` and the run both call the same merge function" pins a call graph. Keep the outcome: one live record across both areas, read through the store reader.
- Must-meet 6's wall-clock bound will flake on the Windows runner. Assert that the hook awaits nothing after the spawn (an injected spawner and a fake stdin), plus one generous timing ceiling.
- Must-meet 2 tests only a rerun of the same transcript (see M1).
- Missing must-meets: M1 (cross-source drain), M2 (failed call stays unsent), M3 (unknown usage counts), M4 (scope isolation), M5 (two-clone sync with saves), S1 (CLI-only real starter), and `nana-profile save` from a cwd outside any repository still saves.

Wrong-code pairs for the seat:
- The hook awaits the child.
- The starter is called inside `lockReviews` or before the containment check.
- A run with `ok: false` marks units processed.
- Unknown usage is charged zero.
- A session run reads `docs/reviews`.
- The guard checks `NANA_ROLE === "worker"` only.
- The watermark is keyed by transcript file.
- The lock file sits under `projects/`.
- `windowsHide` is dropped.
- `runLand` defaults to the real starter.

## NOTE

- N1. The cross-area merge (A8) will rarely fire. Profile saves refuse `decision`, so seat saves and extracted records overlap only on `correction`. An exact normalized-claim match between the seat's wording and a model-written claim is unlikely. Must-meet 4 pins a synthetic exact match. That is fine as a seam, but the land report should say the merge catches exact repeats only, and the reworded-duplicate known-bug line should name this.
- N2. `PROFILE_PATH_POLICY.max` is 180. The path `projects/<40 hex>/records/<64 hex>/<stamp>-<24 hex>.json` is about 173 characters. A SHA-256 object-format repository (64-hex root) exceeds it, and `exclusiveJson` throws `invalid user configuration`. Windows `MAX_PATH` also bites when the clone folder path is long. Include the longest id in the layout seal test, or shorten the folder names.
- N3. Build the lane-folder pattern from an escaped lane name and anchor it (`^<lane>-\d{4}-\d{2}-\d{2}$`). `LANE_NAME_PATTERN` allows `.`. Unanchored, lane `memory` would read `memory-shaper-2026-10-31`.
- N4. The opt-in list and the profile pointer are read from pi's active agent dir. A Claude Code hook's environment may lack `PI_CODING_AGENT_DIR` when pi's has it, so `enable` and the hook could read different files. The same holds for the pointer today. State it in the README's contract notes.
- N5. The installed Claude Code group-kills the hook's process group at exit, and its tree enumerator also kills descendants by parent pid while the hook is alive. The hook must exit well inside the bound so the child is re-parented first. This is inferred from the binary and not run here.
- N6. A new hook in `packages/nana-setup/claude/hooks/` importing from `packages/nana-pack/` is a cross-component import. Declare it so `map:check` stays green. Install wiring needs `settings.mjs` (POSIX shell form and win32 exec form), `install-check-config.mjs` `HOOKS`, `hook-health.mjs`, `stale-copies.mjs`, `uninstall.mjs` and the win32 repair test. The forecast list omits `stale-copies.mjs`.
- N7. Background spend draws on the same Claude account as the seat, at the moment a land or session ends. The day cap bounds tokens, not rate limits. The day boundary in the existing counter is UTC (`toISOString`), while transcript days are EDT (`edtDay`). Name which one the day ledger uses.
- N8. Threat model: add two honest cases to the in-scope list, an owner turn holding a secret (S7) and a run killed at shutdown (S8, S10).
