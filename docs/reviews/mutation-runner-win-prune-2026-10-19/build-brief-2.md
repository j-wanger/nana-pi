# mutation-runner-win-prune — build brief 2

Feature: FEAT-031 · Run checks reliably and without contaminating work. Class: ordinary. Builder: pi gpt-5.6-sol through
pi-worker --lane-size larger. Read `must-meet.md`, `plan-attack.md` and `build-brief-1.md` first. Build 1 is `4aaafdc1`.
You cannot run Windows here; the seat runs the Windows leg.

## What the Windows CI leg showed on build 1 (run on 4aaafdc1; macOS and Ubuntu green)

`mutation-runner.test.mjs 30 pass, 1 fail, 3 skip`. The failing check is the existing one, "mutation runner: a pair's
edit lands only in a scratch worktree under the temp folder …" (two pairs in two shards, `0s apart`). Its record:

    [1/2] RESULT: 1/1 red …
    [2/2] seat-mutate: worktree add 02944a8… failed: Preparing worktree (detached HEAD 02944a8)
    [2/2] fatal: failed to read .git/worktrees/wt/commondir: No error
    [2/2] seat-mutate: shard exited 2 with no tally
    MISSING 2 no-op sees a clean worktree — shard 2/2 printed no line for it

So shard 2's `git worktree add` read shard 1's admin folder `.git/worktrees/wt` while it was half removed (inferred: shard 1
had finished its pair and was removing its scratch worktree, which on Windows can take retries now). Git does not make a
concurrent `worktree add` and `worktree remove` in one repository safe. Main passed this check on every recorded Windows
run, so build 1's slower, retried removal most likely widened the window.

## Fix

1. Make scratch-worktree add and remove in one lane repository never overlap across shards: for example hold a lock in
   the runner's own lock folder (there is already a record lock) around each `worktree add` and each removal, including
   the retries. Seal any new wait or timeout in `mutation-runner-config.mjs` with provenance. Do not prune.
2. A check, red on build 1 on every platform if you can make it deterministic (for example an injected git runner that
   holds a removal open while the other shard adds, at the module boundary you already inject); if it cannot be
   deterministic, say so and rely on the existing check, and add row R-1775 for the "never overlap" rule with its test.
3. Keep every build-1 check and row as is.

## Rules
Single test files only, never the full suite. No push. No HANDOFF.md or docs/sessions/ edits. Every `// req:` marker sits
directly above its check call with the title on that line. Run `npm run req:tree`, `npm run map` if headers or modules
change, `node scripts/requirements-trace.mjs`, `npm run map:check` and `npm run readme:check`. Run
`node packages/nana-pack/tests/mutation-runner.test.mjs` three times; report each result.

## Report (10 lines or fewer)
VERDICT; commits; the fix and why it closes the race; the new check red before and green after (or why none); the three
runs of the test file; what only the Windows leg can confirm.
