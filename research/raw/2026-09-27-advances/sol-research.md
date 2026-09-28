# System-One / typed decision models in agent workflows — update and nana-pi ruling

**Research date:** 2026-09-27  
**Scope:** changes after the 2026-09-18 pass; measured runtime uses; selected papers actually read; nana-pi insertion points.  
**Bottom line:** **no typed decision model should own a production judgment in nana-pi yet.** The strongest opportunity is a local, shadow-only reranker for `nana-knowledge`; the strongest measured open-model result is a *task-specific fine-tune*, not an off-the-shelf model. Keep deterministic safety, checks, receipts, and the three-round review cap authoritative.

Evidence labels: **PRIMARY** = official docs/source/paper/local experiment read; **SECONDARY** = practitioner study with data; **MARKETING/ANECDOTE** = unvalidated claim. Cost: **S** <1 day, **M** 1–5 days, **L** >1 week or new training/operations.

## 1. What changed since 2026-09-18

### F1 — Jev itself did not materially change; its Python client did

- **Claim.** The served stable and preview aliases still resolve to `jev-1.13.0`. Current terms remain text-only, 64k tokens/request, 32k for state plus longest question, $0.042/M input tokens, free output, 250k tokens/s and 1,200 requests/min. Limits are explicitly dynamic. Python SDK 0.7.1 (2026-09-21) added early API-key validation and gateway examples; 0.7.2 (2026-09-26) added an HTTP/2 extra and docs. No new decision model is listed. No cross-request prefix-cache API or discount is documented; implementation-level caching is **unverified**.
- **Source (2026-09-27 access).** [TypeSafe models](https://docs.typesafe.ai/models.md); [Python SDK releases](https://github.com/typesafe-ai/typesafe-sdk-python/releases). The model page says the state is ingested once *within a request* and parallel questions share it; it does not promise reuse across requests.
- **Grade.** **PRIMARY** (official docs and release notes).
- **What changes for nana.** Nothing justifies reopening a hosted production integration. Fan multiple questions over one state if testing Jev, but price every repeated state again.
- **Cost.** S to keep a pinned-model smoke test; M to maintain an integration.
- **Cheapest falsifier.** Call `/v1/models`, then send byte-identical requests with the versioned ID and inspect billed input usage and latency. A documented/observed cache credit or a new model would falsify the “no material model change” part.
- **Contradiction.** None with doctrine. It reinforces jev-research’s warning that batching questions is not prefix caching.

### F2 — Laya became a real local product surface, but its rapid repair rate is itself a stability warning

- **Claim.** Laya is now an Apache-2.0, Jev-wire-compatible local stack with three open checkpoints: ModernBERT-large English and typed-decision variants (421M; 512/1,024 context) and a 322M multilingual variant (1,024 default, configurable to 8,192). By v0.3.21 (2026-09-27) it had Python and TypeScript paths, HTTP/MCP/LangChain/LlamaIndex/CrewAI adapters, ONNX/INT8 export, batching, hooks, long-document windowing, and opt-in `min_confidence`. The same release fixed dropped per-request language temperatures, hooks omitted from batch calls, email cleaning, routing, null labels, server limits, and other inference-path bugs. This is useful engineering progress and evidence not to freeze an unattended dependency at `main`.
- **Source.** [Laya repository and README](https://github.com/NandhaKishorM/laya), [v0.3.21 release](https://github.com/NandhaKishorM/laya/releases/tag/v0.3.21), 2026-09-27.
- **Grade.** **PRIMARY** for code/release facts; its performance claims remain vendor/self-evaluation.
- **What changes for nana.** Laya is now the practical privacy-preserving test backend. Pin release, checkpoint revision/hash, dtype, question order, token budgets, and calibration data. Do not treat “Jev compatible” as probability/threshold compatible: Laya documents a different `confidence` definition and a 100-option server guard.
- **Cost.** M for a pinned local shadow service; L for fine-tuning and operational ownership.
- **Cheapest falsifier.** Install v0.3.21 in an isolated environment, run 100 frozen nana rows twice on CPU/MPS and ONNX, and require identical labels plus bounded probability drift. Any installation/runtime failure or decision drift makes even shadow integration premature.
- **Contradiction.** No doctrine contradiction if shadow-only. Auto-updating it would contradict the program’s exact-contract and served-model verification lessons.

### F3 — Laya’s published recipe is reproducible-sized, but zero-shot Laya is not a Jev substitute

- **Claim.** Laya’s disclosed typed-decisions recipe is about 30k questions, four epochs, 2×T4 for 4–5 hours, with GRPO-style reinforcement against proper scoring rules and post-hoc temperatures. Its own 2,000-decision report gives fine-tuned Laya 0.766 accuracy, Brier 0.062, ECE 0.213 versus Jev 0.727/0.148/0.144; the untuned English checkpoint is 0.362 and near chance. Its cards also report `score` as weak and high-cardinality choices degraded by shared option-token budgets. An independent five-task evaluation found Jev beat a clean zero-shot NLI model on all five; Laya’s strongest scores were on tasks in its training mix. With 16 labels/class, SetFit beat Laya on four of five and Jev on two of five; SetFit was 3–7× faster than Laya. Jev was overconfident on harder tasks (its 100%-confidence subset was only 77–79% correct on emotion/ratings).
- **Source.** [Laya README/notebook](https://github.com/NandhaKishorM/laya); [System One models, re-examined](https://github.com/CodeWithMoin/system-one-reexamined), 2026-09 (1,000 test examples/task, five draws for few-shot; predictions published).
- **Grade.** **PRIMARY** for recipe/code; **SECONDARY** for the independent practitioner evaluation.
- **What changes for nana.** Compare a local Laya pilot against logistic regression/SetFit and deterministic rules, not only against an LLM judge. “Open System One” is an implementation shape, not a quality result.
- **Cost.** M for zero/few-shot benchmark; L for a clean fine-tune.
- **Cheapest falsifier.** Label 16 examples/class for one nana decision and compare frozen held-out AUROC, Brier, coverage-at-error, p95, and memory against untuned Laya. If Laya wins all deployment axes, the cheap-classifier recommendation is wrong.
- **Contradiction.** Directly agrees with jev-research: ~940 noisy output-only examples did not teach a 0.6B model; clean labels, contrastive pairs, more data, or a simpler classifier are required.

### F4 — The best shared-input head-to-head favors Jev, not generic Laya

- **Claim.** `sysone-bench` v2 scored 952 cases/1,240 decisions from a sealed, byte-identical manifest: Jev 1.13.0 accuracy 0.9065, Laya 0.3.11 0.6863, Qwen2.5-1.5B parallel constrained decoding 0.6048. Jev led all nine suites; eight differences survived Holm correction. Caveat: one human corrected AI-drafted labels, with no independent second reviewer or adjudication.
- **Source.** [`instax-dutta/sysone-bench`](https://github.com/instax-dutta/sysone-bench), report dated 2026-09-26.
- **Grade.** **SECONDARY** (independent practitioner benchmark with released manifest/artifacts).
- **What changes for nana.** If public/synthetic data permits hosted calls and zero-shot quality is the objective, Jev is the stronger candidate. That does not clear nana’s privacy constraint or prove downstream value.
- **Cost.** S to replay public manifest; M to add a nana slice.
- **Cheapest falsifier.** Score a preregistered 200-row nana-public slice with both models and two independent labelers. Laya parity would overturn the broad ranking for nana’s domain.
- **Contradiction.** Refutes any inference from Laya’s vendor benchmark that generic Laya is already better than Jev.

### F5 — Specialized fine-tuning can earn routing accuracy, but it does not transfer automatically

- **Claim.** A preregistered Laya-v2 router trained on 119 policy-labelled requests plus 708 filtered paraphrases reached 0.801 held-out three-band accuracy on 151 rows versus 0.662 for a local 27B LLM judge (McNemar p=0.0027). On a 60-ask measured model×effort menu, replayed answer quality rose 0.887→0.944 at essentially unchanged median turn cost. But the margin came mainly from borrowed rows; on the estate’s own 60 asks, accuracy was 0.717 vs 0.700. It failed RouterBench (0.01–0.37 band accuracy reported in the follow-on README; paper report says neither Laya variant reached the single-model hull). A Laya answer verifier also failed: AUROC 0.34 zero-shot and 0.46 fine-tuned.
- **Source.** [`mdad-elec/laya-v2-agent-routing` report](https://github.com/mdad-elec/laya-v2-agent-routing/blob/main/studies/v2/report/report.md), 2026-09-24.
- **Grade.** **SECONDARY** (preregistered practitioner study with frozen splits/artifacts).
- **What changes for nana.** Routing is the only bounded nana judgment with a credible open-model learning result, but only after nana-specific labels and outcome replay. Do not generalize a router into review verification or gate safety.
- **Cost.** L (labels, paraphrase audit, outcome matrix, training, calibration).
- **Cheapest falsifier.** Before training, create 100 frozen nana turns and compare a deterministic tier table, current human choice, Laya zero-shot, and a small classifier. If the table matches downstream quality/cost, model work is unnecessary.
- **Contradiction.** Supports the doctrine that the measured mechanism and contract matter more than “weak-model steering”; contradicts a broad “one decision model for all bounded calls” thesis.

### F6 — New tools measured retrieval/evaluation, but only one coding-agent study showed downstream savings and it is too small

- **Claim.** `jevgrep` reports equal SWE-bench success (8/10) and coding-agent cost $7.62→$5.44 (−28.6%) with Jev-guided repository search. The comparison excludes Jev API cost (at least $1.57 according to its detailed evaluation, as recorded in this research pass), has ten tuned Python tasks, and changes the retrieval harness—not just the decision model—so it is evidence for a decomposition, not Jev alone. `jevals` packages 37 trace checks/gates into one request and reports a 20-row RAG comparison of about $0.03/1k samples and 0.8s wall time for Jev versus $2.60 and 22–35s for Ragas/gpt-4.1-mini; its examples and latency are author-run, local-model rows are estimates, and there is no independent labelled agent-trace accuracy study.
- **Source.** [`dzhng/jevgrep`](https://github.com/dzhng/jevgrep), evaluation dated 2026-09-27; [`openlayer-ai/jevals`](https://github.com/openlayer-ai/jevals), v0.1.4 README, September 2026.
- **Grade.** **SECONDARY** for both measured author studies; `jevals` deployment claims without labels remain **unverified**.
- **What changes for nana.** Retrieval is worth a controlled shadow test; `jevals` is a schema/tooling reference, not a reason to put a judge in the loop. Always include decision-service cost and compare the entire decomposition against current BM25/rules.
- **Cost.** M for retrieval replay; L for a labelled trace-eval study.
- **Cheapest falsifier.** Replay 50 historical nana prompts with frozen candidate sets, blind relevance labels, and downstream “needed file opened” outcome. Require improvement over BM25 at equal injected characters; merely cheaper model calls do not pass.
- **Contradiction.** The cost omission violates the program’s cost-accounting discipline. The harness confound repeats JEV-1: a model score cannot be credited when a stronger decomposition changed too.

### F7 — `fast-jev-compaction` received stronger negative evidence; `jev-use` still does not exist

- **Claim.** The compaction repo has no code push after 2026-09-18 while open issues now document: hooks that do not replace compaction, resume undoing pruning, full transcripts sent externally, output-hidden scoring, threshold-scale mismatch, and fabricated “work done” narration after evidence deletion. A new 23-transcript/~1,000-call local replay found Laya keep/drop AUROC 0.47 and 0.45; trivial length/newness rules scored 0.55–0.62. On 40 long outputs, SWE-Pruner, embeddings, and word overlap—including next-message oracle variants—did not meaningfully beat equal-size head+tail. `jev-use` still returns no matching repository in GitHub repository search.
- **Source.** [`fast-jev-compaction` issue #99](https://github.com/tamaratran/fast-jev-compaction/issues/99), 2026-09-23; [issues list](https://github.com/tamaratran/fast-jev-compaction/issues); GitHub repository search, 2026-09-27.
- **Grade.** **SECONDARY** for issue #99’s data; **PRIMARY** for repository state/search. `jev-use` absence outside GitHub is **unverified**.
- **What changes for nana.** Close the model-based compaction/keep-drop lane. Preserve full outputs externally, use bounded deterministic truncation, and evaluate restore-counterfactual loss before revisiting.
- **Cost.** S to record the no-go; reopening is L.
- **Cheapest falsifier.** A preregistered, independent replay on ≥100 nana tool outputs where a selector beats same-size head+tail on future-needed evidence with confidence intervals and no circular labels.
- **Contradiction.** Fully agrees with jev-research R3/R4 (retention AUROC ~0.69 but failed gate; audit precision 0.87/recall 0.69) and with doctrine’s demand to verify the act rather than a proxy marker.

## 2. Where typed decisions have earned—or failed to earn—a runtime role

### F8 — Tool-result keep/drop: **no earned role**

- **Claim/evidence.** Nana’s own retained-context experiment did not pass its preregistered hook gate; the new independent replay above is at/below rule baselines. The real workload is large `read`/`grep` outputs and especially `bash`, not tidy one-line classifications. **Source:** `~/jev-research/experiments/tool-judge/results/r3/GO-NO-GO-round3.md`, R4 record, and issue #99. **Grade:** **PRIMARY** local experiment + **SECONDARY** external replay.
- **Comparison fairness.** The external replay compares selectors at equal output size against head+tail and even gives oracle selectors more future information; this is fair to generous. The behavioural “used later” label is noisy and sparse.
- **Cost/failure modes.** Local Laya avoids egress but adds hundreds of MB and inference latency; hosted Jev repeats the full state with no documented prefix cache. Hidden relevant evidence, proxy circularity, truncation, question wording, and confident guesses are catastrophic.
- **What changes / cost / falsifier / contradiction.** Do not implement (**S** to close). Falsifier is F7’s ≥100-output test. Reopening now contradicts both jev-research and the doctrine’s exact-check/proxy warnings.

### F9 — Model routing: **earned a research slot, not production ownership**

- **Claim/evidence.** Laya-v2 is the strongest relevant number (0.801 vs 0.662 judge), while DecisionBench shows routing-fidelity changes can leave end quality flat: across 23,375 instances, quality differences were ≤0.010 (p≥0.21), while fidelity@1 ranged 7.5–29.5%; on-demand access improved blind 14.2→29.5 at lower mean cost. **Source:** [Laya-v2 report](https://github.com/mdad-elec/laya-v2-agent-routing/blob/main/studies/v2/report/report.md), **SECONDARY**; [DecisionBench, arXiv:2605.19099](https://arxiv.org/html/2605.19099), 2026-05-18, **PRIMARY**.
- **Comparison fairness.** Laya was fine-tuned to the policy while the LLM judge was not; fair for a deployable system comparison, not for architecture attribution. DecisionBench changes information delivery and orchestrator behavior, not a typed model.
- **Cost/failure modes.** L; policy-label ceiling, domain shift, wording/order sensitivity, medium-tier collapse, self/vendor preference, and savings that vanish when subscription seats have zero marginal token price.
- **What changes / falsifier / contradiction.** Instrument actual nana seat/model outcomes before choosing a model. Cheapest falsifier: a deterministic route table on 100 past tasks with quality and elapsed-time replay. No doctrine contradiction in shadow mode; automatic production routing without downstream outcome evidence contradicts measured-mechanism discipline.

### F10 — Permission/gate triage: **use models only as non-authoritative signals**

- **Claim/evidence.** A 112-item practitioner risk-gate study gave Jev 91% enriched accuracy vs Sonnet 97% on trap pairs; Jev still let 1/16 catastrophes through (6%) while Sonnet let 0 through. Bare text structurally capped all models at 50% on byte-identical context twins, and both Jev and Sonnet approved 7/16 hidden catastrophes; confidence remained high. A separate academic permission-scoping study found no classifier configuration met its deployment bar (macro precision ≥0.90 and permission undershoot <10%): RoBERTa’s precision reached 0.941 only with 27% undershoot; Haiku’s best availability incurred greater residual risk. **Source:** [`jev-agent-risk-gate` article/data](https://github.com/jayeshvpatil/jev-agent-risk-gate), September 2026, **SECONDARY**; [Task-Based Permission Scoping, arXiv:2609.15422](https://arxiv.org/html/2609.15422), 2026-09-14, **PRIMARY**.
- **Comparison fairness.** The Jev/Sonnet arms received the same state/questions; the fine-tuned Qwen and off-the-shelf Laya arm was not fair architecture attribution. Neither risk study compares against nana’s regex+human decomposition.
- **Cost/failure modes.** M shadow/L integration; missing environment state, prompt injection in state, consequence chains, false assurance, and calibration shift. Hosted state violates private-session/AML egress constraints.
- **What changes / falsifier / contradiction.** Keep `nana-gate.ts` regex + human/headless block authoritative. A model may log “unmatched but suspicious” offline. Cheapest test: replay all historical gated and a red-team twin corpus; demand zero added false negatives before even considering UI advice. Model authorization would contradict doctrine’s adversarial gate and independent-review propositions.

### F11 — Review triage: **harnesses have evidence; typed judges do not**

- **Claim/evidence.** OpenCodeReview’s deterministic review harness scored 25.10% semantic F1 vs 11.57% for the same Claude backend under Claude Code on 200 PRs/1,505 expert-verified comments, using 5–15× fewer tokens; even its best precision was 33.9%, so it is not an acceptance oracle. Adversarial Review improved SWE-bench Verified pass rate from 71.6% zero-shot to 75.2% on 500 tasks; its structure, not a tiny typed model, produced the gain. A large observational study found 45,269 cross-product AI-reviewed PRs but explicitly did **not** measure correctness. **Source:** [OpenCodeReview, arXiv:2608.09290](https://arxiv.org/html/2608.09290), code [alibaba/open-code-review](https://github.com/alibaba/open-code-review); [Adversarial Review, arXiv:2608.18167](https://arxiv.org/html/2608.18167); [AI-to-AI Code Reviews, arXiv:2608.21311](https://arxiv.org/html/2608.21311). **Grade:** **PRIMARY** papers/source.
- **Comparison fairness.** OpenCodeReview compares whole harnesses, correctly showing decomposition dominates model identity; it does not isolate a classifier. The observational paper has no human quality labels.
- **Cost/failure modes.** M to improve deterministic parsing/triage; L to label findings. Typed scores can miss cross-file/frame interactions and encourage stopping on a false “clean.”
- **What changes / falsifier / contradiction.** Do not let a typed model suppress `pi-review` findings or decide LAND. Cheapest test: offline label 200 findings as blocking/actionable/duplicate/style, compare regex/rules, SetFit, Laya, and the reviewer’s explicit severity. This aligns with doctrine: independent actors and deterministic rails catch disjoint classes.

### F12 — Loop/stuck detection: **write detectors and skills before adding a model**

- **Claim/evidence.** A 2026-09-25 study over >10k mitigation trajectories identifies subsumed retrieval, similar-script regeneration, and unchanged test re-execution in 79–98% of coding tasks, accounting for 6.86–22.75% of cost. Structure-aware retrieval sometimes raised end cost by 28.14%; developer-authored, trace-agnostic skills cut cost 7.88–41.73%, about twice the best agent-synthesized gains. **Source:** [Analyzing and Mitigating Cost-Inefficient Behaviors in Coding Agents, arXiv:2609.30725](https://arxiv.org/html/2609.30725), **PRIMARY**.
- **Comparison fairness.** Behaviors were detected from trace structure with explicit rules; interventions were compared on Pass@1 and cost with noise floors. This is evidence for rules/skills, not a decision model.
- **Cost/failure modes.** S for counters; M for a shadow classifier. A model adds latency and may call productive iteration “stuck”; question wording and project type shift thresholds.
- **What changes / falsifier / contradiction.** Add telemetry for repeated unchanged checks, overlapping reads, and regenerated scripts before inference. Cheapest falsifier: rules fail precision/recall on 50 hand-labelled nana traces while local Laya clears a preregistered bar. Model-first would contradict doctrine’s “$0 deterministic probe before a model campaign.”

### F13 — Priority/pre-spend checks: **human policy remains owner**

- **Claim/evidence.** DecisionBench’s on-demand profile tool doubled routing fidelity but did not improve aggregate quality; Laya-v2 learned one estate’s spending policy but did not transfer. The JEV-1 authored game decisions also favored the deterministic engine (74%) over NanoJev (68%) and Qwen3-1.7B (56%), with NanoJev’s score largely an explore bias. **Source:** DecisionBench and Laya-v2 above; `~/the-hive/docs/experiments/jev-1/MEMO.md`, **PRIMARY** local experiment.
- **Comparison fairness.** JEV-1 compared a decomposed rule engine against general models; that is fair for the product choice, not model capability attribution. This distinction is the point.
- **Cost/failure modes.** L for reliable outcome labels. Objective fit is rare, contextual, and changed by Jake; confidence can merely encode historical frequency.
- **What changes / falsifier / contradiction.** Keep `OBJECTIVE.md`, Jake, and session-close scoring authoritative. Test a decision model only as a silent “ask before spend” flag. Cheapest falsifier: prospective 50-session shadow set where the flag predicts Jake’s later CANNOT/redirect decisions better than objective-keyword rules. Production ownership would conflict with the priority edit contract and JEV-1’s “keep the engine.”

## 3. Academic frontier read for this report

### F14 — Memory that is actually useful is not the same as memory a retriever supplies

- **Claim.** VibeMemBench evaluates 111 targets from 90 repositories with 3,634 history trajectories. Direct injection of a preselected, execution-verified experience improved four of five held-out solvers by 1.1–4.5 percentage points and reduced steps for all five, but confidence intervals included zero. Four existing memory systems failed to beat memory-off in 11/12 solver×system pairs. Of 231 failed pairings, 69.3% first failed through record-form degradation; among those, instruction pollution was 40.0%.
- **Source.** [VibeMemBench, arXiv:2609.23570](https://arxiv.org/html/2609.23570), 2026-09-20; code linked in paper at AlibabaResearch/DAMO-ConvAI. **Grade:** **PRIMARY**.
- **What changes for nana.** Preserve verified fix patterns and outcomes as compact artifacts; do not assume BM25/vector retrieval of raw transcripts improves coding. Evaluate memory by executable downstream outcomes, not recall alone.
- **Cost.** M to add outcome links; L for a matched replay.
- **Cheapest falsifier.** For 30 repeated nana task families, compare no memory, raw retrieved transcript, and one human-verified compact lesson with identical agent/tool budgets.
- **Contradiction.** Strongly supports doctrine’s “lesson in a commit message dies; ledger survives” while warning that automatic retrieval can make the durable lesson harmful.

### F15 — Compaction has a measured safety cliff; knowledge typing beats uniform summarization in one study

- **Claim.** On 20 production agent configurations, Sonnet 4.6 with a production `/compact` prompt retained 53% of safety rules after one round and 10% after five. On five public corpora, the paper’s type-aware TypeCompact retained 2–4× more safety rules than the strongest single-shot compactor, with 96% recall over five rounds; TypeDecompose had 0% locality violations vs 93% for uniform partitioning, and TypeRetrieve recall@50 was 100% vs 73%. Caveat: these are the authors’ type classifier/verifier and curated safety-rule tasks, not nana sessions.
- **Source.** [The Compaction Cliff, arXiv:2608.22752](https://arxiv.org/html/2608.22752), 2026-08-24. **Grade:** **PRIMARY** paper.
- **What changes for nana.** Audit the existing pi summary/handoff for typed retention (constraints, decisions, unresolved work, evidence pointers); do not replace it with per-result Jev keep/drop. The win is an explicit hard lane and verifier, not a probability threshold.
- **Cost.** M for an audit; L for a new compactor.
- **Cheapest falsifier.** Five-round restore-counterfactual test on 20 nana handoffs with seeded constraints and unresolved decisions, scored by exact typed fields.
- **Contradiction.** Agrees with jev-research’s no-go on output-only retention: it proposes a different, type-aware decomposition with verification.

### F16 — Provenance helps memory primarily on linked and multi-fact queries

- **Claim.** On the paper’s ISETrace benchmark, graph propagation over fixed candidates/seeds added 4.55 points Full Support@2048 (95% CI 2.98–6.18), at 20.06ms/3.44% mean overhead and 11.27MiB. Human-stratified effects were −1.69 points for direct recall (CI crosses zero), +5.15 for linked recall, and +11.74 for multi-fact recall. Artifact I/O relations had no detectable aggregate effect.
- **Source.** [When Does Execution Provenance Help Agent Memory Retrieval?, arXiv:2609.25913](https://arxiv.org/html/2609.25913), 2026-09-22; [code](https://github.com/xiaoqi-7/GraphMemory). **Grade:** **PRIMARY**.
- **What changes for nana.** Receipts and journals should expose compact links between edit→checker→result→review, but a graph is justified only for cross-step questions. Direct prompt-time knowledge remains BM25-simple.
- **Cost.** M instrumentation; L graph retrieval.
- **Cheapest falsifier.** Build 30 direct and 30 cross-event queries over existing receipts/journal; compare flat BM25 with relation expansion at equal character budget.
- **Contradiction.** None. It supports explicit evidence chains and warns against universal graph complexity.

### F17 — Compact generated documentation does not help when the agent can read source

- **Claim.** A 2026-09-25 paper optimized code descriptions to full roundtrip fidelity. With source withheld, mean test-pass fraction rose 0.08→0.71; with source present, static compact documentation and retrieved past-task context did not beat issue-only across two model families and ten repositories, with a positive control showing the harness could detect a real gain.
- **Source.** [Compact Documentation for Coding Agents, arXiv:2609.31587](https://arxiv.org/html/2609.31587), code linked at `haw-ai-i/roundtrip`. **Grade:** **PRIMARY**.
- **What changes for nana.** Do not inject summaries of code the agent can cheaply open. `nana-knowledge` should prioritize intent, decisions, prior failures, and contracts unavailable in source—not paraphrases of source.
- **Cost.** S policy/filter; M evaluation.
- **Cheapest falsifier.** Tag 50 knowledge hits as source-redundant vs extra-source and compare downstream file opens/task success with each class suppressed.
- **Contradiction.** Supports the knowledge hook’s current pointer-only, “open if relevant” design; challenges indiscriminate generated repo maps.

### F18 — Governance-looking artifacts can improve while behavior breaks

- **Claim.** SWE-Prometheus evaluates governance improvements on 60 repositories. On a shared 22-repo subset, mean normalized governance improvement ranged 0.0568–0.5760 while observed behavior breakage ranged 0–23%. Breakage appeared lower when gates were weaker: 13% under detected no-regression gates, 8% under blind gates, 0% under vacuous gates, while median governance score moved only 0.06—demonstrating that weak checks hide failure rather than prevent it.
- **Source.** [SWE-Prometheus, arXiv:2609.29465](https://arxiv.org/html/2609.29465), 2026-09-24. **Grade:** **PRIMARY**.
- **What changes for nana.** Never let a typed review score stand in for behavior checks. Keep content-bound receipts and real post-edit commands; measure whether configured checks have teeth.
- **Cost.** S to retain policy; M for mutation tests.
- **Cheapest falsifier.** Mutate one enforcement branch per nana-pack gate/check in scratch and require the committed suite/receipt verifier to fail—the doctrine’s existing disarm experiment.
- **Contradiction.** Directly supports doctrine: zero-violation/vacuous checks and green rails are floors, not proof.

### F19 — TDF/CUGA validates deterministic structural authority, but it is not performance evidence

- **Claim.** The Task–Decision–Flow paper defines a process harness in which a deterministic workflow engine owns topology and LLM Task/Decision/Flow agents act only at policy-governed control points. CUGA FLO implements it and demonstrates two loan traces, including a regulatory override. The paper reports no benchmark accuracy, reliability, or cost; it explicitly calls the example small and identifies per-hook latency and policy consistency as open problems.
- **Source.** [A Process Harness for Uplifting Legacy Workflows to Agentic BPM, arXiv:2606.27188](https://arxiv.org/html/2606.27188), 2026-06-25; [CUGA FLO code](https://github.com/cuga-project/cuga-agent/tree/cugaflo/src/cuga/backend/cuga_graph/nodes/cuga_flow). **Grade:** **PRIMARY** architecture/source, **not empirical performance evidence**.
- **What changes for nana.** It supports nana’s existing split: code owns structure and caps; models advise at named seams. It does not justify reviving the dormant governed-loop runner or adding a decision model.
- **Cost.** S to borrow terminology; L to adopt a framework.
- **Cheapest falsifier.** None needed for performance because no performance claim should be made. A minimal mapping of nana’s current host gates to TDF roles can show whether the terminology adds clarity.
- **Contradiction.** Aligns with doctrine and JEV-1 (“keep the engine, no model in the loop”).

### F20 — “Confidence” is not calibrated abstention; inability to answer must be tested explicitly

- **Claim.** Laya v0.3.21’s `min_confidence` is caller-side thresholding of `answer_confidence`, not a learned detector of missing information. Its README warns shipped checkpoints are overconfident and the English model can be 0% accurate at 0.952 confidence on Khmer; routing must use script/language rules. The risk-gate twin study found Jev and Sonnet 37–43 points overconfident on structurally unanswerable bare calls. A separate confidence-training paper reduced reasoning tokens up to 25% at matched accuracy, but explicitly says its confidence is *not* a calibrated probability; it is stopping supervision, not deployment abstention.
- **Source.** [Laya README](https://github.com/NandhaKishorM/laya), v0.3.21; [risk-gate study](https://github.com/jayeshvpatil/jev-agent-risk-gate); [Learning to Stop without Learning to Stop, arXiv:2609.31619](https://arxiv.org/html/2609.31619), 2026-09-25. **Grade:** **PRIMARY** docs/paper + **SECONDARY** risk study.
- **What changes for nana.** Every pilot must include an explicit `insufficient_evidence` option, withheld-state twins, coverage/error curves, and deterministic escalation. A raw probability threshold is not abstention.
- **Cost.** S to add test cases; M to calibrate per project/form.
- **Cheapest falsifier.** 100 answerable/unanswerable matched pairs. If uncertainty separates them out of sample with preregistered error-at-coverage, a threshold may be useful for that exact schema.
- **Contradiction.** Reinforces jev-research’s wording/form-specific calibration warning; refutes portable “RLCD confidence means safe to act.”

## 4. Ranked nana-pi candidate judgments

**Privacy rule for every row:** nana session text and Jake’s AML work are private. Hosted Jev sends `state` to an external service; TypeSafe says it does not train on customer data and offers enterprise zero-data-retention, but that does not satisfy “cannot leave the machine.” Therefore hosted Jev is restricted to synthetic/public/redacted evaluation. Production/shadow private data must use local Laya/NanoJev or no model.

| Rank | Candidate and real insertion point | Current owner | Expected win | Egress / model | Cheapest falsifying test | Prior negative result / doctrine | Ruling |
|---|---|---|---|---|---|---|---|
| 1 | **Knowledge relevance rerank** after FTS5/BM25 in `packages/nana-knowledge/lib/query.ts` and before the top-3/2,000-char block in `lib/hook.ts` | Code: meaningful tokens + BM25 (`title` weight 4), top 3, shown-set dedupe; agent chooses whether to open | Better ordering when query and durable decision use different words; vendor CLERC rerank moved top-1 5→18% and top-10 38→62%, but this is vendor-run and not nana | Local Laya only for private stores; hosted Jev only on public fixtures | 100 historical prompts; freeze BM25 top-10; two blind raters mark useful pointers; compare BM25, deterministic recency/kind features, SetFit, Laya at equal 2,000 chars. Gate: ≥10pp recall@3 without worse irrelevant-hit rate or p95 >1.5s | jevgrep is only 10 tasks and omits decision cost; compact-doc paper says source-redundant docs do not help; Laya zero-shot weak | **Best pilot, shadow only. Ownership stays code. Cost M.** |
| 2 | **Pre-spend/model-tier suggestion** at seat launch or before `pi-review` model selection (not currently a nana-pack hook) | Jake/seat/human policy; `OBJECTIVE.md` and package review ladder | Potentially avoid an overpowered review/worker or warn on underpowered work; Laya-v2 shows specialization can work | Local Laya; no AML/session text off-machine | Prospective 100 decisions with task digest, chosen model, elapsed time, spend, reviewer outcome; compare fixed package/blast-radius table first | Laya-v2’s own-domain accuracy tied judge; RouterBench failed; DecisionBench quality stayed flat; JEV-1 engine won | **Instrument first; no hook yet. Cost L if trained.** |
| 3 | **Offline review-finding triage** after `packages/nana-pack/bin/pi-review.mjs` writes a review; classify duplicate/style/actionable/blocking for a dashboard, never suppress | Reviewer LLM writes findings; wrapper only checks non-empty + `VERDICT/LAND/FAIL/finding`; human/seat adjudicates; round cap is deterministic | Reduce reading/duplicate bookkeeping, not acceptance cost | Local only: diffs/reviews private | Label 200 historical findings; compare regex from reviewer headings, SetFit, Laya; require high blocking recall and report calibration per reviewer model | Typed review accuracy unproven; doctrine says independent layers catch disjoint classes and zero findings cannot be trusted | **Offline analytics only. Cost M.** |
| 4 | **Post-edit failure routing** inside `nana-post-edit.ts` after deterministic status/output is known: suggest likely owner/fix class | Code owns pass/fail/timeout/error and injects last 2,000 chars; coding LLM fixes it | Maybe reduce repeated test attempts or choose a focused skill | Local only; checker output can contain private paths/code | Replay 100 failures; compare exit-code/regex table vs Laya on “next successful action” top-1 | The exact verdict already exists; cost-inefficiency paper says developer skills beat synthesis; adding a classifier may duplicate the coding LLM | **Rules/skills first; likely no model. Cost S/M.** |
| 5 | **Loop/stuck alert** from journal/tool traces, adjacent to `nana-lifecycle.ts`, not a blocker | Agent/human; deterministic three-round cap only for review; no generic loop detector | Warn on unchanged test reruns, overlapping reads, repeated scripts | Local only | Implement three structural counters; label 50 alerts. Add Laya only if rules miss semantic loops at acceptable precision | Academic evidence favors trace rules and developer skills; model can mistake legitimate iteration | **Deterministic telemetry first. Cost S.** |
| 6 | **Handoff typed-retention audit** around `nana-handoff.ts`’s compaction summary write, not summary replacement | Pi compactor LLM writes summary; extension persists latest summary and injects up to 8,000 chars next fresh session | Detect missing constraints/decisions/evidence pointers before future session | Local only | Seed 20 sessions with typed facts; run five compactions; exact recall and restore-counterfactual task score; test schema checklist before model | jev-research keep/drop no-go; fast-compaction no-go; Compaction Cliff supports type-aware verifier, not per-result classifier | **Audit/checklist experiment only. Cost M.** |
| 7 | **Permission-risk advice** in `nana-gate.ts` after no regex hit, displayed only as a warning | Code regex/allow/protected-path patterns; user allows once; headless fail-closed | Catch semantically risky but syntactically novel commands | Local only. Hosted is unacceptable for commands/paths; AML forbidden | Matched safe/dangerous context twins plus every historical gate case; compare parser/rules. Require zero regression in dangerous recall and bounded warning rate | Jev missed 1/16 enriched catastrophes and both models confidently missed 7/16 bare; no permission classifier met academic deployment bar; doctrine requires adversarial gate reviews | **Do not give ownership. Optional shadow log only. Cost M.** |
| 8 | **Tool-result keep/drop or call pruning** in any tool-result/compaction path | Pi context/compactor; bounded output tools; human/agent can reread | Token savings, but risks deleting evidence | Local only still unsafe; hosted leaks tool output | F7’s ≥100-output equal-budget replay | Local R3/R4 failed; Laya AUC 0.45–0.47; rules 0.55–0.62; oracle selectors did not beat head+tail | **Closed/no-go. Cost S to document.** |

**Nana ruling:** none of these models should *own* a runtime decision now. Rank 1 is the only near-term experiment worth spending on, because it is reversible, already bounded by BM25 candidates and 2,000 characters, fails open to today’s behavior, and has a downstream observable (“did the agent open/use the pointer?”). Rank 2 becomes plausible only after nana has outcome-labelled routing data. Ranks 7–8 must not become authorizers.

## 5. Top eight recommendations

1. **Run one shadow-only local rerank experiment at `nana-knowledge`; do not integrate first.** Cost **M**. Falsifier: no ≥10pp recall@3 lift over BM25/rules at equal 2,000 chars on 100 frozen prompts. Evidence: F6/F17 and current hook code.
2. **Freeze every arm and compare the decomposition, not model brands.** Include BM25/rules, SetFit/logistic regression, Laya, and—only on public data—Jev. Cost **S** incremental. Falsifier: model-only attribution survives identical candidates/state/policy.
3. **Keep `nana-gate`, post-edit verdicts/receipts, review round cap, and human LAND decisions deterministic/authoritative.** Cost **S** (policy only). Falsifier: a preregistered model gate reaches the required safety/availability bar on context twins and independent red-team data; current evidence does not.
4. **Instrument repeated reads, repeated unchanged checks, and regenerated scripts before training a loop detector.** Cost **S**. Falsifier: rules fail labelled precision/recall while a local model clearly passes. Evidence: 6.86–22.75% observed cost share and 7.88–41.73% skill savings.
5. **Audit handoffs by typed fields and restore-counterfactual outcomes, not per-tool keep scores.** Cost **M**. Falsifier: current summaries retain seeded constraints/decisions ≥95% over five rounds and restore performance, leaving no gap.
6. **Store compact, execution-verified lessons with provenance; do not index raw transcript as “memory.”** Cost **M**. Falsifier: raw-memory retrieval beats verified compact lessons on matched executable tasks. VibeMemBench currently points the other way in 11/12 pairings.
7. **If routing becomes a priority, collect outcomes first and train locally second.** Cost **L**. Freeze tier policy, task digest, model/effort menu, quality, elapsed time, and cost; compare a table before Laya. Falsifier: the deterministic table already sits on the cost-quality frontier.
8. **Close tool-result keep/drop and `fast-jev-compaction` until new independent evidence clears a stronger gate.** Cost **S**. Reopen only on ≥100 nana outputs with equal-budget head+tail, no circular labels, restore-counterfactual checks, and confidence intervals.

## 6. Refuted / unverified ledger

| Item | Status on 2026-09-27 | Evidence / consequence |
|---|---|---|
| `jev-use` exists | **REFUTED on GitHub; globally unverified** | GitHub repository search returned no matching repo. Do not cite it. |
| `fast-jev-compaction` is a working compaction replacement | **REFUTED** | No code push after 09-18; issues #21/#88/#89/#99 document non-loading/non-replacement, resume loss, egress, and no selector lift. |
| Off-the-shelf Laya is a drop-in Jev-quality replacement | **REFUTED** | Shared-input benchmark 0.6863 vs 0.9065; re-examined benchmark mixed; Laya itself says specialize it. |
| Laya fine-tuning cannot work because nana’s 0.6B attempt failed | **REFUTED as a general claim** | Policy fine-tune 0.801 vs 0.662 with clean labels/paraphrases; does not rescue nana’s noisy 940-example recipe. |
| Typed probabilities are portable across Noul/Choice/models/question wording | **REFUTED** | TypeSafe jaggedness shows Noul 0.22 vs Choice-yes 0.01 and negation sums 1.19; Laya confidence differs; thresholds require refit. |
| RLCD/raw confidence provides calibrated abstention under missing state | **REFUTED** | Context twins: Jev/Sonnet 37–43pp overconfident; Laya warns of confident wrong-language collapse; `min_confidence` is caller policy. |
| Local means zero cost | **REFUTED** | It removes marginal API/egress cost but adds model memory, install, latency, calibration, and operational ownership. Cloud GPU cost remains nonzero. |
| Jev has prefix caching | **UNVERIFIED / not documented** | Official docs describe within-request shared state only; no cache identifier or discounted cached-input price found. |
| `jevals`’ 37 evals are accurate enough for enforcement | **UNVERIFIED** | Packaging and tiny cost comparison exist; no independent labelled trace evaluation. Its default fail-open gate is unsuitable for irreversible actions without explicit override. |
| Jevgrep saves 28.6% total system cost | **REFUTED as stated broadly** | It saves coding-agent cost on 10 tasks while excluding Jev cost; only 8/10 parity is shown. |
| Generated compact documentation improves ordinary coding agents | **REFUTED in the read paper’s tested setting** | Helps when source withheld (0.08→0.71), not when source present across two families/ten repos. |
| Review model score can replace deterministic gates or independent review | **REFUTED by available evidence** | OpenCodeReview’s best precision 33.9%; SWE-Prometheus finds up to 23% breakage despite governance improvements; doctrine records disjoint catches. |
| Hosted Jev is acceptable for private nana/AML state because it does not train on customer data | **REFUTED by the stated constraint** | No-training/ZDR is not no-egress. Jake’s AML and private sessions must not leave the machine. |

VERDICT: DONE
MOST-LIKELY-WRONG 1: A local Laya reranker can deliver a ≥10pp recall@3 lift on nana-knowledge; nana’s terse prompts may leave no such headroom.
MOST-LIKELY-WRONG 2: No typed model should own a nana production judgment yet; a narrowly fine-tuned local router may already clear a useful low-stakes bar.
MOST-LIKELY-WRONG 3: The rapid Laya bug-fix stream predicts integration instability; high activity could instead mean unusually strong hardening.
MOST-LIKELY-WRONG 4: The compact-documentation null transfers to nana’s pointer-only knowledge design; nana stores intent/history that code cannot reveal.
MOST-LIKELY-WRONG 5: Model routing is the second-best nana candidate; subscription pricing and Jake’s quality preferences may make routing economically irrelevant.
