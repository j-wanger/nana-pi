# Plan — memory-replay

Lane: memory-replay · branch `feat/memory-replay` from main ad9612dd · worktree `~/nana-pi-wt/memory-replay`
Grounding: `docs/memory-factory-design-2026-10-31.md` (version 2); `docs/reviews/outcome-meter-2026-11-01/plan.md` ("Field counts and replay") and its `plan-attack.md` (N7); `docs/known-bugs/FEAT-043.md`; the code named under Precedent. This is revision 2. It takes every MUST and SHOULD in `plan-attack.md` in this folder, and the NOTEs where cheap (last section). The planner read no owner text, label text, candidate text or reply. It counted private rows by field only (Pool today), and printed only counts.

Lane class: `node scripts/lane-class.mjs --root . --files packages/nana-pack/lib/memory-replay.mjs,packages/nana-pack/lib/memory-replay-context.mjs,packages/nana-pack/lib/memory-replay-config.mjs,packages/nana-pack/lib/outcome-score.mjs,scripts/memory-replay.mjs,packages/nana-pack/tests/memory-replay.test.mjs,packages/nana-pack/tests/fixtures/memory-replay/session-a.jsonl,package.json,packages/nana-pack/README.md,REQUIREMENTS.md,docs/requirements-tree.md,docs/code-map.md` prints `ordinary`. No hook, pi extension, install step, gate policy or land/review tool is touched. One final reviewer, the roster's.

## Purpose

Agreed reading: the owner answered "Yes" on 2026-11-01 to the outcome-meter plan's decision line: "build this field meter now, and make outcome-replay the next lane, ahead of outcome-findings and before the first delivery lands. Replay judges the first memory delivery; the field counts confirm it later." The meter's baseline found repeats too rare to judge a delivery in the field (a halving needs about 2,350 interactions each side). Replay is the paired test the meter plan sketched: "Take the past situations where the owner gave a correction, rebuild the agent's context at that turn, and run it with and without the memory bundle. A judge then marks whether the agent repeats the corrected behaviour."

This lane builds a measurement tool, not a delivery. It ships no bundle and changes no agent's context. Four hand-run subcommands of `npm run memory:replay --`:

- `plan --labels <private> --candidates <private> --root <frozen snapshot> --seed <n> --out <private replay root>`: zero spend. Selects the cases and their strata, rebuilds each case's context and slots, fixes a seeded case order, and prints counts and the case-set hash.
- `screen --in <plan folder> --expect <hash>`: optional, spends. Control-only draws per case. Keeps cases with at least one judged repeat. Screen draws never enter `decide` (S1).
- `run --in <plan folder> --expect <hash>`: spends. Replays each case K times in each arm, then judges every reply blind, one reply per call.
- `decide --in <replay root> --case-set <hash>`: zero spend. Reads every run on the case set and prints the statistic, strata, attrition and verdict lines. With `--sheet <private folder>` it writes the blind-check sheet; with `--blind-agree <n>` it applies the blind-check bar.

Design in five lines:
1. **Cases, in two strata.** Every labelled owner correction is a case. Stratum R holds confirmed repeats: an earlier instance labelled `same` whose own instant precedes the repeat session's first entry. Stratum F holds every other correction, where a bundle can help only by generalising. Prompted decisions asked again join R only, because asking a first-time decision is correct. The primary line pools R and F; per-stratum lines sit beside it.
2. **Moment.** The replay point is the owner turn just before the corrected agent turn. The rebuilt context is the recorded standing text, the last compaction summary and the session's turns up to that point, trimmed to a sealed budget. Nothing at or after the corrected agent turn is included.
3. **Arms.** All arms are byte-identical except one memory slot. Control holds the memory the seat had then. Treatment holds a bundle built as of the cut from candidates whose evidence precedes the session start, merged with no events. Oracle holds one record: the earlier instance (R) or the case's own correction (F, marked `ceiling`). Oracle shows whether the replay can detect memory at all, so a null on treatment is readable; it is never the verdict.
4. **Judge.** One isolated Claude call per reply. Each call holds the mistake description and one reply, never two. The original corrected turn goes through the same call shape, rendered in reply format under the reply cap, and must come back `repeats`. Verdicts are `repeats`, `avoids`, `stalls` or `unclear`, under a sealed counting rule.
5. **Statistic.** Per case, d = control repeats − treatment repeats over K draws. An exact one-sided sign-flip test runs on the per-case d, with the distribution computed exactly over integer sums; at K = 1 it is McNemar's exact test. Only the first run per case set and bundle maker is confirmatory. A later run prints `exploratory`.

## Pool today (counted by field, nothing printed)

- The 2026-10-31 labels in the private snapshot are memory-making's blind kind labels. Each row holds `evidence` and `kind` only: 46 corrections, 162 decisions, 56 lessons and 535 `none`. **No row carries `valid`, `repeatOf` or `relation`.** So stratum F can be read from today's labels, and stratum R cannot.
- All 46 correction pointers resolve in the frozen snapshot of 340 transcripts. Every one of the 340 records an `instructions` attachment. Every correction has an earlier owner turn in its session.
- The 46 corrections fall in **6 sessions** (19, 10, 7, 6, 3 and 1 corrections). Cases cluster, and each session's cases share one cut and one bundle.
- Every assistant entry in those sessions is `claude-opus-5-5`, today's seat model. The sessions also record an ultra-effort mode.
- The two meter runs found 2 and 0 cross-session correction repeats, and 1 and 1 decisions asked again. Inferred: once labelled, R holds about 0 to 5 cases.

### Labelling the seat must do first

The seat's outcome labels (the meter plan's M5) do not exist yet. Before `plan` can build stratum R, the seat converts and extends the 2026-10-31 labels into outcome-score's label shape `{ evidence, kind, valid, repeatOf: [pointers], relation }`:
- **Corrections (46 rows):** `valid: true` (the blind labeller already judged each one a correction from source text). `repeatOf` lists every correction from an *earlier-starting other session* in the whole snapshot that states the same behaviour; this is not limited to the meter's 60-interaction lookback (M1.2). `relation` is `same` or `changed`. This is one grouping pass over 46 claims; at most 780 cross-session pairs exist, and most fall out by topic.
- **Decisions (162 rows):** the same fields, for prompted decisions only. This is one grouping pass over 162 claims.
- The labeller is the seat or a Claude labelling agent, working from source text resolved by `resolveEvidence`. Owner text goes only to Claude. The file stays private. Size: 208 rows, both passes by one agent, about an hour of seat time (inferred). The same file also serves the meter's owed accuracy scoring.
- Without this step `plan` still runs. Stratum F gets all 46 cases, R prints `cases 0`, and the oracle line covers F only (as `ceiling`).

### Expected power at today's pool

This comes from a seat-scratch simulation (inferred, not from data). Each case's control repeat rate spreads around the mean. 30% of cases are lost to `judge-miss`, `unjudged`, `leaked`, `unclear` or `unrun`. The test is the exact one-sided sign-flip at 0.05, with a minimum of 8 informative cases. 46 planned cases, R and F pooled:

| Effect | K = 3: decides | K = 5: decides |
|---|---|---|
| halving, control 0.5 | 0.97 | 1.00 |
| 30% fewer, control 0.35 | 0.42 | 0.70 |
| 30% fewer, control 0.2 | 0.24 | 0.45 |
| 15% fewer, control 0.35 | 0.11 | 0.27 |
| no effect, control 0.35 (false win) | 0.00 | 0.01 |

The adversary's simulation agrees where they overlap (46 cases, 30% fewer, K = 5: 0.57). Both ignore clustering. With 46 cases in 6 sessions, the true power is lower and the false-win rate higher than shown; `decide` prints a session-level line for that reason.

**What a first run can decide:** whether a candidate bundle halves repeats or better across today's corrections, and, through the `ceiling` arm, whether the rebuilt moment responds to memory at all. **What it cannot decide:** a 15 to 30% effect; anything about stratum R alone (0 to 5 cases); the oracle line on R; how the result transfers to live work, with tools and the real system prompt; and whether a miss comes from making or from delivery. A null on treatment beside a `ceiling` win means "this bundle did not help". A null on both means "this replay cannot see memory", and says nothing about the bundle.

## Assumptions

- A1. **Case rule (M1, M3).** A case is a correction label (or, after the seat's labelling, a row with `valid: true`). Stratum R needs `relation: "same"` and a `repeatOf` pointer whose own instant precedes the repeat session's first entry. A `changed` relation is a skip reason (`changed`), never R. A pointer earlier in time but after the session start counts as F and prints as `late earlier instance`, since no session-start memory could have carried it. Decisions enter only R, and only prompted (the meter's rule). Skip reasons: `invalid`, `changed`, `unresolved`, `no recorded context`. The labels are read with outcome-score's reader, which also accepts the kind-only shape, read as `valid: true` with an empty `repeatOf`.
- A2. **Mistake description.** It is built deterministically from the case's own pointer: `resolveEvidence` gives the owner's words and the seat text before them, and memory-making's `shape` renders the correction form, cut to the meter's `CLAIM_CAP`. No shaper candidate is needed, so a correction the shaper missed is still a case.
- A3. **Moment.** The replay point (P) is the owner turn before the corrected agent turn. The replayed agent writes the whole agent turn in one reply: each tool call it would make as one line `TOOL <name>: <short input>`, then its message to the owner. Tool results never come back. The reproduction floor (A10) and per-kind reproduction lines (N2) measure what this costs.
- A4. **What is rebuilt.** In transcript order: the latest `instructions` files before P (`{ path, type, content }`, typed User, Project or AutoMem); the SessionStart hook outputs; the last compaction summary before P; and the main-chain user and assistant entries after the last `compact_boundary` through P. Thinking, sidechains and bookkeeping attachments are left out (a sealed allow-list of kept types). Tool calls and results are rendered as text, each result cut to a sealed cap. Over the history budget, whole entries drop from the oldest end; P stays. Claude Code's own system prompt is not recorded, so a sealed replay preamble replaces it.
- A5. **The memory slot.** It holds the `instructions` files typed AutoMem, plus the SessionStart output whose recorded `command` names the shared-memory hook (sealed markers). The slot sits after the other standing text and before the conversation. So only the standing text is a prefix shared across arms; the conversation is cached only across draws within an arm (N7 fix).
- A6. **Control (owner question 1).** Control keeps the recorded slot. Bias (S2): in live work the seat can read memory files with the Read tool; in replay it cannot. Control is therefore handicapped, and the bias favours the bundle. `decide` prints `control would read memory <n>` (control replies with a `TOOL Read` line naming a memory path). The README and the verdict line state the bias direction. Current memory files are not inlined, since they carry later edits.
- A7. **Treatment bundle as of the cut (M2).** The cut is the case session's first entry. The maker takes A-091 candidates whose evidence pointer resolves, through the snapshot, to an instant before the cut. It drops any candidate citing a session that starts at or after the cut. It merges the rest in instant order into a fresh private temporary store with `mergeMemory` (no events, no saves), then reads them back with `readMemoryStore`. It orders them by evidence instant, newest first, never by write stamp, and cuts them to the sealed bundle budget. A delivery lane's maker receives the same as-of-cut candidate list. Leak backstop: a bundle containing the case's normalised description quote is `leaked` and dropped.
- A8. **Oracle arm.** On R, the slot holds only the earlier instance's own record (A2 rendering, pre-cut by construction): `oracle`. On F, it holds the case's own description: `ceiling`. That leaks by design and is labelled so; it is never pooled into the verdict. Both answer one question: can a memory that states this exact lesson stop the mistake in this rebuilt moment? (Owner question 2.)
- A9. **Judge (M4, M5).** One call per reply, with call-local id `r1` and the mistake description. The reply never comes with the arm, model, bundle, pointer, instant or another reply. Verdicts: `repeats`, `avoids`, `stalls` (does not attempt the requested work) or `unclear`. Sealed rule: `unclear` draws are dropped; a case needs at least the sealed number of judged draws in each of its arms, or it is `unjudged`. `stalls` counts as not-avoids for treatment and oracle: d uses repeat-or-stall for those arms and repeat for control. `decide` prints `unclear <c>/<t>` and `stalls <c>/<t>`, so a bundle that wins by doing nothing shows. The original turn is rendered from its recorded entries into the same `TOOL …` format, cut to the reply cap, and judged in the same call shape. Anything but `repeats` makes the case `judge-miss`.
- A10. **Reproduction floor.** When control repeats in under a sealed share of judged draws, `decide` adds `weak replay: control seldom repeats`. It also prints reproduction per kind (corrections, decisions).
- A11. **Statistic (S3, S4).** The test is an exact sign-flip on per-case d sums (|d| counts), with the distribution computed by convolution over integer sums, so it needs no sampling. Two one-sided levels are sealed: 0.05 for `bundle fewer repeats` and 0.05 for `bundle more repeats`, each printed beside its line. The minimum informative cases is sealed per stratum and pooled. `decide` prints `sessions <n>` and a session-level sign-flip p (the d summed per session) as a clustering check beside the case-level line.
- A12. **Runs and confirmation (M6).** `plan` hashes the sorted case pointers and strata, the seed, the case order, the screen rule and every seal. Each `run` writes a folder under the replay root holding its case-set hash, bundle-maker hash, preamble and judge-prompt hashes and start instant. `decide` reads every run on the case set and prints `runs on this case set <n>`. The first run per bundle-maker hash is `confirmatory`; later ones are `exploratory`. Rows that mix judge-prompt or preamble hashes within one run are refused. A delivery tuned after seeing per-case results is judged on a fresh case set: corrections after the tuning date. The seat fixes the seed in `sealed.txt` before the first paid run.
- A13. **Order and caps (S5).** The case order is seeded and interleaved by stratum. Within a case: control draws back to back, then treatment, then oracle, then the judge calls. The run cap stops new calls at a case boundary, and later cases are `unrun`. An incomplete run prints its verdict with `incomplete` on the same line, plus the stratum counts that ran. Each call passes its own `--max-budget-usd`.
- A14. **Blind check (S6).** `decide --sheet` writes ten replies, drawn at random from informative cases only, with no arm and no verdict. The seat labels them blind. `decide --blind-agree <n>` withholds the verdict, printing `judge disagreement`, when n is under the sealed bar (8 of 10). Without `--blind-agree`, the verdict prints as `pending blind check`.
- A15. **`cites bundle` (S7).** Both arms' replies are counted against the treatment bundle for a shared run of sealed length: `cites bundle <control>/<treatment>`.
- A16. **Runner.** Replay and judge calls go through `createRunner` with runner `claude` and their own sealed models, efforts, caps, timeout and buffer. `callJudge` already passes `--tools ""`, `--setting-sources ""`, `--strict-mcp-config`, `--no-session-persistence` and a replaced system prompt, with stdin as the prompt and cwd in OS temp. The replay reply schema is `{ reply: string }`.
- A17. **Model and effort (N3).** The recorded seat model in every case session is `claude-opus-5-5`, today's model, so the old "today or original model" question is settled. Replay effort is sealed `xhigh`, Claude Code's documented default. The sessions record an ultra-effort mode whose API effort is not recorded; that is a residual.
- A18. **Frozen inputs (N6).** `--root` must be the frozen private snapshot, never `~/.claude/projects`. The 30-day cleanup makes the pool perishable. `plan` hashes the transcript file list and sizes into the case set.
- A19. **IDs.** **SUB-025 · Replay past corrections with and without memory** under FEAT-043. FEAT-043 measures memory outcomes so memory changes are judged against a baseline. Replay is a second instrument for the same outcome, and the meter plan placed it there. If making-session-end takes SUB-025 first, take the next free number. Rows R-3370 to R-3377 for the must-meets and R-3378 to R-3389 for the seals (closed range, all used). Artifact A-097.
- A20. Coverage: one machine's Claude Code seat transcripts only (FEAT-043's known bug).

## Open choices

- O1. Starting values, sealed with `chosen` provenance: replay `claude-opus-5-5` at `xhigh`; judge `claude-sonnet-5` at `low`; K = 5 in every arm (S4); screen draws K, keep at least one judged repeat; minimum judged draws per arm 3; dollar caps 1.00 per replay call and 0.10 per judge call; run cap per owner question 3; history budget 160,000 characters; tool-result cap 2,000; reply cap 8,000; bundle budget 8,000; levels 0.05 and 0.05; minimum informative cases 8 pooled and 8 per stratum line; reproduction floor 0.30; blind-check bar 8 of 10; `cites bundle` run of 8 words; timeout 900 seconds; `maxBuffer` 64 MiB.
- O2. The replay preamble and the judge prompt wording, each sealed by SHA-256.
- O3. One JSONL file or one file per case for rebuilt contexts (private, exclusive create).

## Questions for the owner

1. Question: Should the control arm hold the memory the seat actually had at that moment, or no memory at all?
   Default: historical
   What the default gains and misses: it answers "does the delivery beat today's memory", which is what judging the first delivery means; it misses memory's whole effect, which an empty control shows, and it carries a bias toward the bundle (control cannot open memory files).
   Cost of a wrong guess: easy to undo — one sealed switch; the rerun is exploratory on the same case set, so a confirmatory answer needs fresh cases.
   If answered otherwise: control's slot is empty, treatment and oracle unchanged.

2. Question: Add the `ceiling` oracle arm on stratum F (memory holding the case's own correction), so a null result is readable while stratum R is too small?
   Default: yes
   What the default gains and misses: it tells "this bundle did not help" apart from "this replay cannot see memory"; it costs about a third more per run, and its leak is by design, so it is never the verdict.
   Cost of a wrong guess: easy to undo — one sealed switch, about 40 to 60 dollars a run.
   If answered otherwise: the oracle arm runs on R only, and a null on today's pool cannot be read.

3. Question: Is 150 dollars per paired run the right cap?
   Default: yes
   What the default gains and misses: it covers 46 cases at K = 5 with three arms and cache hits (about 130 dollars, inferred); without cache hits it covers about 28 cases, and the rest print `unrun`.
   Cost of a wrong guess: easy to undo — a sealed value; a cut run still prints its strata counts.
   If answered otherwise: 90 dollars means K = 3 (about 90 dollars for 46 cases), with power for a 30% cut falling from about 0.70 to 0.42.

## Feature

Feature: FEAT-043 · Measure memory outcomes

Subgroup: SUB-025 · Replay past corrections with and without memory. Purpose line: "Replay past owner corrections from their recorded context with and without a candidate memory bundle, and judge blind whether the agent repeats the mistake, so a delivery is decided without waiting for field volume." Parent: FEAT-043 · Rows R-3370–R-3389.

## Threat model

In scope: honest variation in our own tools' output and in the models'. This covers transcripts from older Claude Code versions without `instructions`; several compactions; a replay point early in a session; sidechain, bookkeeping and image entries; tool results far over the cap; label files in the kind-only or outcome shape, with duplicates, `changed` relations or pointers missing from the snapshot; candidates citing later sessions, same-day sessions or the case's own session; candidates with the same claim as a later one; bundles over the budget; replies that are not JSON, are fenced, empty or over the cap; judge replies with a missing, extra or foreign id or an unknown verdict; calls that time out, exit non-zero or report no or unpriced usage; run-to-run variance of the replay model and the judge; and repeated runs on one case set.

Out of scope: deliberate forgery, such as a planted transcript, label or candidate crafted to steer the replay or the judge. Prompt-injection defence belongs to the checking and delivery stations. A finding outside this model is a residual and becomes a known-bug line.

Public-repo rule: no owner text, claim, label, reply, verdict, case count or run result enters any repo file, log or CI output. Fixtures are synthetic. Owner text reaches only the sealed Claude runner.

## Precedent

- `apps/bench/lib/anatomy-measures.mjs` (`assembleParts`) — follow: a rebuilt context assembled only from stored spans, with one function replaced in place and its removed characters counted. Not imported (a pack module may not import an app).
- `apps/bench/lib/anatomy.mjs` — follow: hand-run subcommands, writers refusing non-empty or in-checkout folders, counts-only printers, private files with exclusive create.
- `packages/nana-pack/lib/outcome-meter.mjs` — follow: one transcript pass for owner turns, session first entries and instants; call-local ids; fail-closed validation; spend cap words; counts-only command. Import `wilson`.
- `packages/nana-pack/lib/outcome-score.mjs` — **helper move**: its private `readRows` becomes an exported `readOutcomeRows`, which also accepts the kind-only label shape and reads it as `valid: true` with an empty `repeatOf` and relation `none`. `scoreOutcomes`, `runOutcomeScore` and `runOutcomeCompare` keep their behaviour; `packages/nana-pack/tests/outcome-meter.test.mjs` stays unchanged and green.
- `scripts/memory-shape-runners.mjs` — import `createRunner` with the replay's and the judge's sealed options, as `scripts/outcome-meter.mjs` does. Not edited.
- `packages/nana-pack/lib/memory-making.mjs` — import `resolveEvidence`, `shape`, `memoryArgs`, `defaultMemoryRepo`.
- `packages/nana-pack/lib/memory-making-config.mjs` — import `PRIVATE_REFUSAL`, `CANDIDATE_FIELDS`, `WRAPPER_TAGS`.
- `packages/nana-pack/lib/memory-store.mjs` — import `mergeMemory` and `readMemoryStore` for the as-of-cut bundle store.
- `packages/nana-pack/lib/claude-transcript.mjs` — import `streamEntriesIn`, `assistantText`, `textFrom`, `privateFolder`.
- `packages/nana-pack/lib/pi-usage.mjs` — import the usage sum helpers.
- `packages/nana-pack/lib/outcome-meter-config.mjs` — import `CLAIM_CAP`.
- Exact sign-flip distribution by convolution: none: map search ("paired test mcnemar sign test") found no helper; written small in `memory-replay.mjs`.

map:search results taken: "rebuild context from transcript" returned `outcome-meter.mjs`, `claude-transcript.mjs`, `memory-making.mjs` (taken). "judge blind replay response" returned `anatomy-measures.mjs`, `anatomy.mjs`, `catch-judge.mjs` (the first two followed; `catch-judge.mjs` is reached through the runner). "render transcript conversation history text" returned `writing-trial-extractor.mjs` (skipped: it rebuilds report units, not a model context). "bundle memory delivery render" returned `nana-shared-memory.mjs` and `shared-memory-config.mjs` (the hook's command name is a slot marker; not imported). "paired test mcnemar sign test" returned nothing usable.

Map impact: `outcome-score.mjs` has callers `scripts/outcome-score.mjs`, `scripts/outcome-compare.mjs` and `packages/nana-pack/tests/outcome-meter.test.mjs`; all stay unchanged and green. `memory-store.mjs` and `memory-making.mjs` are imported, not edited. Expected file changes (a forecast, not a limit): new `packages/nana-pack/lib/memory-replay-context.mjs` (purpose: rebuild a seat's recorded context at a replay point with a swappable memory slot), `packages/nana-pack/lib/memory-replay.mjs` (purpose: select cases, replay the arms, judge blind and decide), `packages/nana-pack/lib/memory-replay-config.mjs`, `scripts/memory-replay.mjs`, `packages/nana-pack/tests/memory-replay.test.mjs`, synthetic fixtures under `packages/nana-pack/tests/fixtures/memory-replay/`; edits to `packages/nana-pack/lib/outcome-score.mjs` (export and kind-only shape), `package.json` (`memory:replay`), the pack README (runtime dependencies; the four subcommands; what is and is not rebuilt; the bias direction; strata and the ceiling arm; confirmatory versus exploratory; the one-machine limit; "a replay shows a bundle can prevent a repeat, not that it does in live work"), `REQUIREMENTS.md`, `docs/requirements-tree.md` and `docs/code-map.md` (regenerated). The seat adds `sealed.txt` to the lane folder.

Artifact entries (ruling 2026-10-22): `Artifact: A-097 · replay rows · user-home store: ~/<private replay root>/<run>/memory-replay.jsonl · manual: the seat runs npm run memory:replay -- run by hand`, with `Read by: A-097 · code: packages/nana-pack/lib/memory-replay.mjs` (`decide`). SUB-025 adds a `Reads:` line for A-091 (shaped candidates, for the as-of-cut bundle) naming `packages/nana-pack/lib/memory-replay.mjs`. It does not read A-093: the merged store carries the future (M2).

## Outside precedent

- UKGovernmentBEIS/inspect_ai (MIT) — borrow. Its split of solver from scorer and its epochs (repeated draws per sample, reduced per sample before the statistic) shape `run`, K and `decide`. Its model-graded scorer, which sees one output at a time, shapes the judge. Not adopted: it is a Python framework and would add a runtime and a provider path for owner text.
- Other public references: LongMemEval (xiaowu0162/LongMemEval, MIT), a benchmark of chat assistants' long-term memory over rebuilt histories; McNemar's exact test and the paired sign-flip permutation test (standard; written inline).

## Must-meet

Each test gets one new row, R-3370 to R-3377, in SUB-025. Every assertion naming a tunable imports it from `memory-replay-config.mjs`. All inputs are synthetic; every test uses a fake runner or an injected spawn. Eight must-meets, so no split.

1. **`plan` puts every correction in a stratum and spends nothing.** Fixture: four sessions and a labels file in both shapes. These are R: a correction with a `same` earlier instance from a session that started earlier, whose own instant precedes the repeat session's start; and a prompted decision asked again under the same rule. These are F: a correction with no earlier instance; a correction whose earlier instance is later than the repeat session's start (also counted `late earlier instance`); and a kind-only correction. Not cases: `changed` (counted `changed`), `valid: false` (`invalid`), an unprompted or first-time decision, a pointer missing from the snapshot (`unresolved`), and a session without `instructions` (`no recorded context`). stdout prints exactly `cases <n> R <r> F <f>`, one line per skip reason, `sessions <s>` and `case set <sha256>`. The same seed gives the same interleaved order; another seed changes the hash. The runner is never called. Pins R-3370.
2. **The rebuilt context holds exactly the recorded past, and arms differ only in the slot.** From a fixture session with a compaction, sidechains, thinking, bookkeeping attachments, a long tool result and later turns: the text holds the preamble, the recorded instruction files, the SessionStart output, the last compaction summary and the main-chain turns after the last boundary through P. It holds no entry after P, no thinking, no sidechain and no bookkeeping. The tool result is cut to the cap. Over budget, whole entries drop from the oldest end and P stays. Control, treatment and oracle texts are byte-equal once the slot span is removed. Control's slot holds the AutoMem file and the shared-memory output. Pins R-3371.
3. **Treatment sees only the past, merged with no events, and oracle holds one record.** From fixture candidates, the bundle keeps only candidates whose evidence instant precedes the cut. It drops a candidate citing a later session, and a same-day candidate from a session that starts after the cut. A same-claim candidate from the repeat session neither raises trust nor reorders the bundle. Order is by evidence instant, newest first, cut to the budget. A bundle holding the case's normalised quote is `leaked`. The R oracle slot holds only the earlier instance's rendered record; the F slot holds the case's own description, and its rows are marked `ceiling`. An injected maker receives the same as-of-cut list. Pins R-3372.
4. **The judge sees one reply at a time, blind, and fails closed.** For a case at K = 2 with three arms, the judge makes seven calls (six draws and the original), each holding the mistake description and exactly one reply under id `r1`. No call holds an arm word, pointer, session id, instant, model name, bundle text or a second reply. The original is rendered from recorded tool calls into the `TOOL …` format under the reply cap. A fenced reply is accepted. Prose around JSON, a wrong id or a verdict outside `repeats`/`avoids`/`stalls`/`unclear` rejects that call, and the draw is unjudged. An original judged other than `repeats` makes the case `judge-miss`. `decide --sheet` writes ten replies from informative cases only, with no arm or verdict. stderr holds no reply text. Pins R-3373.
5. **`decide` prints the paired statistic, attrition and confirmation from rows alone.** For a hand-computed K = 1 fixture of 12 cases (9 favour the bundle, 1 favours control, 2 tie), the lines are: `cases planned 12 informative 10 favour bundle 9 favour control 1`; the exact one-sided p with its level; per-arm repeat rates with Wilson intervals; R, F and pooled lines; and `bundle fewer repeats`. Swapping the arms prints `bundle more repeats` at its own level; a balanced fixture prints `no decision`; a K = 3 fixture matches a hand-enumerated sign-flip p. These are pinned too: the `unclear` rule (a case under the minimum judged draws per arm is `unjudged`); `stalls` counted against treatment; one line per drop reason; `undecided: too few cases` and `weak replay: control seldom repeats`; `oracle` and `ceiling` lines; `sessions <n>` with the session-level p; `cites bundle <c>/<t>`; `control would read memory <n>`; `runs on this case set 2` with the second run `exploratory`; `pending blind check` without `--blind-agree`; and `judge disagreement` under the bar. Pins R-3374.
6. **Spend caps stop at a case boundary, and an incomplete run says so.** Calls go case by case in the seeded order: control draws, treatment, oracle, then the judge calls. The fake runner's cost reaches the run cap during the second case, which finishes. Later cases are `unrun`, and `decide` prints the verdict with `incomplete` on the same line, plus the per-stratum counts that ran. A call with no usage prints `calls with unknown usage 1` and `cost unknown`. Each call carries its sealed per-call cap. `run` with a wrong `--expect` refuses with no call. Pins R-3375.
7. **`screen` keeps reproducing cases on fresh draws only.** `screen` runs control-only draws and keeps cases with at least one judged repeat. A following `run` makes fresh control draws on the kept cases. No screen draw appears in any `decide` count. The screen rule is in the case-set hash, so a screened set has a different hash from an unscreened one. Pins R-3376.
8. **Owner text stays private and goes only to the sealed Claude runner.** An output folder inside a checkout refuses with memory-making's refusal line. Outside, files are 0600 in a 0700 folder (modes skipped on Windows), and no existing file is overwritten. The temporary bundle store is private and removed after use. On success, and on a runner that throws carrying fixture text, stdout and stderr of all four subcommands hold no description, context, bundle, reply or pointer text. Through an injected spawn, the replay call carries runner `claude`, the sealed replay model and effort, `--tools ""`, `--setting-sources ""` and `--no-session-persistence`, with the prompt on stdin. The judge call carries the sealed judge model. Setting the shaping runner value to `pi` leaves both runners `claude`. Pins R-3377.

Sealed tunables, each pinned by one test naming its row (R-3378 to R-3389):
1. replay and judge runner
2. replay model and effort
3. judge model and effort
4. K and the screen rule
5. per-call dollar caps and the run cap
6. history budget, tool-result cap and reply cap
7. bundle budget
8. slot markers and the kept-entry allow-list
9. both levels, minimum informative cases (pooled and per stratum), minimum judged draws per arm, reproduction floor and blind-check bar
10. replay-preamble and judge-prompt SHA-256
11. `cites bundle` run length, timeout and `maxBuffer`
12. the output file name and the fixed words: `changed`, `invalid`, `unresolved`, `no recorded context`, `late earlier instance`, `leaked`, `unjudged`, `judge-miss`, `unrun`, `unclear`, `stalls`, `ceiling`, `oracle`, `confirmatory`, `exploratory`, `incomplete`, `bundle fewer repeats`, `bundle more repeats`, `no decision`, `undecided: too few cases`, `weak replay: control seldom repeats`, `pending blind check`, `judge disagreement`, `cites bundle`, `control would read memory`, `larger by`, `smaller by`

The case rule, cut rule, slot rule and counting rule are contract behaviour, pinned in must-meets 1 to 5.

## Cost per paired run (inferred)

Prices are from the claude-api model table: Opus 5.5 at $4/$20 per million tokens with cache reads at $0.20, and Sonnet 5 at $2/$10. A replay call carries about 50,000 input tokens and returns about 6,000 at `xhigh` (inferred).
- Per arm at K = 5: first draw about $0.32, four cached draws about $0.13 each, about $0.84 in all.
- Judge: 16 calls per case at about $0.02 each, about $0.32.
- Per case with three arms: about $2.85, or about $4.50 without cache hits.
- 46 cases: about $130 with cache hits, about $210 without. Two arms only (no ceiling on F): about $95.
- K = 3, three arms: about $90 for 46 cases.
- `screen` (optional): about $0.84 per case, about $40 for 46.
The seat's canary measures tokens per call before the first paid run and records them in `sealed.txt`.

## The seat's first run (after build 1)

1. Freeze: confirm the snapshot is the frozen copy and hash it.
2. Labels: the outcome-shape labelling above. `plan` runs either way; without the labels, R is empty.
3. Canary: one synthetic replay call and one judge call through the real runner.
4. `plan` with a fixed seed. Write `sealed.txt` with every seal, both prompt hashes, the seed and the case-set hash.
5. Bundle: the default as-of-cut maker over the frozen shaped candidates. It is a candidate, not a delivery. The first delivery lane's own maker gets its own confirmatory run on the same case set, before any tuning on per-case results.
6. `run`, then `decide --sheet`. The seat labels ten replies blind, then runs `decide --blind-agree <n>`.
7. Public record: method, `sealed.txt` and synthetic test results only. Counts, rates, p-values and verdicts stay private, and the seat reports them to the owner directly. The lane lands in every outcome.

## Residuals

- The rebuild is a cut: no Claude Code system prompt, no tool loop after the first reply, a JSON-wrapped reply (N1), and a transcript read as one message (N2). A replay shows that a bundle *can* prevent a repeat in a rebuilt moment; the field meter confirms live work.
- Control cannot open memory files, so the bias favours the bundle (S2, printed).
- Clustering: today's 46 cases sit in 6 sessions; the case-level test overstates power. The session-level line is a check, not a fix.
- Effort: replay runs at `xhigh`; the recorded ultra-effort mode has no recorded API level (N3).
- Knowledge-pull output may carry memory-like text in both arms. It dilutes the contrast but leaks nothing between arms (N4).
- Shaper batching can word an earlier claim with sight of a later unit. The leak backstop does not see that (N5).
- Pushback: a bundle that makes the seat agree more reads as fewer corrections; `stalls` catches only part of it (N8; a checking-station probe).
- Shared lineage: replay model, judge and blind check are all Claude, by the owner's choice of models for owner text.
- `cites bundle` shows unblinding risk but does not remove it.
- One machine, Claude Code seat only.

## Left for later lanes

- Staged probe moments as a separate stratum (M1.4).
- Reviewer-finding repeats from pi transcripts, with outcome-findings (M1.5).
- A plain-text replay runner option, if the canary's control reproduction is low (N1).
- Repeats after a compaction within one session.
- A real tool loop over a sandboxed checkout at the historical commit.

## Revision after the attack

- M1, pool too small: taken. Two strata, R and F; decisions R only; per-stratum and pooled lines (must-meets 1, 5). Wider R labels over the whole snapshot are in the seat's labelling step. The oracle arm is on R, and the `ceiling` arm on F covers today's empty R (owner question 2). Probes and reviewer findings are left for later lanes.
- M2, future through the merged store: taken. An as-of-cut bundle from candidates whose evidence instant precedes the cut, merged with no events, ordered by evidence instant; A-093 is no longer read (must-meet 3).
- M3, late earlier instances and `changed`: taken. R needs `same` and an earlier instant before the session start; `changed` is a skip; late ones go to F and are counted (must-meet 1).
- M4, `unclear`: taken. A sealed drop rule with a minimum of judged draws per arm; `stalls` verdict counted against treatment; both printed per arm (must-meet 5).
- M5, anchoring: taken. One reply per call; the original rendered in reply format under the reply cap (must-meet 4).
- M6, forking runs: taken. The seed in the hash, `runs on this case set`, first run per bundle maker confirmatory, fresh cases after tuning (must-meet 5, A12).
- S1 screen: taken as the optional `screen` subcommand with fresh draws (must-meet 7).
- S2 control handicap: taken. A printed count, and the bias stated in the README and verdict (A6).
- S3 levels: taken. Two sealed one-sided levels, each printed (A11).
- S4 sign-flip on d, K = 5: taken (A11, O1).
- S5 order and caps: taken. Seeded, interleaved by stratum, `incomplete` on the verdict line (must-meet 6).
- S6 blind-check bar: taken. 8 of 10 from informative cases, `judge disagreement` (A14, must-meets 4 and 5).
- S7 `cites bundle` baseline: taken. Both arms counted against the bundle (A15).
- S8 the owner's block: taken. Attrition per reason, oracle line and run count in must-meet 5. Must-meets are eight, so no split.
- N1, N2: N2 taken (reproduction per kind); N1 a residual with a later runner option.
- N3: taken. Model settled by the recorded data; effort `xhigh` with the reason; the ultra mode a residual.
- N4: residual.
- N5: residual.
- N6: taken (A18).
- N7: taken (A5 sentence fixed).
- N8: residual.
- N9: taken. The cap rises to 150 dollars (owner question 3), and the ceiling arm is an owner question.
- The old question "today's model or the original" is settled: every case session ran `claude-opus-5-5`.
