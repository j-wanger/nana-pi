# Project-management concepts applied to agent workflows — through the nana lens

*Opus 5.5 research lane, 2026-09-28. Brief: `brief-opus-pm.md`. 27 external sources read (fetched), 5 more seen as search summaries only (marked). Internal files read: OBJECTIVE, HANDOFF, operating-model, DOCTRINE (full), QUEUE/FRICTIONS heads, both 2026-09 session logs, the 09-16 spend audit, nana-pi HANDOFF, `templates/_shared/*`, shared MEMORY index, and — because no nana-pi or nana-agent-loop session entries exist after 09-18 — `~/the-hive/docs/sessions/2026-09.md` + `~/the-hive/OBJECTIVE.md`, where all 09-19…09-27 spend went.*

*Gap: the two wiki articles `ai-project-management*` do not exist on disk. The index lists them, but `agentic-engineering-wiki/` only has `raw/` scrapes (zenhub, kollabe, talent500, techademy, a Medium post; all vendor/marketing-grade). I did not re-cite those.*

---

## 0. The answer in five lines

1. **Nana's bottleneck is Jake's attention (rulings + feel checks), and nothing in the process limits the work queued in front of it.** Classic Kanban/TOC situation: work piles up waiting at the bottleneck, and the extra waiting turns into rework. The 3-round cap is a batch-size limit on the review stage only; it does not touch the bottleneck.
2. **"Autonomy up, consistency flat" is what flow theory predicts** when new work arrives faster than it gets accepted. Predictability comes from how the system runs (stable WIP, pull on capacity), not from a more capable worker. DORA 2025 says the same thing about AI: it amplifies the system you already have.
3. **The single priority line works like a Sprint Goal with no timebox or appetite, and no mechanism divides spend across repos.** 09-19…09-27: every session entry is in the-hive (whose objective line is still an unratified DRAFT). There are zero entries in nana-pi, the repo the umbrella priority names.
4. **Feel is the acceptance gate, but it runs after hardening instead of before.** The waste recorded in September fits Shape Up's "shape before you bet" and Agile principle 7 ("working software is the primary measure"). Hardening a surface before Jake has felt it is the largest avoidable cost.
5. **A lesson re-enters the next cycle only when it changes the standard work** (brief template, launch wrapper, check). A ledger alone does not do it. Nana's own record shows a lesson written to memory and to briefs recurring four days later.

---

## 1. Sources (read = fetched and read; grade)

| # | Source | Grade |
|---|---|---|
| S1 | Scrum Guide 2020, scrumguides.org | PRIMARY |
| S2 | Agile Manifesto, 12 principles, agilemanifesto.org/principles.html | PRIMARY |
| S3 | Kanban Guide v2025.5 (May 2025), kanbanguides.org | PRIMARY |
| S4 | Shape Up ch. 7 "Bets, Not Backlogs", basecamp.com/shapeup/2.1-chapter-07 | PRIMARY |
| S5 | Shape Up ch. 8 "The Betting Table" (six-week cycle, cool-down, circuit breaker) | PRIMARY |
| S6 | Shape Up ch. 13 "Show Progress" (hill charts) | PRIMARY |
| S7 | Toyota Production System page, global.toyota (jidoka, andon, JIT) | PRIMARY |
| S8 | Lean Blog, "No, One Toyota Worker Can't Stop the Whole Factory", 2026-06-29 (andon mechanics, citing Liker & Meier) | SECONDARY |
| S9 | Google SRE Book, "Postmortem Culture" | PRIMARY |
| S10 | Google Cloud blog, "Announcing the 2025 DORA report" (amplifier; throughput +, stability −) | PRIMARY (vendor research) |
| S11 | DORA AI Capabilities Model: the seven capabilities, via search summary of the DORA PDF + secondary write-ups (PDF not opened) | SECONDARY, list unverified at source |
| S12 | Anthropic Engineering, "Effective harnesses for long-running agents", 2025-11-26 | PRIMARY |
| S13 | Anthropic Research, "Measuring AI agent autonomy in practice", 2026-02-18 | PRIMARY |
| S14 | Anthropic Engineering, "How we built our multi-agent research system" | PRIMARY |
| S15 | Cognition, "Don't Build Multi-Agents", 2025-06-12 | PRIMARY (vendor opinion + practice) |
| S16 | METR, early-2025 developer RCT (arXiv 2507.09089; search summary) + METR "We are changing our developer productivity experiment design", 2026-02-24 (read) | PRIMARY |
| S17 | Cemri et al., "Why Do Multi-Agent LLM Systems Fail?" (MAST), arXiv 2503.13657, abstract | PRIMARY (abstract only) |
| S18 | Nguyen et al., AgileCoder, arXiv 2406.11912, abstract | PRIMARY (abstract only; numbers not read) |
| S19 | "Evaluating Classical Software Process Models as Coordination Mechanisms for LLM-Based Software Generation", arXiv 2509.13942 | PRIMARY (small study) |
| S20 | Beads README, github.com/steveyegge/beads (27.5k stars) | PRIMARY (tool docs) |
| S21 | Linear Docs, "AI Agents" (agents as delegates; human stays accountable) | PRIMARY (vendor docs) |
| S22 | GitHub Docs, Copilot coding/cloud agent (one PR per task, 59-min session) | PRIMARY (vendor docs) |
| S23 | Yuval Yeret, "Do WIP Limits Still Make Sense When Agents Write the Code?", 2026-07-22 | SECONDARY (one anonymized dataset) |
| S24 | Simon Willison, "Embracing the parallel coding agent lifestyle", 2025-10-05 | ANECDOTE (expert practitioner) |
| S25 | Ron Jeffries, "Story Points Revisited", 2019-05-23 | ANECDOTE (originator's opinion) |
| S26 | Ron Jeffries, "Dark Scrum", 2016-09-08 | ANECDOTE |
| S27 | whatmatters.com, OKR definition | SECONDARY (practitioner org) |
| S28–S32 (search summaries only, not fetched) | Reinertsen *Principles of Product Development Flow* (2009) summaries; Little's law / Vacanti summaries; Goldratt *Critical Chain* summaries; Scrum.org DoR anti-pattern posts; lessons-learned reuse literature (PMI 403'd) | SECONDARY, treat as unverified detail |

---

## 2. What nana's process is today, in PM terms (verified)

| PM construct | Nana artifact (verified) | Verdict |
|---|---|---|
| Product goal / sprint goal | `OBJECTIVE.md` objective + ONE current priority, printed at session start in both runtimes | Verified. No appetite, no end date, no key result |
| Backlog | `loops/QUEUE.md` (graduated machinery only, slug-audited). Products have none; "Open for Jake" lists are decision queues | Verified. The 09-16 audit: "the numbers are slots, not ranks" |
| Rolling plan | `HANDOFF.md` frontier + drop rule (ai4kanban) | Verified. nana-pi HANDOFF still headed "Landed today (2026-09-18)" ten days later, which breaks its own "never add a dated section" rule |
| Impediment log | `loops/FRICTIONS.md`: 6,030 lines, 2+ instances → graduate | Verified. Lint debt (91 overlong) "held until the loops-vs-pi ruling", which has been open since 09-04 |
| Lessons ledger | `loops/DOCTRINE.md` `[uses:N]`, 101/100 cap | Verified. 09-16 audit: 84% of entries cited ≤1 |
| Retrospective | Session close: CLEAR/STRETCH/CANNOT score + mechanize scan + asset test | Verified in the-hive entries ("Objective CLEAR / current engine priority CLEAR") |
| Timebox / WIP device | 3 review rounds per item (`pi-review` refuses r4 without `--over-cap`) | Verified in code path and in use ("v0.2 folded by the seat (no second round)") |
| Story format | "Spec the contract, not the design" (DOCTRINE pinned, uses:4) | Verified |
| Delivery unit | Headless Opus 5.5 worker per lane in a worktree + sol review + astra land | Verified: the-hive 09-22 "3 Opus 4.8 + 13 Opus 5.5 headless workers" in one day |
| Definition of Done | Land review + "seat verification — running the commands, not a review verdict" (the-hive OBJECTIVE rule) | Verified |
| Sprint review / demo | Jake's feel check | Verified, and chronically deferred: "Jake 09-27: 'No time to watch now'" |
| Product owner | Jake, rules by conversation | Verified |
| WIP limit across lanes / cycle-time measure / estimates / velocity | None | Verified absent |

---

## 3. Findings by question

Format per finding: **Claim** · Source · Grade · Nana today · Change · Cost · Cheapest test · DOCTRINE contradiction.

### Q1 — What transfers, what changes unit, what does not

**F1.1 Transfers unchanged: small batches, WIP limits at the human stage, a Definition of Done, pull on capacity, stop-the-line.**
- S3: "Kanban system members must explicitly control the number of work items in a workflow from started to finished… start work on an item only when there is a clear signal that there is capacity to do so." S12 (Anthropic harness) independently lands on the same controls for agents: "work on only one feature at a time"; a feature list with a `passes` field (a DoD); a startup routine that reads git log + progress file (a standup). S22: Copilot agent "can open exactly one pull request to address each task"; "consider breaking the work into smaller, more focused tasks". S11: "working in small batches" is one of DORA's seven AI-amplifying capabilities (list unverified at source).
- Grade: PRIMARY (S3, S12, S22).
- Nana today: DoD yes (land review + seat runs commands). Small batches yes per lane. WIP 1 per worker yes (one lane per worktree). **No WIP limit on the human stage** (see Q2).
- Change: none for DoD or per-worker WIP. Add the human-stage limit (Q2).

**F1.2 Transfers with a change of unit (the mapping the brief proposed, checked):**

| Classic | Agent-workflow unit | Status in nana | Evidence |
|---|---|---|---|
| Sprint (≤1 month, S1) | Priority cycle bounded by an **appetite** (S5: "the amount of time we want to spend… as opposed to an estimate") | Priority line exists, **appetite missing** | OBJECTIVE.md |
| Story points / estimate | Spend cap (July `maxCostUsd`) → now nothing (flat subscription) | Governor **lost** when the runner went dormant | 09-16 audit finding 4 |
| Daily standup | SessionStart hook (objective print + decisions collector) | Present | OBJECTIVE.md header; operating-model L4 |
| Retrospective (S1: "plan ways to increase quality and effectiveness") | Session-close score + mechanize scan | Present; **output is a ledger line, not a standard change** (Q5) | HANDOFF §How to update |
| DoD | Land review + seat-run receipts | Present, strong | the-hive OBJECTIVE rules |
| Sprint review / demo | Feel check | Present but **async and optional**, so it slips | the-hive 09-27 |
| Backlog refinement | FRICTIONS → QUEUE graduation | Present for machinery only; stalled | FRICTIONS lint debt held since 09-06 |
| Velocity | Throughput of items **landed AND felt** | Absent | — |
| Hill chart (S6: uphill = figuring out, downhill = executing) | "Contract/plan review" vs "lane build" phases | Implicit (astra plan review → lanes) | the-hive PK5–PK8 |

**F1.3 Does not transfer, and why.**
- **Student syndrome / Parkinson's law (the core of Goldratt's critical chain)**: agents don't procrastinate. The failure agents do have is the opposite, over-ambition: S12 "attempted to one-shot the app", and premature "declare the job done". The buffer logic transfers to Jake's time, not to agent time. Grade: S12 PRIMARY; critical-chain details SECONDARY (S28–S32 summaries).
- **Principle 6, face-to-face conversation (S2)**: for executors the written brief is the only channel (S15 principle 1: "Share context, and share full agent traces, not just individual messages"). For the PO it still holds: Jake rules by conversation. So nana needs two channels, and the seat translates between them. Nana already does this (plain-language memory; "questions in the game's own words", the-hive 09-24).
- **Principle 11, self-organizing teams (S2)**: DOCTRINE (uses:2) records that "a capable worker that diagnoses a REAL flaw in a pinned clause implements and self-authorizes the fix". S17 places specification/system-design issues first among MAS failure categories (abstract; the percentage split is unverified). Self-organization of executors is a risk, not a feature. Organization belongs to the contract.
- **Team learning without written deposit**: agents retain nothing (S20 Beads calls it the "50 First Dates" problem, via search summary). Tacit knowledge transfer, the invisible half of agile learning, is zero. Everything must be written AND read at the point of use (Q5).
- **Estimation**: re-planning costs almost nothing for agents but not for Jake's attention. Estimates are unnecessary; appetite (a cap chosen by value) replaces them. S25: Jeffries on story points: "if I did, I'm sorry now". His reasons are comparison, estimate-tracking, "more, more, more".
- **Sustainable pace (principle 8)**: irrelevant for agents, **binding for Jake**. The pace that has to be sustainable is the PO's review pace.

Cost of all F1: none (framing). DOCTRINE contradiction: none.

### Q2 — Flow control: WIP, batch size, Little's law, cost of delay

**F2.1 The constraint moved to human attention; set WIP limits there.**
- S23 (Yeret, 2026-07-22): "the human version of a context window is shared across every thread we are juggling"; solo starting point is "one actively guided feature maximum", a second only when the first runs autonomously toward a clear goal. S24 (Willison): "the natural bottleneck on all of this is how fast I can review the results." S13: experienced users shift to "being in a position to intervene when it matters". S8: Toyota's andon only works because a responder arrives within the cycle; "you should not implement stop-the-line until that support structure exists".
- Grade: S13 PRIMARY; S23 SECONDARY (one dataset); S24 ANECDOTE; S8 SECONDARY.
- **Nana today (counted from files):** items waiting on Jake. nana-agent-loop HANDOFF "Open for Jake": 8 numbered + 3b, and item 4 alone holds 7 rulings (≈20 rulings). The oldest is the loops-vs-pi ruling, open since 09-04 (**24 days**). nana-pi HANDOFF: 6. the-hive: the watch + c48/c50/c51/c53 + bloodlust values, and its own OBJECTIVE is still "DRAFT… Jake to ratify" after 10 days. Roughly 30+ open human decisions. Meanwhile the-hive ran 13 headless workers on one day (09-22) and 2–3 parallel lanes per PK slice through 09-27.
- Inferred (Little's law, WIP = throughput × wait time): Jake's rulings/feel throughput is fixed, so more work waiting on him means longer waits, and work proceeds on unratified premises. That is already in the log: "A3's removal of subsidized offers turned round 3's Kai–Noor exhibits into artefacts (row_wrong)" (the-hive 09-25); "Three of the four PK3-era round-2 picks are VOID on the PK4 tree" (09-23). The 09-16 audit's second overspend shape ("build before direction settles", three one-day discards) is the same mechanism.
- **Change:** a WIP limit on the human stage, per repo: **≤3 open items awaiting Jake** (ruling, feel check, ratification). When the limit is reached, the seat may not open a new build lane in that repo. Allowed work: consume the queue (compose decisions, cheap feel proxies like the aml-desk screenshot walk, instruments, subtraction). Kanban's "stop starting, start finishing".
- Cost: **S** (one HANDOFF rule + the existing `loop-status --decisions` collector counts markers; the limit is a number).
- Cheapest test: for 2 weeks, log per repo (a) open-for-Jake count daily and (b) artifacts voided/discarded after landing. Falsified if the discard/void count does not fall relative to September (baseline: ≥3 one-day discards in 09-06…09-09 per the audit; ≥2 voided exhibit sets 09-23…09-25).
- DOCTRINE/memory contradiction: memory `feedback_substance_before_machinery` says "loop until replicated, don't ask between loops". Reconcile: that rule governs investigation inside a lane. The WIP limit governs **opening** lanes. No conflict if written that way.

**F2.2 The 3-round cap is the right control for what it controls, but it is a proxy for missing flow measures.**
- S5 circuit breaker: "If they don't finish, by default the project doesn't get an extension." The cap is exactly this at the review stage. Evidence it works: aml-desk 09-16 "the cap forced the seat to RULE rather than re-review, which is the cap's purpose". the-hive PK5–PK8: plan r1 BLOCK → "v0.2 folded by the seat (no second round)", repeated.
- But S3 names four measures (WIP, throughput, work item age, cycle time). Nana measures **none** of them. Round count is a per-item effort count and says nothing about time, queue, or age. The loops-vs-pi ruling's 24-day age appears nowhere as a number.
- Grade: S3, S5 PRIMARY; nana evidence PRIMARY (files).
- Change: keep the cap. Add **work-item age** for every Open-for-Jake item (date opened, already present in most lines) and **lane cycle time** (lane launch → land, both already timestamped in the-hive logs). Print the oldest age at SessionStart next to the objective.
- Cost: **S–M** (the collector already parses markers; adding a date field + age sort is a small script).
- Cheapest test: run the age computation once by hand over the three HANDOFFs today. If no item is older than 7 days, the measure adds nothing. The prediction is it will show ≥5 items >14 days.
- DOCTRINE: "Iterated dual land review converges… budget rounds, not hope" (uses:6, 6 rounds 44→0) predates and conflicts with the 09-16 cap. Mark it superseded-in-scope (design docs pre-cap) so specs don't cite it for a 4th+ round.

**F2.3 Over-parallelization is real at the integration seam, not only at the human seam.**
- S14: multi-agent uses "about 15× more tokens than chats"; unsuitable where tasks "share the same context or involve many dependencies", and "most coding" has "fewer truly parallelizable tasks". S15 principle 2: "Actions carry implicit decisions, and conflicting decisions carry bad results."
- Nana evidence of parallel lanes making conflicting implicit decisions: the-hive 09-24 "the notice roll… produced a second definition of 'seen' in four observation paths" (caught only by astra's integrated land ruling); "the stranger-help lane drew the same key-collision defect sol had found in the protective candidate before"; 09-08 returner "one's `git checkout` wiped the other's uncommitted bible lines"; 09-09 scratchpad `run-suite.sh` overwrite; fixed-port EADDRINUSE across three lanes; 09-16 merged-suite race needing a 5-worktree bisect.
- Grade: S14, S15 PRIMARY; nana evidence PRIMARY.
- Change: a lane brief names the **shared terms** it touches (e.g., "seen", candidate key). Two lanes may run in parallel only if their shared-term sets are disjoint, or one lane owns the definition and the other consumes it.
- Cost: **S** (brief template line) → **M** if linted.
- Cheapest test: over the next 5 multi-lane slices, count integration-stage BLOCKs caused by divergent definitions. Baseline ≥2 in PK4 alone.
- DOCTRINE: none contradicted. Extends "One producer per piece of mechanical evidence; one writer per worktree" (HANDOFF decisions-locked) to one owner per definition.

**F2.4 Cost of delay is unpriced; waiting items are unranked.**
- Reinertsen (S28, secondary summary): cost of delay is the key sequencing variable; WSJF = CoD ÷ duration; queues are invisible. The utilization/queue curve (80→90% doubles the queue) is standard queueing math.
- Nana: "Open for Jake — every pending ruling, one place". Unranked; 3b spliced in (the audit).
- Change: each Open-for-Jake line carries **what it blocks** (a lane, a product, nothing). Order by that. Jake reads the top 3. No numeric CoD; a two-class split (blocks-work / doesn't) is enough.
- Cost: **S**. Test: time-to-ruling on blocks-work items vs the rest over 2 weeks.
- DOCTRINE: none.

### Q3 — Planning cadence and horizon

**F3.1 The single priority is a Sprint Goal without a sprint.**
- S1: "The Sprint Goal is the single objective for the Sprint… fixed length events of one month or less". Only the PO can cancel. S5: fixed six-week bet + two-week cool-down + betting table + no extension by default. S4: "There's no 'grooming' or backlog… Just a few good options to consider"; "Really important ideas will come back to you." S27: OKRs pair an objective with "measurable and verifiable" key results, typically quarterly, "3-5 supporting Key Results".
- Grade: PRIMARY (S1, S4, S5); SECONDARY (S27).
- Nana today: objective + priority "since 2026-09-16", no end, no appetite, no key result. The 09-16 audit showed NORTHSTAR went stale because its build program **finished and nothing replaced it** (CLEAR fell 23/24 → 4/39). A priority with no end date repeats that failure mode.
- **Evidence the layered design leaks:** the umbrella priority is "make the nana-pi experience consistent". nana-pi's last session entry is 09-18, and its HANDOFF "Next #3 — let the objective line + knowledge pointers run a week of pull.log, then decide the citation checker" is still open at day 12. Every 09-19…09-27 entry is in the-hive, scored against the-hive's own (unratified DRAFT) priority. The umbrella rule "a new lane opens only by editing the priority line" is sidestepped by per-repo OBJECTIVE files. Nothing decides **which repo's priority gets the week**. Inferred: this is the portfolio decision Shape Up's betting table exists for.
- **Change:** (a) every priority line gains `appetite:` (calendar days or worker-days) and `review on:` (a date). At expiry the default is **stop** (ship what's there, reshape, or drop), never extend. (b) The umbrella OBJECTIVE carries one extra line: **active product(s) this cycle**, chosen by Jake at a betting moment (the next time he sits). A product session outside the active set scores STRETCH on the umbrella by rule.
- Cost: **S** (template + three files).
- Cheapest test: after one cycle, does every session entry name a cycle whose appetite has not expired? Does Jake make an explicit bet (yes/no)? Falsified if Jake finds the betting moment a burden (his feel verdict).
- DOCTRINE: none. Template `_shared/OBJECTIVE.md` needs the fields.

**F3.2 The right horizon: short bets at Jake's attention cadence, not calendar sprints.**
- S13: autonomy per session nearly doubled (<25 → >45 min at the 99.9th percentile) in three months; experienced users auto-approve more (20% → 40%+) **and** interrupt more (5% → 9%). S2 principle 3: "shorter timescale". S5: the appetite is set by how much the problem is worth, not by how long it will take.
- Inferred for nana: the horizon should match the PO's feel cadence (days to a week), not agent capacity (which is effectively unlimited under a flat subscription). One bet = one felt result. The-hive's T1→T4 sequence ran ~9 days with the human observation still not performed ("Jake 09-27: No time to watch now"). By the end of that bet the product had not been felt.
- Grade: PRIMARY for S13 numbers; the horizon recommendation is INFERRED.
- Change: the appetite from F3.1 is set in **felt results**: "the bet ends when Jake has felt X, or at N days, whichever comes first".
- Cost: S. Test: fraction of bets ending with a feel verdict recorded (target >50%; the-hive M0, M1, T4 all ended without one).

**F3.3 OKR-style key results for the nana-pi priority.**
- S27: KRs "measurable and verifiable. You either meet a Key Result's requirements or you don't."
- Nana: "consistent, coherent and effective" has no KR. The one instrument built for it (`pull.log` → citation checker) has not been read in 12 days (nana-pi HANDOFF Next #3). Unverified whether pull.log has data; `~/.pi` is outside my read scope.
- Change: 2–3 KRs, each from an existing meter: (1) share of sessions scoring CLEAR on the umbrella priority; (2) pull.log pointer-to-citation rate; (3) count of items discarded/voided after landing (rework).
- Cost: S. Test: whether the next umbrella-priority review can be answered from numbers.

### Q4 — Feedback loops: what forms produce the change they promise

**F4.1 Acceptance-by-feel must come before hardening, not after.**
- S2 principle 7: "Working software is the primary measure of progress"; principle 1: "early and continuous delivery". S6: uphill work (figuring out) should be de-risked before downhill (execution). S11: DORA lists "user-centric focus" as a capability. Search summaries report teams without it see **negative** AI impact (unverified at source).
- Nana evidence: aml-desk 09-18, Jake's first look: "way overbuilt before the shape was confirmed … two days of persistence/receipt hardening (nine sol rounds) preceded the first look." The seat's own lesson after that: "a screenshot walk is a cheap, honest feel proxy the seat can run before Jake sits down — both findings it surfaced would have been his first two complaints" (09-17). The 09-16 audit: 7 pi rounds on a sprite plan Jake then discarded; the "wire" feature removed two days after landing; 30 story docs through ~20 rounds then swept to a new setting.
- Grade: PRIMARY (S2, S6, nana logs); S11 SECONDARY.
- Change: order the gates **felt (or proxy-walked) → hardened → reviewed** for every user-facing surface. Review rounds and hardening lanes on a surface require a recorded feel verdict or a proxy walk the seat sent Jake. Exempt: gate/safety code (DOCTRINE pinned lines keep their diverse-review rule). The template already says "surfaces are feel-validated by use" (`_shared/OBJECTIVE.md`) but does not **order** it.
- Cost: **S** (one rule line + brief template).
- Cheapest test: count hardening/review rounds spent on surfaces later reshaped by Jake's first look. Baseline: aml-desk 9 rounds; returner `src/play/` 6 rounds; sprite plan 7.
- **DOCTRINE contradiction:** "Never seat the human at a first integration — five live takes surfaced two production defects before the flow was worth a human's time" (uses:1). Reconcile: that line is about defects wasting human time; this one is about direction. The seat runs the proxy walk first (satisfies the doctrine), then Jake feels it **before** hardening.

**F4.2 The demo only works if it happens: a feel check needs to be cheap enough to fit Jake's slot.**
- S1: sprint review is a fixed event, not optional. S8: andon works only because "someone… actually come[s]. Quickly."
- Nana: the-hive's watch was prepared (`round4/WATCH-OFFER.md`) and declined for lack of time. HANDOFF item 2 (feel check on basketball/edge desks) has been open since early September.
- Inferred: the feel ask is sized for a sit-down session, so it loses to Jake's other time. A 5-minute composed ask (one screen recording or 3 screenshots + one question) fits more slots.
- Change: every feel ask ships in two sizes, a ≤5-min async version (screenshots/recording + one yes/no/which question) and the full walk. Cost: S. Test: feel-verdict latency before/after.

**F4.3 "Autonomy rose, consistency didn't" matches the flow and DORA predictions.**
- S10: AI adoption now has a positive relationship with throughput and "continues to have a negative relationship with software delivery stability"; "AI doesn't fix a team; it amplifies what's already there." Little's-law predictability (S29, secondary) requires arrivals ≈ departures and stable WIP.
- Nana: arrivals (20/39 September entries open with a Jake redirect; lanes opened daily) exceed departures (items accepted by feel). More autonomy raised arrivals and in-lane throughput without adding acceptance capacity.
- Grade: S10 PRIMARY; mapping INFERRED.
- Change: F2.1 + F3.1 + F4.1 are the causal fix. Measure consistency as **rework rate** (voided/discarded after land) and **feel-verdict rate**, not as round counts.
- Cost: bundled. DOCTRINE: consistent with "steering buys gate-COMPLETION, not quality" (uses:2). Rounds are steering.

**F4.4 METR as a caution on "feel" as the only meter, weakly.**
- S16: early-2025 RCT: experienced devs forecast −24% time and reported −20% afterwards, yet were measured +19% slower. METR's 2026 update says its newer data are "an unreliable signal" (selection bias; late-2025 raw −18% CI −38%…+9%). Do NOT cite the 19% as current productivity.
- What survives: **self-perception of speed was wrong in direction** in 2025. Applies to the seat's own "this lane went well" as much as to Jake.
- Change: none to Jake's felt joy/control (memory `feedback_joy_control_north_star` rules it out of evals). Apply the caution to **seat-reported** efficiency: report cycle time and rework from records, not impressions. Cost S.

### Q5 — Impediments and knowledge: where ledgers stop being read

**F5.1 Lessons re-enter only through standard work at the point of use.**
- S9: "An unreviewed postmortem might as well never have existed", and postmortems must yield "effective preventive actions". S12: the agent harness puts lessons in files the startup routine **reads every session** (progress file, feature list, `init.sh`). S20: Beads uses "semantic 'memory decay'" to summarize old closed tasks. Lessons-learned literature (S32, search summaries): repositories fail because lessons are not delivered "when and where they are needed" ("project amnesia"). SECONDARY, unverified detail.
- Nana evidence of a lesson written and still recurring: the-hive 09-22 lesson "headless `claude -p` workers end their turn when they background a long command… briefs now forbid it", also in shared memory (`reference_claude_cli_headless_isolation`, "09-22"). On 09-26: "lane B's first fix turn exited waiting on backgrounded work — the print-mode rule again". Also 09-26: "three worker launches short-circuited behind a `grep -c` exit code", the same class as memory `feedback_no_pipes_before_commit` ("twice committed red on 09-20").
- DOCTRINE: 84% of entries cited ≤1 (09-16 audit); at 101/100 with consolidation "held".
- Grade: S9, S12 PRIMARY; nana evidence PRIMARY.
- Change: a lesson is **closed** only when it changes something executed or read at the moment of risk: the launch wrapper (refuse a brief lacking the foreground rule; `set -o pipefail` in the launcher), the brief template, a hook. A lesson that recurs after being written graduates straight to a mechanism (**recurrence = 2 → mechanize**, the FRICTIONS 2+ rule applied to doctrine and memory). Toyota's framing (jidoka, S7: equipment detects the abnormality and stops) is the model: the check lives in the machine, not in the worker's memory.
- Cost: **M** (a launcher script for headless workers, which the-hive already partly has; one lint).
- Cheapest test: grep the-hive + nana logs for the two recurring classes over the next 2 weeks. Zero recurrences after the wrapper = pass.
- DOCTRINE: fits "A lesson in a commit message is a lesson that dies" (pinned) and extends it: **a lesson in a ledger alone also dies**. Verify-the-act (uses:2) is the same principle.

**F5.2 Impediment logs need decay; FRICTIONS is past the point of being read.**
- S4: "Backlogs are a big weight we don't need to carry… time spent constantly reviewing, grooming and organizing old ideas prevents everyone from moving forward". S20: memory decay.
- Nana: FRICTIONS.md is 6,030 lines. Its graduation vehicle (governed runs) has been dormant since 08-25. Product frictions (the-hive's) land in the-hive's HANDOFF "ops" lines instead. The L2 loop ("built — nothing to add", operating-model) has had no landing vehicle for a month. The adopted drop rule is applied to HANDOFF but not to FRICTIONS or DOCTRINE.
- Change: apply the HANDOFF drop rule to FRICTIONS and DOCTRINE now, not "when the loops-vs-pi ruling lands". Epoch-marker FRICTIONS (mechanism exists); consolidate DOCTRINE per the operating-model's own designed pass at ~85 entries (it is at 101).
- Cost: **S–M** (the curator pass is designed; it needs a session).
- Cheapest test: after pruning, does the next month's session log cite a FRICTIONS/DOCTRINE entry more often than September's (84% ≤1)?
- DOCTRINE: the operating-model's own consolidation rule is the thing not being executed. No contradiction, a compliance gap.

**F5.3 `[uses:N]` measures citation, not re-entry; add a "prevented" signal.**
- Nana's operating-model already names the flaw: "`[uses:N]` measures citation, not continued truth". Inferred: the missing signal is whether a lesson **prevented** its failure class. The ai4kanban `decisions-stood / decisions-overruled` meter (sessions 09-06) is the analog.
- Change: when a lane hits a DOCTRINE failure class anyway, record `[hit:N]` beside `[uses:N]`. A high-use, high-hit entry is prose that isn't working, so mechanize it (F5.1).
- Cost: S. Test: after a month, do any entries show hits>0? If none, the class-tagging is not being done.

### Q6 — Roles when the team is models

**F6.1 Jake is PO and the only stakeholder; the seat must do the PO's ordering work and Jake ratifies.**
- S1: the PO is accountable for "Ordering Product Backlog items" and ensuring it is "transparent, visible and understood". S21 (Linear): "The human assignee remains responsible for the issue, even after delegation to an agent."
- Nana: the 09-16 audit found lane selection is Jake's, but "it never ranks the lanes it holds, never costs the lane it leaves, and never closes one before opening the next." Nobody does ordering.
- Change: the seat owns **proposing** order and cost (F2.4) and the WIP limit (F2.1); Jake owns the bet (F3.1). That is the scrum-master/PO split: the seat as flow steward, Jake as value decider.
- Cost: S. Test: every HANDOFF "Open for Jake" list is ordered with a one-word reason, checked at session close.

**F6.2 Who says stop: agents can stop, the cap stops reviews, nobody stops lanes.**
- S1: "Only the Product Owner has the authority to cancel the Sprint." S7/S8: the worker pulls andon, the leader responds within the cycle, and the line stops at a fixed position only if the problem isn't resolved. S13: "On the most complex tasks, Claude Code stops to ask for clarification more than twice as often as humans interrupt it."
- Nana: agent-initiated stops exist ("**Stopped for Jake's dispositions**", the-hive 09-25). Round-cap stops exist. **No lane-level stop** on appetite or on waiting-on-Jake (F2.1/F3.1 add it). Jake's stop is conversational and unmeasured (response latency not recorded).
- Change: the andon analog is the WIP limit reached → a composed ask to Jake. Record ask→ruling latency. Per S8, don't expect Jake to respond "within takt". Size the queue to his cadence.
- Cost: S. DOCTRINE: none.

**F6.3 Human-in-the-loop cadence: be positioned to intervene, not approve each action.**
- S13: "Effective oversight doesn't require approving every action but being in a position to intervene when it matters."
- Nana: aligned already (headless workers, seat verification, review ladder, decisions collector). The gap is not approval frequency but **decision latency at the product level** (F2.1).
- Change: none beyond F2.1/F4.2.

### Q7 — Anti-patterns and their agent-workflow equivalents

| Classic anti-pattern | Agent-workflow equivalent | Nana evidence | Guard today | Gap |
|---|---|---|---|---|
| Velocity as productivity / estimates as commitments (S25) | **Review rounds or review scores as progress** ("8/10 LAND") | 100+ September rounds; entries report rounds and scores prominently | 3-round cap | Report landed-and-felt, rework, age instead |
| Dark Scrum: ceremony used for control (S26) | Ceremony that grows without a reader: session logs as reporting | the-hive entries run 1–2k words per bullet; operating-model rates `docs/sessions/` as "exempt, read path = archaeology"; the-hive log breaks its own newest-first rule (09-23 evening…09-27 appended at the bottom) | asset test | Cap the entry size; the reader is the next session, so keep it to what it needs |
| Stage-gate Definition of Ready (S31, Scrum.org posts; secondary) | Contract rounds before any build (astra plan r1 BLOCK on each PK) | PK5–PK8 each plan r1 BLOCK 5/10–7/10 → fold, no r2 | cap | OK as is; the cap stops it hardening into a gate |
| Hidden queues (Reinertsen) | "Open for Jake" lists, unaged and unranked | ≈30 items, oldest 24 days | none | F2.1/F2.2/F2.4 |
| Process theatre | New machinery per failure | operating-model "complexity RATE is the watch item"; subtraction test | subtraction test | Working as designed |
| Goodhart on DoD | Worker games the doneWhen | DOCTRINE: autouse fixture disarming coverage; the seat restated a failed gate on p99 | independent review, disarm experiment | Strong already |
| Local optimization of a non-bottleneck (TOC) | Faster/more lanes while acceptance is the constraint | 13 workers/day, watch declined | none | F2.1 |

---

## 4. (a) Top 10 changes, ranked by (payoff × confidence) / cost

| # | Change | Payoff | Conf. | Cost | Cheapest falsifying test |
|---|---|---|---|---|---|
| 1 | **WIP limit ≤3 "awaiting Jake" items per repo; at the limit no new build lane, only queue-consuming work** (F2.1) | H | M-H | S | 2 weeks: voided/discarded-after-land count vs September baseline; falsified if unchanged |
| 2 | **Feel/proxy-walk before hardening and review rounds on user-facing surfaces** (F4.1) | H | H | S | Rounds spent on surfaces later reshaped by first look; baseline aml-desk 9, sprite 7, `src/play/` 6 |
| 3 | **Appetite + review date + no-extension default on every priority line; umbrella names the active product(s)** (F3.1, F3.2) | H | M | S | After one cycle: did Jake make an explicit bet, and did the cycle end with a feel verdict? |
| 4 | **Age and order the Open-for-Jake lists by what each item blocks** (F2.2, F2.4, F6.1) | M-H | H | S | Hand-compute ages today; prediction: ≥5 items >14 days. If none, drop the measure |
| 5 | **Two-size feel asks (≤5-min async + full walk)** (F4.2) | M-H | M | S | Ask→verdict latency before/after; the-hive watch as first case |
| 6 | **Recurring lesson → mechanism: headless-worker launcher enforcing foreground + pipefail; "recurrence 2 = mechanize"** (F5.1) | M | H | M | Zero recurrences of the two classes in 2 weeks |
| 7 | **2–3 KRs for the nana-pi priority from existing meters** (F3.3) | M | M | S | Next priority review answered from numbers, yes/no |
| 8 | **Lane briefs declare shared terms; parallel only if disjoint or one owner** (F2.3) | M | M | S→M | Integration BLOCKs from divergent definitions over next 5 multi-lane slices (baseline ≥2 in PK4) |
| 9 | **Run the designed DOCTRINE consolidation + FRICTIONS epoch cut now** (F5.2) | M | M | S-M | Citation spread next month vs 84% ≤1 |
| 10 | **`[hit:N]` beside `[uses:N]`** (F5.3) | L-M | M | S | Any hits recorded in a month; none = class-tagging not happening |

Explicitly **not** recommended: sprints, story points, velocity, estimates, standup ceremonies, a board UI (the 09-06 ai4kanban verdict stands: "two desks built and unfelt"; S20/S21-style boards add surface without addressing the constraint).

## 5. (b) Refuted / unverified ledger

- ✗ **"Any Toyota worker can stop the whole line."** Refuted by S8 (Liker & Meier via Lean Blog): the pull signals a team leader; the line stops only at a fixed position if unresolved. Use this version in nana analogies.
- ✗ **METR "AI makes developers 19% slower" as a current estimate.** METR's 2026-02-24 update calls newer data unreliable. Only the early-2025 perception gap survives.
- ? **MAST category percentages (41.77 / 36.94 / 21.30).** From a secondary summary; the arXiv abstract names categories "system design issues / inter-agent misalignment / task verification". Unverified.
- ? **"AI-generated PRs wait 4.6× longer; 67.3% fail first review."** Vendor/search-snippet only. Unverified; not used.
- ? **DORA seven capabilities list and "teams without user-centric focus see negative AI impact."** From search summaries of the DORA PDF; PDF not opened.
- ? **Reinertsen figures ("85% of PMs can't quantify CoD", "2% measure queues").** Secondary summaries of the book. Not used as evidence.
- ? **AgileCoder "surpasses ChatDev/MetaGPT".** Abstract claim, numbers not read.
- ? **arXiv 2509.13942 (agile vs waterfall in MetaGPT):** agile ≈2.2× tokens, ≈3.8× time, better defect detection. Small models, 11 toy projects, 132 runs. Directionally "iteration buys quality at cost"; too small to size anything for nana.
- ? **OKR 0.7 "sweet spot" grading.** Not in the fetched source; not used.
- ? **Andon pull counts (2,000/week vs 5,000/day at Georgetown).** Inconsistent across snippets; not used.
- ? **pull.log contents.** Outside my read scope; whether the citation checker has data is unverified.
- Gap: the `ai-project-management*` wiki articles referenced in the index do not exist on disk.

## 6. (c) VERDICT

VERDICT: DONE

Most likely wrong (bet against these first):
1. "Roughly 30+ open human decisions". I counted list items and sub-rulings by hand across three HANDOFFs; some may already be resolved in conversation and not yet dropped.
2. "Zero nana-pi session entries 09-19…09-27 means the umbrella priority got no spend". nana-pi work could have happened inside the-hive or in unlogged sessions; I could not read git history (blocked).
3. The WIP limit of ≤3 per repo is a chosen number, not derived. The right figure could be 1 (Yeret's solo guidance) or 5.
4. "Voided exhibits and discards are caused by queueing at Jake" (Little's-law inference). Some of these voids are normal learning from engine changes and would happen at any WIP.
5. "DORA lists user-centric focus, and its absence makes AI negative". This rests on search summaries, not the DORA PDF.
