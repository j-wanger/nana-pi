# Build brief — hook-output-fail-open

Feature: FEAT-013 · Install and connect harness runtimes. Rows R-1940 to R-1944 go at the end of SUB-012, after R-1207. Class: hook lane. Threat model: honest variation in how a reader takes hook output on macOS, Linux and Windows is in scope; deliberate forgery is out. Follow packages/nana-pack/prompts/builder-preamble.md. Work in the lane worktree on feat/hook-output-fail-open. Run single test files only. Never edit HANDOFF.md or docs/sessions/.

## Order
1. Add the five rows to REQUIREMENTS.md with the must-meet text, status `untested`, evidence `—`.
2. Write the test file. Run it and keep the four FAIL lines (R-1940, R-1941, R-1942, R-1944) as red evidence.
3. Make the code change, then flip each row to `implemented`, citing its test as `file::title`.
4. Run `npm run req:tree` and `npm run map`.

## Code
- In `packages/nana-setup/claude/hooks/`, add `process.stdout.on("error", () => {});` once to `nana-objective.mjs`, `nana-adoption.mjs`, `nana-shared-memory.mjs` and `verifier-pipe.mjs`. Put it after the imports, with a one-line comment naming the row. Ignore every stdout error, not only EPIPE.
- Extend each of those four `@errors` lines: an error on stdout, such as a reader that closed it, is ignored and the hook exits 0.
- Do not touch `lib/hook-producer.mjs`, `lib/verifier-hook.mjs`, `nana-roster-notice.mjs` or any README. No process-wide handler, no new lib module, no tunable.

## Test: new `packages/nana-setup/tests/hooks-closed-output.test.mjs` (six-tag header)
- Make a throwaway home with `tests/tmp-dir.mjs` under `os.tmpdir()`.
- Env: `process.env` with HOME, USERPROFILE, PI_CODING_AGENT_DIR (`<home>/.pi/agent`), CLAUDE_CONFIG_DIR (`<home>/.claude`) and CLAUDE_PROJECT_DIR (a project folder in the home) set. Delete NANA_SHARED_MEMORY_DIR, NANA_TEST_TEMP_ROOTS and NANA_SETUP_PLATFORM. Spawn with the project folder as cwd.
- Give each hook something to write:
  - shared memory: `<home>/.claude/nana-memory/shared/MEMORY.md` with one `- [` entry; stdin `{}`
  - adoption: make `<agent dir>/nana-journal.jsonl` a directory, so it prints `ADOPTION UNAVAILABLE`
  - objective: nothing extra; it prints its unavailable block in a bare home
  - roster notice: stdin `{"source":"startup"}`
  - verifier: stdin is a PreToolUse Bash event whose command is `npm test | tail -1 && git commit -m done`
- Run each hook with `spawn(process.execPath, [hookPath])` twice:
  - open: read stdout. It must exit 0 with non-empty stdout.
  - closed: call `child.stdout.destroy()` right after spawn, give `child.stdin` a no-op error listener, then end stdin with the input. It must exit 0 with empty stderr.
- One check per row, true only when both runs hold. On FAIL, print both exit codes and the first stderr line. Put `// req: R-194n` directly above `check("<title>", …` on one line, with the titles from the must-meet table. No time bound, no skip, and do not add the file to the runner's SKIPS.

## Wrong code (each must turn its check red; restore after)
- Remove the listener from objective, adoption, shared memory or verifier: R-1940, R-1941, R-1942 or R-1944 goes red.
- Delete `process.exit(0)` after `await runRosterNoticeHook()`: R-1943 goes red.
- Drop the journal directory from the fixture: R-1941 goes red on the open-run precondition.
- Make one listener call `process.exit(1)`: its check goes red.
- Report only, expected to survive: a listener that rethrows every error except EPIPE.

## Run
The new file; the `hook-producers`, `shared-memory-hook`, `roster-notice-hook` and `verifier-pipe` test files; `node scripts/requirements-trace.mjs`; `node packages/nana-pack/tests/requirements-tree.test.mjs`; `npm run map:check`; `npm run readme:check`.

## Done
- All five checks pass. Every must-red wrong code went red and was restored.
- The listed files pass whole. The trace shows 0 rows off EARS form and R-1940 to R-1944 implemented. The tree and map are regenerated and their checks are green.

## Report (at most 10 lines)
Verdict line; commit; the four FAIL lines before the fix; PASS after; each wrong code (row → red or green); files changed; trace, tree and map results; anything left undone.
