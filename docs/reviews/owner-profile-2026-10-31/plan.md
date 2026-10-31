# Plan: owner-profile (lane C of the memory factory)

Lane: `owner-profile` · worktree `~/nana-pi-wt/owner-profile` · branch `feat/owner-profile` · base main `e5db630e` · date 2026-10-31. Revised in place after the adversary pass (`plan-attack.md` in this folder); see the last section.

Lane class (`node scripts/lane-class.mjs --root . --files packages/nana-pack/lib/profile-config.mjs,packages/nana-pack/lib/profile-store.mjs,packages/nana-pack/lib/profile-sync.mjs,packages/nana-pack/lib/pack-config-write.mjs,packages/nana-pack/lib/roster-set.mjs,packages/nana-pack/bin/nana-profile.mjs,packages/nana-pack/tests/profile-store.test.mjs,packages/nana-pack/tests/profile-sync.test.mjs,packages/nana-setup/claude/rules/nana-seat.md,packages/nana-setup/tests/seat-rule.test.mjs,packages/nana-pack/README.md,REQUIREMENTS.md,docs/requirements-tree.md,docs/code-map.md,docs/known-bugs/FEAT-040.md,HANDOFF.md`):

```
ordinary
also reaches: packages/nana-pack/lib/roster-set.mjs — also reaches packages/nana-pack/bin/claude-review.mjs
also reaches: packages/nana-pack/lib/roster-set.mjs — also reaches packages/nana-pack/extensions/nana-roster-notice.ts
also reaches: packages/nana-pack/lib/roster-set.mjs — also reaches packages/nana-setup/claude/hooks/nana-roster-notice.mjs
```

The reach lines come from the `roster-set.mjs` helper move (Precedent). `nana-roster.mjs` loads `roster-set.mjs` only through a dynamic `import()` inside `set`, and the new `pack-config-write.mjs` stays behind that dynamic import, so the roster hook and the review launcher never load it. The save rule moves to `nana-seat.md`, which builders and reviewers skip, and `save` refuses under `NANA_ROLE`; with that, ordinary stands (attack N8). The later delivery slice is a hook lane.

## Purpose

Agreed reading (the owner, 2026-10-31, paraphrased in the seat's design note; no owner words are copied here): a memory factory that makes, shapes, stores, keeps up, checks and delivers memory so each agent's context has the right shape. Two memory types. This lane is "Lane C owner-profile" for the **user-facing** type — the memory the seat keeps about its one owner. After the attack the seat split it: **this lane is the store, sync, automatic save and the trust ladder.** The pushback probe moves to a later checking-station lane.

Owner answers already given and binding on this plan:

- Saving is automatic. There is no approval step; a trust ladder ranks what was saved, the seat shows each save, and the owner can retract.
- The user-facing store is a **private** git repo, synced across the owner's macOS and Windows machines. The public nana-pi repo carries only generic code, never a record or an owner detail.

Seat decisions that bind this lane (2026-10-31):

- Files are the record and any search is a rebuildable cache.
- One JSON object per record file, in lane memory-making's shape; lane memory-making owns the shape.
- New saves start `low`. Trust rises only on the owner's own words or on evidence from distinct sessions. The seat repeating itself in one session, or re-saving what it was shown, never counts.
- The save rule goes in `nana-seat.md`; saves refuse under `NANA_ROLE`.

What this lane ships, in one sentence: **a seat saves a quoted record about its owner, without approval, into a configured private clone whose push target was verified private; the save prints a `Saved:` line the owner can veto with `retract`; records sync between machines without merge conflicts; and each record's trust is derived from distinct-session repeats and owner confirmations.**

Not in this lane: putting `show`'s output into session start, `sync` at session start, a doctor row, a PATH shim, the move of today's owner entries, and the pushback probe. See "Left for later lanes".

## Assumptions

- **A1 · Where the machine's pointer lives.** The user-scope `nana-pack.json` in pi's active agent dir: the per-machine file nana-setup seeds, which already holds `roster` and `objective`. New top-level member `ownerProfile` with `dir` (the local clone), `verifiedPushUrl` (attack M2), `unverifiedRemote` (true only when the owner passed the override flag, attack S9) and `save` (whether this machine saves, owner question 1). `config.ts` ignores unknown top-level members. No nana-setup code changes here; the doctor row is the delivery slice's.
- **A2 · Where the code lives.** `packages/nana-pack/lib/` and one CLI `packages/nana-pack/bin/nana-profile.mjs`, run as `node "$HOME/nana-pi/packages/nana-pack/bin/nana-profile.mjs"`. No new package, no PATH shim.
- **A2b · The shape is imported; lane memory-making owns it.** Lane memory-making is building now and owns `packages/nana-pack/lib/memory-making-config.mjs`. This lane imports its field list (`id`, `type`, `kind`, `claim`, `quote`, `context`, `evidence`, `date`, `trust`, `source`, `roles`, `validFrom`, `invalidAt`, `supersedes`) and its words for `type`, `trust` and `roles`, and defines no field of its own in a record. A saved record is that shape with `type: user`, `roles: [seat]`, `trust: low`, `invalidAt: null`, written with `JSON.stringify` and read with `parseJsonBytes`; a round trip deep-equals the written object. The places where this store needs more than the shape gives are notes for memory-making's next brief (see "Notes for lane memory-making"), not fields defined here. **Order:** this lane's build starts after memory-making lands on main, or merges main once it does; this lane lands after memory-making.
- **A3 · Feature.** A subgroup `SUB-nnn · Keep a private owner profile` under `FEAT-040 · Make and keep memory` (memory-making's feature, its label as built).
- **A4 · Every write is a new file.** Each save writes `records/<id>/<stamp>-<rand>.json`, where `<id>` is a hash of the normalised claim only (attack M3). The earliest file under an `<id>` is the record and later ones are repeats. Confirm, retract and supersede links are new files under `events/<id>/`. No file is ever edited, so two machines never write different bytes to one path, whatever free text the seat supplies.
- **A5 · Effective trust is derived by one reader.** The stored `trust` is the trust at write time (always `low`) and the stored `invalidAt` is the value at write time (always `null`). One exported `effectiveState(recordFiles, events)` in the profile store is the only reader of effective trust and liveness (attack S6). Ladder:
  - `low` at first save.
  - `medium` when the repeats come from at least `PROFILE_MEDIUM_SESSIONS` distinct session keys counting the first save, each repeat's quote differs (after normalising) from every earlier quote of that record, and no repeat counts from the session of an earlier save.
  - `high` after one `confirm` whose `--quote` is the owner's words and differs from every stored quote of that record.
  - Nothing else raises trust. Use waits for lane context-anatomy's load logging.
- **A6 · Every record carries the owner's own words.** A save without `--quote` is refused. Lossy summaries keep the claim and drop the correction, which feeds agreement bias. The owner can overrule this; it is a validator rule.
- **A7 · Kinds.** The store accepts `preference`, `correction`, `fact` and `thinking`. `decision` is refused naming the rulings file; `open-thread` is refused naming GitHub issues. Memory-making's `decision` candidates are routed by the upkeep station, not saved here. Where memory-making exports a kind word, this lane imports it.
- **A8 · Session key.** The CLI derives it from the first variable set in a sealed ordered list of runtime session variables, else the local date. On the date fallback, two saves on one day count as one session, so trust errs low. Which variables Claude Code and pi expose to a tool's shell is checked by the builder on this machine and recorded with the list's provenance **[inferred: not verified here]**.
- **A9 · Who may save.** `save`, `confirm`, `retract` and `supersede` refuse when:
  - `NANA_ROLE` is set (builders and reviewers);
  - the cwd is in a linked worktree (`git rev-parse --git-dir` differs from `--git-common-dir`), since seats run from the main checkout;
  - `ownerProfile.save` is not `true` on this machine (owner question 1).
- **A10 · Remote guard fails closed (attack M2, S9).** `init` reads the push URL (`git remote get-url --push origin`) and parses `OWNER/REPO` from a sealed list of accepted GitHub URL forms. It runs `gh repo view OWNER/REPO --json isPrivate` through the gh runner. It refuses when the repo is public, the check fails, `gh` is missing or the host is unrecognised (an SSH alias included), unless `--unverified-remote` is given. That flag is recorded per machine and printed by every later sync. `init` records `verifiedPushUrl`. `save` and `sync` compare the current push URL with it as a local string, and refuse the push on a mismatch.
- **A11 · The nana-pi guard.** A clone dir is refused when its `git rev-parse --git-common-dir` resolves inside the nana-pi checkout this CLI runs from, so every nana-pi worktree counts. It is also refused when its push URL equals nana-pi's own origin push URL.
- **A12 · Saving never blocks the seat.** `save` commits locally, then tries to sync. When the push fails, `save` exits 0 and prints one `not pushed: <reason word>` line. The reason word is one of a sealed list (`offline`, `auth`, `rejected`, `mismatch`, `locked`), never raw git stderr (attack N2). `sync` alone exits nonzero when it could not push.
- **A13 · One writer at a time per clone (attack M5).** `save`, `confirm`, `retract`, `supersede` and `sync` take one exclusive lock file in the clone's git dir, with a sealed bounded wait and a sealed stale-lock age. Every commit stages the whole store folders (`git add -- records events`), so an orphaned file is picked up next time. `sync` aborts a stopped rebase and reports it, and retries the push once after a non-fast-forward rejection.
- **A14 · Bytes are the same on both machines (attack S7, M4).** `init` writes `.gitattributes` with `* -text`. Every created path matches a sealed safe pattern (lowercase letters, digits, `.`, `_`, `-`, `/`) and a sealed length cap. Stamps use a sealed colon-free format (for example `20261031T120000Z`). No two created names differ only in case.
- **A15 · Volume and undo (attack S4).**
  - Sealed caps refuse with a named line: saves per day per machine, claim characters and quote characters.
  - `retract <id> --quote <owner words>` writes an event that hides the record.
  - `supersede` of a `high` record requires `--quote`.
  - `save` prints `Saved: <claim> (<id>)` on success. The seat rule tells the seat to put that line in its reply, so the owner can say "drop it".
- **A16 · Supersede outcomes (attack S8).** A record is hidden only by a live superseder. In a supersede cycle the newest stamp wins. When two live records supersede the same id, `show` prints one marked line naming both.
- **A17 · `show` is the effective-state reader's printout.** It lists live records `high`, then `medium`, then `low`, newest first, each tagged with trust and date. It stays within `PROFILE_SHOW_BUDGET` characters and ends with a fold line when records are left out. It follows the shared-memory hook's output contract so the delivery slice can print it unchanged.
- **A18 · No search cache yet.** `show` and `effectiveState` read the files directly.

## Open choices

- **O1** CLI subcommand and flag names beyond `init`, `save`, `confirm`, `retract`, `supersede`, `sync` and `show`.
- **O2** The normalisation used for the claim hash and quote comparisons (case, whitespace, line endings, Unicode form). It must be one exported function used by both.
- **O3** The sealed tunable values, each with `chosen` and a reason (attack N1):
  - `PROFILE_MEDIUM_SESSIONS`;
  - `PROFILE_SHOW_BUDGET`;
  - `PROFILE_GIT_TIMEOUT_MS`, the lock wait and the stale-lock age;
  - the push retry count (one, per A13);
  - the per-day save cap, and the claim and quote character caps;
  - the session variable list and the stamp format;
  - the safe path pattern and length cap;
  - the accepted GitHub URL forms;
  - the store folder names and the marker file name;
  - the `saved` source word (see notes for memory-making);
  - the `not pushed:` and `Saved:` prefixes, the reason words and every refusal line.
- **O4** How `init` handles an empty clone and an already initialised one. It must be idempotent and must never overwrite records.

## Questions for the owner

1.
Question: Should the seat save what it learns about you from sessions on your work machine?
Default: no; saving is off on a machine until it is turned on there, and the seat turns it on only on your personal Mac.
What the default gains and misses: no work detail is ever pushed to a personal GitHub repo; but lessons you teach the seat at work are never saved.
Cost of a wrong guess: hard to undo — a pushed work detail stays in git history until the repo's history is rewritten.
If answered otherwise: `init` on the work machine also sets saving on; the delivery slice still only reads there.

2.
Question: Until the profile reaches your session start, should the seat save what it learns about you to both the private profile and today's shared memory, or to the profile only?
Default: both; the delivery slice moves today's owner entries into the profile and ends the double write.
What the default gains and misses: nothing you correct today drops out of the seat's next session; but two copies can drift apart, which profile-only would expose sooner.
Cost of a wrong guess: easy to undo — one rule line.
If answered otherwise: the rule line says profile only, and new lessons about you stop reaching session start until the delivery slice lands.

3.
Question: What should the private repo be called, and where does each machine keep its copy?
Default: a private repo named `nana-profile` under your GitHub account, cloned to `nana-profile` in your home folder on each machine.
What the default gains and misses: one obvious name and the same path on both machines; but the name says what it holds to anyone who sees your repo list, which a neutral name would avoid.
Cost of a wrong guess: easy to undo — rename the repo and re-run `init` on each machine.
If answered otherwise: the seat creates the repo under your chosen name; no code changes, because nothing in nana-pi names it.

## What the seat needs for the private repo (outward action, with the owner, after the land)

- **Create** with `gh repo create <owner account>/<name> --private` (default name per question 3). Never public; `init` refuses one.
- **Clone on each machine,** then run `nana-profile init --dir <clone>`, adding `--save` only where question 1 allows it. `init` does the following:
  - checks the push URL's visibility;
  - writes the layout into an empty clone, commits it and pushes it once;
  - writes `ownerProfile` into that machine's user-scope `nana-pack.json`, keeping every other member and a backup.
- **Layout** (folder names are sealed tunables):

```
<clone>/
  .nana-profile                      marker file; save refuses a store without it
  .gitattributes                     * -text
  README.md                          generic text from nana-pi: what this repo is; never edit records by hand
  records/<id>/<stamp>-<rand>.json   one file per save; the earliest is the record
  events/<id>/<stamp>-<rand>.json    confirm, retract and supersede events
```

- **A Windows machine without `gh`:** install `gh`, or run `init --unverified-remote` there after the Mac verified the repo. Every sync then prints the unverified state.

## Feature

Feature: FEAT-040 · Make and keep memory

This lane's rows go in a new subgroup: `SUB-nnn · Keep a private owner profile` (next free SUB ID). Purpose line: Keep what the seat learns about its owner in a private, synced store, ranked by trust the owner's words earn.

Artifact `A-090` (seat allocation, 2026-10-31):

- owner profile records · other project: `<profile clone>/records/` and `events/` · cli: `nana-profile save`, `confirm`, `retract`, `supersede`.
- Read by: code: `packages/nana-pack/lib/profile-store.mjs` (`effectiveState` and `show`).

Rows: one per must-meet test, plus one per sealed-value pin, from the seat's allocated range `R-3230` to `R-3249` (memory-making holds FEAT-040, R-3188 to R-3209 and A-088; context-anatomy holds FEAT-041, R-3210 to R-3229 and A-089).

## Threat model

In scope, honest variation:

- two machines saving the same claim, with different quotes, before either syncs;
- two writers on one machine at once (a Claude seat and a pi seat, two sessions);
- a stopped rebase, a machine offline or without push rights, a clone behind its remote;
- a missing pointer, or a pointer at a nana-pi worktree by mistake;
- an SSH host alias, `ssh.github.com:443`, a separate `pushurl`, a remote changed after `init`, a public repo by mistake;
- `gh` missing on one machine;
- Git for Windows `core.autocrlf=true`, and Windows file name rules;
- the seat re-saving a claim in one session, or after it was shown;
- a builder or reviewer session reading the save rule;
- a work project on the work machine;
- a looping seat saving too much;
- the owner changing his mind on two machines at once;
- the seat quoting text that is not the owner's, such as a tool result or someone else's issue reply (attack N5). A9, A5 and the `Saved:` line bound this case, and nothing closes it. It gets one known-bug line.

Out of scope, deliberate forgery: someone hand-writing records or events into the private repo; prompt injection that makes the seat save a poisoned quote; a hostile process editing the pointer. These are residuals, with one known-bug line in `docs/known-bugs/FEAT-040.md`.

## Precedent

- `packages/nana-pack/lib/memory-making-config.mjs` (lane memory-making, building now) — the record field list and words; imported, never retyped.
- `packages/nana-pack/bin/nana-roster.mjs` — reading one member of the user-scope `nana-pack.json` (`piAgentDir`, `readBounded`, `parseJsonBytes`, refusing a dangling link); `resolveX` returns ok or a named problem.
- `packages/nana-pack/lib/roster-set.mjs` — **helper move:** its private tail (read the raw object, replace one member, write a temp file, fsync, back up, rename) moves into a new exported `packages/nana-pack/lib/pack-config-write.mjs`. `setRosterSlot` calls it, and `init` is its second caller. `nana-roster.mjs` keeps loading `roster-set.mjs` through its dynamic import only (attack N3). `init` writes the pointer when `roster` is absent without calling `resolveRoster`. The measured tests (`nana-roster-set`, `pack-config-utf16`, `nana-roster`) stay green unchanged.
- `packages/nana-pack/lib/json-text.mjs` — `parseJsonBytes` for every record and event read.
- `packages/nana-pack/lib/gh-runner.mjs` — the bounded, injectable `gh` seam; reused outright for `gh repo view`. The git runner follows its shape.
- `packages/nana-pack/lib/release-status.mjs` and `scripts/template-release.mjs` — git children with bounded output; a push that reports instead of throwing.
- `packages/nana-pack/lib/lane-lock.mjs` — an exclusive lock file with a bounded wait; the clone lock follows it, or imports it if its API fits (the builder reports which).
- `packages/nana-pack/extensions/nana-handoff.ts` and `packages/nana-pack/lib/suite-records.mjs` — exclusive-create, never-overwrite record files in a user-owned store.
- `packages/nana-setup/claude/hooks/nana-shared-memory.mjs` and `packages/nana-setup/lib/shared-memory-config.mjs` — sealed character budget, trim mark and fold line, followed by `show`.
- `packages/nana-setup/claude/rules/nana-seat.md` and `packages/nana-setup/tests/seat-rule.test.mjs` — the seat guide that builders and reviewers skip, and its test, which pins every bullet. The save rule is one new bullet, and the test's rule list gains it.
- `npm run map:search` results taken: `nana-roster.mjs`, `roster-set.mjs`, `config.ts` (unknown members ignored, read in `normalizeRaw`), `release-status.mjs`, `template-release.mjs`, `nana-shared-memory.mjs`, `shared-memory-config.mjs`, `suite-records.mjs`. Dropped after the attack: `packages/nana-knowledge/lib/parse.ts`, because records are JSON now (attack M1). Searched and not used: `scripts/identity-scan.mjs` (a repo scan, not a store guard; fixtures must pass it).

## Outside precedent

- **Letta context repositories** (letta-ai/letta, Apache-2.0) — **borrow**: memory as plain files in a git repo, each change a commit, git history as the audit log. Skip their server and whole-block rewrites; this plan never edits a file.
- Also read: OpenClaw's `USER.md` and dated memory files (licence not confirmed; method only).

## Must-meet

Every test uses synthetic records, a temporary home and agent dir, local bare git remotes and a stubbed `gh`. No test reaches the network. Each test carries its `req:` marker. Every assertion on a tunable imports it by name, and one test per sealed value pins it.

1. **A save writes one shape record into the private clone and nowhere else.** Proves automatic saving end to end. Pins the following:
   - After `save --kind preference --claim <c> --quote <q>`, exactly one new JSON file exists under `records/<id>/`.
   - Its object deep-equals one built from memory-making's imported field list, with `type: user`, `roles: [seat]`, `trust: low`, `invalidAt: null` and a derived `evidence`. Read back with `parseJsonBytes`, it deep-equals what was written.
   - The file is committed in the clone, stdout holds `Saved: <c> (<id>)`, and the nana-pi checkout's `git status` is unchanged.
   - Each of the following is refused with its own named line and writes nothing: no `--quote`; `--kind decision` (naming the rulings file); `--kind open-thread` (naming GitHub issues); a claim or quote over its cap; the save past the daily cap.

2. **Only a seat on an enabled machine may write.** Proves A9. Each case below refuses with its named line and writes nothing:
   - `save`, `confirm` and `retract` with `NANA_ROLE` set;
   - any of them from a linked worktree's cwd;
   - any of them with `ownerProfile.save` absent or false;
   - any of them with no pointer, where the line tells the user to run `init --dir <clone>`.

   The same `save` succeeds from the main checkout once saving is enabled.

3. **Trust rises only on the owner's words across sessions.** Proves the ladder (A5). Pins the following:
   - Three re-saves of one claim under one session key stay `low`.
   - A re-save whose quote equals a stored quote stays `low` in any session.
   - Saves from `PROFILE_MEDIUM_SESSIONS` distinct session keys with distinct quotes give `medium`, and all of them sit under one `<id>`.
   - `confirm` without `--quote`, or with a stored quote, is refused.
   - `confirm --quote <new words>` gives `high`.

4. **Retract and supersede hide the right records.** Proves undo and change of mind (A15, A16). Pins the following:
   - `retract <id> --quote <q>` removes the record from `show`.
   - After `supersede <old> --claim <c2> --quote <q2>`, `show` lists the new record and not the old one.
   - Superseding a `high` record without `--quote` is refused.
   - A supersede cycle across two clones leaves the newest record live.
   - Two live records superseding one id both print, with the sealed conflict line.
   - `show` prints `high` before `medium` before `low`, tags each line with trust and date, stays within `PROFILE_SHOW_BUDGET`, and prints the fold line when records are left out.

5. **The pointer is configuration, and the push target stays verified private.** Proves A1, A10 and A11. Pins the following:
   - `init --dir <clone>` with a stubbed private answer writes `ownerProfile` (`dir`, `verifiedPushUrl`) into the user-scope `nana-pack.json`. It keeps `roster` and `objective` deep-equal and leaves a `.bak`. It also writes the pointer when `roster` is absent.
   - `init` writes the marker, `.gitattributes` and layout and commits once.
   - `init` is refused for each of: a stubbed public answer; a failed or missing `gh`; an SSH-alias push URL; a clone dir inside a nana-pi worktree; a push URL equal to nana-pi's origin.
   - `init --unverified-remote` succeeds and records the flag.
   - After `git remote set-url --push origin <other>`, `save` commits but prints `not pushed: mismatch`, and `sync` exits nonzero.

6. **Two machines converge without a merge.** Proves sync (A4, A14). Two clones of one bare remote, one with `core.autocrlf=true`, set up as follows:
   - each saves three different claims;
   - both save one shared claim with different quotes under different session keys before either syncs;
   - each then runs `sync`.

   Pins the following:
   - Both clones end with all seven saves, one live record for the shared claim carrying its repeat, a clean `git status` and no stopped rebase.
   - Every path either clone created matches the sealed safe pattern and length cap, and no two names differ only in case.

7. **Offline, contention and a stopped rebase lose nothing.** Proves A12 and A13. Pins the following:
   - With the remote unreachable, `save` exits 0, prints `not pushed: offline` with no URL or home path, and keeps the commit. `sync` exits nonzero. After the remote returns, `sync` pushes and the other clone receives the record.
   - Two `save` processes started together both end committed and pushed, with no untracked file left.
   - A clone left in a stopped rebase is recovered by the next `sync`, which reports it.

## Expected changes to existing tests (forecast, not a limit)

- `packages/nana-setup/tests/seat-rule.test.mjs`: its rule list and count gain the save bullet.
- `nana-roster-set.test.mjs`, `pack-config-utf16.test.mjs`, `nana-roster.test.mjs`: no edits expected; they guard the helper move.
- `docs/requirements-tree.md` and `docs/code-map.md`: regenerated.
- The README check: the pack README gains an "Owner profile" contract section naming `nana-profile` and its subcommands exactly as they run. It notes that `init` follows a symlinked `nana-pack.json` the way `roster set` does, so the clone path lands in the link's target (attack N7).
- Installed copies of `nana-seat.md` (Windows rules, pi's seat guide) go stale until `nana-setup install` runs; that is existing, reported behaviour.

## Notes for lane memory-making (its next brief; attack S6)

- `source` words: export one list, `SOURCE_WORDS = ['extracted', 'saved']`. Each lane pins only its own starting word.
- `evidence` for a seat save: this lane derives a sealed form `seat:<runtime>:<session key>:<date>`. The shape should document that this form resolves to the record's own `quote`, so `resolveEvidence` does not report every seat save as `missing`.
- `trust` and `invalidAt`: document in the shape module that both are values at write time. Effective state comes only from the profile store's `effectiveState` for user records, and from the upkeep station later for every record.
- `kind` words: export the user kinds (`correction`, `decision`, and this store's `preference`, `fact`, `thinking`) once, so neither lane retypes a kind word.

## Left for later lanes

**Delivery slice** (hook and install lane; after lane context-anatomy's session-start change):
- `show` plus one fixed line in Claude Code and pi seat session start. The line says stored preferences change how the seat says things, never what it concludes, and that the owner wants pushback.
- `sync` at session start, bounded and fail-open.
- A doctor row for `ownerProfile` and a PATH shim.
- The one-time move of today's owner entries, ending the double write (question 2).

**Checking-station lane: the pushback probe** (moved out by the seat). Its notes, from the attack:
- **S1, the probe cannot see the effect as specified:**
  - Let the model answer naturally, and score each reply against sealed per-item keywords for the correct fact. Use no forced verdict line and no judge model.
  - Pair by item and report the paired drop with a 90% bootstrap interval. Gate on the interval, not on a point value.
  - Use 40 or more items, or state the smallest drop the set can detect.
  - Fail the run when unscored rates differ between arms by more than a sealed margin.
  - Add a third arm: the profile plus the fixed guard line.
- **S2, the runners:**
  - `claude --bare` drops OAuth, so it bills an API key or fails. Pick isolation that keeps OAuth and test what still loads, or require a key and print the estimated spend first.
  - The pi arm must also keep `APPEND_SYSTEM.md` and `SYSTEM.md` out.
  - Test the property: fake `claude` and `pi` executables record argv, env, stdin and cwd. No store text appears in the bare arm, and the profile text appears exactly once in the profile arm (N4).
- **M7, contamination:**
  - Run with `--no-session-persistence` (claude) and `--no-session` (pi).
  - Use a temp cwd whose transcript folder memory-making skips, or add it to the shared skip list.
  - Assert that no new file appears under the projects and sessions folders.
- **S3:** pass the profile as a file, never on a Windows command line.
- **N6:** the first real run needs the moved profile; before then, a run only checks the runner.
- The probe set and its results live only in the private repo.

## Revision after the attack

Seat decisions applied: probe split out; JSON records in memory-making's shape; trust rises only on owner words or distinct-session evidence; save rule in `nana-seat.md` with a `NANA_ROLE` refusal and the work-machine question; subgroup under FEAT-040 "Make and keep memory"; seven must-meets; lane class re-run.

- M1 (front matter versus body, string values): taken. JSON per file, `parseJsonBytes`, and a round-trip deep-equal check against the imported shape (A2b, test 1). The `parse.ts` import is dropped.
- M2 (remote check fails open): taken. Fail closed; parse the push URL; `gh repo view OWNER/REPO`; record `verifiedPushUrl` and compare it locally on every push; the nana-pi guard uses `--git-common-dir` (A10, A11, test 5).
- M3 (conflict on same ID, missed repeats): taken. The ID is a claim hash, every save is a new file, and repeats are derived (A4, test 6).
- M4 (Windows file names): taken. Colon-free stamps, a safe path pattern, a length cap and no case-only twins (A14, test 6).
- M5 (two saves at once, stopped rebase): taken. Lock, whole-folder staging, rebase abort and one push retry (A13, test 7).
- M6 (self-reinforcing trust): taken. Distinct sessions and distinct quotes are required, and `confirm` needs new owner words (A5, A8, test 3).
- M7 (probe transcripts feed memory-making): moved with the probe to the checking-station lane's notes.
- S1, S2: moved with the probe, as notes. S3: moved with the probe (it was only about passing the profile to a model).
- S4 (no cap, no undo): taken. Caps, `retract`, the `Saved:` line, and `--quote` to supersede a `high` record (A15, tests 1 and 4).
- S5 (rule reaches reviewers and work projects): taken. `nana-seat.md`, the `NANA_ROLE` and worktree refusals, per-machine `save`, and owner question 1 (A9, test 2).
- S6 (shape disagreements): taken as notes for memory-making's next brief. `effectiveState` is the single reader here (A5).
- S7 (CRLF): taken. `.gitattributes` with `* -text`, and one clone with `autocrlf=true` in test 6.
- S8 (concurrent supersedes): taken (A16, test 4).
- S9 (`gh` missing on Windows): taken. `--unverified-remote`, recorded per machine and printed at each sync (A10, test 5).
- N1 (missing tunables): taken (O3).
- N2 (raw stderr in `not pushed:`): taken. Sealed reason words only (A12, test 7).
- N3 (keep the helper move lazy): taken (Precedent, test 5's absent-roster case).
- N4 (test the property, not the flags): moved with the probe, as a note.
- N5 (misattributed quote): taken. Now in scope in the threat model, with one known-bug line.
- N6 (first probe needs a real profile): moved with the probe, as a note.
- N7 (symlinked config): taken as a README contract note.
- N8 (lane class): taken. The rule moved to `nana-seat.md` with the `NANA_ROLE` refusal, so ordinary stands; the reach lines are explained above.
