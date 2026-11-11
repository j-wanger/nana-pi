# apps/bench — role context anatomy

Splits recorded builder and seat contexts by function and reports descriptive counts.
The study runners retired on 2026-11-07. Recorded results and frozen fixtures live in the private records folder
(`~/nana-records/<project>/<lane>/`, Windows `%USERPROFILE%\nana-records\<project>\<lane>\`) and git history.
`<project>` is the main checkout's folder name, not the lane worktree's name; see `docs/reviews/README.md` for history commands.
Raw research sources share that private store and history; distilled research stays in the repository.

## Dependencies and install

Node ≥ 22.19 and git are required for builder extraction and reporting.
The optional `label` command needs an authenticated Claude CLI on PATH and makes paid calls.
There are no npm dependencies of its own and no Playwright requirement.

## Run and test

Run the anatomy commands below from the repository root.
Tests use synthetic OS-temp fixtures and make no model calls:

```bash
node scripts/test.mjs apps/bench/test/
```

## Builder context anatomy (descriptive)

`anatomy.mjs` splits pi builder contexts by function, not file. It never changes a live build.
The original five subcommands need only Node and git and spend nothing.
The optional `label` command also needs an authenticated Claude CLI on PATH and spends through an isolated runner.

```bash
node apps/bench/anatomy.mjs segment --sessions <sessions-root> --repo <repo-root> --out <private-folder>
node apps/bench/anatomy.mjs report --in <private-folder>
node apps/bench/anatomy.mjs sample --in <private-folder> --seed <printed-seed> --out <private-sheet-folder>
node apps/bench/anatomy.mjs agree --in <private-folder> --a <filled-sheet-a> --b <filled-sheet-b>
node apps/bench/anatomy.mjs assemble --in <private-folder> --context <build-id> --out <private-replay-folder>
node apps/bench/anatomy.mjs label --in <private-folder> --out <private-labels-folder>
node apps/bench/anatomy.mjs label --in <private-folder> --resume <private-labels-folder>
node apps/bench/anatomy.mjs agree --in <private-folder> --a <filled-sheet-a> --b <filled-sheet-b> --model <private-labels-folder>
node apps/bench/anatomy.mjs agree --in <private-folder> --a <filled-sheet-a> --b <filled-sheet-b> --a2 <filled-sheet-a2> --b2 <filled-sheet-b2> --model <private-labels-folder>
node apps/bench/anatomy.mjs sample --in <private-folder> --seed <printed-seed> --labels <private-labels-folder> --out <private-sheet-folder>
node apps/bench/anatomy.mjs sample --in <private-folder> --labels <private-labels-folder> --heavy --out <private-sheet-folder>
node apps/bench/anatomy.mjs report --in <private-folder> --labels <private-labels-folder>
node apps/bench/test/anatomy.test.mjs
node apps/bench/test/anatomy-labels.test.mjs
```

New output requires an empty folder outside every git checkout. Writers reject a final-component symlink;
OS-temp ancestor symlinks are allowed. Files use exclusive creation and owner-only POSIX modes.
Only `label --resume` appends to an existing matching store.
No subcommand prints unit text, headings, targets or duplicate text. Keep contexts, sheets, replay files and labels outside git.
Label keys are private too: short-text hashes can be reversed from a dictionary.
Synthetic tests exercise every subcommand without reading real sessions, calling a model or spending.

The private segmented store is `contexts.jsonl` (A-092); `report`, `sample` and `assemble` read it.
It keeps ordered parts, original text, contiguous unit/glue spans, brief blob/start tip, exclusions, pulls and build metadata.
Characters mean UTF-16 code units. System sections retain stored order; attempts share one build via the end record's sessions.
Recorded briefs use the start tip; older briefs search committed history across all review folders.
Matching accepts git checkout line-ending conversion without trimming whitespace or rewriting the received spans.
Claude Code builders remain outside the builder adapter. Recent Claude Code seat records include a prompt snapshot; the seat adapter below reads it.

Reports are counts-only JSON: units and chars with shares overall/per part, glue and unsorted counts,
separate oversize rows, part max/p90 sizes, supply gaps by build number, opaque duplicate ids, pushed/pulled function totals,
and one row per build. Oversize units are outside function shares and zero-supply calculations.
A shell result's chars divide equally across its counted segments, with any integer remainder on the last segment;
this keeps pipe output from being counted twice. Segment-level attribution is approximate.
Reworded repeats and interpreter-mediated reads remain residuals; interpreter commands enter `unclassified-bash`.

The blind `sheet.jsonl` has only `id` and `text`. Labellers add a `label` from the definitions in
`lib/anatomy-config.mjs` (or `unsorted`). `sample` accepts `--n`; function/tier minima may exceed that request.
After the minima, it fills round-robin across tiers in seeded unit-id order; the blind sheet is sorted by id.
`agree` prints all three rater pairs, char-weighted agreement, per-function kappa above the configured count,
confusions and the count of units where both labellers agree. It also compares rules against that consensus.
Definitions and rules were written before corpus labelling; the seat measures reliability before interpreting shares.
These results describe supply, not causal effects or slice-2 target choices.

`label` uses claude-opus-5-5 at medium effort, as chosen by the owner after Sonnet low-effort labels missed both agreement bars on the fixed check set.
It hashes the report's existing duplicate normalization and sends one representative per non-oversize key.
The representative keeps its Markdown; only its cwd and branch become `<WORKTREE>` and `<BRANCH>`.
Seed-shuffled batches are blind to headings, parts and rule labels, with at most 40 units and 24,000 text chars per call.
Replies must cover each call's `u1..un` ids exactly once using the definitions or `unsorted`; a bad reply rejects its whole batch.
The private store holds manifest.json (model, effort, prompt hash, order seed and input counts) and labels.jsonl (key, id, label).
Rows append and flush after each successful batch; resume repairs a torn tail and skips already-labelled keys.
Resume refuses a changed model, effort, prompt hash or order seed. A new prompt needs a new private folder.
Calls run serially with the shared runner's USD 0.50 per-call cap and five-minute timeout.
The run stops after 2,500,000 charged tokens or three consecutive failed calls; missing usage charges 20,000 tokens per call.
Progress prints every ten calls. Final counts include distinct units, labelled, calls, tokens, charged tokens, cost, unclassified and unsent.
With missing usage, `tokens >=` shows only known tokens; charged tokens include the conservative unknown-call charge and cost is `unknown`.
The model and prompt hash print, but never unit text, keys, replies or runner errors.
A capped or interrupted run continues with `--resume`; rejected keys are eligible again.
Without new flags, report, sample and agreement keep their original rule-label output.
`--model` on agreement and `--labels` on report/sample name the same private labels folder.
Readers never repair or chmod files. They refuse missing, symlinked or nonregular files, damaged JSONL,
duplicate or off-vocabulary rows, foreign keys, stale ids and manifest input-count mismatches.
Every reader prints `provenance` with `model`, `promptSha256` and `labelsSha256` (SHA-256 of the whole labels file).

Model agreement adds `modelPairs` for model:a, model:b and model:consensus, each with `rows`, `distinctKeys`,
`kappa`, `perFunction`, `charAgreement` and `confusions`; `oversizeExcluded` counts skipped sheet rows.
A missing non-oversize key refuses with its count. Normalized variants inherit their key's model label.
`weighted` prints `model:b` and `model:consensus` proportions as `occurrences` and `occurrenceChars`, with a `denominator`.
Weights count each nonempty key once using the lowest sheet id: occurrence count and occurrence×representative-blind-text chars.
`disputed` prints each function's `aVsB` and `modelVsB` weights; `consensusLeftOut` prints excluded weights.
The optional second pair (`--a2` and `--b2` together) adds `pooled`: `distinctKeys`, `overlap`, and every label's
`perFunction` entry with `count`, `modelB` and `modelConsensus` binary κ objects (null for empty vectors).
Pooling counts each nonempty key once, preferring the first pair. Counts use the union of the three labels.
κ stays per row for individual pairs; no command decides whether a measurement bar passes.

Model sampling selects stored representative ids, one per nonempty labelled key, not the label run's key order.
It takes 15 per function independently by model and representative rule label (or all available), then seed-order fills to `--n`.
Minima may exceed `--n`. `--heavy` instead selects all labelled keys with at least 60 non-oversize occurrences; no seed is needed.
Rows contain only `id` and blind `text` from the stored id's unit, replacing only its own cwd and branch.
Other paths inside that text stay private-sheet content. The summary prints `units`, `chars`, `unlabelledKeys` and `emptyNormalized`.
Partial folders omit unlabelled keys from sheets and print their count.

Model reports replace every non-oversize occurrence's rule label before computing `overall`, `parts`, `builds`,
`zeroSupply` and `pulls.byFunction[].pushedChars`. Missing keys become `unlabelled`.
`pulls.functionProvenance` marks target-rule functions paired with model-labelled pushed chars.
`perOccurrence` and `perDistinct` hold `counts`, `denominator` and `parts`; each part also names its denominator.
Occurrence counts include glue; distinct counts omit glue and use representative blind-text chars.
Per-part distinct counts include keys present in that part, so their sum can exceed the overall distinct count.
`contextDependent.spanningParts` counts keys across known parts; `contextDependent.short` counts occurrences below 40 raw chars.
Both print only `keys`, `occurrences` and `rawChars`. Empty-normalized keys leave sheets, weights and share views;
`emptyNormalized` prints their occurrence count. Unknown parts retain the original `extra-section` aggregation.
`interpretation` states these are blind-text model labels, not findings until the pre-registered bars pass.

Assembly writes numbered part files plus a parts.json manifest with each part's zero-based attempt.
Omit `--context` only for a store with one build.
Use `--drop <function>` to remove units and orphan headings, or `--stage <function>` to replace runs with a fixed pointer
and put the ordered units in staged.txt. These options are mutually exclusive. Separators stay glue.
Assembly uses spans, never the audit copy of the raw part. A later replay must pass these private files from outside its checkout.

## Seat context anatomy (descriptive)

The seat adapter needs only Node; extraction and reporting make no model call.
It reads main-thread Claude Code JSONL files from the repository's exact project folder.
It does not enumerate subagent files or pi seat sessions.

```bash
node apps/bench/anatomy.mjs segment --role seat --runtime claude-code --projects <claude-projects-root> --repo <repo-root> --out <private-folder>
node apps/bench/anatomy.mjs report --in <private-folder>
node apps/bench/test/anatomy-seat.test.mjs
```

The default remains `pi:builder`. Runtime-role adapters return `contexts`, `skipped` and `denominators`;
the registry and injected adapters use that same contract. Missing `role` means builder for old stores.
Seat stores use safe ordinal ids, with the session map and evidence ids kept only in the private store.
Existing label, sample, agreement and assembly readers also accept these stores.
Labelling is optional, paid and builder-framed; this lane makes no model-label claim about seat context.

Seat `report` adds `slots`: kinds, phases, start kinds, sessions, segments, coverage, reads and repeats.
Recorded payload is not delivered context. UTF-16 chars are not tokens, and recorded totals bound nothing about delivery.
Headline kind shares use only `recorded-input`; `unknown` payload stays separate.
Kind totals include all retained chars, including glue and opaque oversize tools listings.
Function shares keep the existing oversize exclusion; rule-label function shares are not findings.
Payload selection reads configured fields, never attachment metadata. Missing fields appear as coverage misses.
Unknown attachment types aggregate into `attachment-other` so arbitrary type strings cannot escape the private store.

File starts, compaction signals and SessionStart hooks share one coalescing start window.
Assistant work, owner turns, tool results, queued commands and prompt hooks close the window.
Later work is `turn` payload even before another owner turn arrives.
Start-type shares measure only payload recorded before those closing events, not all startup configuration.
Startup and clear snapshots and instructions recorded after the first owner prompt count as `turn`.
`unrecorded-system` means no snapshot in the start window, not no snapshot anywhere in the segment.
Missing start snapshots or instructions have explicit exclusion reasons.
UUID ownership uses earliest timestamps, then session and UUID; physical ties use a private content-derived representative.
Resumes and forks retain inherited prefixes; inherited payload contributes to no corpus totals or owner-turn counts.
Reports count skipped worktree, other-project and private-temp folders, sidechain entries and torn lines.

Hook correlation is local to a start window and invocation. Raw or JSON additional context already present in
one matching success record counts once; ambiguous pairs remain separate and counted.
Identical invocations in later windows remain deliveries. A queued human prompt merges only with the first
following equal owner turn in its segment, before another owner or queue; unmatched queues are counted.

The repeat tables deliberately differ: `repeatedDelivery` counts later-segment chars for a session's stable
kind and slot identity; `exactDuplicate` counts byte-identical payload chars after the first;
`normalizedDuplicate` counts repeated normalized unit occurrences, including oversize units.
Each table names its denominator. Hook commands identify repeatable slots; invocation ids disambiguate their representations.
Owner turns use event identities rather than a shared owner slot.
Seat-only read classes include memory, delegation, web, skill, write and other, without changing builder classes.
Shell reads use the builder classifier and its conservative equal character split.

No causal claim follows from these descriptive counts. The seat's private baseline and live context comparison run separately.

## Layout

```
anatomy.mjs         role anatomy CLI: segment, report, sample, agree, assemble, label (label spends)
lib/anatomy.mjs     private writer policy and counts-only subcommand boundary
lib/anatomy-config.mjs  vocabulary, rules, splitters, sampling and reporting choices with provenance
lib/anatomy-sessions.mjs  absolute brief-file matching, historical fallback and multi-attempt pi context extraction
lib/anatomy-seat.mjs  streamed Claude Code seat adapter, boundaries and private event identity
lib/anatomy-slots.mjs  role-neutral kind totals, coverage, repeats and reads
lib/anatomy-spans.mjs  lossless Markdown units and glue with deterministic labels
lib/anatomy-pulls.mjs  dedicated and wrapped shell reads by function
lib/anatomy-measures.mjs  counts, shared normalization, agreement, blind sampling and span-based assembly
lib/anatomy-labels.mjs  private capped model labelling, append, fingerprinted resume and shared read-only reader
lib/anatomy-stats.mjs  shared Cohen's kappa and seeded sampling
lib/jsonl.mjs       shared append-log reader with optional torn-tail repair
lib/anatomy-runners.mjs  isolated structured-output judge for anatomy labelling
 test/              synthetic tests with no model calls
```
