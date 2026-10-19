# unread-verdict-loud: build brief 1

Feature: FEAT-007 · Review a specific revision independently. Lane unread-verdict-loud on feat/unread-verdict-loud.
Start from main only after clean-revision lands. Class: gate. New row IDs: R-1620 to R-1623 only. The plan is
must-meet.md beside this brief, and its note format, shapes and retargets are binding. Builder: larger (pi-worker
--lane-size larger). Run single test files only. The seat runs the locked full suite.

## Change, in this order
1. REQUIREMENTS.md, SUB-009: add R-1620 to R-1623 as `planned`, with the row text from the plan. In SUB-008, narrow
   R-1390's text to "WHEN pi exits 0 with review-shaped output whose recorded verdict is not empty (R-1010) before
   the watchdog's first poll, pi-review shall ...". Keep the rest and its evidence.
2. review-ledger.test.mjs: add the four checks, with titles exactly as in the plan. Each `// req:` line sits directly
   above its `check("…` line. Run each against today's code and see it red. Then make the six retargets the plan lists
   and no other test edits. CAP comes from `mod.REVIEW_ROUND_CAP`. Build the R-1623 repo with `repo(name, CAP + 1)`.
3. lib/verdict-config.mjs: add one frozen table of condition texts. It holds R-1010's four conditions plus empty output.
   Mark its provenance as "chosen" with the reason. Reword @purpose as one sentence covering both tables. Update
   @outputs.
4. review-round.mjs: the reader keeps acceptance byte for byte. It also returns the selected line (1-based physical
   number on its own split, text without CR), the condition, and the first trigger line. complete() reads the output
   once, records as today, and returns `{ok:true, round, verdict, unread}`. For rounds left, call
   decide(p, held, held.revision, undefined, false) after the append and take max(0, CAP - used). Update @outputs.
5. review-ledger.mjs and pi-review.mjs: when `unread` is set, print `<prefix>: <note>` as one stderr line in place of
   the success line, then exit 1. pi-review may throw it into its existing catch. Update @errors, @outputs, and the
   Exit and usage comments.
6. packages/nana-pack/README.md: update the pi-review exit sentence ("exit 1 means every attempt failed"), the
   review-ledger run paragraph, the "completed verdict earns the round" bullet, and the Limits paragraph.
7. Run `npm run req:tree` and `npm run map`. Set the R-291 leaf total and its title to the total that
   `node scripts/requirements-trace.mjs` prints. Flip the rows to implemented.

## Do not
- Change what the reader accepts.
- Add a watchdog retry.
- Release the reservation on an empty verdict.
- Re-read the output after recording.
- Add a new module.
- Write a second round-counting rule.
- Write the cap or the condition texts inline.

## Wrong code to try (each must turn the named check red)
- W1: review-ledger keeps exit 0 → R-1620.
- W2: pi-review keeps SUCCESS and exit 0 → R-1621.
- W3: pi-review prints the line but exits 0 → R-1621.
- W4: the launcher releases instead of recording → R-1620 and the retargeted R-1010 checks.
- W5: the line number counts non-blank lines only → R-1622.
- W6: the line number is 0-based → R-1622.
- W7: a first-line conflict is named as first-line grammar → R-1622.
- W8: the trigger line is dropped → R-1622.
- W9: the CR is kept, or the tab is printed raw → R-1622.
- W10: the note goes to stdout → R-1622.
- W11: rounds left is cap − used + 1, has no floor, or is the constant cap → R-1623.
- W12: the nana-land clause is dropped → R-1623.
- W13: a readable verdict exits 1 or prints the line → the R-1620 or R-1621 control.
- W14: the reader accepts an agreeing bold first line → R-1620 and the existing R-1010 check.
- W15: rounds left is taken from the count before the append → R-1623.

## Done
- The four new checks and six retargets pass. These files pass when run one at a time: review-ledger,
  handoff-writer-role, land, immutable-review, path-spelling, watchdog-exit, review-standard, review-round,
  requirements-tree and requirements-trace.
- `npm run map:check` and `npm run readme:check` exit 0. requirements-trace reports 0 problems and ears 0.

## Report (at most 10 lines)
VERDICT line; commits; rows flipped and the R-1390 edit; the six retargets by title; W1 to W15 with each red check;
every command with its exit code; what was not done.