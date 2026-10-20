# Independent check — install-link-race at f52a33fe (2026-10-20)

VERDICT: HOLDS

I checked tip f52a33fe in a private clone of the lane. I used a fresh temporary HOME for every probe and ran Node 22.22.2 on macOS. I left the worktree, the main checkout, ~/.claude and ~/.pi untouched. No lock file is left in ~/.claude, and none of my processes are still running. The worktree has two untracked files from the seat's mutation run; I did not write them.

Must-meet tests
1. `node packages/nana-setup/tests/install-overlap.test.mjs`. Output: PASS on R-2260, R-2261, R-2262 and R-2263, exit 0. Verdict: holds.
2. The same file with `NANA_SETUP_PLATFORM=win32`. Output: PASS on all four, exit 0. Verdict: holds.
3. The same file copied into a c203f485 (main) clone. Output: FAIL on R-2260, R-2261 and R-2262; R-2263 passes there by design. Verdict: the test catches the old code.

Probes
4. Free-running pairs: start install A, then start install B on the same home after a delay. A third install afterwards checks the final state (`pairs.mjs`).
   - Lane, 60 pairs at 0–240 ms: 116 runs exit 0 and 4 exit 2, all 4 with "locked by another nana-setup run … Nothing was written". 0 crashes, 0 EEXIST, 0 locks left, 0 unclean third installs.
   - Main, same sweep: 1 crash, "EEXIST: file already exists, symlink … .local/bin/nana-land" at a delay of 88 ms.
   - Lane, 80 pairs at 60–140 ms: 0 crashes.
   - Main, same sweep: 1 crash, EEXIST at pi-review, again at 88 ms.
   - Verdict: holds. The lane removes the crash main reproduces.
5. Close-start pairs, delays of 0–30 ms.
   - Forced win32: 51 runs exit 2, all with the lock message; 0 crashes, 0 locks left, third install clean.
   - macOS: 47 runs exit 2 with the lock message; 0 crashes, 0 locks left.
   - Win32 pairs at 40–160 ms: 0 crashes on both lane and main.
   - Verdict: holds.
6. Plain `nana-setup install` with no `--home` and a stub pi on PATH that logs the lock state. Output: exit 0. The stub logged `pi --version lock=free` and two `pi install … lock=free agentdir=<temp>/.pi/agent`. Verdict: pi registration runs after the lock is released. No existing test checks this.
7. Ctrl-C sent to the whole process group during a 6,000-file knowledge build (`sigint.mjs`). Output: `{"sawLock":true,"sigintAtMs":141,"sig":"SIGINT","lockLeft":false}`. All four bin entries were present. A re-run exited 0 and built the index (files 6000). Verdict: the earlier lane's Ctrl-C promise holds.
8. How long the lock is held, polled over 15 installs each. Lane: median 15 ms (14–25). Main: median 18 ms (13–23). Verdict: holding the lock through the five extra steps does not measurably widen the window where a Ctrl-C leaves a lock.
9. `install --dry-run` with a lock already present. Output: rc=0, 0 new files. The PATH row prints on line 40 and the knowledge row on line 42. Verdict: R-926 holds, and the new row order matches the plan.
10. `install` on a fresh home with a lock already present. Output: rc=2, "Nothing was written", 0 new files. Verdict: R-1590 holds.
11. A step that fails inside the lock: `~/.pi` is a regular file. Lane: rc=1 with "ENOTDIR … mkdir …/.pi/agent", 0 locks left. Main: the same rc and error, 0 locks left. Verdict: the `finally` releases the lock, and behaviour matches main.
12. An empty directory sitting at `.local/bin/pi-worker`. Output: rc=0; "PATH pi-worker updated backed up pi-worker -> pi-worker.bak-20261020"; no lock left. Verdict: same behaviour as main.

Other single files and checks
13. Passed with exit 0:
    - test files: fresh-machine, readme-rehearsal, install-check, install, settings-merge, settings-lock, win32-degrade, fsops, win-shims, uninstall, state-manifest
    - doctor test files: doctor-detail, doctor-knowledge, doctor-quiet, doctor-runtime
    - `code-map --check`: 0 problems
    - `readme-check`: 720 claims, 0 problems
    - The clone's git status stayed clean.
14. `skills-and-standards.test.mjs`: rc=6 on both lane and main, with the same six failures (doctor exit-0 checks). In these test homes, `doctor` reports "✗ pi pi-subagents not installed". Verdict: this setup fails the same way on main; not caused by the lane.

Findings
- MUST: none.
- No new known bugs. The limits the plan states (two different `--claude-home` values over one pi home, an install racing an uninstall) are unchanged. I did not test them.

Probe scripts are in <tmp> (`pairs.mjs`, `sigint.mjs`, `window.mjs`).
