# Independent check — rm-outside-asks at 3d8e2d22 (2026-10-20)

VERDICT: FINDINGS

Setup: I cloned 3d8e2d22 into a private temp copy. Main baseline is a clone of cd2d580e. Probes used HOME=$P/home with journal off, and TMPDIR=$P/tmproot/ as a sibling of HOME. The cwd was the lane worktree, read-only. P=<tmp>/rm-outside-asks-check.SZErFY

Must-meet and neighbouring tests, run one file at a time:
- `node packages/nana-pack/tests/gate-rm-outside.test.mjs` printed 8 PASS and "all PASS". Holds.
- gate-corpus, gate-rm-inside, gate-policy-paths, gate-self-protection and gate-survives-mutation each printed "all PASS". gate-config-robustness and gate-status printed no FAIL lines. Holds.

Probes (`node probe.mjs <tree> <cwd> bash|powershell '<cmd>'`, headless real handler):
1. Command: `rm -f /tmp/pi-review-out.txt`
   - lane: BLOCK "rm outside the working folder: /tmp/pi-review-out.txt"
   - main: ALLOW
   - Verdict: FINDING 1.
2. Command: `rm -f /tmp/r.log; node t.mjs > /tmp/r.log 2>&1; tail /tmp/r.log`
   - lane: BLOCK naming /tmp/r.log
   - main: ALLOW
   - The whole call blocks, including the check run. Verdict: FINDING 1.
3. Commands: `rm -f $P/tmproot/x` (typed through /var) and `rm -f /private$P/tmproot/x`
   - Both ALLOW. The /var and /private/var spellings match. Holds.
4. Commands: `rm "$HOME/x"`, `rm "$HOME"/x`, `rm '/etc/hosts'`, `rm -f "/etc/hosts"`
   - All four BLOCK, each naming its full path. Holds.
5. Command: `rm -f ../nana-pi/x`, cwd = lane worktree
   - BLOCK "…/nana-pi-wt/nana-pi/x". Holds.
   - Interactive (probe2.mjs): one dialog "rm outside the working folder: <worktrees>/nana…". Choosing Allow lets the command run. Holds.
6. Commands with cwd typed through a link ($P/lanelink → lane):
   - `rm -f build/missing/x.o` ALLOW. `rm -f ../lane/x` ALLOW. Holds.
7. Command: `rm -f /tmp/r.log` with user `allowPatterns: ["^rm -f /tmp/"]`
   - ALLOW. The escape hatch works. Holds.
8. Unchanged forms, lane equal to main:
   - `rm -rf ../x` BLOCK "rm recursive/forced"
   - `sudo rm ../x` BLOCK "sudo"
   - `find … -exec rm {} \;` BLOCK "find -exec rm"
   - `ls *.tmp | xargs rm` BLOCK "rm -Recurse/-Force"
   - `git rm ../x` ALLOW
   - Verdict: holds.
9. PowerShell on macOS:
   - `Remove-Item x.log -ErrorAction SilentlyContinue` ALLOW.
   - `Remove-Item -Path ../nana-pi/x, y.txt` BLOCK naming …/nana-pi/x.
   - Verdict: holds.
10. Git lock files:
    - `rm -f "$(git rev-parse --git-dir)/index.lock"` ALLOW.
    - The literal `<repo>/.git/worktrees/rm-outside-asks/index.lock` BLOCK. The design intends this.
11. Command: `git commit -F - <<'EOF' … rm ../stale.txt was wrong … EOF`
    - lane: BLOCK naming <worktrees>/stale.txt
    - main: ALLOW
    - Verdict: FINDING 2. The plan's known limit 6 declares this.
12. Replay of recorded calls (`$P/replay.mjs`): 332 rm-shaped bash calls from ~/.pi/agent/sessions, run through both the main and lane handlers.
    - Settings: real macOS TMPDIR, HOME outside it, each call's recorded cwd.
    - Output: `{"reviewer":{"calls":280,"newBlocks":73,"newOpen":0},"builder":{"calls":47,"newBlocks":0,"newOpen":0},"other":{"calls":5,"newBlocks":0,"newOpen":0}}`
    - The 73 new blocks split into 67 `/tmp/…`, 5 `<private-tmp>/…` and 1 `/config`. The `/tmp` blocks come from 32 reviewer sessions.
    - No call that main blocks is allowed on the lane, so nothing fails open.

Findings:

1. MUST. On macOS, a plain rm under `/tmp` now blocks reviewers. Main runs these today.
   - Cause: the module's temp roots come only from `acceptedTempRoots` (os.tmpdir() plus win32 TMP). On macOS that root is `<tmp>`, so `/tmp` and `<private-tmp>` count as outside.
   - The same file treats `/tmp` as temp for lane writes (nana-gate.ts:233: `...(process.platform === "win32" ? [] : [resolve("/tmp")])`). gate-temp-roots.ts says `/tmp` "is a separate POSIX rule the caller keeps for itself". The rm-outside caller does not keep it.
   - The plan's replay recorded 1 new ask with the temp pass and 73 without it. The build reproduces exactly 73 (probe 12), so on macOS it behaves as the version without the pass.
   - pi-review runs headless, so every such call is a block. In a compound call the rm takes the whole command down, including the check it was running (probe 2).
   - Neither the must-meet tests nor the README covers macOS `/tmp`. The tests point TMPDIR at a fixture, and known limit 7 names only Git Bash.
   - Linux is unaffected when TMPDIR is unset, because os.tmpdir() is `/tmp` there.
   - Fix shape: add the POSIX `/tmp` root (realPath) to the module's tempRoots, as laneWriteHit does. Add a must-meet case `rm -f /tmp/<random>` ALLOW with the real TMPDIR elsewhere.

2. Known bug. A commit message in a heredoc that has a line starting with "rm ../x" blocks headless (probe 11). The plan's limit 6 declares it. Builders commit with `-F "$msg"`, so it is rare.

3. Not probed: win32 path semantics. The module uses the native `path` and has no platform injection, so macOS cannot force the win32 branches. That evidence rests on the Windows CI leg the seat plans to read.

Files:
- <tmp>/rm-outside-asks-check.SZErFY/probe.mjs
- <tmp>/rm-outside-asks-check.SZErFY/probe2.mjs
- <tmp>/rm-outside-asks-check.SZErFY/replay.mjs
- <seat-scratch>/diffs.json (the 73 new-block calls)

No repository, ~/.pi or ~/.claude file was edited.
