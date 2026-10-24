I found no MUST, so the verdict is LAND. Every hard kill the threat model names ends with no temp file, no stale lock and no builder running, apart from the narrow windows the lane already records as known limits. The watcher cannot release a lock another live process holds. It can signal a stranger's process only through a pid reuse the kernel makes very unlikely, and that case is recorded.

**What I checked**
- **Lock release.** Both pi-worker and the watcher remove the lock only when its stored pid equals the worker's pid. A new pi-worker cannot create the lock while the old one exists, so the read-then-remove has no honest race. The watcher never touches a lock that names another process, live or dead.
- **Signals.** The watcher's only signal is a group kill of the recorded builder, and only off Windows. pid 0, pid 1 and negatives are refused twice. A live leader must have started no later than the pid record, within a one-second tolerance, or the watcher keeps the lock and sends nothing. On Windows it waits up to two seconds for a directly launched builder and otherwise keeps the lock.
- **Normal exit.** pi-worker removes the folder, writes its own end record and releases the lock. The watcher then finds the folder gone and no lock it owns, and exits without acting.
- **Startup order.** The lock is now taken before the temp folder is made. Every early exit in between releases the lock: the usage error path, a failed folder creation, and every lane refusal. An uncaught throw after the lock is taken leaves the lock and folder for the watcher, which cleans them because no builder was recorded.
- **Two lanes in one temp folder.** Each watcher works only on its own folder and its own worktree's lock. Each end record is keyed by its own build id.
- **Hop window.** A parent-pid tree kill while the one-shot hop is still running can still leave the folder and the lock. Main leaves them after every hard kill today, so this is no regression, and it is recorded.
- **Helper moves.** The shared pid-liveness check behaves the same as the mutation runner's old private copy. The new end-record builder produces the same fields as the code it replaced. The optional capture-folder and spawn-callback inputs leave `pi-review`'s own path unchanged.

**Evidence on this machine:** I ran the watcher and Claude-builder tests with a scratch temp folder. Both test files passed, the temp folder was empty afterwards, and no watcher process was left.

**SHOULD / NOTE**
- SHOULD: when the recorded builder is already dead, the watcher still kills its group with no identity check. This is the ordinary path after a parent-pid tree kill. A real hit needs the freed pid reused by a group leader that then exits, all within about 200 ms. It is already a known-bug line; signalling only a live, checked leader would close it.
- SHOULD: if the builder's pid record is missing, for example deleted by hand, the watcher releases the lock while the builder runs. That trigger is outside the threat model and is recorded.
- NOTE: the 20 new hard-kill-watcher lines in the FEAT-006 known-bugs file lack the `- ` list marker the rest of the file uses. In rendered Markdown they run together as one paragraph. The suite's known-bugs test did not object.
- NOTE: the start-time read borrows the git timeout value; this is recorded.

VERDICT: LAND
