# Memory factory — vision and principles

*Confirmed by the owner on 2026-10-31; version 2 adds subject and scope, the private-store rule, stage needs, retrieval and when making runs. Every memory lane cites this file. An outside idea joins a lane only when it passes the fold test below.*

## Vision

Every agent starts its task holding what it needs to act as if it remembers the work, and nothing that misleads it.

Measured outcome: fewer corrections the owner gives twice, fewer decisions asked twice, and fewer review findings that recur, with no agent's context larger than today's baseline.

## Why

Research on 2026-10-31 found four failures:
- Memory reached only the Claude Code seat on one machine; builders, reviewers, pi sessions and the second machine got none.
- Nothing reviewed or retired memory; stale entries kept printing every session.
- Written corrections did not stop the next instance in at least four of six classes.
- Most of every agent's starting context was standing text, not memory.

## What a memory is about, and how far it reaches

Every record answers two questions.

- Subject. User memory is about the owner as a person and holds in any project. Project memory is about a body of work: its product, code, decisions and lessons. A decision the owner makes about a project is project memory, credited to the owner.
- Scope. Global applies everywhere. Local applies to one project, named in the record.

| | Global | Local |
|---|---|---|
| User | How the owner communicates, decides and works everywhere; standing preferences; context such as machines and time pressure. | How the owner wants to work in this one project, where it differs. |
| Project | Lessons true of any project built the nana way. | This project's objective, priority, rulings, decisions, known bugs and code facts. |

A new record starts local to the project where it arose. It becomes global when the same lesson or preference appears in a second project. A global project lesson can rise further, into a nana rule or check.

## Where memory lives

The memory store is always private. Nothing in it reaches a public repo. A lesson goes public only by promotion into a nana requirement or rule, rewritten without the owner's words. Project memory is keyed by repository, never by folder.

## Six stations

1. Making: extract corrections, decisions and lessons from transcripts, reviews, lands and CI.
2. Shaping: each record carries its evidence, date, trust and the roles it serves.
3. Storing: one file per record; every index is rebuildable from the files.
4. Upkeep: merge, recheck evidence, retire, and move repeated lessons up.
5. Checking: log what each agent loaded and used; probe whether the seat still pushes back.
6. Delivery: a sized bundle per role, placed in the slot that role's context already has.

## What each stage needs

| Stage | Pushed at start | May search | Never gets |
|---|---|---|---|
| Seat with the owner | user global and local profile; objective and priority; open decisions | all project memory | — |
| Planner | the feature's decisions and lessons; rulings in scope | past findings on similar work | user memory |
| Adversary | past blocking findings and known bugs in the area | — | user memory |
| Builder | brief, precedent, known-bug digest, code facts for the touched files | — | user memory; anything not handed to it |
| Reviewers | the feature's known bugs; decisions the change must honour | — | user memory; the builder's reasoning |
| Lands and CI | — | — | they are sources for making, not consumers |

## How retrieval works

Hybrid, set by role. A push bundle is small, budgeted and placed in the slot each role's context already has; it carries what the role must not miss, chosen by role, feature, the files the brief touches and scope. Search covers the long tail and is open only to the seat and the planner. Builders and reviewers are push-only, so builds repeat, reviews stay independent and builders get no automatic pull. The load log records every push and a pull log records every search, so checking can tell whether a memory was used.

## When making runs

At the end of each session, over that session's new turns, and as part of each land, over the lane's review folder. A watermark keeps each run to new units. Seat saves and extracted candidates enter the store through one merge step.

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
