# Amendment A1 to the req-tree plan (seat, 2026-10-09, after astra land review r4)

astra r4 NOTE 3: the ledger intro's ID-blocks paragraph still says "R-287–R-299 stay the reserve",
although this change consumes R-287–R-291. The approved plan froze the intro except one phrase,
so the builder could not correct it. Every lane that consumes IDs records them in this paragraph;
this is that bookkeeping, not a product decision. The seat authorizes exactly one more intro edit,
and reports it to Jake at checkpoint 2.

From: `R-285 and R-286 consumed 2026-10-09 (Jake's builder knowledge ruling: the worker skip and the pi-worker role), R-287–R-299 stay the reserve`

To: `R-285 and R-286 consumed 2026-10-09 (Jake's builder knowledge ruling: the worker skip and the pi-worker role), R-287–R-291 consumed 2026-10-09 (the requirements tree), R-292–R-299 stay the reserve`

`prove.mjs` reads this edit from `amendment-A1.json` at the commit that adds it (passed as
`--amendment <sha>`), applies it after the frozen `intro_edit`, and accepts no other intro change.
