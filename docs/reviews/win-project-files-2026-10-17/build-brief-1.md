# Lane win-project-files — build brief 1 (2026-10-17 · feat/win-project-files · tip after the seat's plan commit)

**Builder: Claude Sonnet 5**, a subagent in this worktree. The first Windows fix lane under the owner's feature-first
ruling: build the feature to its must-meet tests and nothing more.

**What to build.** `must-meet.md` in this folder is the plan of record: the design paragraph, rows R-1310 to R-1313,
and the must-meet tests PF1 to PF5, with exact titles in `seat-titles.mjs`. The Windows triage behind it is in
`docs/reviews/windows-fixes-2026-10-17/`: `rows.json` holds each failing file's log evidence and cause (read the
entries for `project-working-region.test.mjs` and `project.test.mjs`), and `plan.md` §2 L1 names the lines.
1. nana-pi's `CLAUDE.md`: replace the symlink with a regular file holding `@AGENTS.md` and a newline (git mode
   100644). Find every live text that says CLAUDE.md is a link to AGENTS.md (READMEs, the shared working section in
   `templates/_shared/working-under-nana-pi.md` and nana-pi's `AGENTS.md` region, `packages/nana-setup/lib/project.mjs`'s
   header, rows) and make it say the import file; regenerate whatever a test says must match.
2. `packages/nana-setup/lib/project.mjs`: a new project gets the import file on every platform; `--check` passes the
   import file and a link to AGENTS.md, fails the 9-byte placeholder (exact bytes `AGENTS.md`, an optional newline);
   a refresh replaces the placeholder with the import file and never writes through a link. The working-region refresh
   closes its descriptor after the identity and byte re-check and before the rename, and retries briefly on EPERM or
   EBUSY (a named constant with its provenance, per the standards).
3. `.github/workflows/ci.yml`: the Windows suite leg runs `npm test -- --verbose`; the other legs are unchanged.
4. The two project test files must pass on Windows. Make them platform-aware where the triage names the cause
   (`project-working-region.test.mjs`: normalise the shared text to LF at about :16, accept either refusal detail for
   the symlink swap on win32 at about :183; `project.test.mjs`: branch on platform where it expects a link at about :79
   and :306). Each win32 skip prints its reason. Do not change what either file checks on macOS.

**Order.** Rows first (`planned`), then the four new checks with `// req:` markers, red before the code, then the code.
Rows flip to `implemented` with their titles in the Evidence cell. R-291's leaf total moves by four.

**Rules.** Work only in this worktree. Run only the test files you touch, in the foreground
(`node scripts/test.mjs <file>`), each tool call under 5 minutes; never the full suite or a background command. Never
write the real home folder, `~/.claude` or `~/.pi`: the setup tests use temporary homes. Never write a person's name or
a provider or machine name; never write `process.env.PI_CODING_AGENT_DIR` or end a line with `PI_CODING_AGENT_DIR`.
Write the must-meet checks and no other new test; edit an existing check only where this change makes it false, and
list each such edit in your report. Do not touch `HANDOFF.md`, `docs/sessions/` or the seat's files. Commit with
explicit paths, prefix `win-project-files: `, ending `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`; push
to `origin feat/win-project-files` after each commit.

## Done
The touched test files green on macOS. A line-ending rehearsal: `git clone -q -c core.autocrlf=true <this worktree>
<a temp folder>` and, in that clone, `node scripts/test.mjs packages/nana-setup/tests/project-working-region.test.mjs`
and the same for `project.test.mjs`, both green. `node docs/reviews/win-project-files-2026-10-17/seat-titles.mjs 1` →
`0 missing`; `npm run req:tree` then `node scripts/requirements-tree.mjs --check`; `node scripts/code-map.mjs --check`;
`npm run -s readme:check`; `node scripts/requirements-trace.mjs`. The seat then opens a draft pull request and reads
the Windows leg; its result comes back in the next brief.

## Report
≤ 15 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; the touched files' summary lines on macOS and in
the line-ending clone; the last line of each Done command; each existing check you edited and why; the one claim most
likely wrong on Windows.
