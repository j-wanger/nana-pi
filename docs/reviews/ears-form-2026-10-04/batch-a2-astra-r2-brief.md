# Review brief — EARS split batch A2, ROUND 2 (reviewer: gpt-6-astra)

Round 1 was BLOCK 6/10 (`batch-a2-astra-r1.md`). The fix commit is `74f6168`, in worktree `~/nana-pi-wt/ears-a2`. The seat tightened the status rule after round 1: a split row is `implemented` only with an EXECUTED mutation, recorded in the mapping, that turned its cited assertion red. The verifier now enforces this (`mutationRecords: true`).
1. Re-derive closure of every round-1 item: R-796, R-812 and R-816 (re-run your mutations); the rejected merges R-142 and R-193 (now split); R-803's condition; R-806, R-807, R-825 and R-827; the standalone sentences.
2. Replay one recorded mutation per 5 recorded ones from `batch-a2.json` (pick by seed `74f6168`: every 5th record in file order, starting at index 2). Does each still turn its cited assertion red?
3. Redraw a NEW 20-row sample of the `implemented` split rows with seed `74f6168`: sort the IDs, take `(n * 11 + 5) mod count`, unique, filling forward, excluding rows you mutated in round 1 where possible. Report PINS or PARTIAL.
4. Report any new defect the fix introduced, including in the verifier's new mutation-record check.
Verdict as before. The landing bar: no lost or hidden promise, and PARTIAL at or under 2 of 20.
