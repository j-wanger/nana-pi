Feature: FEAT-013 · Install and connect harness runtimes

# Plan: child-context — trim what each helper starts with, and log all of it

Roadmap step 3 of the reduction priority (owner, 2026-11-08). Builders, reviewers and the adversary start with text written for the seat. The rulings file says builders and reviewers "read them as background" only; the writing rule says briefs, reviews and worker reports are "out of scope". A builder launch today delivers about 32,000 characters before the brief: preamble 4.8k, known-bug digest 6.2k, project context file 20k, plus the rulings block (~4.5k) and the writing block (~1.4k), and the log records only four of those parts. The Claude reviewer's log omits the project instructions Claude Code loads on its own.

Evidence: na-na FINDINGS #55 (no large quality effect from context files; builders edited HANDOFF in 3 of 16 builds with the project context file, 0 of 20 without); na-na context-map rows 44–49 (prompt text that contradicts the brief caused 5 of 12 false failures); `~/.pi/agent/nana-context-loads.jsonl` (2026-11-08 builder lines).

Requirement IDs: R-3915–R-3924.

## Must-meet tests

- M1. A pi child launched with `NANA_ROLE` in the launcher roles receives no rulings section in its composed system prompt; a session with no role still receives it unchanged.
- M2. A pi child launched with a launcher role receives no writing-rule section; a session with no role still receives it, and `writing.enabled: false` still removes it.
- M3. The one ruling a builder needs survives: the builder preamble tells the builder that committed files carry no owner name and nothing about the owner's work (rulings line 19). The test reads the builder's composed prompt from a real `pi-worker --lane` launch with a fake pi; deleting that preamble line fails it.
- M4. The gate's credential floor and CLI guards still apply to every pi child launch path after the trim: a lane builder, a slot child (adversary, with the builder fallback) and a `pi-review` reviewer each still load `nana-gate`, and each still refuses a credential read. Changing a slot child's `NANA_ROLE` away from a launcher role, or disabling extensions, fails the test.
- M5. Each `pi-worker` and `pi-review` launch log line lists every section nana adds to the child's prompt (objective, rulings, writing, stale notice) with its delivered character count, read from the same composition the child receives; a skipped section logs 0; a section nana cannot measure logs `unavailable`, never 0.
- M6. Each Claude Code launch (`claude-review`, and `pi-worker` with a Claude Code builder) logs the instruction files Claude Code loads for that tree: `CLAUDE.md` and its imports, `CLAUDE.local.md`, `.claude/CLAUDE.md`, `.claude/rules/**`, and the user's `~/.claude/CLAUDE.md` and `~/.claude/rules/**`, each with its character count; a file it cannot read logs `unavailable`.

Changed after the adversary (2026-11-08, `adversary.md` in the seat scratchpad): builders keep the known-bug digest, because the preamble asks them to report touched known bugs and the seat reads that report (cut M3 dropped); the adversary keeps its project context files (cut M4 dropped: a flag test, with no evidence the adversary does better without them); the privacy rule moves into the preamble (new M3); the gate test covers every launch path (M4); the logs cover nana's own sections and every Claude instruction surface (M5, M6).

## Threat model

Honest variation: roles, runtimes (pi and Claude Code), missing files, `writing.enabled` off, Windows paths. Deliberate forgery of `NANA_ROLE` by a user is out: the role only removes guidance, never a guard (M7 pins that).

## Precedent

- Role gating of a prompt section: `packages/nana-pack/extensions/nana-rulings.ts` (the seat-guide skip by `LAUNCHER_ROLES`, line 90) and `packages/nana-pack/lib/frontier-summary.mjs` (line 86). Follow the same import of `LAUNCHER_ROLES` from `packages/nana-pack/lib/frontier-summary-config.mjs`.
- Writing section: `packages/nana-pack/extensions/nana-writing.ts` (`before_agent_start`, line 207).
- Known-bug delivery: `packages/nana-pack/bin/pi-worker.mjs` (lines 234–242) with `packages/nana-pack/lib/known-bug-digest.mjs`.
- Builder preamble: `packages/nana-pack/prompts/builder-preamble.md` (the evidence rule at line 38 is the nearest line).
- Gate floor by role: `packages/nana-pack/extensions/nana-gate.ts` (line 148); slot child environment: `packages/nana-pack/bin/worker-config.mjs` (lines 106–111).
- Claude instruction surfaces: `packages/nana-pack/bin/worker-config.mjs` (line 95).
- Launch log: `packages/nana-pack/lib/context-load-log.mjs` (`contextPart`, `appendContextLoad`) and its callers in `pi-worker.mjs` and `packages/nana-pack/bin/claude-review.mjs` (line 120).

## Out of scope

The shared working-pattern text in AGENTS.md (a later text cut); the seat's own context; any change to the reviewer's known bugs or the review standard.

## Measure

Before and after: characters delivered per child launch from the log (expect about 6,000 fewer per pi child); review send-backs per lane over the next ten lanes against the last ten. Revert M3 or M4 if send-backs rise.
