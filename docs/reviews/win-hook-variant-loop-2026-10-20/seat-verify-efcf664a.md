# Seat checks — win-hook-variant-loop builds 1 to 4, tip efcf664a (2026-10-20)

- Builds, by a pi gpt-5.6-sol builder through pi-worker (the roster's larger-lane builder; four builds); the lane
  branched from main 9552afb1, with the plan at 127e531c (`must-meet.md`; `plan-attack.md`: one adversary, AMEND;
  `build-brief-1.md` with the seat's amendments at its end). `plan-attack.md` still names a Claude Sonnet builder;
  `build-brief-1.md`'s last seat section moved the build to pi sol.
  - Build 1 is 32cdb9ee. In `packages/nana-setup/lib/hook-health.mjs`'s win32 branch only, when a settings row is
    unhealthy and `validateShape(settings)` returns null, doctor runs install's own merge for that one row on
    `structuredClone(settings)`: `mergeRepoHooks` with wanted `[w]`, then `mergeHooks([w])` when nothing was found. The
    targets `hookTargets` still reads on the copy that do not resolve inside the checkout, de-duplicated, are the
    entries install leaves; when there are any, the row keeps today's detail and appends a hand repair. The module
    header's `@outputs` and `@errors` change with it. Rows R-2410 to R-2412 sit in FEAT-015 directly after R-1055, and
    `win32-hook-repair.test.mjs` gains three checks (eleven to fourteen; its header and the code map now say fourteen).
    The setup README gains one Known limits bullet after the withPiStub bullet and extends the win32-hook-repair line in
    its tests table.
  - 6107e8c5 adds the seat's pairs on 32cdb9ee; 0a69409a is build brief 2.
  - Build 2 is a20a37ce. It fixes the independent check's F1 to F4: a try/catch around the merge simulation keeps the
    base row and detail when the merge throws (F1); the advice leads with `remove that entry by hand, then run
    nana-setup install` and prints every path with forward slashes (F2); the edit route gives the whole command install
    writes, `[w.entry.command, ...w.entry.args]`, so the knowledge hook keeps its `hook` argument (F3); the README bullet
    names the two exceptions doctor does not name (F4). R-2410's and R-2412's row texts change with it. R-2410's check
    now also needs the safe route before the edit route, the install command, and no backslash; R-2412's check adds a
    settings file nested 3,000 levels deep.
  - da321c9f adds the seat's pairs on a20a37ce; 7c099c00 is build brief 3.
  - Build 3 is 27b06dec, test only: the deep fixture is written as text built without recursion (`seedDeepSettings`),
    because `JSON.stringify` overflowed the stack on the Windows runner.
  - 5173ee52 adds the seat's pairs on 27b06dec; 0b508344 is build brief 4.
  - Build 4 is 52dd276b, test only: R-2410's no-backslash condition reads only the advice from `install leaves` on,
    not the row's older first half, which names the checkout with backslashes on Windows.
  - eb6910ed merges main 7aadbc99 (pushed before CI); efcf664a adds the seat's pairs on eb6910ed. The review base is
    7aadbc99.
  - `git diff 7aadbc99..HEAD --stat` touches only hook-health.mjs, the test file, the setup README, REQUIREMENTS.md,
    the generated map and tree, and this folder. settings.mjs, doctor.mjs, `bin/nana-setup.mjs` and the POSIX branch
    do not change.
- CI run 39508216671 on draft pull request #146 at eb6910ed (build 4 plus a merge of main 7aadbc99; GitHub's merge
  commit 16fdb055 merges eb6910ed into 7aadbc99, its own parent, so the tree tested is eb6910ed's; efcf664a adds only
  the seat's pairs record) reads 0 failing on all three legs:
  - macOS 196 PASS, 0 FAIL, 2 SKIP of 198 files (8,044 checks pass, 36 skip).
  - Ubuntu 195 PASS, 0 FAIL, 3 SKIP of 198 files (7,983 checks pass, 56 skip).
  - Windows `198 files: 180 PASS, 0 FAIL, 18 SKIP, 0 WARN · checks: 6973 pass, 0 fail, 114 skip`
    (`ci-windows-eb6910ed.log`); the 18 skipped files are main's declared set. win32-hook-repair `14 pass`, with the
    lane's three checks by title:
    ```
    PASS win32 doctor: after install, a ✗ settings row names each dead entry install leaves and its hand repair
    PASS win32 doctor: a ✗ settings row never names an entry install repairs as a hand repair
    PASS win32 doctor: a settings shape install refuses still prints all six settings rows as ✗
    ```
    install-check.test `129 pass` there.
  - The install check passes on macOS and Windows.
  - The adversary's claim most likely wrong, that install's merge run on a copy predicts which entries install leaves
    on win32, held on the native Windows leg for the fixtures R-2410 and R-2411 use.
  - Earlier runs failed in the test, not the product. Build 1's run was cancelled as superseded. Run 39499732915 at
    da321c9f (build 2): Windows 175 PASS, 1 FAIL; win32-hook-repair's deep-nesting fixture overflowed `JSON.stringify`
    in the test's `seed()` before R-2412 ran (fixed by build 3, 27b06dec). Run 39503767589 at 5173ee52 (build 3):
    Windows 176 PASS, 1 FAIL; R-2410's check banned a backslash anywhere in the row, while the row's older first half
    names the checkout as `D:\a\nana-pi\nana-pi` (fixed by build 4, 52dd276b). The advice that run printed used
    forward slashes. macOS and Ubuntu read 0 failing on both runs.
  - Main's own known failures: Ubuntu's path-spelling GP1 and GP2 until linux-path-spelling landed (main ca27d86); a
    pull-request run's R-291 leaf-total failure, a merge artifact of GitHub's merge commit. Windows main reads 0 FAIL
    since 4be0b79 (desk files are declared skips). None showed.
- The seat's wrong-code pairs on macOS (`seat-mutate.mjs`, the shared mutation runner, Node 22.22.2). Every pair runs
  on macOS, because the test file's own `run()` forces `NANA_SETUP_PLATFORM=win32` on each install and doctor it
  spawns. Every baseline reads win32-hook-repair 14 PASS, 0 FAIL.
  - On 32cdb9ee (one shard, merge base 9552afb1; `seat-mutate-output-32cdb9ee.txt`, commit 6107e8c5): 10 of 10 red,
    each exactly its named title. H1 is main's form; H2 to H4 drop the dead path, the checkout's script or the fix by
    hand; H5 to H9 break the merge on the copy (skipped, read from the caller's settings, run with no platform, a
    repair on every unhealthy row, no inside-checkout filter); H10 drops the shape guard.
  - On a20a37ce (five shards, merge base 9552afb1; `seat-mutate-output-a20a37ce.txt`, commit da321c9f): 12 of 14 red,
    each exactly its named title. H2 to H4 and H9 are re-anchored on build 2's text; H11 (named paths keep their
    backslashes), H13 (build 1's edit advice, no command and no `hook` argument) and H14 (no try) pin build 2's F2, F3
    and F1 fixes. H10 survived: build 2's try/catch keeps the base row whenever the merge throws, so dropping the
    shape guard is red only for a refused shape the merge walks without throwing; the seat counts it subsumed. H12
    (the edit command keeps its backslashes) survived: off Windows the hook command and its script path hold no
    backslash, so it can turn a check red only on Windows.
  - On 27b06dec (`seat-mutate-output-27b06dec.txt`, commit 5173ee52) and on eb6910ed with main (merge base 7aadbc99;
    `seat-mutate-output-eb6910ed.txt`, commit efcf664a): 12 of 14 red again, H10 and H12 surviving as above.
  - Declared without a pair, before the run: the import line; the `resolvesInsideCheckout` extraction; `!healthy` in
    the guard; `structuredClone`, so the brief's "never change the caller's settings" is unpinned (each row's merge
    touches only that row's entries, and neither doctor nor the stale-copy producer reads them again); the
    `mergeHooks` fallback; the Set de-dup, so design step 2's "drop duplicates" is unpinned; the `@outputs` header. The
    seat ran win32-hook-repair on scratch copies of the tip with the clone, the fallback or the de-dup removed: each
    read 14/14 green.
  - No seat pair ran on Windows: neither H12 nor the brief's Windows-only pair (drop today's detail, which turns
    doctor-detail's R-393 check red there) has run. The Windows CI leg is the only native run of the win32 branch.
- Independent check (`independent-check-efcf664a.md`, filed under this tip's name): it ran on build 1, 32cdb9ee, in a
  private clone with main 9552afb1 beside it, a temp home, made-up names and a stub pi first on PATH (macOS, win32
  forced). HOLDS over nine probes (P1 to P9), no MUST.
  - Must-meet and neighbours: win32-hook-repair 14 PASS; stale-copies 13/13; doctor-detail all pass; doctor-fix-line
    0 failures; win32-degrade exit 0; code map and readme checks 0 problems.
  - Held: before install, the lane names each dead entry and keeps today's detail on the other rows (P1); after install
    the ✗ lines agree with doctor's last line (P2); following the advice and reinstalling reads ✓ on all six settings
    rows (P3); doctor names only the entries install leaves, not one it repairs (P4); the macOS host's settings lines
    are identical to main's (P5); win32 doctor leaves the home unchanged (P6); six odd or refused shapes print six ✗
    rows with no throw (P7); the session-start stale-copy producer's output is identical to main's (P8).
  - Its findings and how each was settled:
    1. F1, known bug (P9): a settings file nested about 2,000 or more levels deep crashed win32 doctor in
       `structuredClone` before any row; main printed the rows. Fixed in build 2, a20a37ce (the try/catch), and pinned
       by R-2412's 3,000-level case and pair H14.
    2. F2, known bug, inferred: on Windows the advice printed the checkout path with backslashes, which can break the
       JSON when pasted. Fixed in build 2, a20a37ce (the safe route first, forward slashes), pinned by R-2410's
       no-backslash condition (narrowed in build 4) and pair H11.
    3. F3, known bug: the knowledge advice dropped the `hook` argument. Fixed in build 2, a20a37ce (the whole install
       command), pinned by R-2410 and pair H13.
    4. F4, known bug: the README bullet said doctor names "each one". Fixed in build 2, a20a37ce: the bullet names the
       two exceptions.
    5. HANDOFF: the "Hook repair test" line (eight checks, it runs eleven) becomes untrue. Settled in this commit: the
       file, its header and the code map say fourteen, and the line is dropped.
    6. HANDOFF: no line for this lane yet. Settled in this commit: one Landed line and the residuals below.
  - None of F1 to F4 is carried. Builds 2 to 4 changed the advice text and the tests; nobody re-ran the independent
    check on them, a HANDOFF residual. The seat's pairs and CI cover eb6910ed.
- The plan's known limits, each now a HANDOFF residual naming this lane: install still leaves a dead hand-written or
  look-alike entry as written, and Claude Code keeps running it until the owner edits it (inferred); macOS and Linux
  do not change; an entry run through `node.exe` or with a backslash script path is never named, and its row reads ✓
  beside the install-added entry; before install, a row with one repaired and one left entry names only the second
  while doctor's last line sends it to install; the session-start stale-copy notice names rows, not entries. One more
  residual: H12 and the brief's Windows-only pair have not run on Windows.
- Declared behaviour change: on win32 only, a ✗ hook settings row whose entry install leaves gains `; install leaves
  <path>[, <path>] as written — remove that entry by hand, then run nana-setup install; to edit instead, run <command>`
  after today's detail. The row's ✓ or ✗, the POSIX branch, doctor's last line and the stale-copy notice do not change.
- HANDOFF: one Landed line; the "Hook repair test" line dropped; seven new residuals naming this lane (the independent
  check not re-run after build 1, the Windows-only pairs, and the plan's five known limits). Seat items from other
  lanes: shared-memory-index-cap's two existing lines reworded and one new line, and one new claude-config-dir line.
- Seat note for the reviewers (not probed): the README bullet calls the first exception "an entry whose path ends in a
  backslash"; the plan says "a script path whose last separator is `\`", and R-923's declared limit says "a
  backslash-only script path".
- Land reviewer: pi gpt-6-astra reviews the land through pi-review, so the seat writes no `seat-land.md`.
- Rows: R-2410 to R-2412 read `implemented` in REQUIREMENTS.md. At the notes commit (no code or row changed since
  eb6910ed): `node scripts/requirements-trace.mjs` reads `requirements: 1707 total (1475 implemented · 1 planned · 37
  retired · 189 untested · 5 violated); 1475 traced by tests` and `ears: 0 rows off form (allowance 0)`;
  `npm run map:check` reads 370 modules, 0 problems; `npm run readme:check` reads 736 claims, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, merge base 7aadbc99, run at efcf664a):
  ```
  tree movement 7aadbc9..efcf664: 3 rows in 1 features
  FEAT-015 · Diagnose the active environment
    R-2410 new (implemented)
    R-2411 new (implemented)
    R-2412 new (implemented)
  ```
  CAP-04 moves from 534 to 537 rows and FEAT-015 from 147 to 150. No existing row changed.
- Not in this record: a seat-run locked full suite (the land runs it on the reviewed tip), Windows-only wrong-code
  pairs, and the local macOS install check, which runs before the land.
