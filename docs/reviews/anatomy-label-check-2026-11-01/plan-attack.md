# Plan attack: anatomy-label-check (2026-11-01)

One adversary over `plan.md` in this folder. Grounding read: the Part 1 plan (`docs/reviews/anatomy-labeller-2026-11-01/plan.md`,
Seat measurement and Part 2 must-meets), `apps/bench/lib/anatomy*.mjs`, `apps/bench/lib/catch-stats.mjs` `seededSample`,
`apps/bench/lib/plan.mjs` `readJsonl`, `apps/bench/README.md`, `docs/known-bugs/FEAT-042.md`,
`docs/reviews/builder-anatomy-2026-11-01/anatomy-counts.md` (labeller identities), `scripts/deliverables.mjs`. The private
store and labels folder were not read. Threat model as the plan states: honest variation in, forgery out.

## MUST

- **M1. The per-function bar has no tool that computes it.** Plan line 201-202 (step 6: "the same per function on
  steps 3 and 5 pooled") and A9 (line 56). `agree` takes one `--a`/`--b` pair and `pair()` prints only per-function κ
  and count, and drops a function below `KAPPA_MIN_COUNT`. Two κ values cannot be pooled, so the seat would pool by
  hand or concatenate sheets. Concatenation fails: `sheet()` throws `invalid label sheet` on a duplicate id, and a
  rare-sheet row is the key's representative id, which can also be a sheet 2 row (A9's overlap, same id). Sheet 2's A
  fill and the rare sheet's A fill are also different models (see S1). Concrete failure: a function with 8 rows on
  sheet 2 (not printed) and 25 on the rare sheet cannot be pooled to 33 "reliable" from any printed output, so the
  "reliable" mark is hand-made. Fix: let `agree --model` take repeated sheet pairs (or a second `--a2/--b2` pair) and
  print a pooled per-function block from the raw per-row pairs, with a stated rule for the A9 overlap (count once by
  key, or keep both and print the overlap). Add one must-meet that pins a pooled count crossing 30 from two sheets
  where neither sheet alone reaches it.

- **M2. The restated bars drop a Part 1 clause.** Plan line 203-204 says the bars are restated "without change", but
  Part 1 step 6 also says: "otherwise the share prints with the disputed heavy weight in that function beside it".
  No must-meet computes a per-function disputed weight, and model:consensus on the heavy sheet silently drops every key
  where A and B disagree, so a heavy disputed key leaves the weighted bar's denominator altogether. Concrete failure:
  one 600-occurrence preamble key on which A and B split passes the model:consensus weighted bar by absence, and the
  counts file has no number to print beside the share. Fix: restore the clause in step 4, and have T2 also print per
  function the occurrence and occurrence×char weight of keys where A≠B (and where model≠B), plus the weight excluded
  from model:consensus. Pin it on the T2 fixture.

- **M3. The rare sheet reuses the label run's order, so it checks the first-labelled keys.** Plan line 200 (step 5
  seed `anatomy-labeller-2026-11-01`), O5 (line 71) and T3. That string is `LABEL_ORDER_SEED`. The label queue is
  `seededSample(keys, …, LABEL_ORDER_SEED, { seedOrder: true })`, which sorts by `sha256(seed|key)`; `seededSample(keys,
  k, seed)` takes the first k by the same hash. If `sample --labels` samples keys (the plan says "distinct keys only"),
  each stratum's picks and the fill are exactly the earliest-labelled keys of that stratum. The full run stopped at the
  cap once and resumed, so the check set leans to the pre-stop batches and may hold none of the resumed ones. Fix: draw
  over the representative ids, or salt the hash input (for example `seed|sample|<key>`) inside the sampler, keeping the
  pre-registered seed string. Add a T3 pin: on a fixture, the drawn keys are not the first k of the label order.

- **M4. T2 passes with the char factor missing.** Plan line 153-156. If every fixture unit has the same length,
  occurrence-weighted and occurrence×char-weighted agreement are the same fraction, so an implementation that drops the
  char factor, or uses chars alone, still meets "exact fractions". Fix: give the heavy key a different length from the
  nine others, so the three candidates (occurrences, chars, occurrences×chars) give three different fractions, and
  pin the product. Also say which chars: the representative's blind text, the sheet row's raw text, or the sum over
  occurrences (cwd differs per build, so these differ). See S2.

- **M5. T3 passes with the rule-label minimum missing.** Plan line 157-162 and A5. If the fixture's rule labels match
  its model labels, an implementation that draws minima on model labels only meets "both minima met". Fix: build the
  fixture so at least one function is rare by rule label but common or absent by model label (and the reverse), and
  pin that the rule-side minimum is met by keys whose model label differs. Include one function with fewer keys than
  `LABEL_SAMPLE_MIN` on each side to pin "or all available".

## SHOULD

- **S1. A1 misstates labeller A on the fixed check set.** Plan line 34-35. Builder-anatomy's counts file says sheet 2's
  labeller A was a Claude Code subagent on Claude Sonnet, the same family and likely the same model as `LABEL_MODEL`
  (`claude-sonnet-5`). So step 3's model:a and model:consensus are not independent of the model, and per-function
  pooling (M1) mixes a Sonnet A on sheet 2 with an Opus A on the rare sheet. Part 1's question named this; the
  model:b clause is what carries independence. Fix: correct A1 to say Opus applies to the new sheets only, and have
  the counts file state it beside step 3 and the pooled rows. No bar changes.

- **S2. Weighted agreement double-counts on sheets with repeated keys.** A6 (line 49-51), T2. Sheet 2 is a draw by
  unit, and 44 keys sit in every build, so several sheet 2 rows share a key. Weighting each row by its key's full
  occurrence count counts that key once per row. T2 prints weighted agreement on every `agree --model` run, so sheet 2's
  output carries a wrong number beside the right ones. Fix: compute weights over distinct keys (one weight per key,
  label from the row), or print weighted agreement only when the sheet's rows are distinct keys and say so.

- **S3. Shares are not tied to the labels that were checked.** Privacy line 112, T4 (line 163-168). `agree --model`
  prints the manifest's model and prompt hash; `report --labels` is not required to. After a fail and a recheck (Part 1
  S2), two labels folders exist, and nothing shows that the counts file's shares came from the folder the agree runs
  checked. Fix: every reader prints the manifest model, prompt hash and a SHA-256 of `labels.jsonl` (a digest of keys
  and labels, not reversible to text); the counts file states the three agree with the step 1-3 runs. Also give
  `report --labels` output one fixed field that says the shares are model labels and not findings on their own.

- **S4. T7's read-only pin checks bytes only, and the named precedent drops rows silently.** A7 (line 52-54), line
  129, T7 (line 176-181). Two concrete wrong readers pass: one that reuses `regularFile` (it `chmod`s to 0600), and one
  that reuses the resume block, which rewrites the file whenever it is not clean. `readJsonl` also returns empty rows
  for a missing file and skips an unparsable middle line without a signal, so a reader built on it turns a damaged row
  into `unlabelled` or `model labels missing: 1` instead of a refusal. Fix: T7 also asserts each file's mode and mtime
  and the folder listing before and after, including on the torn-tail refusal case; the reader `lstat`s both files
  first and refuses when parsed rows are fewer than non-empty lines. Add the mid-file bad line to the refusal list.

- **S5. The count check lets stale label rows through.** A2/A4 (line 37-46), A7. The manifest holds only `contexts` and
  `distinctUnits` counts. A label row whose key is not in the store, or whose stored `id` is not the representative
  `distinctUnits` now picks, is accepted. The second case changes A4's promise: the sheet would show a different
  representative's text from the one the model saw. Fix: refuse a label row whose key is not in the store's key set,
  and build sheets from the stored id's unit (refuse if that id no longer maps to its key). Pin both in T7.

- **S6. Per-distinct counting across parts is undefined and unpinned.** T4 (line 163-168), step 5 (line 205: "both
  share views overall and per part"). T4's three-occurrence key may sit in one part, so a per-distinct count of (key,
  part) pairs passes. The per-part per-distinct view the counts file needs has no must-meet, and a key in two parts is
  either counted in both (parts sum above overall) or assigned somewhere. Fix: put T4's key in two parts and pin overall
  distinct 1; define per-part distinct as "keys present in the part", name that the part rows can sum above the overall,
  and pin it. Also name which chars the per-distinct char share uses.

- **S7. T1's lookup pin does not catch a key built from the sent text.** T1 (line 150). An implementation that keys by
  `sha256` of the cwd/branch-replaced text (what `distinctUnits` sent) passes the cwd/branch case but not a row that
  differs only by a list marker, emphasis or whitespace. Fix: add a row differing by a list marker and emphasis to the
  same pin.

- **S8. Nothing stops an early read of real shares.** Seat measurement (line 194-196) and step 5 (line 205). The seat
  rule says to look at every command output the change produces after build 1, and `report --labels` on the real store
  is the natural check. The brief also does not forbid the builder from running readers on the private store or labels
  folder. Fix: the brief says the builder runs readers on synthetic fixtures only; the seat verifies `report --labels`
  on a synthetic store until step 4's bars pass, and says so in the report.

- **S9. Thresholds lack boundary fixtures.** T3 (`--heavy`, line 159-161) and T6 (line 173-175). A `>` for `>=` at
  `LABEL_HEAVY_MIN` and a `<=` for `<` at `LABEL_SHORT_CHARS` both pass unless the fixture has a key at exactly the
  threshold and one just below, built from the imported names. Also say whether "chars" in T6 is the raw occurrence or
  the blind text. Fix: add both boundaries to the fixtures.

- **S10. The seat has known store numbers to compare against and does not use them.** Seat measurement steps 1-3. Part 1
  measured 283 keys at 60 or more occurrences, 56 keys spanning more than one part, and 11,019 distinct non-oversize
  texts. A reader whose occurrence count differs from the jq aggregation (for example, empty normalized texts, see N5)
  would show here first. Fix: before step 2, the seat compares the heavy sheet size, the spanning-keys line and the
  manifest's distinct count with those numbers and stops on a mismatch it cannot explain.

## NOTE

- **N1.** A4 (line 45-46) says home paths do not go to labeller B's provider. The carried known bug (line 98-99) says
  only the unit's own worktree path is masked. Restate A4 the same way; Part 1 A1 notes the builder contexts already
  went to the builders' provider.
- **N2.** Step 4-5 also omit Part 1's recheck clause (a recheck after a prompt or model change uses a fresh seeded sheet)
  and the note that labeller A's subagent transcripts persist under `~/.claude/projects`. Restore both.
- **N3.** Part 1's plan says "Rows R-3405 to R-3409 stay unused"; this plan takes R-3405. No checker reads it, but line
  13-15 should say the Part 1 reservation is superseded.
- **N4.** Line 89: if `readLabels` lives in `anatomy-labels.mjs` (O1 default), that module is already A-098's reader.
  Name the exact path the Read by line gains, so the builder does not add a module that does not read the file.
- **N5.** `distinctUnits` keys texts that normalize to the empty string (a lone marker or `**`) into one key;
  `reportContexts` skips them. That key can become a spurious heavy key with mixed raw texts and one label. Skip or
  count it, and name which.
- **N6.** `safePart` collapses unknown part names into `extra-section`, so T6's spanning-parts line undercounts keys that
  span two unknown parts.
- **N7.** Under `--labels`, `pulls.byFunction[].pushedChars` comes from model labels while `function` is rule-mapped. The
  mark (T5) should say it covers the pairing, not only the functions.
- **N8.** Sheet 2's effective size for the model pairs is its distinct key count, not 150. Print it beside each model
  pair's n.
- **N9.** O5 and T3 do not say what `sample --labels` does with a key that has no label row (a partial folder). Refuse,
  or leave it out of the model strata and print the count.
- **N10.** One folder has two option names (`agree --model`, `--labels` elsewhere). Part 1 named them; the README should
  say they mean the same folder.
