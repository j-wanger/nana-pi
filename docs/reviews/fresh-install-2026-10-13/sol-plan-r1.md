## Findings

**MUST — unsafe but parseable cutoffs produce broken install commands.**  
`docs/reviews/fresh-install-2026-10-13/CHANGE.md:46-49`

The parser accepts any value supported by `Date.parse`, then emits it unquoted. A realistic retune to `"2026-10-04 06:57:57Z"` passes `Date.parse`.

A scratch npm run then treated `06:57:57Z` as another package and exited with `EINVALIDTAGNAME`. CI remains green because its own cutoff is quoted.

Smallest fix: require a shell-safe UTC timestamp format, add whitespace and metacharacter rejection tests, and make unsafe workflow values fail the drift test.

**SHOULD — the README inventory can miss an unpinned command.**  
`docs/reviews/fresh-install-2026-10-13/CHANGE.md:110-111`

T1 scans backtick spans and individual fenced lines. An indented code block or a command split across fenced lines can bypass it.

A later README could therefore restore the broken fresh-install behavior without failing the test.

Smallest fix: scan every covered README for package-bearing npm install commands across Markdown command forms. Add an indented or multiline mutation.

**SHOULD — known user-facing commands remain outside the declared outcome.**  
`docs/reviews/fresh-install-2026-10-13/CHANGE.md:91,163,168`  
`apps/desk/pi-session.mjs:347,353`

The plan explicitly leaves two desk repair commands and the study README command unpinned. Users following them receive the latest pi, not pinned pi 1.0.2.

Current pi 1.2.0 imports successfully, so this is not presently a material break.

Smallest fix: broaden the requirement and inventory, or narrow the lane’s “every user-facing command” claim.

**NOTE — R-1093’s consumer clauses lack direct trace markers.**  
`docs/reviews/fresh-install-2026-10-13/CHANGE.md:29,112`

Existing R-1037 tests protect install and doctor’s shared-hint use, but the plan leaves those tests tagged only for R-1037.

Smallest fix: add R-1093 to those two existing test markers and cite their exact titles.

The four proposed rows each contain exactly one `shall`. The current macOS, PowerShell, and cmd command forms are otherwise credible.

**Score: 7/10**

VERDICT: SEND-BACK
