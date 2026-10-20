# linked-claude-folder-remedy — must-meet

Feature: FEAT-015 · Diagnose the active environment (install rows R-2290 and R-2291 sit under FEAT-013 SUB-014)
Class: install, hook or gate. It changes install's retired-artifact step, doctor, and the stale-copies producer the Claude Code adoption hook runs. Needs the seat's wrong-code pairs, the land reviewer (or the seat's land review), one independent check, the mutation runner, and the install check on macOS before nana-land.
Threat model: in scope is honest variation: a Claude home or skills folder that is a link or a Windows junction (a dotfiles layout), made before or after an install, with or without retired artifacts inside, on macOS, Linux and Windows. Out of scope: a link swapped in between install's checks (a race), and forged artifacts.

Falsifiable sentence: when the Claude home or its skills folder is a link, every ✗ skill row in doctor names that linked folder to move aside. It is the folder the session-start line names. Doctor's last line lists those rows as fixes by hand, and following the fix turns every skill row ✓. Install prints no retired row for a retired path that is absent. Its retired-artifact and skill steps still write, move or unlink nothing through a linked ancestor. Install still writes hooks, rules and settings through a linked Claude home; this lane keeps that.

## Design
- `steps.mjs` `stepRetiredArtifacts`, three loops: lstat first, and print no row when the path is absent. Manifest loop: the whole managed-skill skip (a link, or a folder holding the copy marker, at spec, py-lint, py-review or py-test) moves above the source guard. The source guard, provenance match, backup guard and move keep their order and text. Hook-link loop: lstat, then the unchanged guard. context-size-check: the guard and its ✗ row run when lstat finds anything there, not only a link.
- Seat ruling (lane spec): an lstat that checks whether a retired path exists is only a read, so it may run before the ancestor check. The copy-marker lstat inside the artifact is the same kind of read. Nothing writes, moves or unlinks before a guard. R-663's text stays; its "reading" means reading contents.
- `steps.mjs`: new export `linkedSkillFolder(layout)`. It returns null when `directoryAncestorsAreSafe(layout.claudeHome, layout.skillsDir, true)` holds, which is stepSkills's own refusal test. Otherwise it returns the first of the Claude home and the skills folder that lstat reports as a link, else null.
- `bin/stale-copies.mjs` drops its local `linkedSkillParent` and uses `linkedSkillFolder`. Its output is unchanged; R-1762, R-1763 and R-1766 pin it.
- `doctor.mjs` `diagnose`: when `linkedSkillFolder` is non-null, each ✗ skill row reads `install will not add skills under the linked folder <code span> — move it aside, then run \`nana-setup install\``. ✓ rows keep today's text, and so does every row in an unlinked home; skills-and-standards and retired-artifacts pin that.
- `bin/nana-setup.mjs` does not change. Its last line already lists these rows by hand; R-2294 pins that.
- This closes the HANDOFF residual "Doctor's last line (doctor-fix-line): when the Claude folder is a link…".

## Evidence (temp clone of 72abe19a, macOS)
- Main: in a home whose `.claude` was linked before install, install shows 22 ✗ rows. 17 of them are retired rows for absent paths. A home linked after install shows the same 17, and a home whose skills folder is linked shows 8. Install wrote hooks, rules, settings and memory into the link's target.
- Main doctor: five ✗ skill rows read `missing — run \`nana-setup install\``, and the last line reads "5 missing — fix by hand as each ✗ line says: skill requirements, …".
- Candidate: 0 retired rows. Doctor names `.claude` or `.claude/skills`. stale-copies 13/13, retired-artifacts 47 PASS 0 FAIL, doctor-fix-line 9/9. skills-and-standards shows 6 FAIL, all from the clone's untrusted project, as on main.
- A home installed and then linked under NANA_SETUP_PLATFORM=win32 shows 0 retired rows on the candidate. With the marker half of the skip left below the guard, it shows 4 retired ✗ rows. Without that home, macOS and Linux miss this.
- When the context guard runs only for a link, the existing check "hook source symlink ancestor is refused…" turns red.
- The R-2291 artifacts in an unlinked home: install moves `enforce` and unlinks both hook links.

## Must-meet tests (new `packages/nana-setup/tests/linked-claude-folder.test.mjs`)
| Row | Test title | Red today |
|---|---|---|
| R-2290 | `R-2290: install through a linked Claude folder prints no retired row for an absent retired path or a skill link or copy install made` | Yes: 17 retired ✗ rows in each home |
| R-2291 | `R-2291: through a linked Claude folder each present retired artifact is reported ✗ and left byte-for-byte untouched` | No, a guard; W2 and W3 turn it red |
| R-2292 | `R-2292: every ✗ skill row doctor prints for a linked Claude or skills folder names the folder the session-start line names, to move aside` | Yes: rows read `missing — run` |
| R-2293 | `R-2293: moving aside the folder doctor's skill rows name and running install leaves every skill row ✓` | Yes: no row names a folder |
| R-2294 | `R-2294: doctor's last line lists every ✗ skill row under a linked Claude or skills folder as a fix by hand` | No, a guard; W9 turns it red |

Rows: as in the rows list (R-2290 to R-2294).

Platforms: every check runs natively on macOS, Linux and Windows, with no skip and no req-candidate marker. Folder links are junctions on win32, as in stale-copies.test.mjs. The two hook links are file symlinks, as in retired-artifacts.test.mjs. Home D forces win32 copies on every platform. Windows stays unverified until the CI leg runs. Compare the detail's first code span with the folder exactly: a substring match lets W4 pass, because `.claude/skills` contains `.claude`.

## Known limits
- A Claude home linked after an install whose skill links are right: doctor reads all good, and the session-start line is silent. Install still shows five ✗ skill rows and exits 1. Unchanged.
- Install's own ✗ skill rows still say "unsafe source ancestor under <Claude home>". For a linked skills folder they name the Claude home, not the linked folder (probe).
- Doctor's ! rows for legacy flags and scaffolders still say to run install, which refuses under a linked Claude home (read from code).
- A Claude home or skills folder that is a regular file still gets only "run install" (inferred).
- Moving the folder aside leaves the owner's settings and memory in the moved folder (existing HANDOFF residual).
- Open for the owner: should install write hooks, rules and settings through a linked Claude folder at all? This lane keeps today's behaviour.
- Seat: a wrong-code script under docs/reviews must not spell a pi launch as a literal `spawn("pi"`.