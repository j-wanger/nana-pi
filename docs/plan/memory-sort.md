Feature: FEAT-013 · Install and connect harness runtimes
Serves: roadmap step 3 (trim each helper's starting context), owner go 2026-11-08 ("Yes, run it").

# Plan: memory-sort — guidance lives where every seat reads it

## Why

Only the rulings file and the seat guide reach both a Claude Code seat and a pi seat. Claude auto-memory reaches Claude only. A seat audit of 154 memory entries (2026-11-08) found 30 that belong in memory, 10 owner rulings, 30 seat procedures, 8 project-state items, 38 stale and 38 duplicates. HANDOFF.md, which every seat reads, still names the old priority and says OBJECTIVE.md is missing. The owner asked: "Not everything should just be jammed into claude memory, how do we integrate those memory into native nana-pi sessions?"

Owner rulings from 2026-11-08 that this lane records:
- Roadmap first: a build slot stays empty unless the lane names the roadmap step it serves.
- Validation first in nana-pi: add a test only for a failure that actually happened. (The mechanics — standards, planner and preamble wording, the trace rules — are the next lane, `validation-first`. This lane records the ruling with one clause: where the standards, AGENTS.md or the planner prompt still require must-meet tests, this ruling wins until the validation-first lane reconciles them. Both runtimes load the rulings, so no seat is left with only the old order.)

## What changes

1. Rulings (`packages/nana-pack/rules/nana-rulings.md`): add the two 2026-11-08 rulings and the owner decisions the audit found outside the file (adversary point must flip a decision; exploration work gets one review; never end on a question when the next step inside agreed scope is clear, and still ask before money, accounts, credentials, irreversible or outward-facing acts (this neither authorizes off-roadmap work nor overrides any existing approval rule); real runs before machinery; simplest design first; pi-durable parked; the reduction keep list: page readers, adoption detection, the four Claude skills, and the memory factory paused, not deleted). Merge or drop any ruling these replace. Stay under the 8,192-byte cap with room for growth.
2. Seat guide (`packages/nana-setup/claude/rules/nana-seat.md`): add the live seat procedures, condensed to one line each (class fix after the second fix for one failure; re-measure a plan's numbers on current main; reproduce on the current base before a fix; merge briefs keep main's deletions; run `date` before a dated line; sweep sibling builds after a blocked one; side-by-side check after reworking a classifier; report the priority's measures in each status). Under the cap.
3. Prompts: planner, adversary and visual-reader lessons go to `packages/nana-pack/prompts/` files the audit names. Builder lessons (run the locked suite in the foreground; keep escaped newlines in template literals) go to `builder-preamble.md`.
4. Briefs carry a `Serves:` line: an OBJECTIVE.md roadmap step plus one sentence on what this lane contributes to it, or `Serves: owner <date>` plus the owner's words. `pi-worker` refuses a lane brief whose line is missing, empty, or names no step and no owner date. This is a completeness check, not proof of alignment; the seat guide adds the judgement step: before launch, the seat re-reads the priority and asks whether this lane is the best use of the slot.
5. HANDOFF.md: correct the priority line and the OBJECTIVE.md claim; run `nana-writing HANDOFF.md`.
6. Before archiving, the seat writes a private disposition table (scratchpad, not the repo) with one row per entry: keep, moved (to which file and line), archived, and any live fragment kept in indexed memory. Mixed entries keep their unresolved fragments, such as owed known-bug lines. The owner can read the table. After the land, the seat archives the moved, stale and duplicate memory entries into an archive folder beside each memory tier (not deleted) and rewrites both indexes. This is outside the repo and needs no review.

## Validation

- Context bytes, measured before and after on this machine: a Claude Code seat's startup (rule files plus the printed memory index) goes down; a pi seat's rulings plus seat guide grow only by the moved lines, and both files stay under 8,192 bytes.
- Behaviour, observed: start a pi seat session in this repo after install and confirm the new rulings and seat lines appear in its system prompt (the launch log or `pi -p` with a prompt that asks it to quote them).
- One test, because the failure happened (seven off-roadmap launches on 2026-11-08): `pi-worker --lane` refuses a brief with no `Serves:` line and accepts one with it, and refuses an empty or malformed value.
- Identity: the rulings and seat guide are public. Run `node scripts/identity-scan.mjs` over the changed files; no owner name, work reference or project name moves out of memory.

Changed after the adversary (2026-11-08): disposition table before archiving; the autonomy ruling keeps its outward-facing and agreed-scope limits; validation first wins over older wording until its lane lands; the Serves check is described as completeness only, with a seat judgement step.

## Precedent

- `packages/nana-pack/lib/brief-precedent.mjs`: the Precedent refusal that the `Serves:` refusal sits beside.
- `packages/nana-pack/rules/nana-rulings.md`: existing ruling line format.
- `packages/nana-setup/claude/rules/nana-seat.md`: existing seat line format.

## Threat model

Honest drift in wording and in what memory says; forgery out.
