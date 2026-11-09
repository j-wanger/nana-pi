Feature: FEAT-006 · Launch builders with execution limits

# Review brief 1: win-launch-argv (red-main fix)

Main's Windows run 42680934007 (shard 2 of 3) fails one check in `packages/nana-pack/tests/win32-launch.test.mjs` since the helper-start land: the lane child's argv now starts with `--no-skills` and one `--skill <path>` pair per kept skill, but the check still expected `--provider` at index 0. The CI log shows the child got the right flags. Review `git diff main HEAD` (one commit, test and regenerated map only).

Questions:
- Does the new check match the argv pi-worker builds on Windows (the skill paths' spelling included), so main's Windows run goes green?
- Does it still fail if pi-worker drops `--no-skills`, a skill, or the roster arguments?

This test runs only in main's full Windows run; lane CI does not select it. Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.
