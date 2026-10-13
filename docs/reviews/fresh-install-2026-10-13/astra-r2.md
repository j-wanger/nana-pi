Reviewed `30d6f91..912cda6`.

Round-one findings are closed or correctly scoped:
- Continued commands, multiline spans and comment-only cutoffs now have passing regression tests.
- Frozen desk repair hints remain explicitly out of scope.
- HANDOFF’s stale queue item is removed.

**SHOULD — `packages/nana-setup/tests/pi-install-pin.test.mjs:41`:** Indented blocks following prose are skipped because `prose` remains populated across blank lines. Reproduced with `Install pi:\n\n    npm i -g @earendil-works/pi-coding-agent@1.0.2`: the scanner returns `[]`. Recognize this form and add a fixture. This is a future drift-detection gap; current published commands remain correct.

Validation: targeted tests passed 8/8. Read the recorded 82/82 acceptance and 45/45 mutation results; did not rerun them.

VERDICT: LAND
