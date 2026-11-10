Feature: FEAT-031 · Run checks reliably and without contaminating work

# Review brief 1: diet1

Review `git diff main...HEAD` on feat/diet1 (four commits, bad7bd58 to 84937467; 29 files, +448 / -7,140; tests net -6,680).

The owner's ruling (2026-11-09): "A test stays only if it pins a recorded failure, the main use of a kept feature, or a safety line" (privacy, credentials, rm, identity, Windows paths). The owner asked for the reduction on 2026-11-07. The seat scouted four areas (pack config, objective, review tooling, product report and lift); a second agent tried to refute each proposed cut against git history, known bugs, session notes and rows, and the card made the corrected lists binding. Seat overrides kept: the review-text store and audit log and their tests, the product report's inertness and hostile-markup checks, the R-3240 lock-wait comparison, and the receipts leaves (R-865).

The lane also records the owner's 2026-11-10 ruling ("Alloe", read as allow): the next lane's build may start once the previous lane has LAND and green CI on its own tip, while main CI runs; a red main still blocks every land. It edits OBJECTIVE.md's priority line and adds one dated line to the rulings file. It also deletes `processStartedAt`'s unused parts in `lane-watcher.mjs`, brings the pack README up to R-4002 and R-4007, and adds four known-bug lines, all from the tool-fix-2 review.

Builder's validation: 20 touched test files pass alone (1,610 checks); trace, tree check and `check:lane` pass. The builder reports PARTIAL: some eligible appendix cuts remain; it cut no KEEP or refuted case. Seat re-ran on 84937467: trace, tree check and `check:lane` pass; `product-report`, `requirements-lift`, `objective-golden` and `review-ledger-state` pass alone; each seat-kept row (R-2568, R-2660, R-2575, R-721, R-722, R-1014, R-1015, R-1019, R-1025, R-1030, R-3240, R-865) still has its test.

Questions:
- Did the lane cut any test that pins a recorded failure, the main use of a kept feature, or a safety line? Name the evidence.
- Is every row left without a test retired or re-pointed honestly?
- Does the lane-watcher deletion change `cleanLane`'s behaviour on POSIX or Windows?
- Do the OBJECTIVE and ruling edits say only what the owner decided?

Threat model: honest variation in scope is in; deliberate forgery is out.

Put exactly one verdict line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, as the last line, and no other line starting with "Verdict".
