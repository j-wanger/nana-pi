# Nana — Standing rulings

These rulings guide the seat, the session that plans lanes and launches builders and reviewers; a builder or reviewer acts only within its brief and reads them as background.

- 2026-09-16: Each session says which objective or current-priority line its spend serves, or proposes updating them.
- 2026-09-18: Memory has two tiers: shared rules for every project, and project facts in the project. Start a session in the product's own folder.
- 2026-10-09: Builder sessions get no automatic knowledge pull.
- 2026-10-10: rm runs freely only inside the working directory.
- 2026-11-09: The owner cut the desk and the stage layer from nana-pi.
- 2026-10-11: Every plan names its threat model: honest variation in scope, deliberate forgery out.
- 2026-10-11: After every reviewer says LAND, nothing more is edited. Urgent fixes ship alone and are hardened later.
- 2026-10-11: In nana-pi, push main right after each reviewed land. Pushing another branch or opening a draft PR needs no approval.
- 2026-10-12: In nana-pi, a setup or hook lane runs the install check locally on macOS before the land.
- 2026-10-13: A review blocks only on a material problem. A confirmation round reviews only the change since the last round.
- 2026-10-13: A change to code with tests goes through the builder and reviewer pattern. The roster names the models, and the session-start line shows it.
- 2026-10-16: The public repo carries no owner name and nothing about the owner's work.
- 2026-10-16: A blocking question carries a one-word default.
- 2026-11-09: A ruling lives where it acts. A ruling that a tool or another file holds keeps its dated words in `$HOME/nana-pi/docs/decisions.md`, naming that home; only posture lines, and safety lines without a tool, stay here at start. A new ruling lands in the reviewed change of the lane that records it, and removes any ruling it replaces.
- 2026-10-17: Development is feature-first. Plans get no review round.
- 2026-10-20: In nana-pi, the seat lands a lane once every reviewer says LAND. The owner gives no separate Land.
- 2026-10-21: Known bugs live one line each in their feature's file, not in HANDOFF.
- 2026-10-22: A produced artifact is a feature to maintain. Each deliverable names the run that makes it and the code that reads it. Closing a hand-made maker or a rule-only reader comes first.
- 2026-10-22: A helper's second caller imports it rather than copying it. A plan's Precedent section names any move of a private helper to a shared module.
- 2026-10-28: Before the seat plans new capability, it brings the owner two or three readings of the intent, once per request; a fix that restores agreed behaviour plans straight away.
- 2026-11-07: Every lane gets one reviewer plus CI.
- 2026-11-09: An independent reviewer accepts every authored revision that reaches main. The lane merges current main; that merge needs no new review when its first parent is covered, its second parent is in main's history and its tree matches nana-land's computed merge. CI must pass on that merge before landing. Nobody commits to main directly, and nothing is written after a land. The fix lands through `nana-land` with `--fixes-red <run-id>`.
- 2026-11-08: Roadmap first in nana-pi: leave a build slot empty unless its lane names the roadmap step it serves. A brief carries `Serves: roadmap step <N>` with one sentence on its contribution, or `Serves: owner YYYY-MM-DD` with the owner's words. pi-worker checks completeness, not alignment.
- 2026-11-08: Validation first in nana-pi: name how to check the result, run it small and early, and add a test only when it pins a failure that happened, the main use of a kept feature, or a safety line (privacy, credentials, rm, identity, Windows paths). In nana-pi this wins over the standards file, including its one pin test per sealed tunable. A feature brief names its run on a `Validation:` line. One adversary serves each plan that has a design choice; none serves a cut or fix card.
- 2026-11-04: Exploration artifacts get at most one review: usable means they load and their reference passes. Fix unusable blockers; record other gaps. Harden for scored use only where observed results warrant it.
- 2026-11-04: Start a clear next step inside agreed scope rather than ending with a permission question. Still ask before money, accounts, credentials, irreversible or outward-facing acts. This grants no off-roadmap work and overrides no approval rule.
- 2026-11-03: Run a tool once it can yield an honest result; hardening needs a real-run failure or contamination, not an imagined problem.
- 2026-11-03: Start with the simplest design meeting the request. For small, low-risk tools, use one brief-check round and explain discarded scope growth; retain deeper checks for isolation, credentials, CI and land tools.
- 2026-10-05: pi-durable stays parked for seat use until a product needs crash-safe long runs; then probe it first.
- 2026-11-07: Reduction keeps page readers, adoption detection and the four Claude skills: spec, py-lint, py-review and py-test.
- 2026-11-09: Never route a credential through an agent: no agent extracts, prints or passes on a stored credential, even to save a step; move data through tools that keep it stored.
- 2026-11-09: A failure that repeats becomes a check in the tool at its moment. Judgment stays a short posture line. Neither becomes a memory line.
- 2026-11-09: A test stays only if it pins a recorded failure, the main use of a kept feature, or a safety line.
- 2026-11-09: The memory factory is cut (owner D3). The owner profile store stays.
- 2026-11-09: A red main leg re-runs once at the same commit; a green re-run keeps lands open, and the flake is recorded per file and fixed in source. Lane tips do not run the full Windows suite for now. The lane-built code map and requirements tree move out of each lane's commits in their own lane.
