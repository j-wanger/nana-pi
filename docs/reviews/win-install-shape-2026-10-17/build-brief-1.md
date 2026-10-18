# Lane win-install-shape — build brief 1 (2026-10-17 · feat/win-install-shape · tip after the seat's plan commit)

**Builder: Claude Sonnet 5**, a subagent in this worktree. A Windows fix lane under the owner's feature-first ruling:
the changes stay in tests, and the must-meet is the Windows CI evidence IS1 in `must-meet.md` (no new row, no new test).

**Current Windows results** (main 9ba32f6, gate-lane run 3): `install` 22 pass 20 fail; `retired-artifacts` 37 pass
10 fail; `skills-and-standards` 13 pass 4 fail, then crash; `state-manifest` 7 pass 9 fail, then crash; `uninstall`
1 pass 1 fail, then crash.

**What to fix**, per `docs/reviews/windows-fixes-2026-10-17/rows.json` (entries for these five files) and `plan.md`:
- `install.test.mjs`: on win32 assert the declared shape — no `~/.claude/hooks` files (exec-form settings entries are
  already checked through `entryInvokes`), byte-equal regular copies for the rules and the requirements mirror, and
  SKIPPED for the spec and py-* skills and the four PATH links. Normalise separators where the test compares a
  `path.join` path with the product's slash-joined knowledge path; strip `\r` in `parseFrontmatterIndependently`; guard
  the block that spawns the PATH `setupLink` on win32.
- `skills-and-standards.test.mjs`: branch sections 1-3 on the platform, following section 7's existing win32 pattern;
  on win32 assert a regular file or folder with bytes equal to the source and doctor's "copied from"; replace the
  `unlinkSync` on the mirrored skill folder with `fs.rmSync(..., { recursive: true, force: true })`.
- `state-manifest.test.mjs`: build the CLI path with `fileURLToPath(new URL(...))`, not `.pathname`; skip the
  control-character fixture name on win32 with the reason; make the install-coverage expectations platform-aware for
  the win32 install shape.
- `retired-artifacts.test.mjs`: on real win32, gate the POSIX spec-skill blocks with a SKIP line (the forced-win32
  block already pins the win32 contract); expect the exec-form knowledge hook entry on win32. The line-endings lane
  already landed `* text=auto eol=lf`, so the fixture-digest failures should be gone; if one is not, report it.
- `uninstall.test.mjs`: uninstall is declared unsupported on Windows (the owner, 2026-10-17). Gate the POSIX cases on
  `process.platform !== "win32"` with a SKIP line printing the reason; keep the forced-win32 refusal check running.
- A test that `process.chdir`s into a temp folder must move back before removing it (Windows EBUSY). A Windows temp
  folder can be an 8.3 short path; resolve with `fs.realpathSync.native` inside the test where the product reports the
  long one.
Do not change product files; if a Windows failure shows install writing something wrong (not just differently), stop
and report it.

**Rules.** Work only in this worktree; touched test files only, in the foreground, through `npm test -- <file>` on this
Mac; each call under 5 minutes; never the full suite or a background command; no test writes this checkout; never the
real home folder, `~/.claude` or `~/.pi`; no person's, provider's or machine's name; never `process.env.PI_CODING_AGENT_DIR`
or a line ending in `PI_CODING_AGENT_DIR`; no new test; edit an existing check only where Windows makes it false, and
list each edit; do not touch `HANDOFF.md`, `docs/sessions/` or the seat's files. Commit with explicit paths, prefix
`win-install-shape: `, ending `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`; push to
`origin feat/win-install-shape` after each commit.

## Done
The five files green on macOS with their counts unchanged; the code-map and trace checks. The seat then opens a draft
pull request and reads the Windows leg.

## Report
≤ 12 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each file's macOS line before and after; each
existing check edited and why; the one claim most likely wrong on Windows.
