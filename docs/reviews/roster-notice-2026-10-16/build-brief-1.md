# Lane roster-notice — build brief 1 (2026-10-16 · feat/roster-notice · tip after the seat's records commit)

**Builder: Claude Sonnet 5**, a subagent in this worktree. Build the frozen plan, `CHANGE.md` in this folder: every row
in §2, every check in §5.1 and every existing-check change in §5.2, the design in §3 (3.1–3.9). The owner's answers at
the end of `CHANGE.md` hold: `largerBuilder` defaults to null; no `set` command; one larger-lane builder per machine.
Do not build anything §3.9 or §6 "Later lanes" lists.

**Order.** Requirement rows first (§2 text verbatim, new rows `planned`), then the tests with the exact titles
`seat-titles.mjs` lists, each with its `// req:` marker directly above the check, red before the code; then the code.
A row flips to `implemented`, with its Evidence cell citing its titles, in the commit that turns its tests green. Commit
after each group: (1) roster slot, resolver, roster command and `--json`; (2) lane mode `--lane-size` and its two
refusals; (3) the notice module and config; (4) the Claude Code hook and its installer wiring and install check; (5) the
pi extension; (6) the shared bullet, docs, counts and the regenerated marker region, tree and code map.

**Two points the seat's checks found in a fake build.**
- The installed hook runs through a symlink in `~/.claude/hooks`, so a main guard that compares `process.argv[1]` with
  `import.meta.url` prints nothing there. Compare real paths.
- R-1206's read-error case needs an injected input stream: export one function that runs the hook with an injected
  input stream and environment, so a test can feed it a stream that fails on read.

**Rules.** Work only in this worktree. Run only the test files you touch, in the foreground (`node scripts/test.mjs
<file>`), each tool call under 5 minutes; never the full suite, never a background command. Never edit the real
`~/.claude`, `~/.pi` or any project; every test uses temporary homes and agent dirs. Never write a person's name or a
provider, gateway or machine name; fixture providers are placeholder strings found nowhere else. Do not touch the
seat's files (`acceptance.mjs`, `seat-titles.mjs`, the audits, outputs), `HANDOFF.md` or `docs/sessions/`. Commit with
explicit paths, prefix `roster-notice: `, ending `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`; push to
`origin feat/roster-notice` after each commit.

## Done
The touched test files green; `node docs/reviews/roster-notice-2026-10-16/seat-titles.mjs 1` → `0 missing`;
`node docs/reviews/roster-notice-2026-10-16/acceptance.mjs > docs/reviews/roster-notice-2026-10-16/acceptance-output.txt 2>&1`
→ only the seat's HANDOFF/session cases and the Windows-only lines miss; `node scripts/requirements-tree.mjs --check`;
`node scripts/code-map.mjs --check`; `npm run -s readme:check`; `node scripts/requirements-trace.mjs`. Commit, push.

## Report
≤ 25 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each group with the red you saw first; the touched
test files' summary lines; the last line of each seat output; the one claim most likely wrong.
