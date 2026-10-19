# review-ledger-run-reviewer — plan attack (one adversary)

Verdict: AMEND

AMEND. The design, lane class, threat model and wait are sound. The probes confirm them. Seven fixes follow.

Probes run on a temp clone of main 713d6aa with a temp HOME. A stray /tmp backup file was removed and the temp folder deleted afterwards.
(1) Today's CLI: the child saw `role=worker handoff=on` under a caller's NANA_ROLE=worker, and `role=undefined` with none. `review-ledger run -- pi` with a stub pi and a multi-line argument recorded round 1.
(2) Prototype (12 lines in worker-config.mjs and review-ledger.mjs): the child saw `role=reviewer handoff=off`.
(3) review-ledger.test.mjs with the two new checks: on today's code, 160 PASS plus R-1720 FAIL (exit 1) and R-1721 PASS. On the prototype: 161 PASS, exit 0.
(4) Wrong code: (a) reversed spread gave role=worker, so R-1720 goes red. (b) Setting only NANA_ROLE gave handoff=on, so R-1720 goes red. (c) An env without process.env gave `no verdict (exit ENOENT)` for `-- pi`, so R-1721 goes red. (d) Forcing platform win32 gave `pi launch refused: pi is not on PATH`, exit 1, and no ledger folder was created, so R-1721 goes red and refusing before admission leaves nothing behind.

Amendments:
1. R-1721's row was wider than its test. It named the mechanism on each platform, but the test checks only that a round is recorded. The row is narrowed to "start the pi that PATH resolves and record its review-shaped output as a round". R-1722 pins the Windows mechanism. On Windows, R-1721 still separates the fix from cmd.exe, because the file's win32 fake pi.cmd is a placeholder that prints nothing.
2. R-1723's test checked only the `pi launch refused` prefix, while the row promises the reason. The test now matches the reason (`pi at … is not an npm global install`). It compares the reservations listing before and after the run instead of asserting "no file".
3. Row status was left vague. The trace rail (requirements-trace.ts) counts a `planned`, `untested` or `violated` row that a marker traces as a mismatch. So all four rows flip to implemented in commit 2. The Windows-only rows say "Windows leg only". The seat confirms them on Windows CI run 2 before the final review. Commit 1's trace mismatch is expected.
4. The contract is now declared where its users read it. The pack README's "Non-writer role" bullet and the knowledge README's "Launcher roles get nothing" line named only pi-review. Both now name review-ledger run too. This closes the session-archive residual "the pack README's NANA_HANDOFF line names pi-review only".
5. Done adds handoff-writer-role.test.mjs (R-139), because pi-review's childEnv changes. The review-ledger count is phrased as "no FAIL", because unread-verdict-loud changes the total.
6. The conflict detail is corrected. unread-verdict-loud rewrites the same "Any other launcher" README sentence (line 182) and the review-ledger.mjs @errors lines this lane edits. Its committed branch b42b541 shows both. The textual conflict is certain, so the wait is mandatory.
7. The `claude -p` known limit is reworded. The pull is off there only if Claude Code hands its environment to its hooks. That comes from its hooks documentation and was not probed.

Subtraction test: the Windows `pi` branch has no current user, because Windows pi reviews go through pi-review. It stays because it reuses piLaunch in about four lines. It closes a recorded HANDOFF residual on the same spawn line. The owner's 10-17 priority is the Windows fixes, and that list names the maintainer tools.

Files the build touches: packages/nana-pack/bin/review-ledger.mjs, bin/worker-config.mjs, bin/pi-review.mjs, tests/review-ledger.test.mjs, tests/win32-launch.test.mjs, packages/nana-pack/README.md, packages/nana-knowledge/README.md, REQUIREMENTS.md, docs/requirements-tree.md, docs/code-map.md. It also touches packages/nana-pack/tests/requirements-tree.test.mjs only while the R-291 leaf literal is on main; leaf-total-drop removes it.

Conflicts:
- unread-verdict-loud: must land first.
- win-review-stubs (this slate, plan not seen): if it edits review-ledger.test.mjs's stub block or win32-launch.test.mjs's Windows section, build after it lands.
- knowledge-refresh-pin (this slate): if it edits the nana-knowledge README, the one-line edit merges by hand.
- readme-install, review-timeline and win-leg-flip: README hunks sit near line 196 but do not overlap.
- win-leg-flip: if it makes the Windows leg blocking first, nothing changes, because R-1721 to R-1723 must pass on Windows CI anyway.
- Regenerate code-map.md and requirements-tree.md on any merge.

Claim most likely wrong: that R-1721 to R-1723 fail on the Windows leg today and pass after the fix. This is inferred from Node's documented .com/.exe-only search by name and the HANDOFF residual. The Windows assertions are written blind on macOS and first run on Windows CI. Second weakest: a Windows seat's claude is the native claude.exe (inferred).
