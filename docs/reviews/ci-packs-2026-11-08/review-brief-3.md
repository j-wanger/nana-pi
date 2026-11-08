Feature: FEAT-031 · Run checks reliably and without contaminating work
Card: fix

# Review brief 3: ci-packs — confirmation round on the main merges

Round 2 said LAND at 243d79ab. Since then the lane merged current main four times (cffbc8d8, 12d613e3, 22d6618c by the builder; b4d9a7fb by the seat). Review only `git diff 243d79ab..HEAD`, read against what main brought in (`git diff 243d79ab^2..HEAD` is not meaningful for merges; use `git log --first-parent 243d79ab..HEAD` and `docs/reviews/ci-packs/merge-main/report.md`, which records all 25 conflict resolutions and eight new-file pack assignments). The seat's last merge kept both sides' new REQUIREMENTS rows (R-3850–R-3859 and R-3905–R-3910) and regenerated the tree and code map.

Questions: did any conflict resolution drop a main-side fix, a test case, or a requirement marker? Is every test file main added since round 2 in exactly one pack, and does each sit in the right pack (a Windows-only fix in main or module, not retire)? Do `--fixes-red` and the land reader still accept the pack records? Threat model: honest merge drift and runner variation; forgery out.
