# Seat verification after astra r2 — 2026-10-04

astra r2 was BLOCK 8/10 on two items. The fix commit is `f371934`. Round 3 was not spent, because both items are small and checkable by execution.

| astra r2 item | Check | Result |
|---|---|---|
| MUST 1 patch escape | Read `recordingReads` (fsops.test.mjs:50–65): the patch and the first `syncBuiltinESMExports()` sit inside `try`, and the restore sits in `finally`. Both files carry a setup-failure regression (a throwing `statSync` getter, then no leak asserted). | Both test files exit 0. The worker reports the old ordering turns the regression red. |
| MUST 2 R-380 dry run | R-380 now reads "outside a dry run". The worker added a test that pins the dry-run boundary and kept dry-run output unchanged. | desk-service.test.mjs exits 0, with 33 checks. |
| Rows | R-377 to R-380 | one `shall` each, `implemented` |

Residual: if `syncBuiltinESMExports()` throws again inside `finally`, the test fails loudly rather than leaking silently. That is acceptable for a test helper.
