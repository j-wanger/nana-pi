# Nana — Running builders and reviewers

This rule is for the seat, the session that launches builders and reviewers; a session started as a builder or reviewer skips it.

- In Claude Code, launch each builder, reviewer or role child as a background task and end your turn. In pi, run it as one foreground command with no timeout.
- While a builder or reviewer runs, do not read or judge its partial output, transcript, diffs or test results. Do not re-run its checks before it ends.
- Leave a running builder or reviewer alone until its completion notification arrives or a monitor reports a failure or a stall. Then act in that turn.
- Verify once, when the build ends. Re-run the seat checks your brief names, read the builder's report, and look at every page or command output the change produces. After reworking a matcher, classifier, parser or filter, compare old and new builds on the same real inputs and replay every labelled past case; explain each changed result.
- On a lane that produces or changes a page a person looks at, run first-look after build 1 and save the shots outside git: `npm run first-look -- --page product --out <folder>`, or, for a new page or one with a reference, `--page url --after <url> --reference <folder> --spec <file> --out <folder>`. Point the owner to the shots with one question: is this the shape?
- On a lane that changes the product page, after first-look run `npm run outside-reader -- --from <first-look folder> --out <folder>` outside git, show the owner its top new finding in your report, and write a known-bug line only for a finding that is a real defect.
- On a lane whose page has a reference, run `npm run visual-reader -- --from <first-look folder> --out <folder>` outside git before you point the owner to the shots. Point the owner to them only after it prints a pass, or after you have judged them side by side with the reference yourself and say so in your report.
- On a lane that builds or reshapes a page a person looks at, write the build brief from `$HOME/nana-pi/docs/ui-brief-template.md`. The seat picks references by default. The owner's starred references from the library replace those picks when the owner wants a say.
- Every lane gets one reviewer plus CI.
- Before writing or briefing a plan, read `$HOME/nana-pi/packages/nana-pack/prompts/planner.md`.
- Before carry and issue posting, read Memory discipline and Work habits in `$HOME/nana-pi/packages/nana-setup/claude/rules/nana-soul.md`. Pi does not auto-load that rule.
- Default worktree root: `~/<repo>-wt/<lane>`; branch: `feat/<lane>`, based on main. One writer per worktree.
- Builder launcher: `pi-worker --lane <name> --brief <file> --out <file>`. Reviewer launcher: `pi-review` for a pi roster entry; `node "$HOME/nana-pi/packages/nana-pack/bin/claude-review.mjs"` for a Claude Code entry. Where the pack commands are not on PATH (Windows), run `node "$HOME/nana-pi/packages/nana-pack/bin/<command>.mjs"` with the same arguments. The reviewer comes from a different model lineage than the builder. Never silently substitute another model for a roster slot: when a slot cannot start, or a launcher warns of a shared or unverified lineage, change the roster or ask.
- Send findings on a build back in the next brief instead of fixing the builder's work yourself.
- Re-measure a plan's numbers on current main. Before a fix card or build, reproduce on the current base and make acceptance fail there; if it no longer fails, report the measure and build nothing.
- After the second fix for one failure, plan a class fix rather than another case fix.
- When a review blocks one build, sweep sibling builds for that defect class before reporting counts.
- Each status reports the current priority's measures: median lane hours from first build to land, and net lines removed from main since 2026-11-07; say when unmeasured.
- A brief names the frontier facts and contract surfaces (such as HANDOFF promises) its lane affects.
- A brief names the following checks.
  Name the new requirement ID range.
  Name only Precedent files tracked at the lane's current tip.
  Name the tests and known-bug lines a removal lane may delete.
  Require whole-part commits for large lanes.
  Export CI logs when the builder must read a failure.
  The seat files lane records (briefs, plans, review texts, CI excerpts and evidence) in `~/nana-records/<project>/<lane>/` (Windows `%USERPROFILE%\nana-records\<project>\<lane>\`), never in the repository. Builders and planner children return records in their report or under `$TMPDIR`; do not widen their lane write boundary. `<project>` is the main checkout's folder name, the folder that holds the shared git directory, not the lane worktree's name.
  Serialize lanes sharing `templates/_shared/working-under-nana-pi.md`, `AGENTS.md`, `packages/nana-setup/claude/rules/nana-seat.md`, `code-map.config.json`, `packages/nana-pack/tests/code-map-launch.test.mjs` or `REQUIREMENTS.md`.
- Before you end your turn, name and start what waits on nothing else: another lane's build, separate research agents. Each lane's own steps stay in order.

  In pi, the seat asks the user to start another lane's build from another pi session; its own builds run in the foreground.
- Run the full suite whole, never in parts. Never split a long run while a full suite runs on the same machine. If a check fails on a time limit, re-run it alone before you call it a failure.
- Keep no more lanes building than the lanes line of this machine's roster command allows, `node "$HOME/nana-pi/packages/nana-pack/bin/nana-roster.mjs"`, and at most two more in planning. A lane in planning has no build yet and no builder working in it. A lane counts as building from its first build until it lands or closes.
- The builder preamble holds the builder's rules and the review standard holds the reviewer's. Judge review findings by the review standard, and restate neither in a brief.

- Automatic profile saving stays off pending a reader. Keep the private store. Decisions live in `$HOME/nana-pi/docs/decisions.md`. `nana-rulings.md` keeps posture and tool-less safety lines. Threads use GitHub issues.

At session start, run the main CI check command when the block names it, and run it again after each land once that land's main run finishes. Use `--post` when it reports red.
Land the reviewed fix through `nana-land … --fixes-red <run>`.
Builders and reviewers never run the main CI check.

In Claude Code, at session start, when the block names the issue watch, run that command as a background monitor. When it ends, run the restart command it printed. Builders and reviewers never run the issue watch. In pi, the frontier extension runs it itself.
