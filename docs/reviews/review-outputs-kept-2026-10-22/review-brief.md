# Review — review-outputs-kept (every recorded review keeps its text by hash; keep copies a lane's texts; the timeline and the land read them), 2026-10-22 (the final reviewer)

Feature: FEAT-007 · Review a specific revision independently

Class: install, hook or gate (it changes review-round, review-ledger, pi-review and nana-land, the review and land tools). Threat model: honest variation in scope — a deleted scratch folder, two worktrees sharing one ledger, Windows paths, an output file missing or empty at record time, an over-cap round, a re-run on the same revision; deliberate forgery out (anyone who can write the agent folder can forge a text and its record, as the trust model already says for the tally).

Review `git diff 4608abd7..HEAD` on `feat/review-outputs-kept`. Main is 4608abd7 (report-deliverables, just landed). The lane branched from b195d89f, merged main at 46285fdd (suite-records) and at f8da8596 (report-deliverables); both merged lanes were reviewed and landed, and both merges were clean. The lane's own commits: e5f49956 (plan), 73b6c7c3 (build 1), 9be6a2fa (the seat's check of build 1 and brief 2), e574397a and 86bedefb (build 2), e13804d2 (the seat's pairs and checks), the notes commit, and the final commit with this brief.

The plan of record is `docs/reviews/review-outputs-kept-2026-10-22/must-meet.md`: the owner's "Store" ruling, decisions D1 to D5, nine rows (R-2568 to R-2576), the narrowing of R-1561 and R-1562, the tunables and the known limits; `plan-draft.md` and `plan-attack.md` are its inputs.

The seat's record:
- Wrong-code pairs: 17 of 17 red at 86bedefb, 12 by exactly their named titles and 5 with more checks red besides (`seat-mutate.mjs`, `seat-mutate-output-86bedefb.txt`): the planner's nine (record without the store write; the text re-read from the output path; the hash over trimmed or BOM-stripped text; the land ignores `text`; the land checks existence but not the hash; the timeline reads the audit path first; keep overwrites a differing file; keep ignores the repository scope; a store under the reviewed tree) and the adversary's seven, one split in two (an existing output file preferred; only the first matching LAND checked; the tally appended before the store write; a round kept on a failed store write; a malformed `text` treated as legacy; keep checking names as it writes; the hash after CRLF normalising; the temp file in the system temp folder).
- Session titles: 0 missing for both sessions.
- The independent check (`independent-check-86bedefb.md`) ran the whole flow in a temp HOME with a scratch repository, including a real nana-land merge, a one-byte corruption the land refused, recovery by re-running the review, pi-review with a fake pi, a failed store write, an old tally line and a copy of the real 1,105-line tally. It found no material problem; its three non-blocking lines are in FEAT-007's known bugs.
- Build 2's locked full suite: `205 files: 203 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8297 pass, 0 fail, 39 skip`. After the merge of main, map:check, req:tree, readme:check and the trace are green.
- The reviews of this lane run through main's review-ledger, which has no store yet, so their records carry no kept text; the land reads them as pre-store records and notes it.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement 4608abd..f8da859: 11 rows in 1 features
FEAT-007 · Review a specific revision independently
  R-1561 text changed
  R-1562 text changed
  R-2568 new (implemented)
  R-2569 new (implemented)
  R-2570 new (implemented)
  R-2571 new (implemented)
  R-2572 new (implemented)
  R-2573 new (implemented)
  R-2574 new (implemented)
  R-2575 new (implemented)
  R-2576 new (implemented)
```

CI: PR #168 at the reviewed tip is running; the seat lands only on green, and a red leg sends the lane back with its log. The notes commit adds the HANDOFF Landed line, the session entry, ten FEAT-007 known-bug lines and the independent check; the final commit adds only this review's two briefs.
