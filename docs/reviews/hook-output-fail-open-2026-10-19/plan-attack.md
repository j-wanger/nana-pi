# hook-output-fail-open — plan attack (one adversary)

Verdict: AMEND

AMEND. The design, the test shape and the ladder hold. I probed every claim in a temp clone of d4423eff with a temp home. I changed two things: the row wording and the test file name. I also added known limits that the probes found.

What I probed:
- Red today holds. I wrote a draft of the test file as the brief specifies. On main's hooks it gave FAIL for R-1940, R-1941, R-1942 and R-1944 in 3 of 3 runs, each with exit 1 and an unhandled 'error' event. R-1943 passed. With the one-line listener, all five passed in 5 of 5 runs, in 0.72 s.
- The rest of the fixed tree is green. The four sibling files pass whole: hook-producers 10, shared-memory-hook 43, roster-notice-hook 4, verifier-pipe 29. With the rows flipped to implemented, the trace showed 0 rows off EARS form, the tree test passed and map:check reported 0 problems.
- The wrong codes behave as the plan says. Removing the roster hook's process.exit(0) turns R-1943 red. Dropping the journal directory turns R-1941 red through the open-run precondition. A listener that calls process.exit(1) turns R-1940 red. A listener that rethrows every error except EPIPE survives on macOS. I added that one to the brief as report-only and to the known limits.
- The R-1943 pin holds on every platform. Its error event is queued as a nextTick, and the top-level await continuation that calls process.exit(0) runs first. That ordering does not depend on the platform.
- The knowledge hook's exclusion is sound. It ends through process.exit in the same way (read, not probed with output). knowledge-unreadable-root edits its CLI.
- The 0.5 s figure checks out. In the pi-seat-live-turn Windows install-check log, the hook set started at 23:59:48.131 and the adoption hook passed at 48.625.
- A builder's environment cannot empty a hook's output. No producer reads NANA_ROLE. Each hook's open-run output also survives a failed producer, because the launcher prints its marker instead.

Subtraction test: the design passes. One listener in each of four entries beats a shared helper. A trailing process.exit(0) would also work, but it can cut short async pipe writes on macOS. Five rows for five tests is correct, because one looped row would be wider than its test unless it listed the hooks.

Lane class: hook lane is correct. Four Claude Code hook entries change.

Amendments:
1. Rows and sentence now say "IF the reader of the X hook's output closes it…", not "IF Claude Code closes…". Nobody has seen Claude Code do this, and the test's reader is a plain parent process. The rows should not record that guess as fact. The new wording passed the trace's EARS check: 0 rows off form.
2. The test file is renamed to hooks-closed-output.test.mjs. The verifier is a PreToolUse hook, not a session hook.
3. The brief now spawns each hook with the project folder as its working directory, prints the exit codes on FAIL, keeps the README out of scope, and lists the EPIPE-only survivor as report-only.
4. New known limits: the "ignore every error" choice is unpinned, and a closed stderr is not covered (the verifier writes diagnostics there).

Value note: the lane's user value is modest. The only concrete early reader is a person piping a hook into head; a harness that abandons a hook rarely reads its exit code. Still, the code change is four lines, and it makes the hooks' written promise to exit successfully true. Worth building.

Conflicts, probed rather than inferred: I trial-merged the planned REQUIREMENTS.md edit with each in-flight branch: readme-windows-checklist, win-hook-settings-repair, win-watchdog-cpu-read, win-claude-skills and knowledge-unreadable-root. Every merge was clean. The only conflict seen was docs/requirements-tree.md against readme-windows-checklist, and it lies between that branch's older base and main, not this lane. No in-flight lane touches packages/nana-setup/claude/hooks/. The generated tree and map get regenerated after a merge of main. No build needs to wait.

Files the build touches:
- packages/nana-setup/claude/hooks/nana-objective.mjs
- packages/nana-setup/claude/hooks/nana-adoption.mjs
- packages/nana-setup/claude/hooks/nana-shared-memory.mjs
- packages/nana-setup/claude/hooks/verifier-pipe.mjs
- packages/nana-setup/tests/hooks-closed-output.test.mjs (new)
- REQUIREMENTS.md
- docs/requirements-tree.md (generated)
- docs/code-map.md (generated)

The one claim most likely wrong is that the Windows leg goes red on today's code. My inference, from libuv's error table and not probed: a blocking write to a pipe whose parent end has closed fails with ERROR_NO_DATA, which libuv maps to EPIPE. So today's code should exit 1 there and the listener should fix it. If Windows reports nothing, the checks pass vacuously on that leg. A false red after the fix is unlikely, because every open-run precondition holds through a fallback marker. Only the lane's CI run and scratch-CI wrong-code pairs settle it.

Housekeeping: my raw probe made 11 temp homes in the system temp root rather than in the plan folder. I removed exactly those, matched by their layout. The probe folder is removed too, and the real repo is clean at d4423eff.
