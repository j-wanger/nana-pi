# leaf-total-drop — plan attack (one adversary)

Verdict: AMEND

AMEND: the design holds, and the four checks plus the five wrong-code cases behave as the plan claims. I ran the probes in a temp clone of main and edited no repository file.

Probes run:
- P1. I added one row to FEAT-028's table and regenerated the outline. Today's test FAILED only on the leaf literal.
- P2. I added one row to FEAT-002's own table, above SUB-001. Today's test PASSED with the literal at 1,278 while the trace printed 1,279, so feature-level rows go uncounted today.
- Prototype. I wrote the plan's test-local treeAccounting plus the four checks and added R-1640 to R-1643 as implemented. All checks passed. The trace showed 0 rows off form, the tree check exited 0, and map:check and readme:check were green. requirements-moved listed exactly the 4 new rows.
- Wrong code. W1 turned R-1640 and R-1643 red. W2 turned R-1643 red. W3 turned R-1641 red. W4 turned R-1642 red. W5 turned R-1641 red. Two extra cases also went red: counting only the parser's rowsInTables (R-1641) and always returning no problems (R-1641 and R-1642).
- Scenarios on the prototype:
  - An added row passes with no test edit.
  - A feature-level row passes.
  - A duplicate R-294 fails naming R-294.
  - A blank line inside a real table fails naming each dropped ID.

Other checks:
- The trace rail runs in the suite and already throws on a duplicate line. R-1642 still earns its place: when the parser double-reads one line, the trace sees a single line and nothing else catches it.
- The class is right. The lane edits a test file, the ledger and the outline, and touches no install, hook, gate, land or review tool.
- The checks run in memory, and the repo checks out with LF line endings on every platform, so Windows and Linux behave the same.
- The ID block R-1640 to R-1649 is free on main and on every in-flight branch.
- The only live use of the literal is the test file itself. Templates, the requirements skill and the builder preamble do not mention it.

Amendments:
1. Main moved while I worked. gate-rm-workdir landed (main is now 6b3e432) and bumped the literal from 1,278 to 1,285. That makes 46 commits that changed it. The stale numbers are updated.
2. gate-rm-workdir is no longer in flight. Eight branches remain, each changing exactly 3 and 3 lines of the test file. Every worktree has no uncommitted edits to the test file or the ledger.
3. The duplicate message becomes "<ID> is read N times by the tree". It is accurate for a duplicate inside one table.
4. The R-1640 check also asserts that R-291's row was found.
5. The R-1643 check asserts that the fixture's feature really holds R-001.
6. The brief warns about a startup error I hit: `fixture` is a const declared later in the file, so the new checks cannot call it from the old check's position.
7. The two extra wrong-code cases join the list.
8. One known limit is added: R-1640 fails alongside the real check whenever the real ledger itself has an accounting problem.
