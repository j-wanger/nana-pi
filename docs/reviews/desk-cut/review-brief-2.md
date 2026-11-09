Feature: FEAT-016 · Start the local development desk
Card: fix

# Review brief 2: desk-cut (confirmation)

Confirmation round. Review only `git diff 0b576c7c..HEAD` on branch feat/desk-cut. Round 1 said LAND. CI then failed one check on every platform: `requirements-cap-kinds.test.mjs` R-2460, "CAP-06: Kind: product requires a Deliverables: line". The cut froze all of CAP-06's features with every row retired, so it can list no deliverables, and the tree cannot retire CAP-06 while its features hold rows. The fix makes R-2460 apply to capabilities with an `active` or `proposed` feature, matching its title ("every live capability"), and adds a case that an active product capability with no deliverables still fails.

Questions:
- Does the narrowed check still catch a live product capability with no deliverables?
- Could any capability that should be checked now be skipped?

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.
