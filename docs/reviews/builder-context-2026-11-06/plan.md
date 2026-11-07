# Plan: builder-context (2026-11-06)

Lane: `builder-context`, worktree `~/nana-pi-wt/builder-context`, branch `feat/builder-context` from main. Lane class: `ordinary` (scripts/lane-class.mjs on the planned files).

## Purpose
Agreed reading: the owner, 2026-11-06, "Go with the defaults or your recommendations". That covers three measured builder-context picks.
- #340: the four curated lessons lines go to every builder as a fixed footer (bc13: curated form, ~110 words).
- #338: the Precedent line is optional on small fix cards and stays required for plans and feature briefs (bc9: 14 of 16 small-fix builds followed the existing code without it).
- #339 (next item, decided by bc11/bc12): a helper precedent says "call <symbol> … rather than re-implementing it" (10/10 reuse vs 5/10 for "follow it"). A private helper is made public in the same change (bc12: 6/6 reuse, 0/6 private imports).

## Assumptions
- A1: "small fix card" means a brief carrying the explicit marker line `Card: fix`. bc9 measured task shape (fix cards), not lane risk, and bc10–bc12 showed the line wins on feature work, so lane size is the wrong signal (adversary). With no marker, the section stays required at every lane size. Plans keep the requirement.
- A2: the footer is the four lines of bc13's curated file, verbatim (frozen file sha256 prefix 6b521260dae24d4c, text below), under the heading "Lessons from earlier work". It was measured on pi sol builders only, so the Claude Code builder half is inferred.
- A2b: authority. #340's default was hold and its recommendation was the footer. The owner said "Go with the defaults or your recommendations", which the seat reads as delegating the pick to the seat; the seat took the recommendation. It's easy to undo, and the land report says so.
- A3: the preamble's private-helper rule changes from "report the departure and stop" to the bc12 wording. A move to a shared module still needs the brief to name it (ruling 2026-10-22), which keeps that ruling intact.

## Open choices
- O1 (builder): how the `Card: fix` marker is parsed. Reuse `readBrief`'s line parsing. The refusal texts for other cases stay unchanged.

## Questions for the owner
None.

Feature: FEAT-041 · Shape each agent's context by role

## Threat model
Honest variation is in scope: a small brief with no Precedent section, a small brief with a malformed one, a larger lane without one, a Claude Code builder entry. Deliberate forgery of lane size or briefs is out.

## Precedent
- `packages/nana-pack/prompts/builder-preamble.md` — the footer goes at its end, and line 12 is rewritten (A3).
- `packages/nana-pack/lib/brief-precedent.mjs` — `checkBriefForLaunch` keeps every refusal except an absent section on a small lane.
- `packages/nana-pack/bin/pi-worker.mjs` — the lane-size value is already parsed. Pass it to the check.
- `packages/nana-pack/prompts/planner.md` — the Precedent paragraph at line 32 gains the helper wording.
- `packages/nana-pack/rules/nana-rulings.md` — line 28's ruling is amended in place (rulings file rule: a new ruling replaces the one it changes).
- `packages/nana-pack/tests/worker-claude.test.mjs` — reads the preamble; the pattern for preamble assertions.

## Outside precedent
none: the measured inputs are the laptop and Mac seats' bc9–bc13 experiments, not public projects. I looked at no outside project, because the change is wording plus one launch check.

## Must-meet
1. R-3733: the builder preamble ends with a "Lessons from earlier work" section whose four lines equal the frozen lessons text byte for byte (pinned by a sha256 the test computes over the four lines). It's delivered to both the pi and the Claude Code builder entries.
2. R-3734: the preamble's private-helper rule carries all four parts of the bc12 clause: drop the leading underscore, update its existing callers, import the public name, never import a private name from another module. It also keeps "a move to a shared module needs the brief to name it". The test checks for each part.
3. R-3735: a brief with the line `Card: fix` and no Precedent section launches at any lane size, and prints one stderr line naming the exception.
4. R-3736: a brief without `Card: fix` and with no Precedent section is refused at every lane size, with today's text. A `Card: fix` brief with a malformed section (empty, invalid none, untracked path) is still refused with today's texts.
5. R-3737: planner.md tells the planner to write a reused helper's entry as `call <symbol> (<path:lines>) rather than re-implementing it — <what it does>`, and to mark small fix briefs `Card: fix`. Its private-helper sentence is the same text as the preamble's (one test compares the two).
6. R-3738: the rulings file's precedent ruling says a `Card: fix` brief may omit the section (owner, 2026-11-06, #338).

## Frozen lessons text (bc13 L/cur.md)
Lessons from earlier work on this repository (project memory):
- When you change what a function returns or raises, find every caller (grep the repo, scripts/ included) and update each one so it still works; say which callers you changed in your commit message.
- Before writing a helper, search for an existing one that does the job and call it rather than re-implementing it; if it is private to its module, make it public in the same change.
- Follow the convention the repo already uses for the same kind of problem (how it signals "undefined", "cannot run", or bad input).
- Run the README's checks (tests, lint, types) before you commit.

## Build notes
- Requirements first: rows R-3733 to R-3738 under FEAT-041, then the tagged tests, then the code.
- Close #338, #339 and #340 in the seat's land report, not by the builder.
