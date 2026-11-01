I found no MUST, so the verdict is LAND. This round covers only `git diff fffb9fcd..HEAD`.

**1. The merge (aedc5592, parents 9d9fb680 and 81b78dfa, merge base 6c4b5363)**
- **Main came in whole.** Main changed nine files since the merge base. Seven are byte-identical to main at HEAD: the six `audit-test-speed-2026-11-01/` files and `component-audit.test.mjs`. The other two keep both sides:
  - `docs/known-bugs/FEAT-039.md` drops main's two deleted R-3104 timeout lines and keeps main's three new lines and this lane's "Land report" line.
  - `docs/sessions/2026-10.md` puts main's entry first, unchanged; the ci-suite and clock-change entries follow.
- **Nothing from main is undone.** Every file that differs from main at HEAD is one this lane touched. No line main has in its known-bug or session files is missing at HEAD. Main deleted no files in this span, and its only deleted lines (the two known-bug lines) are gone at HEAD.
- **This lane is as round 1 accepted it.** Since fffb9fcd no code changed in `nana-land`, the land CI code or `scripts/test.mjs`. `AGENTS.md`, `templates/_shared/working-under-nana-pi.md` and `HANDOFF.md` did not change either. Among the requirement rows, only R-3436's text and trace title changed. R-1110 is still retired and R-3430 to R-3437 are intact.

**2. The preamble change**
- **Projects that say nothing about CI get the old default back.** `builder-preamble.md:31` now says "Run the repository's full suite unless its `AGENTS.md` says CI covers it". A builder in such a project runs the full suite again. The "push and stop" line at `:34` still applies only where AGENTS.md says CI covers the suite.
- **nana-pi builders still push and stop.** nana-pi's statement "CI covers this repository's suite" is at `AGENTS.md:146`, outside the shared marker region. The shared template only says "where the project's `AGENTS.md` says CI covers its suite". The test at `rulings.test.mjs:375-381` checks that layout.
- **R-3436 and its pins match.** The row text, its trace title (aligned by the seat in f806f98e), the `RULE_LINE` text and the new check that the reversed wording is absent all line up. Mutation pair 9 now restores the reversed wording, and the build-3 output reads 17/17 red. The removed "last commit follows a green full suite" line is still checked as absent.
- **I re-ran these checks; all pass with exit 0 and leave the worktree clean:**
  - `worker-lane.test.mjs`, including the R-3436 case
  - `scripts/requirements-trace.mjs`
  - `scripts/known-bugs.mjs --root .`
  - `scripts/deliverables.mjs --root .`

  No other copy of the old or new preamble wording exists outside the review files. The install check reads the preamble by path, not by its content, so the wording change does not affect it.

**SHOULD**
- **The full-suite line is weaker than main's.** Main's preamble said "your last commit follows a green full suite". The new line says only to run the full suite, with no "green" and no "on your last commit". A builder in a project silent on CI could run the suite early and commit again afterwards. This is not a MUST: the land still runs the local suite in such projects, so a red suite is caught there, just later. One fix is "Run the repository's full suite on your last commit unless …".

**NOTEs**
- **`tree-movement.md` is stale.** The lane folder's copy still names the range `6c4b536..fffb9fc`, and its 16 rows in 6 features still match. Run `review-ledger keep` before the land as the checklist says.
- **One round-1 note was not recorded.** The final reviewer's fourth note (the test fixture's literal backslash-n) has no line in the known-bug file. The other three are recorded.
- **The builder's merge commit alone fails the trace.** aedc5592 carried R-3436's old trace title; the seat fixed it in f806f98e. HEAD passes the trace.

**Harms:** none. Nothing writes outside the worktree, nothing touches install or hooks, and nothing main does today stops working.

VERDICT: LAND
