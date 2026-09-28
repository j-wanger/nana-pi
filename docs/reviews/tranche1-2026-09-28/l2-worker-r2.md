# L2 fix round (r2): the floor gaps are closed, the docs now state what the gate does not catch, and regex work is bounded

**Commit:** `cbfd70c` on `lane/l2-gate`, on top of `8e822b6`. Not pushed.

**Floor gaps.** The new corpus rows run under the allow patterns `^rm ^sudo ^doas ^env ^command ^nice ^time ^curl ^diskutil`. Any row that were not floor would be let through by one of them. I ran the new rows against the r1 `gate-shell.ts` first: 23 failed. They all BLOCK now:
- **Same path, different spelling** (allow `^rm`): `rm -rf ~/.`, `/.`, `$HOME/.`, `${HOME}/.`, `"$HOME"/.`, `~//`, `/./`, `//`, `~/./`, `~/x/..`, `~/..`, `/tmp/..`.
- **Wrappers** (allow `^sudo` / `^doas`): `sudo mkfs.ext4 /dev/x`, `sudo dd if=x of=/dev/sda`, `sudo -u root dd …`, `doas mkfs.ext4 /dev/x`, `sudo diskutil eraseDisk …`.
- **diskutil option** (allow `^diskutil`): `diskutil quiet eraseDisk …`.
- **Pipe to an interpreter reading stdin** (allow `^curl`): `curl u | sh -s arg`, `| python3 /dev/stdin`, `| python3 - arg`, `| sudo sh -s x`, `| sudo -u root bash`.
- **Regression pins** (already blocked on r1): `env` / `command` / `nice -n 5` / `time` wrappers, `${HOME}`, `$HOME/`, `C:\\`.
- **Still let through by a matching allow:** `rm -rf build`, `./dist/`, `/tmp/x`, `~/proj/.cache`, `sudo ls`, `curl u | tee f`.
- **Still ALLOW with no config:** `cat x | python3 script.py`, `echo x | sh ./run.sh`, `echo mkfs`.

**Documentation for RULING A** (README Gate bullets, `AGENTS.md`, `nana-gate.ts` header). The README lists what is not caught:
> "a path the shell computes at run time: `cd ~/.pi/agent && printf x > nana-pack.json` (relative after `cd`, also for `trust.json` and `cd .pi`), an escaped name (`nana\-pack.json`), a glob (`nana-*.json`), a directory in a variable, escaped `install -m` / `dd of=` targets, `Set-Location …; sc nana-pack.json`, a directory symlink created and written through in the same command, `cd … | xargs tee nana-pack.json`, a script file, or a Python/Node string built at run time. Matching more command text would not close this … **Mitigation:** such a write never loosens the gate in the session that made it … a cross-session escalation … **What closes it** is the OS sandbox / container layer."

The README also declares project-scope `.claude/**` protection as a ratified expansion (RULING C).

**The regex bounds.** Timings are from one run of a scratch script:
- **Pattern cap:** 200 per list, one `config_invalid` line per list. With 100k patterns per list a call took **68 ms** (sol measured about 1.5 s).
- **Subject cap:** a command over 64 KB gets no exception. Tested at 64 KB (ALLOW) and 64 KB + 1 (BLOCK).
- **Catastrophic regex:** a length cap alone cannot stop it, because `(a+)+$` already hangs on a 49-character input. So I added a third bound that the brief did not ask for. User regexes are matched under a 250 ms `node:vm` watchdog, and a call that runs over is BLOCKed. The catastrophic extra, allow and protected cases each BLOCK in **252–254 ms**.

**`npm test`:** exit 0 · 64 files: 63 PASS, 0 FAIL, 1 SKIP · 2,980 checks pass. No existing assertion changed: the test diff is +50/−0.

**Seat probes:** output is byte-identical to r1 on stdout: 94 BLOCK and the same 16 ALLOW, with every dangerous row BLOCKing. `gate2`: all three compound rows BLOCK.

**Diff this round:** 5 files, +191/−40. `AGENTS.md` 7, README 44, `nana-gate.ts` 73, `gate-shell.ts` 57, corpus test 50. Gate code is +103/−27, including about 10 comment lines, so it stays under the 150-line limit.

**Residuals:**
- **Benign huge commands:** a benign 4 MB command now BLOCKs (1.2 s) because it exceeds the watchdog. 1 MB ALLOWs in 287 ms.
- **10 MB command:** the unbounded built-in analysis still takes about 2.8 s; the bounds don't cover that step.
- **Pipe rule:** a `python3 -W ignore` style option whose value looks like a script path hides a stdin pipe.
- **Unchanged from r1:** the shell-computed policy-file writes listed above, and `grep "rm -rf"` false positives.

**Claim most likely wrong:** that 250 ms is never reached on normal commands. A GC pause or a cold JIT on a slow machine could BLOCK a benign call, fail-closed. I have not measured that on a loaded system.

VERDICT: DONE
