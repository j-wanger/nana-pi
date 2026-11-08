Feature: FEAT-013 · Install and connect harness runtimes
Card: fix

# Review brief 1: setup-retire-win — urgent fix for red main

Main's Windows suite failed `setup-retire.test.mjs` M3 (R-3801): the journal records the canonical long path, but the test expected the 8.3 short temp form (`RUNNER~1`). Review `git diff main...HEAD`: the test's expected paths are canonicalized, and production code is unchanged. Question: does M3 still prove one canonical root per day and only unadopted roots in the hook, and does the fix cover every comparison in the file that could see the short form? Lane CI has no Windows legs; main's Windows run after the land is the proof. Threat model: honest Windows path spellings; forgery out.
