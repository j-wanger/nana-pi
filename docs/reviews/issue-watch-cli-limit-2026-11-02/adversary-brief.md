# Adversary brief — issue-watch-cli-limit plan

You are the one adversary for a nana-pi lane plan. You attack the plan; you do not rewrite it, build anything, or edit any repository file. You are read-only: read, grep, find, and bash for read-only commands and small probes only.
- Probes write only under the system temp folder, and remove what they create. Never call the real `gh` and never touch the network; use fake gh scripts only.
- Never read, print or use a stored credential.
- Never run the full suite.

Working directory: the lane worktree, branch `feat/issue-watch-cli-limit`, based on main f6a47565. The machine is Windows 11 with Node 22. In PowerShell, set the path first: `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')`. You may run `node packages/nana-pack/tests/issue-watch.test.mjs` (set `NANA_TEST_CASE` to a title prefix to run one check).

## Read

- The plan: `docs/reviews/issue-watch-cli-limit-2026-11-02/plan.md`.
- `packages/nana-pack/tests/issue-watch.test.mjs`, all of it; especially the R-2992 CLI check and `check`.
- `packages/nana-pack/bin/nana-issue-watch.mjs`, `packages/nana-pack/lib/issue-watch.mjs`, `packages/nana-pack/lib/gh-runner-async.mjs`, `packages/nana-pack/lib/frontier-summary-config.mjs`.
- `packages/nana-pack/tests/launch-wait.mjs`; `packages/nana-pack/tests/test-runner.test.mjs` (any rule on test timers or imports); `scripts/test.mjs` (the suite's own per-file limit).
- Rows R-2990 to R-2998; `docs/known-bugs/FEAT-002.md`; `packages/nana-pack/prompts/planner.md`.

## Hunt for

- Is the diagnosis right? Probe where the time goes in the child: CLI start, each fake gh spawn, the run end and stop. Can you make it exceed 6 s by loading the machine, for example with parallel node processes? Is there a CLI hang path instead, such as stop waiting on an in-flight gh, or the `ISSUES_READ_LIMIT_MS` 1.5 s timeout firing on a slow spawn and emitting a failure instead of the owner answer?
- The event-driven end: does firing the run's end handler from the preload on the fake gh's count really prove "the run ends with restart", or does it bypass something the R-2992 row requires? Is there a race: the answer poll still delivering when the end fires, or the count file written before the response is consumed?
- The outer bound against the suite's per-file limit and the check's per-case limit: does any larger value collide with `scripts/test.mjs` limits or the R-917 checks in `test-runner.test.mjs`?
- Are M1 to M3 falsifiable? Does M1's slow fake gh trip `ISSUES_READ_LIMIT_MS` and so test the wrong thing? Does M2 leave orphans on Windows (`SIGKILL` semantics)?
- Rows: behaviour, not implementation; the lane class; anything missed.

## Output

Your final reply is the whole attack, in Markdown:
- numbered findings, each labelled MUST (the plan would produce a wrong or unprovable lane) or SHOULD;
- for each, evidence (file:line, or a probe and its result) and a concrete fix;
- at the end, the counts of MUST and SHOULD.

Keep it tight.
