Feature: FEAT-007 · Review a specific revision independently

# Review brief 3: Cut A (confirmation)

Round 2 said LAND at dbe250c0, but CI on it failed two repo-wide checks on all three platforms (run 42683107535). Review only the change since: `git diff dbe250c0 7d72273d` (two commits), plus the seat's merge of main (the red-main fix win-launch-argv), which adds nothing beyond main (`git diff --name-only main HEAD` equals `git diff --name-only main...HEAD`; map, tree, trace and README checks exit 0 on the merge).

- `f0b72a44`: code-map-launch R-3156 names the lost edge brief-check.test → slow-sampler, which build 3 removed on purpose.
- `7d72273d`: A-056, the review audit log, gets a dated `Parked:` line: its reader (the review timeline) was cut; review-round still writes it until a later cut.

The builder ran 36 repo-wide ledger and map test files alone, all exit 0.

Question: does each commit fix its CI failure honestly, without editing a check to pass?

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.
