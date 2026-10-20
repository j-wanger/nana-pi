# notify-lifecycle-pins — plan attack (one adversary)

Verdict: AMEND

AMEND. I probed every check and wrong-code variant in a temp clone of main 31b95f34. project-check-quiet has landed since the plan named 445f4d5b. The plan's split of R-162, its rows, its class and its conflict read all hold. Three gaps let realistic wrong code pass, so I added three cases and kept everything else.

Verified as the plan says:
- pi 1.0.2's types give all three compaction events a reason, and nana-lifecycle journals none of them; the probe read undefined on all three lines. Splitting R-162 is the honest call for a tests-only lane.
- Each of W1–W15 turned its named check red, and each existing-suite result matched the plan. W12 and W15 are red in notify-fallback by exit code only.
- With the six rows applied, every rail was green: trace exit 0 with 0 rows off EARS form, tree and map regenerate and check 0, readme 0, and requirements-moved lists the six FEAT-023 rows. The rows, trace, tree, unclaimed, line-endings and code-map tests all pass, as do notify-fallback and lifecycle-reload.

Amendments, each probed:
1. The RPC path (the desk) was unpinned. W16 keys the headless guard on `ctx.mode !== "tui"` instead of hasUI. That silently drops OS notices for desk sessions, and it passed all four of the plan's notify checks. The macOS and Windows R-166 checks now run with both a tui and an rpc context, and W16 turns both red.
2. The no-UI fixture used `ui: undefined`. In print and json mode pi 1.0.2 binds a no-op UI object, not undefined (runner setUIContext). W17 guards on `!ctx.ui` and passed the plan's tests. With the faithful fixture, W17 turns R-173 red.
3. R-166's own evidence names three call sites: osascript, the toast and OSC 777. The plan pinned two. W18 removes the Linux OSC branch and was red only by exit code in notify-fallback, which shows no FAIL line. A third R-166 check now covers the Linux TUI.
4. R-173's "empty journal" assertion is narrowed to "no notify_fallback line", so a harmless config note cannot make it fail.
5. The base is now main 31b95f34. The brief now tells the builder to keep its mktemp path in a variable. A sibling slate agent wrote mutation-runner wrong code (Math.random in publishWorktreeLock, edits to mutation-runner.test.mjs) into this adversary's temp clone. Its probes ran in a folder it did not own. The seat should check the mutation-runner-lock-overlap plan's red/green claims.

Lane class: ordinary. The lane adds tests only and changes no extension, install, hook, gate or land/review code.

Conflicts:
- No in-flight branch or slate lane touches nana-notify.ts, nana-lifecycle.ts, lib/config.ts, notify-fallback, lifecycle-reload or the two new files.
- No REQUIREMENTS.md hunk from any in-flight branch sits near FEAT-023, at lines 1418–1445.
- The only shared files are REQUIREMENTS.md, docs/requirements-tree.md and docs/code-map.md. Merge main and regenerate the tree and map before the final review.
- post-edit-timeout-name may edit lib/config.ts. W13 touches only a temp copy.

Every check runs on all three CI legs: lib/config.ts reads no process.platform, and notify-fallback already fakes the platform on the Windows leg. No req-candidate marker is needed.

The claim most likely wrong: that the execFile stub and the faked platform pass unchanged on the Windows CI leg. I checked this on macOS only. Two things point the right way: the syncBuiltinESMExports pattern from three nana-setup tests, and notify-fallback's faked platform on Windows. If the stub misses there, the call count reads 0 and the check goes red visibly; it cannot pass silently. The seat must see both new files PASS in the Windows leg log.

Probe copies of both test files and the mutation script are in <tmp> together with the drafts must-meet.md and build-brief-1.md.
