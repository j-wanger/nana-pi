# Nana — Running builders and reviewers

This rule is for the seat, the session that launches builders and reviewers; a session started as a builder or reviewer skips it.

- In Claude Code, launch each builder or reviewer as a background task and end your turn. In pi, run it as one foreground command with no timeout.
- While a builder or reviewer runs, do not read or judge its partial output, transcript, diffs or test results. Do not re-run its checks before it ends.
- Leave a running builder or reviewer alone until its completion notification arrives or a monitor reports a failure or a stall. Then act in that turn.
- Verify once, when the build ends. Re-run the seat checks your brief names, read the builder's report, and look at every page or command output the change produces.
- On a lane that produces or changes a page a person looks at, run first-look after build 1 and save the shots outside git: `npm run first-look -- --page product --out <folder>`, `--page desk --before <url> --after <url>`, or, for a new page or one with a reference, `--page url --after <url> --reference <folder> --spec <file> --out <folder>`. Point the owner to the shots with one question: is this the shape?
- On a lane that changes the product page, after first-look run `npm run outside-reader -- --from <first-look folder> --out <folder>` outside git, show the owner its top new finding in your report, and write a known-bug line only for a finding that is a real defect.
- On a lane whose page has a reference, run `npm run visual-reader -- --from <first-look folder> --out <folder>` outside git before you point the owner to the shots. Point the owner to them only after it prints a pass, or after you have judged them side by side with the reference yourself and say so in your report.
- In an install, hook or gate lane, re-run the lane's mutation runner after any change of your own to code or tests, before the review.
- Send findings on a build back in the next brief instead of fixing the builder's work yourself.
- Before you end your turn, name and start what waits on nothing else: another lane's build, a long mutation run in parts, separate research agents. Each lane's own steps stay in order.

  In pi, the seat asks the user to start another lane's build from another pi session or the desk; its own builds run in the foreground.
- Post a plan's questions as one `ask` issue before the build. This is the one exception to one issue per question. Label it `blocking` when any question is `hard to undo`, else `optional`. A blocking issue's title ends with "(default: go)", meaning build on the listed defaults.
- A blocking build waits for the owner's answer; meanwhile the seat reports YOUR CALL and starts other lanes. An optional build starts on the defaults, and a differing answer goes in the next brief. A plan whose questions read `None.` posts nothing.
- Run the full suite whole, never in parts. Never split a long run while a full suite runs on the same machine. If a check fails on a time limit, re-run it alone before you call it a failure.
- Keep at most two lanes building and one more in planning, a nana default. A lane in planning has no build yet and no builder working in it. A lane counts as building from its first build until it lands or closes.
- The builder preamble holds the builder's rules and the review standard holds the reviewer's. Judge review findings by the review standard, and restate neither in a brief.

In Claude Code, at session start, when the block names the issue watch, run that command as a background monitor. When it ends, run the restart command it printed. Builders and reviewers never run the issue watch. In pi, the frontier extension runs it itself.
