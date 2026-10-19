# Independent check — win-gate-tmp at ba0c960 (2026-10-19)

VERDICT: HOLDS

I found no MUST findings. All checks ran in a private copy at <tmp>/win-gate-tmp-check.mvD8mq: `lane` is 297ce13, `base` is b3f6ec2. HOME and TMPDIR were set to temp folders on every run. Platform is macOS with node 22.22.2 and pi 1.0.2.

**Probe 1 – must-meet tests at the tip**
`HOME=$P/home TMPDIR=$P/tmp node tests/lane-write-guard.test.mjs`
- Output: 13 PASS, 0 FAIL, exit 0.
- One line skipped: "a lane file named through another spelling (OS spelling pair): as-given and native spellings are equal strings".
- Verdict: holds. The temp HOME was empty afterwards, so the test left nothing behind.

**Probe 2 – the tip's tests against main's gate (red baseline)**
I copied the tip test file into `base` and ran it the same way.
- Output: FAIL for the temp-folder spelling check, the lane-folder spelling check, and the home, at-sign and file URL check.
- The /tmp check passes on main too, as the plan predicted for macOS.
- Verdict: holds. The three macOS checks are red today and green on the fix.

**Probe 3 – other tests that load the gate, base vs tip**
`node tests/<f>.test.mjs` for gate-corpus, gate-status, gate-survives-mutation, gate-config-robustness, pipe-guard and agent-dir-hostile.
- Base and tip give identical counts: 227, 23, 38, 4, 84 and 28 PASS, 0 FAIL.
- gate-policy-paths and gate-self-protection exit 0 on both.
- At the tip, templates-render 164, requirements-tree 89, requirements-trace 61, requirement-rows 5 and readme-check 11 all PASS.
- Verdict: holds. Nothing main does today regresses in these files.

**Probe 4 – realistic paths, base vs tip**
`node $P/probe.mjs <side>`. The lane folder is `$S/Lane`; `$S/outside` is not under TMPDIR or /tmp.

| Probe | main | tip | Note |
|---|---|---|---|
| middle-segment case variant, e.g. `/VAR/...` | BLOCK | ALLOW | over-block fixed |
| lane root typed `LANE`, target typed `Lane` | BLOCK | ALLOW | over-block fixed |
| `~/x`, `@~/x`, `~` with HOME outside | ALLOW | BLOCK | fail-open fixed |
| `~/x` with HOME = lane | ALLOW | ALLOW | correct |
| `file://localhost/<outside>/x` | ALLOW | BLOCK | fail-open fixed |
| file URL to a `%20` sibling folder | ALLOW | BLOCK | fail-open fixed |
| root `my<NBSP>lane`, target in it (pi writes `my lane`) | ALLOW | BLOCK | fail-open fixed |
| root `my lane`, target `my<NBSP>lane/x` | BLOCK | ALLOW | correct |
| `/tmp/x`, `$TMPDIR/x` | ALLOW | ALLOW | unchanged |
| relative `x.txt` from a symlink spelling of the lane as cwd | ALLOW | ALLOW | unchanged |
| `../outside/x` from that cwd | BLOCK | BLOCK | unchanged |
| dangling `$TMPDIR` symlink to a missing outside file | BLOCK | BLOCK | fails closed |
| `$TMPDIR` symlink to an outside folder | BLOCK | BLOCK | fails closed |
| outside absolute path (control) | BLOCK | BLOCK | unchanged |

Nothing was created in `$S/outside`.
- Verdict: holds. Every change between base and tip moves towards where pi actually writes.

**Probe 5 – Windows forced (`PROBE_PLATFORM=win32`, which overrides `process.platform` before the gate loads)**
- `/tmp/nana-probe/x.txt`: main ALLOW, tip BLOCK.
- `$TMPDIR/x`: ALLOW on both. Outside control: BLOCK.
- Verdict: holds for the Windows temp-root branch only. It ran on the macOS path module, so the 8.3-name, junction and drive-letter behaviour is not tested here.

**Probe 6 – the gate's path resolution vs pi 1.0.2's `resolveToCwd`**
`node $P/parity.mjs` on 13 inputs (`~/x`, `~`, `@~/x`, `@/o/x`, `file:///o/a%20b`, `file://localhost/o/x`, an NBSP path, `@@x`, ` ~/x`, `~user/x`, `/c/x`, `./~/x`, and a file URL with an encoded slash).
- 12 resolve the same in both.
- 1 differs: `file:///w/lane/..%2Fx`. pi throws ERR_INVALID_FILE_URL_PATH, while the gate falls back to the raw text and resolves it inside the lane (ALLOW).
- Verdict: holds. pi throws before any write, so nothing escapes the lane.

**Probe 7 – macOS accented-name spellings (NFC vs NFD) of the lane root**
`node $P/nfd.mjs <side>`
- root NFC with target NFD, and the reverse: main BLOCK/BLOCK, tip ALLOW/ALLOW.
- Verdict: holds. This fixes an over-block that is not in the plan, and it is not a fail-open.

**Probe 8 – macOS firmlink spelling of the lane** (`/System/Volumes/Data/private/var/...`)
- main BLOCK, tip BLOCK.
- Verdict: an over-block that is unchanged from main.

**Probe 9 – stray files outside temp folders**
`ls ~/lane-guard-home-* /tmp/nana-lane-* /nana-lane-guard-missing-*`
- One folder exists: `<home>/lane-guard-home-n3xGF6/TempCase-28797`, timestamped 07:53. That is one minute after the red-tests commit 83a4785 (07:52), during the build.
- My runs did not recreate it.

**Findings (none MUST)**
1. Known bug, low. The README says "`TMP` is never read when it differs from `TEMP`". On win32, `os.tmpdir()` does read TMP when TEMP is unset, so the sentence overstates the gap.
2. Known bug, low, same as main. A firmlink spelling of the lane (`/System/Volumes/Data/...`) is refused, because native realpath does not fold firmlinks.
3. Known bug, housekeeping. A stray folder from the build sits in the real home at `<home>/lane-guard-home-n3xGF6/TempCase-28797`. The shipped test did not reproduce it, so the cause is not established; inferred: an interrupted or one-off run with the real HOME. The test still creates its fixtures under `os.homedir()`, as on main. Under the suite that is a temp folder; run directly it is the real home, cleaned on exit. I am read-only, so I did not delete it; the seat should remove it.
4. Not verified by me: the Windows half of R-1430, the 8.3 and junction pairs of R-1431 and R-1432, and R-1433 on win32. CI run 39248931880 on 297ce13 was in progress when I checked. The Windows install-check had passed; the Windows and Ubuntu suites were still running, and the macOS jobs were queued. I found no CI run for the tests-only commit cb44616 on this branch.