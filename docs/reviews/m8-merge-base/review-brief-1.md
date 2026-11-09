Feature: FEAT-031 · Run checks reliably and without contaminating work
Card: fix

# Review brief 1: m8-merge-base

Review the whole lane: `git diff main...HEAD` on branch feat/m8-merge-base.

Since lane-push-ci, feature pushes run CI on the lane tip, not a merge with main. `packages/nana-pack/tests/test-packs-ci.test.mjs` M8 judged "main deletions" from main's tip, so every lane branched before a main deletion (test-retire, 5420d3e0) failed with `main deletion restored: ...` (child-context CI run 42571760369). The fix computes main's deletions at the merge base of HEAD and main. The builder reproduced the failure in a clone at 7b8d3495 with main at 5420d3e0, then showed the fix passes there and at main's tip.

Question: does M8 still catch a lane that truly restores a file main deleted (one the lane already contains main's deletion of), and does the change cause a harm the review standard lists?

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.
