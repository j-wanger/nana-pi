Feature: FEAT-041 · Shape each agent's context by role

Lane context-anatomy. Class: gate. Builder: pi-worker (larger lane). Build session 2, on this branch's tip.

Build 1 passed every check. The seat ran the plan's land condition: one real claude-review round with this branch's launcher (item `ca-measure`, brief `docs/reviews/context-anatomy-2026-10-31/measure-brief.md`).

Result, written before the run as the bar in the plan's Seat checks:
- First-turn input: 28,822 tokens (bar at most 42,000; baseline 52,128). Pass.
- MCP server instructions: absent. Pass.
- `~/.claude/rules` files: FAIL. The transcript's `instructions` attachment lists `~/.claude/rules/nana-personal.md` with type `Project`, loaded in full. The reviewer's cwd is a worktree under the user's home folder, and Claude Code appears to treat the home folder's `.claude/rules` as an ancestor project's rules, which `--setting-sources project,local` keeps (inferred from the type label; confirm it).
- The account email is present (A2; expected, recorded only).

Fix the fail. Find the supported way, on the installed Claude Code, to stop a `claude -p` reviewer from loading `.claude/rules` files and CLAUDE.md files from ancestor folders above the reviewed tree while keeping the tree's own `AGENTS.md`/`CLAUDE.md`. Check `claude --help`, the installed docs and settings keys (for example a CLAUDE.md exclusion setting in the `--settings` file); prefer a setting in the reviewer's settings file over moving the cwd. Apply the same fix to the Claude Code builder launch in `pi-worker`, which uses the same flags and has the same exposure. Pin it with a test that builds the reviewer's settings and argv in a temp home whose `.claude/rules` holds a marker file, asserting the exclusion is present; the seat repeats the real round after the build. Name the row: amend R-2560 and R-2646 as needed; any new row takes R-3219 or later in this lane's range.

Open item from build 1, decided by the seat: a known-bug file's header is always delivered whole, even when it alone exceeds a feature's share; the cap applies to the lines after it. Document that in the fold rule and the README contract note, and pin it in the existing digest test. No new row.

The measurement round's own notes (seat-carried, not for this build): a per-model `effortLevel` that is not a string blocks the fallback to the top-level level; env names match case-insensitively while the sealed env overrides by exact name.

## Done when

Rows implemented with backticked evidence. Green: locked full suite (foreground), `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, `node scripts/identity-scan.mjs`, the macOS install check, and the wrong-code pair runner with a pair for the new exclusion. Push and report the finished CI run for the new tip.

## Precedent

- `packages/nana-pack/bin/claude-review.mjs`: the reviewer launch.
- `packages/nana-pack/lib/claude-settings-carry.mjs`: the reviewer's settings file.
- `packages/nana-pack/bin/pi-worker.mjs`: the Claude Code builder launch.
- `packages/nana-pack/bin/worker-config.mjs`: sealed launch values.
