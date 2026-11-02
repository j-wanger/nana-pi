Feature: FEAT-042 · Measure what each role's context is for

Lane seat-anatomy-roster-notice. Class: ordinary. Builder: pi-worker (small lane). Build session 1. This build runs on the reference Windows 11 laptop; shell commands run in PowerShell or Git Bash, and Node is on PATH.

Build to the plan of record, `docs/reviews/seat-anatomy-roster-notice-2026-11-02/plan.md` (revision 2). It has taken the pi adversary's attack in `plan-attack.md`. Build its Design as written, take O1 as you judge, and build rows R-3682 to R-3684 and must-meet M1 to M3 exactly as its Must-meet section says, plus the amended R-3640. Requirements first: rows, then tagged tests, then code.

Why this lane exists: in the seat anatomy, the roster notice's context arrives in a commandless `hook_additional_context` entry and counts as `hook-other`, so the seat counts show roster-notice 0. The plan's Purpose holds the real recorded shape; build fixtures from it.

Threat model: honest variation in Claude Code's recorded hook shapes is in scope (order, missing suffix, unrelated invocation id, failed or foreign hooks). A forged transcript is out.

Standing authorization: when a Precedent file has a private helper this lane needs, export it from its own module (never copy, never move it) and report each export as a departure.

## Constraints

- Edit only these:
  - `apps/bench/lib/anatomy-seat.mjs`;
  - `apps/bench/lib/anatomy-config.mjs`;
  - `apps/bench/test/anatomy-seat.test.mjs`;
  - `REQUIREMENTS.md`;
  - `apps/bench/README.md`, only if a sentence there describes the commandless attribution rule;
  - the generated files through their generators (`npm run map`, `node scripts/requirements-tree.mjs --write`);
  - the lane folder;
  - an export under the standing authorization only.
- Do not touch `docs/reviews/seat-anatomy-2026-11-02/seat-counts.md`; the Mac seat regenerates it (plan A4).
- Never read any real Claude Code transcript (`~/.claude/projects/`). Fixtures are synthetic.
- Never read, print or use a stored credential. No GitHub API calls.
- No committed text names a person or a machine path.

## Show your work

Save each in `docs/reviews/seat-anatomy-roster-notice-2026-11-02/`:
- `wrong-code.txt`: each new check run against main's code (fails) and against your code (passes), naming the failing assertion;
- `build-1-green.txt`: `node apps/bench/test/anatomy-seat.test.mjs`, `node apps/bench/test/anatomy.test.mjs`, `node apps/bench/test/anatomy-labels.test.mjs`, `node packages/nana-pack/tests/test-runner.test.mjs`.

## Done when

- M1 to M3 hold. R-3682 to R-3684 are `implemented` with backticked `file::title` evidence; R-3640's text and evidence match the new rule.
- These are green:
  - the four test files above;
  - `npm run map:check`;
  - `npm run readme:check`;
  - `node scripts/requirements-trace.mjs`;
  - `node scripts/requirements-tree.mjs --check`;
  - `node scripts/known-bugs.mjs --root .`;
  - `node scripts/identity-scan.mjs --root .` after `git add`.
- `node scripts/lane-class.mjs --root . --base origin/main` prints `ordinary`.
- Commit explicit paths on `feat/seat-anatomy-roster-notice`.

Report:
- the rows;
- the attribution and dedupe code;
- each existing-test edit with its reason;
- each wrong-code run with its named assertion;
- any export made under the standing authorization;
- each departure from the Precedent.

Commit, do not push, and stop. Report the full tip.

## Precedent

- `apps/bench/lib/anatomy-seat.mjs`: `hookKind` (36-42), `precedingHook` (153-156, 172), the `windows` post-pass (186-199).
- `apps/bench/lib/anatomy-config.mjs`: `SEAT_POLICY.hooks` and `SEAT_POLICY.correlation` (around 113-115).
- `packages/nana-setup/lib/settings.mjs`: `desiredHooks` and its status labels (195-226).
- `packages/nana-setup/claude/hooks/nana-roster-notice.mjs`: the JSON envelope (59-63).
- `apps/bench/test/anatomy-seat.test.mjs`: the fixture helpers (30-33), the R-3640 tests (69, 133, 268) and the R-3643 test (163).
