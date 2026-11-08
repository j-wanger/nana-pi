Feature: FEAT-013 · Install and connect harness runtimes

# Review brief 3: setup-retire — confirmation round

Review only `git diff 357b1824..HEAD`. Lane CI (run 42449374856) failed M4 (R-3802): it ran a nested `scripts/test.mjs pipe-guard gate` suite under a 60 s limit inside the suite. M4 now calls the shared `verifierPipeReason` predicate directly, and checks through the code map that `nana-gate.ts` imports `pipe-guard.mjs`. R-3802 is narrowed to match. Question: does M4 still prove the pi gate keeps its pipe protection, with no nested suite and no pins on runner text or test file names? Bar as in round 1.
