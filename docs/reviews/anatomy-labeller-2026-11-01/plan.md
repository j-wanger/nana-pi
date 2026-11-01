# Plan: anatomy-labeller (2026-11-01, revised after plan-attack.md)

Lane: `anatomy-labeller`, worktree `~/nana-pi-wt/anatomy-labeller`, branch `feat/anatomy-labeller`, base main `ad9612dd`.

Split: the must-meets passed eight after the attack, so the work is two lanes, built in this order.
- **Part 1, this lane (`anatomy-labeller`) comes first:** the `label` subcommand and its private labels store,
  R-3390 to R-3398. It lands first so the seat can start the two-hour labelling run while Part 2 builds.
- **Part 2, the next lane (`anatomy-label-check`):** the readers. `agree --model`, `sample --labels`, `sample
  --heavy` and `report --labels`, R-3399 to R-3404. The seat measurement below runs in Part 2, once both have landed.
  Part 2 reuses this plan as grounding; its own worktree and brief come later. Rows R-3405 to R-3409 stay unused.

Lane class, both parts: `ordinary`.
- Part 1: `node scripts/lane-class.mjs --root . --files apps/bench/anatomy.mjs,apps/bench/lib/anatomy.mjs,apps/bench/lib/anatomy-config.mjs,apps/bench/lib/anatomy-measures.mjs,apps/bench/lib/anatomy-labels.mjs,apps/bench/test/anatomy-labels.test.mjs,REQUIREMENTS.md,apps/bench/README.md,docs/code-map.md` prints `ordinary`.
- Part 2: `node scripts/lane-class.mjs --root . --files apps/bench/anatomy.mjs,apps/bench/lib/anatomy.mjs,apps/bench/lib/anatomy-config.mjs,apps/bench/lib/anatomy-measures.mjs,apps/bench/test/anatomy-labels.test.mjs,REQUIREMENTS.md,apps/bench/README.md,docs/known-bugs/FEAT-042.md,docs/code-map.md` prints `ordinary`.
One final reviewer per part, the roster's reviewer. No wrong-code pairs, no land reviewer, no install check.

Stakes: low blast, reversible. A hand-run bench subcommand; no launcher, prompt, hook or live build changes. Spend is
bounded (about USD 6, capped, unknown usage charged). Two real harms: private builder text leaking into git, logs or
CI, and a share read as a finding before the labels pass a weight-aware bar. Part 1's privacy must-meet pins the
first; Part 2's measurement order and weighted check pin the second.

IDs: FEAT-042 (extends it), rows R-3390 to R-3404 from the closed range R-3390 to R-3409, artifact A-098.

## Purpose

Agreed reading (owner, 2026-11-01, via the seat's brief and builder-anatomy's pre-registered fork): each role's context
is designed from eval evidence, builder first, broken down by function. builder-anatomy measured that two model
labellers from different families agree at κ 0.86 on the common functions, while the keyword rules agree with their
consensus at κ 0.36 and leave 55% of pushed chars unsorted. The plan pre-registered the fork: a model labeller (A2)
becomes the next lane. Across both parts, the feature is:

> Label every distinct unit in the private segmented store once with a model, check those labels against the existing
> two-labeller consensus, a heavy-key check set and a stratified sample before any share is read, and let `report`
> give function shares from the model labels per occurrence and per distinct text.

Store numbers (counts-only `report` on the private store, 2026-11-01; the attack's jq aggregation of the same; no row
or gate quotes them):
- 600 builds; 120,911 units including 1,232 oversize.
- Normalized, the store holds 11,043 distinct unit texts (2.91M chars), 24 of them oversize. Median distinct unit
  175 chars, p90 491.
- 3,591 duplicate groups hold 113,459 occurrences. 44 keys appear in all 600 builds (22% of units). 283 keys with at
  least 60 occurrences hold 74% of units.
- 56 keys span more than one part (about 10% of units).
- Denominators differ: 22.9M non-oversize unit chars, 23.6M pushed chars with glue, 37.5M all unit chars.

## Assumptions

- A1. Builder contexts are not owner turns under R-3258. Every one of the 600 builds ran on an openai-codex model
  (luna 361, sol 238, astra 1), so every unit was already sent to that provider. The ruling still stands, and the
  default is Claude anyway: it reads anything, it differs from the builders' family, and the sealed runner exists.
  May be wrong if the owner reads R-3258 as covering any text quoting him, wherever it went; then labeller B in the
  measurement must be a second non-Sonnet Claude model instead of the pi land model.
- A2. The model sees each unit's text alone, blind to part, heading and rule label, as labellers A and B did. Batches
  hold keys in a seed-shuffled order (`LABEL_ORDER_SEED`), so the model does not see a build's preamble in sequence
  (attack N3). The labels are therefore blind-text functions. A unit whose function changes with its place is a
  measured residual: Part 2's report prints its size (attack S3).
- A3. Dedup key: SHA-256 of the report's existing duplicate normalization (cwd, branch, list markers, emphasis,
  whitespace). The model receives the representative's raw text with only cwd and branch replaced by the existing
  tokens (`<WORKTREE>`, `<BRANCH>`): backticks and list markers stay, as A and B saw them, and home-folder paths do
  not leave the machine (attack N4).
- A4. Oversize units (above `OVERSIZE_UNIT_CHARS`) are not labelled; `report` lists them as whole rows outside the
  shares. The attack found one addendum unit above the line (6,879 chars); it stays a whole row like the others.
- A5. Both share views are printed by default (attack S4): per occurrence (what builders received) and per distinct
  text (what varies). The counts file reads the brief and addendum part shares as the varying context.
- A6. The seat reuses the existing store `contexts.jsonl` made on 2026-11-01. A re-segmented store keeps every
  unchanged text's key.
- A7. Bars live in this plan and the counts file, not in code: `agree` prints κ and weighted agreement, never pass
  or fail.
- A8. A sample stratified on the model's own labels mostly measures precision for a rare function. The sample also
  takes the same minimum from the rule labels, made without the model. Recall for a function both miss stays
  unmeasured (residual).
- A9. `claudeRunner` is synchronous (`spawnSync`), so about 280 calls run one at a time, 1.5 to 2.5 hours, as a
  background run. The progress line and the growing labels file are the heartbeat's signals. No concurrency.
- A10. Keys are private. A SHA-256 of a short text can be reversed from a dictionary, so keys are never printed or
  committed (attack S6).

## Open choices

- O1. Batch shape: at most `LABEL_BATCH_UNITS` units (chosen 40) and `LABEL_BATCH_CHARS` chars (chosen 24,000) per
  call, ids `u1..un` inside the call as in memory-shaping.
- O2. Reply schema: object root `{ units: [{ id, label }] }`, label an enum of the ten functions plus `unsorted`.
  memory-shaper's build 1 canary failed every call on an array root.
- O3. Batch rejection: a wrong id set, a duplicate id or an off-vocabulary label rejects the whole batch
  (memory-shaping precedent); its units count `unclassified`. The fenced-reply case is kept for parity with
  memory-shaping: the Claude runner's structured output never fences (attack N2).
- O4. Labels folder layout: `manifest.json` (model, effort, prompt SHA-256, order seed, store hash or row count) and
  `labels.jsonl`, one row per key `{ key, id, label }`, appended after each batch with mode 0600. Names are the
  builder's call.
- O5. Caps and stops, all chosen: `LABEL_TOKEN_CAP` 2,500,000 (about twice the estimate); `LABEL_UNKNOWN_CHARGE`
  20,000 tokens per call with unknown usage (above a 40-unit call's estimated 4.6k, so a hung endpoint reaches the cap
  quickly); `LABEL_FAIL_STREAK` 3 consecutive failed calls; `LABEL_PROGRESS_EVERY` 10 calls. The per-call
  `DOLLAR_CAP` is passed to `claudeRunner` as today.
- O6. Part 2: how `report` takes labels. A pure transform of the contexts before `reportContexts`, so every reader of
  `s.label` changes together (attack S5).
- O7. Part 2: the stratified minimum `LABEL_SAMPLE_MIN` (chosen 15) and the heavy-key threshold `LABEL_HEAVY_MIN`
  (chosen 60 occurrences, 283 keys on today's store).
- O8. For the seat: carry 1 (Residuals) is corrected in Part 2's counts file by default, or by a one-line in-place
  correction of the landed lane's counts file in a reviewed change.

## Questions for the owner

Question: Which model labels the whole store?
Default: sonnet (Claude Sonnet 5 through the sealed Claude runner, low effort).
What the default gains and misses: gains the cheapest Claude, the family that already scored κ 0.86 with the other labeller; misses an independent family, since labeller A was also Sonnet. The bar answers that: every mark also needs agreement with labeller B, and the new check labellers use Opus, not Sonnet.
Cost of a wrong guess: easy to undo — one config value and a rerun of about USD 6.
If answered otherwise: opus costs several times more for the same check; the pi land model needs a ruling that builder contexts may go to it (see A1).

The second question (occurrence or distinct-text shares) is dropped: both views print by default.

## Feature

Feature: FEAT-042 · Measure what a builder's context is for

Part 1 commands:
```
node apps/bench/anatomy.mjs label --in <private-store> --out <private-labels-folder>
node apps/bench/anatomy.mjs label --in <private-store> --resume <private-labels-folder>
```
Part 2 commands:
```
node apps/bench/anatomy.mjs agree  --in <private-store> --a <filled-a> --b <filled-b> --model <labels-folder>
node apps/bench/anatomy.mjs sample --in <private-store> --seed <seed> --labels <labels-folder> --out <private-sheet>
node apps/bench/anatomy.mjs sample --in <private-store> --labels <labels-folder> --heavy --out <private-sheet>
node apps/bench/anatomy.mjs report --in <private-store> --labels <labels-folder>
```

Design:
1. `label` keys each non-oversize unit by SHA-256 of the normalized text and keeps one representative per key: 11,019
   distinct texts instead of 119,679 units. Keys go out in a seed-shuffled order.
2. It writes the manifest first, then sends blind batches (sealed prompt built from `DEFINITIONS`) through the
   imported `claudeRunner`. It appends each batch's rows as it goes.
3. Spend is bounded by a token cap per run, a dollar cap per call, a fixed charge for unknown usage and a stop after
   three failed calls in a row. `--resume` continues a folder only when model and prompt hash match.
4. It prints counts only: a progress line every ten calls, then distinct units, calls, tokens (lower bound when usage
   is unknown), cost or `unknown`, `unclassified`, `unsent`, the model and the prompt hash.
5. Part 2's readers apply the labels by key, print weighted agreement on heavy keys, draw stratified and heavy
   sheets, and print both share views. Without the new flags every existing output is unchanged.

Artifact line:
`A-098 · model function labels · user-home store: ~/<private --out folder>/labels.jsonl · manual: the seat runs node apps/bench/anatomy.mjs label outside any git checkout; synthetic runs use OS temp`
Read by: `A-098 · code: apps/bench/lib/anatomy-labels.mjs` in Part 1 (resume). Part 2 adds
`apps/bench/lib/anatomy-measures.mjs`. CAP-08 gains `Made by: R-3390 · manual: the seat runs node apps/bench/anatomy.mjs
label with a private output folder outside git · A-098`, its Read by line, and R-3390 in Deliverables.

## Threat model

In scope, honest variation: a reply that is not JSON, has a missing, extra or duplicate id, or an off-vocabulary label;
a reply or runner error that echoes unit text; a call that times out or reports no usage; a run killed by sleep, auth
expiry or the seat; a hung endpoint; unit text that reads like an instruction, which the prompt treats as data and
validation catches; the same text under different worktree paths, branches, list markers or whitespace; one text in
several parts; an occupied, symlinked or in-checkout output folder; a resume after the prompt or model changed.

Out of scope, deliberate forgery: a brief or session written to steer the labeller; hand-edited labels, manifest or
store files; a forged filled sheet. A finding outside this model is a residual.

Privacy: unit text goes only to the injected runner's stdin and the private folder. Nothing prints text or keys.
Tests use synthetic fixtures and fake runners; no test, log or CI run calls a model or reads the real store.

## Precedent

- `packages/nana-pack/lib/memory-shaping.mjs` (`extractShaped`, `runShape`): batching, token cap, `unsent`,
  `caps.unknownCharge`, `cost unknown`, per-batch rejection, `u1..un` ids, counts-only stdout lines. Follow it; do not
  import it (its units and schema differ). map:search ranked it first for labelling in capped batches.
- `scripts/memory-shape-runners.mjs` (`createRunner`, `claudeRunner`): the isolated Claude runner. Import it with
  `model`, `effort` and `budgetUsd` overrides. Inject it at the bin boundary as `scripts/memory-shape.mjs` does:
  `apps/bench/anatomy.mjs` builds the runner and passes it to `runAnatomy`; the library never spawns.
- `apps/bench/lib/catch-judge.mjs` (`callJudge`): the structured-output call behind `claudeRunner`. Its thrown
  messages carry up to 300 chars of model output, so the label module never prints or stores an error message.
- `packages/nana-pack/lib/memory-shaping-config.mjs` and `apps/bench/lib/anatomy-config.mjs`: sealed values with
  provenance; a prompt sealed by SHA-256 (R-3268's pattern). New values go in `anatomy-config.mjs`.
- `apps/bench/lib/anatomy-measures.mjs` `normalize`: the dedup key. Export it and import it in the label module (a
  helper's second caller imports it, ruling 2026-10-22). Part 2 extends `agreement`/`pair` and `drawSample`;
  `catch-stats.mjs` `cohensKappa`/`seededSample` stay the only arithmetic and the shuffle.
- `apps/bench/lib/anatomy.mjs` `runAnatomy` and `privateFolder` guard: the new writer follows the same refusals. The
  append writer is new: exclusive create of the file at start, then append with mode 0600.
- Resume: `apps/bench/lib/plan.mjs` (resume over an existing results file, refusing a mixed measurement by its
  fingerprint). Follow its refuse-on-changed-fingerprint rule for the manifest.
- `packages/nana-pack/tests/memory-shaping.test.mjs`: fake runner, cap and unknown-usage cases.
  `apps/bench/test/anatomy.test.mjs`: synthetic context fixtures and the CLI harness.
- The sealed system prompt: the definitions text labellers A and B used (`guide.md` in the private sheet folder; it
  holds only the public `DEFINITIONS` table). The seat pastes its wording into the build brief; the prompt is built
  from `DEFINITIONS`, never a second copy of the table, with the output line changed to the JSON reply.

## Outside precedent

Argilla (Apache-2.0), skip: an annotation server with model pre-labels; this lane needs a small CLI over an existing
runner and kappa code. Also looked at: scikit-learn `cohen_kappa_score` (BSD-3), skip, `catch-stats.mjs` has it.

## Must-meet

Tests live in a new `apps/bench/test/anatomy-labels.test.mjs`, each with its `req:` marker. No test calls a model.
Existing R-3270 to R-3278 tests pass unchanged.

### Part 1 (this lane): R-3390 to R-3398

- T1 (R-3390) Each distinct text is labelled once. WHEN `label` runs, it shall send each distinct normalized
  non-oversize unit text to the runner exactly once, with cwd and branch replaced, and write one label row per key.
  Fixture: one text in three builds with different cwd and branch, one oversize unit, two other texts. Pins: the fake
  runner receives 3 items in total, none holding a fixture cwd; the oversize text never reaches it; the labels file
  has 3 rows.
- T2 (R-3391) Spend stays inside the caps. WHEN `label` batches units, it shall keep each call within the configured
  unit and char limits, charge each unknown-usage call the configured charge, start no call once the charged total
  reaches the cap, count the rest `unsent`, and print a counts-only progress line every configured number of calls.
  Pins: no call exceeds either limit (names imported); usage that crosses the cap after call 1 leaves calls 1 and the
  rest `unsent`; null usage on every call stops at `ceil(cap / charge)` calls and prints `tokens >=` and `cost unknown`;
  the progress line appears at the configured interval with calls, labelled, unclassified and tokens.
- T3 (R-3392) Bad replies never become labels. WHEN a reply has a missing, extra or duplicate id, an off-vocabulary
  label, or is not JSON, `label` shall count that batch's units `unclassified` and write no row for them, while a valid
  batch in the same run writes its rows. Pins each of the four bad shapes.
- T4 (R-3393) Text and keys stay private. `label` shall refuse an output folder inside a git checkout, at a
  final-component symlink or not empty before any model call, and shall print no unit text and no key. Pins: on each
  refusal the fake runner has 0 calls and the exit is 1 with the fixed reason. A sentinel in every unit, a fake reply
  (good and bad) that echoes it, and a fake runner that throws an Error holding it: the sentinel appears in no stdout
  or stderr and not in `labels.jsonl` or the manifest; no key string appears in stdout or stderr; stdout names the
  model and the prompt hash.
- T5 (R-3394) A killed or capped run resumes. WHEN `label --resume` reads a folder whose manifest matches, it shall
  send only keys without a label row and append their rows. Pins: a run capped after call 1, resumed with a larger
  fake cap, sends only the unsent keys and ends with each key exactly once; rows written before a simulated kill
  (a fake runner that throws on call 2 and exits) survive.
- T6 (R-3395) A changed labeller cannot resume. WHEN the manifest's model or prompt hash differs from the sealed
  values, `label --resume` shall exit 1 with a fixed reason and make no call. Pins both fields, 0 calls each.
- T7 (R-3396) A failing endpoint stops the run. WHEN the configured number of calls in a row fail, `label` shall stop
  and count the remaining units `unsent`. Pins: three null-usage failures in a row with ten batches queued give calls
  3 and the other seven batches' units `unsent`; a success between failures resets the count.
- Seal (R-3397). `LABEL_MODEL` shall be `claude-sonnet-5` (chosen 2026-11-01, plan question 1: cheapest Claude, the
  family that met the bar as labeller A). The test fails naming this row on a retune.
- Seal (R-3398). The label system prompt shall have SHA-256 `<computed by the builder at build 1>` (contract: the
  measurement's bars are pre-registered against this prompt). The test fails naming this row on any edit.

### Part 2 (next lane, `anatomy-label-check`): R-3399 to R-3404

- T8 (R-3399) Model labels are checked against both labellers. WHEN `agree` runs with `--model`, it shall add model:a,
  model:b and model:consensus pairs with per-function κ and counts, print the manifest's model and prompt hash, and
  refuse naming the count when a sheet id's key has no label. Pins: a sheet row whose text differs from its key's
  representative only by cwd or branch receives the representative's model label (attack N1); a missing key exits 1
  with `model labels missing: <n>`; the existing three pairs are unchanged.
- T9 (R-3400) Heavy keys are weighted. WHEN `agree --model` runs, it shall print occurrence-weighted and
  occurrence×char-weighted agreement for model:consensus and model:b. Pins: one key with 50 occurrences and nine with
  one; mislabelling the heavy key drops both weighted agreements below the unweighted one.
- T10 (R-3401) Rare and heavy sheets. WHEN `sample` runs with `--labels`, it shall draw distinct keys only, with at
  least the configured minimum per function by model label and by rule label (or all available), deterministic and
  blind, and print its size; with `--heavy` it shall write every key at or above the configured occurrence weight.
  Pins: no two rows share a key; minima met on both sources; size is `max(n, minima picked)` and prints (attack S7);
  `--heavy` rows equal the keys at or above the threshold; rows hold only `id` and `text`.
- T11 (R-3402) Report gives both share views from model labels. WHEN `report` runs with `--labels`, it shall count
  every occurrence under its key's model label, count missing keys as `unlabelled`, and print shares per occurrence
  and per distinct text. Pins: a three-occurrence key labelled `task` gives task 3 units per occurrence and 1 per
  distinct text; a missing key lands in `unlabelled`, never in `unsorted` or a function; each share table sums to 100.
- T12 (R-3403) Every report reader follows the labels. Under `--labels`, `zeroSupply`, each build's `functions` and
  the per-part tables shall use model labels, and `pulls.byFunction` shall be marked rule-mapped (attack S5). Pins
  one zero-supply row and one build's functions on the fixture, and the mark.
- T13 (R-3404) Context-dependent units are counted. `report --labels` shall print counts-only lines for keys spanning
  more than one part and for units below a configured short length (chosen `LABEL_SHORT_CHARS` 40), occurrences and
  chars (attack S3). Pins both lines on the fixture.

Expected changes outside the new files (a forecast, not a limit):
- Part 1: `apps/bench/lib/anatomy-measures.mjs` (export `normalize` only); `apps/bench/lib/anatomy.mjs` (subcommand,
  options, injected runner, append writer); `apps/bench/anatomy.mjs` (builds the runner; its header purpose loses
  "zero-spend"); `apps/bench/lib/anatomy-config.mjs` (new values with provenance); `REQUIREMENTS.md` (rows, A-098,
  CAP-08 lines); `apps/bench/README.md` (the anatomy heading and the layout line say "no spend"; both change, and
  every new command must run as written); maps and requirements outline regenerated.
- Part 2: `anatomy-measures.mjs`, `anatomy.mjs`, the README, and the FEAT-042 known-bug file (seat, step 8).
- map:impact: the anatomy modules' callers are only `apps/bench/anatomy.mjs` and `apps/bench/test/anatomy.test.mjs`.
  No checker greps the "zero spend" wording (searched tests and checkers).

## Seat measurement

Part 1, after build 1 and before its review brief:
1. Canary: `label` on a synthetic three-unit store through the real runner, one call. Pass: 3 labels, 0 unclassified.
   Count files under `~/.claude/projects` before and after; pass when the count is unchanged (attack N6).
2. Start the full run once Part 1 lands: `label --in ~/nana-memory-runs/anatomy-2026-11-01 --out <new private
   folder>`, in the background, with a failure watcher and a heartbeat on the progress line (ruling 2026-10-15).
   Resume with `--resume` after any stop. Pass: `unclassified` plus `unsent` at most 1% of distinct units after
   resumes. Above that, Part 2's brief fixes the cause; nobody reads shares.

Part 2, after its build 1 and before its review brief, in this order. All bars are fixed here, before any share is
read. Counts only enter the lane folder, after the identity scan. Labeller A is a Claude Code subagent on Opus, never
`LABEL_MODEL`; labeller B is the roster's pi land model (see A1). Each sees only the definitions and a blind sheet.

3. Fixed check set: `agree --model` over builder-anatomy's second sheet (150 units, 132 consensus). The builders of
   both parts never read the filled sheets.
4. Heavy-key set: `sample --heavy` (283 keys today), labelled by A and B; `agree --model` prints weighted agreement.
5. Rare functions: `sample --labels --seed anatomy-labeller-2026-11-01` (up to about 300 rows when supply allows),
   labelled by A and B; `agree --model`.
6. Bars (attack M1, M2, S1):
   - Overall pass: on step 3, model:consensus κ at least 0.6 and model:b κ at least 0.7 (chosen: A:B scored 0.86;
     0.7 is about three standard errors below at n 150).
   - Per function, on steps 3 and 5 pooled per function: the same two clauses. At count 30 or more the mark is
     "reliable"; at 10 to 29 it is "indicative"; below 10 it is "unmeasured". The count prints beside each κ.
   - Weighted: on step 4, occurrence-weighted and occurrence×char-weighted agreement at least 0.85 for both
     model:consensus and model:b (chosen: A:B char agreement was 0.96 on sheet 2; 0.85 leaves room for honest
     disagreement while catching a few heavy errors). A function's share is a finding only when the overall and
     weighted bars pass and its own mark is reliable; otherwise the share prints with the disputed heavy weight in that
     function beside it.
   - Fail: no share is reported as a finding, and the owner gets a decision point. Any recheck after a prompt or
     model change uses a fresh seeded sheet labelled by A and B; sheet 2 and this lane's sheets stay the first
     prompt's results (attack S2).
7. Only then `report --labels` into `labeller-counts.md`: both share views, overall and per part, with each mark and
   its count, the denominator named under each table (attack N7), `unlabelled`, the context-dependent lines, calls,
   tokens and cost, and whether cost is notional under subscription auth (attack N5). The file states that shares
   are blind-text functions. It notes that labeller A's subagent transcripts persist under `~/.claude/projects`,
   outside git, as in builder-anatomy (attack N6).
8. When the bars pass, the seat removes the two FEAT-042 known-bug lines they answer (rule shares are not findings;
   rare functions unmeasured) in Part 2's reviewed change before its final round.

## Cost and runtime

Inferred estimate, not measured on this store:
- Label run: 2.76M chars of distinct non-oversize text, about 690k input tokens; about 280 calls; per-call overhead
  about 1.6k tokens (memory-shaper's synthetic canary: 1,839 tokens for two units), about 450k; output about 130k plus
  low-effort thinking. Total about 1.3M tokens. At the canary's blended rate (about USD 4.35 a million), about USD 6;
  range USD 5 to 15.
- Cap: 2.5M charged tokens, near USD 11 at the same rate. Unknown usage is charged 20k tokens a call, so a hung
  endpoint stops after three failures in a row (at most about 15 minutes of 300-second timeouts).
- Runtime: 1.5 to 2.5 hours serial; a resume costs only the keys still missing.
- Check sheets: heavy set 283 keys, stratified up to about 300 rows, plus sheet 2 already labelled. Labeller A runs as
  a Claude Code subagent on Opus and labeller B through pi; together roughly 0.5M tokens, inferred under USD 5 at list
  prices, notional under subscription.

## Residuals

- FEAT-042 carry 1: `docs/reviews/builder-anatomy-2026-11-01/anatomy-counts.md` says the run was on build 1's tip
  `1ce8d664`. That holds for segment; the sample and agreement it reports ran on build 2's sampler. Part 2's
  `labeller-counts.md` states the correction and both tips (O8 is the alternative).
- FEAT-042 carry 2: the agree output behind the κ table is not committed, so the rules rows cannot be rechecked. The
  seat commits only the κ and count fields of `~/nana-memory-runs/anatomy-2026-11-01-sheet2/agree.json` as
  `builder-anatomy-agree.json`, and Part 2's agree outputs, into the lane folder after the identity scan. The older
  `agree.json` from the first, non-random draw is not committed (attack N8).
- Recall for a function that both the model and the rules miss stays unmeasured (A8).
- Labels are blind-text functions; a unit whose function changes with its place keeps one label. Part 2 prints the
  size of that residual (multi-part keys, short units) instead of fixing it.
- The three FEAT-042 assembly known bugs and the unmatched-brief line are untouched.
