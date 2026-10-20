# hook-deadlines — plan attack (one adversary)

Verdict: AMEND

AMEND. The design holds, and every must-meet test is red today or is a pin with a wrong code I watched go red. The amendments narrow the rows to their tests, make the threat model honest and cut one conflict-prone README edit.

Probes ran in a temp clone with a temp HOME. Both the folder and the stub trees are now deleted.
- R-2010, R-2011, R-2012: today's adoption and objective hooks printed nothing and were still running when killed at 8 s. With `timeout: 1500` the output was exact and exit was 0: one adoption hang took 1.57–1.59 s, both hanging took 3.04–3.06 s, and the objective hang took 1.54 s. W2 (print `result.stdout` on ETIMEDOUT) printed `PARTIAL`, so it is red.
- R-2014: today the hook exits 1 with stderr closed, in 4 of 4 runs (3 on `not json`, 1 on `{}`). With the listener it exits 0 in 3 of 3.
- R-2015: exits 0 with empty stderr in 3 of 3. The pull log shows the closed run's session got its pointer, so the write really ran. W6 (`process.exitCode = code`) gave exit 1 with an unhandled EPIPE in 3 of 3.
- No regressions with both product changes: hook-producers (10), hooks-closed-output (5), stale-copies (13), adoption-reader (44) and objective-golden (1236) all pass on macOS.
- Healthy producer times on macOS with a temp home: objective 108 ms, adoption 59 ms, stale-copies 67 ms. In hosted Windows install check run 39368683280, the adoption hook (both producers) ended 0.34 s after it started, beside six other hooks.

Amendments:
1. Narrowed R-2014 and R-2015 to the closed-reader case the tests exercise. The R-1940s precedent rows are listed in HANDOFF residuals as wider than their test.
2. R-2013 now names the three producers, and its seal test loops over all three.
3. R-2011 now uses the same "has not exited when the limit passes" wording as R-2010 and R-2012.
4. The threat model no longer promises to end a "hung file read". spawnSync's timeout signals the child and then waits for it, and the README already says so about the refresh.
5. Dropped the README tests-table row. The table lists 21 of the 46 test files, and both doctor-fix-line and setup-checkout-spelling add table rows.
6. hook-deadlines spawns now get a temp HOME and USERPROFILE.
7. The R-2015 setup now names `sources.json`, and sets NANA_KNOWLEDGE_HOME and removes NANA_ROLE only in the knowledge child's env.
8. Added W7: the timeout set only for the adoption producer.
9. The provenance now carries the measured numbers and names R-2013.
10. Main is now cdf4b098, because review-test-waits landed.

Subtraction choices:
- No async true-deadline launcher. It would rewrite the R-687 sync test seam, and its only extra case already behaves as today: a wait no signal ends still hits Claude Code's 5 s limit.
- No per-hook budgets, because they add tunables.
- No SIGKILL. An unhandled SIGTERM is fatal, the producers install no signal handlers, and stale-copies takes no lock.

Class: install, hook or gate, and a simple build: two product lines plus tests.

Files the build touches:
- packages/nana-setup/lib/hook-producer.mjs
- packages/nana-setup/claude/hooks/verifier-pipe.mjs
- packages/nana-setup/tests/hook-deadlines.test.mjs (new)
- packages/nana-setup/tests/hook-producers.test.mjs
- packages/nana-setup/tests/hooks-closed-output.test.mjs
- packages/nana-setup/README.md (one sentence near the Runtime dependencies paragraph)
- REQUIREMENTS.md
- docs/requirements-tree.md
- docs/code-map.md

Conflicts: none on code or test files.
- REQUIREMENTS.md: our rows go after R-1944. setup-checkout-spelling adds rows in the SUB-013 table, with five unchanged lines between, so the merge is mechanical.
- README: our sentence sits near line 22. doctor-fix-line edits near lines 263 and 458, and setup-checkout-spelling near 274 and 462. No overlap.
- docs/code-map.md and docs/requirements-tree.md: regenerate after any merge of main.
- settings.mjs: setup-checkout-spelling adds a cross-package import there. Our test imports desiredHooks from the checkout, and the copied tree never loads settings.mjs, so it is unaffected.
- win-config-json-path changes the real objective producer, but our new tests use stubs.
- The two slate siblings (install-check-turn-edit-powershell, pi-probe-timeout) have no worktree yet. Expected overlap is REQUIREMENTS.md, the tree, the map and maybe the README. pi-probe-timeout must not put its tunable in hook-producer.mjs.
- Merge main and regenerate the map and the tree before the final review.

Seat hazard: none of W1–W7 starts pi. So a seat-mutate.mjs under docs/reviews/hook-deadlines-*/ must not contain the literal spawn("pi" text.

Claim most likely wrong: that a healthy producer always finishes inside 1500 ms on the owner's Windows machine at a cold start, with antivirus scanning new node processes and .mjs/.ts reads. Hosted Windows CI is well inside the limit (both adoption producers in 0.34 s). No real Windows desktop has been measured. A miss prints a false "UNAVAILABLE … Tell the user" line for that one session.
