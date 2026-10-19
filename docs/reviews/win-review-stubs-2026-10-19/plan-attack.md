# win-review-stubs — plan attack (one adversary)

Verdict: AMEND

AMEND, with small changes; the design, rows, class and wait stand. All probes ran in a scratch clone of the unread-verdict-loud tip (b42b541) with a temp HOME, on macOS.

What held:
- Red today is confirmed from the Windows job log of run 39278411820. review-standard printed 3 pass, 3 skip ("POSIX shell stub"). handoff-writer-role printed "SKIP pi-review spawn env: POSIX shell stub". The control check does not run on Windows at all.
- With the design applied, review-standard gives 7 PASS and handoff-writer-role gives 7 PASS.
- With the four rows added, the trace prints 1,306 total and 0 rows off form. The tree check, map:check (299 modules, 0 problems) and readme:check (0 problems) are green. requirements-tree.test is green once the leaf total moves 1,302 to 1,306.
- Each wrong code fails as the plan says:
  - dropping NANA_HANDOFF off fails WS4;
  - letting the catch fall through fails WS1 and WS2;
  - `if (false)` on the blank check fails WS3;
  - a stub that writes no marker fails the control.
- Both win32 stub bodies run correctly under node.
- The lane class (ordinary) is right: tests only, no review-tool code.
- Wait for unread-verdict-loud. It changes the stub line next to the win32 SKIP line in handoff-writer-role, so the hunks would conflict. Building after it lands also avoids a merge-and-confirm round.

Amendments:
1. The "creating no reservation" clause of R-1680 to R-1682 can pass vacuously. Probe: pointing the test's resDir at a misspelled folder left all three refusals PASS.
   - A successful run leaves `.pi/agent/review-ledger.reservations` under its HOME (probe), so the control can assert it cheaply.
   - On Windows the ledger home comes from USERPROFILE, not HOME. That is exactly where a wrong folder would hide.
   - Fix: the control also asserts that folder exists, and its title changes. The control is unmarked and cited by no row. It is now wrong code 5.
2. The scratch-repo change in handoff-writer-role is better than "nicer". Probe with a git logging shim: today's check runs `git worktree add --detach` and `worktree remove` against the checkout the suite runs from. It also copies that checkout's roughly 2,500 tracked files into temp. In a lane worktree, that registers a worktree in the main checkout's shared git folder. The new version touches only the scratch repo (logged).
   - The brief now says to resolve the scratch root with `fs.realpathSync`, as review-standard does. It also says to give the repo its own name, because `repo` is already a module-level binding.
3. The leaf-total literal appears three times: title, comparison and message. My first edit missed the comparison and the test stayed red, so the brief names all three.

Conflicts:
- unread-verdict-loud: a real conflict in handoff-writer-role.test.mjs. Wait for it. It adds no lib import that the review-standard pack copy lacks (checked its pi-review and review-round imports). No copied module loads anything dynamically except the standard itself.
- silent-main-guard: no conflict. It only adds tmpDirUnmanaged to tmp-dir.mjs.
- unclaimed-tests: no conflict. Its listing is opt-in, and unmarked checks stay legal.
- Every other in-flight branch shares only requirements-tree.test.mjs (regenerated on merge), REQUIREMENTS.md and the docs maps. No other branch touches either test file, fake-pi.mjs, pi-review.mjs or pi-watchdog.mjs.
- No README or contract text claims these checks skip on Windows.

Claim most likely wrong: that the strengthened control passes on the Windows CI leg. Support: immutable-review.test.mjs uses the same setup on Windows and passes 15 checks there. That setup is a JS-realpath temp root, writeFakePi, a PATH key that sorts ahead of Path, a scratch git repo and HOME/USERPROFILE. Nothing in this lane ran on Windows. The pack copy is the one difference, and its imports are all static and copied.
