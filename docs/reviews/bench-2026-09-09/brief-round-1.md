# Review brief — nana-pi apps/bench + study tool-profiles-2026-09-08, astra PRE-REGISTRATION review (before any model spend)

You are gpt-6-astra, architecture reviewer for ~/nana-pi. Jake ruled: adopt web access (profile C) "but with proper measurements, comparing different tools on the same tasks, measuring token usage and runtime and result", and "the measurement tool can be persisted as part of nana-pi and reused for future tooling". An Opus worker built a reusable bench (apps/bench) and a pre-registered first study. Nothing has run except ONE smoke call. Your job: is this experiment worth spending ~2M tokens / 2-3 h on, and will its answer be trustworthy? Be concrete; do not restate the docs.

## Read
- ~/nana-pi/apps/bench/README.md, run.mjs, aggregate.mjs, lib/*.mjs (≈ 875 lines total)
- ~/nana-pi/apps/bench/studies/tool-profiles-2026-09-08/DESIGN.md, study.json, tasks/*.json, FIXTURE.sha256, results.jsonl (the smoke record), raw/ (the smoke stream)
- ~/nana-pi/apps/bench/test/*.test.mjs (197 checks, no model calls)
- Motivation: ~/nana-pi/docs/tools-research-2026-09-08.md; profile C prerequisite: ~/nana-pi/docs/pi-web-access-review-2026-09-08.md
- pi 0.84.4 docs at $(npm root -g)/@earendil-works/pi-coding-agent/docs/ (usage.md, json.md, session-format.md, environment-variables.md, settings.md) for any pi claim you want to check. Worker's key doc findings: `--mode json` (not --json) exits 0 even when the assistant errored → success derived from the stream; usage per assistant message with disjoint in/out/cacheRead/cacheWrite buckets; PI_CODING_AGENT_DIR isolation wired but OFF because a fresh dir lacks auth.json (Codex subscription); PI_OFFLINE=1 on.

## Dimensions
A. Validity of the comparison: are profiles A/B/B′/C the right arms; is anything confounded (e.g. B′'s appended system prompt vs A's built-in "use bash for search" line; --tools not suppressing `parallel`; PI_OFFLINE; cache effects across interleaved runs; the same model seeing the same fixture repeatedly)? Is randomized interleaving actually implemented as described?
B. Tasks + keys: for each of the 14 tasks, is the key correct and unambiguous as PHRASED (re-derive at least the code-family keys yourself with grep on the fixture; the worker flagged c3-callsites "7" as phrasing-dependent); can a model pass by memorization (research family); do the two edit tasks measure what they claim (sha256 guard on the test file — can it be gamed)? Is the fixture representative enough that a result transfers to Jake's real repos?
C. Measurement: token/turn/tool-call extraction from the json stream — correct field, per-call not cumulative, tool-result usage handled; wall time includes process startup (fine if stated); timeouts → what record; retries forbidden (verify no retry path); resume skips completed tuples.
D. Stats + decision rule: N=3 vs 5 — is the pre-declared rule decidable at N=3 given model nondeterminism; is "median tokens ≤ 1.15×A on ≥ 70% of tasks" sensible; what would FALSIFY the research brief's claim; is anything in the rule outcome-forcing?
E. Reusability as a nana-pi component: does the study/profile/task/checker model generalize to future tooling comparisons (different extensions, models, prompts); what is study-specific leaking into the runner; missing checker types; README sufficiency; the 875-line budget overrun (worker says ~190 lines are doc-citation comments) — accept or trim?
F. Ops before spend: durable extension path (currently under /private/tmp), agent-dir isolation trade-off (auth.json), budget anchor from one cheap run (worker suggests `--rep 0` first = 36 runs then re-cost), what to watch during the run, and the one thing most likely to invalidate the result after 3 hours.

## Output
Per dimension: PASS or FINDING (BLOCK = must fix before spend / SHOULD / NIT, file:line, what, minimal fix). Then ≤ 8 lines "should this run, and how" for the maintainer. End with exactly one line: `VERDICT: RUN` or `VERDICT: FIX-FIRST`.
