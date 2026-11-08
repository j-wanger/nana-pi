# Plan: memory-cuts

Feature: FEAT-043 · Measure memory outcomes

## Purpose

The owner's batch-2 picks, 2026-11-07, from the seat's evidence inventory: "Cut pull, pause factory", and cut the done experiment scripts. Three parts, one lane:

1. **Knowledge pull cut.** pi's `nana-knowledge` extension pulls search pointers into every pi session before each prompt (`before_agent_start`). Builder sessions already skip it (ruling 2026-10-09), the Claude Code prompt hook is retired, and the owner cut the pull. Keep the index, `nana-knowledge query` and the injection-safe pointer renderer, which search still uses.
2. **Memory factory pause.** `nana-land` starts a memory run after every land (`startMemory`, the "memory: started … complete" lines) and the Claude Code session-end hook `nana-memory-end.mjs` starts one at session end. Pause both: nothing starts a memory run automatically. Keep the code and its manual command, so resuming is one config or wiring change. The install check's "hook memory making" leg, a recurring flaky timeout, goes with the session-end trigger.
3. **Done experiment scripts.** Remove the finished one-off instruments and their tests and npm scripts: the memory replay (`lib/memory-replay.mjs`, `memory-replay-config.mjs`, `memory-replay-context.mjs`), its scorer (`memory-score.mjs`), the outcome meter (`outcome-meter.mjs`, `outcome-meter-config.mjs`, `outcome-score.mjs`), the writing-trial extractor (the owner adopted the writing rule 2026-10-21; move `RULE_TITLE` to its surviving reader first), `scripts/blast-radius.mjs` with `blast-radius-config.mjs` (its only code reader, lane-class, is gone), `scripts/requirement-rows.mjs` (`npm run req:rows`), and `lib/tree-kill-scan.mjs`. Evidence: the seat inventory (each a one-off run or an instrument no command, rule or workflow runs). FEAT-043's study closed (issue 293): the replay ran once, 2026-11-02, $93.54.

## Assumptions

- A1. The pull's removal leaves the knowledge index, its build/status/query CLI and the injection-safe renderer working; `nana-knowledge query` output is unchanged.
- A2. Pausing is not deleting: the memory-run library, its config and a manual command stay and keep their tests; only the two automatic triggers stop. A user-scope config switch is not added; resuming is a wiring change (seat call: subtraction).
- A3. Removal follows the bench-retire lane: `git rm -q --`, rows that describe removed behaviour become `retired` (never deleted or renumbered), Made-by/Read-by artifact lines updated, README and AGENTS runtime table updated, and every test that only tests removed code is retired with its rows. A case that also tests surviving code moves to a surviving file first.
- A4. A `retired.mjs` entry removes the session-end hook's settings wiring on the next `nana-setup install`, as seat-pull-off did for its hook; doctor shows a failing row with the fix `nana-setup install` while it is still wired.
- A5. One reviewer plus CI. This touches a hook and setup, so the macOS install check runs before the land.
- A6. Lane IDs R-3860 to R-3869.

## Open choices

- O1. Builder decides whether the pull removal deletes the extension file or leaves an extension with no `before_agent_start` handler, following the cleaner reader graph.

## Questions for the owner

None.

## Threat model

Honest variation in machines' installed state (old settings, old hook wiring, existing indexes and memory stores). Forgery out.

## Precedent

- `docs/plan/bench-retire.md`: the last removal lane's shape (retire rows, artifacts, tests with the code).
- `packages/nana-setup/tests/seat-pull-off.test.mjs`: retiring a Claude Code hook (install removes, doctor fails with a fix line).
- `packages/nana-knowledge/extensions/nana-knowledge.ts`: the pull to remove.
- `packages/nana-pack/bin/nana-land.mjs`: the `startMemory` call to stop.
- `packages/nana-setup/claude/hooks/nana-memory-end.mjs`: the session-end trigger to retire.
- `packages/nana-setup/lib/retired.mjs`: where a retired hook's wiring is listed.

## Outside precedent

none: removal of in-house instruments.

## Must-meet

- M1 (no pull). A pi session that starts and runs a prompt in a project with a built knowledge index receives no knowledge pointer block; `nana-knowledge query <term>` still prints the same pointers as before.
- M2 (no memory run at land). `nana-land merge` lands a lane and starts no memory run and prints no memory line; the manual memory command still runs when called.
- M3 (no memory run at session end). After `nana-setup install`, settings.json has no session-end memory hook and the hook file is not installed; on a machine still wired, doctor shows a failing row naming it with the fix `nana-setup install`; the install check passes with no memory-making leg.
- M4 (experiments gone). No tracked file outside the history folders (docs/plan, docs/reviews, docs/sessions, research, retired rows) names a removed module, script or npm script; `package.json` has no `memory:replay`, `memory:score`, `memory:meter*` or `req:rows` script.
- M5 (checks green). Map, README, requirements tree, trace, component audit and deliverables checks pass with every removed behaviour's rows retired.
- M6 (adversary 1: uninstall straight from a pre-cut install). On a home installed before this lane, `nana-setup uninstall` without a reinstall removes the managed session-end memory wiring, keeps foreign hook entries, and leaves no managed memory-hook invocation.
- M7 (adversary 2: install check keeps its other judges). A real offline install-check turn passes with zero knowledge messages; removing the gate-block, writing, rulings or seat-guide evidence each still fails with its own diagnostic.
- M8 (adversary 3: new projects learn the new contract). Both language scaffolds and project adoption render a runtime table naming explicit knowledge search with no automatic-pull claim; unrelated runtime cells and project text outside the managed region are unchanged.
