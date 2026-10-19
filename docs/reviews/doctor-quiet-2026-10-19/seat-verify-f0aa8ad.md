# Seat checks — doctor-quiet build 1, tip f0aa8ad (2026-10-19)

- Build: a pi gpt-5.6-sol builder through pi-worker (`build-brief-1.md`), commit 19ea42db, verdict DONE. f0aa8ad5 is
  the seat's merge of main 4fe70c53 when it pushed the draft pull request; it resolved a conflict in the R-291 leaf
  total (`packages/nana-pack/tests/requirements-tree.test.mjs`, 1,353 at the tip). d6e19f1e adds only the seat's pair
  table and its output; no code or test changed after f0aa8ad.
- Per the builder's report, not re-run by the seat: R-1750 to R-1752 added and implemented. Red before the change:
  R-1750 FAIL, R-1751 FAIL, R-1752 PASS (it guards a warning doctor must not mute, so it passes on main by design).
  Each of the six wrong-code tries turned its named checks red: restore the listeners after `diagnose()` (R-1750,
  R-1751); mute only SQLite (R-1751); remove the listeners without forwarding (R-1752); mute every
  ExperimentalWarning (R-1752); mute by name, not code (R-1752); set `NODE_NO_WARNINGS` at runtime (R-1750, R-1751).
  Doctor's stdout byte-identical to main's and its exit codes unchanged; install check 14 PASS.
- The builder also ran the locked full suite (7,603 checks pass, 0 fail). Its brief named single test files only, so
  that run broke the brief. The seat takes no evidence from it; CI below is the suite evidence.
- CI run 39315735365 on draft pull request #66 at f0aa8ad (GitHub's merge onto 4fe70c53, merge commit 26746b3f; its
  tree is f0aa8ad's, since f0aa8ad already holds 4fe70c53):
  - macOS `164 files: 162 PASS, 0 FAIL, 2 SKIP` · 7,615 checks pass, 0 fail, 15 skip; doctor-quiet `4 pass` (its
    three checks and its summary line), doctor-detail 66 pass.
  - Ubuntu `164 files: 162 PASS, 0 FAIL, 2 SKIP` · 7,560 checks pass, 0 fail, 33 skip; doctor-quiet 4 pass,
    doctor-detail 66 pass.
  - Windows `164 files: 147 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6542 pass, 0 fail, 83 skip`
    (`ci-windows-run-1.log`); doctor-quiet 4 pass, doctor-detail 62 pass, 1 skip. All three must-meet checks print
    PASS on win32:
    ```
    PASS doctor in a folder without project config writes no Node warning
    PASS doctor in a folder with project config writes no Node warning
    PASS doctor still prints a Node warning it does not mute
    ```
    R-1751's check passes only when stdout holds the `project trust` row, so the plan's likeliest wrong claim (that
    doctor reaches that row on Windows) is settled.
  - install-check: macOS and Windows success. None of main's known failures showed.
- The seat's wrong-code pairs (`seat-mutate.mjs`, `seat-mutate-output-f0aa8ad.txt`): 9 of 9 red on f0aa8ad, each by
  exactly its named titles, 0 survived; one shard, macOS, Node 22.22.2; baseline 4 PASS. M1 no mute (main's form), M2
  `NODE_NO_WARNINGS` at runtime, M3 the SQLite predicate dropped, M4 every ExperimentalWarning dropped by name, M5 the
  typeless predicate dropped, M6 the typeless predicate by name `Warning`, M7 no forwarding, M8 the filter added
  beside Node's printer, M9 the listeners restored in a `finally`. Declared, no pair: (a) the two module-header lines
  the lane changed carry no behaviour; (b) every pair runs on macOS under Node 22.
- Independent check (`independent-check-f0aa8ad.md`, run on f0aa8ad against main's bin at 4fe70c5): HOLDS, no MUST,
  nine probes with commands and output. Main's bin fails R-1750 and R-1751 and passes R-1752; the lane's passes all
  three. Doctor's stdout is byte-identical to main's with and without project config and under forced win32, with
  the same exit code; the lane's stderr was 0 bytes. `--trace-warnings`, `--no-warnings`, `--no-deprecation`,
  `--redirect-warnings` and `NODE_OPTIONS=--trace-warnings` behave as before. `install --dry-run`, `project
  --check`, `state` and a bad option give main's output and exit codes. install-check exits 0. Findings and how each
  was settled:
  1. K1 (known bug, not MUST): the replay calls each saved listener directly, and `process.listeners()` returns a
     `once` listener without its once-wrapper, so a user preload's once-listener fires on every warning after the
     swap. Doctor and Node register no such listener. `loadSqlite` in `packages/nana-knowledge/lib/db.ts` has the same
     pattern. Not fixed; recorded as a HANDOFF carried residual.
  2. K2 (known bug, not MUST): saved listeners run with `this` undefined, not `process`. Node's own printer does not
     use `this`. Not fixed; recorded as a HANDOFF carried residual.
  3. Not probed: Node 23 and 24 (only 22.22.2 is on this machine). The plan's Node-version limit stays open; HANDOFF
     carries it.
  Its probe 9 saw the seat's two pair files untracked in the worktree; d6e19f1e committed them.
- Rows: R-1750 to R-1752 read `implemented` in REQUIREMENTS.md. `node scripts/requirements-trace.mjs` reads `1353
  total (1066 implemented · 1 planned · 19 retired · 262 untested · 5 violated)` and `ears: 0 rows off form`; `npm run
  map:check` reads 313 modules, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, merge base 4fe70c53): 3 rows in FEAT-015
  — R-1750, R-1751 and R-1752 new (implemented).
- The plan's known limits stay open, and HANDOFF carries each as a doctor-quiet residual: `nana-setup project` and
  `project --check` still print the typeless warning; the pack's package.json still declares no module type; the
  SQLite predicate exists twice; the mute drops any `MODULE_TYPELESS_PACKAGE_JSON` warning during doctor; a warning a
  preload emits before `runDoctor` prints as before; the rows are pinned on Node 22. HANDOFF's tranche-2 residual
  drops its "doctor prints Node's SQLite warning" clause.
- Install check before the land: the builder's run (14 PASS) and the independent check's (exit 0 at f0aa8ad) are on
  record; the land checklist's own macOS run on the final tip is still to come.
- Main moved after the cut: leaf-total-drop, install-honest-report, win-stale-copies, unread-verdict-loud and
  post-edit-win-pin landed, and main is f8d20142. The lane has not merged it. A merge meets HANDOFF's Landed tail,
  residuals and Open list, the session file's top, the tree outline, the nana-setup README and the R-291 leaf total,
  which leaf-total-drop removed from the tree test; that tip needs its own accepted review coverage before nana-land.
