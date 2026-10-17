# Nana — Running builders and reviewers

This rule is for the seat, the session that launches builders and reviewers; a session started as a builder or reviewer skips it.

- In Claude Code, launch each builder or reviewer as a background task and end your turn. In pi, run it as one foreground command with no timeout.
- While a builder or reviewer runs, do not read or judge its partial output, transcript, diffs or test results. Do not re-run its checks before it ends.
- Leave a running builder or reviewer alone until its completion notification arrives or a monitor reports a failure or a stall. Then act in that turn.
- Verify once, when the build ends. Re-run the seat checks your brief names, read the builder's report, and look at every page or command output the change produces.
- After any change of your own to code or tests, re-run the lane's mutation runner before the review.
- Send findings on a build back in the next brief instead of fixing the builder's work yourself.
- At each step, name what waits on nothing else and start it now: another lane's build, a long mutation run in parts, separate research agents. Keep each lane's own steps in order: plan, seat checks, build, verify, review, land. Run the full suite whole, never in parts.
- Keep at most two lanes building and one more in planning, a nana default. A lane counts as building from its first build until it lands or closes.
- The builder preamble holds the builder's rules and the review standard holds the reviewer's. Judge review findings by the review standard, and restate neither in a brief.
