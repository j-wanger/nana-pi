# Plan — memory-shaper

Lane: memory-shaper · branch `feat/memory-shaper` from main e5db630e · worktree `~/nana-pi-wt/memory-shaper`
Sequencing: builds after lane memory-making (branch `feat/memory-making`, PR #280) lands. The builder starts from main with memory-making merged, so every memory-making path below is read from main at build time.
Grounding: the seat's private factory design and idea catalogue (outside the repo), memory-making's plan and code on `origin/feat/memory-making`, and the seat's scoring-run folder outside the repo. The planner read that folder's enumeration and labelling scripts (code, no owner text) and counted the label file's pointer forms and kinds; it read no label text and no turn text. The adversary's findings are in `plan-attack.md` in this folder; this plan is revised to take them (last section).

Lane class: `node scripts/lane-class.mjs --root . --files packages/nana-pack/lib/memory-shaping.mjs,packages/nana-pack/lib/memory-shaping-config.mjs,packages/nana-pack/lib/memory-making.mjs,scripts/memory-shape.mjs,packages/nana-pack/tests/memory-shaping.test.mjs,packages/nana-pack/tests/fixtures/memory-shaping/session.jsonl,package.json,packages/nana-pack/README.md,REQUIREMENTS.md,docs/requirements-tree.md,docs/code-map.md` prints `ordinary`. No hook, pi extension, install step, gate policy or land/review tool is touched. One final reviewer, the roster's.

## Purpose

Agreed reading (the owner, 2026-10-31, paraphrase-safe): the six-station memory factory; ideas are not dropped for weak evidence, experiments decide. Memory-making's plan fixed the follow-on: if the seat's rule-based scoring run missed the bar, the next lane is a model-call shaper scored on the same labels. The run missed it (correction recall 8/46, decision recall 119/162, lesson recall 56/56, precision 183/310). This lane is that shaper: station 1 (Making) with a model pass, emitting the station 2 shape, scored by memory-making's unchanged scorer against the same frozen labels. The tool is the experiment: the lane lands whether or not the shaper beats the rules.

What this lane builds:

- `npm run memory:shape` — walks the same units memory-making's maker walks (owner turns in this repo's Claude Code transcripts, answered `AskUserQuestion` pairs, distinct review MUST titles per lane), and writes shaped candidates to a private folder outside any git checkout.
  - Owner turns and review titles go to a model in batches, **one source per batch**, each source with its own reply schema and allowed kinds: owner turn → `correction | decision | none`; review title → `lesson | none`. Per unit the model returns one kind and one claim: a self-contained sentence an agent could act on without opening the transcript. `none` yields no candidate.
  - Answered `AskUserQuestion` pairs stay on the rule path: they are structured decisions, and the model adds nothing.
  - One structural pre-filter: an owner turn with no **seat entry** before it in its transcript is not sent. A seat entry is defined once, exactly as the labelled set's enumeration defines it: an entry that is not a sidechain and not meta, has a uuid, and has non-empty `assistantText(entry).trim()`. A tool-use-only assistant entry is not a seat entry. Reason: a correction corrects something the seat said and a decision answers or chooses on it; with no seat text there is nothing to pair. It also drops every headless builder brief in a worktree folder.
  - Candidates use memory-making's shape and field list unchanged, `trust: low`, `source: extracted`, built by memory-making's own record builder (see Precedent). `quote` is the owner text or review title; `context` is the paired seat text, tail-cut; `claim` is the model's sentence, capped.
  - `--until <ISO instant>` drops owner turns and ask pairs whose entry timestamp is after the instant, while pairing state still updates from every earlier entry.
  - stdout prints the unit counts the seat checks before scoring: `owner turns <n>` (sent plus skipped), `skipped <n>`, `asks <n>`, `review titles <n>`.
- The model call is injected. The library takes `runModel({ system, prompt, schema })` returning `{ ok, text, usage: { tokens, cost } | null }`; tests pass a fake, so no test calls a model. Two real runners live in the script, and one sealed config value picks between them:
  - **claude** (default): an isolated `claude -p` call following `apps/bench/lib/catch-judge.mjs`.
  - **pi**: an isolated one-shot `pi --mode json` call parsed with the bench's `parseStream`.
  Both are about 30 lines over the same interface, so the owner's answer (Question 1) and any later lineage reading cost one config value, not a rebuild.
- A spend cap and spend accounting: total tokens per run, from the runner's own usage numbers. When the running total reaches the cap, no further call starts and the remaining units count as `unsent`. A call whose usage is unknown (did not complete) is counted as such; the cost then prints `cost unknown` and the token total prints as a lower bound. The claude runner also passes a sealed per-call dollar cap.

How the builder works without spending: the builder never reads real transcripts, real labels, the seat's scoring folder or its snapshot, and never launches a real runner. Every test uses synthetic fixtures, the fake runner, and an injected spawn for the two runners. The real runs are the seat's, after build 1.

The seat's comparison run (after build 1, before the final round, outside the repo, counts only into the lane folder):

- Frozen inputs (seat decision): transcripts from the private snapshot `~/nana-memory-runs/2026-10-31/transcripts/` (the 340 labelled transcript files, Claude projects layout kept) through memory-making's `--root`; `--until` set to the enumerator's run time; reviews from a private snapshot of `docs/reviews` at e5db630e (`git archive e5db630e docs/reviews`) through `--reviews`. The pointer form `review:<lane>/<file>#<i>` carries no root, so labels still match.
- Count check before scoring: the shaper's stdout must show 573 owner turns, 23 asks and 146 review titles, the labeller's enumeration. A mismatch is an input problem; the seat fixes the inputs and reruns, and no score is read.
- Canary first: one call on a synthetic fixture batch through the chosen real runner; the reply must validate and report non-zero tokens before any owner text is sent.
- Prompt freeze: the seat records the system prompt's SHA-256 and every sealed value in `docs/reviews/memory-shaper-2026-10-31/sealed.txt` before the first scored run. The final reviewer checks the landing tip's values against that record. Inside this lane the seat may not edit the prompt, the caps or the model from what the scores show; any later change is scored only on a fresh window labelled after this lane's tip.
- Blindness: `memory:shape` takes no labels input. The builder's brief carries the kind definitions below and nothing from the seat's analysis of the rule run's misses.
- Command: `npm run memory:shape -- --root <snapshot> --reviews <review snapshot> --until <instant> --out <private folder>`, then `npm run memory:score -- --candidates <folder>/shaped-candidates.jsonl --labels <frozen labels>`. Two runs at the same tip, into two folders.
- Bar (memory-making's, chosen there, not measured, plus lessons): correction recall ≥ 0.70, decision recall ≥ 0.70, lesson recall ≥ 53/56 (the rule run's 56/56 less a chosen tolerance of three), precision over all candidates ≥ 0.80, zero unlabelled, zero unsent. It must hold in both runs.
- What the seat does with each outcome. The lane lands in every case; the counts go in the lane folder before the final round.
  - Both runs over the bar: the seat records "the shaper is the maker for the storing lane" as a separate decision beside the counts.
  - Either run under the bar, scored cleanly: the seat brings the owner a decision point with both runs, the rule baseline and the spend (a larger model, a second pass on one kind, the other runner's lineage, or a relabel). The rules stay the maker meanwhile.
  - Unscored (unlabelled > 0 with the count check passing): a pairing bug; it goes back to the builder before the land.
- Readings beside the numbers: the rule baseline; tokens and cost per run (pi's openai-codex price is list price, not the subscription's real cost); kind agreement between runs; skipped, cut and `unclassified` counts, with `unclassified` reported beside recall so a batch failure is not read as model judgement; a usability count out of 20 sampled hits.

Kind definitions the prompt carries (the labelling agent's own definitions, seat decision; no owner text):

- correction: the owner corrects or redirects the agent's behaviour or output.
- decision: the owner chooses or approves something that constrains future work, including one-word answers to a question and `AskUserQuestion` answers.
- lesson: a review title stating a defect class another lane could learn from.
- none: anything else.

Any wording the builder adds around these (reply format, claim instruction) is disclosed in the build report as written after the seat's miss analysis was known.

## Assumptions

- A1. Imports from memory-making, never copies: the field list, starting words, roles, claim cap, timezone, owner-turn rule, question pattern, context minimum, review exclusion, the record builder, `resolveEvidence`, `privateFolder`, `memoryArgs`, `defaultMemoryRepo` and the counts-only output form.
- A2. Unit set: memory-making's default scope and `--root`/`--reviews`/`--project` flags. The planner counted the frozen label file's pointer forms: the pre-filter drops one positive label (one decision) against 340 turns with no seat entry. That count is label-informed and disclosed; the rule stands on its structural reason.
- A3. Pointer pairing matches the labelled set's: correction → last substantial seat entry since the previous owner turn, else last question entry since then, else last seat entry before the turn in the transcript (not reset at owner turns); decision → question first, then substantial, then the same fallback. The labelled set puts `none` on whichever of substantial and question is not primary, so a correction/decision mix-up scores as one false candidate, not unlabelled.
- A4. No `+none` pointers: the pre-filter removes every turn that would need one. memory-making's resolver stays unchanged.
- A5. The model sees, per owner turn: the owner text (head-cut) and the paired seat text (tail-cut, where questions and proposals sit), plus the last question sentence when it comes from another entry. Per review title: the title only, as the labeller saw it.
- A6. Prompt structure: fixed leading text, then the batch as one `JSON.stringify` array of `{id, owner, context, question}` or `{id, title}` with batch-local ids `u1`…`uN`, mapped back in code; the pointer never goes to the model.
- A7. Validation at the boundary, deterministic: the reply text, after stripping one surrounding code fence, parses as JSON holding exactly the batch's ids, each kind in that source's allowed set, a non-empty claim for every non-`none` kind. Any failure rejects the whole batch (its units count as `unclassified`); no retry; spend still counts. A caught parse error's message is never printed (Node's `SyntaxError` quotes the input).
- A8. Runners: no session file kept, no tools, no extensions or settings sources, no MCP, no context files, a replaced system prompt, prompt on stdin, cwd the OS temp folder, `NANA_ROLE=worker`, all three stdio streams piped, a sealed `maxBuffer`, a sealed timeout. claude: `-p --model --effort --output-format json --json-schema --tools "" --strict-mcp-config --no-session-persistence --setting-sources "" --system-prompt --max-budget-usd`, the `modelUsage` check from catch-judge, never `--bare`. pi: `--mode json --no-session --no-tools --no-extensions --no-skills --no-prompt-templates --no-context-files --system-prompt --model --thinking`, launched through `piLaunch`, `parseStream`'s completeness rather than `settled` alone.
- A9. Privacy: memory-making's contract extended to model replies. `shaped-candidates.jsonl` is opened exclusive-create, 0600 in a 0700 folder outside any checkout; the folder gains no other file (no stream dumps). stdout and stderr carry counts and fixed lines only, never owner text, claims, context, reply text or runner error text.
- A10. Duplicate owner turns (same `<session>#<uuid>` in two files; measured 0 today) are deduped, first file in `transcriptFiles` order wins.
- A11. IDs: FEAT-040 rows R-3251 to R-3269; this lane uses R-3251 to R-3269 (7 must-meets, 12 seals). Artifact A-091. The rows go in a new subgroup under FEAT-040, taking the next free SUB ID at build time.

## Open choices

- O1. Starting values, sealed with `chosen` provenance: claude model `claude-sonnet-5` at effort `low`; pi model `openai-codex/gpt-6-luna` at thinking `low`; 10 units per call; owner text 4000 characters; seat context 2000 characters; 1,000,000 tokens per run; 0.50 dollars per claude call; 300 seconds per call; `maxBuffer` 64 MiB (catch-judge's). Estimate (inferred): 233 sent turns and 146 titles, about 40 calls.
- O2. The prompt wording around the kind definitions. Sealed by its SHA-256.
- O3. Whether the unit walk is one exported generator or two.
- O4. Whether the two runners stay in `scripts/memory-shape.mjs` or a small module beside it in `scripts/`.

## Questions for the owner

Question: Should the shaper's model be a Claude model through an isolated `claude -p` (default), or the OpenAI builder model through pi?
Default: Claude, `claude-sonnet-5` at low effort, two runs, no session files kept.
What the default gains and misses: gains no new provider for owner text, since seat transcripts already go to Anthropic; misses that a Claude shaper shares the labelling agent's lineage, which could flatter the scores.
Cost of a wrong guess: hard to undo — owner text sent to a provider cannot be recalled.
If answered otherwise: the seat sets the runner value to `pi` before the scored runs; both runners are built, so nothing else changes.

## Feature

Feature: FEAT-040 · Make and keep memory

Rows go in a new subgroup, `SUB-nnn · Shape memory candidates with a model`. Purpose line: "Classify owner turns and review findings with a capped, isolated model pass into the same shaped candidates, so they score against the same labels as the rules."

## Threat model

In scope: honest variation in our own tools' output and in the model's. Every transcript shape memory-making handles; owner turns up to about 90,000 characters; owner turns that are themselves pasted prompts, JSON, headings or code fences; sessions whose first owner turn has no seat text; assistant entries with only tool use; inputs that change between labelling and scoring (live sessions growing, review folders landing, transcripts expiring after 30 days); model replies that are not JSON, wrap JSON in prose or fences, drop or add an id, give a kind outside the source's set, or leave a claim empty; runner calls that time out, overflow the buffer, exit non-zero, or report no or unpriced usage.

Out of scope: deliberate forgery — a planted transcript or review crafted to steer the model (prompt injection into memory). The checking and delivery stations own it. A finding outside this model is a residual and becomes a known-bug line.

Public-repo rule: no owner text, quote, label or model reply enters any repo file. Fixtures are synthetic. The seat pastes only counts and the sealed-values record into the lane folder.

## Precedent

- `packages/nana-pack/lib/memory-making.mjs` (on `feat/memory-making` until it lands). **Helper moves:** (1) the walk inside `transcriptCandidates` (with its private `ownerTurn`, `textOnly`, `askCalls`, `askAnswer`, `inWindow`, `sourceFiles`) and inside `reviewCandidates` becomes exported unit generators in the same module, yielding owner text, the substantial, question and last-seat entries with uuids and texts, the ask pair, and the day, and tracking the last seat entry by the seat-entry definition above; (2) the private `shape` is exported with an optional claim and context override (or split into a record builder plus the rule claim form), so the shaper builds records with the same field list. The rule maker consumes both and keeps its behaviour; `packages/nana-pack/tests/memory-making.test.mjs` stays green unchanged. Also imported: `resolveEvidence`, `memoryArgs`, `defaultMemoryRepo`.
- `packages/nana-pack/lib/memory-making-config.mjs` — the shape and sealed words. Import; add nothing to it.
- `packages/nana-pack/lib/memory-score.mjs` — the scorer, unchanged.
- `packages/nana-pack/lib/claude-transcript.mjs` — `privateFolder`, `streamEntriesIn`, `assistantText`, `edtDay`. Import.
- `apps/bench/lib/catch-judge.mjs` — the claude runner's precedent: `claude -p` flags, `--json-schema`, `--max-budget-usd`, injectable `spawn`, the `modelUsage` model check, fail-closed id-set validation (`validateLabels`). Follow; its `MODELS` and guides are not imported.
- `apps/bench/lib/usage.mjs` — `parseStream` for the pi runner. Imported from `scripts/memory-shape.mjs` (scripts and apps share the first layer; a pack module may not import an app). The pack library sums usage with `packages/nana-pack/lib/pi-usage.mjs`.
- `packages/nana-pack/bin/pi-watchdog.mjs` — `piLaunch` for the Windows pi launch, as `packages/nana-setup/lib/pi-invocation.mjs` uses it. Import.
- `packages/nana-pack/bin/worker-config.mjs` — the child role environment words; follow `NANA_ROLE` as the worker launcher sets it.
- `scripts/memory-make.mjs` and `scripts/memory-score.mjs` — the npm-script form and counts-only output. Follow.
- `packages/nana-pack/tests/fixtures/memory-making/` (including its hand-written `labels.jsonl`) — copy the form, not the files, into `fixtures/memory-shaping/`.

map:search results taken: "call a model with pi print mode" returned `apps/bench/run.mjs` and `usage.mjs` (usage taken; orchestration skipped). "injected runner model call tests never call a model" returned `ci-records.mjs` and `land-ci-records.mjs` (injected-runner form, followed). "spend cap token budget" and "parse pi json usage cost" returned `usage.mjs` and `pi-usage.mjs` (taken). "classify text with a model" returned the review launchers (skipped). "score candidates against labels" returned `catch-judge.mjs`, `catch-ledger.mjs`, `catch-stats.mjs` (`catch-judge.mjs` taken). "private output folder outside git" returned gate and suite-record modules (skipped; `privateFolder` covers it).

Map impact: `memory-making.mjs` is not on main yet; on its branch its callers are `memory-score.mjs`, `scripts/memory-make.mjs` and `memory-making.test.mjs`. `usage.mjs` is imported, not edited. Expected file changes (a forecast, not a limit): new `packages/nana-pack/lib/memory-shaping.mjs`, `packages/nana-pack/lib/memory-shaping-config.mjs`, `scripts/memory-shape.mjs`, `packages/nana-pack/tests/memory-shaping.test.mjs`, fixtures under `packages/nana-pack/tests/fixtures/memory-shaping/`; edits to `packages/nana-pack/lib/memory-making.mjs` (exports only), `package.json` (`memory:shape`), the pack README command list, `REQUIREMENTS.md`, `docs/requirements-tree.md` and `docs/code-map.md` (regenerated). The seat adds `sealed.txt` and the counts to the lane folder.

Artifact entry (ruling 2026-10-22): `Artifact: A-091 · shaped memory candidates · user-home store: ~/<private --out folder>/shaped-candidates.jsonl · manual: the seat runs npm run memory:shape by hand`, with `Read by: A-091 · code: packages/nana-pack/lib/memory-score.mjs`.

## Outside precedent

- mem0ai/mem0 (Apache-2.0) — borrow. Its extraction phase sends a conversation turn to a model with a fixed prompt and takes back a JSON list of candidate facts, before a separate update phase. This lane borrows the one-prompt, JSON-out extraction step and adds a per-source kind list, an evidence pointer per candidate, a spend cap, and scoring against frozen labels. Mem0's update phase stays with the upkeep station.
- Other public references: the LLM-as-annotator practice of freezing the prompt before scoring and holding out a fresh set for any prompt change (taken as the prompt freeze in Purpose).

## Must-meet

Each test gets one new row, R-3251 to R-3257. Every assertion naming a tunable imports it from `memory-shaping-config.mjs` or `memory-making-config.mjs`. All inputs are synthetic; every test uses the fake runner or an injected spawn.

1. **A long redirect with no cue word becomes a shaped correction, and `none` yields nothing.** Fixture: a substantial seat block, then an owner turn that redirects the work with none of memory-making's cue words; a seat question, then a long owner turn that both chooses and directs; a review lane with two titles. The fake returns `correction`, `decision`, `lesson` and `none`. `memory:shape` writes exactly three candidates, each with memory-making's field list in order, `trust: "low"`, `source: "extracted"`, memory-making's roles per type, `claim` equal to the fake's claim, `quote` equal to the owner text or title, and `context` equal to the tail of the paired seat text. Pins R-3251.
2. **Pointers pair as the labelled set does, scored by the unchanged scorer.** Fixture session: a substantial seat block, a status reply, a seat question, then an owner turn; a second turn with only a substantial block since the previous turn; a third with neither since then but older seat text. A hand-written labels file in the labeller's form (kind on the primary pointer, `none` on the other of substantial and question, fallback only when both are absent) labels the first turn `correction` and the others `decision`. Run one (fake: correction, decision, decision) scores full recall and `unlabelled 0`; run two (fake: decision for the first turn) scores one false candidate and `unlabelled 0`. An answered `AskUserQuestion` pair yields its rule-path decision with no runner call. No pointer ends in `+none`. Pins R-3252.
3. **The input is the frozen set, and the model never sees what it cannot pair, or the labels.** An owner turn whose only earlier assistant entry is tool-use only, and a session's first owner turn, reach no prompt and count as skipped. With `--until` one second before a turn, that turn and a later ask pair yield nothing, while an earlier turn still pairs with seat text before the cutoff. stdout prints `owner turns`, `skipped`, `asks` and `review titles` counts matching the fixture. `--labels <file>` fails with memory-making's fixed argument failure and no runner call. Owner text over the cap reaches the runner head-cut; seat context over its cap tail-cut; stdout counts both. Pins R-3253.
4. **A bad model reply fails closed per batch, and units cannot swap.** One batch per source never mixes owner turns and titles. Batches: valid JSON in one code fence whose owner text holds a code fence and a fake `{"id": "u2"}` line (accepted, each claim lands on its own unit); prose around valid JSON; a missing id; an extra id; `lesson` for an owner turn; `decision` for a title; an empty claim on a `decision` (all rejected). Each rejected batch's units count as `unclassified`, the run continues, the runner is called once per batch, failed calls' usage still counts, and stderr holds no reply text. Pins R-3254.
5. **The spend cap stops new calls, and unknown spend is never shown as known.** The fake reports a fixed token count per call so the cap is reached after the second call: exactly two calls, the rest `unsent`, stdout `calls 2`, the token total, and the sealed line `unscored: spend cap reached`. A second run where one call returns no usage prints `calls with unknown usage 1`, `cost unknown` and the token total marked as a lower bound; a call with tokens but zero cost also prints `cost unknown`. Pins R-3255.
6. **The claude runner is isolated, and nothing private leaves through output.** With an injected spawn, argv holds `-p`, the sealed model and effort, `--output-format json`, `--json-schema`, `--tools ""`, `--strict-mcp-config`, `--no-session-persistence`, `--setting-sources ""`, `--system-prompt`, `--max-budget-usd` with the sealed value, no `--bare`, and no owner text; the prompt is on stdin; cwd is the OS temp folder; env has `NANA_ROLE=worker`; stdio is piped with the sealed `maxBuffer` and timeout. A reply naming another model, `is_error`, or a non-zero exit is a failed call. End to end: `--out` inside a fixture checkout refuses with memory-making's refusal line; outside, `shaped-candidates.jsonl` is 0600 in a 0700 folder (modes skipped on Windows) beside a pre-existing `candidates.jsonl` left byte-identical, and the folder holds no other file. On success and on a runner that throws with fixture owner text in its message, stdout and stderr hold no owner text, claim, context or reply text. Pins R-3256.
7. **The pi runner is isolated and reads its stream whole.** With an injected spawn, argv holds `--mode json`, `--no-session`, `--no-tools`, `--no-extensions`, `--no-skills`, `--no-prompt-templates`, `--no-context-files`, `--system-prompt`, the sealed model and thinking level, and no owner text; the prompt is on stdin; launch goes through `piLaunch`; spawn options match test 6's. A fixture stream over 1 MiB parses to its reply and usage; a stream without a completed assistant message is a failed call with unknown usage. Swapping the sealed runner value from `claude` to `pi` sends the same batch through this runner with no other change. Pins R-3257.

Sealed tunables, each pinned by one test naming its row (R-3258 to R-3269): runner choice, claude model and effort, pi model and thinking level, units per call, token cap per run, dollar cap per claude call, owner-text cap, seat-context cap, per-call timeout, `maxBuffer`, the system prompt's SHA-256, and the output file name with the fixed stdout words (`unsent`, `unclassified`, `skipped`, `unscored: spend cap reached`). The per-source allowed kinds are a contract value pinned inside must-meet 4.

## Left for later lanes

- A fresh-window labelled set after this lane's tip, to score any prompt or model change honestly.
- Shaping other sources (pi sessions, land records, CI, known-bug lines) through the same pass.
- `+none` pointer resolution, if a later source emits turns with no seat text.
- Prompt-injection defence for delivered records (checking and delivery stations).
- Store, upkeep, trust promotion and delivery (stations 3 to 6).

## Revision after the attack

- M1, scored input not frozen: taken with seat decision 1. Private transcript snapshot through `--root`, a new `--until` flag (must-meet 3), a review snapshot at e5db630e through `--reviews`, and a unit-count check against 573/23/146 before scoring; a count mismatch is an input problem, not a pairing bug.
- M2, bar drops lessons: taken with seat decision 2. Lesson recall ≥ 53/56 joins the bar; the lane lands in every outcome and Purpose says what the seat does with each.
- M3, kind invalid for its source: taken. One source per batch, per-source schema and allowed kinds; the two wrong-source cases are in must-meet 4.
- M4, Claude not one config value away: taken with seat decision 3. Default is Claude through an isolated `claude -p` following catch-judge; the pi runner is also built (must-meet 7), so the switch is one sealed value; the owner question now states the true trade.
- M5, seat text vs seat entry: taken. One definition, matching the enumeration; a tool-use-only entry is in must-meet 3.
- S1, units not isolated: taken. JSON array, batch-local ids, fixed leading text (A6); a fence-and-fake-id unit is in must-meet 4.
- S2, spawn buffer: taken. Sealed `maxBuffer`, piped stdio; a stream over 1 MiB is in must-meet 7.
- S3, unknown usage: taken. `calls with unknown usage`, `cost unknown`, lower-bound tokens, zero-cost check (must-meet 5); the list-price note is in the readings.
- S4, seat-written prompt: taken with seat decision 4. The labelling agent's definitions verbatim; any added wording disclosed; the prompt hash and sealed values recorded in `sealed.txt` before the first scored run and checked by the final reviewer.
- S5, private `shape`: taken. Its export with a claim and context override is named under Precedent; stored context is tail-cut.
- S6, contradictory must-meet 2: taken. Hand-written labels in the labeller's form; full recall in the matching run, one false candidate in the other, `unlabelled 0` in both.
- S7, land condition: taken. The lane lands in every outcome; counts go in the lane folder before the final round; the maker switch is a separate recorded decision.
- S8, canary: taken. One synthetic-batch call through the chosen runner before any owner text is sent. `--offline` not added.
- N1, duplicates: taken (A10).
- N2, batch rejection cost: taken. `unclassified` is reported beside recall.
- N3, unlisted seals: taken. Runner choice, effort, dollar cap, `maxBuffer` and the stdout words are sealed; per-source kinds are a contract value in must-meet 4. The fence strip is behaviour pinned in must-meet 4, not a tunable.
- N4, nothing else in `--out`: taken (must-meet 6).
- N5, parse errors quote input: taken (A7, must-meet 4).
- N6, threat model: taken. Pasted prompts and changing inputs are named in scope.
