# keep-movement · must-meet of record (seat, 2026-10-25)

Feature: FEAT-007 · Review a specific revision independently

Written by the seat from the planner's draft (`plan-draft.md`, this folder) and one adversary pass (`plan-attack.md`, this folder; 0 MUST, 4 SHOULD, 8 NOTE). The seat took the attack's option A from SHOULD 1, by subtraction, and dropped the draft's whole store design: the launchers writing the section into the review store, the tally `movement` field, the review-ledger `--movement` option, keep copying per-round movement files, nana-land's success line and pi-review handing the child the store file. Under option A these attack items are moot: SHOULD 2 (no store write, so no store-write fallbacks), SHOULD 3 (no tally field or second store content to declare), NOTE 5 (no nana-land line), NOTE 9 (no tally version, heartbeat order or option read), NOTE 11 (no kill step; the independent check below replaces it) and NOTE 10's R-2901 half (R-2901 is untouched). Taken: SHOULD 1 itself; SHOULD 4's lesson, that every red case must be one the fixtures can show; NOTE 6's home-path rule, since keep never writes a not-computed section; NOTE 7's count line, which now counts the movement file apart; NOTE 8, reworded as a known limit for keep's own timing; NOTE 10's R-2574 half, as one new test on R-2574 rather than a restating row; NOTE 12's line fixes, where this file cites the same code. Plans get no review round. Where this file and the draft or the attack differ, this file holds.

The owner's decision, 2026-10-25: the owner picked "Keep the movement (Recommended)" after review-movement landed. The pick answers the final reviewer's SHOULD on review-movement round 1 at 36af3dda: R-1460's person reader says the seat's land report points the owner to the movement, but nothing durable holds it once briefs stop carrying it.

Spend line: the current priority since 2026-10-23, every listed deliverable made by an existing run and read by something real. R-1460's person reader line is false today; after this lane the lane folder the owner can open from any device holds the movement, written by a step the land checklist already runs. The tree checker's line stays `deliverables: 21 of 21 made and read by code, 21 parked` (run read-only at 36af3dda).

Stakes: medium blast, reversible. `review-ledger keep` runs in every lane's land checklist, with each fix commit and once before the final round. A throw or a refusal over the movement would stop that step; a wrong file would mislead the owner about what landed. The review, admission and land paths are untouched. Every new path in keep warns or omits and never refuses the review-text keep. A revert restores main; a `tree-movement.md` already committed in a lane folder stays as a plain file nothing reads.

Threat model: honest variation in our tools' output, files and environment is in scope. Deliberate forgery is out, such as a hand-edited `tree-movement.md`, a hand-planted tally line, or a crafted fake `node` or `git` on PATH. A finding outside this model is a residual. The honest variations:

- a repository whose HEAD commit holds no `REQUIREMENTS.md`, including one with an untracked or uncommitted ledger in the working tree (every existing keep test repository);
- a movement that cannot be computed: no local `main`, no merge base, or a crash whose first stderr line names a source location under the home folder;
- a movement that reads `tree movement: none`, which names no revision;
- a movement of 81 KB or more (a lift or regroup lane);
- keep run again with each fix commit, after a confirmation round, after a commit that changes rows, and after a commit that changes none;
- an `--into` folder that does not exist yet, or holds a directory or a symlink under the movement file name;
- keep started with `cwd` outside the repository and `--repo` naming it, or with `--repo` naming a subfolder;
- an item with no kept review text: a single-round lane before its final round, an item recorded before kept texts, or a mistyped item;
- keep started from PATH (the main checkout's copy) or from a worktree: each runs the movement script beside it;
- Windows: a home path with spaces and long temp paths; `* text=auto eol=lf` holds for lane folders and the section is LF-only.

## Seat decisions

- **One feature, one product path.** Every changed row sits in FEAT-007: new rows in SUB-010 after R-2576 (`REQUIREMENTS.md:791`), beside keep's rows R-2573 and R-2574 (`:788-789`); R-2905 in SUB-008 (`:727`).
- **Class hook, small builder, no local install check.** `review-ledger keep` is a review tool path. Ladder: the roster's final reviewer (Opus via claude-review), the land reviewer (astra via pi-review), the seat's wrong-code pairs, one independent check. No file under `packages/nana-setup/` and no hook changes, so no local install check, as the land-records lane ruled (`docs/reviews/land-records-2026-10-24/must-meet.md:70`). Builder: `pi-worker --lane-size small`. Main at 36af3dda.
- **What keep writes.** `review-ledger keep --item <slug> --into <folder> --repo <path>` also writes one file, KEEP_MOVEMENT_FILE_NAME (`tree-movement.md`), into the `--into` folder. Its bytes are the tree movement section the shared helper `reviewMovementSection` (`packages/nana-pack/lib/review-movement.mjs:16-31`) returns for the resolved `--repo` path, HEAD against MOVEMENT_BASE. So the file is byte-identical to what claude-review (`packages/nana-pack/bin/claude-review.mjs:87`) and pi-review (`packages/nana-pack/bin/pi-review.mjs:177`) send for the same HEAD and `main`; the report names short revisions and rows, never a path.
- **Each keep replaces it.** keep overwrites any earlier `tree-movement.md`, so the folder holds the movement of the last kept tip. Under the checklist that is the tip the final round reviews. The report's first line names its base and head revisions, except `tree movement: none`.
- **No committed ledger, no file, no message.** When the helper returns `null`, keep writes no movement file and prints nothing about it. The count line keeps today's form.
- **Not computed, no file, one warning.** When the section's body is the not-computed line, keep writes no movement file and prints one stderr warning naming the reason: `review-ledger: WARNING: <KEEP_MOVEMENT_FILE_NAME> not written: <reason>`. It never commits crash text, since a crash line can name a home path and the identity scan (R-2511) scans every tracked file. It still keeps the review texts and exits as it would have.
- **A failed write warns.** A directory or symlink under the movement name, or a failed write, prints the same warning with a short reason and never refuses the review-text keep. The review texts are written first; the movement is written after them.
- **Refusals still write nothing.** keep's existing refusals (two texts under one name, a non-directory `--into`, a differing file) happen before any write, the movement included. R-2574 gains one test in a repository with a committed ledger.
- **No kept review text (narrows R-2573's test clause).** keep with no kept review text for the item but a computable movement writes the movement file and exits 0. With no movement written, it exits 1 with today's `no kept text` message. R-2573's row text carries no exit clause, so it stays. Its test's `empty.status === 1` clause stays true, because its repository commits no ledger. The builder adds one comment above that clause naming R-2913, which now owns the no-text exit rule.
- **The count line counts the movement apart.** `kept <n> review text(s) and <KEEP_MOVEMENT_FILE_NAME> for <item> in <folder>` when keep wrote the movement; today's `kept <n> review text(s) for <item> in <folder>` when it did not.
- **The not-computed test lives with the section.** `review-movement.mjs` exports `notComputedReason(section)`, which returns the reason when the section's body is the not-computed line, else `null`. It builds its prefix from the same names `reviewMovementSection` uses (`:27-30`), so keep never restates the section's framing.
- **The tunable lives with keep's other naming tunable.** KEEP_MOVEMENT_FILE_NAME sits in `packages/nana-pack/bin/review-round.mjs` after KEEP_NAME_HASH_CHARS (`:85-86`). Why: review-ledger keep owns and writes the file, and keep's one other naming tunable lives there, imported by review-ledger (`packages/nana-pack/bin/review-ledger.mjs:34-37`). `review-movement-config.mjs` holds the section's framing, which the launchers own. Its MOVEMENT_FILE_NAME (`packages/nana-pack/lib/review-movement-config.mjs:27-28`) names pi-review's temp file, a different file a retune must not move, so it is not reused although the literal is the same.
- **R-1460's person line (ledger).** `REQUIREMENTS.md:2219` becomes `Read by: R-1460 · person: the seat's land report points the owner to the lane folder's tree-movement.md, which review-ledger keep writes`. `person` needs a reason and takes no path (`scripts/deliverables.mjs:31-33`, `:644-660`), and the line has one ` · `, so the checker reads it. R-1460's `Made by:` line stays: its third part is a built-from list, and the checker compares writers only for an artifact reference (`scripts/deliverables.mjs:628-633`). The person line names keep as the copy's writer.
- **R-2905 widens in place (precedent: R-2561's widening in review-movement).** Its sentence still holds, so its ID, title and evidence stay. Its text gains the file and its writer, and its test's person-line assertion (`packages/nana-pack/tests/review-movement.test.mjs:29`) changes to the new line.
- **Rule text.** `AGENTS.md:157` (nana-pi's own section, outside the managed markers) and `packages/nana-pack/skills/requirements/SKILL.md:142` replace their last sentence with: "The seat's land report points the owner to the lane folder's tree-movement.md, which review-ledger keep writes before the final round." No backticks: R-598's claim reader treats a backticked `.md` name as a path claim that must exist in a generated project (`packages/nana-pack/tests/skill-claims.mjs:122-133`; `templates/typescript/template/scripts/readme-check.mjs:305-318`, `:375-397`). No test pins either sentence.
- **README.** The pack README's keep paragraph (`packages/nana-pack/README.md:245`) gains the movement file, its replacement rule, and its no-ledger and not-computed behaviour; its no-text sentence narrows. Its Dependencies sentence (`:9`) names review-ledger keep beside the launchers. Plain text for the file name, for the same reason. Written, pinned only by `readme:check`.
- **Headers and map.** review-ledger's `@inputs`, `@outputs`, `@effects` and `@errors` gain the movement; review-movement's `@outputs` gains `notComputedReason()`. review-ledger gains an import of `../lib/review-movement.mjs`, the import claude-review and pi-review already make. `npm run map` and `npm run req:tree` are regenerated.
- **Tests in a new file.** The rows' tests go in a new `packages/nana-pack/tests/keep-movement.test.mjs`, not in `review-ledger.test.mjs`, which already timed out once at 300 s on CI's Windows leg (FEAT-031's notes). Its few spawn wrappers follow `review-ledger.test.mjs:57-66` and `:119-122`; a test file cannot import another, since each runs on import.
- **Not in this lane.** No change to claude-review, pi-review, nana-land, review-round's behaviour, the tally, the review store, the review standard, `scripts/requirements-moved.mjs`, the movement section's text, the state manifest, nana-setup, the product page or its scripts. No backfill for earlier lanes. No artifact registry line in the build: a tracked location must match a file at HEAD (`scripts/deliverables.mjs:223-225`), and none exists until the seat's own keep (see the notes below).
- **Page effect.** No page code changes. As data, FEAT-007 gains four rows, R-2905's wording and R-1460's reader text (inferred: the page reads the ledger rows).
- **This lane's own reviews.** They run main's launchers, which already add the movement to the prompt. The seat runs the worktree's own review-ledger keep before the final round, so this lane's folder holds its `tree-movement.md`; main's copy on PATH predates the change.

## Must-meet rows (FEAT-007, SUB-010, after R-2576 at `REQUIREMENTS.md:791`)

Four new rows, R-2910 to R-2913, `untested` until each check passes, then `implemented`. R-2914 to R-2919 stay free. R-2905 widens; R-2574 gains a test; R-2573's text and test stay, with one comment. Every assertion imports KEEP_MOVEMENT_FILE_NAME, MOVEMENT_HEADING, MOVEMENT_LEAD and MOVEMENT_NOT_COMPUTED by name. Expected sections come from `reportToFile` (`packages/nana-pack/tests/ledger-repo.mjs:43-52`), a run of the real script with stdout to a file, wrapped as `claude-review.test.mjs:324` wraps it, and also from `reviewMovementSection` called in the test.

- **R-2910.** WHEN `review-ledger keep` runs for a repository whose HEAD commit holds a REQUIREMENTS.md and whose tree movement is computed, it shall leave in the `--into` folder one file named KEEP_MOVEMENT_FILE_NAME whose bytes equal the section `reviewMovementSection` returns for that repository against MOVEMENT_BASE, replacing any earlier copy, and name that file apart from the review texts in its count line.
  - Test: `packages/nana-pack/tests/keep-movement.test.mjs::R-2910: keep writes the tree movement section for the repository's HEAD against main into the lane folder, names it in its count line, and replaces it on the next keep`.
  - Fixture: `makeLedgerBranch` (`ledger-repo.mjs:54-72`), HEAD on `feat/x` adding R-002. One round recorded through `review-ledger run` with a kept text. Then an uncommitted ledger edit adding R-003. keep runs with `cwd` outside the repository and `--repo` naming it, into a folder outside it. Expect: exit 0; the file equals both expected sections; the report holds `R-002 new` and no `R-003`; the file holds neither the scratch home path nor the repository path; stdout starts `kept 1 review text(s) and <KEEP_MOVEMENT_FILE_NAME> for `. Then commit the R-003 edit and keep again. Expect: exit 0; the file equals the new expected section, holds `R-003 new`, and holds MOVEMENT_HEADING exactly once; its first report line holds the new HEAD's first seven characters; the review text is unchanged.
  - Red: no movement step; the helper run on `process.cwd()` in place of `--repo` (no file); a trailing newline added; an append in place of a replace (two headings); a `wx` write that keeps the old copy (stale file); a provenance header naming the repository path; the count line unchanged.
- **R-2911.** IF the repository's HEAD commit holds no REQUIREMENTS.md, THEN `review-ledger keep` shall write no KEEP_MOVEMENT_FILE_NAME file and print nothing about the tree movement, even when the working tree holds an untracked REQUIREMENTS.md.
  - Test: `packages/nana-pack/tests/keep-movement.test.mjs::R-2911: keep writes no tree movement file and says nothing about it for a repository with no committed ledger`.
  - Fixture: `ledgerRepo` (`ledger-repo.mjs:27-41`) on `main` with one committed plain file, then an untracked `REQUIREMENTS.md` holding `ledgerText()`. One round recorded. Expect: exit 0; no path at the movement name; stderr empty; stdout starts `kept 1 review text(s) for ` and does not hold KEEP_MOVEMENT_FILE_NAME.
  - Red: a `null` section treated as not computed (a warning); an empty file written for `null`; the count line naming the movement file when none was written.
- **R-2912.** IF the tree movement cannot be computed or its file cannot be written, THEN `review-ledger keep` shall still keep the item's review texts, write no tree movement section, print one warning naming KEEP_MOVEMENT_FILE_NAME and the reason, and exit 0.
  - Test: `packages/nana-pack/tests/keep-movement.test.mjs::R-2912: a movement that cannot be computed or written leaves no movement section and one warning with its reason, while keep still keeps the review texts and exits 0`.
  - Case 1: `makeLedgerBranch(dir, { trunk: true })`, so no `main`; one round recorded. The expected reason is the first non-empty stderr line of `reportToFile` in that repository, as `claude-review.test.mjs:331` takes it. Expect: exit 0; the review text kept; no path at the movement name; stderr holds exactly one non-empty line, holding KEEP_MOVEMENT_FILE_NAME and the reason, and no MOVEMENT_NOT_COMPUTED section text.
  - Case 2: `makeLedgerBranch(dir)`, one round recorded, and the `--into` folder made first with an empty directory at the movement name. Expect: exit 0; the review text kept; the directory still an empty directory; stderr exactly one non-empty line holding KEEP_MOVEMENT_FILE_NAME.
  - Red: the not-computed section written to the file; exit 1 on a not-computed movement; a failed movement write that calls `die`; the movement written before the review texts and refusing them; no warning; a warning with no reason.
- **R-2913.** WHEN `review-ledger keep` finds no kept review text for the item, it shall exit 0 if it writes the tree movement file and exit 1 if it does not.
  - Test: `packages/nana-pack/tests/keep-movement.test.mjs::R-2913: with no kept review text, keep exits 0 when it writes the tree movement file and 1 when it does not`.
  - Case 1: `makeLedgerBranch(dir)` and an item with no recorded round. Expect: exit 0; the folder holds exactly KEEP_MOVEMENT_FILE_NAME, equal to the expected section; stdout starts `kept 0 review text(s) and <KEEP_MOVEMENT_FILE_NAME> for `.
  - Case 2: the same item in the trunk repository. Expect: exit 1; no file at the movement name; stderr matches `/no kept text/`.
  - Red: today's early `no kept text` refusal kept before the movement step (case 1 exits 1); the final refusal removed (case 2 exits 0; R-2573's empty clause also turns red); a not-computed section written (case 2 exits 0).
- **R-2905 (widened).** New text: "This repository's requirements ledger shall list R-1460 as a CAP-07 deliverable whose `Made by:` is a review line naming `packages/nana-pack/lib/review-movement.mjs` and built from A-030, with one `Read by:` prompt line naming claude-review and pi-review and one `Read by:` person line naming the seat's land report and the lane folder's tree-movement.md that review-ledger keep writes." Title and evidence stay. The test's person-line assertion matches the new line exactly.
  - Red: the old person line restored; the new line without `review-ledger keep`.
- **R-2574 (one new test).** `packages/nana-pack/tests/keep-movement.test.mjs::R-2574: in a repository with a committed ledger, keep refuses a differing review text and writes no tree movement file`, added to R-2574's evidence. Fixture: `makeLedgerBranch(dir)`, one round recorded, the `--into` folder holding different bytes under that round's kept name (`r1-<role>-<sha8>.md`, as `review-ledger.test.mjs:601-602` builds it). Expect: exit 1; no path at the movement name; the differing file unchanged; the folder holds one file.
  - Red: the movement written before the review-text pre-check.

## Seal

`packages/nana-pack/tests/keep-movement.test.mjs::seal: review-ledger keep names the lane folder's tree movement file tree-movement.md`, marked `req: R-2910 R-2911 R-2912 R-2913`. It asserts `KEEP_MOVEMENT_FILE_NAME === "tree-movement.md"`, as `packages/nana-pack/tests/review-movement.test.mjs:31-40` asserts its sealed values. No other new value is sealed.

## Tunables

| Name | Where | Value | Provenance |
|---|---|---|---|
| KEEP_MOVEMENT_FILE_NAME | `packages/nana-pack/bin/review-round.mjs`, after KEEP_NAME_HASH_CHARS (`:85-86`) | `'tree-movement.md'` | chosen 2026-10-25 (keep-movement): one fixed name per lane folder, so each keep replaces the last kept tip's movement and a reader finds it without a hash. Sealed (R-2910 to R-2913). |

The warning and count-line words are messages, not tunables; tests match them through KEEP_MOVEMENT_FILE_NAME and the reason.

## Seat wrong-code pairs

Each is a one-place edit in the built tree and must turn its rows red on macOS. None is Windows-only.

1. keep's movement step removed (no helper call) → R-2910, R-2913.
2. keep calls `reviewMovementSection(process.cwd())` in place of the resolved `--repo` path → R-2910, R-2913 (the tests run keep from outside the repository).
3. keep writes `` `${section}\n` `` → R-2910.
4. keep writes with `{ flag: 'a' }` → R-2910 (two headings after the second keep).
5. keep writes with `{ flag: 'wx' }` and only warns on `EEXIST` → R-2910 (the second keep leaves the old section).
6. keep prefixes `` `<!-- ${repoPath} -->\n` `` → R-2910.
7. The count line keeps today's form when the movement was written → R-2910, R-2913.
8. The count line names the movement file whether or not it was written → R-2911.
9. keep treats `null` like a not-computed section and warns → R-2911.
10. keep writes an empty file when the helper returns `null` → R-2911.
11. `notComputedReason` returns `null` for every section → R-2912, R-2913.
12. keep calls `die` on a not-computed movement → R-2912.
13. keep's movement-write `catch` calls `die` → R-2912.
14. The warning leaves out the reason → R-2912.
15. keep's early `if (!planned.size) die(...)` stays before the movement step → R-2913.
16. keep's final no-text refusal removed → R-2913, R-2573.
17. The movement write moved above the review-text pre-check loop → R-2574 (new test).
18. KEEP_MOVEMENT_FILE_NAME retuned to `'movement.md'` → seal.
19. R-1460's person line back to `the seat's land report points the owner to it` → R-2905.

No pair writes the file from the working tree: the script reads HEAD's ledger (`scripts/requirements-moved.mjs:313-322`), so no one-place edit in keep can. R-2910's uncommitted R-003 edit guards any future change that does. The seat re-runs the mutation runner after any change of its own to code or tests.

## Precedent (verified at main 36af3dda)

- keep itself: `packages/nana-pack/bin/review-ledger.mjs:52-97`. Arguments and repository at `:53-59`; planning at `:61-74`; the no-text refusal at `:75`; the `--into` checks at `:76-79`; the pre-check at `:80-90`; the writes at `:91-94`; the count line at `:95`. Imports from review-round at `:34-37`; the warning form `review-ledger: WARNING:` at `:134`.
- The shared movement helper: `packages/nana-pack/lib/review-movement.mjs:16-31`, its section framing at `:27-30`; imported by `packages/nana-pack/bin/claude-review.mjs:16` and called at `:87`; by `packages/nana-pack/bin/pi-review.mjs:38` and called at `:177`.
- The section's names: `packages/nana-pack/lib/review-movement-config.mjs:9-16`. Not reused: MOVEMENT_FILE_NAME at `:27-28`.
- keep's naming tunable and its pin: `packages/nana-pack/bin/review-round.mjs:85-86`; `packages/nana-pack/tests/review-ledger.test.mjs:587`.
- review-round's safe-file and store writers: `packages/nana-pack/bin/review-round.mjs:364-389` and `writeReviewText` at `:443-472`, under `withLock` at `:482`. Read, not used: they are private, content-addressed and lock-held. The lane-folder copy is a plain overwrite in keep's own lstat-then-write form (`review-ledger.mjs:83-86`, `:93`).
- keep tests: R-2573 at `packages/nana-pack/tests/review-ledger.test.mjs:557-591` (the `empty` case at `:581-583`); R-2574 at `:593-612`. Harness: `tmpDir` import at `:13`; `freshHome` and `env` at `:57-66`; `ledgerRun` and `ledgerKeep` at `:119-122`.
- Ledger fixtures: `packages/nana-pack/tests/ledger-repo.mjs:27-41` (`ledgerRepo`, with a cleaned git env), `:43-52` (`reportToFile`), `:54-72` (`makeLedgerBranch`).
- Expected section and not-computed reason: `packages/nana-pack/tests/claude-review.test.mjs:324` and `:331`. (Attack item 12: the movement case helper is `:309-321`; the small case runs from `:323`.)
- R-2905's pin and the seal form: `packages/nana-pack/tests/review-movement.test.mjs:22-30`, `:31-40`.
- R-917's temp-source scan: `packages/nana-pack/tests/test-runner.test.mjs:653-662`.
- Ledger rows: R-2905 at `REQUIREMENTS.md:727`; R-2573 and R-2574 at `:788-789`; R-2576 at `:791`; R-1460's lines at `:2217-2219`.
- Deliverable grammar: `scripts/deliverables.mjs:25-37`, `:597-660`; tracked artifact locations at `:223-225`.
- Narrowing bookkeeping: `docs/reviews/review-texts-durable-2026-10-25/must-meet.md:39-40` (R-955 kept its text and test where they still held).
- Rule text: `AGENTS.md:157`; `packages/nana-pack/skills/requirements/SKILL.md:142`. README: `packages/nana-pack/README.md:9`, `:245`.

Helper move: none. `notComputedReason` is new in the helper's own module, shared from birth. Test files cannot import one another, so keep-movement.test.mjs writes its own spawn wrappers in the form named above.

## Class and builder

Hook class: the lane changes review-ledger keep, a review tool path. The ladder:

- the roster's final reviewer (`reviewer: claude-code opus`, through claude-review);
- the land reviewer (`land: openai-codex gpt-6-astra`, through pi-review);
- the seat's wrong-code pairs above, and the mutation runner after any seat change;
- one independent check.

No local install check: no file under `packages/nana-setup/` and no hook changes. Builder: `pi-worker --lane-size small`. Size: small, about 35 product lines over three files and 170 test lines over three files, plus ledger, rule and README lines. The seat pushes the draft pull request at build 1 and reads keep-movement.test.mjs on its Windows leg before the review brief.

## The independent check

Run with `HOME`, `USERPROFILE` and `PI_CODING_AGENT_DIR` set to a scratch folder, so nothing reaches the real review ledger. Use a scratch clone of nana-pi and the worktree's own `packages/nana-pack/bin/review-ledger.mjs`.

- Record one round with a kept text through the worktree's `review-ledger run` and a trivial command. Run keep for that item and for an item with none. Do it in the clone (a ledger), in a plain repository with no ledger, and in a clone with no `main`.
- Compare each `tree-movement.md` byte for byte with the helper's section for that HEAD, and with the script's file-written report wrapped the same way.
- Check exits, stderr lines and count lines against R-2910 to R-2913.
- Commit a row change in the clone, keep again, and see the file replaced.
- Break a scratch copy of the pack's movement script so it crashes. Run that copy's keep, and see no file and one warning, with no home path in any file keep wrote.
- Grep every file keep wrote for the scratch home path and the clone path.

## Known limits (the seat writes them to FEAT-007's file before the final round)

- A force-killed pi-review leaves its movement temp folder behind; startup reclaims review worktrees only (the land reviewer's note on review-movement). It stays a known bug.
- The file holds the movement of the last kept tip, so a commit after keep that changes rows makes it stale until the next keep.
- The file is only as current as the seat's keep step; the land checklist names the step, and nothing enforces it.
- The movement's base is the local `main`; a lagging `main` includes rows already landed upstream.
- The file's first line names the commit keep ran at, so the commit that adds the file is one later; `tree movement: none` names no revision.
- A keep whose movement cannot be computed leaves any earlier `tree-movement.md` in place; only its warning says so.
- A mistyped item still writes the movement file and exits 0; the count line shows zero review texts.
- A `--repo` naming a subfolder gets no movement file and no message, since the ledger check reads relative to that folder (inferred).
- claude-review still computes the prompt's movement before admission (review-movement's known bug); keep computes its own copy when it runs, so the file does not inherit that gap.

## Notes the seat writes before the final round

- FEAT-007 known-bug lines: the known limits above; the land reviewer's orphan-folder note and the final reviewer's launch-to-admission note from review-movement round 1 (now in the seat's late-notes file). The final reviewer's person-line note closes in this lane, so it gets no line.
- FEAT-031 lines from the late-notes file: the two win-test-limits final-review notes, and the worker-lane wall-clock-ceiling flake on the Windows leg at 53081c82.
- The seat runs the worktree's own `node packages/nana-pack/bin/review-ledger.mjs keep --item keep-movement --into docs/reviews/keep-movement-2026-10-25 --repo .` before the final round. It commits the kept texts and `tree-movement.md`, so this lane's folder holds its own movement.
- After that commit, the seat may register the copy in FEAT-007's field block after A-057: `Artifact: A-083 · lane copies of the tree movement · tracked: docs/reviews/*/tree-movement.md · manual: the seat runs review-ledger keep by hand with each fix commit and once before the final round, as the land checklist says` and `Read by: A-083 · person: the seat's land report points the owner to it`. Then it runs `npm run req:tree` and the tree checker.
- HANDOFF: a Landed line; then `nana-writing HANDOFF.md`.
- A session entry in `docs/sessions/`.
- `node "$HOME/nana-pi/scripts/requirements-moved.mjs" --root . --base main` run in the worktree, its output carried in the final review and land briefs.
- `docs/requirements-tree.md` and `docs/code-map.md` regenerated after any merge of main, with a confirmation round.
