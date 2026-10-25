# review-movement · plan draft (planner, 2026-10-25)

Feature: FEAT-007 · Review a specific revision independently

Source of the decision: the owner's pick on 2026-10-25, "Hand-made deliverables (Recommended)", made after six lanes landed. The pick covers the three deliverables the checker still counts as neither made and read by code nor parked. This draft decides each of the three, proposes two lanes, and makes the first lane the plan of record. Plans get no review round; the seat and one adversary turn this draft into the must-meet of record.

Spend line: the current priority since 2026-10-23, every listed deliverable made by an existing run and read by code, or parked with a reason. On main at d3f7f7f3 the checker prints `deliverables: 20 of 23 made and read by code, 19 parked`. After lane A it should print `21 of 22 ..., 20 parked`; after lane B, `21 of 21 ..., 21 parked`.

## The three decisions (subtraction test)

| Deliverable | Home | Who reads it today | What breaks if nobody makes it | Decision |
|---|---|---|---|---|
| R-1460 tree movement report | FEAT-028 (row at `REQUIREMENTS.md:2322`), listed by CAP-07 (`:2203`) | Every reviewer, through the brief: 253 committed review and land briefs under `docs/reviews/` carry it (`git grep -l "tree movement" -- 'docs/reviews/*brief*'`, 2026-10-25). | The reviewer cannot see a silent row rewording or a removed row. A brief pasted before a merge of main shows a stale movement against the reviewed tip. | **Make.** The review launchers compute it in the reviewed tree and put it in the reviewer's prompt. Lane A. |
| R-1560 review timeline | FEAT-007, SUB-010 (row at `:769`), listed by CAP-02 (`:465`) | The seat, on demand. No review folder holds a kept timeline (`git ls-files docs/reviews \| grep -i timeline` finds only the timeline lane's own plan files). | Nothing. nana-land reads the tally (A-007), lane folders keep the review texts (A-057), and `review-ledger report` prints one line per round. | **Park.** Its only reader is a person opening a view; making it for no code reader is ceremony. Rides in lane A, its own feature. |
| R-291 tree outline | FEAT-028 (row at `:2250`), listed by CAP-07 | People reading its diff. No code reads `docs/requirements-tree.md`; `--check` is a currency check, which the ledger prose (`:27`) says is not a reader. | Nothing at once. The suite already fails on a stale copy (`scripts/requirements-tree.mjs:644-653`), so it never drifts. After lane A the reviewer gets the structured movement in its prompt, which covers the diff's review use. | **Park.** A run that regenerates it would still have no code reader. Lane B, FEAT-028. |

Rejected alternatives, with reasons:

- nana-land computing the movement into the land record (A-082) and build-report printing it. That makes a code-made, code-read line for the checker, but the land reviewer already reviewed the same tip; nobody acts on it. Ceremony.
- A builder launcher regenerating the outline. pi-worker would write tracked files after the builder's commit, leaving the worktree dirty, and still no code would read the outline.
- Feeding the timeline into a confirmation round's prompt. Its MUST reader knows five layouts and has six known bugs (`docs/known-bugs/FEAT-007.md:13-19`); that is a lane of its own, named as the park's deletion condition.

## Lanes and order

1. **Lane A, `review-movement`, FEAT-007 (plan of record below).** The two review launchers put the tree movement in every reviewer's prompt; R-1460's claim lines move to review and prompt; R-1560 is parked.
2. **Lane B, `outline-park`, FEAT-028 (sketch at the end).** One park line for R-291. It goes second because its reason cites lane A's result.

---

# Lane A · review-movement (plan of record)

Stakes: high blast, reversible. Every review and land review after the land runs through the two changed launchers. A throw would refuse every review and so stop every land; a wrong prompt would mislead every reviewer. R-2902 pins that a failed movement never refuses a review. A revert restores main.

Threat model: honest variation in our tools' output, files and environment is in scope. Deliberate forgery is out, such as a hand-planted ledger, a crafted fake `node` or `git` on PATH, or a brief that lies about the movement. A finding outside this model is a residual. The honest variations:

- a reviewed tree whose HEAD commit holds no `REQUIREMENTS.md` (every other project without a ledger, every launcher test repository);
- a `REQUIREMENTS.md` present only in the working tree, untracked or with uncommitted edits, including pi-review's dirty-tree snapshot reviews;
- no local `main` branch (a project on `master` or `trunk`), or no merge base with `main`;
- a lane on `main` itself, so the movement is `tree movement: none`;
- a movement report longer than 64 KiB (a lift or regroup lane). Measured 2026-10-25: from the ledger's first commit (c0a78493) to main the report is 81,097 bytes, and on macOS a piped run of `scripts/requirements-moved.mjs` stops at exactly 65,536 bytes with exit 0, because its last line calls `process.exit(main())` (`scripts/requirements-moved.mjs:337`) before the pipe drains;
- a cold `node` start on a loaded Windows runner;
- a tree path with spaces or quotes, on Windows and POSIX;
- a launcher started through a linked checkout folder (the R-1630 case, `packages/nana-pack/tests/linked-launch.test.mjs:71-73`);
- the seat committing in the tree between claude-review's movement run and review-ledger's admission;
- a lane that edits `scripts/requirements-moved.mjs` itself: the launchers run the main checkout's copy, as the seat's rule does today, not the lane's.

## Seat decisions

- **One shared helper, two callers from birth.** A new `packages/nana-pack/lib/review-movement.mjs` exports `reviewMovementSection(tree, { run })`. It returns `null` or the section text. claude-review and pi-review import it, as both import `readReviewStandard` (`packages/nana-pack/lib/review-standard.mjs:14`; `bin/claude-review.mjs:15`, `bin/pi-review.mjs:37`). The process runner is injected with a `spawnSync` default.
- **What the helper does.** It runs `git cat-file -e HEAD:./REQUIREMENTS.md` in the tree, as `scripts/requirements-moved.mjs:313` does. A non-zero result returns `null`: no ledger at HEAD means no section. Otherwise it runs `process.execPath <MOVEMENT_SCRIPT> --root <tree> --base MOVEMENT_BASE` with an argument array and no shell, `cwd` the tree, `timeout` MOVEMENT_TIMEOUT_MS and `maxBuffer` MOVEMENT_MAX_BYTES. Exit 0 gives `MOVEMENT_HEADING`, a blank line, then stdout with trailing newlines trimmed. Anything else gives `MOVEMENT_HEADING`, a blank line, then one line, `MOVEMENT_NOT_COMPUTED <reason>`: the first non-empty stderr line, else the spawn error code, else `exit <status>` or `signal <name>`. It never throws.
- **Never refuse a review over the movement.** A not-computed line tells the reviewer and the seat. A refusal would block every review in a project whose lanes do not branch from `main`.
- **Which copy runs.** `MOVEMENT_SCRIPT_URL` is `new URL('../../../scripts/requirements-moved.mjs', import.meta.url)` in the config module, the pack's own copy. nana-pi installs as one package (`code-map.config.json` `$comment`), so the script ships wherever the launchers do. This matches the rule's `node "$HOME/nana-pi/scripts/requirements-moved.mjs"` (`AGENTS.md:157`).
- **A process call across the layer line, declared.** A package may not import `scripts/` (`code-map.config.json` layers). requirements-moved imports `scripts/deliverables.mjs` and `scripts/requirements-tree.mjs`, about 1,400 lines, and `scripts/product-report.mjs` imports both; moving them into `packages/` would touch the frozen page's import graph. So the helper starts the script as a process, as `packages/nana-pack/lib/mutation-runner.mjs:489-490` starts `scripts/ts-syntax-check.mjs`. The helper's `@inputs` and `@effects` name the script; the code map shows no edge (known limit).
- **claude-review.** The section goes between the brief's text and `STANDARD_HEADING` (`bin/claude-review.mjs:86`): brief, blank line, section, blank line, standard heading, as today after that. The helper runs after the brief and standard are read (`:83-85`) and before review-ledger starts (`:92`), so nothing is reserved while it runs.
- **pi-review.** The section is a third `--append-system-prompt`, after the review standard's (`bin/pi-review.mjs:203`). The helper runs in the immutable checkout once its revision is verified (`:170-172`) and before admission (`:194`). The checkout's HEAD is the reviewed commit, so the movement names the reviewed head. With `null`, pi-review appends nothing.
- **R-2561 widens; R-1105 holds.** R-2561 says claude-review's input "shall be" brief, standard, sentence (`REQUIREMENTS.md:692`). It becomes: "...shall be the brief's text, then any tree movement section, then the review standard's text exactly once, then the reviewer sentence...". Its test and title stay; its fixture has no ledger, so its exact-prompt check still holds (`packages/nana-pack/tests/claude-review.test.mjs:149-155`). R-1105 counts the standard once after the immutable sentence (`packages/nana-pack/tests/immutable-review.test.mjs:176-183`); a later append keeps it true.
- **The pipe fix, in FEAT-028's script.** `scripts/requirements-moved.mjs:337` changes from `process.exit(main())` to `process.exitCode = main()`, as `scripts/product-report.mjs:975` and `scripts/ci-records.mjs:41` end. Without it, both launchers would cut a large movement silently. A departure from one feature: the row (R-2906) sits in FEAT-007 because the reviewer's whole prompt is what it pins, as win-test-limits placed rows for other features' tests in FEAT-031 (`REQUIREMENTS.md:2646`, `:2649`). No other script's exit line changes.
- **Ledger claim lines (CAP-07's own field block, not a feature span).** R-1460's two lines at `REQUIREMENTS.md:2206-2207` become:
  - `Made by: R-1460 · review: packages/nana-pack/bin/claude-review.mjs, packages/nana-pack/bin/pi-review.mjs, packages/nana-pack/lib/review-movement.mjs, scripts/requirements-moved.mjs · built from: A-030`
  - `Read by: R-1460 · prompt: packages/nana-pack/bin/claude-review.mjs, packages/nana-pack/bin/pi-review.mjs`

  `review` is a maker run and `prompt` a reader kind (`scripts/deliverables.mjs:25`, `:31`), and both need paths, which are tracked once the helper lands. A-030 is registered in FEAT-028 (`REQUIREMENTS.md:2232`), R-1460's home, so the built-from check passes (`scripts/deliverables.mjs:673-686`). These lines are capability fields; lane A changes no FEAT-028 row. The land-records lane did the same for CAP-02 (R-2816, `REQUIREMENTS.md:839`).
- **R-1560's park, in CAP-02's own field block.** After `REQUIREMENTS.md:474`: `Parked: R-1560 · since <the date the seat writes it>: the timeline is a view the seat opens on demand; nana-land reads the tally and the lane folders keep the review texts, so no run needs it; a launcher that gives a confirmation round the earlier rounds' findings deletes this line`. The checker reads a deliverable `Parked:` line only among the capability's own field lines (`scripts/deliverables.mjs:532-580`). It accepts this one: two parts, a listed row, a `since` date, a reason with no ` · `, and R-1560 is not made and read by code. A `Parked: R-nnnn` line inside a feature span would draw `cannot read Parked: line` (`scripts/deliverables.mjs:430`). The made and read lines stay.
- **Rule text.** `AGENTS.md:157` (outside the managed markers, `:68-103`) and `packages/nana-pack/skills/requirements/SKILL.md:142` stop telling the seat to run the command and paste it. They say pi-review and claude-review add the tree movement, computed against main, to every reviewer's prompt, and the reviewer reads every feature it names. The land-report clause goes: the land reviewer gets the movement through pi-review, and the owner's report follows the writing rule, which keeps row numbers out of prose. No test pins either sentence.
- **README.** The pack README's review-standard paragraph (`packages/nana-pack/README.md:182-187`) and claude-review paragraph (`:198-202`) gain one sentence each on the section, its place and its not-computed line. Written, not pinned.
- **Headers and map.** claude-review's and pi-review's `@inputs` and `@outputs` gain the movement. `npm run map` and `node scripts/requirements-tree.mjs --write` are regenerated.
- **Not in this lane.** No change to nana-land, review-ledger, review-round, the review standard, the timeline, the outline, the page code, or any other script's exit line. No `--base` option on the launchers: the working pattern bases every lane on main (`AGENTS.md` working pattern), and a flag would bring back a hand step.
- **Page effect.** No page code changes. The page's data changes: FEAT-007 gains seven rows, R-1460 shows as made and read by code, and R-1560 shows as parked (inferred from `scripts/deliverables.mjs:687-688`, which the page shares).
- **This lane's own reviews.** They run the main checkout's launchers, which predate the change. So the seat pastes the movement into this lane's briefs one last time.

## Must-meet rows (FEAT-007, SUB-008, after R-1354 at `REQUIREMENTS.md:720`)

Seven rows, R-2900 to R-2906, `untested` until each check passes, then `implemented`. R-2907 to R-2919 stay free. Every assertion imports MOVEMENT_HEADING, MOVEMENT_BASE and MOVEMENT_NOT_COMPUTED from the config module and never writes their literals. Ledger fixtures come from one shared test helper (see Precedent); expected movements come from that helper's run of the real script with stdout to a file, never a pipe.

- **R-2900.** WHEN the reviewed tree's HEAD commit holds a REQUIREMENTS.md, claude-review shall send, between the brief's text and the review standard's heading, exactly one tree movement section holding the movement command's report for that tree against MOVEMENT_BASE.
  - Test: `packages/nana-pack/tests/claude-review.test.mjs::R-2900: claude-review sends one tree movement section, computed in the reviewed tree against main, between the brief and the review standard`.
  - Fixture: a repository on `main` with a one-feature ledger, then branch `feat/x` adding row R-002, committed. The launcher runs with `cwd` outside the repository. The test first asserts the expected report names `R-002 new`.
  - Red: no section; the section after the standard; `--base HEAD` (report `tree movement: none`, no R-002); `--root` from `cwd` (a not-computed line); the heading twice; a heading other than MOVEMENT_HEADING.
- **R-2901.** WHEN the reviewed revision's commit holds a REQUIREMENTS.md, pi-review shall pass the pi child exactly one tree movement section, computed in the immutable checkout against MOVEMENT_BASE, as an appended system prompt after the review standard.
  - Test: `packages/nana-pack/tests/immutable-review.test.mjs::R-2901: pi-review appends one tree movement section, computed against main, after the review standard`.
  - Fixture: a second repository from the shared helper, launched with the file's fake pi (`:30-46`) and read from its observed argv.
  - Red: no section; the section before the standard; the section twice; `--base HEAD`.
- **R-2902.** IF the movement command exits non-zero for a tree whose HEAD commit holds a REQUIREMENTS.md, THEN claude-review shall send the tree movement section as one line, MOVEMENT_NOT_COMPUTED followed by the command's first stderr line, and record the review's round.
  - Test: `packages/nana-pack/tests/claude-review.test.mjs::R-2902: a movement that cannot be computed reaches the reviewer as one not-computed line and the review still records its round`.
  - Fixture: the shared helper's repository on `trunk`, with no `main`, so the merge base fails.
  - Red: exit 1 and no round (a thrown helper); no section; the whole stderr, several lines; a line with no reason; a stack.
- **R-2903.** IF the reviewed tree's HEAD commit holds no REQUIREMENTS.md, THEN claude-review shall send no tree movement heading, even when the working tree holds an untracked REQUIREMENTS.md.
  - Test: `packages/nana-pack/tests/claude-review.test.mjs::R-2903: a tree with no committed ledger gets no tree movement section, even with an untracked ledger in the working tree`.
  - Expect: the prompt equals brief, standard heading, standard and sentence exactly.
  - Red: a working-tree `existsSync` in place of the HEAD check; a not-computed line for an absent ledger; a `tree movement: none` section.
- **R-2904.** IF the reviewed revision's commit holds no REQUIREMENTS.md, THEN pi-review shall pass the pi child no tree movement heading.
  - Test: `packages/nana-pack/tests/immutable-review.test.mjs::R-2904: pi-review appends no tree movement section for a revision with no committed ledger`, on the file's existing main launch (`:137-139`), whose repository commits no ledger.
  - Red: an empty appended system prompt; a `none` section; a not-computed line.
- **R-2905.** This repository's requirements ledger shall list R-1460 as a CAP-07 deliverable whose `Made by:` is a review line naming `packages/nana-pack/lib/review-movement.mjs` and built from A-030, and whose `Read by:` is a prompt line naming claude-review and pi-review.
  - Test: `packages/nana-pack/tests/review-movement.test.mjs::R-2905: the ledger lists the tree movement report as a CAP-07 deliverable made by the review launchers and read in the reviewer's prompt`, sliced as `packages/nana-pack/tests/land-records.test.mjs:268-277` does.
  - Red: R-1460's `Made by:` back to manual; its `Read by:` back to rule; the helper missing from the maker paths.
- **R-2906.** WHEN the tree movement report for the reviewed tree is longer than 64 KiB, claude-review shall send the movement command's whole report in the tree movement section.
  - Test: `packages/nana-pack/tests/claude-review.test.mjs::R-2906: a tree movement report longer than 64 KiB reaches the reviewer whole`.
  - Fixture: the shared helper's branch adds 3,000 rows. The test asserts the file-written report is longer than PIPE_CUT_BYTES, a test constant of 65,536 (measured 2026-10-25: the macOS pipe cut), then compares byte for byte.
  - Red: `process.exit(main())` back at `scripts/requirements-moved.mjs:337` (macOS); a helper `maxBuffer` of 65,536 (a not-computed line); any cap below the report's length.

Seal: one test, `packages/nana-pack/tests/review-movement.test.mjs::seal: the tree movement section is headed ## Tree movement and computed against main by the pack's own requirements-moved within 30 seconds and 16 MiB, and a failed run reads tree movement: not computed:`, marked `req: R-2900 R-2901 R-2902 R-2906`. It asserts each value below against its literal, as `packages/nana-pack/tests/build-records.test.mjs:315-316` does, and that `fileURLToPath(MOVEMENT_SCRIPT_URL)` is the repository's `scripts/requirements-moved.mjs`.

Tunables, in a new `packages/nana-pack/lib/review-movement-config.mjs` (six-tag header, effects none), the form of `packages/nana-pack/lib/claude-review-config.mjs:1-29`:

| Name | Value | Provenance |
|---|---|---|
| MOVEMENT_HEADING | `## Tree movement` | contract: R-2900, R-2901; chosen beside `STANDARD_HEADING` (`claude-review-config.mjs:24`). Sealed. |
| MOVEMENT_BASE | `main` | contract: the working pattern's lane base and the rule's `--base main` (`AGENTS.md:157`). Sealed. |
| MOVEMENT_NOT_COMPUTED | `tree movement: not computed:` | contract: R-2902; the command's own `tree movement` prefix (`scripts/requirements-moved.mjs:280`). Sealed. |
| MOVEMENT_TIMEOUT_MS | `30_000` | measured 2026-10-25: 0.24 to 0.30 s for nana-pi's 2,038-row ledger on this Mac; chosen at about 100 times for a cold loaded Windows start. Sealed. |
| MOVEMENT_MAX_BYTES | `16 * 1024 * 1024` | measured 2026-10-25: the largest real report, from the ledger's first commit to main, is 81,097 bytes; chosen about 200 times that. Sealed. |
| MOVEMENT_SCRIPT_URL | `new URL('../../../scripts/requirements-moved.mjs', import.meta.url)` | contract: the rule's command path (`AGENTS.md:157`). Sealed. |

## Seat wrong-code pairs

Each must turn its rows red on every macOS run.

1. claude-review's helper call removed → R-2900.
2. claude-review's section placed after the review standard → R-2900.
3. The helper's `--base` set to `HEAD` → R-2900, R-2901.
4. The helper's `--root` set to `process.cwd()` → R-2900.
5. The helper throws on a non-zero exit → R-2902.
6. The helper returns `null` on a non-zero exit → R-2902.
7. The helper passes the whole stderr → R-2902.
8. The helper checks the working tree with `existsSync` in place of `git cat-file` → R-2903.
9. pi-review's movement append removed → R-2901.
10. pi-review's movement appended before the review standard → R-2901.
11. pi-review appends an empty system prompt when the helper returns `null` → R-2904.
12. `scripts/requirements-moved.mjs:337` back to `process.exit(main())` → R-2906.
13. The helper's `maxBuffer` set to 65,536 → R-2906.
14. R-1460's `Made by:` line back to its manual text → R-2905.
15. MOVEMENT_BASE retuned to `master` → seal, R-2900.
16. MOVEMENT_TIMEOUT_MS retuned to 10,000 → seal.

The seat re-runs the mutation runner after any change of its own to code or tests.

## Precedent (verified at main d3f7f7f3)

- Shared launcher helper with two callers: `packages/nana-pack/lib/review-standard.mjs:1-25`, imported at `packages/nana-pack/bin/claude-review.mjs:15` and `packages/nana-pack/bin/pi-review.mjs:37`.
- A file next to the code, resolved by URL: `packages/nana-pack/lib/review-standard.mjs:12`; `packages/nana-pack/bin/claude-review.mjs:32`.
- A package starting a `scripts/` file as a process: `packages/nana-pack/lib/mutation-runner.mjs:489-490`.
- Config form with provenance: `packages/nana-pack/lib/claude-review-config.mjs:1-29`.
- claude-review's prompt: `packages/nana-pack/bin/claude-review.mjs:83-86`; review-ledger start at `:88-95`.
- pi-review's appended prompts: `packages/nana-pack/bin/pi-review.mjs:203`; checkout verified at `:170-172`; admission at `:194`; git without a shell at `:74`.
- Ledger presence at HEAD: `scripts/requirements-moved.mjs:313`; merge-base refusal text at `:299-303`; report prefix at `:280`.
- Exit code without cutting a pipe: `scripts/product-report.mjs:975`; `scripts/ci-records.mjs:41`.
- Ledger fixture on `main` and `feat/x`: `packages/nana-pack/tests/requirements-moved.test.mjs:47-60`, `:140-158`.
- claude-review harness: `packages/nana-pack/tests/claude-review.test.mjs:28-38` (`makeRepo`), `:64` (`writeFakeClaude`), `:94` (`runLauncher`), `:133-156` (R-2561's prompt case).
- pi-review harness: `packages/nana-pack/tests/immutable-review.test.mjs:30-46` (fake pi recording argv), `:92-98` (repository on `main`), `:137-139` (main launch), `:176-183` (R-1105's check).
- Ledger-line pin: `packages/nana-pack/tests/land-records.test.mjs:268-277` (R-2816).
- Seal form: `packages/nana-pack/tests/build-records.test.mjs:315-316`.
- Shared test helper form: `packages/nana-pack/tests/fake-pi.mjs:1-12`.

Helper move: none in product code; the movement helper is shared from birth. In tests, the ledger repository builder and the file-written expected report gain two callers (claude-review.test.mjs and immutable-review.test.mjs). They live in one new `packages/nana-pack/tests/ledger-repo.mjs`, which both import (the 2026-10-22 second-caller ruling), as win-test-limits made `tests/slow-sampler.mjs`.

## Class and builder

Install, hook or gate class: the lane changes two review tools, claude-review and pi-review. The ladder:

- the roster's final reviewer (`reviewer: claude-code opus`, through claude-review);
- the land reviewer (`land: openai-codex gpt-6-astra`, through pi-review);
- the seat's wrong-code pairs above, and the mutation runner after any seat change;
- one independent check.

No local install check: no file under `packages/nana-setup/` and no hook changes, as the land-records lane ruled (`docs/reviews/land-records-2026-10-24/must-meet.md:70`).

Builder: the roster's larger builder, `pi-worker --lane-size larger`. The code is small, about 60 lines, but every later review runs through it and pi-review's tests are slow and Windows-sensitive. The seat pushes the draft pull request at build 1 and reads the Windows leg before the review brief.

The independent check: make a scratch clone of nana-pi and set its `main` to c0a78493, the ledger's first commit, so the report runs 81,097 bytes. Run the worktree's claude-review with a fake `claude` and the worktree's pi-review with a fake `pi` against that clone's tip. Compare each section byte for byte with the script's file-written report. Then repeat on a clone with no `main` for one not-computed line, and on a ledger-free repository for no section.

## Known limits (the seat writes them before the final round)

- The movement reads HEAD's committed ledger, so a dirty-tree review's uncommitted ledger edits do not show.
- claude-review computes the movement at launch; a commit before admission can make the section's head differ from the reviewed revision. The report's first line names its head.
- The base is always the local `main`; a project that branches lanes from elsewhere gets a not-computed line or a movement against `main`.
- The code map shows no edge from the launchers to the movement command, because a process call is not an import.
- A reviewer started outside the two launchers, such as `review-ledger run` with a hand command, gets no section.
- A git failure while checking for the ledger reads as no ledger, so it gives no section rather than a not-computed line.
- Only a macOS run pins the pipe fix; CI's Linux leg writes pipes synchronously, so it cannot catch the old exit line (inferred from Node's process I/O notes; Windows not measured).
- Other scripts ending in `process.exit(main())` can still cut piped output past 64 KiB on macOS: `scripts/requirements-tree.mjs:658`, `scripts/requirements-lift.mjs:1260`, `scripts/requirements-regroup.mjs:892`, `scripts/blast-radius.mjs:340`, `scripts/readme-check.mjs:35`. One line in FEAT-028's known-bug file.
- Each launch in a tree with a ledger spends about 0.3 s before admission (measured on this Mac).
- R-1560's `built from` names A-007 and A-008, while the timeline also reads the audit log, A-056 (`REQUIREMENTS.md:598`); unchanged.

## Notes the seat writes before the final round

- HANDOFF: the deliverable count line in Where things stand or Next item 1, and a Landed line, then `nana-writing HANDOFF.md`.
- `docs/known-bugs/FEAT-007.md:19`: the timeline's "nothing runs it automatically" line now says it is parked, with the park's deletion condition. Add the FEAT-007 known limits above.
- `docs/known-bugs/FEAT-028.md`: the other scripts' exit line.
- A session entry in `docs/sessions/`.
- The output of `node "$HOME/nana-pi/scripts/requirements-moved.mjs" --root . --base main`, pasted into this lane's review and land briefs by hand one last time, since its reviews run the pre-change launchers.
- `docs/requirements-tree.md` and `docs/code-map.md` regenerated after any merge of main, with a confirmation round.

---

# Lane B · outline-park (sketch)

Feature: FEAT-028 · Maintain requirement identity and trace links. Ordinary class, small builder or a seat-written change through the usual review, after lane A lands. The whole change is one line in CAP-07's own field block, after `REQUIREMENTS.md:2205`: `Parked: R-291 · since <the date the seat writes it>: the outline is a view people read as a diff; the suite fails on a stale copy, and the review launchers give every reviewer the tree movement, so no code needs it; a run that writes the outline and code that reads it delete this line`. The checker accepts it there: a listed row, two parts, a `since` date, a reason with no ` · `, and R-291 is manual-made and person-read, so it is not made and read by code. R-291's made and read lines stay, so A-031 keeps its person reader through R-291's direct reference (`scripts/deliverables.mjs:460-485`). No row, test or code changes; the outline regenerates; the checker should then print `deliverables: 21 of 21 made and read by code, 21 parked`. One final reviewer; the seat carries the tree movement through lane A's launchers.
