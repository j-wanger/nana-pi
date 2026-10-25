# win-test-limits · adversary pass on the plan draft (main 61671be0)

Counts: 0 MUST, 6 SHOULD, 9 NOTE. Evidence paths are repo-relative; `plan:` is win-test-limits-plan-draft.md; research files are under `<scratch>/winflake/`.

Checked and clean. Every file:line the draft cites was opened at 61671be0 and matches, except the framing slips in items 4, 8 and 12. The provenance SHAs match `runs.json`: 08e99dbf, 822286b5, 86c628b9 and 1e77de81 for R-2546; d3cf9a0d for R-1960; 26235c79 for R-2619; 833bedee for R-1701; run 39887104509 attempt 2 for R-1242; run 39890246799 for GP4. "Eight attempts since the land" recounts to eight. Causes found in the logs:
- R-1960 is measured: `childResult {"code":null,"signal":"SIGKILL","output":""}`, `lockLeft:false`.
- R-1242 is measured: "contend: run1 never reached its rendezvous" (`logs/120206854751.log:4086`), the held wait at mutation-runner.test.mjs:1327.
- writing-injection is measured: SIGTERM with empty output at 5 s (`logs/119607205742.log`).
- R-2671 is measured: the late live objective case printed both unavailable markers, `afterDeadline` 454 ms.
- GP4 is a strong inference: pi-review exited 0 and left `nana-review-4112-gp4`.
- R-2546 is partly supported. R-2753 passed in the three later failing runs (it did not exist at 08e99dbf), so both records were written with the 800 ms limit and the miss is in labels or causes. Cite this in the provenance.

No rescue found. Each widened limit is a guard whose hang still fails, only later:
- The R-1960 and R-1779 children are killed at 30 s with no result read.
- worker-lane's launches end at 30 s.
- The contend wait still pushes its reason.
- A d-timeout the runner never kills ends itself at 25 s and reads `no passing check`.
- GP4's ESRCH precondition and R-2883's first-on-PATH comparison fail closed.

Nothing adds a retry. The only skip is R-2884's SKIP line off Windows.

Other checks that hold:
- The mutation runner retries only the baseline (`BASELINE_RETRIES`), never a pair. So a probe that misses its release turns the pair red, as pair 7 needs.
- `NANA_TEST_*` reaches the probe (mutation-runner.test.mjs:909), and run1 runs in-process through `withEnv` (:264-272, :307-312). The new knob needs no plumbing.
- No one reads the lockheld mark's content (:451 and :1327 test only that it exists).
- pi-watchdog checks the ceiling before it samples (:221, :234-235), so `--max-secs 1` (worker-lane.test.mjs:624) still fires at poll 60. `--poll invalid` (:89) stays a second occurrence.
- No worker-lane assertion reads `cpu=` or STALL lines.
- No file under packages/nana-setup/ changes, so the lane is ordinary and needs no install check.
- R-2880 to R-2885 collide with no other lane's IDs. The building lanes use R-2850 to R-2877, and the launch-limits-identity draft uses R-2890 to R-2897.

1. **SHOULD: R-2880's forced late pass uses up the margin it is meant to prove.** The draft puts LATE_PASS_MS (1.5 s) inside RECORD_LIMIT_MS (5 s). That leaves a-pass 3.5 s for a cold node start, the runner's overhead and the coverage knob in the serial run. The other fixture files get about 5 s. The same research shows stalls well past 3.5 s: adoption-reader took 23.8 s against 3.6 to 5.4 s on passing legs, in the same minute that sources-file took 83 s. R-2546 is the largest cluster (4 of the 8 attempts). The late pass exists only so that the old 800 ms limit fails every time, and any sleep above 800 ms does that. The provenance "5 s is above LATE_PASS_MS plus a cold start" names no cold-start figure. Fix:
   - Set LATE_PASS_MS to `1_000` (provenance: "chosen: above the old 800 ms, so the old limit fails on every run").
   - Write the effective margin, the limit minus the late pass, into RECORD_LIMIT_MS's provenance. Cite measured start tails (R-1960's child killed at 1.5 s with no output; R-2300's missed 2 s start wait) or say `chosen` plainly.
   - Change the R-2880 and seal titles to "1 second".
   - Follow seat decision 4: a-pass writes its own measured sleep, as the other late starts do. Do not use the runner's seconds. On Windows those include startup, so the "sleep removed" red case can pass there without the sleep.

2. **SHOULD: R-2883 does not say where the shim goes. The natural copy leaks the shim into every later launch.** brief-check writes its shim into the stub folder (`brief-check.test.mjs:65`). worker-lane's `run` puts that folder first on PATH for every call (`worker-lane.test.mjs:74`), including `launchTogether` at a 0.1 s poll (:577). A shim left in the stub folder answers every later CPU sample in the file. It also makes pair 9 ("shim after the real `ps`") impossible to write without PATH control. Fix:
   - The helper writes the shim into a folder its caller passes and takes the env it resolves with.
   - R-2883 uses a folder of its own. It passes `PATH: <shimDir><delimiter><stubDir><delimiter><process.env.PATH>`, `SAMPLER_MARKER` and `SLOW_SAMPLER_MS` through `run`'s `more` argument, so no other case sees the shim.
   - The helper must not call `mkdtempSync`: R-917's scan reads every `.mjs` in the test roots (`test-runner.test.mjs:620-629`).
   - worker-lane's `@effects` gains "a slow CPU-sampler shim", as brief-check's header has (:6-7).

3. **SHOULD: the sampler constants are copied, and one is missing.** The tunables table gives worker-lane its own CHILD_LIMIT_MS, WORKER_POLL_SECS and FAKE_PI_HOLD_MS, "following brief-check's" (`brief-check.test.mjs:50-52`). The shim also reads SLOW_SAMPLER_MS (:53, :64), and the table leaves it out. So it becomes an unlisted literal or a fourth copy. After this lane, CHILD_LIMIT_MS = 30_000 is defined in four test files (brief-check, mutation-runner, worker-lane, sources-file). R-2883's row names "CHILD_LIMIT_MS" without saying which file's. Fix:
   - SLOW_SAMPLER_MS, WORKER_POLL_SECS and FAKE_PI_HOLD_MS move into `slow-sampler.mjs` with their 2026-10-23 provenance. Both test files import them. That is the second-caller ruling applied to the constants that travel with the shim.
   - R-2670's seal (`brief-check.test.mjs:137-138`) keeps pinning them through the import.
   - R-2883's seal pins only worker-lane's child limit and the poll-above-limit rule.
   - The row says "worker-lane's CHILD_LIMIT_MS".

4. **SHOULD: the overlap section is wrong about review-texts-durable.** That branch edits docs/known-bugs/FEAT-031.md (two lines after :111, on R-1984 and R-2023) and docs/known-bugs/FEAT-030.md. Its new FEAT-030 line is the R-1701 flake at 833bedee, the exact failure R-2884 answers. It also edits REQUIREMENTS.md, docs/requirements-tree.md, docs/code-map.md, HANDOFF.md and docs/sessions/2026-10.md. The launch-limits-identity draft retires FEAT-031.md :99 and :109 as well. Fix: replace "no shared file" with that list. If review-texts-durable lands first, the seat merges main before the notes and closes or narrows its FEAT-030 line together with FEAT-031.md :97, :108 and :111.

5. **SHOULD: sources-file's cause is a guess, and its checks still print nothing.** R-2370 to R-2372 failed with no detail. The file took 83.2 s against 7.9 to 12.7 s on eight passing legs (`logs/121045438225.log:979-986`). The extra 74 s or so is about seven back-to-back 10 s timeouts, which points to a sustained stall. A 30 s limit covers only a stall shorter than 30 s per spawn, so the planned limit might not have saved that run. Fix:
   - Mark the CHILD_LIMIT_MS provenance "cause inferred".
   - Add the three checks to seat decision 3: each failing spawn's status, signal and elapsed ms go in the detail, inside `run` (:36-42), which the lane already edits.
   - Add the known limit "a runner stall longer than 30 s still fails sources-file".

6. **SHOULD: R-2671's miss is a product timing signal, and running alone hides it.** The failing detail shows the late live objective case printed both unavailable markers and ended 454 ms after `HOOK_DEADLINE_MS`. The research (report section 5, item 4) flags this as past the roughly 300 ms trigger objective-hook-win set for revisiting the deadline (FEAT-013.md:104 records that trigger). The run-alone entry follows the list's own rule (`test-runner-config.mjs:51-54`), but it removes the load that exposed the overrun. Fix: keep the entry. Narrow FEAT-013.md:203 rather than close it, to: "R-2671's late live case overran the hook deadline by 454 ms at 1e77de81, past objective-hook-win's revisit trigger; hook-deadlines now runs alone, so CI no longer runs these hooks under load; the deadline is a hook-lane question."

7. **NOTE: R-2619's inferred cause can be checked for free.** worker-lane's Windows file time grew from 16.5 to 24.3 s (51 to 52 checks, 10-21 and 10-22: `rl-119416256447.log`, `pe-119556899369.log`, `pe-119846430832.log`) to 59.4 to 92.9 s (64 checks, the eight `pass-*.log` legs of 10-25). pi-worker gained build records, a lane watcher and startup temp cleanup in between. The sampler theory predicts a large drop at poll 60. Fix: R-2619's new detail adds each launch's elapsed ms (seat decision 3 lists entry, status and stderr only). The notes record worker-lane's Windows time before and after. If it does not fall, the 30 s limit is what holds, not the poll.

8. **NOTE: R-1701 still judges a bare pid, and R-1700 has the same exposure.**
   - `shellEnded` (`post-edit-hardening.test.mjs:328`) waits for `!pidAlive(shellPid)`. Windows can reuse that pid within one 20 ms poll. The Known limits list five exited-pid sites but not this one.
   - R-1700's case (:241-273) builds the same tree under the same 2.5 s deadline on Windows and has not failed in 171 legs. That weakens the cold-start reading of R-1701's single miss: the failing file took 10.3 s against 8.4 to 9.1 s, which fits a full 2.5 s alive wait but also a full 2 s `shellEnded` or reap wait.
   - "No loosening of a bound a requirement states: R-1700's 2.5 s seal" overstates the case. R-1700's row states no number; its check seals TREE_DEADLINE_MS.

   Fix: add both lines to Known limits ("R-1701's shell-ended wait judges a bare pid"; "R-1700's tree case keeps 2.5 s with the same Windows start exposure"), and reword the R-1700 bullet.

9. **NOTE: the R-1954 scanner pins R-2884's SKIP line.** `windows-skip-lines.test.mjs` (R-1954, :28) reads the `if (process.platform === "win32")` block at :279 whatever its polarity (:34-37). Every check title in that block needs its own SKIP line, with the title and ` — ` and a reason, in the `} else {` on the block's closing line (:117-120). Fix: the brief says R-2884's check gets an exact-title SKIP line beside R-1701's (:341), and its title stays a plain literal, because `${` truncates the scanned title (:54).

10. **NOTE: the wall-time cost is understated.** The run-alone files run one at a time after the pool drains (`scripts/test.mjs:579`), so the net cost is about +27 to 36 s, not exactly 36. Inside the pool:
   - d-timeout now runs to the 5 s limit in both record runs, plus the late pass: test-runner.test.mjs gains about 10 s.
   - R-2881 adds 3 s and R-2882 adds 10 s to mutation-runner.test.mjs, which already takes 120 to 154 s on Windows.
   - The R-1701 case always runs to its 10 s timeout on Windows, about 7.5 s more.

   Name these in Known limits next to the run-alone line.

11. **NOTE: some red cases have no pair.** The red cases include "either delay removed" (R-2882), "the hold dropped" (R-2883) and "the late start removed" (R-2884), but pairs 1 to 12 omit them. Pair 10 also reverts `timeoutMs` and the alive wait together, though each alone turns R-2884 red: the pack kills the shell at 2.5 s before level A writes its pid files at 3 s, or the alive wait ends before the late start. Fix: add the three pairs, the R-2884 one on the scratch Windows push, and split pair 10 into 10a (`timeoutMs`) and 10b (the alive wait). Otherwise drop the unpaired red cases.

12. **NOTE: three stated reasons are wrong; the conclusions stand.**
   - Seat decision 9: the launch-limits-identity draft does not edit `process-tree-helper.mjs`. It cites `killWorkerTree` (:38-44) as precedent and rejects `windowsLaneWatchers`. The real reason for a new module is one purpose per module.
   - Seat decision 6: no building lane edits writing-injection.test.mjs. Its limit stays unsealed because no row owns it (R-2500 is a feature row), not because of overlap.
   - Overlap section: artifact-readers adds a FEAT-031 `Reads:` line naming mutation-runner.mjs and does not edit the library. Its REQUIREMENTS.md hunks sit in FEAT-031's header and FEAT-032's header (`@@ -2615`), just after R-2670, so this lane's rows land between two of its hunks. Merge main before the notes.

13. **NOTE: one fixed pid makes GP4's iterations share one folder.** `dirA` alternates between two spellings of the same folder for every kind (`path-spelling.test.mjs:405`). With `nana-review-${IMPOSSIBLE_PID}-gp4`, every iteration therefore registers the same physical path. Today each fresh pid gives a distinct folder. A failed reclaim then makes the next iteration's `git worktree add` throw (:81-84), which hides that iteration's own result. Fix: name the folder `nana-review-${IMPOSSIBLE_PID}-gp4-${kind}-${label}`. pi-review's `^nana-review-(\d+)-` still matches (`pi-review.mjs:88`). Record IMPOSSIBLE_PID as the third copy of 2,147,483,647 (`mutation-runner-takeover.test.mjs:24`, `mutation-runner.test.mjs:620`).

14. **NOTE: R-2885's row is wider than its test, and adoption-reader's evidence is thin.**
   - The row says "a reason naming the hook-producer constant behind its load-sensitive bound". The test can check only that a name appears. Narrow it to "each with a reason naming HOOK_DEADLINE_MS or HOOK_PRODUCER_TIMEOUT_MS".
   - adoption-reader's one failure came during a runner-wide stall (23.8 s, with sources-file at 83 s in the same minute). Running alone would not have prevented that. The entry still meets the list's rule, since it tests a product bound, and costs about 4.5 s.
   - adoption-window is adding reader tests to that file now. Re-measure the file's time after it lands, because a run-alone file adds its whole duration.

15. **NOTE: the guard decision and the pause belong in HANDOFF.**
   - The floor on test child limits, the Windows time scale and a review-standard line are owner calls. Put them on one "Open for the owner" line with a default, such as "none until the next ten Windows legs", as the memory rule asks. Known limits alone is not enough.
   - HANDOFF Next item 4 says "no new lane ... until the owner's discussion". The Source section should name the owner's 2026-10-25 pick as the exception to that pause.
