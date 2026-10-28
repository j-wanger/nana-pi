# issues-home · seat check at 03a4475f (build 3), 2026-10-28

Four independent checks ran on the change since build 2. No MUST finding.

## Clean

- Seat pairs: 42 of 46 wrong versions now go red, up from 36. Eight of build 2's ten green versions now fail their row. The ledger is in the seat's scratchpad (`pairs-run-b3/`).
- Each brief 3 item is done and pinned: the diff reviewer's own wrong versions went red. The reindent changed no logic.
- The org probe stays inside the same budget. The timeout reason now names gh and the ms, and it reads well in ci-records and nana-land; no land or ci-records test text changed.
- Local macOS install check at 03a4475f: 18 of 18 PASS (seat environment). CI run 40714894340 is green on all seven jobs after a rerun of the cancelled macOS suite job.
- After main was merged in (b26e9764), the map, tree, frontier and writing checks are clean. `lane-class` prints `hook: packages/nana-pack/bin/nana-frontier-summary.mjs — launched CLI`.

## SHOULD — sent back in build brief 4

1. A pointer URL in backticks, in bold, in quotes, or followed by a comma, colon or semicolon reads as "issues pointer unreadable" (`handoff-issues.mjs:22`). This repo's HANDOFF style puts paths in backticks.
2. Showing next issues as asks (`frontier-summary.mjs:107` changed to `if (false)`) stays green since build 3's new order. With real gh it prints "Next: none found." and lists three `[next]` lines among the asks. R-2972 checks only the text order.
3. The org probe's failure paths are unpinned. A probe failure that returns an empty list, a deleted type check and a deleted spent-budget check all stay green. The first brings back the silent empty list item 2 closed.

## NOTE — the cheap ones go in brief 4

- The rule dropped where the HANDOFF line goes: "(Next or Open for the owner)".
- A-084's maker line still names `identity-scan --stdin`, not the runnable form.
- `--root` at a missing checkout exits 1, the same code as a hit.
- The failure line and the check line have two blank lines between them.

## NOTE — recorded as known bugs

- A spent budget reports "timeout" although gh never ran.
- A mixed-case host (`GitHub.com`) stays on the legacy block.
- The registry check accepts a GitHub-issues location with text before `github:`.
- `--stdin --stdin` is accepted.
