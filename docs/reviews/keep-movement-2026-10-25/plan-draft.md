# keep-movement · plan draft (planner, 2026-10-25)

Feature: FEAT-007 · Review a specific revision independently

Draft for the seat and one adversary pass. Plans get no review round. Main is 36af3dda; every file:line below was opened there.

The owner's decision, 2026-10-25: the owner picked "Keep the movement (Recommended)" after review-movement landed. The pick answers the final reviewer's SHOULD on review-movement round 1 at 36af3dda (kept text `734ded79…`, item 1). R-1460's person reader says the seat's land report points the owner to the movement. Neither launcher keeps it: claude-review sends it on stdin (`packages/nana-pack/bin/claude-review.mjs:87-88`), and pi-review deletes its temp file in `finally` (`packages/nana-pack/bin/pi-review.mjs:177-187`, `:244-248`). The lane also answers the land reviewer's SHOULD on the same round (kept text `71538fb6…`): a force-killed pi-review leaves its movement temp folder behind, since startup reclamation covers only `nana-review-<pid>-` worktrees (`pi-review.mjs:82-104`).

Spend line: the current priority since 2026-10-23, every artifact made by an existing run and read by something real, recorded where the check can see it. R-1460 is listed as made by the review run and read by a person through the seat's land report (`REQUIREMENTS.md:2217-2219`). Today that person line is false once the seat stops pasting. After this lane every review run keeps the section it sent, `review-ledger keep` carries it into the lane folder, and nana-land names the final round's copy. The tree checker's line stays `deliverables: 21 of 21 made and read by code, 21 parked` (run read-only at 36af3dda); no claim line changes.

Stakes: high blast, reversible. Every review and every land after this lane runs through the changed code: review-round's `complete()`, review-ledger, both launchers and nana-land. A throw in the movement path would refuse reviews or lands. Every new path is written to warn or omit, never refuse. A revert restores main; tally rows written meanwhile keep an extra field old code ignores (`readTally` checks only `v`, `kind`, `repo`, `item`, `revision`, `review-round.mjs:515-530`).

Threat model: honest variation in our tools' output, files and environment is in scope. Deliberate forgery is out: a hand-edited store file or tally `movement` reference, a reviewer child rewriting the store file it was handed, a hand launcher passing another review's hash. A finding outside this model is a residual. The honest variations:

- a project with no committed ledger, so no section (R-2903, R-2904); every existing launcher test repository;
- a not-computed section (no `main`, a crashed script); it is what the reviewer saw, so it is kept as is;
- a section over 64 KiB and over 32,767 characters (81,097 bytes measured from c0a78493 to main);
- two reviews of one revision (the final and land reviewers) with byte-equal sections, so one store file and two references;
- concurrent reviews in two worktrees writing the one store under the ledger lock;
- a lock held past 15 s, or a store path that is a regular file, at launch;
- an admission refused (over cap) after claude-review stored the section, and a stalled or failed review after either launcher stored it;
- pre-change tally rows with no `movement` field, and `review-ledger run` called by a hand launcher with no `--movement`;
- a hand `--movement` value that is malformed, absent from the store, or names an altered file;
- `keep` run twice, after a confirmation round, or into a folder holding a differing file;
- a final round whose kept movement is later missing or altered;
- Windows: a home path with spaces, 8.3 temp paths, and the 32,767-character command line;
- a launcher started from PATH (main checkout's copy) or from a worktree.

## Subtraction: where the section lives

| Option | Durable? | Cost | Verdict |
|---|---|---|---|
| (a) a sibling file beside `--out` | No. `--out` is usually a scratch folder; review-outputs-kept found 117 of 416 outputs already deleted (`docs/reviews/review-outputs-kept-2026-10-22/must-meet.md:9`). An in-tree `--out` sibling also changes the reviewed snapshot, since only `--out` is excluded (`review-round.mjs:654`). | small | rejected |
| (c) append the section to the review output | Yes, but it changes the kept text's hash and the review text R-2568 keeps. The verdict reader takes the final non-blank line (`packages/nana-pack/README.md:274`), so an appended section reads as an unread verdict and refuses the revision for good. | small | rejected |
| (b) the review store, referenced from the round's tally line, copied by `keep --into` | Yes: beside the tally, one lock, one trust model, already in the backup and restore (R-2872). Review text hash and verdict reading unchanged. | one store export, one tally field, one review-ledger option, one keep branch, one land line | **chosen** |
| (b′) a second store folder | Yes, but a new `ledgerPaths` key fails R-2871 until nana-setup's state manifest gains a row. That pulls in nana-setup and the install check. | wider | rejected |

**The temp folder goes.** pi-review hands the pi child the store file's path in place of its temp file. pi reads `--append-system-prompt <text|path>` from either (pi 1.0.2 `docs/cli.md:219`). So no temp folder exists to orphan, and the land reviewer's SHOULD closes with no reclaim code. A pid-named folder with dead-owner reclamation would add a second reclaim loop beside `pi-review.mjs:82-104`; the store path subtracts it.

## Seat decisions

- **One feature.** Every changed row sits in FEAT-007: R-2901 in SUB-008 (`REQUIREMENTS.md:723`), new rows in SUB-010 after R-2576 (`REQUIREMENTS.md:791`), beside the kept-text rows R-2568 to R-2576 they extend.
- **Class hook, larger builder, no local install check.** The lane changes review-round, review-ledger, claude-review, pi-review and nana-land. Ladder: the roster's final reviewer, the land reviewer, the seat's wrong-code pairs, one independent check. No file under `packages/nana-setup/` and no hook changes, so no local install check (`docs/reviews/land-records-2026-10-24/must-meet.md:70`). Builder: `pi-worker --lane-size larger`; review-movement and review-outputs-kept, this lane's two precedents, used it.
- **One store write, exported once.** review-round gains `keepMovementText(text, { home, rename })`. It runs the existing private `writeReviewText` (`review-round.mjs:443`) under `withLock` (`:482`). It returns `{ ok: true, record: { sha256, bytes }, file }` or `{ ok: false, message }` and never throws, as `complete()` never throws (`:810`, `:862-864`). Both launchers call it; it is shared from birth (the 2026-10-22 ruling).
- **One store, one name form.** The section's UTF-8 bytes go to `review-ledger.texts/<sha256>.md`, the review text's own store and name form. A section and a review text with equal bytes share one file. No new `ledgerPaths` key, so R-2871 and the state manifest hold.
- **The tally line references it.** `complete()` takes an optional `movement` record and adds `movement: { sha256, bytes }` to the tally and audit lines beside `text` (`review-round.mjs:844-846`). It records the reference as given; readers check it through `reviewTextEvidence` (`:414-427`), as they check `text`. With no record, the lines are byte for byte today's.
- **pi-review.** After admission (`pi-review.mjs:209-213`) and before `runWatchdog` (`:218`), pi-review calls `keepMovementText` on the section. On success it appends the store file's path as the third `--append-system-prompt` and passes the record to `complete()` (`:229`). On failure it appends the not-computed text it appends today (`:185`), with the reason `section file: <message>`, and records no movement. The `mkdtempSync` folder, `movementFolder` and its `finally` removal (`:73`, `:181-182`, `:245-248`) go. Writing after admission means a refused admission leaves no store file.
- **claude-review.** After the section is computed (`claude-review.mjs:87`) and before review-ledger starts (`:94`), claude-review calls `keepMovementText`. On success it adds `MOVEMENT_OPTION <sha256>` to review-ledger's own arguments, before `--` (`:90-91`). On failure it prints one `claude-review: WARNING: tree movement not kept: <message>` line and sends the section unkept. The prompt is unchanged, so R-2561, R-2900 and R-2906 hold. claude-review cannot store after admission, because admission runs inside review-ledger.
- **review-ledger run.** It reads `MOVEMENT_OPTION` from its own arguments. It builds the record with the exported `readReviewText(home, { sha256 })` (`review-round.mjs:430-440`), which hash-checks the file. A malformed value, an absent file or an altered file gives one `review-ledger: WARNING: …` line naming the value, and no movement field. It never refuses over the option. `admit` and `project` ignore options they do not parse (`review-round.mjs:639-656`), so `check` and admission are unchanged.
- **keep --into.** For each kept review text keep writes today (`review-ledger.mjs:64-74`), a row whose `movement` reads `intact` also plans `r<round>-<role>-<textsha8>` + KEEP_MOVEMENT_SUFFIX + `.md`. The movement name carries the review text's hash, so it pairs with its review. Movement names go into the same `planned` map, so the two-texts check (`:72`) and the differing-file pre-check (`:80-90`) cover them before anything is written. A row without `movement`, or with one not intact, adds no file. The stdout count line keeps its form.
- **nana-land names the final copy.** `checkRecords` (`nana-land.mjs:118-142`) also collects, for each relied-on record with an intact `movement`, the store file's name. The success report prints one `LAND_MOVEMENT_LINE <name>` line each, after the `review text relied on:` lines (`:240-241`). A missing, altered or malformed movement prints nothing and never refuses. No earlier-round blob note for movements: R-2576's note already flags a missed `keep`, which writes both files in one run.
- **R-1460's lines hold.** The person line becomes true as written: the land report can point to the lane folder's copies and to the store file nana-land names. R-2905 and its test are unchanged. `Made by:` keeps its paths; the launchers make the kept copy through review-round.
- **R-2901 narrows (precedent: R-955 in review-texts-durable).** Its "and removed when pi-review exits" clause would be false. New text: "WHEN the reviewed revision's commit holds a REQUIREMENTS.md, pi-review shall pass the pi child exactly one tree movement section, holding MOVEMENT_LEAD and computed against MOVEMENT_BASE, as an appended system prompt file after the review standard, kept outside the reviewed checkout." Its title drops ", and removes the file when it exits". Its test (`packages/nana-pack/tests/immutable-review.test.mjs:425-431`) drops the `MOVEMENT_FILE_NAME`, `MOVEMENT_FOLDER_PREFIX` and removal clauses and keeps the outside-checkout check. The kept-copy clause moves to new row R-2911.
- **Retired tunables.** `MOVEMENT_FOLDER_PREFIX` and `MOVEMENT_FILE_NAME` (`packages/nana-pack/lib/review-movement-config.mjs:25-28`) leave the config and their imports (`pi-review.mjs:39`, `immutable-review.test.mjs:18`). Neither was sealed.
- **Rule text.** `AGENTS.md:157` (outside the managed markers) and `packages/nana-pack/skills/requirements/SKILL.md:142` replace "in the review folder or the brief" with: "Each launcher keeps the section it sent with the review's kept text. `review-ledger keep` copies it into the review folder beside that text, and nana-land's report names the final round's copy." No test pins either.
- **README.** The pack README's pi-review sentence (`packages/nana-pack/README.md:185`) loses "file outside the checkout" for "kept copy in the review store". The claude-review paragraph (`:202`) gains one sentence on the kept copy and its warning. The keep paragraph (`:245`) gains the movement file name. The nana-land paragraph (`:270`) gains the movement line. `review-ledger run`'s usage names `--movement`. Written, pinned only by `readme:check`.
- **Headers and map.** review-round, review-ledger, claude-review, pi-review and nana-land update `@inputs`, `@outputs` and `@effects`; pi-review drops "creates/removes an external movement folder" (`pi-review.mjs:11`). claude-review gains an import of `review-round.mjs`. `npm run map` and `npm run req:tree` are regenerated.
- **Not in this lane.** No change to the review standard, `requirements-moved.mjs`, the movement helper's section text, review-timeline, the state manifest, nana-setup, the product page or its scripts. No reclaim loop. No backfill for earlier rounds.
- **Page effect.** No page code changes. As data, FEAT-007 gains six rows and R-2901's narrowed wording (inferred: the page reads the ledger rows).
- **This lane's own reviews.** They run main's launchers, which add the movement but do not keep it. So the seat writes the movement once more by hand, as a file in this lane's review folder, for its own land report.

## Must-meet rows (FEAT-007, SUB-010, after R-2576 at `REQUIREMENTS.md:791`)

Six rows, R-2910 to R-2915, `untested` until each check passes, then `implemented`. R-2916 to R-2919 stay free. R-2901 narrows as above. Every assertion imports MOVEMENT_HEADING, MOVEMENT_LEAD, KEEP_MOVEMENT_SUFFIX, LAND_MOVEMENT_LINE and MOVEMENT_OPTION by name. Sections are rebuilt from the real script's file-written report, as R-2900 and R-2901 do.

- **R-2910.** WHEN claude-review records a round, the round's tally line shall reference by sha256 and byte count a review-store file holding exactly the tree movement section the reviewer's prompt carried, and carry no movement reference when the prompt carried none.
  - Test: `packages/nana-pack/tests/claude-review.test.mjs::R-2910: claude-review's recorded round references a kept copy of the exact tree movement section the reviewer received, and none when it received none`.
  - Fixtures: the R-2900 small case and the R-2902 trunk case (`claude-review.test.mjs:309-321`); the R-2903 untracked-ledger case (`:347-361`). For each with a section, the store file at `reviewTextPath(home, row.movement)` equals the section byte for byte and the section sits in the recorded prompt. The untracked case has no `movement` key.
  - Red: no `MOVEMENT_OPTION` passed; the section stored with its `\n\n` framing; the whole prompt stored; a movement stored for a `null` section; review-ledger dropping the record before `complete()`.
- **R-2911.** WHEN pi-review passes the pi child a tree movement section and records the round, the appended file shall be the review-store copy the round's tally line references by sha256 and byte count, still present after pi-review exits, and a round with no section shall carry no movement reference.
  - Test: `packages/nana-pack/tests/immutable-review.test.mjs::R-2911: pi-review hands the pi child the review store's kept copy of the tree movement section, which the recorded round references and which stays after exit`.
  - Fixtures: the R-2901 small case and the R-2908 trunk case (`immutable-review.test.mjs:407-421`); the R-2904 main launch (`:197-199`). The third appended value equals `reviewTextPath(home, row.movement)`; that file exists after exit and equals the fake pi's copy and the expected section. The main launch's row has no `movement` key.
  - Red: the temp folder kept for the child beside a store copy; the store copy removed in `finally`; no record passed to `complete()`; a movement recorded for the no-section launch; the section passed as argv text.
- **R-2912.** IF `review-ledger run` gets a MOVEMENT_OPTION value that names no intact review-store file, THEN it shall record the review's round with no movement reference and print one warning naming that value.
  - Test: `packages/nana-pack/tests/review-ledger.test.mjs::R-2912: a movement option with no intact kept copy never refuses the review; the round records no movement and one warning names the value`.
  - Cases, each through `ledgerRun` (`review-ledger.test.mjs:119`): the value `xyz`; 64 hex digits with no file; a store file altered by one byte after `keepMovementText`. Each exits 0 with one round, no `movement` key and one warning line holding the value.
  - Red: exit 1 and no round; the bad reference recorded; no warning; a warning per line of something else.
- **R-2913.** WHEN `review-ledger keep` writes a kept review text whose round references an intact kept movement, it shall also write that movement's bytes under the review text's kept name with KEEP_MOVEMENT_SUFFIX before the extension.
  - Test: `packages/nana-pack/tests/review-ledger.test.mjs::R-2913: keep writes each kept round's tree movement beside its review text, under the review text's name with the movement suffix`.
  - Fixture: three rounds through `ledgerRun`, two given a `MOVEMENT_OPTION` from `keepMovementText` (one 81 KB section), one without. The folder holds exactly three review texts and two movement files, byte-equal. A second run leaves mtimes unchanged, as R-2573 checks (`review-ledger.test.mjs:584-605`).
  - Red: no movement file; a movement named by its own hash; an empty movement file for the third round; the suffix after `.md`; a movement written for a round whose movement is altered.
- **R-2914.** IF a file in the folder holds different bytes under a movement name keep would write, THEN keep shall refuse and write no file.
  - Test: `packages/nana-pack/tests/review-ledger.test.mjs::R-2914: keep refuses a differing file under a tree movement name and writes nothing`.
  - Fixture: R-2574's form (`review-ledger.test.mjs:607-620`), with the differing file under the last round's movement name.
  - Red: movements written in a second pass after the pre-check; a differing movement file overwritten; review texts written before the refusal.
- **R-2915.** WHEN nana-land lands, its success report shall print one LAND_MOVEMENT_LINE line naming the kept movement file of each relied-on LAND record whose movement reads intact.
  - Test: `packages/nana-pack/tests/land.test.mjs::R-2915: a land's success report names the kept tree movement of each relied-on LAND record, and an altered movement still lands with no line`.
  - Fixture: R-2572's form (`land.test.mjs:421-427`), with `recordTextReview` (`:37-43`) given an optional movement record. Cases: intact (one line holding the file's basename); altered by one byte (code 0, no line); none (code 0, no line).
  - Red: no line; a line for the altered movement; a refusal on the altered movement; a line for a record the land did not rely on.

## Seal

R-2913's test asserts `KEEP_MOVEMENT_SUFFIX === "-movement"` beside its other checks, as R-2573 asserts `KEEP_NAME_HASH_CHARS === 8` (`review-ledger.test.mjs:587`). It carries `req: R-2913`. No other new value is sealed.

## Tunables

| Name | Where | Value | Provenance |
|---|---|---|---|
| KEEP_MOVEMENT_SUFFIX | `packages/nana-pack/bin/review-round.mjs`, beside KEEP_NAME_HASH_CHARS (`:86`) | `-movement` | chosen 2026-10-25: pairs a round's movement with its review text's kept name, so a reader finds both by one stem. Sealed (R-2913). |
| LAND_MOVEMENT_LINE | `packages/nana-pack/lib/land-config.mjs`, beside LAND_NOTE_PREFIX (`:46`) | `tree movement kept:` | chosen 2026-10-25: names what the line points to; the movement authorizes nothing, so it does not say "relied on". Not sealed. |
| MOVEMENT_OPTION | `packages/nana-pack/lib/review-movement-config.mjs` | `--movement` | contract: R-2910, R-2912; one name for claude-review's writer and review-ledger's reader. Not sealed. |

Retired: MOVEMENT_FOLDER_PREFIX and MOVEMENT_FILE_NAME (`review-movement-config.mjs:25-28`).

## Seat wrong-code pairs

Each must turn its rows red. Pair 15's R-2907 half runs only on CI's Windows leg; the rest run on macOS.

1. claude-review passes no MOVEMENT_OPTION → R-2910.
2. claude-review stores `${section}\n\n` → R-2910.
3. claude-review stores and passes an empty section when the helper returns `null` → R-2910.
4. review-ledger reads MOVEMENT_OPTION but passes no record to `complete()` → R-2910, R-2913.
5. `complete()` writes `movement` to the audit line only → R-2910, R-2911, R-2913.
6. pi-review keeps its temp folder for the child and also stores a copy → R-2911.
7. pi-review removes the store copy in `finally` → R-2911.
8. pi-review passes no record to `complete()` → R-2911.
9. pi-review records a movement for a `null` section → R-2911.
10. review-ledger exits 1 on a MOVEMENT_OPTION with no intact file → R-2912.
11. review-ledger records the given hash without reading the store → R-2912.
12. keep plans no movement files → R-2913.
13. keep names the movement `r<round>-<role>-<movementsha8>.md` → R-2913.
14. KEEP_MOVEMENT_SUFFIX retuned to `-tree` → R-2913 (seal).
15. pi-review appends the section as argv text instead of the store path → R-2911 (every platform), R-2907 (Windows CI only).
16. keep writes movements in a loop after the pre-check, overwriting → R-2914.
17. nana-land prints no movement line → R-2915.
18. nana-land prints the line for any `movement` field, intact or not → R-2915.
19. nana-land refuses when a relied-on record's movement is altered → R-2915.

No one-place edit forces the launch-time store write to fail without also failing the round's record (R-2575), so both fallbacks are written, not pinned (known limit). The seat re-runs the mutation runner after any change of its own to code or tests.

## Precedent (verified at main 36af3dda)

- Store write under the lock: `packages/nana-pack/bin/review-round.mjs:443-472` (`writeReviewText`), `:482-512` (`withLock`), called in `complete()` at `:841-843`.
- Tally and audit fields beside `text`: `review-round.mjs:844-846`. Never-throw result form: `:810-864`.
- Hash-checked read and evidence: `review-round.mjs:407-440` (`reviewTextPath`, `reviewTextEvidence`, `readReviewText`).
- Keep name tunable and its pin: `review-round.mjs:86`; `packages/nana-pack/tests/review-ledger.test.mjs:587`.
- keep's planning, conflict and write steps: `packages/nana-pack/bin/review-ledger.mjs:52-97`.
- review-ledger's own-argument reader and warning form: `review-ledger.mjs:47-50`, `:134`; `complete()` call `:164`.
- Admission ignoring unparsed options: `review-round.mjs:639-656` (`parseReview`).
- nana-land relied-on names and report: `packages/nana-pack/bin/nana-land.mjs:117-142`, `:240-241`; prefix tunable `packages/nana-pack/lib/land-config.mjs:46`.
- pi-review's movement step, admission, child append, `complete()` and `finally`: `packages/nana-pack/bin/pi-review.mjs:177-187`, `:209-215`, `:218`, `:229`, `:244-248`; review-round import `:32`.
- claude-review's section, prompt and review-ledger arguments: `packages/nana-pack/bin/claude-review.mjs:87-92`.
- Retired tunables: `packages/nana-pack/lib/review-movement-config.mjs:25-28`.
- Test harnesses: claude-review `packages/nana-pack/tests/claude-review.test.mjs:309-322` (movement cases), `:347-361` (untracked); pi-review `packages/nana-pack/tests/immutable-review.test.mjs:32-59` (fake pi copying appended files), `:407-431` (movement cases, R-2901), `:197-199` (R-2904); review-ledger `review-ledger.test.mjs:79` (`storedTextFile`), `:119-122` (`ledgerRun`, `ledgerKeep`), `:584-620` (R-2573, R-2574); land `packages/nana-pack/tests/land.test.mjs:37-43` (`recordTextReview`), `:421-427` (R-2572).
- Narrowing an implemented row and moving its clause to a new row: `docs/reviews/review-texts-durable-2026-10-25/must-meet.md` (R-955 to R-2871).
- Rule text: `AGENTS.md:157`; `packages/nana-pack/skills/requirements/SKILL.md:142`. README: `packages/nana-pack/README.md:185`, `:202`, `:245`, `:270`.
- Claim lines that stay: `REQUIREMENTS.md:2217-2219`.

Helper move: none. `writeReviewText` stays private behind the new export. `recordTextReview` gains an optional argument in its own file.

## Class and builder

Hook class: the lane changes review-round, review-ledger, claude-review, pi-review and nana-land. The ladder:

- the roster's final reviewer, through claude-review;
- the land reviewer, through pi-review;
- the seat's wrong-code pairs above, and the mutation runner after any seat change;
- one independent check.

No local install check: no file under `packages/nana-setup/` and no hook changes. Builder: the roster's larger builder, `pi-worker --lane-size larger`. Size: medium, about 120 product lines and 200 test lines over five product files and four test files. The seat pushes the draft pull request at build 1 and reads R-2911 and R-2907 on its Windows leg before the review brief.

## The independent check

Run with `HOME` and `PI_CODING_AGENT_DIR` in a scratch folder holding a roster whose `reviewer` is a Claude Code entry, so nothing reaches the real ledger. Make a scratch clone of nana-pi with `main` at c0a78493, so the section runs 81,097 bytes. Run the worktree's claude-review with a fake `claude` and the worktree's pi-review with a fake `pi` against the clone's tip, on two revisions. Run the worktree's `review-ledger keep --into` a scratch folder. Compare each movement file byte for byte with the section each fake child received. Run the worktree's nana-land in the clone with a trivial suite and see one `tree movement kept:` line. Start pi-review with a fake `pi` that waits, send SIGKILL to pi-review and its child, and list `TMPDIR`: no movement folder. Repeat one review on a ledger-free repository: no `movement` field, no movement file.

## Known limits (the seat writes them to FEAT-007's file before the final round)

- A refused claude-review admission, or a stalled or failed review, leaves an unreferenced section file in the store. Nothing reads or removes it; the store never shrinks.
- The final round's movement lives only in the store on this machine, like its review text. nana-land names it; it is lost with the home folder.
- keep copies a movement only beside an intact review text, so a round whose review text is lost loses its movement copy too.
- A failed launch-time store write gives pi-review's not-computed line and claude-review's warning. No test forces either, since a broken store also fails the round's record.
- review-ledger trusts a hand launcher's MOVEMENT_OPTION to name the section it sent; it cannot see the prompt.
- nana-land names the kept movement but never compares it with the tip's movement.
- No code reads the kept copy's content; R-1460's last reader stays a person.
- Rounds recorded before this lane have no movement; keep writes none for them.
- The R-1460 known limits from review-movement stand (`docs/known-bugs/FEAT-007.md:110-122`); line 119's last sentence changes to the store write.

## Notes the seat writes before the final round

- HANDOFF: a Landed line; then `nana-writing HANDOFF.md`.
- FEAT-007 known-bug lines: the limits above; line 119's last sentence ("No test forces pi-review's section-file write to fail.") becomes the store-write sentence.
- A session entry in `docs/sessions/`.
- The movement for this lane, `node "$HOME/nana-pi/scripts/requirements-moved.mjs" --root . --base main` in the worktree, written once as a file in this lane's review folder. This lane's reviews run main's launchers, which add the movement but do not keep it.
- `review-ledger keep` with each fix commit and once before the final round, as the land checklist says.
- `docs/requirements-tree.md` and `docs/code-map.md` regenerated after any merge of main, with a confirmation round.

## Least sure

Naming the final copy in nana-land's success report. It is the only way the final round's movement reaches the land report with no hand step, since `keep` runs before the final round. But it adds code to the land path. The alternative is to leave nana-land alone and reword R-1460's person line to "the lane folder holds every non-final round's movement". That is cheaper and leaves single-round lanes with nothing to point to.
