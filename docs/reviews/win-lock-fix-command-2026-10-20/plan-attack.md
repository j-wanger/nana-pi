# win-lock-fix-command — plan attack (one adversary)

Verdict: AMEND

AMEND. The plan holds up: the feature is worth building, the class is right, the rows are as wide as their tests, and nothing writes outside the lane worktree or the temp folder. Three changes, all probed in a temp clone with a temp home:

1. The Windows message put the shell label on the command's own line (`  Command Prompt: del "…"`). Pasting that whole line runs `Command`, and the tests had to strip the label off before running anything, so "run as printed" was not true. Amended: each label goes on its own line and the command stands alone on the next. Tests now run the whole printed line. Prototype output on forced win32 was `  in Command Prompt:` / `    del "<lock>"` / `  in PowerShell:` / `    Remove-Item -LiteralPath '<lock>'`.
2. Doctor's win32 detail put the label after the command (`<cmd> (PowerShell)`). Copying one word too far pastes `(PowerShell)`, which PowerShell runs as a subexpression that starts a nested PowerShell. Amended: the label goes before each command, and the PowerShell command comes last so the line ends on a command.
3. The R-2081 sh run inherited the full environment. A broken line runs the backtick text `b` as a command (main's line does), and `$x` could pick up an env value. Amended: the sh child gets only PATH=/usr/bin:/bin.

Probes run:
- Main's message prints `rm <path>` unquoted, both natively and under forced win32.
- Run by /bin/sh from a sentinel folder, main's line deleted the sentinels lock, q and é, exited 1 and left the lock (R-2081 red).
- The prototype's quoted rm line removed only the lock.
- I downloaded portable PowerShell 7.4.6 into the temp folder. The planned `Remove-Item -LiteralPath '…'` line, with all five quote characters doubled, removed only the lock. It needed -Force there, because PowerShell off Windows treats dot-named files as hidden; Windows has no such rule.
- ASCII-only doubling, -Path and double quotes each left the lock. So did main's unquoted path. Windows PowerShell 5.1 and cmd.exe were not run.
- The prototype doctor printed a ✓ row with no lock and a ✗ row with one, native and forced win32. Its last line listed `settings lock` to fix by hand on both a fresh and an installed home.
- Test files on the prototype: settings-merge had 217 pass and 2 fail, exactly the two rm checks this lane replaces. win32-degrade passed 87 of 87 and uninstall 31 of 31.
- Merging the prototype's code with pi-probe-timeout, install-cli-pins, project-check-quiet and install-check-review-launch was clean.

Also checked: the stale-copies test's `/^(hook|settings) /` filter only reads a ✗ row, and its fixtures leave no lock, so the new label does no harm there. The adoption hook does not call doctor. No test counts doctor rows. The dry run takes no lock, so a row with no installLabel always lands in the by-hand list.

Simpler designs rejected:
- One `del "<lock>"` line runs in both Windows shells, but PowerShell breaks it on `$` and a backtick, which Windows user names may hold.
- A `nana-setup unlock` subcommand moves the quoting problem onto the checkout path when nana-setup is not on PATH.

Status rule added: R-2082 and R-2083 stay untested until the lane's Windows CI run passes them, then the seat flips them citing that run, following the R-1330 precedent.

Claim most likely wrong: that cmd.exe and Windows PowerShell 5.1 behave as planned on the Windows leg. PowerShell 7.4's parser is good evidence for 5.1's, but nothing ran on Windows.
