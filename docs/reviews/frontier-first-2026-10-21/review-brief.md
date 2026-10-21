# Review — frontier-first (HANDOFF opens with its live sections; the frontier checker reports file-size, section-order and read-window), 2026-10-21 (the final reviewer)

Feature: FEAT-002 · Resume decisions and next actions

Class: ordinary (a report-only pack CLI, its config, test and fixture, the pack README, the ledger, and the seat's notes moves; no install, hook, extension, gate, land or review tool). Threat model: honest variation in scope — seats and the owner edit HANDOFF by hand (a Landed section placed above Next, very long lines, multi-byte text, heading suffixes and nested headings, a merge that puts a frontier block back below Landed, the read limits as pi 1.0.2 and Claude Code ship them); deliberate forgery out (look-alike headings, hidden frontier text, renamed headings).

Review `git diff 363df471..HEAD` on `feat/frontier-first` (main is 363df471; the lane has not needed a merge). The plan of record is `docs/reviews/frontier-first-2026-10-21/must-meet.md`: four must-meet rows (R-2470 to R-2473), the read-window facts, the tunables, the design, the seat steps, the known limits and what is out of scope. `build-brief-1.md` and `build-brief-2.md` are the two builder sessions (e08eb03d, e8096fd4); the seat's record is `seat-verify-e8096fd4.md`, with the wrong-code pairs in `seat-mutate.mjs` and `seat-mutate-output-e8096fd4.txt` (10 of 10 red). CI: see the figures section added at the tip. The land runs the locked suite on the reviewed tip.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, at e8096fd4 plus notes):

```
tree movement 363df47..e8096fd: 4 rows in 1 features
FEAT-002 · Resume decisions and next actions
  R-2470 new (implemented)
  R-2471 new (implemented)
  R-2472 new (implemented)
  R-2473 new (implemented)
```

Judge whether the feature works for a seat that reads this repo's HANDOFF at startup in either runtime, and report:
- each must-meet check is red with its feature removed or with the obvious wrong code (the seat's ten pairs are the record), and green with it;
- the read-window rule matches pi's own truncation (`truncateHead` keeps line k while the bytes of lines 1..k plus the newlines between them stay within 51,200; a section's end byte excludes the end line's own line ending), and the line count matches pi's;
- R-2473 is the one intended suite-level pin of this repo's HANDOFF order; the out-of-scope item "running the CLI at land or in CI" means running the CLI itself there, not this suite check;
- the three existing-check edits are contract changes the new kind forced (named in the seat record), not weakening: the `current` golden gains only section-order lines and its count; the frozen rewrite now reports exactly three section-order findings; the frozen pre-rewrite file reports 15 findings with its kind assertions unchanged;
- the seat's HANDOFF restructure loses nothing: the 153 moved Landed lines are verbatim in `docs/sessions/2026-10.md`; the Carried residuals are unchanged except the three named clause edits; every rewritten Open ask keeps the `- **[kind, since date] Title.** body` form the product report parses; the dropped asks and Next items are each spent, answered or closed by a ruling as the session entry says;
- the writing trial's after-measure in `docs/reviews/writing-trial-2026-10-04/after.md` reproduces with the command it records, and the session entry, HANDOFF lines and folded cap-fields-own late notes are accurate.

Known limits already carried (do not send back for them): the whole-file size finding stays until known bugs move to one file per feature (the owner's later lane); Claude Code still cannot read the file in one call; the word budget stays over; nothing runs the CLI at land or in CI; only three live names count; no CRLF byte-count test; the window copies pi 1.0.2's defaults; long single Landed lines are not flagged; concurrent lanes meet a HANDOFF merge conflict.

Probe in a temporary folder with a temporary HOME. Do not edit the worktree.

## CI figures (run 39623316975 at 66e0b9a2, the notes commit)

0 failing on all three legs: macOS 198 PASS, 0 FAIL, 2 SKIP of 200 files (8,223 checks pass, 36 skip); Ubuntu 197 PASS, 0 FAIL, 3 SKIP of 200 files (8,162 checks pass, 56 skip); Windows 182 PASS, 0 FAIL, 18 SKIP of 200 files (7,151 checks pass, 115 skip). `frontier.test.mjs` 51 pass on each leg. The install check passes on macOS and Windows. The Windows leg's log is `ci-windows-66e0b9a2.log` in this folder. The commit that adds this section and the log changes no code.
