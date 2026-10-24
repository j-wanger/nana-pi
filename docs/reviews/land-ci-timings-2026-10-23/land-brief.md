# Review — land-ci-timings (the land reads, keeps and judges the tip's CI timing records), 2026-10-24 (the land reviewer)

Feature: FEAT-008 · Integrate and clean up reviewed changes

Class: land tool (nana-land changes). Threat model: honest variation in our tools' output and GitHub's in scope: a tip with one pull-request run, or a push run too; re-run attempts that leave two records for one leg; the Linux leg's continue-on-error failures; an expired or missing artifact; a failed download; a record of another schema, or one with no per-file limit; gh missing, signed out, offline, rate-limited, timing out or hanging; a stray `GH_HOST`; a store folder that is unwritable, a file in the folder's place, a leftover temporary file, EBUSY on a Windows prune; a relative or absolute git common directory; Windows drive-letter paths; an artifact creation time that does not parse; the reader or writer throwing. Deliberate forgery out: a forged or hand-uploaded artifact, a hand-written file in the store, a tampered gh first on PATH.

Review `git diff fc06e29d..HEAD` on `feat/land-ci-timings`. Main is fc06e29d (project-check-line, landed). The lane's commits: bf134466 (plan of record), 14c4c849 (build 1, the lane), e324f394 (pairs and independent check), 12f1b60c (build brief 2), ffca3487 (build 2), 6ed859d9 (pairs), cc86c4c2 (merge of main after report-at-land; the seat combined both lanes' changes to suite-records.mjs), cd905df4 (pairs after the merge), 73aa7538 (merge of main after project-check-line, clean apart from the code map), 2fa1a568 (notes), and the final commit with these briefs.

The plan of record is `docs/reviews/land-ci-timings-2026-10-23/must-meet.md`: the attack's M1 (download with a host-qualified repository, since a stray `GH_HOST` broke every download) and M2 (no land maker line and no ci-runs artifact name: the land copies CI's upload) adopted, with S1 to S7; rows R-2750 to R-2756; 4,000 records as a chosen, sealed value the owner can retune; the new tests in their own file, with land.test.mjs's fixtures moved to `land-fixtures.mjs`. `plan-draft.md` and `plan-attack.md` are its inputs. One departure: S1 named `Math.ceil` for a call's limit; build 2 uses `Math.floor` of the time left, after the independent check showed a limit rounded above the time left (its note 7); pair 31 pins it.

The seat's record:
- Wrong-code pairs (`seat-mutate.mjs`): 42 of 44 red at 14c4c849 (two survivors, closed by build 2), 45 of 45 at ffca3487, and 45 of 45 at cc86c4c2 after the first merge (`seat-mutate-output-cc86c4c2.txt`). The second merge touched no lane code file.
- The independent check at 14c4c849 (`independent-check-14c4c849.md`): two real tips read and kept (6 and 7 records, matching the hand reader and a fresh download, 6.8 and 8.6 seconds), the same with a stray `GH_HOST`, every failure path one note, and a real land from the lane's code that kept 6 records 7.0 seconds after the merge, outside the review-ledger lock. No MUST; its notes 1 and 7 closed in build 2, the rest are FEAT-008 lines.
- Build 1's locked full suite: 218 PASS, 0 FAIL, 2 SKIP; build 2's the same. CI passed on every leg at 73aa7538. After the merges, map:check, readme:check, the trace and the tree check are green; `nana-writing HANDOFF.md` finds no long sentence; the frontier check is within budget. The tree check's deliverable line moves from 18 of 22 to 19 of 22 made and read by code.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement fc06e29..2fa1a56: 8 rows in 2 features
FEAT-008 · Integrate and clean up reviewed changes
  R-2750 new (implemented)
  R-2751 new (implemented)
  R-2752 new (implemented)
  R-2754 new (implemented)
  R-2755 new (implemented)
  R-2756 new (implemented)
FEAT-031 · Run checks reliably and without contaminating work
  R-2632 Made by/Read by lines changed
  R-2753 new (implemented)
```

CI runs on the draft pull request at the reviewed tip, the Windows leg included. The seat reads that run and lands only on green.

Ask above all, as the land reviewer: is this change safe to put on main for every later land: can the new step hang a land, slow it past its budget, print `refused:` for a land that merged, run inside the review-ledger lock, or write outside the clone's git folder?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
