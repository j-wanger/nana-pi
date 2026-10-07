# Writing trial — baseline (landing day, 2026-10-04)

The report corpus is seat sessions only: project dirs without `-wt-`, entries with `isSidechain` false. Worker sessions report to the seat, not to Jake, and they write differently (8% over cap against the seat's 31%). Re-baseline and the comparable strict/lenient verdict counts: [rebaseline.md](rebaseline.md).

## Measured with the landed checker

| Corpus | Sentences | Over 25 words | Passive candidates | Banned | Verdict first | Identifiers (`--report`) | Measured by |
|---|---|---|---|---|---|---|---|
| `HANDOFF.md` on main, post-merge | 132 | 55 (42%) | 16 | 1 | n/a | 211 | seat, after the merge |
| `HANDOFF.md` on main, pre-merge | 125 | 54 (43%) | 16 | 1 | n/a | 202 | Fable, land-ruling.md §7 |
| `docs/sessions/*.md` | 413 | 175 (42%) | 34 | 9 | n/a | n/a | Fable, land-ruling.md §7 |
| Seat reports, last 14 days (35) | 1,178 | 370 (31%) | 183 | 0 | 6/35 | 1,676 (48 each) | Fable, land-ruling.md §7 |

## Targets (Amendment 1 A2: a quarter of the measured share)

- `HANDOFF.md` lines added during the trial: 11% or fewer over the cap.
- Reports: 8% or fewer over the cap.
- A verdict word in the first sentence of 90% of reports.
- Zero banned words.
- Identifiers per report have no target. The count is recorded, and Jake judges it.

## Stop condition

The trial stops on the first of these: 2026-10-18 (day 14), the twentieth report checked, or Jake's second complaint that a report dropped detail he needed. Then `after.md` measures the `HANDOFF.md` lines added since landing and the reports since landing. The verdict is one of: adopt, extend once (14 more days), or drop (remove the rule, the extension and the checker).
