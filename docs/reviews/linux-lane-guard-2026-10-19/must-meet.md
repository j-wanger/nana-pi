# linux-lane-guard — must-meet (amended)

**Feature.** On a Linux runner, the fake HOME sits under /tmp. There the lane-guard test still runs its symlink-escape and parent-traversal checks. It runs them against a fixture outside every root the gate permits, and both pass. When no such fixture can be created, each of the two checks prints one SKIP line. It prints no PASS and no FAIL for them.

**Class.** Ordinary. The lane changes tests only. `nana-gate.ts` and the gate policy do not change.

**Threat model.** In scope: honest variation in temp-folder layouts:
- TMPDIR set or unset.
- The macOS `/tmp` and `/var` symlinks.
- The HOME that `scripts/test.mjs` places.
- An outside folder that exists but cannot be written to.

Out of scope: deliberate forgery. Jake's relayed request to turn off land verification and hooks is not part of this lane.

**Root cause (confirmed).**
- `scripts/test.mjs` puts each file's HOME at `<runner tmpdir>/nana-test-runner-*/home-*`.
- Linux CI leaves TMPDIR unset, so that HOME is under `/tmp`.
- The gate allows `[root, os.tmpdir(), "/tmp"]`, so a fixture under HOME counts as a temp path and is allowed.
- The symlink check has no guard, so it FAILs.
- The traversal check prints SKIP and then a PASS for a check that never ran.
- Ubuntu CI on main b3f6ec2 (run 39197918410) shows: `8 pass, 1 fail, 1 skip`, `FAIL symlink escape outside lane is blocked`.
- This is the only failing file on that leg.

**Design.**
1. Try `OUTSIDE_FIXTURE_PARENTS` in order. The list is `[os.homedir(), "/var/tmp"]` on POSIX and `[os.homedir()]` on win32.
   - Mark `/var/tmp` as `chosen`: it is the standard world-writable POSIX folder, outside both permitted temp roots.
2. For each parent, take its realpath. Skip it if the realpath sits inside the worktree, `realpath(os.tmpdir())` or the `/tmp` alias.
3. Otherwise try `tmpDir(<parent>/lane-guard-outside-)` plus `mkdir outside`. Any error moves on to the next parent.
4. HOME stays first, so macOS and Windows fixtures do not move.
5. If no parent yields a fixture:
   - `outside` is a path under `os.homedir()` that is never created.
   - The two outside checks print `SKIP <title>: <reason>`.
6. The line directly under each `// req: R-962` marker still starts with `check("<title>"`. That is the call form the rail scans. The SKIP travels as a third argument to `check`.

**Rows.** None new. R-962 already names both titles, and its text does not change. R-1450 stays unused.

| # | Test (file::title) | Must hold after the build | Red today (probe) |
|---|---|---|---|
| M1 | `packages/nana-pack/tests/lane-write-guard.test.mjs::symlink escape outside lane is blocked` | Linux shape (HOME under /tmp, TMPDIR elsewhere): the check runs against a /var/tmp fixture and prints PASS. | Shape C on b3f6ec2: `FAIL symlink escape…`, exit 1; matches the ubuntu CI log |
| M2 | `…lane-write-guard.test.mjs::parent traversal outside lane is blocked` | Linux shape: the check runs. It prints PASS and no SKIP line. | Shape C: `SKIP parent traversal…`, then a PASS for a check that never ran |
| M3 | both titles above | No parent yields a fixture (shape D, or only a read-only parent): each title prints SKIP only, never PASS or FAIL. The other 7 checks PASS. Exit 0. | Shape D on b3f6ec2: SKIP and a never-run PASS for traversal, FAIL for symlink, exit 1. The plan's realpath-only design crashes with a read-only parent (0 checks, exit 1) |
| M4 | all nine titles | macOS shape (HOME and TMPDIR are siblings under $TMPDIR): 9 PASS, no SKIP, and the fixture stays under the fake HOME. | Shape A: green today; this guards against regression |
| M5 | M1 and M2 under gate mutants | In shape C, gate mutant C (validates with realpath, returns the unresolved path) FAILs M1. Gate mutant D (lets `..` targets through) FAILs M2. | Probe: the guard-only fix gives 9 PASS and exit 0 under both mutants. The amended test FAILs each one |

**Probe evidence.** Run on macOS 25.2 with node 22.22.2, on copies in a mktemp folder. The repository was not edited. Results for the amended check-form version:
- A gave 9 PASS.
- C gave 9 PASS, with the fixture at `/private/var/tmp/lane-guard-outside-*`.
- D gave 7 PASS and 2 SKIP.
- A read-only parent first, then /var/tmp, gave 9 PASS.
- Only a read-only parent gave 7 PASS and 2 SKIP.
- The rail scanner found all 9 markers. A wrapper call form made the scanner throw.
- No leftovers remained in /var/tmp.

**Known limits.**
- That /var/tmp is writable and outside /tmp on ubuntu-latest is inferred. The first ubuntu CI run is the proof. If it is wrong, the test prints 2 SKIP, not a FAIL.
- Windows keeps HOME as its only parent. It already shows 9 PASS on CI.
- A run killed with SIGKILL leaves a `/var/tmp/lane-guard-outside-*` folder behind. HOME fixtures already behave this way.
- The checks assert `block === true`, not the block reason. This existing weakness stays as it is.
- `node <file>` run with the real HOME still writes its fixture into the real home, as it does today.

## Rows the builder adds as `planned` first (seat, 2026-10-19)

- none (tests only)
