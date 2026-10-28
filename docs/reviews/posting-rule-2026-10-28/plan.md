# posting-rule · plan (seat, 2026-10-28)

Feature: FEAT-002 · Resume decisions and next actions

The seat wrote this plan from `$HOME/nana-pi/packages/nana-pack/prompts/planner.md`. It is a fix that restores agreed behaviour, so it plans without readings. One adversary attacked it (`plan-attack.md` beside it); the seat took M1, M2, S1, S2 and N1 to N3, and N4 goes in the land report. Plans get no review round.

## Purpose

This restores R-682 and must-meet 8 of the issues-home plan. The agreed behaviour: where a project's HANDOFF points to its GitHub issues, each open item lives as one issue, not as a HANDOFF line. Both final reviewers of issues-home (2026-10-28) found that the open-question rule can be read as "write a HANDOFF line and also post an issue". A line under Open for the owner turns the issue read off for every later session start, because a list item there wins over the pointer. A line under Next shows twice, once from HANDOFF and once from the issues (read from code). In nana-pi either line fails the suite (R-2977).

## Assumptions (any may be wrong)

- A1. One rewording fixes it in all three places, because R-859 keeps AGENTS.md's region byte-identical to the template and R-682 pins the rule's sentences.
- A2. Nothing else reads the rule's sentence order.

## Open choices

None. The must-meets pin the exact sentences.

## Threat model

In scope is honest variation: a seat in a project whose HANDOFF points to issues, a seat in one that keeps list asks, a seat whose post fails, a Claude Code or pi seat, and a builder or reviewer session. Deliberate forgery is out. A finding outside this model is a residual.

## Precedent

- `packages/nana-setup/claude/rules/nana-soul.md:37`: the rule's carry bullet.
- `templates/_shared/working-under-nana-pi.md:17`: the shared copy, rendered into AGENTS.md's marker region.
- `packages/nana-pack/tests/templates-render.test.mjs:530-550`: R-682's sentence pin; R-859's byte equality in the same file.

## Must-meet

No new rows. R-682 already names this rule; its text is updated first to say issues replace HANDOFF lines where the HANDOFF points to them. Each check carries its `// req:` marker directly above it.

1. In all three copies, these four sentences replace the two at `templates-render.test.mjs:535-536`, and R-682's check pins them as one run with the ten sentences that follow:
   > Where the HANDOFF points to its issues, the seat posts each unresolved item and open question as one issue, never a HANDOFF line. Otherwise the seat writes each on one HANDOFF line under Next or Open for the owner. Only the seat posts, from the owner's gh account. If posting fails, the report lists the item and the reason.

   The check also fails when any copy still holds "Record each unresolved item and each open question on one HANDOFF line" or "Only the seat posts one issue each where". It must fail on the old wording and on old plus new.
2. Everything else R-682 pins stays as it is: the sentences at `:537-546`, the soul anchors at `:532` (each copy's lead sentences stay too), the 25-word sentence limit, and the builder-preamble ban at `:550`.

Also in this change, with no new row:

- One FEAT-002 known-bug line: a list-free Open section with any other github.com link, even one issue's, prints the unreadable-pointer line and drops the none-found lines, in a project that never opted in.
- FEAT-002's known-bug line on the cold Windows timeout (line 55) gains: the pack README does not name it as a limit.

## Class and size

- Class: ordinary. `node scripts/lane-class.mjs --root . --files` on the rule, the template, AGENTS.md, the render test, REQUIREMENTS.md and FEAT-002's known-bug file prints `ordinary`.
- The lane touches `packages/nana-setup/`, so the local macOS install check runs before the land (AGENTS.md, "Install check before a land").
- Size: small.
