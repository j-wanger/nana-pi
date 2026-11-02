# Plan — curation-merge-chain

## Purpose

A fix that restores agreed behaviour. The seat relayed a SHOULD from the memory-curation round 1 review, which runs on the Mac and is not yet kept on main 497c5891: "a merge chain can bring back a record the owner already merged away". The agreed behaviour is R-3563: accept applies area-local immutable supersede or retract events, including absorbed records. The seat states the goal: an accepted merge never resurrects a record an earlier accepted merge retired, across chains of any length; no record or event lost.

Mechanism, read from the code at 497c5891:

- Accepting a merge writes one `supersede` event per dropped record, targeting the kept record (`nana-curate.mjs` accept, around line 89).
- `effectiveState` (`profile-store.mjs` around 104-120) hides a record when any of its supersede edges targets a record that is *live*.
- Chain: merge 1 keeps B and drops A, so A→B. Merge 2 keeps C and drops B, so B→C. B is now hidden, so it is not live, so A's only edge targets a non-live record, and A comes back. Length 2 is enough; each longer chain resurrects every second record.
- The same hole through retirement: accepting a retire retracts the target and its *direct* `supersedes`. Retiring C after the chain retracts C and B, and A's edge to the retracted B frees A.

## Assumptions

- A1: R-3233's profile semantics stay: retracting a newer record restores the record it replaced (`profile-store-guards.test.mjs` "retract and supersede hide the right records": retract "New palette" shows "Old palette" again). The fix must distinguish "target hidden because it was itself superseded" (the chain continues; stay hidden) from "target retracted" (restore).
- A2: Cycle resolution (newest supersede's target wins) and concurrent-replacement conflicts stay as they are.
- A3: Records and events are never deleted or rewritten. The fix changes only how existing events are read, plus, at most, which retract events a new retire writes.

## Design

1. Liveness: a record is hidden when any supersede edge targets a record that is not retracted and is itself either live or hidden by a supersede (the chain continues to a standing end). A record hidden only because its target was retracted comes back, as today. Cycle handling stays.
2. Absorbed set: `supersedes` on a live record lists every record whose supersede chain ends at it (transitive), not only direct edges. Accepting a retire then retracts the whole absorbed chain, and the queue's "absorbed N" counts it.

## Open choices

- O1: Whether design 2 changes `effectiveState`'s `supersedes` (shared with the profile's conflict marker) or `nana-curate` computes the transitive closure itself. Default: compute it in `effectiveState` only if the profile conflict output is unchanged for every existing test; otherwise in a curation-side helper. Builder reports which and why.

## Questions for the owner

None.

## Feature

Feature: FEAT-040 · Make and keep memory

Lane class: `node scripts/lane-class.mjs --root . --files packages/nana-pack/lib/profile-store.mjs,packages/nana-pack/bin/nana-curate.mjs,packages/nana-pack/lib/memory-curation.mjs,packages/nana-pack/tests/memory-curation.test.mjs,packages/nana-pack/tests/profile-store-guards.test.mjs,REQUIREMENTS.md` prints `ordinary`.

## Threat model

In scope: honest variation in how owners and clones produce events. That covers chains of any length, merges accepted on two clones and synced in either order, event stamps that tie, retirements at any point of a chain, and profile retracts and supersedes mixed with curation events. Out: hand-forged event files. Those are private and owner-only, and a forged event is a residual.

## Precedent

- `packages/nana-pack/lib/profile-store.mjs`: `effectiveState`, which covers the DFS liveness, cycle resolution, `supersedes` and the conflict marker. The fix lives here.
- `packages/nana-pack/bin/nana-curate.mjs`: the accept path, which writes the merge `supersede` events and the retire `retract` events, including `target.supersedes`.
- `packages/nana-pack/lib/memory-curation.mjs`: `staleProposal`, `pendingQueue`, `sizeLine` and `renderQueue` ("absorbed N").
- `packages/nana-pack/tests/memory-curation.test.mjs`: its fixtures and command runner. One test accepts a retire with "absorbed 1", around line 114.
- `packages/nana-pack/tests/profile-store-guards.test.mjs`: the R-3233 test. It must stay green without edits.

## Outside precedent

none: the event model is this repository's own; I know of no open-source memory store with this supersede-and-retract shape worth borrowing.

## Must-meet

Rows R-3698 to R-3701 (FEAT-040).

- M1 (R-3698): accepted merge chains never resurrect.
  - Through the real accept command, merge A into B, then B into C, then C into D, each accepted in turn.
  - After each accept, only the newest keep is live, the earlier drops stay hidden, and the queue and size line never show them.
  - Every record file and every event file written so far is still on disk.
- M2 (R-3699): retirement takes the whole absorbed chain.
  - After the chain from M1, accepting a retire of D retracts D, C, B and A, so none is live.
  - The queue shows "absorbed 3" before the accept.
- M3 (R-3700): profile semantics hold. Retracting the newest keep restores only its direct predecessor; the earlier drops stay hidden. The two-clone cycle still resolves to the newest target, concurrent replacements still show the conflict marker, and R-3233's test passes unedited.
- M4 (R-3701): order does not matter. Two clones accept the two merges of a chain (A into B on one clone, B into C on the other) and sync in both orders. Both give the same live set, with only C live, and lose no events.

Expected existing-test edits: none forecast. Any edit is listed with its reason.

Seat checks:
- `memory-curation.test.mjs`, `profile-store-guards.test.mjs`, `profile-store.test.mjs`, `profile-sync.test.mjs` and `memory-shaping.test.mjs`.
- `test-runner.test.mjs`.
- The map, readme, trace, tree and known-bugs checks, and the identity scan.
- The tip's CI.

## Revision 2 (after `plan-attack.md`: 3 MUST, 2 SHOULD, all taken; and the seat's review text)

These changes override the sections above wherever they differ.

**The review's own words.** The seat relayed memory-curation round 1 SHOULD 1. A merge chain brings back a merged-away record (`nana-curate.mjs:90`). The probe: accept A into B, then B into C, and A and C are both live. The realistic path: an extracted survivor is later merged into a saved record, or the seat saves the same claim. The first duplicate then returns, and the queue's size forecast is wrong. The pack README says merged duplicates "do not return". The review proposes two fixes: on a merge, also supersede the dropped record's absorbed records onto the keep; on a retirement, follow the chain all the way down. The pi adversary confirmed the same result with an in-memory probe.

**Design, revised:**

1. Liveness is read-side, as Design 1 says. The pi adversary showed it cannot be done by writing alone: stores that already hold A→B→C must stop resurrecting A without new events. The review's write-side extra supersede events become unnecessary; the builder does not write them and reports this as a departure from the review's wording.
2. A separate `absorbed` set replaces any transitive change to `supersedes` (attack 2). `supersedes` stays direct, so the profile `show` conflict lines stay exactly as on main. `absorbed` on a live record lists the unique ids that are currently hidden only because their chain of supersede links ends at that record. It never contains the record itself.
3. A retraction cuts the chain (attack 1). In A→B→C with B explicitly retracted, A is restored and independent. It is not in C's `absorbed` set, and retiring C does not retract it. This is A1's "retract restores".
4. Every behavioural reader of the chain uses `absorbed`: the accept-retire writes (`nana-curate.mjs:93`), `sizeLine` and `renderQueue` ("absorbed N"). `show` keeps using direct `supersedes`.
5. SUB-027 moves from under FEAT-043 to under FEAT-040 in `REQUIREMENTS.md`, with its rows unchanged; the tree is regenerated (round 1 SHOULD 3).
6. Round 1 SHOULD 2 becomes one FEAT-040 known-bug line, worded in the brief.
7. The README paragraph on accepting (`packages/nana-pack/README.md` around 195-197) states the chain behaviour, so "do not return" becomes true. It also names the retract-restores exception.

**Must-meet, revised.** Rows R-3698 to R-3702 (FEAT-040), each worded as an observable outcome.

- M1 (R-3698): chained merges never resurrect.
  - Through the real accept command, merge A into B, then B into C, then C into D.
  - After each accept, only the newest keep is live, and the queue and size line never show an earlier drop.
- M2 (R-3699): retiring a survivor takes exactly its absorbed chain.
  - After M1, the queue shows "absorbed 3", and accepting a retire of D retracts exactly D, C, B and A.
  - With B explicitly retracted in an A→B→C chain, A is live. C's queue entry shows "absorbed 0" (B is retracted, A is independent). The size line forecasts only C's removal, and retiring C retracts only C.
- M3 (R-3700): profile semantics and conflict output hold.
  - Retracting the newest keep restores only its direct predecessor.
  - In the fork A→B, B→C, B→D, the `show` conflict lines equal main's exact lines.
  - Cycles of 2 and 3 nodes resolve to the newest target, including when stamps tie (pin which record wins).
  - An incoming tail into a cycle stays hidden.
  - Reversed record and event file order gives the same output.
  - R-3233's test passes unedited.
- M4 (R-3701): no record or event is lost, and order does not matter.
  - After every accept, the new event files have exactly the expected ids, actions, targets and quotes.
  - A path-to-bytes manifest of the records, events, proposals and decisions folders is kept, and every later manifest contains every earlier entry unchanged.
  - Two clones each accept one merge of a chain and sync in both orders. Afterwards each clone's manifest is the union of both clones' manifests from before the sync, and only C is live.
- M5 (R-3702): stale proposals refuse without writing. Proposals are persisted before intervening accepts. Each of these is refused as stale, with no new event, decision or commit:
  - a proposal whose keep was merged away;
  - a proposal whose drop was merged away;
  - a proposal with an explicitly retracted endpoint;
  - the old "keep A, drop C" proposal after A→B→C.

Expected existing-test edits: none forecast. List each in the report.
