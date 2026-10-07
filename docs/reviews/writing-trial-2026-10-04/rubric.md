# Post-hoc YOUR CALL rubric

`extract.mjs` applies this fixed binary rubric to every paragraph containing `YOUR CALL` in the extracted corpus for the selected mode (baseline or treated after). A part scores 1 when its signal appears in that same paragraph, otherwise 0. This is a mechanical post-hoc proxy, not a claim of semantic completeness.

| Ordered part | Signal scored |
|---|---|
| What was tested | `tested`, `test`, `checked`, `ran`, or `measured` |
| Result in plain numbers | A numeric token |
| Trade | `trade`, `trade-off`, `risk`, `cost`, `but`, `while`, `versus`, or `vs` |
| Recommendation | `recommend`, `recommendation`, `should`, `choose`, `prefer`, or `propose` |
| Why Jake decides | `your call`, `Jake`, `you decide`, or `your decision` |

Current after extract (`2026-10-04` through `2026-10-07`) scores every detected decision paragraph in the 25 extracted messages. The script prints session ID, message timestamp, five booleans and total without message text. Re-run against the same transcript snapshot to reproduce the scores.
