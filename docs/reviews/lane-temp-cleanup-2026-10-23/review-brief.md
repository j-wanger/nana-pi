# Review — lane-temp-cleanup (no carried Claude settings left in the temp folder), 2026-10-23 (the final reviewer)

Feature: FEAT-006 · Launch builders with execution limits

Class: gate ladder, on the owner's word (pi-worker only; by AGENTS.md's letter the lane would be ordinary, since pi-worker is not a land or review tool, hook, extension, gate policy or nana-setup). Threat model: honest variation in platforms, every handled exit path in lane mode, stop signals at any moment, a closed or broken standard-error pipe, the caller's exported environment (`CLAUDE_CONFIG_DIR` set, empty or absent), pi and Claude roster entries, and missing or malformed user settings; a pi seat's ordinary stop (a process-group SIGKILL) is in scope but not closed, a known limit; deliberate forgery out (another process of the same user reading the 0600 file during a build, a planted temp folder, an edited pi-worker or roster).

Review `git diff f2b27357..HEAD` on `feat/lane-temp-cleanup`. Main is f2b27357 (linked-folder-advice, just landed). The lane branched from 8c24e357 and merged main once: a05ca546 (linked-folder-advice; no conflicts). The rest of that merge diff is the landed lane, already reviewed there. The lane's own commits: c5375502 (plan of record), e5bf20ed (build 1, the lane), 0c03c530 (seat finding F1, build brief 2), f3df8596 (build 2, the stray suite output removed), a3293dc4 (pairs and probes), 7c93dbf0 (notes), and the final commit with this brief and the land brief.

The plan of record is `docs/reviews/lane-temp-cleanup-2026-10-23/must-meet.md`: the measured cause, the seat's decisions on the attack (M-1: a pi seat's ordinary stop named as the common hard kill, not closed; S-1: the closed-pipe fix; S-2: a missing-brief run; S-3: a pi build in R-2693; S-4: the leftover-folder rule), rows R-2691 to R-2693, and the known limits. `plan-draft.md` and `plan-attack.md` are its inputs.

The seat's record:
- Wrong-code pairs (`seat-mutate.mjs`): 18 of 18 red at f3df8596, 16 by exactly their named titles (`seat-mutate-output-f3df8596.txt`), run with `CLAUDE_CONFIG_DIR` unset.
- Seat probes (`seat-probes-f3df8596.md`): each review option leaves the temp folder empty; a task stop (SIGTERM) cleans up; SIGKILL and a pi seat's group SIGKILL leave the settings file, capture folder and lane lock, and the fake claude keeps running, the known limit.
- The independent check at a3293dc4 found nothing material (`independent-check-a3293dc4.md`): healthy pi and Claude builds behave as on main; every review option, handled start-up signal and closed stderr now cleans up. Its two notes (a signal during the final record write is now ignored; a hung start-up step needs a group signal) are FEAT-006 lines.
- CI at a3293dc4 passed every leg. The Windows suite passed R-2691 and R-2692 and skipped R-2693 (`ci-windows-a3293dc4.log`); CI's install check runs a real pi-worker lane build on macOS and Windows and passed.
- The seat's per-build diff check finds one removed escaped `\n`, kept in the moved review-option line. Session titles: 0 missing. Build 1's locked full suite: `218 files: 216 PASS, 0 FAIL, 2 SKIP`. After the merge, map:check, readme:check, the trace and the tree check are green, and the HANDOFF writing check finds no long sentence.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement f2b2735..7c93dbf: 3 rows in 1 features
FEAT-006 · Launch builders with execution limits
  R-2691 new (implemented)
  R-2692 new (implemented)
  R-2693 new (implemented)
```

CI runs on the draft pull request at the reviewed tip, the Windows leg included. The seat lands only on green.

Ask above all: can any handled refusal, stop or closed pipe still leave the carried Claude settings file in the temp folder, and can the new start-up listeners or the moved refusal stop or change a healthy build that main ran? In particular, is any stop signal now swallowed so a build runs on where main stopped it?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else.
