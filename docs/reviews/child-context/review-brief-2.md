Feature: FEAT-013 · Install and connect harness runtimes
Card: fix
Serves: roadmap step 3 (trim each helper's starting context): confirmation round on review 1's fix.

# Review brief 2: child-context — confirmation round

Review 1 sent back one MUST: `one-reviewer.test.mjs`'s launcher fixture lacked two setup helpers the new log code imports. Review only `git diff ed40a361..HEAD`: the fixture fix (commit 08e6db18), the four SHOULD lines recorded in `docs/known-bugs/FEAT-013.md`, and the regenerated code map. Question: does every launcher fixture in the module pack now carry the helpers, and do the known-bug lines state the SHOULDs faithfully? This tip's CI is the proof for the suite. Threat model: honest variation; forgery out.
