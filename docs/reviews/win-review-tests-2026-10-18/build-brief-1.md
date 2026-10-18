# Lane win-review-tests — build brief 1 (2026-10-18 · feat/win-review-tests · tip after the seat's plan commit)

**Builder: Claude Sonnet 5**, a subagent in this worktree. A Windows fix lane under the owner's feature-first ruling: the
changes stay in tests, and the must-meet is WR1 and WR2 in `must-meet.md` (no new row, no new test). The seat's
re-triage of each file is `triage.json` beside this brief; grep it by file name.

**Hard rule.** Keep the short 8.3 temp path. Do not resolve the test roots of `immutable-review` or `review-ledger` with
`fs.realpathSync.native`: that would hide the product bug lane W7c fixes. (`worker-lane` is different: there the product,
`pi-worker`'s `fsReal`, already uses the native form, so the test should match it.)

**One shared helper, `packages/nana-pack/tests/fake-pi.mjs`** (six-tag header; regenerate the code map). On win32 it lays
out a fake pi the way `piLaunch` finds one: a stub `pi.cmd`, plus
`node_modules/@earendil-works/pi-coding-agent/package.json` as `{ name: PI_PACKAGE, bin: { [PI_BIN_NAME]: "cli.js" } }`
(import both names from `bin/worker-config.mjs`), plus `cli.js` holding a Node body. On POSIX the tests keep their
existing `#!/bin/sh` stubs unchanged; the Node bodies are win32-only, so no macOS stub changes meaning. If `piLaunch`
rejects that layout, fall back to the npm-pack route in `win32-launch.test.mjs:165-193`, which already passes on Windows.
Join PATH with `path.delimiter`, the fake first.

**immutable-review.test.mjs**
- :14-18: import with `pathToFileURL(...).href`.
- :55 and :100: on win32 name the hostile file with U+2028 in place of the newline (NTFS refuses a newline).
- :22-35: the win32 fake through the helper. Its body writes its pid to `OBSERVE_PID` before anything else, then writes
  cwd, `NANA_REVIEW_ROOT`, `NANA_ROLE` and the joined argv to `OBSERVE`, polls for `WAIT_FOR`, exits 1 on `MODE=fail`,
  idles 30 s on `MODE=stall`, and otherwise prints `VERDICT: LAND`.
- :134 and :170-192: compare canonical paths in the `git worktree list --porcelain` checks. Parse the `worktree ` lines;
  canonicalize each, `killedCheckout` (right after the observe read, while it exists) and `checkout`, with one helper
  (`fs.realpathSync.native` on win32 with any `\\?\` removed, else `path.resolve` plus case-folding on win32).
- :150-161: on win32 print a SKIP — Windows delivers no SIGTERM to a child; TerminateProcess runs no handler — and do not
  spawn the run.
- :196-208: on win32 print a SKIP — Node's Windows PATH search tries only .com and .exe, so an extensionless git shim
  cannot run.
- Allowed to fail on Windows until W7c, each printing the short and long paths: checks 1, 2, 3, 4, 6 (the tracked
  `--out` is not refused under the short path) and 11 (reclaim misses the dead checkout).

**review-ledger.test.mjs**
- :18-25 and :886: import with `pathToFileURL(...).href`; at :886 embed it with `JSON.stringify(...)`.
- :31-45: the win32 fake through the helper, porting the stub modes `verdict`, `fail` (prints `503 upstream`, exits 1),
  `stall`, `plain`, `plain-review` and the `INVOKED` marker. The sleeper and ignorer stubs stay POSIX-only, each skipped
  on win32 with its reason.
- :499: on win32 run `taskkill /T /F /PID <pid>`; POSIX keeps `process.kill(-pid)`.
- :334-336: use `"x".repeat(20000)` (over the item cap, under Windows' 32,767-character command line).
- :604-608: on win32 SKIP — NTFS has no directory write bit; chmod only toggles the read-only attribute. The symlink
  cases beside it still run.
- :762: on win32 SKIP — NTFS stores no exec bit.
- Section 7 (:512): print its missing SKIP line — Windows has no POSIX signal to a process group.
- Allowed to fail on Windows until W7c, each printing its paths: the checks at lines 142, 147, 350, 356, 373, 482 (three),
  657, 659, 814, 836, 856, 916, 921, 924, 927, 936, 945 (two), 958 and 961. Add a detail argument wherever one is missing.

**worker-lane.test.mjs**
- :29-31, :336, :349, :375: one `writeStub(body)` through the helper on win32. Bodies: the main one appends to the marker,
  prints `NANA_ROLE:NANA_WORKTREE_ROOT` and the args, and copies the file after each `--append-system-prompt` to
  `prompt-N`; the :336 one appends to `lane-spawns`, prints `output` and waits 3 s; the :375 one starts a non-detached
  `node -e setTimeout(30000)`, writes its pid to `descendant.pid`, and waits.
- :17, :26, :86, :355: `const real = process.platform === "win32" ? fs.realpathSync.native : fs.realpathSync`, matching
  `pi-worker`'s `fsReal`.
- :92-93: read `prompt-1` behind an `existsSync` guard, so a missing file fails the named checks instead of crashing.
- :342-351: on win32 SKIP — Node's Windows PATH search tries only .com and .exe, so the extensionless git wrapper cannot run.
- Target on Windows: 51 pass, 1 skip.

Do not change product files; if a Windows failure outside the allowed lists needs one, stop and report it.

**Rules.** Work only in this worktree; touched test files only, in the foreground, through `npm test -- <file>` on this
Mac; each call under 5 minutes; never the full suite or a background command; no test writes this checkout; never the
real home folder, `~/.claude` or `~/.pi`; no person's, provider's or machine's name; never `process.env.PI_CODING_AGENT_DIR`
or a line ending in `PI_CODING_AGENT_DIR`; no new test; edit an existing check only where Windows makes it false, and
list each edit; do not touch `HANDOFF.md`, `docs/sessions/` or the seat's files. Commit with explicit paths, prefix
`win-review-tests: `, ending `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`; push to
`origin feat/win-review-tests` after each commit.

## Done
The three files green on macOS with their counts unchanged; `npm run map` committed if the helper changed the map; the
code-map and trace checks. The seat then opens a draft pull request and reads the Windows leg.

## Report
≤ 12 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each file's macOS line before and after; each
existing check edited and why; the one claim most likely wrong on Windows.
