# outcome-meter — plan attack

Adversary for lane `outcome-meter`, 2026-10-31. Read: `plan.md`, `docs/memory-factory-design-2026-10-31.md`, `scripts/memory-shape-runners.mjs`, `packages/nana-pack/lib/memory-shaping.mjs` and its config, `memory-making.mjs` and its config, `context-load-log.mjs`, the four `appendContextLoad` callers, `apps/bench/lib/catch-judge.mjs` (`MATCH_GUIDE`), `claude-transcript.mjs` (`edtDay`), the shaper's `scored-runs.md`, context-anatomy's `load-sample.jsonl`, and the shape of `docs/known-bugs/*.md`. No private file was opened.

Facts used below (counts only):
- Shaper scored runs: correction recall 28/46 and 26/46; overall precision 217/318 and 227/329 (about 0.68). The labelled window holds 46 corrections and 162 decisions over about four weeks (oldest transcript 2026-10-04).
- Claude Code deletes transcripts after 30 days by default (memory-shaper plan-attack M1).
- `docs/known-bugs/` has 32 files. The top lanes hold 22, 22, 21, 20 and 19 lines each. Lines read `- <Area> (<lane>, <source>): <text>`.
- `docs/reviews/` has 262 lane folders. `reviewUnits` walks them in name order and dates each by the folder's own date.
- Load-log writers: `nana-shared-memory` (role seat, one part), `pi-worker` (worker: preamble + brief), `pi-review` and `claude-review` (both role reviewer, different parts and runtimes).

Headline: as planned, the meter will print weekly counts that move with history length, owner volume, parallel sessions and reviewer behaviour more than with memory, on event counts too small for any delivery to clear. The fixes below are mostly in what is counted and how it is divided, not in more machinery.

---

## MUST

### M1. Repeat counts grow with the length of history, not with memory failure

Failing case: the "earlier item" pool is everything before the item. It grows every week, and the chance that a new correction or finding matches *something* earlier grows with it. Three artefacts follow:
- Left-censoring. Transcripts reach back only 30 days. A correction in the first week of the snapshot that repeats one from six weeks ago counts `new`. The first week reads near zero repeats by construction. Findings reach back to September, so the findings and corrections tables have different censoring.
- Drift. A later measurement made from a longer kept snapshot (or a second snapshot appended) has a larger pool, so its repeat rate rises with no change in behaviour. A delivery that halves real repeats can read as "no change" or "worse".
- Survivorship. Known-bug lines deleted after a fix vanish from the pool. A later run at a later tip sees fewer earlier findings, so the same week's recurrence falls with no change in behaviour (A4 already admits removed lines are not seen).

Fix: a sealed lookback window L (chosen, e.g. 28 days). An item is a repeat only of an in-scope item within L days before it. A week counts only when its whole lookback lies inside the input's coverage; earlier weeks print `warm-up` and are excluded from the baseline. Pin with a must-meet: the same pair 27 days apart is a repeat, 29 days apart is not, and a week whose lookback starts before the first candidate day prints `warm-up`. For findings, the baseline compares weeks judged in one run at one tip, never weeks across tips.

### M2. The counts are too small to decide any delivery, and the noise floor is measured wrongly

Failing case (inferred from the labelled window): about 11 corrections a week. If 10–20% repeat, that is 1–2 real repeats a week. With shaper correction recall about 0.6, a repeat needs both ends found: about 0.36, so the meter sees about 0.5–1 a week. Under a Poisson model, detecting a halving of a true rate of 2 a week at 80% power needs about 11 weeks on each side (inferred, square-root test). A weekly table will be read week by week, and one quiet week will look like a win.

The noise floor is also wrong in two ways:
- Both meter runs use one frozen candidates file, so the floor holds judge noise only. Every later measurement runs the shaper again on new transcripts, so shaper noise (26 vs 28 corrections found) sits inside every later count and outside the floor.
- A count difference can be 0 while the two runs' repeat sets barely overlap. Pair-level agreement is roughly the square of item-level agreement.

Fix:
- The baseline record is a pooled rate over all non-warm-up weeks, with a 95% interval, not a weekly row. The scorer or the seat's record also prints the minimum detectable change at that interval.
- Noise floor: two shaper runs on the snapshot, each metered twice (four runs). Record the count spread *and* the item-level agreement of repeat sets (shared repeats / union).
- The plan's outcome rule names the decision: a delivery is judged only after enough post-delivery weeks for the pooled interval to separate, and the README says weekly rows are not a verdict.

### M3. "Findings that recur" counts reviewers re-reporting a live bug, so memory delivery can lower it without preventing anything

Failing case: the design pushes "the feature's known bugs" to reviewers. Today a reviewer in lane B re-finds a known bug still present from lane A and writes it as a MUST or a new known-bug line. The meter counts a recurrence. After delivery the reviewer sees it is already known and does not report it. The count drops, yet no mistake was avoided. This is a Goodhart path built into the station order.

A second failing case: exact cross-lane copies. A carry line copied verbatim into a later lane's notes, or a HANDOFF line moved "word for word" (the FEAT-002 file header says so), is decided `exact` with no model call and counted as a recurrence. Catch-judge's own guide names CARRY lines as restatements, not new defects.

Also, the plan's findings equivalence ("the same kind of mistake, so a lesson from the earlier finding would have prevented the later one") is a class relation. Catch-judge's `same_as` is a single-defect relation. The plan claims to follow `same_as` but states something broader. Class matching over about 1,630 findings with K = 8 will find a sibling for most common classes (Windows paths, README commands, test restates implementation), so the count will be high and dominated by a few classes.

Fix: the judge returns, per finding, the candidate id *and* one relation word: `same-defect` (catch-judge `same_as`: fixing one fixes the other) or `same-class` (a new instance a lesson would have prevented). Only `same-class` counts as "findings that recur". `same-defect` prints separately as `re-reported`. Exact equality across lanes for findings is recorded as `copy` and not counted. Pin it in must-meet 1 and 3.

### M4. Word-overlap blocking drops paraphrased corrections, and the blocking-recall check cannot see it

Failing case: two corrections of the same behaviour, "stop asking me to confirm, just land it" and "you don't need my go-ahead to merge once reviewers say LAND". Normalised words of length ≥ 4: {stop, asking, confirm, just, land} and {need, ahead, merge, once, reviewers, land}. Jaccard is 1/10 = 0.10, under 0.15. The item is decided `new` with no call. Min length 4 also drops `ci`, `pr`, `rm`, `gh`, `map`, `pi`, which carry much of this repo's meaning.

The scorer cannot catch it. For findings the labeller "may search", and any keyword search finds exactly the high-overlap repeats blocking also finds. Blocking recall then reads near 1.0 by construction. For corrections the labeller sees shaper claims, which the same model wrote in its own phrasing, which raises overlap above what the owner's words have.

Fix: no word blocking for corrections and decisions. They are small (about 200 items in the window, about 50 a week). Judge each item against *all* in-scope earlier items of its kind inside the lookback L. One call per week per kind holds the week's items and the lookback list (about 50 claims × 600 characters, well under one call's input). This costs a few more calls, not more. Keep Jaccard blocking for findings only, and measure its recall on labels made without word search (see M5).

### M5. The labelled set cannot measure 0.70 recall, and the labeller shares the judge's blind spots

Failing case: 30 items per kind, sampled among items that have any earlier item. At 10–20% repeat prevalence that is 3–6 labelled repeats. With 4 of 5 found, recall reads 0.80, but the 95% Wilson interval is 0.38–0.96. The bar cannot tell a 0.5 meter from a 0.9 meter. Precision is worse: it is computed on the meter's positives inside the 30, perhaps 2–4 items.

Same family: the shaper (Sonnet) wrote the claims, the judge (Sonnet) compares them, and the labeller is "the seat or a different model" (in practice Opus, or another Claude). A shaper claim that turns two different corrections into the same generic sentence fools all three alike.

Candidate validity: shaper precision is about 0.68. About a third of "corrections" and "decisions" are not corrections or decisions. Two false candidates judged a repeat count as "corrections given again", and the planned labels cannot see it, because they label only `repeatOf`.

Fix:
- Corrections and decisions: label *every* item in the non-warm-up weeks (about 200 in total), not a sample. Label from the source quote and context (resolved through `resolveEvidence`), not from the claim. Each label also carries `valid: true|false` for the kind; the scorer prints `kind precision` and counts repeats only among valid items.
- Findings (not owner text, so another lineage is allowed): stratified sample, 30 meter-positive items for precision plus 30 random items with every same-feature earlier finding listed, so recall labels do not rest on word search. The labeller for findings is the pi lineage (`openai-codex/...`), not Claude.
- Scorer prints Wilson lower bounds beside each ratio and `unscored: too few repeats` when a kind has fewer than a sealed minimum of labelled repeats (chosen, e.g. 15). The bar applies to the lower bound or to that minimum count.
- Cheapest ground truth: the owner looks at the 10 repeat pairs the meter is most confident in for corrections (a ten-minute check). He is the only labeller who knows which corrections he gave twice. Ask it as an optional question.

### M6. "Decisions asked again" counts reversals and volunteered statements, not decisions re-asked

Failing case: the design's outcome is decisions *asked* twice: the agent asks something already settled. The plan counts any decision candidate that "settles a question an earlier decision already settled". Two common cases count wrongly:
- Reversal. The owner settles X, and later deliberately re-decides it differently (memory shows standing reversals, such as a hook stubbed off again). That is a new decision, not memory failure, and the judge wording "the same question settled again" counts it.
- Volunteered restatement. The owner restates a standing decision unprompted. Nobody asked.

Fix: the judge returns `same` or `changed` per decision pair; only `same` counts as asked again, and `changed` prints as `re-decided`. Count only decisions whose candidate carries a seat question (an ask pair `#uuid+uuid`, or a rule-form or shaper candidate paired with a question entry); others print as `unprompted`. Pin both in must-meet 1.

### M7. The helper move lets a shaper config change send owner text to another provider under the meter's name

Failing case: `createRunner({ runner = RUNNER, ... })` takes its default from `memory-shaping-config.mjs`. The meter adds `model`, `effort` and `budgetUsd` options, but `piRunner` ignores them and uses `PI_MODEL`. If the shaper's `RUNNER` is ever retuned to `pi` (that config already holds the alternate lineage), the meter silently sends owner claims to `openai-codex/gpt-6-luna`. That breaks the owner's choice of Claude models for owner text, and no meter test fails.

Fix: the meter config seals `JUDGE_RUNNER = "claude"` and passes it explicitly. `createRunner` throws when `model`, `effort` or `budgetUsd` is given with runner `pi`. Must-meet 7 adds: `createRunner({ runner: "pi", model })` throws, and the meter's runner is `claude` regardless of the shaping config.

---

## SHOULD

### S1. Parallel sessions on the same day count as "given again"

Candidates carry only a day. A correction given in two seats running at once (power-mode days run several) counts as a repeat, though no start-of-session delivery could have carried it: the second session began before the first correction. Fix: report cross-session repeats on the same day as `same day` and leave them out of the counts. Better, the meter resolves the pointer's entry timestamp through the transcript snapshot and counts only when the earlier instant precedes the later session's first entry.

### S2. The known-bug judge text carries the lane tag, which contradicts must-meet 4 and inflates overlap

A6 sends "the line after `- `", which is `<Area> (<lane>, <source>): <text>`. Must-meet 4 says no prompt holds a lane name, so the builder must either fail that test or depart from A6. The area prefix ("Handoff tests") also pushes overlap and judge matches toward "same area" rather than "same mistake". Fix: strip the `(<lane>, …)` tag before both blocking and the judge; keep the area as a separate field, or drop it from blocking words.

### S3. A context baseline from two load-log lines is not a baseline, and the worker median measures brief length

The log started on 2026-10-31; the planner saw two lines. The worker load is preamble plus brief, and brief length varies per lane by multiples, so worker median and max track how long the seat's briefs were. A delivered memory bundle would hide in that spread. `pi-review` and `claude-review` both write `reviewer` with different parts. Fix:
- A sealed minimum loads per role and week (chosen, e.g. 10); under it print `<week> context <role> too few loads <n>`.
- Report per part name (preamble, brief, memory index, and later the memory bundle) as well as the total, and split reviewer by launcher.
- Skip lines whose `cwd` is under the OS temp folder (install-check and test homes write them; see `load-sample.jsonl`), counted as `test loads`.
- State in the README and the baseline record that planners and adversaries (Agent-tool subagents) are not logged, and that standing text such as rules and AGENTS files is outside the log. The design's "no agent's context larger" cannot be decided from logged parts alone.

### S4. The spend cap is near the estimate, and truncation would bias weeks unevenly

With most findings getting 8 candidates at up to 600 characters, a 10-item batch is about 54,000 characters (about 14,000 tokens). 163 calls come to about 2.3–2.5 million tokens against a 3,000,000 cap, or about USD 7–9 at Sonnet input prices (inferred). That is more than "a few dollars", and each noise-floor run pays it again. `reviewUnits` yields lanes in *name* order. If batches go in input order, a capped run leaves alphabetically late lanes unjudged across all weeks. Fix: process items in date order. Print per-week `unjudged <u>` in each count line, not only the run-wide `incomplete` line. Set the token cap from the canary's measured tokens per item (record it in `sealed.txt`).

### S5. Finding dates are lane-start dates, so the order of two findings can flip

A lane folder `X-2026-10-20` reviewed on 10-25 is "earlier" than a lane `Y-2026-10-22` reviewed on 10-23. The meter then calls Y's finding new and X's a repeat, in the wrong week. Fix: date a MUST by the review file's first-add commit date (`git log --diff-filter=A --format=%cs -- <file>`, deterministic at a tip), and a known-bug line by the commit that added the line (`git log -S` or blame on the tip). Otherwise record the limitation as a residual.

### S6. One noisy lane dominates a week's findings

Five lanes hold 19–22 known-bug lines each. One lane with 20 lines that each match some earlier class adds 20 recurrences in one week. Fix: print `lanes <n> with recurring <m>` per week (lanes with at least one recurrence) beside the item count, and use that per-lane share as the findings baseline.

### S7. The meter cannot see the failures the design names first

The design's first finding is that memory reached only one machine's seat. The meter reads one machine's transcripts and load log, and no pi sessions. A correction given on machine A and again on machine B is the main thing delivery should fix, and it is invisible both before and after. Fix: say so in the README and the baseline record as a residual. Slice 4 should take the second machine's transcripts, not only its load log.

---

## NOTE

### N1. Tests

- Must-meet 3 restates the blocking algorithm ("exactly K, highest overlap first"). It is fine as a spend pin, but ties at the K cut are unspecified. State the tie-break (input order) so the candidate set is deterministic.
- No must-meet covers the outcome definition beyond fake-judge plumbing. Add the lookback (M1), the relation words (M3, M6) and the per-week unjudged count (S4) to existing must-meets rather than adding new ones.
- Must-meet 7's "no claim, title, … in stdout" should also cover the scorer, which reads labels holding pointers.

### N2. Shaper tunables leak into the meter

`TIMEOUT_MS` and `MAX_BUFFER` stay the shaper's. A shaper retune changes the meter's behaviour without changing meter code, which breaks the "retuning changes no code" rule from the meter's side. Either pass them as options too, or record the coupling in the meter config's provenance.

### N3. Mixed claim forms in shaper output

The shaper writes ask decisions in the rule form (`<quote> — answering: <context>`) and owner-turn items as model claims. The exact step never matches across forms, and overlap across forms is low. If M4's no-blocking fix is taken this matters less. Otherwise, judge text for decisions should be one form.

### N4. Undated known-bug lines skew older weeks

244 of 1,729 lines are undated and left out. These are probably the oldest lines (moved from HANDOFF), so older weeks lose a larger share of their pool. With M1's lookback this mostly falls into warm-up. Print undated per tag-less file so the skew is visible.

### N5. Exact repeats of pasted templates

An owner message pasted the same way each session (a launch instruction) and classified as a correction would count `exact` every session. Print `exact` repeats separately per kind so the labelled check can see them.

### N6. Public counts

Weekly correction counts in a public lane folder say how often the owner corrected agents each week. That is low-sensitivity, and the shaper lane already published similar counts. Prefer pooled baseline rates over per-week owner counts in the lane folder.

### N7. Challenge the frame

Even fixed, field counts at this volume decide a delivery only after months (M2). Station 5's probe ("does the seat still push back") suggests a stronger instrument. Replay a fixed set of past situations where a correction was given, with and without the memory bundle, and count how many the agent now gets right. That needs no weeks of waiting and has no volume confound. It does not belong in this lane, but the baseline record should name it as the faster test, so a quiet month is not read as failure.

---

## Proposed normalisation (for the four counts)

| Count | Numerator | Denominator | Baseline value |
|---|---|---|---|
| Corrections given again | valid corrections with a `same` match inside lookback L, cross-session, not same day | valid corrections in the week (and owner turns in the week, if the meter counts them from the snapshot without text) | pooled share over non-warm-up weeks, with interval |
| Decisions asked again | prompted decisions with a `same` match inside L | prompted decisions in the week | pooled share, with interval; `re-decided` and `unprompted` printed beside |
| Findings that recur | `same-class` matches from another lane inside L | findings in the week; and lanes with at least one recurrence over lanes reviewed | pooled per-lane share, with interval; `re-reported` and `copy` beside |
| Context size | delivered characters per load, per part name | loads per role and launcher (minimum N) | median and 90th percentile per role over the baseline weeks; max kept as a guard |

Owner turns per week are the right exposure for corrections, but the candidates file does not carry them. The meter can count them with `transcriptUnits` over the same snapshot, sending no text anywhere, as one optional `--root` input.
