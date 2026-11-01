# anatomy-labeller — plan attack (one adversary)

Read: this lane's `plan.md`; builder-anatomy's `plan.md` and `anatomy-counts.md`; `apps/bench/lib/anatomy*.mjs`,
`apps/bench/anatomy.mjs`, `scripts/memory-shape-runners.mjs`, `apps/bench/lib/catch-judge.mjs`,
`packages/nana-pack/lib/memory-shaping.mjs`. No private text read.

Counts used below come from one run of the plan's own counts-only command, `report --in
~/nana-memory-runs/anatomy-2026-11-01`, aggregated with jq (output deleted after aggregation):
- 3,591 duplicate groups hold 113,459 occurrences; 44 keys appear in all 600 builds (26,400 occurrences, 22% of
  units); **283 keys with at least 60 occurrences hold 89,414 occurrences, 74% of all units**.
- 56 duplicate groups span more than one part, holding 12,481 occurrences (about 10% of units).
- Non-oversize unit chars: 22,885,726 over 119,679 units. Largest non-oversize unit per part: project_context 2,268,
  brief 2,804, addendum 6,879 (an addendum unit above the 3,000 oversize line).
- Units by part: project_context 32,690, brief 21,941, addendum 14,510, preamble 11,477, nana-writing 11,340,
  nana-rulings 7,360; 22 of the 44 every-build keys sit in project_context.

Threat model as the plan states it: honest variation in, deliberate forgery out.

## MUST

### M1. The bar lets a clone of labeller A pass, and step 4 has no independent clause at all

The model labeller is `claude-sonnet-5`; labeller A was a Claude Sonnet subagent. `model:consensus` is computed only on
the 132 units where A and B already agree, so a unit where the model and A share a Sonnet bias and B dissents is
**removed from the denominator, not counted against the model**. Step 3 adds `model:b ≥ 0.6` for this reason. Step 4
(rare functions) and the per-function marks in step 3 use `model:consensus` alone.

Failing case: on step 4's stratified sheet, labeller A is "a fresh Claude Code subagent" (Claude again). Suppose the
model and A both call 12 brief bullets of the form "follow the approach in X" `precedent`, and B calls them `method`.
Those 12 rows leave the consensus; the remaining consensus precedent rows agree; precedent is marked reliable at
κ ≥ 0.6, and the FEAT-042 "rare functions unmeasured" known bug is deleted in step 6. Same for any step-3
per-function mark: method/tools was already the top A:B confusion (4), the exact place a same-family bias would hide.

Fix: every reliability mark (overall, per function, step 3 and step 4) requires both `model:consensus` and `model:b`
at or above the bar, per function where count ≥ `KAPPA_MIN_COUNT`. Name it in the seat measurement, and have
`agree --model` print the per-function rows for `model:b` (it already does via `pair`; the plan must read them). In
step 4, labeller A must not be `LABEL_MODEL`: run the subagent on a different Claude model (opus) and say so.

### M2. The bar does not bound the shares the plan will report

Shares count occurrences (A5). 283 keys, 2.6% of the 11,019 distinct texts, carry 74% of the occurrences; 44 keys
carry 22%. The bar is a per-unit κ over 150 rows. Agreement on 150 sampled rows says little about whether the
handful of heavy keys are right, and those keys decide the shares.

Failing case: the model mislabels one 2,000-char project_context unit present in all 600 builds (22 such
every-build keys live in project_context; the part's largest unit is 2,268 chars). That moves 1.2M chars, 5.2
points of char share over 22.9M, from one function to another. Two such errors move ten points. Step 3 can still pass
at κ 0.8, and `labeller-counts.md` then reports a char share that is off by more than the rule-era precedent,
lessons, output-contract and feedback shares combined. Slice 2 picks which function to drop in replays from exactly
these shares.

Fix: make the check weight-aware, before any share is read.
- Add a heavy-key check set: every key above a configured weight (for example the keys that together cover half of
  occurrence × chars, or all keys with ≥ `LABEL_HEAVY_MIN` occurrences, chosen 60 → 283 keys) goes to labellers A and
  B as a blind sheet. `sample --labels --heavy` (or a separate draw) writes it; the rows are mostly the repo's own
  repeated surfaces.
- `agree --model` prints an occurrence-weighted and an occurrence×char-weighted agreement for model:consensus and
  model:b over that set.
- Pre-register: a function's share is reported as a finding only when the heavy-key weighted agreement passes too;
  otherwise the share prints with the weight of disputed heavy keys beside it.
- One must-meet test: on a fixture where one key has 50 occurrences and nine keys have one, mislabelling the heavy
  key drops weighted agreement below the unweighted one.

### M3. A 2-hour serial run has no resume, no failure stop, and a cap that unknown usage never reaches

Three failing cases, each inside the honest-variation model:
1. Killed run. The laptop sleeps, Claude auth expires or the seat kills the job at call 250 of 280. If rows are
   written at the end (`write` is one exclusive `writeFileSync`), USD 5 and two hours are lost. If rows are appended,
   the folder is not empty and `label` refuses to continue. Either way the only path is a full rerun.
2. The plan's own fail paths need partial reruns. The 1% bar is 110 units, about three rejected or failed 40-unit
   batches out of 280; and a capped run ends with `unsent` rows. Both are resolved today only by a full rerun.
3. Hung endpoint. `claudeRunner` waits `TIMEOUT_MS` (300 s) per call; a timed-out child has partial stdout, so usage
   is null. T2's cap counts known tokens only (memory-shaping's `unknownCharge` defaults to 0), so the cap never
   trips: 280 × 300 s ≈ 23 hours, every unit `unclassified`, and up to the per-call `DOLLAR_CAP` spent on each call
   with nothing counted.

Fix:
- Append one row per labelled key after each batch (mode 0600), so the file grows as the run goes and doubles as the
  heartbeat's progress signal.
- Write a manifest at the start: `LABEL_MODEL`, effort and the prompt SHA-256 (R-3398).
- `label --resume <labels folder>`: read the manifest, refuse with a fixed reason when model or prompt hash differ
  from the sealed values, skip keys already labelled, send only the rest. `report --labels` and `agree --model` print
  the manifest's model and prompt hash, so `labeller-counts.md` cites the labels that passed the bar.
- Stop after `LABEL_FAIL_STREAK` (chosen, e.g. 3) consecutive failed calls; the rest count `unsent`.
- Charge each unknown-usage call a configured `LABEL_UNKNOWN_CHARGE` toward the token cap (memory-shaping precedent,
  `caps.unknownCharge`).
- Print a counts-only progress line every N batches (calls, labelled, unclassified, tokens so far) so the seat's
  heartbeat and failure watcher (ruling 2026-10-15) see progress, not just a live process.
- Must-meet tests: (a) a run capped after call 1, resumed, sends only the unsent keys and ends with each key once;
  (b) resume against a manifest with a different prompt hash exits 1 and makes no call; (c) three null-usage
  failures in a row stop the run with the rest `unsent`.

## SHOULD

### S1. 0.6 is far below the A:B level the plan claims as precedent

A:B scored κ 0.86. A model scoring `model:b` 0.62 passes, though it agrees with B much less than A did. At n ≈ 150
the standard error of κ near 0.6 is about 0.05, so 0.62 is not distinguishable from 0.52; at a per-function count of
10 the interval is about ±0.3.
Fix: pre-register `model:b` against `a:b`, for example pass at `model:b ≥ 0.7` (chosen: A:B 0.86 less about three
standard errors), and print each per-function count beside its κ in the counts file. Marks resting on fewer than 30
units read "indicative", never "reliable".

### S2. A prompt change after a fail would be tuned on the test set

Step 3's fail branch offers "prompt change". Rechecking a new prompt on the same 150-unit sheet 2 lets the seat tune
to that sheet. Fix: pre-register that any recheck after a prompt or model change uses a fresh seeded sheet labelled
by A and B, and that sheet 2 stays the first-prompt result.

### S3. Dedup by text hides context-dependent units, and the plan has no count of them

A2 and A3 are consistent with how A and B labelled, but the bar measures blind-label agreement, not whether a
function read from text alone is the function in place. 56 keys span more than one part and hold 12,481 occurrences
(about 10% of units). Headings are not measured at all. Failing case: a short bullet such as a test command appears
in the preamble (method) and in briefs under a must-meet heading (task). One key gets one label, and every occurrence
follows it.
Fix: `report --labels` prints counts-only lines for keys spanning more than one part and for units under a short
length (both occurrences and chars). The counts file states that shares are blind-text functions and gives that
residual's size. No model change.

### S4. Occurrence shares mostly describe the fixed surfaces; report distinct and per-part beside them

Project_context, preamble, nana-writing and nana-rulings hold about 63k of 120k units; briefs hold 22k. With 74% of
occurrences in 283 keys, the occurrence table mostly measures the repo's standing surfaces. That is the right number
for "what does a build carry", but a misleading one for "what varies between briefs", which replay selection also
needs. The plan rates the second count as one extra report field.
Fix: answer owner question 2 as "both" by default. `report --labels` prints occurrence shares and per-distinct-key
shares. The counts file reads the brief and addendum part shares as the varying context.

### S5. `report --labels` must relabel every consumer, and the pulled side stays rule-mapped

T5 pins `overall` and the share totals. `reportContexts` also reads `s.label` in `zeroSupply`, in `builds[].functions`,
and in `pulls.byFunction[].pushedChars`. The pulled side stays mapped by the rule table `CLASS_FUNCTION`. Failing case:
an option threaded only into `counts` leaves `zeroSupply` on rule labels. A pure transform of the contexts avoids
that, but `pulls.byFunction` still compares model-labelled pushed chars with rule-labelled pulled reads.
Fix: T5 also pins `zeroSupply` and one build's `functions` under `--labels`. The output marks `pulls.byFunction` as
rule-mapped, or drops `pushedChars` there when `--labels` is given.

### S6. The privacy test never makes the runner echo text

T4's sentinel sits in every unit, but the fake runner returns clean replies. The leak paths in new code are logging a
rejected reply, a runner error message or a key. Real replies can echo unit text, and catch-judge's thrown messages
carry up to 300 chars of model output. Also, a SHA-256 key of a short normalized text such as "None." can be
reversed from a dictionary.
Fix: T4 adds (a) a fake runner whose reply, good and bad, contains the sentinel; (b) a fake runner that throws an
Error whose message holds the sentinel; (c) a check that `labels.jsonl` holds no sentinel; (d) a check that no key
string appears in any stdout or stderr. Keys are never printed or committed. The committed agree outputs hold κ and
counts only, as today.

### S7. Step 4's sheet size is unstated and can exceed `SAMPLE_SIZE`

`drawSample` adds every minimum before it fills to `n`. With ten functions, a minimum of 15, and two label sources, the
minima alone reach 300 rows when supply allows. Failing case: the seat budgets labellers for 150 rows and gets 250.
Fix: the plan states the expected size and the labellers' cost. T7 pins that the sheet size is
`max(n, minima picked)` and that the count prints.

## NOTE

- N1. T5's "no-flag output deep-equals `reportContexts`" and T6's "κ equals `cohensKappa` over the consensus ids"
  restate the code. A user-visible T6 pin: a sheet row whose text differs from its key's representative only by cwd or
  branch receives the representative's model label.
- N2. T3's fenced-reply case cannot occur on the default runner. `claudeRunner` returns
  `JSON.stringify(structured_output)` under `--json-schema`, so only a pi runner would fence. Keep the case as
  precedent parity, not as evidence.
- N3. Batch order. If keys are batched in first-occurrence order, one batch carries a build's preamble in sequence.
  The model then sees neighbours that A and B never saw, so A2's "exactly as A and B" is only partly true. κ still
  measures the labels actually used. Either shuffle keys by a fixed seed or state the difference.
- N4. Which text goes out. The key is the normalized text, but the plan does not say whether the model gets the
  representative's raw text, with absolute worktree paths, or the normalized text. The plan should state its choice.
  Normalized text matches the key and drops home-folder paths, but it also strips backticks and list markers.
- N5. The token cap counts cache read and creation buckets (`claudeRunner` sums all four). That fits the estimate.
  Under subscription auth, `total_cost_usd` is notional. The counts file should say which applies.
- N6. Transcripts. After the canary, check that `claude -p --no-session-persistence` left no transcript under
  `~/.claude/projects` (compare file counts before and after). Step 4's Claude Code subagent does persist its
  transcript there, outside git, as in builder-anatomy. Say so in the counts file.
- N7. Denominators. builder-anatomy reports 23.6M pushed chars, while non-oversize unit chars are 22.9M and all unit
  chars are 37.5M. `labeller-counts.md` should name the denominator under each share table.
- N8. Carry 2 is sound. Commit only the κ/count fields of `agree.json` after the identity scan. The first-draw
  `agree.json` stays out, as planned.
