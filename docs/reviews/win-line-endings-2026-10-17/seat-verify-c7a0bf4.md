# Seat checks — win-line-endings build 1, tip c7a0bf4 (2026-10-17)

- Title check: `seat-titles 1: 0 missing`.
- Full suite on the Mac (`npm run test:locked`): `150 files: 148 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7445 pass, 0 fail, 14 skip · 760.6s`, exit 0.
- CI run 39065519961 on draft pull request #16 (`ci-windows-run-1.log`): macOS suite and both install checks green; the Linux suite fails only
  `lane-write-guard.test.mjs`, as main does. Windows suite: `150 files: 87 PASS, 62 FAIL, 1 SKIP` (main a980a1f's Windows leg: 69 failing). Every
  LE4 file passes on Windows: ci-workflow 11, code-map 47, line-endings 1, mutation-runner 25 (+3 declared skips), product-report 57,
  requirements-tree 89, templates-render 161 (+2 skips), entry-guidance 13.
- No wrong-code pairs and no independent check: an ordinary lane under the feature-first ruling.
