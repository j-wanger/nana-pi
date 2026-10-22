# Review — ci-jobs (CI suite legs run four test files at a time, with one per-file limit and a copier warm-up), 2026-10-22 (the final reviewer)

Feature: FEAT-019 · Release usable templates and report support

Class: ordinary (the CI workflow, the run-alone list, one test file, the ledger and its outline, notes; no install, hook, gate or land-tool file). Threat model: honest variation in scope — a slower or busier hosted runner, fewer cores, a file near its time limit, a hung test file, held output, copier's first download on an empty cache, a load-sensitive check; deliberate forgery out (a hand-edited workflow run, a forged CI result).

Review `git diff 4601480f..HEAD` on `feat/ci-jobs`. Main is 4601480f (review-outputs-kept, just landed). The lane branched from 09e38e7d and merged main four times: 0ab804cd (biome-pin), f2dcf0c7 (suite-records), 294edd17 (report-deliverables) and 1a68db7b (review-outputs-kept); each merged lane was reviewed and landed, and only the last merge had conflicts, in HANDOFF's Landed lines and the session file's top entries, resolved by keeping both. The lane's own commits: b7d909a9 (plan), bf1b9d3f (build 1, committed by the seat as left while main's Biome break held the hook red), 21c8bbed (the seat's check of build 1), 853e4532 (amendment 1 and brief 2), c46d85f3 (build 2), 55a2761a (the seat's check of build 2), e6345e4f (amendment 2 and brief 3), ec1e928e (build 3, committed by the seat as left), 61b48d94 (amendment 3 and brief 4), a2f0a1df (build 4, the last code commit), 50b470db (notes), the session-spacing fix and the final commit with this brief.

The plan of record is `docs/reviews/ci-jobs-2026-10-22/must-meet.md`: decisions D1 to D5, its three amendments (one for each first-try failure the CI runs at four found: copier's first download, post-edit-utf8 on Windows, review-ledger's renewal check on macOS), four rows (R-2556, R-2557, R-2558, R-2577), the tunables and the known limits; `plan-attack.md` is its input.

The seat's record:
- Wrong-code pairs: 12 of 12 red at bf1b9d3f and 14 of 14 at c46d85f3 (`seat-mutate.mjs`, `seat-mutate-output-*.txt`). Builds 3 and 4 changed only the run-alone list in `packages/nana-pack/lib/test-runner-config.mjs`, which no pair touches.
- Session titles: 0 missing.
- CI at four: c46d85f3 (run 39788254433) green on every leg, Windows 16 min; f2dcf0c7 (run 39792797841) Windows 15 min green and macOS review-ledger red, build 4's cause; a2f0a1df (run 39796420086) green on every leg, then two Windows re-runs, both green: the Windows suite leg passed 3 of 3 at the last code commit (19, 19 and 21 min).
- The probe (PR #165, run 39761155058, now closed) took the Windows suite job from about 33 minutes at one file to 16 at four.
- The locked full suite at a2f0a1df on this Mac: green, 455.9 s, up from about 350 s, because review-ledger now runs alone (a FEAT-031 known bug names the split that wins it back).
- Since a2f0a1df the lane adds only notes (HANDOFF's queue, Next and Landed lines, the session entry, FEAT-019, FEAT-031 and FEAT-039 known bugs; the FEAT-039 lines are the report lane's final-review notes) and the merges.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement 4601480..1a68db7: 4 rows in 1 features
FEAT-019 · Release usable templates and report support
  R-2556 new (implemented)
  R-2557 new (implemented)
  R-2558 new (implemented)
  R-2577 new (implemented)
```

CI on PR #166 runs on the reviewed tip; the seat lands only on green.
