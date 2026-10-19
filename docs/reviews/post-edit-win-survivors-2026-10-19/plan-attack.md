# post-edit-win-survivors — plan attack (one adversary)

Verdict: AMEND

AMEND, with GO kept. I probed the amended design on a temp clone of main 22ccd849 (macOS, Node 22). The temp folder used a temp HOME and was deleted afterwards. Nothing was written to the repo, the worktrees, ~/.pi or ~/.claude.

Two changes to the plan:
1. Drop the planner's R-1820, the timeout row. Its text repeats R-787 ("the run shall settle ... with the checker gone"), and it is one case of R-1700 ("a post-edit check outlives its timeoutMs"). On Windows, taskkill /F does not use SIGTERM. So the row's Windows half catches nothing that R-1700's tree check does not already catch; the probe showed the same mutants fail both. The fix: (a)'s survivor check keeps its title "a: the checker is gone, not just abandoned", finds the checker by pid, and moves its marker from R-093 to R-787. R-787's evidence gains that test, and R-093 retires as superseded by R-787. The lane then adds one row, the abort row, numbered R-1820 (the planner called it R-1821; nothing is committed yet).
2. The plan left out docs/requirements-tree.md. The R-291 check in requirements-tree.test.mjs requires the committed outline to equal a fresh render. Adding a FEAT-030 row changes the FEAT-030 and CAP-07 lines, so the builder must run `npm run req:tree`. The mutation-runner-win-prune branch edits the same CAP-07 line, and every in-flight branch edits that file. After any merge of main, regenerate it; it is not a reason to wait.

Smaller fixes in the brief:
- The fixture must install its SIGTERM listener before it writes the pid file, so a pid seen alive is already ignoring SIGTERM.
- (c) aborts whether or not the tree was seen. With timeoutMs 0, a missed abort leaves the run pending until the watchdog.
- (c)'s settle clock starts at the abort.
- The survivor line must be recorded before the finally block's reap. In my draft it printed "none" after the reap.
- Drop the plan's "force survivors() to return empty" step. The new (a) and (c) no longer call survivors().

Probes on the amended draft (the timings below are from the clean draft):
- Hardening file: 22 PASS, 1 SKIP in three runs, about 12 s each, with no tree.cjs process left.
- Status file: 32 PASS, 1 SKIP.
- `node scripts/requirements-trace.mjs` exits 0 with `ears: 0`.
- `npm run map:check` and `npm run readme:check` pass after `npm run map`.
- The requirements-tree test passes after `npm run req:tree`.
- Mutant, never escalate: (a)'s gone check and (c)'s new check FAIL; the tree check stays PASS, so (a) and (b) are the only timeout checks that catch a missing escalation.
- Mutant, onAbort settles without killing: (c) FAILs.
- Mutant, group kill replaced by direct(): (c) and tree FAIL.
- Test-side mutant, abort before the tree is built: (c) FAILs.
- No check is red on main, because main's extension is correct. The Windows half stays the seat's scratch-branch run. The expected count there (13 PASS, 4 FAIL) is my tally, not a run.
- From the 2026-10-19 Windows log: (a) settled in 391 ms and (c) 74 ms after its abort. So under the mutant, cmd.exe has created the checker long before it dies. Run 39314443000's EBUSY in (a)'s cleanup points the same way.

Class: ordinary. The lane changes tests, rows, one README clause and two generated docs; the extension does not change (precedent post-edit-win-pin).

Files the build touches:
- packages/nana-pack/tests/post-edit-hardening.test.mjs
- packages/nana-pack/tests/post-edit-status.test.mjs (one marker)
- REQUIREMENTS.md (FEAT-030 lines 1638-1643)
- packages/nana-pack/README.md (line 778)
- docs/code-map.md (generated)
- docs/requirements-tree.md (generated)

Conflicts:
- No in-flight lane touches the post-edit tests, the extension, scripts/test.mjs or FEAT-030's rows.
- REQUIREMENTS.md, packages/nana-pack/README.md, docs/code-map.md and docs/requirements-tree.md are shared with every in-flight branch, but at other lines. The CAP-07 summary line of requirements-tree.md is the exception: mutation-runner-win-prune edits it too. Regenerate the two generated docs after merging main.
- pwsh-lexer-oracle and pi-seat-live-turn do not overlap.
- trust-finds-pi and pi-settings-bom were not probed.

Seat follow-up: the HANDOFF residual line from post-edit-win-pin says three checks were vacuous on Windows; there were two. The seat closes or corrects that line, since the builder never edits HANDOFF.

The claim most likely wrong: that (a)'s pid check FAILs by name in the Windows mutant run (taskkill /F /PID without /T). It assumes cmd.exe has created the checker before the kill at about 390 ms. The EBUSY above supports that, but it is inferred, not observed as a named FAIL. If (a) passes there, add the tree check's built-alive guard to (a) with timeoutMs TREE_DEADLINE_MS.
