# Post-hoc YOUR CALL rubric

`extract.mjs` applies this fixed binary rubric to every decision block that begins with a `YOUR CALL` marker in the extracted corpus for the selected mode (baseline or treated after). A decision continues through following numbered or labeled part paragraphs, up to the next marker. Parts score when their signal appears in the corresponding ordered part paragraph. This is a mechanical post-hoc proxy, not a claim of semantic completeness.

| Ordered part | Signal scored |
|---|---|
| What was tested | `tested`, `test`, `checked`, `ran`, or `measured` |
| Result in plain numbers | A numeric token |
| Trade | `trade`, `trade-off`, `risk`, `cost`, `but`, `while`, `versus`, or `vs` |
| Recommendation | `recommend`, `recommendation`, `should`, `choose`, `prefer`, or `propose` |
| Why Jake decides | `your call`, `Jake`, `you decide`, or `your decision` |

Current after extract (`2026-10-04` through `2026-10-07`) scores each marker-bounded decision in the 25 extracted messages. A redacted golden fixture pins two decisions, their five ordered part slots, and scores. The script prints session ID, message timestamp, ordered part signals and total without message text. Re-run against the same transcript snapshot to reproduce the scores.
