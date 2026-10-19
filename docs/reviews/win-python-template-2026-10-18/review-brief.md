# Review — win-python-template (a Python project made from the template passes its own tests on Windows), 2026-10-18 (gpt-5.6-sol, the lane's one final reviewer)

Review `git diff 4df86da..HEAD` on `feat/win-python-template` (main is `4df86da`, and `git merge-base HEAD main` is
`4df86da`). The plan of record is `docs/reviews/win-python-template-2026-10-18/must-meet.md`: PT1 (row R-1360) and the
evidence PT2, with the seat's amendment at its end. `plan-design.md` and `plan-attack.md` hold the design; the seat's
record `seat-verify-9dca975.md` holds the Mac suite and the Windows run, its log beside it.

The fix lives in the Python template's own tests (`templates/python/template/tests/`), which ship to users through CI's
release tag after the land. Judge whether the rendered project's tests now pass on Windows for the reason the plan gives,
whether what a user sees is unchanged under the default encoding, and whether PT1 fails on the unfixed template.

The review standard pi-review appends is the bar. Threat model: honest variation in Windows encodings and locales in
scope; deliberate forgery out. Lane class: ordinary — template tests, one check and one row.

Check: (1) PT1 as amended, and PT2 in the Windows log; (2) the PT1 check is not vacuous (it runs, it can fail, its SKIP
names a missing tool); (3) no rendered file changes for a user beyond the tests; (4) HANDOFF and the session entry are
true; (5) any MUST.
