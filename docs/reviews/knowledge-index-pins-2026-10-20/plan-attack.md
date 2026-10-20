# knowledge-index-pins — plan attack (one adversary)

Verdict: AMEND

I probed every claim in a temp clone of main 6f07daee on macOS, with a temp HOME. I made no edits to the repo or any worktree.

1. Subtraction: the plan's two new build-level checks in ledger-parse add nothing. Its stated reason was that a build ignoring the ledger kind leaves every parse check green. That is true only of ledger-parse. The same wrong code (rowsFor always calls parseArticle) turns 8 existing checks red in incremental-build.test.mjs, because that file already builds a ledger root. Those 8 include "first build rows = 2 articles + 2 ledger entries" and "per-root counts". Every other planned R-204/R-882 wrong code also turns an existing ledger-parse check red:
   - removing the fence toggle fails "fenced template lines are not rows"
   - dropping digit entries fails "numbered entry line is a row"
   - not folding continuations fails "3-physical-line entry folds into one row"
   - not requiring [uses: fails "bullet without [uses:] is not a row"
   So R-204 and R-882 become markers only. That removes the ledger-parse header change, the new build and db imports, and the docs/code-map.md change. With the eight rows flipped, map:check passes without regenerating the map. The lane no longer touches the code map, which every other lane edits.

2. The three new incremental-build checks are confirmed (the probe added them).
   - R-235: SKIP_DIRS without ".git" fails it, and so does SKIP_DIRS without "raw". No other check in the four files goes red.
   - R-203: a walk that follows links via fs.statSync(p) fails it. Deleting only the link-skip line stays green, as the plan said.
   - R-236: turning the fast path off fails only the new check. The existing "second no-op build" check stays green.

3. Marker targets are confirmed.
   - R-211/R-884: "only a .git folder counts" fails the WORKTREE check. "Only a .git file counts" fails the DIR check. Dropping discovered:true or using kind "ledger" fails "articles, and marked". A break after the first subdir fails the DIR check.
   - R-232: "w" instead of "wx" fails exactly-one and fail-fast. No pid in the lock fails owning-pid. Release removing any lock fails the ANOTHER-pid check. build() skipping the acquire step fails fail-fast.

4. Final probe state: all eight rows flipped with backticked cites. The trace rail, tree check, map:check and readme:check all exit 0. requirements-moved reports no tree movement. incremental-build (30), ledger-parse (21), discovery (37) and hook each pass on their own.

5. New residual: a fast path keyed on size alone, ignoring mtime, passes the whole incremental-build file. R-206's content-change check uses an edit of a different length. This is a gap in R-206's evidence, not in this lane's rows; the seat records it.

6. Main moved to 1c539a0e when win-config-json-path landed. That land touched no packages/nana-knowledge file. hook-deadlines, pi-probe-timeout and install-check-turn-edit-powershell touch no knowledge file (diff checked). The only shared file is REQUIREMENTS.md, where this lane edits different rows.

7. The builder preamble says "edit an existing test only where your change makes it false". So the brief adds no fence to the existing ledger fixture; it adds markers only. The class stays ordinary.

The claim most likely wrong: that the R-203 check passes on the Windows CI leg. It rests on libuv's Windows directory listing marking a reparse point (a junction) as a link before it tests for a folder. I know this from the source, not from a run. If it is wrong, the walker follows junctions on Windows today. That is a real bug: the fix goes in lib/build.ts and the lane becomes a hook lane.
