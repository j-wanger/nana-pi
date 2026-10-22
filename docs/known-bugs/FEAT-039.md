# FEAT-039 — known bugs

*One line per known bug in this feature, moved from HANDOFF.md on 2026-10-21 and kept word for word. A review finding that does not block a land goes here as one line.*

- Product report: 37 of the 38 migrated assessments carry an inferred stamp commit, so several show out of date from day one; the installation feature's was refreshed through the guide. "Current" means "matches the stamped ledger", not "rechecked against later decisions". Packets refuse while REQUIREMENTS.md has uncommitted edits. The suite's historical stamp check needs full git history; a shallow clone fails it. No one has yet run the refresh loop with a second model as checker.
- Test details in the report (report-test-details): a test skipped for its platform shows only as this clone's SKIP for its whole file. The page reads no skip reason, no CI Linux or Windows result and no SKIP line inside a file.
- Test details in the report (report-test-details): the label belongs to the whole file, so a PASS file may have skipped the cited check. The page legend says so.
- Test details in the report (report-test-details): the "changed since" mark misses code run from a temporary copy or by a killed child. The page legend says so.
- Test details in the report (report-test-details): a test that carries a row's marker but is not cited in the row's evidence is not listed.
- Test details in the report (report-test-details): no cited test shows its line number.
- Test details in the report (report-test-details): links go to GitHub only. A link to a commit nobody has pushed opens a not-found page.
- Test details in the report (report-test-details): a project with no runtime data, Python projects included, shows every test as having no recorded run.
- Test details in the report (report-test-details): nobody has opened a test link inside the hosted page. The links open a new tab because of a guess that a plain link fails there.
- Not-passed list (report-not-passed): a failing test file fixed after the run keeps its row listed, marked changed since, until someone measures again.
- Not-passed list (report-not-passed): a row citing a skipped file beside a file with no recorded run is left out. No such row exists today.
- Not-passed list (report-not-passed): with no runtime data, the list's heading reads 0. The legend just above it says the report found no run.
- Not-passed list (report-not-passed): a label marked changed since still decides the list, so a stale skip keeps its row listed. The plan's adversary called this the claim most likely wrong and left it to the owner. Reversing it changes one rule and flips one requirement.
- Not-passed list (report-not-passed): no check pins that a row citing no test file is never listed. Every check stays green with the empty-run guard removed.
- Open questions in the report (audit-open-questions): closed questions still list, each with its own closed note. The page has no filter for them.
- Open questions in the report (audit-open-questions): only a dash bullet or a numbered line starts a question. A star bullet joins the question above it.
- Open questions in the report (audit-open-questions): a new project's placeholder question lists as question 1, with its underscores shown.
- Open questions in the report (audit-open-questions): the 2026-10-09 verification found issues beyond the audit, in two rows, one pack README line and misfiled rows. No open question records them.
- Product report stage view (ledger-stages, plan): cards keep document order within each kind. The report does not sort stages by what they need; the tree checker already requires each need to come earlier.
- Product report stage view (ledger-stages, plan): coverage counts implemented rows shared by active or frozen features. A test that has not run since the last change still counts; the run labels under each row show that.
- Product report stage view (ledger-stages, wrong-code pairs): no kinded test ledger checks that each feature line still sits right above its count bar. The existing check does that on this repo's ledger once its capabilities carry kinds.
- Stale-copies check on Windows (ledger-stages CI; win-leg-flakes): its linked Claude folder case failed 3 checks once on CI's Windows leg, then passed on a re-run. The cause is still unknown; a 5-second hook kill is unlikely from the phase timings. Its R-1761 failure line now names the hook run's status, signal, time and unavailable lines, so the next failure shows the cause. Fixing it is a hook lane.
- Product report stage view (ledger-stages, final review): a product capability with no deliverables line shows an empty deliverables list, not none or a gap.
- Product report stage view (ledger-stages, final review): a deliverable's consumers include retired and proposed features that share it. Coverage counts only active and frozen ones, so an owner may read a retired consumer as live.
- Product report stage view (ledger-stages, final review): the stage-order check renders a past ledger through git, so like the stamp check it needs full history.
- Product view (report-deliverables, plan): 32 of 39 deliverables show "no artifact named": printed output, machine-local stores, another project's files, a release tag, main. Suite records carry their own time but name no artifact here. A release tag carries a date too.
- Product view (report-deliverables, plan): per-lane records name no artifact, because a review folder would read as fresh after every lane.
- Product view (report-deliverables, plan): git ignores the report page, so the report's own age does not show.
- Product view (report-deliverables, plan): the last change can be a sweep, a merge, a rename or a revert. The subject shows which; the report does not guess the last real make.
- Product view (report-deliverables, plan): a maker line names one study's files. A newer study in a new folder does not refresh it until someone edits the line.
- Product view (report-deliverables, plan): the runtime map's age is this clone's data. Another worktree's land moves it, and a Windows land does not measure.
- Product view (report-deliverables, plan): R-1012's condition does not name history depth, so `git fetch --unshallow` between two runs changes the page.
- Product view (report-deliverables, plan): the report's existing date call takes a signature line under `log.showSignature`.
- Product view (report-deliverables, plan): the artifact walk grows with history, about 160 to 220 ms at 2,514 commits on macOS. Every report build in the test file adds about three spawns.
- Product view (report-deliverables, plan): subjects and claims with backticks or `**` render as code or bold.
