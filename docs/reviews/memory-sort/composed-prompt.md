# Composed seat sections

Rendered through nana-rulings.ts buildBlock and buildSeatGuideBlock over OS-temp copies; no install or model launch.

## Standing rulings (nana)

# Nana — Standing rulings

These rulings guide the seat, the session that plans lanes and launches builders and reviewers; a builder or reviewer acts only within its brief and reads them as background.

- 2026-09-16: Each session says which objective or current-priority line its spend serves, or proposes updating them.
- 2026-09-18: Memory has two tiers: shared rules for every project, and project facts in the project. Start a session in the product's own folder.
- 2026-10-09: Builder sessions get no automatic knowledge pull.
- 2026-10-10: rm runs freely only inside the working directory.
- 2026-10-10: In nana-pi, Windows testing is required.
- 2026-10-10: In nana-pi, the desk stays frozen until the owner reopens it.
- 2026-10-11: Every plan names its threat model: honest variation in scope, deliberate forgery out.
- 2026-10-11: After every reviewer says LAND, nothing more is edited. Urgent fixes ship alone and are hardened later.
- 2026-10-11: In nana-pi, push main right after each reviewed land. Pushing another branch or opening a draft PR needs no approval.
- 2026-10-12: In nana-pi, a setup or hook lane runs the install check locally on macOS before the land.
- 2026-10-13: A review blocks only on a material problem. A confirmation round reviews only the change since the last round.
- 2026-10-13: A change to code with tests goes through the builder and reviewer pattern. The roster names the models, and the session-start line shows it.
- 2026-10-14: Turning a repo into a feature tree is core: lift, an approved regroup, then feature-oriented work.
- 2026-10-15: Every builder and long background run gets a failure watcher and a heartbeat at launch.
- 2026-10-16: The public repo carries no owner name and nothing about the owner's work.
- 2026-10-16: A blocking question carries a one-word default.
- 2026-10-16: Rulings live in this file. A new ruling lands in the reviewed change of the lane that records it, and removes any ruling it replaces.
- 2026-10-17: Development is feature-first. Plans get no review round; the seat and one adversary write each lane's must-meet tests.
- 2026-10-20: In nana-pi, the seat lands a lane once every reviewer says LAND. The owner gives no separate Land.
- 2026-10-21: A capability is a product stage with deliverables, or a constraint that names the stages it binds. Every capability field stays optional, and existing trees gain the fields in place.
- 2026-10-21: The owner adopted the writing rule. Every report runs the check before it is sent, and HANDOFF's live sections must pass it.
- 2026-10-21: Known bugs live one line each in their feature's file, not in HANDOFF.
- 2026-10-22: A produced artifact is a feature to maintain. Each deliverable names the run that makes it and the code that reads it. Closing a hand-made maker or a rule-only reader comes first.
- 2026-10-22: Every plan and brief names its precedent, the nearest existing code for each part. Builders follow it and report each departure. A `Card: fix` brief may omit the section (owner, 2026-11-06, #338); plans and other briefs still require it. pi-worker refuses an unmarked brief without it.
- 2026-10-22: A helper's second caller imports it rather than copying it. A plan's Precedent section names any move of a private helper to a shared module.
- 2026-10-28: Before the seat plans new capability, it brings the owner two or three readings of the intent, once per request; a fix that restores agreed behaviour plans straight away.
- 2026-11-07: In nana-pi, lanes land without waiting for Windows; Windows runs on main after each land, and a red main blocks further lands.
- 2026-11-07: Every lane gets one reviewer plus CI.
- 2026-11-07: The roster names a slot for the scout, planner and adversary; a seat starts each through its slot.
- 2026-11-02: In nana-pi, a tip's passing GitHub CI stands in for the local full suite for builders, seats and lands. Builders do not push; the seat pushes after verifying, then waits for CI. The local locked suite runs only when CI cannot stand in.
- 2026-11-02: An independent reviewer accepts every revision that reaches main. The one exception: when nana-land merges current main into an accepted tip whose CI passed and git finds no conflict, that merge lands without new CI or review; a generated file the land contract names, changed on both sides and rebuilt by its own generator, counts as no conflict. Nobody commits to main directly, and nothing is written after a land. The fix lands through `nana-land` with `--fixes-red <run-id>`.
- 2026-11-08: Roadmap first in nana-pi: leave a build slot empty unless its lane names the roadmap step it serves. A brief carries `Serves: roadmap step <N>` with one sentence on its contribution, or `Serves: owner YYYY-MM-DD` with the owner's words. pi-worker checks completeness, not alignment.
- 2026-11-08: Validation first in nana-pi: name how to check the result, run it small and early, and add a test only for a failure that happened. This wins where standards, AGENTS.md or the planner still demand preventive must-meet tests until the validation-first lane reconciles them.
- 2026-11-05: Keep an adversary point only when it changes a decision; cut points that merely add procedure or artifacts.
- 2026-11-04: Exploration artifacts get at most one review: usable means they load and their reference passes. Fix unusable blockers; record other gaps. Harden for scored use only where observed results warrant it.
- 2026-11-04: Start a clear next step inside agreed scope rather than ending with a permission question. Still ask before money, accounts, credentials, irreversible or outward-facing acts. This grants no off-roadmap work and overrides no approval rule.
- 2026-11-03: Run a tool once it can yield an honest result; hardening needs a real-run failure or contamination, not an imagined problem.
- 2026-11-03: Start with the simplest design meeting the request. For small, low-risk tools, use one brief-check round and explain discarded scope growth; retain deeper checks for isolation, credentials, CI and land tools.
- 2026-10-05: pi-durable stays parked for desk and seat use until a product needs crash-safe long runs; then probe it first.
- 2026-11-07: Reduction keeps page readers, adoption detection and the four Claude skills: spec, py-lint, py-review and py-test. The memory factory is paused, not deleted.
- 2026-11-01: Each machine sets how many lanes build there in its roster file; the roster command's lanes line prints the limit, default included. At most two more lanes are planned.


## Seat guide (nana)

# Nana — Running builders and reviewers

This rule is for the seat, the session that launches builders and reviewers; a session started as a builder or reviewer skips it.

- In Claude Code, launch each builder, reviewer or role child as a background task and end your turn. In pi, run it as one foreground command with no timeout.
- Start scout (code scouting and research gathering), planner and adversary through `pi-worker --slot <slot> --brief <file> --out <file>`. Node form: `node "$HOME/nana-pi/packages/nana-pack/bin/pi-worker.mjs" --slot <slot> --brief <file> --out <file>`; PowerShell: `node "$env:USERPROFILE\nana-pi\packages\nana-pack\bin\pi-worker.mjs" --slot <slot> --brief <file> --out <file>`. A role whose roster line reads `seat` or `none` runs in the seat. Scout and planner launches are the seat's choice; use an adversary once per plan. Read lineage warnings; change a shared or unverified slot rather than silently substituting another model.
- While a builder or reviewer runs, do not read or judge its partial output, transcript, diffs or test results. Do not re-run its checks before it ends.
- Leave a running builder or reviewer alone until its completion notification arrives or a monitor reports a failure or a stall. Then act in that turn.
- Before pushing a lane branch, run `node "$HOME/nana-pi/packages/nana-pack/bin/leak-scan.mjs" --base main --tip HEAD` chained with `&&` to the push; on a hit, fix the commit before any push.
- Verify once, when the build ends. Re-run the seat checks your brief names, read the builder's report, and look at every page or command output the change produces. After reworking a matcher, classifier, parser or filter, compare old and new builds on the same real inputs and replay every labelled past case; explain each changed result.
- On a lane that produces or changes a page a person looks at, run first-look after build 1 and save the shots outside git: `npm run first-look -- --page product --out <folder>`, `--page desk --before <url> --after <url>`, or, for a new page or one with a reference, `--page url --after <url> --reference <folder> --spec <file> --out <folder>`. Point the owner to the shots with one question: is this the shape?
- On a lane that changes the product page, after first-look run `npm run outside-reader -- --from <first-look folder> --out <folder>` outside git, show the owner its top new finding in your report, and write a known-bug line only for a finding that is a real defect.
- On a lane whose page has a reference, run `npm run visual-reader -- --from <first-look folder> --out <folder>` outside git before you point the owner to the shots. Point the owner to them only after it prints a pass, or after you have judged them side by side with the reference yourself and say so in your report.
- On a lane that builds or reshapes a page a person looks at, write the build brief from `$HOME/nana-pi/docs/ui-brief-template.md`. The seat picks references by default. The owner's starred references from the library replace those picks when the owner wants a say.
- Every lane gets one reviewer plus CI.
- Send findings on a build back in the next brief instead of fixing the builder's work yourself.
- Before launch, re-read OBJECTIVE.md's priority and judge whether this lane is the best use of the slot. Require `Serves: roadmap step <N>` plus its contribution, or `Serves: owner YYYY-MM-DD` plus the owner's words; the launch check proves only completeness.
- Re-measure a plan's numbers on current main. Before a fix card or build, reproduce on the current base and make acceptance fail there; if it no longer fails, report the measure and build nothing.
- After the second fix for one failure, plan a class fix rather than another case fix.
- Merge briefs preserve main's deletions, never a union of both sides; verify `git diff origin/main HEAD -- <files the lane did not change>` is empty.
- Run `date` locally and in UTC before writing a dated line; use the owner's local date.
- When a review blocks one build, sweep sibling builds for that defect class before reporting counts.
- Each status reports the current priority's measures: median lane hours from first build to land, and net lines removed from main since 2026-11-07; say when unmeasured.
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
