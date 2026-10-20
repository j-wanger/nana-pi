# install-check-review-launch — plan attack (one adversary)

Verdict: AMEND

AMEND. The design holds, and the macOS feasibility claim reproduced. The amendments remove duplicate checking, replace a test that pinned the mechanism with one that pins the outcome, and drop the wait.

Probes (2026-10-20, temp HOME, pi 1.0.2, git 2.50, Node 22.22):
- pi-review ran through a temp-home bin link with a faux `-e` fixture. It exited 0 in 1–2 s, both with nothing registered and with nana-pack, nana-knowledge and pi-subagents 0.75.0 registered.
- The output was exactly the answer, a blank line, then `VERDICT: LAND`. The tally gained one LAND round for the item.
- The record held the whole 1,356-character standard, the token in the one user message, and NANA_ROLE=reviewer.
- Red today: on main 20debe02, install-check.mjs, its config and its test hold no `pi-review` or `PI_REVIEW` text.
- winCommand accepts the full planned argument list with Windows-style paths, with no refusal.
- Real git under GIT_CONFIG_COUNT (`user.useConfigOnly=true`, `commit.gpgsign=true`, a missing `gpg.program`): identity options alone exit 128, the signing-off option alone exits 128, and both exit 0.
- Without the options, a commit in a temp home on this Mac succeeded by guessing name and email from the account and hostname. So a real macOS run cannot show the runner case.

Amendments:
1. waitFor is now none. install-check-turn-edit-powershell landed during this attack: main is 20debe02 and its worktree is gone. Build on main 20debe02 or newer.
2. Subtraction. The plan's own first-on-PATH gate and its decoy case are dropped. Doctor already proves that property in the same run: R-953 off Windows and R-1616 on Windows. Doctor marks a ✗ row, or prints a note row the check does not list, and the check's `doctor` line then FAILs. The check now starts the installed launcher by its path: the bin link off Windows, and the `.cmd` through cmd on Windows. Git Bash still names `pi-review` bare, because that is the only way to exercise bash's own lookup.
3. R-2070 is now an outcome test. Real git runs under forced config, and the review repository must hold the fixture file at HEAD. The plan's version only checked git's arguments, so it pinned how the check commits, not that the commit works where a runner gives no identity.
4. Git Bash reads the command on standard input. R-1611's test already proves that form on Windows CI. The plan's `-c` form sends the command through the Git Bash runtime's command-line parser, which no test proves.
5. The prompt is now plain words: letters, digits, spaces and hyphens. The plan only excluded `"`, `%`, `!`, `/` and `'`, which left `& ^ ( ) | < >` and backslash, characters cmd changes in an unspaced argument (HANDOFF, launcher limits).
6. New known limits:
   - On Windows, the check's timeout kills cmd.exe or bash.exe, not the pi-review under it.
   - The check does not prove PATH order; doctor's rows do.
7. Seat rule: if a Windows CI failure lies in a review tool, the seat chooses between a known-red entry naming a fix lane and reclassifying this lane. The builder never sees Windows.

Class: ordinary is confirmed. Precedent: both earlier install-check fixture lanes say "Class: ordinary". The lane runs the review tools but does not change them.

Files the build touches:
- packages/nana-setup/lib/install-check.mjs
- packages/nana-setup/lib/install-check-config.mjs
- packages/nana-setup/lib/install-check-review.mjs (new)
- packages/nana-setup/tests/install-check.test.mjs
- packages/nana-setup/README.md (Install check section only)
- REQUIREMENTS.md
- docs/requirements-tree.md and docs/code-map.md (generated)

Conflicts:
- None of the in-flight lanes blocks this one.
- hook-deadlines has merged 20debe02 and touches no install-check file. It changes a different README section, verifier-pipe.mjs and hook-producer.mjs.
- pi-probe-timeout changes doctor.mjs, steps.mjs, new bounded-spawn modules and a different README section. The install check runs that code but shares no file with this lane.
- win-config-json-path has landed.
- All lanes share REQUIREMENTS.md and the two generated files: text merges, so regenerate after each merge.
- Slate: ci-suite-timeout has no file overlap. But if it retunes the install-check job's 20-minute limit (pinned by R-1078), this lane adds seconds normally and up to about 6 minutes in the Windows worst case (inferred).
- Slate: install-cli-pins may edit the setup README (inferred), a text merge only.
- Slate: knowledge-index-pins and project-check-quiet share no source file (inferred).
- Seat hazard: no .mjs under docs/reviews may spell a pi launch as the spawn call with the literal "pi".

Most likely wrong: that pi-review, started through the installed `.cmd` and Git Bash launchers on the Windows runner, starts real pi through pi-watchdog's npm-entry form and exits 0 with the verdict. On the runner that means `C:\npm\prefix\pi.cmd`, run as node plus the package's entry. No real pi has run a review that way (HANDOFF's roster residual). Only CI's Windows install-check leg shows it, after the build.
