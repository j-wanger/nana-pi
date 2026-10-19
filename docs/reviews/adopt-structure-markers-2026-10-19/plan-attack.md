# adopt-structure-markers — plan attack (one adversary)

Verdict: AMEND

AMEND. The lane is worth building and the class is right. I made two real fixes to R-1782 and one prose guard.

1. R-1782 could not fail the way the plan's own design does. The plan's fixture (agentsStub) ends at the end marker, so a slice from the begin line to the end of the file passes. That is exactly the slice the plan recommends. Any section the template render puts after the region would then be printed and pasted into the project. Honest template drift is in the threat model. In the amended version the fixture adds a trailing section, the command slices through the end-marker line, and the row says "only". Probed: the plan's version of the command goes red on the amended test.

2. The plan's rule "no `!` other than `!=`" had no test. R-1782 runs the JS straight through node, which skips the shell. Probed: interactive bash reading `"x<!--y"` fails with `event not found`, while `"a!==b"` is fine. The amended R-1782 now requires the JS outside the readFileSync argument to carry none of `$`, backtick, `%`, `"`, a `!` not before `=`, or a backslash not before `n`. That covers bash/zsh history, PowerShell `$` and backtick, cmd `%`, and the `\\` that bash and PowerShell read differently. Only then is running the JS straight through node a fair stand-in for every shell. Probed: a `'<!--'` needle and a `\\n` both turn it red.

3. The check ignores markers inside a code fence (markerLines tracks fences). An agent that copies the ```markdown fence along with its lines would read `!`. The prose now says to write the lines inside the fence, not the fence, and this is listed as a known limit.

Minor changes: the R-1780 project needs no git init, and test text is normalised from CRLF to LF.

Probes, all in a temp clone of main 22ccd849 with a temp HOME:
- All three amended tests FAIL on today's skill and PASS with a candidate step-4 edit.
- Every wrong-code case in the brief went red.
- The candidate bash line printed bytes identical to the expected block under bash -c, bash -i -c, zsh -c and zsh -i -c.
- The extracted-claims diff shows only the `node -e` line changed, and skill-claims leaves that line unjudged. skill-claims.test.mjs and entry-guidance pass.
- The R-591, R-929 and R-592 pins were evaluated directly and pass. project.test.mjs itself stopped earlier, at its pi trust-store import on line 237. That module imports fine on its own, so this is a probe-environment issue and not the lane.
- The trace reads `ears: 0 rows off form` with the three rows added.
- The skill-copy history JSON is a frozen list and no test pins it, so there is nothing to regenerate there.

Class: ordinary. The lane changes skill text, one test file, the ledger and the generated maps. It touches no install, hook, gate, land or review tool.

Conflicts: none on source files. No worktree (pwsh-lexer-oracle, review-ledger-run-reviewer, win-path-commands and the two seatmut worktrees) touches the adopt-structure skill, entry-guidance.test.mjs, project.test.mjs, project.mjs or skill-claims. REQUIREMENTS.md, docs/requirements-tree.md and docs/code-map.md will clash as text at merge with every lane. Fix that by re-running `npm run req:tree` and `npm run map` after the merge. The sibling slate lanes have no worktrees yet. From their names I infer they don't touch these files. The tests read the shared file live, so a lane that edits it does not break them.

Files the build touches: packages/nana-pack/skills/adopt-structure/SKILL.md, packages/nana-setup/tests/entry-guidance.test.mjs, REQUIREMENTS.md, docs/requirements-tree.md, docs/code-map.md.

Claim most likely wrong: that the PowerShell and cmd fallback lines print the same block. No PowerShell is installed here. That claim rests on the character assertion plus the absence of any `$`, backtick, `%` or `"`. Close behind it is the planner's point: an agent may not be able to tell where an older unmarked copy ends. The September shared file carried `### Navigation`, `### Config` and `### The desk`, which later moved to project sections. R-1781 pins only the wording.

The planner disclosed one `git pull -q` in the real main checkout; it only wrote .git/FETCH_HEAD. I made no writes outside the temp folder, which I have deleted. The real repo status is clean.
