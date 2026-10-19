# post-edit-win-pin — plan attack (one adversary)

Verdict: AMEND

AMEND, not DROP. The lane is worth building. Its main tests pin today's code. The Windows half is the new evidence, and win-leg-flip will make that leg blocking. I probed on a temp clone of main 713d6aa (macOS, Node 22.22.2, temp HOME and TMPDIR). The real repo was not touched.

The plan has five faults:

1. R-1700's wording is false on POSIX, and its row is wider than its test. On macOS, sh execs a simple checker command, so the command's node runs under the shell's own pid. Probed: level 2's ppid was the test process. So "the shell's child and grandchild" describes only Windows, where cmd.exe never execs. The row also says "every process in the check's tree", which contradicts R-094's detached-descendant residual. Both are now narrowed to what the test observes: the process the check's command started, and that process's still-running child. The checker is `"<process.execPath>"`, not bare `node`, because a shim would add a level and break R-1701's ppid.

2. R-1701's wrong-code claim is wrong. Probed: Node emits `close` with a negative code after a spawn ENOENT, as well as `error`. If only the error handler becomes a no-op, the close handler still kills the shell, and R-1701 PASSES. The seat's combined mutant (no /T, both fallbacks no-ops) is still sound. The table and the brief now say so.

3. R-1700's macOS wrong-code result was misreported. The plan said "both alive". The real result after a 4522 ms forced settle was: the command's process gone, its child alive. It still FAILs.

4. Subtraction for R-1702: a 1 s checker adds nothing over the recorder. With the existing 100 ms SLOW_PASS_CMD, all three mutants fail the same way (probed: `||` gives [30000]; `>= 0` gives [0,2000] and a timeout chip; the dropped timedOut guard gives a timeout chip). The control (records exactly [300]) and the case form one check, which makes it non-vacuous. The title loses "one-second".

5. Status honesty: the README sentence now says that with taskkill off PATH, the check's own processes keep running.

Supporting points:
- R-107's retire note no longer says "split out". The split rule would keep R-107's ID. It is now "superseded by R-1700", and R-1701 is new.
- Known limits gain one: a dead process its parent has not reaped reads alive. This is a false red only.
- The plan's job-object reasoning is corrected. libuv sets silent breakaway, so cmd.exe's children are not in the test's kill-on-close job. The no-/T mutant should leave level A running even after the test exits. FIXTURE_EXIT_MS self-exit and reaping by pid cover that leak.

Probed and confirmed:
- Today's counts: hardening 21 PASS; status 30 PASS, 1 SKIP.
- Windows CI logs: 15, and 31 plus 1 SKIP.
- R-1700 tree built in 65–84 ms and settled in about 2.5 s, with both processes gone.
- R-1702 on today's code: control [300], case [].
- R-1703 returns undefined; the "append on printed pass" mutant FAILs.

Rows: keeping the plan's supersede of R-097 and R-243 follows the brief's ID-block rule, with R-936 to R-1050 as precedent. Flipping them in place, as R-923 was, would be simpler. Their text already matches the tests.

Lane class: ordinary. The extension is unchanged, matching the win-pi-gate precedent.

Conflicts (none blocks):
- REQUIREMENTS.md, docs/requirements-tree.md and the R-291 leaf literal are touched by about 14 in-flight branches. Re-run req:tree after a merge. Skip the leaf bump if leaf-total-drop lands first.
- packages/nana-pack/README.md: seven in-flight lanes edit it, but none near the post-edit note at lines 751–752.
- silent-main-guard's change to tmp-dir.mjs only adds tmpDirUnmanaged.
- No in-flight branch touches nana-post-edit.ts, either post-edit test, or a FEAT-030 row. bom-pack-config's R-1583 is a project-check row.
- parallel-runner makes local full runs use four jobs. This file is not on its run-alone list. R-1700's 2500 ms deadline has a margin of about 6x, so I did not add it.
- After win-leg-flip lands, a slow Windows tree would block main.

The claim most likely wrong is inferred from libuv source, not probed on Windows. It is that the no-/T mutant leaves level A running. Silent breakaway keeps cmd.exe's child out of the test's job, so killing cmd.exe alone should not end it. If this is wrong, R-1700 passes on Windows against that mutant. The seat's mutant CI run settles it.
