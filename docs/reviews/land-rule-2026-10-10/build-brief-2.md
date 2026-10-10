# Lane land-rule — continuation 1: restore the tests, pin each row, prove the mutations (seat, after build 1 PARTIAL)   (2026-10-10 · feat/land-rule)

Build 1 (`eb937f8`) passes the seat's 48 behaviour cases — good. But it removed 36 of the 37 tests in
`packages/nana-pack/tests/land.test.mjs` and replaced them with one test that runs the SEAT's
acceptance script, then pointed R-975, R-976, R-977, R-979, R-1002–R-1007, R-1009 and R-1011 at that
one test. That breaks three rules: a row's evidence must pin ITS clauses (the seat script has no
cleanup or suite-time-switch cases, yet R-977 and R-979 now cite only it); the seat's acceptance
script is the seat's independent check, never the suite's test of record; and coverage may not fall
(the suite went from 6,783 to 6,657 checks). No mutation pairs were run, and the seat output file was
not committed. Change nothing else; the seat has since applied Jake's two tree changes (`dfdef86`).

## Do
1. **Restore every removed land test** (`git show 661f76e:packages/nana-pack/tests/land.test.mjs`),
   moved off `exempt: "test"` onto reviewed fixtures (a scratch home holding a verified version-2 LAND
   for the item and commit). Keep each title where the behaviour is unchanged. Where the behaviour
   changed on purpose — "a valid LAND revision passes and integration commits are called out"
   (now a refusal, R-1002), "runLand requires reviews or a nonblank exemption" (now reviews only,
   R-1003), "suite failure … does not print a landed record", "branch switch … without landed
   records", "release status failure … keeps success code and records" (R-1007 wording) — rename it
   and record the old → new title with a one-line reason in
   `docs/reviews/land-rule-2026-10-10/test-title-map.json` (`{"<old>": {"replacedBy": "<new>",
   "why": "…"}}`). Only the two R-978 exemption tests may be retired (`{"<old>": {"retired": true,
   "why": "R-978 retired"}}`). `node docs/reviews/land-rule-2026-10-10/seat-verify-tests.mjs` must
   print `0 gap(s)`; it prints 36 now.
2. **One or more focused tests per new row**, in `land.test.mjs` or `review-ledger.test.mjs`, each
   pinning that row's clause: R-1002 (uncovered commit refused and named), R-1003 (allowlist), R-1004
   (any item; snapshot `head`; empty verdict refuses; legacy and unverified neither), R-1005 (an
   injected runner shows the second reading, R-977 rechecks and merge happen inside the lock call, and
   a record written between the suite and the lock is seen), R-1006 (in flight, plain and snapshot),
   R-1007, R-1009 (an injected runner shows no reviewed-SHA `cat-file`/`rev-parse` before the
   common-directory refusal), R-1011 (a version-1 LAND alone refuses, at both readings). Retag
   evidence so each row cites only tests that pin it; restore R-975, R-976, R-977, R-979, R-588,
   R-969 and R-970 citations to the restored tests.
3. **Delete `packages/nana-pack/tests/land-rule.test.mjs`.** No suite test runs a seat script.
4. **Mutation pairs**, all of CHANGE §6, each red then green, recorded in the report.
5. The suite's check count must be at least main's 6,783 minus the two retired exemption tests'
   checks; report both numbers.

Then: `npm run req:tree`, `npm run map`, `npm run map:check`, `npm run readme:check`,
`npm run test:locked`, commit, `npm run template:accept`, then
`node docs/reviews/land-rule-2026-10-10/seat-verify-land.mjs > docs/reviews/land-rule-2026-10-10/seat-verify-land-output.txt 2>&1`
and `node docs/reviews/land-rule-2026-10-10/seat-verify-tests.mjs >> docs/reviews/land-rule-2026-10-10/seat-verify-land-output.txt 2>&1`
(both must exit 0), commit that file.

Rules as `build-brief.md`. Frozen: `CHANGE.md`, both seat scripts, FEAT-008's `Purpose:` and
`Also applies:` lines, `HANDOFF.md`, `docs/sessions/`. Report ≤ 40 lines, first line `VERDICT: …`,
with the LAST TWO LINES of each seat script's output verbatim.
