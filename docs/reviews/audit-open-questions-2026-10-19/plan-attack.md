# audit-open-questions — plan attack (one adversary)

Verdict: AMEND

AMEND. The lane is worth building, but the plan has one real gap: its tests would pass while the real page breaks. I probed in a temp clone of the report-test-details tip b8616fb with a temp HOME. I built a prototype of the design, then ran mutants against it.

1. The tests did not cover the page the reader sees. The page gets `renderInto` through `String(renderInto)`, so the function cannot read anything defined at module scope. The plan asks for "named constants with contract provenance" and does not say where they go. A builder following no-inline-tunables would put the none message at module scope. I probed that: all 63 existing product-report checks stay green, and so would the plan's Node-side render. The written page, though, throws "ReferenceError: NO_OPEN_QUESTIONS is not defined" when there is no open question. Amended: both checks run the written page's own inline script in node:vm. The none message is a named const inside renderInto. W8 is added, and it turns R-1571 red.
2. R-1571 was wider than its test. The row covers "no heading OR no entry under it", but the test covered only a missing heading. Amended: the test has a second case, heading kept with only the preamble line. W4 and W5 now also turn R-1571 red (probed).
3. CRLF was in the threat model but nothing pinned it, and a Windows checkout really produces CRLF. Amended: the R-1570 fixture is written with CRLF. W9 (parsing a fresh raw read of the file) turns R-1570 red (probed).
4. Ledger text the builder copies word for word had wrong facts:
   - Entry 13 said "most untested rows are partly pinned and name the unpinned words". The verifier counted 75 of 264 partial pins, 111 batch sentences and 49 dashes. Corrected.
   - Entry 23 now notes that the pack README line 22 repeats the phrase.
   - R-937 was reworded in 7b46022. 369828a only changed its evidence.
   - Question 3's count: 29 implemented FEAT-031 rows cite test-runner.test.mjs, not 22.
5. The R-1019 text-node check renders a model with no `questions` field. The brief now says to treat that as none. The probed prototype kept it green this way.
6. The HANDOFF decisions ask should add 13 as well as 15, because 13's template half is the owner's call.
7. Two new known limits: a scaffold's placeholder `1. _(none yet)_` lists as entry 1, and a `*` bullet continues the entry above.

Red today (probe on b8616fb): with today's code, R-1570 finds 0 `ul.open-questions`. For R-1571, the page is written in both cases but neither holds the message. With the prototype, every mutant turned its named check red, W1–W9. W7 turned R-1570 and the R-1018 ask-body check red.

Checks that held:
- The class is ordinary.
- The IDs R-1570 to R-1579 are unused on main and on every in-flight branch.
- The product-report test is not on the win32 skip list, and the new checks use no platform-specific path.
- No build step writes outside the worktree or the temp folder.
- Each audit claim was checked against rows on main ab5c3e8 and against the verifier output.

Files the build touches, all in the worktree:
- REQUIREMENTS.md
- scripts/product-report.mjs
- packages/nana-pack/tests/product-report.test.mjs
- packages/nana-pack/tests/requirements-tree.test.mjs
- docs/requirements-tree.md
- README.md
- docs/code-map.md, only if map:check says it is stale
- The seat edits HANDOFF.md, docs/sessions/2026-10.md and docs/reviews/audit-open-questions-<date>/.

Conflicts:
- report-test-details is a HARD conflict, and the build waits for it. It rewrites renderInto, the model line, about 237 test lines, the README paragraph and the FEAT-039 table.
- Its tip b8616fb already merges the g005-carveout land tip b7df8d8, which merges rulings-file ed38cb4. So once it lands, C08's closure is true on the base.
- No in-flight lane edits `## Open questions` or any row named in entries 13–23. I read the REQUIREMENTS.md diffs of all eight lanes against main.
- Every lane bumps the tree outline and the leaf total. The builder regenerates the tree and recounts.

The one claim most likely wrong: that R-938, R-980, R-964 and R-311 are still false on Windows when the build starts. That comes from the AGENTS support line, not a Windows run, and Windows lanes keep landing. The builder re-reads each named row on its base and drops any entry that is already fixed.
