# win-hook-variant-loop — build brief 4

**Builder:** the larger-lane builder (pi sol) in `~/nana-pi-wt/win-hook-variant-loop`, on top of the current tip. Rules: the builder preamble, but single test files only, never the full suite. No push; no `HANDOFF.md`, `docs/sessions/` or `docs/reviews/` edits. Do not merge main.

## Why
CI run 39503767589 at 5173ee52: macOS and Ubuntu 0 failing; Windows 176 PASS, 1 FAIL — `win32 doctor: after install, a ✗ settings row names each dead entry install leaves and its hand repair` (R-2410) in `packages/nana-setup/tests/win32-hook-repair.test.mjs`. Build 2's run failed the same check on Windows too (hidden then by the file's later crash). The product output on the Windows runner is right: every appended advice part uses forward slashes, for example `install leaves C:/Users/someone/custom/nana-objective.mjs as written — remove that entry by hand, then run nana-setup install; to edit instead, run node D:/a/nana-pi/nana-pi/packages/nana-setup/claude/hooks/nana-objective.mjs`. The check's `!line.includes("\\")` (test line ~242) reads the whole row, and the row's older first half names the checkout as `does not resolve inside D:\a\nana-pi\nana-pi`, which is main's text and holds backslashes on Windows.

## Do, nothing else
1. In R-2410's check, require no backslash only in the advice the lane appends (the row text from `install leaves` on), not in the row's first half. Keep every other condition of that check unchanged.
2. Show the changed condition still fails on build 1's advice (no slash conversion, H11/H12's form) for a fixture holding a backslash, and passes on the tip, on macOS.
3. Run alone: `npm test -- packages/nana-setup/tests/win32-hook-repair.test.mjs`, `settings-merge.test.mjs`, `doctor-detail.test.mjs`; `node scripts/requirements-trace.mjs`, `npm run -s map:check`, `npm run -s readme:check`.
4. Commit with explicit paths.

**Report** (5 lines or fewer, VERDICT first): commit; each command's result; the red-then-green of the changed condition.
