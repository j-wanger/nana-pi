# memory-shaper — scored runs (counts only)

Seat runs on 2026-10-31, tip e1eddf69, sealed values in `sealed.txt` (prompt hash matches R-3268). Inputs frozen: the private transcript snapshot of the labelled set, `--until 2026-10-31T18:16:00Z`, review folders at e5db630e. Labels: the blind set made for the rule run; the shaper never saw them.

Canary on synthetic fixtures: build 1 failed every call (array-rooted schema); build 2 classified both units, 1 call, 1,839 tokens, USD 0.008.

Unit counts, both runs: owner turns 573, skipped 340, asks 23, review titles 146 — equal to the labelled enumeration.

| | rule run (memory-making) | shaper run 1 | shaper run 2 | bar |
|---|---|---|---|---|
| correction recall | 8/46 | 28/46 | 26/46 | at least 0.70 |
| decision recall | 119/162 | 135/162 | 147/162 | at least 0.70 |
| lesson recall | 56/56 | 54/56 | 54/56 | at least 53/56 |
| precision | 183/310 | 217/318 | 227/329 | at least 0.80 |
| unlabelled | 0 | 0 | 0 | 0 |
| calls / cost | 0 / USD 0 | 39 / USD 0.99 | 39 / USD 0.44 | — |

Outcome under the plan: both runs miss the bar on correction recall and precision, so the rules stay the maker and the owner gets a decision point. The shaper beats the rule run on correction recall, decision recall and precision in both runs, and loses two lessons.
