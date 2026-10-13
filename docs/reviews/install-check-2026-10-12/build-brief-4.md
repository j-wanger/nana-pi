# Lane install-check — build brief 4 (2026-10-13 · feat/install-check · worktree ~/nana-pi-wt/install-check)

**Builder: pi gpt-6-luna.** Fresh session, THREE items. The seat merged main (`ca3fed2`, with the Claude Code
hooks on Windows) into this branch. CI run 38393751564's Windows `install-check` job printed:
- PASS for install, pi-subagents, both `pi list` lines, the pi session and the knowledge pull;
- `FAIL hook set — unexpected-pass: observed missing-entry while checking hook set`, and the same
  `unexpected-pass` FAIL for objective, adoption, shared memory and both verifier lines — they now PASS, but they
  are still on the win32 known-red list, and a listed item that passes is a FAIL (R-1080);
- `XFAIL doctor — note-row: · hook nana-objective.mjs skipped (win32) (known red, R-1055, until 2026-10-24)`.

## Item 1 — seal the win32 known-red list EMPTY (R-1070, R-1080) and say what an unexpected pass is
- The seat's sealing decision (CHANGE §2 "The seat seals the list at land from the lane's final Windows run with
  main merged in"): `KNOWN_RED.win32` becomes empty, like darwin. Update the pin
  `pin R-1070 R-1080: the known-red list with each entry's code, owner and expiry` (keep its title; it now pins
  two empty lists, and its provenance comment cites run 38393751564).
- The unexpected-pass reason reads as if the item failed. Make it name what happened: for example
  `unexpected-pass: listed as known red (missing-entry, R-1057, until 2026-10-24) but passed`. Title:
  `reporting: an unexpected pass names the listed code and owner`.

## Item 2 — the doctor reason names every row off the note list (R-1081)
Today the doctor line names only the FIRST `·` row off the note list, so nobody can see the full set from a CI
log. Name every such row's label (padding collapsed, `; `-joined), still one line; if the list exceeds the
200-character cap, end with `… and N more`. Title: `doctor: the reason names every note row off the note list`.

## Item 3 — seal the win32 doctor note list from a real Windows run (R-1081)
Commit items 1–2 and push (draft PR #4 runs CI). Read the Windows `install-check` job's doctor line. Add to
`DOCTOR_NOTES.win32` ONLY rows that are `·` by design, each with a provenance comment naming its source:
- the four `hook <script>` rows that read `skipped (win32)` — by design in the hooks lane (its CHANGE §3: "The
  hook-file rows keep 'skipped (win32)'"; row R-937);
- the `Claude Code hooks floor` note row — by design (row R-1060).
Any OTHER row off the list is a finding, not a note: do not add it; report it verbatim. Update
`pin R-1081: the doctor note list`. Push again and confirm the Windows `install-check` job concludes success
with every line PASS. Report both runs' Windows item lines verbatim.

## Done — do not report DONE until all of these pass on your last commit
`seat-titles.mjs 4` → `0 missing` (and `2d`, `2e`, `3a`, `3b` still 0); `npm run req:tree`; `npm run map:check`;
`npm run readme:check`; `npm run test:locked` (0 failed); the acceptance script (exit 0); the seat runner
`SEAT_MUTATE_OUT=docs/reviews/install-check-2026-10-12/seat-mutate-build4-output.txt node docs/reviews/install-check-2026-10-12/seat-mutate.mjs`
→ `0 survived`, no ANCHOR-MISS (report an ANCHOR-MISS; do not edit the runner); and the Windows
`install-check` job green. The macOS and Linux SUITE legs are red for an upstream reason (pi-codemode 1.2.0; a
separate lane pins it) — ignore those, but report anything else.

## Rules
Brief 2a's rules hold. Do not edit `acceptance.mjs`, `seat-titles.mjs`, `seat-mutate.mjs`, `CHANGE.md`,
`HANDOFF.md`, `docs/sessions/`, or `.github/workflows/ci.yml` (the CI pin lane owns the install lines).

## Report
≤ 25 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; both CI run IDs with the Windows item
lines verbatim; each row added to the note list with its source; any row you did NOT add, verbatim; the
`test:locked` summary line; the runner's last line; the one claim most likely wrong.
