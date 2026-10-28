Feature: FEAT-002 · Resume decisions and next actions

Lane issue-watch. Class: hook (`node scripts/lane-class.mjs --root . --files` on the planned files prints `hook: packages/nana-pack/bin/nana-frontier-summary.mjs — launched CLI`). Builder: pi-worker (larger lane). Build session 1.

Work in the lane worktree on feat/issue-watch, based on main at 1afd75ea. The plan of record is `docs/reviews/issue-watch-2026-10-28/plan.md`. Read it whole, and read `plan-attack.md` beside it for the reasons behind each must-meet. The plan has no list of allowed edits.

What the lane does, in one sentence: a seat session in a project whose HANDOFF points to its GitHub issues hears each new owner comment while it runs, through one pack watch command that Claude Code runs as a background monitor and pi runs itself.

Build must-meets 1 to 8 and the sealed tunables. New requirement rows take IDs R-2990 to R-2999.

- The session-start line names the command in the runnable form the rest of the rules use: `node "$HOME/nana-pi/packages/nana-pack/bin/nana-issue-watch.mjs" --root "<project root>"`. Quote paths so a Windows path with spaces works.
- The pi side must never call a blocking spawn from its timer. `gh-runner.mjs` uses `spawnSync`; add an asynchronous runner beside it rather than copying it.
- No test may wait for real time or call the network. Drive the poll with an injected clock and gh seam.
- Any change to the frontier block must leave non-opted projects byte for byte unchanged; reuse the existing byte-equality checks.

Run the locked full suite as a plain foreground command with its output on screen, not redirected to a file and not in the background. Another lane's suite may hold the machine-wide lock; waiting for it is expected.

## Done when

Each row is `implemented` with backticked `file::title` evidence. The locked full suite (`npm run test:locked`), `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green.

Report: each must-meet's test title; the session-start block for this repo as it now prints; ten minutes of the watch's output against a gh seam that returns an owner comment, an older edited comment and another person's comment; what `pi.sendMessage` does when the agent is idle and when it is running, from the installed types; each departure from the Precedent below; every existing test you changed.

## Precedent

- `packages/nana-pack/lib/handoff-issues.mjs`: `issuesPointer` and `readHandoffIssues`, including the org-owner probe.
- `packages/nana-pack/lib/gh-runner.mjs`: `ghResult`, `ghFromEnvironment` and the command seam.
- `packages/nana-pack/bin/nana-frontier-summary.mjs` and `packages/nana-pack/lib/frontier-summary.mjs`: the session-start block.
- `packages/nana-pack/extensions/nana-frontier-summary.ts`: the pi extension.
- `packages/nana-pack/lib/frontier-summary-config.mjs`: the sealed limits and their provenance.
- `packages/nana-setup/claude/rules/nana-seat.md`: the seat guide's background-task rules.
- `packages/nana-pack/tests/handoff-issues.test.mjs`: the gh seam tests.
