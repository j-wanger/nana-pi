Feature: FEAT-006 · Launch builders with execution limits

Lane watcher-clock. Class: ordinary. Threat model: honest variation in clocks, time zones, locales and `ps` output across macOS and Linux is in scope; deliberate forgery is out.

Review `git diff origin/main...HEAD` on `feat/watcher-clock`. Main is ad9612dd. `build-brief-1.md` states the problem: in the repeated hour after the 2026-11-01 fall-back clock change, `defaultProcessStartedAt` parsed `ps -o lstart=` local time an hour early, so a process started after the builder record looked older and could be signalled; R-2726 failed then and passed after. The build reads `ps -o etime=` instead and adds an injected-clock test under R-2726. No new row.

The seat's record: locked full suite at 5a463802: 252 files, 250 pass, 2 skip. CI run 41321363304 passed on all three systems. The new test failed on the old code.

Question: is the start time now correct across clock changes, zones and locales, does the fail-safe for an unreadable start time still hold as R-2726 says, and does the change cause a harm the review standard lists? Check the `etime` parsing for every form `ps` prints on macOS and Linux, including days.

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
