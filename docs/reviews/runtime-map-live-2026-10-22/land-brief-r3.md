# Review — runtime-map-live, confirmation round 3 (the land reviewer), 2026-10-22

Feature: FEAT-029 · Navigate code and investigate impact

Class: install, hook or gate (it changes `nana-land`). Threat model: as in round 1's brief (`docs/reviews/runtime-map-live-2026-10-22/review-brief.md`): honest variation in scope, including a land or hand measure stopped by any signal and a suite descendant that handles a stop slowly; deliberate forgery out.

This round reviews only the change since round 2: `git diff 20fdfdb8..HEAD` on `feat/runtime-map-live`. Round 2 at 20fdfdb8: the final reviewer said LAND with a SHOULD; the land reviewer sent it back with a MUST on the same fault — the kill step 500 ms after a stop walked the tree again from the child, so a descendant that handled the first signal while its parent exited at once was no longer below the child and survived; on main the kill step signalled the child's process group and reached it. The final reviewer also noted that on Windows the hand measure's forwarding force-killed the locked suite on Ctrl-C, and that R-1277's check sent no SIGHUP.

The commits since 20fdfdb8: 5c1648e0 (round 2's record and `build-brief-6.md`), 268dddb9 (build 6), 804bf05b (the seat's check of build 6 and the notes).

Build 6:
- The first signal records every target it signalled (`killTree` now returns the process groups and single PIDs), and the kill step signals those again, then the child's own process group as on main, then a fresh walk. A group holding a process outside the tree (the caller's) is still never signalled as a group; a gone target (ESRCH, EPERM) is not an error.
- On Windows the hand measure no longer forwards a stop, so the console's Ctrl-C reaches the locked suite, which runs its own handler as before build 5.
- The measure command handles SIGHUP too (`STOP_SIGNALS`), and R-1277's check sends it.
- R-1277's and R-2527's checks gain the orphan case: the fake suite's root exits at once on the signal while a same-group and a detached descendant ignore the stop; after it, no descendant remains, the caller lives, the coverage folder is gone, the earlier data is unchanged and the exit is non-zero. R-2533's check gains a `win32` unit case that forwards nothing and returns non-zero.
- R-1277's and R-2527's row texts now say what the stop ends ("every process the first signal reached and every process in the suite root's process group"), and R-1277 names SIGHUP. Their titles are unchanged.

The seat's record at 268dddb9:
- The wrong-code pairs: 22 of 22 red (`seat-mutate-output-268dddb9.txt`), with x7 recast as main's group-only stop, x8 a kill step that walks the tree again only, x9 a kill step without the child's group, and x10 a Windows hand measure that forwards the stop.
- runtime-land, runtime-map, land and test-locked pass through the runner with the coverage knob set: 4 files, 90 checks. The seat check prints `0 missing`.
- Build 6's full suite: `205 files: 203 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8287 pass, 39 skip`. The macOS install check at 804bf05b: exit 0, 17 PASS.
- CI run 39749520397 at 804bf05b (PR #161): suite (ubuntu-latest) 205 files, 202 PASS, 0 FAIL, 3 SKIP, checks 8224 pass, 0 fail; suite (macos-latest) 205 files, 203 PASS, 0 FAIL, 2 SKIP, checks 8285 pass, 0 fail; suite (windows-latest) 205 files, 187 PASS, 0 FAIL, 18 SKIP, checks 7213 pass, 0 fail, with the lane's four test files passing there; install-check success on macOS and Windows (`ci-804bf05b.txt`). The runs at dd9cbc4d and dc931d36 failed on Windows (F3 to F5).

Judge whether the change fixes round 2's MUST for its user, the seat or a builder who stops a hand measure or a land, and causes no harm the review standard lists:
- after a SIGINT, SIGTERM or SIGHUP to the measure command or the locked suite, no process the first signal reached and no process in the child's group survives the kill step, an orphan whose parent exited included, and the checks would catch a build that lets one survive;
- no process outside the suite's tree is signalled, the caller's own group included;
- Windows behaves as before build 5 for a land and for a hand measure's Ctrl-C;
- the two row texts, the notes and the session entry say what the code does.

Probe in a temporary folder with a temporary HOME. Do not edit the worktree.
