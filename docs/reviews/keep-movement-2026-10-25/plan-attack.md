# keep-movement · adversary pass on the plan draft (main 36af3dda)

Counts: 0 MUST, 4 SHOULD, 8 NOTE. Evidence paths are repo-relative. `pd:` is `<scratch>/lanes/keep-movement-plan-draft.md`. Everything below was read at 36af3dda, read only; nothing in a repository was written.

## Checked and clean

- **File:line claims that hold.** These were opened and say what the plan says:
  - review-round.mjs:86, :407-440, :443-472, :482-512, :515-530, :639-656, :654, :810-864 and :844-846;
  - review-ledger.mjs:47-50, :52-97, :64-74, :72, :80-90, :134 and :164;
  - pi-review.mjs:11, :32, :39, :73, :82-104, :177-187, :185, :209-213, :218, :229 and :244-248;
  - claude-review.mjs:87, :90-91 and :94;
  - nana-land.mjs:240-241; land-config.mjs:46; review-movement-config.mjs:25-28;
  - REQUIREMENTS.md:723 (R-2901), :791 (R-2576) and :2217-2219 (R-1460's claim lines);
  - the pack README:185, :202, :245, :270 and :274 (the verdict rule sits inside that long line);
  - AGENTS.md:157; requirements SKILL.md:142; docs/known-bugs/FEAT-007.md:110-122 and line 119;
  - review-outputs-kept must-meet.md:9 (117 of 416); land-records must-meet.md:70;
  - review-ledger.test.mjs:79, :119-122 and :587; land.test.mjs:37-43 and :421-427; immutable-review.test.mjs:18, :32-59, :197-199 and :425-431;
  - pi 1.0.2 `docs/cli.md:219` (`--append-system-prompt <text|path>`).
  The slips are in item 12.
- **The tree checker's line.** `node scripts/requirements-tree.mjs --root .` prints `0 problems; rows 2047; features 39` and `deliverables: 21 of 21 made and read by code, 21 parked`, as the plan says.
- **The IDs.** R-2910 to R-2919 are free on main, in every worktree under ~/nana-pi-wt, and in every sibling draft (the old review-movement draft only says they "stay free").
- **The old contract.** `readTally` checks only `v`, `kind`, `repo`, `item` and `revision`, so an extra `movement` field is safe for old code, provided `v` stays 2 (item 9). No code outside review-ledger and nana-land reads the store by name. The state manifest already lists the store as durable (state-manifest.mjs:49), so no `ledgerPaths` key and no nana-setup change is needed. No code parses nana-land's success report or `review-ledger report`. Nothing outside pi-review.mjs:39 and immutable-review.test.mjs:18 imports the two retired tunables.
- **The kept-text hash and nana-land's checks.** The kept text's bytes, its hash and the verdict reading do not change. R-2571's refusal, R-2572's relied-on lines and R-2576's earlier-blob note read only `row.text`. A movement authorizes nothing.
- **Windows.** pi-watchdog starts a win32 fake pi straight from Node with argv intact (fake-pi.mjs:15-19). immutable-review.test.mjs runs on CI's Windows leg (seat-win-pairs-53081c82.txt shows a long temp path, not an 8.3 one). Both test harnesses set `USERPROFILE` beside `HOME`. `* text=auto eol=lf` holds for the lane folder, and the section is LF-only.
- **Class and ladder.** Hook class is right: the lane changes review-round, review-ledger, claude-review, pi-review and nana-land. The roster gives `reviewer: claude-code opus` (claude-review) and `land: openai-codex gpt-6-astra` (pi-review), with `largerBuilder` sol. Skipping the local install check matches land-records and review-movement. The install check runs the PATH copy of pi-review against a repository with no ledger, so it would not reach the movement path anyway (install-check.mjs:446-475). CI's install-check legs still run the lane's pi-review on its no-section path.
- **The frozen page.** No page code changes. FEAT-007 gains rows as data only, as review-movement's rows did during the freeze.
- **Skill claims.** R-598's claim reader checks path, package-script and `scripts/…` flag claims. The new SKILL.md sentence names `review-ledger keep` and nana-land, which are neither, so it cannot repeat review-movement's build-1 block.
- **Tunables and helpers.** KEEP_MOVEMENT_SUFFIX sits beside KEEP_NAME_HASH_CHARS, and its seal follows R-2573's form. MOVEMENT_OPTION is read by name by its one writer and one reader. `keepMovementText` reuses the private `writeReviewText` under `withLock` instead of copying it. No inline tunable is introduced.

## Findings

1. **SHOULD: no lane's landed movement ever reaches the repository. After the seat's scratch folder and chat are gone, the owner finds it only by a hand query of the tally.**
   - `keep` runs "with each fix commit and once before the final round", and nothing is written after a land. So the final round's copy, which is the movement that landed, is never in any lane folder. That holds for every lane, not only single-round ones.
   - 31 of the 43 lane folders dated 2026-10-22 to 2026-10-25 hold no kept review text at all, because their only round was the final one. Under this plan those folders also hold no movement.
   - In multi-round lanes the folder holds the sent-back rounds' movements. Those often differ from the landed one, since fix rounds change rows. An owner who opens `r1-…-movement.md` reads the wrong movement, and nothing says which copy landed.
   - The only pointer to the landed copy is nana-land's success line, which names a bare 64-hex basename with no folder. That line lives in the seat's terminal and its land log, and the land logs sit in the seat's scratch folder (for example `<scratch>/lanes/rm-land.log`). The land record that nana-land keeps (R-2811) does not carry it, and `review-ledger report` does not print it.
   - The store is on one machine. An owner following from another device cannot open it, while the committed lane folder is on the remote.
   - So R-1460's person line is true at land time, if the seat copies the name into its report. It is not true "after the seat's scratch folder is gone" unless the owner kept that message and sits at that machine.

   Fix, pick one; the default is B:
   - **A (repository copy).** `keep --into` also writes the current tip's movement as `movement-<head8>.md`, computed by `reviewMovementSection`. The checklist already runs keep before the final round, so the landed movement is committed in the reviewed change and readable from any device. Its rows equal the final section's; only the header's head revision differs. This needs keep to stop exiting 1 on an item with no kept text, which changes R-2573's `empty.status === 1` clause. It is the subtraction option for the person reader: with it, the review-ledger option and the nana-land line become optional.
   - **B (durable lookup, smallest).** Keep the plan, and add the movement file name as one field of `review-ledger report` (README:241). The tally is permanent, so `review-ledger report --item <lane>` finds the landed movement after the session. Have nana-land's line name the store folder (`review-ledger.texts/<name>`), so the land report's one pointer opens a file. Say both in the new AGENTS.md and SKILL.md sentence.
   - **C (honest claim).** Leave the code as planned. Then change R-1460's person line, through R-2905's pinned wording, to say the land report names the final round's copy in the review store on the seat's machine. Add a known limit that the landed movement is never in the repository.

2. **SHOULD: both store-write fallbacks can be pinned. The plan's claim that "no one-place edit forces the launch-time store write to fail without also failing the round's record" is false.**
   - Plant a directory at `review-ledger.texts/<sha256 of the expected section>.md` before the launch. The test already rebuilds the exact section from the real script's report, so it knows the hash.
   - `writeReviewText` then throws on that name: `readBufferChecked` → `openChecked` → `refuseNonRegular`, "is not a regular file (a directory)" (review-round.mjs:367-389, :447). Admission still passes, because the store is a directory (review-round.mjs:622-623). The review text has another hash, so `complete()` stores it and records the round.
   - The planted directory works the same on every platform. The fallbacks are the stakes line's core promise, that every new path warns or omits and never refuses. They sit on the path every later review takes.

   Fix: add two rows and tests.
   - R-2916: "IF the review store cannot keep the tree movement section, THEN claude-review shall send the reviewer the same prompt, print one warning, and record the round with no movement reference."
   - R-2917: "IF the review store cannot keep the tree movement section, THEN pi-review shall append one not-computed tree movement section, record the round with no movement reference and exit 0."
   - Add a pair for each: "the fallback throws" and "the fallback records a movement". Drop the known limit and the "written, not pinned" sentence. Also fix known-bug line 119's replacement sentence.

3. **SHOULD: the README does not declare the new tally field or the store's second content where consumers read them.**
   - AGENTS.md's rule says contract changes are declared where the consumer reads them, including the pack README.
   - The tally's field list (README:157-158) does not gain `movement`.
   - The store's description (README:160) still says it holds "the captured UTF-8 review texts" and that completion stores them. After this lane it also holds movement sections, written at launch. Some of them are referenced by no tally line (refused, stalled or failed reviews).
   - The plan's README list covers :185, :202, :245 and :270 only.

   Fix: add `movement: { sha256, bytes }` to :157-158's fields. Add one sentence to :160: launchers also store each sent tree movement section at launch, referenced by `movement`, and a refused or failed review leaves its section unreferenced. If item 1's option B is taken, also update :241.

4. **SHOULD: four red cases the plan lists cannot go red with its fixtures, and two rows claim a byte count no test reads.**
   - R-2913 lists "a movement written for a round whose movement is altered". Its fixture has two intact movements and one round without one, and no altered one. Add a fourth round whose stored movement is altered by one byte after the run: no movement file for it.
   - R-2915 lists "a line for a record the land did not rely on". Each case has one record. Add an extra record that the land does not rely on: a LAND record at a revision not passed to `--reviewed`, holding an intact movement. Assert no line names that record's movement. Add a malformed `movement` value too (`null` and a string). nana-land is the land path, and a `row.movement.sha256` without `?.` would refuse every land that meets one.
   - R-2910 and R-2911 say "by sha256 and byte count", but their tests compare only the path and the content. Assert `row.movement.bytes === Buffer.byteLength(section)` in both. keepMovementText's own `bytes` value reaches the tally unchecked on pi-review's path. The fixture section carries the multi-byte `·` from `FEAT-001 · Alpha` (ledger-repo.mjs:17-19), so a count in characters would fail.
   - R-2912's "no warning" red case has no pair. Add "review-ledger drops a bad movement option silently".

5. **NOTE: the least-sure point — keep the nana-land line, but dedupe it and make its absence visible.**
   - Without the line, nothing automatic names the landed movement (item 1). It is a few never-throw lines inside `checkRecords`, and pair 19 covers the refusal risk.
   - Two reviewers of one revision usually get byte-equal sections. The plan lists that as an honest variation: one store file, two references. R-2915's "one line … of each relied-on LAND record" then prints the same line twice. The independent check expects one line. The relied lines are deduplicated with `new Set` (nana-land.mjs:240). Word the row "one line for each distinct kept movement file of the relied-on LAND records", and dedupe in code.
   - A missing or altered landed movement prints nothing, so the land report silently has nothing to point to. Print one `[nana-land] note:` line, as nana-land.mjs:135 does for a kept review text. It never refuses.

6. **NOTE: two ways a home path can reach a committed file and turn the identity scan (R-2511) red at land.**
   - pd changes pi-review's fallback reason from `error.code` to `section file: <message>`. `withLock`'s message names the absolute lock path under the home folder (review-round.mjs:507). That text goes into the land reviewer's prompt, and a reviewer that quotes it puts the path into a review text that keep commits. Keep the code-only reason.
   - A not-computed section from a crash can begin with node's `file:///<home>/…` location line (known-bug line 118). It is now stored, kept and committed. R-2511 scans every tracked file, so the land's suite fails. Deleting the copy does not stick, because the next keep writes it again. Add a known limit, and have the seat check not-computed copies before committing.
   - Also on the fallback: it throws away a section that was computed fine, so the land reviewer reviews without it whenever the store write fails. State that trade, or fall back to passing the section inline when it is under 32,767 characters.

7. **NOTE: keep's output and naming.**
   - The count line `kept N review text(s)` will count movement files as review texts. Count them apart, or say "file(s)".
   - A row whose movement is missing or altered silently gets no copy. Print one stderr warning naming it.
   - Pairing the name with the review text gives one copy per review. Two reviewers of a round usually saw byte-equal sections, so the folder gets duplicates.
   - Two same-role reviews of one revision with byte-equal review texts and differing movements (main moved between them) map to one movement name. keep then refuses the whole command (review-ledger.mjs:72). This is rare, but it blocks a checklist step. `r<round>-movement-<movementsha8>.md` avoids both. Pair 13 would need rewording if this is taken.

8. **NOTE: known-bug line 111 becomes a kept record.** claude-review computes the section before admission. A commit in that gap gives a section whose head is the previous commit. That section is now stored as the round's movement, and nana-land names it as the landed one. Add a known limit: the kept movement's header can name the commit before the reviewed revision.

9. **NOTE: three things the build brief should say.**
   - The tally line stays `v: 2`. `readTally` refuses any other version (review-round.mjs:522), so a bumped version would refuse every admission on the machine.
   - pi-review calls `keepMovementText` after `startHeartbeat` (pi-review.mjs:215), not between :213 and :215. The lock wait can reach 15 s, while test reservation windows go down to 500 ms (review-round.mjs:96-99).
   - review-ledger reads the option after admission, inside try/catch. `readReviewText` throws when the store path is not a directory (review-round.mjs:434). Read before admission, that throw prints a stack in place of admission's clean refusal, and the review-ledger tests check for stacks (`noStack`, review-ledger.test.mjs:123).

10. **NOTE: row bookkeeping.**
    - The R-955 precedent kept R-955's remaining test unchanged and moved a clause to a new row. Here an `implemented` row's test loses clauses, and R-2911 asserts the opposite of the dropped clause. Say so in the plan, or retire R-2901 and add its narrowed text as a new row.
    - R-2914 restates R-2574, whose row already covers "a name keep would write". A movement case added to R-2574's test would do the same work with one row fewer.

11. **NOTE: the independent check's kill step proves nothing once no folder is made.** Listing TMPDIR for a movement folder after SIGKILL is true by construction. Instead, kill pi-review during the store write (hold the lock from a scratch process, then kill). Check that no `.<sha>.<pid>.<rand>.tmp` is left in the store, and that the next launch takes over the dead holder's lock. Also run the planted-directory fallback from item 2 once on each launcher.

12. **NOTE: four line claims are wrong; the conclusions stand.**
    - pd says claude-review "sends it on stdin (`claude-review.mjs:87-88`)". Line 87 computes the section and 88 builds the prompt; stdin is at :94-97.
    - pd gives `claude-review.test.mjs:309-321` as "the R-2900 small case and the R-2902 trunk case". Those lines are the `movementCase` helper. The small case is at :323-328 and the trunk case at :330-345.
    - pd gives `immutable-review.test.mjs:407-421` as "the R-2901 small case and the R-2908 trunk case". The trunk case is at :440-446.
    - pd gives `checkRecords` as `nana-land.mjs:118-142` and `:117-142`. It runs from :118 to :145.
