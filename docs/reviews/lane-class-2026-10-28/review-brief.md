# Review — lane-class (code names each lane's class from its files), 2026-10-28 (the final reviewer)

Feature: FEAT-029 · Navigate code and investigate impact

Class: ordinary. The lane adds `scripts/lane-class.mjs` and its sealed config, lifts blast-radius's changed set into one shared function, makes pi-worker print one class line after its build-end line, adds one nana-pi project-section sentence to AGENTS.md, and fixes four wording points in the planner prompt from planner-prompt's final review. It changes no install, uninstall or doctor code, no hook or extension code, no gate policy and no land or review tool; pi-worker is not one of the four land and review tools AGENTS.md names, and the script itself prints `ordinary` for this diff. Threat model: honest variation in our tools' output, files and environment is in scope (renamed, deleted or untracked files; non-module files under a class folder; Windows backslash or `./` paths in `--files`; a planned file that does not exist yet; a branch with no merge base; a lane tree that predates the script; a hung git call); deliberate forgery is out.

Review `git diff f6604431..HEAD` on `feat/lane-class` (main merged at 602edced). The plan of record is `docs/reviews/lane-class-2026-10-28/plan.md`, after one adversary pass (`plan-attack.md`; 1 MUST, 5 SHOULD, 5 NOTE, all taken). Briefs 1 to 4 sit beside it.

The seat's record:
- Build 1 stopped when pi-worker's watchdog killed it during a detached suite run. Build 2 finished must-meets 1 to 7. Build 3, after main was merged in, read the extension folders from the pi manifests, added the planner sentence and fixed planner-prompt's four review points.
- The seat's check of build 3 (`seat-check-ccbd535e.md`) found that a doubled `/` dropped every pi extension from the import hop, so 11 libraries only extensions import printed ordinary. Build 4 (9f313438) fixed the join and added an extension-importer case to R-2963.
- The seat's check of build 4: builds 2 and 4 side by side over all 448 mapped modules and hook files give identical lines; the ten landed lanes print the same class as before. Map, README, trace, tree, known-bugs and identity checks are clean, and each tightened prompt check turns red on reversed wording.
- Locked full suite at build 4: 228 files, 226 pass, 2 skip.
- Notes before this round (8f63281e): the HANDOFF lanes line, a session entry and three FEAT-029 known-bug lines for the residuals.
- The lane's own keep wrote `tree-movement.md`.
- CI runs on the draft pull request at the reviewed tip, the Windows leg included; the seat lands only on green.

Ask above all: does the class line a builder and a planner see match AGENTS.md's definition for real changes, naming the right file and reason, without printing ordinary for a change that touches what runs as a hook, install step, gate or land and review tool? Does pi-worker keep the build's own exit code and print nothing in a tree without the script? Is each row no wider than its test? The owner's open question on widening the class (issue 242) is not this lane's to decide; judge the script against today's definition.

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, including your first sentence, and do not bold it.
