# Review — readme-windows-checklist (the root README gains a numbered Windows fresh-machine checklist written for Command Prompt, and the install check on Windows rehearses it as written through cmd.exe in a new temporary home), 2026-10-19 (Opus, the lane's one final reviewer)

Feature: FEAT-015 · Diagnose the active environment (R-1850 to R-1852: FEAT-013 · Install and connect harness runtimes)

Review `git diff 2389726e..HEAD` on `feat/readme-windows-checklist` (main was `2389726e` when the lane branched; `git
merge-base HEAD main` is `2389726e`; main has since moved to `d4423eff`, the mutation-runner-win-prune, install-pins and
review-records-pin lands, none of which touches the lane's READMEs, install-check files or three test files, so a merge
of main and a confirmation round follow before the land). The plan of record is
`docs/reviews/readme-windows-checklist-2026-10-19/must-meet.md` (rows R-1850 to R-1855 new; R-951, R-1111, R-1542 and
R-1546 reworded; R-1540's evidence title changed), with `plan-attack.md` (the adversary's AMEND) and `build-brief-1.md`,
the one build, beside it. The seat's record `seat-verify-79b4c4ea.md` holds CI run 39354850626 (0 failing files on
macOS and Ubuntu; Windows's one failing file is main's mutation runner lock check; both install-check jobs print PASS
readme checklist), the builder's wrong-code tries, and the Windows suite log `ci-windows-79b4c4ea.log` beside it.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main` at 79b4c4ea; the seat's notes commit changes
no row): six rows added, four reworded.

```
tree movement 2389726..79b4c4e: 10 rows in 2 features
FEAT-013 · Install and connect harness runtimes
  R-951 text changed
  R-1111 text changed
  R-1546 text changed
  R-1850 new (implemented)
  R-1851 new (implemented)
  R-1852 new (implemented)
FEAT-015 · Diagnose the active environment
  R-1542 text changed
  R-1853 new (implemented)
  R-1854 new (implemented)
  R-1855 new (implemented)
```

The change under review: the root README's new Windows section and its Prerequisites paragraph, the setup README's
install-check paragraphs, `install-check-config.mjs` (`README_REHEARSAL`'s per-platform maps and two new keys),
`readme-rehearsal.mjs`, one line of `install-check.mjs`, three test files (`fresh-machine`, `readme-rehearsal`,
`install-check` under `packages/nana-setup/tests`), REQUIREMENTS.md, the tree and the code map. Judge whether each step of
the Windows checklist works as written for a Command Prompt user: the quoting, `cd /d`, every user-folder path as a
double-quoted `%USERPROFILE%` path, step 5's words matching doctor's own remedy, and step 7's objective file paths.
R-1850: whether the check takes the Node floor, CI's pi version and pi-subagents' floor from their sources and the bin
text from `resolveLayout`, so a drifted version or folder fails it, and whether it pins that step 5 holds no command.
R-1851 and R-1852: whether a missing `/d`, an unquoted path, a `~` or `$HOME`, or fewer than three quoted paths each
fail. R-1853: whether the stub answers only `cmd.exe` calls from the readme home, and whether the last call must be
step 8's joined line with `--yes`. R-1854: the verbatim flag, the one pair of outer quotes, the cwd and the shell
arguments. R-1855: exactly one path key in the caller's letter case, the order prefix, bin folder, caller's Path, a
literal `;`, and the rest of the environment equal to the caller's minus `ZDOTDIR` plus only the npm prefix and the git
redirect. Judge whether darwin's call and environment stay byte-identical, and whether Linux still prints no checklist
line. Judge whether cmd's `/s /c "<joined>"` rule runs a joined line holding `&&` and inner quotes as intended; CI's
Windows install check printing PASS readme checklist is the only run of it. Judge whether the step-5 stand-in, the bin
folder put on each step's path, can hide a wrong step 5. The build also narrowed R-1079's win32 filter from any argument
text holding `list` to a quoted `"list"` argument, which the brief did not name; the seat's record says the old filter
still passes on macOS. Judge whether the check keeps its strength. The builder pushed the lane branch and opened the
draft pull request itself, a step the plan gave the seat; the seat records it and judges it harmless.

Threat model: honest variation in our tools' output and the OS in scope: macOS, Linux and Windows on Node 22; the Path
key's letter case; npm's Windows prefix layout; a user folder with spaces or on another drive; a CRLF checkout; a CI
runner whose Path already holds pi and Node; a slow or offline runner during step 2's pi install. Deliberate forgery
out (a forged README, launcher or cmd.exe). Lane class: ordinary — the two READMEs, the install check's rehearsal, its
sealed config and one install-check line, three test files, rows, the tree and the code map; no install, uninstall or
doctor code, no hook, no extension, no gate policy and no land or review tool (precedent: readme-install). It touches
`packages/nana-setup/`, so the seat runs the macOS install check before nana-land.

Check: (1) the must-meet checks are not vacuous: each reds on the wrong code the brief names (the step 5 and 6 swap and
a Run span in step 5 for R-1850; a dropped `/d` for R-1851; an unquoted path and a `~\nana-pi` target for R-1852;
darwin-only platforms, the darwin heading on win32 and a dropped platform argument for R-1853; dropped outer quotes, a
dropped verbatim flag and `/bin/zsh` for R-1854; an added `PATH` key, `<prefix>\bin`, the bin folder after the caller's
Path and a `path.delimiter` join for R-1855), and each row is no wider than its check; (2) darwin's rehearsal call and
environment are unchanged, the darwin and Linux checks keep their strength, and Linux prints no checklist line; (3) the
README's Windows steps run as written in Command Prompt, and the setup README's install-check paragraphs are true; (4)
no test writes outside the temp folders it owns, and each removes what it made; (5) nothing else changed: no install,
doctor, hook, gate or land-tool code, R-1079's narrowed filter keeps that check's strength, and the regenerated tree and
code map match fresh runs; (6) the plan's known limits (step 5 never runs, a CI runner is not a fresh machine, a
rehearsal home with no space on the temp drive, step 2's network install under the 300 s step cap, no PowerShell and no
Linux checklist) are HANDOFF residuals, and none hides a bug that stops the feature; (7) HANDOFF and the session entry
are true, including the seat items carried from other lanes; (8) any MUST.
