# Review — park-honestly (ten deliverables parked, two made by CI, a suite check on deliverable notes), 2026-10-23 (the final reviewer)

Feature: FEAT-028 · Maintain requirement identity and trace links

Class: ordinary (ledger lines, one suite check, the seat's HANDOFF notes). Threat model: honest variation in our tools' output (a park line written with the wrong separator, with no reason, in another capability's span, or on a row code makes and reads; a misspelled reader path; a reader path not yet committed; a git command that fails) is in scope; deliberate forgery out (a hand-forged ledger line written to pass the checker, a forged git listing).

Review `git diff c273b4de..HEAD` on `feat/park-honestly`. Main is c273b4de (pi-version-support, landed). The lane's commits: 51d6af9b (plan of record), 2bc3a90f (notes commit 1, the HANDOFF trim), 521016cc (build 1, the lane), 6c1632c2 (pairs), 6a57ba65 (notes), and the final commit with this brief.

The plan of record is `docs/reviews/park-honestly-2026-10-23/must-meet.md`: the owner's words, the seat's decisions on the attack (M1: R-301 and R-1150 get CI maker lines, not park lines; S1: reasons reworded so the code does not contradict them; S3: the check lists the index plus untracked files git does not ignore; S5 and S6: R-2731 and R-2732 drop), row R-2730, the exact ledger lines, and the known limits. `plan-draft.md` and `plan-attack.md` are its inputs.

The seat's record:
- Wrong-code pairs (`seat-mutate.mjs`): 5 of 5 turn R-2730 red at 521016cc, each by exactly its named title (`seat-mutate-output-521016cc.txt`). A park line under a feature heading or in a code fence is a declared non-pair.
- `node scripts/requirements-tree.mjs --check` prints `deliverables: 18 of 23 made and read by code, 18 parked` with no note (main: `16 of 33 …, 8 parked`).
- The product report built at the tip shows the ten new park claims. The session-start frontier block lists 27 asks, 25 optional and 2 parked; `nana-frontier` finds 0 findings at 1,174 words.
- The seat's diff check finds no removed escaped `\n`. Session titles: 0 missing. The seat's locked full suite at 521016cc: 217 PASS, 0 FAIL. map:check, readme:check, the trace and the tree check are green; `nana-writing HANDOFF.md` finds no long sentence.
- The notes fold in pi-version-support's late notes: its final reviewer's two notes and two first-try CI failures at its tip, as FEAT-015 and FEAT-003 lines.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement c273b4d..6a57ba6: 14 rows in 11 features
FEAT-005 · Communicate decisions clearly
  R-749 Parked lines changed
FEAT-006 · Launch builders with execution limits
  R-1400 Parked lines changed
FEAT-013 · Install and connect harness runtimes
  R-301 Made by/Read by lines changed
FEAT-014 · Create or adopt a project workspace
  R-327 Parked lines changed
  R-1150 Made by/Read by lines changed
FEAT-028 · Maintain requirement identity and trace links
  R-2730 new (implemented)
FEAT-029 · Navigate code and investigate impact
  R-1272 Made by/Read by lines changed
FEAT-031 · Run checks reliably and without contaminating work
  R-1239 Parked lines changed
FEAT-034 · Define reproducible comparisons
  R-509 Parked lines changed
  R-532 Parked lines changed
FEAT-035 · Account for cost and uncertainty
  R-535 Parked lines changed
FEAT-037 · Grade behavior with trustworthy checks
  R-507 Parked lines changed
FEAT-038 · Interpret workflow experiments and their limits
  R-536 Parked lines changed
  R-694 Parked lines changed
```

CI runs on the draft pull request at the reviewed tip, the Windows leg included. The seat lands only on green.

Ask above all: does each park line state a reason that is true of the code today and name what deletes it, do the two CI maker lines name runs that really make their deliverables, and can R-2730 fail a healthy suite run (a CI checkout, a Windows checkout, a lane worktree with uncommitted files)?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else.
