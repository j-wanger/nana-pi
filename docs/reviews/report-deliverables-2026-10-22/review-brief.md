# Review — report-deliverables (the product report shows each deliverable's claims, code marks, the checker's own lines and artifact ages), 2026-10-22 (the final reviewer)

Feature: FEAT-039 · See the product and its decisions in one report

Class: ordinary (the report script, the deliverables module, the tree checker's printing, their tests, the ledger, the requirements skill and the pack README, notes). Threat model: honest variation in scope — a shallow clone, a git call that fails, a ledger in a subfolder, a folder artifact, merges and old-dated lanes in history, commit times in far time zones, a change dated after HEAD, runtime data that is missing, from another schema, has no tip or time, a time that does not parse, a tip on an unmerged branch, a history walk past 1 MiB; deliberate forgery out (a hand-edited runtime data file, a forged commit date).

Review `git diff 7d0ab92b..HEAD` on `feat/report-deliverables`. Main is 7d0ab92b (suite-records, just landed). The lane branched from 09e38e7d and merged main twice: 1513bf72 brought biome-pin, and 9bc2a014 brought suite-records; there the seat kept suite-records' R-2547 in CAP-07's `Deliverables:` line and this lane's artifact on R-291's maker line, and regenerated the outline and code map. Both merged lanes were reviewed and landed. The lane's own commits: 95ff966b (plan), f992f2c7 (build 1), 12e65c15 (the seat's check of build 1 and brief 2), 2e8da63e (build 2), b2e14310 (the seat's check of build 2 and brief 3), 4a78ad2f (build 3, committed by the seat as the builder left it: its full suite failed only on the Biome break biome-pin fixed), f4fa1bfa (the seat's pairs at 4a78ad2f), 8b1b57d2 (notes) and the final commit with this brief.

The plan of record is `docs/reviews/report-deliverables-2026-10-22/must-meet.md`: decisions D1 to D9, four rows (R-2542 to R-2545), R-2452's narrowing, the tunables and the known limits; `plan-draft.md` and `plan-attack.md` are its inputs. The seat checked build 2 and sent two test gaps back in brief 3: F1, rounded days passed every check; F2, a refusing walk crashed the test file instead of failing R-2544. Build 3 closed both.

The seat's record:
- Wrong-code pairs: 15 of 16 red at 2e8da63e and 16 of 16 at 4a78ad2f, each by its named title (`seat-mutate.mjs`, `seat-mutate-output-*.txt`): the walk without `-c`; counts by walk position; UTC calendar days; rounded days; no clamp; the runtime map aged by git; consumers kept; claims from every capability's span; marks from claim kinds alone; the count line keyed on listed deliverables; a retyped paths-not-checked string; the walk without the helper's buffer; the newline kept on the first file name; a walk failure that refuses the page; a shallow clone read as full history; a side-branch runtime tip counted with rev-list.
- On this repo at 2e8da63e, each of the seven ages matched `git log -1 -- <path>` and `git rev-list --count <change>..HEAD`; the runtime map read its own record (tip, UTC time, commits to HEAD).
- After the merge of suite-records, the checker prints `deliverables: 14 of 39 made and read by code` and `0 problems`.
- Session titles: 0 missing for both sessions.
- On a fresh full clone at 8b1b57d2 (`full-clone-check-8b1b57d2.txt`), all six file ages match git, the runtime map says "age unknown: no runtime data", and the report's count line equals the checker's.
- The locked full suite at 8b1b57d2: `206 files: 204 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8302 pass, 0 fail, 39 skip`, then suite-records' own lines against the land baseline 7d0ab92b (product-report's test file 16.3 s slower, from this lane's new cases).

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement 7d0ab92..8b1b57d: 11 rows in 6 features
FEAT-028 · Maintain requirement identity and trace links
  R-291 Made by/Read by lines changed
FEAT-039 · See the product and its decisions in one report
  R-2452 text changed
  R-2542 new (implemented)
  R-2543 new (implemented)
  R-2544 new (implemented)
  R-2545 new (implemented)
FEAT-034 · Define reproducible comparisons
  R-509 Made by/Read by lines changed
FEAT-035 · Account for cost and uncertainty
  R-535 Made by/Read by lines changed
FEAT-037 · Grade behavior with trustworthy checks
  R-507 Made by/Read by lines changed
FEAT-038 · Interpret workflow experiments and their limits
  R-536 Made by/Read by lines changed
  R-694 Made by/Read by lines changed
```

CI: run 39792100291 at 8b1b57d2 (PR #164), every job green: the three suite legs (Linux 15 min, macOS 22 min, Windows 39 min) and both install checks. One first-try failure on the way: the Windows leg at 1513bf72 (run 39785201330) timed out review-ledger.test.mjs at the runner's 300 s per-file limit, a file this lane does not touch (the ci-jobs lane raises that limit); its re-run passed. The final commit adds only this brief and `full-clone-check-8b1b57d2.txt`.
