# win-pi-launch-orphan — plan attack (one adversary)

Verdict: AMEND

AMEND. The design holds up and the class is right. I amended five things: wider tests, narrower rows, a corrected wait, an added seat check, and a corrected explanation.

What I checked:
1. libuv's Windows process code (src/win/process.c on v1.x). Every non-detached uv_spawn child goes into a kill-on-close job, and spawnSync's relay is one of those children. The job allows silent breakaway. The plan missed one detail: libuv also adds the spawning process to its own job (`AssignProcessToJobObject(job, GetCurrentProcess())`). So the relay's job nests inside install's job. Today a kill of install ends the relay and cmd.exe together. Only the pi that cmd.exe started escapes, because cmd.exe is not a Node process. Under design (a), pi and pi's Node children sit in jobs nested under install's job, so they end at once. HANDOFF's residual says "pi keeps running until its limit, then the relay ends it". That is very likely wrong: the relay dies with install, so a hung pi runs with no limit. The seat should reword that line at land.
2. R-2301 is red today. I ran a probe in a temp folder with an injected npm layout. Install's three launches, the dry run's one and doctor's one all went to cmd.exe with `/d /v:off /s /c` and the verbatim flag.
3. A new red case. With an npm pi and a checkout path holding `%` and `!`, today's install reads "pi install refused: refused character %". After design (a), that path launches. Nothing in the plan pinned this. I added it to R-2301's test, with wrong code 7.
4. piLaunch with injected win32 fixtures behaves as the plan assumes. Without its package it refuses, and with another package it refuses. With the default reader and a `C:\` path on this Mac, it refuses, so the fallback runs. The existing R-1034, R-1035 and R-1690 tests stay on ComSpec. That includes the Windows npm-installed fake, whose package name is not PI_PACKAGE.
5. The in-flight lane review-ledger-run-win-launch has landed. Main at 72abe19a holds bin/review-launch.mjs, which imports piLaunch from bin/pi-watchdog.mjs. So waitFor is none. A package-layer import from nana-setup/lib into nana-pack/bin is allowed; state-manifest.mjs already imports review-round.mjs.
6. The CI install-check job runs on windows-latest with npm pi 1.0.2 and a home shaped like the real one. That will be the first real run of the direct route. nana-land reads no CI result, so I added a seat check on that job.
7. The probe script has no `spawn("pi"` literal (0 hits), and its BRANCH logic matches the brief.

Amendments:
- Rows R-2301 and R-2302 are narrowed from ".cmd or .bat" to ".cmd". Every test uses pi.cmd, and npm writes only .cmd.
- R-2300 now refers to R-2301 instead of "an npm-installed pi".
- R-2302's test gains a third case: the pi package is present but its entry is missing. Wrong code 8, a fallback that skips the entry refusal, must turn it red.
- The npm fixture's pi.cmd runs process.execPath, as the existing fixtures do, not a bare `node`.
- The scratchpad files must-meet.md and build-brief.md have generic names that other planners in this session can overwrite. The seat should use the text here.

Subtraction test: I considered three alternatives.
- A detached relay with a win32 parent check would cover every layout. But it would break console Ctrl-C delivery to pi and leave the relay-kill case open.
- Moving piLaunch into lib would break review-launch's import.
- Putting the helper inside steps.mjs would avoid a new module but grows a file three slate lanes also edit.
Design (a) remains the simplest fix.

Claim most likely wrong: the Ctrl-C side effect. Under design (a), install's default Ctrl-C exit takes pi down through the job before pi's own handler releases its lock. That handler is signal-exit plus proper-lockfile, whose stale time defaults to 10 s. Nobody has run this. pi holds that lock only around a settings write, so the harm is probably small.

Probes: one temp folder, now removed. They used recorder spawns only, started no processes and left none running.
