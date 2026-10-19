# Lane win-template-tests — build brief 1 (2026-10-18 · feat/win-template-tests · tip after the seat's plan commit)

**Builder: Claude Sonnet 5**, a subagent in this worktree. A Windows fix lane under the owner's feature-first ruling: the
changes stay in tests, and the must-meet is TT1 and TT2 in `must-meet.md` (no new row, no new test). The seat's
re-triage of each file is `triage.json` beside this brief; grep it by file name.

**One shared helper, `packages/nana-pack/tests/git-only-path.mjs`** (six-tag header; regenerate the code map):
`gitOnlyPath(tmp)` returns a PATH that holds git and nothing else. On win32: the folder of the first line of
`where git`, no link (a Git for Windows launcher finds its own runtime beside it). Refuse with a reason if that folder
also holds `uvx`, so "reports missing uvx" cannot depend on the machine. On POSIX: today's `which` plus symlink route,
unchanged.

**templates-update.test.mjs**
- :128: pass `fileURLToPath(new URL(".../conftest.py", import.meta.url))`; add the import.
- :195: `const sourcePath = path.resolve(fileURLToPath(sourceRoot))`, and push `sourcePath`.
- :209, :215, :272: use `sourcePath` for the repo argument, so the `v0.6.0` tag probe stops failing on a bad path.
- Stop condition: if :255 fails because of a test under `templates/python/template/tests/`, stop and report; that fix is
  a product change.

**template-acceptance.test.mjs**
- :49-62: use `gitOnlyPath`.
- :109 and :121: wrap the URLs in `fileURLToPath(...)` (already imported at :12).

**template-release.test.mjs**
- :35 and :46-47: use `gitOnlyPath`.

**test-runner.test.mjs**
- :181: on win32 write the post-edit-hardening fixture as a passing file; POSIX keeps the trap.
- :224: POSIX keeps `/exit SIG/`. On win32 assert `FAIL` and `/— exit 1$/`, because a Windows self-kill is
  TerminateProcess with exit 1 and no signal.
- :235: put both tally sets in one named constant next to the fixture. win32: files 14, pass 9, fail 4, skip 1,
  checks.pass 10, checks.fail 22, checks.skip 2, exit 1.
- :243-247: replace the win32 `skip()` with a check that post-edit-hardening is labelled PASS on win32, which pins the
  "skip only when its condition holds" half of R-607 there.
- Leave `scripts/test.mjs` alone.

Do not change product files. **Rules**, **Done** and **Report** as in the other Windows lanes: work only in this worktree;
touched test files only, in the foreground, through `npm test -- <file>` on this Mac; each call under 5 minutes; never the
full suite or a background command; no test writes this checkout; never the real home folder, `~/.claude` or `~/.pi`; no
person's, provider's or machine's name; never `process.env.PI_CODING_AGENT_DIR` or a line ending in
`PI_CODING_AGENT_DIR`; no new test; edit an existing check only where Windows makes it false, and list each edit; do not
touch `HANDOFF.md`, `docs/sessions/` or the seat's files. Commit with explicit paths, prefix `win-template-tests: `,
ending `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`; push to `origin feat/win-template-tests` after each
commit. Done: the four files green on macOS with their counts unchanged; `npm run map` committed for the helper; the
code-map and trace checks. Report ≤ 12 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each file's macOS
line before and after; each edit and why; the one claim most likely wrong on Windows.
