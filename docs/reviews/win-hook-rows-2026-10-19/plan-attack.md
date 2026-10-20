# win-hook-rows — plan attack (one adversary)

Verdict: AMEND

GO with amendments. The lane is worth building: on Windows, install and doctor tell the reader five times that the hooks are skipped, right above the six settings rows that show the same hooks are wired and ✓. I probed in a temp clone of main c827fcf8 with a temp HOME and forced win32. Both proposed checks, run as a probe script, are red today: install shows 5 hits and doctor shows 5. Both are green on a prototype of the plan's design. In win32-degrade, the prototype fails only the 8 old skip-row checks. stale-copies, install, doctor-quiet, retired-artifacts, hook-producers, doctor-detail, doctor-runtime and rulings-install all exit 0. hooks-win32-exec and skills-and-standards fail the same way on main and on the prototype in my sandbox, because the sandbox has no project trust and runs posix exec. I confirmed three wrong-code pairs by mutation.

Amendments:
(1) Narrower rows. "label names the objective … hook script" also covers "settings SessionStart objective" and "node for the objective hook". The tests only check script file names, so the rows now say "label contains the file name of".
(2) One feature. Both rows go in SUB-015 under FEAT-013, after R-1051. R-1615, a win32 doctor row, already sits there as precedent. The lane's Feature line becomes FEAT-013, and the lane stays one feature.
(3) R-349 is narrowed in this lane instead of left as a known limit. Read literally, untested R-349 contradicts R-1860, because the hook-file link step is posix-only and would report nothing.
(4) A vacuity guard. The same label parse must find all six `settings …` labels, so a change in the output format cannot make either check pass with zero labels.
(5) A portable script list. The plan picked scripts by comparing paths under claude/hooks. On native Windows that breaks, because desiredHooks builds args[0] as `${repoRoot}/packages/...` with mixed separators. The brief now uses fs.existsSync on packages/nana-setup/claude/hooks/<spec.script> instead.
(6) One wrong-code pair corrected by probe. When hookLinkRows returns [] on every platform, stale-copies R-1761, R-1762 and R-1763 go red, not R-1760, and install.test R-341 goes red too.
(7) A missed conflict. pi-seat-live-turn also edits packages/nana-setup/README.md, at lines 417 and 421. This lane edits lines 389 and 457, so the hunks do not overlap.
(8) The README test-table cell for win32-degrade gets updated.
(9) The HOOKS import in win32-degrade becomes unused and is dropped.
(10) The DOCTOR_NOTES prune stays, for a stated reason: it makes the Windows install-check leg a native guard against any returning hook-file note row, including a relabelled one.
(11) The builder becomes a Claude Sonnet subagent: about 12 changed code lines and two tests is a simple lane.

The lane class is right: install, hook or gate. The change touches install and doctor and bin/stale-copies.mjs, which the adoption hook runs. Nothing writes outside the lane worktree or a temp folder.
