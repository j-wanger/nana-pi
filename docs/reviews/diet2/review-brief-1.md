Feature: FEAT-031 · Run checks reliably and without contaminating work

# Review brief 1: diet2

Review `git diff main...HEAD` on feat/diet2 (six commits, fd07aff3 to f0412292; 46 files, about +159 / -1,656; tests net -1,408, code net -95).

The owner's ruling (2026-11-09): "A test stays only if it pins a recorded failure, the main use of a kept feature, or a safety line" (privacy, credentials, rm, identity, Windows paths). The owner asked for the reduction on 2026-11-07. This is the second test diet, over `packages/nana-setup/tests/`. The seat scouted four areas (install, settings and hooks, project and stale, doctor and Windows); a second agent tried to refute every proposed cut against git history, known bugs, session notes and rows, and the card made the corrected lists binding. After Diet 1's review, the card also required: a row that loses its only test reads `untested` while the code still does it, `retired` only when the behaviour left the product; no row text rewritten (new rows R-4012 onward); never cut an rm, privacy, credential, identity or Windows-path guard.

Carried items in the last two commits:
- R-707 to `untested` (Diet 1 review 2 SHOULD); the FEAT-039 duplicate age-text line restored; `validateStore` cut from `scripts/product-report.mjs` as dead code.
- The macOS lane CI flake in `lane-checks.test.mjs` R-4006 ("Unexpected end of JSON input", run 42848141329 attempt 1): the case parsed fixture files as soon as they existed. Every fixture writer the case polls now writes a temp name and renames it.

Builder's validation: trace, tree check, `check:lane` and the macOS install check pass; 35 touched test files pass alone. Seat re-ran on the tip: trace, tree check and `check:lane` pass. The seat's row audit against main: 37 rows moved to `untested` (36 from implemented, R-707 from retired), none newly `retired`, no existing row's text changed, R-4012 to R-4015 new.

Questions:
- Did the lane cut any test that pins a recorded failure, the main use of a kept feature, or a safety line? Name the evidence.
- Is every row left without a test marked honestly, with no reused IDs?
- Is `validateStore` truly unused, and did its cut take anything a kept path reads?
- Do the atomic-write fixtures close the R-4006 parse race without weakening what the case checks?

Threat model: honest variation in scope is in; deliberate forgery is out.

Put exactly one verdict line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, as the last line, and no other line starting with "Verdict".
