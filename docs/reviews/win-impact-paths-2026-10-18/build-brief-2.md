# Lane win-impact-paths — build brief 2 (2026-10-18 · feat/win-impact-paths · tip after c5698fd)

Windows CI on 3ade09f (the check-only commit, `ci-windows-run-1.log`) shows IP2 red there as planned:
`--impact maps a module named with the platform's native separator 0: packages\nana-pack\lib\agent-dir.mjs  [NOT A
MAPPED MODULE]`. It also shows one gap in build 1.

**MUST 1 — R-1278's detail never prints.** `runtime-map.test.mjs`'s `check` helper (around line 40) takes `(n, ok)`
and drops the third argument build 1 added, so the Windows log shows only R-1278's title. Give the helper an optional
third argument printed on the same line after the title when the check fails, as `code-map.test.mjs:30-33` does. Change
no check's condition and no other line.

## Done
runtime-map green on macOS at 8 checks; the full suite through `npm run test:locked` green. Do not push; the seat
pushes.

## Report
≤ 5 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: the commit, the runtime-map line, the suite line.
