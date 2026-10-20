# Must-meet · win-claude-skills

Feature: FEAT-013 · Install and connect harness runtimes (SUB-015 · Apply the platform's supported installation)
Sentence: on win32, install puts byte-equal copies of spec, py-lint, py-review and py-test, each with the `.nana-setup-copy` marker, in the Claude skills folder through requirements' copy path. Doctor marks each one ✓ or ✗, never as a note.
Class: install/hook/gate. The lane changes install (stepSkills, the retired step), doctor and the stale-copies checker that the adoption hook runs. It gets the land reviewer, the wrong-code pairs, one independent check and the mutation runner. The seat runs the macOS install check before nana-land. The draft-PR CI must show the Windows suite leg and the Windows install-check job green.
Threat model: honest variation is in scope. That covers an owner's folder, file, symlink or junction at a skill path, a stale copy after a pull, a file the owner added, a captured legacy copy, and CRLF. A forged `.nana-setup-copy` marker is out of scope.
Owner: this reverses a win32 skip that was a design choice on 2026-10-07, made while Windows was untested. No owner ruling backs it: the rulings, memory and review records were searched. The 2026-10-10 priority asks for both seats to work on Windows, installation included. The change is reversible and loses no data, so it is the seat's call.

## What changes for a Windows user
- After install, Claude Code offers /spec, /py-lint, /py-review and /py-test, as on macOS and in pi.
- The first session start after pulling this change names the four as missing until install runs. Later, a pull that changes one makes it ✗ and named, as requirements already is.
- An owner's folder at one of those names makes install and --dry-run exit 1 with the move fix. Before, install ignored it. This matches macOS.
- A link at those names, even a junction to the pack's own folder, makes install exit 1, as R-352 already does for requirements. Doctor now says ✗ instead of ✓.
- A captured legacy copy moves to the dated backup and is replaced, as on macOS.

## Design (the change removes more lines than it adds)
- steps.mjs: delete stepSkills' win32 skip, the retired step's win32 skip for the four, and the unused `skip` helper. Fix linkSkill's doc comment.
- doctor.mjs, skillLinkState on win32: return ✗ for a link before the symlink branch ("a symlink or junction is there instead of nana-setup's copy of <src> — move it, then re-run `nana-setup install`"). Return ✗ for a non-directory ("a regular file is there instead of …"). Delete diagnose's `skipped (win32; pi-only)` branch and its unused import.
- bin/stale-copies.mjs: delete the win32 skip and the imports it leaves unused.
- install-check-config.mjs: drop the four skill labels from DOCTOR_NOTES.win32 and fix the comment above it.
- README: update the skills table row and the Windows skills paragraph.

## Must-meet (native on Windows; forced with NANA_SETUP_PLATFORM=win32 elsewhere; no skip)
| Row | Requirement | Test | Red today |
|---|---|---|---|
| R-351 (pin) | WHERE the platform is win32, the skill shall be mirrored file by file as byte-equal copies. | `packages/nana-setup/tests/skills-and-standards.test.mjs::R-351: win32 install mirrors all five skills file by file as byte-equal copies` | P1: the four are absent |
| R-1900 | WHERE the platform is win32, WHEN the spec, py-lint, py-review or py-test skill folder holds nana-setup's byte-equal copy of every file the pack skill ships, doctor shall mark that skill ✓. | `…skills-and-standards.test.mjs::R-1900: win32 doctor marks spec, py-lint, py-review and py-test ✓ as copies of the pack` | P1: `· skill spec skipped (win32; pi-only)` |
| R-938 (pin) | WHERE the platform is win32, a stale copy shall read ✗ naming the file and be refreshed. | `…skills-and-standards.test.mjs::R-938: win32 doctor reads ✗ naming SKILL.md on a stale copy of each skill, and install refreshes it` | P1: no copy of the four to go stale |
| R-388 (pin) | WHERE the platform is win32, a hand-written file shall be backed up as a FILE inside the skill dir. | `…skills-and-standards.test.mjs::R-388: win32 install backs up each hand-written SKILL.md as a file inside its skill folder` | P1 |
| R-359 (pin; R-939 retired as its duplicate) | WHERE the platform is win32, a file the owner added inside the mirrored skill directory shall be left alone. | `…skills-and-standards.test.mjs::R-359: win32 install leaves a file the owner added inside each mirrored skill folder unchanged` | P1: no marked mirror of the four |
| R-1901 | WHERE the platform is win32, IF a directory that nana-setup did not make occupies the spec, py-lint, py-review or py-test skill path, THEN install and install --dry-run shall each exit 1 with a ✗ line naming that directory and the move-or-remove fix, leaving its entries and bytes unchanged. | `packages/nana-setup/tests/retired-artifacts.test.mjs::R-1901: win32 install and --dry-run exit 1 naming an owner's folder at spec, py-lint, py-review or py-test, which stays unchanged` | P2: install 0, dry-run 0, doctor 0 |
| R-1902 | WHERE the platform is win32, WHEN the spec skill path holds a directory matching the captured legacy spec copy, install shall move it under the dated retired backup and mirror the pack's spec skill in its place. | `…retired-artifacts.test.mjs::R-1902: win32 install moves a captured legacy spec copy to the dated backup and mirrors the pack's spec` | P3: left in place, no backup |
| R-1903 | WHERE the platform is win32, IF a regular file, a symlink or a junction occupies a managed Claude skill path, THEN doctor shall mark that skill ✗ with a detail saying what is there instead of nana-setup's copy and to move it. | `…skills-and-standards.test.mjs::R-1903: win32 doctor marks a regular file or a link at a skill path ✗ with the move fix` | P4: file reads "copy is stale … re-run"; link at spec reads `·` |
Not must-meet tests:
- In stale-copies.test.mjs, the win32 legacy fixture also gets a stale py-lint copy, and the occupied fixture gets an owner's folder at spec. With those fixtures, R-1761, R-1762 and R-1763 pin the checker. Without them, the old skip survives (probed).
- The R-1081 pin literal changes.

## Probes (macOS; temporary clone of main 32d6aa8b, whose setup library equals 27fb9d3c; temporary home; forced win32; 2026-10-19)
- P1: a fresh install prints `– skill spec skipped (win32)` for each of the four, doctor prints `·` for each, and no folders exist.
- P2: an owner's folder at spec and at py-test gets install 0, dry-run 0 and doctor 0.
- P3: the captured legacy spec stays in place and gets no backup.
- P4: as stated in the table.
- With the candidate change, every scenario above behaves as the rows say. Only four existing checks go red on macOS, five once the note list changes. Wrong code M5 turns P3 into exit 1, and wrong code M9 turns R-1761, R-1762 and R-1763 red. Doctor-running test files outside the lane change only in timing.
- Windows CI shows lstat reports a junction as a symbolic link: "win32 dir link: the link itself is left exactly as it was" passes there.

## Rows changed
- R-665 narrowed to "WHERE the platform is not win32, …", and its win32 cites dropped.
- R-666 narrowed to "… and, except on win32, ✓ only for its canonical pack link".
- R-669 drops its cite of "win32 install leaves the unrecognized skill owner directory unchanged".
- R-937 drops its four-skill cite.
- R-939 retired as superseded by R-359.
- R-1081 gets an evidence note.

## Seat notes
- R-1903 closes the Windows plain-file half of HANDOFF's "Doctor's skill advice" residual. The posix foreign-link half stays.

## Known limits
- On Windows, copies do not follow a pull, so a changed skill reads ✗ until install runs again, as requirements does.
- An owner's junction to the pack's own skill folder is refused (R-352), though it would track pulls better than a copy.
- A legacy or hand copy with CRLF, or from an older pack version, is refused with exit 1 and the move fix. Nothing is lost. This is inferred, not run.
- The pre-marker history holds requirements versions, yet every skill name consults it. This case is contrived and not fixed.
- On win32 the dry run still says "would link after the provenance-confirmed backup" for a legacy copy. The wording is cosmetic.
- Windows uninstall is unsupported, so the copies stay.
- R-938 keeps no actor, so audit note 18 stays open.
- 13 checks that run only on Windows flip with this change. They are rewritten without a local Windows run, so the lane's CI run is the proof.