Feature: FEAT-031 · Run checks reliably and without contaminating work
Serves: owner 2026-11-09 — "Yes" to testing the merged result before a land, after red main 42549081547 came from two separately green lanes

# Plan: land-merged-tests

## Why

When main has moved since a lane's accepted tip, `nana-land` merges current main into the tip and, under the 2026-11-02 ruling, lands that merge with no new CI or tests when git finds no conflict. Git finds only line conflicts. On 2026-11-08 records-move (a new test fixture without a `Serves:` line) and memory-sort (a stricter brief check) were each green alone; their conflict-free merge turned main red on every platform (run 42549081547). The same day the seat hand-merged main into three lanes so their CI could run, and `nana-land` refused each merge as uncovered, costing a confirmation review round each.

## Design (changed after the adversary, 2026-11-09)

The first draft ran tests in a temporary checkout inside `nana-land`. The adversary showed its selector would read the wrong history (`scripts/test-packs.mjs::changedPaths` reads `base...HEAD`), that a temporary checkout lacks the checkout's dependencies, and that Windows cleanup and locking add machinery. Since lane-push-ci, a push to a lane runs CI on the lane tip itself on every platform, including the Windows selected job. So the merged result is tested by moving the merge into the lane, where CI already runs:

1. **Covered merges.** `nana-land`'s coverage check counts a lane commit as covered, with no new review, when it is a merge commit whose first parent is covered, whose second parent is in main's history, and whose tree equals the tree `cleanMergeTree` computes for those two parents (generated files rebuilt by their own generators). A merge that hides any other edit stays uncovered.
2. **No untested merge lands.** When main has moved past the tip, `nana-land` refuses and prints the remedy: merge main in the lane (`git merge main`; for a generated-file conflict, take main's side and rebuild with its generator), push, wait for that tip's CI, then land. The land then fast-forwards over a tip whose CI ran on the merged code. `nana-land` no longer writes a merge commit to main.
3. **Ruling text.** The 2026-11-02 ruling in `packages/nana-pack/rules/nana-rulings.md` and the shared working section (`templates/_shared/working-under-nana-pi.md`, mirrored in `AGENTS.md`) change from "a merge with no conflict lands without new CI or review" to "the lane merges current main; that merge needs no new review when its tree matches nana-land's computed merge, and lands only after CI passes on it". The owner approved testing the merged result on 2026-11-09.

This removes the land-side merge-commit path rather than adding a test runner. Each land where main moved costs one CI run on the lane (about 10 to 25 minutes) and no review.

## Residuals (declared)

Pull-request CI runs the `land` and `module` packs selected by `--changed-from`. Unchanged `main`- and `retire`-pack tests and Windows-only behaviour outside the Windows selected job are not run before a land; main's push run still catches them, and a red main still blocks lands.

## Must-meet tests (R-3960–R-3964)

- M1 (R-3960): a tip plus a seat merge of main whose tree equals the computed clean merge is covered; with passing CI on that merge, `nana-land` fast-forwards main to it with no new review.
- M2 (R-3961): a merge commit whose tree differs from the computed merge by one hidden edit is uncovered and refused, naming the commit.
- M3 (R-3962): a merge whose only conflict was a generated file, rebuilt by its generator, is covered when its tree equals the computed regenerated merge.
- M4 (R-3963): when main has moved past the tip, `nana-land` refuses with the merge-in-lane remedy and leaves main's ref unchanged; when it has not, the land fast-forwards as before.
- M5 (R-3964): the live ruling text in `nana-rulings.md`, the shared working section and `AGENTS.md` says the lane merges main and CI runs on that merge, and none still says a merge lands without CI.

Rows R-3960–R-3964 are added to `REQUIREMENTS.md` before implementation.

## Validation

- Real run: replay 2026-11-08. A lane at memory-sort's accepted tip with records-move on main: `nana-land` refuses; after `git merge main` and a push, CI on the merge fails `memory-run.test.mjs` M4, so the land never happens.
- Real run: a hand merge from this session (for example child-context's 59d0ea3c over its accepted tip) is recognised as covered.
- This lane lands through the new path if main moves meanwhile.

## Precedent

- `packages/nana-pack/bin/nana-land.mjs`: `cleanMergeTree` and `regenerateTree` compute the merged tree; the "uncovered commits" check is where coverage is decided.
- `packages/nana-pack/rules/nana-rulings.md`: the 2026-11-02 ruling this replaces.
- `templates/_shared/working-under-nana-pi.md`: the shared land checklist.

## Threat model

Honest variation in our tools' output and timing is in scope; deliberate forgery is out. A merge that hides an edit is caught by the tree comparison, which is a check against honest mistakes, not a security boundary.
