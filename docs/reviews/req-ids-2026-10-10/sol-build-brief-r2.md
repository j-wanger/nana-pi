# Review brief — four-digit requirement IDs, build round 2, 2026-10-10 (reviewer: gpt-5.6-sol; roles: scope + adversarial + compatibility)

Round 1 (`sol-build-r1.md`, yours; `astra-land-r1.md`) sent the lane back for one regression: valid
rows with CRLF or trailing whitespace were rejected. Two builder rounds fixed it (`build-brief-2.md`,
`build-brief-3.md`, `builder-report-2.md`, `builder-report-3.md`). The seat added a second class
before review: the two rails disagreed about what a LINE is (Python `splitlines()` breaks at U+2028,
U+0085, form feed and lone CR; JS `.` skips U+2028; `trimEnd()` and `rstrip()` strip different
sets), and the TypeScript rail silently dropped a valid row. The definition now, in both rails: a
line is the text between "\n" characters; only spaces, tabs and "\r" are stripped from its end.

Review `git diff 4111aa9..HEAD` closely, and confirm the whole change `eeeca20..HEAD` still holds:
nothing reaches main unless an independent reviewer accepted it, and your verdict covers it all.

## Attack
1. **Line definition parity.** Feed both rails the same fixtures (OS temp dir; TS through
   `scripts/requirements-trace.mjs`, Python through the template `conftest.py` under
   `uvx --with pytest python`). Hunt for any input where they disagree: other control or separator
   characters inside cells or after the closing pipe, a UTF-8 BOM at the start of a ledger or a test
   file (Windows editors write one), CRLF in a `req:` marker list, a last line with no newline.
2. **No silent skip.** Any line that the near-miss check calls a valid row must be loaded as a row,
   in both rails. Any candidate that is not a row must fail, naming file and line.
3. **Round-1 MUST closed.** CRLF ledgers and general files, spaces or a tab after the closing pipe;
   a row missing its closing pipe still fails.
4. **Tests pin the clauses.** For R-1000 and R-1001 evidence: break the code (drop the `s` flag, put
   back `splitlines()`, put back `trimEnd()`) and see the named tests go red.
5. **Scope.** `git diff --stat 4111aa9..HEAD`: the rails, their self-tests, the pack trace test,
   the two template ledgers' row sentence, `REQUIREMENTS.md` evidence cells, review records,
   `HANDOFF.md` wording. No other row's cells changed.
6. **Acceptance script.** `node docs/reviews/req-ids-2026-10-10/seat-verify-ids.mjs` must exit 0.

## Output
Answer with the full review as your final message. MUST / SHOULD / NOTE with file:line, evidence and
the smallest fix; score; last line exactly one of `VERDICT: LAND`, `VERDICT: LAND-WITH-FIXES`,
`VERDICT: SEND-BACK`.
