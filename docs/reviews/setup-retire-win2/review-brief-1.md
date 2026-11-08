Feature: FEAT-013 · Install and connect harness runtimes
Card: fix

# Review brief 1: setup-retire-win2 — urgent fix for red main

Main's Windows suite failed `setup-retire.test.mjs` M7 (R-3805): the case re-ran four whole-repo checkers with a 15 s `spawnSync` limit, and `component-audit.mjs` hit the limit (status null). Review `git diff main...HEAD`: the re-run loop is removed, the document, retirement and component assertions stay, and R-3805 is narrowed. Question: does M7 still prove what its row now says, and does no spawn of a repo script under a short limit remain in the file? Lane CI has no Windows legs; main's Windows run is the proof. Threat model: honest runner speed variation; forgery out.
