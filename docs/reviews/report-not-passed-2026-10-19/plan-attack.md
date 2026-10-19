# report-not-passed — plan attack (one adversary)

Verdict: AMEND

AMEND. The design is sound, the class is right (ordinary) and the real-data claim holds. Two tests let plausible wrong code through, and some numbers are stale. All probes ran in a temp clone (removed afterwards); nothing touched the repo.

Confirmed by probe (temp clone of main 6b3e432 plus a copy of this clone's 2026-10-17 runtime data):
- The plan's rule lists exactly R-1064, R-1058, R-1063, R-1330 and R-1340 (each is a SKIP that changed since). The scout's rule lists 0. R-534 (PASS plus SKIP) is left out. Real data has 147 PASS, 2 SKIP and 0 FAIL. 42 implemented rows cite only unmeasured files, and none cite SKIP plus unmeasured.
- A prototype of the design passes all six checks. The 60 existing checks stay green, both R-1017 checks included. EARS: 0 rows off form. With the six rows the trace total is 1,291 and fully traced. map:check reports 0 problems.
- Merge simulation with audit-open-questions: only the buildReport model line conflicts. README, REQUIREMENTS and the test-block placements merge cleanly.
- Red today: main's Issues view draws only the legend and the violated cards. Every check finds the heading first, so all six are red.

Amendments:
1. R-1654 had a survivor. The wrong code "treat a changed-since label as not PASS" kept all six checks green and listed 742 rows on real data. The fix adds a stale-PASS row that must stay out. With it, the mutation turns R-1654 red.
2. R-1655 had a survivor. The wrong code "count from model.violated" stayed green when the fixture listed 5 rows, the same as the 5 violated rows copied from the real ledger. The fix makes the check assert the exact listed set and count, and assert that the count differs from the fixture's violated count. With it, R-1655 turns red.
3. Some rows were wider than their tests. R-1650 says "every file", so the test adds a two-SKIP row. R-1652 says "PASS and no FAIL", so the test adds PASS alone and PASS plus unmeasured. R-1651 adds FAIL alone. Row texts are unchanged; titles change.
4. The brief now names a fixture trap: setRowEvidence keeps a row's status. Fixtures need a block-local status helper and file names that no real row cites.
5. Wrong-code item 7 behaves differently than the plan said. Moving the heading to module scope crashes the file (exit 1, ReferenceError); it does not turn each check red.
6. Stale numbers are fixed. Main is 6b3e432, not f29827a. R-291 reads 1,285 today, not 1,278. It becomes 1,291 with this lane and 1,293 with audit-open-questions too. Every in-flight lane bumps R-291 and docs/requirements-tree.md, so re-take both after each main merge.

The claim I'd most expect to be wrong is unchanged from the plan: counting stale labels. It is still the owner's call. Changing it is one condition, and R-1654 would flip.
