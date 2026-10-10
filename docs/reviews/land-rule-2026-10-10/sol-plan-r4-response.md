# Response to sol plan review r4 (over the cap, SEND-BACK, 7/10) — seat, 2026-10-10

All four findings were checked and taken. `CHANGE.md` now reads:

| Finding | Change |
|---|---|
| MUST snapshot reservations escape the in-flight check | R-1006 covers a review of a named commit or of a working-state snapshot of it. Design: a live reservation matches when its `revision` or its parsed head (before `+snap:`) equals a named commit, under any item. Test: a dirty-tree snapshot review of the commit in flight refuses the land. |
| MUST blind mark stripping manufactures LAND | No characters are deleted before matching. The raw line is matched against one pattern in which markdown and code marks are allowed only as wrappers around the label, the word, the score and the line. R-969 says so; R-1010 records an empty verdict for anything else, a mark inside the word or score included. Tests: `L_A_N_D`, `L*A*N*D`, a backtick inside the word. |
| SHOULD old land process at cutover | Declared in §5: a land started from the old code before the first version-2 record merges on its earlier reading; deploy with no land process running. |
| SHOULD "trailing punctuation" too broad | R-969 names exactly one trailing `.`, `,`, `;` or `:`. Tests: `LAND!` and `LAND...` record an empty verdict. |
