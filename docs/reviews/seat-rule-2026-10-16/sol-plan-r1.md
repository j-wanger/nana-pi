### MUST

1. **The rule makes load-induced false failures the default.**  
   `nana-seat.proposed.md:11` tells the seat to split a long mutation run while starting other independent work. The plan says copied runners default to five shards and acknowledges five wall-clock tests can fail under this load. A realistic seat can run those shards beside a builder’s full suite, then send back a false failure or widen a valid bound. The “re-run alone” mitigation exists only in the planned HANDOFF residual, not the guide installed in other projects. Defer mutation splitting until the shared runner and runtime map land, or put the required isolation check in the operative rule.

### SHOULD

1. **The new rule conflicts with the existing end-turn instruction.**  
   `nana-seat.proposed.md:5` says to end the turn after launching each builder. Line 11 says to start every independent item now. An honest seat can follow the first instruction and continue running lanes serially. State that independent work starts before the seat ends its turn.

2. **The planning slot omits part of the owner’s chosen boundary.**  
   The chosen option defined planning as having no worktree and no build. The guide says only “one more in planning”; the missing boundary appears solely in `CHANGE.md`. Put the boundary in the guide or explicitly obtain a different ruling.

3. **The six-step list conflicts with the established final-review sequence.**  
   `nana-seat.proposed.md:11` orders “review, land,” while the working pattern requires the seat land review and final notes inside the change before the final independent review. Following the new list literally can produce a post-review commit and a refused land. Keep only “each lane’s own steps in order,” or describe the real sequence.

4. **The committed pair simulator does not run.**  
   `docs/reviews/seat-rule-2026-10-16/sim-pairs.mjs` still uses paths from its former `probe/` layout. Running it fails with `ENOENT` for `docs/reviews/nana-seat.proposed.md`; its shared-template path is also wrong. Therefore the committed artifact does not substantiate the claimed 19/19 result.

5. **The “no other bullet” test still misses numbered bullets.**  
   `proposed-seat-rule.test.mjs:46` counts only `-`, `*`, and `+`. Appending `1. Run three lanes.` leaves every check green despite the reworded requirement forbidding any other bullet. Count numbered Markdown bullets and add a wrong-code pair.

VERDICT: SEND-BACK
