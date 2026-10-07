---
name: spec
description: Write a structured spec/contract before execution. Use when starting non-trivial work, when the user says "write a spec", "plan this task", or "contract for this". Produces a 9-section contract with two-tier review gate.
---

# Spec — Structured Contract Creation

Write a spec before execution to prevent the #1 agent failure mode: executing a reasonable interpretation of an ambiguous contract for hours. Constraints matter more than objectives — the negative boundaries are the safety rails.

## Pre-check: Dev-Wiki Detection

```bash
test -f .dev-wiki/_CURRENT_STATE.md && grep -q '^\- \[ \]' .dev-wiki/tasks.md 2>/dev/null
```

If BOTH true (dev-wiki exists AND uncompleted tasks): "Active dev-wiki phase detected. Use `/dev-plan` to plan within the dev-wiki lifecycle." **STOP.**

If dev-wiki exists but no uncompleted tasks, or no dev-wiki: proceed.

## Agent-Internal Mode (`--internal`)

When invoked with `--internal` (e.g., from dev-plan Step 2): run Steps 1-6 and the two-tier review gate normally, auto-incorporate all Tier 0/1 findings, persist the spec with the `<!-- nana:approved -->` marker (Step 8), and return. **Skip Step 7** (no user approval gate). The spec is an agent-internal quality artifact — the user reviews output via the delivery report at phase end, not the spec itself.

When invoked directly by the user (`/spec`): follow the full interactive flow below unchanged.

## Step 1: Gather Context

Read available project state (all optional — use `test -f` guards):
- `.dev-wiki/_CURRENT_STATE.md`
- `specs/` directory (existing specs for consistency)
- Recent git log for project activity

## Step 2: Apply Thinking Protocol

Before drafting, reason internally (no output artifact):
- Is this the right problem to spec? Challenge the frame.
- Are the constraints real or inherited assumptions?
- Do we have enough information, or should we ask first?

If information is insufficient: ask the user targeted questions before drafting. Do NOT draft with gaps and hope the user catches them.

## Step 3: Adversarial Constraint Generation (clean-context subagent)

Before drafting, dispatch a clean-context subagent to independently generate constraints:

1. **Read** `adversarial-constraints-prompt.md` (companion file in this skill directory).
2. **Dispatch** Agent with the adversarial prompt + ONLY the Objective and Context from Step 1. Do NOT include your thinking, approach ideas, scope decisions, or conversation history — the subagent must reason independently.
3. **Collect** the subagent's constraints, edge cases, and scope risks.
4. **Incorporate or reject:** For each item the subagent generated, either incorporate it into your draft (Step 5) or explicitly note why you're rejecting it. Do not silently ignore items.

If Agent tool unavailable: warn `"Adversarial constraint generator unavailable — drafting with author-only constraints."` and proceed to Step 5.

## Step 4: Functional Smoke Invariant

If the spec involves a new hook, skill, or install.sh change: the Exit Criteria MUST include at least one functional test that exercises the component (pipe real input through it, check output). Structural tests (file existence, grep for pattern) are necessary but not sufficient — they miss the silent breakage pattern where a component exists but doesn't work.

## Step 5: Draft Spec

Use this 9-section template. Fill every section — empty sections signal missing thinking.

```markdown
# Spec: [Task Name]

## Objective
[1-2 sentences. The outcome, not the steps.]

## Context
[Why this matters. What preceded it. Self-contained — readable after compaction.]

## Scope
### In scope
- [Explicit list]
### Out of scope
- [Explicit list — prevents scope creep]

## Approach
[High-level direction — goals and constraints, not implementation details.
Do NOT prescribe specific libraries, schemas, file structures, or architectures.
Let the implementer's domain reasoning determine the design.]

### Domain Research Questions
[1-3 questions the implementer should investigate before committing to a design.
What domain knowledge would separate a good implementation from a great one?]

## Constraints (CRITICAL)
[Safety rails. Each prevents a specific known failure mode.]
- [Constraint: prevents <specific bad outcome>]

## Success Vision
[What does excellent look like? Describe outcomes and qualities, not specific files or artifacts.
"Honest methodology that acknowledges limitations" over "3 files: X.py, Y.py, Z.py".]

## Exit Criteria (machine-checkable)
[Each is a command returning pass/fail.]
- [ ] `<verification command>`

## Checkpoints
[When to pause and report. Proportional to risk.]
- After [milestone]: report progress, wait for approval
- If [unexpected condition]: STOP and ask

## Assumptions
[What must be true. Each has a stop-if-violated fallback.]
- [Assumption]. If false: [what to do instead]
```

## Step 6: Two-Tier Review Gate

### Tier 0 — Structural Lint (inline, no tokens)

Verify before dispatching Tier 1. Fix failures first.

- [ ] All 9 H2 headers present (Objective, Context, Scope, Approach, Constraints, Success Vision, Exit Criteria, Checkpoints, Assumptions)
- [ ] Scope has both `### In scope` and `### Out of scope`
- [ ] Constraints has ≥1 bullet
- [ ] Exit Criteria has ≥1 `- [ ]` with backtick command
- [ ] Checkpoints has ≥1 bullet
- [ ] Assumptions has ≥1 bullet with fallback ("if false", "if missing")
- [ ] No self-containment violations ("as discussed", "as we agreed", "established earlier")

If any fail: fix, then re-check. Do NOT proceed to Tier 1 with structural failures.

### Tier 1 — Semantic Review (subagent)

Read `spec-reviewer-prompt.md` (companion file in this skill directory). Dispatch an Agent with the spec + reviewer prompt. Collect Score/Issues/Suggestions/Verdict.

- **9-10 (accept):** Present spec to user.
- **6-8 (revise):** Incorporate feedback, re-run Tier 0, present revised spec.
- **1-5 (reject):** Surface CRITICAL issues to user alongside the spec.

If Agent tool unavailable: warn "Spec reviewer unavailable" and present with disclaimer.

## Step 7: User Approval (Hard Gate)

Present the spec. Wait for explicit approval before any execution begins.

**Do NOT implement anything until the user approves the spec.**

## Step 8: Persist

Write to `specs/<slug>.md` (`mkdir -p specs/` first). Slug: kebab-case from Objective, ≤40 chars. Prepend `<!-- nana:approved YYYY-MM-DD -->` as the first line of the file (before the `# Spec:` heading). This provenance marker is checked by `enforce-spec.sh` to verify the spec went through the two-tier review process.

## Step 9: Memory Bridge (fail-open)

After persisting, store one memory entry summarizing the spec. Call `memory_store(content: "Spec <slug>: <objective>. Key constraints: <c1>; <c2>; <c3>.", category: "custom", tags: ["bridge-decision", "<spec-slug>"], trust: "medium")`. If `memory_store` is unavailable or fails, emit `"⚠ Spec memory bridge: memory_store failed. Spec decision not persisted to memory. Run install.sh --status to diagnose."` Do not block the spec flow.
