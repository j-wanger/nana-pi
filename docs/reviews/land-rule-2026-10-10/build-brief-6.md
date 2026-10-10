# Lane land-rule — continuation 5: three items — the lock, in-flight reviews, the review-ledger rows (seat, after build 5 DONE)   (2026-10-10 · feat/land-rule)

Build 5 finished its checklist — good. This round is exactly three items. Do all three; report only
when the checklist is complete.

- [ ] **A. R-1005 (the locked final reading).** Today it cites "suite-time source revision change…",
  which does not pin it. Add tests in `land.test.mjs`: (1) an injected `runGit` and a spy on the
  exported lock call show that the second reading, the R-977 rechecks and the `merge --ff-only` all
  run INSIDE one lock call, and nothing after the suite runs outside it but the success output;
  (2) an injected suite (`runCommand`) records a verified SEND-BACK for the tip through
  `admit`/`complete` into the scratch `home` — written after the first reading and before the lock —
  and the land refuses with main unchanged. R-1005 cites only these.
- [ ] **B. R-1006 (in flight).** Today it cites "runLand requires verified reviews". Add tests: a live
  reservation (an `admit` with no `complete`, its owner alive — the test's own pid) for the tip
  refuses; one for a working-state snapshot of the tip (admitted with an untracked file present)
  refuses; a reservation for a DIFFERENT commit does not. R-1006 cites only these.
- [ ] **C. The review-ledger rows each get their own test.** Today R-1008, R-969 and R-1010 all cite
  one test. Split so each row cites what pins it: R-1008 — every completed verdict on one revision is
  appended at `v: 2` with item, role and model, the revision stays one round, and the round number
  `complete()` returns is the revision's ordinal (two revisions, three verdicts on the first → the
  second revision's first verdict reports round 2); R-969 — the corpus LAND forms in CHANGE §3
  (`VERDICT: LAND`, `# VERDICT: LAND`, `**VERDICT:** LAND`, `VERDICT: LAND.`, `(9/10)`, `— 9/10`,
  `**VERDICT: LAND — 9/10.**`, trailing spaces, CRLF) record the word, and the format line before a
  final SEND-BACK records SEND-BACK; R-1010 — the echoed format line, `LAND (fixes pending)`,
  `LAND — Fixes: none.`, `LAND, with fixes`, `L_A_N_D`, `L*A*N*D`, a backtick inside the word,
  `LAND!`, `LAND...` record an empty verdict; R-970 — the report prints one line per verdict for a
  revision with two verdicts; R-731 stays `untested` (unbounded storage has no test).

Then: `npm run req:tree`, `npm run map:check`, `npm run test:locked` (must pass; report the summary
line), commit, then both seat scripts into `seat-verify-land-output.txt` as before (both exit 0),
commit if changed. Rules as `build-brief.md`. Frozen as before. Report ≤ 25 lines, first line
`VERDICT: …`, with the checklist ticked.
