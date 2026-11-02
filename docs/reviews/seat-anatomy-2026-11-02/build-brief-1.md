Feature: FEAT-042 · Measure what each role's context is for

Lane seat-anatomy. Class: ordinary. Builder: pi-worker (larger lane). Build session 1. The plan of record is `plan.md` in this folder (revision 2, after `plan-attack.md`, which a pi adversary wrote; owner questions decided as its last section says). Build it as written, including its function-ownership table with the builder-drop lane. Take the plan's Design, Assumptions and Open choices.

Threat model: honest variation in our tools' output is in scope (compactions, /clear, resumed and forked sessions, sidechains, hook output that changed over time, odd transcripts); deliberate forgery is out.

Rows: R-3640 to R-3648 in must-meet order.

## Precedent

- `apps/bench/lib/anatomy-sessions.mjs`
- `apps/bench/lib/anatomy-spans.mjs`
- `apps/bench/lib/anatomy-pulls.mjs`
- `apps/bench/lib/anatomy-measures.mjs`
- `apps/bench/lib/anatomy-labels.mjs`
- `apps/bench/lib/anatomy.mjs`
- `apps/bench/lib/anatomy-config.mjs`
- `packages/nana-pack/lib/memory-replay-context.mjs`
- `packages/nana-pack/lib/memory-making.mjs`
- `packages/nana-pack/lib/memory-score.mjs`
- `packages/nana-pack/lib/claude-transcript.mjs`
- `apps/bench/test/anatomy.test.mjs`

Report each departure.

## Build

Requirement rows first, then the tagged tests (wrong code first: each new test red against main's code, recorded in this folder), then code and README. Grep every test and checker for literals this change breaks before limiting edits. Tests use synthetic transcripts only. Never read, print or copy real transcripts, memory files or owner text into the repository, a log or test output. Make no model call. Add one session entry to `docs/sessions/2026-10.md`, newest first.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Green, run locally: every touched test file, the builder regression check the plan names, `npm run map:check`, `npm run readme:check`, the requirements trace, `npm run req:tree` then the tree check, the known-bugs check, `nana-writing` on the session entry, and `node scripts/identity-scan.mjs --root .`. Do not run the locked full suite; CI is the suite. Push the branch, open a draft PR against main, and stop.
