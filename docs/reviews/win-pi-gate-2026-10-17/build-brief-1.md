# Lane win-pi-gate — build brief 1 (2026-10-17 · feat/win-pi-gate · tip after the seat's plan commit)

**Builder: Claude Sonnet 5**, a subagent in this worktree. A Windows fix lane under the owner's feature-first ruling:
the changes stay in tests, and the must-meet is the Windows CI evidence GA1 in `must-meet.md` (no new row, no new test).

**What to fix**, per `docs/reviews/windows-fixes-2026-10-17/rows.json` (entries for gate-corpus, gate-policy-paths,
agent-dir-hostile, agent-dir-parity and lane-write-guard) and `plan.md` §2 L8a:
- `gate-corpus.test.mjs:248,260`: set and restore `USERPROFILE` beside `HOME`, as its header does.
- `gate-policy-paths.test.mjs:195,202`: `fileURLToPath` for the cwd, `pathToFileURL(...).href` for the import. If its
  `/tmp/relocated` probes are POSIX-only, make them platform-aware or skip them on win32 with the reason.
- `agent-dir-hostile.test.mjs:120`: skip section C on win32 with the reason (Windows will not delete a live working
  folder).
- `agent-dir-parity.test.mjs:37,131`: resolve the desk's pi root lazily, and skip only the desk leg on win32 with the
  reason (the desk is frozen); the pack and nana-setup legs must run on Windows.
- `lane-write-guard.test.mjs:17`: use the temp root for the `/tmp` alias on win32, as `lib/adoption.mjs:42` does.
Do not change `extensions/nana-gate.ts` or any other product file; if a Windows failure needs one, stop and report it.

**Rules.** Work only in this worktree; touched test files only, in the foreground, through `npm test -- <file>` on this
Mac (two npm global folders make `node scripts/test.mjs <file>` misleading here); each call under 5 minutes; never the
full suite or a background command; no test writes this checkout; never the real home folder, `~/.claude` or `~/.pi`; no
person's, provider's or machine's name; never `process.env.PI_CODING_AGENT_DIR` or a line ending in `PI_CODING_AGENT_DIR`;
no new test; edit an existing check only where Windows makes it false, and list each edit; do not touch `HANDOFF.md`,
`docs/sessions/` or the seat's files. Commit with explicit paths, prefix `win-pi-gate: `, ending
`Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`; push to `origin feat/win-pi-gate` after each commit.

## Done
The five files green on macOS with their counts unchanged; the code-map and trace checks. The seat then opens a draft
pull request and reads the Windows leg.

## Report
≤ 12 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each file's macOS line before and after; each
existing check edited and why; the one claim most likely wrong on Windows.
