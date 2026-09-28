# Review: BLOCK adoption as written

The synthesis identifies real defects, but it turns several hypotheses into operating rules, loses important caveats, and explicitly waives reviews that nana’s safety invariant requires.

**Keep the diagnosis and verified defects. Rewrite the authorization, sequencing, and acceptance contracts before this document drives implementation.**

I read the synthesis first, all five reports and `common.md`, then the governing documents and relevant source. Verification below is read-only: I did not rerun probes or test suites.

## A. Fidelity — FINDINGS

### A1 — HIGH: The priority diagnosis overlooks a later human ruling

The synthesis says product work “contradicts OBJECTIVE.md” regardless of whether Jake intended it. That is too categorical.

Evidence:

- `~/nana-agent-loop/OBJECTIVE.md` retains the umbrella-priority lane-opening rule.
- But `~/.claude/nana-memory/shared/feedback_two_tier_memory_decentralized.md` records Jake’s **09-18** ruling: product-local objectives, frontiers and sessions; nearest `OBJECTIVE.md` wins.
- `packages/nana-pack/extensions/nana-objective.ts:22–26` explicitly says product sessions are charged against the product’s two lines.
- `~/the-hive/docs/sessions/2026-09.md` records repeated explicit product steering from Jake.
- `~/jev-research/docs/sessions/2026-09.md` describes work specifically intended to investigate a **local tool-result judge for nana-pi**.

Therefore:

- **Verified:** the producers omit the umbrella priority when a product objective wins.
- **Unresolved:** whether that omission violates the intended post-decentralization contract.
- **Not established:** zero spend served nana-pi merely because its repository had no commits.

The inspected main-worktree reflogs end on 09-18, corroborating inactivity there—not inactivity on every branch, in every worktree, or on toolkit-relevant research elsewhere.

**Required correction:** describe an unresolved hierarchy between the 09-16 and 09-18 rules, not established disobedience. Separate *repository activity*, *objective fit*, and *priority authorization*.

### A2 — MED: “143 pickups” is attached to the wrong scope

The synthesis attributes 143 pickups to the-hive’s stale 09-13 handoff.

Evidence:

- `opus-review.md`, A2: **143 pickups globally**.
- The same report, E1: **56 the-hive pickups since 09-16**.
- `~/.pi/agent/nana-journal.jsonl` contains pickup events for probes, basketball-geek, the-hive and several the-hive worktrees, including events preceding the stale file’s timestamp.
- `~/the-hive/.pi/handoff.md` does contain the quoted obsolete “do not modify” instructions and the 09-13 timestamp.

The defect is real; the seat-verified exposure count is misattributed.

Similarly, **2/19 the-hive entries** is the whole archive denominator, including copied pre-09-18 entries. There are **13 entries dated after 09-18**, two with scores. Use a consistent post-change window when claiming decay. The **0/23 jev-research** count matches the inspected archive.

### A3 — MED: Launcher bypass is established; an actual fourth review is not

The synthesis says the cap “was bypassed” when reviews moved launchers.

Evidence:

- `review-round.mjs:14–21` permits unnumbered output names.
- `review-round.test.mjs` explicitly tests that behavior.
- `launch-opus-review-r4.sh` invokes Claude without the shared cap.
- But `opus-review.md`, B2 expressly says: **“I cannot tell from filenames whether any single item got a 4th review.”**
- `sol-review.md`, B2 found no matching post-deploy r4+ filenames in its sample.
- The jev session archive records several contracts landing at the cap and package reviews finishing within two or three rounds.

**Correct claim:** switching launchers bypassed the *check*. A violation of the *three-review-round policy* remains unproven. The synthesis drops precisely the caveat needed to distinguish these.

### A4 — MED: Several provisional research claims became unconditional prescriptions

Examples:

- **Human attention as the causal bottleneck:** `opus-pm.md` labels queueing→voided-work causality inferred and explicitly doubts it. The synthesis presents it as the diagnosis and makes WIP the top intervention. Queue size alone does not establish arrival rate, service capacity, or the cause of rework.
- **Reviewer “never the patch”:** `opus-research.md`, H4 recommends banning reviewer-prescribed fixes **conditionally**, after examining fold regressions. Its final caveat also questions the summarized study’s lineage labels. The synthesis drops that condition. “Reviewer does not edit the artifact” is not equivalent to “reviewer may never suggest a repair.”
- **Context retention:** the lane’s evidence covers short Gemini sessions and explicitly warns against extrapolating to long Claude seat sessions. Retiring a broken once-ever warning can be justified independently; claiming keep-context evidence settles compaction policy cannot.
- **Consensus:** “Sol … corroborates every shared item above” is false. Sol did not independently establish the WIP intervention, `/goal` adoption, or all the other top-14 recommendations.

The opening promise that evidence grades remain in raw reports does not make these stronger formulations safe.

### A5 — MED: Zero receipts and advisory gating are overstated

**Receipts:** absence now is not proof they have “never produced a live receipt.” `opus-review.md` explicitly allows deletion or a formerly different receipt directory. The stronger observed result is: **no live receipts were found in the inspected default location, and owner-repo checking is not configured there.**

**Gate:** “documented as advisory, so blast radius is bounded” reverses the implication. Advisory status bounds the **guarantee**, not potential filesystem damage. Low use by mutating workers may reduce exposure; only actual sandbox/container constraints bound execution authority.

### Verification summary

Direct inspection corroborates:

- Gate allow-pattern return precedes danger/protected-path checks: `nana-gate.ts:81–97`.
- Built-in protected paths omit `nana-pack.json`.
- Listed destructive forms are absent from the relevant patterns.
- Handoff pickup has symlink checks but no project-trust check.
- Round inference is basename-based and null permits execution.
- Both objective producers omit the umbrella priority in product mode.
- Installed pi package version is **0.84.4**.
- Main-worktree reflogs stop on 09-18.

I did **not** independently reproduce the suite totals, budget-flag behavior, external-paper results, or the exact **151/228** historical pull count. Those should remain attributed observations, with snapshot dates.

## B. Ranking — FINDINGS

### B1 — HIGH: The order does not reflect confidence, dependencies, or implementation cost

The table bundles unrelated changes under single ranks and substantially underprices permission/lifecycle contracts.

| Recommendation | Ranking correction |
|---|---|
| **#15 config normalization** | Move into the first implementation tranche, alongside #3. Concrete runtime failures affect multiple extensions. It is not an appendix-level addition. |
| **#3 gate fixes** | Keep near the top, but separate self-protection/allow semantics from expanded command recognition. “~15 lines” is not a credible estimate including compatibility, negative cases and adversarial tests. |
| **#2 handoff** | Keep trust/provenance correction high. Separate the speculative three-day expiry from it; resolve writer ownership and scope with #17. |
| **#5 + #11 objective producer** | Move the hierarchy decision and producer unification ahead of implementing new priority fields. Otherwise two implementations receive another policy change before their contract is settled. |
| **#4 cap/budget** | Keep high, after defining “item,” “round,” retries and dual-review behavior. Split launcher correctness, review accounting and worker budgeting. |
| **#6 retrieval** | Instrument baseline and index health before filtering and reranking. It currently changes the treatment before measuring the original system. |
| **#1 WIP** | Move the hard limit down to a bounded, Jake-approved experiment. Keep queue deduplication, ordering and cheap feel preparation high. |
| **#8 `/goal`** | Move below a real-launch smoke test and trial. “Every worker” is premature. |
| **#9 runner hooks** | Make conditional on Jake’s ruling and a narrower hook contract; inactivity is not sufficient authorization to disable all ceremony. |
| **#10 consistency probe** | Retain as exploratory sampling, not a diagnosis that can clear worker consistency after three successes. |
| **#12–14** | Keep below correctness/activation work. Do not bundle low-risk documentation cleanup with context mutation or model integration. |

The **root test command** part of #11 should precede implementation lands. It supplies the common acceptance path; it should not wait behind `/goal`, new metrics and a pi upgrade.

### B2 — MED: Important lane findings were omitted or diluted

1. **The missing pre-spend checkpoint.** Sol’s top-three recommendation records priority relation, expected spend and stopping condition **before delegation**. Printing more lines and checking score tokens afterward do not replace it. Start with a brief field, not another controller.

2. **The CANNOT decision has no product-side reader.** Opus B1 identified the missing decision collector. Improving score coverage without making `objective-` decisions visible leaves the escalation loop broken.

3. **Corrupt-index/no-hit ambiguity.** Opus C5 reports silent query failure and repeated detached rebuilds. `nana-knowledge/lib/hook.ts` confirms that query exceptions become empty hits and only successful outputs are logged. This must accompany #6; otherwise “unused retrieval” may actually mean broken retrieval.

4. **Mutating workers bypass pi post-edit checking.** Opus D2 and the isolation memory establish why simply adding `.pi/nana-pack.json` may not dogfood anything: the builders run isolated Claude processes. #16 needs a real producer/consumer execution path.

5. **Pi lacks the shared operating-rule read path.** Sol E1 identified this cross-runtime gap. Include a small canonical rule digest or explicitly require relevant rules in briefs—not wholesale memory injection.

6. **Reranker acceptance lost safeguards.** Sol’s proposed gate also requires no worse irrelevant-hit rate and bounded p95 latency. Recall@3 alone can approve a slower, noisier intervention.

The inferred dormant-runner extension escape, Opus C10, need not become active work now, but it belongs in a **reactivation blocker** list.

## C. Harm if adopted — items 1–6

### #1 — HIGH: A per-repo WIP ceiling can freeze useful work without limiting Jake’s queue

What breaks:

- Jake is a **shared** resource. Three items in each of ten repositories still permits thirty asks.
- The current lists mix active blockers, optional feel requests, dormant work and duplicated product pointers. Counting all of them can freeze a repo indefinitely.
- It rewards hiding questions, combining unrelated decisions into one item, or opening another repository.
- “Only queue-consuming work” can send agents back to instruments and machinery—the default Jake has repeatedly rejected.
- A proxy walk can become a checkbox that authorizes hardening despite unresolved product direction.

**Safer contract:** deduplicate first; distinguish blocking decisions from optional asks and parked work; limit **new work that creates additional human dependencies**, not all work in a repo. Preserve already-approved autonomous execution and urgent safety repairs. Pilot a program-wide active decision limit with explicit exceptions.

The feel sequence must preserve the raw PM report’s **safety-code exemption** and “seat checks integration before involving Jake” qualification.

### #2 — HIGH: Age-based suppression can erase the only surviving live constraint

What breaks:

- A weekend or delayed return makes a valid constraint disappear.
- An unrelated `HANDOFF.md` commit invalidates a still-relevant compaction summary.
- A new timestamp can make stale content appear current.
- Suppressing pickup in reviewers does not stop reviewer compaction from **overwriting** the seat’s handoff.
- Tool access is not a reliable reviewer-role identifier.
- Blanket project-trust gating may unnecessarily suppress an explicitly user-owned handoff outside the repository.

**Safer contract:** separate provenance, authority, relevance and age. For trusted stale summaries, show a bounded “stale—revalidate” pointer rather than silently dropping continuity. Define explicit reviewer/non-writer behavior for **both pickup and compaction writes**. Preserve durable constraints in authoritative files.

Test constraint survival and writer isolation—not only “old file absent.”

### #3 — HIGH: Danger-first can remove legitimate exceptions and wedge headless work

The current config contract explicitly says `allowPatterns` skip gating entirely. The README demonstrates an exception for force-with-lease pushes.

What breaks:

- Moving every danger check before every allow rule effectively deletes that documented feature.
- Regex segmentation on `;`, pipes and newlines is not shell parsing: quoting, substitutions and heredocs matter.
- Existing benign false positives such as `echo reboot` remain.
- Protecting config and hook paths can prevent legitimate headless maintenance of those files.
- Error logging alone does not define what policy remains effective after malformed configuration.

**Safer contract:** distinguish a non-overridable floor from explicitly authorized exceptions; prevent one segment’s exception from authorizing another segment. Specify repair/approval behavior for config maintenance and malformed config. Test safe commands as well as dangerous ones.

Do not claim a complete shell security boundary.

### #4 — HIGH: Invocation counting is not review-round counting

What breaks:

- Sol and Astra reviewing the same revision could consume two rounds.
- Retries, quota failures and malformed outputs could exhaust the cap without any review.
- `pi-review` is also used to launch workers; those calls must not count as reviews.
- Renaming the item, changing cwd or splitting one defect into new items resets a naïve ledger.
- Concurrent launches can both reserve the final slot unless allocation is atomic.
- A per-process dollar cap can be multiplied by retries and replacement workers.

`DOCTRINE.md` explicitly says **infrastructure failure is not a review**.

**Required contract:** canonical item identity, revision/review-cycle identity, reviewer role, attempt versus completed verdict, atomic reservation/recovery, and auditable overrides. Preserve the existing instrument/implement-before-further-review escape rather than silently replacing it with “three calls.”

Also, a launcher’s `pipefail` does not govern shells subsequently started by the worker. Checking that a brief contains “foreground” does not enforce waiting. The observed `grep -c` exit-1 short-circuit is not fixed merely by adding `pipefail`.

Budget caps need a real installed-CLI test, lane-level accounting, stop-output preservation and an explicit distinction between dollar valuation, quota and elapsed time.

### #5 — HIGH: The proposal changes governance while presenting it as instrumentation

What breaks:

- Printing product and umbrella priorities without precedence creates conflicting instructions.
- Appetite expiry with automatic stop can interrupt already-authorized work.
- “Active products” adds a second lane-opening authority beside the existing one-priority-line rule.
- Checking the newest archive entry may credit an earlier session—or miss the current one, since the-hive’s archive is not consistently newest-first.
- A score-token target rewards ritual `CLEAR` labels rather than honest priority assessment.

**Safer contract:** Jake first rules on hierarchy and expiry. Then record the actual session’s priority relation, decision and score using session identity—not a grep of the first archive entry. Advisory failure should not block shutdown. A CANNOT marker must have a visible reader.

### #6 — MED: The proposed retrieval test can manufacture its own negative result

What breaks:

- Removing archives may remove the only record of decisions and prior failures unavailable in source.
- Changing the corpus before baseline measurement confounds the result.
- “No read within three turns” misses useful snippets, already-loaded material, delayed reads and other read tools.
- A required-open metric incentivizes pointless file reads.
- The stated **zero baseline** is a citation proxy, not measured read probability.
- Silent index failures remain outside the success-only pull log.

**Safer experiment:** first log attempts, failures and actually emitted pointers; measure the current system; compare archive chunking/filtering in shadow or randomized pull-on/off conditions. Use relevant opens and sampled decision/task effects, not opens alone.

Retain on-demand retrieval even if automatic injection fails the trial.

## D. Contradictions — FINDINGS

### D1 — HIGH: “No more review rounds” contradicts the mandatory landing invariant

The synthesis says:

> No more review rounds on the items above: every one has a deterministic test named.

`~/nana-agent-loop/AGENTS.md` requires **deterministic tests and an adversarial pass** for safety-gate, permission-wiring and lifecycle changes. `DOCTRINE.md` separately states that deterministic checks and code review are complements, not substitutes.

A test named in a proposal is neither a passing test nor an independent review of its implementation.

**Replace with:** no further speculative review of unchanged proposals; implement bounded slices, run the required tests, then obtain the required adversarial implementation review within the cap.

### D2 — HIGH: The synthesis implicitly un-defers a human-deferred test-ran gate

`~/nana-pi/HANDOFF.md`, Open #5, keeps `/nana-verify`/receipt-based completion gating deferred **until receipts prove felt-useful in dogfood**.

Items #8–9 propose completion machinery without preserving that dependency. Moreover:

- `/goal`, per `opus-research.md` H2, judges transcript text; it cannot independently inspect files or execute acceptance commands.
- Refusing another continuation is not necessarily a hard spending boundary for work already in progress.
- A “stop after N turns” phrase in a model-evaluated goal is not automatically an external turn counter.

Do not equate these mechanisms with deterministic `doneWhen` plus check-before-spend. Keep them trials, not replacements.

### D3 — HIGH: Item #9 can disable live closure obligations

The 09-04 assessment recommends silencing **dormant ledger lint**. The synthesis broadens this to gating SessionStart/Stop ceremony on “a governed run in the last 14 days.”

That predicate can hide:

- an older unclosed run;
- unresolved closure debt;
- a newly launched run after a dormant period.

`HANDOFF.md` still locks terminal-by-evidence and ceremony debt behavior. The shared subtraction rule also says an instrument-dead result is **not automatic deletion authority**.

Gate optional lint by dormancy if approved; preserve checks for active runs and unresolved obligations regardless of age.

### D4 — MED: “Only executed/cited findings BLOCK” is an unsafe acceptance policy

Evidence labels are useful. Automatic verdict permission from those labels is not.

A file citation can support a false causal claim. Conversely, a missing threat model, undefined ownership or absent acceptance requirement can justify a pre-build stop without executable code.

Use labels to require **adjudication**, not to prohibit consequential reasoning. For high-cost uncertainty, request a bounded probe or explicit risk ruling.

### D5 — MED: Some proposed metrics do not falsify the claimed mechanism

- **Three clean worker runs** do not establish that inconsistency is seat-level. At an 80% independent per-run success rate, three successes occur about **51%** of the time.
- **Raw discard count** can fall merely because fewer items are attempted. Measure avoidable rework per accepted/delivered item, elapsed time and blocked time.
- **Citation spread after pruning** changes with the denominator.
- **Cost-only output-cap evaluation** cannot detect deleted evidence or poorer task outcomes. Preserve full outputs, restore access and quality/safety checks.
- **Recurrence=2→mechanize** is a useful trigger for investigation, not an unconditional construction order. Jake’s subtraction rule requires outcome value.

## E. Open for Jake — FINDINGS

### E1 — HIGH: The first ask forces a conclusion before resolving the policy conflict

“Either way … contradicts OBJECTIVE.md” makes Jake choose between admitting mis-steering and editing the document. The legitimate third answer is that the **09-18 decentralization ruling changed the intended hierarchy** and the umbrella contract was not reconciled.

### E2 — MED: The list asks too much presentation work and omits consequential decisions

The seat should:

- deduplicate and rank the decision queue;
- prepare both short and full feel materials;
- propose a bounded WIP trial;
- choose test details and ordinary corrective implementation sequencing.

Jake should decide priority authority, permissible stopping behavior, platform commitment and whether deferred acceptance gating may reopen.

A replacement list, each answerable in one line:

1. **Priority authority:** “Does a product’s current priority govern approved product work, or must every new product lane also amend the umbrella priority?”
2. **Attention-limit trial:** “Approve a two-week limit of three active blocking asks across the program, excluding parked/optional items, without stopping previously approved independent work?”
3. **Expiry behavior:** “At an appetite boundary, finish the current safe unit and pause new spend pending renewal—yes/no?”
4. **Runner:** “Keep the runner dormant through the 10-02 meter; silence only dormant lint while retaining active-run/closure checks—yes/no?”
5. **Completion gate:** “Keep receipt-based stop blocking deferred until real dogfood, or authorize a bounded trial now?”
6. **Windows:** “Keep native Windows parity as a required deliverable, or explicitly narrow the supported experience?”
7. **Current bet:** “For the next bounded work period, is the priority toolkit reliability, the-hive, or another named product?”

Do not treat “no time to watch” as permission to infer product acceptance from a proxy.

## F. Blast radius — FINDING, HIGH

The following need deterministic tests **and an independent adversarial pass before landing**:

| Items | Surface | Minimum acceptance coverage |
|---|---|---|
| **#2 + #17** | Handoff trust, context injection, compaction writes, root resolution | Trusted/untrusted; root/nested/worktree; reviewer write isolation; stale live constraints; resume/fork/reload; symlinks; interrupted writes; no cross-project pickup |
| **#3 + #15** | Permission policy and shared config | Positive and negative command corpus; compound commands; shell/PowerShell forms; protected-path aliases; malformed config; explicit exceptions; interactive/headless recovery; **gate-survives-after mutation** |
| **#4 + #18** | Review authorization and subprocess lifecycle | Concurrent allocation; retries/infra failures; dual reviewers; renamed outputs/items; override validation; budget exhaustion; SIGINT; healthy silence; true hang; child-tree cleanup; native Windows |
| **#5 + objective part of #11** | Startup authority, config resolution, shutdown hooks | Cross-runtime golden corpus; precedence; missing/malformed/symlinked files; nested cwd; session-bound scoring; fail-open hook faults; visible CANNOT routing |
| **#8 + #9** | Stop/settle behavior, continuation, spending and hook removal | Real isolated launch; actual goal activation; bounded continuation; false completion text; stale/missing receipts; active-run closure after long dormancy; upgrade/desk-parser compatibility |
| **#12 output cap** | Tool-result/context mutation | Full-output preservation and recovery; evidence in truncated middle; private output handling; truthful truncation metadata; task-quality regression |
| **#16 + #19** | Checker command execution, hooks and platform lifecycle | Real builder path; trusted command source; timeout/abort; mutation-safe receipts; native Windows execution |

For #6 and #14, pure offline analysis needs ordinary tests. Wiring them into prompt-time execution also requires bounded subprocess, privacy, fail-open and lifecycle review.

**Do not combine these into one “small config lane.”** Shared files do not imply a shared acceptance contract.

---

## SCORE: 5/10

## MUST-FIX

1. Correct the priority-authority framing, handoff count and cap-bypass claim; restore the consequential lane caveats.
2. Delete the blanket “no more review rounds” instruction; preserve mandatory adversarial implementation review.
3. Specify safe contracts for items 1–6, especially handoff retention/writers, gate exceptions and review-round identity.
4. Keep `/goal` distinct from deterministic acceptance and hard budgeting; preserve the human-deferred receipt-gate decision.
5. Reorder work around concrete defects and dependencies: config safety, gate/handoff boundaries, canonical tests, objective authority, then instruments and trials.
6. Replace the Open-for-Jake list with explicit policy choices; do not auto-expire work or disable closure checks before those rulings.

## SHOULD

- Restore the pre-spend checkpoint, product decision reader, corrupt-index handling and real-builder verification path.
- Establish retrieval baseline before changing its corpus.
- Treat WIP and consistency claims as experiments, not proven diagnoses.
- Separate reviewer non-authorship from a ban on repair suggestions.
- Replace line-count estimates with costs including tests, compatibility and adversarial review.
- Preserve reranker latency/noise safeguards and full-output recovery requirements.

## VERDICT: BLOCK
