# Seat checks — post-edit-timeout-name build 1, tip eba75dca (2026-10-20)

- Build, by a Claude Sonnet 5 subagent (`build-brief-1.md`): one commit dbcd6db4 (the new
  `packages/nana-pack/lib/post-edit-config.mjs` with `POST_EDIT_DEFAULT_TIMEOUT_MS = 30_000` and its `chosen`
  provenance; the import and `c.timeoutMs ?? POST_EDIT_DEFAULT_TIMEOUT_MS` in `extensions/nana-post-edit.ts`; rows
  R-2150 and R-2151 in FEAT-030 after R-1743; the new `tests/post-edit-default-timeout.test.mjs`). The builder merged
  main itself at 5db4d8e4, as its brief's step 4 asked: main 15703d8d, the pi-probe-timeout land tip. eba75dca
  regenerates the tree and the code map; 9284d1e2 adds the seat's pairs. So the lane branched from main 1b54211c, but
  its merge base is now 15703d8d: the lane's own change is `15703d8d..HEAD`, and the rest of `1b54211c..HEAD` is
  pi-probe-timeout, already on main. The seat's notes commit adds only this record, the independent check, the
  Windows log, the two review briefs, HANDOFF and the session entry.
- CI run 39399379115 on draft pull request #118 at eba75dca (GitHub's merge commit 3accb659 merges eba75dca into
  main 54f1271f, the config-advice-fixes land tip, so the tree tested is the lane plus that land):
  - macOS 177 PASS, 0 FAIL, 2 SKIP of 179 files (7,885 checks pass).
  - Ubuntu 176 PASS, 0 FAIL, 3 SKIP of 179 files (7,824 checks pass).
  - Windows `179 files: 162 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6820 pass, 0 fail, 106 skip`
    (`ci-windows-eba75dca.log`). The 17 skipped files are the same set as pi-probe-timeout's run 39384200809, main's
    declared set. The new file and its neighbours, as the log prints them:
    ```
    PASS a post-edit command with no timeoutMs arms its deadline at the pack's named default, retuned in a copy
    PASS seal: POST_EDIT_DEFAULT_TIMEOUT_MS is 30000
    PASS  packages/nana-pack/tests/post-edit-default-timeout.test.mjs     2 pass  0.3s
    PASS timeoutMs 0 arms no deadline and a slow check passes
    PASS  packages/nana-pack/tests/post-edit-status.test.mjs              33 pass, 1 skip  2.9s
    ```
    Also post-edit-file-queue `3 pass, 1 skip`, post-edit-hardening `17 pass, 6 skip`, post-edit-utf8 `4 pass`,
    display-surfaces `181 pass`, config-handlers-malformed `98 pass`. post-edit-status's one skip is `h: lock refusal
    needs POSIX mode bits and a non-root uid`, as on main.
  - install-check: macOS and Windows pass; its live pi turn loads the changed extension and prints `PASS pi
    post-edit` (the seat's reading of the run; those job logs are not kept here).
  - So the plan adversary's most-likely-wrong claim held: the copy of the extension and its lib folder, and Node's
    native import of the copied `.ts`, work on native Windows, where R-2150 passes.
  - None of main's known failures showed: Ubuntu's path-spelling GP1 and GP2 were fixed on main at ca27d86, Windows
    main reads 0 FAIL since 4be0b79, and no R-291 leaf-total merge artifact arose.
- The seat's wrong-code pairs (`seat-mutate.mjs`), through the shared mutation runner on macOS, one shard, Node
  22.22.2, at eba75dca (`seat-mutate-output-eba75dca.txt`, committed in 9284d1e2): 8 of 8 red, 0 survived, each
  exactly its named titles. W1 to W7 follow the plan: the inline literal back (W1), no default (W2), a default of 0
  (W3), the seal retuned to 20000 (W4), the operands swapped (W5), the default read in seconds (W6) and `||` for `??`
  (W7). The seat's table added W8: the extension declares its own copy of the name instead of importing it; it turns
  R-2150 red. Declared: W5 and W7 are caught by the existing rows R-1702 and R-095 in post-edit-status, not by this
  lane's rows; each pair runs only the test file holding its named titles. No pair ran on Windows.
- Independent check (`independent-check-eba75dca.md`): it ran on eba75dca in a private clone, with HOME and TMPDIR
  under a temp folder. HOLDS, no MUST, 10 probes. The must-meet file passed 2 of 2 (probe 1), and the six
  blast-radius files passed one at a time (probe 2). On eight timeoutMs values (absent, 0, 5000, 30000, null, "5000",
  -1, 1.5) main and the lane armed the same timers (probe 3). A copy retuned to 800 stopped a hung checker in 812 ms,
  and a command's own 1500 still overrode it (probe 4). Real pi 1.0.2 loaded the extension with `-e` and as an
  installed pack, and a deleted config module failed loudly (probes 5, 6). A pack path with spaces and non-ASCII
  letters passed, writing nothing outside its temp folders (probe 7). Its findings and how each was settled:
  1. Known bug (stale record): HANDOFF still said the 30-second default time limit is a literal in the extension.
     Settled in the seat's notes commit: that post-edit-win-pin residual is dropped, as the plan's seat step asked.
  2. Known bug (wrong claim in the plan only): `must-meet.md` says `timeoutMs: null` takes the default through `??`.
     That is wrong. The config loader rejects null as `timeoutMs must be a non-negative integer`, so no check runs,
     on main and on the lane alike (probe 3). The claim appears nowhere a user reads it. The plan of record stays as
     written; no residual.
  3. Note: the seat's two pair files were untracked when it ran. 9284d1e2 commits them.
  4. Windows (probe 10): the check could not force win32, so it read the timer code instead. A passing run arms one
     timer, the deadline; the kill timer starts only after the deadline fires. So R-2150's one-timer test does not
     depend on the platform. CI's Windows leg settles it with a native pass of both new checks.
- The plan's other known limits, each now a HANDOFF residual: five other post-edit values (the kill grace, the output
  cap, the failure cap, the command cap and the lock message cap) stay inside the extension, unnamed and unsealed;
  the pack README does not state the 30-second default; R-2150 proves the name only through a copy of the extension
  and its lib folder, so an import from outside that folder would fail the check loudly, never falsely.
- The plan named astra as the land reviewer. Under the current lineup Claude Fable 5.1 is the land reviewer, so the
  seat writes no `seat-land.md` either way.
- Rows: R-2150 and R-2151 read `implemented` in REQUIREMENTS.md. The seat helper's re-run at the notes commit: `node
  scripts/requirements-trace.mjs` reads `1565 total (1307 implemented · 1 planned · 34 retired · 218 untested · 5
  violated)` and `ears: 0 rows off form (allowance 0)`; `npm run map:check` reads 342 modules, 0 problems; `npm run
  readme:check` reads 719 claims, 0 problems; `node scripts/requirements-tree.mjs --check` exits 0.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base 15703d8d`, the merge base):
  ```
  tree movement 15703d8..9284d1e: 2 rows in 1 features
  FEAT-030 · Get trustworthy feedback after edits
    R-2150 new (implemented)
    R-2151 new (implemented)
  ```
  CAP-07 moves from 307 to 309 rows and FEAT-030 from 54 to 56. No existing row changed.
- Not in this record: a seat-run locked full suite (CI's three legs ran the whole suite) and the local macOS install
  check, which runs before the land.
- Main was 15703d8d when the builder merged it. It is now 54433844: config-advice-fixes, install-cli-pins,
  pack-config-agent-dir-pins, win-lock-fix-command and handoff-pins have landed since. So the land needs a merge of
  main.
