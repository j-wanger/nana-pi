# Plan — trigger-screen (revision 2)

Lane: trigger-screen · branch `feat/trigger-screen` from origin/main 0bd1df89 · worktree `~/nana-pi-wt/trigger-screen`
Grounding: `research/raw/2026-11-01-memory-pull-trigger/report.md` (untracked; this lane commits it), SUB-025 rows R-3370..R-3389, `docs/known-bugs/FEAT-043.md`, `docs/reviews/memory-replay-2026-11-01/plan.md` (for the decisions it records only), the code named under Precedent, and the adversary's attack `docs/reviews/trigger-screen-2026-11-01/plan-attack.md` (revision 1; dispositions at the end).

Lane class: `node scripts/lane-class.mjs --root . --files packages/nana-pack/lib/trigger-screen.mjs,packages/nana-pack/lib/trigger-screen-config.mjs,packages/nana-pack/lib/memory-replay.mjs,scripts/trigger-screen.mjs,packages/nana-pack/tests/trigger-screen.test.mjs,packages/nana-pack/tests/memory-replay-fixture.mjs,packages/nana-pack/tests/memory-replay.test.mjs,package.json,REQUIREMENTS.md,docs/requirements-tree.md,docs/code-map.md,packages/nana-pack/README.md,README.md,docs/known-bugs/FEAT-043.md,research/raw/2026-11-01-memory-pull-trigger/report.md,docs/reviews/trigger-screen-2026-11-01/plan.md` prints `ordinary` (re-run for revision 2). No hook, pi extension, install step, gate policy or land/review tool is touched. One final reviewer, the roster's.

## Purpose

Agreed reading: the owner said "Yes run the test" on 2026-11-01 to the seat's proposal, which was the report's "Recommended first experiment: trigger screen, zero spend". The question it answers, verbatim: "Does any trigger put the earlier record in front of the agent for the 12 repeats, and does a model arm beat BM25 at it?" The result decides whether prompt-time model work continues (bar 1 stops it; bar 2 keeps BM25; bar 3 sends one model arm to the paid SUB-025 replay).

This lane builds the screen runner and its tests. It changes no hook and no agent's context. The seat runs the real screen after the land, on private inputs, and reports counts only to the owner. No API spend; the builder downloads no model.

One hand-run command, `npm run memory:trigger -- --in <private replay root> --expect <replay case-set hash> --labels <private labels> --candidates <private candidates> --root <frozen snapshot> --seed <seed>`:

1. **Positives.** Read the seat's frozen SUB-025 plan (`plan.json`, checked against `--expect` with the replay's own `checkedPlan`). Positives are the plan's stratum R cases of kind `correction` with status `planned`. The command refuses unless there are exactly 12. It also refuses when the snapshot's file list differs from the plan's `files`, or the candidates' hash differs from the plan's `candidatesHash`. Each positive's replay point is recomputed from the snapshot with the extracted `replayPoint`; the command refuses unless the point's rendered owner turn equals the final `USER:` entry of the case's stored `context.history` (attack 10). Its candidate pool is the plan's `bundleRecords` for that case: the pre-cut store, unchanged.
2. **Labels.** The labels file is read with `readOutcomeRows(file, true)`. Its SHA-256 prints as `labels <sha256>` and enters the screen-set hash. The command refuses when any positive's label is missing, has `relation` other than `same`, or has an empty `repeatOf` (attack 5): a kind-only or wrong labels file refuses instead of reading as n = 0.
3. **Targets.** A positive's target set is the records in its pre-cut pool whose `evidence` is one of the label's `repeatOf` pointers. A hit is any delivered record in that set. A positive with an empty target set is excluded from scoring (owner answer 1). The scored count n is the positives with at least one target, and every arm is scored on the same n.
4. **Negatives.** Owner turns from the frozen snapshot, only in sessions that hold at least one row of the labels file (attack 4), ordered by `sha256(seed:pointer)`, top 200. An owner turn is eligible when neither of the next two owner turns in its session is a correction-labelled owner turn. Fewer than 200 eligible turns are all used, and the line prints the count. Each negative's pool is built by the extracted `preCutPool`, cut at its session's start.
5. **Query text.**
   - A: the prompt, cut to `PROMPT_MAX_CHARS` (imported from nana-knowledge `tokenize.ts`).
   - B and C: the same cut prompt, then the last 1,000 characters of the agent turn **before** the replay point. That is the assistant entries before the point's owner turn, rendered with `renderReplayEntry`, never the entries between the point and the correction (the corrected turn, the plan's `original`) (attack 6).
6. **Skip.** Today's `skipReason` applies to arm A only, as the report does (attack 1). B and C skip only when their query text has no meaningful token (`meaningfulTokens(text).length === 0`, imported). Each arm prints `skipped <k>` over positives and negatives.
7. **Record text.** One sealed record text serves all three arms for retrieval and judging: claim, a newline, then context (attack 9). Delivery is the claim only.
8. **Arms**, each delivering whole claims, one per line, at most `TOP_K`, within `BLOCK_MAX_CHARS` (both imported from nana-knowledge `hook.ts`, attack 8). A claim that would pass the budget ends the list (the `renderBlock` rule). Delivery has no header, so the whole budget goes to claims, equally for every arm; the hook spends part of its budget on a header (a residual).
   - **A** — today's engine on records. A private temporary FTS5 index built with nana-knowledge `openDb(..., {create: true})` holds one doc per pool record (title = claim; body = record text). Query through nana-knowledge `search`. Top `TOP_K`.
   - **B** — BM25 plus embedding, fused by reciprocal rank. BM25 top 20 (A's engine on B's query text) and EmbeddingGemma cosine top 20, fused with RRF k = 60. Top `TOP_K`. No gate.
   - **C** — laya-mlx zero-shot over **B's fused top 20**, as the report sizes it (attack 3). The gate question comes first: P(pull) below 0.5 delivers nothing. Then the 20 relevance questions go in **one batched `decide` call** per input. Candidates with P(relevant) of 0.5 or more are ranked by P(relevant). Top `TOP_K`. Code applies the thresholds and budget, never the model. Each question is the sealed question, then the record text, then the query text. The query text is cut so the whole question fits a sealed character cap; the record is never cut. Each arm prints `truncated <k>`.
   - **C ungated (diagnostic).** On positives only, C also asks the relevance batch when the gate closes, untimed, and prints `C ungated hits <k>` (attack NOTE 17). It feeds no bar.
9. **Model failures.** Arms B and C reach local models only through two injected async functions, `embed(texts)` and `decide(questions)`.
   - Warm-up: one call per model arm, which must return the expected shape (numbers in [0, 1] for `decide`, finite vectors of one length for `embed`). Otherwise the arm is `unavailable` (attack 2a).
   - After warm-up, a call that errors, times out, or returns the wrong shape counts as one failure for that arm and delivers nothing for that input. Each arm prints `failed <k>` (attack 2b).
   - An arm is `degraded` when any positive input failed, or when its failures pass a sealed cap. A degraded arm makes no further model calls, so a hung daemon cannot run for hours (attack 2c, 3).
   - Each input also has a sealed per-input deadline across all its calls; passing it is one failure.
10. **Measures.** Hits out of the scored n per arm. Mean characters delivered per negative, and the share of negatives with any delivery. Warm p95 latency per arm, nearest rank, over the inputs where that arm ran (not skipped), timed by an injected clock; the line prints `timed <k>` (attack 3). A's timed span excludes its index build; B's and C's exclude record embedding; C's span includes B's BM25 and query embedding, because C ranks B's list (NOTE 19). C's gate-closed inputs stay in its p95, because a live gate-closed turn costs exactly that; C also prints `p95 ms open` over gate-open inputs as a diagnostic. A failed call's latency counts at the per-call timeout. Wins and losses per model arm against A, per positive, overall and per session.
11. **Verdict**, bars applied in the report's order. A degraded arm counts as unavailable for every bar. A bar that needs an unavailable arm prints `incomplete`.
   - Bar 1, `signal floor`: all three arms are available and each hits at most floor(n × 3 / 12).
   - Bar 2, `bm25 enough`: A hits at least ceil(n × 9 / 12).
   - Bar 3, `advance <arm>`: the arm has wins − losses ≥ 3, losses ≤ 1, mean characters on negatives ≤ A's, and warm p95 ≤ 300 ms. When two arms pass, both advance and the line names both.
   - Otherwise `no arm advances` when every model arm is available, else `incomplete`.
   - With n = 0, the verdict is `incomplete`.

   Scaling (owner answer 1): bars 1 and 2 keep the report's fractions, 3/12 and 9/12, of the scored count n. Bar 1 rounds down and bar 2 rounds up, so each bar is met only at or beyond its fraction, and n = 12 gives exactly 3 and 9. Worked values: n = 11 gives 2 and 9; n = 10 gives 2 and 8; n = 8 gives 2 and 6; n = 4 gives 1 and 3. Bar 3 stays absolute, as the owner scaled only bars 1 and 2; a smaller n makes it harder to pass, never easier. The fractions are sealed as numerator and denominator pairs, and the rounding directions are pinned.
   Bar 3 prints each of its four conditions as `pass` or `fail` per available model arm, even when bar 1 or 2 decides (attack 7). The verdict line prints `scored <n>`, `excluded <12 − n>` and `sessions <k>` (attack 12).
12. **Output.** Counts-only stdout lines built from sealed words and numbers: screen-set hash, labels hash, positives, scored, excluded, sessions, negatives, per-arm skipped, failed, truncated, hits, mean chars, delivered share, timed, p95 ms, wins and losses (overall and per session by ordinal `session <i>`, sessions ordered by `sha256(seed:session)`), availability, bar-3 conditions and the verdict. No file is written. Temporary indexes and stores live in a private OS-temp folder and are removed. Failures print one fixed line.

The script adapter builds `embed` and `decide` as loopback HTTP clients on sealed URLs with the sealed per-call timeout. It sends one `decide` batch as one HTTP request when the server supports batches; otherwise it sends the batch's questions concurrently, and the builder reports which (resolves O2).

## Assumptions

- A1. The labels file covers every correction in the sessions it touches, so an owner turn in those sessions with no correction label in the next two turns is a true negative. *Inferred* from the labelling pass. Revision 1 assumed coverage of the whole snapshot; by count the labels touch 8 of 340 sessions, so negatives are now drawn from those 8 only (attack 4). If wrong, some negatives are hidden corrections, and a gated C is the arm it penalises.
- A2. The 12 positives are the plan's 12 R corrections, all `planned`, in 3 sessions (3, 8 and 1 cases), counted by field on 2026-11-01. The R decisions (4) are excluded, because the report names "41 corrections, 12 repeats". Expected lines on the real run: `scored 11`, `excluded 1` (the adversary's field count; the excluded case has no candidate at its pointer or owner unit).
- A3. Delivery is record text, not pointers, for every arm. The report says pointers were never opened (0 of 238) and "records may need to be injected as text". So arm A here is today's engine and ranking, not today's pointer format.
- A4. Arm C ranks B's fused top 20, so C is `unavailable` whenever the embedding model is. The report's table gives C "the same state as B" and sizes C "for 20 candidates".
- A5. The relevance question is written now, before any case is viewed, and is not tuned: "Does this stored record change how the agent should act on this message?" The gate question is the report's, verbatim: "Would a stored correction or decision change how the agent should act on this message?" Both are sealed by SHA-256.
- A6. Thresholds are 0.5 for both the gate and relevance (chosen: the qwenpaw-jev-memory-gate precedent skips at p < 0.5). The report's dead band is left out: it guards a live hook against flapping between turns, and a one-shot screen has no next turn.
- A7. B has no logistic gate. The report calls it optional, and it needs labels the screen does not have.
- A8. EmbeddingGemma gets its model-card prefixes: `task: search result | query: ` for queries and `title: none | text: ` for records. Record embeddings are computed once per pool and are left out of latency, as a live index would hold them.
- A9. If fewer than 200 negatives are eligible, the screen uses all of them and prints the count. The bar 3 comparison is on the same set for every arm, so it stays valid. With negatives from 8 sessions, fewer than 200 is likely (*inferred*).
- A10. Seed for the real run: `trigger-screen-2026-11-01`, stated now.
- A11. The positives sit in 3 sessions, 8 in one sharing one pool, and 9 distinct targets cover the 11 scored cases. A win count overstates independence; per-session wins and losses make that visible. The report already calls the result a screen, not proof.
- A12. C's per-question cap, 4,000 characters (chosen: under laya-mlx's context, which is not documented; *inferred*), keeps the server from truncating silently. If the server's limit is lower, the seat's pre-run check shows it.
- A13. A failed call on a positive marks the arm degraded, because one lost positive can move a win count that bar 3 judges at a margin of one. The overall cap is 10 failures (chosen: 5% of 200 negatives).

## Open choices

- O1. Builder: the request shape for laya-mlx-serve. Its HTTP API is not documented in the repo's README or usage guide (checked 2026-11-01). Write the `decide` client to the shape in laya-mlx's server source or upstream SDK, behind the injected function, including how P(yes) is read. A mismatch shows up as `unavailable` or `degraded`, never as a crash or a 0-hit available arm, and goes back in a fix brief.
- O2. Resolved: one batch per input (see the adapter paragraph). The builder reports whether the server batches.
- O3. Builder: the exact screen-set hash inputs. They must include the replay case-set hash, the labels hash, the negatives' pointers in order, the seed and the sealed values.

## Questions for the owner

Answered by the owner on 2026-11-01, relayed by the seat:

1. Store gap. The owner said: "Exclude those cases". Only repeat cases whose earlier record exists in the pre-cut store are scored. The verdict line prints the excluded count, and bars 1 and 2 apply to the scored count as the same fractions (see Purpose item 11).
2. Model weights. The owner said: "Yes, download both". The seat downloads EmbeddingGemma-300M (`ggml-org/embeddinggemma-300M-GGUF`, Gemma Terms of Use, about 0.3 GB, *inferred*) and laya-mlx 421M (`aac6fef/laya-mlx`, Apache-2.0, about 0.85 GB at FP16, *inferred*) on the Mac at run time, after the land. Builders never download.

No open question remains.

## Feature

Feature: FEAT-043 · Measure memory outcomes

New subgroup `SUB-026 · Screen prompt-time memory triggers offline`. Why FEAT-043: the screen measures whether a delivery can reach the agent before any delivery is built. That is FEAT-043's purpose, "so memory changes are judged against a measured baseline". It also reuses SUB-025's snapshot, cut rule, pre-cut store and private counts-only contract. A new subgroup, not more SUB-025 rows: SUB-025 replays agent turns and judges them; this screen makes no model call to Claude and judges no reply. A new feature would have no product stage of its own.

No artifact line. The command writes no file; its stdout lines are the whole output, and the seat keeps them privately.

## Threat model

In scope, as honest variation in our tools' output:
- A missing or changed snapshot: refuses against the plan's `files`.
- A plan or candidates file that drifted: refuses on the hash checks.
- A positive count other than 12: refuses.
- A labels file without repeat links for the positives (for example the kind-only 2026-10-31 file): refuses.
- A replay point the extracted helper recomputes differently from the frozen plan: refuses.
- An empty pool for an early negative: delivers nothing, 0 characters.
- A terse or slash prompt: A skips; B and C still read the agent turn.
- A missing model or daemon, or a warm-up of the wrong shape: the arm is `unavailable`.
- A daemon that fails after warm-up, slows, or drifts its reply shape: failures count, and past the cap the arm is `degraded`, never scored as a weak model.
- A long prompt: C's query text is cut to the sealed cap and counted.
- A target missing from the pool: the case is excluded, and the verdict line prints the excluded count.

Out of scope: deliberate forgery of the plan, labels, candidates or model replies. A forged `plan.json` with a self-consistent hash is a residual.

## Precedent

- `packages/nana-pack/lib/memory-replay.mjs` — **helper move**. Four private pieces become named exports, and `buildReplayPlan` calls them, so its behaviour is unchanged:
  - `frozenRoot` and `recordedSnapshot`, as they are.
  - `checkedPlan`, as it is.
  - `replayPoint(snap, source)`, extracted from the walk back to the owner turn in `buildReplayPlan`.
  - `preCutPool(snap, candidates, cut, options)`, extracted from the candidate preparation and the `defaultBundle` call.

  The screen imports all five. Follow its counts-only `run…Command` boundary, its fixed failure line and its `privateFolder` temporary store with removal in `finally`. **Byte-identical constraint (attack NOTE 15):** `memory-replay-config.mjs` gains no export and changes no byte, because `checkedPlan` compares `hash(plan.seals)` with the whole config and the frozen plan `60a76…` would refuse. `defaultBundle`, `mergeMemory` and `readMemoryStore` keep their source text, because `bundleMaker` hashes it. New values go in `trigger-screen-config.mjs`.
- `packages/nana-pack/lib/memory-replay-config.mjs` — follow: one sealed config module with a provenance comment per value and prompt texts pinned by SHA-256. The new `trigger-screen-config.mjs` copies the shape, not the values. Not edited.
- `packages/nana-pack/lib/memory-replay-context.mjs` — import `renderReplayEntry` to render the prompt and the agent turn before the point. Its `rebuildContext` history format (`USER: <text>`) is what the replay-point check compares against.
- `scripts/memory-replay.mjs` — follow: a thin adapter that builds injected model functions from sealed config and calls the library's command; the main-module guard. `package.json` runs it as `node scripts/trigger-screen.mjs`, the same form as `memory:replay`, with no extra flag (NOTE 16).
- `packages/nana-pack/tests/memory-replay.test.mjs` — **helper move**: `fixture`, `entry`, `ptr`, `label`, `candidate` and `instructions` move to `packages/nana-pack/tests/memory-replay-fixture.mjs`. Both tests import them. Follow its `check` runner and seal-test style.
- `packages/nana-knowledge/lib/query.ts` (`search`), `packages/nana-knowledge/lib/db.ts` (`openDb`), `packages/nana-knowledge/lib/tokenize.ts` (`skipReason`, `meaningfulTokens`, `PROMPT_MAX_CHARS`) — import; arm A's engine and the shared prompt cap. Docs rows go into the `docs` table that `openDb` creates; the knowledge index under the user's home is never touched.
- `packages/nana-knowledge/lib/hook.ts` — import `TOP_K` and `BLOCK_MAX_CHARS`; follow `renderBlock`'s whole-line budget rule. `renderBlock` itself is not imported, because its output is pointers with a header.
- `packages/nana-pack/lib/outcome-score.mjs` — import `readOutcomeRows` for the labels.
- `packages/nana-pack/lib/claude-transcript.mjs` — import `entriesIn` and `privateFolder`.
- `packages/nana-pack/lib/memory-making.mjs` — import `memoryArgs` and `defaultMemoryRepo`.
- `apps/bench/anatomy.mjs` — follow: private stores in `~/nana-memory-runs`, counts-only output, isolated model runner injected at the edge. Not imported (a package may not import an app).
- Reciprocal rank fusion, nearest-rank p95, cosine: none: map search ("reciprocal rank fusion", "latency p95 percentile") found no helper; `review-round.mjs` and `hive-gesture-check.mjs` mention p95 but export no function. Written small in `trigger-screen.mjs`.
- Loopback HTTP model client: none: map search ("local model HTTP daemon embedding") found only the desk's server side; uses Node's global `fetch` with `AbortSignal.timeout`.

map:search results taken: "replay plan frozen snapshot pre-cut candidates" → `memory-replay.mjs`, `scripts/memory-replay.mjs`, `memory-replay-config.mjs`, `memory-replay-context.mjs` (all taken). "BM25 FTS5 search memory records" → `query.ts`, `hook.ts`, `tokenize.ts`, `db.ts` (taken). "counts-only private command output" → `memory-replay.mjs`, `outcome-meter.mjs`, `memory-shaping.mjs` (the first taken; the others share its boundary). "seeded sample owner turns" → `apps/bench/anatomy.mjs` (followed).

Map impact: `memory-replay.mjs` has callers `scripts/memory-replay.mjs` and `packages/nana-pack/tests/memory-replay.test.mjs`. Both stay green unchanged in behaviour; the test file changes only by importing the moved fixture. Layer: packages import freely within the packages layer. This is the first `nana-pack/lib` import of nana-knowledge `.ts` code, and nana-knowledge already imports nana-pack's `display.mjs`, so the packages form an import cycle at package level, not at module level (NOTE 16). The `.ts` imports rely on Node's default type stripping (Node ≥ 22.18; local 22.22.2), as nana-knowledge's own scripts do. Expected file changes (a forecast, not a limit): the files on the lane-class line.

## Outside precedent

- BEIR (beir-cellar/beir, Apache-2.0) — borrow. It scores retrieval as recall@k against known relevant documents per query; this screen is recall@3 over 12 queries with labelled targets. Not adopted: Python, and its datasets do not apply.
- Other public references:
  - Reciprocal rank fusion, k = 60 (Cormack, Clarke and Büttcher, SIGIR 2009).
  - laya-mlx (mizorewww/laya-mlx, Apache-2.0), adopted as the arm C runtime by the seat, not as code.
  - llama.cpp `llama-server` (MIT), already installed, which serves the OpenAI-compatible `/v1/embeddings`.
  - pi-laya-mlx (a3harva/pi-laya-mlx), a precedent for a local decision daemon behind a pi check.

## Must-meet

Each test gets one new row in SUB-026, from the next free ID at build time (R-3475 onward if still free). Every assertion that names a tunable imports it, from `trigger-screen-config.mjs` or from nana-knowledge for `TOP_K`, `BLOCK_MAX_CHARS` and `PROMPT_MAX_CHARS`. All inputs are synthetic and built with the moved replay fixture; B and C use stub `embed` and `decide` functions. Eight must-meets.

1. **Positives come only from the frozen replay plan, and their targets from the labels.** Proves the screen scores exactly the plan's R corrections and the right records. Pins:
   - With a synthetic plan of 12 R corrections, 1 R decision and some F cases, the line reads `positives 12`, and `sessions <k>` prints the positives' session count.
   - The command refuses with its fixed line when `--expect` mismatches, a snapshot file is added or resized, the candidates' hash differs, the R correction count is 11, a positive's label is kind-only (`repeatOf` empty, `relation` none), or a recomputed point's owner turn differs from the case's final `USER:` history entry.
   - The `labels` line prints the file's SHA-256; changing one label byte changes it and the screen-set hash.
   - A delivered record whose evidence is in the label's `repeatOf` counts as a hit; a same-claim record with other evidence does not.
   - With one positive whose targets are absent from its pool, the lines read `scored 11` and `excluded 1`, and no arm's hit count includes it.
2. **Negatives are seeded, pre-cut, correction-free and inside labelled sessions.** Proves the negative set is reproducible and leak-free. Pins: the same seed gives the same screen-set hash and the same negatives; another seed changes both. An owner turn in a session with no label row is never chosen. An owner turn followed within two owner turns by a correction-labelled turn is never chosen; one followed only at the third turn can be. A negative's pool holds no candidate whose evidence instant or session start is at or after its cut. When eligible turns are fewer than 200, the line reads `negatives <n>`.
3. **Arm A is today's engine on records.** Proves A reuses `skipReason`, `openDb`, `search` and the hook's delivery limits. Pins: for a fixture prompt `skipReason` rejects, A delivers 0 characters and its `skipped` count rises, asserted against `skipReason`'s own result, never a literal length. A prompt sharing words with the target record hits. Delivery holds at most `TOP_K` whole claims, and a claim that would pass `BLOCK_MAX_CHARS` is dropped, not cut. A sees the prompt only: a target matching only the agent turn is missed by A.
4. **Arms B and C read the agent turn before the point, and follow the sealed rules.** Proves the query text, fusion, gating and thresholds. Pins:
   - B and C see the prompt plus the last 1,000 characters of the agent turn before the replay point.
   - A prompt `skipReason` rejects, after an agent turn that names the target, is a hit for B and C and a miss for A.
   - A target that matches only the corrected agent turn (between the point and the correction) is missed by B and C.
   - B's order equals hand-computed RRF k = 60 over stub BM25 and embedding ranks.
   - C asks the sealed gate question first, and a gate P below 0.5 delivers nothing.
   - C sends one relevance batch per input holding exactly B's fused top 20; a 21st candidate is never asked.
   - C delivers only candidates at 0.5 or above, ranked by P.
   - Each question the stub sees is the sealed question, then the record text (claim and context), then the query text, within the sealed cap; a long prompt is cut, the record stays whole, and `truncated` counts it.
   - On positives, a gate-closed input still gets an untimed relevance batch, counted in `C ungated hits`, not in C's hits.
5. **Missing, failing or slow models degrade, never crash or pass as weak.** Proves the honest-variation cases. Pins:
   - An `embed` that rejects on warm-up prints `arm B unavailable` and `arm C unavailable`, and the command exits 0.
   - A `decide` warm-up of the wrong shape prints `arm C unavailable`.
   - A `decide` stub that answers the warm-up and then throws on every relevance call prints `failed <k>` and `arm C degraded`. With A at 1 hit and B at 1 hit, the verdict reads `incomplete`, never `signal floor`.
   - After an arm passes its failure cap, the stub sees no further call.
   - A `decide` timeout on one negative delivers nothing for it, counts one failure, and its latency counts as the sealed per-call timeout. An input whose calls pass the per-input deadline counts one failure.
   - With B and C unavailable and A at 4 hits, the verdict reads `incomplete`; with A at 9, it reads `bm25 enough`.
6. **The verdict follows the three bars in order.** Proves the frozen decision rule. Pins, by table over synthetic per-case outcomes:
   - n = 12, all arms ≤ 3 hits → `signal floor`; A = 9 → `bm25 enough`; A = 8 → not bar 2.
   - n = 11: all arms ≤ 2 → `signal floor`, one arm at 3 → not bar 1; A = 9 → `bm25 enough`, A = 8 → not bar 2.
   - n = 0 → `incomplete`.
   - B with 4 wins and 1 loss, equal mean characters and p95 300 → `advance B`.
   - The same with p95 301, or with 2 losses, or with mean characters 1 above A's → `no arm advances`, and the failing condition prints `fail`.
   - Wins and losses print per model arm, overall and per session, in every case.
7. **Latency is warm p95 by nearest rank over timed inputs.** Proves the latency measure. Pins: with an injected clock giving 1..212 ms over 212 timed inputs plus a 5,000 ms warm-up call, the line reads `p95 ms 202` and `timed 212`, and the warm-up never counts. Adding one skipped input changes neither line. A's index build and B's record embedding are outside the timed span; C's span includes B's BM25 and query embedding.
8. **Nothing private leaves the process.** Proves the privacy contract. Pins:
   - stdout and stderr hold only sealed words, digits and hashes, even when a stub model throws an error whose message carries record text.
   - The temporary index and stores are removed after success and after failure.
   - No file is created in the checkout or in `--in`.

Sealed tunables, in `trigger-screen-config.mjs`, each pinned by one test naming its row:
1. Positives 12 (the plan's count before exclusion), negatives 200, lookahead 2 owner turns.
2. Agent-turn tail 1,000, pool 20 per retriever, RRF k 60, C candidates 20 (the report's figure), C question cap 4,000 characters (chosen, A12). Top 3, budget 2,000 and prompt cap 8,192 are imported by name from nana-knowledge, not sealed again (attack 8).
3. Bars: signal floor fraction 3/12 rounded down, BM25-enough fraction 9/12 rounded up, net wins ≥ 3, losses ≤ 1, p95 ≤ 300 ms; warm-up calls 1.
4. Gate and relevance question SHA-256, thresholds 0.5 and 0.5.
5. Embedding and decision URLs (loopback ports 8081 and 8082; chosen, because 8080 is the existing local chat model in `docs/local-models.md`), model names, EmbeddingGemma prefixes, per-call timeout 5,000 ms (chosen: well above the 300 ms bar), per-input deadline 10,000 ms (chosen: a gate call plus one batch at the per-call timeout), failure cap 10 overall and 0 on positives (chosen, A13).
6. Output words: `positives`, `scored`, `excluded`, `sessions`, `session`, `labels`, `negatives`, `skipped`, `failed`, `truncated`, `hits`, `ungated hits`, `mean chars`, `delivered share`, `timed`, `p95 ms`, `p95 ms open`, `wins`, `losses`, `pass`, `fail`, `unavailable`, `degraded`, `incomplete`, `signal floor`, `bm25 enough`, `advance`, `no arm advances`, `screen set`, and the fixed failure line.

The positive, label, target, negative, query-text, skip and delivery rules are contract behaviour, pinned in must-meets 1 to 4. Retuning any sealed value fails its row's test; the bars in group 3 are contract values from the report and must not change after any case is seen.

README and other files: `package.json` gains `memory:trigger`. `packages/nana-pack/README.md` gains the command, its inputs, its counts-only output and the model setup, and the root `README.md` gains one line beside `memory:replay`. REQUIREMENTS gains SUB-026 and its rows. The requirements tree and code map are regenerated. `docs/known-bugs/FEAT-043.md` gains the residuals below. `memory-replay-config.mjs` is not edited.

## The seat's run (after the land, outside the build)

1. Both owner answers are in (2026-11-01).
2. Download both models and start each on loopback, with stdout and stderr sent to `/dev/null`, never into the session or the repo (attack 11):
   - `llama-server -hf ggml-org/embeddinggemma-300M-GGUF --embeddings --port 8081 >/dev/null 2>&1`
   - `pip install "laya-mlx[serve]"`, then `laya-mlx-serve` on port 8082 with `aac6fef/laya-mlx`, redirected the same way.
3. Verify each model with synthetic calls only. For `decide`, ask two synthetic questions with opposite known answers and require P(yes) to order them; one question cannot catch an inverted mapping (attack 2d). Check that a synthetic question at the 4,000-character cap returns a valid reply.
4. Record `shasum -a 256` of the 2026-11-01 labels file before the run. Run `npm run memory:trigger --` with the private replay root and `--expect 60a7672657b169de543eb5c833e5460e1f15b34052be41815bdd322922e0724a`, the 2026-11-01 labels, the plan's candidates, the frozen snapshot and `--seed trigger-screen-2026-11-01`. Save stdout outside git. Check the `labels` line matches the recorded hash, and expect `scored 11` and `excluded 1` (A2).
5. Report counts only to the owner. Arm text never reaches the repo.

## Residuals (to `docs/known-bugs/FEAT-043.md`)

- At most 12 positives, 11 expected after exclusion, in 3 sessions: a screen, not proof. Even 3 wins and 0 losses gives a one-sided p of 0.125.
- Latency is measured on this Mac only.
- Arm C is zero-shot on terse, project-specific prompts; a weak C does not rule out a fine-tuned one.
- The screen sees only the owner's prompt and the agent turn before it; a correction that answers a later tool call cannot be found here by design. That is the question bar 1 answers.
- Negatives come from the 8 labelled sessions only, so they are fewer and clustered; mean characters on negatives is a small-sample figure.
- Delivery has no header, unlike the knowledge hook's block, so every arm gets slightly more room than a live block would.
- Claim dedupe in `mergeMemory` can drop a target under another record's evidence and turn a present record into an excluded case; the count today is 0 (attack NOTE 14).
- A re-plan with n ≤ 2 would let bars 1 and 2 fire while bar 3 cannot pass; this run's n = 11 needs no floor (attack NOTE 13).
- A forged self-consistent plan is out of the threat model.

## Dispositions of the plan attack (revision 1)

1. MUST, `skipReason` on B and C — taken. Purpose items 6 and 8; must-meet 4 pin with a rejected prompt and a target-naming agent turn.
2. MUST, a failing model arm reads as `signal floor` — taken: (a) shape-checked warm-up, (b) `failed <k>`, (c) sealed cap, `degraded` counts as unavailable, verdict `incomplete`, (d) two-question ordering check in the seat's run. Pinned in must-meet 5.
3. MUST, C's latency set by candidate count and client — taken. C ranks B's fused top 20; one batch per input; p95 over timed inputs with `timed <k>`; a sealed per-input deadline; a degraded arm stops calling. Gate-closed inputs stay in C's p95, because a live gate-closed turn costs that; `p95 ms open` shows the rest.
4. SHOULD, A1 false by count — taken. Negatives come from labelled sessions only; A1 rewritten; residual added.
5. SHOULD, labels unpinned — taken. `labels <sha256>` printed and hashed into the screen set; refusal on a kind-only or link-less positive label; the seat records the hash before the run.
6. SHOULD, the agent turn before the point — taken. Purpose item 5; must-meet 4 pin on the corrected turn.
7. SHOULD, bar 3's characters condition — taken as diagnostics only: per-condition `pass`/`fail` and `delivered share`. No bar change.
8. SHOULD, re-sealed knowledge tunables — taken. `TOP_K`, `BLOCK_MAX_CHARS`, `PROMPT_MAX_CHARS` and `meaningfulTokens` imported; the 12-character literal dropped from must-meet 3; header stated as excluded.
9. SHOULD, the text each arm sees — taken. One sealed record text; C's question order and 4,000-character cap. Truncation prints `truncated <k>` rather than counting as a failure, because the cut is ours, deterministic and keeps the record whole; a server-side cut is caught by the seat's pre-run check.
10. SHOULD, recomputed point unchecked — taken. Refusal against the final `USER:` history entry; pinned in must-meet 1.
11. SHOULD, daemon logs in transcripts — taken. Seat's run step 2 sends both to `/dev/null`.
12. SHOULD, expected count and clustering — taken. A2 and A11 state `scored 11`, `excluded 1`, 3 sessions; `sessions <k>` and per-session wins and losses printed. No new bar.
13. NOTE, the store gap hides nothing today — agreed; minimum-n note kept as a residual.
14. NOTE, claim dedupe can hide a target — kept the rule; residual added.
15. NOTE, frozen-hash literals — taken. Precedent states the byte-identical constraint on `memory-replay-config.mjs` and the three hashed functions.
16. NOTE, first `.ts` import from nana-pack/lib — taken. Same `node scripts/...` form as `memory:replay`, no extra flag; the package-level cycle is named under Map impact.
17. NOTE, gate and relevance scored together — taken as one untimed diagnostic, `C ungated hits`, on positives only. It feeds no bar.
18. NOTE, bar order — no change; matches the report.
19. NOTE, timed spans — taken. Purpose item 10 and must-meet 7.
20. NOTE, ceremony — kept as planned. The report names a later fine-tuned C, so the screen is expected to run again; the owner already said go. Not reopened.
21. NOTE, committing the report — no change. The seat re-runs the identity scan on the lane's diff before the land.
