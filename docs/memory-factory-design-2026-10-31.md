# Memory factory — vision and principles

*Confirmed by the owner on 2026-10-31. Every memory lane cites this file. An outside idea joins a lane only when it passes the fold test below.*

## Vision

Every agent starts its task holding what it needs to act as if it remembers the work, and nothing that misleads it.

Measured outcome: fewer corrections the owner gives twice, fewer decisions asked twice, and fewer review findings that recur, with no agent's context larger than today's baseline.

## Why

Research on 2026-10-31 found four failures:
- Memory reached only the Claude Code seat on one machine; builders, reviewers, pi sessions and the second machine got none.
- Nothing reviewed or retired memory; stale entries kept printing every session.
- Written corrections did not stop the next instance in at least four of six classes.
- Most of every agent's starting context was standing text, not memory.

## Two memory types

1. Worker memory, for agents that do not talk to the owner: planner, adversary, builder, reviewers, and the seat while planning.
2. User-facing memory, for the seat's conversations with the owner. It lives in a private repo, never in this one.

## Six stations

1. Making: extract corrections, decisions and lessons from transcripts, reviews, lands and CI.
2. Shaping: each record carries its evidence, date, trust and the roles it serves.
3. Storing: one file per record; every index is rebuildable from the files.
4. Upkeep: merge, recheck evidence, retire, and move repeated lessons up.
5. Checking: log what each agent loaded and used; probe whether the seat still pushes back.
6. Delivery: a sized bundle per role, placed in the slot that role's context already has.

## Principles

1. Purpose first. A memory exists only if a named role needs it for a named decision.
2. Evidence-bound. Every record points to its source; a record whose evidence fails stops being delivered.
3. Measured, not assumed. Every station emits numbers; every change carries a baseline and a test that decides it.
4. Shape, don't pile on. Each role's context has a budget; adding means removing, or proving the addition earns its place.
5. Repeats move up. A lesson that recurs becomes a rule, then a check. Memory is the lowest rung, not the goal.
6. Trust is earned. Automatic saves start at low trust and rise only on independent evidence.
7. The owner's words stay the owner's. User-facing memory is private and quoted; it changes how the seat speaks, never what it concludes, and it protects pushback.
8. One record, rebuildable copies. Files are the record; search and indexes are caches.

## The fold test

An outside idea joins a lane only when all three hold:
1. it moves the measured outcome above;
2. it meets every principle;
3. it belongs to that lane's station.

Otherwise it waits in the idea list under its station, with its cheapest experiment.

## Lanes so far

- context-anatomy: delivery and checking baseline (principles 3, 4).
- memory-making: making station, rule baseline (principles 2, 6).
- memory-shaper: the experiment on making quality (principle 3).
- owner-profile: user-facing store (principles 6, 7).
