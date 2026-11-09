Feature: FEAT-013 · Install and connect harness runtimes
Card: fix
Serves: roadmap step 3 (trim each helper's starting context): confirmation round on the CI fixes.

# Review brief 2: memory-sort — confirmation round

Round 1 said LAND at 4e8430ed, but PR CI failed `seat-rule.test.mjs` (it pinned the seat guide's exact lines) and `profile-store.test.mjs` once. Review only `git diff 4e8430ed..HEAD` (commit c3227ea4): 23 wording pins removed under the validation-first ruling, the loader cap and brief-checklist checks kept, R-1140 and R-3900 retired, 11 wording-only rows marked untested; profile-store unchanged (it passed alone and in parallel). Evidence: `docs/reviews/memory-sort/ci-fixes.md`.

Questions: does any removed pin guard a real past failure rather than wording? Are the retired and untested rows honest? This tip's CI is the proof for the suite. Threat model: honest drift; forgery out.
