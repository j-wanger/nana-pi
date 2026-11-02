# Confirmation round 2: anatomy-label-check (`fe749bb0..fb9e41c0`)

This round changed no code. The merge kept main intact and kept this lane's changes. The known-bug lines match round 1. I found no harm the review standard lists, and no MUST.

## The merge (`4a717c18`, parents `a6d2f908` and main `ac20e30a`)

- **Merge base.** The branch's merge base with main is now main's tip, `ac20e30a`.
- **Files only main changed.** Each one is byte-identical to main at HEAD. That covers `nana-profile.mjs`, its test, the pack README, `FEAT-040.md` and the seat-memory-push review folder.
- **Files only this lane changed.** Each one is identical to the lane's pre-merge commit `a6d2f908`, except `docs/known-bugs/FEAT-042.md`, which the build was asked to edit. All of `apps/bench` is unchanged from round 1.
- **Files both sides changed.** These are `REQUIREMENTS.md`, `docs/code-map.md`, `docs/requirements-tree.md` and `docs/sessions/2026-10.md`. I redid the merge in memory with `git merge-tree`. The first three come out exactly as the recorded merge. The session file was the only conflict. Its resolution keeps every line from both sides and adds none. The two whole entries sit main's first, then this lane's, both dated 2026-11-01, and no conflict markers are left.
- **Lines main deleted.** For every touched shared file, nothing main deleted since the old merge base is still at HEAD.
- **This lane's own edits.** Every line the lane added in the shared files is present, and nothing it deleted came back.
- **No ID collision.** Main's new rows R-3410 and R-3411 sit beside this lane's R-3399–R-3406. The tree shows 2416 rows in 43 features.
- **The diff against main.** `git diff ac20e30a HEAD --stat` lists only this lane's files plus `HANDOFF.md`, as build brief 4's "Done when" asks.

## Known-bug lines in `docs/known-bugs/FEAT-042.md`

Each line matches round 1's finding:

- **SHOULD 1:** sheet 2 was reused for the overall-bar recheck. Matches.
- **SHOULD 2:** the line lists every omission round 1 named, including carry 1, carry 2 and the step-0 count of 278 keys against 283. Matches.
- **SHOULD 3:** the pooled count is the union of three labellers and can exceed the pair's κ denominator. Matches.
- **SHOULD 4:** precedent's model:B shows 0.70 against a 0.7 bar. Matches. The line says "agreement" where the value is κ, which is harmless.
- **SHOULD 5:** the line was rewritten, not duplicated. It no longer compares the weighted bar with κ. Its new claim, that the heavy sheet misses 0.85, matches `labeller-counts.md:24`: weighted agreement is 0.80/0.79 for model:consensus and 0.75/0.73 for model:b, marked **fail**.
- **NOTE 1:** occurrences that normalize to empty text are left out of every table, and the stated denominator doesn't say so. Matches.

## HANDOFF

The "Lanes in flight" bullet now ends "Seat memory delivery is building.", as the brief set out. That also settles round 1's NOTE 2. Dropping the two other lanes from the bullet is correct: `origin/feat/memory-replay` is already in main, and the session-end lane landed. `nana-writing HANDOFF.md` reports 0 over, 0 banned. The Next and Open sections hold no list items.

## Checks I ran on the tip (read-only; the worktree stayed clean)

- `requirements-tree.mjs --check`: 0 problems, and the committed tree matches the rendered one.
- `code-map.mjs --check`: 0 problems.
- `readme-check.mjs`: 1064 claims, 0 problems.
- `known-bugs.mjs --root .`: names=0, sizes=0.
- `requirements-trace.mjs`: 2161 rows traced, 0 rows off form.

I didn't rerun the anatomy tests: the lane's code is unchanged from round 1, which ran them, and the code main brought in (`nana-profile`) doesn't touch `apps/bench`. CI is the suite check.

## Findings

None at MUST, SHOULD or NOTE level.

VERDICT: LAND
