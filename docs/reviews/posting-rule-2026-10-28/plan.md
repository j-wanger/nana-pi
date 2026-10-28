# posting-rule · plan (seat, 2026-10-28)

Feature: FEAT-002 · Resume decisions and next actions

The seat wrote this plan from `$HOME/nana-pi/packages/nana-pack/prompts/planner.md`. It is a fix that restores agreed behaviour, so it plans without readings. One adversary attacks it (`plan-attack.md` beside it). Plans get no review round.

## Purpose

This restores R-682 and must-meet 8 of the issues-home plan. The agreed behaviour: where a project's HANDOFF points to its GitHub issues, each open item lives as one issue, not as a HANDOFF line. Both final reviewers of issues-home (2026-10-28) found that the open-question rule can be read as "write a HANDOFF line and also post an issue". A seat that writes the line turns the issue read off for every later session start, because a list item in Open for the owner wins over the pointer. In nana-pi it also fails the suite (R-2977).

## Assumptions (any may be wrong)

- A1. One rewording fixes it in all three places, because R-859 keeps AGENTS.md's region byte-identical to the template and R-682 pins the rule's phrases.
- A2. Nothing else reads the rule's sentence order.

## Open choices

- O1. The exact wording, within the pinned sentence below.

## Threat model

In scope is honest variation: a seat in a project whose HANDOFF points to issues, a seat in one that keeps list asks, and a Claude Code or pi seat. Deliberate forgery is out. A finding outside this model is a residual.

## Precedent

- `packages/nana-setup/claude/rules/nana-soul.md`: the rule's carry bullet.
- `templates/_shared/working-under-nana-pi.md`: the shared copy, rendered into AGENTS.md.
- `packages/nana-pack/tests/templates-render.test.mjs`: R-682's phrase pin and R-859's byte equality.

## Must-meet

No new rows: R-682 already names this rule, and its check pins the new sentence. Each check carries its `// req:` marker directly above it.

1. The rule's carry bullet states the two paths as alternatives, issue first: where the HANDOFF points to its issues, the seat posts one issue per item instead of writing a HANDOFF line; otherwise it writes one HANDOFF line per item under Next or Open for the owner. R-682's check pins that sentence, in all three copies.
2. Every phrase R-682 pins today stays: public, the runnable scan, post only on exit 0, the hand check, delete never edit, read replies, the labels, the blocking-title default, and only the seat posts.

Also in this change, with no new row: the two FEAT-002 known-bug lines carried from issues-home's reviews (a stray github.com link in a non-opted project's empty Open section changes its block; the pack README does not name the cold Windows timeout as a limit).

## Class and size

- Class: ordinary. `node scripts/lane-class.mjs --root . --files` on the rule, the template, AGENTS.md, the render test, REQUIREMENTS.md and FEAT-002's known-bug file prints `ordinary`.
- Size: small.
