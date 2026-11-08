Feature: FEAT-013 · Install and connect harness runtimes

# Plan: child-context — trim what each helper starts with, and log all of it

Roadmap step 3 of the reduction priority (owner, 2026-11-08). Builders, reviewers and the adversary start with text written for the seat. The rulings file says builders and reviewers "read them as background" only; the writing rule says briefs, reviews and worker reports are "out of scope". A builder launch today delivers about 32,000 characters before the brief: preamble 4.8k, known-bug digest 6.2k, project context file 20k, plus the rulings block (~4.5k) and the writing block (~1.4k), and the log records only four of those parts. The Claude reviewer's log omits the project instructions Claude Code loads on its own.

Evidence: na-na FINDINGS #55 (no large quality effect from context files; builders edited HANDOFF in 3 of 16 builds with the project context file, 0 of 20 without); na-na context-map rows 44–49 (prompt text that contradicts the brief caused 5 of 12 false failures); `~/.pi/agent/nana-context-loads.jsonl` (2026-11-08 builder lines).

Requirement IDs: R-3915–R-3924.

## Must-meet tests

- M1. A pi child launched with `NANA_ROLE` in the launcher roles receives no rulings section in its system prompt; a session with no role still receives it unchanged.
- M2. A pi child launched with a launcher role receives no writing-rule section; a session with no role still receives it, and `writing.enabled: false` still removes it.
- M3. A builder launched by `pi-worker --lane` receives no known-bug file and no known-bug path in its prompt; a reviewer launched by `pi-review` or `claude-review` still receives the digest for the brief's feature.
- M4. A role child launched by `pi-worker --slot adversary` runs pi with context files disabled (`-nc`); scout and planner slots keep context files.
- M5. Each `pi-worker` launch log line lists every part the child receives from nana: preamble, brief, known bugs when sent, context files or the `-nc` marker, and the rulings and writing sections with their character counts (zero when skipped).
- M6. Each `claude-review` launch log line also lists the project instruction files Claude Code loads for that tree (`CLAUDE.md` and the files it imports) with their character counts.
- M7. The gate's credential floor and CLI guards still apply to every child: a worker child with the trimmed context still has `nana-gate` loaded, and its refusal of a credential read is unchanged.

## Threat model

Honest variation: roles, runtimes (pi and Claude Code), missing files, `writing.enabled` off, Windows paths. Deliberate forgery of `NANA_ROLE` by a user is out: the role only removes guidance, never a guard (M7 pins that).

## Precedent

- Role gating of a prompt section: `packages/nana-pack/extensions/nana-rulings.ts` (the seat-guide skip by `LAUNCHER_ROLES`, line 90) and `packages/nana-pack/lib/frontier-summary.mjs` (line 86). Follow the same import of `LAUNCHER_ROLES` from `packages/nana-pack/lib/frontier-summary-config.mjs`.
- Writing section: `packages/nana-pack/extensions/nana-writing.ts` (`before_agent_start`, line 207).
- Known-bug delivery: `packages/nana-pack/bin/pi-worker.mjs` (lines 234–242) with `packages/nana-pack/lib/known-bug-digest.mjs`.
- Role launch arguments: `packages/nana-pack/bin/pi-worker.mjs` (`prepareWorker` call for slot roles, around line 147); `-nc` handling already exists in `packages/nana-pack/lib/pi-context-measure.mjs` (line 25).
- Launch log: `packages/nana-pack/lib/context-load-log.mjs` (`contextPart`, `appendContextLoad`) and its callers in `pi-worker.mjs` and `packages/nana-pack/bin/claude-review.mjs` (line 120).

## Out of scope

The shared working-pattern text in AGENTS.md (a later text cut); the seat's own context; any change to the reviewer's known bugs or the review standard.

## Measure

Before and after: characters delivered per builder launch from the log (expect about 12,000 fewer); review send-backs per lane over the next ten lanes against the last ten. Revert M3 or M4 if send-backs rise.
