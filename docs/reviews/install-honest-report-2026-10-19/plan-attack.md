# install-honest-report — plan attack (one adversary)

Verdict: AMEND

AMEND. I reproduced every red claim on main f29827a in a scratch clone with a temp HOME and --home, then removed the clone. The repo is untouched.
- R-1590 is red today. With a held lock and an empty .claude/enforce, install exited 2 and printed "Nothing was written". Afterwards the home held 5 hook links, 6 rules and 5 skill links, and the flag had moved to the backups folder. Under NANA_SETUP_PLATFORM=win32 the home gained 17 entries.
- R-1591 and R-1592 are red today on POSIX. The re-run printed 4 retired rows and 6 skipped rows, against 2 skipped on the first run. Under simulated win32 both runs printed 14 skipped rows and no retired rows.

Amendment 1, the subtraction test. I replaced the plan's realpath compare with a one-line skip. In stepRetiredArtifacts, a symlink at spec, py-lint, py-review or py-test (the NEW_CLAUDE_SKILLS names) gets no retired row. stepSkills runs next on the same path and already reports every non-canonical link there as a ✗ "foreign link". That is R-665, pinned by the existing check "foreign newly managed skill link survives end-to-end install". The retired step never moves a link. Its row for these names is therefore noise when the link is canonical, and a duplicate of the ✗ row when it is not.

Amendment 2, R-1593. The plan's R-1593 pinned that duplicate retired row, which is an implementation detail rather than a user promise. It would go red under the simpler design. I replaced it with a guard for the edge the simpler design can break: an unmanaged legacy name such as nana keeps its retired row. Under the wrong code "skip every symlink under .claude/skills/", the probe showed no row at all and exit 0, so that link went unreported. The new test runs on every platform with a junction-type link and needs no skip.

Amendment 3, row widths. R-1591 is narrowed to "the skill links it made", which is what its test exercises. R-1590 now says "under the home it was given" instead of "selected homes", to match its --home test.

Amendment 4, an uncaught wrong code. No test can tell "take the lock before the first write" from "check for the lock before the first write, then take it at the settings step". The second leaves a race between two runs. It is now a named known limit, and the reviewer checks it by reading the code.

Candidate patch probe. The patch was 13 insertions and 9 deletions. It wrapped the five Claude-home steps in the lock, added lockHeld to stepSettings, and added the one-line skip. Results:
- A held lock gave exit 2 with the home unchanged.
- The re-run printed 2 skipped rows on both runs and no retired rows.
- A foreign link at spec produced only the ✗ skill row, with exit 1.
- A link at nana still got its retired row.
- Test files: settings-merge 216/0, retired-artifacts 47/0, uninstall 31/0, win32-degrade 98/0, install 101/0, state-manifest 20/0.
- skills-and-standards failed the same 5 doctor checks with and without the patch in that sandbox, so the failures come from the environment.

Lane class: install is correct. The roster's land model is astra, so no seat land review is needed. Conflicts: I checked git diff main...feat/<lane> on all nine in-flight branches. None touches steps.mjs or the three test files. readme-install and win-leg-flip edit other parts of packages/nana-setup/README.md. bom-pack-config and win-path-commands have no branch yet.

Claim most likely wrong: that the R-1593 junction reads as a symbolic link to lstat on real win32 CI. I did not probe it on Windows. The existing hooks-dir junction check in the same file relies on the same behaviour.
