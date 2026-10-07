# Post-hoc YOUR CALL rubric

`extract.mjs` applies this fixed binary rubric to every paragraph containing `YOUR CALL` in each extracted baseline unit. A part scores 1 when its signal appears in that same paragraph, otherwise 0. This is a mechanical post-hoc proxy, not a claim of semantic completeness.

| Ordered part | Signal scored |
|---|---|
| What was tested | `tested`, `test`, `checked`, `ran`, or `measured` |
| Result in plain numbers | A numeric token |
| Trade | `trade`, `trade-off`, `risk`, `cost`, `but`, `while`, `versus`, or `vs` |
| Recommendation | `recommend`, `recommendation`, `should`, `choose`, `prefer`, or `propose` |
| Why Jake decides | `your call`, `Jake`, `you decide`, or `your decision` |

Current extract run (`2026-10-04` through `2026-10-18`): three detected decision paragraphs. `extract.mjs` prints the session ID, message timestamp, five booleans, and total for each; no message text is included. Re-run it against the same transcript snapshot to reproduce the scores. This scan is incomplete as a trial result because its report corpus does not yet match the audited corpus (10-05: four extracted units versus 14 expected report-sized finals).
