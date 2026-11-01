VERDICT: DONE

# Making trigger — build 5 technical record

## Commits

- `807c4caa`: fix the round-1 land MUST, final SHOULD and NOTE 1; retain requirement changes, three tagged regressions, red/green evidence and four new mutation pairs.
- `6d7faa44`: evidence-only commit retaining the first locked full suite, mutation results, install rehearsal and this report.
- The following evidence-only correction removes the generated movement-log home prefix and retains the subsequent green full suite and initial CI failure. Its hash, final-tip checks and finished CI result belong in the final worker response.
- The code commit followed the green focused run (12 files, 213 checks, exit 0). Its amendment redacted a generated trace log after the green locked full suite; no code changed.
- Both evidence commits follow green locked full suites. No implementation or assertion changed after the green focused run. The correction is a separate commit because the gate refused an attempt to rewrite the already pushed evidence tip.

## Closures

### MUST — recover detached HEAD before branch-dependent fetch

Files: `packages/nana-pack/lib/memory-run.mjs`, `packages/nana-pack/tests/memory-run-recovery.test.mjs`, `REQUIREMENTS.md`, `packages/nana-pack/README.md`; row R-3294.

The maker imports the existing `withProfileLock` and `recoverProfile` helpers. A new fail-fast, local-only lock hold aborts a stopped rebase before `fetchProfile` reads the branch. Fetch remains outside ownership. The existing preparation hold recovers again after fetch, protecting against a writer that stopped during the network step. Model calls and captured-SHA push remain outside ownership.

The new case first completes a synthetic unit, starts a real `git rebase --exec false HEAD~1` in the temporary profile clone, and proves HEAD is detached. Two subsequent making runs recover and process the new pending unit exactly once. It checks abort ownership, recovery-before-fetch ordering, attached main afterward, and absence of the clone lock during fetch, push and model calls.

Red: `node packages/nana-pack/tests/memory-run-recovery.test.mjs`, exit 1 against unchanged `bb55e311` implementation files. The paused-rebase case returned `memory: failed` before recovery. Green: the same command, exit 0. Evidence: `build5-red-recovery.txt`, `build5-green-recovery.txt`.

Mutation pair `paused-rebase` removes only the new pre-fetch recovery hold; its named regression fails.

### SHOULD — bounded review discovery and loud listing failure

Files: the same implementation, test, requirements and README files; row R-3293.

Discovery lists committed main paths one needed local review folder at a time, rather than listing the lifetime corpus in one Git response. A lane requests only its matching folders and remembered earlier lanes. Commands without a lane still sweep all folders. The existing imported `gitText` rejects both Git errors and nonzero exits, so an over-cap listing cannot become an empty allowed-file set. Status returns exit 1 and the fixed `memory: failed` line, with no misleading pending count.

The regression constructs a synthetic Git tree exceeding the real `profileGit` output cap without writing thousands of long paths to disk. It verifies actual ENOBUFS, then requires status failure rather than zero pending. A small-lane make must list only its own folder despite the unrelated over-cap folder. CRLF, trailing space/tab and no-final-newline transport variants each deliver the review unit; the first failed model call leaves it pending for the second variant.

Red: the recovery command above, exit 1 on `bb55e311`; status falsely printed `pending 0`. Green: exit 0. No output cap was enlarged and no new tunable was introduced.

Mutation pair `listing-failure` substitutes an empty list on Git failure. Pair `listing-scope` includes unrelated folders. Each makes exactly the named listing regression fail.

### NOTE 1 — preparation errors are not busy

Files: the same implementation, test, requirements and README files; row R-3291.

Only `PROFILE_WORDS.locked` maps to `memory: busy` during preparation. Dirty-clone, failed commit/status and failed rebase preparation report the existing fixed `memory: failed` outcome. No exception text is printed. Merge-time classification remains unchanged.

The new case checks dirty-clone, failed commit/status, failed rebase and real clone-lock contention separately. Each stops before model work. Non-lock errors report failed, while lock contention still reports busy.

Red: the recovery command above, exit 1 on `bb55e311`; dirty preparation falsely printed busy. Green: exit 0. Mutation pair `prepare-outcome` restores the false busy label and makes the named case fail.

## Tests and requirement scope

Only three new behavioral cases were added, one per requested finding, all in the precedent recovery module. Every case is awaited under the existing per-case timeout. No existing test assertion or title changed; no test was deleted. No suite test imports, copies or executes the seat mutation script. All fixtures use OS temporary directories, scratch homes, local bare Git remotes and injected model replies.

Existing rows R-3291, R-3293 and R-3294 were changed before tests and code. No new row ID, sealed tunable, tree placement or artifact registry entry was allocated. The generated code map records the two new test imports; the generated requirements tree is unchanged.

## Mutation runner

Command: `SEAT_MUTATE_OUT=docs/reviews/making-trigger-2026-11-01/build5-mutation-result.txt node docs/reviews/making-trigger-2026-11-01/seat-mutate.mjs`, exit 0 on `807c4caa`.

All ten previous pairs remain. Four new pairs cover the three closures above. Every shard passed its baselines before changing code. Assertions were never inverted. The runner was repeated after the log-redaction amendment so its retained result names the amended code commit.

`RESULT: 14/14 red (14 exactly their named titles, 0 with a named title green, 0 with an unnamed red), 0 survived, across 5 shards`

## Verification

Long output is retained in the adjacent `build5-*.txt` files and `build5-tree-movement.md`.

- `npm test -- memory-run profile-sync profile-store memory-making memory-shaping outcome-meter land`: exit 0; 12 files, 213 checks. An initial 300-second outer tool deadline interrupted the first attempt; the complete rerun passed with a sufficient limit.
- `npm run test:locked`, foreground, one machine-wide lock: exit 0, then exit 0 again after movement-log redaction. An intervening rerun exited 1 only because shell redirection changed an already tracked suite-output file during the run; all 8898 checks passed. The successful rerun wrote outside the checkout and copied its output afterward. Both outputs are retained.
- `npm run map`, `npm run map:check`: exits 0; 552 modules.
- `npm run readme:check`: exit 0; 999 claims, zero problems.
- `node --experimental-strip-types scripts/requirements-trace.mjs`: exit 0; 2341 rows, 2087 implemented and traced, zero EARS problems.
- `npm run req:tree`, `node scripts/requirements-tree.mjs --root .`: exits 0; zero problems; 21 of 21 deliverables made and read by code, 21 more parked.
- `node scripts/known-bugs.mjs --root .`: exit 0; names=0, sizes=0.
- `npm test -- requirements-deliverables`: exit 0; 21 checks.
- `node scripts/requirements-moved.mjs --root . --base origin/main`: exit 0; FEAT-040, 23 lane rows and A-093 only.
- `node scripts/lane-class.mjs --root . --base origin/main`: exit 0; gate, inherited land-tool change.
- `node scripts/identity-scan.mjs --root .`: exit 0; zero findings. The first final-tip check exited 1 because the newly tracked movement log retained a local-home prefix in a Node warning. The corrected evidence redacts it; the rerun passes. The initial failure is retained in `build5-initial-tip-identity.txt`.
- `node packages/nana-setup/bin/install-check.mjs`: exit 1, solely `FAIL pi post-edit — write-error: write tool result is marked as an error`. All other rehearsal checks passed. This is the brief's known builder-environment exception.

Suite summary: `251 files: 249 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8898 pass, 0 fail, 44 skip · 674.9s`.

The first pushed evidence tip's finished CI run, 41298713352, failed all three suite legs solely on that same movement-log identity finding. All three new regressions passed, including Windows. All four install-check legs passed. The run was not cancelled; its failed-suite output is retained in `build5-ci-attempt-1.txt`. The final corrected tip's finished run belongs in the worker response.

## Precedent and known-bug scope

All three precedent files were read completely before design. The implementation reuses exported recovery, lock, Git and classification helpers from `profile-sync.mjs`; none was copied or moved. The recovery tests reuse the existing fixture and bounded async harness.

Departures: one additional short clone-lock hold precedes fetch because the original ordering cannot repair detached HEAD; review-path eligibility is collected per needed folder because a corpus-wide response grows beyond the Git cap; preparation non-lock errors use the existing failed word rather than busy because contention is not their cause. These are the three requested behavior changes. Network work remains outside all clone-lock holds. No private helper was moved or copied.

The entire `docs/known-bugs/FEAT-040.md` file was read, including its omitted entries. No listed known bug is fixed or changed. Temp-file cleanup, damaged supersede duplicates, strict root-profile files, long Windows store paths, hard-link filesystem limits, detached-child survival and fork-shared identity remain unchanged. The profile writer's long lock wait and poll interval remain unchanged. No known-bug file was edited.

## Not done

No session-end hook, setup wiring, model session, real profile access, real transcript access, model call, independent reviewer launch or land. No forbidden directory, HANDOFF or session archive changed. No GitHub issue was created, edited, commented on or closed. No open design question remains.

The known local install-check exception remains. Push and the finished CI run for the final evidence tip, including the Windows suite leg, are reported in the final worker response.
