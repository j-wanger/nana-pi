# The requirements tree — what Jake agrees before any row moves (checkpoint 1)

*Generated 2026-10-09 from `tree.json` (the checkpoint input) and `REQUIREMENTS.md` at 5b68a91. `tree.json` is astra's draft (`mapping-astra.json`) with the seat's three deviations applied: all 22 G rows in FEAT-033; R-285 and R-286 in FEAT-006; subgroups renumbered flat (SUB-001 to SUB-021). Names and purposes are astra's, unedited. Renaming a heading here is a JSON edit; after the move it is a heading edit.*

## Purpose (proposed: Jake's own words, 2026-10-09)

A customized agentic coding experience that can be used for any development project, and makes development more controlled, robust and effective. Objective (`~/nana-agent-loop/OBJECTIVE.md`): build products with agents, with nana-pi as the shared toolkit and experience.

## Outcomes (proposed: astra's draft)

1. **Understand what the product enables.** Find a capability, understand why it matters, and reach its relevant obligations without reading the whole ledger.
2. **Delegate one coherent change.** Distinguish the agreed increment from adjacent discoveries, blockers and future work.
3. **Accept a change with useful evidence.** See the behavior changed, the requirement delta, the candidate revision, the checks performed and the remaining uncertainty.
4. **Reuse the experience across projects.** Adopt the appropriate workflow and controls without an unrelated toolchain migration.
5. **Continue without reconstructing history.** Resume the current goal, scope, decisions and evidence with the right context available.

## The 38 features at a glance

Frozen = rows from the old desk and stage sections (desk work is paused until the 10-23 usage ruling). Idle = rows from the old bench sections (no ruling; simply not in use).

| Capability | Feature | Rows | implemented / untested / violated / retired or planned | Frozen or idle |
|---|---|---|---|---|
| CAP-01 | FEAT-001 · Keep goals and priorities in view | 23 | 23 / 0 / 0 / 0 | — |
| CAP-01 | FEAT-002 · Resume decisions and next actions | 62 | 54 / 8 / 0 / 0 | — |
| CAP-01 | FEAT-003 · Index and connect existing knowledge sources | 35 | 19 / 16 / 0 / 0 | — |
| CAP-01 | FEAT-004 · Retrieve relevant context with provenance | 31 | 15 / 16 / 0 / 0 | — |
| CAP-01 | FEAT-005 · Communicate decisions clearly | 16 | 16 / 0 / 0 / 0 | — |
| CAP-02 | FEAT-006 · Launch builders with execution limits | 15 | 14 / 1 / 0 / 0 | — |
| CAP-02 | FEAT-007 · Review a specific revision independently | 74 | 44 / 28 / 0 / 2 | — |
| CAP-02 | FEAT-008 · Integrate and clean up reviewed changes | 7 | 7 / 0 / 0 / 0 | — |
| CAP-03 | FEAT-009 · Decide which project content is trusted | 31 | 29 / 2 / 0 / 0 | — |
| CAP-03 | FEAT-010 · Guard risky commands and protected resources | 45 | 37 / 6 / 0 / 2 | — |
| CAP-03 | FEAT-011 · Keep policy changes safe and recoverable | 36 | 34 / 2 / 0 / 0 | — |
| CAP-03 | FEAT-012 · Render paths and provenance clearly | 21 | 21 / 0 / 0 / 0 | — |
| CAP-04 | FEAT-013 · Install and connect harness runtimes | 83 | 52 / 31 / 0 / 0 | — |
| CAP-04 | FEAT-014 · Create or adopt a project workspace | 61 | 52 / 9 / 0 / 0 | — |
| CAP-04 | FEAT-015 · Diagnose the active environment | 31 | 29 / 2 / 0 / 0 | — |
| CAP-04 | FEAT-016 · Start the local development desk | 24 | 15 / 9 / 0 / 0 | frozen 38% |
| CAP-04 | FEAT-017 · Inspect durable state and follow restoration steps | 6 | 6 / 0 / 0 / 0 | — |
| CAP-04 | FEAT-018 · Update or remove managed components safely | 19 | 19 / 0 / 0 / 0 | — |
| CAP-04 | FEAT-019 · Release usable templates and report support | 13 | 11 / 2 / 0 / 0 | — |
| CAP-05 | FEAT-020 · Find and read previous sessions | 14 | 8 / 6 / 0 / 0 | frozen 100% |
| CAP-05 | FEAT-021 · Choose and start an agent session | 11 | 6 / 5 / 0 / 0 | frozen 82% |
| CAP-05 | FEAT-022 · Steer and recover live sessions | 25 | 10 / 12 / 3 / 0 | frozen 88% |
| CAP-05 | FEAT-023 · Inspect changes and receive useful notices | 32 | 20 / 12 / 0 / 0 | frozen 41% |
| CAP-05 | FEAT-024 · Edit session and project settings safely | 7 | 5 / 2 / 0 / 0 | frozen 71% |
| CAP-06 | FEAT-025 · Use consistent structured tool output | 26 | 9 / 15 / 0 / 2 | frozen 100% |
| CAP-06 | FEAT-026 · Verify output provenance across session history | 25 | 17 / 6 / 2 / 0 | frozen 100% |
| CAP-06 | FEAT-027 · Connect and isolate focused app surfaces | 23 | 12 / 11 / 0 / 0 | frozen 100% |
| CAP-07 | FEAT-028 · Maintain requirement identity and trace links | 7 + 4 new | 7 / 0 / 0 / 0 (the 4 new rows R-287–R-290 land as implemented) | — |
| CAP-07 | FEAT-029 · Navigate code and investigate impact | 7 | 5 / 0 / 0 / 2 | — |
| CAP-07 | FEAT-030 · Get trustworthy feedback after edits | 42 | 32 / 3 / 0 / 7 | — |
| CAP-07 | FEAT-031 · Run checks reliably and without contaminating work | 37 | 29 / 8 / 0 / 0 | frozen 3%, idle 3% |
| CAP-07 | FEAT-032 · Keep instructions and documentation accurate | 7 | 7 / 0 / 0 / 0 | — |
| CAP-07 | FEAT-033 · Adopt explicit engineering standards | 23 | 9 / 14 / 0 / 0 | — |
| CAP-08 | FEAT-034 · Define reproducible comparisons | 19 | 12 / 7 / 0 / 0 | idle 100% |
| CAP-08 | FEAT-035 · Account for cost and uncertainty | 9 | 4 / 5 / 0 / 0 | idle 100% |
| CAP-08 | FEAT-036 · Bound study execution and paid work | 16 | 7 / 8 / 1 / 0 | idle 100% |
| CAP-08 | FEAT-037 · Grade behavior with trustworthy checks | 23 | 11 / 12 / 0 / 0 | idle 100% |
| CAP-08 | FEAT-038 · Interpret workflow experiments and their limits | 18 | 11 / 6 / 0 / 1 | idle 56% |


## The full outline (every heading the ledger will carry, with its purpose line)

### CAP-01 · Maintain direction and useful context
- Purpose: Keep the agent aligned with the project and carry useful knowledge between work sessions.
- Outcome: A developer can start or resume work with the relevant goal, decisions, history and knowledge available.

- **FEAT-001 · Keep goals and priorities in view** — Provide the governing project objective and preserve its precedence over background context.
- **FEAT-002 · Resume decisions and next actions** — Carry compaction summaries and a clear handoff frontier into later work without presenting past agent output as authority.
  - SUB-001 · Write and identify a compaction summary (13 rows) — Find the correct store, write the summary atomically and report its origin and any write failure.
  - SUB-002 · Resume only the appropriate summary (17 rows) — Decide whether a summary belongs to this directory and session, distinguish missing and unreadable state, and respect role exclusions.
  - SUB-003 · Frame recent and stale context (10 rows) — Label summary authority and replace stale content with a readable, correctly bounded pointer.
  - SUB-004 · Use custom and legacy locations safely (14 rows) — Resolve custom paths and reject unsafe or legacy locations without overwriting their contents.
  - SUB-005 · Keep next steps and open decisions current (8 rows) — Inspect the HANDOFF frontier for oversized or stale entries and preserve unresolved owner questions across sessions.
- **FEAT-003 · Index and connect existing knowledge sources** — Discover, index and connect existing knowledge sources so relevant material can be retrieved across projects.
- **FEAT-004 · Retrieve relevant context with provenance** — Surface bounded, relevant knowledge pointers at the right moment with source framing and predictable failure behavior.
- **FEAT-005 · Communicate decisions clearly** — Deliver the preferred writing guidance and check report readability and structure.

### CAP-02 · Deliver controlled changes
- Purpose: Give builders, reviewers and the integration step separate responsibilities and concrete records.
- Outcome: A developer can accept a bounded change with understandable review evidence and a controlled integration step.

- **FEAT-006 · Launch builders with execution limits** — Launch workers in identified worktrees with the current argument, lock, time and selected tool-write limits; semantic change scope is a separate proposed feature.
- **FEAT-007 · Review a specific revision independently** — Review an identified snapshot with controlled rounds, role isolation, liveness and attributable verdicts.
  - SUB-006 · Identify and freeze the review target (17 rows) — Name the review item, derive its content revision and materialize the intended snapshot with explicit scope limits.
  - SUB-007 · Admit rounds and enforce the budget (18 rows) — Count revisions consistently, reserve available rounds, reclaim eligible reservations and record cap overrides.
  - SUB-008 · Run and stop an isolated reviewer (14 rows) — Keep reviewer roles separate, suppress unrelated context mutation, apply watchdog and retry rules, and stop child processes cleanly.
  - SUB-009 · Accept and record a valid result (7 rows) — Require the expected completion evidence and a valid reservation while invalidating results for changed review state.
  - SUB-010 · Protect and inspect review records (18 rows) — Preserve the tally and log contracts, refuse unsafe output destinations and expose recorded rounds without mutation.
- **FEAT-008 · Integrate and clean up reviewed changes** — Check merge prerequisites, integrate eligible changes, record the result and remove only safe completed worktrees.

### CAP-03 · Control trust and tool actions
- Purpose: Make trust decisions, action restrictions and policy changes visible and predictable.
- Outcome: A developer can understand which sources and actions are allowed and can recover from a refusal without silently weakening controls.

- **FEAT-009 · Decide which project content is trusted** — Represent explicit project trust, explain untrusted sources and avoid gaining trust from incidental files.
- **FEAT-010 · Guard risky commands and protected resources** — Inspect supported tool actions, preserve mandatory restrictions and provide actionable approval or refusal behavior.
- **FEAT-011 · Keep policy changes safe and recoverable** — Load and refresh policy configuration with defined precedence, bounded reading and safe behavior when configuration breaks.
- **FEAT-012 · Render paths and provenance clearly** — Render paths, labels and provenance through the documented normalization and presentation rules.

### CAP-04 · Bring nana to each project and maintain it
- Purpose: Install the toolkit, adopt projects, diagnose its environment and manage its lifecycle.
- Outcome: A developer can adopt the same controlled workflow in a new or existing project and maintain or remove it without losing unrelated state.

- **FEAT-013 · Install and connect harness runtimes** — Install and identify the intended runtime resources, hooks, skills, commands and configuration while preserving foreign content.
  - SUB-011 · Select the active runtime and home (11 rows) — Resolve the intended executable and agent locations and provide the matching fresh-machine setup instructions.
  - SUB-012 · Deliver commands, hooks and workflow resources (23 rows) — Install the shared resources and seed missing private or runtime configuration with known resource contracts.
  - SUB-013 · Connect hooks and packages without duplication (14 rows) — Recognize equivalent hook commands and package registrations while retaining unrelated settings and entries.
  - SUB-014 · Preserve files and preview installation changes (24 rows) — Apply idempotent and atomic writes, report dry runs accurately and refuse unsafe files or conflicting ownership.
  - SUB-015 · Apply the platform's supported installation (11 rows) — Skip unsupported Windows integrations and maintain supported copies and mirrors without overwriting owner content.
- **FEAT-014 · Create or adopt a project workspace** — Seed and update the project working structure and templates, expose adoption needs and obtain the actual owner objective.
  - SUB-016 · Recognize projects that need adoption (24 rows) — Detect eligible repository roots and report actionable adoption candidates with bounded, honest and safely rendered signals.
  - SUB-017 · Seed a minimal project workspace (9 rows) — Create the basic objective, handoff, session log, instructions and starter configuration while respecting the enclosing repository and bounded refresh behavior.
  - SUB-018 · Adopt or update shared working structure (9 rows) — Apply the reusable structure and marker-owned instructions from their canonical sources using the documented preservation boundaries.
  - SUB-019 · Render language templates (7 rows) — Provide the Python and TypeScript scaffold/adopt outputs with their shared requirement set, working instructions and clean checks.
  - SUB-020 · Preserve existing content and honor opt-outs (6 rows) — Recognize existing filesystem entries, preview changes and honor an explicit decision that a repository is not a nana project.
  - SUB-021 · Check readiness and ratify the objective (6 rows) — Report structural readiness and require the owner's objective and current priority before the trust step.
- **FEAT-015 · Diagnose the active environment** — Report what is installed, configured or unhealthy with concrete repair guidance and accurate active-source attribution.
- **FEAT-016 · Start the local development desk** — Bind the intended pi runtime and run the local desk with appropriate platform and service behavior.
- **FEAT-017 · Inspect durable state and follow restoration steps** — Inspect the durable-state manifest, export the documented state and follow its archive and restoration guidance.
- **FEAT-018 · Update or remove managed components safely** — Migrate retired artifacts and remove only resources nana owns while preserving foreign or edited state.
- **FEAT-019 · Release usable templates and report support** — Verify template combinations, identify delivered versions and publish accurate release and support information.

### CAP-05 · Follow and steer development
- Purpose: Let the developer understand ongoing and historical work and interact with the correct live session.
- Outcome: A developer can see what agents are doing, inspect their changes and direct the intended session without losing context.

- **FEAT-020 · Find and read previous sessions** — Read, title, navigate and display session history while retaining correct branch identity.
- **FEAT-021 · Choose and start an agent session** — Select a working directory, runtime resources, tools and trust options before launching the appropriate child.
- **FEAT-022 · Steer and recover live sessions** — Deliver prompts and RPCs to the intended session, reconcile asynchronous state and handle reload, disconnect and teardown.
- **FEAT-023 · Inspect changes and receive useful notices** — Show working-tree changes, readable activity and bounded output, and notify the developer when attention is needed.
- **FEAT-024 · Edit session and project settings safely** — Expose supported configuration and context edits while preserving unknown fields and existing files on failure.

### CAP-06 · Use attributable tool outputs and focused apps
- Purpose: Give tools a consistent presentation contract and connect apps without confusing their origin or authority.
- Outcome: A developer can use focused app surfaces and inspect tool output whose producer and session history remain attributable.

- **FEAT-025 · Use consistent structured tool output** — Validate and render supported cards, tables, charts and actions from the recognized tool carriers.
- **FEAT-026 · Verify output provenance across session history** — Stamp and verify tool output, retain session signing lineage and reject forged or mismatched content.
- **FEAT-027 · Connect and isolate focused app surfaces** — Load app manifests, route their tools and data, track readiness and enforce listener and request boundaries.

### CAP-07 · Keep code and promises checkable
- Purpose: Make requirements, code structure, checks and engineering rules inspectable with explicit limits.
- Outcome: A developer can see which promises a change affects and what evidence supports its behavior and engineering quality.

- **FEAT-028 · Maintain requirement identity and trace links** — Keep stable requirement records and syntactic test links, while making the checker's limited guarantees explicit.
- **FEAT-029 · Navigate code and investigate impact** — Maintain a generated module map and find candidate affected requirements through source and test relationships.
- **FEAT-030 · Get trustworthy feedback after edits** — Run matching checks after file edits and communicate failures, timeouts, skipped work and evidence state correctly.
- **FEAT-031 · Run checks reliably and without contaminating work** — Execute the test suite with appropriate collection, isolation, liveness, output and environmental controls.
- **FEAT-032 · Keep instructions and documentation accurate** — Check documentation and skill commands against the interfaces and files they claim to describe.
- **FEAT-033 · Adopt explicit engineering standards** — Keep shared configuration and module-boundary policies in one place and link their applicability to project features.

### CAP-08 · Evaluate agent choices with credible evidence
- Purpose: Run controlled studies and interpret results without confusing missing measurement with success.
- Outcome: A developer can judge whether an agent, prompt or workflow change improves relevant outcomes at an understood cost.

- **FEAT-034 · Define reproducible comparisons** — Specify profiles, inputs, schedules, pins and evidence so an experiment can be resumed without changing its meaning.
- **FEAT-035 · Account for cost and uncertainty** — Measure direct and nested work with consistent usage semantics and report unknown or partially priced spend explicitly.
- **FEAT-036 · Bound study execution and paid work** — Preflight paid work, apply budgets and stop conditions and preserve exactly-once records during interruption.
- **FEAT-037 · Grade behavior with trustworthy checks** — Separate behavioral grading from the code under evaluation and report failures and grader errors honestly.
- **FEAT-038 · Interpret workflow experiments and their limits** — Analyze review and writing evidence, require stated controls and avoid changing practice beyond what the evidence supports.

