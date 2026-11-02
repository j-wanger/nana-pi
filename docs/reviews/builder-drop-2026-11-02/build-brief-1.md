Feature: FEAT-045 · Test which builder context changes builds

Lane builder-drop. Class: ordinary. Builder: pi-worker (larger lane). Build session 1. The plan of record is `plan.md` in this folder (revision 2, after `plan-attack.md`, which a pi adversary wrote; owner questions decided as its last section says). Build it as written: the harness only, no study values and no verdict; the study is a later lane. Take the plan's Design, Assumptions and Open choices.

Threat model: honest variation in our tools' output is in scope (flaky tests, a builder that stalls, hidden tests that can't import, model nondeterminism, a lane starting mid-run); deliberate forgery is out.

Rows: R-3600 to R-3607 in must-meet order. Artifact A-101.

## Precedent

- `apps/bench/run.mjs`
- `apps/bench/run.mjs`
- `apps/bench/lib/usage.mjs`
- `apps/bench/lib/agentdir.mjs`
- `apps/bench/lib/profiles.mjs`
- `apps/bench/ext/bench-nested-usage.ts`
- `apps/bench/lib/checkers.mjs`
- `apps/bench/lib/anatomy-sessions.mjs`
- `apps/bench/lib/anatomy-pulls.mjs`
- `scripts/test.mjs`
- `scripts/test-locked.mjs`
- `packages/nana-pack/lib/build-records.mjs`
- `packages/nana-pack/lib/claude-transcript.mjs`
- `scripts/memory-shape-runners.mjs`
- `apps/bench/test/integration.test.mjs`

Report each departure.

## Build

Requirement rows first, then the tagged tests (wrong code first: each new test red against main's code, recorded in this folder), then code and README. Grep every test and checker for literals this change breaks before limiting edits. Make no paid model call and start no real pi builder: tests use stub runners and synthetic fixture repositories under the OS temp folder. Never read or copy real builder transcripts, labels or the private store into the repository. Add one session entry to `docs/sessions/2026-10.md`, newest first.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Green, run locally: every touched test file, `npm run map:check`, `npm run readme:check`, the requirements trace, `npm run req:tree` then the tree check, the known-bugs check, `nana-writing` on the session entry, and `node scripts/identity-scan.mjs --root .`. Do not run the locked full suite; CI is the suite. Push the branch, open a draft PR against main, and stop.
