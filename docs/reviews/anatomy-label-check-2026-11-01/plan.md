# Plan: anatomy-label-check (2026-11-01, revision 2 after plan-attack.md)

Lane `anatomy-label-check`, worktree `~/nana-pi-wt/anatomy-label-check`, branch `feat/anatomy-label-check`, base
`origin/main` `06287a95`. Part 2 of the builder-context labeller; Part 1 (`anatomy-labeller`) has landed.

Lane class: `ordinary`. `node scripts/lane-class.mjs --root . --files apps/bench/anatomy.mjs,apps/bench/lib/anatomy.mjs,apps/bench/lib/anatomy-config.mjs,apps/bench/lib/anatomy-measures.mjs,apps/bench/lib/anatomy-labels.mjs,apps/bench/test/anatomy-labels.test.mjs,REQUIREMENTS.md,apps/bench/README.md,docs/known-bugs/FEAT-042.md,docs/code-map.md,docs/requirements-tree.md`
prints `ordinary` (re-run for revision 2). One final reviewer, the roster's reviewer. No wrong-code pairs, no land
reviewer, no install check.

Stakes: low blast, reversible code (read-only readers over a private store, no spend in the code). The real harm is
interpretive: a share read as a finding before it passes the pre-registered bars, or private text or keys leaking into
git. The measurement order, the early-read guard and the privacy must-meet pin both.

IDs: FEAT-042 (extends it), rows R-3399 to R-3406, eight must-meets. `REQUIREMENTS.md` on the base has no row from
R-3399 to R-3409, and no tracked file outside `docs/reviews/anatomy-labeller-2026-11-01/` names one (grep,
2026-11-01). Part 1's note that R-3405 to R-3409 "stay unused" is superseded for R-3405 and R-3406; R-3407 to R-3409
stay unused. A-098's reader stays `apps/bench/lib/anatomy-labels.mjs` (see O1); its `Read by` lines do not change.

## Purpose

Agreed reading: the Part 1 plan of record (`docs/reviews/anatomy-labeller-2026-11-01/plan.md`), which the owner's
lane brief adopted, split the feature in two and assigned this part the readers:

> Label every distinct unit in the private segmented store once with a model, check those labels against the existing
> two-labeller consensus, a heavy-key check set and a stratified sample before any share is read, and let `report`
> give function shares from the model labels per occurrence and per distinct text.

Part 1 made the labels. The full private run has finished: every distinct unit carries a label, none unclassified or
unsent, after one resume past a cap stop. This lane makes the readers (`agree --model`, its pooled second pair,
`sample --labels`, `sample --labels --heavy`, `report --labels`), and the seat then runs the pre-registered
measurement (Part 1 plan, "Seat measurement", steps 3 to 8, restated below with every clause). The README line
"model-label readers come in a later slice" names this lane.

## Assumptions

- A1. The bars and the check set are fixed by the Part 1 plan and are not reopened. Labeller B is the roster's pi land
  model on every sheet. Labeller A differs by sheet: on builder-anatomy's sheet 2 it was a Claude Code subagent on
  Claude Sonnet, the same family as `LABEL_MODEL`, so step 3's model:a and model:consensus are not independent of the
  model; independence there rests on the model:b clause. On the new heavy and rare sheets labeller A is a Claude Code
  subagent on Opus. Pooled per-function rows mix the two A's. The counts file states this beside step 3 and the
  pooled rows. No bar changes.
- A2. A sheet row maps to its model label through its unit's key: SHA-256 of `normalize(text, context)`, the key
  `distinctUnits` computes. A row that differs from its key's representative by cwd, branch, list marker, emphasis or
  whitespace gets the representative's label (Part 1 attack N1).
- A3. Sheet 2 may hold oversize units (the old sampler did not exclude them), and oversize units have no model label
  by design (Part 1 A4). `agree --model` leaves an oversize sheet row out of the model pairs and prints how many it
  left out; it does not refuse. A non-oversize row with no label row still refuses (R-3399).
- A4. The new sheets hold one row per distinct key: the stored label row's unit id and the same blind text the label
  run sent. Only that unit's own cwd and branch are replaced, so another build's path or a home path inside the text
  still reaches labellers A and B, as it reached the model (Part 1 carry). Builder contexts had already gone to the
  builders' provider (Part 1 A1). Sheet 2 keeps its raw text; it is already labelled.
- A5. A key's rule label is its representative's rule label. Occurrences of one text can carry different rule labels
  under different headings; the rule-side minimum in `sample --labels` uses the representative only.
- A6. Weights are per distinct key. A key's occurrence weight is its count of non-oversize unit occurrences in the
  input store; its char weight is the length of its representative's blind text (what the model saw). Weighted
  agreement is Σ w·[x = y] / Σ w over the sheet's distinct keys; when several sheet rows share a key (sheet 2), the
  row with the lowest id stands for it. Unweighted κ stays per row, as Part 1's bars were set.
- A7. Readers are read-only. They `lstat` both files, never `chmod`, never repair or rewrite, and refuse: a missing,
  symlinked or non-regular file; a torn tail; a non-empty line that does not parse (anywhere, not only the tail); a
  duplicate key; an off-vocabulary label; a key not in the input store's key set; a stored id that no longer maps to
  its key; and a manifest whose `contexts` or `distinctUnits` differs from the input store.
- A8. Without the new flags every existing output is byte-for-byte unchanged; R-3272 and R-3276 tests pass unchanged.
- A9. Pooling (R-3406) counts each key once across both sheet pairs; the first pair's row stands for an overlapping key,
  and the overlap count prints.
- A10. Texts that normalize to the empty string share one key. Readers leave that key out of the heavy sheet, the
  rare sheet, the weights and the distinct view, and print its occurrence count (`emptyNormalized`), as
  `reportContexts` already skips them.
- A11. `sample --labels` on a partial folder leaves keys with no label row out of the model strata and prints their
  count. `agree --model` refuses them (R-3399); `report --labels` puts them in `unlabelled`.

## Open choices

- O1. Where the shared pieces live. Default: move `distinctUnits` from `anatomy-labels.mjs` into
  `anatomy-measures.mjs` next to `normalize` (labels imports it; measures cannot import labels without a cycle), and
  add a read-only `readLabels(folder, contexts)` to `anatomy-labels.mjs`, which owns the store format and is already
  A-098's reader. Resume and the readers share only the per-row validation; the read-only path does not reuse
  `regularFile` (it chmods) or the resume rewrite. If the builder puts the file read in another module, that module's
  path joins A-098's `Read by` lines in FEAT-042 and CAP-08 (one line each, comma-separated).
- O2. Flags: `argsIn` takes value pairs only, so `--heavy` needs a boolean-flag list. Names stay as Part 1 wrote them,
  plus the pooled pair: `agree --model <folder> --a --b [--a2 <filled> --b2 <filled>]`, `sample --labels <folder>
  [--heavy]`, `report --labels <folder>`. The README says `--model` and `--labels` name the same folder.
- O3. JSON field names are the builder's; the README names each. Two fields are fixed in meaning: a provenance block
  (model, prompt hash, labels digest) on every reader, and on `report --labels` one field stating the shares are model
  labels and not findings until the bars pass.
- O4. The per-occurrence table keeps the `glue` row as `counts()` does today; the per-distinct table has no glue.
  Per-distinct chars are representative blind-text chars. Each table names its denominator in the output.
- O5. `sample --labels` draws over the representative unit ids, not the keys: `seededSample` orders by
  `sha256(seed|value)`, and the label queue ordered keys by the same seed, so a draw over keys would pick the
  first-labelled keys (attack M3). After the minima, it fills seed-ordered over the remaining ids until `n`.

## Questions for the owner

None. The bars and labellers were pre-registered in Part 1. A3, A4 and A6 are the closest calls; each is easy to undo
and changes no bar.

## Feature

Feature: FEAT-042 · Measure what a builder's context is for

Commands this lane adds:
```
node apps/bench/anatomy.mjs agree  --in <private-store> --a <filled-a> --b <filled-b> --model <labels-folder>
node apps/bench/anatomy.mjs agree  --in <private-store> --a <a> --b <b> --a2 <a2> --b2 <b2> --model <labels-folder>
node apps/bench/anatomy.mjs sample --in <private-store> --seed <seed> --labels <labels-folder> --out <private-sheet>
node apps/bench/anatomy.mjs sample --in <private-store> --labels <labels-folder> --heavy --out <private-sheet>
node apps/bench/anatomy.mjs report --in <private-store> --labels <labels-folder>
```

Requirements file: rows R-3399 to R-3406 under FEAT-042.

Notes this lane records (from Part 1's carry; the builder adds the five known-bug lines to
`docs/known-bugs/FEAT-042.md`, the seat puts the canary line in the counts file):
- `label --resume` repairs a torn tail by rewriting `labels.jsonl` in place, so a kill during the rewrite can lose rows.
- The effort and order-seed fingerprint refusals, and `--resume`'s checkout refusal, have no test.
- `label --resume` does not compare the input store's counts with the manifest.
- `label --resume` on a missing folder creates an empty folder before refusing.
- Only the unit's own worktree path is masked, so Part 1's A3 ("home-folder paths do not leave the machine")
  overclaims: another build's path or a home path in the text goes to the model.
- The seat's real-runner canary passed on 2026-11-01.

Early-read guard (attack S8): the build brief says the builder runs every reader on synthetic fixtures only, never on
the private store or the labels folder. The seat verifies build 1's `report --labels` on a synthetic store only, until
step 4's bars have printed, and says so in its report.

## Threat model

In scope, honest variation: sheets whose text differs from the representative by cwd, branch, list marker, emphasis or
whitespace; repeated keys in one sheet; a key in both sheet pairs; an oversize unit in a sheet; texts that normalize to
empty; a label folder from a different store, a partial run, a torn tail, a damaged middle row, a duplicate, unknown
or off-vocabulary row, a stale stored id, a missing or symlinked file; a key whose occurrences carry different rule
labels or sit in several parts; a function with fewer keys than the minimum on either side; CRLF stores; two labels
folders after a recheck.

Out of scope, deliberate forgery: hand-edited labels, manifest or store files made to pass the checks; forged filled
sheets; a labeller that copies another's sheet. A finding outside this model is a residual.

Privacy: readers print counts, κ, weights and the provenance block (manifest model, prompt hash, SHA-256 of
`labels.jsonl`), nothing else. The digest covers the whole file and cannot be reversed to a text. No unit text and no
key reaches stdout, stderr or a committed file. Sheets go only to a guarded private folder. Tests use synthetic
fixtures; no test reads the real store or calls a model.

## Precedent

- `apps/bench/lib/anatomy-measures.mjs` `agreement`, `pair`, `sheet`: extend for the model pairs, weights, disputed
  weight and the pooled block. Keep `catch-stats.mjs` `cohensKappa` as the only κ arithmetic. map:search ranked
  measures and `catch-stats.mjs` for weighted agreement; neither has a weighted proportion, so it is new and small.
- `apps/bench/lib/anatomy-measures.mjs` `drawSample` and `catch-stats.mjs` `seededSample`: the minima-then-fill
  pattern for both new sheets, drawn over ids (O5); rows stay `{ id, text }`, sorted by id.
- `apps/bench/lib/anatomy-measures.mjs` `reportContexts` and `counts`: `report --labels` is a pure transform of the
  contexts (each non-oversize unit's `label` replaced by its key's model label or `unlabelled`) before
  `reportContexts`, so `zeroSupply`, `builds[].functions` and the part tables follow (Part 1 O6, attack S5). The label
  list takes `unlabelled` only under the flag (A8).
- `apps/bench/lib/anatomy-labels.mjs` `distinctUnits` and the resume block's per-row checks: the key, the blind text and
  the row validation. The second caller imports them (ruling 2026-10-22); O1 names the move of `distinctUnits`.
- `apps/bench/lib/plan.mjs` `readJsonl` with `repair: false`: do not rely on it alone. It returns no rows for a missing
  file and skips an unparsable middle line silently; the reader compares parsed rows with non-empty lines and refuses.
- `apps/bench/lib/anatomy.mjs` `runAnatomy`, `argsIn`, `privateFolder` guard and the fixed-reason catch: new options,
  the boolean flag and new fixed reasons (`model labels missing: <n>`, `label store mismatch`, `invalid labels`) go here.
- `packages/nana-pack/lib/outcome-score.mjs` `readOutcomeRows`/`scoreOutcomes`: found by map:search; a reader that
  scores labelled rows without exposing evidence text. Follow its counts-only shape; do not import it.
- `apps/bench/test/anatomy-labels.test.mjs` and `apps/bench/test/anatomy.test.mjs`: synthetic stores, the CLI harness,
  sentinel-privacy assertions. New tests go in `anatomy-labels.test.mjs`.

## Outside precedent

scikit-learn `cohen_kappa_score` (BSD-3-Clause), skip: its `sample_weight` gives weighted κ, but the bar is a weighted
proportion and `catch-stats.mjs` already holds κ. Also looked at: Argilla (Apache-2.0), skip, an annotation server.

## Must-meet

Eight tests in `apps/bench/test/anatomy-labels.test.mjs`, each with its `req:` marker. No test calls a model. Existing
R-3270 to R-3278 and R-3390 to R-3398 tests pass unchanged. Every threshold below is imported by name except in a
seal, and every threshold has a fixture at the value and one step below it.

- T1 (R-3399) Model labels are checked against both labellers. WHEN `agree` runs with `--model`, it shall add
  model:a, model:b and model:consensus pairs with per-function κ and counts, print each model pair's distinct-key
  count beside its row count, leave oversize rows out and count them, and print the provenance block. Proves the
  step-3 check can run on sheet 2. Pins: one row differing from its representative by cwd and branch, and one by a
  list marker and emphasis, both get the representative's label; one oversize row is left out and counted 1; two rows
  sharing a key give distinct-key count one less than rows; a non-oversize row with no label row exits 1 with
  `anatomy: model labels missing: 1`; the three existing pairs deep-equal the output without `--model`.
- T2 (R-3400) Heavy keys are weighted, and disputed weight is shown. WHEN `agree --model` runs, it shall print
  occurrence-weighted and occurrence×char-weighted agreement per distinct key for model:consensus and model:b, and per
  function the occurrence and occurrence×char weight of keys where A≠B and where model≠B, plus the weight left out of
  model:consensus. Proves step 4's bar and Part 1's "disputed heavy weight beside the share" are computable. Pins on
  one key with 50 occurrences and a different text length from nine one-occurrence keys: the model wrong only on the
  heavy key gives unweighted 0.9 and an occurrence×char fraction distinct from both the occurrence-only and char-only
  fractions, matched exactly; the heavy key listed twice in the sheet weighs once; a heavy key where A≠B shows its
  weight in the disputed and left-out lines.
- T3 (R-3401) Rare and heavy sheets. WHEN `sample` runs with `--labels`, it shall draw over representative ids, one
  row per distinct key, at least 15 per label by model label and separately by rule label (or all available),
  deterministic for a seed, and print its size and the unlabelled-key count; with `--heavy` it shall write every key
  with at least 60 occurrences. Proves steps 4 and 5 get the right sheets. Pins: a function rare by rule label but
  common by model label, and the reverse, each meets its minimum through keys whose other label differs; one function
  short on each side gives all available; the drawn keys are not the first keys of the label run's order on the
  fixture; no two rows share a key; two runs with one seed are byte-identical; size is `max(n, minima picked)`;
  `--heavy` includes a key at exactly 60 and excludes one at 59; the empty-normalized key is in neither sheet; rows
  hold only `id` and blind `text` from the stored id's unit.
- T4 (R-3402) Report gives both share views from model labels. WHEN `report` runs with `--labels`, it shall count
  every non-oversize occurrence under its key's model label, count a key with no label row as `unlabelled`, print
  shares per occurrence and per distinct text overall and per part, each with its denominator named, and print the
  provenance block and the not-a-finding field. Pins: a three-occurrence key labelled `task` and present in two parts
  gives overall task 3 per occurrence and 1 per distinct; per part, distinct counts keys present in that part, so the
  two part rows sum to 2 above the overall 1; a missing key lands in `unlabelled`, never in `unsorted` or a function;
  each table's units equal its denominator; `report` without `--labels` deep-equals today's output.
- T5 (R-3403) Every report reader follows the labels. Under `--labels`, `zeroSupply`, each build's `functions` and the
  per-part tables shall use model labels, and `pulls.byFunction` shall carry a mark that its functions come from
  target rules while its pushed chars come from model labels. Pins on a fixture where the rule says `lessons` and the
  model says `task`: the build's `functions.task.units`, one zero-supply row, one part table, and the mark present
  only under the flag.
- T6 (R-3404) Context-dependent units are counted. `report --labels` shall print counts-only lines for keys spanning
  more than one part and for occurrences under 40 raw chars (keys, occurrences, raw chars), and the empty-normalized
  occurrence count. Proves the blind-text residual has a size (Part 1 attack S3). Pins both lines, a unit at exactly 40
  chars outside and one at 39 inside, and the empty-normalized count.
- T7 (R-3405) Readers stay private and read-only, and refuse a foreign or damaged store. WHEN `agree --model`,
  `sample --labels` or `report --labels` reads a labels folder, it shall refuse every case in A7 with a fixed reason
  (`anatomy: label store mismatch` for the counts, unknown key and stale id; `anatomy: invalid labels` for the rest),
  leave every file's bytes, mode and mtime and the folder listing unchanged on every run including each refusal, and
  print no unit text and no key. Pins: each refusal exits 1 with its reason, including a bad middle line, a missing
  `labels.jsonl` and a torn tail; a 0644 `labels.jsonl` stays 0644 (POSIX); a sentinel in every unit and every key
  string appear in no stdout or stderr across the three readers; the printed digest equals the SHA-256 of the file.
- T8 (R-3406) Per-function agreement pools two sheets. WHEN `agree --model` runs with `--a2` and `--b2`, it shall print
  a pooled block per label with its distinct-key count and model:consensus and model:b κ, counting each key once
  across both pairs, printing every label whatever its count, and printing the overlap count. Proves the "reliable"
  mark (count ≥ 30 pooled) comes from printed output, not hand pooling (attack M1). Pins: a function with 8 keys on
  the first pair and 25 on the second, one shared, prints pooled count 32 and overlap 1; neither single-pair output
  reaches 30; the pooled κ equals `cohensKappa` over the deduplicated rows.
- Seals: `LABEL_SAMPLE_MIN` 15 and `LABEL_HEAVY_MIN` 60 under R-3401, `LABEL_SHORT_CHARS` 40 under R-3404 (chosen
  2026-11-01 in the Part 1 plan, O7 and T13; the bars are pre-registered against them). Each has one seal test that
  fails naming its row.

If a later finding adds a must-meet past eight, split T8 and the pooled flags into a follow-up lane (`anatomy-label-pool`,
rows R-3407 on), and have the seat pool steps 3 and 5 from a one-off private script for this measurement only.

Expected changes (a forecast, not a limit): `anatomy-measures.mjs`, `anatomy-labels.mjs` (read-only reader,
`distinctUnits` move), `anatomy.mjs` (options, flag, reasons), `anatomy-config.mjs` (three values with provenance), the
bin's header `@inputs`, the README anatomy section (new commands, same-folder note, the "later slice" line goes, the
layout line), `REQUIREMENTS.md` (rows R-3399 to R-3406), `docs/known-bugs/FEAT-042.md` (five carry lines), map and tree
regenerated. map:impact: callers of the three modules are only the bin and the two anatomy test files.

## Seat measurement

After build 1 and before the review brief, in this order. All bars are Part 1's, fixed before any share is read. Counts
enter the lane folder only after the identity scan. Labeller A and labeller B each see only the definitions and a
blind sheet (A1 names which A on which sheet). The builder never reads a filled sheet. Labeller A's subagent
transcripts persist under `~/.claude/projects`, outside git, as in builder-anatomy; the counts file says so.

0. Store check (attack S10): before step 2, compare the heavy sheet's size, the spanning-keys line and the manifest's
   distinct count with Part 1's jq figures for this store. Stop on a difference the seat cannot explain.
1. Step 3, fixed check set: `agree --model` over builder-anatomy's second sheet.
2. Step 4, heavy set: `sample --labels --heavy`, labelled by A and B; `agree --model`.
3. Step 5, rare functions: `sample --labels --seed anatomy-labeller-2026-11-01`, labelled by A and B; then
   `agree --model` with sheet 2 as the first pair and the rare sheet as `--a2`/`--b2` for the pooled block.
4. Step 6, bars: overall model:consensus κ ≥ 0.6 and model:b κ ≥ 0.7 on step 3; the same two clauses per function
   from the pooled block, marked reliable at count ≥ 30, indicative at 10 to 29, unmeasured below 10; weighted
   agreement ≥ 0.85 for model:consensus and model:b on step 4. A function's share is a finding only when the overall
   and weighted bars pass and its own mark is reliable; otherwise the share prints with the disputed heavy weight in
   that function beside it. On a fail, no share is a finding and the owner gets a decision point. Any recheck after a
   prompt or model change uses a fresh seeded sheet labelled by A and B, and a new labels folder; sheet 2 and this
   lane's sheets stay the first prompt's results.
5. Step 7: only then `report --labels` on the real store into `labeller-counts.md`: both share views overall and per
   part, each mark and count, disputed weights, denominators, `unlabelled`, the context-dependent and empty-normalized
   lines, the provenance block (the same model, prompt hash and digest as steps 1 to 3), the label run's calls, tokens
   and cost (notional under subscription), the pooled overlap, that shares are blind-text functions, the A1 labeller
   note, the canary line, and Part 1's two carries (the build-1 tip correction for the earlier counts file; the κ and
   count fields of sheet 2's agree output committed as `builder-anatomy-agree.json`).
6. Step 8: when the bars pass, the seat removes the two FEAT-042 known-bug lines they answer, in this lane's reviewed
   change before its final round.

Cost: the label run's spend is already sunk. The check sheets are inferred under USD 5 at list prices (Part 1 plan),
notional under subscription.

## Attack disposition

- M1 taken: T8 (R-3406), pooled pair `--a2`/`--b2`, keys counted once, overlap printed.
- M2 taken: T2 prints disputed and left-out weight per function; step 6 restores the clause.
- M3 taken: O5 draws over representative ids; T3 pins that the draw is not the label order's head.
- M4 taken: T2's heavy key has a different length; the product is pinned against both alternatives; chars named in A6.
- M5 taken: T3's fixture splits rule and model rarity both ways and has a short function on each side.
- S1 taken: A1 rewritten; the counts file states the labeller per sheet.
- S2 taken: A6 weights per distinct key; T2 pins a repeated key weighing once.
- S3 taken: provenance block on every reader, the not-a-finding field on `report`, step 7 checks they match.
- S4 taken: A7 and T7 cover chmod, mode, mtime, listing, bad middle line and missing file.
- S5 taken: unknown keys and stale stored ids refuse (A7, T7); sheets use the stored id's unit (A4, T3).
- S6 taken: T4's key spans two parts; per-part distinct is defined and pinned; per-distinct chars named in O4.
- S7 taken: T1 adds a list-marker-and-emphasis row.
- S8 taken: early-read guard under Feature.
- S9 taken: boundary fixtures in T3 and T6; T6 chars are raw occurrence chars.
- S10 taken: seat step 0.
- N1 taken: A4 restated.
- N2 taken: recheck clause and transcript note restored in the seat steps.
- N3 taken: the IDs line says the Part 1 reservation is superseded for R-3405 and R-3406.
- N4 taken: O1 keeps the reader in A-098's listed module and names the rule if it moves.
- N5 taken: A10, pinned in T3 and T6.
- N6 rejected: a residual. Unknown parts already collapse to `extra-section` in every existing report; changing that
  changes R-3272's output.
- N7 taken: T5's mark covers the rule-function and model-chars pairing.
- N8 taken: T1 prints distinct-key counts beside row counts.
- N9 taken: A11, pinned in T3.
- N10 taken: O2, README note.

## Residuals

- Recall for a function both the model and the rules miss stays unmeasured (Part 1 A8).
- A unit whose function changes with its place keeps one label; T6 prints the size, nothing fixes it.
- A5 (representative rule label) and the sheet-2 Sonnet labeller A are approximations the counts file names.
- Keys spanning two unknown parts count as one part (N6).
- Part 1's five carried known bugs stay open; this lane only records them.
- The three FEAT-042 assembly known bugs and the unmatched-brief line are untouched.
