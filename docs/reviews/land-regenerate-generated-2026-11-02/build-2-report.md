VERDICT: DONE

Commit: `7bb02fd80e9123edf95130667ab859e58dc394f0`  
Branch: `feat/land-regenerate-generated`

- Rows: R-3706–R-3712 implemented; R-3691 and R-3696 amended.
- Files: land implementation/configuration, fixtures, six new checks, existing M9, guidance, ruling, README and generated documentation.
- Draft: kept the regeneration flow and tests; corrected the settled wording and timeout import; redid all evidence.
- Wrong-code pairs: M1–M6 and M9 fail against base code and pass against this implementation.
- Tip verification: all seven required test files passed serially: **133 passing checks, zero failed files**.
- Tip checks: map, README, trace, tree, known-bugs and identity commands all exited 0.
- Determinism: all eight generator runs exited 0; hashes matched across both line-ending settings.
- No private helper exports. The report records fixture adjustments, cleanup, configuration guards and known-bug contact.

Technical record: `docs/reviews/land-regenerate-generated-2026-11-02/build-report.md`

Not done: push, full suite or CI access, as instructed. The seat still owns mutation pairs and independent review. Installed rulings remain stale.

Writing-check notes remain because this is the brief-required technical report.
