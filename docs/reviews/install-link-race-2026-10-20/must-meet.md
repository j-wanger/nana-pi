# install-link-race — must-meet

Feature: FEAT-013 · Install and connect harness runtimes
Class: install, hook or gate. The lane changes nana-setup install code: the install sequencer in lib/steps.mjs.
Sentence: A second install started while a first install is still writing files stops with exit 2 and writes nothing. The first install finishes with no crash. The settings lock is gone before the slow knowledge build starts.

Threat model: honest overlapping runs are in scope: two terminals, a seat and the owner, or two checkouts. Honest platform differences are in scope too: Windows writes shims and copies where macOS and Linux write links. A process that ignores the lock, or races links on purpose, is out of scope.

## Design
- Today the lock covers retired artifacts, hooks, rules, skills and settings. It is released before shared memory, pi config, subagent config, reviewer agent, knowledge and PATH run. A second install started in that gap goes ahead, and the two runs collide on a link. The install-honest-report independent check saw 1 of 40 staggered pairs crash with EEXIST at the pi-review link.
- Change: install() runs shared memory, pi config, subagent config, reviewer agent and PATH inside the same withSettingsLock call as the Claude steps, in today's order. The knowledge build moves after PATH, outside the lock. The desk step and pi registration stay after it. The lock is taken once and released once.
- Effect: a second install started during any file step meets the lock and exits 2 with today's message (R-1590, R-2080). A second install started after the release meets finished files. A Ctrl-C during the knowledge build, the desk step or pi registration still leaves no lock, as the install-honest-report lane promised.
- The dry run still takes no lock (R-926). It runs the same steps in the new order.
- lib/fsops.mjs does not change. One row moves: the knowledge index row now prints after the PATH rows. No test, install check or README claim reads that order (grep).
- Docs: the steps.mjs header (@outputs, @errors) and the README lock paragraph name the new extent.

## Must-meet (new file packages/nana-setup/tests/install-overlap.test.mjs)
The test runs one first install in-process into a throwaway --home with a tiny knowledge source. It installs three wraps through require("fs") and require("child_process") plus syncBuiltinESMExports (the precedent is fsops.test.mjs), and restores them in finally:
- At the first lstat of <binDir>/pi-review, after the real lstat returns, it runs a real second `nana-setup install --home <same home>` with spawnSync and records its exit code and stderr.
- At every lstat of the ten later targets, it records whether the lock file exists. It counts openSync calls on the lock path.
- When the knowledge CLI's build is spawned, it records whether the lock file exists.
Every check also requires that its wrap fired.

The ten later targets: shared memory MEMORY.md, nana-pack.json, nana-objective.md, nana-rulings.md, the subagent config.json, reviewer.md, and the four bin entries pi-review, pi-worker, nana-land and nana-setup. On Windows the bin entries are the extensionless sh shims.

| Row | Requirement | Test (file::title) | Red today (probe, main 6f0098a8, macOS, Node 22.22.2) |
|---|---|---|---|
| R-2260 | WHEN a second install starts while a first install is writing its PATH entries, THEN the second install shall exit 2 naming the settings lock another nana-setup run holds. | ::R-2260: a second install started at the first install's PATH step exits 2 naming the held settings lock | Second install exit 0. The lock was gone at the look. |
| R-2261 | WHEN a second install starts while a first install is writing its PATH entries, THEN the first install shall finish without a throw, with no PROBLEM row and all four PATH rows created. | ::R-2261: the first install finishes with no problem row and all four PATH rows created when a second install starts at its PATH step | The first install throws EEXIST (symlink) at pi-review. |
| R-2262 | WHILE install checks or writes the shared memory index, the pi config, objective or rulings file, the subagent config, the reviewer agent or a PATH entry, install shall hold its settings lock, taken once per run. | ::R-2262: the settings lock, taken once, is present at every look of a shared memory, pi config, subagent, reviewer or PATH target | The lock is absent at all 7 looks the run reaches. The throw leaves 3 bin entries unseen. |
| R-2263 | WHILE install builds the knowledge index, install shall not hold the settings lock. | ::R-2263: the settings lock is gone when install starts the knowledge build | Green today, by design: it guards the prior lane's Ctrl-C promise. Red on wrong code W1 (knowledge build inside the lock): the lock is present at the spawn. |

Candidate probe: the change above, eight changed lines. All four checks are green on macOS, and green with NANA_SETUP_PLATFORM=win32 (the shim branch). Each of wrong versions W1 to W5 in the brief turns its named check red. These single files are green on the candidate: settings-merge 221, install 109, win32-degrade 88, rulings-install 8, settings-lock 6, uninstall 31, win-shims 2, retired-artifacts 47, doctor-fix-line 9.

Platforms: no check skips, and no SKIPS entry is added. The wraps and the child spawn use no POSIX-only call. fsops.test.mjs already patches fs this way on the Windows leg. Red-today is not shown on Windows; the Windows leg proves green.

## Known limits (the first two go into the README lock paragraph)
- The lock lives in the Claude home. Two installs with different --claude-home values over one pi home and one bin folder are not kept apart, as today.
- A second install started after the release runs beside the first run's knowledge build, desk step and pi registration. In a probe, a second install started at the first's knowledge spawn exited 0, and so did the first. Two pi install calls at once on the real home rely on pi's own settings lock, as today. This case was not probed.
- No check sees that pi registration and the desk step run outside the lock. Under --home pi registration is skipped, and the desk needs launchd. The reviewer reads that order.
- The test stages the overlap at one point, with a real second process. The independent check reruns staggered install pairs for the free-running case.
- lib/fsops.mjs keeps its look-then-act gaps. Only a writer that ignores the lock can reach them, and that is out of the threat model.
- An uninstall running beside an install is not covered.