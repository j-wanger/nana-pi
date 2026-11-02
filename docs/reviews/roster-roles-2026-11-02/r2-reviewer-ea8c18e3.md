The merge itself is clean, but the tip can't land: a main test that passed on main now fails at a423f8cf, so I'm sending it back.

## The merge (bb4053f0..HEAD)

- **Main's changes came in whole.** I recomputed the merge of bb4053f0 and 4eda88e2 with `git merge-tree`. Only `docs/code-map.md` conflicted. HEAD equals that clean merge plus four things:
  - the renumbering;
  - the regenerated module count (591, and `npm run map:check` passes);
  - the four known-bug lines;
  - the new lane-folder logs.

  Every file that differs from main is a file the lane already changed, `docs/known-bugs/FEAT-041.md`, or a new file in the lane folder. Everything else is identical to main, so lines main deleted stay deleted. FEAT-013 and FEAT-031 known-bug files match main exactly.
- **The lane's behaviour and rows are kept.** I compared each lane file's change before and after the merge (by patch ID). All but six are identical, including `docs/sessions/2026-10.md`. The six are the two generated files plus the renumbering in `REQUIREMENTS.md`, `worker-config.mjs`, `nana-roster.test.mjs` and `seat-rule.test.mjs`. In those three code files only a `req:` tag or `contract:` comment changes. The row diff against main matches the tree movement in the brief.
- **The renumbering is complete.** Outside `docs/reviews`, R-3530 and R-3531 now appear only for main's rows (`REQUIREMENTS.md:3029-3030`), main's two tests and the generated tree. R-3536 and R-3537 appear only for this lane's rows, R-1140's cross-reference, the generated tree, the two test tags and the `worker-config.mjs` comment. No requirement ID appears twice, and main holds no ID from R-3532 to R-3537.
- **The known-bug lines are accurate.** The four new FEAT-041 lines match the reviewer's NOTEs 1–3 and the land reviewer's NOTE nearly word for word. The reviewer's NOTE 4 (by design, already covered by the widget-wrap known bug) and NOTE 5 (no defect) rightly got no line.
- **Checks I ran on the tip all pass:**
  - map check, readme check, requirements trace, tree check, known-bugs check and identity scan all exit 0;
  - the lane's five touched test files: 101 pass, 3 skip;
  - five tests that failed in the last CI run because of the ID collision now pass (`requirement-rows`, `requirements-trace`, `requirements-tree`, `requirements-unclaimed`, `product-report`: 267 pass).

## Findings

1. **MUST: `hive-city.test.mjs` fails its R-3187 check at this tip, on every platform.**
   - **Cause:** the lane's `pi-worker.mjs` refactor (d02c4ff5). It removed the line `promptParts.push(Buffer.from('\n\n'), Buffer.from(digest.text))`. R-3187's flow table needs exactly one line matching `/promptParts\.push\([^;]*Buffer\.from\(digest\.text\)/` for the hive city's `ledger/bay-1` flow. The digest is now delivered at `packages/nana-pack/bin/pi-worker.mjs:245` (`promptBytes: [...]`), which the pattern does not match.
   - **Input:** `node scripts/test.mjs hive-city.test.mjs`, or the CI suite on the tip.
   - **Result:** `FAIL R-3187 … ledger/bay-1: evidence line missing or duplicated`. I reproduced it locally on macOS at a423f8cf.
   - **CI:** the last finished run (41399047593, on c30fdc81) failed the same check on macOS, Windows and Ubuntu. The merge did not cause it: main changed neither file. Five of that run's six failing files were the ID collision, which this merge fixes, but this one stays. The tip's own run (41402223585) was still going when I checked.
   - **Consequence:** R-3187 holds on main today and would not after this land. `nana-land` will refuse on red CI, and a forced land would turn main's suite red for every later lane.
   - **Scope:** this predates round 1, so it sits outside the change I was asked to review. I flag it because the final review must cover the exact tip that lands, and this tip cannot land.
   - **Fix:** the product still delivers the digest, so only the evidence is stale. Either point R-3187's `ledger/bay-1` pattern at the new delivery line, which needs brief authority because it edits a main test, or restore a single line that matches the existing pattern. The fix commit then needs its own review round.
2. **NOTE:** the lane folder's `tree-movement.md` still shows the old range `ac764bc..c30fdc8` with R-3530 and R-3531 as this lane's rows. Running `review-ledger keep` before the final round rewrites it. The older lane-folder logs and briefs keep their earlier IDs as history, as `merge-2b-evidence.md` says.

VERDICT: SEND-BACK
