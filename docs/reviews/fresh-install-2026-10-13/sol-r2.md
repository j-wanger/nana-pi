- **MUST — `packages/nana-setup/tests/pi-install-pin.test.mjs:42`:** The rewritten scanner misses normal indented code blocks following prose or a blank line because it recognizes indentation only when `prose` is empty. A README can therefore contain an unpinned indented `npm install` command without failing the test, allowing users to receive a broken dependency tree. This regresses the prior scanner, which inspected every indented line.

The continued command and comment-only cases are fixed. The desk commands are correctly scoped as a frozen residual, and the stale HANDOFF queue entry is removed.

VERDICT: SEND-BACK
