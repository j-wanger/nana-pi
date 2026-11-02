# seat-memory-push — plan (revision 2)

Worktree `~/nana-pi-wt/seat-memory-push`, branch `feat/seat-memory-push`, based on main ad9612dd.
Grounding: `docs/memory-factory-design-2026-10-31.md` version 2 (stage needs, retrieval, subject and scope, principles 2, 4, 6, 7, 8), the store and merge step from lane making-trigger, the owner profile, today's shared-memory SessionStart hook and its load log (FEAT-041, R-3217), the hook deadline precedent (`packages/nana-setup/lib/hook-producer.mjs`, R-2672, R-2674), the knowledge pull hook, `docs/known-bugs/FEAT-040.md`, the replay lane's plan and its built maker call site (`~/nana-pi-wt/memory-replay`, SUB-025, A5 and A7), and the adversary's `plan-attack.md` in this folder.

Revision 2 takes every MUST (M1 to M4) and every SHOULD (S1 to S6) from the attack. It takes NOTEs N1, N3, N4 and N6, makes N2 a known-bug line, and makes N5 a seat step. The disposition list is at the end.

## Purpose

Agreed reading (owner, 2026-11-01): "the first memory delivery is reading 1 — at session start, the seat gets a small, strictly budgeted bundle: the owner's profile records and this project's records, replacing today's long shared-memory index." The owner intends this to grow into progressive pull, where the seat and planner search when they need more. So the push is built so a later per-prompt pull attaches without rework: one store reader, one bundle maker, one line format and one renderer. Only the push is built now.

Revision 2 keeps the index beside the push, inside today's 9,000-character hook budget, until the replay shows the push alone is no worse (attack M1). The owner's "replacing" stays the goal. Dropping the index is owner question 1, and it waits on that measurement.

The work also fixes one known bug first: `nana-profile show` and `sync` skip the role refusal, so a builder or reviewer could print owner claims (FEAT-040 known bugs, owner-profile final review). That extends the contract R-3231 states for writes to every command.

### The split

Nine must-meet tests would exceed eight, so the work splits in two lanes. **Lane A comes first.**

1. **seat-memory-push-a (ordinary lane, first).** `nana-profile` refuses every command under a launcher role, and `retract`, `confirm` and `supersede` accept a unique 12-hex prefix across the whole store. A project-record retract event goes in the record's own area. Must-meets A1 and A2. It is first because the bug fix is owed before any delivery. The push also prints ids that only this lane makes retractable.
2. **seat-memory-push (hook lane, second, this worktree).** The bundle maker, the renderer, the seat push and the hook change. Must-meets B1 to B7. It is based on main after lane A lands.

Lane A runs in its own worktree `~/nana-pi-wt/seat-memory-push-a` on `feat/seat-memory-push-a`. This plan serves both lanes; lane A's brief cites its section.

### Design in five lines

1. One pure maker, `makeMemoryBundle(states, { repository, asOf, budget })` in a new `packages/nana-pack/lib/memory-bundle.mjs`, selects live records in two parts: profile first, then project. Inside each part it orders by trust, saved above extracted, kind (corrections first), then newest `date`. It renders whole lines until the record-line characters reach the budget.
2. One renderer, `renderSeatMemory({ header, entries, indexPath, bundle, budget })` in a new `packages/nana-pack/lib/memory-render.mjs`, prints the shared header, the push, then the index through the existing shortener with the budget left. The shortener moves there unchanged. The hook's no-push path calls it with the whole budget, so its bytes do not change.
3. One reader stays `readMemoryStore`. The assembler `seatPush(...)` in a new `packages/nana-pack/lib/memory-push.mjs` resolves the pointer and this repository. It skips under any `NANA_ROLE` (set, even empty), `CI`, a linked worktree or the `memoryPush: false` switch.
4. The hook prepares today's index output first, in memory. It prints that output, byte for byte, if the push is not ready inside the `HOOK_DEADLINE_MS` deadline (4,000 ms from process start) or if the push is skipped. A store error with a valid pointer adds one note line.
5. The replay's treatment arm keeps the recorded instruction files. It replaces only the shared-memory hook output, with `renderSeatMemory` over the recorded index entries and `makeMemoryBundle` as of the cut.

### Decisions, with reasons

- **What goes in (attack M2, M4).** The maker sees live states after `effectiveState`. A profile record has no `repository` and `source: saved`. A project record has `repository` equal to the argument. Every other record is left out, including other repositories' records and extracted records with no repository. All trust levels go in, since every record is low today, and each line shows its trust. A record with `invalidAt` on or before the `asOf` day, or today when `asOf` is absent, is left out.
- **Order (attack M4).** Part first: profile records, then project records. The profile part may take the whole budget, and project records fill what is left. Inside each part: trust (high, medium, low), then `saved` above `extracted`, then kind (correction, decision, preference, lesson, fact, thinking, then any other), then newest `date`, then file stamp, then id. Corrections lead the project part because the measured outcome is corrections given twice. A saved record outranks an extracted one because it carries the owner's own words.
- **Time key (attack M2).** The maker's only time key is `record.date`, the evidence day. `asOf` acts on `date` and `invalidAt`: it drops records dated after the `asOf` day and records invalid on or before it. The caller owns any cut within the day. The replay already cuts candidates by instant before calling the maker (`candidate.at < cut`). The merge-run file stamp is only a tie-break before the id.
- **Format and counting (attack S3, S4, S6).** The push header is one sealed line: `[nana:memory] push <n> of <m> records, <c> of 4000 chars; private: never quote these in issues, commits, PRs or HANDOFF; low trust is unconfirmed; retract only when the owner says a record is wrong: nana-profile retract <id> --quote "<the owner's words>"`. Here `<c>` counts record-line characters only. The 4,000 budget covers record lines only. The header and the fold line sit outside it and are counted in the hook total at their widest form. Each record line is `- [<trust> <date> <kind>] <claim, whitespace collapsed> (<12-hex id>)`. When lines are left out, the fold line reads `[nana:memory] left out <k> profile, <j> project`. The later pull reuses the record-line format.
- **The index beside the push (attack M1).** In push mode the renderer gives the index the budget `SHARED_MEMORY_OUTPUT_BUDGET` minus the shared header, push header, push lines and push fold line. Measured today, the hook's head form (`- [title](file)`) needs 6,004 characters for 88 entries. So the existing shortener alone cannot print every title beside a 4,000 push; it would leave the tail entries out. The renderer therefore adds one tier, used in push mode only. When the heads do not fit, it prints every entry as `- [title]` (2,668 characters for 88 entries) and keeps the existing fold line naming the full index path. The no-push path never reaches this tier, so its bytes stay unchanged. Past about 140 entries, titles leave the tail out with the same fold line.
- **Budget.** The hook total stays at most 9,000 (`SHARED_MEMORY_OUTPUT_BUDGET`, unchanged). The only new budget seal is the push's 4,000 record-line characters. The pull share is not sealed; the pull lane owns its own per-prompt budget, beside `BLOCK_MAX_CHARS` (attack S5).
- **Deadline and git (attack M3).** The hook builds today's output first and holds it in memory. One deadline, `HOOK_DEADLINE_MS` (4,000 ms, R-2672), is imported from `hook-producer.mjs` and counted from process start. Each git call gets the smaller of a sealed per-call timeout (1,000 ms, chosen) and the time left. The worktree test is one call, `git rev-parse --absolute-git-dir --git-common-dir`. Repository resolution is one more call, `git rev-list --max-parents=0 HEAD`. When the deadline passes before the push is ready, the hook prints the prepared output and logs `deadline`.
- **Skips and the damaged store (attack S2, N1).** The push is skipped silently, with byte-identical output, under `NANA_ROLE` set to any value including empty (the profile's `!== undefined` rule, not frontier's list), `CI`, a linked worktree, no pointer, a missing marker, and `memoryPush: false`. When the pointer and marker are valid but the store read throws, the hook prints the index as usual and adds one last line: `[nana:memory] push unavailable: store error`. The hook counts damaged project files skipped by `readMemoryStore` into the load line.
- **What the seat sees and how it retracts (lane A, attack S3).** The bundle in context is the delivery. The load line records the delivered and left-out 12-hex ids and the record-line characters, never text. `retract`, `confirm` and `supersede` take a unique prefix of at least 12 hex characters. They look the record up across the store with `readMemoryStore`. A retract or confirm event is written into the record's own area: profile `events/`, or `projects/<folder>/events/`. An unknown or ambiguous prefix refuses and writes nothing. The header tells the seat to retract only on the owner's word. The quote check stays non-empty only; a seat-invented quote stays outside the threat model's checks, as today (FEAT-040 known bug).
- **Privacy (attack S4, N3).** Owner text reaches only the hook's stdout, the seat's own context. The header says never to quote it in public places. The load log, outside git and guarded by `appendContextLoad`, holds ids and counts. The README says ids are 12-hex prefixes of the claim's SHA-256. Every refusal and error is a fixed word. Builders and reviewers get nothing from this lane: Claude children run without user hooks, and the hook skips under any `NANA_ROLE`. `nana-profile` refuses every command under `NANA_ROLE`. Tests use synthetic records with a canary that must appear in no log, stderr or repo file.
- **`show` (attack N4).** `show` stays unchanged and keeps its conflict lines. The maker does not print conflicts. They share `effectiveState` only.
- **Windows.** The hook keeps its `exec` form. Git runs through `profileGit` (`windowsHide`) under the deadline. The worktree test compares git dirs with `canonicalCwd`, as `seatGuard` does, which handles drive-letter and case variants. Store paths come from `path.join` only. The damaged-store case uses a bad JSON file, not chmod, so it runs on Windows. The draft PR is pushed at build 1 so the seat reads the Windows leg before the review brief.
- **Session sources (attack N6).** The hook's `startup` matcher stays. After `/clear` or compaction, the seat gets no fresh push and no index, as today. The setup README says so.

## The replay lane's change

The replay lane (`~/nana-pi-wt/memory-replay`, SUB-025) is building. The seat briefs it. For its treatment arm to judge this lane's live delivery, it needs these changes:

1. **Slot.** Treatment keeps the recorded `instructions` files typed AutoMem unchanged. It replaces only the SessionStart output whose `command` names the shared-memory hook. Control stays the recorded slot. Today treatment replaces both parts with the bundle, which also removes the project `MEMORY.md`. That bias works against the bundle.
2. **Text.** The treatment hook output is `renderSeatMemory({ header, entries, indexPath, bundle, budget: SHARED_MEMORY_OUTPUT_BUDGET })`. `entries` are the `- [` lines parsed from the recorded hook output, and `header` and `indexPath` are its recorded first line and path. `bundle = makeMemoryBundle(effectiveState(past.map(r => ({ ...r, repository })), []), { repository, asOf: cut, budget: PUSH_BUDGET })`. Both functions are imported by name from this lane's modules.
3. **Maker signature.** `options.maker` must receive the cut and the recorded slot, not the records alone: `maker(records, { cut, slot })` returning the hook output text. The replay's default maker keeps its own behaviour.
4. **Repository on candidates.** The adapter sets `repository` on each raw A-091 candidate before `effectiveState`. Without it, the maker classes nothing as a project record and the push is empty.
5. **Bundle cap.** The replay's `BUNDLE_BUDGET` (8,000) slice must not cut this text, since the rendered hook output runs up to 9,000. Either the cap does not apply to a maker that returns hook output, or it rises to 9,000.
6. **Confirmatory run.** The maker hash covers both functions. The replay's one confirmatory run on this maker waits until lane B lands.
7. **Residual it keeps.** Frozen candidates hold no seat-saved profile records, so the replay judges the project part only. With the index kept beside the push, treatment equals the recorded index plus the push. The question it answers is whether adding the push reduces repeats.

## Assumptions

- A1. The push reads the profile pointer from pi's active agent dir with `resolveProfile`, like `nana-memory`. A Claude Code process whose `PI_CODING_AGENT_DIR` differs from pi's reads a different file, as the existing contract note says.
- A2. The repository id is resolved as `nana-memory` does: root commits, preferring an enabled one. That resolution moves from `bin/nana-memory.mjs` into `lib/memory-store.mjs` as one exported helper, and both callers import it (ruling 2026-10-22). A repository not enabled for making still gets the profile part; its project part is empty.
- A3. The hook does not run `profileGuard`, which takes three more git calls, because it only reads. It requires the store marker. Writes stay guarded as today.
- A4. Evidence is not rechecked at push time (principle 2). The upkeep lane owns evidence recheck. This is a residual.
- A5. Claude Code's own project auto-memory `MEMORY.md` still loads by itself. This lane does not touch it, and it sits outside the 9,000 budget.
- A6. The install check's synthetic home has no profile pointer, so its shared-memory leg sees today's output and passes unchanged. A push leg in the install check is left for a later lane.
- A7. The kind ranks for kinds the store does not hold yet (`fact`, `thinking`) are guesses. Their seal is `chosen`.
- A8. A store with a valid pointer and zero matching records prints the index whole, with the push header reading `push 0 of 0`. The cost is one line.

## Open choices

- O1. Exact fold and note wording, sealed with the other fixed words in a new `packages/nana-pack/lib/memory-bundle-config.mjs`.
- O2. Whether `seatPush` returns `{ bundle, reason }` or throws fixed words that the hook maps to a reason.
- O3. Whether the per-call git timeout is a new seal or reuses a nearby one at or under 1,000 ms.
- O4. In lane A, whether the prefix lookup lives in `profile-store.mjs` beside `claimId` or in `memory-store.mjs` beside `readMemoryStore`.

## Questions for the owner

Question: When should the index stop printing at session start?
Default: keep beside — the index keeps printing beside the push, and is dropped only after the replay shows the push alone is no worse.
What the default gains and misses: no feedback rule leaves session start without a measurement, but the seat keeps reading about 2,700 characters of index titles that may repeat the push.
Cost of a wrong guess: easy to undo — one renderer branch, and a `memoryPush: false` line restores today's output.
If answered otherwise: the push replaces the index at land, the 75 feedback titles leave session start, and the remaining space shrinks to the header and the push.

Question: Should the seat's push include this project's builder and reviewer lessons, or only records meant for the seat?
Default: all — every live record of this repository, as the owner's words say.
What the default gains and misses: the seat, which plans lanes, sees past review lessons; but 4 of today's 20 records are builder lessons that take about 700 of the 4,000 characters.
Cost of a wrong guess: easy to undo — one filter on the roles field.
If answered otherwise: only records whose roles include the seat go in, and lessons wait for the planner push.

## Feature

Feature: FEAT-044 · Deliver memory to each role

New feature, not a FEAT-040 subgroup. FEAT-040 makes and keeps records; delivery is design station 6, with its own series: the seat push now, then the per-prompt pull, then planner, builder and reviewer pushes. FEAT-041 shapes launched agents' context through launchers, and the seat is not launched. Purpose line: "Deliver each role a bounded, ranked bundle of its memory in the context slot it already has, and record what was delivered."

Rows: closed range R-3410 to R-3429.
- Lane A: R-3410 and R-3411 under FEAT-040 · SUB-023, beside R-3231.
- Lane B: R-3412 to R-3421 under FEAT-044. R-3422 to R-3429 stay spare.
- No new artifact; A-099 stays unused. FEAT-044 adds `Reads: A-090` and `Reads: A-093`, both naming `packages/nana-pack/lib/memory-push.mjs`. A-093 gains `nana-profile retract` and `confirm` as makers of its `events/` (lane A). A-089 gains the push fields on the shared-memory load line (lane B).

Lane class, rerun with `node scripts/lane-class.mjs --root . --files <planned files>`:
- Lane A: `ordinary`, also reaching `nana-land.mjs` through `nana-profile.mjs` and `profile-store.mjs`. It gets one final reviewer.
- Lane B: `hook: packages/nana-setup/claude/hooks/nana-shared-memory.mjs — Claude Code hook`. It needs the local install check on macOS before the land, the land reviewer, the seat's wrong-code pairs and one independent check.

## Threat model

In scope: honest variation in our own tools' output. That covers an empty, near-empty or absent store, damaged profile and project files, records from another repository, retracted, superseded and invalid records, supersede cycles, records merged in batches with one file stamp, claims with newlines and non-ASCII text, a store over budget, an index over budget, a missing pointer or marker, `NANA_ROLE` set or empty, a CI runner, a linked worktree, Windows paths, and git slowed by a Windows stall. Out of scope: deliberate forgery, such as a planted record crafted to steer the seat or a forged pointer. Prompt-injection defence for delivered text belongs to a later checking lane. A finding outside the model is a residual and becomes a known-bug line.

## Precedent

- `packages/nana-pack/lib/profile-store.mjs` — `show`: trust-then-newest order, whole lines, a reserved fold line inside the budget. The maker follows its shape, with parts, source rank, date and `asOf`. `show` stays unchanged.
- `packages/nana-pack/lib/memory-store.mjs` — `readMemoryStore` is the one reader over both areas, with `onUnparseable` for project files. `writeMemoryFile` writes project-area events, the precedent for lane A's retract event.
- `packages/nana-pack/bin/nana-memory.mjs` — repository resolution and the `CI` and `NANA_ROLE` early refusals. The resolution helper moves to `memory-store.mjs`, and both callers import it.
- `packages/nana-pack/lib/profile-guards.mjs` — `seatGuard`'s git-dir comparison with `canonicalCwd`, reused in one call.
- `packages/nana-pack/bin/nana-profile.mjs` — `resolveProfile`, the role refusal line moved above every command (lane A), and the confirm, retract and supersede lookup.
- `packages/nana-setup/claude/hooks/nana-shared-memory.mjs` — the header, fold line and shortener, which move unchanged into `memory-render.mjs`. Also the dynamic import of pack lib and the one load line per run.
- `packages/nana-setup/lib/hook-producer.mjs` — `HOOK_DEADLINE_MS` and its deadline pattern (R-2672, R-2674), imported rather than copied.
- `packages/nana-pack/lib/context-load-log.mjs` — `appendContextLoad`, extended with push fields on the same line.
- `packages/nana-pack/lib/known-bug-digest.mjs` — whole-line selection for role context under a sealed budget (map:search "select records for a budgeted bundle").
- `packages/nana-pack/lib/frontier-summary.mjs` — a bounded session-start block with fixed words. Its `LAUNCHER_ROLES` list is deliberately not followed; the profile's any-value rule is.
- `packages/nana-knowledge/lib/hook.ts` — `BLOCK_MAX_CHARS` and per-session shown keys: the attach point and dedupe pattern for the later pull. Not edited.
- `packages/nana-setup/tests/shared-memory-budget.test.mjs`, `packages/nana-setup/tests/shared-memory-hook.test.mjs` — they pin the no-push bytes and stay green unchanged.
- `packages/nana-pack/tests/profile-fixture.mjs`, `packages/nana-pack/tests/memory-run-fixture.mjs` — synthetic profile and project stores for the new tests.

map:search taken: "select records for a budgeted bundle" gave `known-bug-digest.mjs` and `frontier-summary.mjs` (taken). "session start hook print memory" gave `nana-roster-notice.mjs` and `shared-memory-input.mjs` (already in use). "resolve repository root id for memory" gave `nana-memory.mjs`, `memory-making.mjs` and `memory-store.mjs` (taken). "retract a profile record" gave the profile modules (taken). "role refusal NANA_ROLE" gave the review launchers (not needed).

Map impact: the hook's callers are four tests (`context-anatomy`, `shared-memory-budget`, `shared-memory-hook`, `shared-memory-input`). `nana-profile.mjs` and `profile-store.mjs` reach 88 and 104 transitive callers, mostly launch paths through `nana-land` and `memory-run`. Lane A's edits there stay additive: the role line, a lookup and an event target. Tests that name the literals these lanes change are `profile-store.test.mjs` (show and sync under a role), `context-anatomy.test.mjs` (R-3217 load fields) and `install-check.mjs` line 515 (`printedChars === stdout.length` stays true).

Expected file changes (a forecast, not a limit):
- Lane A: `nana-profile.mjs`, `profile-store.mjs` or `memory-store.mjs` (prefix lookup), `profile-store.test.mjs`, the pack README, `REQUIREMENTS.md`, and `docs/known-bugs/FEAT-040.md` (remove the fixed line, add N2's line).
- Lane B: new `memory-bundle.mjs`, `memory-bundle-config.mjs`, `memory-render.mjs`, `memory-push.mjs`, `packages/nana-pack/tests/memory-bundle.test.mjs` and `packages/nana-setup/tests/shared-memory-push.test.mjs`. Edits to the hook, `nana-memory.mjs`, `memory-store.mjs`, `profile-guards.mjs`, `context-load-log.mjs` if needed, both READMEs, `REQUIREMENTS.md`, the code map, and a new `docs/known-bugs/FEAT-044.md`.

## Outside precedent

Letta (formerly MemGPT), Apache-2.0 — borrow: a fixed-size core memory block always in context, with archival memory reached by search, is the push-plus-pull split here. Its self-editing memory tools are skipped, because records change only through the owner's words. Claude Code's own auto-memory, which loads the first lines of `MEMORY.md` at start, is the behaviour this lane sits beside.

## Must-meet

### Lane A (first)

A1. **Every profile command refuses under a launcher role** (R-3410). A valid pointer leads to a store holding a canary. With `NANA_ROLE=worker`, and again with `NANA_ROLE=""`, `show`, `sync`, `save`, `confirm`, `retract`, `supersede` and `init` each exit 1 with `profile refused: NANA_ROLE is set`. None prints the canary or reads the pointer.

A2. **A record is retracted by its printed 12-hex id, in its own area** (R-3411). A profile record and a project record are each retracted by their 12-hex prefix with an owner quote. `readMemoryStore` then shows each one not live. The project retract event lands under `projects/<folder>/events/`. An unknown prefix, an ambiguous prefix and a prefix under 12 characters each refuse with a fixed line and write nothing.

### Lane B (second)

B1. **The push prints beside the whole index** (R-3412). A synthetic store holds two saved profile records, three records of this repository, one other-repository record, one retracted, one superseded and one with past `invalidAt`. The index has 88 entries. The hook prints the unchanged shared header, then the push header with `push 5 of 5` and the privacy and retract phrases, then exactly those five claims, then all 88 index titles and the index fold line. No hidden or other-repository claim prints, and stdout stays at most `SHARED_MEMORY_OUTPUT_BUDGET`. A second case uses a store with zero matching records; it prints `push 0 of 0` and every index title.

B2. **Order, parts and the exact budget** (R-3413). Case one has 40 extracted low decisions plus 2 saved low preferences, over budget. Both preferences print first. The fold line reads `left out 0 profile, <j> project`. Case two holds records of mixed trust, source, kind and date within one part. They come out high before low, saved before extracted, correction before decision before preference, then newest date. Case three sizes record lines to exactly 4,000: every line prints. One more character folds out the last line, and no line is cut mid-text. Case four puts the record-line total at 999 and then 1,000. The header shows `999 of 4000` and `1000 of 4000`, and neither changes which lines print.

B3. **No push means today's output, byte for byte; a damaged store adds one note** (R-3414). Each skip case matches the current hook's output for the same index exactly: no pointer, missing marker, `NANA_ROLE=worker`, `NANA_ROLE=""`, `CI=1`, a linked worktree and `memoryPush: false`. A canary claim appears in neither stdout nor stderr, and the load line carries the fixed skip reason. A damaged profile JSON with a valid pointer and marker prints the same bytes plus the last line `[nana:memory] push unavailable: store error`.

B4. **Slow git cannot cost the index** (R-3415). An injected git runner sleeps past the deadline. The hook exits in under `HOOK_DEADLINE_MS` plus a sealed test margin and prints today's output byte for byte. Its load line reads `deadline`. The worktree test uses exactly one git call.

B5. **One maker and one renderer serve the push and the replay** (R-3416). `makeMemoryBundle` is pure: the same states give the same text. Case one is a record dated the day before the cut and merged after it. It appears both read back from a store and passed raw through `effectiveState(records, [])`. Case two is a record dated after the cut's day, which neither path includes. Case three is a raw candidate without `repository`, passed through the documented adapter that sets it, which appears in the project part. `renderSeatMemory` over the hook's own inputs returns exactly the hook's stdout. The test imports both functions by name.

B6. **The load log records what was delivered, without text** (R-3417). One line per hook run holds `printedChars === stdout.length` and the push's record-line characters. It holds the delivered and left-out 12-hex ids, the count of skipped damaged project files, and the reason word. The fixture's claim and quote canaries appear nowhere in the log file.

B7. **Seals** (R-3418 to R-3421, one test each): push budget 4,000 record-line characters; part and source order; kind order; per-call git timeout. `HOOK_DEADLINE_MS` and `SHARED_MEMORY_OUTPUT_BUDGET` are imported, not resealed. Every other assertion imports the names.

Suggested wrong-code pairs for the seat (lane B): drop the repository filter (fails B1); order by kind before part (fails B2); skip the role check in `seatPush` (fails B3); run git with no deadline (fails B4); key "newest" on the file stamp (fails B5); log claims in the load line (fails B6).

## Seat steps outside the build

- Before lane B lands, the seat runs a private count of how many of the 20 records restate an index feedback entry (attack N5). It reports the count only.
- After lane B lands, the seat posts a `next` issue: move the 75 feedback entries into the store, with the owner's quotes.

## Residuals

- The 88 shared index entries are not in the store. With the index kept beside the push, nothing is lost, but the index still prints at session start.
- Evidence is not rechecked at push time (A4).
- A reworded re-extraction of a retracted claim gets a new id and returns on the next push (attack N2). This becomes a known-bug line for upkeep.
- A seat-invented retract quote passes the non-empty check. The header asks the seat to retract only on the owner's word.
- The replay judges the project part only, since frozen candidates hold no saved profile records.
- The project auto-memory `MEMORY.md` loads outside the 9,000 budget.

## Attack disposition

- M1 taken: the index stays beside the push, every title prints, and the no-push path stays byte-identical. One correction to the attack: the hook's head form needs 6,004 characters, not 2,315. A push-mode title tier is added so every title fits (B1). Owner question 1 now asks when to drop the index.
- M2 taken: `date` is the time key, `asOf` acts on `date` and `invalidAt`, the caller owns the cut within the day, the maker defines the classes and the adapter sets `repository` (B5).
- M3 taken: one deadline from `hook-producer.mjs`, the index prepared first, a single git call for the worktree test, and the slow-git must-meet (B4).
- M4 taken: profile part first, saved above extracted, and the 40-decisions-versus-2-preferences case (B2).
- S1 taken: `renderSeatMemory` is exported, and the replay change is listed above.
- S2 taken: the store-error note and skipped-file count (B3, B6).
- S3 taken: the retract phrase says "only when the owner says a record is wrong".
- S4 taken: the privacy clause in the header (B1).
- S5 taken: no pull share seal.
- S6 taken: `<c>` counts record lines only, with the 999 and 1,000 case (B2).
- N1 taken: an empty `NANA_ROLE` counts as set (A1, B3).
- N2 residual: a known-bug line.
- N3 taken: the README says ids are claim-hash prefixes.
- N4 taken: `show` stays unchanged and keeps its conflict lines.
- N5 taken as a seat step.
- N6 taken: a README contract note.
