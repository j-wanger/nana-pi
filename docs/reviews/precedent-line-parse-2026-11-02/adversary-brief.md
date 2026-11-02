# Adversary brief — precedent-line-parse plan

You are the one adversary for a nana-pi lane plan. You attack the plan; you do not rewrite it, build anything, or edit any repository file. You are read-only: read, grep, find, and bash for read-only commands and small probes only.
- Probes write only under the system temp folder, and remove what they create.
- Never start pi-worker against a lane (no `--lane`); you may run `node packages/nana-pack/bin/brief-check.mjs` on temp brief files.
- Never read, print or use a stored credential. No GitHub API calls.
- Never run the full suite.

Working directory: the lane worktree, branch `feat/precedent-line-parse`, based on main bfde4ae2. The machine is Windows 11 with Node 22. In PowerShell, set the path first: `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')`.

## Read

- The plan: `docs/reviews/precedent-line-parse-2026-11-02/plan.md`.
- `packages/nana-pack/lib/brief-precedent.mjs`, `packages/nana-pack/lib/brief-config.mjs`, `packages/nana-pack/lib/markdown-list-sections.mjs`.
- Every caller of `readBrief`, `checkPrecedent` or `checkBriefForLaunch`: `packages/nana-pack/bin/pi-worker.mjs`, `brief-check.mjs`, `pi-review.mjs`, `claude-review.mjs`, and anything else grep finds. What does each do with the parsed Precedent?
- `packages/nana-pack/tests/brief-check.test.mjs`, `worker-lane.test.mjs`, `planner-prompt.test.mjs`; rows R-2578 to R-2580, R-2616, R-2954; `packages/nana-pack/prompts/planner.md`.

## Hunt for

- Step 1.3 (the first backticked span when the first token is prose): which real bullets would now pick a span that is a tracked path but not the bullet's subject? A bullet like "Like `scripts/x.mjs`, but see `packages/y.mjs`" picks x. Is that a problem for any caller? Probe the corpus: `docs/reviews/**` briefs and plans.
- Bare first tokens (step 1.4): does keeping them let the seat's failing case through in some other spelling, for example a prose word that happens to be a tracked folder name like `docs` or `scripts`? `trackedAtHead` accepts folders: does "scripts and tests…" now pass silently, on the first token `scripts`? Is that a pre-existing hole the plan should close?
- Multi-line bullets, nested sub-bullets, CRLF, a backtick span holding spaces or a URL, double backticks, and a span inside bold. What does `entryText` give?
- pi-review and claude-review: do they parse plans' Precedent with the same code and refuse on it? Would the change alter any review launch?
- Are M1 to M4 falsifiable against main's parser and against a "first backtick only, no fallback" parser? Name the gaps.
- Rows: behaviour, not implementation; the lane class; anything missed.

## Output

Your final reply is the whole attack, in Markdown:
- numbered findings, each labelled MUST (the plan would produce a wrong or unprovable lane) or SHOULD;
- for each, evidence (file:line, or a probe and its result) and a concrete fix;
- at the end, the counts of MUST and SHOULD.

Keep it tight.
