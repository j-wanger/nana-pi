# Nana — Running builders and reviewers

This rule is for the seat, the session that launches builders and reviewers; a session started as a builder or reviewer skips it.

- In Claude Code, launch each builder, reviewer or role child as a background task and end your turn. In pi, run it as one foreground command with no timeout.
- Start scout (code scouting and research gathering), planner and adversary through `pi-worker --slot <slot> --brief <file> --out <file>`. Node form: `node "$HOME/nana-pi/packages/nana-pack/bin/pi-worker.mjs" --slot <slot> --brief <file> --out <file>`; PowerShell: `node "$env:USERPROFILE\nana-pi\packages\nana-pack\bin\pi-worker.mjs" --slot <slot> --brief <file> --out <file>`. A role whose roster line reads `seat` or `none` runs in the seat. Scout and planner launches are the seat's choice; use an adversary once per plan. Read lineage warnings; change a shared or unverified slot rather than silently substituting another model.
- While a builder or reviewer runs, do not read or judge its partial output, transcript, diffs or test results. Do not re-run its checks before it ends.
- Leave a running builder or reviewer alone until its completion notification arrives or a monitor reports a failure or a stall. Then act in that turn.
- Before pushing a lane branch, run `node "$HOME/nana-pi/packages/nana-pack/bin/leak-scan.mjs" --base main --tip HEAD` chained with `&&` to the push; on a hit, fix the commit before any push.
- Verify once, when the build ends. Re-run the seat checks your brief names, read the builder's report, and look at every page or command output the change produces.
- On a lane that produces or changes a page a person looks at, run first-look after build 1 and save the shots outside git: `npm run first-look -- --page product --out <folder>`, `--page desk --before <url> --after <url>`, or, for a new page or one with a reference, `--page url --after <url> --reference <folder> --spec <file> --out <folder>`. Point the owner to the shots with one question: is this the shape?
- On a lane that changes the product page, after first-look run `npm run outside-reader -- --from <first-look folder> --out <folder>` outside git, show the owner its top new finding in your report, and write a known-bug line only for a finding that is a real defect.
- On a lane whose page has a reference, run `npm run visual-reader -- --from <first-look folder> --out <folder>` outside git before you point the owner to the shots. Point the owner to them only after it prints a pass, or after you have judged them side by side with the reference yourself and say so in your report.
- On a lane that builds or reshapes a page a person looks at, write the build brief from `$HOME/nana-pi/docs/ui-brief-template.md`. The seat picks references by default. The owner's starred references from the library replace those picks when the owner wants a say.
- Every lane gets one reviewer plus CI.
- Send findings on a build back in the next brief instead of fixing the builder's work yourself.
- A brief names the following checks.
  Name the new requirement ID range.
  Name only Precedent files tracked at the lane's current tip.
  Name the tests and known-bug lines a removal lane may delete.
  Require whole-part commits for large lanes.
  Export CI logs when the builder must read a failure.
  Commit the review brief before the first push.
  Serialize lanes sharing `templates/_shared/working-under-nana-pi.md`, `AGENTS.md`, `packages/nana-setup/claude/rules/nana-seat.md`, `code-map.config.json`, `packages/nana-pack/tests/code-map-launch.test.mjs` or `REQUIREMENTS.md`.
  Name `node scripts/requirements-trace.mjs` among every brief's seat checks, including small fix briefs.
- Before you end your turn, name and start what waits on nothing else: another lane's build, separate research agents. Each lane's own steps stay in order.

  In pi, the seat asks the user to start another lane's build from another pi session or the desk; its own builds run in the foreground.
- Run the full suite whole, never in parts. Never split a long run while a full suite runs on the same machine. If a check fails on a time limit, re-run it alone before you call it a failure.
- Keep no more lanes building than the lanes line of this machine's roster command allows, `node "$HOME/nana-pi/packages/nana-pack/bin/nana-roster.mjs"`, and at most two more in planning. A lane in planning has no build yet and no builder working in it. A lane counts as building from its first build until it lands or closes.
- The builder preamble holds the builder's rules and the review standard holds the reviewer's. Judge review findings by the review standard, and restate neither in a brief.

- On an enabled personal machine, automatically save quoted preferences, corrections, facts and thinking about the owner to both the private profile and today's shared memory until delivery lands. Run `node "$HOME/nana-pi/packages/nana-pack/bin/nana-profile.mjs" save`; never enable saving on a machine without the owner's choice. Show each Saved: line in your reply so the owner can retract it; confirm only on an explicit owner yes with new owner words. Never save as a builder or reviewer, from a linked worktree, or from a disabled machine. Decisions belong in nana-rulings.md and open threads in GitHub issues.

At session start, run the main CI check command when the block names it, and run it again after each land once that land's main run finishes. Use `--post` when it reports red.
Land the reviewed fix through `nana-land … --fixes-red <run>`.
Builders and reviewers never run the main CI check.

In Claude Code, at session start, when the block names the issue watch, run that command as a background monitor. When it ends, run the restart command it printed. Builders and reviewers never run the issue watch. In pi, the frontier extension runs it itself.
