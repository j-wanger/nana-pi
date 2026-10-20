# Independent check — lane-guard-temp-root at 350f9ce0 (2026-10-20)

VERDICT: HOLDS

I checked tip 350f9ce0 in a private clone at <tmp> Every probe used a temp HOME on macOS. "main" below means the gate at 72abe19a. ALLOW means the gate permits the write and REFUSE means it blocks it.

Probe 0, the must-meet tests, run the way the suite runner sets things up (HOME and TMPDIR are sibling temp folders):
  cmd: HOME=$P/suite/scratch/home-a TMPDIR=$P/suite/filetmp node --experimental-strip-types packages/nana-pack/tests/lane-write-guard.test.mjs
  out: lane: exit 0, 16 PASS, 2 SKIP (the existing lane-spelling skip, and R-2273, which is Windows only). The lane's test file run against main's gate: FAIL R-2270, FAIL R-2271, PASS R-2272.
  verdict: OK. The new tests are red on main and green on the lane.

Probe 1, the default layout (TMPDIR and HOME are siblings), lane and main:
  cmd: HOME=$P/home TMPDIR=$P/T/ NANA_WORKTREE_ROOT=$P/lanewt node probe.mjs <gate> $P/T/out.txt /tmp/x.txt $P/home/.zshrc $P/lanewt/a.txt
  out: lane and main give the same four results: ALLOW, ALLOW, REFUSE (lane write boundary), ALLOW.
  verdict: OK. The ordinary layout behaves as it does on main.

Probe 2, TMPDIR names home through another spelling (upper case, /PRIVATE/VAR, a trailing slash):
  cmd: TMPDIR=/PRIVATE/VAR/FOLDERS/.../home/ ... probe.mjs <gate> $P/home/.zshrc $P/lanewt/a.txt /tmp/y.txt
  out: lane: REFUSE, ALLOW, ALLOW. main: ALLOW, ALLOW, ALLOW.
  verdict: OK. The hole is closed and the other spelling folds to home.

Probe 3, TMPDIR=/ :
  cmd: TMPDIR=/ ... probe.mjs <gate> /usr/local/nana-probe/x.txt /Users/Shared/nana-probe.txt $P/lanewt/a.txt
  out: lane: REFUSE, REFUSE, ALLOW. main: ALLOW, ALLOW, ALLOW.
  verdict: OK.

Probe 4, TMPDIR is a symlink to a folder above home:
  cmd: TMPDIR=$P/probe/above-link (pointing to $P) ... <gate> $P/home/.ssh/config $P/main/README.md $P/lanewt/a.txt
  out: lane: REFUSE (protected path), REFUSE (lane write boundary), ALLOW. main: REFUSE, ALLOW, ALLOW.
  verdict: OK.

Probe 5, HOME is a symlink and TMPDIR is its real target:
  cmd: HOME=$P/homelink TMPDIR=$P/realhome ... <gate> $P/realhome/.profile $P/lanewt/a.txt
  out: lane: REFUSE, ALLOW. main: ALLOW, ALLOW.
  verdict: OK. Home is resolved before the comparison.

Probe 6, the lane worktree sits inside home (the owner's ~/nana-pi-wt layout) and TMPDIR is home, or above it through a `..` path:
  cmd: HOME=$P/home NANA_WORKTREE_ROOT=$P/home/wt/lane TMPDIR={$P/home | $P/home/wt/lane/../../..} ... <gate> $P/home/wt/lane/src/a.ts $P/home/wt/other/b.ts
  out: lane: ALLOW, REFUSE for both spellings. main: ALLOW, ALLOW for both.
  verdict: OK. Lane files stay writable. A sibling worktree is now closed.

Probe 7, the Windows rule simulated (the module copied with path.win32 and an identity realpath; home C:\Users\Sam):
  cmd: cd $P/w32 && node --experimental-strip-types run.mjs
  out:
  - TEMP default (…\AppData\Local\Temp) is kept.
  - C:\ gives [] and D:\ gives [].
  - The UNC share root \\srv\share\ gives [].
  - c:\users (a case variant above home) gives [].
  - TEMP=home with TMP=D:\Tmp gives ["D:\\Tmp"].
  - TEMP ok with TMP=C:\ keeps only TEMP.
  - TEMP=C:\Windows\Temp with TMP=home gives ["C:\\Windows\\Temp"].
  verdict: OK by simulation only. R-2273 stays honestly untested until the Windows CI leg runs it.

Probe 8, empty HOME:
  cmd: HOME= TMPDIR=$P/T NANA_WORKTREE_ROOT=$P/lanewt node probe.mjs <gate> $P/T/o.txt $P/lanewt/a.txt
  out: lane and main both refuse everything with "user nana-pack.json gate block is malformed".
  verdict: OK. Nothing changed from main, and the gate still fails closed.

Probe 9, HOME inside the real OS temp folder, lane and main:
  cmd: HOME=$P/home TMPDIR=$TMPDIR ... <gate> $T/nana-probe-out.txt /tmp/z.txt $P/lanewt/a.txt
  out: lane: REFUSE, ALLOW, ALLOW. main: ALLOW, ALLOW, ALLOW.
  verdict: Behaviour change, but it fails closed and matches the rule (see finding 1).

Probe 10, the repo checks on the tip:
  cmd: node scripts/code-map.mjs --check; node scripts/readme-check.mjs; node ~/nana-pi/scripts/requirements-moved.mjs --root . --base 72abe19a
  out: code map 0 problems; README 724 claims, 0 problems; R-2270, R-2271 and R-2272 new and implemented; R-2273 new and untested. The clone's git status stayed clean.
  verdict: OK.

Writes outside temp folders: none. After all the runs, no /nana-lane-guard-root-* and no /var/tmp/lane-guard-* folders exist. No test fixtures were left in either temp home.

Findings:

1. Known bug, not a MUST. A HOME that sits inside the OS temp folder now loses temp output.
   - The OS temp folder then contains home, so the gate stops counting it (probe 9). Main allowed those writes.
   - /tmp still works on macOS and Linux. The change fails closed: nothing is lost and nothing opens.
   - The test file is affected the same way. Run on its own with a temp HOME under $TMPDIR, it goes red on two existing checks (R-962 "temporary output remains allowed" and R-1431). Main's copy of the file is green in the same run (exit 0 on main, exit 1 on the lane).
   - The suite stays green, because scripts/test.mjs puts HOME and TMPDIR in sibling folders.
   - The plan knew about the fixture case. Neither its Known limits list nor the pack README names this effect for a real session.
   - Suggested residual: "a HOME inside the OS temp folder turns off OS-temp output on macOS and Windows; run lane-write-guard.test.mjs with HOME outside TMPDIR."

2. Known bug, a maintenance trap with no effect today.
   - lib/gate-temp-roots.ts exports `within(parent, child)`. nana-gate.ts keeps its own `within(target, root)`, with the arguments in the opposite order.
   - nana-gate.ts also re-declares a `resolve` helper that the module already has.
   - The module's header says the rm-outside-asks lane will import `within` later. That lane could pass the arguments in the wrong order and get the opposite answer.

No MUST findings.
