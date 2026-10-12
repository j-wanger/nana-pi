# Lane install-check — build brief 2d (2026-10-12 · feat/install-check · worktree ~/nana-pi-wt/install-check)

**Builder: pi gpt-6-luna.** Fresh session, THREE items. Session 2c (`75fb9d1`) came back DONE with every
title present — good. This session follows the same pattern: `seat-titles.mjs 2d` lists 24 exact titles.

## Item 1 — the per-step environment (R-1071, R-1075, R-1079) — a SEAT error to undo
The seat's 2c case "the recording spawn sees the same sanitized environment on every child" was wrong: it
contradicted the rows. To satisfy it, `75fb9d1` gave every child `CLAUDE_PROJECT_DIR` and dropped the pi
session's `NANA_TEST_TEMP_ROOTS=""`. The rows say:
- R-1071: one BASE environment for every process (the temporary home, its `tmp` and `.npm`, overrides removed);
- R-1075: each HOOK child gets the base plus `CLAUDE_PROJECT_DIR` set to the fixture project;
- R-1079: the pi SESSION gets the base plus `NANA_TEST_TEMP_ROOTS` set empty. Without it, a project under
  the parent's temporary folder is skipped (probe (f), CHANGE §3 step 6); on Linux the home sits under `/tmp`.
- No other child gets either variable.
Fix the runner. Replace the 2c case: rename it to the first 2d title and make it compare each recorded
child's environment with the base, key by key, allowing exactly that child's documented additions.

## Item 2 — hook set, matchers, form and the table pin (R-1074, R-1082)
The `hook set:`, `matcher:`, `form:` and `pin R-1074 R-1082:` titles. Cases on `mapHookEntries` (or the
runner) with hand-built settings. The matcher rule is CHANGE §2's three-part rule; the form is read from the
sealed table's columns.

## Item 3 — dispatch (R-1075)
The `dispatch:` titles, through `runInstallCheck` with a recording fake spawn. The overlap case: the fake
spawn records each SessionStart start and holds every result until all three have started; it fails if any
start comes after a finish. The timeout case uses the fake spawn's `{ error: { code: "ETIMEDOUT" }, ms }`.

## Wrong code first
For each title, break the code it is about, see it fail, restore. Record `<title>: red under <mutation>`.

## Done — do not report DONE until all of these pass on your last commit
`node docs/reviews/install-check-2026-10-12/seat-titles.mjs 2d` → `0 missing`; `npm run req:tree`;
`npm run map:check`; `npm run readme:check`; `npm run test:locked` (0 failed); the acceptance script (exit 0;
commit `acceptance-output.txt`). Then push (draft PR #4) and report the CI run ID with both install-check
jobs' item lines verbatim (poll no faster than every 60 s).

## Rules
Brief 2a's rules hold. Do not edit `acceptance.mjs`, `seat-titles.mjs`, `CHANGE.md`, `HANDOFF.md` or
`docs/sessions/`. Flip a row to `implemented` only when the cited tests pin every clause.

## Report
≤ 25 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; the last line of `seat-titles.mjs 2d`;
one line per title group with its red-under mutations; rows flipped and the clause each cited test pins; the
`test:locked` summary line; the CI run ID and item lines; the one claim most likely wrong.
