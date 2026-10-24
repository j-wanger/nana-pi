# Review — hard-kill-watcher (hard-killed lane builds clean up after themselves), 2026-10-23 (the land reviewer)

Feature: FEAT-006 · Launch builders with execution limits (R-2667's text in FEAT-031 · Run checks reliably and without contaminating work)

Class: gate (pi-watchdog's runOnce runs inside every pi-review, and pi-worker launches every builder). Threat model: honest variation in our tools' output and the host is in scope (a hard kill of pi-worker alone, of its process group or of its parent-pid tree; a pi seat's Esc, a closed terminal, a desk stop, a bash timeout; SIGTERM then SIGKILL; a kill at any point of pi-worker's startup; a finished build and the ceiling; two lanes building in one temp folder; a lane lock naming another live or dead process; Claude and pi builders; a Windows builder launched directly or through cmd.exe; a builder pid that the OS reuses; macOS, Linux and Windows); deliberate forgery out (a hand-edited pid record or lock written to steer the watcher, a planted process, a hand-deleted lane folder).

Review `git diff bd7f0f75..HEAD` on `feat/hard-kill-watcher`. Main is bd7f0f75 (report-at-land, landed). The lane's commits: f766d880 (plan of record), 0233a934 (build 1, the lane), c8ce3fc7 (pairs at build 1), 09fe2b0b (build brief 2), 65b43672 (build 2: the builder's stray mutation table removed from the package's tests folder; R-2727's check widened to pin its cmd.exe half), 42e4a7ab (pairs at build 2), 8bf41eb1 (independent check), 36140442 (merge of main; the code map regenerated), 7e311052 (notes), fd801979 (local install check), and the final commit with these briefs.

The plan of record is `docs/reviews/hard-kill-watcher-2026-10-23/must-meet.md`: the three-lens attack's adopted findings (the start-time check before any signal, the lock kept while a builder may run, two lanes, the leader shape, deterministic waits, the watcher's cwd, the helper moves), rows R-2720 to R-2728, R-2667's new text, and the known limits. `plan-draft.md` and the three `plan-attack-*.md` files are its inputs.

The seat's record:
- Wrong-code pairs (`seat-mutate.mjs`): 22 of 22 red at 0233a934 and 23 of 23 at 65b43672 (`seat-mutate-output-65b43672.txt`); pair 23 removes the cmd.exe clause and turns R-2727 red, which survived before build 2.
- The seat's probes on macOS at 0233a934: a SIGKILL of pi-worker alone and of a wrapper's parent-pid tree, a finished build, and two lanes in one temp folder all ended with the builder's group gone (where a builder ran), the temp folder empty, the lock gone, one end record and no watcher left.
- The independent check at 65b43672 (`independent-check-65b43672.md`): 51 kills during pi-worker's first second, 14 tree kills during the watcher's startup, 20 SIGTERM-then-SIGKILL runs and pid-reuse decoys all ended clean; no MUST. Its SHOULD-1 (a hand-deleted pid record lets the lock go) and SHOULD-2 (a dead builder's group is still ended) are FEAT-006 known-bug lines, outside the threat model or below the kernel's pid-reuse rule.
- The local macOS install check passed 18 of 18 at 7e311052 (`install-check-7e311052.txt`). Both builders' reports of a failing post-edit item came from load; main passed 18 of 18 when the machine was quiet.
- The seat's diff check finds no removed escaped `\n` beyond a rewritten fake-pi line that keeps its escapes. Session titles: 0 missing. Build 2's locked full suite: 218 PASS, 0 FAIL, 2 SKIP. After the merge, map:check, readme:check, the trace and the tree check are green; `nana-writing HANDOFF.md` finds no long sentence.
- Named departures accepted in the brief: the watcher polls pi-worker's pid, not its parent; the one-shot hop (without it a parent-pid tree kill takes the watcher, measured); the watcher polls on win32 too; it writes nothing to stdio; it ends no process on win32. Helper moves: `pidAlive` to process-tree.mjs, the lock release to lib/lane-lock.mjs, the end-record assembly to build-records.mjs, `killWorkerTree` to a shared test module.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement bd7f0f7..fd80197: 10 rows in 2 features
FEAT-006 · Launch builders with execution limits
  R-2720 new (implemented)
  R-2721 new (implemented)
  R-2722 new (implemented)
  R-2723 new (implemented)
  R-2724 new (implemented)
  R-2725 new (implemented)
  R-2726 new (implemented)
  R-2727 new (implemented)
  R-2728 new (implemented)
FEAT-031 · Run checks reliably and without contaminating work
  R-2667 text changed
```

CI runs on the draft pull request at the reviewed tip. The seat lands only on green, with the Windows leg passing R-2721, R-2722, R-2724, R-2725, R-2727 and R-2728 and skipping R-2720, R-2723 and R-2726.

Ask above all, as the land reviewer: is this change safe to put on main for every seat — can the watcher start, linger or act where it should not (a normal build, a review run through pi-watchdog, a Windows host), can it hang or slow pi-worker's start or end, and does anything main did before this lane break?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
