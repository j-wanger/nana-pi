# Review — bench-study-scratch, confirmation round 2, 2026-10-24 (the final reviewer)

Feature: FEAT-034 · Define reproducible comparisons

Class and threat model as round 1's brief, `review-brief.md` in this folder.

This is a confirmation round, for the standard reason: confirmation round on the final tip after fixes to named findings or a merge of current main. Round 1 at aecc5ca5 ended LAND (`r1-opus-a660e45a.md` in this folder). Review only `git diff aecc5ca5..HEAD` on `feat/bench-study-scratch`. Main is d9428493 (land-ci-timings, landed after hard-kill-watcher).

What changed since round 1:
- 00159cbd and 0a729695 (build 2): the Windows CI leg failed R-2770 at aecc5ca5 (run 40102229483), because the check compared `rec.evidence` with `"raw/code-bugfix/research/rep0"` and Windows reads `raw\code-bugfix\research\rep0`. The check now compares it with `path.join("raw", "code-bugfix", "research", "rep0")`; its title and its evidence-files-on-disk test are unchanged. Build 2's locked full suite: 217 PASS, 0 FAIL, 2 SKIP.
- 3b857ad1 merges main at 2026c012 (hard-kill-watcher) and records round 1's notes: the FEAT-039 line now says the page is written "before nana-land's final review re-check", and a FEAT-034 line says that with the shipped study back as the study folder, the listing check never runs because the diff read throws first. At 3b857ad1 the Windows leg passed R-2770 and failed once on R-2722 (hard-kill-watcher's live-owner case, temp folder not yet empty), which passed on main's run and two lane runs; the seat re-ran it.
- 52b8d692 merges main at d9428493 (land-ci-timings), updates the session entry for build 2, and records the R-2722 Windows timing failure as a FEAT-006 line. The conflicts were notes only: HANDOFF's lanes and Landed lines, and the session entries (this lane's first; the CI-timings line moves into this lane's archived block).
- The final commit keeps round 1's text and adds this brief.

Map, readme, trace and the requirements tree are green at the tip (`deliverables: 19 of 22 made and read by code, 19 parked`, no note); `nana-writing HANDOFF.md` finds no long sentence. CI runs on the draft pull request at this tip; the seat reads it and lands only on green.

Ask: does R-2770 now hold on every platform without losing its strength, are round 1's notes and the new known-bug lines true, does each merge resolution keep every lane's notes intact, and does anything in the change since round 1 block the land?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
