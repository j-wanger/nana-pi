# install-pins — plan attack (one adversary)

Verdict: AMEND

AMEND. I probed every claim in a temp clone of main f0d6da24 (macOS, Node 22.22.2, temp HOME), and the real repo and worktrees are unchanged. Three changes:

1. R-346 control redesigned. The plan's control ran doctor with no flags, so the home counts as real (isRealHome true). That makes three rows hard gates: pi executable, PATH resolves pi-review, and pi packages. To keep them green the plan needed package registration plus a PATH prefix. On Windows a PATH prefix needs both Path and PATH plus PATHEXT; the landed R-1616 test in win-shims.test.mjs sets all three. I ran the plan's design with NANA_SETUP_PLATFORM=win32 and it read 2 ✗ (pi executable, PATH resolves pi-review), so "all good" never appears. Passing --claude-home <H>/.claude to both doctor runs turns those three rows into notes on every platform. PI_CODING_AGENT_DIR stays ambient, and the cwd-relative warning still fires because it ignores --claude-home. No registration and no PATH edit are needed. This design is green on macOS and under forced win32. W10, W11, W11b (summary says all good despite !) and W12 each turn it red. W11 and W11b turn only R-346 red, which confirms the old untagged checks cannot catch them.

2. R-382 has the same "a regular directory" flaw as R-304 and R-381. On win32, install backs up a stale copy's file inside the skills directory. The plan retired two of the three sibling rows and left this one. I retired R-382 as superseded by R-1870 and added the clause to R-1870 with a no-.bak- check. Wrong version W7d copies a backup beside an untouched owner folder. It turns R-1870 red only because of that new check. Without it, nothing catches W7d.

3. The brief now forbids helper checks. My first draft added a separate "install exits 0" check, which moved install's count to 107. The control folds into the R-922 check, so the expected count is 106.

Probed as the plan claimed, each wrong version applied alone and restored: W1 (R-922, R-318), W2 (R-922 only), W3 (both), W4 and W5 (R-924), W6 and W6b (R-322), W7 (R-1871), W7b and W7c (R-1870, R-1871), W8 and W9 (R-827). I did not re-run the planner's W1b and W4b. With NANA_SETUP_PLATFORM=win32, R-922 and R-318 pass: the exec-form join through shq works, and on win32 installerTarget ignores the rewritten entries. Trace: 0 rows off EARS form. Tree --check, map:check and readme:check are green after `npm run req:tree` and `npm run map`. requirements-moved lists 11 rows. The R-391 dry-run divergence is real: under --home, dry run says "would add per-package entries" and the real run says skipped.

Class: ordinary. The lane changes tests and the ledger only; the knowledge-pull-fail-open-pin precedent agrees.

Files touched: install.test.mjs, settings-merge.test.mjs, skills-and-standards.test.mjs and relative-agent-dir.test.mjs under packages/nana-setup/tests; agent-dir-parity.test.mjs under packages/nana-pack/tests; REQUIREMENTS.md, docs/requirements-tree.md and docs/code-map.md.

Conflicts: no in-flight lane edits these five test files or these rows. I read the worktree diffs only. pi-seat-live-turn, pwsh-lexer-oracle, mutation-runner-win-prune and review-records-pin share only REQUIREMENTS.md, the tree and the map, so regenerate those after merging main. R-1870 to R-1879 is unused in every worktree. win-hook-rows (same slate) may change how doctor prints the win32 settings rows. If so, whichever lane lands second re-runs install.test.mjs after merging main. Wait for nothing.

Claim most likely wrong: that the --claude-home control reads all good on the native Windows leg. It is inferred from the forced-win32 run on macOS and from install.test's doctor exit 0 after install with --home, which passes on Windows CI. It has not run on Windows. The open question is whether os.homedir() and therefore the bin folder resolve to the realpathed temp USERPROFILE there.
