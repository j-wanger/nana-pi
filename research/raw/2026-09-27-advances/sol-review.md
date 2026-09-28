# Critical review: nana-pi + nana-agent-loop

**Date:** 2026-09-27  
**Scope:** read-only artifact, runtime-state, installed-pi, and test review.  
**Evidence labels:** **PRIMARY** = source code or official installed documentation read; **PRIMARY-RUNTIME** = command/output observed on this machine; **SECONDARY** = an internal audit with data that I did not independently reproduce row by row; **ANECDOTE** = HANDOFF/session self-report. Inferences are explicitly marked.

## Executive finding

**What is built serves consistency better than it serves effectiveness.** **[PRIMARY+PRIMARY-RUNTIME]** The package/install structure, user-scoped pi extensions, objective pickup, bounded prompt-time retrieval, and substantial tests are real. On this machine, every one of 162 pi session starts since objective instrumentation began has a matching objective pickup; knowledge pointers have been emitted 228 times; `nana-setup doctor` says `all good`; and the suites I could run passed. Those are delivery and implementation-health signals, not outcome signals.

**The central diagnosis is not closed.** **[PRIMARY+SECONDARY, inferred]** The 09-16 audit found that agents/seat did not rank, cost, or close human-opened lanes, and that free review rounds displaced implementation and measurement (`docs/audits/2026-09-16-session-spend-vs-objective.md:101-150`). Current controls mostly print context after a session has already been opened. They do not authorize a lane, name a budget, define a stopping condition, or mechanically score closure. Worse, product-local objectives suppress the umbrella **current priority** while retaining only the broad umbrella objective (`packages/nana-pack/extensions/nana-objective.ts:22-26,163-171,207-208`; `packages/nana-setup/claude/hooks/nana-objective.sh:16-18`). That makes almost any product work defensible under “build products with agents” while hiding “make nana-pi … consistent, coherent and effective.”

**Verdict on the current priority:** partially served. **[PRIMARY-RUNTIME, inferred]** “Consistent” has credible mechanisms and activity counters. “Coherent” is weakened by two runtimes with different startup rules, two meanings of handoff, cwd-fragmented config/state, and duplicated objective implementations. “Effective” is mostly unmeasured: retrieval delivery is counted but use is not; checks can emit receipts but emit none in the two owning repos; review classes and post-09-16 outcome consistency have no instrument.

---

# A. Objective fit

## A1 — HIGH: product-local objective resolution bypasses the program’s current priority

**Finding.** **[PRIMARY]** The governing file says a new lane opens only by editing the umbrella priority and every session must answer against both umbrella lines (`nana-agent-loop/OBJECTIVE.md:5-13`). The implementations instead make the nearest product `OBJECTIVE.md` govern and append only the umbrella **Objective** line. The TypeScript extractor searches only `**Objective` (`nana-objective.ts:169-171`); the shell hook does the same (`nana-objective.sh:18`). The test blesses this behavior by asserting the umbrella priority text is absent (`packages/nana-pack/tests/objective-injection.test.mjs:209-230`).

**Why it matters.** **[PRIMARY+SECONDARY, inferred]** The 09-16 mechanism gap was lane ranking, not merely forgotten wording: 20/39 September entries began with Jake naming a direction, while the agent did not rank/cost/close it (`session-spend-vs-objective.md:101-103`); September objective answerability was 4/39 (`:120-127`). A local product priority may rightly govern execution, but hiding the umbrella current priority means the implementation cannot enforce the umbrella rule it claims to enforce.

**Cheapest fix/test.** **[recommendation; low cost]** Append both umbrella lines when a project objective wins, label them “program objective” and “program current priority,” and require one explicit sentence saying whether the session serves the program priority or is an approved product exception. Add one cross-runtime golden test in a nested product cwd asserting all four lines are identical in Claude and pi. Falsifier: if Jake explicitly rules that product priorities supersede the umbrella priority, amend `OBJECTIVE.md` and remove the conflicting “new lane” claim instead.

## A2 — HIGH: post-edit evidence is built but inactive where nana itself is developed

**Finding.** **[PRIMARY+PRIMARY-RUNTIME]** Both principal repo roots lack `.pi/nana-pack.json`; `~/.pi/agent/receipts` contains **0 files**. Yet `nana-pi/AGENTS.md:81-88` speaks as though “this project’s `.pi/nana-pack.json`” runs checks. The extension defaults to no commands (`lib/config.ts:53-58`) and exits immediately when there are none (`nana-post-edit.ts:327-328`). Thus the receipt mechanism is code-complete and well-tested but does no live checking in either owning repo.

**Why it matters.** **[inferred]** This is the sharpest gap between “effective” and “implemented.” The system has 269 passing nana-pack checks around receipt semantics, but the projects evolving that system dogfood none of them. Zero receipts is a direct negative-control result: not “checks passed,” but “no configured check ran.”

**Cheapest fix/test.** **[recommendation; low cost]** Add the smallest real per-repo commands (at minimum the package test runner/root orchestration recommended below), and make `doctor --project <cwd>` warn when a nana project has no effective post-edit command. Falsifier: configure one cheap command for one week; if receipts are not read before land or do not prevent one error, remove receipts and keep direct feedback only.

## A3 — MEDIUM: the dormant loop runner is a large retired-lane carrying cost

**Finding.** **[PRIMARY+PRIMARY-RUNTIME]** The project’s own assessment says the last governed run was 2026-08-25, September had zero loops, and the precommitted meter date is 2026-10-02 (`docs/loops-vs-pi-2026-09-04.md:7-9,19-25,45-49`). Runtime census: `app/src` is **34,978 lines/108 files** and `app/tests` is **82,237 lines/281 files**. Its suite still costs 46.74 seconds and 4,701 checks per run. The repo-local Claude hooks still run loop status and system-map machinery on session start/stop (`nana-agent-loop/.claude/settings.json:3-27`).

**What still earns its keep.** **[PRIMARY]** Acceptance rails, worktree isolation, independent review, and a real OS sandbox for the dormant runner are distinct assets; the assessment already says to carry those practices without the round engine (`loops-vs-pi...:27-41`). The source is not proof that attended pi has the same boundary.

**Subtraction candidate / turn-it-off test.** **[recommendation; low immediate cost]** Keep the runner source frozen through the already-promised 10-02 meter, but turn off dormant session-start/stop advisories now. If no governed run exists on 10-02, mark the app archived, remove it from default validation and current system-map surface, and test it only on an explicit runner change. Falsifier: one real unattended, multi-round, rail-gated need launches cleanly before 10-02.

## A4 — MEDIUM: the desk is running as infrastructure without evidence of current use

**Finding.** **[PRIMARY+PRIMARY-RUNTIME]** `apps/desk` remains described as “the product surface” (`nana-pi/HANDOFF.md:17`), but its feel check remains open (`HANDOFF.md:38`). The launchd process has run since 09-16 on ports 7317/7320/7321 and `/api/live` returned `[]`. Its source has not changed since 09-16. The desk has strong tests, but no current usage instrument was found.

**Subtraction candidate / turn-it-off test.** **[recommendation; low cost]** Stop the launchd service for seven days while leaving source and sessions untouched; record any explicit need to restart it. If none occurs, keep desk install opt-in and remove it from “whole experience” health claims. Falsifier: Jake reaches for it or a product depends on its listeners during the week.

## A5 — What demonstrably fits

- **Package/install coherence is real on this Mac.** **[PRIMARY-RUNTIME]** `nana-setup doctor` reported every check passing and `all good.` Canonical hooks/rules are symlink-managed rather than hand-copied (`packages/nana-setup/README.md:24-45`).
- **Objective delivery is active in pi.** **[PRIMARY-RUNTIME]** Journal: 162 `session_start` and 162 `objective_pickup` events since the first pickup on 09-16. This proves pickup coverage, not adherence.
- **Knowledge delivery is active and bounded.** **[PRIMARY+PRIMARY-RUNTIME]** 228 pulls, 631 returned hits, 163 session IDs; blocks are capped at 2,000 chars and top three (`nana-knowledge/lib/hook.ts:13-15,88-98`). This proves pointers were shown, not read or used.
- **The post-edit implementation has unusually good local safety work.** **[PRIMARY]** It has timeout escalation, process-tree handling, output caps, content digests, and pi’s file-mutation queue (`nana-post-edit.ts:117-163,289-319,336-468`). The problem is activation and policy, not absence of engineering.
- **Shared templates and forwarders mostly avoid code forks.** **[PRIMARY]** `_shared` is genuinely included/copied by consumers, and `nana-agent-loop`’s review scripts forward to the pack rather than maintain a second implementation. This is the right subtraction pattern.

---

# B. Process integrity

## B1 — HIGH: objective start is enforced; objective close and pre-spend choice are prose

**Finding.** **[PRIMARY+PRIMARY-RUNTIME]** Start pickup is measured in pi. By contrast, global Claude settings contain SessionStart and UserPromptSubmit hooks only; no global Stop hook scores CLEAR/STRETCH/CANNOT. The loop repo’s Stop hooks check open loop runs and map drift, not objective score (`nana-agent-loop/.claude/settings.json:13-27`). No code creates `objective-` markers. A grep found no such marker in either current HANDOFF.

**Mechanism gap.** **[inferred]** Printing an objective does not force the decision the 09-16 audit said was missing. The broad objective is available after a lane is already entered, while there is no required “lane / expected spend / stop condition / priority relation” record before workers or reviews start.

**Cheapest fix/test.** **[recommendation; medium cost]** Add a tiny session-spend ledger entry at the first delegated/paid/review action: `{lane, umbrella-priority relation, expected worker/review cap, stop condition}`; at shutdown append actual and CLEAR/STRETCH/CANNOT. Start advisory-only. Falsifier: over 20 sessions, it predicts neither overspend nor discarded work better than current prose; then remove it.

## B2 — HIGH: the three-round cap is filename-advisory, not “refuses round four”

**Finding.** **[PRIMARY+PRIMARY-RUNTIME]** `roundFromOutPath()` returns `null` when the output basename has no `rN`/`round-N`, and `null` is allowed (`review-round.mjs:11-21`). Direct probe: `review.md → round=null → allow`; `foo-review-4.md → null → allow`; only `r4.md` and `round-4.md` refused. Running `pi` directly also bypasses the wrapper. There is no item identity or invocation ledger.

**Measured status.** **[PRIMARY-RUNTIME]** I found no post-09-18 review filename matching r4+ among 20 newer review files, so habit may currently comply. That is indirect and cannot see direct pi calls or renamed files.

**Cheapest fix/test.** **[recommendation; medium cost]** Give each review item a small metadata record and allocate the next round from that record; keep `--over-cap` as an auditable event. Falsifier: a replay test that invokes four reviews under arbitrary output names must refuse the fourth. If a ledger is too costly, narrow the claim to “warns when filenames carry a detectable round.”

## B3 — MEDIUM: knowledge pull is enforced and measured at delivery, not at use

**Finding.** **[PRIMARY+PRIMARY-RUNTIME]** One CLI produces both runtimes’ blocks; pi spawns it out-of-process under a parent-side two-second bound (`extensions/nana-knowledge.ts:1-31,73-139`). `pull.log` records source, query tokens, hits, and latency (`lib/hook.ts:145-155`). Current activity is 151 pi pulls, 73 Claude pulls, and four older untagged pulls. No instrument establishes that an agent opened a pointer or changed a decision.

**Why it matters.** **[PRIMARY+SECONDARY]** The original audit found 0 downstream references for 72 research articles (`knowledge-utilization.md:10,30-38`) and explicitly warned that citation grep misses unrecorded use (`:90-94`). The current HANDOFF still defers the citation checker (`nana-pi/HANDOFF.md:36`). Delivery alone does not close the original failure.

**Cheapest fix/test.** **[recommendation; low cost]** Correlate shown paths with later read-tool paths/session citations; run a randomized 10-session turn-off or shadow comparison. Falsifier: if pull-on sessions do not increase relevant opens/citations or reduce re-derivation, remove always-on injection and keep search on demand.

## B4 — MEDIUM: two-tier memory and HANDOFF discipline are runtime-asymmetric and manually curated

**Finding.** **[PRIMARY]** The shared-memory hook is Claude-only and emits the shared index; native Windows skips all three bash hooks (`nana-setup/README.md:186-190`). Pi receives neither that shared rule index nor Claude’s project memory. Pi’s `.pi/handoff.md` is automatic compaction continuity, while root `HANDOFF.md` is a curated project frontier; no fresh-session mechanism automatically reads the latter. The “drop once obvious/gone” rule is only a memory/document instruction (`~/.claude/nana-memory/shared/MEMORY.md`, “HANDOFF drop rule”).

**Runtime symptom.** **[PRIMARY-RUNTIME]** Both repo-root `.pi/handoff.md` files are absent, while this nested review cwd has a 10,448-byte `.pi/handoff.md`. The root frontiers are 6,732 and 19,689 bytes. This is expected from the exact-cwd implementation (`nana-handoff.ts:5-7,28-29`) but means continuity fragments by launch directory.

**Cheapest fix/test.** **[recommendation; medium cost]** First rename the concepts in UI/docs (“project frontier” vs “compaction handoff”). Then choose and test one project-root resolution rule for config/handoff, or explicitly show the active path at startup. Falsifier: start at root and two nested cwd values after compaction; all three must see the intended same frontier or deliberately distinct, visibly named continuity.

## B5 — MEDIUM: independent-review “disjoint classes” is a standing claim without a classifier

**Finding.** **[ANECDOTE]** Session logs say sol local correctness and astra cross-package policy caught disjoint classes (`nana-pi/docs/sessions/2026-09.md:84-90`). **[PRIMARY-RUNTIME]** Review corpora exist, but I found no structured finding labels or comparison instrument that measures overlap, unique catches, severity, or fixes per reviewer tier.

**Cheapest fix/test.** **[recommendation; low cost]** On the next five dual reviews, tag each accepted finding `{local, cross-package, contract, false-positive}` and source reviewer. Falsifier: if the second tier adds no high-cost unique catches, use one tier except for declared cross-package changes.

---

# C. Code defects and blast radius

## C1 — HIGH: malformed config can throw from supposedly fail-open extensions

**Finding.** **[PRIMARY+PRIMARY-RUNTIME]** `loadConfig` shallow-spreads unvalidated JSON (`lib/config.ts:62-95`). `nana-post-edit` dereferences `cfg.postEdit.commands.length` and iterates it (`nana-post-edit.ts:327-345`). A temp-HOME probe with `{"postEdit":{"commands":null}}` threw `TypeError: Cannot read properties of null (reading 'length')`. A second probe with `{"objective":{"path":7}}` threw `TypeError: p.startsWith is not a function` before objective’s read error handling. Existing tests cover malformed individual command entries and malformed gate arrays, not these container shapes.

**Blast radius.** **[PRIMARY, effect partly unverified]** The post-edit throw occurs after a successful edit and can break the turn’s result path. The objective throw occurs during `session_start`; the exact host-visible failure behavior was not live-tested. Both violate the repo rule “never crash the agent.”

**Cheapest fix/test.** **[recommendation; low cost]** Normalize every config leaf to a schema at `loadConfig` and fuzz `null`, scalar, array, and wrong-object values for every top-level block. Falsifier: every extension handler must resolve without throwing and report/no-op according to one documented malformed-config policy.

## C2 — MEDIUM: gate is useful friction but structurally bypassable

**Finding.** **[PRIMARY]** `nana-gate` inspects only `bash`/`powershell` command strings and `edit`/`write` paths, with explicit “advisory-by-load-path” scope (`nana-gate.ts:1-10,64-109`). Pi’s official docs say extensions can mutate tool input after earlier handlers and no revalidation occurs (`installed docs/extensions.md:778-793`); the pack README acknowledges later mutation and custom-tool/read gaps. Installed pi security docs state project trust is not a sandbox and pi runs with the invoking user’s permissions (`docs/security.md:3-7,31-41`).

**Drift.** **[PRIMARY]** The historical loop-vs-pi assessment says the gate was “ported to nana-pack (fail-closed in all pi runs)” (`loops-vs-pi...:34`), while current source correctly says anyone can run pi without it. Because that historical doc is indexed, the stale stronger claim can be retrieved.

**Cheapest fix/test.** **[recommendation; low cost]** Keep the gate, but never count it as containment. Add an explicit startup warning in unattended/headless runs that lack an external container/VM, and annotate the stale assessment as superseded. Falsifier: attempt a custom mutating tool and a later-handler mutation; both should demonstrate why the advisory label remains necessary.

## C3 — MEDIUM: `pi-review` fights current pi liveness and is not native-Windows portable

**Finding.** **[PRIMARY]** The wrapper polls Unix `ps -o time`, uses detached POSIX process groups and negative-PID `SIGKILL` (`pi-review.mjs:67-72,88-100,106-126`). On win32 `ps` fails to zero, so any long review appears CPU-flat; negative group kill is unsupported and falls back to only the direct child. No signal handler cleans up its detached child if the wrapper itself is interrupted. Even on macOS, a healthy network wait can be CPU-flat, while the session log already notes micro-CPU creep defeats the detector (`nana-pi/docs/sessions/2026-09.md:102-104`).

**Upstream overlap.** **[PRIMARY]** Installed pi is 0.84.4. It now ships provider request timeout and HTTP/stream idle timeout settings (`installed docs/settings.md:143-176`). `reload-runtime` is also the exact official extension pattern (`installed docs/extensions.md:1303-1325`). The latter is a justified RPC bridge; the former makes a custom CPU-liveness oracle much less defensible than when the wrapper was written.

**Cheapest fix/test.** **[recommendation; medium cost]** Replace CPU-flat detection with pi’s provider/idle deadlines plus one wrapper wall-clock deadline, add platform-specific tree kill and signal cleanup, and retain only retry/output validation/cap policy. Falsifier: controlled cases for silent healthy delay, true hung child, SIGINT, and win32 must neither orphan nor false-kill.

## C4 — MEDIUM: project config and compaction handoff are exact-cwd while project context/objective walk ancestors

**Finding.** **[PRIMARY]** Config reads only `<ctx.cwd>/.pi/nana-pack.json` (`lib/config.ts:75-81`); handoff defaults to `<cwd>/.pi/handoff.md` (`nana-handoff.ts:28-29`); objective searches ancestors (`nana-objective.ts:133-153`); pi itself loads ancestor context. Root docs recommend folder-scoped cwd for nested `AGENTS.md`, so following that advice silently drops a root nana-pack config and creates a different handoff.

**Cheapest fix/test.** **[recommendation; medium cost]** Resolve nana’s project root once, using the same explicit rule for config and handoff, or document exact-cwd namespaces and show them in status. Add a nested-cwd integration test with root config. Falsifier: a session launched in `packages/x` must either run root checks and pick root continuity, or visibly state why it will not.

## C5 — LOW now, rising: observability stores have no retention

**Finding.** **[PRIMARY+PRIMARY-RUNTIME]** Journal and knowledge pull logs append forever (`lib/config.ts:114-124`; `nana-knowledge/lib/hook.ts:78-82`); one shown-set file is written per session (`hook.ts:58-74`). Current sizes are small: journal 212,745 bytes/1,597 lines; pull log 102,856 bytes/228 lines; shown store 59 files/14,618 bytes. Receipts are bounded to latest repo/checker and currently empty.

**Cheapest fix/test.** **[recommendation; low cost]** Add size/age rotation before this becomes an incident; preserve aggregate counters. Falsifier: simulate 100k sessions and assert bounded disk/startup behavior.

## C6 — Declared desk residuals remain real but are currently parked-risk

**Finding.** **[PRIMARY]** The desk explicitly documents unbounded per-child status/widget/dialog maps that can make reconnect loop forever, synchronous key-store IO, a two-desk lost-update race, and a win32 symlink TOCTOU (`apps/desk/README.md:507-555,607-614`). This is honest contract documentation, not a hidden defect.

**Cheapest fix/test.** **[recommendation]** Do not harden these while the desk is unused. If the turn-it-off test fails and desk is active again, prioritize map caps/reconnect backoff before more UX.

## Test results

**[PRIMARY-RUNTIME] All executed suites passed:**

| Area | Result |
|---|---:|
| nana-pack | 13 files, 269 PASS, 0 FAIL |
| nana-knowledge | 6 files, 206 PASS, 0 FAIL |
| nana-setup | 8 files, 471 PASS, 0 FAIL |
| nana-stage | 1 file, 112 PASS, 0 FAIL |
| desk unit | 13 files, 653 PASS, 0 FAIL |
| desk no-model browser E2E | 11 files passed, 0 failed |
| legacy loop app Vitest | 267 files passed, 2 skipped; 4,694 tests passed, 7 skipped; exit 0 |

**[PRIMARY-RUNTIME] Exclusions:** three desk browser suites (`double-msg`, `stage-chain`, `stage-chain-edge`) require a real model and/or external product chain, so I did not incur model spend. The desk intentionally has no `package.json`; `npm test` there returns ENOENT. None of nana-pi’s package manifests defines a test script, and the root manifest has no scripts, so these green tests are not reachable through one canonical command. `nana-setup/README.md:218` declares there is no repo CI workflow.

**Assessment of test quality.** **[PRIMARY]** Many tests assert real invariants (timeouts, queue serialization, symlink refusal, browser races), not merely implementation snapshots. The objective test is the clearest counterexample: it codifies the omission of umbrella priority rather than the governing invariant. The larger risk is not weak tests; it is no standard runner/CI and no live dogfood configuration.

---

# D. Duplication and drift

## D1 — HIGH: objective policy has two implementations and one shared policy bug

**Finding.** **[PRIMARY]** Shell and TypeScript independently implement walk-up, fallback, output selection, and umbrella extraction. They differ in symlink refusal, truncation, failure visibility, journaling, and injection semantics, yet both append only umbrella objective (`nana-objective.sh:1-21`; `nana-objective.ts:80-240`). The phrase “same two lines” in headers/docs is false in product repos.

**Cheapest fix/test.** **[recommendation; medium cost]** Put resolution/rendering in one CLI returning a bounded block; both hooks call it. Run one golden corpus over root, nested, missing, empty, symlink, and product cases on macOS/Linux/Windows-capable Node. The shell hook can become a one-line launcher.

## D2 — MEDIUM: three continuity stores have different readers

**Finding.** **[PRIMARY]** Root `HANDOFF.md` is curated frontier, `.pi/handoff.md` is latest compaction summary, and Claude project memory is harness-managed project knowledge. Shared memory is a fourth index of user/rule pointers. These are not exact duplicates, but names and read moments are insufficiently explicit; only `.pi/handoff` is automatically injected into fresh pi, while root HANDOFF depends on an instruction to read it.

**Cheapest fix/test.** **[recommendation]** Declare a one-row contract for each store: producer, reader, scope key, expiry, and maximum size. Rename only the user-facing labels first; do not merge content blindly.

## D3 — MEDIUM: nana builds a second knowledge index over stores that retain old indexes

**Finding.** **[PRIMARY+SECONDARY]** `sources.json` includes private knowledge-wiki markdown plus docs/research/doctrine in nana’s SQLite index. The 09-16 audit found four pre-existing wiki SQLite indexes totaling about 4.8 GB and zero observed `wiki-query` prompts (`knowledge-utilization.md:53-66`). Thus the new read path fixes access by indexing the same corpus again while old index machinery remains.

**Cheapest fix/test.** **[recommendation; low cost]** Declare nana-knowledge the canonical automatic retrieval index; disable or archive old wiki indexes after a backup and 30-day no-query check. Falsifier: a workflow still needs vector/hybrid behavior that BM25 cannot provide and records actual use.

## D4 — LOW: stale counts and historical docs remain retrievable

**Finding.** **[PRIMARY]** Root `package.json` describes four nana-pack behaviors while the pack now loads six extensions; historical loop docs retain stronger gate claims; HANDOFF says “landed today (2026-09-18)” nine days later. These do not break execution but degrade prompt-time truth because docs are indexed.

**Cheapest fix/test.** **[recommendation]** Add “historical/superseded” metadata to indexed docs and one generated extension inventory. Falsifier: retrieval should prefer current README/source over superseded assessments for a gate query.

---

# E. Context shaping

## E1 — Fresh pi context is lean enough, but omits shared operating rules and project frontier

**Finding.** **[PRIMARY+PRIMARY-RUNTIME]** In `nana-pi` root, pi automatically loads the 8,679-byte/1,219-word `AGENTS.md`; objective fallback contributes the 1,769-byte umbrella file. Knowledge can add at most 2,000 chars on a meaningful prompt. Root HANDOFF is not automatic. The 5,247-byte shared-memory index is Claude-only. Pi therefore sees less startup bloat but also misses rules such as “no pipes before commit,” HANDOFF drop, and reviewer waiting unless repeated in repo AGENTS or the brief.

**What changes for nana.** **[inferred]** This is inconsistent precisely where pi workers/reviewers are expected to police process. Injecting all shared memory would add noise; injecting a generated short “active operating rules” subset would close the asymmetry.

## E2 — Fresh Claude context is materially larger and still does not guarantee the frontier

**Finding.** **[PRIMARY-RUNTIME]** Known nana-pi startup material is approximately: repo `CLAUDE.md` symlink to AGENTS (8,679 bytes), global rules (4,816 bytes), objective hook (395 bytes/51 words), and shared-memory hook (5,247 bytes/592 words), before Claude’s own tool/system prompt. That is about 19 KB of nana text. The project HANDOFF (6,732 bytes) is still read by instruction, not injected. In nana-agent-loop the root HANDOFF alone is 19,689 bytes.

**Assessment.** **[inferred]** The objective block is admirably small. The shared index is high-signal relative to full memories but already 30 pointers. The larger waste is not raw bytes; it is repeated policy without a decision-time checkpoint, while the one missing program-priority line controls lane choice.

## E3 — Prompt-time knowledge is bounded and safely framed, but ranking quality/use is unknown

**Finding.** **[PRIMARY]** Prompt input is sliced, short/slash/harness prompts are skipped, output is top-three/2 KB, dedup is per session, stale rebuild is detached, and pointers are framed as untrusted data (`nana-knowledge/lib/hook.ts:1-17,83-98,101-155`). The pi child is externally bounded (`extensions/nana-knowledge.ts:20-31,73-139`). These are coherent context-shaping choices.

**Missing.** **[PRIMARY-RUNTIME]** There is no precision judgment, open/read correlation, or decision-effect measure. Four old pull rows lack a source tag, showing schema evolution without migration, though current rows are tagged.

## E4 — Windows starts with a different experience by design

**Finding.** **[PRIMARY]** The repo objective targets macOS + native Windows, but nana-setup explicitly skips the three Claude bash hooks, their settings entries, the `pi-review` PATH symlink, and desk service on win32 (`nana-setup/README.md:186-190`). Nana-pack extensions have win32 branches, but Claude objective/shared-memory/knowledge parity does not exist there. HANDOFF itself records win32 as untested (`nana-pi/HANDOFF.md:35`).

**Cheapest fix/test.** **[recommendation; medium cost]** Either narrow the supported “whole experience” claim to macOS/Linux + pi-on-Windows, or port hook producers and pi-review launcher to Node and add native Windows CI. Falsifier: a clean Windows VM should pass doctor and produce the same objective lines, one knowledge pointer, and the same shared-rule digest.

---

# F. Standing claims versus instruments

| Standing claim | Instrument/evidence | Verdict |
|---|---|---|
| “Objective is printed every session” | Pi journal has 162 starts/162 pickups since activation; Claude hooks installed and manual output is 395 bytes. **[PRIMARY-RUNTIME]** | **Measured for pi delivery; Claude coverage not centrally counted.** Product mode does not print the same umbrella two lines. |
| “Every session answers objective + priority” | Session prose sometimes records scores; no close hook/ledger. **[PRIMARY+ANECDOTE]** | **Written/habit, not enforced or measured.** |
| “Three-round review cap” | Filename parser + unit tests; no item ledger; arbitrary names/direct pi bypass. **[PRIMARY]** | **Advisory.** No detected post-deploy r4 filename, not proof. |
| “Knowledge retrieval is used” | 228 pull rows/631 hits; citation checker deferred. **[PRIMARY-RUNTIME]** | **Delivery measured; use/effect unverified.** |
| “One producer per evidence” | Both knowledge runtimes call one hook CLI; templates share source. **[PRIMARY]** | **True for pointer production/templates; not a system-wide measured invariant.** |
| “Two reviewer tiers catch disjoint classes” | Narrative review corpora, no labels/overlap metric. **[ANECDOTE]** | **Plausible, unmeasured.** |
| “Post-edit checks/receipts improve confidence” | Strong implementation tests; zero live receipts in owner repos. **[PRIMARY-RUNTIME]** | **Inactive here; effectiveness unverified.** |
| “Handoff preserves continuity” | 41 writes, 143 pickups in journal; exact-cwd artifact exists in nested cwd. **[PRIMARY-RUNTIME]** | **Mechanism active; project-frontier continuity and quality unmeasured.** |
| “HANDOFF drop rule” | Prose rule only; current files 6.7 KB and 19.7 KB. **[PRIMARY-RUNTIME]** | **Manual, unmeasured.** |
| “Gate is un-bypassable” | Dormant runner has a host dispatch gate and seatbelt path; nana-pack explicitly says advisory. Installed pi has no built-in sandbox. **[PRIMARY]** | **Only defensible for the dormant host chokepoint within its stated adapter path; false for attended nana-pack/pi.** |
| “nana-pi experience is consistent/effective” | Doctor health, activity counters, tests; no cross-runtime outcome baseline or post-09-16 consistency metric. **[PRIMARY-RUNTIME]** | **Consistency partially instrumented; effectiveness unverified.** |
| “Review rounds save quality” | Audit records five gaps found by implementation after nine rounds and arithmetic caught by instruments, not reviews (`session-spend-vs-objective.md:130-144`). **[SECONDARY]** | **Unproven generally; evidence supports bounded use, not escalation.** |

---

# Top 10 recommendations — ranked by cost-of-error × confidence / implementation cost

1. **Restore the umbrella current priority in every product session, or formally repeal that requirement.** Evidence: only umbrella objective is appended (`nana-objective.ts:169-171`; shell line 18). Cost: low. Test: nested-product golden output in both runtimes contains both program lines and both product lines.
2. **Activate one real post-edit checker in both owner repos and make project doctor flag an empty effective checker set.** Evidence: zero receipts and absent repo configs despite `AGENTS.md:81-88`. Cost: low. Test: edit a fixture, observe one current receipt, then mutate it and observe stale.
3. **Instrument the missing pre-spend decision, not another startup reminder.** Evidence: audit’s dominant gap is unranked/unclosed human-opened lanes (`session-spend-vs-objective.md:101-150`); no close hook exists. Cost: medium. Test: 20-session ledger predicts/reduces cap overruns and discarded work.
4. **Make review caps item/ledger-based and retire the filename claim.** Evidence: `review.md` and `foo-review-4.md` allow; direct pi bypasses. Cost: medium. Test: four arbitrary-named invocations for one item refuse #4 absent a logged override.
5. **Schema-normalize nana-pack config before any handler reads it.** Evidence: two temp-HOME probes threw on `commands:null` and numeric objective path. Cost: low. Test: property/fuzz matrix over every config leaf; no handler rejection/throw.
6. **Add one canonical nana-pi test command and CI on macOS + native Windows.** Evidence: 1,711 executed checks pass but no package/root scripts and no CI (`nana-setup/README.md:218`). Cost: medium. Test: a deliberate failing test blocks a PR on both OSes.
7. **Replace `pi-review` CPU polling with upstream provider/idle deadlines plus a portable wall-clock/tree-kill wrapper.** Evidence: Unix `ps`/negative PID (`pi-review.mjs:67-126`) vs pi 0.84.4 timeout settings. Cost: medium. Test: healthy silence, true hang, SIGINT, and win32 orphan checks.
8. **Measure retrieval use now, then run a turn-off test.** Evidence: 228 pulls/631 hits but no open/citation correlation; checker remains deferred (`HANDOFF.md:36`). Cost: low. Test: randomized pull-on/off sessions compare relevant opens, citations, and re-derivation.
9. **Resolve runtime/scope incoherence: Node-based cross-platform hooks and one visible project-root rule for config/handoff.** Evidence: Windows skips hooks (`nana-setup/README.md:186-190`); config/handoff exact-cwd while objective/context walk ancestors. Cost: medium. Test: Mac + Windows, root + nested cwd parity matrix.
10. **Execute the subtraction tests already implied by usage: archive the loop after 10-02 if still unused; stop the desk service for one week now.** Evidence: no governed run since 08-25; desk `/api/live=[]`, feel check open. Cost: low/reversible. Test: any real launch/request falsifies subtraction; otherwise remove both from default active machinery, not necessarily source history.

## Overall judgment

**The code is generally more disciplined than the process that invokes it.** **[PRIMARY+PRIMARY-RUNTIME]** The passing invariant-heavy suites, bounded subprocess work, lock handling, trust checks, and explicit known limits are strong. The highest-cost failures are policy/activation failures: the wrong priority is omitted by design, verification is dormant by configuration, and effectiveness claims stop at event counts.

**Do not respond by building another controller.** **[SECONDARY+inferred]** The historical evidence says ceremony and repeated review became their own spend. The cheapest path is subtraction plus four small instruments: program-priority parity, effective-check health, item-based review count, and retrieval-use correlation. If those do not move consistency, that falsifies the current theory faster than more autonomy machinery.

VERDICT: DONE
MOST-LIKELY-WRONG 1/5 — The product-priority behavior may be Jake’s intended exception, in which case the implementation is right and `OBJECTIVE.md` is the stale contract.
MOST-LIKELY-WRONG 2/5 — Zero receipts may reflect deliberate non-dogfood while checks run through other commands, making the practical blast smaller than I rank it.
MOST-LIKELY-WRONG 3/5 — The desk may be used through a browser without live children at my observation instant, so a one-week turn-off could inconvenience real use.
MOST-LIKELY-WRONG 4/5 — Pi’s provider timeout may not catch the exact Codex subscription/WebSocket stall that motivated CPU polling, so replacing it may regress recovery.
MOST-LIKELY-WRONG 5/5 — Citation/open correlation may undercount genuine knowledge influence enough that the proposed retrieval turn-off test gives a false negative.
