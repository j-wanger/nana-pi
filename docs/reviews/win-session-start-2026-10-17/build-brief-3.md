# Lane win-session-start — build brief 3 (2026-10-17 · tip 2c068a1, main 9c965ae merged)

Builder: Claude Sonnet 5, the same builder. Windows run 2 (`ci-windows-run-2.log` here): objective-golden 978 pass, 4
fail, 6 skips. The lone-surrogate, FIFO and ownership cases are settled. The four `path payload (false|true): every
mention is the escaped, quoted path` and `…: wording` checks still fail on Windows after build 2's change, and the log
printed no detail. The seat merged main, which makes CI's Windows leg verbose, and moved the leaf total to 1,213.

Give each of those four checks a detail argument that prints what they compared: the expected escaped path, the
mention count found, and the first 300 characters of the block. Then look again at how the expected form is built on
Windows: the escaped form the product writes may escape backslashes (`\\`) or use another quoting for a Windows path;
derive the expectation from the product's own escape function applied to the real path, not by hand. If the product's
output for a Windows path would mislead a user, stop and report it with the exact text; do not change the product.

Same rules as brief 1. Done: `objective-golden.test.mjs` green on macOS with its count unchanged; `seat-titles.mjs 1` →
`0 missing`. Commit with explicit paths, push. Report ≤ 8 lines.
