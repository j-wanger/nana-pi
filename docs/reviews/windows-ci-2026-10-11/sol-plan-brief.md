# Plan review brief — Windows in CI, 2026-10-11 (reviewer: gpt-5.6-sol; roles: scope + adversarial + requirements)

Review `docs/reviews/windows-ci-2026-10-11/CHANGE.md` before anything is built. Read
`.github/workflows/ci.yml`, `packages/nana-pack/tests/ci-workflow.test.mjs`, the R-684 support-line
test in `packages/nana-pack/tests/templates-render.test.mjs`, the three front doors that carry the
support line, and `REQUIREMENTS.md` (FEAT-019).

Attack: (1) will the Windows leg actually run the suite (shell, PATH, `npm i -g`, `uv`, `pnpm`,
copier via `NANA_TEST_REQUIRE_COPIER`, `pi --version`, `npm test` on `windows-latest`)? (2) does
making it non-blocking keep the release gated on macOS only, as today's Linux leg; can a Windows
failure still block or alter the release? (3) the rows — one `shall` each, testable, R-684's rewording
true and pinned; (4) anything the plan misses (other tests pinning the matrix or the support line, the
template copies of the support line, docs that describe CI); (5) the draft-pull-request approach to
seeing the Windows leg before merging. Name rare cases as residuals rather than MUSTs.

Answer with the full review as your final message: MUST / SHOULD / NOTE with file:line, evidence and
the smallest fix; score; last line exactly one of `VERDICT: LAND`, `VERDICT: LAND-WITH-FIXES`,
`VERDICT: SEND-BACK`.
