# Adversary verdict — gate-rm-workdir (2026-10-19)

Verdict: AMEND

AMEND. The lane is worth building and the class (gate) is right. One hole in step 6 needs fixing first. I probed in temp clones (<tmp>/plan.mvwKts, with the planner's prototype 268ea17 merged with main 355520d). No repository was written.

What holds:
- R-1490 is red today. With main's nana-gate.ts, all 8 forms BLOCK headless.
- Every guard row is green today, as the plan says.
- On the prototype: gate-corpus 227, gate-survives-mutation 38, display-surfaces 181, gate-status 23 and config-gate-fallback 38 all PASS, including after merging main 355520d.
- pi 1.0.2 runs each bash call as a fresh `bash -c` in ctx.cwd. A `cd` in an earlier call cannot move a later rm.
- Changing a corpus title is safe: R-035 and R-039 cite the title template, not the expanded text.
- Today `rm -f ../x`, `rm -f /etc/hosts`, `rm ../../x` and `rm *.log` are all allowed.

Hole found (honest variation in letter case and config, inside the threat model). The prototype's step 6 only rejects a target that holds the agent folder. Its compare is also case-sensitive on macOS. With PI_CODING_AGENT_DIR=<cwd>/agentdir, these all run unasked on the prototype:
- `rm -rf AgentDir` and `rm -rf AGENTDIR/` delete the whole agent folder (APFS ignores case).
- `rm -rf agentdir/extensions` and `rm -rf agentdir/sessions` run. The floor names files, so `extensions/` without a trailing slash and `sessions/` are not floor.
- With cwd = the relocated agent folder, `rm -rf extensions`, `sessions` and `x` run.

Today every one of these asks. The fix:
- Spell paths with the repo's existing `realPath` from `lib/real-path.mjs`. Native realpath folds case on macOS (probed: AgentDir -> agentdir). This also removes a duplicate local realpath helper.
- Reject when the two folders overlap in either direction.
- Test containment with a helper that checks `..` plus a separator. The prototype's `startsWith("..")` is wrong.

With the amended module, the 8 new R-1492 cases pass and the prototype's draft test still passes. Wrong code (g), (j), (k), (l), (m) and (n) each turned the named check red. (n) shows only on a case-folding filesystem, and `path.win32.relative` already folds case, so it is pinned on macOS.

Rows: only R-1492 changes ("same folder or one lies inside the other"). Its title and test cases change to match.

Known limits added from probes:
- A bare repository as the cwd (`repo.git`) lets `rm -rf objects refs` through.
- A target that holds a floored file deeper inside goes unchecked (for example an extension source linked from the agent folder, or a nested `.claude`).

The one-row subtraction test passes: every remaining step has a wrong-code pair that turns a check red.

Scope: plain `rm` and `rm -f` outside the working directory still pass. Jake's confirmed words are "we really shouldn't be deleting anything outside without user permission/confirming". That tightening is a separate lane with a large blast radius: headless builders' temp cleanup would be blocked. It stays out of this lane. The seat must record it as one Open-for-Jake HANDOFF line inside this lane's reviewed change.

Conflicts: main moved to 355520d after the snapshot (readme-check-cp1252 landed). The gate code is unchanged.
- win-gate-tmp's current tip 5f4dcef merges into the amended prototype with no conflict in nana-gate.ts or the pack README. Its hunks are real(), realOut, laneWriteHit and the gate-paths import line.
- The README hunks of rulings-file, clean-revision and watchdog-exit sit far from the gate bullet (line ~562).
- Every lane that adds rows conflicts mechanically on REQUIREMENTS.md, docs/requirements-tree.md, docs/code-map.md and the R-291 leaf total. Regenerate the tree and map, and add the counts.
- Once win-leg-blocking makes the Windows CI leg blocking, the new test must pass on Windows.
- No build has to wait.

Files touched:
- packages/nana-pack/lib/gate-rm-inside.ts (new; imports lib/real-path.mjs and lib/gate-paths.ts, both unchanged)
- packages/nana-pack/extensions/nana-gate.ts
- packages/nana-pack/tests/gate-rm-inside.test.mjs (new)
- packages/nana-pack/tests/gate-corpus.test.mjs, gate-survives-mutation.test.mjs, display-surfaces.test.mjs and requirements-tree.test.mjs
- packages/nana-pack/README.md and REQUIREMENTS.md
- docs/requirements-tree.md and docs/code-map.md (generated)
- docs/reviews/gate-rm-workdir-2026-10-19/ (seat)

Claim most likely wrong: on Windows, Node's lstat reports a junction as a symbolic link, so R-1493's junction cases block. This is inferred from libuv and not probed; Windows CI on the fix commit decides it. Next most likely: Git Bash `rm -r` does not follow an inner junction (limit 4, inferred).
