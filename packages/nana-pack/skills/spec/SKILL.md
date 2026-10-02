---
name: spec
description: Write a structured 9-section spec/contract before non-trivial work. Use when starting substantial work or when asked to "write a spec" / "plan this task".
---

# Spec — structured contract before execution

A spec prevents the #1 agent failure mode: executing a reasonable
interpretation of an ambiguous contract for hours. Constraints matter more than
objectives — negative boundaries are the safety rails.

**A spec is PER-TASK and dies when the task closes.** It is the contract for one
piece of work, not the project's standing set. The standing, numbered contract —
`REQUIREMENTS.md`, its `req:` trace rail, the sealed-tunable and code-map rules —
is the `requirements` skill, and that file evolves and is never thrown away. New
behaviour starts with a requirement diff there; a spec may cite rows (`R-nnn`) in
its Objective and Exit Criteria, and should, but it never replaces them. If the
work you are about to spec changes what the product promises, run `requirements`
first and come back.

## Steps

1. **Gather context**: existing `specs/`, recent git log, project AGENTS.md.
   If information is insufficient, ask targeted questions BEFORE drafting —
   don't draft with gaps and hope the user catches them.
2. **Adversarial pass**: before drafting, deliberately attack your own framing
   from a fresh perspective — what constraints, edge cases, and scope risks
   would a skeptical reviewer who only saw the Objective and Context raise?
   Incorporate each one or explicitly note why it's rejected; never silently
   drop one.
3. **Draft** the 9-section contract (below). Fill every section — an empty
   section signals missing thinking.
4. **Structural self-lint**: every Exit Criterion is machine-checkable (a
   command or file check, not a vibe); Scope has explicit out-of-scope items;
   Constraints contains at least one real negative boundary. If the work adds a
   hook/extension/script, Exit Criteria MUST include a functional test that
   exercises it end-to-end — existence checks miss silent breakage.
5. **User approval**: present the spec; do not start executing until approved.
6. **Persist** to `specs/<slug>.md`.

## The 9 sections

```markdown
# Spec: [Task Name]

## Objective        — one sentence, the outcome
## Context          — why now, what exists
## Scope
### In scope
### Out of scope    — explicit exclusions
## Approach         — how, at decision level (not design detail)
## Constraints      — negative boundaries, the safety rails (CRITICAL)
## Success Vision   — what done looks like in use
## Exit Criteria    — machine-checkable list
## Checkpoints      — where to pause and show progress
## Assumptions      — what's being taken on faith, each marked
```
