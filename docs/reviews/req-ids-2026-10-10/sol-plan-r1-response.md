# Seat response to sol plan review r1 (SEND-BACK, 6/10)

| Finding | Verdict | Change |
|---|---|---|
| MUST 1 — Python `\d` matches Unicode digits | Accepted | ASCII `[0-9]` in both rails, in the grammar and the near-miss candidate; non-ASCII digit fixtures in both. |
| MUST 2 — `templates-render`, `templates-update` and the tree test's index selectors would silently weaken (Fable was wrong) | Accepted | All in scope; `requirement-rows.test.mjs:80` stays (it reads R-001–R-019 on purpose). |
| MUST 3 — define fences and unrelated tables | Accepted: context-free | Any column-zero `^\|\s*[RG]-\S` line that is not a requirement row fails, fences and other tables included (the rail already reads a valid row anywhere). Checked locally: all 1,012 nana-pi candidates, 22 Part G, both templates, 365 work-project and 165 basketball-geek candidates are valid rows. Fixtures for a fenced example and an unrelated table. |
| MUST 4 — missing closing pipe | Accepted | A requirement row is defined (column zero, both pipes, four cells, valid ID); missing pipes fail in both rails; the Python compatibility break is declared, and the template ledgers' ID line says a row needs its closing pipe. |
| MUST 5 — test matrix | Accepted | §5 lists the matrix in both rails and both files with exact locations; `seat-verify-ids.mjs` runs it (red on today's code, as expected). |
| SHOULD 1 — rows in FEAT-028, tighten R-1001 | Accepted | R-1001 reworded around the defined candidate and requirement row. |
| SHOULD 2 — share R-1001 too | Accepted | Both rows proposed for FEAT-014. |
| SHOULD 3 — "R-nnn" wording | Accepted | README and four skills in scope. |
| SHOULD 4 — stacked base | Accepted | §4: the tree lands at its reviewed revision; this lane's final review covers `eeeca20..tip`; rebase and re-review if the tree changes. |
| NOTE — near-miss claim attributed to the consult | Fixed | Now reproduced locally (§2). |
| NOTE — historical parsers | Accepted | Named as frozen exceptions in NOT. |
