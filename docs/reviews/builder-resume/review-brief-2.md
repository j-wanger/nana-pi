Feature: FEAT-006 · Launch builders with execution limits

# Review brief 2: builder-resume (confirmation round)

Review only `git diff 0d15e9c6..38ff3955` on feat/builder-resume. Round 1 sent the lane back.

Round 1's MUST 1 was confirmed by CI on 0d15e9c6 (run 42784506773): on `windows-selected`, `lane-checks.test.mjs` passed 1 and failed 6 cases, because a detached `cmd.exe` lost the check output.

Build 3 fixed the class: build 1 had replaced the shared bounded-spawn relay with its own async spawner, which dropped the relay's Windows launch shape, its parent-death watch and its backstop. Build 3:
- adds an async entry `boundedSpawn` beside `boundedSpawnSync` in `packages/nana-setup/lib/bounded-spawn.mjs`, sharing the specification and result decoding;
- lets the relay child take a stop over IPC and route it to its existing termination handler (`bounded-spawn-child.mjs`), so a stop on Windows is catchable;
- deletes `runChild` from `lane-checks.mjs`; checks and git calls go through the relay; the base `git worktree add` finishes before stopped cleanup (SHOULD 2);
- lists resume changes with `--no-renames` (NOTE 5);
- adds four lane-check cases. R-3997, R-4004 and R-4006 updated.

Seat re-ran on 38ff3955: the macOS install check passes; `lane-checks` (11 cases) and `pi-launch-limits` (24 pass, 2 skip) pass alone.

Questions:
- Are MUST 1 and SHOULDs 2, 3 and 4 closed, on Windows as well as POSIX?
- Does the relay change alter any existing synchronous caller (install, pi launch limits), for example by keeping a relay alive on an IPC channel it never gets?
- Can the async entry leave a relay or its tree running after pi-worker ends, on a stop or a hard kill?

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.

Put exactly one verdict line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, as the last line, and no other line starting with "Verdict".
