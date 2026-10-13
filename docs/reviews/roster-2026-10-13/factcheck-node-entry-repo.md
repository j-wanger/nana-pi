# Repo fact-check — roster CHANGE.md, Node-entry revision (against main 9974218, feat/process bc84b70)

*Copied into this folder from the seat's scratch folder on 2026-10-13. The scratch evidence and fetched sources it names stayed there.*

Method: read every file:line the revision cites or touches at 9974218 (worktree code = main; only the corpus differs);
diffed the revision against the committed r2 plan (abb5f68); read feat/process's pi-review.mjs and R-1105, and
feat/fresh-install's overlap; read the installed pi 1.0.2 bundle and the scratch install.ps1 and Node docs; checked
each new pair against the test design it names. Nothing in either checkout was edited.

## VERIFIED

- Both launchers start pi only at `pi-watchdog.mjs:107` (`spawn('pi', …)`, no shell, `detached`). pi-review reaches it
  only through `runWatchdog` (:177); its other spawns are git (:59-138). pi-worker's other spawns are git (:47) and
  `process.execPath` for the trust reader (:57). pi-review.mjs needs no edit.
- Stall check today: `cpuSeconds(child.pid)` (:68-82) — `ps -o time= -p` on POSIX, `(Get-Process -Id pid).CPU` on win32,
  one pid, no tree. On POSIX that pid is already node running `cli.js` (npm symlink + `#!/usr/bin/env node`).
  pi 1.0.2's `dist/bundle/cli.js` only `require`s `cli-runtime.js` and never respawns itself, so `execPath + entry`
  makes the watched pid pi on win32 too. `killGroup` `taskkill /T /F` at :89-96.
- The dropped pieces are unneeded. `winCommand` refuses LF, CR, `"`, `%`, `!` and a trailing `\`
  (`win-command.mjs:49-58`). It returns `windowsVerbatimArguments` (the `options` spread) only for the ComSpec route.
  The prompt files and `captureDir` existed only to dodge that refusal. Tree CPU existed only because cmd.exe was the
  child. process's R-1105 (feat/process REQUIREMENTS:421) sends the 911-byte, 3-LF standard as one argument
  (feat/process pi-review.mjs:197), so it needs no reword.
- `findPi` (:45-47): PATH order, then PATHEXT order filtered to the four suffixes; never the cwd. `pi-session.mjs:65`
  holds `PI_PACKAGE`. `fsReal` is at pi-worker.mjs:119. Also verified: :91, :98, worker-config.mjs:11-17,
  windows-triage.md:463-469, review-ledger.test.mjs:128 (scans pi-worker only), R-716 release (pi-review.mjs:181,193),
  R-919, R-1033-1035, R-1039, `pi-registration.test.mjs:319-325` (`npm_execpath`; CI runs `npm test`, and the runner's
  SCRUB keeps it), `scripts/test.mjs:279`, 9 tracked 100755 files, review-round.mjs:223, `install.ps1:1456-1489`,
  Node `child_process.md:920-923`, R-1120-R-1139 unused on main, process and fresh-install.
- Each of the eleven §2 rows has one `shall`. Title counts hold: 29 new = 11 + 5 + 3 + 10, plus 2 refits and 1 rename.
  Pairs 41-46, 49 and 50 red their named title.
- No surviving text describes the cmd.exe route. Each remaining `winCommand`/ComSpec mention is one of these:
  - the rejected option (§1)
  - an out-of-scope note (§4)
  - a wrong-code pair (43)
  - an acceptance negative (§5)
  - r1 history marked superseded (:350)

## WRONG

1. §3:125 "break the six test files that stub `pi` as a `#!/bin/sh` script". Only four start pi through the watchdog:
   worker-lane, immutable-review, review-ledger and handoff-writer-role. notify-fallback stubs the OS notifier (:111-117).
   pi-install tests `findPiRoot`, not a launcher. Say four.
2. :11 and :96 "`research-node-entry.md` (this folder)". The file is not in `docs/reviews/roster-2026-10-13/`; it sits
   only in the seat's scratch folder. Copy it into the corpus before the plan round, or sol cannot read the evidence.
3. :104 "`exists` = findPi's lstat check". `defaultExists` is module-private (`win-command.mjs:18-20`, not exported).
   The plan also freezes that file (empty merge-base diff, :274). So piLaunch needs its own check.
   - "the same … containment check … pi's own" (:106) diverges: pi uses `fs.statSync(cliPath).isFile()` (install.ps1:1480).
     lstat-not-directory accepts a dangling symlink or a symlink to a directory as the entry.
   - Fix: say "its own `statSync(…).isFile()`, as pi does". Let findPi keep its default `exists`.
4. §5:234-236 tests-first reds. The Windows fixture imports `PI_PACKAGE` by name (:215), and the forced titles build
   paths from it. Before the code commit `worker-config.mjs` has no such export. A named import is an ESM link
   error: the whole file dies, with no per-title FAIL. A namespace import gives a package with no name, so
   `npm pack` fails. Then the six Windows titles red on the `findPi` precondition, not on one of the four named causes.
   - Fix: commit the three sealed constants with the test, or name "fixture precondition" as a cause.
5. :238 "must red exactly the named titles" fails for two pairs:
   - Pair 40 (win32 returns `pi` by name) also reds the `.exe` and refusal titles.
   - K7 also reds every other POSIX launcher title (immutable-review, handoff-writer-role, the review-ledger
     pi-review titles).
   - Fix: list them, or say "at least".

## GAP

6. Pairs 47 and 48 can stay green. If the wrong-`name` fixture or the `..\..\..\evil.js` fixture lacks an otherwise
   valid entry, dropping the name or containment check still ends in the entry-file refusal. `C:\npm\evil.js` would
   have to exist in the injected files. Fix: make each refusal fixture valid except for its one defect, or assert
   each reason text.
7. A refusal counts as a failed attempt.
   - runWatchdog retries it (:194): pi-review's default 3 attempts print the refusal three times.
   - Both launchers write it to `--out` (pi-worker.mjs:140, pi-review.mjs:193).
   - Both end "FAILED after N attempt(s) (endpoint likely in a bad stretch)" (pi-worker.mjs:145, pi-review.mjs:195).
   - Today's ENOENT behaves the same, so this is no regression. Fix: stop on a refusal, or declare it.
8. pi-watchdog's six-tag header (:2-14) still says it spawns `pi` and reads only ps/PowerShell. piLaunch adds
   package.json reads, PATH lookup and a refusal. The plan updates the worker-config and pi-worker headers only. Name
   the watchdog's @inputs, @effects and @errors. A fifth-file `piLaunch` module would keep one purpose per module.
9. Case sensitivity has two gaps:
   - `findPi` returns its own lowercase candidate (`win-command.mjs:37-40`), never the on-disk `PI.EXE`. The `.exe`
     title's "→ that path" (:211) must compare against findPi's return, or a correct build fails.
   - The `node_modules\.bin` test needs case folding.
10. `review-ledger run -- pi …` (R-729; review-ledger.mjs:88 `spawn(child[0])`, no shell) still gets ENOENT on Windows.
    R-1125 and the pack README's Windows paragraph should say it is not covered.
11. §4's expected conflicts list only feat/process. feat/fresh-install (454a801) also moves R-291's literal to 1,092
    (requirements-tree.test.mjs:38/52/53) and edits the nana-setup README, so the 1,100 → 1,109 sum assumes one order.
12. Amendment item 8 (:367) drops "residual 12's character limits". Residual 16 (:328-329) still carries the 32,767
    limit and the `-p "@<path>"` advice. Reword one of them.
