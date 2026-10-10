# Lane land-rule — continuation 4: three items, all in land.test.mjs and REQUIREMENTS.md (seat, after build 4 PARTIAL)   (2026-10-10 · feat/land-rule)

Build 4 added the R-1003, R-1007 and R-1009 tests — good. This round is exactly three items. Do all
three; report only when the checklist is complete.

- [ ] **A. Exact evidence for the five existing land rows.** Each cites exactly its tests at
  `661f76e` (`git show 661f76e:REQUIREMENTS.md`), renamed per `test-title-map.json`: R-975 the 9
  preflight and suite-time tests; R-976 the 8 review tests plus "runLand requires verified reviews"
  (mapped); R-977 the 7 merge-procedure tests; R-979 the 6 cleanup tests; R-588 the 3 release-status
  tests. Every cited test carries its `// req:` marker. Keep the new rows' existing correct citations.
- [ ] **B. Focused tests for R-1004 and R-1011**, using `reviewTip`'s real `admit`/`complete` path
  (or `complete` with another verdict) in a scratch `home`, and hand-written version-1 lines only for
  legacy fixtures. R-1004: a verified SEND-BACK under ANOTHER item at the same commit refuses; a
  verified SEND-BACK at a working-state snapshot of the commit (a review run with an untracked file
  present, `head` = the commit) refuses; an explicit empty verdict (`VERDICT: LAND | FIX-FIRST |
  BLOCK`) beside a LAND refuses; a legacy line with no `verdict` field beside a version-2 LAND lands;
  an unverified SEND-BACK beside a version-2 LAND lands. R-1011: a version-1 LAND alone refuses; and
  a version-1 LAND that the first reading would accept... cannot exist, so instead: with a version-2
  LAND present at the first reading, replace it before the second reading (an injected `runCommand`
  suite that rewrites the tally to only a version-1 LAND) — the land refuses. R-1004 and R-1011 cite
  only these tests.
- [ ] **C. No `exempt` left in the tests.** Remove the `exempt: _obsolete` pass-through in the
  `runLand` wrapper and every `exempt:` key at the call sites (grep finds them); a test that still
  needs one is about R-1003 and calls `parseLandArgs`.

Then: `npm run req:tree`, `npm run map:check`, `npm run test:locked` (must pass; report the summary
line), commit, then both seat scripts into `seat-verify-land-output.txt` as before (both exit 0),
commit. Rules as `build-brief.md`. Frozen as before. Report ≤ 25 lines, first line `VERDICT: …`,
with the checklist ticked.
