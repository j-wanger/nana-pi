# Independent check — pi-launch-followups at 86240f7f (2026-10-20)

VERDICT: HOLDS

I checked tip 86240f7f in a private clone, with a temp HOME and TMPDIR for every run. Platform: macOS, Node 22.22.2. I did not run anything on Linux, so the Linux path is unverified by me.

Must-meet file: `node packages/nana-setup/tests/pi-launch-limits.test.mjs`
- Output: 13 PASS and 0 FAIL in 41.9 s. R-2130, R-2131, R-2132 and R-2133 all print PASS.
- Afterwards the checkout is clean and no fixture folders or processes are left behind.
- Verdict: OK.

Neighbouring files: `node packages/nana-setup/tests/pi-registration.test.mjs` and `node packages/nana-setup/tests/doctor-runtime.test.mjs`
- Output: pi-registration 70/0, exit 0. doctor-runtime 21/0, exit 0.
- Verdict: OK, no regression found.

`npm run -s map:check`
- Output: "340 modules ... 0 problem(s)", exit 0.
- Verdict: OK.

Probe 1: where the relay runs. I called `boundedSpawnSync("/bin/sh", ["-c", "ps -o pid=,ppid=,pgid= -p $$,$PPID"])`, then the same call with python reading the session ids.
- Install was pid 37281 in group 37231. The relay was pid 37301, its parent 37281, in its own group 37301.
- The python run showed the relay leads its own session (relay sid 42050 = relay pid 42050), and pi is in a separate session (sid 42093).
- Real `pi --version` through the relay returned 0 "1.0.2" with no error and wrote nothing to the temp HOME.
- Verdict: OK. The relay is detached on POSIX, and a normal pi launch still works.

Probe 2: the real CLI, killed while a fake pi hangs on `--version` and ignores SIGINT. I ran `node killprobe.mjs <mode> <cli args>`. The process list includes the relay and pi's child.

| Command killed | Kill | Everything dead after | Still alive |
|---|---|---|---|
| doctor | SIGKILL to its group | 1215 ms | none |
| install --dry-run | SIGKILL to its group | 1042 ms | none |
| install --dry-run | SIGKILL to install alone | 1031 ms | none |

- Verdict: OK. Doctor and the dry run get the new cleanup too; the plan only inferred this.

Probe 3: pi's cleanup grace on the new path. The fake pi takes a lock, and on SIGINT waits before it removes the lock.

| Signal | Cleanup delay | Everything dead after | Lock left |
|---|---|---|---|
| SIGINT to doctor's group (Ctrl-C) | 900 ms | 1124 ms | no, pi cleaned up |
| SIGTERM to install --dry-run alone | 900 ms | 930 ms | no, pi cleaned up |
| SIGINT to doctor's group | 1500 ms | 1213 ms | yes, cut at the 1 s grace, as on main |

- Verdict: OK. pi still gets its full 1 s grace after the parent check.

Probe 4: large output, main against the lane. Script `p3.mjs` runs `boundedSpawnSync` on a child that writes a given amount to each stream.

| Output per stream | main | lane |
|---|---|---|
| 2 MiB ASCII, exit 1 | ENOBUFS | status 1, last error line "boom" |
| 1 MiB less 1 KiB of control characters, exit 0 | ENOBUFS | status 0, "boom" |
| 3 MiB of control characters (about 36 MiB once escaped) | ENOBUFS | ENOBUFS (the documented limit) |

- Status is 0 in every ENOBUFS case, on main and the lane alike.
- A 9 MiB-per-stream run returned a short stdout. The cause is the fixture: it calls `process.exit()` before its own stdout flushes. A plain `spawnSync` of the same script loses output the same way, so this is not the relay.
- Verdict: OK. pi's own result is reported again up to the 16 MiB relay cap.

Probe 5: win32 forced in both install and the relay (`NODE_OPTIONS=--import win32.mjs`, which sets `process.platform` to "win32"). Script `p5.mjs`, then SIGKILL of install alone.
- main: the relay is in install's group; 1.5 s later the relay and sh are still alive.
- lane: exactly the same.
- Verdict: OK. Windows is unchanged: not detached, and the parent check is off, as the plan says.

Probe 6: normal, deadline and missing-pi launches through `boundedSpawnSync`.
- A 3 s launch returned 0, "done" and "warn" with no error in 3041 ms, so the 200 ms parent check never fired early.
- A launch past its 1.5 s limit returned null, SIGKILL, ETIMEDOUT in 1538 ms.
- A missing pi returned null, ENOENT.
- Verdict: OK.

Probe 7: other callers and signal listeners. `grep -rln boundedSpawnSync` plus a grep for `process.on("SIG` in nana-setup.
- Only nana-setup's own steps and doctor call the relay.
- nana-setup registers no signal listener, so Ctrl-C still kills install and the parent check takes over.
- The one readline prompt, in `trust`, is closed before any pi launch.
- Verdict: OK. No in-process caller would leave pi running past Ctrl-C.

Findings: none at MUST. I found no lost data, no writes outside the temp folders, no broken install or hook, and nothing main does today that stops working.

Known bugs, all already listed as known limits in the plan; none is new:
- Output above 16 MiB once escaped still reads ENOBUFS with status 0.
- Ctrl-Z stops only install; the relay and pi keep running until the limit.
- A second Ctrl-C no longer cuts pi's grace short.

Files:
- Plan: <worktrees>/pi-launch-followups/docs/reviews/pi-launch-followups-2026-10-20/must-meet.md
- Probe scripts: <tmp>/pi-launch-followups-check.UcUUjA/{killprobe.mjs,p1.mjs,p3.mjs,p5.mjs,win32.mjs}
