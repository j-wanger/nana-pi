# Post-hoc YOUR CALL rubric

`extract.mjs` applies this fixed binary rubric to every decision block it finds, marked by `YOUR CALL` in an extracted message (baseline or treated after). A decision continues through following numbered or labeled part paragraphs, up to the next marker. Parts score when their signal appears in the corresponding ordered part paragraph. This is a mechanical post-hoc proxy, not a claim of semantic completeness.

| Ordered part | Signal scored |
|---|---|
| What was tested | `tested`, `test`, `checked`, `ran`, or `measured` |
| Result in plain numbers | A numeric token |
| Trade | `trade`, `trade-off`, `risk`, `cost`, `but`, `while`, `versus`, or `vs` |
| Recommendation | `recommend`, `recommendation`, `should`, `choose`, `prefer`, or `propose` |
| Why Jake decides | `your call`, `Jake`, `you decide`, or `your decision` |

At the inclusive cutoff `2026-10-07T09:47:20.003Z` (UTC), the after corpus has 25 messages and the rubric scores all 7 decisions it finds, in messages marked `YOUR CALL`. A hand read found five more unmarked decisions; those are a declared residual and are NOT scored automatically. A redacted golden fixture pins complete and incomplete decisions, their exact ordered part slots, and scores. The script prints session ID, message timestamp, ordered part signals and total without message text. Re-run the after command in `after.md` to reproduce the cutoff and snapshot numbers.
