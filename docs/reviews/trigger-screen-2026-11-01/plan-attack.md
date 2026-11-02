# Plan attack — trigger-screen

Adversary pass over `plan.md` against `research/raw/2026-11-01-memory-pull-trigger/report.md` and the code at 0bd1df89. Private stores were read by field names and counts only (`~/nana-memory-runs/replay-2026-11-01/plan.json`, `labels-2026-11-01/labels.jsonl`, `2026-10-31/{labels,turns}.jsonl`, the candidates file whose hash matches the plan's `candidatesHash`). No record, label or prompt text was printed or copied. Counts marked *inferred* come from a field-level approximation, not from the screen's own code.

Counts that ground the findings:
- The plan holds 12 R corrections, all `planned`, in **3 sessions** (3, 8 and 1 cases) with 3 distinct cuts; pools are 81 to 131 records.
- Targets by `repeatOf ∩ bundleRecords.evidence`: 11 positives have at least one target, 1 has none. So **n = 11**, excluded 1. Bars at n = 11: signal floor ≤ 2, bm25 enough ≥ 9.
- The excluded case is a true store gap: the hashed candidates file holds no candidate at that pointer or at its owner unit.
- 9 distinct target records cover the 11 scored cases; the 3-case session shares one target set.
- Labels: the 2026-11-01 file has 208 rows in **8 sessions**. The snapshot has **340** session files. The 2026-10-31 kind-only labels hold 799 rows (535 `none`, 46 `correction`).
- `skipReason` over the last owner turn in each positive's stored history: 10 pass, 1 `too-short`, 1 `too-few-tokens` (*inferred*: the history's final USER chunk stands in for the prompt).

## MUST

1. **MUST — `skipReason` on arms B and C throws away the agent-turn signal they exist to test, biasing toward `signal floor`.**
   Evidence: plan.md:19 ("Every arm first applies today's `skipReason`"); report.md:45-46 gives only A the skip rule ("Top 3 records above the skip rule"); B and C read "the prompt, plus the last agent turn". tokenize.ts:58,64 skips under 12 characters or under 2 meaningful tokens. About 2 of 12 positives are skipped (*inferred*, counts above). A terse "yes" or "go on" before a mistake is exactly the case where only the agent turn carries the signal.
   Effect: with n = 11, B and C can reach at most about 9. Bar 1 (≤ 2 each) gets easier to meet, and its conclusion, "the prompt does not carry the signal", becomes partly an artefact of the skip rule. Bar 3 wins on those cases are impossible.
   Plan change: apply `skipReason` to arm A only, as the report does. B and C skip only when the combined query text (prompt plus tail) is empty or under the meaningful-token floor. Print a `skipped <k>` count per arm over positives and negatives. Add a must-meet 4 pin: a 3-character prompt whose preceding agent turn names the target is a hit for B and C and a miss for A.

2. **MUST — a model arm that warms up but then fails on most calls is `available` with 0 hits, so the verdict can read `signal floor` and stop model work because of a client bug.**
   Evidence: plan.md:35 (unavailable only when the warm-up fails; later errors "deliver nothing for that input"); plan.md:25 (bar 1 needs only "all three arms are available"); plan.md:53 (the `decide` request shape is guessed from server source, checked by "one synthetic question"); plan.md:22 (P(pull) and P(relevant) mapping is left to the builder). An inverted probability, a truncated input, a schema drift on the relevance call (but not the gate), or a slow daemon timing out on every relevance call all look like a weak model.
   Plan change: (a) the warm-up must parse to the expected shape, not only return 200. (b) Count per arm, over all inputs, the calls that errored, timed out or had the wrong shape, and print `failed <k>` per arm. (c) Seal a failure cap; an arm over it is `degraded`, and bars 1 and 3 print `incomplete` for it. (d) The seat's pre-run check uses two synthetic questions with opposite known answers and requires P(yes) to order them; one question cannot catch an inverted mapping. Pin (b) and (c) in must-meet 5: a `decide` stub that answers the warm-up and then throws on every relevance call gives `incomplete`, never `signal floor`.

3. **MUST — arm C's latency bar is decided by a builder choice and by the candidate count, not by the model.**
   Evidence: plan.md:22 (C scores "B's 40-candidate union"); report.md:48 (C's latency estimate is "for 20 candidates"); plan.md:54 (O2 lets the builder send relevance questions one at a time); plan.md:27 (p95 ≤ 300 ms); report.md:27 (laya-mlx about 13 ms per short decision on M3 Max, so 41 sequential calls is about 530 ms before HTTP overhead, *inferred*). plan.md:23 also times p95 "over all positives and negatives", which includes skipped inputs and gate-closed inputs at near zero ms. That dilution pulls p95 down by an unknown amount.
   Effect: a C that wins on hits can fail bar 3 on a sequential client, giving `no arm advances`. Or it can pass on a diluted p95. Either way the owner reads a model property that was not measured.
   Plan change: C scores B's fused top 20, as the report sizes it. Seal one batched relevance request per input (or a sealed concurrency), and make the builder report if the server cannot batch. Compute p95 per arm over the inputs where that arm made a model call, and print that count. Add a sealed per-input deadline beside the per-call timeout: with 21 calls at 5,000 ms each, a hung daemon costs about 105 s per input and about 6 h for 212 inputs (*inferred*).

## SHOULD

4. **SHOULD — A1 is false by count: negatives come from 340 sessions, but correction labels cover 8.**
   Evidence: plan.md:18 (eligible unless a "correction-labelled owner turn" follows within two); plan.md:39 (A1: "the labels cover every correction in the frozen snapshot"). The 2026-11-01 labels span 8 of 340 sessions. In the 2026-10-31 labelled sample, 46 of 799 owner turns are corrections, about 6%. So about 1 in 9 negatives may sit before an unlabelled correction (*inferred*, two-turn lookahead).
   Why not MUST: negatives feed only the characters measure. A and ungated B deliver about 3 records on almost every turn either way, so the verdict is unlikely to flip. A gated C is the only arm a hidden correction penalises.
   Plan change: draw negatives from owner turns inside labelled coverage, either the 8 sessions or the turns labelled `none` in the 2026-10-31 file, and accept fewer than 200 (A9 already allows that). Otherwise, rewrite A1 to state the coverage and the estimated rate.

5. **SHOULD — the labels file is the one unpinned input.**
   Evidence: plan.md:16 pins `--expect`, snapshot files and `candidatesHash`, but not labels. Two `labels.jsonl` files exist in the private store. The 2026-10-31 one holds all 12 positive pointers as kind-only rows, and `readOutcomeRows` fills `repeatOf: []` for those (outcome-score.mjs:25). That gives n = 0 and `incomplete`, which is safe. A later relabel with a different `repeatOf` would silently move targets and negatives.
   Plan change: print a `labels <sha256>` line, and seal the expected hash for the real run in the seat's step 4. Also refuse when any positive's label lacks `relation: same` or a `repeatOf` entry.

6. **SHOULD — pin that the "preceding agent turn" is the one before the replay point, never the corrected turn.**
   Evidence: memory-replay.mjs:116-117 (the point walks back from `seatIndex - 1`; the corrected agent turn sits between the point and the correction). plan.md:21 says "preceding agent turn", and must-meet 4 (plan.md:132) pins only the 1,000-character length. If the builder takes the turn after the point, B and C see the mistake itself. That leaks the future and turns the screen into the before-tool-call trigger that bar 1 is meant to point to.
   Plan change: add a must-meet 4 pin. A target that matches only the corrected agent turn's text is missed by B and C.

7. **SHOULD — bar 3's characters condition is a coin flip for ungated B.**
   Evidence: plan.md:21 (B has no gate), plan.md:20 (A has no score floor). query.ts:59-65 OR-matches every meaningful token, so A delivers 3 records on almost every non-skipped turn, and so does B. "Mean characters ≤ A's" then compares the claim lengths of different records (median claim 146 characters, max 839). B can fail bar 3 by one character.
   Plan change: no bar change, since the bars are the owner's. Print each bar-3 condition as pass or fail per arm, plus the share of negatives each arm delivered anything on, so `no arm advances` shows why.

8. **SHOULD — arm A re-seals the knowledge hook's tunables instead of importing them.**
   Evidence: plan.md:157 seals top 3, prompt cap 8,192 and budget 2,000 anew. hook.ts:29-30 exports `BLOCK_MAX_CHARS = 2000` and `TOP_K = 3`, and tokenize.ts:16 exports `PROMPT_MAX_CHARS`. Must-meet 3 (plan.md:130) asserts the literal "under 12 characters", which tokenize.ts:58 owns inline. nana-standards says a tunable is "defined once" and a test "imports the name — never the literal". "Arm A is today's engine" stops being true the day the hook retunes.
   Plan change: import `TOP_K`, `BLOCK_MAX_CHARS` and `PROMPT_MAX_CHARS` for every arm's shared budget. Drop the 12-character literal from must-meet 3 and drive it with a fixture that `skipReason` rejects, asserting delivery equals what `skipReason` decides. Also say whether the 2,000 includes a header, as the hook's does (hook.ts:110-124).

9. **SHOULD — the text each retriever and decider sees is unspecified.**
   Evidence: plan.md:20 (A's body is claim plus context, and record `context` runs to 1,200 characters by count); plan.md:21 and 58 (B embeds "records" with no field named); plan.md:22 (C's relevance question names no record field and no input cap). If laya-mlx truncates long inputs (*inferred*, its context limit is not in the plan), a long prompt can push the record out silently.
   Plan change: seal one record text for all three arms (claim plus context, as A indexes it). Seal C's input order (record, then message) and a character cap. Count truncations into the item 2 `failed` count.

10. **SHOULD — the recomputed replay point is not checked against the frozen plan.**
    Evidence: plan.md:16 ("recomputed from the snapshot with the same function the plan used") and plan.md:94 (`replayPoint` is extracted by this lane). The frozen plan was built by the pre-extraction code. Each case's `context.history` already ends with the point's owner turn (memory-replay-context.mjs:64-77).
    Plan change: refuse when the recomputed point's rendered owner turn is not the final USER entry of the case's stored `context.history`. This catches a behaviour change in the extraction against the real frozen plan, not only against fixtures.

11. **SHOULD — daemon logs can carry record and prompt text into the seat's transcript.**
    Evidence: plan.md:171-172 starts `llama-server` and `laya-mlx-serve` with default logging; plan.md:5 and 175 promise counts only. If the seat starts them as background tasks, their stdout lands in the session transcript. Transcripts are the memory maker's input, so a future snapshot would hold record text as new evidence (*inferred*, logging verbosity not checked).
    Plan change: in the seat's run, redirect both daemons' stdout and stderr to `/dev/null`, or to a file in a private OS-temp folder deleted afterwards, and never read them into the session.

12. **SHOULD — state the expected scored count and the clustering, and print sessions.**
    Evidence: plan.md:49 (A11 cites "5 sessions over all 43 cases"). The 12 positives sit in 3 sessions, with 8 in one, sharing one pool. Scored n is 11 by field count today.
    Plan change: record "expected `scored 11`, `excluded 1` (counted by field 2026-11-01)" in A2. Print `sessions <k>` and wins and losses per session for each model arm, so a bar-3 pass driven by one session is visible. Add no new bar.

## NOTE

13. **NOTE — the store-gap exclusion does not hide a failure today.** It removes 1 of 12 cases, and that case has no candidate at its pointer or owner unit in the hashed candidates. n = 11 keeps the bars meaningful (2 and 9), and rounding moves both in the conservative direction. That excluded case is itself a store-recall miss; the owner reads `excluded 1` as "the maker never made it", not as a trigger miss. No minimum-n floor is needed for this run. A re-plan could need one, because at n ≤ 2 bar 3 cannot pass while bars 1 and 2 still fire.

14. **NOTE — claim dedupe can hide a target under other evidence.** `mergeMemory` drops a later same-claim or same-unit candidate (memory-store.mjs:57-58), and must-meet 1 (plan.md:128) refuses a same-claim hit. That would turn a present record into an "excluded" case. The count today is 0 (the excluded case has no same-unit candidate). Keep the rule, and list it as a residual.

15. **NOTE — literals the forecast should guard.** `checkedPlan` compares `hash(plan.seals)` with `hash({...memory-replay-config})` (memory-replay.mjs:28,185). Any new export in `memory-replay-config.mjs` makes the frozen plan `60a76…` refuse in both replay and screen. Also, `bundleMaker` hashes `defaultBundle.toString()` (memory-replay.mjs:137), and `decideReplay` marks a run confirmatory per new maker (memory-replay.mjs:310). State in the brief that `memory-replay-config.mjs` and `defaultBundle`'s source stay byte-identical through the helper move.

16. **NOTE — this is the first `nana-pack/lib` import of `nana-knowledge` `.ts` code; nana-knowledge already imports nana-pack's `display.mjs` (query.ts:20).** It is legal within the packages layer (docs/code-map.md:24), but it makes a package cycle. `npm run memory:trigger` relies on default type stripping in Node ≥ 22.18; local is 22.22.2 and CI pins `22`. Use the same `node scripts/...` form as `memory:replay` (package.json:20), and add no flag that one script needs and the other lacks.

17. **NOTE — C's gate and relevance are scored only together.** Bar 3 cannot say whether a C loss came from the gate or from ranking. The report asks whether a "whether" gate earns its place (report.md:37,89). A counts-only diagnostic line, C's relevance-only hits with the gate ignored, would answer that at no extra model cost beyond the calls already made. It is optional and not a bar.

18. **NOTE — order of bars.** A at 9 or more of 11 yields `bm25 enough` even when C would pass bar 3. That matches the report's order, and plan.md:32 prints bar-3 lines anyway. Fine as written.

19. **NOTE — A's index build must be outside the timed span**, as B's record embeddings are (plan.md:44). C's timed span must include B's BM25 and query embedding, since C ranks B's union. Say both in plan.md:23.

20. **NOTE — ceremony.** The owner asked to run a screen once. The lane adds an npm script, two README contracts, a subgroup with eight rows and a fixture move. The fixture move is required by the 10-22 ruling. The rest passes only if the screen is expected to run again, for example after a fine-tune. If not, a seat-run script under `apps/bench/` (the `anatomy.mjs` precedent, plan.md:107) with fewer must-meets would serve the same verdict. Owner's call; do not reopen without a reason.

21. **NOTE — committing the research report.** `identity-scan` exits 0 on `report.md`. It names "this M1 Max" and local memo names, but no owner name or work reference.

Counts: MUST 3 · SHOULD 9 · NOTE 9.
