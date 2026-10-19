# unread-verdict-loud: an unreadable verdict fails at the review, not at the land (2026-10-19)

Feature: FEAT-007 · Review a specific revision independently
**Sentence.** When a completed review's recorded verdict is empty, pi-review and review-ledger run each print one stderr
line. It says why, that nana-land will refuse the revision, and how many rounds remain. Then the launcher exits 1.
A readable verdict keeps today's output and exit 0.

**Lane class: gate** (land and review tools: pi-review, review-round, review-ledger). Reviewers: the roster reviewer
(final), the land reviewer (seat-land.md only when the roster prints land: seat), the seat's wrong-code pairs through the
mutation runner, and one independent check that includes the Windows CI leg on the exact tip. There is no install-check
because nana-setup is untouched. **Threat model:** honest variation in reviewer formatting (bold, marks, CRLF, a trailing
tab, notes after the verdict), platforms and configs is in scope. Deliberate forgery is out. Anything outside is a residual.

**Today** (probed on main f29827a, temp HOME; the adversary re-ran it). Shapes (a) to (d) below and a no-label first line
went through review-ledger run. Each exited 0 with "verdict recorded" and left a null tally verdict. pi-review on (a)
printed SUCCESS and exited 0. nana-land refuses a named revision that has any non-LAND record, an empty one included
(R-1004). A re-run cannot clear the record; only a new commit can. An owner project already carries nine such records.

## Design
- The reader keeps its acceptance byte for byte (R-969 and R-1010 do not change). It also returns three things:
  - the selected line: its 1-based physical number on the reader's own `\r?\n` split after the one BOM strip, and its
    raw text without CR;
  - the R-1010 condition that emptied it;
  - for a first-line conflict or a later mention, the first such trigger line.
- complete() reads the output once and records as today. It returns `{ok:true, round, verdict, unread}`, where unread is
  null for a word and the note otherwise. Rounds left = max(0, REVIEW_ROUND_CAP - decide(p, held, held.revision,
  undefined, false).used), computed after the append. It reuses decide() and adds no second counting rule.
- Each launcher prints `<prefix>: <note>` as one stderr line in place of "verdict recorded" or "SUCCESS", then exits 1.
  The round stays consumed. --out is kept. The watchdog adds no retry.
- The condition texts form one frozen table in lib/verdict-config.mjs. Its provenance is "chosen": the wording is chosen,
  and its keys follow R-1010's four conditions plus empty output. The module's @purpose becomes one sentence covering
  both tables. Tests import the table.
- Note format (tests assert its pieces): `verdict unread for item <item> at <shortrev> (round <n>): selected line <L>
  <JSON text> — <condition>[; line <M> <JSON text>]; nana-land will refuse this revision for good — make a new
  commit and review it; <k> of <cap> rounds remain for the item; review kept at <out>`
- Row fix: R-1390 says pi-review exits 0 on review-shaped output, which contradicts R-1621. Its text is narrowed to
  "review-shaped output whose recorded verdict is not empty (R-1010)". Its test stays green unchanged.

## Must-meet (file: packages/nana-pack/tests/review-ledger.test.mjs)
| Row | Test title | Checks | Today |
|---|---|---|---|
| R-1620 | `review-ledger run exits 1 when the recorded verdict is empty and 0 when it is a word` | shape (a) → exit 1; the last tally record is this item with a null verdict; 1 round. Control `notes\nVERDICT: LAND` → exit 0, "verdict recorded", no "verdict unread" | red (probe: exit 0) |
| R-1621 | `pi-review exits 1 without its success line when the recorded verdict is empty` | plain-review stub with (a) → exit 1, no SUCCESS, null recorded. Default stub → exit 0 and SUCCESS | red (probe: exit 0, SUCCESS) |
| R-1622 | `an empty verdict prints one stderr line naming the selected line, its condition and the conflicting line` | shapes (a) to (d) via review-ledger and (a) via pi-review. Each has exactly one "verdict unread" line with `selected line L "<json>"`, the imported condition, and `line M "<json>"` where the condition has a trigger | red (no such line) |
| R-1623 | `the empty-verdict line says nana-land refuses the revision and counts the rounds left` | a repo with CAP+1 commits and one item. Review i runs at commit i, the last one with --over-cap. Each note carries "nana-land will refuse this revision" and `max(0,CAP-(i+1)) of CAP rounds remain`. One pi-review on a fresh item shows `CAP-1 of CAP` | red (no such line) |

Shapes, with physical line numbers:
- (a) `**VERDICT: LAND**\r\n\r\nbody\r\nVERDICT: LAND\r\n`: selected line 4; first-line conflict; trigger line 1.
- (b) `notes\n\nVERDICT: LAND!\t` (no final newline): selected line 3; final-line grammar.
- (c) `` `VERDICT: LAND`\nnotes\n ``: selected line 1; first-line grammar.
- (d) `VERDICT: LAND\n\nThe verdict holds.`: selected line 1; later mention; trigger line 3.

CAP is imported from review-round. No check is skipped on any platform. On win32, pi-review uses writeFakePi's
plain-review mode, which node runs directly with no cmd shim, and the multi-line text arrives through env.

## Retargets (each keeps the check's meaning; both planner and adversary reproduced the six)
1-3. review-ledger.test, R-969 `corpus-final`, R-1010 malformed suffixes, and the R-969/R-1010 refused-position `run`
   helper. Each null case expects exit 1 and asserts that the last tally record's item is the item that ran.
4-5. R-621/R-705 `scratch launcher cwd with --tree ...` and R-729 `review-ledger child executes from selected
   directory ...`. The child prints its cwd on line 1 and then `VERDICT: LAND`. The reads take line 1.
6. handoff-writer-role R-139 (POSIX only). The stub prints the env line and then `VERDICT: LAND`.

## Known limits
- The reader does not change. A bold first line that agrees with the final line still empties the round. Accepting it
  would loosen R-1010, which is the owner's call.
- Exit 1 from these launchers no longer always means that no round was spent. The line says so.
- A tree that changed mid-review prints only today's "changed during the review" message.
- For a dirty-tree review, the note prints the snapshot revision. nana-land refuses that snapshot's HEAD commit.
- Re-reviewing an already-counted revision shows an unchanged count. In-flight reviews count as used, as at admission.
- The empty-output condition can only be reached by a direct complete() call; no test pins its text.
- The line has no length cap. A long selected line prints whole, escaped as JSON, so control characters cannot reach
  the terminal raw.
- review-timeline (in review) has its own verdict reader, and this lane leaves it alone.