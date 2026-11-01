# memory-replay — plan attack

Adversary for lane `memory-replay`, 2026-11-01. Read: `plan.md`; `docs/reviews/outcome-meter-2026-11-01/plan.md` ("Field counts and replay", labels), its `plan-attack.md` (N7) and `build-report.md`; `docs/memory-factory-design-2026-10-31.md`; `docs/known-bugs/FEAT-043.md`; `packages/nana-pack/lib/outcome-score.mjs` (`readRows`, `scoreOutcomes`); `packages/nana-pack/lib/memory-store.mjs` (`readMemoryStore`); `packages/nana-pack/lib/profile-store.mjs` (`effectiveState`); `packages/nana-pack/lib/memory-shaping.mjs` (batching); `scripts/memory-shape-runners.mjs`; `apps/bench/lib/catch-judge.mjs` (spawn arguments). No private file, label, candidate, store record or transcript text was opened.

Power figures below come from a small simulation in scratch space (inferred, not from data): heterogeneous per-case control repeat rate, exact one-sided sign test at 0.05, minimum 8 informative cases, 30% of cases lost to `judge-miss`, `unjudged`, `leaked` or `unrun`.

| Cases planned | Effect | K = 3: decides / undecided | K = 5: decides / undecided |
|---|---|---|---|
| 8 | halving, control 0.5 | 0.00 / 1.00 | 0.00 / 0.99 |
| 12 | halving, control 0.5 | 0.08 / 0.87 | 0.18 / 0.75 |
| 25 | halving, control 0.5 | 0.71 / 0.05 | 0.85 / 0.01 |
| 46 | 30% fewer, control 0.35 | 0.41 / 0.00 | 0.57 / 0.00 |
| 80 | 30% fewer, control 0.35 | 0.64 / 0.00 | 0.81 / 0.00 |

Headline: at the plan's 5 to 12 cases the run prints `undecided: too few cases` about nine times in ten even if the bundle halves repeats. The lane would ship a correct instrument that cannot answer its one question. The pool, not K or dollars, is the binding constraint. Second, the default bundle maker reads the merged current store, which carries the future into the treatment arm through paths the leak check does not see.

---

## MUST

### M1. The case pool cannot decide anything; widen it inside this lane

Failing case: 10 eligible repeats, 3 lost to `judge-miss`/`unjudged`, 7 left. Fewer than 8 informative cases print `undecided: too few cases` whatever the bundle does. The table above says this outcome is near certain at today's volume. Worse, the labels may not exist yet: the meter build report leaves "labels" with the seat, so `plan` may print `cases 0`. The meter plan's own sketch counted every correction ("about 46 in the labelled window"), and this plan narrowed that to label-confirmed repeats without saying what the narrowing costs.

Fix: widen the case rule now, keep strata separate and pre-registered, and say which arm-to-arm leaks each option risks:

1. **All valid labelled corrections, in two strata (recommended; leak-free).** Stratum R: corrections with a `same` earlier instance whose own instant precedes the repeat session's start (today's rule, tightened by M3). Stratum F: every other `valid: true` correction, including those with no earlier instance. The question per case stays "does the agent do what the owner objected to". In F a bundle can help only by generalising from other lessons, which is exactly what a delivery claims. The time cut and as-of-cut bundle (M2) keep F leak-free. The labels already cover every correction in the meter's closed windows, so F costs no new labelling. Decisions stay R-only: asking a first-time decision is correct, not a mistake. Primary statistic over R ∪ F, per-stratum lines beside it. Inferred pool: about 46 corrections today, against 5 to 12.
2. **Wider labels for R (leak-free).** Relabel `repeatOf` for every valid correction against the whole snapshot, not the meter's 60-interaction lookback, and label outside the meter's windows. This costs seat time, not model spend. The plan's "Left for later lanes" already names the lookback limit; it belongs in the seat's first run.
3. **Oracle arm on stratum R (leak-free; a sensitivity check, never the verdict).** A third arm whose slot holds only the earlier instance's own record, as of the cut. It is pre-cut, so it leaks nothing. If even this arm does not beat control, the replay is insensitive (or the mechanism fails), and a null on the real bundle means nothing. It costs one more arm per R case.
4. **Staged probe moments (leak-free between arms; secondary only).** For each valid correction, a Claude agent that reads only the correction's claim writes one probe owner turn. The probe goes into a later session's context, one that starts after the correction's instant. Probes are frozen and hashed into the case set before any run. Both arms get the same probe, so nothing leaks between arms. Two risks: the probe may cue the lesson, which caps both arms, and it is not a real moment. Report probes as a separate stratum, never pooled into the primary line.
5. **Reviewer-finding repeats (not now).** These come from pi builder and reviewer transcripts, a different runtime. Their mistakes appear after many tool results, which this replay cannot reproduce (M6). The first delivery is the seat's bundle. Keep this in "later".

Must-meet 1 gains: a valid correction with no earlier instance is a case in stratum F; `decide` prints one line per stratum and the pooled line. Seal the minimum informative cases per stratum.

### M2. The default bundle reads the future through the merged store

Failing case: the default maker calls `readMemoryStore`, which returns `effectiveState` over all record files and events. In `profile-store.mjs`, states group record files by claim id. Each state returns `first` (earliest evidence and `validFrom`), but its `trust`, `repeats`, `stamp` (the last file's) and `live` come from every file and event, later ones included. The repeat correction, shaped to the same claim text, adds a file to the earlier group. Then:
- the filter sees the earlier `validFrom` and the earlier `evidence`, so it keeps the record, and "does not point into that session" passes;
- `trust` and `repeats` are raised by the repeat itself, and so are a supersede edge or a retraction made later;
- "newest first" ordering by `stamp` sorts this record to the top, so it survives the budget cut because of the future.

Also: write stamps are run times (a 10-31 backfill post-dates every case), so filtering by stamp drops everything, and filtering by `validFrom` day cannot separate same-day sessions. "Does not point into that session" also passes a record citing a *later* session (S3) while carrying an earlier `validFrom`.

Fix: build the bundle as of the cut from candidates, not from the merged store. Take A-091 candidates whose evidence pointer resolves (through the snapshot) to an instant before the repeat session's first entry. Run the store's merge over those candidates only, with no events. Drop any candidate citing a session at or after the cut, not only the repeat's own session. Keep the normalised-claim leak check as a backstop. A delivery lane's maker gets the same as-of-cut candidate list as input. Must-meet 3 gains: a same-claim file from the repeat session does not raise trust or reorder, a record citing a later session is dropped, and a same-day record from a later-starting session is dropped.

### M3. The case rule admits earlier instances that memory could not have carried, and `changed` relations

Failing case A: session S1 starts at 09:00 and runs all day. Session S2 starts at 10:00. The owner gives correction E in S1 at 15:00 and the repeat C in S2 at 16:00. The rule "earlier instance from a session that started before the repeat's session did" accepts the pair. But E did not exist when S2's context was loaded, so no memory could have carried it. Control and treatment are both blind to E (if M2 is fixed), and the case dilutes toward the null as a mislabelled R case.

Failing case B: the label reader accepts `relation: "changed"` (the owner changed his mind). The plan's rule checks only `valid` and a non-empty `repeatOf`, while `scoreOutcomes` also requires `relation === "same"`. On a `changed` case, a bundle carrying the old decision makes the agent repeat the *old* answer, and the judge, reading the new correction, marks it `repeats`. The test then penalises memory for being right about the past.

Fix: stratum R requires `relation: "same"` and an earlier instance whose own instant precedes the repeat session's first entry. `changed` labels count as a skip reason (`changed`) or, better, a later harm stratum. Must-meet 1 gains both fixtures.

### M4. `unclear` has no rule in the statistic

Failing case: d is "control repeats − treatment repeats", so an `unclear` reply counts as not-repeat. A bundle that makes replies longer, vaguer or more hedged moves treatment replies from `repeats` to `unclear` and wins the sign test without avoiding anything. The same holds for a reply that avoids the mistake by not doing the task.

Fix: seal one rule and pin it in must-meet 5. Recommended: drop `unclear` draws and require at least a sealed number of judged draws per arm per case, or the case is `unjudged`. `decide` prints `unclear <control>/<treatment>`. Also add a fourth verdict, `stalls` (does not attempt the requested work), counted as not-avoids for treatment. Print it, so a bundle that wins by doing nothing shows.

### M5. The original turn in the same judge call anchors the judge toward the bundle

Failing case: the judge sees the original corrected turn among the replies, and that turn is labelled `repeats` by construction. Replies that resemble the original get `repeats` because of resemblance, not because of the mistake. Treatment replies differ more from the original (the bundle changes wording and content), so they drift to `avoids`. This bias always runs in the bundle's favour. Separately, the original is rendered from real tool calls and results, so its form differs from `TOOL <name>: …` replies, and the judge can identify it.

Fix: judge each reply in its own call (about $0.03 each, so about $0.15 more per case at K = 3, inferred). The original goes through the same call shape, rendered in the replay format and cut to the same reply cap, and it alone decides `judge-miss`. This also removes within-case contrast between arms. Must-meet 4 changes from "five replies in one call" to "one reply per call; no call holds two replies; the original is rendered in reply format under the reply cap".

### M6. Repeated runs on one tiny case set fork until something passes

Failing case: the plan expects reruns, for the Q1 switch, the Q2 switch, the first delivery's own maker, or a canary-driven cap change. The seat sees per-case results privately and tunes the delivery against the same 10 to 46 cases. The case-set hash does not cover the seed or the bundle maker, so the same configuration can also be rerun with a fresh seed. Five looks at 0.05 give roughly a one-in-four false win (inferred).

Fix: `decide` reads every run row on the case set and prints `runs on this case set <n>`. Only the first run per (case set, bundle-maker hash) is confirmatory; a later one prints `exploratory`. The seed goes into the run's hash and is fixed in `sealed.txt` before the first paid run. A delivery that was tuned after seeing per-case results needs a fresh case set: the cases accrued after the tuning date. Pin this in must-meet 5.

---

## SHOULD

### S1. Pre-screen reproduction with fresh draws, never reused

Failing case: A9 prints `weak replay` but still prints a verdict. If the seat responds by dropping cases where control never repeated and reuses those control draws, regression to the mean hands the bundle a win: a case kept because its control draws were high will score lower on any new draws.
Fix: an optional control-only screen at K draws per case (about half a case's cost). Keep cases with at least one repeat. Then run fresh control and treatment draws on the kept cases. Screen draws never enter `decide`. Seal the screen rule into the case set hash.

### S2. Control is handicapped relative to live work, so the bias favours the bundle

Failing case: the recorded AutoMem slot is the memory index. In live work the seat reads memory files on demand with the Read tool. With no tools and no results, control sees only index lines. Treatment sees inline bundle text. The replay therefore overstates the bundle's edge against today's memory.
Fix: count control replies that emit a `TOOL Read` line naming a memory path, printed as `control would read memory <n>`. The README and the verdict line state the bias direction. Current memory files cannot be inlined, because they hold later edits (a leak).

### S3. Harm direction and one-sidedness

Failing case: `decide` tests one side at 0.05 for `bundle fewer repeats` and prints `bundle more repeats` on the swap. Both directions at 0.05 is a two-sided 0.10 test, and the plan does not say which level the harm line uses.
Fix: seal both levels, for example one-sided 0.05 for benefit and one-sided 0.05 for harm, and state it in the README. Or use two-sided 0.05. Print the level beside each line.

### S4. Use the draws: a paired permutation test on per-case d

The sign test throws away |d|. At K = 3 or 5, a case where control repeats 3/3 and treatment 0/3 counts the same as 1/3 against 0/3. An exact paired permutation (sign-flip) test on the per-case d sums keeps the paired design and uses more of each case (inferred to add power at K ≥ 3). Keep McNemar as the K = 1 special case. Also make K = 5 the default: the per-case cost rises about 40% with cache hits (inferred), and the table shows the gain.

### S5. Run order and caps across strata

Failing case: cases run in sorted-pointer order (roughly chronological). A cap then always cuts the newest cases, and with M1 it cuts whole strata.
Fix: a seeded, pre-registered random case order, interleaved by stratum. `decide` on an incomplete run prints the verdict with `incomplete` on the same line, and the stratum counts that did run.

### S6. Blind check needs a bar

Failing case: the seat labels ten replies blind and records an agreement count, but nothing happens when agreement is 5 of 10.
Fix: seal a bar (for example 8 of 10). Below it, the run's verdict is withheld (`judge disagreement`). Draw the ten from informative cases only. Ties carry no verdict weight, so checking them wastes the check.

### S7. `cites bundle` needs a baseline

Failing case: an owner phrase in the bundle (a quote) also appears in the session history, so control replies share the 8-word run as often as treatment replies do.
Fix: count both arms against the treatment bundle and print `cites bundle <control>/<treatment>`.

### S8. Must-meets pin mechanics, not the answer the owner reads

The owner reads one block: verdict, how many planned cases survived, and whether the instrument could have detected an effect. Today no must-meet pins attrition or sensitivity.
Fix: fold into must-meet 5 one line per drop reason (`judge-miss`, `unjudged`, `leaked`, `unrun`, `unclear`, `stalls`) beside `cases planned <n>`. Add the oracle line (M1.3) and `runs on this case set` (M6). Must-meet 4 covers M5, must-meet 3 covers M2, and must-meet 1 covers M1 and M3. The count stays at seven.

---

## NOTE

- N1. JSON-wrapped reply. `createRunner` goes through catch-judge's `--json-schema` structured output. The whole turn then arrives as one string field, a larger departure than "a small residual" (inferred: how Claude Code produces structured output is not documented here). The A9 floor measures the loss. If the canary shows a low control reproduction rate, consider a runner option for plain-text replay output in a later lane.
- N2. One-message transcript frame. The rebuilt history goes in as one stdin message, and the model "continues a recorded session". Reading a transcript about itself is not the same as being in the conversation. Report mistakes, which come after real tool results, are the least likely to reproduce. Expect a lower floor for those, and consider printing reproduction per kind (O4).
- N3. Effort. Seat sessions may run at a higher effort than `medium`. Take the seat's recorded effort from the roster, or say why not.
- N4. Knowledge pull. If the pull indexes memory markdown (inferred), control's memory also reaches both arms through recorded pull output. This dilutes the contrast; it does not leak between arms. Count pull entries naming memory paths.
- N5. Shaper batching. `memory-shaping.mjs` shapes batches of units per call. A claim for an earlier unit can be worded with sight of a later unit in the same batch. This is a residual for the normalised-claim leak check.
- N6. The 30-day transcript deletion makes the pool perishable. Freeze the snapshot before the seat's first run (the plan's `--root <private snapshot>` implies this; say it).
- N7. Caching. A6 says the shared prefix "can be cached across draws", but the slot sits before the conversation, so only standing text is shared across arms. The cost section already prices it per arm; fix the A6 sentence.
- N8. Pushback (design principle 7). A bundle that makes the seat agree more would read as fewer corrections. `stalls` (M4) catches part of it. A pushback probe belongs to checking, not here.
- N9. Cost is not the constraint. At 46 cases, K = 5, per-reply judging and an oracle arm on R, the run is about $60 to $75 (inferred from the plan's per-call figures). That is near the cap. Raise the cap to $90 or run the oracle arm separately.

---

## Best pool-widening proposal

Stratum F (M1.1): every valid labelled correction is a case, not only confirmed repeats. Label the confirmed cross-session ones R, and run the oracle arm on R as the sensitivity check. F is leak-free under the as-of-cut bundle (M2), because nothing after the repeat session's start enters the treatment slot. F needs no new labels. It takes the pool from about 5 to 12 to about 46 today and grows with every correction, not only with every repeat.
