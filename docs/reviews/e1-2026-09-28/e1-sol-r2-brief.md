# Review brief — lane E1 round 2 of 3 (gpt-5.6-sol) — confirm the fold

Your r1 BLOCKed with 3 HIGH, 2 MED, 1 LOW. Fix commit `3dca12e` (`e1-worker-r2.md`). Worktree `~/nana-pi-wt/e1`.

**MUST 1 — uniqueness now uses connected components.** Your chain `sol-r1 ~ astra-r2 ~ astra-r1` is a regression, as are duplicates through a shared component. P1 was recomputed and numbers moved: sol-unmatched accepted rows A 16→15 (functional 8→7), B 6→4 (2), intersection **4 (2 functional)**; distinct findings 192→175; accepted 95→87.
**MUST 2 — P1 is reported as matcher-dependent.** YES on 6 lanes under A, B and A∩B; **NO on the original 5 under the intersection**. The 6-lane YES rests on exactly two rows (`l3/astra-r1#1`, `t2c/astra-r1#2`), both `semantic` confidence. The hand-read adjudication is withdrawn. `RESULTS.md` states this is not evidence about ceremony.
**MUST 3 — `RESULTS.md` now LEADS with what the evidence licenses:** "Most of the distinctive functional catches are defects in fixes made after sol's last round, and only astra reviewed those fixes. The evidence licenses 'review the final fixes again'. It does not license 'use astra', any particular reviewer role, or astra's cost premium."
**MUST 4 — the confirm-round reading is corrected** (astra-r2 now 25/1/1), with the 17/62 verification rows and the 5/6 LAND reports lacking a fix brief named, and an explicit statement that the ledger cannot say whether a confirm round verified its MUSTs or safely authorized the land.
**MEDs/LOW:** `stageHints` compares full paths (the build now measures the old bias: 11/241 hints false, matcher A drew an edge on none); `match_confidence` implemented as a no-model rule (14 explicit, 73 semantic, all 15 P1 rows semantic) with a dated PREREG amendment saying the rule postdates the labels; the κ-sample wording noted; P3 marked "do not use operationally".

Seat-verified: `npm test` → 71 PASS, 1 SKIP, 4516 checks, exit 0; two builds byte-identical.

Judge, ≤30 lines:
1. Each r1 finding FIXED / PARTIAL / NOT FIXED with the line — especially whether component merging is now correct AND not over-merging (the worker flags an unaudited 8-row component in l2 as its risk).
2. **Is P1 now honestly reported?** The worker's own doubt: the 6-lane YES hangs on two semantic rows and one different match decision either way flips it. Should `RESULTS.md` state P1 as UNRESOLVED outright rather than "YES on 6 lanes"? Rule on the wording a reader would act on.
3. **P4 changed under the fix** — the single t2c exception disappeared (t2c-land now ties three other lanes at 2 accepted functional). Does that strengthen "SCORE carries no information" to unconditional, and is that the one claim from this lane a reader may rely on?
4. Any NEW defect from the component change, the path hints, or the `match_confidence` rule (the worker calls it strict and probably undercounting).
5. Your CARRY list, and whether this lands as measurement tooling or needs the two controls (seeded defect, clean patch) before anyone acts on it.
End with `VERDICT: LAND` or `VERDICT: BLOCK`.
