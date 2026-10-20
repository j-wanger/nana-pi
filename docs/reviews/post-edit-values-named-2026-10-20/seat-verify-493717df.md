# Seat checks — post-edit-values-named build 1, tip 493717df (2026-10-20)

- Build, by a Claude Sonnet 5 subagent (`build-brief-1.md`, one build), ce4ca2c7:
  - `lib/post-edit-config.mjs` gains five exports, each with its provenance beside it: `POST_EDIT_KILL_GRACE_MS = 2000`
    (chosen in the 2026-09-08 hang fix), `POST_EDIT_OUTPUT_CAP = 1024 * 1024` (chosen: Node's exec maxBuffer default,
    in UTF-16 units over stdout and stderr together), `POST_EDIT_FAILURE_CAP = 2000` (contract value, R-087),
    `POST_EDIT_COMMAND_CAP = 400` and `POST_EDIT_LOCK_MESSAGE_CAP = 300` (both chosen 2026-09-29). Its `@purpose` and
    `@outputs` now cover all six values.
  - `extensions/nana-post-edit.ts` imports the five names and drops its local `MAX_OUTPUT`, `KILL_GRACE_MS`,
    `FAILURE_CAP` and `CMD_CAP`. Every use reads a name, including `promptText(lockError, POST_EDIT_LOCK_MESSAGE_CAP)`,
    the forced-settle message and the doc comment. `POST_EDIT_FAILURE_CAP * 3` stays (the ⏎ widening). The two
    PYTHONUTF8 contract values (R-1740) stay in the extension, as the plan says. No numeric literal of the five is left.
  - `tests/post-edit-hardening.test.mjs` imports the grace and bounds checks a, b, c and f at
    `SETTLE_BOUND_MS = POST_EDIT_KILL_GRACE_MS + 4000` (6000 at today's grace) in place of a literal 6000. Titles and
    markers are unchanged.
  - The pack README's SIGTERM note gains "A command that sets no `timeoutMs` gets 30 seconds;".
  - The new `tests/post-edit-values-named.test.mjs` holds the six must-meet checks. It copies the extension and `lib/`
    into a temp folder, rewrites the five exports to 1234, 64, 37, 9 and 11, and puts a stand-in pi package in the
    copy whose file queue refuses only a `lock-case` path. R-2215 imports the real config module.
  - Rows R-2210 to R-2215 join FEAT-030 after R-2151, all `implemented`. The tree and code map are regenerated.
  - Commits: 868cfa5a (plan and build brief 1, branched from main 07f8f6f9, the post-edit-timeout-name land tip),
    ce4ca2c7 (build 1), 493717df (the seat's merge of main c7f582ad, the pi-launch-followups land tip, which touches no
    lane file) and 10982c04 (the seat's pairs table and output). The seat's notes commit adds only this record, the
    independent check, the Windows log, the review briefs, HANDOFF and the session entry.
- CI on build 1 plus the merge, run 39409212100 on draft pull request #124 at 493717df (GitHub's merge commit bbfa4a2d
  merges 493717df into its own ancestor c7f582ad, so the tree tested is 493717df's):
  - macOS `181 files: 179 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7920 pass, 0 fail, 29 skip`. post-edit-values-named
    `6 pass`, post-edit-hardening `22 pass, 1 skip`, display-surfaces `181 pass`.
  - Ubuntu `181 files: 178 PASS, 0 FAIL, 3 SKIP, 0 WARN · checks: 7859 pass, 0 fail, 47 skip`. The same three files read
    6, 22 with 1 skip, and 181. The macOS and Ubuntu numbers are the seat helper's reading of the job logs; no log is
    kept here.
  - Windows `181 files: 164 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6851 pass, 0 fail, 110 skip`
    (`ci-windows-493717df.log`). The 17 skipped files are main's declared set (16 desk files and the bench's
    study-tasks). post-edit-values-named `6 pass`, all six by title, R-2210's exact timer list included:
    ```
    PASS a timed-out post-edit check arms its forced kill at the named kill grace, retuned in a copy
    PASS a post-edit check that prints past the named output cap could not run and keeps only that many first units, retuned in a copy
    PASS a failing post-edit check shows the model the last units up to the named failure cap, retuned in a copy
    PASS a failing post-edit check shows the model its command up to the named command cap, retuned in a copy
    PASS a refused post-edit file lock shows the model the refusal up to the named lock message cap, retuned in a copy
    PASS seal: the post-edit kill grace is 2000 ms, the output cap 1048576, the command cap 400 and the lock message cap 300
    ```
    So taskkill arms no timer of its own there, which settles the plan adversary's most-likely-wrong claim.
    post-edit-hardening `17 pass, 6 skip`: checks a and c pass under the named bound (428 ms and 61 ms), and b and f
    skip as POSIX-only, as on main. Neighbours: display-surfaces 181; post-edit-default-timeout 2; post-edit-status
    `33 pass, 1 skip`; post-edit-file-queue `3 pass, 1 skip`; post-edit-utf8 4; config-handlers-malformed 99.
  - install-check: macOS and Windows pass.
  - None of main's known failures showed: Ubuntu's path-spelling GP1 and GP2 were fixed on main at ca27d86, Windows
    main reads 0 FAIL since 4be0b79, and no R-291 merge artifact arises, since GitHub's merge commit holds 493717df's
    tree.
- The seat's wrong-code pairs (`seat-mutate.mjs`, record `seat-mutate-output-493717df.txt`, commit 10982c04), through
  the shared mutation runner on macOS, one shard, Node 22.22.2. Baselines: post-edit-values-named 6 PASS and
  display-surfaces 181 PASS. Result: 18 of 20 red, each exactly on its named title, 0 with a named title green and 0
  with an unnamed red; 2 survived, both declared before the run.
  - Red: G1 (grace timer at a literal 2000) on R-2210; O1, O2 (output cap as a literal in the compare or the cut) and O3
    (the cut counted in code points) on R-2211; F1 to F4 (failure cap as a literal in the compare, the tail or the
    stated cut, or no cut at all) on R-2212; C1 to C3 (command cap as a literal in the cut, the compare or the stated
    cut) on R-2213; L1 (lock cap as a literal 300) and L2 (lock message passed with promptText's default cap) on
    R-2214; S1 to S4 (the config retuned to 2500, 1000 * 1000, 401 and 299) on R-2215; S5 (the failure cap retuned to
    1999) on display-surfaces' R-087 check.
  - G2 survived, declared: the forced-settle message stating a literal 2000 ms. The model sees that text only when the
    kill fails, and no check reaches it at a retuned grace; at the sealed 2000 the literal reads the same. Today the
    message reads the name, so nothing is stale; a literal put back there would go unnoticed. A HANDOFF residual.
  - F5 survived, declared: the failure body ceiling as a literal `2000 * 3`. It equals the named ceiling for any
    failure cap up to 2000, the copy's 37 included, so it is an equivalent change, not a gap. No residual.
  - Declared without a pair: the hardening settle bound is a test change, and the README sentence and module header
    carry no behaviour. Every pair ran on macOS only; CI's Windows leg is the only native win32 run.
- Independent check (`independent-check-493717df.md`): it ran on 493717df in a private copy with the lane at 493717df
  and main at c7f582ad, under a temp HOME and TMPDIR. HOLDS, no MUST, over 9 probes. The must-meet file reads 6 PASS in
  0.5 s and leaves its temp folder empty (probe 1). Through pi 1.0.2's own loader and real file queue, main and the
  lane give identical model-visible text in six cases: 7909-char output with emoji, a 678-char command, 1.6 MiB output,
  a real EACCES lock refusal, a SIGTERM-ignoring checker and a passing check (probe 2). A SIGTERM-ignoring checker
  with a 500 ms deadline settles in 2506 ms on main and 2505 ms on the lane (probe 3). Real pi 1.0.2 loads the
  extension in RPC mode with empty stderr, and a copy with a broken config import fails to load, naming the module
  (probe 5). Six neighbouring files match the plan's counts (probe 6). A grace retuned to 3000 changes hardening's
  settle times to about 3.3 s with 22 PASS and turns only the R-2215 seal red (probe 7). A failure cap retuned to 1500
  turns only display-surfaces' R-087 check red (probe 8). Code map 345 modules and README 720 claims, 0 problems each;
  nothing else reads the removed names (probe 9). Its findings and how each was settled:
  1. No MUST.
  2. Probe 4, a forced win32 run on macOS, gave 5 PASS and 1 FAIL on R-2213 (`could not run`). The check traced the
     FAIL to the simulation: `cmdCouldNotRun` splits PATH on `;` and cannot find node on a macOS PATH. CI's Windows leg
     passes R-2213 natively. Settled; no residual.
  3. K1: R-2210's exact `[300, grace]` timer list had no native Windows proof at check time. The CI run above passes it
     on Windows. Settled.
  4. K2: R-2210 records every `setTimeout` the process arms during the timeout case. A future Node or pi that arms a
     timer inside spawn or the dynamic import turns it red with no product change. A HANDOFF residual.
- The plan's known limits, each settled:
  - Surrogate carry: on overflow, `slice(0, POST_EDIT_OUTPUT_CAP)` and the tail `slice(-POST_EDIT_FAILURE_CAP)` can
    each split a surrogate pair, on main and on the lane alike. The plan's decision: `promptText`'s `toWellFormed()`
    shows the lone half as U+FFFD, so no lone surrogate reaches the model, and a cut pair costs one replacement
    character. A HANDOFF residual. handoff-cap-surrogate's seat record left this raw cut to this lane.
  - The pack README states 30 s, 2 s and 2000 chars as prose, and no check ties them to the config: a HANDOFF residual.
  - Fixture scale: hardening's fixed 15 s watchdog breaks at a grace past about 14.5 s, and display-surfaces' 5000-char
    R-087 output breaks at an output cap under about 5 KB: a HANDOFF residual.
  - R-2214 runs through a stand-in pi package. R-091 and R-785 cover pi's real refusal, and the independent check's
    probe 2 ran a real EACCES refusal through pi's file queue. No residual.
  - R-2210 checks the delay armed, not when the kill lands. R-787 and R-094 cover settling, now with bounds read from
    the named grace, and probes 3 and 7 measured it. No residual.
  - R-2210's exact list on Windows: CI passes it (above). Its fragility is K2.
  - PYTHONUTF8's name and value stay in the extension as contract values (R-1740), by the plan's design. No residual.
- HANDOFF: post-edit-timeout-name's two residuals go, "five other post-edit values stay inside the extension, unnamed
  and unsealed" and "the pack's README does not state the 30-second default", since this lane names the five and the
  README sentence landed. Five new residual lines: G2, K2, the surrogate carry, the fixture scale and the README prose
  numbers. post-edit-timeout-name's third line (its check reads the setting through a copy of the extension and
  `lib/`) is unchanged; R-2210 to R-2214 use the same copy.
- Rows: R-2210 to R-2215 read `implemented` in REQUIREMENTS.md. The seat helper's re-run at the notes commit: `node
  scripts/requirements-trace.mjs` reads `1586 total (1346 implemented · 1 planned · 37 retired · 197 untested · 5
  violated)` and `ears: 0 rows off form (allowance 0)`; `npm run map:check` reads 345 modules, 0 problems; `npm run
  readme:check` reads 720 claims, 0 problems; `node scripts/requirements-tree.mjs --check` exits 0.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, which reads from the merge base
  c7f582ad):
  ```
  tree movement c7f582a..10982c0: 6 rows in 1 features
  FEAT-030 · Get trustworthy feedback after edits
    R-2210 new (implemented)
    R-2211 new (implemented)
    R-2212 new (implemented)
    R-2213 new (implemented)
    R-2214 new (implemented)
    R-2215 new (implemented)
  ```
  CAP-07 moves from 309 to 315 rows and FEAT-030 from 56 to 62. No existing row changed.
- Reviewers: Claude Opus 5.5 (the final reviewer) and Claude Fable 5.1 (the land reviewer), both through
  review-ledger. The plan's seat steps name astra (the roster's land model); the seat's lineup today uses Fable. A land
  model is set either way, so there is no `seat-land.md`.
- Not in this record: a seat-run locked full suite (CI's three legs ran the whole suite) and the local macOS install
  check, which runs before the land, as the plan asks.
- Main was c7f582ad when the lane merged it at 493717df. It is now c203f485, after three lands: notify-lifecycle-pins
  (6f0098a8), mutation-runner-takeover-race (a112fd30) and handoff-cap-surrogate (c203f485). None touches the post-edit
  extension, its config module or its tests. Main's one pack README change sits in the mutation runner note, far from
  this lane's hunk. A trial merge conflicts only in the generated code map and tree; HANDOFF, REQUIREMENTS.md and the
  session file are shared too. So the land needs a merge of main and a confirmation round on the merged tip.
