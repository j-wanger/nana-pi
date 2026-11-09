# Decisions at their homes

These dated rulings are kept verbatim here; each Home names the tool or decision-time text that delivers it.

- 2026-10-14: Turning a repo into a feature tree is core: lift, an approved regroup, then feature-oriented work. Home: `packages/nana-pack/skills/requirements/SKILL.md`.
- 2026-11-09: In nana-pi, Claude Code seats: the turn-end check and the launch and question guards hold the waking rule: a recurring wake at least every 30 minutes while a lane is open, every lane tool in its own background call, and no blocking question once the owner has been silent 15 minutes. Home: `packages/nana-setup/claude/hooks/nana-waking.mjs`.
- 2026-10-21: A capability is a product stage with deliverables, or a constraint that names the stages it binds. Every capability field stays optional, and existing trees gain the fields in place. Home: `packages/nana-pack/skills/requirements/SKILL.md`.
- 2026-10-21: The owner adopted the writing rule. Every report runs the check before it is sent, and HANDOFF's live sections must pass it. Home: `packages/nana-pack/bin/nana-writing.mjs`.
- 2026-10-22: Every plan and brief names its precedent, the nearest existing code for each part. Builders follow it and report each departure. A `Card: fix` brief may omit the section (owner, 2026-11-06, #338); plans and other briefs still require it. pi-worker refuses an unmarked brief without it. Home: `packages/nana-pack/lib/brief-precedent.mjs`, `packages/nana-pack/prompts/planner.md`, `packages/nana-pack/prompts/builder-preamble.md`.
- 2026-11-07: In nana-pi, lanes land without waiting for Windows; Windows runs on main after each land, and a red main blocks further lands. Home: `packages/nana-pack/bin/nana-land.mjs`.
- 2026-11-07: The roster names a slot for the scout, planner and adversary; a seat starts each through its slot. Home: `packages/nana-pack/bin/pi-worker.mjs`.
- 2026-11-02: In nana-pi, a tip's passing GitHub CI stands in for the local full suite for builders, seats and lands. Builders do not push; the seat pushes after verifying, then waits for CI. The local locked suite runs only when CI cannot stand in. Home: `packages/nana-pack/bin/nana-land.mjs`, `packages/nana-pack/prompts/builder-preamble.md`.
- 2026-11-05: Keep an adversary point only when it changes a decision; cut points that merely add procedure or artifacts. Home: `packages/nana-pack/prompts/planner.md`.
- 2026-11-09: In nana-pi, the owner's priority lock in the pack config holds builds to one repository; pi-worker refuses others. Only the owner sets or releases it. Home: `packages/nana-pack/bin/pi-worker.mjs`.
- 2026-11-01: Each machine sets how many lanes build there in its roster file; the roster command's lanes line prints the limit, default included. At most two more lanes are planned. Home: `packages/nana-pack/bin/nana-roster.mjs`, `packages/nana-setup/claude/rules/nana-seat.md`.
