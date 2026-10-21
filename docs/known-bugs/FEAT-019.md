# FEAT-019 — known bugs

*One line per known bug in this feature, moved from HANDOFF.md on 2026-10-21 and kept word for word. A review finding that does not block a land goes here as one line.*

- win-leg-flip: the two new checks read the CI file as text, not as GitHub reads it. They fail on any expression they do not know, and name it.
- win-leg-flip: the blocking Windows leg skips the 16 declared desk files. A new Windows failure in one of them cannot stop release.
- win-leg-flip: the README still says the Linux leg fails one symlink-escape check. That stopped being true when the lane write guard fix landed. The owner ruled on 2026-10-20 that the Linux leg does not block release yet; the README line still needs the fix.
- win-leg-flip: the check that the suite leg blocks release reads the suite job as all text between the suite and release jobs. A job added between them later could be misread.
- CI time limit (ci-suite-timeout): the new checks read the setting only. The limit acts only when a leg hangs, and a healthy run never meets it. Its first real test is the next hung leg.
- CI time limit (ci-suite-timeout, plan adversary): re-measure the Windows test leg's time when it passes 60 minutes. A false time-out cancels a leg that blocks release, and so stops release. That leg grew about 5 minutes a day on 10-19 and 10-20. CI runs its tests one file at a time.
- CI time limit (ci-suite-timeout): a Linux leg stopped at the limit likely stops release, though a failed Linux leg does not. The plan infers this from GitHub's docs. It was equally true at six hours.
- CI time limit (ci-suite-timeout): the release job keeps GitHub's six-hour default. A hung release would hold the template release queue that long.
- CI time limit (ci-suite-timeout): the install check job's 20-minute limit carries no note of where the value came from.
- CI time limit (ci-suite-timeout): the two new checks also read the suite job as all text between the suite and release jobs. A job added between them later could be misread.
