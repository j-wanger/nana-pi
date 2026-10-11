VERDICT: DONE

- Commit: `9939da2` — `fix(nana-pack): support plain first-line review verdicts`.
- Files: `REQUIREMENTS.md`, `docs/code-map.md`, pack README, `review-round.mjs`, new `verdict-config.mjs`, `review-ledger.test.mjs`, and both seat output files.
- R-969: first-line score/BOM/line-ending cases and existing final-line forms.
- R-1010: malformed suffixes, corrections, conflicts, invisible characters and bounded look-alikes.
- Mutation pairs, red → green: final-only selection `null → LAND`; removed later-verdict guard `LAND → empty`; removed folding `LAND → empty`; allowed backticks `LAND → empty`; rejected bare score `empty → LAND`; raw first-line detection `LAND → empty`; Cf-only removal `LAND → empty`; retained BOM `empty → LAND`. Green: tagged review-ledger tests, 154 checks.
- Commands: `req:tree`, `map`, `map:check`, `readme:check`, `test:locked`, both seat verifiers, and `git diff --check` — all final runs exited 0.
- Suite: `133 files: 132 PASS, 0 FAIL, 1 SKIP, 0 WARN · checks: 6708 pass, 0 fail, 5 skip · 639.6s`
- Seat verdict output, last two lines:
  `corpus: 414 files, {"word":404,"empty":10}, 0 mismatch(es) with the prototype`
  `seat-verify-verdict: 0 mismatch(es)`
- Seat tests output has one line: `seat-verify-tests: 0 gap(s)`
- Scope: `d3b4d2c..HEAD` — 8 files changed, 174 insertions, 13 deletions. Worktree clean.
- Not done: `HANDOFF.md` and session archives were left untouched; no Windows run.
- Claim most likely wrong: a correction that avoids the word “verdict” after a plain first-line verdict can still leave LAND recorded.
