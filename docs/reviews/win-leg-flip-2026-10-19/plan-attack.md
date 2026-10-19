# win-leg-flip — plan attack (one adversary)

Verdict: AMEND

The design holds and the lane is worth building, but the brief needs six small fixes. Evidence from my probes is listed first, then the fixes.

Evidence:
- ci.yml line 50 still reads `matrix.os != 'macos-latest'`, so the lane is not done.
- The trigger in the win-leg-blocking must-meet is met. Main runs 39268388415 and 39271247545 each read "154 files: 133 PASS, 0 FAIL, 21 SKIP" on Windows (I re-read both job logs).
- Lane-branch Windows runs after 4be0b79: 8 of 9 green. The one red run had a real leaf-total failure (report-test-details), so I saw no flake.
- A blocking failure skips release. On main runs 37834866379 and 38907014916 macOS failed and release was skipped (I re-read both).
- Main has no branch protection: the API returns 404 and the rulesets list is empty.
- My own reader, built to the design and run on temp copies of ci.yml:
  - today's file fails R-1530 ("windows-latest leg continues on error");
  - the flipped file passes both checks;
  - `true`, a deleted line, a step-level flag, `always()`, `!cancelled()`, `needs: [install-check]`, dropping Windows, a compound `&&`, and `matrix.experimental` each turned R-1530 or R-1531 red.
- R-1531 cannot be red today, and that is acceptable. It pins the Support line's Linux claim, now that the R-597 literal it replaces is gone.
- Class: ordinary is right. CI config is not on the install, hook or gate list. Touching nana-setup/ still triggers the local install check.
- Conflicts: no in-flight lane touches ci.yml or ci-workflow.test.mjs. The rulings-file, parallel-runner and report-test-details edits to AGENTS.md, README.md, the nana-setup README and templates-render.test.mjs are separate hunks; I checked each diff from main. The leaf total, REQUIREMENTS.md and the tree file conflict with every lane, as usual.

Fixes:
1. bench-win landed during planning (main is now ab5c3e8). The leaf total is now 1,257, so this lane makes it 1,259, not 1,257. The test prints no count, so the brief now says to add two to main's literal (a retired row stays a leaf).
2. The brief now gives the exact Support-line clause. R-684's row wording differs from the front-door wording, so "the same clause" was ambiguous across the four copies.
3. Reader tightening: the suite job may hold at most one continue-on-error line, and only at the four-space job level. Any other one fails, including a step whose first key is `- continue-on-error:`, which a step-indent regex would miss. The always()/failure()/cancelled() scan now covers the whole release header before `steps:`, so a multi-line `if:` cannot hide a call.
4. Three wrong-code tries added: `!cancelled()`, Windows dropped from the matrix, and a compound expression.
5. Added a question for the owner that the win-leg-blocking spec left open for this lane: should a land also need a green Windows leg on the reviewed tip? The seat records it on a HANDOFF line, next to the Linux question.
6. Added the requirements-trace test to Done, because markers move.

Wait: the build waits on nothing. The land waits until the latest main run has a green Windows suite leg. Run 39276267655 (main ab5c3e8, the bench-win land) was queued at plan time.

Claim most likely wrong: that main stays green on Windows after the flip. Three green main runs is a small sample, and study-stop, gate-rm-workdir and parallel-runner each change what runs there with no Windows run on main yet.

Files the build touches: .github/workflows/ci.yml, packages/nana-pack/tests/ci-workflow.test.mjs, packages/nana-pack/tests/templates-render.test.mjs, packages/nana-pack/tests/requirements-tree.test.mjs, REQUIREMENTS.md, docs/requirements-tree.md, AGENTS.md, README.md, packages/nana-setup/README.md, packages/nana-setup/tests/hooks-win32-exec.test.mjs. The seat owns HANDOFF.md, docs/sessions/2026-10.md and docs/reviews/win-leg-flip-<date>/.

Every probe ran in a mktemp folder that I have since deleted. Nothing in the repo or any worktree was written.
