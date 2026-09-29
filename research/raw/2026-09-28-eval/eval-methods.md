# Open-source evaluation methods nana can reuse — consistency, retrieval use, review-ladder value

*Opus 5.5 research lane, 2026-09-28. Built on `research/raw/2026-09-27-advances/opus-research.md` (P1) and `sol-research.md` (F11/F14/F18). Doctrine cited as `DOCTRINE:L<n>` against `~/nana-agent-loop/loops/DOCTRINE.md` as read today.*

## How to read this

- **Method.** Three web sub-agents opened the sources (arXiv abs/HTML, GitHub repos and LICENSE files, HF dataset cards, vendor docs). I re-checked the three claims that matter most myself: arXiv 2609.05510, the AACR-Bench HF card, and the AACR judge README. I also read nana's own review corpus (`docs/reviews/tranche{1,2}-2026-09-28/`), the bench README and verdict, and the knowledge README.
- **Reading caveat.** All web pages were read through a fetch tool that summarizes with a small model. No code was cloned or run: Bash for anything outside the repo was denied, including `~/.pi/agent/nana-knowledge/pull.log`, which I could not open. Re-check any number from a PDF before a decision turns on it.
- **Grades:** PRIMARY = paper, repo, LICENSE, docs or dataset card actually opened. SECONDARY = practitioner write-up with data. UNVERIFIED = search snippet only. **Inferred** = my reasoning, not something a source says.

## The short version

1. **At our scale, a consistency instrument can detect flips. It cannot estimate a rate.** A single brief run 3×, green 3/3, still has a 95% Wilson interval of **[0.44, 1.00]**; 5/5 gives [0.57, 1.00] (my arithmetic, using the Wilson method that Bowyer et al. 2503.01747 recommend for small n). So "3/3 clean" proves little, while "one of 3 red" proves inconsistency outright. The usable design is **many task families × k=3**, reporting *how many families flipped* plus cost dispersion. altk-evolve's code is **Apache-2.0** (LICENSE file, PRIMARY), so it is usable. But it contains **no pass^k evaluator and no AppWorld runner**, only a trajectory consistency analyzer. Borrow τ-bench's estimator; skip the repo for now.
2. **Our review corpus cannot answer "which role catches what" as it stands.** 29 reviewer reports exist (19 sol rounds, 5 astra first rulings, 5 astra confirms). Only **4 files carry role tags** (20 tags). The roles are also played by **one model in one pass**, so role is confounded with model and round. What the corpus *can* answer retroactively is **which model and round caught which class of defect, and which the seat accepted**. Answering the role question needs a small role-split re-run, designed below.
3. **The borrowable review-scoring kit is AACR-Bench + OpenCodeReview (both Apache-2.0).** They provide a 4-stage matcher (path → side → line±k → LLM-semantic), a published defect taxonomy, and 640 labelled *incorrect* comments for testing a scorer's false-positive handling. Its judge already accepts findings in the `summary + failure_scenario` shape. What it lacks for us is a **gold set**. Ours has to come from the seat's per-finding dispositions in the fix briefs (fix / override / carry), which already exist.
4. **No off-the-shelf RAG metric measures "was the pointer used".** Ragas (Apache-2.0) scores whether an answer is grounded in text. ContextCite-style attribution needs white-box logprobs, which closed agent APIs do not give. The honest design is a **randomized pull on/off ablation that logs what *would* have been shown in the off arm**, plus trace instrumentation (did a Read of the pointed path follow?). This is the design of ContextBench, Gloaguen et al., and VibeMemBench's memory-off baseline (all PRIMARY).
5. **Public task banks measure the wrong workload, and the flagship is saturated.** SWE-bench Verified is at ~95% (SECONDARY aggregator) with documented test flaws. Terminal-Bench and SWE-rebench cluster at the top. None of them resembles "a coding agent under a gate with a review ladder on our own repos". **Borrow their methods (hidden tests, fresh-task windows, k-run reporting), not their tasks.** Our best failure-capable task bank is our own history: **lanes whose r1 review BLOCKed with an executed probe**. Replay the original brief and grade it by those probes turned into hidden tests. By construction the baseline failed those tasks, which satisfies DOCTRINE:L13.

---

## 0. What our own corpus actually contains (PRIMARY: files read 2026-09-28)

| Fact | Evidence | Consequence for the instrument |
|---|---|---|
| 29 reviewer reports: sol r1–r3 on 7 lanes (l1, l2, l3, l4, u, t2a, t2b = 19 files); astra first ruling (`*-astra-land.md`) and astra confirm (`*-astra-r2.md`) on 5 lanes each | `ls`, grep `VERDICT:` | The brief's "~17 rounds" undercounts or counts something else; recount before pre-registering. |
| sol reached LAND within the 3-round cap on **4 of 7 lanes** (l2 r3, l4 r2, u r2, t2b r3). l1, l3 and t2a were still BLOCK at r3, and the seat then implemented | grep `VERDICT:` per file | The cap binds often. Those 3 lanes are candidates for "was r3 fold-verification or new scope?" (opus-research H5). |
| astra's first ruling was **7/10 BLOCK on all 5 lanes**; its confirm round was **9/10 LAND on all 5** | `SCORE:` lines | Zero variance across 5 lanes is suspicious (inferred): either the brief anchors the score or the score carries no information. Treat astra SCORE as non-evidence until shown to vary. |
| astra BLOCKed **l2 and t2b after sol had LANDed them** | l2-sol-r3 LAND → l2-astra-land BLOCK; t2b-sol-r3 LAND → t2b-astra-land BLOCK | These are the cleanest candidate "unique catches" in the corpus. Classify them first. The t2a example shows astra's MUSTs can be documentation and consumer-declaration items (evolvability), not functional defects. |
| Role tags `[scope]/[adversarial]/[compat]` appear in only 4 files (l1, l2, l3, t2a sol r1): 20 tags, 9 of them bare `[adversarial]` | grep count | Retroactive role attribution is possible for r1 of 4 lanes only. |
| Seat dispositions per finding are written into the fix briefs: "Fix these 1–6", "Seat ruling — sol's MEDIUM #3 is overridden", "Keep" | e.g. `l3-fix-brief.md` | This is the ground truth for reviewer precision. Every finding gets accepted / overridden / carried, with no new labelling of truth needed. |
| sol's adversarial findings are *executed* probes ("Replacing the snapshot with `allowPatterns:[".*"]` … returned unblocked") | `l1-sol-r1.md` | These probes can be turned into hidden tests for the replay task bank (§4). |

---

## 1. Consistency (pass^k) — what to borrow

### 1.1 τ-bench pass^k estimator — **ADOPT (method)**
- **What it measures:** the chance that all k i.i.d. trials of a task succeed, averaged over tasks: `pass^k = E_task[C(c,k)/C(n,k)]`, where c successes come from n trials. With n > k it uses every trial, not just the first k.
- **Licence:** tau-bench MIT, tau2-bench MIT. The formula is math, so no licence question arises.
- **Grade:** PRIMARY. arXiv 2406.12045 (2024-06); github.com/sierra-research/tau-bench. The same formula appears in 2608.11386 (PRIMARY, CC BY 4.0).
- **Runs locally at our scale:** yes, as about 10 lines in `apps/bench/aggregate.mjs`. The bench already has seeded randomized blocks and extendable `repeats` (bench README L208–218, PRIMARY).
- **What it tells us that we don't know:** the all-green rate, which is the thing Jake complains about. The bench today reports a mean.
- **Cost:** S. **Cheapest try:** recompute the 2026-09-08 study (132 runs, n=3) with pass^3. It will read 1.0 everywhere, the ceiling again. That is exactly why the doctrine line binds (below).
- **Ceiling doctrine:** neutral by itself. pass^k on tasks the baseline always passes is still dead on arrival.

### 1.2 IBM "Closing the Consistency Gap" + `altk-evolve` — **DEFER (code); borrow the reporting**
- **Licence, resolved:** the arXiv page shows **CC BY-NC-ND 4.0, which covers the paper text only**. The repo `LICENSE` file literally reads "Apache License / Version 2.0, January 2004", and the README agrees. **The code is Apache-2.0, so we may use it.** PRIMARY: arxiv.org/abs/2609.08832 (2026-09-08); raw.githubusercontent.com/AgentToolkit/altk-evolve/main/LICENSE (read 2026-09-28).
- **What the repo actually contains** (PRIMARY, from the tree and source files):
  - A consistency analyzer (`altk_evolve/llm/guidelines/consistency_analyzer/`). It resamples a decision point about 30× at temperature 0.5 and scores how similar the samples are (Jaccard, Levenshtein, SBERT, categorical entropy).
  - A guideline generator that turns flip-prone decisions into natural-language guidelines.
  - **No pass^k evaluator, no AppWorld runner.** The paper's pass^k is the literal all-5-green indicator per task, over 168 AppWorld tasks × k=5.
  - Python ≥3.12, litellm, sentence-transformers, arize-phoenix, and an LLM key.
- **Runs locally:** the analyzer probably does, given trajectories converted to its `{"steps": [...]}` dict (inferred from imports; not run).
- **What it would tell us:** *which decision inside a run* is flip-prone, e.g. "does the worker touch files outside the allowlist". That is the IBM mechanism, and it maps to DOCTRINE lines written by hand (opus-research P1).
- **Cost:** M, plus a trajectory converter from pi JSONL and a Python 3.12 environment.
- **Cheapest try:** skip it until §1.4's probe has shown a flip. The analyzer explains a flip; it cannot detect one we haven't seen.
- **Ceiling doctrine:** supports it only once a flip exists.

### 1.3 Small-n statistics — **ADOPT (method)**
- **Bowyer, Aitchison, Ivanova, "Don't Use the CLT in LLM Evals With Fewer Than a Few Hundred Datapoints"** (arXiv 2503.01747, v3 2025-05-28, CC BY 4.0, PRIMARY).
  - CLT error bars are too narrow at N = 3, 10 and 30.
  - Recommends Wilson or Beta(1,1) Bayesian intervals for one arm, and **paired Bayes** for A vs B. Clopper-Pearson is too wide.
  - Library `github.com/sambowyer/bayes_evals` (not opened).
- **Miller, "Adding Error Bars to Evals"** (arXiv 2411.00640, 2024-11, PRIMARY).
  - Question-level **paired differences**, clustered SEs when tasks come in families, and a power formula.
  - Resampling K times divides within-task variance by K, with diminishing returns. It is CLT-based, so use it for design, not for n<30 intervals.
- **"On Randomness in Agentic Evals"** (arXiv 2602.07150, 2026-02, PRIMARY abstract).
  - On SWE-bench Verified, pass@1 moves 2.2–6.0 pp depending on which single run is chosen, with SD >1.5 pp even at temperature 0.
  - Recommends multiple runs and reporting both pass@k and pass^k.
- **2608.22331, "Noise Floor Audit"** (2026-08-23, PRIMARY, no code).
  - Prompt paraphrase moves outcomes **11–58× more than reruns** (paired SD).
  - **Consequence for nana (inferred):** a consistency probe that re-issues *the same brief text* measures the smallest noise source. Real-world inconsistency comes from differently worded briefs for the same kind of task. A probe arm should include one paraphrased brief.
- **Sequential stopping:** optstop (arXiv 2608.14425, 2026-08-14, PRIMARY abstract) cut 57–97% of planned trials with the same conclusions. Confidence-sequence papers 2607.17409 and 2607.08522 are UNVERIFIED snippets.
  - At k ≤ 5 the simplest honest rule is a stop-on-first-flip rule: a single red run already proves the family inconsistent, so remaining repeats buy nothing for the flip question. It is a rule, not a paper (inferred).
- **Task selection against ceilings:** "Efficient Benchmarking of AI Agents" (2603.23749, UNVERIFIED snippet) keeps only tasks with a 30–70% historical pass rate. Anthropic's "Demystifying evals for AI agents" (2026-01-09, PRIMARY) says "A 100% score gives no signal." Both are the external form of DOCTRINE:L13.
- **Cost:** S (formulas in aggregate.mjs). **Ceiling doctrine:** supports it.

### 1.4 What our scale can honestly claim (my arithmetic, Wilson 95%)

| Observed | Interval on per-run success | What it licenses |
|---|---|---|
| 3/3 green on one brief | [0.44, 1.00] | nothing about consistency |
| 5/5 green on one brief | [0.57, 1.00] | nothing much |
| 2/3 on one brief | [0.21, 0.94] | **the family is inconsistent** (existence proof) |
| 8 families × 3 reps, 0 flips | families-flipped 0/8, Wilson [0, 0.32] | "fewer than ~1 in 3 families flip" |
| 8 families × 3 reps, 3 flips | 3/8, Wilson [0.14, 0.69] | a real consistency problem at worker level |

**Rule this implies:** report **families flipped / families probed** and **cost spread (max/min per family)**, never a mean pass rate. About 24 worker runs is the smallest probe that can say anything in either direction.

---

## 2. Review-ladder value — what to borrow

### 2.1 AACR-Bench + OpenCodeReview scorer — **ADOPT (matcher, taxonomy, negatives); build the gold set ourselves**
- **What they measure:** SEM-F1 of generated review comments against expert-verified gold comments. The LLM judge is Qwen3-235B, run 5× and averaged. OpenCodeReview's harness scored 25.10% vs 11.57% for the same Claude backend under Claude Code.
- **Licences:** OpenCodeReview code Apache-2.0 (github.com/alibaba/open-code-review, PRIMARY). AACR-Bench repo and dataset Apache-2.0 (github.com/alibaba/aacr-bench; huggingface.co/datasets/Alibaba-Aone/aacr-bench, card read 2026-09-28, PRIMARY). Paper texts CC BY 4.0.
- **Dataset:** 2,145 comments, **1,505 labelled correct and 640 labelled incorrect**. Fields include `path, side, from_line, to_line, category, context, label, source_model`.
  - The paper (2601.19494) gives 4 issue classes: Security 53, Code Defect 709, Maintainability & Readability 626, Performance 117.
  - The HF card lists only 3 (no Security). **Discrepancy, unresolved.**
- **Scorer** (`evaluation/README.md`, PRIMARY):
  - Matching runs path → side → line (overlap or distance ≤ `--line-k`, default 1) → semantic LLM judge. Matching is not strictly one-to-one.
  - Any OpenAI-compatible judge works via `JUDGE_BASE_URL/KEY/MODEL`. Reviewer inputs already supported: OCR `content`, **Claude `summary + failure_scenario`**, Codex `summary + description`.
  - **Trap:** with no API key it *silently* falls back to a "mock similarity" meant for pipeline tests. A scorer that passes without a judge is the SWE-Prometheus failure (sol F18). Any adoption must fail closed on `JUDGE_USE_MOCK`.
  - The judge prompt text was not opened; unverified.
- **Runs locally:** yes, with work: convert our markdown findings to JSONL rows. Our findings mostly carry `file:line` (e.g. `config.ts:268-273`), so the path and line stages apply.
- **What it tells us:** it removes duplicates *across* reviewers mechanically. "sol r1 finding 2 = astra MUST 3" becomes a matcher decision, not the seat's memory. That is the core operation of unique-catch attribution.
- **What it cannot do for us:** give recall against truth. AACR's gold is 1,505 human-verified comments on *their* PRs. Our gold must be the **seat-accepted findings** (fix-brief dispositions) plus defects found *after* land (post-land fixes, FRICTIONS). This is circular for precision (the seat accepts what reviewers say), so pair it with the seeded-defect control in §5.
- **Cost:** M (converter + judge config + ~30-pair human check of the judge, per the ABC checklist O.c.1).
- **Cheapest try:** match l2 and t2b only (sol r1–r3 vs astra land). That is 2 lanes, about 30 findings. Hand-check every judge decision.
- **Ceiling doctrine:** not applicable directly. The §5 seeded-defect control is where this instrument proves it can fail.

### 2.2 Defect taxonomy — **ADOPT Mäntylä & Lassenius two-level + explicit false positive**
- Top level: **evolvability** (documentation, visual representation, structure) vs **functional** (interface, logic, resource, check, timing, support, larger defects), plus **false positive**. In human reviews about 75% of defects were evolvability. IEEE TSE 35(3), 2009. UNVERIFIED (snippets only; paper not opened).
- **Used by recent LLM-review work** (PRIMARY): SWR-Bench groups its 11 change-action types exactly this way (2509.01494). Atlassian (2510.05450) derived 5 classes from it, and "Go Home Copilot" (2607.21997) uses the same split.
- **For nana:** add a third axis we need and they lack: **surface**. Surfaces are security/gate, contract/API, docs/consumer declaration, test adequacy, and scope/size. These are the classes the ladder's roles claim to own (inferred).
- **Cost:** S (a label guide). **Reliability check:** two labellers (seat + one Opus worker) on 40 findings, Cohen's κ. Proceed if κ ≥ 0.6. Atlassian's LLM-vs-human κ was 0.42 (PRIMARY), which is a warning that LLM labels alone are weak.

### 2.3 Other review-scoring work — what to take from each

| Work | Measures | Licence | Grade | Take for nana |
|---|---|---|---|---|
| SWR-Bench (2509.01494) | Finding-level P/R against change-actions. **Includes 500 clean PRs to measure false positives.** Judge vs human κ 52.8–62.0 ≈ human vs human | data CC BY 4.0 | PRIMARY | **The clean-PR control:** feed reviewers an already-landed, known-good patch and count BLOCKs. |
| SWE-PRBench (2603.26130) | Recall of human-flagged issues. Judge labels each comment CONFIRMED / PLAUSIBLE / FABRICATED via frozen `RUBRIC.md` | MIT / CC BY 4.0 | PRIMARY | **Borrow the 3-way rubric** for our false-positive column. |
| c-CRAB (2603.23448) | Executes the review: an agent fixes from the review, then tests derived from human feedback run | CC BY 4.0 | PRIMARY | Same idea as our replay bank (§4). Its "all tools combined ≈40%" is a reminder that reviewers are far from complete. |
| CRScore (NAACL 2025) | Reference-free comment conciseness / comprehensiveness / relevance | MIT | PRIMARY | **Not adopted:** scores comment quality, not whether the defect is real. |
| Karakaya et al. (2604.24525) | Can an LLM judge predict whether developers find a comment useful? Agreement 0.44–0.62, best MCC **−0.059** | — | PRIMARY | **Warning:** an LLM "usefulness" judge is worthless. Use seat dispositions, not a judge, for accepted/rejected. |
| Atlassian (2510.05450); Go Home Copilot (2607.21997) | Resolution rate of AI comments: 30–40% resolved at Atlassian; 55–73% by tool in GitHub repos | — | PRIMARY | The "addressed rate" proxy is standard practice, and ours is the fix-brief disposition. |
| Capture–recapture for inspections (Eick et al. ICSE'92; Briand et al. TSE 2000; Petersson et al. JSS 2004) | Estimates total defects and each inspector's unique share from overlaps | — | UNVERIFIED (403s; citations from snippets and memory) | **Use only as a lower-bound sketch.** LLM reviewers share lineage and prompts, which breaks the independence assumption. No published application to LLM reviewers was found. |

### 2.4 The role question needs an experiment, not a re-read (inferred design)
The corpus confounds role with model, round and single-pass self-tagging. Proposed design:
- Take 3 historical lane patches at their r1 commit (l1, l2, l3 have tagged r1s for cross-checking).
- Run sol with **three single-role briefs** (scope-only, adversarial-only, compat-only) plus the **combined brief**. That is 12 sol calls on the flat Codex subscription.
- Match all findings with §2.1 and label with §2.2.
- A role is **ceremony** if its single-role run's seat-accepted findings are all matched by the other runs, *and* it caught no functional-class defect across the 3 lanes.

---

## 3. Retrieval use — what to borrow

| Candidate | What it measures | Licence | Grade | Fits "pointer shown to a coding agent"? |
|---|---|---|---|---|
| Ragas faithfulness / context precision / context utilization / noise sensitivity | Whether an answer is grounded in retrieved text (LLM-judged) | Apache-2.0 | PRIMARY (docs.ragas.io) | **No.** It scores answer text, not whether the agent opened the file or behaved differently. **Do not adopt.** |
| ContextCite (MadryLab), AttriBoT, AT2 | Which context spans caused the output, via ablation and a surrogate model | MIT (ContextCite) | PRIMARY / UNVERIFIED | **No.** Needs white-box logprobs or attention, one forward pass per ablation. Unavailable for Opus/sol via API. |
| ContextBench (2602.05892) | Logs the file paths and line ranges an agent inspects vs gold context. Finds an "explored vs utilized" gap | CC BY 4.0 | PRIMARY | **Yes, the method.** Log Read/grep paths from pi and Claude Code transcripts. |
| Gloaguen et al. (2602.11988) | Does a tool or instruction named in an injected file show up in later tool calls? (`uv` 1.6×/instance vs <0.01) | — | PRIMARY | **Yes, the design:** "mention → uptake" is exactly "pointer path → later Read of that path". |
| VibeMemBench (2609.23570) | Paired memory-off vs oracle-memory vs retrieved-memory, same task and agent. Retrieval fails to beat memory-off in 11/12 pairs; 69.3% of failures are record-form degradation | CC BY 4.0 | PRIMARY | **Yes, the method (on/off + oracle arm).** Its tasks don't fit ours. |

**Blunt answer:** an ablation plus trace instrumentation is the only honest option. RAG grounding metrics do not transfer, because the pointer's effect runs through a *decision to open a file*, and no answer-text metric sees that decision.

**Correction to the prior pass:** opus-research C5 cited 2609.05510 (Helwig) as naming "retrieved-but-unused". The arXiv abstract (PRIMARY, re-read today) is titled "Memory as Infrastructure: Reliability Engineering for Persistent Agent Memory…" and **does not contain that phrase**. The body is unverified. Do not cite 2609.05510 for "retrieved-but-unused" until the full text is checked.

---

## 4. Task and question banks

| Bank | Measures | Licence | Local at 5–20 tasks? | Ceiling risk | Resembles nana? |
|---|---|---|---|---|---|
| SWE-bench Verified / Lite | Python issue → patch, hidden F2P/P2P tests | MIT (PRIMARY) | Yes. Docker, ~120 GB disk, `-i instance_id` | **Saturated:** ~95% (SECONDARY aggregator). OpenAI reportedly stopped reporting it over flawed tests (UNVERIFIED, page 403). PatchDiff (2503.15223, PRIMARY): 7.8% of "passing" patches fail full developer tests | No: single-shot patch, no gate, no review |
| SWE-bench Pro (Scale) | Harder multi-language, v2 642 tasks | Repo MIT; data partly from GPL repos | Yes, Docker | Scores inconsistent across sources (61.5% vs 89.9%, both UNVERIFIED) | No |
| SWE-rebench | Fresh monthly tasks, fixed scaffold, **5 runs per task** | Not stated | Docker images on HF | Top 3 within 1.1 pp (PRIMARY) | No. **Borrow the 5-run reporting and freshness windows.** |
| SWE-bench-Live | +50 fresh tasks per month; MultiLang, Windows | MIT (PRIMARY) | Yes, `--instance_ids` | Unknown | No. The only defensible *external* calibration set, if one is ever wanted (inferred) |
| Terminal-Bench 2.0 (now 4.0 on the site) | Terminal tasks in Docker via Harbor | Apache-2.0 (PRIMARY) | Yes | ~82–84% on 2.0 (UNVERIFIED) | Partly: shell-agent work, no review |
| τ²-bench | Tool-agent-user dialogue under a policy | MIT (PRIMARY) | Yes. No Docker, needs a user-simulator LLM | Unknown. ABC found τ-bench counted empty responses as success | No: customer-service domain. **Borrow pass^k only.** |
| AppWorld | Multi-app API tasks, state-based tests incl. collateral damage | Apache-2.0; tasks encrypted | Yes | Unknown | No. **Collateral-damage checks resemble our NOT-lists**, a method worth noting (inferred) |
| LiveCodeBench | Contest code generation | MIT | Yes, no Docker | Unknown | No: not repo-level |
| BrowseComp | Hard web QA | MIT | Needs web | ~92.5% (UNVERIFIED) | No |
| Aider polyglot, SWE-Lancer, SWE-PolyBench, FeatBench | Edit / freelance / multi-language / feature tasks | Mixed or unchecked | Docker | Aider 88% (PRIMARY board, stale) | No. FeatBench's "scope creep" finding is relevant to our allowlists (UNVERIFIED) |

**Verdict:** adopt **no external task bank**. Build a **replay bank from our own history** (inferred design, borrowing SWE-bench's hidden-test method and c-CRAB's executed-review idea):
- Each item is a lane brief at its base commit, plus hidden tests made from the **executed probes in its r1 BLOCK** (e.g. l1: "a forged wider snapshot must not unblock `rm -rf`"). These are known historical failures, so the correctness axis is alive by construction.
- Candidate items today: l1, l2, l3, u, l4, t2a, t2b r1 BLOCKs. That is 7 lanes, perhaps 12–20 executable probes (count unverified).
- Validity per the ABC checklist (arXiv 2507.02825, PRIMARY):
  - T.5 isolate the agent from ground truth: the hidden tests are not in the worktree.
  - T.9 an oracle solver exists: the landed commit must pass every probe.
  - O.d manually verify each test: the base commit must fail every probe.

---

## 5. Negative controls and validity

Standard practice, all PRIMARY unless marked:
- **ABC checklist** (Zhu et al., 2507.02825). Evaluation flaws cause up to 100% relative mis-estimation. Key items for us:
  - T.9 oracle solver; T.10 inspect outliers in pilot runs.
  - O.c.1 pilot-test any LLM judge for accuracy and consistency.
  - O.d manually verify tests.
  - O.g state checks must be complex enough that trivial changes cannot pass.
- **Mutation testing of the checker:**
  - "Measuring the Checker" (2609.22220, 2026-09-02): the official KernelBench checker missed 16.9% of 10,303 injected faults.
  - SWE-Mutation (2605.22175, UNVERIFIED): agent-made mutants drop test-suite detection from 71.0% to 39.8%.
  - UTBoost (2506.09289, UNVERIFIED/SECONDARY): 26 of 500 Verified tasks had insufficient tests.
- **Positive control:** compact-docs (2609.31587) ran one, but its effect was a single task (15 vs 14), which is too weak to certify the harness. The lesson: **a positive control must be large enough that missing it is impossible**.
- **Anthropic, "Demystifying evals for AI agents"** (2026-01-09):
  - Read transcripts.
  - Balance positive and negative cases.
  - Isolate trials, since shared state causes correlated failures.
  - Keep reference solutions that pass all graders.
  - "0% pass@100 is most often a signal of a broken task."

**Rule to adopt (extends DOCTRINE:L247's disarm experiment from gates to instruments):** no instrument's number is reported until it has shown both
- a **positive control**: a known effect it must detect, and
- a **negative control**: a known null it must not flag.

Concretely:

| Instrument | Positive control (must detect) | Negative control (must not flag) |
|---|---|---|
| Consistency probe | A brief deliberately left ambiguous (one invariant stated two ways) must flip ≥1 of 3 | — |
| Replay bank | Base commit fails every hidden probe | Landed commit passes every hidden probe |
| Review scoring | Seeded-defect patch: inject 3 known defects (1 functional-security, 1 contract, 1 docs) into a landed patch; the ladder must catch the functional one | Clean-patch control: an already-landed, post-verified patch; BLOCK count on it is the false-positive floor (SWR-Bench's clean-PR idea) |
| Retrieval use | Oracle pointer: a pull that names exactly the file the task needs must show a read uplift | Decoy pointer: an irrelevant-but-plausible file; its read rate is the "agent reads whatever it's shown" floor |

---

## 6. Cost discipline at single-digit n

- **Pair everything:** same task, same base commit, both arms, randomized order (bench blocks already do this). Compare with **McNemar or paired Bayes** on per-task outcomes (Miller 2411.00640; Bowyer 2503.01747), never unpaired means.
- **Block by task family:** clustered SEs (Miller) or, simpler, report per-family results.
- **Intervals:** Wilson or Beta(1,1) credible intervals for proportions; bootstrap only over *families*, never over runs within a family (inferred: runs within a family are not independent).
- **Stop early:** stop a family on its first flip. For A/B tests, pre-declare a sequential rule (optstop-style; PRIMARY abstract only).
- **Spend only where discrimination is possible:** keep only tasks with a non-trivial historical failure rate (Ndzomga-style selection, UNVERIFIED; same logic as DOCTRINE:L13).
- **Cost anchor:** a probe of 8 families × 3 reps = 24 Opus worker runs. At the ~300k-token worker scale in the session archive (`docs/sessions/2026-09.md`, one lane), that is roughly 7M tokens. The dollar figure depends on plan and caching; the sanity check is a monthly, not weekly, cadence (inferred).

---

## (a) Recommended instrument set

### Q1 Consistency — "flip probe"
- **Borrowed:** τ-bench pass^k estimator (MIT); Wilson and paired-Bayes intervals (Bowyer); a paraphrase arm (2608.22331); stop-on-first-flip.
- **Built ourselves:**
  - pass^k, families-flipped and cost max/min in `apps/bench/aggregate.mjs` (S).
  - A "brief-replay" task type in the bench that checks out a base commit and runs hidden probe tests (M).
- **First experiment (pre-registered):**
  - 6 families from the replay bank (§4) × 3 fresh Opus workers each, original brief, plus 1 paraphrased-brief run per family. That is 24 runs.
  - **PASS (worker level is consistent):** 0 of 6 families flip on the hidden probes, *and* cost max/min ≤ 2× in every family.
  - **FAIL (inconsistency confirmed at worker level):** ≥2 families flip.
  - **Inconclusive:** 1 flip. Extend to 5 reps on that family only.
  - **Validity gate first:** the base commit fails every probe and the landed commit passes every probe; otherwise drop that family.
  - **Falsifies the whole approach if:** fewer than 4 lanes yield an executable probe that the base commit fails. In that case the replay bank is too thin, and the first job becomes seat-level measurement (session-open redirects, opus-research P1(b)).

### Q2 Retrieval use — "shadow pull ablation"
- **Borrowed:** VibeMemBench's paired off / oracle / on arms; ContextBench's inspected-path logging; Gloaguen's mention → uptake measure.
- **Built ourselves:**
  - A deterministic per-session arm in the knowledge hook (hash of session_id → shown / withheld). The withheld arm still logs the would-be hits to `pull.log` with `arm:"withheld"` (S–M).
  - A transcript scanner that joins pulls to later Read/grep/cat of the pointed path within N turns, for both runtimes (M).
- **First experiment (pre-registered):**
  - 2 weeks or ≥100 pulls per arm, whichever comes later.
  - Metric: uplift = P(read of pointed path ≤5 turns | shown) − P(read of same path ≤5 turns | withheld).
  - **PASS (the pull is used):** uplift ≥ 10 pp, with the 95% interval excluding 0.
  - **FAIL:** uplift < 5 pp. Then add an intent gate or cut the corpus, per opus-research C5.
  - **Controls:**
    - Oracle: 5 hand-built sessions where the pointed file is the one needed. The scanner must see the read.
    - Decoy: its read rate is reported as the floor.
  - An outcome effect (task success) is **not** claimed from this experiment. The run count is too small (inferred).

### Q3 Review-ladder value — "catch ledger + role-split re-run"
- **Borrowed:** AACR/OpenCodeReview 4-stage matcher (Apache-2.0); Mäntylä two-level taxonomy; SWE-PRBench CONFIRMED / PLAUSIBLE / FABRICATED labels; SWR-Bench clean-PR false-positive control; κ for label reliability.
- **Built ourselves:**
  - A findings extractor from markdown into JSONL rows: path, lines, severity, class, surface, reviewer, model, round, role tag, and seat disposition from the fix briefs (M).
  - A fail-closed wrapper around the judge (no mock fallback) (S).
- **Experiment 1, retroactive (no new model spend except the judge):**
  - Extract all findings from the 29 reports and label them. κ must be ≥ 0.6 on 40 double-labelled findings, or stop.
  - Produce the table: model × round × class → found / accepted / unique.
  - **Pre-registered claim to test:** "astra's first ruling contributes ≥1 seat-accepted *functional* defect not matched by any sol round, on ≥2 of 5 lanes." If it does, the astra rung is not ceremony. If its unique accepted catches are all evolvability/docs, it is a documentation check at 2.5× Sol's token price (opus-research §4), and a cheaper rung could replace it.
  - **Secondary:** fraction of sol r3 findings that are new-scope vs fold-verification (tests H5).
- **Experiment 2, role split** (12 sol calls, §2.4).
  - **Pre-registered:** a role is ceremony if, across 3 lanes, its single-role run contributes 0 seat-accepted findings that the other runs miss.
- **Controls:**
  - A seeded-defect patch: the ladder must catch the functional seed.
  - A clean landed patch: the BLOCK rate on it is the false-positive floor.
  - Both run once before any role is ruled ceremony.

## (b) What I would NOT adopt

- **Ragas or any RAG grounding metric** for the knowledge pull. It measures answer text, not the decision to open a file.
- **ContextCite / AttriBoT / AT2.** They need white-box logprobs or attention.
- **Public task banks as nana's measure** (SWE-bench Verified, τ², AppWorld, LiveCodeBench, BrowseComp, Terminal-Bench). The workload does not fit, and the flagship is saturated with flawed tests. Using them would reproduce the tool-profiles ceiling at scale.
- **altk-evolve's code as the first step.** It explains flips; we have not measured one yet. Revisit after Q1 shows ≥2 flipping families.
- **CRScore and LLM "usefulness" judges.** Karakaya's best MCC was −0.059.
- **Capture–recapture totals as headline numbers.** The independence assumption is broken for same-lineage reviewers. Use it only as a sketch.
- **Astra's SCORE field as evidence.** It is constant across 5 lanes: 7 on the first ruling, 9 on the confirm.
- **Mean pass rate at n ≤ 5** anywhere in a verdict.

## (c) Refuted / unverified ledger

- ✗ **"altk-evolve is CC BY-NC-ND, so its code is unusable."** Refuted. The repo LICENSE is Apache-2.0; the NC-ND licence covers the arXiv paper text (PRIMARY).
- ✗ **"altk-evolve ships the pass^k evaluation / AppWorld harness."** Refuted. Tree and imports show only the analyzer and guideline generator (PRIMARY, not run).
- ✗ **"2609.05510 (Helwig) names 'retrieved-but-unused'"** (opus-research C5). Not in the abstract. The title is "Memory as Infrastructure…". Body unverified; do not cite for that phrase.
- ✗ **"RAG metrics (Ragas) tell us whether pointers are used."** Refuted by Ragas's own metric definitions (PRIMARY).
- ? **AACR-Bench class count.** The paper says 4 (incl. Security 53); the HF card lists 3. Unresolved.
- ? **AACR/OCR judge prompt and one-to-one matching.** Not opened.
- ? **SWE-bench Verified retirement by OpenAI and the "59.4% flawed" figure.** OpenAI page 403; snippets only.
- ? **Leaderboard numbers** (SWE-bench Verified 95%, Pro 61.5 vs 89.9, Terminal-Bench 82–84%, BrowseComp 92.5%). Aggregators, inconsistent; SECONDARY or UNVERIFIED.
- ? **Mäntylä & Lassenius "75% evolvability"; capture–recapture citations.** Snippets and memory; papers not opened.
- ? **Cihan et al. 73.8% resolved; Google 7.5% of comments addressed.** Snippets only.
- ? **Ndzomga 30–70% task selection; confidence-sequence papers 2607.17409 / 2607.08522.** Snippets only.
- ? **`pull.log` volume.** The file could not be opened (sandbox), so whether it already holds ≥100 pulls is unknown.
- ? **Number of executable r1 probes in the corpus** (my "12–20"). Estimate, not counted.
- ? **"~17 rounds" (brief) vs 29 reviewer reports (my count).** The definitions probably differ; reconcile before pre-registering.

VERDICT: DONE

Most-likely-wrong (bet against these first):
1. That the r1 BLOCK probes can be turned into ≥4 clean hidden-test tasks the base commit fails and the landed commit passes. Many probes needed temp-HOME and real-pi setups and may not replay deterministically.
2. That astra's constant 7/10 → 9/10 scores mean the SCORE field carries no information. The lanes may genuinely have been of similar quality, or the brief may define the scale that way.
3. That the AACR matcher works on our findings. Our `file:line` references are often ranges, several files per finding, or none at all (docs findings), so the path and line stages may drop many matches before the semantic stage.
4. That a 10 pp read-uplift threshold is reachable and meaningful. Base read rates may be near 0 in both arms, and ≥100 pulls per arm may take far longer than 2 weeks.
5. That 2609.05510 does not discuss "retrieved-but-unused". I checked only the abstract; the body may use the phrase, which would restore opus-research C5's citation.
