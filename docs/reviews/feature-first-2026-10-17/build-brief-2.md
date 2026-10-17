# Lane feature-first — build brief 2 (2026-10-17 · feat/feature-first · tip 9580ac9 plus build 1's uncommitted edits)

Builder: Claude Sonnet 5, a subagent in this worktree. Build 1 (the small-lane builder) stopped after about five minutes
with `VERDICT: PARTIAL`, no commit and no reason given. Its unfinished edits are uncommitted in the working tree, in
`REQUIREMENTS.md`, `AGENTS.md`, `templates/_shared/working-under-nana-pi.md`, the review standard and its test, the
template-render test, the seat and soul rules, the builder preamble and the pack README.

Finish brief 1 (`build-brief-1.md` in this folder; its text, rows, checks and Done list all still hold). First check each
of build 1's edits against `must-meet.md`'s verbatim text and the brief: keep what matches, fix what does not, and finish
what is missing (R-1110, R-1140, R-1300, R-1301, R-291's leaf total, nana-standards, the requirements skill, the root
README, the OBJECTIVE seed, and the checks FF1 to FF6).

Rules for this build (they replace brief 1's reliance on the builder preamble, which a Claude Code builder does not
receive): work only in this worktree; run only the test files you touch, in the foreground (`node scripts/test.mjs
<file>`), each tool call under 5 minutes; never run the full suite or a background command (the seat runs the suite);
never write the real home folder, `~/.claude` or `~/.pi` — the install tests use temporary homes; never write a person's
name or a provider or machine name; never write `process.env.PI_CODING_AGENT_DIR` or end a line with
`PI_CODING_AGENT_DIR`; do not touch `HANDOFF.md`, `docs/sessions/` or the seat's files in this folder. Write the six
must-meet checks and no other new test; edit an existing check only where this change makes it false, and list each
such edit in your report. Commit after each group with explicit paths, prefix `feature-first: `, ending
`Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`; push to `origin feat/feature-first` after each commit.

Done: brief 1's Done list without the full suite: `seat-titles.mjs 1` → `0 missing`, `npm run req:tree`, the tree,
map, README and trace checks, and green runs of every test file you touched, including
`packages/nana-pack/tests/templates-render.test.mjs`, `packages/nana-setup/tests/install.test.mjs` and
`packages/nana-setup/tests/project.test.mjs`.

Report: ≤ 20 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; the touched test files' summary lines; the
last line of each Done command; each existing check you edited and why; the one claim most likely wrong.
