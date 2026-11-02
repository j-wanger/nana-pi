VERDICT: PARTIAL

Commit: `a40b8f9c093dc186d2a1594f5d729359bf2bb0cb`
Branch: `feat/seat-anatomy-roster-notice`. Not pushed, as instructed.

- Implemented R-3682–R-3684; amended R-3640.
- Attribution uses whole windows and imported producer labels. Dedupe stays with the resolved producer.
- M1–M3 and policy-seal assertions failed baseline code and passed candidate code.
- All four required test files and named checks passed on the committed tip, exit 0. Lane class: `ordinary`.
- No exports. Additional existing-test edits reflect removal of unsupported dedupe.

Files, assertion names, test edits, departures, and command results: [technical record](docs/reviews/seat-anatomy-roster-notice-2026-11-02/build-1-report.md).

Not done: A4 real-input counts regeneration and full-suite CI validation. Two pre-existing untracked briefs remain untouched.

Writing-check verdict and identifier findings remain because this technical report requires both.
