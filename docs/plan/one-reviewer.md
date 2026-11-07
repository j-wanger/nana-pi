# Plan: one-reviewer (reduction batch 1, lane 1)

Feature: FEAT-007 · Review a specific revision independently

## Purpose

The owner, 2026-11-07: "start doing a reduction process on nana-pi, I want to cut down the extra unnecessary machineries while maintaining the core functionality and capability." The owner picked "process first, then code" and, for batch 1, the group "Extra reviewers": install, hook and gate lanes no longer get a land reviewer, a seat land review, an independent checker, wrong-code pairs or the mutation runner, and the lane class goes. Every lane gets one reviewer plus CI.

This lane removes that machinery and the rules that require it. Lanes 2 (review paperwork) and 3 (asks and notes) follow.

## Assumptions

- A1. A roster file that still holds `land` or `checker` keeps working: both keys are accepted and ignored, roster writes preserve them (and write `land: null` when absent, for old checkouts), so older machines and older checkouts never hit "unexpected field" or "missing land" (scout map, coupling 3). May be wrong if the owner wants the keys removed from existing files; that is a later cleanup.
- A2. outside-reader takes its model from `scout`, then `builder` (was `scout`, `land`, `builder`).
- A3. `pi-review --role land` is refused with a message saying every lane has one reviewer, rather than silently treated as a normal review.
- A4. The builder preamble's own "wrong code first" and "mutation proof" test discipline stays. Only the seat's wrong-code pairs go.
- A5. The adversary, planner and scout slots stay. `pi-worker --slot checker` is refused naming the remaining slots.
- A6. Historical lane tables under docs/reviews that import the mutation runner become dead scripts. They are history, outside the suite and the map, and are not edited.
- A7. This lane runs under the rule it introduces (one reviewer plus CI), by the owner's batch-1 pick.

## Open choices

- O1. The builder decides whether the roster's legacy-key tolerance lives in `nana-roster.mjs` validation or in `worker-config.mjs` slot tables, following the existing nullable-slot code.
- O2. The builder decides the exact wording of the retired-row notes in REQUIREMENTS.md, following the existing `retired` rows.

## Questions for the owner

None.

## Threat model

Honest variation in our tools' output and in machines' roster files is in scope: old rosters with `land` or `checker`, old checkouts, Windows paths. Deliberate forgery is out.

## Precedent

- `packages/nana-pack/bin/nana-roster.mjs` (`validateRosterShape`, lines 110–124): the nullable-slot handling the legacy-key tolerance follows.
- `packages/nana-pack/bin/worker-config.mjs` (lines 42–63, 139–150): slot tables to shrink.
- `packages/nana-setup/tests/seat-pull-off.test.mjs`: the most recent removal of a retired machine (retired hook) with its doctor message; follow its shape for retired-row tests.
- `packages/nana-pack/rules/nana-rulings.md`: a new ruling lands in the reviewed change and removes the rulings it replaces (ruling 2026-10-16).
- `templates/_shared/working-under-nana-pi.md`: the single source of the shared working pattern; AGENTS.md's marker region and nana-soul.md must match it.
- The scout's removal map (`docs/plan/one-reviewer/removal-map.md`, group 1) lists every file, test, row and checker to touch.

## Outside precedent

none: a removal of in-house process machinery; no open-source project applies. Looked at nothing outside the repo.

## Must-meet

- M1 (roster, legacy keys). A roster with no `land` and no `checker` key validates and prints without a land or checker line. A roster that still carries `land` and `checker` also validates, with the same printed output and no warning about unexpected fields. `nana-roster set builder <entry>` run on an absent roster and on a legacy roster writes a file that the pre-lane resolver (main 89afbe55's `nana-roster.mjs`) still reads without refusal on macOS and Windows: legacy `land` and `checker` values are preserved, an absent `land` is written as `null`, unrelated settings are unchanged and no new optional slot is injected. Proves old machines and old checkouts keep working (adversary finding 1).
- M2 (roster notice). The session-start roster notice names builder, reviewer, planner, adversary and lanes, and never `land` or `checker`. Proves the notice tells the truth about the new ladder.
- M3 (`--role land` on both launchers). `pi-review --role land` and `claude-review --role land` (also as `node <path>` the way Windows runs them) each exit non-zero with a message containing "one reviewer", start no child process and leave no ledger reservation. A plain launch of each still resolves the `reviewer` slot. Proves no path still starts a land review (adversary finding 2).
- M4 (`pi-worker --slot checker`). It exits non-zero naming `scout, planner or adversary`; `--slot adversary` still launches as before. Proves the checker slot is gone and the adversary survives.
- M5 (lane class and mutation runner gone). `scripts/lane-class.mjs`, `packages/nana-pack/lib/lane-class-config.mjs`, `packages/nana-pack/lib/mutation-runner.mjs` and its config do not exist; a lane build's end output has no "lane class" line; `npm run map:check`, the component audit, the requirements tree check and `npm run readme:check` are green. Proves the removal is complete, not just hidden.
- M6 (outside-reader model). With a legacy `land` entry present in every case: a pi scout entry distinct from the builder is launched with the scout's exact provider, model and thinking; a null scout or a Claude Code scout falls back to the builder's exact provider, model and thinking; the land entry is never launched. Proves the KEEP reader survives the slot removal (adversary finding 3).
- M7 (rules). The seat guide, the shared working pattern, AGENTS.md's marker region and nana-soul.md state that every lane gets one reviewer plus CI, and none of them names a land reviewer, a seat land review, a checker for install, hook or gate lanes, wrong-code pairs, the mutation runner or the lane class. The marker region still equals the shared file. Proves every role reads the new ladder.
- M8 (rulings). nana-rulings.md carries a ruling dated 2026-11-07 that every lane gets one reviewer plus CI, and no longer carries the 2026-10-16 independent-check ruling or the 2026-11-02 sentence that names the checker slot. Proves the decision is recorded where the seat reads it.

Rows: add one row per must-meet under FEAT-007; retire the rows the scout map lists for groups 1a–1d (FEAT-014 R-1127, FEAT-023 R-1198, FEAT-029 R-2960–R-2969 and R-3185, FEAT-031 mutation-runner rows, R-2953 or its clause, R-1300), and edit the slot-list rows it names. Regenerate the code map and requirements tree.
