# Brief — external research: System-One / decision models in agentic workflows + academic frontier (gpt-5.6-sol)

You have bash (use `curl -sL` to read the web: arXiv abs/HTML pages, GitHub raw READMEs, official docs; GitHub search via `curl -s "https://api.github.com/search/repositories?q=..."`), read/grep/find and write. No git commits.

Jake called these "decision 1 models" — System One / typed decision models: TypeSafe AI's Jev (launched 2026-09-15; `POST /v1/systemone`, state + typed questions → Noul probability / Choice / Score, trained with RLCD), the Apache-2.0 open-weight Laya, NanoJev, openjev/SemIf, openjev-sglang. Nana already ran a research pass and three experiment rounds on them — READ THESE FIRST and do not repeat them:
- `~/jev-research/docs/research/00-synthesis.md` (pass 1, 2026-09-18; notes 01–07 for detail) and `~/jev-research/HANDOFF.md` + `OBJECTIVE.md` (tool-judge rounds 1–2: label sound, a 0.6B recipe did not learn from ~940 output-only examples; retention audit precision 0.87 / recall 0.69; the real context-pruning workload is read/grep results, 8× bash).
- `~/the-hive/docs/experiments/jev-1/MEMO.md` (JEV-1: a rule engine beat Qwen3-1.7B and NanoJev on 215 authored decisions; LLM flips 66% on list reversal; Jake: keep the engine, no model in the loop).
Nothing under `~/jev-research/private/`.

Then research, with evidence:
1. What changed since 2026-09-18 in the Jev / Laya / System-One ecosystem: official docs and pricing/limits changes, Laya's weights/training recipe and any independent evals, new tooling that measured something (not architecture-only repos), any published failure analyses. Re-check the pass-1 refuted items (`jev-use` non-existent; fast-jev-compaction broken) only if there is news.
2. Where typed decision models have been shown (with numbers) to earn a place inside an agent runtime: tool-result keep/drop, model routing, gate/permission triage, review triage, loop/stuck detection, priority/pre-spend checks. For each: evidence grade, what it beat (and whether the comparison was fair — decomposition vs model), cost, failure modes (wording sensitivity, miscalibration across question forms, no prefix caching).
3. Academic frontier 2026-08/09 (arXiv, with code preferred): verifiers and scalable oversight for coding agents, decision delegation in long-horizon agents (e.g. DecisionBench), process harnesses (e.g. TDF/CUGA), agent memory and context pruning, review/critique models, calibrated abstention. Only papers you actually read.
4. The nana angle: rank candidate bounded judgments in nana's own runtime that a typed decision model (hosted Jev, or a local Laya/NanoJev) could own — read `~/nana-pi/packages/nana-pack/extensions/nana-gate.ts`, `nana-post-edit.ts`, `nana-lifecycle.ts`, `~/nana-pi/packages/nana-knowledge/lib/hook.ts` + `query.ts`, and `~/nana-pi/packages/nana-pack/bin/pi-review.mjs` to name real insertion points. For each candidate: the decision, its current owner (code / LLM / human), the data-egress constraint (Jake's AML work cannot leave the machine; nana session data is private), expected win, the falsifying test, and what jev-research's negative results already say about it. Be willing to conclude "none yet".

For EACH finding: claim · source (URL, date) · grade · what changes for nana · cost (S/M/L) · cheapest test · contradiction with `~/nana-agent-loop/loops/DOCTRINE.md` or the jev-research results if any.

End with: (a) top 8 ranked recommendations; (b) refuted/unverified ledger; (c) the VERDICT block from common.md.

Write the report to `~/nana-pi/research/raw/2026-09-27-advances/sol-research.md` (write tool; you may write it in parts and append), then finish with a ≤10-line summary ending `VERDICT: DONE`.
