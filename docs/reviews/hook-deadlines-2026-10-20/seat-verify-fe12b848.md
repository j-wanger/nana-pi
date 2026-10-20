# Seat checks — hook-deadlines build 1, tip fe12b848 (2026-10-20)

- Build, by a pi gpt-5.6-sol builder through pi-worker (`build-brief-1.md`): one commit fe12b848 (rows R-2010 to
  R-2015; `runHookProducer` passes `timeout: HOOK_PRODUCER_TIMEOUT_MS`, 1500 ms, chosen and sealed by R-2013, to its
  spawnSync; `verifier-pipe.mjs` adds `process.stderr.on("error", () => {})` beside its stdout guard; one setup
  README sentence; the new `hook-deadlines.test.mjs` and one new check each in `hook-producers.test.mjs` and
  `hooks-closed-output.test.mjs`, whose runner now takes a script, args, env and the stream to close; the
  regenerated code map and tree). `nana-adoption.mjs`, `nana-objective.mjs` and the knowledge CLI did not change.
  After fe12b848, 52008906 adds only the pair table and its output. The seat's notes commit adds only this record,
  the independent check, the Windows log, the two review briefs, HANDOFF and the session entry.
- Builder process: the builder pushed the branch and opened draft pull request #105 itself; its brief asked for
  neither. It also ran the full suite, though the brief said single test files only (the builder preamble asks for
  a green full suite before the last commit). The seat took no action beyond recording it; CI on #105 is the lane's
  CI.
- CI on build 1, run 39377281189 on draft pull request #105 at fe12b848 (GitHub's merge commit afde470b merges
  fe12b848 into its own ancestor cdf4b098, so the tree tested is fe12b848's); all five jobs succeeded:
  - macOS `175 files: 173 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7788 pass, 0 fail, 27 skip`. hook-deadlines
    `3 pass` (6.2 s); hook-producers `11`; hooks-closed-output `7`.
  - Ubuntu `175 files: 173 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7733 pass, 0 fail, 45 skip`. The same three files
    pass with the same counts.
  - Windows `175 files: 158 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6724 pass, 0 fail, 103 skip`
    (`ci-windows-fe12b848.log`). The 17 skipped files are main's declared set. Every lane check runs natively, by
    title:
    ```
    PASS adoption hook prints its marker and the stale-copy output when the adoption producer hangs
    PASS adoption hook prints both markers before its installed limit when both producers hang
    PASS objective hook prints its marker before its installed limit when its producer hangs
    PASS  packages/nana-setup/tests/hook-deadlines.test.mjs               3 pass  6.4s
    PASS launcher starts the objective, adoption and stale-copy producers with a 1500 ms time limit
    PASS verifier hook ignores a closed stderr and exits 0
    PASS knowledge pull hook ignores a closed stdout and exits 0
    ```
    hook-producers `11 pass`; hooks-closed-output `7 pass`. The log's timestamps put R-2011's PASS line 3.1 s after
    R-2010's and R-2012's 1.6 s after R-2011's (inferred: each gap includes the check's own setup), against the
    installed 5 s limit.
  - install-check: macOS and Windows success.
  - None of main's known failures showed: Ubuntu's path-spelling GP1 and GP2 were fixed on main at ca27d86, Windows
    main reads 0 FAIL since 4be0b79, and no R-291 merge artifact arises, since GitHub's merge commit holds
    fe12b848's tree.
- The seat's wrong-code pairs (`seat-mutate.mjs`), through the shared mutation runner on macOS, one shard, Node
  22.22.2, on fe12b848 (`seat-mutate-output-fe12b848.txt`, committed in 52008906): 5 of 5 red, 0 survived, each red
  on exactly its named titles. Baselines: hook-deadlines 3, hook-producers 11, hooks-closed-output 7 PASS.
  - M1 (no time limit, main's form) turns R-2010, R-2011, R-2012 and R-2013 red; M2 (3000 ms) turns R-2011 and
    R-2013; M3 (print the partial stdout of a stopped producer) turns R-2010, R-2011 and R-2012; M4 (no stderr
    listener, main's form) turns R-2014; M5 (the knowledge CLI ends by setting the exit code) turns R-2015.
  - Declared: (a) every pair ran on macOS only, so R-2014 and R-2015 have no wrong-code run on Windows; (b) M5 edits
    the knowledge CLI, which the lane did not change, because R-2015 is a pin and M5 is the plan's wrong code for it;
    (c) no test checks that a producer stopped at the limit leaves no child process behind, so no pair covers it.
    Each is a HANDOFF residual.
- Independent check (`independent-check-fe12b848.md`): it ran on fe12b848 in a private clone, with a base clone at
  cdf4b098, a temp HOME for every probe and single test files only. HOLDS, no MUST and no known bug, 12 probes. The
  three lane files passed 3, 11 and 7. Its probes and how each was settled:
  1. Probe 1 (a stub blocked opening a FIFO with no writer): the exact objective marker, no partial text, exit 0,
     1.543 s. A blocked read ends on SIGTERM. Nothing to settle.
  2. Probe 2 (a producer that prints, exits 0 and leaves a detached grandchild holding stdout for 4 s): the marker at
     1.560 s; before the lane the hook waited for the grandchild. The real output is lost, but none of the three real
     producers starts a child. Recorded as a HANDOFF residual.
  3. Probe 3 (the real producers, healthy, against a read-only copy of an 8,159-line journal): objective 80 to 83 ms,
     adoption 34 to 36 ms, stale-copies 41 to 44 ms; under 20 busy loops on 10 cores, at most 120 ms. More than 12
     times under the limit on this Mac. A cold first run after a reboot was not measured; it joins the
     slow-producer residual.
  4. Probe 4 (both adoption producers hung, under CPU load): both markers in order, exit 0, 3.057 s against the 5 s
     limit. The margin is the plan's known limit and a HANDOFF residual.
  5. Probe 5 (the win32 hook entries in exec form, run on macOS with no shell): objective 1535 ms and adoption
     3039 ms, exact markers, status 0. It did not observe a real Windows kill; CI's Windows pass of R-2010 to R-2012
     is the only Windows evidence. Recorded with the slow-producer residual.
  6. Probe 6 (healthy output through the darwin installer commands, lane against base): identical output, 117/117 ms
     and 113/109 ms. No regression on the healthy path.
  7. Probe 7 (the verifier hook with closed pipes, 4 runs per case): the lane exits 0 in every case; the base exits 1
     with stderr closed on `not json` and `{}`. The ask decision on a hit is unchanged.
  8. Probe 8 (the limit's edge): a healthy stub that prints after 1.3 s still prints; one after 1.7 s gives the
     marker. That is the plan's declared limit, recorded as the slow-producer residual.
  9. Probe 9 (the install check in a temp home): 15 of 15 PASS, exit 0.
  10. Probe 10 (repo checks): code-map 0 problems, readme-check 715 claims and 0 problems, R-2010 to R-2015 new and
      implemented.
  11. Probe 11 (test cleanliness): the test leaves its temp folder empty and no stub process behind, and writes
      nothing in the worktree or the main checkout.
  12. Probe 12 (killing a producer mid-run): all three producers only read; stale-copies runs its skill step as a
      dry run, so a SIGTERM cannot corrupt data.
  - Its notes: an old hung producer process (pid 39054, from an earlier plan probe's deleted temp folder) was left
    alone; the seat had found four such processes and stopped them (a HANDOFF seat-process line). The two untracked
    pair files it saw are the seat's, since committed in 52008906.
- The plan's other known limits, each a HANDOFF residual: a producer in a wait no signal ends is still not stopped,
  and Claude Code's 5 s limit then drops the hook's output (this narrows the older stale-copies residual, rewritten
  in place); a producer stopped at the limit prints the same failed marker as one that crashed; the shared-memory and
  roster-notice hooks have no deadline of their own. The plan's claim most likely wrong, that a healthy producer
  always finishes inside 1500 ms at a cold start on the owner's Windows machine, stays unmeasured.
- HANDOFF's two closed-output residuals that this lane settles are removed: the verifier's unguarded error output
  (R-2014) and the knowledge pull hook with no closed-output check (R-2015).
- Rows: R-2010 to R-2015 read `implemented` in REQUIREMENTS.md, in SUB-012 directly after R-1944. The seat helper's
  re-run at the notes commit: `node scripts/requirements-trace.mjs` reads `1518 total (1252 implemented · 1 planned ·
  34 retired · 226 untested · 5 violated)` and `ears: 0 rows off form (allowance 0)`; `npm run map:check` reads 334
  modules, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`; it compares against the merge base
  cdf4b098):
  ```
  tree movement cdf4b09..5200890: 6 rows in 1 features
  FEAT-013 · Install and connect harness runtimes
    R-2010 new (implemented)
    R-2011 new (implemented)
    R-2012 new (implemented)
    R-2013 new (implemented)
    R-2014 new (implemented)
    R-2015 new (implemented)
  ```
  CAP-04 moves from 416 to 422 rows, FEAT-013 from 156 to 162 and SUB-012 from 33 to 39.
- Not in this record: a seat-run locked full suite (CI's three legs ran the whole suite) and the local macOS install
  check, which runs before the land.
- Main was cdf4b098 when the lane branched. It has since moved to 8466795b (the doctor-fix-line land) and then to
  6f07daee (the setup-checkout-spelling land). Those lands share with this lane only HANDOFF, the session archive,
  REQUIREMENTS.md, the tree, the code map and the setup README, in other lines; none of this lane's code or test
  files. setup-checkout-spelling changes `settings.mjs`, whose `desiredHooks` the new test imports from the checkout.
  So the land needs a merge of main and a regenerated map and tree, and that merge needs its own accepted review
  coverage.
