# Review — linked-folder-advice (advice that works under a linked Claude folder), 2026-10-23 (the final reviewer)

Feature: FEAT-015 · Diagnose the active environment

Class: install (doctor's two legacy rows, and one refusal first in install). Threat model: honest variation in dotfiles layouts (the whole Claude folder linked, the skills folder linked, the rules, hooks or memory folder linked, linked before or after an install), link kinds (a symlink, a Windows junction, a link whose target is gone, a link loop), macOS, Linux and Windows, the Claude folder option (the flag and `CLAUDE_CONFIG_DIR`), and recognized and unrecognized legacy items; deliberate forgery out (a link swapped between a read and a move, a forged legacy fingerprint, a link planted to steer install).

Review `git diff 8c24e357..HEAD` on `feat/linked-folder-advice`. Main is 8c24e357 (objective-hook-win, landed). The lane's commits: fb565e91 (plan of record), 6f75ecc1 (build 1, the lane), 96f08ce2 (pairs), e24a90c8 (notes), and the final commit with this brief and the land brief.

The plan of record is `docs/reviews/linked-folder-advice-2026-10-23/must-meet.md`: the measured cause, the seat's decisions on the attack (M-1: R-2294 narrowed to a completed dry run; S-1: a home with one flag; S-2: controls for a broken skills link and a Windows hooks link; S-3: known bugs cited by their words; S-4: the session-start line as a known limit), rows R-2701 to R-2705, and the known limits. `plan-draft.md` (the measured cases M1 to M17 and the design) and `plan-attack.md` are its inputs.

The seat's record:
- Wrong-code pairs (`seat-mutate.mjs`): 21 of 21 red at 6f75ecc1, 18 by exactly their named titles (`seat-mutate-output-6f75ecc1.txt`). W13 turns R-2704 red and leaves R-2705 green, because the dry run takes no lock; W17 turns the file red by a throw, as the plan said.
- The macOS install check passes all 18 items at 96f08ce2 (`install-check-96f08ce2.txt`).
- The independent check at 96f08ce2 found nothing material (`independent-check-96f08ce2.md`): moving exactly the named paths clears every row; all 18 broken-link cases exit 2 naming the link with the home unchanged, where main crashes with partial writes; the broken skills and Windows hooks links do not refuse; 24 healthy linked cases and a fresh unlinked home match main byte for byte. Its two new notes are FEAT-015 lines.
- CI at 96f08ce2: both install-check legs and the Linux and Windows suite legs passed. The Windows suite ran R-2701 to R-2705 natively and passed them, with R-2290 to R-2294 (`ci-windows-96f08ce2.log`).
- The seat's per-build diff check finds no removed escaped `\n`, `\r` or `\t`. Session titles: 0 missing. Build 1's locked full suite: `218 files: 216 PASS, 0 FAIL, 2 SKIP`. map:check, readme:check, the trace and the tree check are green, and the HANDOFF writing check finds no long sentence.
- The notes fold the objective-hook lane's two final-review notes into FEAT-013 as known-bug lines; they came after that lane's LAND, so this reviewed change carries them.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement 8c24e35..96f08ce: 6 rows in 2 features
FEAT-013 · Install and connect harness runtimes
  R-2704 new (implemented)
FEAT-015 · Diagnose the active environment
  R-2294 text changed
  R-2701 new (implemented)
  R-2702 new (implemented)
  R-2703 new (implemented)
  R-2705 new (implemented)
```

CI runs on the draft pull request at the reviewed tip, the Windows leg included. The seat lands only on green.

Ask above all: does every piece of advice doctor now gives a user with a linked or broken Claude folder lead to a step that works, and can the new refusal ever block a healthy install? In particular, does the refusal fire only for a link whose target cannot be reached, and only for the folders install writes on that platform?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else.
