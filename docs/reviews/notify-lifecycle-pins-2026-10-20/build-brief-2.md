# Build brief 2 — notify-lifecycle-pins (the seat, 2026-10-20)

CI run 39399669354 on build 1 (b88c60b7) failed one check on every leg, in a file this lane did not edit:
`packages/nana-pack/tests/product-report.test.mjs::R-1655: the not-passed heading states the number of rows listed
under it`, detail `{"headingCount":6,"listedIds":["R-1020","R-1021","R-1025","R-1026","R-1027","R-1030"],"violated":6}`.

Cause: the check's last clause, `headingCount !== view.model.violated.length`, proves the heading counts listed rows,
not violated rows, by comparing the fixture's 6 against the live ledger's violated count. Main has 5 violated rows;
this lane honestly adds a sixth (R-2141), so the two counts collide and the check goes red. The product is fine; the
check's discriminator depends on the live ledger.

Do this, and nothing else:
1. Change only that clause of the R-1655 check so it no longer depends on the live ledger's violated count, while
   still proving the heading counts the listed rows and not the violated rows. For example: give the fixture a
   violated count that differs from 6 by construction, or compare against a violated count the fixture controls.
   Keep the check's title and its `// req: R-1655` marker. Do not weaken the other clauses.
2. Show the check red on a wrong heading that counts violated rows instead of listed rows (in a temp copy or the
   worktree, then revert), and green on the lane's tip.
3. Run `node packages/nana-pack/tests/product-report.test.mjs`, the lane's two new test files,
   `node scripts/requirements-trace.mjs`, `npm run map:check` and `npm run readme:check`. All exit 0.
4. Commit with explicit paths. Single test files only; no full suite; no push; no pull request; never edit HANDOFF.md
   or docs/sessions/.

Report (at most 6 lines): VERDICT, commit, what the clause now compares, the wrong-heading result, files committed.
