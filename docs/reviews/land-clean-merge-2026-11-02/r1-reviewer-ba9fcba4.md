No MUST finding stands. I'm recommending LAND, with one SHOULD to record as a known bug.

## What I checked
- **Code:** I read `cleanMergeTree`, `runLandCore` and `land-config.mjs` in full against plan rev 2 (A1–A13).
- **Lane tests:** both new files pass on this tip (git 2.50.1, darwin): `land-clean-merge.test.mjs` 9/9 and `land-clean-merge-race.test.mjs` 1/1.
- **Neighbouring tests:** all green with no FAIL lines: `land`, `land-merge`, `land-ci-suite`, `land-ci-read`, `land-ci-records`, `land-ci-edge`, `land-records`, `rulings` and `path-spelling`.
- **Mutations:** the 10 wrong-code pairs in `mutation-record.txt` each turn their named case red.

## The questions in the brief
- **Merged content matches an ordinary git merge.** M2 compares M's tree with a plain `git merge --no-ff` in a separate clone that has default settings. It also checks the literal file contents. The lane forces three settings (`merge.renormalize=false`, `merge.default=text`, `merge.renames=true`), and the test sets the opposite values in the main repo. Pair 10 shows that without them a `merge.default` driver silently dropped main's edit.
- **Unsupported merges and conflicts refuse with nothing changed.**
  - A changed `.gitattributes` anywhere refuses, including nested ones.
  - A `merge` attribute on a path changed on both sides refuses in either parent. Any value other than `unspecified` counts, so the check errs toward refusing.
  - Bad merge-tree exits, empty or extra output, and exit 1 with no names refuse as git failures.
  - The snapshot covers every ref, both HEADs, the branch and both status outputs, and the suite ran 0 times.
  - Only unreferenced objects are written before the fast-forward.
- **A proof path changed on either side refuses.** The lane side is checked from the merge base to the tip; main's side is checked from the tip to the merged tree. Both use `--no-renames`, so main deleting or renaming the workflow file is caught. Both checks run before any gh call, which M5 and M4 confirm with `calls.length === 0`.
- **Only nana-land's own merge is exempt.** The `rev-list tip --not capturedMain <reviewed>` check is unchanged and runs before the merge path. M is made in the same run. A merge the lane made itself is still refused (M6).
- **Races refuse.** The CI re-read compares workflow, run id and attempt, and `judgeRuns` rejects a newest run that is unfinished or failed. The in-lock rechecks now refuse before `merge --ff-only` is even called, which M7 pins. Two lands sharing one ledger home serialize, and the rerun gets parents `[tip2, M1]`.
- **The documents agree.** The shared template equals AGENTS' rendered region (M9). The README carries the merge path, its supported semantics, the limits and the bors-ng trade-off. The rulings file holds the new 2026-11-02 line exactly once, before the final 2026-11-01 lanes line, and the 2026-10-10 line is gone. A repo-wide search outside `docs/reviews/` found no remaining "there are no exemptions", "every later commit needs" or old ancestor-refusal wording. `nana-seat.md` has no conflicting text.
- **No regression on the fast-forward path.** Its logic is unchanged apart from moving the CI read into the `readRuns` helper. `isAncestor` now throws on any exit other than 0 or 1; every caller already refused in those cases, so the only difference is the wording of the refusal.

## Findings

**SHOULD — re-running a land on a tip main already contains now adds an empty merge to main.**
- **Input:** the seat runs `nana-land merge` again for a lane after it landed, for example after an apparent timeout. The same happens for any lane whose tip main already contains, once main has moved on.
- **What happens:** `needsMerge` is true because main is not an ancestor of the tip. Nothing is uncovered, merge-tree returns main's own tree, and the tip's old CI and suite records still pass. The land then fast-forwards main to a new merge commit with no content change. I reproduced this in a temp fixture: the first run landed M; the rerun printed `merged main: M into <tip> as M'` and moved main, with M′'s tree equal to M's.
- **Before this lane:** the same input was refused ("main is not an ancestor…").
- **Cost:** one redundant commit on main and a redundant main CI run. No content is lost or corrupted.
- **Fix:** refuse, or no-op, when `isAncestor(tip, capturedMain)`.

**NOTE — the template overstates the merge path for other projects.** The new checklist sentence says "a merge with no conflict lands without new CI or review". In a project whose CI cannot prove the suite, every merge-path land refuses. The earlier clause "the clean-merge path refuses instead" covers this only partly.

**NOTE — M5(a) does not pin the "needs applicable CI" refusal.** If that branch were removed, the land would still refuse, as "clean merge needs proven suite: no origin remote", and the test's regex would still match. Behaviour stays a refusal either way.

**NOTE — wording in `build-report.md`.** It says "The builder pushes its final commit and stops", which contradicts the rule that builders do not push. This is evidence wording only.

I also tried a rename into a path matching a `merge=<driver>` pattern while main edited the old path. Main's edit was kept, so that edge does not drop content.

## Known bugs this change touches
In `docs/known-bugs/FEAT-008.md`, the lane rewrites the "Land reads CI" line and adds four "Clean merge" lines (A7, A8, A9, M8). All five match the code and README. The existing CI-as-suite lines are also touched in effect: the "A6 stacked pull request with a non-main base" and "A9 fallback list" lines now limit the merge path's proof as well. They remain true as written.

VERDICT: LAND
