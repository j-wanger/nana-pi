# Review brief — four-digit requirement IDs, build, 2026-10-10 (reviewer: gpt-5.6-sol; roles: scope + adversarial + compatibility)

You reviewed this lane's plan three times (`sol-plan-r1..r3.md`; LAND-WITH-FIXES at r3, fixes in
`sol-plan-r3-response.md`). A pi luna builder built it (`build-brief.md`, `builder-report-1.md`).
Review `git diff eeeca20..HEAD` — per the owner's 2026-10-10 rule nothing reaches main unreviewed, so this
review also covers the requirements tree's last review record (`c4332ec`, docs only) and the seat's
`HANDOFF.md` update (today's rulings, the new priority, the queue).

## Attack
1. **Grammar.** Both rails: ASCII-only, three digits or four not starting with zero, rows and markers.
   Try to sneak past it: Unicode digits, `R-0999`, `R-10000`, `R-1000a`, tabs, a marker list mixing
   good and bad IDs. Run fixtures in the OS temp dir through `scripts/requirements-trace.mjs` (TS) and
   the template `conftest.py` under `uvx --with pytest python` (Python).
2. **Near-miss rows.** Each raw file, before the Part G merge, exact `<file>:<line>`; fences,
   unrelated tables, `G-` candidates, missing closing pipe. Can a near-miss slip through when a
   general file is present, or when the near-miss is the last line without a trailing newline?
3. **The tree checker.** Four-digit rows placed, counted, rendered; `Also applies: R-1000`; ranges
   crossing R-999 → R-1000; no leftover `\d{3}` requirement-ID pattern in live code.
4. **Rows.** R-1000 and R-1001: does each cited test pin its clause, in both rails? Break the code and
   see a test go red.
5. **Templates.** `npm run template:accept` (renders scaffold and adoption modes in both languages and
   runs their suites) — re-run it if you doubt the builder's report. Template ledger wording.
6. **Scope.** `git diff --stat eeeca20..HEAD`: within CHANGE §3's allowlist plus the declared review
   record and `HANDOFF.md`; frozen files unchanged; no other row's cells changed.
7. **Acceptance script.** `node docs/reviews/req-ids-2026-10-10/seat-verify-ids.mjs` must exit 0.

## Output
Answer with the full review as your final message. MUST / SHOULD / NOTE with file:line, evidence and
the smallest fix; score; last line exactly one of `VERDICT: LAND`, `VERDICT: LAND-WITH-FIXES`,
`VERDICT: SEND-BACK`.
