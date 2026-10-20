# Independent check — win-pi-launch-orphan at c0856720 (2026-10-20)

VERDICT: HOLDS

Private copy: <tmp> (lane at c0856720, main baseline at 72abe19a). Every probe used a temp HOME.

Must-meet and regression files (macOS):
- `node packages/nana-setup/tests/pi-launch-limits.test.mjs` printed 15 PASS and 0 FAIL, exit 0. `PASS R-2301 …`, `PASS R-2302 …`, and R-2020…R-2133 pass. R-2300 and R-2303 SKIP with "Windows kill-on-close job behavior only". They are rightly marked `untested`. Verdict: OK.
- pi-registration printed 72 PASS and 0 FAIL. doctor-runtime printed 21/0. win-command printed 47/0. win32-degrade printed 88/0. worker-lane (piLaunch R-1125) exited 0. Verdict: OK.

Probe 1. Forced win32 fallback, same injected fs, run on main and on the lane (`node probe.mjs <root> exe,order,escape,badjson,pctnopkg`).
- Output: the call lists match except for the checkout path. `pi.exe` → `C:\tools\pi.exe :: --version vb=null`. PATH order "A\pi.cmd with no package, B\pi.cmd with npm package" → `cmd.exe :: /d | /v:off | /s | /c | ""C:\A\pi.cmd" "--version""` on both. A bin that escapes the package goes to the ComSpec route, and so does invalid package.json. A `%` path with no package gives `problem: pi launch refused: refused character "%"` and doctor `fail: …`.
- Verdict: OK. The fallback does what main does, and R-1035 still refuses.

Probe 2. Forced win32 direct route (`node probe.mjs $P/lane binstr,bat,local,pctnpm`).
- Output: bin as a string → `NODE :: C:\npm\node_modules\@earendil-works\pi-coding-agent\dist\bundle\cli.js | --version vb=null`. The `node_modules\.bin` layout → `NODE :: C:\proj\node_modules\@earendil-works\pi-coding-agent\cli.js | install | …`. A `C:\a%b!c` path → `NODE :: C:\a%b!c\node_modules\…\cli.js`, with install `created` and doctor `ok: 1.0.2`. Main refuses that last case.
- Verdict: OK.

Probe 3. Package entry is a directory (`node probe.mjs $P/lane entrydir`).
- Output: `cmd.exe :: /d | /v:off | /s | /c | ""C:\npm\pi.cmd" "--version""`.
- Verdict: OK. It falls back and does not launch a directory.

Probe 4. Real macOS run with real pi 1.0.2, on main and on the lane: `HOME=$H node packages/nana-setup/bin/nana-setup.mjs install --dry-run`, then `doctor`.
- Output on both: `+ pi packages created would add per-package entries for …` with exit 0, then `✓ pi executable 1.0.2`. The temp HOME was empty afterwards.
- Verdict: OK. macOS behaves as before, and the dry run wrote nothing.

Probe 5. Real macOS `install`, then `doctor`, then `install` again on the lane.
- Output: `install exit=0`, `+ pi packages created added per-package entries: …/nana-pack, …/nana-knowledge`. Doctor printed `✓ pi packages all extension directories registered`. The second install printed `nothing to do — everything was already in place (1 skipped)`.
- Verdict: OK.

Probe 6. A direct-route-shaped launch through the real relay: `boundedSpawnSync(execPath, ['<dir "a %b !c dir">/cli.js','install','x "q" %PATH% !y! tail\\'], {env: PI_CODING_AGENT_DIR:'/tmp/agent %x%'})`.
- Output: `relay 0 {"argv":["install","x \"q\" %PATH% !y! tail\\"],"agent":"/tmp/agent %x%"}`. The off-win32 `piInvocation` gave `{"command":"pi",…,"options":{}}`.
- Verdict: OK. Arguments and environment arrive unchanged.

Probe 7. Lane checks.
- `scripts/code-map.mjs --check` printed `0 problem(s)`. `scripts/readme-check.mjs` printed `724 claims checked; 0 problem(s)`. `requirements-moved --base 72abe19a` printed FEAT-013 with R-1034, R-1035 and R-1690 text changed, R-2300 and R-2303 new (untested), and R-2301 and R-2302 new (implemented).
- Verdict: OK.

Probe 8. Writes outside the temp folders.
- Output: `stat` shows ~/.pi/agent/settings.json at Oct 4 and ~/.claude/settings.json at Oct 17. The worktree HEAD is still c0856720. Its one untracked file, seat-mutate.mjs, belongs to the seat. The new tests use `tmpDir(os.tmpdir())` and an injected spawn only.
- Verdict: OK.

Probe 9. Windows-only test fixtures (read only).
- Output: the npm-generated pi.cmd integration test installs a package named `fake-pi-for-nana`, so it still takes the ComSpec route its guard expects. No other win32 pi test uses the real fs lookup.
- Verdict: OK. No new red is expected on the Windows leg.

Findings (none are MUST):
1. Known bug, inferred and not run. On Windows, killing install, or pressing Ctrl-C, now ends an npm pi through the job close with no grace. pi writes settings.json with a plain `writeFileSync` (pi 1.0.2 settings-manager.js:146), not atomically. A kill that lands during that write could truncate ~/.pi/agent/settings.json. The window is very short. POSIX main has the same exposure after its 1 s grace. The README Known limits names the cut-short cleanup and the lock but not the truncation.
2. Known bug, wording. `piLaunch` also sends a `.bat` pi with the npm package beside it to the Node entry (probe 2). R-2301 says `.cmd` and R-1690 says `.cmd`. npm never writes pi.bat, so no user is affected.
3. Known bug, diagnostics. When the direct route is refused and the ComSpec route then refuses too, the user sees only the ComSpec reason, for example `refused character "%"`. The reason the npm route was not taken is lost, for example an invalid package.json. main gives the same message.
4. Known bug, status honesty. The README Idempotence paragraph says "On Windows, an npm pi also ends when install is killed" as a fact. R-2300 is `untested`, and the seat's Windows evidence comes from the probe script's equivalent route (BRANCH 1), not from the lane's code. Known Limits does say R-2300 and R-2303 stay untested.

Not checkable here: R-2300 and R-2303 on real Windows, and the Windows install-check job with real npm pi 1.0.2. Both stay with the seat's Windows CI check before land.
