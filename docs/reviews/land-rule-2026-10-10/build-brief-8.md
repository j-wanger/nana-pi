# Lane land-rule — continuation 7: astra land review r1 (SEND-BACK, 8/10) — four items (2026-10-10 · feat/land-rule)

Read `astra-land-r1.md`. sol's parallel review stalled three times on the endpoint and recorded no
verdict (`sol-build-r1-stalled.log`); both review the fixed tip next. Four items; do all four.

- [ ] **A. Plain commits only (MUST 1; R-976).** `runLand` resolves `${sha}^{commit}` without first
  checking the named object's type, so an annotated TAG object ID pointing at a reviewed commit
  lands. Restore the object-type check (`cat-file -t <sha>` must be `commit`) BEFORE
  canonicalisation, after the R-1009 repository check, and add a regression test in
  `land.test.mjs` citing R-976. The seat script now has this case and fails it.
- [ ] **B. The README states every CHANGE §5 residual (MUST 2).** Beside the land instructions or in
  the Trust model of `packages/nana-pack/README.md`, in plain words: deploy with no land, review OR
  WORKER process running; while a land holds the ledger lock, another review that waits past the
  15-second limit is refused or goes unrecorded with its output kept, and is re-run; a new commit
  (amend, rebase, an empty commit) starts with a clean verdict record; a narrow review counts as a
  LAND of the whole ancestry up to its revision; a direct commit to main bypasses the helper, and
  the working pattern forbids it. Keep R-981's pinned patterns.
- [ ] **C. Remove dead parameters (SHOULD).** `runLand`'s `readLedger` and `now` no longer control
  anything; remove them and any test that passes them.
- [ ] **D. Release status outside the lock (SHOULD; CHANGE §4).** Inside the lock: the second
  reading, the R-977 pre-merge rechecks, and `merge --ff-only`. After the lock: the post-merge
  checks (main still on `main`, ref at the tip, clean, containment) and the release-status line. The
  R-1005 lock test keeps pinning the inside part. (Build 6 moved them inside because the seat's
  brief 6 said "nothing after the suite runs outside it but the success output" — that wording was
  wrong; CHANGE §4 governs.)

Then: `npm run req:tree`, `npm run map:check`, `npm run readme:check`, `npm run test:locked` (must
pass; report the summary line), commit, then into the output files as before:
`seat-verify-land.mjs` and `seat-verify-tests.mjs` (both exit 0), and
`python3 docs/reviews/land-rule-2026-10-10/seat-mutate.py` (must print 15/15 red; if item D moved an
anchor line so a mutation reports SKIP, say which — do not edit the runner). Commit. Rules as
`build-brief.md`; frozen as before. Report ≤ 20 lines, first line `VERDICT: …`, checklist ticked.
