Feature: FEAT-031 · Run checks reliably and without contaminating work

# Review brief 2: agents-trim (confirmation)

Confirmation round. Review only the change since round 1's tip `8f8d1d6e`: `git diff 8f8d1d6e..HEAD` on branch feat/agents-trim. Round 1's report named two MUSTs:
1. `skill-claims.test.mjs` (R-629) failed because the shared section no longer holds `--brief <file>`.
2. Nothing pointed a seat to the planner prompt after the Plans bullet was cut.

Questions:
- Are both MUSTs closed?
- Did the fix change anything else a seat, builder or reviewer acts on?

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.
