# Review brief, round 2: nana-pi audit fixes (reviewer: gpt-5.6-sol)

Your round 1 is `sol-r1.md` in this folder: BLOCK 6/10. The fixes are in commit `d3c9e5a`. The
worker's account is the "Round 2" section of `worker-report.md`. Same scope as `sol-brief.md`.

Re-derive closure of each r1 item by execution or source reading:
1. R-858 is `untested`, with no marker, and its evidence cell states the skip and the
   invocation gap. Does the rail stay green?
2. Every qualified sentence in `templates/_shared/working-under-nana-pi.md`: objective, handoff,
   notify, and the gate (auth under a relocated agent dir, the symlink-target scope, the loosening
   sentence). Is each now TRUE against the code, and is it still readable as agent instructions?
   `AGENTS.md` must hold a byte copy. Also check the pack README handoff bullet.
3. The addendum: the `✗` floor and the hash-suffix fact.
4. The Part G counts against the map.
5. `map:impact` usage in every place the worker changed. Run the documented command in a fresh
   TypeScript render.

Then any defect the fixes introduced. Do not re-raise what r1 recorded as verified.

Answer with the full review as your final message; do not write it to a file. Give ranked findings
(MUST / SHOULD / NOTE) with file:line, evidence and the smallest fix. End with `VERDICT: LAND` or
`VERDICT: BLOCK` and a score out of 10.
