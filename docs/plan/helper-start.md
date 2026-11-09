Feature: FEAT-006 · Launch builders with execution limits

# Plan: helper-start

Serves: roadmap step 3 — trim each helper's starting context and log what it loads. The owner, 2026-11-09: "the seat guide and everything we feed into subagents are also mostly one time push into context only, which is really against what I want".

## Purpose

A pi child (builder, adversary, pi reviewer) starts with what its task needs and nothing that only fills space, and the load log records what pi actually delivered.

Measured on 2026-11-09 from pi's own session record of a small waking build at 2026-11-09 15:11Z, after agents-trim (session `01a1c0dd`): `skills` 20,373 characters (39 skills, 22 of them legacy, plus `pi-subagents`, which the builder preamble forbids); `project_context` 13,968; `addendum` 6,485 (preamble, brief, known-bug digest); `nana-objective` 2,756; pi base about 2,800; tool schemas about 4,800. The brief is a small share. The load log today re-derives parts through a measurement child and misses the skills listing, pi's base and the schemas, about 44% of a builder's start.

## What changes

1. **Skills.** Every pi child launch (pi-worker lane and slot launches, pi-review) passes `--no-skills` plus one `--skill <dir>` per skill in a short configured list: the requirements skill, and `spec`, `py-lint`, `py-review`, `py-test` (the four Claude skills the owner kept on 2026-11-07). Resolve each from the installed nana-pi checkout and the setup-installed skill folders, portably on macOS and Windows. A listed skill that cannot be found prints one warning line naming it and the launch continues; absence is reported, never silently treated as not needed.
2. **Objective block.** The `nana-objective` extension returns nothing for a launcher-role child (`NANA_ROLE` in `LAUNCHER_ROLES`), the way `nana-rulings` already does. The brief's `Serves:` line carries the priority a child needs.
3. **Known bugs for builders.** pi-worker stops inlining the known-bug digest for lane builders. Instead the addendum carries one instruction: "Read `<path>` (this feature's known bugs) before you change code." It is unconditional for the brief's feature. Update the builder preamble's known-bug line (line 16) to match: the known bugs are in that file, not after the brief. Reviewers keep the digest; nothing changes for claude-review or pi-review.
4. **Adversary and other slots** keep their context files (AGENTS.md). They lose the objective block (part 2) and the skills listing (part 1) only.
5. **True load log.** Each pi child attempt gets an explicit session file (`--session <path>` with a unique pi-style name directly in `buildSessionDir`). After the attempt ends, the launcher reads that file's first `sections` record and logs each section's character count and the `toolsAdded` size. When the file or the record is missing (the child died before its first turn), it logs `unavailable` with the reason, never zero. Do not double-count prompt parts already inside `addendum`. Delete `lib/pi-context-load.mjs` and `lib/pi-context-measure.mjs` and their measurement-only test cases; Claude Code log lines are unchanged.

Not in this lane: AGENTS.md text, the rest of the builder preamble (T1 trims it), the seat guide, a gate rule for full-suite runs.

## Threat model

Honest variation in our tools' output is in scope: a skill directory missing on one machine, a session file not yet written when the launcher looks, a child that dies before its first turn, Windows paths. Deliberate forgery is out. A logging failure never changes delivery or launch success.

## Precedent

- `packages/nana-pack/extensions/nana-rulings.ts` — the `LAUNCHER_ROLES` gate at line 90; copy it for the objective.
- `packages/nana-pack/bin/worker-config.mjs` — where child arguments and env are built.
- `packages/nana-pack/bin/pi-worker.mjs` — the known-bug digest at lines 234–242 and the load-log call.
- `packages/nana-pack/bin/pi-review.mjs` — the pi reviewer's child arguments.
- `packages/nana-pack/lib/build-records.mjs` — call buildSessionDir (`packages/nana-pack/lib/build-records.mjs:44`) rather than re-implementing it — finds the child's session folder.
- `packages/nana-pack/lib/context-load-log.mjs` — the log line format to keep.

## Outside precedent

none: pi's session record and flags are product-specific; `pi --help` lists `--no-skills`, `--skill <path>` and `--no-context-files`.

## Validation

- V1: run one real nana-pi lane build and one adversary after the change. From each attempt's session file, report `skills`, `project_context`, `addendum`, `nana-objective` and the total. Expected: builder `skills` under 6,000 and no `nana-objective`; the adversary keeps `project_context`. Compare with the baseline session above.
- V2: the load-log line for each of those launches matches its session record; a launch killed before its first turn logs `unavailable`.
- V3: the builder's addendum names the known-bug file, the file exists, and the builder's session shows it read the file.
- V4 (stop rule): for the next five builds after the land, the seat reads each builder report for a step that names missing guidance (a skill, a known bug, a convention). One such case restores the missing piece in the next lane.

## Tests

Validation first: no new test unless a recorded failure needs one. The changed behaviour is checked by V1–V3 on real launches. Delete test cases that only pin the removed measurement child or the inlined builder digest; list each. Any row that loses its last test becomes `untested` if the behaviour still ships, `retired` if it does not. New requirement IDs, if needed: R-3980 to R-3984.

## Adversary changes taken (2026-11-09)

- Adversaries keep AGENTS.md; only the objective block and skills listing go.
- The known-bug read is an unconditional instruction for the brief's feature, and the preamble's contradicting line changes.
- The load log reads an explicit per-attempt session file after the attempt; early death logs `unavailable`.
- Missing kept skills are reported, never dropped silently.
- A stop rule over the next five builds stands in for size-only validation.
