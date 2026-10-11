# Lane land-rule — continuation 6: four tests that never ran (seat, after build 6 DONE)   (2026-10-10 · feat/land-rule)

The seat ran 15 mutation pairs (`seat-mutate.py`; result `seat-mutate-output-b6.txt`): 11 red, 4
not. The cause is one defect. In `packages/nana-pack/tests/review-ledger.test.mjs`, `check(n, ok,
info)` takes a BOOLEAN, but build 6 wrote four tests as `check("title", () => { … })`. A function is
truthy, so each prints PASS and its body never runs: "complete records the LAND corpus forms and
final SEND-BACK" (R-969), "complete records an empty verdict for malformed verdict suffixes"
(R-1010), "complete appends every verdict at v2 and returns the revision ordinal" (R-1008), "report
prints one line per verdict on a revision" (R-970). Those rows cite tests that check nothing.

- [ ] **A.** Rewrite the four so their bodies run and their assertions are real `check(…, boolean)`
  calls, keeping each title and its `// req:` marker. A failing assertion must print a FAIL line that
  contains that title (the mutation runner matches it): one boolean `check` per title, or inner checks
  whose titles begin with it.
- [ ] **B. Fix the class.** Make this file's `check` refuse a function argument — it records a FAIL
  naming the title ("check takes a boolean, got a function") — so the mistake cannot pass again.
- [ ] **C.** `python3 docs/reviews/land-rule-2026-10-10/seat-mutate.py` (frozen; it applies each
  mutation, runs the named test file, and restores with `git checkout`) must print
  `mutations: 15/15 red` and `worktree clean`. Do not edit it; if a mutation's anchor no longer
  matches because you changed that code line, report it.

Then: `npm run req:tree`, `npm run map:check`, `npm run test:locked` (must pass; report the summary
line), commit, both seat acceptance scripts into `seat-verify-land-output.txt` as before (both exit
0), and the mutation runner's output into `seat-mutate-output.txt`; commit. Rules as `build-brief.md`.
Frozen as before, plus `seat-mutate.py`. Report ≤ 20 lines, first line `VERDICT: …`, the checklist
ticked, and the runner's last two lines verbatim.
