# Plan — outcome-meter

Lane: outcome-meter · branch `feat/outcome-meter` from main 8c665dcd · worktree `~/nana-pi-wt/outcome-meter`
Grounding: `docs/memory-factory-design-2026-10-31.md` (version 2, owner-confirmed); memory-making's and memory-shaper's plans and code on main; context-anatomy's load log on main; the memory-shaper scored-runs counts in its lane folder. The planner read no owner text, no label text and no candidate file. The adversary's attack is `plan-attack.md` in this folder; this plan is revision 3: revision 2 took every MUST and SHOULD (last section), and revision 3 applies the owner's two rulings of 2026-11-01 (count by interactions, not weeks; replay is the next lane).

Lane class: `node scripts/lane-class.mjs --root . --files packages/nana-pack/lib/outcome-meter.mjs,packages/nana-pack/lib/outcome-meter-config.mjs,packages/nana-pack/lib/outcome-score.mjs,scripts/outcome-meter.mjs,scripts/outcome-score.mjs,scripts/outcome-compare.mjs,scripts/memory-shape-runners.mjs,packages/nana-pack/tests/outcome-meter.test.mjs,packages/nana-pack/tests/fixtures/outcome-meter/candidates.jsonl,package.json,packages/nana-pack/README.md,REQUIREMENTS.md,docs/requirements-tree.md,docs/code-map.md` prints `ordinary`. No hook, pi extension, install step, gate policy or land/review tool is touched. One final reviewer, the roster's.

Split (revision 2): the attack's fixes push past eight must-meets, so the meter is two lanes.
- **This lane, outcome-meter:** corrections given again, decisions asked again, logged context size per role, the accuracy scorer and the run comparison, all in windows of owner interactions. It comes first: it starts the baseline, which only new interactions fill.
- **Later lane, outcome-findings:** findings that recur (MUST titles and known-bug lines), with blocking, relation words and commit dates. Its definition is fixed below so it is not re-derived. It takes the next free rows at its plan time and stays in FEAT-043.
- **Next lane, outcome-replay (owner answer 2026-11-01, "Yes"):** replay judges the first memory delivery; see "Field counts and replay".

## Purpose

Agreed reading (the owner said "Go", 2026-11-01): build the checking station's outcome meter now, before any memory delivery, so later delivery is judged against a baseline. The design's measured outcome: fewer corrections the owner gives twice, fewer decisions asked twice, fewer review findings that recur, with no agent's context larger than today's baseline. Principle 3: every change carries a baseline and a test that decides it.

This lane builds three hand-run commands:

- `npm run memory:meter -- --candidates <private jsonl> --root <private transcript snapshot> --out <private folder>`
  - **Interaction** (owner ruling 2026-11-01: count by a number of interactions, not weekly): one owner turn in the snapshot by memory-making's owner-turn rule (no tool results, meta, sidechain, compaction summary or wrapper traffic), with at least one seat entry before it in its transcript (the shaper's `skipped` rule). Session openers with no seat text, and headless builder briefs, are therefore not interactions; they are also the turns the shaper never sends. The meter orders all interactions across transcripts by entry instant (ties by file order) in one pass over `--root`.
  - **Windows:** consecutive runs of W interactions (sealed). A window closes once W interactions have accrued; the open tail prints `partial`. Each candidate takes the position of its owner turn; an ask result takes its instant's position without being an interaction.
  - **Lookback:** an item can repeat only an item within the B interactions before it (sealed). A window whose first interaction has fewer than B interactions before it in the snapshot prints `warm-up`. Neither warm-up nor partial windows enter the pooled baseline.
  - **Corrections given again:** a correction candidate whose judge-confirmed `same` match is an earlier correction from a different session within B.
  - **Decisions asked again:** a *prompted* decision (the agent asked; see A5) whose judge-confirmed `same` match is an earlier decision from a different session within B, settled the same way. A match settled differently prints as `re-decided`; an unprompted decision prints as `unprompted`. Neither counts.
  - **Parallel sessions (S1, full form):** a cross-session match counts only when the earlier item's instant precedes the later session's first entry. Otherwise it prints as `parallel` and does not count: that session started before the earlier correction existed, so no start-of-session delivery could carry it.
  - **Pasted repeats (N5):** a pasted message is one interaction like any other. An exact-text repeat (after normalisation) of a candidate counts, decided without a model call, and also prints as `exact`. Each window also prints `pasted <n>`: interactions whose normalised text equals an earlier interaction within B, computed locally with no text sent, so a template pasted every session is visible both as exposure and as repeats.
  - **Context size:** each load-log line falls in the window whose time span holds its instant (a window spans from its first interaction's instant to the next window's first). Per window, role and launcher: loads, and the median, 90th percentile and largest delivered characters per load, also per part name. Under a sealed minimum of loads it prints `too few loads <n>`. Lines whose `cwd` is under the OS temp folder count as `test loads`; lines outside every window count as `outside`.
  - **Pooled baseline:** over closed, non-warm-up windows, per kind: repeats over items, a 95% Wilson interval, and `halving needs <n> interactions each side` — the interactions needed after a delivery to detect a halving at 80% power (two-proportion formula; contract). Window rows carry a fixed note that one window is not a verdict.
- `npm run memory:meter-score -- --rows <private jsonl> --labels <private labels jsonl>` checks the meter against the seat's labels. Per kind it prints kind precision (valid labels over items), repeat recall and repeat precision counted among valid items, pointer agreement and unlabelled rows, each ratio with its Wilson lower bound. Fewer labelled repeats than a sealed minimum prints `unscored: too few repeats`.
- `npm run memory:meter-compare -- --rows <private jsonl> --against <private jsonl>` compares two runs. Per kind it prints both repeat counts and item-level agreement: repeats in both runs over repeats in either, matched by the owner-turn part of the evidence pointer, so two shaper runs can be compared.

Output: one private JSONL file per run in `--out` (exclusive create, 0600 in a 0700 folder, outside any checkout) with one row per item (kind, evidence pointer, interaction position, window, `repeatOf` pointer or null, relation, how decided, prompted) and one row per window. Pointers and counts only, never text. stdout carries counts only. Nothing with owner text, and no run count, enters the repo (N6).

### How repeats are detected

1. **Exact step, no model.** Normalised text (lower case, Unicode letter-and-number runs joined by single spaces) equal to an in-scope earlier item's is a repeat, decided `exact`.
2. **Judge step, no blocking (M4).** For each kind and window, the remaining items go to an isolated Claude call together with **every** in-scope earlier item of that kind within B. Items are chunked to a sealed number per call, processed in interaction order; each chunk carries its full lookback list. Ids are call-local (`u1`… for items, `e1`… for earlier items); no pointer, session id, instant or position reaches the model.
   - Corrections: the reply names one earlier id or none. The guide: the owner corrects the same behaviour of the agent again.
   - Decisions: the reply names one earlier id or none, and a relation, `same` (the same question settled the same way) or `changed` (settled differently).
   - Validation is deterministic and fails closed per call: exact id set, picks only from that call's earlier ids, relation in the kind's set. A rejected call's items count as `unjudged` in their window.
   - Spend: memory-shaper's accounting, a sealed token cap per run and dollar cap per call. Each window row prints its own `unjudged <u>`; a capped run also prints `incomplete: spend cap reached`. Estimate (inferred): about 200 items in the snapshot, about 20 calls, under one dollar a run.
3. **Why no word blocking here:** word overlap drops paraphrased corrections (the attack's 0.10 overlap example), and a labeller's word search cannot see that loss. Corrections and decisions are small enough to judge against the whole lookback.

Why not embeddings: the repo has no embedding provider, Anthropic offers none, and a new provider for owner text goes against the owner's choice of Claude models for owner text.

### Field counts and replay (M2, N7)

Window and lookback sizes (chosen, from the snapshot's real counts). The snapshot's 573 owner turns (2026-10-04 to 2026-10-31) include 340 with no seat entry before them, so it holds 233 interactions, about 58 a week. Defaults: **B = 60 interactions** and **W = 80 interactions**. B + 2W = 220, so today's snapshot yields two closed baseline windows after warm-up, with a 13-interaction partial tail. Reason: B is short enough to leave two windows and long enough to span about a week and a half of sessions; W is the smallest size that gives each window about ten found corrections.

What the pooled-interval maths gives (inferred: 46 labelled corrections per 233 interactions, shaper correction recall 0.6, a 15% repeat share):

| W | found corrections per window | two windows pooled | 95% interval on the repeat share | interactions per side to show a halving |
|---|---|---|---|---|
| 60 | about 7 | 14, 2 repeats | 0.04 to 0.40 | about 2,350 |
| 80 | about 10 | 19, 3 repeats | 0.06 to 0.38 | about 2,350 |
| 120 | about 14 | 28, 4 repeats | 0.06 to 0.31 | about 2,350 |

Plainly: the window size sets how often a row prints, not how fast a delivery can be judged. Detecting a halving needs about 2,350 interactions on each side, about 40 weeks at today's pace (two-proportion test at 95% and 80% power; the attack's Poisson estimate of 11 weeks assumed a rate, not a share). Today's baseline is two windows with an interval from 0.06 to 0.38. The field baseline must keep accruing: the seat copies transcripts into the private snapshot before Claude Code's 30-day cleanup reaches any transcript not yet copied, or that history is lost.

Replay would decide a delivery much faster. Take the past situations where the owner gave a correction (about 46 in the labelled window today), rebuild the agent's context at that turn, and run it with and without the memory bundle. A judge then marks whether the agent repeats the corrected behaviour. It is paired, so one run of about 40 situations can decide a large effect (McNemar test on the discordant pairs, inferred), with no waiting and no volume confound. Its limits: it measures whether a bundle *can* prevent a repeat in a rebuilt situation, not whether it does in live work; the rebuilt context is a cut of the seat's real one; each replay costs a seat-sized call; and it needs a bundle to test.

Decision (the owner, 2026-11-01, "Yes"): build this field meter now, and make **outcome-replay the next lane**, ahead of outcome-findings and before the first delivery lands. Replay judges the first memory delivery; the field counts confirm it later. This lane keeps the field meter because only new interactions fill its baseline and it carries the context-size guard.

### How accuracy is checked (M5)

All private, outside the repo:
- **Every** correction and decision in the closed, non-warm-up windows is labelled, not a sample. The labeller works from the source text resolved by memory-making's `resolveEvidence`, not from the shaper's claim. Each label is `{ evidence, kind, valid: true|false, repeatOf: [pointers], relation }`, listing every in-scope earlier item within B that states the same thing. Owner text goes only to Claude models, so the labeller is the seat or a Claude labelling agent; the owner check below covers the shared lineage.
- **Owner check:** the seat shows the owner ten claimed correction-repeat pairs, chosen at random by the seat (the judge gives no confidence score, so "top ten" is read as a random ten; all of them if fewer), as a private step. The owner marks each right or wrong. The seat records only the right-count, privately.
- Bar (chosen, as memory-making's): for each kind, kind precision, repeat precision and repeat recall Wilson lower bounds at or above the sealed bars, with at least the sealed minimum of labelled repeats. With fewer, the kind is `unscored: too few repeats`, which today's volume makes likely; the seat reports that plainly rather than a ratio.
- **Noise floor:** two shaper runs over the snapshot, each metered twice (four runs). `memory:meter-compare` records the count spread and the item-level agreement of repeat sets for each pair. A later delivery must beat this floor.

### The seat's baseline run (after build 1)

- Canary: one synthetic call through the real runner validates and reports tokens per item before any owner text is sent. The seat sets the token cap from that measure before the first scored run (S4).
- Prompt freeze: the judge prompt's SHA-256 and every sealed value go in `sealed.txt` in the lane folder before the first scored run. Inside this lane the seat may not change them from what the scores show.
- Frozen inputs: the private transcript snapshot, two shaper runs over it, one copy of the load log.
- Public record (N6): the lane folder carries the method, `sealed.txt` and the synthetic test results only. Every window count, pooled rate, label result, owner-check result and noise figure stays in the private run folder. The seat reports bar outcomes to the owner directly.
- The lane lands in every outcome. Under a bar, or `unscored`, the seat brings the owner a decision point.

## Assumptions

- A1. Scope (owner answer 2): a correction or decision repeats only an item from a different session, taken from the `claude-code:<session>#…` pointer. `seat:` pointers have no session and are counted as `skipped`.
- A2. Order and lookback: item A is earlier than item C when A's owner turn comes earlier in the interaction order. A matches only within the B interactions before C. Parallel sessions follow the full S1 rule above.
- A3. Interaction order needs entry instants, so the meter reads `--root` once for owner turns, instants, session first entries and seat entries; candidates carry only a day. A candidate whose owner turn is not in the snapshot counts as `unresolved` and is left out.
- A4. Judge text: the candidate's `claim`, cut to a sealed cap. Shaper candidates mix the rule form (ask pairs) and the model form (owner turns); with no blocking, the judge reads both (N3, residual).
- A5. Prompted decision: an ask-pair pointer (`#uuid+uuid` whose seat entry holds an `AskUserQuestion` call), or a pointer whose paired seat entry's text matches memory-making's sealed `QUESTION_PATTERN`. The meter resolves pointers in one pass over `--root` and must agree with `resolveEvidence` on the fixtures. An unresolvable pointer counts as `unresolved` and is left out.
- A6. Validity: the meter counts all candidates of the kind; validity exists only in the labels, so the scorer counts repeats among valid items. The meter's own rates are therefore an upper reading, and the README says so.
- A7. The candidates file is validated at the boundary (string `evidence`, `kind`, `date`); duplicate pointers count once, first wins; a malformed row fails the run with a fixed line and no call; `lesson` rows are ignored.
- A8. Load log (S3): read with `readRecordLedger` under a sealed byte cap; a line counts when `v` is 1 with string `role` and `launcher`, a valid `at` and a `parts` array of `{ name, deliveredChars }`. Reviewer loads split by launcher. The README and baseline record state that planners and adversaries (Agent-tool subagents) are not logged, standing rules and AGENTS files are outside the log, and the seat's line covers the shared-memory index only. So "no agent's context larger" is decided only for logged parts.
- A9. Runner (M7, N2): the meter config seals `JUDGE_RUNNER = "claude"` and passes it, with its own model, effort, dollar cap, timeout and `maxBuffer`, to `createRunner`. `createRunner` throws when any of those options is given with runner `pi`. No session file, no tools, no MCP, no settings sources, a replaced system prompt, prompt on stdin, cwd the OS temp folder, `NANA_ROLE=worker`.
- A10. Privacy: memory-shaper's contract for all three commands. stdout and stderr carry counts and fixed lines only, never claims, quotes, pointers or reply text; caught error messages are never printed. The meter takes no `--labels`.
- A11. IDs: FEAT-043 under CAP-01, after FEAT-040 (FEAT-042 is held by lane builder-anatomy; if another lane takes FEAT-043 first, take the next free number). Rows R-3310 to R-3317 for the must-meets and R-3318 to R-3336 for the seals; artifact A-095. outcome-findings takes the next free rows at its plan time.
- A12. Coverage: one machine's transcripts and load log, Claude Code only (S7, residual and README known limit).

## Open choices

- O1. Starting values, sealed with `chosen` provenance: judge model `claude-sonnet-5` at effort `low`; 0.50 dollars per call; 1,000,000 tokens per run before the canary resets it; 20 items per call; 600 characters per claim; window W = 80 and lookback B = 60 interactions (sized above); timeout 300 seconds; `maxBuffer` 64 MiB; load-log cap 16 MiB; minimum 10 loads per role, launcher and window; minimum 15 labelled repeats per kind; bars 0.80 kind precision, 0.80 repeat precision, 0.70 repeat recall (on Wilson lower bounds); 95% interval and 80% power.
- O2. The judge prompt wording around the kind definitions, sealed by its SHA-256; object-rooted reply schema (memory-shaper's build 1 failed on an array root).
- O3. One output file with item and window rows, or two.
- O4. Whether the scorer and the comparison live in one module (`outcome-score.mjs`) or two.

## Questions for the owner

Answered (the owner, 2026-11-01, "Defaults"):
- Baseline input: yes, the baseline uses the model shaper's candidates, made from a private transcript snapshot the seat keeps.
- Repeat scope: yes, a repeat counts only when the earlier item came from a different session (corrections, decisions) or a different lane (findings).

Rulings (the owner, 2026-11-01):
- Count by a number of interactions, not weekly. Windows and the lookback are both sealed numbers of interactions; this replaced the open lookback-days question.
- "Yes": build this meter now; outcome-replay is the next lane and judges the first memory delivery.

Open: None.

## Feature

Feature: FEAT-043 · Measure memory outcomes

Under CAP-01, after FEAT-040. Purpose line: "Count, per window of owner interactions and pooled, owner corrections and decisions given again, review findings that recur and each role's logged context size, so memory changes are judged against a measured baseline." No subgroup.

## Threat model

In scope: honest variation in our own tools' output and in the model's. Candidate files from either maker or claim form, with duplicate pointers, empty files or torn last lines; ask-pair and seat-saved pointers; pointers the snapshot cannot resolve; parallel sessions; candidates whose owner turn is missing from the snapshot; a snapshot shorter than the lookback plus two windows; a missing, torn, oversized or newer-version load log, unknown roles and launchers, test homes writing load lines; model replies that are not JSON, wrap JSON in a fence or prose, drop or add an id, pick an id from another call, or name a relation outside the kind's set; calls that time out, exit non-zero or report no or unpriced usage; run-to-run variance of the shaper and the judge.

Out of scope: deliberate forgery — a planted candidate crafted to steer the judge. The checking and delivery stations own prompt-injection defence. A finding outside this model is a residual and becomes a known-bug line.

Public-repo rule: no owner text, claim, label, candidate, model reply or run count enters any repo file. Fixtures are synthetic.

## Precedent

- `packages/nana-pack/lib/memory-shaping.mjs` — follow: fail-closed per-call validation, call-local ids, spend cap, unknown-usage accounting, counts-only command, exclusive private output. Its private `validated` is not imported; the reply shape differs.
- `scripts/memory-shape-runners.mjs` — **helper move**: `claudeRunner` and `createRunner` gain optional `model`, `effort`, `budgetUsd`, `timeoutMs` and `maxBuffer`, defaulting to the shaping config's values, and `createRunner` throws when any is given with runner `pi`. The shaper's behaviour and `packages/nana-pack/tests/memory-shaping.test.mjs` stay unchanged. `scripts/outcome-meter.mjs` imports `createRunner` with the meter's sealed runner and values.
- `packages/nana-pack/lib/memory-making.mjs` — import `transcriptUnits` (exposure), `resolveEvidence` (fixture agreement for A5), `memoryArgs`, `defaultMemoryRepo`.
- `packages/nana-pack/lib/memory-making-config.mjs` — import `PRIVATE_REFUSAL`, `CANDIDATE_FIELDS`, `QUESTION_PATTERN`.
- `packages/nana-pack/lib/claude-transcript.mjs` — import `privateFolder`, `edtDay`, `streamEntriesIn`, `assistantText`.
- `packages/nana-pack/lib/pi-usage.mjs` — import the usage sum helpers.
- `packages/nana-pack/lib/memory-score.mjs` and `scripts/memory-score.mjs` — follow for the scorer and comparison: explicit private files, counts-only lines, `unscored` marker, fixed failure.
- `packages/nana-pack/lib/context-load-log.mjs` (`CONTEXT_LOAD_FILE`), `packages/nana-pack/lib/agent-dir.mjs` (`piAgentDir`), `packages/nana-pack/lib/record-ledger.mjs` (`readRecordLedger`) — import.
- `apps/bench/lib/catch-judge.mjs` — follow `MATCH_GUIDE`'s equivalence wording and per-row id lists; not imported (a pack module may not import an app).
- Wilson interval, two-proportion sample size, interaction windows: none: map search found no helper for any; the meter writes small ones in its module.

map:search results taken: "judge with claude -p json schema" returned `catch-judge.mjs` and `catch-ledger.mjs` (match guide taken; the ledger's hash-keyed cache left for a later slice). "read context load log" returned `context-load-log.mjs` and `record-ledger.mjs` (both taken). "weekly counts report" (searched before the ruling) returned `suite-records.mjs` and `product-report.mjs` (skipped). "text similarity tokens overlap" and "iso week bucket" returned nothing usable.

Map impact: `scripts/memory-shape-runners.mjs` has callers `scripts/memory-shape.mjs` and `packages/nana-pack/tests/memory-shaping.test.mjs`; both stay unchanged and green. Imported modules are not edited. Expected file changes (a forecast, not a limit): new `packages/nana-pack/lib/outcome-meter.mjs`, `outcome-meter-config.mjs`, `outcome-score.mjs`, `scripts/outcome-meter.mjs`, `scripts/outcome-score.mjs`, `scripts/outcome-compare.mjs`, `packages/nana-pack/tests/outcome-meter.test.mjs`, fixtures under `packages/nana-pack/tests/fixtures/outcome-meter/`; edits to `scripts/memory-shape-runners.mjs` (options only), `package.json` (`memory:meter`, `memory:meter-score`, `memory:meter-compare`), the pack README (runtime dependencies, logged-context meaning, window rows not a verdict, one-machine limit), `REQUIREMENTS.md`, `docs/requirements-tree.md` and `docs/code-map.md` (regenerated). The seat adds `sealed.txt` to the lane folder.

Artifact entries (ruling 2026-10-22): `Artifact: A-095 · outcome meter rows · user-home store: ~/<private --out folder>/outcome-meter.jsonl · manual: the seat runs npm run memory:meter by hand`, with `Read by: A-095 · code: packages/nana-pack/lib/outcome-score.mjs`. FEAT-043 declares `Reads:` lines for A-089 and A-091 (and A-088, which the meter also accepts) naming `packages/nana-pack/lib/outcome-meter.mjs`; the builder removes A-089's `Parked:` line if the deliverables check then counts it as read.

## Outside precedent

- moj-analytical-services/splink (MIT) — borrow, for outcome-findings. Its split of cheap blocking rules from a costlier comparison step, and its count of true pairs the blocking keeps, shape that lane's findings matching. This lane does no blocking.
- Other public references: Wilson score interval and the two-proportion sample-size formula (standard; written inline); the LLM-as-annotator practice of freezing the prompt before scoring; McNemar's paired test as the replay lane's likely decision rule.

## Must-meet

Each test gets one new row, R-3310 to R-3317, in FEAT-043. Every assertion naming a tunable imports it from `outcome-meter-config.mjs`. All inputs are synthetic; every test uses a fake runner or an injected spawn.

1. **The report counts each outcome by interaction window and pooled.** Fixture: four sessions whose owner turns, session-opening turns and tool results give a known interaction count, with corrections and decisions among them, and a load log. Session openers and tool results are not interactions. stdout prints, in window order, exact lines for corrections (`<window> corrections <n> repeated <r> exact <x> parallel <s> unjudged <u>`), decisions (`… asked again <r> re-decided <c> unprompted <p> …`) and `pasted <n>`, and the pooled lines with Wilson bounds and `halving needs <n> interactions each side`. The first window prints `warm-up` and the open tail `partial`; neither enters the pooled lines. Pins R-3310.
2. **A repeat needs an earlier item in scope.** The same correction in one session twice is not a repeat; in another session it is, counted in the later item's window. A match whose earlier instant comes after the later session's first entry is `parallel`, not a repeat. A pair B interactions apart is a repeat; B + 1 apart is not. The first item of a group is never a repeat; a `seat:` pointer counts as skipped; a candidate whose owner turn is missing is `unresolved`. Pins R-3311.
3. **Decisions count only when asked and settled the same way.** An ask-pair decision and a decision paired with a question entry are prompted; a decision paired with seat text holding no question is `unprompted`. The fake judge's `same` counts as asked again and `changed` as `re-decided`. The prompted rule agrees with `resolveEvidence` on every fixture pointer. Pins R-3312.
4. **The judge sees every earlier item, and a bad reply fails closed.** Exact repeats make no call. Each call holds one kind, at most the sealed number of items, and every in-scope earlier item within B, with call-local ids and no pointer, session id, instant or position. Replies in a code fence are accepted; prose around JSON, a missing or extra id, an id from another call, an unknown id, or a relation outside the kind's set reject the whole call, whose items count as `unjudged` in their own windows. stderr holds no reply text. Pins R-3313.
5. **The spend cap stops new calls, and an incomplete run says so.** Items go in interaction order. The cap is reached after the second call: exactly two calls, later windows' items `unjudged` in their own rows, and `incomplete: spend cap reached`. A call with no usage prints `calls with unknown usage 1`, `cost unknown` and a lower-bound token total. Pins R-3314.
6. **Logged context size is reported per role, launcher and part.** Fixture lines for seat, worker and both reviewer launchers fall into windows by instant: per window, loads, median, 90th percentile and largest delivered characters, per launcher and per part name. Under the sealed minimum: `too few loads <n>`. A line whose `cwd` is under the OS temp folder counts as `test loads`, and a line outside every window as `outside`. A torn line, a `v: 2` line and a line without `parts` count as three bad lines; a log over the cap fails with a fixed line; a missing log prints `no load log` and the other counts. Pins R-3315.
7. **Output stays private, and owner text goes only to the sealed Claude runner.** `--out` inside a checkout refuses with memory-making's refusal line; outside, the file is 0600 in a 0700 folder (modes skipped on Windows) and an existing file is not overwritten. `--labels` on the meter fails with no call. On success and on a runner that throws with fixture text, stdout and stderr of all three commands hold no claim, quote, pointer or reply text. Through an injected spawn the meter's call carries the sealed `claude` runner, model, effort, dollar cap, timeout and buffer, with the prompt on stdin. `createRunner({ runner: "pi", model })` throws, and the meter's runner stays `claude` with the shaping runner value set to `pi`. `createRunner()` with no options still passes the shaper's values. Pins R-3316.
8. **The scorer and the comparison measure the meter.** A hand-written labels file gives exact per-kind lines: `kind precision`, `repeat recall`, `repeat precision` (among valid items), `pointer agreement`, `unlabelled`, each with its Wilson lower bound; fewer labelled repeats than the sealed minimum prints `unscored: too few repeats`; an unlabelled row prints `unscored: unlabelled rows`. Two rows files give each run's repeat count and item-level agreement (shared over union), matched by the owner-turn part of the pointer. Duplicate labels or a malformed file fail with a fixed line. Pins R-3317.

Sealed tunables, each pinned by one test naming its row (R-3318 to R-3336): judge runner, judge model, judge effort, dollar cap per call, token cap per run, items per call, window and lookback sizes, claim cap, timeout, `maxBuffer`, load-log byte cap, minimum loads, minimum labelled repeats, the three bars, interval and power levels, the judge system prompt's SHA-256, and the output file name with the fixed stdout words (`warm-up`, `partial`, `parallel`, `pasted`, `outside`, `unprompted`, `re-decided`, `unjudged`, `too few loads`, `test loads`, `no load log`, `incomplete: spend cap reached`, `unscored: too few repeats`, `unscored: unlabelled rows`, and the window-rows note). The interaction rule, window rule, scope rule and prompted rule are contract behaviour pinned in must-meets 1 to 3.

## Later lane: outcome-findings (definition fixed now)

- A finding repeat is a **new instance of an earlier mistake** in another lane within the lookback (`same-class`: a lesson from the earlier finding would have prevented it). A re-report of a still-present bug is `same-defect` (catch-judge's `same_as`: fixing one fixes the other) and prints as `re-reported`, not counted. An exact cross-lane copy, and a carried or moved line (CARRY, HANDOFF moves), prints as `copy`, not counted (M3).
- The `(<lane>, <source>)` tag is stripped before blocking and the judge; the area is a separate field kept out of blocking words (S2).
- Word-overlap blocking for findings only, with the tie at the K cut broken by input order (N1); blocking recall measured on labels made without word search.
- Dates from commits: a MUST by its review file's first-add commit date, a known-bug line by the commit that added it (S5).
- Per window, `lanes <n> with recurring <m>` beside the item count; the per-lane share is the findings baseline (S6). Undated lines printed per file (N4).
- Labels: a stratified sample (meter positives for precision, random items with every same-feature earlier finding listed for recall), labelled by the pi lineage, since findings are not owner text (M5).
- Findings have no owner turns, so that lane places each finding in the interaction window its commit instant falls in; spend in that order, per-window `unjudged` (S4); windows compared only within one run at one tip (M1).

## Left for later lanes

- outcome-replay (next, by the owner's answer; judges the first memory delivery).
- outcome-findings (above).
- Stable history: a judge-decision cache keyed by item, earlier set, prompt hash and model, so earlier windows stay fixed and reruns pay only for new items.
- Scheduling: a run each time a window closes, which also copies new transcripts into the private snapshot before the 30-day cleanup, plus an `over baseline` line per role.
- More sources: pi sessions, GitHub `ask` issues, and the second machine's transcripts and load log (S7).

## Residuals

- S7: one machine and Claude Code only, so a correction given on one machine and again on the other is invisible before and after delivery. Stated in the README as a known limit.
- N3: mixed claim forms in shaper output; with no blocking, the judge reads both.
- A6: the meter's own rates count invalid candidates; only the scorer's rates are validity-corrected.
- Shared lineage: shaper, judge and labeller are all Claude for owner text, by the owner's choice; the owner check of ten pairs is the only outside check.
- At today's volume the scorer will likely print `unscored: too few repeats` for corrections; the bar can be read only as windows accrue.

## Revision after the attack

- M1, history-length drift: taken. Sealed lookback B in interactions, `warm-up` and `partial` windows, pooled baseline over closed windows only (must-meets 1, 2); findings windows compared within one run (outcome-findings).
- M2, too-small counts and wrong noise floor: taken. Pooled rates with Wilson intervals and `halving needs <n> interactions each side`; window rows marked not a verdict; four noise runs (two shaper × two meter) compared on item-level agreement by `memory:meter-compare` (must-meets 1, 8). N7 weighed in "Field counts and replay": replay decides much faster, and the owner made it the next lane.
- M3, re-reported live bugs and copies: taken into outcome-findings' fixed definition (`same-class` counts; `same-defect` and `copy` print apart; carried and moved lines excluded; class vs single-defect wording reconciled).
- M4, blocking drops paraphrases: taken. No blocking for corrections and decisions; every in-lookback earlier item goes to the judge (must-meet 4). Blocking stays for findings only.
- M5, labels too small and same-family: taken. Every correction and decision labelled from source text with a validity mark; scorer prints kind precision, Wilson lower bounds and `unscored: too few repeats` (must-meet 8); pi-lineage labeller for findings only; owner check of ten claimed pairs as a private step.
- M6, reversals and volunteered statements: taken. Prompted decisions only; `same` counts, `changed` prints `re-decided`, unprompted prints apart (must-meet 3).
- M7, shaper config could route owner text to pi: taken. Sealed `JUDGE_RUNNER`, explicit pass, `createRunner` throws on pi with meter options (must-meet 7).
- S1, parallel sessions: taken in full form (`parallel` when the earlier instant follows the later session's start, must-meet 2), since interaction order already reads instants.
- S2, lane tag in judge text: taken into outcome-findings.
- S3, thin and confounded context baseline: taken. Minimum loads, per-part and per-launcher split, test loads excluded, unlogged roles and standing text stated (must-meet 6, A8).
- S4, spend cap and uneven truncation: taken. Interaction order, per-window `unjudged`, cap set from the canary's measured tokens per item (must-meet 5, seat step).
- S5, lane-start dates: taken into outcome-findings (commit dates).
- S6, one noisy lane: taken into outcome-findings (`lanes with recurring`).
- S7, one machine: taken as a residual and README known limit.
- N1: taken (tie-break for findings; the scorer and comparison are inside must-meet 7's output check).
- N2: taken (timeout and buffer are meter options and seals).
- N3: residual.
- N4: taken into outcome-findings.
- N5: taken (`exact` printed per kind).
- N6: taken (no run counts in the public lane folder).
- N7: weighed; the owner made replay the next lane.
