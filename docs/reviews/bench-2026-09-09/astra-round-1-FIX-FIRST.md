**FIX-FIRST.** The harness is useful, but presently undercounts C’s spend, permits automatic retries, and cannot evaluate its own C decision rule.

Read-only review only; no model calls or file changes. I reviewed the tests rather than executing their filesystem/process-writing cases. The fixture hash matches its pin; all six live-key commands currently succeed.

Paths below are relative to `~/nana-pi`; `STUDY` means `apps/bench/studies/tool-profiles-2026-09-08`, and `EXT` means the `pi-web-access` directory named in `study.json`.

## A. Comparison validity — FINDING

- **BLOCK — `STUDY/DESIGN.md:98`, `STUDY/study.json:55`: C’s “no code-family regression” is unmeasured.** C never runs code tasks. Extra tool descriptions and extension startup can affect code even when web tools are unused. **Fix:** run C on code too, or explicitly restrict adoption to research sessions and remove the unsupported regression condition.

- **SHOULD — `apps/bench/run.mjs:62–71`, `STUDY/DESIGN.md:107–109`: interleaved, not randomized.** Task order is fixed; profile order rotates deterministically. Code gets balanced positions at N=3; each research task gets a 2:1 first-position imbalance. Rotation does not establish symmetric cache effects. **Fix:** persist a seeded, randomized block schedule; describe residual cache effects honestly and report cache buckets separately.

- **SHOULD — `apps/bench/lib/profiles.mjs:80–94`: isolation is incomplete.** Inherited environment and global settings still affect transport, retries, compaction, shell behavior and extension configuration. `agentDirNew` detects new top-level names—not reads, modifications, or writes inside existing directories. **Fix:** use a prepared, pinned agent directory and controlled environment.

**PASS:** A/B/B′ are sensible *configuration-package* comparisons. A’s bash guidance disappearing in B is part of the actual product change, not an accidental confound. B′ isolates the additional hint, although system-prompt placement is not literally an AGENTS.md deployment. Shared `parallel` is acceptable if counted consistently. `PI_OFFLINE=1` disables startup networking, not task web access. Fresh sessions prevent conversational carryover; repeated fixtures create cache/dependence concerns, not demonstrated cross-session learning.

## B. Tasks and keys — FINDING

### Independent key audit

| Task | Finding |
|---|---|
| c1 | Correct: `packages/nana-stage/lib/blocks.mjs:53`. |
| c2 | Correct: `apps/desk/server.mjs:949`. |
| c3 | **Correct as currently phrased:** grep finds eight literal occurrences, including the definition; answer **7**. This is not an ambiguous semantic “callsites” question anymore. |
| c4 | Correct: ten `.e2e.mjs` files. |
| c5 | Correct: exactly the six listed importers, including the multiline import in `blocks.test.mjs`. |
| c6 | Correct: `canonical`, `signBlock`, `verifyBlock`. |
| c7 | Correct mutation target: `fmtNum`, `blocks.mjs:152`; the chart assertion requires two-decimal rounding. Checker weaknesses below. |
| c8 | Prompt’s guard contract is clear; the probe covers representative invalid inputs and valid behavior, but does not establish test quality. |
| r1 | Live command currently returns `6.0.0`; define “latest” as npm’s `latest` dist-tag, not most recently published release. |
| r2 | Currently **304 registry-listed versions**. “Published in total” could include subsequently unpublished versions. |
| r3 | Currently `67c20a7ebef70e7f3970a01f90fa210cb6860385`; correct field and coordinate. |
| r4 | Currently `BSD-3-Clause`; correct field and coordinate. |
| r5 | Current arXiv API returns `2024-05-06`; extractor targets the original publication date. |
| r6 | Current pinned-document check returns `dereference`; correct answer, readily memorizable. |

- **BLOCK — `apps/bench/lib/checkers.mjs:118–126`, `STUDY/tasks/r1–r6`: grader availability is conflated with model correctness.** An oracle timeout becomes a model failure; moving keys are fetched separately after each arm; `contains` accepts an incorrect number containing the right digits. The shasum/license tasks also lack the claimed saved-value drift tripwire. **Fix:** use whole-answer matching, validate HTTP/schema responses, distinguish `grader-error`, and snapshot a timestamped key per comparison block. Clarify r1/r2 wording; pin expected immutable values.

- **SHOULD — `STUDY/tasks/c7-bugfix.json:20–26`, `c8-guard.json:10–22`: edit checks are gameable.** c7’s hash blocks direct test edits, but inserting `process.exit(0)` into imported source bypasses the unchanged suite. c8 accepts a comment containing `clampText` as its “test”; its existing suite is not hash-protected. **Fix:** enforce allowed changed paths, preserve original tests, require completion receipts from trusted probes, and require the new guard test to fail against the unguarded implementation.

- **SHOULD — `STUDY/DESIGN.md:27–60`: transfer is narrow.** Six code tasks are short navigation queries; both edits concern one module. Four research tasks are npm metadata lookups, usually easier through registry JSON than search. License/date/option questions may pass from memory; a checksum is *unlikely*, not impossible, to be memorized. **Fix:** call this a navigation/metadata pilot, or replace two easy research tasks with source-discovery and cross-source extraction tasks with deterministic keys. Add a realistic multi-file maintenance task before claiming gains across Jake’s repositories.

## C. Measurement — FINDING

- **BLOCK — `EXT/openai-search.ts:513–551`, `apps/bench/lib/usage.mjs:65`: C’s nested search spend disappears.** The extension makes a separate Responses request, then returns only `{answer, results}`—discarding response usage. Supporting optional `toolResult.usage` cannot recover data never emitted. Its search model can also be selected independently of `gpt-5.6-sol`. **Fix:** instrument the pinned extension to preserve nested usage and actual model/provider, including applicable answer/summary paths. Mark unavailable usage unknown, never zero. Validate with captured nested-call streams before full spend.

- **BLOCK — `apps/bench/lib/profiles.mjs:12,80–94`: “no retries” is false at the agent layer.** Local settings leave retry at its default; pi’s `docs/settings.md:143` defaults agent retry to enabled, up to three retries. **Fix:** pin `retry.enabled:false` and provider retries to zero; detect retry events. Disable compaction for this bounded study or account for its separate usage.

- **BLOCK — `apps/bench/lib/usage.mjs:83`, `apps/bench/run.mjs:195–196`: incomplete/crashed streams can pass.** Any assistant message without an error qualifies, even without completion; nonzero child exit is ignored. **Fix:** require clean process exit **and** terminal stream completion, reject dangling tool-use/truncated streams, and test those cases. Exit zero alone is insufficient, but exit status is not irrelevant.

- **BLOCK — `apps/bench/run.mjs:113–114`: hard timeout does not hard-kill.** After SIGTERM, the “SIGKILL-TIMEOUT” timer merely resolves the promise. A resistant process can survive, consume quota and overlap subsequent runs. **Fix:** actually SIGKILL the process group, await confirmed termination, and test SIGTERM-resistant descendants.

- **SHOULD — `apps/bench/run.mjs:76–83,249`: torn-line resume loses the next record.** The reader ignores a partial tail, but append concatenates the next JSON object directly onto it. **Fix:** preserve/quarantine the torn tail and restore a newline boundary before appending.

**PASS:** Ordinary usage extraction is correct: authoritative `message_end`, disjoint buckets, no duplicate counting of `turn_end`/`agent_end`. Smoke independently totals **5,227 tokens, two turns, one bash call**, matching the record. Wall time includes startup but excludes grading. Normal timeouts retain observed partial usage and fail. Completed failures are skipped on resume; the harness itself has no intentional retry loop.

## D. Statistics and decision rule — FINDING

- **BLOCK — `STUDY/DESIGN.md:96–102`: the rule is underspecified and internally inconsistent.**
  - “Success ≥ A” lacks a clear per-task versus pooled denominator.
  - B′’s 10% reduction lacks a defined aggregation.
  - C’s “≥2 tasks” lacks a task-success definition.
  - B can be **15% more expensive on six tasks and arbitrarily worse on two**, yet qualify.
  - IQR overlap is neither an equivalence test nor evidence that a change is worthless.

  **Minimal fix:** predeclare per-task success counts, the exact cross-task token statistic, failure handling, and an **inconclusive** outcome. Separate “acceptable non-regression” from “measured improvement.” Add an overall spend/runtime guard so two expensive edits cannot disappear behind six cheap navigation wins.

**N=3:** adequate for a descriptive pilot, not a trustworthy subtle-win claim. Success changes in thirds within each task; one anomalous run can change a median. N=5 helps modestly but cannot repair task selection or undefined rules. Predeclare any extension to N=5 before inspecting comparative outcomes.

**Falsification:** materially worse correctness or cost on these tasks contradicts the operational recommendation *for this workload*. Equal performance supplies no evidence of a modest win; it does not falsify every possible benefit. C’s success-only threshold also rejects genuine equal-quality efficiency wins—an unnecessarily narrow adoption rule.

## E. Reusability — FINDING

**PASS:** Study/profile/task/checker separation is sound. Different models, tools, extensions and prompts fit without runner changes. Seven deterministic checker types plus arbitrary commands are sufficient; no LLM judge is needed. Accept the approximately 875-line implementation. Consolidating repeated doc citations is a **NIT**, not a reason to delay measurement.

- **SHOULD — `apps/bench/run.mjs:157`, `aggregate.mjs:34–40`: records lack experiment identity.** Resume keys contain only task/profile/rep; changing prompts, settings, checker or extension can silently mix experiments. Aggregation accepts duplicates and incomplete cells. **Fix:** attach a study-content fingerprint, runtime/extension versions and effective configuration; reject mixed fingerprints and flag missing/duplicate tuples.

- **SHOULD — `apps/bench/aggregate.mjs:103–109`: pooled profile rows compare different workloads.** B runs both families, A only code, C only research. **Fix:** summarize by family and compare only shared tasks.

- **SHOULD — `apps/bench/README.md:122–159`: operational assurances exceed implementation.** “Safe to Ctrl-C,” complete isolation and no retries are not established; detached children have no parent-interruption cleanup. **Fix:** implement interruption cleanup or document the limitation, and correct the isolation/retry claims.

## F. Operations before spend — FINDING

- **BLOCK — `STUDY/study.json:47`: extension path is disposable and unpinned by content.** Move the reviewed extension to durable storage with locked dependencies and recorded hashes. Verify actual tool registration; an existing entry file does not prove successful loading.

- **BLOCK — `apps/bench/run.mjs:177–183`: ordinary runs discard the evidence needed to audit C.** Save raw streams and stderr for every run, independently of retaining workspaces. Save edit diffs too.

- **SHOULD — `STUDY/DESIGN.md:91–94`: the budget anchor is inadequate.** One cheap navigation call estimates neither edits nor nested web work. Use the first complete replicate for recosting, not the first ten navigation-heavy runs. Add a cumulative budget stop and stop the study on systemic harness/auth/oracle failure rather than filling remaining cells with zeros.

### Should this run, and how?

Yes—as a bounded pilot after the blockers, not yet as a 2M-token adoption verdict.  
Freeze the amended design, configuration, extension and schedule; preserve the existing smoke as explicitly labeled pilot evidence.  
Prepare an isolated agent directory with protected Codex credentials; do not commit credentials or assume copying them removes refresh concerns.  
Run one complete replicate (`--rep 0`), then recost; today’s matrix is 36 tuples, but adding C/code changes that.  
Watch nested usage, actual models/tools, retries, oracle errors, cache buckets, timeouts and surviving children.  
Continue to the predeclared N only with clean measurement; do not add repetitions selectively to rescue a winner.  
**Most likely three-hour invalidator: C looks cheaper because its internal model calls were never counted.**

VERDICT: FIX-FIRST
