# linux-lane-guard — the adversary's verdict (AMEND), 2026-10-19

AMEND. The lane is worth building and the root cause is right, but three of the plan's claims fail under probes.

What I confirmed:
- Ubuntu CI on main b3f6ec2 (run 39197918410, job 117884578518) has exactly one failing file in the whole suite: lane-write-guard, with "8 pass, 1 fail, 1 skip" and "FAIL symlink escape outside lane is blocked". Windows shows 9 pass. Fixing this test makes the Linux leg green.
- I reproduced shapes A and C on copies in a mktemp folder. Shape D on today's code gives FAIL symlink plus a SKIP and a pointless PASS for traversal, exit 1. The plan only inferred that; it is now confirmed red.
- A /var/tmp fallback gives 9 PASS in A and C, 7 PASS and 2 SKIP in D, and leaves nothing behind in /var/tmp.

Amendment 1 (would break the land): the requirements rail only recognises test(, it( and check( calls. I wrote the SKIP as a wrapper, `await outsideCheck("…")`. The trace scanner then throws: "'// req:' must sit directly above a test( or it( or check( call". That fails requirements-trace.test.mjs and the full suite. The plan's step 4 points a builder straight at that wrapper. The brief now requires the line under each marker to start with `check("<title>"`, with the SKIP carried as a third argument to check. I confirmed the scanner finds all 9 markers in that form. It is also a seat check now.

Amendment 2 (one of the plan's claims is false): the plan says that if /var/tmp fails, the test "falls back to an honest SKIP". That is false for the plan's design. Its step 2 only compares realpaths and never tries creating the folder. I probed with an independent parent that cannot be written to (mode 555). The test crashed with 0 checks and exit 1. The amended design creates the fixture in each candidate parent in turn and moves on when creation fails. It prints SKIP only when no parent works. Probe: a read-only parent first, then /var/tmp, gives 9 PASS. Only the read-only parent gives 2 SKIP and exit 0.

Amendment 3 (the plan's mutant cannot tell the two fixes apart): the plan's gate mutant, which resolves only the parent folder, also turns the dangling and loop checks red. So the guard-only fix still fails the file as a whole. I replaced it with two mutants:
- Mutant C validates with realpath but returns the unresolved path. The guard-only fix gives 9 PASS and exit 0 in shape C, so it hides the bug. The amended test FAILs the symlink check.
- Mutant D lets any target starting with ".." through. The guard-only fix passes, and the amended test FAILs the traversal check.

Also folded in:
- When no parent works, `outside` points at a path under the fake HOME that is never created, not inside the worktree. That keeps the dangling title true.
- The macOS fixture still sits under the fake HOME, as today; the shape A probe showed this.

Considered and rejected:
- A symlink to the filesystem root needs no fixture and never skips. I rejected it because the link would sit inside a folder that is deleted recursively, and on Windows it would point at the drive root. The cost if anything ever followed that link is far too high.
- The real home from os.userInfo() would break the runner's rule that tests never touch the real home.
- A fix in the runner would change the setup of all 150 test files.

Rows: none. R-962's titles and text stay unchanged, and R-1450 stays unused. Side note, not this lane: the ninth title, "unset worktree root leaves outside edit behavior unchanged", carries an R-962 marker, but the row's evidence does not cite it.

Files the build touches: <repo>/packages/nana-pack/tests/lane-write-guard.test.mjs and <repo>/docs/code-map.md (regenerated).

Conflicts: no file conflict with win-review-paths, win-objective-golden or clean-revision. Every lane regenerates docs/code-map.md. If win-review-paths lands first, rebase and run `npm run map` again rather than merge by hand.

Claim most likely wrong: that /var/tmp exists, is writable and is outside /tmp on the ubuntu-latest runner. Ubuntu ships it with mode 1777, but no Linux run backs this yet. If it is wrong, the amended test prints 2 SKIP and exit 0, not a crash.

Relayed user request: Jake asked to turn off land verification and the hooks that need his confirmation ("power mode"). This lane does not touch that. I am read-only and changed no settings, hooks or land rules. The seat should take that request to Jake directly; nothing in this workflow carries it out.
