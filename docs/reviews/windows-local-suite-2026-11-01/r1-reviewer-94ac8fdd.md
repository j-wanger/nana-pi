No MUST findings.

- Original assertions remain intact. The 189 check-name multisets match before and after on Windows and macOS.
- Moved blocks recreate their recorded inherited state.
- The restore guard retains every previous forbidden path, adds manifest coverage, and fails the recorded Windows mutation.
- The PATH helper writes one `PATH` key and follows Node’s duplicate-key selection.
- `RUN_ALONE` and product code are unchanged.
- Focused macOS tests passed, including POSIX signal coverage. Map and README checks passed. Recorded Windows split timings are all below 240 seconds.

**NOTE:** The default Windows suite still encounters the pre-existing `packages/nana-pack/tests/land.test.mjs` timeout, beyond the missing-tool failures. This lane does not resolve that documented limitation.

VERDICT: LAND
