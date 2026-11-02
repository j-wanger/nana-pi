# A decision model as the per-prompt memory-pull trigger

*Research, 2026-11-01. Scope: the later per-prompt pull that follows the session-start push. Not committed. Online coverage note: the general web sweep hit the session's search budget; Jev-specific work went to primary sources (GitHub repos and releases, Hugging Face model cards, the TypeSafe models page, the Cloudflare and Cisco posts). A wider sweep may find more.*

## Verdict

Yes, try it. Do not build it before one zero-cost screen. A local typed decision model can answer within the hook budget now. The open question is different: does the owner's prompt carry enough signal to pick the right memory? Nothing on this machine has measured that. The first experiment below tests that question before any model work.

## What we already knew (September prior art)

- Model assesses, code decides. Question wording moves scores 0.2–0.5, so set thresholds only after the wording is final. (jev-research synthesis, local)
- A 0.6B decision model learned nothing from about 940 output-only examples (round 2). Round 3 reached AUROC 0.69 for retention, but it failed its hook-readiness gate (recall 0.58 against a 0.90 bar). The resident probe ran at p50 197 ms and p95 244 ms on this M1 Max, using 5 GB. (local round-3 memo)
- The retention proxy labels held up in audit: precision 0.87, recall 0.69.
- In the game, a rule engine (0.74) beat a 1.7B model (0.56) and NanoJev (0.68). That result is about that task. The memo itself names a "second opinion" as the one shape worth trying later.
- The September advances review ranked a shadow-only local reranker after BM25 as the best pilot. Its bar was at least 10 points of recall@3 at an equal 2,000 characters.
- The current knowledge pull runs on every eligible prompt, with BM25 top 3. Across 1,097 logged pulls its latency was p50 14 ms, p95 144 ms and max 1,059 ms. Of 238 pointers shown, none was opened afterward. 97% of those came from builder prompts, and typed prompts got only 8. The pull's weak point was the pointer format and who received it, not latency.

## What changed since mid-September (online, primary sources)

| Date | Finding | Effect on the September view |
|---|---|---|
| 2026-09-24 | [Kev-0.8B](https://huggingface.co/jaredpalmer/kev-0.8b): Apache-2.0 open family on Qwen3.5 bases, Jev wire format, ECE 0.042. One independent table puts Kev-4B at 0.838 and Jev at 0.857 on transfer-v4 ([tino LESSONS](https://github.com/BrandeisPatrick/tino/blob/main/LESSONS.md)). The tino figures for Kev are copied from Kev's card. | September said no Jev-compatible server ran on consumer hardware. Several do now, and at 4B the gap to Jev is small. |
| 2026-10-01 | [Cloudflare Clef / Clef-flash](https://blog.cloudflare.com/clef-decision-models/): open weights (27B and 9B bases), Jev-API compatible, 64k context. Clef beats Jev on BANKING77 (94.2 vs 79.7 macro-F1); vendor-run. | A strong open option exists, but it is too large for a 1 s local hook. |
| 2026-10-02 | [devision-mem-bench](https://github.com/Disdjj/devision-mem-bench): Jev as a gate for whether to store a memory and whether to recall one. Recall F1 was 0.80, 0.75 and 0.59 (small store, boundary set, large store), at or above an LLM baseline, with p50 0.8–0.9 s hosted. Write decisions that need earlier context missed 20%. The labels came from an LLM. | The first public memory-recall gate with numbers. Recall F1 falls as the store grows. |
| 2026-10-05 | [Cisco trial](https://blogs.cisco.com/ai/jev-decision-models-on-trial): at 0.5% false positives, a 1B encoder trained on the policy recalled 61%, Jev 34% and Laya almost none. | Agrees with September: zero-shot is weak at strict thresholds, and the task's own labels win. |
| 2026-10-14 | [Jev 1.14.0](https://docs.typesafe.ai/models.md): same price, long context up to 262k behind a header. Still hosted only. | No change. Hosted Jev stays out for private memory. |
| Sept–Nov 1 | [Laya](https://github.com/NandhaKishorM/laya) is at v0.4.20 (it was v0.3.21). [laya-mlx](https://github.com/mizorewww/laya-mlx) runs a short decision in 13.4 ms on an M3 Max with about 0.9 GB resident, 147 questions/s in batch. | The latency worry is gone. Accuracy is still open: the zero-shot English checkpoint scores 0.362. |
| 2026-10-21–25 | [tino](https://github.com/BrandeisPatrick/tino/blob/main/LESSONS.md): at 0.6B, every training recipe lands at 0.61–0.67 on new sources, and seed noise reaches 4.6 points. Distilling from a teacher gives good calibration (ECE 0.04–0.05) but not more knowledge. | Confirms the jev-research 0.6B result. Use 4B for transfer, or distil a teacher's probabilities for calibration. |
| 2026-10-26 | [pi-laya-mlx](https://github.com/a3harva/pi-laya-mlx): a fine-tuned Laya screens pi tool calls through a localhost daemon, at 20–60 ms per check. Its author found zero-shot Laya weak and the fine-tuned version much better. | Precedent for wiring a local decision model into a pi hook. |
| 2026-10-29 | [jev-rag-benchmark](https://github.com/erendikmenn/jev-rag-benchmark): over a hybrid BM25 + embedding pool, reranking moved recall@5 from 97.6% to 99.4%. On HotpotQA multi-hop, Jev reached 90% and BGE 86% ([Jev-Reranker](https://github.com/subhan75/Jev-Reranker)). | Reranking helps when the baseline misses; it adds little when the baseline is already strong. |
| ongoing | [qwenpaw-jev-memory-gate](https://github.com/1105623876/qwenpaw-jev-memory-gate) asks one yes/no question before auto memory search: "Does answering require long-term memory?" It skips at p &lt; 0.5 and runs in about 30–50 ms. It publishes no accuracy. | The exact shape asked about, and unmeasured. |

The wider literature points the same way. Cheap uncertainty or question-feature gates match trained retrieval gates ([Moskvoretskii et al., ACL 2025](https://aclanthology.org/2025.acl-long.319/); [LLM-independent adaptive RAG, EMNLP 2025](https://aclanthology.org/2025.emnlp-main.439/)). Adaptive-RAG's router is useful at only 54.5% accuracy ([Jeong et al. 2024](https://arxiv.org/abs/2403.14403)). Production memory systems either retrieve on every turn ([mem0](https://arxiv.org/pdf/2504.19413), search p95 0.2 s; [Zep](https://arxiv.org/abs/2501.13956)) or let the agent call a tool ([Letta](https://docs.letta.com/guides/agents/architectures/memgpt); [Claude memory tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool)). Few systems have a separate gate for whether to pull.

## The frame, challenged

The trigger makes two decisions. **Whether** to pull matters mainly for the context budget. **What** to pull decides whether a repeat is prevented. The costs are uneven: a wasted pull costs a few hundred characters; a miss costs a correction given twice. That makes a high-recall "what" step plus a budget cap the main design. A "whether" gate earns its place only if it cuts waste without losing hits.

A deeper doubt: a prompt-time trigger only sees the owner's message. Many corrections answer something the agent *did*, such as a tool call or a plan, which the prompt never mentioned. If so, no model at prompt time can find the memory, and the trigger belongs before tool calls instead. That is the first thing to measure.

## Three designs

| | A. Rules + BM25 (baseline) | B. Hybrid retrieval + small classifier | C. Typed decision model (Jev-like) |
|---|---|---|---|
| Reads | The prompt (first 8 KB) and the memory index | The prompt, plus the last agent turn cut to 1,000 characters; BM25 and embedding top 20 | The same state as B. Typed questions: one yes/no gate ("Would a stored correction or decision change how the agent should act on this message?") and a relevance yes/no per candidate |
| Outputs | Top 3 records above the skip rule, up to 2,000 characters | Records ranked by RRF, with an optional logistic gate on features | P(pull) and P(relevant) per candidate; **code** applies the threshold, a dead band, the budget and the dedupe |
| Model | none | EmbeddingGemma-300M (about [6–10 ms](https://huggingface.co/digital-creature/embeddinggemma-300m-onnx-int8)) | laya-mlx 421M (zero-shot) now; Kev-4B or a distilled fine-tune later |
| Warm latency (this M1 Max) | 14 ms p50, 144 ms p95 (measured) | about 50–150 ms, *inferred* | about 30–200 ms for 20 candidates, *inferred* from M3 Max figures and the round-3 probe |
| Cost | 0 | A warm daemon, about 0.5 GB | A warm daemon, 0.9 GB (Laya) to about 5 GB (4B) |
| Privacy | local | local | local; hosted Jev and Clef are excluded for the private store |
| Failure | Word mismatch | Embedding noise on terse prompts | Wording sensitivity; weak zero-shot; needs labels to tune |

All three fail open: with no daemon, a timeout or an empty result, the hook injects nothing. Every model arm needs a resident process, because a cold load takes 0.6 s or more.

## How to measure with what exists

- **The replay test (SUB-025).** Its replay point is the owner turn just before the corrected agent turn, exactly the trigger's input, and its treatment bundle is built only from candidates made before the cut. So a trigger can be scored **offline at zero spend**: does it deliver, within budget, the earlier record the oracle arm names? A paid replay then runs only for the winning arm, with "push plus that trigger's pull" as treatment and "push only" as control. The sealed statistic stays unchanged.
- **The private labels (41 corrections, 12 repeats).** The 12 repeats are the only cases with a known right answer: each has an earlier record the trigger should have found. The 29 first-time corrections have no prior record, so they are reported but never scored. Negatives come from owner turns that no correction follows.
- **The pull log.** It already records shown paths, so whether an agent used a pulled record can be checked against its later reads, in the field.

## Recommended first experiment: trigger screen, zero spend

**Question.** Does any trigger put the earlier record in front of the agent for the 12 repeats, and does a model arm beat BM25 at it?

**Set-up (frozen before running).** SUB-025's frozen snapshot and pre-cut candidate store. Positives: the 12 repeat cases at their replay point. Negatives: 200 seeded owner turns from the same transcripts with no correction in the next two turns. Each arm gets a 2,000-character budget, top 3. Arms:
- A: today's engine, pointed at memory records
- B: BM25 plus embedding RRF
- C: laya-mlx zero-shot, with the gate and relevance questions above; wording written once, before any case is viewed, and not tuned

**Measures.** Hits out of 12; mean characters injected per negative; warm p95 latency on this Mac.

**Pass bars (stated now):**
1. **Signal floor.** If every arm hits 3 or fewer of 12, the prompt does not carry the signal. Stop prompt-time model work and test a trigger before tool calls next.
2. **BM25 is enough.** If A hits 9 or more, keep A and spend the effort on the store and the delivery format.
3. **A model arm advances** to the paid replay only if all hold: at least 3 more wins than losses against A, with at most 1 loss; mean injected characters on negatives no higher than A's; warm p95 300 ms or less.

With 12 cases this is a screen, not proof: even 3 wins and 0 losses gives a one-sided p of 0.125. Confirmation is the SUB-025 replay run.

**Cost.** No API spend; about 1 GB of model disk. A seat-run script; outputs stay private.

## What is unknown

- Whether repeated corrections are visible in the prompt at all. The screen answers this first.
- Whether 12 positives are enough to separate the arms; only a large gap will show.
- How well zero-shot Laya or Kev handles terse, project-specific prompts; public numbers come from customer-support and QA text.
- Real M1 Max latency for laya-mlx and Kev-4B; public figures are from M3 Max and M5. *Inferred.*
- Whether an agent uses a pulled memory when it receives one: 0 of 238 pointers were opened. Records may need to be injected as text.
- Which labels a later fine-tune could use: the 0.87-precision reuse proxy, or teacher distillation (tino), since 12 positives cannot train anything.
- Whether a "whether" gate adds anything over a score floor; the literature says it rarely does.

Claim most likely wrong: that B and C fit within 300 ms p95 on this Mac with 20 candidates (inferred from other chips).
