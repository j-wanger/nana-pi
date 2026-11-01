# making-trigger — plan (revision 2)

Worktree `~/nana-pi-wt/making-trigger`, branch `feat/making-trigger`, based on main 8c665dcd.
Grounding: `docs/memory-factory-design-2026-10-31.md` version 2 ("What a memory is about", "Where memory lives", "When making runs"), `docs/known-bugs/FEAT-040.md`, `docs/reviews/memory-shaper-2026-10-31/scored-runs.md`, and the adversary's `plan-attack.md` in this folder. Revision 2 takes every MUST (M1 to M6) and every SHOULD (S1 to S14) of that attack, and the notes listed under Residuals.

## Purpose

Agreed reading (owner, 2026-10-31 and 2026-11-01): the model extractor (`npm run memory:shape`) is the maker. Making runs at the end of each seat session over that session's new turns, and as part of each land over the lane's review folder, never nightly. A watermark keeps each run to new units. Output goes into a private project store keyed by repository, never by folder and never in a public repo. Records carry subject (user or project) and scope (global or local, starting local). Seat saves and extracted candidates enter through one merge step, so the same claim is not stored twice. Delivery to agents is out of scope until the builder-context experiment reports. Transcripts are deleted after 30 days, so each run keeps a private copy of the units it needs for evidence.

### The split

The attack's fixes take the single lane past eight must-meet tests, so the work splits in two lanes. **This lane comes first.**

1. **making-trigger (this plan, gate lane).** The making run and its store: `nana-memory make`, `enable` and `status`; the per-unit watermark with a sweep of every pending unit; caps that charge unknown usage; the sealed start instant; the store area inside the private profile clone; locks and ledgers outside the synced work tree; one merge step; the private evidence copy; and the land trigger in `nana-land`. After this lane lands, every land makes memory, and each run also sweeps the seat's pending session turns since the start instant. So session turns are made at the next land, without a new hook.
2. **making-session-end (next, hook lane).** The Claude Code `SessionEnd` hook with its install, uninstall, install-check, stale-copies and win32 repair wiring; its stdin deadline, import safety, cwd passing and recursion guards; a `nana-setup doctor` row for the last making run; and the Windows check under a real Claude Code parent. It calls the run and starter this lane builds. Its rows continue in SUB-024 after this lane's last row.

Later slices: pi session making (a pi transcript unit reader plus a `session_shutdown` trigger); model labelling of user versus project subject, with a scored run; upkeep (reworded duplicates, evidence recheck, retire, promotion to global); a privacy recheck of the store remote on every run.

### Decisions, with reasons

- **Store location (owner answer, Q2): `projects/<repository folder>/` inside the existing private profile clone.** It reuses the verified private push target, the clone lock, the append-only layout, the conflict-free sync and the checkout guard. One clone gives the merge step one place to read.
- **Repository id.** `nana-memory enable` computes the repository's root commits (`git rev-list --max-parents=0 HEAD`), refuses a shallow repository (`git rev-parse --is-shallow-repository`) with a fixed line, and records the chosen root in the user-scope opt-in list. Resolution later picks the root that is already enabled, not the lowest sort, so a merged-in history does not move the key (S6). A shallow repository is skipped by every run with a fixed count line, never keyed by its boundary commit. Folder-based keys (`repoKeyOf`, `projectKey`) are not used, by the owner's rule.
- **Folder name and path length (N2).** The store folder is the first 16 hex characters of the root id; the full id sits in an exclusive `repository.json` in that folder, and a mismatch refuses with a fixed line. The longest record path then stays under the profile's 180-character limit even for a 64-hex SHA-256 root. The layout seal test uses a 64-hex root.
- **Opt-in (owner answer, Q1).** Making runs only for repositories enabled on each machine with `nana-memory enable`, starting with nana-pi on this machine. A repository not enabled is never read.
- **Start instant (M4).** The first automatic run starts at a sealed instant, the end of the frozen labelled snapshot (`2026-10-31T18:16:00Z`, scored-runs.md). Units before it are never sent automatically. A backfill stays the manual `npm run memory:shape`.
- **Watermark (M1, M2, S3, S4).** The unit key is the owner unit `claude-code:<session>#<uuid>` (the evidence before `+`), the ask unit's owner entry the same way, or the review key `review:<folder>/<file>#<index>`. A key is "done" once written to a seen file. Seen files are exclusive-create, one per run, with a machine-unique name, holding keys and states only (no text), inside the store, so both machines share them without rewriting a file. Pending is derived: every unit after the start instant whose key is not done. So no separate pending list is needed, and nothing is lost to a busy, capped or failed run.
- **Sweep (M1).** Every run, from any trigger, sweeps pending units under its caps. The order is the triggering source first, then this repository's other Claude Code transcripts on this machine with entries after the start instant, then landed review folders in the main checkout dated on or after the start day. Lane folders match an anchored, escaped `^<lane>-\d{4}-\d{2}-\d{2}$` (N3). Unlanded review folders in worktrees are never read.
- **Done states.** An ask answer becomes a record without a model call and is marked done on its own path (S4). A unit whose call completed with a valid reply is done. A completed call whose reply fails validation marks its batch done once, as `unclassified`. A call that did not complete (`ok: false`: auth, network, timeout, a CLI that will not start) leaves its batch pending (M2). A unit skipped for no pairable seat context is done as `skipped`.
- **Spend caps (M3, S5).** Per run: a token cap and a call cap. Per machine per UTC day (N7, same boundary as the profile day counter): a token cap. A call with unknown usage is charged a sealed pessimistic token amount against both caps. Each batch reserves that pessimistic amount in the day ledger under a short machine-wide lock before the call, and settles to the reported amount after it, so concurrent runs in different repositories cannot overshoot. The existing per-call dollar cap (R-3263) still applies.
- **Locks and machine state (M5, S8).** The day ledger, the reservation lock and each repository's run lock live in the profile clone's git directory (one clone per machine, so it is machine-wide), never in the work tree. A run lock holds pid, host and creation time. A run stops itself before a sealed maximum run time, derived in config from the call cap and the batch timeout. A lock older than that maximum, or whose pid is dead, is stale and taken over, so pid reuse after a reboot delays making by at most that time.
- **Writes and sync (M5, S9, S10).** Every file under `projects/<folder>/` is exclusive-create with a machine-unique name and never modified. The run holds the clone lock only for local steps, with a non-blocking try: abort a stopped rebase, remove an `index.lock` older than twice the git timeout, rebase onto the already-fetched remote ref, write its files, commit. It fetches before taking the lock and pushes the captured commit SHA after releasing it. A rejected or failed push leaves the commit for the next run, save or sync. On lock contention the run writes nothing and leaves its units pending.
- **One merge step.** The store reader indexes user and project records by normalized claim (`claimId` over `normalizeProfileText`) and by unit key. An extracted candidate whose unit key or normalized claim already has a live record is not stored again. A seat save that matches a live extracted record is stored, and the extracted record is hidden by an exclusive supersede event, so the owner's own words are the live copy. Reworded duplicates are not caught (N1); that is upkeep.
- **Private evidence copy (S7).** Only units that produced a record are copied, and only the two texts `resolveEvidence` returns (owner text and the one paired seat entry), each under a sealed character cap, in one exclusive file per run. A turn that yields no record is never copied.
- **Land hook point (S1, S2, M6).** `runLand` takes an injected starter that defaults to a no-op; only `main()`, the CLI entry, passes the real starter, so no test can start a real run. After the merge result is final, the land calls the starter when `code === 0` and the lane is known, whether or not the land record was kept. That is after the review lock is released and after containment is checked. It appends one fixed line after whichever closing line was written. The real starter returns without spawning under `CI` or any `NANA_ROLE`. Otherwise it spawns `process.execPath` with `detached: true, stdio: "ignore", windowsHide: true`, `cwd` set to the home folder, `--repo <main checkout>` and `--lane <lane>`, an `error` listener and `unref()`. The land never waits on the child.
- **Health (S12).** Every run writes one exclusive counts-only run file (time, outcome word, sent, done, pending, unsent, unknown-usage calls, tokens). `nana-memory status` prints the newest run's age and outcome and the pending count for the current repository. The land's fixed line includes the same last-run age and outcome, so a land shows when making has stopped. The doctor row is in the second lane.
- **Privacy.** Every command, land line and run file prints counts and fixed words only. Nothing runs under `CI`. The store sits outside every nana-pi checkout and pushes only to the verified private target. Tests use synthetic text and a canary.

## Assumptions

- A1. The making run needs the `ownerProfile` pointer from `nana-profile init`. With no usable pointer, the run exits with a fixed line and writes nothing.
- A2. The opt-in list and the profile pointer are read from pi's active agent dir. A Claude Code process whose environment lacks `PI_CODING_AGENT_DIR` when pi's has it reads a different file (N4); the pack README's contract notes say so.
- A3. Subject and scope default by source until a later slice: extracted owner corrections, decisions, asks and review lessons are `subject: project`, `scope: local`, with the repository id. Seat saves stay `subject: user` in the existing profile area. Changing the sealed, scored prompt (R-3268) to classify subject is out of scope.
- A4. Records start at the existing starting state (`trust: low`, `source: extracted`, R-3204) and the run never raises trust.
- A5. The run reuses the shaper's runner, model, batch size, owner and seat caps, timeout and prompt unchanged (R-3258 to R-3268). `extractShaped` gains injected caps, a unit source and a split between failed and malformed calls; the hand-run `memory:shape` keeps its sealed cap and output.
- A6. On Windows with an npm-installed Claude Code, the runner's `spawnSync("claude")` may not start `claude.cmd`. Under this plan those calls fail, units stay pending and `status` shows it; fixing the runner is not in this lane.
- A7. The run's own transcript sweep finds transcripts by the existing folder keys for the main checkout and its `-wt` worktrees (`sourceFiles`); a seat working from another folder is found by the second lane's hook, which passes its transcript path.

## Open choices

- O1. Exact store folder and file names under `projects/<folder>/` (records, events, seen, units, runs), sealed by one layout test that includes a 64-hex root.
- O2. Whether the sweep's transcript scan filters files by modification time against the start instant before streaming them.
- O3. Whether the non-blocking clone-lock try is a new export beside `withProfileLock` or a wait-time argument to it.
- O4. The run-file outcome words, sealed with the other fixed words.

## Questions for the owner

Question: Which repositories should automatic making read?
Default: Only repositories enabled on each machine with `nana-memory enable`, starting with nana-pi on this machine.
What the default gains and misses: It keeps work-repository text out of the personal private GitHub repository by accident, but a new nana project collects nothing until someone enables it.
Cost of a wrong guess: hard to undo — owner and project text pushed to the private GitHub repository stays in its history.
If answered otherwise: Every repository is read by default and the enable command becomes a disable list.
Answered: owner, 2026-11-01, "Defaults" — the default stands.

Question: Should project memory live in a folder inside the existing private profile repository, or in a separate private repository?
Default: A `projects/<repository folder>/` folder inside the existing private profile repository.
What the default gains and misses: It reuses the verified private push, lock and sync and gives the merge step one clone, but project memory and the personal profile share one lock and one repository.
Cost of a wrong guess: easy to undo — the folder moves to a new private repository later; only the old history stays.
If answered otherwise: A second pointer with the same init privacy check, and a merge step reading both clones.
Answered: owner, 2026-11-01, "Defaults" — the default stands.

## Feature

Feature: FEAT-040 · Make and keep memory

New subgroup **SUB-024 · Make memory when sessions and lands end**. Purpose: run the model maker automatically over new units into a private project store keyed by repository, through one merge step. This lane's rows start at **R-3290**. The new artifact is **A-093 · project memory store** (other project: the private profile clone's `projects/<repository folder>/`; made by `nana-land` through `nana-memory make`, and by the session-end hook in the next lane; read by the merge step's store reader and `nana-memory status`).

Lane class, from `node scripts/lane-class.mjs --root . --files <final file list>` on 2026-11-01. The file list is the new `memory-run.mjs`, `memory-run-config.mjs`, `memory-store.mjs` and `bin/nana-memory.mjs`, plus `memory-making.mjs`, `memory-shaping.mjs`, the three profile modules, `nana-profile.mjs`, `nana-land.mjs`, `land-config.mjs`, the pack README, `REQUIREMENTS.md` and `docs/known-bugs/FEAT-040.md`:

`gate: packages/nana-pack/bin/nana-land.mjs — land tool`

The second lane's planned files classify as `hook: packages/nana-setup/claude/hooks/nana-memory-end.mjs — Claude Code hook`.

This lane takes the full ladder: final reviewer, land reviewer (or seat land review if the roster prints `land: seat`), the seat's wrong-code pairs, one independent check and the Windows CI leg. Size: larger lane.

## Threat model

In scope, honest variation in our tools' output and the machine:
- transcript shapes the maker already tolerates, and forked or copied transcripts that repeat entry ids;
- two runs at once in one repository or in two; a land and a seat save at once; two machines syncing the same store;
- model calls that fail, time out, cannot start, return malformed replies or report unknown usage, including a Claude Code release that renames its usage fields;
- caps reached mid-run;
- a run killed at logout or shutdown, leaving a lock, an `index.lock` or a stopped rebase (N8);
- pid reuse after a reboot;
- an owner turn that holds a pasted secret and yields no record (N8);
- transcripts deleted after making;
- shallow clones and merged-in histories;
- repositories with no commits or no opt-in, and a missing or stale profile pointer;
- Windows consoles, paths and process spawning; CI environments.

Out of scope, deliberate forgery: hand-forged transcripts or review files planted to inject claims; a hostile path argument; a tampered store pushed from another machine; a fork that keeps its parent's history on purpose to share its key; someone flipping the private repository public between runs. Findings here are residuals.

## Precedent

- `packages/nana-pack/lib/memory-shaping.mjs` — `extractShaped` is the maker; it gains injected caps, an injected unit source, the unknown-usage charge and the failed-versus-malformed split.
- `scripts/memory-shape-runners.mjs` — `createRunner`, unchanged. Its `claude -p` child loads no user settings and writes no transcript, and sets `NANA_ROLE`, so it cannot retrigger making.
- `packages/nana-pack/lib/memory-making.mjs` — `transcriptUnits`, `reviewUnits`, `shape`, `resolveEvidence` (gains the private-copy fallback), `memoryArgs`, `defaultMemoryRepo`.
- `packages/nana-pack/lib/memory-making-config.mjs` — `CANDIDATE_FIELDS`, `STARTING_STATE`, `PRIVATE_REFUSAL`. The store record is a new sealed field list (candidate fields plus subject, scope and repository), not an edit of R-3250.
- `packages/nana-pack/lib/profile-store.mjs` — `claimId`, `normalizeProfileText`, `readProfileStore`, `effectiveState` for supersede liveness.
- `packages/nana-pack/lib/profile-sync.mjs` — `withProfileLock`, `recoverProfile`, `commitProfile` (allowed folders grow by `projects`), `syncProfile` split into local and network steps for the run.
- `packages/nana-pack/bin/nana-profile.mjs` — `resolveProfile` for the pointer; `save` and `supersede` route through the merge step.
- `packages/nana-pack/lib/profile-config.mjs` — the pattern for the sealed config module; `PROFILE_PATH_POLICY` bounds the new paths.
- `packages/nana-knowledge/lib/hook.ts` — `spawnBuild`: detached, `stdio: "ignore"`, `error` listener, `unref`, injected spawner in tests; the starter adds `windowsHide: true`.
- `packages/nana-pack/bin/nana-land.mjs` — `runLand`'s best-effort lifecycle and the `keepCiRecords` call are the precedent for post-merge work that never changes the verdict.
- `packages/nana-pack/lib/lane-lock.mjs` — `releaseLaneLock`, pid-owned release; acquire and staleness are new (none: no existing lock records a creation time and a maximum hold).
- `packages/nana-pack/lib/suite-records.mjs` — `gitCommonDir`, `suiteRecordStamp` and the injected `runGit` seam.
- Root-commit repository id: none, because every existing key is folder-based, which the owner's rule forbids.

From `npm run map:search` (2026-11-01): the knowledge hook (detach), `memory-shaping.mjs` (units), `profile-store.mjs` (claims and store), and `review-ledger.mjs` and `claude-review.mjs` (cap ledgers). Added from them: nothing beyond this list; the hook-install results serve the second lane.

Private helper moves (2026-10-22 ruling, S13):
- `exclusiveJson` in `profile-store.mjs` becomes an export.
- `profileGuard`, `seatGuard` and `dailyCounter` move from `nana-profile.mjs` to a profile lib module. `profileGuard`'s nana-pi checkout path is then computed relative to its new file, or injected.
- `unitsIn` and `sourceFiles` in `memory-making.mjs` become exports, for the one-file walk, the sweep and the evidence fallback.
- `LANE_NAME_PATTERN` moves from `nana-land.mjs` to `land-config.mjs`, imported by both `nana-land` and the run's `--lane` check.

## Outside precedent

mem0 (Apache-2.0) — borrow: its add path compares a new memory with stored ones and returns ADD, UPDATE or NOOP, the shape of the one merge step; skip its model-judged merge for now (exact match only).
Also read: Letta's sleep-time memory agents (Apache-2.0) for memory work after the conversation; the Claude Code hooks and headless references for the next lane.

## Must-meet

Every test uses synthetic transcripts and reviews, a temporary profile clone with a local bare remote, and injected runner, clock and spawner. None spends, starts a real run or reads owner text.

1. **Each unit is made once.** A run over a session with owner turns and one ask stores their results and the ask's record. A second run makes no call and stores nothing. After two owner turns are appended, the next run sends exactly those two. A forked copy of the transcript, with the same entry ids, sends nothing. Pins: the watermark is keyed by unit and covers asks.

2. **Nothing is lost to a busy, capped or failed run.** Each of three runs over session A leaves A's units pending: one finds A's run lock held, one stops at the per-run cap, one gets `ok: false` from every call. A later run started for a land, or for session B, sends A's pending units. A completed call with a malformed reply marks its batch done once. A lock left by a dead pid, or older than the sealed maximum run time with a live pid, is taken over. `nana-memory status` shows the last run's outcome and the pending count. Pins: the sweep, the failed-versus-malformed split and the lock staleness rule.

3. **Spend stays inside both caps, even when usage is unknown.** A run stops calling at its per-run token cap and its call cap. With the day ledger full, no run calls. A runner that reports no usage is charged the sealed pessimistic amount, so the caps still stop it. Two runs in two repositories at once, sharing one day ledger, stay within the day cap. Pins: the unknown-usage charge and the reserve-then-settle ledger.

4. **Only new, enabled, landed sources are read.** Units before the sealed start instant are never sent. A land run for lane `memory` does not read `memory-shaper-<date>`. Review folders that exist only in a worktree are not read. A repository that is not enabled, or is shallow, is never read and gets a fixed line. A main checkout, a linked worktree and a second clone of one enabled repository write to the same store folder. A history merged in later does not move the key. Pins: the start instant, the anchored lane folder, opt-in and the stable repository id.

5. **Two machines and the seat share the store without breaking sync.** Two clones of one bare remote each make memory for the same repository, both sync, then both run `nana-profile save` and sync, all without a conflict or a `not pushed` line. A run killed after `index.lock` was created leaves the next `nana-profile save` working. While a run holds the run lock and is calling the model, a `nana-profile save` completes without waiting on it. `nana-profile save` run from a folder outside any repository still saves. No lock, ledger or scratch file is ever committed. Pins: exclusive files, machine state in the git directory, short local lock holds and interrupted-git recovery.

6. **One live record for one claim.** The same normalized claim, arriving as a seat save and as an extracted candidate in either order, shows as exactly one live record in the store reader, and it is the saved one. A unit re-sent after a failed run leaves one record. Pins: the merge outcome across the user and project areas.

7. **Evidence outlives the transcript, and only what evidence needs is kept.** After a run, the transcript file is deleted, and every stored record's evidence still resolves to its owner text and seat text. A canary secret in an owner turn that yields no record appears in no store file. A canary owner string appears in no stdout, stderr, run file, land output or file under the repository checkout. Under `CI`, the run exits with a fixed line before reading any transcript. Pins: the private copy is narrow and capped, and everything public is counts-only.

8. **A land starts making after the merge and is otherwise unchanged.** After a landed merge with a known lane, the land calls the starter once, with the lane and main checkout, after the review lock is released and `main` equals the tip. This also happens when the land ledger cannot be written. The exit code and every earlier line equal a land without the starter, plus one fixed line carrying the last run's age and outcome. A throwing starter gives the same code and lines with the fixed not-started line. A refused land, or a land with no lane, never calls the starter. `runLand` without an injected starter starts nothing. The real starter starts nothing under `CI` or any `NANA_ROLE`. Otherwise it spawns node detached, with ignored stdio, `windowsHide: true`, the home folder as `cwd`, and `unref`. Pins: the land trigger's place, its isolation from the verdict, and a quiet window on Windows.

Sealed tunables, each pinned by one seal test naming its row:
- Start instant: `2026-10-31T18:16:00Z`, contract, the end of the frozen labelled snapshot (scored-runs.md).
- Per-run token cap: 200,000. Chosen: a few dozen sessions' worth against the measured 39-call, USD 0.44 to 0.99 history.
- Per-run call cap: 20. Chosen: bounds a run's length when usage is unknown.
- Per-day token cap: 1,000,000. Chosen: equal to the hand-run cap R-3262.
- Unknown-usage charge: 100,000 tokens per call. Chosen, pessimistic: about five times the largest batch input under the owner and seat caps.
- Maximum run time: the call cap times the batch timeout, plus one batch timeout. Derived in config, not a literal.
- Stale `index.lock` age: twice the profile git timeout. Derived.
- Evidence copy cap: equal to the shared 1,200-character text cap (R-3200), imported.
- Day boundary: UTC.
- Store folder id length: 16 hex characters.
- Also sealed: the store layout names, the store record field list, the opt-in config member name, the fixed run, status, land and refusal words, and the lane folder pattern.

Expected changes to existing tests (forecast, not a limit): `memory-shaping.test.mjs` for injected caps and the failed-versus-malformed split; `profile-sync.test.mjs` for `commitProfile`'s allowed folders and the split sync; `profile-store.test.mjs` for save routing and the moved guards; `land.test.mjs` only where it asserts the export list (the no-op default leaves its 39 in-process calls unchanged). Contract notes go in the pack README: the new command, the land line, the opt-in list and the agent-dir caveat.

## Residuals

- N1. The merge catches exact normalized repeats only. Profile saves refuse `decision`, so cross-area overlap is limited to corrections. At land, the reworded-duplicate known-bug line names this.
- N5. Claude Code group-kills a hook's process group at exit. This matters to the next lane's hook, which must exit well inside its bound; the land starter has no such parent.
- A2 of the first draft (a detached child surviving Claude Code's exit, especially on Windows under a real Claude Code parent) stays unverified until the next lane checks it on a machine.
- Background spend draws on the seat's Claude account when a land ends; the day cap bounds tokens, not rate limits (N7).
- A repository whose history was started by keeping another's (a fork) shares its key; no two repositories on this machine share a root today (S6).
