# claude-config-dir — plan attack (one adversary)

Verdict: AMEND

AMEND. The lane is worth building, and its core design held up under probes. Four changes follow.

What I probed (clone of 72abe19a in a temp folder, temp HOME with made-up names, no processes left, folders removed):
- On today's code, install with an absolute CLAUDE_CONFIG_DIR left that folder empty and wrote every piece under <home>/.claude. The banner read `claude home ~/.claude`.
- Today, a relative value gives exit 0. An empty value and --claude-home both behave as the guards expect.
- Today, doctor with the variable set prints `✓ rule nana-soul.md` and `✓ shared memory index` against <home>/.claude.
- Today, the hook prints 0 bytes.
- I applied a 15-line prototype of the plan. Every behaviour then passed, paths.test passed, and relative-agent-dir passed 31/31.
- Hazard confirmed: I ran relative-agent-dir directly with CLAUDE_CONFIG_DIR set to a scratch folder. It wrote hooks, rules, settings.json, skills and nana-memory into that folder.
- The Claude Code 2.1.299 bundle keeps CLAUDE_CONFIG_DIR in the env it passes to hook children and to its own sandboxed tool children. That makes the runner scrub and the three direct-run test edits necessary, not optional.

The four changes:
1. Dropped R-2395, the hook end-to-end check, so that ID is unused. R-2390 pins MEMORY.md at the exact path that R-386 pins the hook reading. No wrong code turns R-2395 red on its own. It also overlapped the slate lane shared-memory-index-cap, which edits that hook.
2. Added R-2398. The plan added refuseCwdRelativeClaudeHome to doctor's install prediction with no test, so deleting that line survived every check in an install lane. It is needed so R-1994's summary is not a lie. Without it, doctor says "run: nana-setup install" and install then refuses. Probe: today the summary reads "34 missing — fix by hand …; then run: nana-setup install for the other 33". With the prototype it names the CLAUDE_CONFIG_DIR refusal. The lane stays at 8 rows.
3. Narrowed two rows to what their tests check.
   - R-2391 now covers only the rule and shared-memory index rows.
   - R-2391's exit-1 assertion was vacuous: doctor exits 1 today anyway, on the unseeded pi-subagents ✗. It is replaced by a control run without the variable.
   - R-2390's hook-link clause now says "off win32".
4. R-2394 puts the folder outside HOME, so the banner prints the path verbatim and the test needs no tildeify.

Lane class is right: install, hook or gate.

Conflicts with in-flight lanes:
- win-copy-backup-noise edits the paths.mjs @outputs line next to this lane's line and adds copyRecord after claudeSettings. Put the new fields right after claudeHome. Expect a trivial header conflict.
- objective-path-shapes edits the paths.mjs import block and the piObjective line. No shared lines.
- linked-claude-folder-remedy, win-pi-launch-orphan, doctor-path-row-remedy and objective-path-shapes all touch packages/nana-setup/README.md.
- None of them touch bin/nana-setup.mjs, scripts/test.mjs, test-runner.test.mjs or the three test files. I checked every worktree's diff against main.
- Every lane collides on REQUIREMENTS.md, docs/code-map.md and docs/requirements-tree.md. Regenerate after the merge.

Slate overlaps (inferred from lane names; I read no slate plan):
- project-odd-seeds may edit runProject in bin/nana-setup.mjs, a different function.
- shared-memory-index-cap no longer overlaps except on the README.

Land order: no hard order. Merge main after objective-path-shapes and win-copy-backup-noise land, then re-run the lane's single files before the final review.

Seat hazard: the wrong-code table needs no pi launch. Never spell one as spawn("pi" in docs/reviews.

Claim most likely wrong: that R-2391's control run reads ✓ for both `rule nana-soul.md` and `shared memory index` on the Windows leg after a temp-home install. Doctor compares the copied rule by content there, but I did not run it on Windows. A runner-up: the claim that only three test files need the direct-run CLAUDE_CONFIG_DIR delete. That comes from a static grep of every nana-setup CLI spawn, not from running each file under the sentinel.

Unverified on Claude Code itself: whether it treats an empty value as unset. Its bundle mixes `||` and `??` reads, so R-2397 is pinned to the hook's `||`.
