# linked-folder-advice · must-meet of record (seat, 2026-10-23)

Feature: FEAT-015 · Diagnose the active environment

Written by the seat from the planner's draft (`plan-draft.md`) and one adversary pass (`plan-attack.md`), both kept in this folder. Plans get no review round. Where this file and the draft differ, this file holds.

Spend line: the owner's 2026-10-23 pick, "Linked Claude folder advice". It serves the install half of the 2026-10-24 priority.

Stakes: medium blast, reversible. Doctor's text changes only in a home whose Claude or skills folder is a link. Install gains one refusal, before any write, for a Claude-folder link whose target cannot be reached; today that home crashes install. A false refusal on a healthy linked folder would block installs (pair W12 catches it). No stored format changes. A revert restores main.

Cause, as measured: doctor's legacy enforcement-flag and scaffolder rows tell a user with a linked Claude folder (or, for scaffolders, a linked skills folder) to run install, and install refuses those items through the link (draft cases M1 to M4). Doctor's final line tells a user whose Claude, rules, hooks or shared-memory folder is a broken link to run install, and install crashes with a stack (M5, M6).

## Seat decisions on the attack

- **Design as the draft**, parts 1 and 2: doctor's two legacy rows ask install's own question and, when install would refuse, name the linked folder and every present path to move out of the way by hand; install refuses first, in `install()`, for a Claude-folder link whose target cannot be reached. The prototype is evidence, not the design: the brief, this file and the draft's Departures hold where they differ (attack N-5).
- **M-1 adopted.** R-2294 is edited in place, keeping its ID and its test: "WHEN a Claude home or skills folder is a link, the install dry run completes, and doctor finds ✗ skill rows, THEN doctor's final line shall list every one of them as a fix by hand." `packages/nana-setup/README.md`'s "its final line lists them as a fix by hand" gains the same exception beside the new refusal sentence.
- **S-1 adopted.** R-2701's `claude` home holds only `enforce-memory` of the two flags, so a row that names absent items fails. Pair V1 added.
- **S-2 adopted.** R-2704's test adds one control home: native, a real `.claude` whose `.claude/skills` is a link to a removed folder. Install must exit 1, not 2, with no stack line, and must create `.claude/rules`; doctor's last line there must list the five skill rows by hand (R-2294's dangling case). The forced-win32 hooks control tightens to exit 0 with no stack line. R-2704's while clause covers both controls. Pair V2 added.
- **S-3 adopted.** Every known-bug line is cited by its opening words in the brief and the notes, never by line number.
- **S-4 adopted.** No product change; a FEAT-015 known limit: for a broken hooks or rules link the session-start line still names install, and install's refusal names the link to move.
- **N-2 adopted.** W17 names a fresh-install title from `install.test.mjs` in its expected red.
- **N-3 adopted in part.** V15: the forced-win32 cases add `.claude/nana-memory` and `.claude/nana-memory/shared`. V16: R-2704 says "cannot be reached", and its test adds a native `.claude/rules` link loop that must get the refusal with `(ELOOP)`. V8 and V11 stay notes.
- **N-4: known limits**, not scope: a live link from `.claude/rules` to a regular file (EEXIST crash, as on main); a linked `.claude/backups`; `.claude/skills/nana` and the retired hook backups under a linked folder; a dangling `.claude/settings.json` link (folded into the draft's M17 line); a read-only dotfiles target.
- **N-5 adopted.** The copied `walk` reuses the file's `tryReadlink`. The Precedent list adds `linkedSkillFolder`'s candidate loop and `project.test.mjs`'s dangling-link fixture.
- **N-6 adopted.** R-2705's final line "shall start with" the refusal text, since R-1996's suffix can follow. The by-hand text says "install will not back these up". R-1993's unguarded form becomes a FEAT-015 known bug.
- **Class: install lane.** Opus final reviewer, astra land reviewer, the seat's pairs, one independent check, the macOS install check, CI's Windows leg. Builder: the larger builder.
- **Open question 1 (the Claude folder flag in doctor's install advice): the default, decided by the seat.** It stays a known bug; `CLAUDE_CONFIG_DIR` already gets working advice, and the fix would touch every install command doctor prints.

## Must-meet rows

| ID | Requirement (EARS) | Test file::title | Where |
|---|---|---|---|
| R-2701 | IF the Claude home or its skills folder is a link and `nana-setup install --dry-run` reports ✗ for every present item of a legacy enforcement flag or legacy scaffolder row, THEN doctor shall print that row naming the linked folder, then each present item's path to move out of the way by hand, and no install command, while a legacy row whose present items the dry run would move keeps its install advice. | `packages/nana-setup/tests/linked-claude-folder.test.mjs::R-2701: under a linked Claude or skills folder, each legacy row install's dry run refuses names that folder and every present path to move by hand, and a row install would move keeps its install advice` | FEAT-015, after R-2294 |
| R-2702 | WHEN every path that a legacy row names to move out of the way by hand has been moved, THEN doctor shall print that row ✓ with `none present`. | `packages/nana-setup/tests/linked-claude-folder.test.mjs::R-2702: moving every path a legacy row names to move by hand leaves that row ✓` | FEAT-015, after R-2701 |
| R-2703 | WHILE the Claude home or its skills folder is a link, doctor shall print each ✓ skill row and ✓ legacy row with the detail it prints for that row in an unlinked home on the same platform. | `packages/nana-setup/tests/linked-claude-folder.test.mjs::R-2703: in a home whose Claude or skills folder is a link, every ✓ skill and legacy row reads as it does in an unlinked home` | FEAT-015, after R-2702 |
| R-2704 | IF the Claude home, its rules folder, its shared-memory folder or that folder's parent, or off win32 its hooks folder, is a link whose target cannot be reached, THEN install shall refuse with exit 2, a first error line that starts with that link's path and says to move it, and every file, folder and link in the home unchanged, while an install whose only broken link is the skills folder, or on win32 the hooks folder, does not refuse. | `packages/nana-setup/tests/linked-claude-folder.test.mjs::R-2704: a Claude home, or its rules, shared-memory or (off win32) hooks folder, that is a link whose target cannot be reached makes install refuse before any write, naming that link, and a broken skills or win32 hooks link does not` | FEAT-013 SUB-014, after R-2291 |
| R-2705 | WHEN doctor finds ✗ rows in a home with such a broken link, THEN doctor's final line shall start with `<n> missing — nana-setup install will not run until this is fixed: ` followed by install's first refusal line for that link. | `packages/nana-setup/tests/linked-claude-folder.test.mjs::R-2705: for such a broken link, doctor's last line names install's refusal instead of telling the user to run install` | FEAT-015, after R-2703 |

R-2294 is edited in place (M-1). Each new row goes in `untested` first, then `implemented` with its backticked `file::title` when its check passes. R-2706 to R-2709 stay free. R-2290 to R-2293, R-663, R-667, R-1762 and R-1994 keep their text and titles.

## What each test does

As the draft's "What each test does", with: R-2701's `claude` home holding only `enforce-memory` (S-1); R-2704's native skills-link control, its stricter win32 hooks control, its two forced-win32 shared-memory cases and its native rules-loop case (S-2, N-3); R-2705's "starts with" (N-6). Every check but R-2703 is red on main; R-2703 is a guard, as the draft says.

## Tunables

None, as the draft says.

## Wrong-code pairs (each must turn its test red every run)

The draft's W1 to W15 and W17 to W19, with W17 naming a fresh-install title from `install.test.mjs` (N-2), plus:
- V1. The by-hand row names both flags whatever is present → R-2701.
- V2. The guard also checks the skills folder → R-2704 (the skills control).
- V15. The guard skips both shared-memory folders on win32 → R-2704 (the forced-win32 cases).
None is Windows-only: the forced-win32 cases run on every system. Only CI's Windows leg proves native junction behaviour.

## Known limits (the seat writes them to the named files before the final round)

The draft's list, cited by opening words, with: S-4's session-start line; N-4's five cases; R-1993's unguarded form (N-6); and the draft's M17 line, with the dangling settings link folded in, as a FEAT-013 line.

## Docs that change

As the draft's list, with the README exception for R-2294 (M-1), every known-bug line cited by its opening words (S-3), and the known-bug lines this lane closes: the dangling Claude folder crash, no check reading a ✓ skill row in a linked home, and the legacy warnings saying run install.

## Seat steps

1. Cut `feat/linked-folder-advice` from main. Commit this file, the draft, the attack, seat titles and build brief 1; run brief-check.
2. Build with the roster's larger builder.
3. Seat checks: `linked-claude-folder`, `retired-artifacts`, `doctor-fix-line`, `stale-copies` and `install` each alone; `npm run test:locked`, map, readme, trace; `requirements-moved --base main`; the removed-escape diff check.
4. Pairs W1 to W15, W17 to W19, V1, V2 and V15 through the mutation runner.
5. The independent check, then the macOS install check.
6. Draft PR CI; the Windows leg must show R-2701 to R-2705 PASS natively; keep its log lines in this folder.
7. Notes before the final round; Opus and astra on the exact tip.
