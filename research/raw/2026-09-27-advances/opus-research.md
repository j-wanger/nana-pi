# Advances in agentic / harness / context engineering since 2026-08-01 — what should change for nana

*Opus 5.5 research lane, 2026-09-27. Baseline treated as "already known": `research/coding-agent-best-practices-2026-09-02.md` (incl. its §7 refuted ledger) and `~/private-knowledge/agentic-engineering-wiki/index.md`. DOCTRINE lines are cited as `DOCTRINE:L<n>` against `~/nana-agent-loop/loops/DOCTRINE.md` as read today.*

## How to read this

- **Method.** ~30 sources opened (not just titles): Claude Code changelog 2.1.275–2.1.283, Claude Code docs (`/goal`, workflows, advisor, hooks), Claude Platform release notes Jul–Sep, pi releases v0.84.3–v0.87.1 + pi `extensions.md`, the Opus 5.5 launch post, Codex changelog, Cognition Fusion, Cursor token-efficiency post, and 16 arXiv papers from 2026-07/08/09. I also read nana's actual mechanisms (file paths named per finding).
- **Reading caveat (applies to every number below).** Pages were read through a fetch tool that summarizes with a small model. Numbers are as extracted from the paper's abstract/HTML, not re-derived from PDFs or code. Before a number drives a decision, open the paper and check it. Where a claim came only from a search snippet, I say so.
- **Grades:** PRIMARY = official docs/changelog/paper/source code. SECONDARY = practitioner write-up with data. MARKETING/ANECDOTE = vendor claim with no method, or n=1 with no control.
- **"Inferred"** marks my reasoning, not something a source says.

## The short version (5 findings that matter most)

1. **pi now has the turn-end gate nana never built.** pi v0.87.0 (2026-09-21) made `turn_end` and a new `agent_before_settle` event *actionable*: an extension can add entries and return `continue: true` to force one more model turn. That is the pi version of Claude Code's blocking Stop hook and `/goal`. nana-pack has no turn-end check today; the post-edit checks run per tool call and only give feedback. This is the cheapest way to put the dormant runner's "doneWhen + cost cap" into attended pi work without bringing the runner back. (PRIMARY)
2. **Frontier-lab guidance now says to keep context, not compact it early.** Anthropic's Opus 5.5 post (2026-09-24): context per request grew 2.6× from March to September, cache reads are most of the bill, and cache-read price fell 60%. Its advice: pick the model at the start and "compact before you step away rather than after." A measured practitioner eval found that with caching, keeping full history beat every summarization strategy on cost, latency and recall. Two arXiv papers put numbers on the hidden cost of compaction. nana's Claude Code hook `context-size-check.sh` still tells the agent to `/compact` at a 5 MB transcript. (PRIMARY + SECONDARY)
3. **Cross-model review has a direction, and the study's harmful direction is nana's setup.** A July 2026 controlled study: when the reviewer *rewrote* code, GPT reviewing Claude's code regressed more tasks than it fixed (fixed 3, broke 13). Claude reviewing GPT's code helped (fixed 26, broke 5). Reviews that helped made surgical edits; reviews that hurt rewrote. nana's ladder is sol/astra (GPT) reviewing Opus/Fable (Claude) work. That stays sound *only because* nana's reviewers report findings and the seat adjudicates them (DOCTRINE:L82, L258). Never let the reviewer rewrite. (PRIMARY, but a narrow benchmark)
4. **More context files and more spec detail cut cost; they do not raise correctness.** A two-agent ablation (Claude Code + Codex, 288 runs) found no correctness effect from AGENTS.md, always-on or on-demand, to within ±10–15 points. Near-misses failed on implementation skill, not missing repo knowledge. A 2,700-run spec study found a full spec costs 30% less than a bare user story, with no change in solve rate. Treat instruction files and briefs as **cost** levers. Consistency and quality have to come from verification. (PRIMARY)
5. **The measurable form of "not more consistent" is pass^k, not the mean.** IBM (2026-09-08): an agent at 77% mean pass rate passed all five repeats only 53% of the time, a 24-point "consistency gap". Tool-interface structure changed run-to-run consistency by up to 4.7× (2608.11386). Semantically equal prompt rewordings moved scores 11–58× more than plain reruns (2608.22331). This gives Jake's diagnosis a number that can be tracked. (PRIMARY)

---

## 1. Harness engineering

### H1 — pi 0.87 actionable turn-end boundaries (`agent_before_settle`, `turn_end` → `continue: true`)
- **Claim:** pi v0.87.0 made `turn_end` and a new `agent_before_settle` "actionable boundaries". Handlers can chain `custom`, `custom_message`, `context_edit` or `compaction` entries and "return continue: true for one next model request". `agent_settled` stays notification-only. The docs warn: "Guard continuation conditions because an unconditional continuation can loop." `shouldStopAfterTurn` was removed (replacement: `finishTurn` → `{action:"end"}`).
- **Source:** github.com/earendil-works/pi/releases/tag/v0.87.0 (2026-09-21); `packages/coding-agent/docs/extensions.md` on main. **PRIMARY.**
- **nana today:** nana-pack registers `session_start`, `before_agent_start`, `session_before_compact`, `session_compact(_failed)`, `session_shutdown`, `tool_call` (gate), `tool_result` (post-edit), `agent_settled` (notify). It has **no turn-end or settle gate** (grep of `packages/*/extensions`). Post-edit checks tell the agent about failures but cannot stop it from declaring done. On the Claude Code side, `nana-setup/lib/settings.mjs` wires only SessionStart + UserPromptSubmit hooks, with **no Stop hook**. The session archive (`docs/sessions/2026-09.md`, 09-16 entry) records that the doneWhen + cost cap "was dropped when the runner went dormant while autonomy stayed".
- **What would change:** add a `nana-settle` extension on `agent_before_settle`. If the post-edit receipts for files touched this session include a red check, or a declared acceptance command has not run green since the last edit, append a `custom_message` naming the failing check and `continue: true`. Hard cap: N continuations per prompt. This is also where the deferred "Tier-2 test-ran gate" (HANDOFF "Open for Jake" item 5) would live. Mirror it on Claude Code with a Stop hook (exit 2 blocks the stop).
- **Adoption cost:** M (new extension + receipt reader + loop guard + tests; pi ≥0.87 needed; the installed pi was 0.84.4 as of 09-16, per the session archive; current version unverified).
- **Cheapest falsifying test:** replay 10 recent desk sessions that ended with a red post-edit receipt still standing. Count how many ended "done" with it red. If ≈0, the gate buys nothing; skip it.
- **DOCTRINE:** consistent with L218 (hooks fail open on their own breakage: the settle gate must fail open if receipts are unreadable) and L214 (verify the act: key on the receipt, not a marker).

### H2 — Claude Code `/goal`: completion judged by a separate evaluator (not new since 08-01, but unused by nana)
- **Claim:** `/goal <condition>` wraps a session-scoped prompt-based Stop hook. After each turn, a small fast model (Haiku by default) reads the condition plus the transcript and returns *not yet met* / *met* / *impossible*. "Completion is decided by a fresh model rather than the one doing the work." It works headless: `claude -p "/goal …"`. **Limitation:** "It doesn't run commands or read files independently", so it judges only what the agent put in the transcript. Condition ≤4,000 chars; add "or stop after N turns" to bound it.
- **Source:** code.claude.com/docs/en/goal (check-ins require ≥2.1.234; launched ~May 2026 per VentureBeat 2026-05-14). **PRIMARY.**
- **nana today:** headless Opus workers (`feedback_opus_workers_sol_reviewers`, `reference_claude_cli_headless_isolation`) get a brief and run to their own sense of done. The seat then verifies. No grep hit for `/goal` in either repo.
- **What would change:** end every worker brief's acceptance section with a `/goal` line (the acceptance command + "or stop after 30 turns"). The worker cannot stop until the transcript shows the check green. That covers "evaluator is not the author" for free. It does **not** replace seat verification, because the evaluator can be fooled by transcript text (inferred from the doc's own limitation).
- **Cost:** S (brief template change).
- **Cheapest test:** next 4 worker lanes, 2 with `/goal` and 2 without. Count the seat's "worker said done, check was red" catches per lane.
- **DOCTRINE:** consistent with L42 (doneWhen must run the exact check). Tension with L73: the evaluator is same-lineage, so it is a floor, not independent review.

### H3 — Structured-disagreement review; freeze the artifact during review (Adversarial Review, 2608.18167)
- **Claim:** reviewer + critic subagents review a frozen artifact. Disagreement must be typed as AGREE / DISAGREE_EVIDENCE / DISAGREE_CONCERN and cite code. Edits happen only after the review settles. The paper names "false consensus" (agreement without evidence) and fixes it with explicit, evidence-grounded verdicts. Results: LiveCodeBench 87% vs 82% for a 5-agent system; SWE-bench Verified 75.2% vs 71.6% zero-shot. The naive version underperformed on SWE-PRBench until constrained.
- **Source:** arxiv.org/abs/2608.18167 (2026-08-16). **PRIMARY** (preprint; prompts "released upon acceptance", no code yet).
- **nana today:** `pi-review` returns BLOCK/LAND with severities. The seat adjudicates (e.g. `docs/reviews/nana-project-2026-09-18/`). The 09-16 audit found the **dominant overspend is review rounds** (100+ in September, made to feel free by the flat Codex subscription).
- **What would change:** require every pi-review finding to carry an evidence class: **executed** (a command/test output reproduces it), **cited** (a file:line shows it), or **concern** (reasoning only). Only executed/cited findings can BLOCK. Concerns go to the Known-limits line. This cuts the rounds spent on unevidenced BLOCKs. It matches DOCTRINE:L82 ("verified empirically before it is honored") and L258 ("a claim to adjudicate, not an order").
- **Cost:** S (review brief template + adjudication column).
- **Cheapest test:** re-grade the 16 rounds in `docs/reviews/desk-hardening-2026-09-09/` plus the three 09-16/09-18 corpora by this rubric. If ≥30% of BLOCK-driving findings were "concern" and were later refuted or turned out to be doc-only, adopt it. If <10%, drop it.
- **DOCTRINE:** consistent (L82, L258, L263).

### H4 — Cross-model review is asymmetric; rewriting reviewers regress (2607.21656)
- **Claim:** on 116 post-2025 LiveCodeBench problems with static review, Claude Opus 4.7 and GPT-5.5 as author/reviewer in 6 arms: Claude reviewing GPT's code fixed 26 and regressed 5; GPT reviewing Claude's code fixed 3 and regressed 13; Claude self-review was flat; "Claude solo remained Pareto-optimal". "Helpful reviews tend to edit (surgical fixes), harmful reviews tend to rewrite."
- **Source:** arxiv.org/abs/2607.21656 (July 2026, code released per the paper). **PRIMARY**, narrow: competitive programming, no execution, reviewer applies its own fix.
- **nana today:** GPT reviewers (sol/astra) on Claude-authored work is DOCTRINE's most-used line (L100, uses:29), backed by 16 recorded catches. Reviewers do not edit; the seat or an Opus fold-worker applies fixes.
- **What would change:** make the existing practice an explicit rule: **a different-lineage reviewer never writes the fix; it reports, the author folds.** Add a "fold regressed something" tally to adjudication files. This does not overturn L100. It explains *why* nana's version works where the paper's regressed (inferred).
- **Cost:** S.
- **Cheapest test:** across the September corpora, count folds whose next round found a regression the fold introduced (DOCTRINE:L79 and L101 already record two). If fold-regressions came mostly from reviewer-*prescribed* fixes rather than author-designed ones (the 09-16 entry has one: sol's grandchild-process test proved nothing), add "reviewer states the defect, never the patch" to the brief.
- **DOCTRINE:** does not contradict L73/L100. It sharpens them.

### H5 — Round cap: returns fall after round 2 in repair loops (weak, mostly pre-window)
- **Claim:** iterative self-repair across model scales: the first round gives the largest gain, the second is still meaningful, and rounds 3→4 add minimal gain (arXiv 2604.10508, April, **outside the window**, seen via search snippet only → *unverified detail*).
- **nana today:** 3-round cap in `packages/nana-pack/bin/review-round.mjs`, with `--over-cap` required for r4+. But DOCTRINE:L242 records design docs converging over 6 rounds (44→13→11→7→2→0).
- **What would change:** nothing structural. The external evidence neither overturns the cap nor supports going above 3. One refinement (inferred): make r3 "verify prior folds only", with no new-scope findings accepted. That is what L242 says later rounds were actually doing.
- **Cost:** S. **Test:** in September corpora, what fraction of r3 findings were new-scope vs fold-verification? **DOCTRINE:** tension with L242 (multi-round convergence on design docs). The cap already allows `--over-cap` for that case.

### H6 — Lead/sidekick model split validated at scale (Cognition Fusion)
- **Claim:** frontier "lead" (Fable 5.1 or GPT-6 Astra) plans, briefs with success criteria, and "always reviews the work… can take control back". A cheap "sidekick" (SWE-2) explores, implements and tests. On the Artificial Analysis Coding Agent Index v1.5: Fable+SWE-2 scored 61.7 vs Claude Code Fable alone 62.2, at $7.90 vs $12.36 (−36%). Astra+SWE-2 scored 58.9 vs 61.6 at −39%.
- **Source:** cognition.com/blog/local-fusion (2026-09-11). **SECONDARY** (vendor post, third-party index numbers; I did not open AA's page).
- **nana today:** "seat instructs, Opus works" (`feedback_seat_instructs_opus_works`), Opus 5.5 workers, Fable/Opus seat.
- **What would change:** nothing structural; this is external support for the split nana already runs. One gap it points at: Fusion's lead "takes control back". nana's doctrine says seat salvage is authoring and must be re-reviewed (L79, L101, L107). Keep that; Fusion reports no quality data on lead takeovers.
- **Cost:** 0. **Test:** none needed. **DOCTRINE:** consistent.

### H7 — Advisor tool: worker consults a stronger model mid-task (not new; newly relevant with Opus 5.5)
- **Claim:** a server-side advisor tool. The main model decides when to call a stronger advisor, "before committing to an approach, when an error keeps recurring, and before declaring a task complete". The advisor sees the full transcript. Opus 5.5 main accepts a Fable or Opus ≥5 advisor. Toggling it does not break the main cache. Works in `-p` (≥2.1.260) via `--advisor`. There is no setting to force or cap calls.
- **Source:** code.claude.com/docs/en/advisor; platform docs advisor tool (launched 2026-04-09). **PRIMARY.** Vendor benchmark (Haiku+Opus advisor 19.7%→41.2%) is **MARKETING-grade** for nana's use.
- **nana today:** not used (no grep hit). Headless Opus workers escalate only by ending the turn.
- **What would change:** try `claude -p --advisor fable` on the hardest worker lane type (gate/security code). It is a mid-task second opinion, same lineage, so **not** a substitute for sol/astra review (L73).
- **Cost:** S to try; Fable spend bills to usage credits on some plans (doc). DOCTRINE:L256 already warns that Fable spent on confirms is Fable unavailable for land reviews.
- **Cheapest test:** 2 paired gate-code lanes with and without the advisor. Compare sol r1 BLOCK counts and total tokens.

### H8 — Permission layers moved to classifier review (FYI, low priority for nana)
- Claude Code 2.1.278 (2026-09-19): auto mode defaults to a **server-side classifier** at no charge, and read-only/sandboxed shell commands now wait for server review. Codex "auto-review" routes approvals to a guardian subagent. Managed Agents got an `auto` permission policy (2026-09-10). **PRIMARY.**
- **nana:** the gate is advisory by design (`AGENTS.md` rule). Real enforcement lives at the sandbox. Nothing to change. Record it so nobody re-derives "should the gate call a model": the vendors now own that layer.

### H9 — Dynamic workflows: small deltas since 09-02
- Workflows were already used by nana (DOCTRINE:L241). New since 08-01 per docs: default size guideline `medium` (<10 agents), runs pause at usage limits (≥2.1.271, interactive only, not `-p`), `/workflow-authoring` skill, 16-concurrent cap. **PRIMARY.** One nana-relevant option (inferred): the hand-run dual-review choreography recurs in FRICTIONS (09-16 entry). A saved workflow could run pi-review via Bash agents and fold via an Opus agent. **Cost M; do only if the choreography recurs again.**

---

## 2. Context engineering

### C1 — Keep context under caching; compact at task boundaries, not by size
- **Claims:**
  - Anthropic, from Claude Code usage March→September 2026: 3.3× longer work per prompt, 2.6× more context per request, input:output from 189:1 to 324:1. Opus 5.5 cut input/output price 20% and **cache reads 60%**. Harness fixes made cache breaks rarer (effort changes no longer reset cache, forked subagents inherit the parent cache). Guidance: "pick your model at the start of a session rather than switching midway" and "compact before you step away rather than after." — claude.com/blog/claude-opus-5-5-built-for-coding-sessions-that-use-more-context (2026-09-24). **PRIMARY.**
  - Bouchard et al. (Aug 2026), production AI tutor, 660 turns, 11 configs: full history cost $0.11/turn, ~17 s TTFT, 92% memory recall. The production compaction preset cost $0.24, ~21 s, 38% recall. **Capping tool outputs alone cut cost 38% with identical recall.** Break-even: cached input below ~$0.55/Mtok favors keeping everything. Caveats: 11–13-turn sessions, Gemini 3.5 Flash primary. — louisbouchard.ai/context-engineering-2026. **SECONDARY.**
- **nana today:** `packages/nana-setup/claude/hooks/context-size-check.sh` (UserPromptSubmit) warns once at a **5 MB transcript**: "consider /dev-debrief then /compact to preserve quality." Opus 5.5 cache reads are $0.20/Mtok and Fable 5.1's are $0.25/Mtok, well under the $0.55 break-even (inferred applicability; the eval did not test Claude).
- **What would change:** reword the hook to "compact at a task boundary or before stepping away; not mid-task". Or raise the threshold to a token-based % of the 1M window. Add a tool-output cap (see C4) before any compaction policy.
- **Cost:** S.
- **Cheapest test:** for 1 week, log per-session cache-read vs uncached input from `/cost` or pi usage around each compaction. If post-compaction turns re-read files the summary dropped (C2's retrieval surge), the hook was costing money.
- **DOCTRINE:** no line on compaction policy. The 09-02 file's "context rot is real" still stands. Keeping context and context rot are in tension; the eval's recall numbers say rot did not dominate at 11–13 turns (inferred; unknown at 100+ turns).

### C2 — Compaction has hidden costs: re-acquisition and rule loss
- **Claims:**
  - 2608.16370 (Liu, 2026-08-17): at 5× compression, task completion did not change significantly. Retrieval calls rose in all 6 model-regime comparisons (5 significant after correction). GPT-5.5: 21.0→63.9 retrieval calls (p=.002). There was no surge on ALFWorld, so the effect depends on the environment. **PRIMARY.**
  - 2608.22752 "Compaction Cliff" (Zerhoudi et al., 2026-08-24): Claude Code's `/compact` on Sonnet 4.6 kept **53% of safety rules after one round, 10% after five**. A typed compactor (TypeCompact) kept 2–4× more (96% recall over 5 rounds). Released a 396,934-config corpus + reference implementation. **PRIMARY** (tested Sonnet 4.6, not Opus 5.5 or pi's compactor).
- **nana today:** `nana-handoff.ts` writes pi's **compaction summary** to `.pi/handoff.md` on `session_compact` and re-injects it into the next fresh session. So the handoff inherits whatever the compactor dropped. Rules in AGENTS.md survive because pi rebuilds the system prompt every turn (documented in the 09-16 entry). Knowledge-pull pointers are user-role messages, and the pull README already lists "compaction may summarize it".
- **What would change:** (a) never let a rule live only in handoff or session text: rules belong in AGENTS.md or the shared memory, which reload every turn (already mostly true; make it explicit in the handoff README). (b) Give the handoff a fixed typed skeleton (Decisions / Constraints / Open / Verified facts) instead of the raw summary. pi 0.86 added per-model compaction budgets and 0.87 added `context_edit` entries, so a pack extension can pin such a block (inferred from release notes; API not exercised).
- **Cost:** S for (a), M for (b).
- **Cheapest test:** take 5 real `.pi/handoff.md` files and the sessions they came from. Count constraints stated in-session vs present in the handoff. If recall is ≥90%, skip (b).
- **DOCTRINE:** consistent with L204 (a lesson not in a ledger dies).

### C3 — Context files and spec detail: cost levers, not correctness levers
- **Claims:**
  - 2607.27250 (Khatri, 2026-07-28; code + 288-run dataset released): Claude Code (Sonnet 4.6) and Codex (GPT-5.5) on real merged-PR tasks from 3 repos, with no file / always-on AGENTS.md / on-demand wiki. Correctness: no effect detected (p=1.00 and 0.66), equivalence bounds ≤10pp (Claude) and ≤15pp (Codex). On-demand files cut Claude's cache-creation tokens (p=.012) and blind full-suite test runs where the file warned about test cost. "The real AGENTS.md files never converted a near-miss to a pass in a 36-cell manipulation probe"; near-misses failed on implementation skill. **PRIMARY** (small: 32 tasks, independent researcher). Replicates the known Gloaguen/ETH direction; that is not new, but the equivalence bound is.
  - 2608.25399 (Smékal, Stanford, 2026-08-26): 2,700 runs (Kimi K3, 5 SWE-bench Verified tasks, 12 spec variants from a GitHub Spec Kit template, 3 efforts, 15 repeats). Bare user story vs full spec: **+29.7% cost, +16.4% turns**. Dropping acceptance scenarios: +11.6% cost. **"No credible effect on solve rate."** Run-to-run cost spread: geometric SD ×1.34 regardless of spec. **PRIMARY** (one model, 5 tasks).
- **nana today:** `nana-pi/AGENTS.md` is 145 lines, and its "Working under nana-pi" section is emitted into every scaffolded or adopted project via `templates/_shared/working-under-nana-pi.md`. Worker briefs carry acceptance criteria. DOCTRINE:L30 (lean specs beat design-prescribing specs) is pinned.
- **What would change:** (a) keep acceptance scenarios in every brief: they are the cheapest cost cut (and the /goal hook of H2 needs them). (b) Budget worker spend with ~×1.8 headroom over the median (inferred from GSD ×1.34 at roughly 2σ). (c) The descriptive "Working under nana-pi" section (what the pack does) is reference material that does not change behavior. Move it to an on-demand doc pointed to from one line (candidate; test first).
- **Cost:** S.
- **Cheapest test:** `apps/bench`, 2 arms (full vs one-line AGENTS.md) × existing tasks × 3 reps, cost-only verdict. The ceiling effect is fine here because the claim being tested *is* cost (DOCTRINE:L13).
- **DOCTRINE:** consistent with L30 and L182 (steering buys gate-completion, not quality).

### C4 — Tool-result pruning and dynamic tool loading are where harness token savings come from now
- **Claim:** Cursor (2026-09-23) cut token cost 7% at no quality loss (production A/B): system prompt −66% (define tool behavior instead of "DO NOT" lists); tools used in <20% of conversations load on demand (−60% static description tokens); explicit cache breakpoints (−20% cold misses); line numbers only every 10th line in file reads (−1.6% cache-read tokens); subagent encouragement removed. **SECONDARY** (vendor, but mechanism-level and A/B-measured). Bouchard's tool-output cap: −38% cost, same recall (C1). pi v0.87 `context_edit` gives append-only context edits "without rewriting history". Claude API compaction-on-demand beta (2026-09-14) returns a signed compaction block and can keep recent turns verbatim. **PRIMARY.**
- **nana today:** there is no tool-output cap in nana-pack. The bench found pi defaults cheapest and that tool schemas tax every turn (`pi-web-access` up to 5.55×). That is the same lesson as Cursor's dynamic loading.
- **What would change:** a nana-pack `tool_result` handler that truncates bash/read outputs over N KB to head+tail plus a "full output at <path>" pointer (Claude Code already saves large MCP outputs to files, per 2.1.283).
- **Cost:** M.
- **Cheapest test:** bench, cap vs no cap, cost-only. Kill it if saving is <10%.
- **DOCTRINE:** none.

### C5 — Prompt-time memory: the failure is "retrieved-but-unused"; the fix is precision gating
- **Claim:** 2609.05510 (Helwig, Aug 2026): 8 months, a 633k-LOC codebase, one developer + Claude Code, BM25+vector memory with prompt-time injection. It names **"retrieved-but-unused"**: design docs were injected every session and the agent still re-proposed existing subsystems. Mitigations: precision-gated injection (intent detection + IDF gate + per-session damping; 68 prompts → 3 injections, all relevant, 0 false fires on 54 non-intent turns), DO-NOT-REBUILD warnings, a "running code > recent derivations > documents" ground-truth order, a session-start health gate. **ANECDOTE-grade** (author states n=1, no control arm; pre-registered ablation not yet run). Repo `mike-m6online/SIx_Harness`: 1 star, 0 watchers, 7 commits. Not astroturf-shaped, just unadopted.
- **nana today:** `packages/nana-knowledge` pulls top-3 BM25 pointers on **every** non-short, non-slash prompt (`hook` CLI; `pull.log`). HANDOFF Next item 3: run a week of `pull.log`, then decide the citation checker. The 09-16 audit: 72 research articles with zero reads.
- **What would change:** this is external confirmation of nana's own diagnosis. (a) Make the citation checker measure **use** (the agent Read the pointed file, or cited it), not pulls; that is DOCTRINE:L214's "verify the act". (b) If use-rate is low, add an intent gate (fire only on prompts that propose building, deciding or choosing) before adding more corpus. (c) DOCTRINE + FRICTIONS already are an anti-recurrence store. Consider a "DO-NOT-REBUILD" line type for landed subsystems (inferred).
- **Cost:** M for the checker (already planned), S for the gate.
- **Cheapest test:** from one week of `pull.log` joined with session transcripts, compute P(read of a pointed file within 3 turns | pull). Compare it with P(read | same file, no pull) as the baseline.
- **DOCTRINE:** consistent (L214).

### C6 — Memory consolidation strips authority; agent-written memory is an attack and drift surface
- **Claims:**
  - 2608.01679 (2026-08-03): when histories consolidate into memory, source constraints get stripped ("authority collapse") in 48 of 49 configurations. Collapsed memories drove a 50.3% mean unauthorized-action rate. Persisting authority labels cut 16.9% → 0.0% with benign success unchanged. **PRIMARY** (no code noted).
  - 2607.14611 "Bad Memory" (UW, July 2026): it is hard to get an agent to write untrusted content into its own CLAUDE.md/AGENTS.md. But a payload already there steers behavior (0–100% by model and goal) and persists across sessions in 50–97% of trials. **PRIMARY.**
- **nana today:** knowledge pointers are framed as untrusted data (good). `.pi/handoff.md` is an **agent-written summary re-injected as background state** into the next session. Two-tier memory: agents write project memory and shared rules through auto-memory.
- **What would change:** label the re-injected handoff with provenance ("agent-written compaction summary, unverified; OBJECTIVE.md, AGENTS.md and DOCTRINE outrank it"). Keep shared rules human-ratified (`feedback_*` files are Jake's rulings; keep agents from minting new shared rule files without a Jake line, which is inferred to be the current practice).
- **Cost:** S.
- **Cheapest test:** grep the last 20 handoff files for imperative sentences ("always", "never", "must") that do not appear in AGENTS.md, OBJECTIVE or memory. Each one is an agent-minted rule with no authority.
- **DOCTRINE:** consistent with L159 (agent-visible surfaces).

### C7 — Skills / progressive disclosure: modest, and one flat level only
- **Claims:** "Is Progressive Disclosure All You Need" (2607.17598, July 2026): across Codex, pi and Claude Code harnesses, a **flat** skill (one description + on-demand chunks) matched or beat raw navigation. Hierarchical disclosure "uniformly underperforms flat". Gains appear only when native navigation fails at scale (≥10 books). Codex got nothing (native grep). "Progressive disclosure buys context, not intelligence." **PRIMARY.** 138k-SKILL.md study (2608.08453): 89.3% violate the spec; routing-metadata defects cut retrieval from 88.5% to 82.6%; 3 lint rules catch 71.9% of issues. **PRIMARY.**
- **nana today:** pack skills (scaffold-*, adopt-*, adopt-structure, dev workflow). The desk auto-detects skills.
- **What would change:** lint pack skill descriptions against the spec (name, description, trigger). Low payoff.
- **Cost:** S. **Test:** run the paper's 3 rules on `packages/nana-pack/skills/*/SKILL.md`; fix if any fail. **DOCTRINE:** none.

### C8 — Codex/Astra "notes across context windows" instead of single-summary compaction (unverified effect)
- GPT-6 Astra (2026-09-03/04): Codex experimental mode where the model "can keep notes across context windows" and can search prior messages and tool outputs even when the notes missed them. Per 9to5Mac, default "in the coming weeks". **SECONDARY** (the openai.com page returned 403; no numbers). The Codex platform post claims retained reasoning + compaction took GPT-5.6 Sol on ARC-AGI-3 from 13.3% to 38.3% with 6× fewer output tokens: **PRIMARY vendor claim, not coding.**
- **nana:** sol/astra reviews run through pi's openai-codex provider, not Codex CLI, so nothing changes unless reviews move to Codex CLI. Watch only.

---

## 3. Agentic engineering practice (autonomy vs consistency)

### P1 — Measure consistency (pass^k), not autonomy or mean pass rate
- **Claims:** IBM "Closing the Consistency Gap" (2609.08832, 2026-09-08): GPT-4.1 ReAct on AppWorld had 77% mean pass but **53% pass^5**. A consistency analyzer resamples decision points; flip-prone decisions become NL guidelines injected in later runs. Result: pass^5 +16pp same-task, +13pp similar-task, mean +3.6pp. Code: `AgentToolkit/altk-evolve` (117★, 59 open issues, 258 commits, IBM org; organic by the heuristic; license CC BY-NC-ND per the paper vs Apache-2.0 per the repo page, which is a discrepancy). **PRIMARY.** Tool architecture: structured low-level interfaces improved cross-attempt consistency up to 4.7×; CodeAct-style used 41.6% fewer steps (2608.11386, 11,700 trajectories, 2026-08-11). **PRIMARY.** Prompt paraphrase variance is 11–58× rerun variance (2608.22331). **PRIMARY.**
- **nana today:** `apps/bench` runs reps (132 runs, 3 reps) but reported correctness as a mean and hit a ceiling. Worker lanes run once. Jake's 09-16 complaint is literally a pass^k complaint: the same kind of task goes well one day and badly the next.
- **What would change:** (a) add pass^k (all-k-green) and cost dispersion to the bench verdict schema. (b) Once a month, run one real past brief ×3 fresh workers as a "consistency probe" and record pass^3 and cost spread. That is a program-level number for "more consistent", which today has none. (c) The IBM mechanism (flip-prone decisions → a written guideline) is roughly what DOCTRINE does by hand. Where the probe shows a flip, write the doctrine line (inferred mapping).
- **Cost:** M (bench schema + one probe per month ≈ 3 worker runs).
- **Cheapest test:** one probe on a recent landed brief (e.g. 09-18 nana-project). If 3/3 land clean at similar cost, consistency is not the problem at worker level. That would point at seat/priority level, which the 09-16 audit already suspected: 20/39 sessions opened with a new direction.
- **DOCTRINE:** consistent with L13 (ceiling effect → pick tasks the baseline fails; pass^k is one way out of a ceiling).

### P2 — External cost governors beat agent self-budgeting (partly pre-window)
- **Claims:** BAGEN (2606.00198, May 2026, **pre-window**): across 20 model-environment pairs, all models are "systematically optimistic" about remaining budget. They still predict >70% feasibility after using 60% of the budget. External early-stop policies saved 28–64% of tokens on failed runs for a 1.6–4.2% success cost. **PRIMARY.** Spec study (C3): cost GSD ×1.34 per run is irreducible by prompt.
- **nana today:** the governed runner's `maxCostUsd` ("the real governor", HANDOFF Decisions) went dormant with the runner. Attended pi and headless Opus work records spend after the fact ("~300k tokens") with no cap. The 09-16 audit lists overspend as a top complaint.
- **What would change:** give every headless worker a hard cap. The Agent SDK exposes a max-budget option (DOCTRINE:L223 cites `error_max_budget_usd`, so the SDK path exists). Whether `claude -p --max-budget-usd` exists in CLI 2.1.283 is **unverified; check `claude --help`**. On pi, the H1 settle extension can read session usage and refuse `continue` past a cap.
- **Cost:** S (Claude) / M (pi).
- **Cheapest test:** set caps at 1.8× the median of the last 10 lanes' spend. Count how many lanes hit the cap and whether those were the ones the seat later judged wasted.
- **DOCTRINE:** revives HANDOFF's "maxCostUsd is the real governor" for the attended path. No contradiction.

### P3 — Verification capacity becomes the bottleneck as agent volume grows
- **Claim:** Anthropic (2026-09-14): CI jobs 25× in 6 months, tests 10×, 80% of code Claude-authored. They rebuilt test-impact analysis (a deterministic test selector) and advise planning for 25× load in two quarters. **PRIMARY** (infra post; no selector precision numbers given).
- **nana:** at nana's scale, the analogue is the desk's fixed-port e2e suite, which cannot run across worktrees at once (AGENTS.md working pattern; 09-09 FRICTIONS). As lanes parallelize, the suite serializes them (inferred). **Change:** only if parallel lanes become normal: port allocation per worktree. **Cost M. Test:** count lane-hours waiting on sequential suites next month.

### P4 — What did NOT turn up
- No new primary evidence since 08-01 on per-repo OBJECTIVE/HANDOFF files as such, on two-tier memory, or on "start sessions in the product repo". Adjacent evidence only: C5, C6, C3.

---

## 4. Model-level changes that change the harness

| Change | Source (PRIMARY unless noted) | Harness consequence for nana |
|---|---|---|
| Opus 5.5 (`claude-opus-5-5`, 2026-09-22): 1M default, $4/$20, cache read $0.20, thinking **cannot be disabled** (400) | platform release notes; CC 2.1.280 | Cheaper per token than Opus 5 ($5/$25). Any worker script passing `thinking: disabled` breaks. Fits C1: keep context |
| Fable 5.1 (2026-09-01): cache reads $0.25; thinking blocks replay only to same/newer model | release notes | Mid-session model switches lose prior thinking and break cache. The seat should not hop models mid-task (Anthropic's advice too) |
| Per-message effort (beta, 2026-09-03): `role:"system"` message with `output_config.effort` changes effort **without breaking cache** | release notes | Lets a harness lower effort for routine turns. Claude Code 2.1.280: Opus 4.7/4.8 and Fable 5 no longer hold the launch-default effort over `/effort` in `-p`/SDK/`--settings` → **set effort explicitly in worker launches** (inferred need) |
| Compaction on demand (beta `compact-2026-09-04`, 2026-09-14): signed summary block, background, keep recent turns verbatim | release notes | Direct-API tools could own compaction timing. pi has its own compactor, so not needed today |
| Mid-conversation tool definitions (beta, 2026-09-22) | release notes | Enables Cursor-style dynamic tool loading (C4) without cache breaks |
| Claude Code 2.1.277/278: reads **AGENTS.md when no CLAUDE.md exists** | CC changelog | `nana-setup project` writes a stub AGENTS.md + a CLAUDE.md alias. The alias can go for new projects (check the 2.1.283 behavior with a symlinked CLAUDE.md first) |
| Claude Code 2.1.281: `-p`/SDK first turn no longer waits on per-directory CLAUDE.md lookup; 2.1.280: `-p` no longer hangs silently after internal error (exit 1) | CC changelog | Headless workers: a hung `-p` now exits 1. Update the worker-watch assumption in `reference_claude_cli_headless_isolation` |
| GPT-6 Astra (2026-09-03): $10/$50, cached $1, 2.5× Sol; notes-across-windows (C8) | secondary (9to5Mac; llm-stats) | Astra as contract reviewer costs 2.5× Sol per token. Keep it on whole-unit/contract reviews only (matches AGENTS.md ladder) |
| pi v0.86 (09-19): cache warming during tool runs/idle; per-model compaction budgets; `TranscriptContext` breaking change. v0.87 (09-21): see H1; `SessionManager` canonical | pi releases | Upgrading pi past 0.84.4 is a breaking-change review for nana-pack/desk (`turn_end` emit change, `ContextEditEntry` in the SessionEntry union: the desk parses session entries via pi's public parser). **Upgrade lane required before H1** |

---

## 5. nana's open questions, answered from the evidence

- **Dormant governed-loop runner vs driving pi directly.** The external direction is session-level loop primitives: Claude Code `/goal`, Stop hooks, pi 0.87 actionable settle, workflows. None of these needs a separate runner. They put the runner's two load-bearing parts (a doneWhen checked by someone other than the author, and a cost cap) into the session. **Recommendation:** keep the runner dormant. Port those two parts as H1/H2 + P2. Retire the runner only after they run a month (inferred; no external source compares the two).
- **3-round review cap.** No external evidence argues for more rounds. Weak evidence favors ≤2 repair rounds (H5). The strongest lever on round count is evidence-typing findings (H3), not the cap number.
- **Prompt-time knowledge pull.** External practice (C5) says precision gating plus measuring *use* is the path. nana's planned citation checker is the right next instrument. Do not add corpus first.
- **Per-repo OBJECTIVE/HANDOFF.** No new external evidence. C6 argues for labeling agent-written handoff content as lower authority than human-ratified OBJECTIVE/AGENTS.
- **Two-tier memory.** C6: the risk is agent-minted rules gaining authority. Keep the shared tier human-ruled.
- **Seat briefs, Opus works.** Supported by H6 (Fusion −36% cost at ≈ −0.5 index points). The brief's acceptance scenarios are the cost lever (C3), and a `/goal` line adds completion discipline (H2).
- **Independent different-model review.** Supported, with the H4 condition: the reviewer reports and never patches.

---

## (a) Top 10 changes, ranked by (expected payoff × confidence) / cost

| # | Change | Payoff | Conf. | Cost | Cheapest falsifier |
|---|---|---|---|---|---|
| 1 | **Evidence-typed review findings** (executed/cited/concern; only the first two BLOCK) (H3) | High (the audit's #1 overspend) | Med | S | Re-grade Sept corpora. <10% "concern" BLOCKs → drop |
| 2 | **`/goal` line with acceptance command + turn cap in every headless worker brief** (H2) | Med-High | Med | S | 4 lanes A/B: count "done but red" catches |
| 3 | **Hard cost cap per worker** (SDK/CLI budget flag; pi via settle hook) (P2) | High (overspend) | Med | S/M | Cap at 1.8× median. Did capped lanes match seat-judged waste? |
| 4 | **Reword/retire the 5 MB "consider /compact" hook**; compact at task boundaries (C1) | Med | Med-High | S | 1 week of cache-read vs re-read logs around compactions |
| 5 | **Citation checker measures use, not pulls; intent-gate if use is low** (C5) | High (Jake's "research unused") | Med | M | P(read pointed file ≤3 turns \| pull) vs no-pull baseline |
| 6 | **Rule: different-lineage reviewer states defects, never patches; tally fold-regressions** (H4) | Med | Med | S | Sept corpora: fold-regressions from reviewer-prescribed fixes |
| 7 | **Monthly consistency probe (one brief ×3) + pass^k in bench verdicts** (P1) | High (the only direct measure of Jake's problem) | Med | M | First probe 3/3 clean → consistency is seat-level, not worker-level |
| 8 | **pi upgrade lane (0.84.4 → 0.87.x), then `nana-settle` turn-end gate** (H1, §4) | High | Med | M | Replay sessions: how many ended "done" with a red receipt? ≈0 → skip gate |
| 9 | **Provenance label on re-injected `.pi/handoff.md`; typed handoff skeleton** (C2, C6) | Med | Med | S/M | 5 handoffs: constraint recall vs session. ≥90% → skip skeleton |
| 10 | **Tool-output cap in nana-pack** (C4) | Med | Med | M | Bench cost-only: <10% saving → drop |

Not ranked (watch or FYI): advisor tool trial (H7), workflow for dual-review choreography (H9), skill-description lint (C7), Astra notes mode (C8), CI/port capacity (P3).

## (b) Refuted / unverified ledger

- ? **"Iterative repair: 2 rounds capture the bulk of the benefit"** (2604.10508): from a search snippet only, April (pre-window). Unverified detail; don't cite numbers.
- ? **"+4.1% (17/410) from progressive disclosure on SkillsBench"**: search snippet; it is unclear whether it comes from SkillJuror (2606.11543) or SkillSmith (2605.15215). Unverified attribution.
- ? **"Curated skills +16.2pp, self-generated skills 0"** (SkillsBench): seen only as a citation inside 2608.08453. Not read at source.
- ? **`claude -p --max-budget-usd` exists in CLI 2.1.283**: unverified. The SDK budget option is evidenced only indirectly (DOCTRINE:L223 `error_max_budget_usd`).
- ? **Installed pi version today**: last recorded 0.84.4 (09-16 archive). Current version unverified (the shell call needed approval).
- ? **Cursor Projects "users merge 6× as many PRs"**: MARKETING (selection effect: heavy users adopt Projects). Do not cite.
- ? **Managed-agent memory "Rakuten −97% first-pass errors"**: MARKETING, April (pre-window). Do not cite.
- ? **Codex Astra notes-mode benefit**: no numbers published. Unverified.
- ? **"Codex→Claude" arm labels in 2607.21656**: the fetch summary used the labels inconsistently. The fixed/regressed counts (26/5 Claude-reviews-GPT; 3/13 GPT-reviews-Claude) are consistent with each other, but read Table 2 before quoting the pass-rate numbers.
- ? **altk-evolve license**: paper page says CC BY-NC-ND, repo page says Apache-2.0. Unresolved.
- ✗ **"Anthropic's engineering blog published new harness posts in Aug–Sep 2026"**: not found. The engineering index shows nothing after April. The September material is on claude.com/blog (CI post, Opus 5.5 post). Don't cite a nonexistent engineering post.
- ✗ **"Context files / AGENTS.md improve correctness"**: not supported (C3, now with an equivalence bound). Keep the 09-02 caveat.
- ✗ **"More spec detail raises solve rate"**: not supported in the one controlled study (C3). It lowers cost.
- Caution: **"Compaction preserves 53%→10% of safety rules"** is Claude Code `/compact` on **Sonnet 4.6**, not Opus 5.5 or pi's compactor. Don't generalize it to nana's stack without the C2 test.
- Caution: **Bouchard "keep full history" result** covers 11–13-turn sessions on Gemini Flash. Long nana seat sessions are far longer. Directional only.

VERDICT: DONE

Most-likely-wrong (bet against these first):
1. That pi 0.87's `agent_before_settle` + `continue: true` is enough to build a reliable turn-end gate in nana-pack without desk/parser breakage (API read from docs, not exercised; upgrade impact unmeasured).
2. That evidence-typing review findings (H3) will cut rounds materially. The 30%/10% thresholds are my guesses, and nana's BLOCKs may already be mostly evidenced.
3. That the 5 MB compaction hook is costing money (C1). The keep-context evidence is short-session and non-Claude; long seat sessions may still rot.
4. The 2607.21656 direction labels (which lineage reviewing which regressed). They came through a summarizer that mixed arm names; the counts may be attached to the wrong direction.
5. That `claude -p` has a usable per-run budget flag for P2. If it doesn't, P2's "S" cost on the Claude side becomes M.
