# Independent check — unread-verdict-loud at b42b541 (2026-10-19)

VERDICT: HOLDS

Setup: private clone at `<tmp>/unread-verdict-loud-check.49mWXw/lane` at b42b541, plus a main checkout at 713d6aa. Every probe used a temp HOME. No repository outside the temp folder was written.

Must-meet tests and neighbours, each file run alone:
- `node packages/nana-pack/tests/review-ledger.test.mjs`: exit 0 and 163 PASS. R-1620 to R-1623 pass, and so do the six retargets: the corpus and malformed checks, tree-scope and R-729 cwd. The R-139 retarget is covered by handoff-writer-role below.
- `watchdog-exit` 6/6, `handoff-writer-role` 7/7, `requirements-tree` 89/89 and `immutable-review` 18/18 all pass. `code-map.mjs --check` and `readme-check.mjs` both report 0 problems.
- Windows CI on the exact tip, run 39301089336: `suite (windows-latest)` completed with success. The log shows `review-ledger.test.mjs 161 pass, 2 skip`, and R-1620 to R-1623 all PASS on win32.

Probes:
1. Old and new verdict readers compared over 240,416 generated outputs (`diff.mjs` and `diff2.mjs`): `cases=200000 differ=0` and `cases=40416 differ=0`. All five conditions were hit, and LAND, SEND-BACK and BLOCK were accepted.
   Verdict: what the reader accepts is unchanged byte for byte.
2. `review-ledger run` with `VERDICT: LAND\n\nOne note.\n\nVERDICT: LAND - no MUST findings\n`, run on main and on the lane:
   - main: `verdict recorded for item probe-b (round 1)`, exit 0, tally verdict null.
   - lane: `verdict unread for item probe-b at 2b862f7c359c (round 1): selected line 5 "VERDICT: LAND - no MUST findings" — the selected final line does not match the allowed verdict grammar; nana-land will refuse this revision for good — make a new commit and review it; 2 of 3 rounds remain for the item; review kept at $P/r1/out-lane.md`, exit 1.
   - Both write the same tally record (null). The --out file is kept at 59 bytes, and no reservation is left over.
   Verdict: works as planned.
3. `pi-review` with a fake pi printing `VERDICT: LAND\n\nNo MUST findings. The verdict covers the tip.\n`:
   - main: `SUCCESS ... round 1`, exit 0.
   - lane: `pi-review: verdict unread ... selected line 1 "VERDICT: LAND" — a later non-blank line mentions verdict; line 3 "No MUST findings. The verdict covers the tip."; ... 2 of 3 rounds remain`, exit 1.
   - --out is kept at 61 bytes. `git worktree list` shows only the main checkout, so the temporary checkout was removed.
   Verdict: works.
4. Readable `Findings: none.\n\nVERDICT: LAND\n` through pi-review and review-ledger, on main and on the lane: all four runs exit 0. `diff` of the main and lane stderr prints `stderr identical`.
   Verdict: no regression on the success path.
5. nana-land against the claim in the note. On one tip, an unread review ran first, then a readable LAND review: `review-ledger: verdict recorded for item land-x (round 1; ...)`. Then `nana-land merge ... --reviewed <sha>=land-x` printed `refused: non-LAND verdict record(s) for c713511…: land-x/c713511…/empty`, exit 1. Main stayed at `2b862f7`.
   Verdict: the "nana-land will refuse this revision for good" text is true.
6. Tree edited during the review, with an unread shape: main and lane print the same text, `review written to ..., but review ledger: the reviewed tree changed during the review ...`, and both exit 1.
   Verdict: matches the plan's known limit, no change.
7. Re-review and dirty tree:
   - Re-running an unread shape on the same revision repeats `(round 1)`.
   - A dirty tree prints `at 2b862f7c359c+snap:f7694a…(round 2)` and `1 of 3 rounds remain`.
   Verdict: matches the documented limits.
8. Control characters in the selected line:
   - `VERDICT: LAND \x1b[31m\u2028x` comes out with ESC escaped as `\u001b`. stderr has 2 lines (admission and note), and no raw ESC appears (`grep -c` of ESC = 0).
   - `VERDICT: LAND\u009b31m` (a C1 control) comes out raw: `od` shows bytes `302 233` inside the quoted text.
   Verdict: ESC is escaped; C1 and U+2028 are not (see finding 1).

Findings (none MUST):
1. Known bug, low. `JSON.stringify` escapes only C0 controls. C1 controls such as U+009B (8-bit CSI) and U+2028/U+2029 reach stderr raw. So the README sentence saying "control characters cannot reach the terminal raw" is slightly too strong. Common UTF-8 terminals do not act on U+009B, and honest reviewer output almost never contains it.
2. Known bug, low; needs tampering, so it is outside the threat model. `complete()` now calls `decide()` after the append even when the verdict is readable. If `decide()` throws there, a recorded LAND becomes exit 1 with "review written ..., but ...". Example: the rotated audit file swapped for a symlink during the review. Before this lane the same run exited 0. A narrower fix computes the count only when the verdict is null.
3. Observation, same as main and not caused by this lane. After an unread round, a readable re-review of the same revision prints "verdict recorded" and exits 0, but nana-land still refuses (probe 5). The earlier unread note had already said so, which is what the lane intends.

No harm found: no data lost or corrupted, no write outside the worktree or temp folder, and no install or hook touched. No fail-open either: exit 1 is louder, nana-land is unchanged, and the readable-verdict path keeps today's output byte for byte.
