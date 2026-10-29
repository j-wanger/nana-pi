# records-counts plan attack · 2026-10-29

Checked against `scripts/product-report.mjs` (`didNotPass`, `runStateOf`, the Broken block, the Records render), `scripts/test.mjs` (the only labels written are PASS, FAIL and SKIP; SKIP is a whole-file declared skip at 0 s), `.github/workflows/pages.yml`, the runtime file at `.git/nana/runtime-map.json` and the R-2922 and R-3050 fixtures.

## What holds

- A1's mapping is right. With only PASS, FAIL and SKIP, `notPassed - failed` is exactly "every cited file recorded, all SKIP". The word "skipped" is honest for those rows.
- A2 holds for Pages. That build has no runtime file under `.git`, so `runtimeData` is null and the summary shows the no-run form, not zeros. R-3081 pins that.
- Phone width is fine. The summary is plain text, and `body{overflow-wrap:anywhere}` applies at 600 px and below. The line is about 75 characters, so it wraps to two lines at 380 px with no sideways scroll.

## MUST

- **M1. "Broken 5" now reads as the total of the three new counts.** The block called Broken holds violated, failed, skipped and unmeasured. The summary keeps `Broken` as the label for violated rows only. `Broken 5 · failed 0 · skipped 6 · unmeasured 1` invites "5 broken, of which 0 failed", but 0+6+1 is 7. "failed" also leaves out violated rows. A violated row whose cited test FAILs shows in Broken and never in failed. Today's five violated rows cite no tests, so this case is only a risk for now. Fix: label the first count by what it counts. Use `Records: violated 5 · failed 0 · skipped 6 · unmeasured 1 · Gaps 0 · Stale 34`, or `Broken: violated 5 · failed …`. Change the R-3080 and R-3081 strings to match. The reader's three words stay as they are.

## SHOULD

- **S1. R-3080 pins a false zero.** The R-2922 fixture has no deliverable lines, so its Gaps block reads `no deliverable lines`. The plan makes `Gaps 0` an exact must-meet string there. That locks in the zero-for-no-data fault this lane exists to remove (A5), and a later fix would then break a must-meet row. Fix: add one `Deliverables:` line to the R-3080 fixture, as the R-3050 fixture has, or keep Gaps and Stale out of R-3080's exact match.
- **S2. The three counts do not cover every case, and the summary hides that.** A row citing one SKIP file and one file with no run is in none of them. The known-bug list already has this line for the not-passed list. Adjacent counts read like a split of everything, so the summary is where the gap misleads. Fix: extend that known-bug line to the summary. No code change is needed, and no such row exists today.
- **S3. One thing, three names.** The summary says `unmeasured`. The block says `implemented rows with no recorded run`. The Stale block's `age not measured` means something else on the same page. Fix: keep the reader's word, and add `(unmeasured)` to the block's no-run label. That stops the two from drifting apart. The plan already adds label keys, so this costs one string.

## NOTE

- **N1. The run's age stays in the block, not the summary.** `failed 0` from an old or changed run reads as current. This is acceptable because the block is one click away. Say so in the R-3080 row text.
- **N2. Rows wider than their tests.** All counts are rows, not checks. A row citing a PASS file and a SKIP file counts as passed, even when the skipped file holds the cited check. So `skipped` undercounts. The legend and an existing known bug already say this. No change is needed.
- **N3. A6 does not bite here.** No implemented row in this ledger lacks a cited test. A Python or hand-tested project would leave those rows out of every count. That is covered by the existing known bug for projects with no runtime data.
- **N4. `Broken 0 · no recorded run` can read as if the missing run explains Broken.** Fix: write `runs: none recorded`, or put the no-run words after a separator the way the block does. This is optional.
- **N5. R-3082 only tests one thing.** It proves the render no longer parses block text. It does not prove the summary matches the block. That match rests on R-3080 sharing variables in one fixture, which is enough for this lane.
