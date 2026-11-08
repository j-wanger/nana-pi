Feature: FEAT-013 · Install and connect harness runtimes
Serves: roadmap step 3 (trim each helper's starting context), owner go 2026-11-08 ("Yes, run it").

# Plan: memory-sort — guidance lives where every seat reads it

## Why

Only the rulings file and the seat guide reach both a Claude Code seat and a pi seat. Claude auto-memory reaches Claude only. A seat audit of 154 memory entries (2026-11-08) found 30 that belong in memory, 10 owner rulings, 30 seat procedures, 8 project-state items, 38 stale and 38 duplicates. HANDOFF.md, which every seat reads, still names the old priority and says OBJECTIVE.md is missing. The owner asked: "Not everything should just be jammed into claude memory, how do we integrate those memory into native nana-pi sessions?"

Owner rulings from 2026-11-08 that this lane records:
- Roadmap first: a build slot stays empty unless the lane names the roadmap step it serves.
- Validation first in nana-pi: add a test only for a failure that actually happened. (The mechanics — standards, planner and preamble wording, the trace rules — are the next lane, `validation-first`. This lane only records the ruling and replaces the 2026-10-17 ruling's must-meet sentence with a pointer to it.)

## What changes

1. Rulings (`packages/nana-pack/rules/nana-rulings.md`): add the two 2026-11-08 rulings and the owner decisions the audit found outside the file (adversary point must flip a decision; exploration work gets one review; never end on a question when the next step is clear, ask only for money, accounts, credentials or irreversible acts; real runs before machinery; simplest design first; pi-durable parked; the reduction keep list: page readers, adoption detection, the four Claude skills). Merge or drop any ruling these replace. Stay under the 8,192-byte cap with room for growth.
2. Seat guide (`packages/nana-setup/claude/rules/nana-seat.md`): add the live seat procedures, condensed to one line each (class fix after the second fix for one failure; re-measure a plan's numbers on current main; reproduce on the current base before a fix; merge briefs keep main's deletions; run `date` before a dated line; sweep sibling builds after a blocked one; side-by-side check after reworking a classifier; report the priority's measures in each status). Under the cap.
3. Prompts: planner, adversary and visual-reader lessons go to `packages/nana-pack/prompts/` files the audit names. Builder lessons (run the locked suite in the foreground; keep escaped newlines in template literals) go to `builder-preamble.md`.
4. Briefs carry a `Serves:` line naming an OBJECTIVE.md roadmap step, or `Serves: owner <date>`. `pi-worker` refuses a lane brief without one, next to its Precedent refusal. `Card: fix` briefs name the step they restore.
5. HANDOFF.md: correct the priority line and the OBJECTIVE.md claim; run `nana-writing HANDOFF.md`.
6. After the land, the seat archives the moved, stale and duplicate memory entries into an archive folder beside each memory tier (not deleted) and rewrites both indexes. This is outside the repo and needs no review.

## Validation

- Context bytes, measured before and after on this machine: a Claude Code seat's startup (rule files plus the printed memory index) goes down; a pi seat's rulings plus seat guide grow only by the moved lines, and both files stay under 8,192 bytes.
- Behaviour, observed: start a pi seat session in this repo after install and confirm the new rulings and seat lines appear in its system prompt (the launch log or `pi -p` with a prompt that asks it to quote them).
- One test, because the failure happened (seven off-roadmap launches on 2026-11-08): `pi-worker --lane` refuses a brief with no `Serves:` line and accepts one with it.
- Identity: the rulings and seat guide are public. Run `node scripts/identity-scan.mjs` over the changed files; no owner name, work reference or project name moves out of memory.

## Precedent

- `packages/nana-pack/lib/brief-precedent.mjs`: the Precedent refusal that the `Serves:` refusal sits beside.
- `packages/nana-pack/rules/nana-rulings.md`: existing ruling line format.
- `packages/nana-setup/claude/rules/nana-seat.md`: existing seat line format.

## Threat model

Honest drift in wording and in what memory says; forgery out.
