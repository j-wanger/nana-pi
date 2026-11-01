Feature: FEAT-041 · Shape each agent's context by role

Lane context-anatomy. Class: gate (claude-review is a review tool; pi-worker and a Claude Code SessionStart hook also change). Builder: pi-worker (larger lane). Build session 1, on main e5db630e.

The owner wants a memory factory with six stations whose last station, delivery, shapes each agent's context to its role, and asked the first three lanes to run in parallel. This lane is the delivery groundwork and the load log: each launched agent gets a bounded context meant for its role, and every delivery is recorded, so later memory experiments have a baseline.

Build the plan of record, `docs/reviews/context-anatomy-2026-10-31/plan.md`, revised after its adversary pass (`plan-attack.md`; see "Revision after the attack"). Build every must-meet test it names, the one test pinning the 6,000-character limit, and the plan's wrong-code pairs as committed red/green logs. Follow its Precedent, Assumptions and Threat model. IDs: FEAT-041, rows R-3210 to R-3229, artifact A-089; two sibling lanes hold FEAT-040 and R-3188 to R-3209 and R-3230 to R-3249.

Helper moves authorized:
- `readClaudeBuilderSettings` and `writeClaudeBuilderSettings` from `packages/nana-pack/bin/pi-worker.mjs` move to `packages/nana-pack/lib/claude-settings-carry.mjs`, as the plan says.
- `piOption`, nested in `packages/nana-pack/bin/pi-review.mjs` near line 200, may become a module-level helper in that file, or move to a shared lib module if a second file needs it.
- `shorten` and `render`, nested in `packages/nana-setup/claude/hooks/nana-shared-memory.mjs` near lines 105 and 111, may become module-level helpers in that file.
No other private helper moves; import every other precedent module the plan names.

Tests never write to the real home: every launcher test uses a temp home and agent folder. Do not start paid reviewer sessions; the seat runs the real review round re-measure after the build.

Your own known bugs: FEAT-041 has no file yet. Read `docs/known-bugs/FEAT-006.md` and `docs/known-bugs/FEAT-007.md`, and report each line your change touches.

## Show your work

The committed red/green logs of the wrong-code pairs. A run of `node packages/nana-setup/bin/install-check.mjs` on macOS. A sample of one load-log line from a temp-home run, with paths shown as placeholders. Locked full suite in the foreground.

## Done when

The plan's rows are `implemented` with backticked `file::title` evidence. These checks are green: locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, `node scripts/identity-scan.mjs` and the install check. Push the branch, open a draft pull request at build 1, and report the finished CI run for the new tip. A Windows R-3104 timeout is a known flake: rerun the failed job once.

Report: every row and test changed; the pair results; each departure from the Precedent.

## Precedent

- `packages/nana-pack/bin/pi-worker.mjs`: the Claude Code builder's isolation flags and settings carry.
- `packages/nana-pack/bin/worker-config.mjs`: `CLAUDE_CARRY_KEYS`, `CLAUDE_CARRY_ENV_NAMES`.
- `packages/nana-pack/lib/brief-precedent.mjs`: `readBrief` for the Feature line and Precedent paths.
- `packages/nana-knowledge/lib/hook.ts`: `renderBlock` cut rule and the pull.log append.
- `packages/nana-setup/claude/hooks/nana-shared-memory.mjs`: the fold line and character budget.
- `packages/nana-pack/lib/review-movement.mjs`, `review-movement-config.mjs`: a configured reviewer prompt section.
- `packages/nana-pack/bin/pi-review.mjs`, `packages/nana-pack/bin/claude-review.mjs`: where the section goes.
- `packages/nana-pack/lib/build-records.mjs`: one versioned JSON line per event.
- `packages/nana-pack/lib/agent-dir.mjs`: `piAgentDir`, `piAgentDirIsCwdRelative`.
- `packages/nana-setup/claude/hooks/nana-roster-notice.mjs`: dynamic import inside a try.
- `packages/nana-setup/lib/install-check.mjs`: installed hooks in a temp home.
