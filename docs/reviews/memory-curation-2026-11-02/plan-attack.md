# memory-curation — plan attack

Adversary for `plan.md` at worktree base 0bd1df89, with `origin/feat/seat-memory-push` (1a4b663c) read as the consumer about to land.
Private store read for counts only (field names, lengths, tallies); no record text was printed or copied.

Store counts used below (Mac, 2026-11-01, via `readMemoryStore` + the push's own line format `memoryRecordLine`):
47 live records (13 profile saved, 34 project extracted, 0 retracted, all low trust). Push-line characters: profile 2,174, project 8,129, total 10,303 against `PUSH_BUDGET` 4,000. Project kinds: 22 decision, 9 lesson, 3 correction. Six project lines over 300 characters hold 2,780 characters; the longest claim is 632. Record dates: 13 on 10-31, 31 on 11-01, 3 on 11-02.

Counts: MUST 4, SHOULD 11, NOTE 9.

---

## MUST

### 1. MUST — The first `propose` blocks every owner save and every making merge on that machine

Evidence:
- `packages/nana-pack/lib/profile-sync.mjs:57-58`: `commitProfile` throws `W.dirty` ("clone has changes outside the store") for any changed or untracked path not under `records/`, `events/` or `projects/`. Line 61 only `git add`s those three folders.
- Plan Precedent: "`withProfileLock`, `commitProfile`, `syncProfile`, reused as they are". O5 leans to `curation/` at the store root; the "under each area" alternative puts the profile area's folder at the root too.
- Every writer calls `commitProfile`: `nana-profile.mjs:101,110,118,122`; `memory-run.mjs:119,135`.
- So `propose` writes `curation/proposals/...`, its own `commitProfile` refuses, and the untracked files stay. From then on the seat's `nana-profile save` (the owner's quoted words) and session-end making both fail with "clone has changes outside the store" until someone deletes them by hand.
- The fix sits in an install-class file: `node scripts/lane-class.mjs --files packages/nana-pack/lib/profile-sync.mjs` prints `install: ... directly imported by packages/nana-setup/lib/doctor.mjs`. `memory-run-seals.test.mjs:46` pins `STORE_LAYOUT` exactly, so adding `curation` there breaks a sealed test the forecast does not name.

Plan change: pick one and state it in the plan.
- (a) Accept install class. Add `curation` to `commitProfile`'s allow-list and `git add` list in `profile-sync.mjs`, with a new layout constant in the curation config, not in `STORE_LAYOUT`. Once the lane is install class anyway, drop A9's departure and switch `nana-profile.mjs` to `writeStateEvent` in the same lane.
- (b) Stay ordinary. Put curation files under `projects/` (for example `projects/<folder>/curation/` with cross-area proposals filed under the dropped record's area). Show that `readMemoryStore`, `countUnparseableMemoryFiles` and `copiedEvidence` (`memory-store.mjs:27-45,64-71`) all ignore the new folder.

Add a must-meet: after `propose`, `accept` and `reject`, `nana-profile save` on the same clone succeeds and `git status --porcelain` is empty.

### 2. MUST — Curation as designed cannot bring delivery under 4,000 characters, and the plan never says what "usable" means in numbers

Evidence:
- Measured above: 10,303 push-line characters against 4,000. Profile alone uses 2,174, so the project part has about 1,826, roughly 9 of 34 project lines at the 206-character median.
- The plan's "about 6,600 characters" understates the push cost. The push renders `- [trust date kind] claim (id12)` per line (`memory-bundle.mjs:11` on the push branch).
- The three confirmed duplicate pairs free about 600 characters. Fitting needs about 25 of 34 project records gone.
- A2 forbids new wording, so the 2,780 characters in six long lines can only be removed whole, never shortened.
- A10 measures only after the land. No must-meet or forecast says what the owner gets. The ask is "otherwise the memory is not usable", and principle 3 needs a baseline plus a deciding test.

Plan change:
- State the forecast in the Purpose: "after accepting every proposal that removes a confirmed duplicate, the push still folds about N project records".
- Say which lever closes the gap: (i) the owner accepts a fold as usable when the right records lead (then name the ordering that decides "right"); (ii) a "shorten" op the owner accepts, which reopens Q2; or (iii) a per-line cap in the push, which is a push-lane change.
- `propose` and `queue` print live push-line characters per part, before and after the pending proposals would apply. The owner then sees the effect on the budget for each decision.
- A10 gains a stop rule. For example: if accepted proposals free less than X characters on the real store, the seat brings the owner the gap before planning more curation.

### 3. MUST — Every review in the seat creates new junk decision records about the review

Evidence:
- The shaper's sealed definition counts "one-word answers to a question" as a decision (`memory-shaping-config.mjs:37`).
- Owner units carry the seat's last message as context, up to `CONTEXT_CAP` 2,000 characters (`memory-making.mjs:91,105`; `memory-shaping.mjs:70-72`).
- The plan has the seat print the queue (claims and reasons) and the owner answer "accept" or "reject" turn by turn. The session-end making run sends exactly those turns to the shaper.
- The store already shows the pattern: 22 of 34 project records are decisions, all from 3 days.
- Each review session therefore mints "owner accepted merging X and Y"-shaped records. They need curating next time, and they re-copy record claims into new records.

Plan change:
- Add a must-meet: an owner turn whose paired seat context carries the queue produces no candidate.
- Cheapest form: `queue` output starts with a sealed marker line. The maker skips owner units whose `lastSeat`/`question` context contains it. `memory-making.mjs` is ordinary class (lane-class checked). Add it to the forecast.
- Or record it as a residual with a counted measurement in A10 (records made from review sessions), if the owner prefers to defer.

### 4. MUST — A rejection is forgotten as soon as the model regroups the same records

Evidence:
- A4 keys a decision on op plus the exact sorted record-id set.
- The model is nondeterministic and batch-local (`r1..rN`). After a rejected `retire {A,B}`, a later run that proposes `retire {A}` or `retire {B}` makes a new key and re-enters the queue with no new records.
- After a rejected `merge {A,B,C}`, a later `merge {A,B}` comes back the same way.
- So the plan's claim that "the queue stays empty until something new arrives" is false. Must-meet 5 tests only the identical set and a different `keep`.
- The rejection-memory requirement exists because a long or repeating queue is exactly what makes the owner stop reviewing.

Plan change:
- A retirement names exactly one record. The validator refuses multi-id retires, or splits them into one proposal per id. A rejected retire then blocks that record's retirement until a new record joins its group.
- A merge proposal is suppressed when its record set is a subset of a rejected merge set.
- Must-meet 5 adds: after `reject` of `merge {A,B,C}`, a stub returning `merge {A,B}` writes nothing and counts it as decided. After `reject` of `retire {A}`, a stub returning `retire {A}` inside a different batch grouping writes nothing.

---

## SHOULD

### 5. SHOULD — Following nana-profile's command order puts up to ten minutes of model calls inside the clone lock

Evidence:
- The Precedent orders `withProfileLock` before the work, as in `nana-profile.mjs:89`. One call can run `TIMEOUT_MS` 300,000 ms (`memory-shaping-config.mjs:27`), times the call cap.
- A waiting seat save gives up after `PROFILE_LOCK_WAIT_MS` 420,000 ms (`profile-config.mjs:16-18`) with "locked". A making merge waits `MERGE_LOCK_WAIT_MS`, then marks units pending.
- The working precedent for model work is `makeMemory` (`memory-run.mjs:102-140`). It does model work under the repository lock only, takes the clone lock with zero wait around reads and writes, and reserves the shared day token ledger (`dayReservation`) before each call.

Plan change: name `makeMemory` as the precedent for `propose`. Read the store under the lock, call the model with no clone lock held, then write proposals under the lock, rechecking liveness. Draw on the same day token reservation so curation and making share one day cap.

### 6. SHOULD — Whole-batch rejection throws away good proposals for one bad one

Evidence:
- The shaper's all-or-nothing rule (`memory-shaping.mjs:26-33`) fits classification, which needs exactly one row per unit.
- A proposal list has no such shape. Each proposal is independently reviewed by the owner, so dropping one invalid proposal cannot harm the others.
- Must-meet 6 makes a single "keep extracted over saved" or "id in two proposals" void the batch. Both are plausible honest model slips; a record that is both a duplicate and stale invites the second. At the plan's batch sizes, one slip per call wipes most of the queue, and `propose` exits 1.

Plan change:
- Validate per proposal. Reject the reply only when it is not an object with a `proposals` array.
- Drop any proposal with an unknown id, an empty reason or keep-in-drop. Drop both proposals when an id appears in two. For keep-extracted-over-saved, swap `keep` to the saved record, since R-3295 already decides that preference.
- Count dropped proposals in the counts line. Must-meet 6 keeps the "nothing valid → exit 1" case.

### 7. SHOULD — Question 1 overstates its cost and pushes the owner toward losing the plan's main measured win

Evidence:
- Q1 says profile text "leaves the machine for the first time" and is "hard to undo".
- Every saved profile record's quote is an owner turn typed into a Claude Code session, and its claim was written by the seat model. Both already went to the same provider.
- The shaper already sends owner turns (`memory-shaping.mjs:72`, `owner: unit.quote`) through the same `claude` CLI runner (`memory-shape-runners.mjs:21-28`). Inferred, not checked: the same account.
- If the owner answers "project only", the seven cross-area pairs, the headline finding, are never proposed.

Plan change: restate the cost: "the words already reached this provider in the seat session that saved them; this sends them again in a new grouping, outside a chat". Keep the question if the owner may still object, but drop "first time".

### 8. SHOULD — Retiring a merge survivor brings its merged-away duplicates back

Evidence:
- `effectiveState` hides a superseded record only while its target is live: `hidden=incoming.get(id).some(e=>live(e.target))` (`profile-store.mjs:115`).
- After the owner accepts `merge keep A drop B`, a later accepted `retire A`, or a plain `nana-profile retract A`, makes B live again in the next push.
- A6's stale check runs before accept, not after. The owner sees a duplicate he already removed come back.

Plan change:
- `queue` shows, for a retire, how many records the target absorbed.
- `accept` of a retire also writes a `retract` for every record live-superseded onto it, with the same owner words.
- Add a must-meet case: merge, then retire the survivor; neither record is live.

### 9. SHOULD — The queue can stall on one oversize entry, and its order does not put the owner's highest-value decisions first

Evidence:
- The plan copies `show`'s whole-line loop. That loop breaks at the first line that does not fit and prints only the fold (`profile-store.mjs:131-132`).
- A multi-id retire or a three-record merge of long claims (up to 632 characters each here), plus a reason, can exceed a 4,000 budget. Then the queue shows nothing but "left out N", and no prefix exists to accept or reject.
- No queue order is stated.

Plan change:
- Cap each entry: claims truncated at a sealed per-claim length in the queue only, with a marker. Always show at least the first entry.
- Order pending proposals by push characters freed, largest first, then key.
- Must-meet 3 adds an entry larger than the budget.

### 10. SHOULD — `accept` decides on an unsynced view

Evidence:
- The precedent order (`nana-profile.mjs:89-123`) reads and writes locally and syncs only afterwards.
- Suppose machine B retracted the kept record but machine A has not fetched. Then A's accept passes the stale check and writes `supersede B→K`. After sync K is not live, so the dropped record stays live: the accepted merge has no effect, and nothing says so.
- A5 covers decision races but not this one.

Plan change: `accept` and `queue` fetch and rebase first (as `makeMemory` does, `memory-run.mjs:115-119`). If the fetch fails, they print a fixed "not synced" word beside the result.

### 11. SHOULD — One accept per command adds a commit and a push per proposal

Evidence:
- Each nana-profile-style write ends with `commitProfile` and `syncProfile` (`nana-profile.mjs:122-123`).
- Reviewing 15 proposals means 15 commands, 15 commits and 15 pushes.
- The owner usually answers in one turn ("accept all but 3 and 7").

Plan change: `accept <prefix>... --quote` and `reject <prefix>...` take several prefixes. They refuse all of them if any is unknown, ambiguous or stale, and write under one lock, commit and sync.

### 12. SHOULD — Retirement proposals have no stated criteria and no world state, so their usefulness is untested and unmeasured

Evidence:
- The model sees only kind, source, date, claim and quote.
- It cannot know whether a decision is still current, because the plan sends no rulings, HANDOFF or objective. A "retire" is a guess the owner must check from memory.
- Every must-meet uses a stub, so nothing measures whether proposals are right. Principle 1 ("a named role needs it for a named decision") is the natural retire test, and it is not in the prompt.

Plan change:
- The sealed prompt names the retire classes, for example: a one-off approval with no future effect, a fact true only on its day, or a duplicate of a standing rule.
- Each proposal carries its class.
- A10 reports accept and reject counts per class, with a stop rule: a class the owner rejects most of the time leaves the prompt.

### 13. SHOULD — Batch size and transitive groups are unspecified, and at today's size batching only loses pairs

Evidence:
- The research store needs "about two batches at 25". Paraphrase duplicates with no shared quote that land in different batches are never seen together.
- 47 records with claims plus capped quotes fit one Sonnet call easily (inferred; the plan gives no token estimate).
- The 30-character span union can chain into one group larger than the batch size, and "batches keep each group whole" then has no defined behaviour.

Plan change:
- Choose the batch size so the current store fits one call (for example 60), and seal it.
- Define the oversize-group rule: split by the strongest shared span, or send the group alone.
- Add one test row for it.

### 14. SHOULD — Unforecast literals and files the change will touch

Evidence:
- Root `README.md:47-58` lists every `memory:*` npm script. The forecast names only the pack README.
- `memory-run-seals.test.mjs:46` pins `STORE_LAYOUT` exactly, and `profile-store.test.mjs:80` pins the whole `PROFILE_WORDS` object. Any word or layout key added to either breaks them.
- `AGENTS.md:17` lists the pack's `bin/` commands; `nana-curate` is a new one.
- `docs/known-bugs/FEAT-040.md` already holds the seat-memory-push N2 line ("a reworded re-extraction of a retracted claim gets a new id and returns"). That line is directly the curation churn case; the lane should cite it, not add a duplicate.

Plan change: add root `README.md` and `AGENTS.md` to the forecast. State that new words and layout go only in `memory-curation-config.mjs`, so the two pinned objects stay untouched.

### 15. SHOULD — Queue output has no privacy guard, unlike the push

Evidence:
- The push prints `PUSH_WORDS.privacy` beside record text: "never quote these in issues, commits, PRs or HANDOFF" (`memory-bundle-config.mjs:24` on the push branch).
- `queue` prints the same claims plus model reasons into the seat. The seat then writes HANDOFF lines, issues (public) and review notes from that conversation.

Plan change: `queue` leads with the same sealed privacy line, imported by name from the push config after that lane lands, and must-meet 3 pins its presence.

---

## NOTE

### 16. NOTE — The queue will be a treadmill unless making's inflow is measured

All 47 records arrived in 3 days, 31 of them on 11-01. Curation removes records at the owner's review pace, while making adds them at its own precision (known bugs list 183/310 for the rules). Have A10 report records made per day against records removed per review, and name write-time gating (the plan's arXiv 2505.16067 note) as the follow-up when inflow exceeds review.

### 17. NOTE — Must-meet 1 pins implementation rather than owner outcome

"Claims share under 30% of words" and "`QUOTE_SPAN_CHARS - 1` gives no group" are threshold tests; the seal test already pins the span. Restate as: "records the owner said in one turn, saved once by the seat and once by making, reach the model in one batch as one group". Move the boundary case to the seal test.

### 18. NOTE — The profile area's damaged files throw; they are not skipped

`readMemoryStore` reads the profile area without `onUnparseable` (`memory-store.mjs:28`), and FEAT-040 already lists "a damaged file in the profile's own records or events folders still blocks saves". The threat model says damaged profile files are "skipped and counted". Say instead that `propose` and `queue` refuse with a fixed word, matching nana-profile, and add the row to must-meet 6 or 8.

### 19. NOTE — Trust stays low after the owner reviews

All 47 records are low trust, and the push ranks by trust (`memory-bundle.mjs:18` on the push branch). A merge drops the duplicate's sessions instead of counting them toward the survivor. An accept is the owner reading the claim and keeping it. Ask the owner whether an accepted merge should also write a `confirm` on the kept record with his accept words; `effectiveState` would then rank it high (`profile-store.mjs:96`). Default: no, recorded as a residual.

### 20. NOTE — "Retire" reuses `retract`, whose documented meaning is "wrong"

The push tells the seat "retract only when the owner says a record is wrong" (`memory-bundle-config.mjs:24`). Curation will retract records that are merely spent. A1 covers replay; also state in the pack README that a curation retract means "no longer useful", so the seat does not refuse to relay retire proposals.

### 21. NOTE — `propose` runtime exceeds the seat's default shell timeout

Two sequential calls with up to 300 s each exceed Claude Code's 120 s default Bash timeout. A killed run leaves partial proposals; with finding 1 unfixed, they also block saves. The pack README should say to run `propose` in the background, per the 2026-10-15 watcher ruling, and `propose` should write each batch's proposals as that batch completes.

### 22. NOTE — Relaying 12-hex prefixes clashes with the writing rule

The owner-facing writing rule bans identifiers in prose. Number queue entries 1..N in the output and let the seat map numbers to prefixes, so the owner answers "accept 1, 3".

### 23. NOTE — The counts line omits spend

The shaper prints tokens and cost (`memory-shaping.mjs:119-120`). Add `tokens` and `cost` to `propose`'s sealed counts line, so a junk run that spends but proposes nothing is visible.

### 24. NOTE — Seat-memory-push overlap checked: no conflict beyond the stated merges

The push branch adds `resolveMemoryRepository` and a `gitText` import to `memory-store.mjs`. It changes `profileGit` in `profile-sync.mjs:17-20` (relevant if finding 1 picks option (a)) and edits `nana-memory.mjs`. The push reads `readMemoryStore` then `.live` (`memory-push.mjs:56-57`), so accepted events reach it unchanged, as the plan says. Merge main after it lands, before build 1, since finding 1(a) and finding 15 both touch its files or words.
