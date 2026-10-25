# review-movement · adversary pass on the plan draft (main d3f7f7f3)

Counts: 1 MUST, 4 SHOULD, 9 NOTE. Evidence paths are repo-relative. `pd:` is `<scratch>/lanes/deliverable-runs-plan-draft.md`.

Checked and clean. Most cited file:line claims were opened at d3f7f7f3 and hold. These hold: REQUIREMENTS.md:27, :465, :474, :598, :692, :720, :769, :839, :2203, :2205-2207, :2232, :2250 and :2322; scripts/requirements-moved.mjs:280, :299-303, :313 and :337; scripts/product-report.mjs:975; scripts/ci-records.mjs:41; scripts/requirements-tree.mjs:644-653; the five other `process.exit(main())` lines in pd:181; scripts/deliverables.mjs:25, :31, :430, :532-580, :673-686 and :687-688; review-standard.mjs:12 and :14; claude-review-config.mjs:1-29 and :24; claude-review.mjs:15, :32, :86 and :92; pi-review.mjs:37, :74, :170-172, :194 and :203; mutation-runner.mjs:489-490; claude-review.test.mjs:28-38, :64, :94 and :133-156; immutable-review.test.mjs:30-46, :92-98, :137-139 and :176-183; land-records.test.mjs:268-277; build-records.test.mjs:315-316; fake-pi.mjs:1-12; requirements-moved.test.mjs:47-60 and :140-158; linked-launch.test.mjs:71-73; land-records must-meet.md:70; AGENTS.md:68-103 (markers) and :157; SKILL.md:142; the pack README:182-202. The slips are in item 12. Counts and sizes, measured read only:
- 253 review and land briefs carry "tree movement".
- No kept timeline exists outside the timeline lane's own folder.
- The checker prints `deliverables: 20 of 23 made and read by code, 19 parked` today.
- The ledger was rebuilt in memory with lane A's two claim lines and the R-1560 park, then with lane B's park as well. The checker printed `21 of 22 …, 20 parked`, then `21 of 21 …, 21 parked`, with no note either time. So the projection in pd:7 holds, and both park lines parse where pd:63 and lane B put them.
- From c0a78493 the report is 81,097 bytes. A pipe and `spawnSync` both receive exactly 65,536 bytes with status 0, so the R-2906 bug is real.
- Two real ranges: the lift lane (395e0633^..4c172e6a) is 34,397 bytes, and the last 200 commits are 24,505 bytes.
- The R-2900–R-2906 IDs are free on main, in every worktree and in every sibling draft.
- The class is right: review tools make it a hook-class lane, and a lane that touches no nana-setup or hook file needs no local install check.
- The page effect statement is right. No page code changes, only data.
- No existing test runs a launcher against a tree with a committed ledger. The R-2561 and R-1105 fixtures commit no ledger, so their exact checks hold.

1. **MUST: pi-review passes the section as one command-line argument, and that argument outgrows the platform limits at sizes the plan says are in scope.**
   - pd:55 makes the section a third `--append-system-prompt` text value. On win32, pi-watchdog starts pi through `process.execPath` with no shell (pi-watchdog.mjs:42-53, spawn at :190). Windows caps that whole command line at 32,767 characters.
   - Linux caps one argument at 131,072 bytes. macOS caps argv plus env at 1,048,576 bytes (`getconf ARG_MAX`).
   - Briefs already travel in argv as `-p "$(cat brief.md)"` (pack README:179), and the largest committed brief is about 17 KB. So a lift-sized movement (34 KB), or a 200-commit one (24 KB) with an average brief, overflows Windows. The plan's own 81 KB case does too.
   - Then the spawn fails, and the watchdog reports `pi spawn failed` (pi-watchdog.mjs:202, :224-227). It retries with the same argv, prints FAILED and exits 1. pi-review is the land reviewer, so that lane cannot land from a Windows seat. That breaks the stakes line's promise that a failed movement never refuses a review (pd:32), and MOVEMENT_MAX_BYTES at 16 MiB invites the same failure on every platform.
   - Nothing would catch it. R-2906 pins claude-review only, which uses stdin (claude-review.mjs:92-95). The independent check runs on macOS, where 81 KB fits. CI's Windows leg runs no large pi-review case.

   Fix:
   - pi-review writes the section to a file in its own `mkdtempSync(join(tmpdir(), …))` folder and passes that path to `--append-system-prompt`. pi takes `<text|path>` (pi docs `cli.md`, "Prompts and process"). The precedent is pi-worker.mjs:172-179 and :209, removed at :77.
   - Never write it inside the checkout. `complete` derives the revision there (pi-review.mjs:214), so an extra file would change the reviewed snapshot.
   - Remove the folder in the `finally` block beside `removeWorktree`.
   - Add R-2907: "WHEN the tree movement section is longer than 32,767 characters, pi-review shall pass the pi child the whole section." Its case runs on every platform, so the Windows CI leg pins it. The fake pi copies the appended file before it exits, as worker-lane.test.mjs:60-69 does.
   - Reword R-2901 to "as an appended system prompt file". Add the pair "section passed as argv text → R-2907 (Windows CI)". Add the known limit "a reviewer child whose context cannot hold the section fails the review" (see item 10).

2. **SHOULD: dropping the land-report clause reverses an owner ask without saying so.**
   - The tree-briefs lane exists for HANDOFF Next 7, set by the owner on 10-11, 10-16 and 10-17: "each land shows how the tree moved" (docs/reviews/tree-briefs-2026-10-19/must-meet.md:6-8). Its known limit 2 (:90) says that promise rests on the seat's land report.
   - pd:64 removes the clause from AGENTS.md:157 and SKILL.md:142. Its reason is that the land reviewer now gets the movement, but the land reviewer is not the owner.
   - The writing rule bars row numbers in prose only. It also tells the report to point once to a file holding the detail, so the movement can still reach the owner.

   Fix: keep the clause, worded so that the land report points to the movement file. Keep it in R-1460's claims as a second reader line: `Read by: R-1460 · person: the seat's land report points the owner to it`. The checker accepts several reader lines per row (see R-1400 at REQUIREMENTS.md:467-469). Otherwise, put the drop to the owner as a five-part decision with the default "keep".

3. **SHOULD: the independent check needs a scratch home and a Windows leg.**
   - (a) pd:170 runs the worktree's claude-review and pi-review against a scratch clone. claude-review reads the roster from pi's agent dir (claude-review.mjs:72), and both launchers record rounds in the user-scope review ledger. Run as written, the check needs a Claude Code reviewer in the real roster, and it writes fake LAND rounds into the real ledger.
   - (b) A macOS-only check cannot see item 1.

   Fix:
   - Run both launchers with `HOME` and `PI_CODING_AGENT_DIR` set to a scratch folder holding a roster whose `reviewer` is a Claude Code entry.
   - Add one Windows run of the 81 KB pi-review case, through the scratch-CI route already used for Windows pairs, or by reading R-2907 on the draft pull request's Windows leg.
   - The plan already pushes at build 1. Make that Windows reading a condition of the review brief.

4. **SHOULD: lane B costs a full land for one ledger line; fold it into lane A.**
   - Lane B's whole change is one `Parked: R-291` line, two lines above the R-1460 lines that lane A rewrites in the same CAP-07 field block. Lane A also already reaches FEAT-028: the script fix and R-1460's claims.
   - The in-memory check shows both parks together give `21 of 21`, with no note.
   - A separate lane adds a brief, a review, about 21 minutes of CI wait and a land.
   - Lane B goes second only because its reason cites lane A's result (pd:26). The reason stands without that clause: "the suite fails on a stale copy and no code reads the outline".

   Fix: add the R-291 park to lane A and drop lane B. If it stays separate, give a reason other than order.

5. **SHOULD: pi-review's failure path has no row, and item 1's fix adds new failure points.**
   - R-2902 and R-2903 cover claude-review only. pi-review is the land path, so the stakes line (pd:32) is not pinned where it matters most.
   - After item 1, pi-review makes a folder and writes a file before the child starts. A failed `mkdtempSync` or `writeFileSync` inside the `try` (pi-review.mjs:139) would refuse the review.
   - R-2901's clause "computed in the immutable checkout" cannot fail a test. The checkout is created at the source's HEAD (pi-review.mjs:162), so a helper run in the source tree gives the same report.

   Fix:
   - Add a pi-review case on a `trunk`-only repository with a committed ledger. Expect exactly one appended section reading `MOVEMENT_NOT_COMPUTED …`, a recorded round and exit 0.
   - State that a failed section write appends the not-computed line in its place, using the reason `section file: <code>`, and never throws.
   - Drop "in the immutable checkout" from R-2901's row text, and keep it as a design note.

6. **NOTE: the "first non-empty stderr line" reason is fragile.**
   - An uncaught failure, such as ERR_MODULE_NOT_FOUND in a partial checkout or a Node without type stripping, prints a `node:internal/…` or `file:///…:<line>` location first, not the cause. The script chain imports a `.ts` file (requirements-tree.mjs:14 → requirements-trace.mjs:21).
   - A Node warning line would also come first. One appeared when the script's module was imported from `-e`, though not on a direct run.
   - On Windows, a stderr line may end in `\r`.

   Fix: start the script with `--no-warnings`, as TS_CHECK_ARGS does (mutation-runner-config.mjs:122). Split stderr on `/\r?\n/`. Add the known limit "a crash names its source location, not its cause".

7. **NOTE: `tree movement: none` names no head, so one known limit is false.**
   - pd:175 says the report's first line names its head. The none case (requirements-moved.mjs:280) prints no revision.
   - A dirty-tree review whose ledger edits are uncommitted therefore reads "none" with no sign that the edits were left out.

   Fix: reword pd:175, and add "a dirty-tree review with uncommitted ledger edits reads none" next to pd:174. Optionally, the helper adds one sealed line naming the commit it read.

8. **NOTE: outside nana-pi, the section tells the reviewer nothing.**
   - "The reviewer reads every feature it names" lives in AGENTS.md:157, in nana-pi's own section outside the managed markers, and in the requirements skill.
   - Other projects' managed region (templates/_shared/working-under-nana-pi.md) carries neither, so their reviewers get a bare heading.

   Fix: one sealed lead line under MOVEMENT_HEADING, for example "Read every feature this names." Or state the gap as a known limit.

9. **NOTE: three honest variations are missing from the known limits.**
   - (a) A project whose local `main` lags its remote gets a movement that includes rows already landed upstream.
   - (b) A ledger the tree checker rejects can mislead quietly. In memory, a row with three cells dropped out, and the report read `tree movement: none`. A duplicate ID read as `text changed`. The suite still catches both in nana-pi; other projects may not run it.
   - (c) For a local `main` that is not the lane base, the report is computed against `main` and says so only by its revisions.

   Fix: add the three lines to pd:172-183.

10. **NOTE: MOVEMENT_MAX_BYTES is sized to the buffer, not the reader.**
    - 16 MiB is millions of tokens, and no reviewer child takes that much. The real bound is the reviewer's context.
    - Today's largest report, 81 KB, is about 20–25 thousand tokens and fits.

    Fix: say so in the provenance, and keep the known limit from item 1. No cut line is needed at measured sizes.

11. **NOTE: the shared test helper has two traps.**
    - `tests/ledger-repo.mjs` sits in a test root. So R-917's source scan (test-runner.test.mjs:646-662) fails on any `mkdtempSync` call in it, and it requires the exact line `import { tmpDir } from "./tmp-dir.mjs";` if the helper calls `tmpDir`.
    - Its precedent, requirements-moved.test.mjs:47-60 and :140-158, is private fixture code. The 2026-10-22 ruling asks the Precedent section to name the move.

    Fix: the helper takes its folder from the caller. Either requirements-moved.test.mjs imports the helper as well, or the plan says why it keeps its own copy.

12. **NOTE: five stated facts are wrong; the conclusions stand.**
    - pd:57 cites REQUIREMENTS.md:2646 and :2649 as win-test-limits' rows. Those are R-2667 and R-2670, from 6406ea8e "Harden Windows-sensitive suite checks" (2026-10-23). The win-test-limits rows are R-2880–R-2885, at :2650-2655.
    - pd:21 says six known bugs. docs/known-bugs/FEAT-007.md:13-19 holds seven timeline lines.
    - pd:54 says claude-review reads the brief at :83. It reads it at :82.
    - pd:45 says the launchers run the main checkout's copy. They run the copy beside whichever launcher started: from PATH that is the main checkout, and from a worktree it is the worktree's copy, as in the independent check.
    - pd:113 gives MOVEMENT_SCRIPT_URL's provenance as the rule's `$HOME/nana-pi` path. That path differs from the pack-relative URL on a checkout kept elsewhere.

13. **NOTE: the timeline park's reason names the wrong reader.**
    - The timeline lane's must-meet ("Reader" section) names the owner at land, reading it through the seat's land report.
    - pd:63 calls it "a view the seat opens on demand".
    - The park is right: no run makes it and no code reads it. The deletion condition is fair too.

    Fix: "…the owner reads it in the seat's land report when the seat runs it, and no code reads it…".

14. **NOTE: the planner's least-sure point holds; add one README line.**
    - The process call follows mutation-runner's TS_CHECK_ARGS (mutation-runner-config.mjs:122, used at mutation-runner.mjs:489-490).
    - `scripts/` ships with the package (code-map.config.json `$comment`).
    - Moving roughly 1,400 lines into `packages/` would touch the frozen page's imports.
    - The pack README must state the new runtime dependency (AGENTS.md: every README states its runtime dependencies). pi-review and claude-review now start a repo script that needs Node's type stripping, Node 22.18 or later.
