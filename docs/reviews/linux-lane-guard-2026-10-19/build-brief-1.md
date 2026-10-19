# Lane linux-lane-guard — build brief 1 (2026-10-19 · feat/linux-lane-guard · tip after the seat's plan commit)

**Builder: Claude Sonnet 5, a subagent in `<worktrees>/linux-lane-guard`.** Lane class: ordinary (tests only; nana-gate. Read `must-meet.md` here first (the adversary's amended plan; `plan-attack.md` holds its reasons). Requirements first: add the rows `must-meet.md` lists as `planned` in the right feature table of `REQUIREMENTS.md`, run `npm run req:tree`, and bump the R-291 leaf-total literal in `packages/nana-pack/tests/requirements-tree.test.mjs` (three spots) by the rows you add; then the tagged tests; then the code; flip each row to `implemented` when its test passes. Run `npm run map` after adding or moving a module and commit the map. Do not run the full suite and do not push; the seat does both. Do not edit `HANDOFF.md` or `docs/sessions/`.

---

# Build brief — linux-lane-guard (ordinary, tests only)

Worktree `<worktrees>/linux-lane-guard`, branch `feat/linux-lane-guard` from main b3f6ec2.

**Change** only `packages/nana-pack/tests/lane-write-guard.test.mjs`. Do not touch `extensions/nana-gate.ts`.
1. Replace the HOME-only fixture with a named list, `OUTSIDE_FIXTURE_PARENTS`:
   - `[os.homedir(), "/var/tmp"]` on POSIX, `[os.homedir()]` on win32.
   - Add a `// chosen:` comment: the runner's HOME sits under /tmp on Linux, and /var/tmp is outside both permitted temp roots.
2. For each parent in order:
   - Take its realpath. Skip the parent if that realpath is inside the worktree, `realpath(os.tmpdir())` or the `/tmp` alias. Use the existing `contained` helper.
   - Otherwise try `tmpDir(path.join(real, "lane-guard-outside-"))` plus `mkdir outside`. Catch every error and move on to the next parent.
   - The first parent that works is the fixture. A parent that exists but cannot be written to must not crash the file.
3. If no parent works, set `outside` to `path.join(os.homedir(), "lane-guard-missing", "outside")` and never create it. The dangling check still targets a missing path outside the lane.
4. Extend `check` to `check(title, ok, skip = null)`. When `skip` is set, it prints `SKIP <title>: <skip>` and returns, with no PASS/FAIL line.
   - Pass the reason `no writable fixture parent outside the lane and both permitted temp roots` to both outside titles.
   - Delete the `!outsideIsIndependent ||` pattern and the standalone SKIP line.
5. Directly under each `// req: R-962` marker, the next line must still start with `check("<title>"`.
   - The rail scans only `test(`, `it(` and `check(`. A wrapper such as `outsideCheck(` throws the trace scan.
   - Keep all nine titles and markers byte-identical. Add no new test and no new row.
6. Header changes:
   - `@outputs` becomes "named PASS/FAIL/SKIP checks".
   - `@effects` becomes "disk (fixtures under home, OS temp or /var/tmp), process (environment)".
   - Then run `npm run map` and commit `docs/code-map.md`.

**Seat checks** (run each on the last commit):
- Setup: P is a `mktemp -d "$TMPDIR/plan.XXXXXX"` folder, and L is a `mktemp -d /tmp/plan.XXXXXX` folder.
- Run `env -u NANA_WORKTREE_ROOT HOME=… USERPROFILE=… TMPDIR=… node --experimental-strip-types <test>` from P.
- A: `HOME=$P/a/home TMPDIR=$P/a/ftmp`. Expect 9 PASS, 0 SKIP, exit 0.
- C: `HOME=$L/home TMPDIR=$P/c/ftmp`. Expect 9 PASS, 0 SKIP, exit 0.
- D: `HOME=$L/home TMPDIR=/var/tmp`. Expect 7 PASS, 2 SKIP, 0 FAIL, no PASS line for the two outside titles, exit 0.
- After A, C and D, `ls /var/tmp | grep lane-guard` prints nothing.
- `node --experimental-strip-types packages/nana-pack/tests/requirements-trace.test.mjs` exits 0.
- `npm test -- lane-write-guard`, `npm run map:check` and `npm run readme:check` each exit 0.

**Wrong code to try.** Run these on copies in P and record each result as a mutation pair:
- Guard-only fix: add `!outsideIsIndependent ||` to the symlink line and keep the HOME fixture.
  - Gate copy, mutant C: in `realOut`, replace `return path.resolve(fs.realpathSync(candidate), …)` with `fs.realpathSync(candidate); return path.resolve(candidate, ...suffix.reverse());`. Shape C must FAIL the symlink check under your fix, and must go green (9 PASS, exit 0) under the guard-only fix.
  - Gate copy, mutant D: in `laneWriteHit`, add `if (subject.startsWith("..")) return null;` before `realOut`. Shape C must FAIL the traversal check under your fix, and must go green under the guard-only fix.
- Realpath-only selection with no attempt to create the folder: give the copy a read-only (555) candidate as the only parent. It must SKIP twice with exit 0, not crash.
- A wrapper call under a marker: the trace scan must throw. Revert it.
- /var/tmp placed first: shape A's fixture must stay under the fake HOME. Log the chosen parent to stderr in the probe copy only.

**Done** means every seat check passes, `npm run test:locked` is green, and the commits are on `feat/linux-lane-guard`. Do not edit HANDOFF.md or the session notes.

**Report shape** (≤ 10 lines):
1. Commits (sha and subject).
2. Files changed.
3. Shapes A, C and D: PASS/SKIP/FAIL counts and exit codes.
4. The /var/tmp leftover check and the read-only-parent result.
5. Each mutation pair: the mutant, and which check caught it or missed it.
6. Exit codes for requirements-trace, map:check and readme:check.
7. The test:locked summary line with its check count.
8. What was not done (for example, no run on a Linux machine).