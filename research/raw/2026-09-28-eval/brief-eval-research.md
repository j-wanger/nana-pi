# Research brief — open-source evaluation methods we can REUSE for nana (Opus 5.5, web)

Date 2026-09-28. Jake ruled an evaluation lane, and ruled it should **leverage open-source eval methods and question banks where we can** rather than invent our own. You are the research half; a build lane follows from your findings. Your output decides what we adopt, so favour "runnable on our machine against our own work" over "famous".

## The problem being measured
Jake's standing complaint (2026-09-16, still unanswered): autonomy rose over three months, consistency and quality did not. Everything built since is a MECHANISM; nothing measures whether the mechanisms changed outcomes. We need instruments, and we would rather borrow a validated method than invent a shaky one.

Three questions the instruments must answer:
1. **Consistency** — is the same kind of task done well one day and badly the next? (Not mean pass rate.)
2. **Retrieval use** — the prompt-time knowledge pull delivers pointers; are they read and do they change what happens? Today we count deliveries, not reads.
3. **Review-ladder value** — today a lane runs up to 3 reviewer rounds across roles (scope · adversarial · compatibility · feel · domain · land). Which roles catch which classes, and are any of them ceremony? We have ~17 rounds of corpus from 2026-09-28 alone to score retroactively.

## Already known — read first, build on it, do not re-derive
`~/nana-pi/research/raw/2026-09-27-advances/opus-research.md` (esp. P1 consistency: IBM pass^k at arXiv 2609.08832 with code `AgentToolkit/altk-evolve`; tool-interface effects 2608.11386; prompt-paraphrase variance 2608.22331) and `sol-research.md` (OpenCodeReview arXiv 2608.09290 + `alibaba/open-code-review`, 200 PRs / 1,505 expert-verified comments, semantic F1 25.10% vs 11.57%; SWE-Prometheus 2609.29465; VibeMemBench 2609.23570; DecisionBench 2605.19099). Also `~/nana-pi/apps/bench/` — our own benchmark harness — and its one recorded study `apps/bench/studies/tool-profiles-2026-09-08/VERDICT.md`, which hit a **ceiling effect** (132/132 correct, so every verdict was cost-only). The doctrine line from it is binding on anything you propose: *pre-register tasks the baseline FAILS, or the correctness axis is dead on arrival*.

## What to find (favour PRIMARY: papers with released code, runnable harnesses, published task/label sets)
1. **Consistency / pass^k methodology.** Is `altk-evolve` (or another) reusable as a method or as code? What sample sizes make pass^k meaningful at our scale (we can afford single-digit repeats of a real brief, not hundreds)? What do people do about the cost of k repeats? Note its licence discrepancy (paper says CC BY-NC-ND, repo says Apache-2.0) — resolve it, because it decides whether we can use the code at all.
2. **Review-quality evaluation.** OpenCodeReview released code and an expert-verified comment corpus. Can its rubric or scorer be pointed at OUR review corpus (`~/nana-pi/docs/reviews/tranche1-2026-09-28/`, `tranche2-2026-09-28/`) to classify findings by class and severity? What other work scores *reviews* rather than code (agreement metrics, unique-catch attribution, false-positive rates)? We want a defensible way to say "the adversarial role caught N unique classes the scope role did not".
3. **Retrieval-use measurement.** Standard metrics for "was retrieved context actually used", not "was it relevant": attribution/citation methods, counterfactual ablation (retrieval on/off), context-utilization probes. RAG eval suites (Ragas and successors) measure answer grounding — say plainly whether that transfers to our case (a pointer shown to a coding agent, which may or may not open the file) or whether an ablation design is the only honest option.
4. **Agent task/question banks worth reusing.** SWE-bench Verified, LiveCodeBench, AppWorld, τ-bench, BrowseComp-style suites, and anything newer. For each: what does it actually measure, is it runnable locally at small scale, and **does it resemble nana's workload** (a coding agent under a gate with a review ladder, on our own repos)? Be blunt where the honest answer is "their tasks do not fit; their method does".
5. **Negative-control and validity practice.** Our best tests today prove they can fail (removing a lock showed the race; reverting a fix turned a test red). What does the literature standardise here — mutation testing for evals, sensitivity analysis, seeded-failure controls — that we should adopt as a rule?
6. **Cost discipline.** Methods for getting a usable signal at small n: paired designs, blocking, bootstrap CIs on few samples, sequential/early-stopping designs. We will run single-digit repeats, so the method must be honest at that size.

## Deliver
For each candidate method or artifact: what it measures · licence and whether we may use it · PRIMARY/SECONDARY/MARKETING grade with the source URL and date · can it run locally at our scale (yes/no/with what work) · what it would tell us that we do not know · adoption cost S/M/L · the cheapest way to try it · and whether it violates or supports the ceiling-effect doctrine line.

End with: (a) a recommended instrument set for the three questions above — for each, the method borrowed, what we build ourselves, and the first experiment with its pre-registered pass/fail; (b) what you would NOT adopt and why; (c) a refuted/unverified ledger; (d) the VERDICT block below.

Write to `~/nana-pi/research/raw/2026-09-28-eval/eval-methods.md`. Final message ≤10 lines ending `VERDICT: DONE`, then five claims you would bet against first.
