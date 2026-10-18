# Lane win-setup-tools — build brief 1 (2026-10-18 · feat/win-setup-tools · tip after the seat's plan commit)

**Builder: Claude Sonnet 5**, a subagent in this worktree. A Windows fix lane under the owner's feature-first ruling:
the changes stay in tests, and the must-meet is the Windows CI evidence ST1 in `must-meet.md` (no new row, no new test).

**Current Windows results** (main 9ba32f6, gate-lane run 3; unchanged by the lanes since): `doctor-detail` 3 pass then crash; `install-check` 104
pass 1 fail; `restore` 0 pass, crash; `trust` 0 pass, crash.

**What to fix**, per `docs/reviews/windows-fixes-2026-10-17/rows.json` (entries for these four files):
- `doctor-detail.test.mjs`: the desk block forces the darwin platform and uses `#!/bin/sh` stubs and a `:`-joined PATH.
  On win32 skip that block with a SKIP line (the launchd desk service is macOS-only), and let the rest of the file run.
  Doctor's `process.getuid` call stays a known bug; do not change it.
- `install-check.test.mjs`: build the expected home, temp and npm-cache values with `path.join`, so Windows' separators
  match.
- `restore.test.mjs`: import with `pathToFileURL(...).href` and build the CLI path with `fileURLToPath(new URL(...))`,
  not `.pathname`. Then the tar calls: Git's tar may read `C:\...` as a remote host. Prefer relative archive paths with
  `cwd`, or `--force-local`; if the archive half still cannot run on Windows, skip it on win32 with the reason. The
  doctor-warning count after restore may differ under Windows' copy install; if so, branch it on the platform with the
  reason.
- `trust.test.mjs`: import with `pathToFileURL(...).href`; at the relative-agent-dir check use a literal relative path
  (such as `path.join("relative", "agent")`) instead of `path.relative` across drives.
- A test that `process.chdir`s into a temp folder must move back before removing it (Windows EBUSY). A Windows temp
  folder can be an 8.3 short path; resolve with `fs.realpathSync.native` inside the test where the product reports the
  long one.
Do not change product files; if a Windows failure needs one, stop and report it.

**Rules.** Work only in this worktree; touched test files only, in the foreground, through `npm test -- <file>` on this
Mac; each call under 5 minutes; never the full suite or a background command; no test writes this checkout; never the
real home folder, `~/.claude` or `~/.pi`; no person's, provider's or machine's name; never `process.env.PI_CODING_AGENT_DIR`
or a line ending in `PI_CODING_AGENT_DIR`; no new test; edit an existing check only where Windows makes it false, and
list each edit; do not touch `HANDOFF.md`, `docs/sessions/` or the seat's files. Commit with explicit paths, prefix
`win-setup-tools: `, ending `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`; push to
`origin feat/win-setup-tools` after each commit.

## Done
The four files green on macOS with their counts unchanged; the code-map and trace checks. The seat then opens a draft
pull request and reads the Windows leg.

## Report
≤ 12 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each file's macOS line before and after; each
existing check edited and why; the one claim most likely wrong on Windows.

## Skip bar (from the review that sent the handoff lane back, 2026-10-18)
Every Windows skip must name a case that cannot exist on Windows, or a behaviour declared unsupported or different there
(the launchd desk service is macOS-only). "POSIX symlinks" is not such a reason: Windows can create symlinks, and CI's
Windows leg does. Where a case needs a symlink, try to create it and skip only if that fails, saying so. A platform guard
that drops checks must print a SKIP line with its reason.
