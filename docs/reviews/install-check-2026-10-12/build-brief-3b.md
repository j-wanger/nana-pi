# Lane install-check — build brief 3b (2026-10-12 · feat/install-check · worktree ~/nana-pi-wt/install-check)

**Builder: pi gpt-6-luna.** Fresh session, THREE items: make the five surviving mutation pairs go red. Session
3a (`43da8d6`) came back DONE — good. The seat re-ran `seat-mutate.mjs` there: 39 of 44 red; survivors 4a, 13a,
17, 19, S1b (output `seat-mutate-build3a-output.txt` in this folder; each SURVIVED line says why the named case
stays green). Fix the CASES unless a case proves the code wrong. No title may be renamed.

## Item 1 — the runner's own inputs (pairs 4a, 13a; R-1075, R-1071)
- 4a: dropping the hook spawn timeout survives because the slow-hook case fakes a timed-out result whatever
  timeout is passed. Add `dispatch: each hook's spawn timeout is its row's timeout × 1000`: the recording spawn
  asserts the `timeout` option of every hook spawn, hit and miss.
- 13a: "platform: NANA_SETUP_PLATFORM in the caller changes nothing" only tests `buildEnvironment`. Make it run
  `runInstallCheck` with `platformName: "darwin"` and the caller env carrying `NANA_SETUP_PLATFORM=win32`, and
  assert a darwin run: no Git Bash line, no PowerShell line, shell-form dispatch.

## Item 2 — verifier and cap fixtures that isolate one fault (pairs 17, 19; R-1077, R-1076)
- 17: the verifier cases feed the same fake output to the hit and the miss, and the output ends in a literal
  backslash-n, so each fails on the miss or on JSON parsing before its own field matters. Rewrite the four
  `verifier:` failure cases so that in each the miss is SILENT and the hit is one well-formed JSON line that is
  correct except for exactly the fault the title names (no `hookEventName`; `allow`; malformed; two lines).
- 19: the 10,001-character case fails on its missing run token. Give it the token and every marker, so only the
  length fails.

## Item 3 — the writes-only case, pi launch and Git Bash (pair S1b, weak pair 22; R-1072, R-1079, R-1075)
- S1b: "checklist: the check writes only…" looks only for `.claude-placeholder`, so any other extra file passes.
  Snapshot every path under the temporary home that the CHECK writes (exclude what install, pi and hooks own,
  as CHANGE §3 step 4 defines) and compare with the exact expected set.
- 22 is red only through regexes over the test's source text. Make the pi-launch case behavioural: a `pi.cmd`
  fixture on a fake PATH must be launched through `winCommand`'s ComSpec line, never spawned directly.
- Git Bash lookup: `findGitBash` accepts any PATH folder ending in `bin` or `cmd` whose parent holds
  `bin\bash.exe`, without a `git.exe` there (it could pick up another bash). Require `git.exe` in the folder;
  add `dispatch: a PATH folder without git.exe yields no Git Bash`.

## Done — do not report DONE until all of these pass on your last commit
`seat-titles.mjs 3b` → `0 missing` (and `2d`, `2e`, `3a` still 0); `npm run req:tree`; `npm run map:check`;
`npm run readme:check`; `npm run test:locked` (0 failed); the acceptance script (exit 0); and the seat runner
from the worktree root:
`SEAT_MUTATE_OUT=docs/reviews/install-check-2026-10-12/seat-mutate-build3b-output.txt node docs/reviews/install-check-2026-10-12/seat-mutate.mjs`
with `0 survived` on its summary line. Commit the outputs. No push needed.

## Rules
Brief 2a's rules hold. Do not edit `acceptance.mjs`, `seat-titles.mjs`, `seat-mutate.mjs`, `CHANGE.md`,
`HANDOFF.md`, `docs/sessions/`, or the cc-hooks-windows lane's files. Flip a row to `implemented` only when the
cited tests pin every clause and its pairs are red.

## Report
≤ 25 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each pair → the case change that turned
it red; the runner's summary line verbatim; the `test:locked` summary line; rows flipped; the one claim most
likely wrong.
