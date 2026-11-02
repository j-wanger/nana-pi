# memory-curation — plan (revision 2)

Worktree `~/nana-pi-wt/memory-curation`, branch `feat/memory-curation`, based on main 0bd1df89.
Grounding: `docs/memory-factory-design-2026-10-31.md` (station 4 upkeep; principles 1, 2, 3, 6, 7, 8), the owner profile (SUB-023), the project store and merge step (SUB-024), the model shaper and its runner (SUB-022), the FEAT-040 known-bug file, the seat-memory-push plan on `origin/feat/seat-memory-push` (read as a later consumer only), the 2026-11-01 curation research notes kept by the seat, and the owner's repos `knowledge-wiki`, `nana-agent-loop` and `nana-dev-kit` (read in a scratch clone; no code copied).

Revision 2 takes all four MUSTs and all eleven SHOULDs from `plan-attack.md`, and disposes each of the nine NOTEs. It records the owner's 2026-11-02 answers and his ruling on delivery. The disposition list is at the end.

## Purpose

Owner's request (2026-11-01): "we need memory curation lane, otherwise the memory is not usable, research more, look at https://github.com/j-wanger/knowledge-wiki; it was something we worked on a long time ago, the implementation was naive but it had something done right as well, maybe also other repos under my profile".

Agreed reading (owner pick, 2026-11-01): **"B: model + your review queue"** — a model proposes merges and retirements, and the owner accepts or rejects each one. The owner chose B over the seat's recommended A (deterministic upkeep). Nothing changes the store's live view without the owner's accept.

Owner ruling (2026-11-02): delivery (seat-memory-push) does not land until the replay result is in and the current entries are curated. So this lane is based on main without the push. It does not depend on the push, and it does not edit it.

### What the owner gets, in numbers (attack MUST 2)

Today (Mac store, counted 2026-11-01 and 2026-11-02, counts only): 47 live records, all low trust, zero events. 13 are saved profile records and 34 are extracted project records (22 decisions, 9 lessons, 3 corrections). In the push's line format they take 10,303 characters: 2,174 profile and 8,129 project. The push budget is 4,000. Six project lines over 300 characters hold 2,780 of them.

Forecast after this lane, stated as a forecast and not a promise:
- Merging the three confirmed duplicate pairs frees about 600 characters. The store would still need about 9,700 characters, so a 4,000 push would still fold about 25 of the remaining project records.
- Fitting the budget needs about 25 of the 34 project records retired or merged. Only retirements the owner accepts can do that, since merges keep existing wording (owner answer 2).
- So "fits the delivery budget" is a reported outcome of the owner's review, not a promise of this lane. Every `propose` and `queue` run prints live records and claim characters per part (profile, project), now and as they would be if every pending proposal were accepted. The owner sees each decision's effect on the size.

The lever that closes the gap is retirement of spent records, with sealed classes (see design line 2). A shorten op (new wording) stays out, per owner answer 2. A per-line cap belongs to the push lane.

Stop rule (seat step after the land, A10): if the owner's accepted proposals on the real store free less than 2,000 claim characters, the seat brings the owner the gap before planning more curation.

### Design in eight lines

1. **Stage 1, deterministic grouping (no model).** A pure `groupRecords(states)` in a new `packages/nana-pack/lib/memory-curation.mjs` joins live records that share a normalized owner-quote span of at least `QUOTE_SPAN_CHARS` (union by shared span). A record with no shared span is a group of one. Groups go to the model as hints and stay whole inside a batch. A group larger than `BATCH_RECORDS` is sent in date-ordered pieces of `BATCH_RECORDS` and counted as split (attack SHOULD 13).
2. **Stage 2, the model proposes.** `proposeCuration` sends each batch with batch-local ids (`r1..rN`). Each record carries its area, kind, source, date, claim, capped quote and group hint. The sealed system prompt asks for `{ proposals: [ { op: "merge", keep, drop: [...], reason }, { op: "retire", id, class, reason } ] }`. A retirement names exactly one record and one sealed class: `one-off` (an approval or answer with no future effect), `dated` (a fact true only on its day), `covered` (duplicates a standing rule, ruling or requirement) or `superseded` (a later record in the batch overrides it) (attack MUST 4, SHOULD 12). `BATCH_RECORDS` is 60, so today's 47 records fit one call (SHOULD 13).
3. **Validation per proposal (SHOULD 6).** A reply that is not an object with a `proposals` array is rejected whole, with no retries. Inside a valid reply, each proposal is checked alone. One is dropped for an unknown or out-of-batch id, an empty or over-cap reason, an unknown class, a `keep` inside its own `drop`, or a multi-id retire. When an id appears in two proposals, both are dropped. A merge that keeps an extracted record over a saved one is rewritten to keep the saved record, as R-3295 already decides; with two saved records in the set it is dropped. Dropped proposals are counted.
4. **Model work holds no clone lock (SHOULD 5).** `propose` follows `makeMemory`. It recovers, commits, fetches and rebases under a zero-wait clone lock, then reads the store. It calls the model with no clone lock held, reserving tokens from the shared day ledger (`dayReservation`) before each call, so curation and making share one day cap. It writes each batch's proposals as that batch completes, under a short clone lock, rechecking liveness (NOTE 21). Then it commits and syncs.
5. **Curation files live under `projects/curation/` (MUST 1, option b).** `commitProfile` commits only `records/`, `events/` and `projects/`. A `curation/` folder at the store root would leave untracked files that block every later save and making merge. So proposals go to `projects/curation/proposals/<key>/` and decisions to `projects/curation/decisions/<key>/`, with exclusive-create names. The folder name is sealed in the curation config, never in `STORE_LAYOUT`. It cannot collide with a repository folder, which is 16 hex characters. The three existing readers ignore it by construction: `readMemoryStore` reads only `records/` and `events/` under each folder, `countUnparseableMemoryFiles` reads only `seen/`, `units/` and `runs/` of a repository id, and `copiedEvidence` skips a folder without `repository.json`. A test pins all three. The lane stays ordinary.
6. **The owner reviews in the seat (owner answer 3).** `npm run memory:curate -- queue` fetches first, then prints the sealed privacy line (SHOULD 15), the size line, and each pending proposal numbered 1..N (NOTE 22). Each entry carries its 12-hex key prefix, the op, the class for a retirement, how many records a retirement target has absorbed (SHOULD 8), each named record's claim (capped per claim in the queue only, with a marker), source and date, and the reason. Entries are ordered by claim characters freed, largest first, then key. The first entry always prints, and a fold line counts the rest (SHOULD 9). The seat relays numbers to the owner, never prefixes.
7. **Accept writes existing events; reject writes a decision.** `accept <prefix>... --quote "<owner words>"` and `reject <prefix>...` take several prefixes. They fetch and rebase first, and print the sealed `not synced` word beside the result if the fetch fails (SHOULD 10). They refuse every prefix if any one is unknown, ambiguous, decided or stale, and they write under one lock, one commit and one sync (SHOULD 11). For a merge, accept writes one `supersede` event per dropped record, targeting the kept record, in the dropped record's own area. For a retirement, it writes a `retract` for the record and for every record live-superseded onto it, with the same owner words (SHOULD 8). Then it writes an accept decision. No record file is rewritten.
8. **Review turns make no memory (MUST 3).** The shared unit walk in `memory-making.mjs` (`unitsIn`) marks a seat stretch that runs a curation command: an assistant tool call whose command matches the sealed curation command pattern (`memory:curate` or `nana-curate.mjs`). The next owner turn and any ask answered in that stretch are skipped and counted. This covers both the rule maker and the shaper, which share `unitsIn`.

Model (a stated choice): the curator uses `createRunner()` from `scripts/memory-shape-runners.mjs` unchanged. That is the sealed shaper runner: `claude`, `claude-sonnet-5`, effort `low`, a $0.50 per-call cap and a 300,000 ms timeout (R-3258, R-3259, R-3263, R-3266). This machine's roster names no curator; its reviewer (Claude Code, opus) is kept off this path for cost. Profile and project records are both sent (owner answer 1).

Degrading: with no runner, a runner that throws or fails, or no valid reply, `propose` writes nothing and exits 1. It prints one sealed line, `curate: no proposals: model unavailable` or `curate: no proposals: replies rejected`. Otherwise its counts line carries proposals, batches, rejected batches, dropped proposals, already-decided proposals, split groups, unsent batches, tokens and cost (NOTE 23), and the size line. It never crashes, and it never prints a bare success that hides failed batches.

## Assumptions

- A1. A retirement is the existing `retract` event. The store cannot yet tell "no longer useful" from "was wrong", and `effectiveState` hides a retracted record across all time, including past `asOf` cuts. A new `invalidate` action that sets an effective `invalidAt` (the Graphiti pattern) is left for a later lane, as a residual. The pack README says that a curation retract means "no longer useful", so the seat relays retire proposals (NOTE 20).
- A2. Merge never writes new text (owner answer 2). The kept record is one the model picks from the group, or the saved record when the set holds exactly one.
- A3. The trigger is by hand. The seat runs `propose` in the background, per the 2026-10-15 watcher ruling, since two calls at up to 300 s each exceed the seat's default shell timeout (NOTE 21). An automatic trigger waits until the accept rate shows proposals earn their place.
- A4. Rejection memory (MUST 4). A rejected retirement blocks that record's retirement, whatever its class, until a new record joins its group. A rejected merge blocks every later merge whose record set is a subset of the rejected set. A superset with a new record is new information and may return once.
- A5. Two machines can propose the same key. The queue shows one entry per key. Accept and reject race only between fetches. Any accept that wrote its events stands, and the key shows as decided either way. A duplicate supersede or retract event changes nothing in `effectiveState`.
- A6. A proposal is stale when any record it names is not live or no longer exists after the fetch. `queue` omits stale proposals and counts them; `accept` refuses them.
- A7. The accept quote is the owner's words for the decision, as in `retract` and `supersede`. The known bug "a quote the seat wrongly attributes to the owner is saved like a real one" applies here too.
- A8. The curator reads every area, profile and every repository. A merge may cross areas, as `mergeMemory` already does.
- A9. The area-choosing event write moves into one exported helper, `writeStateEvent`, in `memory-store.mjs`. `nana-curate` imports it. `nana-profile.mjs` keeps its inline copy in this lane, because editing it makes the lane install class (doctor imports it). That is a reported departure from the 2026-10-22 helper ruling, with a known-bug line for the next lane that touches `nana-profile.mjs`.
- A10. Measurement is a seat step after the land, counts only. The seat runs `propose` on the real store, the owner reviews, and the seat reports: proposals, accepted and rejected per op and per retire class, stale, dropped, tokens and cost, and live records and claim characters per part before and after. It also reports records made per day against records removed per review (NOTE 16). A retire class the owner rejects in most cases leaves the sealed prompt in a later change (SHOULD 12). The stop rule in Purpose applies. Write-time gating at the merge step (arXiv 2505.16067) is the named follow-up when inflow exceeds review.
- A11. Trust stays low after review (NOTE 19). An accepted merge does not write a `confirm` on the kept record. That is a residual line; the seat may raise it with the owner later.
- A12. The skip rule in design line 8 may also skip one unrelated owner turn that follows a stretch where the seat ran `accept`. That loss is counted and accepted.
- A13. The size line counts claim characters, not the push's line format, since the push is not on main. Claim characters run about 25 to 30% below push-line characters (inferred from the attack's counts). When the push lands, its lane may switch the size line to its line format.

## Open choices

- O1. Exact fixed words, the size-line format and the proposal and decision file fields, sealed in a new `packages/nana-pack/lib/memory-curation-config.mjs`. New words never go into `PROFILE_WORDS` or `STORE_LAYOUT`, which existing tests pin whole (SHOULD 14).
- O2. Whether the queue budget is a new seal or imports `PROFILE_SHOW_BUDGET` (4,000) by name.
- O3. The call cap, the token cap, the per-claim queue cap and the reason cap (chosen seals).
- O4. Whether a record already named in an undecided proposal is held out of the next `propose` run.
- O5. How the stretch flag in `unitsIn` reads a tool call's command (the existing `partsOf` and `askCalls` helpers are the nearest shapes).

## Questions for the owner

None. The owner answered all three on 2026-11-02:
- Q1, may profile records go to the model: "yes profile records get sent as well". The words already reached this provider in the seat session that saved them; curation sends them again in a new grouping, outside a chat (SHOULD 7).
- Q2, merge keeps one existing record: default taken.
- Q3, review in the seat conversation: default taken.

## Feature

Feature: FEAT-040 · Make and keep memory

This is the "keep" half of FEAT-040's purpose and design station 4 (upkeep). It becomes a new subgroup under FEAT-040: `SUB-027 · Curate memory through the owner's review`, purpose "Let a model propose merges and retirements of live memory records, and change the store only through the owner's accept." The seat confirms SUB-027 is free (SUB-026 is taken on another branch).

New artifact (ruling 2026-10-22): `A-100 · memory curation queue · other project: <project>/projects/curation/ · manual: the seat runs npm run memory:curate -- propose by hand`, read by `packages/nana-pack/lib/memory-curation.mjs`. A-090 and A-093 gain `packages/nana-pack/bin/nana-curate.mjs` as a maker of their `events/`. The seat confirms A-100 is free.

Rows: closed range R-3560 to R-3579 (other branches reach R-3531). Eight behaviour rows, one per must-meet, then one row per new seal: quote span, batch size, call cap, token cap, queue budget (unless O2 imports it), per-claim queue cap, reason cap, retire classes, system-prompt SHA-256, curation command pattern, and the fixed words with the curation layout. That is about 19 rows; one stays spare.

Lane class, from `node scripts/lane-class.mjs --root . --files <planned files below>`:

```
ordinary
also reaches: packages/nana-pack/lib/memory-making.mjs — also reaches packages/nana-pack/bin/nana-land.mjs
also reaches: packages/nana-pack/lib/memory-making.mjs — also reaches packages/nana-setup/bin/install-check.mjs
also reaches: packages/nana-pack/lib/memory-making.mjs — also reaches packages/nana-setup/bin/nana-setup.mjs
also reaches: packages/nana-pack/lib/memory-making.mjs — also reaches packages/nana-setup/bin/stale-copies.mjs
also reaches: packages/nana-pack/lib/memory-making.mjs — also reaches packages/nana-setup/lib/doctor.mjs
also reaches: packages/nana-pack/lib/memory-making.mjs — also reaches packages/nana-setup/lib/install-check.mjs
also reaches: packages/nana-pack/lib/memory-store.mjs — also reaches packages/nana-pack/bin/nana-land.mjs
also reaches: packages/nana-pack/lib/memory-store.mjs — also reaches packages/nana-setup/bin/install-check.mjs
also reaches: packages/nana-pack/lib/memory-store.mjs — also reaches packages/nana-setup/bin/nana-setup.mjs
also reaches: packages/nana-pack/lib/memory-store.mjs — also reaches packages/nana-setup/bin/stale-copies.mjs
also reaches: packages/nana-pack/lib/memory-store.mjs — also reaches packages/nana-setup/lib/doctor.mjs
also reaches: packages/nana-pack/lib/memory-store.mjs — also reaches packages/nana-setup/lib/install-check.mjs
```

The lane stays ordinary because of design line 5 (no change to `profile-sync.mjs`) and A9 (no change to `nana-profile.mjs`). Either change would make it install class.

Expected file changes (a forecast, not a limit):
- New: `packages/nana-pack/lib/memory-curation.mjs` (grouping, batching, prompt input, per-proposal validation, keys, rejection memory, size counts, queue derivation and rendering), `packages/nana-pack/lib/memory-curation-config.mjs` (seals, words, layout, privacy line, command pattern), `packages/nana-pack/bin/nana-curate.mjs` (`runCurate(argv, { runModel, agentDir, env, cwd, runGit, now, stdout, stderr })` with `propose`, `queue`, `accept`, `reject`), `scripts/memory-curate.mjs` (supplies `createRunner()`, like `scripts/memory-run.mjs`), `packages/nana-pack/tests/memory-curation.test.mjs`.
- Edited: `packages/nana-pack/lib/memory-store.mjs` (export `writeStateEvent`), `packages/nana-pack/lib/memory-making.mjs` (the stretch skip in `unitsIn`), `packages/nana-pack/tests/memory-making.test.mjs` (must-meet 8), `package.json` (`memory:curate`), root `README.md` (its list of `memory:*` scripts), `AGENTS.md` (its list of pack `bin/` commands), `packages/nana-pack/README.md` (a "Memory curation" section: every command, running `propose` in the background, the meaning of a curation retract), `REQUIREMENTS.md`, `docs/requirements-tree.md`, `docs/code-map.md`, `docs/known-bugs/FEAT-040.md` (residual lines for A1, A7, A9, A11, A12, A13; the existing seat-memory-push N2 line on reworded re-extraction is cited, not duplicated).

Later consumer: seat-memory-push (FEAT-044) waits on this lane by the owner's ruling. When it rebases on main, it meets `writeStateEvent` in `memory-store.mjs`, and it should import this lane's sealed privacy line rather than define its own (ruling 2026-10-22). Its push reads `readMemoryStore` then `.live`, so accepted events reach it unchanged.

## Threat model

In scope, honest variation in our own tools' output: an empty or near-empty store; damaged project, proposal or decision files (skipped and counted); a damaged file in the profile's own `records/` or `events/` (`readMemoryStore` throws there, so every curate command refuses with the existing fixed word, matching `nana-profile` — NOTE 18); duplicate quotes; records whose quotes share a span but which are not duplicates; quote-span groups larger than a batch; records from both machines and several repositories; retracted, superseded and supersede-cycle records; a store larger than one batch; a model that returns nothing, junk, a bare array, prose around JSON, unknown or out-of-batch ids, an id in two proposals, a `keep` inside its own drop list, a multi-id retire, an unknown class or an empty reason; a model that regroups records it saw before; a runner that throws or times out; a killed `propose` run; an owner who rejects everything; proposals that go stale between `propose` and `accept`, including through the other machine before a fetch; two machines proposing or deciding the same key; a failed fetch; a missing pointer or marker; `NANA_ROLE`, `CI` or a linked worktree; a review session's own turns reaching the maker.

Out: deliberate forgery, such as hand-written proposal or decision files, a forged accept quote, or a hostile model reply crafted to pass validation with harmful but valid ids. A valid but bad proposal is in scope only as far as the owner's review catches it; that is the design.

Privacy: record text, quotes, model reasons and proposal files stay in the private store and in the seat's own stdout from `queue`, which leads with the sealed privacy line. `propose`, `accept` and `reject` print fixed words, counts and key prefixes only. Tests use synthetic fixtures and a stub proposer; no test prints fixture claim text, and no test or builder calls a paid model or reads the real store.

## Precedent

- `packages/nana-pack/lib/memory-run.mjs` — `makeMemory` is the precedent for `propose`: model work with no clone lock, zero-wait clone locks around recover, commit, fetch and rebase, `dayReservation` before each call, and writes under a short lock with liveness rechecked (SHOULD 5).
- `packages/nana-pack/lib/memory-store.mjs` — `readMemoryStore` with `onUnparseable` is the one reader across areas; `writeMemoryFile` writes project-area files. The new `writeStateEvent` lives here (A9). `countUnparseableMemoryFiles` and `copiedEvidence` are the readers design line 5 shows ignoring `projects/curation/`.
- `packages/nana-pack/lib/profile-sync.mjs` — `commitProfile`'s allow-list (the reason for design line 5), `withProfileLock`, `recoverProfile`, `fetchProfile`, `rebaseProfile`, `syncProfile`, reused unchanged.
- `packages/nana-pack/bin/nana-profile.mjs` — the guard order (role refusal, `resolveProfile`, `profileGuard`, marker, `seatGuard`), the 12-hex unique-prefix lookup (R-3411), the retract and supersede event shapes, and the fixed-word error mapping. Not edited (A9).
- `packages/nana-pack/lib/profile-store.mjs` — `effectiveState` stays the sole liveness reader; `exclusiveJson` for curation files; `normalizeProfileText` for quote spans; `show`'s whole-line budget and fold line, extended so the first entry always prints.
- `packages/nana-pack/lib/profile-guards.mjs` — `seatGuard` and `profileGuard`, reused unchanged.
- `packages/nana-pack/lib/memory-shaping.mjs` — the injected `runModel({ system, prompt, schema })`, an object-rooted reply schema, batch-local ids, the token cap before each call, and its spend fields in the counts line. Its whole-batch rule is deliberately not followed inside a valid reply (SHOULD 6).
- `packages/nana-pack/lib/memory-shaping-config.mjs` — the sealed system prompt pinned by SHA-256 (R-3268) and the fixed-word object.
- `packages/nana-pack/lib/memory-making.mjs` — `unitsIn`, the shared unit walk the review-turn skip extends; `askCalls` and `partsOf` read tool calls today.
- `scripts/memory-shape-runners.mjs` — `createRunner()`, used unchanged as the model.
- `scripts/memory-run.mjs` — the thin script that hands `createRunner()` to a bin's run function; `scripts/memory-curate.mjs` follows it.
- `packages/nana-pack/bin/nana-memory.mjs` — early `CI` and `NANA_ROLE` refusals before any store read, and counts-only output.
- `packages/nana-pack/lib/outcome-meter.mjs` — a second lib with an injected judge that fails closed on a bad call.
- `scripts/requirements-regroup.mjs` — a proposal checked by code, then a packet its owner reviews.
- `packages/nana-pack/tests/profile-fixture.mjs`, `packages/nana-pack/tests/memory-run-fixture.mjs` — synthetic profile and project stores for the new tests.
- `packages/nana-pack/tests/profile-sync.test.mjs` — the two-clone convergence pattern for must-meet 5.

map:search taken:
- "group records that share an owner quote" gave `profile-store.mjs` and `profile-guards.mjs` (taken); `land-ci-records.mjs` and `suite-records-config.mjs` match on the word "record" only (not taken).
- "model proposes merge of memory records" gave `memory-store.mjs`, `memory-shaping-config.mjs`, `nana-memory.mjs` (taken) and `memory-replay.mjs` (not edited; see A1).
- "owner accepts or rejects each proposal" gave `scripts/requirements-regroup.mjs` and `nana-profile.mjs` (taken).
- "write retract or supersede event" gave `profile-store.mjs` and `nana-profile.mjs` (taken); the pi extensions match on "event" only.
- "isolated model runner with stub" gave `scripts/memory-shape-runners.mjs` and `scripts/memory-run.mjs` (taken) and `apps/bench/anatomy.mjs` (another adapter, not needed).
- "review queue shown locally" gave nothing closer than `show` in `profile-store.mjs`.
- `makeMemory` came from the attack, not from map:search; it is added to the list above.

Map impact: `memory-store.mjs` and `memory-making.mjs` each reach over 100 transitive callers, mostly through `nana-land`, `memory-run` and setup. The store edit is one new export. The making edit adds one skip inside `unitsIn` and changes no existing output for transcripts without a curation command. `memory-making.test.mjs` and `memory-shaping.test.mjs` stay green unchanged, apart from the new must-meet 8 test. The pinned objects in `memory-run-seals.test.mjs` (`STORE_LAYOUT`) and `profile-store.test.mjs` (`PROFILE_WORDS`) stay untouched (SHOULD 14).

## Outside precedent

`knowledge-wiki` (github.com/j-wanger/knowledge-wiki), MIT — **borrow**. Taken: an immutable raw layer beside a curated layer (records stay; curation is events and decisions); a deterministic scan before any model step (`consolidate.py scan`, cosine 0.85, before its Analyst); a batch cap; idempotent markers for processed entries (our decision files); lifecycle states and provenance. Skipped: its UPDATE rewrote the article body and lost history; its consolidate pipeline sets "User approval gate: No"; and its Analyst, Writer and Reviewer agents were all model-judged and manual, so it never ran. This lane inverts the last two: the owner gates every change, and only proposing uses a model.

Other public references:
- mem0 (Apache-2.0): its ADD / UPDATE / DELETE / NOOP memory operations are the op vocabulary; borrowed as merge and retire, with its automatic apply skipped.
- Graphiti (Apache-2.0): contradictions recorded as `invalid_at` edges, not deletes. Borrowed as "a change is an event"; its invalidation semantics are A1's residual.
- arXiv 2505.16067: write-time gating beats later pruning. Named in A10 as the follow-up when inflow exceeds review.
- Owner's `nana-agent-loop` `research/tools/consolidate.py` and `ground.py` (no licence file): "quotes stay immutable; merge combines claims only". Borrowed as a principle; A2 goes further and writes no new claim. No code copied.
- Owner's `nana-dev-kit` `memory_server/consolidator.py` (no licence file): union-find clusters, then one model call per cluster, with soft delete. Borrowed as the two-stage shape; no code copied.

## Must-meet

1. **Things the owner said once reach the model together (NOTE 17).** Synthetic store: one owner turn saved once by the seat (profile) and once by making (project), with different claims, plus an unrelated record and a chain group larger than `BATCH_RECORDS`. Proves the deterministic stage finds what claim dedupe misses. Pins: the stub proposer receives the pair in one batch under one group hint; the unrelated record is in no shared group; the oversize group arrives in date-ordered pieces of `BATCH_RECORDS` and the counts line reports one split group. The span boundary lives in the seal test.

2. **Propose writes proposals, changes nothing live, and leaves the store writable (MUST 1).** A stub returns one valid merge and one valid retirement. Pins: two proposal files exist under `projects/curation/proposals/`; `readMemoryStore` returns the same live set, trust and supersede lists as before; `countUnparseableMemoryFiles` and `copiedEvidence` give the same results as before; no file under any `records/` or `events/` changed; `git status --porcelain` in the clone is empty; a following `nana-profile save` on the same clone succeeds; stdout is exactly the sealed counts line and size line (proposals, batches, rejected, dropped, decided, split, unsent, tokens, cost; records and claim characters per part, now and if accepted), with no fixture claim, quote or reason text.

3. **The queue shows the owner each decision (SHOULD 8, 9, 15; NOTE 22).** Pins: output starts with the sealed privacy line, then the size line; entries are numbered 1..N and ordered by claim characters freed, largest first; each carries a 12-hex key prefix, the op, the retire class, each named record's claim (cut at the per-claim cap with the marker), source and date, and the reason; a retirement shows its absorbed-record count; output stays within the queue budget with the sealed fold line for the rest; a single entry larger than the budget still prints as entry 1.

4. **Accept applies through existing events, with the owner's words.** Pins, for a merge: one `supersede` event per dropped record, `target` the kept record, `quote` the owner words, in the dropped record's own area (profile `events/` or its project `events/`); after it, `effectiveState` shows the dropped record not live and the kept record live with unchanged claim and quote; every record file's bytes are unchanged. For a retirement: a `retract` for the record. Merge, then retire the survivor: neither record is live (SHOULD 8). `accept 1st 2nd --quote` writes both under one commit; if either prefix is unknown, ambiguous, decided or stale, nothing is written (SHOULD 11). A proposal made stale by a retract on a second clone, then fetched, is refused with the sealed stale word (A6, SHOULD 10). Without `--quote`, accept refuses with a fixed word and writes nothing. After accept, `git status --porcelain` is empty and `nana-profile save` succeeds.

5. **A rejection stays rejected (MUST 4).** Pins: after `reject` of `merge {A,B,C}`, a stub returning `merge {A,B}` (any keep) writes nothing and counts one decided; after `reject` of `retire A`, a stub returning `retire A` with another class, inside a different batch grouping, writes nothing; after the rejecting clone syncs, a second clone's `propose` and `queue` honour both. An owner who rejects every proposal sees an empty queue on the next run with the same records.

6. **A failing model yields no proposals, not a crash and not a silent success (SHOULD 6).** Table-driven. Whole-reply failures: no runner, a throwing runner, `ok: false`, non-JSON, an array-rooted reply; each writes nothing for the batch, and when no batch succeeds the exit code is 1 and stdout is exactly the sealed `curate: no proposals:` line. Per-proposal failures inside a valid reply: an unknown or out-of-batch id, an id in two proposals (both dropped), a `keep` inside its own `drop`, a multi-id retire, an unknown class, an empty reason; each drops only that proposal, the valid ones in the same reply are written, and the counts line reports the drops. A merge keeping an extracted record over one saved record is written with the saved record kept. The stub's call count never exceeds the call cap, and a day ledger with no room left sends no call.

7. **Curation refuses where the profile refuses (NOTE 18).** Pins: with `NANA_ROLE` set (including empty), with `CI`, from a linked worktree, with no pointer or marker, or with a damaged JSON file in the profile's own `records/`, every subcommand exits 1 with the existing fixed word, and `propose` calls the runner zero times.

8. **Reviewing the queue makes no new memory (MUST 3).** Synthetic transcript: the seat runs `npm run memory:curate -- queue`, relays entries, and the owner answers "accept 1, reject 2"; a later stretch with no curation command has an owner decision. Pins: the review answer yields no candidate from the rule maker or the shaper's unit walk, and the skip is counted; the later decision is still extracted as before.

Each new sealed tunable gets its one seal test naming its row, outside this count: the quote span (including its boundary), batch size, call cap, token cap, queue budget (unless O2 imports it), per-claim queue cap, reason cap, retire classes, system-prompt SHA-256, curation command pattern, and the fixed words with the curation layout.

## Disposition of the attack

- MUST 1 (curation folder blocks saves): taken, option (b). Files live under `projects/curation/` (design line 5); the three readers are shown ignoring it; must-meets 2 and 4 pin a clean `git status` and a working `nana-profile save`. The lane stays ordinary.
- MUST 2 (budget and "usable" in numbers): taken. Purpose states today's counts, the forecast and the gap; fitting the budget is a reported outcome; the size line shows each decision's effect; A10 carries a stop rule at 2,000 claim characters freed. The lever is retirement with classes; a shorten op stays out (owner answer 2), and a per-line cap is the push lane's.
- MUST 3 (review turns become records): taken. The shared unit walk skips the owner turn after a curation-command stretch (design line 8, must-meet 8). `memory-making.mjs` joins the forecast; lane class rechecked, still ordinary.
- MUST 4 (rejection forgotten on regroup): taken. A retire names one record; a rejected merge blocks any subset (A4, must-meet 5).
- SHOULD 5 (model calls inside the clone lock): taken. `makeMemory` is the precedent; shared day ledger (design line 4).
- SHOULD 6 (whole-batch rejection): taken. Per-proposal validation, with keep-swap to the saved record (design line 3, must-meet 6).
- SHOULD 7 (Q1 overstated): taken. The cost is restated in the owner-answer record; the owner answered yes.
- SHOULD 8 (retiring a survivor revives duplicates): taken. Accept also retracts absorbed records; the queue shows the count (design lines 6 and 7, must-meet 4).
- SHOULD 9 (queue stall and order): taken. Per-claim cap, first entry always printed, ordered by characters freed (must-meet 3).
- SHOULD 10 (accept on an unsynced view): taken. Fetch and rebase first, with a sealed `not synced` word (design line 7, must-meet 4).
- SHOULD 11 (one commit per accept): taken. Several prefixes, all or none, one commit and sync (must-meet 4).
- SHOULD 12 (retirement criteria): taken. Four sealed retire classes in the prompt, carried on each proposal, reported per class with a drop rule (design line 2, A10).
- SHOULD 13 (batch size and oversize groups): taken. `BATCH_RECORDS` 60 so today's store is one call; oversize groups split in date order and counted (design line 1, must-meet 1).
- SHOULD 14 (unforecast literals): taken. Root `README.md` and `AGENTS.md` join the forecast; new words and layout live only in the curation config; the existing N2 known-bug line is cited.
- SHOULD 15 (queue privacy guard): taken, with one change. The push config is not on main, so the curation config seals the privacy line, and the push lane imports it when it rebases.
- NOTE 16 (inflow treadmill): taken into A10, with write-time gating named as the follow-up.
- NOTE 17 (must-meet 1 pinned implementation): taken. Restated as an owner outcome; the boundary moves to the seal test.
- NOTE 18 (damaged profile files throw): taken. The threat model now says curation refuses, and must-meet 7 pins it.
- NOTE 19 (trust stays low): kept as residual A11 with default "no confirm"; no new owner question, since all three were answered and this one is easy to undo.
- NOTE 20 (retire reuses retract): taken. The pack README states the curation meaning (A1).
- NOTE 21 (runtime over the shell timeout): taken. Run `propose` in the background (A3); proposals are written per batch (design line 4).
- NOTE 22 (prefixes in owner prose): taken. Queue entries are numbered; the seat relays numbers (design line 6).
- NOTE 23 (spend missing): taken. Tokens and cost join the counts line.
- NOTE 24 (overlap with seat-memory-push): superseded by the owner's ruling. The push lands after this lane, so the overlap note became the "Later consumer" paragraph under Feature.
