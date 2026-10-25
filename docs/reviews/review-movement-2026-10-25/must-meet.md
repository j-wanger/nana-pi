# review-movement · must-meet of record (seat, 2026-10-25)

Feature: FEAT-007 · Review a specific revision independently

Written by the seat from the planner's draft (`plan-draft.md`, this folder) and one adversary pass (`plan-attack.md`, this folder; 1 MUST, 4 SHOULD, 9 NOTE). The seat took the MUST, all four SHOULDs and all nine NOTEs; the seat decisions below say how each landed. The draft's lane B sketch (outline-park) is folded into this lane, so there is no lane B. Plans get no review round. Where this file and the draft differ, this file holds; the draft keeps the subtraction table, the rejected alternatives and the measurements.

The owner's decision, 2026-10-25: the owner picked "Hand-made deliverables (Recommended)" after the six lanes of 2026-10-25 landed. The pick covers the three deliverables the checker still counts as neither made and read by code nor parked: R-1460 (tree movement report), R-1560 (review timeline) and R-291 (tree outline).

Spend line: the current priority since 2026-10-23, every listed deliverable made by an existing run and read by code, or parked with a reason. On main at d3f7f7f3 the tree checker prints `deliverables: 20 of 23 made and read by code, 19 parked`. After this lane it should print `deliverables: 21 of 21 made and read by code, 21 parked` (the adversary rebuilt the ledger in memory with the claim lines and both park lines and saw this line with no note).

Stakes: high blast, reversible. Every review and land review after the land runs through the two changed launchers. A throw would refuse every review and so stop every land; a wrong prompt would mislead every reviewer. R-2902 and R-2908 pin that a movement that cannot be computed never refuses a review, on both launchers. A revert restores main.

Threat model: honest variation in our tools' output, files and environment is in scope. Deliberate forgery is out, such as a hand-planted ledger, a crafted fake `node` or `git` on PATH, or a brief that lies about the movement. A finding outside this model is a residual. The honest variations:

- a reviewed tree whose HEAD commit holds no `REQUIREMENTS.md` (every project without a ledger, every existing launcher test repository);
- a `REQUIREMENTS.md` present only in the working tree, untracked or with uncommitted edits, including pi-review's dirty-tree snapshot reviews;
- no local `main` branch (a project on `master` or `trunk`), or no merge base with `main`;
- a lane on `main` itself, so the report is `tree movement: none`;
- a report longer than 64 KiB (a lift or regroup lane). Measured 2026-10-25: from the ledger's first commit (c0a78493) to main the report is 81,097 bytes; a pipe and `spawnSync` both receive exactly 65,536 bytes with status 0, because the script's last line calls `process.exit(main())` (`scripts/requirements-moved.mjs:337`) before the pipe drains;
- a section longer than the Windows command line (32,767 characters): a lift-sized movement (34,397 bytes) or a 200-commit one (24,505 bytes) plus a brief already in argv;
- a cold `node` start on a loaded Windows runner, and stderr lines ending in `\r`;
- a Node warning or an uncaught module error printed on the script's stderr;
- a tree path with spaces or quotes, on Windows and POSIX;
- a launcher started through a linked checkout folder (the R-1630 case, `packages/nana-pack/tests/linked-launch.test.mjs:71-73`);
- the seat committing in the tree between claude-review's movement run and review-ledger's admission;
- a lane that edits `scripts/requirements-moved.mjs` itself: each launcher runs the copy beside it, so a launcher started from PATH runs the main checkout's copy and one started from a worktree runs that worktree's copy;
- a local `main` that lags its remote, or is not the lane's base.

## Seat decisions

- **One feature, three deliverables decided.** R-1460 (tree movement report) is MADE by the review launchers and READ in the reviewer's prompt. R-1560 (review timeline) is PARKED in CAP-02's own field block. R-291 (tree outline) is PARKED in CAP-07's own field block in this lane (attack item 4: lane B is folded in). The two park lines and R-1460's claim lines are capability field lines, not feature spans, so folding them keeps the lane one feature, FEAT-007. No FEAT-028 row changes; FEAT-028's script changes one line (below).
- **Class hook, larger builder, no local install check.** The lane changes the review tools claude-review and pi-review. Ladder: the roster's final reviewer (Opus via claude-review), the land reviewer (astra via pi-review), the seat's wrong-code pairs, one independent check. No file under `packages/nana-setup/` and no hook changes, so no local install check, as the land-records lane ruled (`docs/reviews/land-records-2026-10-24/must-meet.md:70`). Builder: `pi-worker --lane-size larger`. Main at d3f7f7f3.
- **One shared helper, two callers from birth.** A new `packages/nana-pack/lib/review-movement.mjs` exports `reviewMovementSection(tree, { run })`. It returns `null` or the section text and never throws. claude-review and pi-review import it, as both import `readReviewStandard` (`packages/nana-pack/lib/review-standard.mjs:14`; `bin/claude-review.mjs:15`, `bin/pi-review.mjs:37`). The process runner is injected with a `spawnSync` default.
- **What a section is.** `MOVEMENT_HEADING`, a blank line, `MOVEMENT_LEAD`, a blank line, then the body. The body is the script's stdout with trailing newlines trimmed, or one line: `MOVEMENT_NOT_COMPUTED`, a space, then the reason. The lead is one sealed line (attack N8), because other projects' managed region carries no rule telling the reviewer what to do with the section.
- **What the helper does.** It runs `git cat-file -e HEAD:./REQUIREMENTS.md` in the tree, as `scripts/requirements-moved.mjs:313` does; a non-zero result returns `null`. Otherwise it runs `process.execPath` with `MOVEMENT_NODE_ARGS`, the path of `MOVEMENT_SCRIPT_URL`, `--root <tree> --base MOVEMENT_BASE`: an argument array, no shell, `cwd` the tree, `timeout` MOVEMENT_TIMEOUT_MS, `maxBuffer` MOVEMENT_MAX_BYTES. `MOVEMENT_NODE_ARGS` starts with `--no-warnings`, as `TS_CHECK_ARGS` does (`packages/nana-pack/lib/mutation-runner-config.mjs:122`). Exit 0 gives the report body. Anything else gives the not-computed body; its reason is the first non-empty stderr line split on `/\r?\n/`, else the spawn error code, else `exit <status>` or `signal <name>`.
- **Never refuse a review over the movement.** A not-computed line tells the reviewer and the seat. A refusal would block every review in a project whose lanes do not branch from `main`.
- **Which copy runs.** `MOVEMENT_SCRIPT_URL` is `new URL('../../../scripts/requirements-moved.mjs', import.meta.url)` in the config module: the copy beside whichever launcher started. nana-pi installs as one package (`code-map.config.json` `$comment`), so the script ships wherever the launchers do.
- **A process call across the layer line, declared.** A package may not import `scripts/` (`code-map.config.json` layers). requirements-moved imports `scripts/deliverables.mjs` and `scripts/requirements-tree.mjs`, about 1,400 lines, and `scripts/product-report.mjs` imports both; moving them into `packages/` would touch the frozen page's import graph. So the helper starts the script as a process, as `packages/nana-pack/lib/mutation-runner.mjs:489-490` starts `scripts/ts-syntax-check.mjs`. The helper's `@inputs` and `@effects` name the script; the code map shows no edge (known limit).
- **claude-review.** The section goes between the brief's text and `STANDARD_HEADING` (`bin/claude-review.mjs:86`): brief, blank line, section, blank line, standard heading, then as today. The helper runs after the brief (`:82`) and the standard (`:84-85`) are read and before review-ledger starts (`:92`), so nothing is reserved while it runs. With `null`, the prompt is byte for byte today's.
- **pi-review passes the section as a file (MUST 1).** pi-review writes the section to `MOVEMENT_FILE_NAME` in its own `mkdtempSync(join(tmpdir(), MOVEMENT_FOLDER_PREFIX))` folder, outside the checkout, and passes that path as a third `--append-system-prompt`, after the review standard's (`bin/pi-review.mjs:203`). pi takes `<text|path>` (pi 1.0.2 `docs/cli.md:219`); the precedent is `bin/pi-worker.mjs:172-179` and `:209`, removed at `:77`. An extra file inside the checkout would change the reviewed snapshot, since `complete` derives the revision there (`:214`). The `finally` block removes the folder beside `removeWorktree` (`:229-230`). With `null`, pi-review appends nothing and makes no folder.
- **Where pi-review computes it (design note, not a row).** The helper runs in the immutable checkout once its revision is verified (`bin/pi-review.mjs:170-172`) and before admission (`:194`). The checkout is created at the source's HEAD (`:162`), so no test can tell this from a run in the source tree; R-2901 does not claim it (attack SHOULD 5).
- **pi-review's failure paths (SHOULD 5).** A not-computed section still goes as a file. A failed folder or file write appends the section with the not-computed body and the reason `section file: <code>` as text in its place, and never throws. No one-place fake can force that write to fail without also failing the checkout (both use `tmpdir()`), so it is a known limit, not a test.
- **R-2561 widens; R-1105 and R-974 hold.** R-2561's text (`REQUIREMENTS.md:692`) becomes: "The standard input claude-review gives the reviewer shall be the brief's text, then any tree movement section, then the review standard's text exactly once, then the reviewer sentence naming the item and the reviewed tree and holding its read-only and plain-verdict clauses." Its test and title stay; its fixture commits no ledger, so its exact-prompt check holds (`packages/nana-pack/tests/claude-review.test.mjs:149-155`). R-1105 counts the standard once after the immutable sentence (`packages/nana-pack/tests/immutable-review.test.mjs:176-183`); a later append keeps it true.
- **The pipe fix, in FEAT-028's script.** `scripts/requirements-moved.mjs:337` changes from `process.exit(main())` to `process.exitCode = main()`, as `scripts/product-report.mjs:975` and `scripts/ci-records.mjs:41` end. Without it, both launchers would cut a large movement silently. Its rows (R-2906, R-2907) sit in FEAT-007 because the reviewer's whole prompt is what they pin, as win-flake-hardening placed R-2667 and R-2670 in FEAT-031 (`REQUIREMENTS.md:2646`, `:2649`) and win-test-limits placed R-2880 to R-2885 there (`:2650-2655`). No other script's exit line changes.
- **R-1460's claim lines (SHOULD 2).** CAP-07's lines at `REQUIREMENTS.md:2206-2207` become three:
  - `Made by: R-1460 · review: packages/nana-pack/bin/claude-review.mjs, packages/nana-pack/bin/pi-review.mjs, packages/nana-pack/lib/review-movement.mjs, scripts/requirements-moved.mjs · built from: A-030`
  - `Read by: R-1460 · prompt: packages/nana-pack/bin/claude-review.mjs, packages/nana-pack/bin/pi-review.mjs`
  - `Read by: R-1460 · person: the seat's land report points the owner to it`

  `review` is a maker run and `prompt` and `person` are reader kinds (`scripts/deliverables.mjs:25`, `:31`). The checker accepts several reader lines per row (R-1400 at `REQUIREMENTS.md:467-469`). A-030 is registered in FEAT-028 (`:2232`), R-1460's home, so the built-from check passes (`scripts/deliverables.mjs:673-686`). The land-records lane did the same for CAP-02 (R-2816, `:839`).
- **R-1560's park (attack N13).** After `REQUIREMENTS.md:474`, in CAP-02's own field block: `Parked: R-1560 · since 2026-10-25: the owner reads it in the seat's land report when the seat runs it, and no code reads it; a launcher that gives a confirmation round the earlier rounds' findings deletes this line`. Its made and read lines stay.
- **R-291's park (attack item 4).** After `REQUIREMENTS.md:2205`, in CAP-07's own field block: `Parked: R-291 · since 2026-10-25: the suite fails on a stale copy and no code reads the outline; a run that writes the outline and code that reads it delete this line`. Its made and read lines stay, so A-031 keeps its person reader. The checker reads a deliverable `Parked:` line only among a capability's own field lines (`scripts/deliverables.mjs:532-580`); both parks have two parts, a listed row, a `since` date and a reason with no ` · `, and neither row is made and read by code. A `Parked: R-nnnn` line inside a feature span would draw `cannot read Parked: line` (`:430`).
- **Rule text (SHOULD 2).** `AGENTS.md:157` (nana-pi's own section, outside the managed markers at `:68-103`) and `packages/nana-pack/skills/requirements/SKILL.md:142` drop "run it by hand and paste it into the review brief". They say: pi-review and claude-review add the tree movement, computed against main, to every reviewer's prompt, and the reviewer reads every feature it names; the seat's land report points the owner to the movement, in the review folder or the brief, instead of pasting it. No test pins either sentence.
- **README.** The pack README's review-standard paragraph (`packages/nana-pack/README.md:182-187`) and claude-review paragraph (`:198-202`) gain one sentence each on the section, its place and its not-computed line. Its **Dependencies** paragraph (`:6-12`) gains the new runtime dependency (attack N14): the launchers start the repository's `scripts/requirements-moved.mjs`, which needs Node's type stripping, Node 22.18 or later. Written, not pinned beyond `readme:check`.
- **Headers and map.** claude-review's and pi-review's `@inputs`, `@outputs` and `@effects` gain the movement (pi-review also its temp file). `npm run map` and `npm run req:tree` are regenerated.
- **Shared test helper (N11).** A new `packages/nana-pack/tests/ledger-repo.mjs` builds ledger repositories and the file-written expected report. It takes its folder from the caller and calls neither `mkdtempSync` nor `tmpDir` (R-917's scan, `packages/nana-pack/tests/test-runner.test.mjs:653-662`). requirements-moved.test.mjs's private fixture code moves into it, the git runner and ledger writer (`:24-43`), the ledger text form (`:47-60`) and the main and `feat/x` build (`:140-158`), and requirements-moved.test.mjs imports it with its checks' text and titles unchanged. Expected reports come from a run of the real script with stdout to a file, never a pipe.
- **Not in this lane.** No change to nana-land, review-ledger, review-round, review-timeline, the review standard, the outline's generator, the page code, or any other script's exit line. No `--base` option on the launchers: the working pattern bases every lane on main, and a flag would bring back a hand step.
- **Page effect.** No page code changes. The page's data changes: FEAT-007 gains nine rows, R-1460 shows as made and read by code, and R-1560 and R-291 show as parked (inferred from `scripts/deliverables.mjs:687-688`, which the page shares).
- **This lane's own reviews.** They run the main checkout's launchers, which predate the change, so the seat pastes the movement into this lane's briefs one last time.

## Must-meet rows (FEAT-007, SUB-008, after R-1354 at `REQUIREMENTS.md:720`)

Nine rows, R-2900 to R-2908, `untested` until each check passes, then `implemented`. R-2909 to R-2919 stay free. Every assertion imports MOVEMENT_HEADING, MOVEMENT_LEAD, MOVEMENT_BASE and MOVEMENT_NOT_COMPUTED from the config module and never writes their literals. Ledger fixtures and expected reports come from `tests/ledger-repo.mjs`. The large fixture's lane branch adds 3,000 rows (R-1000 to R-3999), written in one pass.

- **R-2900.** WHEN the reviewed tree's HEAD commit holds a REQUIREMENTS.md, claude-review shall send, between the brief's text and the review standard's heading, exactly one tree movement section holding MOVEMENT_LEAD and the movement command's report for that tree against MOVEMENT_BASE.
  - Test: `packages/nana-pack/tests/claude-review.test.mjs::R-2900: claude-review sends one tree movement section, computed in the reviewed tree against main, between the brief and the review standard`.
  - Fixture: a repository on `main` with a one-feature ledger, then branch `feat/x` adding row R-002, committed. The launcher runs with `cwd` outside the repository. The test first asserts the expected report names `R-002 new`, then that the prompt equals brief, blank line, section, blank line, standard heading, standard, sentence.
  - Red: no section; the section after the standard; the section twice; `--base HEAD` (report `tree movement: none`, no R-002); `--root` or `cwd` from the launcher's `cwd` (a not-computed line); a heading other than MOVEMENT_HEADING; no lead line.
- **R-2901.** WHEN the reviewed revision's commit holds a REQUIREMENTS.md, pi-review shall pass the pi child exactly one tree movement section, holding MOVEMENT_LEAD and computed against MOVEMENT_BASE, as an appended system prompt file after the review standard, kept outside the reviewed checkout and removed when pi-review exits.
  - Test: `packages/nana-pack/tests/immutable-review.test.mjs::R-2901: pi-review appends one tree movement section as a file outside the checkout, computed against main, after the review standard, and removes the file when it exits`.
  - Fixture: a second small repository from the shared helper, launched with the file's fake pi (`:30-46`), which copies each `--append-system-prompt` value that names an existing file before it exits, as `worker-lane.test.mjs:60-69` does. The test reads the observed argv and the copy.
  - Red: no third append; the section before the standard; the section twice; `--base HEAD`; the section passed as argv text; the file written inside the checkout; the folder left behind after exit; no lead line.
- **R-2902.** IF the movement command exits non-zero for a tree whose HEAD commit holds a REQUIREMENTS.md, THEN claude-review shall send one tree movement section whose body is the single line MOVEMENT_NOT_COMPUTED followed by the command's first stderr line, and record the review's round.
  - Test: `packages/nana-pack/tests/claude-review.test.mjs::R-2902: a movement that cannot be computed reaches the reviewer as one not-computed line and the review still records its round`.
  - Fixture: the shared helper's repository on `trunk`, with no `main`, so the merge base fails. The expected reason is the first non-empty stderr line of the real script run in that repository.
  - Red: exit 1 and no round (a thrown helper); no section (a `null` on failure); a line with no reason; a stack.
- **R-2903.** IF the reviewed tree's HEAD commit holds no REQUIREMENTS.md, THEN claude-review shall send no tree movement heading, even when the working tree holds an untracked REQUIREMENTS.md.
  - Test: `packages/nana-pack/tests/claude-review.test.mjs::R-2903: a tree with no committed ledger gets no tree movement section, even with an untracked ledger in the working tree`.
  - Expect: the prompt equals brief, standard heading, standard and sentence exactly.
  - Red: a working-tree `existsSync` in place of the HEAD check; the HEAD check removed (a not-computed line); a `tree movement: none` section for an absent ledger.
- **R-2904.** IF the reviewed revision's commit holds no REQUIREMENTS.md, THEN pi-review shall pass the pi child no tree movement heading.
  - Test: `packages/nana-pack/tests/immutable-review.test.mjs::R-2904: pi-review appends no tree movement section for a revision with no committed ledger`, on the file's existing main launch (`:137-139`), whose repository commits no ledger. It asserts exactly two `--append-system-prompt` values.
  - Red: an empty appended system prompt or file; a `none` section; a not-computed line.
- **R-2905.** This repository's requirements ledger shall list R-1460 as a CAP-07 deliverable whose `Made by:` is a review line naming `packages/nana-pack/lib/review-movement.mjs` and built from A-030, with one `Read by:` prompt line naming claude-review and pi-review and one `Read by:` person line naming the seat's land report.
  - Test: `packages/nana-pack/tests/review-movement.test.mjs::R-2905: the ledger lists the tree movement report as a CAP-07 deliverable made by the review launchers, read in the reviewer's prompt and pointed to by the seat's land report`, sliced as `packages/nana-pack/tests/land-records.test.mjs:268-277` does.
  - Red: R-1460's `Made by:` back to manual; its prompt `Read by:` back to rule; the person `Read by:` missing; the helper missing from the maker paths.
- **R-2906.** WHEN the tree movement report for the reviewed tree is longer than 64 KiB, claude-review shall send the movement command's whole report in the tree movement section.
  - Test: `packages/nana-pack/tests/claude-review.test.mjs::R-2906: a tree movement report longer than 64 KiB reaches the reviewer whole`.
  - Fixture: the shared helper's large branch. The test asserts the file-written report is longer than PIPE_CUT_BYTES, a test constant of 65,536 (measured 2026-10-25: the macOS pipe cut), then compares the section's body byte for byte.
  - Red: `process.exit(main())` back at `scripts/requirements-moved.mjs:337` (macOS); a helper `maxBuffer` of 65,536 (a not-computed line); the helper call removed.
- **R-2907.** WHEN the tree movement section is longer than 32,767 characters, pi-review shall pass the pi child the whole section.
  - Test: `packages/nana-pack/tests/immutable-review.test.mjs::R-2907: a tree movement section longer than 32,767 characters reaches the pi reviewer whole`. It runs on every platform, so CI's Windows leg pins it.
  - Fixture: the shared helper's large branch. The test asserts the expected section is longer than COMMAND_LINE_MAX_CHARS, a test constant of 32,767 (contract: the Windows command-line limit), then compares the pi child's copy of the section byte for byte, whether it arrived as a file or as argv text.
  - Red: the section passed as argv text (Windows CI: the spawn fails); a helper `maxBuffer` of 65,536; `process.exit(main())` back (macOS); the append removed.
- **R-2908.** IF the movement command exits non-zero for a reviewed revision whose commit holds a REQUIREMENTS.md, THEN pi-review shall pass the pi child exactly one tree movement section whose body is MOVEMENT_NOT_COMPUTED followed by the command's first stderr line, record the review's round and exit 0.
  - Test: `packages/nana-pack/tests/immutable-review.test.mjs::R-2908: on a repository with no main branch, pi-review appends one not-computed tree movement section, records its round and exits 0`.
  - Fixture: a `trunk`-only repository from the shared helper with a committed ledger. The expected reason comes from the real script as in R-2902.
  - Red: exit 1 and no round (a thrown helper); no section (a `null` on failure); a line with no reason.

## Seal

`packages/nana-pack/tests/review-movement.test.mjs::seal: the tree movement section is headed ## Tree movement with its lead line, computed against main by the pack's own requirements-moved within 30 seconds and 16 MiB, and a failed run reads tree movement: not computed:`, marked `req: R-2900 R-2901 R-2902 R-2906 R-2907 R-2908`. It asserts each sealed value below against its literal, as `packages/nana-pack/tests/build-records.test.mjs:315-316` does, and that `fileURLToPath(MOVEMENT_SCRIPT_URL)` is this repository's `scripts/requirements-moved.mjs`.

## Tunables

In a new `packages/nana-pack/lib/review-movement-config.mjs` (six-tag header, effects none), the form of `packages/nana-pack/lib/claude-review-config.mjs:1-29`. Every other assertion imports the name.

| Name | Value | Provenance |
|---|---|---|
| MOVEMENT_HEADING | `## Tree movement` | contract: R-2900, R-2901; chosen beside `STANDARD_HEADING` (`claude-review-config.mjs:24`). Sealed. |
| MOVEMENT_LEAD | `Read every feature this names before you judge the change.` | chosen 2026-10-25 (attack N8): other projects' managed region carries no rule naming the reviewer's duty. Sealed. |
| MOVEMENT_BASE | `main` | contract: the working pattern's lane base and the rule's `--base main` (`AGENTS.md:157`). Sealed. |
| MOVEMENT_NOT_COMPUTED | `tree movement: not computed:` | contract: R-2902, R-2908; the command's own `tree movement` prefix (`scripts/requirements-moved.mjs:280`). Sealed. |
| MOVEMENT_TIMEOUT_MS | `30_000` | measured 2026-10-25: 0.24 to 0.30 s for nana-pi's 2,038-row ledger on the seat's Mac; chosen at about 100 times for a cold loaded Windows start. Sealed. |
| MOVEMENT_MAX_BYTES | `16 * 1024 * 1024` | measured 2026-10-25: the largest real report, from the ledger's first commit to main, is 81,097 bytes; chosen about 200 times that. It bounds the spawn buffer, not the reader: the reviewer's context is the real bound (attack N10). Sealed. |
| MOVEMENT_SCRIPT_URL | `new URL('../../../scripts/requirements-moved.mjs', import.meta.url)` | contract: the same script the rule names (`AGENTS.md:157`), resolved beside the running pack, so a launcher runs the copy beside it, not a fixed home path. Sealed. |
| MOVEMENT_NODE_ARGS | `['--no-warnings']` | contract: `TS_CHECK_ARGS`'s first element (`mutation-runner-config.mjs:122`); chosen so a Node warning never becomes the reason (attack N6). Not sealed. |
| MOVEMENT_FOLDER_PREFIX | `nana-movement-` | chosen: names its owner in the OS temp folder and cannot match pi-review's reclaim pattern `^nana-review-(\d+)-` (`bin/pi-review.mjs:88`). Not sealed. |
| MOVEMENT_FILE_NAME | `tree-movement.md` | chosen: a plain name a reader of the child's argv recognizes. Not sealed. |

Test constants, defined once beside their use with provenance: PIPE_CUT_BYTES `65_536` in claude-review.test.mjs (measured 2026-10-25: the macOS pipe cut); COMMAND_LINE_MAX_CHARS `32_767` in immutable-review.test.mjs (contract: the Windows command-line limit).

## Seat wrong-code pairs

Each must turn its rows red. Pair 13's R-2907 half runs only on CI's Windows leg (a scratch Windows CI push, as earlier Windows pairs did); pairs 15 and 16 are macOS-only for the pipe; the rest run on macOS.

1. claude-review's helper call removed → R-2900, R-2906.
2. claude-review's section placed after the review standard → R-2900.
3. claude-review's section inserted twice → R-2900.
4. The helper's `--base` set to `HEAD` → R-2900, R-2901.
5. The helper's `cwd` and `--root` set to `process.cwd()` → R-2900 (the launcher runs outside the repository).
6. The helper writes the literal `## Tree moves` in place of MOVEMENT_HEADING → R-2900, R-2901.
7. The helper leaves out MOVEMENT_LEAD → R-2900, R-2901.
8. The helper throws on a non-zero exit → R-2902, R-2908.
9. The helper returns `null` on a non-zero exit → R-2902, R-2908.
10. The helper writes the not-computed line with no reason → R-2902, R-2908.
11. The helper checks the working tree with `existsSync` in place of `git cat-file` → R-2903.
12. The helper's HEAD check removed → R-2903, R-2904.
13. pi-review passes the section as argv text in place of a file → R-2901 (every platform); R-2907 (Windows CI only).
14. pi-review writes the section file inside the checkout → R-2901.
15. `scripts/requirements-moved.mjs:337` back to `process.exit(main())` → R-2906, R-2907 (macOS).
16. The helper's `maxBuffer` set to 65,536 → R-2906, R-2907.
17. pi-review's movement append removed → R-2901, R-2907.
18. pi-review's movement appended before the review standard → R-2901.
19. pi-review appends an empty file when the helper returns `null` → R-2904.
20. pi-review's `finally` no longer removes the movement folder → R-2901.
21. R-1460's `Made by:` line back to its manual text → R-2905.
22. R-1460's person `Read by:` line removed → R-2905.
23. MOVEMENT_BASE retuned to `master` → seal, R-2900, R-2901.
24. MOVEMENT_TIMEOUT_MS retuned to 10,000 → seal.

No one-place edit expresses R-2902's "the whole stderr" case: the trunk fixture's refusal is one line, so the first-line rule is written, not pinned (known limit). No one-place edit forces pi-review's section-file write to fail (known limit). The seat re-runs the mutation runner after any change of its own to code or tests.

## Precedent (verified at main d3f7f7f3)

- Shared launcher helper with two callers: `packages/nana-pack/lib/review-standard.mjs:1-25`, imported at `packages/nana-pack/bin/claude-review.mjs:15` and `packages/nana-pack/bin/pi-review.mjs:37`.
- A file next to the code, resolved by URL: `packages/nana-pack/lib/review-standard.mjs:12`; `packages/nana-pack/bin/claude-review.mjs:32`.
- A package starting a `scripts/` file as a process: `packages/nana-pack/lib/mutation-runner.mjs:489-490`, with `--no-warnings` from `packages/nana-pack/lib/mutation-runner-config.mjs:122`.
- Config form with provenance: `packages/nana-pack/lib/claude-review-config.mjs:1-29`.
- claude-review's prompt: brief read at `packages/nana-pack/bin/claude-review.mjs:82`, standard at `:84-85`, prompt at `:86`; review-ledger start at `:88-95`.
- pi-review's appended prompts: `packages/nana-pack/bin/pi-review.mjs:203`; checkout made at `:160-164` and verified at `:170-172`; admission at `:194`; git without a shell at `:73-77`; `complete` in the checkout at `:214`; the `finally` and `removeWorktree` at `:229-230` and `:102-120`.
- A prompt file in the launcher's own temp folder, passed by path to pi and removed: `packages/nana-pack/bin/pi-worker.mjs:172-179`, `:209`, `:77`.
- Ledger presence at HEAD: `scripts/requirements-moved.mjs:313`; merge-base refusal text at `:299-303`; report prefix at `:280`; row change words at `:164-182`.
- Exit code without cutting a pipe: `scripts/product-report.mjs:975`; `scripts/ci-records.mjs:41`.
- Ledger fixture on `main` and `feat/x` (moves to the shared helper): `packages/nana-pack/tests/requirements-moved.test.mjs:24-43`, `:47-60`, `:140-158`.
- claude-review harness: `packages/nana-pack/tests/claude-review.test.mjs:28-38` (`makeRepo`), `:64` (`writeFakeClaude`), `:94` (`runLauncher`), `:133-156` (R-2561's prompt case).
- pi-review harness: `packages/nana-pack/tests/immutable-review.test.mjs:30-46` (fake pi recording argv), `:92-100` (repository on `main`), `:137-141` (main launch), `:176-183` (R-1105's check).
- A fake pi copying each appended file before it exits: `packages/nana-pack/tests/worker-lane.test.mjs:60-69`.
- Ledger-line pin: `packages/nana-pack/tests/land-records.test.mjs:268-277` (R-2816).
- Seal form: `packages/nana-pack/tests/build-records.test.mjs:315-316`.
- Shared test helper form, caller-supplied folder: `packages/nana-pack/tests/slow-sampler.mjs:1-8`; `packages/nana-pack/tests/fake-pi.mjs:1-12`.
- R-917's temp-source scan the helper must pass: `packages/nana-pack/tests/test-runner.test.mjs:653-662`.
- Capability claim and park lines: `REQUIREMENTS.md:466-476` (CAP-02), `:2204-2211` (CAP-07); the checker at `scripts/deliverables.mjs:532-580`, `:673-688`.
- Rows for other features' tests in one feature: `REQUIREMENTS.md:2646`, `:2649`, `:2650-2655`.

Helper move (the 2026-10-22 second-caller ruling): requirements-moved.test.mjs's private git runner, ledger writer, ledger text form and main and `feat/x` build move to the new `packages/nana-pack/tests/ledger-repo.mjs`; requirements-moved.test.mjs, claude-review.test.mjs and immutable-review.test.mjs import it. No product helper moves; the movement helper is shared from birth.

## Class and builder

Hook class: the lane changes two review tools, claude-review and pi-review. The ladder:

- the roster's final reviewer (`reviewer: claude-code opus`, through claude-review);
- the land reviewer (`land: openai-codex gpt-6-astra`, through pi-review);
- the seat's wrong-code pairs above, and the mutation runner after any seat change;
- one independent check.

No local install check: no file under `packages/nana-setup/` and no hook changes. Builder: the roster's larger builder, `pi-worker --lane-size larger`. The code is small, but every later review runs through it and pi-review's tests are slow and Windows-sensitive. The seat pushes the draft pull request at build 1, and reads R-2907 on its Windows leg before the review brief; that reading is a condition of the review brief.

## The independent check

Run with `HOME` and `PI_CODING_AGENT_DIR` set to a scratch folder holding a roster whose `reviewer` is a Claude Code entry, so nothing reaches the real roster or review ledger. Make a scratch clone of nana-pi and set its `main` to c0a78493, the ledger's first commit, so the report runs 81,097 bytes. Run the worktree's claude-review with a fake `claude` and the worktree's pi-review with a fake `pi` against that clone's tip. Compare each section's body byte for byte with the script's file-written report. Repeat on a clone with no `main` for one not-computed line on each launcher, and on a ledger-free repository for no section. Condition: the seat has read R-2907 passing on the draft pull request's Windows leg before the review brief.

## Known limits (the seat writes them to FEAT-007's file before the final round)

- The movement reads HEAD's committed ledger. A dirty-tree review with uncommitted ledger edits reads none, or leaves the edits out, with no sign of it.
- claude-review computes the movement at launch; a commit before admission can make the section's head differ from the reviewed revision. A report with changes names its head in its first line; `tree movement: none` names no revision.
- The base is always the local `main`. A project that branches lanes from elsewhere gets a not-computed line or a movement against `main`, and says so only by its revisions.
- A local `main` that lags its remote gives a movement that includes rows already landed upstream.
- A ledger the tree checker rejects can read `none` or `text changed` quietly; the suite catches both in nana-pi, and other projects may not run it.
- The code map shows no edge from the launchers to the movement command, because a process call is not an import.
- A reviewer started outside the two launchers, such as `review-ledger run` with a hand command, gets no section.
- A git failure while checking for the ledger reads as no ledger, so it gives no section rather than a not-computed line.
- A crash names its source location, not its cause: an uncaught module error prints a location first. A pack copied without the repository's `scripts/` folder, or a Node older than 22.18, gets such a line (inferred).
- Only a one-line refusal is tested; the first-line rule for a several-line stderr is written, not pinned.
- A failed section-file write in pi-review appends the not-computed line with the reason `section file: <code>`; no test forces it.
- A reviewer child whose context cannot hold the section fails the review. MOVEMENT_MAX_BYTES bounds the spawn buffer, not the reader; today's largest report is about 20 to 25 thousand tokens.
- No test can tell pi-review's movement run in the checkout from a run in the source tree; the checkout is made at the source's HEAD.
- Only a macOS run pins the pipe fix; CI's Linux leg writes pipes synchronously, so it cannot catch the old exit line (inferred from Node's process I/O notes; Windows not measured).
- Each launch in a tree with a ledger spends about 0.3 s before admission (measured on the seat's Mac).
- R-1560's `built from` names A-007 and A-008, while the timeline also reads the audit log, A-056 (`REQUIREMENTS.md:598`); unchanged.

FEAT-028's file gets one line: the other scripts ending in `process.exit(main())` can still cut piped output past 64 KiB on macOS: `scripts/requirements-tree.mjs:658`, `scripts/requirements-lift.mjs:1260`, `scripts/requirements-regroup.mjs:892`, `scripts/blast-radius.mjs:340`, `scripts/readme-check.mjs:35`.

## Notes the seat writes before the final round

- HANDOFF: a Landed line, and the deliverable count where it appears (`21 of 21 made and read by code, 21 parked`); then `nana-writing HANDOFF.md`.
- FEAT-007 known-bug lines: the timeline line at `docs/known-bugs/FEAT-007.md:19` ("nothing runs it automatically") now says it is parked, with the park's deletion condition; add the known limits above.
- FEAT-028 known-bug line: the other scripts ending in `process.exit(main())`.
- A session entry in `docs/sessions/`.
- The tree movement, `node "$HOME/nana-pi/scripts/requirements-moved.mjs" --root . --base main` run in the lane worktree, pasted into this lane's review and land briefs by hand one last time, since this lane's reviews run the main checkout's pre-change launchers.
- `docs/requirements-tree.md` and `docs/code-map.md` regenerated after any merge of main, with a confirmation round.
