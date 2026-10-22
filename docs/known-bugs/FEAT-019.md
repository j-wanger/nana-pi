# FEAT-019 — known bugs

*One line per known bug in this feature, moved from HANDOFF.md on 2026-10-21 and kept word for word. A review finding that does not block a land goes here as one line.*

- win-leg-flip: the two new checks read the CI file as text, not as GitHub reads it. They fail on any expression they do not know, and name it.
- win-leg-flip: the blocking Windows leg skips the 16 declared desk files. A new Windows failure in one of them cannot stop release.
- win-leg-flip: the README still says the Linux leg fails one symlink-escape check. That stopped being true when the lane write guard fix landed. The owner ruled on 2026-10-20 that the Linux leg does not block release yet; the README line still needs the fix.
- win-leg-flip: the check that the suite leg blocks release reads the suite job as all text between the suite and release jobs. A job added between them later could be misread.
- CI time limit (ci-suite-timeout): the new checks read the setting only. The limit acts only when a leg hangs, and a healthy run never meets it. Its first real test is the next hung leg.
- CI time limit (ci-suite-timeout, plan adversary): re-measure the Windows test leg's time when it passes 60 minutes. A false time-out cancels a leg that blocks release, and so stops release. That leg grew about 5 minutes a day on 10-19 and 10-20. Since the ci-jobs lane (2026-10-22), CI runs four files at a time, so the leg takes about 15 to 21 minutes.
- CI time limit (ci-suite-timeout): a Linux leg stopped at the limit likely stops release, though a failed Linux leg does not. The plan infers this from GitHub's docs. It was equally true at six hours.
- CI time limit (ci-suite-timeout): the release job keeps GitHub's six-hour default. A hung release would hold the template release queue that long.
- CI time limit (ci-suite-timeout): the install check job's 20-minute limit carries no note of where the value came from.
- CI time limit (ci-suite-timeout): the two new checks also read the suite job as all text between the suite and release jobs. A job added between them later could be misread.
- CI at four (ci-jobs, plan): each leg prints a file's output when that file ends, not live; a runner crash also drops the held output of up to three running files.
- CI at four (ci-jobs, plan): the 15-minute per-file limit hides a slow file's drift until it doubles. review-ledger is the file to split.
- CI at four (ci-jobs, plan): seconds in the CI logs are seconds under load.
- CI at four (ci-jobs, plan): four files off the run-alone list slow down under load: recover (20 s rebuild deadline), post-edit's kill checks, mutation-runner's contention check and agent-dir-hostile (10 s handler bound).
- CI copier download (ci-jobs, plan; seen in biome-pin's CI at 2d4ec87e and ci-jobs' at 0ab804cd, macOS): template-acceptance's 15-second copier probe timed out while copier downloaded on an empty cache. R-2577's warm-up step now runs copier once before the tests; a failed warm-up download still fails the leg.
- CI workflow checks (ci-jobs, final review): R-1313's check repeats its first assertion and no longer pins the non-Windows step line. R-2556 covers that step's `--jobs` argument, but no check pins the step's text.
- CI workflow checks (ci-jobs, final review): R-2577's check counts only `- run:` lines, so a multi-line `run: |` warm-up would fail it while working in CI. That is a false red only.
