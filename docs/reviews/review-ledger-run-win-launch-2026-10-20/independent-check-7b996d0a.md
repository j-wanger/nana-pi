# Independent check — review-ledger-run-win-launch at 6ec2cf0e (2026-10-20)

VERDICT: HOLDS

Setup: a private clone at 6ec2cf0e in `$P=<tmp>`. Every probe used a temp HOME and a fresh one-commit tree at `$P/tree`. `run.sh` is `HOME=$P/home-<n> node lane/packages/nana-pack/bin/review-ledger.mjs run --item <n> --tree $P/tree --out <out> -- <cmd>`.

Must-meet tests, single files on macOS:
- `node packages/nana-pack/tests/review-launch.test.mjs`: R-2250 to R-2253 PASS. R-2254 SKIPs on macOS (Windows leg only). Ends "all passed".
- `node packages/nana-pack/tests/review-ledger.test.mjs`: exit 0, 165 PASS, 0 FAIL. R-1721 "run -- pi starts pi and records its round" passes.
- `node packages/nana-pack/tests/win32-launch.test.mjs`: 5 PASS and 8 Windows SKIPs, R-1723 among them. Ends "all passed".
- `map:check` reports 0 problems. `readme:check` reports 722 claims and 0 problems. `requirements-trace` exits 0 with 0 rows off form. `requirements-moved` lists R-2250 to R-2253 as new (implemented) and R-2254 as new (untested).

Probes:
- P1 `run.sh … -- ./notes.md` (a file without the execute bit): "review-ledger: cannot start ./notes.md: EACCES", exit=1. --out holds the same line, with 0 reservations and 0 rounds. PASS.
- P2 `run.sh … -- /tmp` (a directory): "cannot start /tmp: EACCES", exit=1, line in --out, 0 reservations and 0 rounds. PASS.
- P3 `run.sh … -- $P/badshebang.sh` (`#!/nonexistent/interp`): "cannot start …/badshebang.sh: ENOENT", exit=1, 0 reservations and 0 rounds. PASS.
- P4 `run.sh … -- false` (starts, then exits 1): "no verdict (exit 1; 0 chars) — reservation returned, no round consumed". It does not say "cannot start", so a started command is still not misreported. PASS.
- P5 `run.sh … -- pi -p x` with the normal PATH: pi started and printed "No API key found…", then "no verdict (exit 1…)". The pi launch on main still works. PASS.
- P5b `PATH=/usr/bin:/bin node …review-ledger.mjs run … -- pi -p x`: "cannot start pi: ENOENT", the same line in --out, 0 reservations. On main this printed only "no verdict (exit ENOENT)". PASS.
- P6 `-- nana-absent-reviewer-xyz`, then the same item with `-- node $P/rev.mjs < brief.md`. The brief has a quote, `%PATH%` and `!x!`. Run 1: "cannot start …: ENOENT", 0 rounds. Run 2: "admitted as round 1/3", then "verdict recorded … (round 1)", exit=0. The reviewer received all 31 brief bytes unchanged. The failed start used no round. PASS.
- P7 `--out $P/tree/seed` (a tracked file) with a missing command: admission refused with "is a TRACKED file in the reviewed tree". `seed` shasum was 27a3608b both before and after, git status was clean, and no reservation was left. The new --out write comes after admission's tracked check. PASS.
- P8 `--out $P/nodir/x/out.md` (missing folder) with a missing command: "cannot start …: ENOENT", exit=1. Nothing crashed and no stack trace printed. The best-effort write was skipped. 0 reservations. PASS.
- W1-W13: `node $P/win.mjs` ran reviewLaunch with an injected win32 setup. The setup used an npm folder `C:\Users\Sam Rivera\AppData\Roaming\npm`, the env keys `Path` and `ComSpec`, the real Windows PATHEXT and a quoted PATH entry.
  - W1 `claude -p --model opus` and W13 `codex exec …`: both resolve to the `.cmd` shim and start through `C:\WINDOWS\system32\cmd.exe /d /v:off /s /c ""…claude.cmd" "-p" …"` with windowsVerbatimArguments. PASS.
  - W3, an argument with `& ( ) ^ < > |`: quoted and accepted. PASS.
  - W4 `node`: starts `C:\Program Files\nodejs\node.exe` directly; the quoted PATH entry is stripped. PASS.
  - W5 `Claude.CMD` and W7 the full `.cmd` path: both start through ComSpec. W10 `npx …`: starts npx.cmd through ComSpec. PASS.
  - W6 `Pi … "multi\nline \"q\" %P%"`: node.exe plus the npm cli.js, with the argument byte-identical. PASS.
  - W2, a line feed in an argument: refused with `refused character "\n" (line feed)`. W8, an argument `C:\repo\`: refused with `refused trailing backslash`. Both reasons are named. PASS.
  - W11 `""`: refused with "not on PATH". W12 `claude.ps1`: refused with "unsupported extension .ps1". No input threw. PASS.
  - W9 `review` with `C:\Tools\review.js` earlier on PATH and `D:\later\review.exe` later: refused with "unsupported extension .js". This is the first finding below.
- P10, the README's Windows example run from the reviewed repo: `node …review-ledger.mjs run --item p10 --out out.md -- node rev.mjs < brief.md`. It printed "WARNING: --out …/tree/out.md is inside the reviewed tree", then "verdict recorded (round 1)". git status then showed `?? out.md`. This is the second finding below.
- I also tried a low open-file limit (`ulimit -n 22/26/30`) to force EMFILE. Node started normally ("no verdict (exit 0; 2 chars)"), so that path was not tested.

Findings:
1. Known bug, low (the R-2253 trade). On win32, a bare name can now be refused even though main would start it. This happens when an earlier PATH folder holds the same name with a PATHEXT extension other than .com, .exe, .bat or .cmd, such as .js, .vbs or .py. Main's libuv search tried only .com and .exe and found the later .exe. The row allows this, but the plan's Known limits leave it out; they name only the case where a .cmd beats a .exe.
2. Known bug, low (docs). The README's new Windows example uses `--out out.md` with a relative path. Run from the reviewed repo, it writes the review into the reviewed tree and admission warns (P10). The bash example above it writes to `$scratch`. No data is lost, and the verdict is still recorded.
3. Unverified, not a finding: R-2254 is the Windows proof that cmd.exe passes the arguments and stdin through. It cannot run on macOS. R-1722 and R-1723 are also Windows-only. CI run 39417461129 on 6ec2cf0e has both install-check jobs (Windows, macOS) green. All three suite legs (Windows, Ubuntu, macOS) were still in progress when I finished. R-2254 is honestly marked untested until the Windows leg passes.
4. Inferred, not probed: a reviewer installed only as a Windows Store app alias may now go unfound. findOnPath checks files with lstat, which may fail on those links. Main's spawn by name did not depend on that check. findPi already works this way for pi.

No harm found. Nothing wrote outside the temp folders: both child runs in the test set their own HOME. Nothing fails open: a round is still recorded only on exit 0 with review-shaped output. Main's pi launch on macOS and its node reviewer runs still work.
