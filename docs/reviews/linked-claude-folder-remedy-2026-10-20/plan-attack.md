# linked-claude-folder-remedy — plan attack (one adversary)

Verdict: AMEND

AMEND. The plan's design is sound, and it follows the seat's lane spec, which rules that an existence check by lstat may run before the ancestor check. I probed a temp clone of 72abe19a (temp homes, pi stub), then removed it. No process from my probes is still running. Seven amendments:

1. A false claim in the falsifiable sentence. The plan says install "still writes, moves or unlinks nothing through a linked ancestor". Probe: install in a home whose `.claude` is linked wrote hooks, rules, settings.json and nana-memory into the link's target. The amended sentence limits the claim to the retired-artifact step and the skill step.
2. A false claim in doctor's new row text. "install will not write through the linked folder" is untrue for the same reason. The new text is "install will not add skills under the linked folder `X` — move it aside, then run `nana-setup install`".
3. A Windows path only Windows CI would catch. The plan's R-2290 homes catch the copy-marker half of the managed-skill skip only on the Windows CI leg. Probe: I left the link half above the guard and the marker half below it. A home installed and then linked under NANA_SETUP_PLATFORM=win32 then printed 4 retired ✗ rows (spec, py-lint, py-review, py-test). The plan's unforced homes stay green on macOS and Linux. I added home D and wrong-code pair W8.
4. A fixture that could pass for no reason. R-2291 is green today. Nothing proves its fixture is something install would retire. Probe: the same three artifacts in an unlinked home are moved or unlinked; under a linked home all three get ✗ and stay. I added that unlinked control home to the R-2291 test.
5. An ambiguous brief step. The plan's "print the context-size-check ✗ row only when the link exists" can be read as "only when it is a link". Probe: that version turns the existing check "hook source symlink ancestor is refused without changing its external target" red. The brief now says "when lstat finds anything there". I added W10.
6. A dropped seat test. The seat's spec asked for a check that doctor's last line lists the skill rows as fixes by hand. The plan dropped it as already true. It is true on main (probe: "5 missing — fix by hand as each ✗ line says: skill requirements, …"). But doctor-path-row-remedy edits that same last-line logic now. So I added R-2294 as a guard, with W9.
7. Row and title wording. I changed "a skill install made" to "a skill link or copy that install made".

Red today, confirmed by probe on main: R-2290 (17 retired ✗ rows in homes A and B, 8 when only the skills folder is linked), R-2292 (rows read `missing — run`) and R-2293 (no row names a folder). R-2291 and R-2294 are guards. On the plan's candidate: zero retired rows; doctor names `.claude` or `.claude/skills`; stale-copies 13/13 after the refactor; retired-artifacts 47 PASS, 0 FAIL; doctor-fix-line 9/9. skills-and-standards shows 6 FAIL. All six come from a `! project trust` row, because the clone is an untrusted checkout, as the plan said.

Class: install, hook or gate. The lane changes install's retired step, doctor, and the adoption hook's stale-copies producer. Builder: Claude Sonnet subagent (the slate marks it simple).

Files: packages/nana-setup/lib/steps.mjs, packages/nana-setup/lib/doctor.mjs, packages/nana-setup/bin/stale-copies.mjs, new packages/nana-setup/tests/linked-claude-folder.test.mjs, packages/nana-setup/README.md, REQUIREMENTS.md, docs/requirements-tree.md and docs/code-map.md (both regenerated). bin/nana-setup.mjs does not change.

Conflicts: review-ledger-run-win-launch has landed (main 72abe19a), and no slate worktree exists yet. Every overlap with this slate is textual:
- objective-path-shapes and doctor-path-row-remedy both edit doctor.mjs.
- doctor-path-row-remedy also edits the last-line logic in bin/nana-setup.mjs, which R-2294 pins. Whichever lane lands second re-runs linked-claude-folder.test.mjs after merging main.
- win-copy-backup-noise edits the skill-copy code in steps.mjs just above stepRetiredArtifacts. If it changes the retired step's backup date, both lanes touch the same few lines.
- Every lane edits REQUIREMENTS.md, the tree and the map.

Land order: this lane first among the nana-setup lanes, then objective-path-shapes, doctor-path-row-remedy, win-copy-backup-noise, and win-pi-launch-orphan last.

The claim most likely wrong is that every check passes natively on Windows. Four steps are untried there: renaming a real `.claude` and junctioning it back, renaming a junction aside for R-2293, file symlinks inside a junctioned folder, and the forced-win32 home D on a real Windows machine. Precedents exist: stale-copies R-1763 moves a junction aside, and retired-artifacts makes file symlinks; both pass on Windows CI. Second risk: a reviewer may read R-663's "before reading" as covering lstat. The seat's lane spec already ruled that it does not, and R-663's text stays unchanged.
