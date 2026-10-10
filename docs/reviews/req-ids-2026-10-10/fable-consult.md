# Fable consult on the four-digit ID plan (2026-10-10)

| # | Fable's point | Seat response |
|---|---|---|
| 1 | Keep the grammar. Nothing else in the repo parses IDs. Drop the edits to `templates-render`, `templates-update` and `requirement-rows`: their fixtures can never hold a four-digit ID. | Adopted. |
| 2 | Keep the near-miss rule, but it must read each RAW ledger file before the Part G merge: every rendered project has `REQUIREMENTS-general.md`, the TypeScript rail checks merged text (wrong line numbers), and the Python rail drops `|` lines from project text before loading. The fixture must write a general file. A wrong cell count already throws; only missing-pipe and bad digits are silent. No existing ledger (nana-pi, Part G, aml-desk, basketball-geek) has a near-miss line. | Adopted: raw-file reader per rail, `<file>:<line>` errors, general-file fixtures, R-1001 names both files, cell-count claim corrected. |
| 3 | Drop R-1002 (numeric order): cosmetic. | Adopted; declared residual. |
| 4 | Keep R rows in FEAT-028. But R-1000 says "the trace rail" (both) while the cited nana-pi test drives TypeScript only: pin Python in nana-pi's suite (uvx pytest, skip-gated), or the row overclaims. Template self-tests ship unmarked. | Adopted. |
| 5 | Stacking is fine; land req-tree then req-ids. Skip the separate sol plan review: this consult is the plan challenge. | Stacking adopted. Plan review kept: Jake set "plan, then an independent review from sol" as the process. |
| 6 | basketball-geek is at `v0.4.0` with the older pytest-marker rail: taking the new tag is a marker migration, not `copier update`. aml-desk: hand edit, no urgency. | Adopted in follow-ups. |
| 7 | Share R-1000 to FEAT-014 (the template ledger's ID sentence is FEAT-014 text); not R-1001. | Adopted. |
| 8 | Facts: eight IDs below 1000 are unassigned besides the reserved one; the intro calls R-373–R-375 unused. The tree's ROW is a prefix match used to recognize row-shaped lines: importing the rail's full-line ROW would change it — export `ID` and build the prefix from it. | Wording made precise (five usable, R-373–R-375 tombstones); prefix design adopted. |

Fable's insisted change: the near-miss reader on raw files before the Part G merge, with a
general-file fixture. Its claim most likely wrong: that the Python merge path hides a near-miss —
`_row_cells` on raw text could carry the check; the plan now says where.
