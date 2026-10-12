# Lane install-check — build brief 3a (2026-10-12 · feat/install-check · worktree ~/nana-pi-wt/install-check)

**Builder: pi gpt-6-luna.** Fresh session, THREE items. The seat's mutation runner (`seat-mutate.mjs`, this
folder; output `seat-mutate-build2-output.txt`) ran CHANGE §5's pairs at `7b6c650`: 38 of 44 red, 6 survived.
It also found the defects below. Items 1–3 fix them; brief 3b will take the surviving pairs.

## Item 1 — the test harness never awaited async cases (every row the async cases cite)
`check` in `tests/install-check.test.mjs` calls `fn()` without awaiting it, so 30 of the 81 cases print PASS
before they run; a failing async case shows only as an unhandled rejection, and a case that never settles
passes silently (that is how pair 18 survived).
- Make `check` record each case, then run them IN ORDER with `await`, each under a per-case limit (a named
  constant at the top of the file with a `chosen` provenance comment); a rejection or the limit is a FAIL with
  the title. A non-zero exit when any case fails. A case's function returning a non-promise still works.
- Then run the file. Every case that now FAILS was never really tested: fix the CASE when its fixture is
  wrong, or the CODE when the case proves the code wrong (say which in the report). Titles do not change.
- Wrong code first: before the fix, add one async case that must fail and see it print PASS; after the fix it
  prints FAIL; then remove that probe case (it is not a test).

## Item 2 — ONE verifier entry admitting every tool of its row (R-1074, R-1077, R-1082)
The config has two verifier rows, Bash and PowerShell, each needing its OWN entry. The Claude Code seat's hooks
lane (cc-hooks-windows, landing first) writes ONE verifier entry with matcher `Bash|PowerShell` on win32
(`WIN_VERIFIER_MATCHER`, cc R-1053). Against that shape this check reports the PowerShell line and the hook
set missing forever, so the win32 known-red list could never empty. CHANGE §2's table has ONE verifier row
whose tools are `Bash` everywhere plus `PowerShell` on win32.
- One verifier row with `tools` per platform; `mapHookEntries` maps ONE entry to it whose matcher admits every
  tool (CHANGE §2's matcher rule); the output keeps one line per tool, labels unchanged:
  `hook verifier pipe (Bash)` everywhere and `hook verifier pipe (PowerShell)` on win32 only. The hit and miss
  samples run once per tool against that one entry.
- The known-red list keeps one entry per printed line. Update the hook-table pin.
- The three `verifier row:` titles in `seat-titles.mjs 3a`.

## Item 3 — timeouts and the output cap in the spawn adapter (R-1075, R-1076, R-1080)
- `bin/install-check.mjs`'s spawn adapter kills a child at its timeout but reports it as an ordinary close, so a
  hung hook prints `no-output` (a sealed known-red code) with no duration. It also cuts stdout at 10,000
  characters, so the runner's 10,000-character cap can never fail in a real run.
- Move the adapter into `lib/install-check.mjs` as an exported factory taking `child_process.spawn` (bin passes
  the real one) so it can be tested with a fake child. A timed-out child resolves with
  `error: { code: "ETIMEDOUT" }` and its duration; stdout and stderr are kept to 10,001 characters.
- The `spawn adapter:` and `timeout:` titles in `seat-titles.mjs 3a`.

## Done — do not report DONE until all of these pass on your last commit
`node docs/reviews/install-check-2026-10-12/seat-titles.mjs 3a` → `0 missing`, and `2d`, `2e` still `0 missing`;
`npm run req:tree`; `npm run map:check`; `npm run readme:check`; `npm run test:locked` (0 failed); the
acceptance script (exit 0; commit `acceptance-output.txt`). No push needed. Do not run `seat-mutate.mjs`
(the seat runs it after brief 3b).

## Rules
Brief 2a's rules hold. Do not edit `acceptance.mjs`, `seat-titles.mjs`, `seat-mutate.mjs`, `CHANGE.md`,
`HANDOFF.md`, `docs/sessions/`, or the cc-hooks-windows lane's files. Rows: flip none to `implemented` in this
session; say in the report which rows' cited cases were vacuous before item 1.

## Report
≤ 30 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; how many cases failed once the harness
awaited them, and for each whether you fixed the case or the code; the last line of `seat-titles.mjs 3a`; the
`test:locked` summary line; the one claim most likely wrong.
