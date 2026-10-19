# Lane win-gate-tmp — build brief 1 (2026-10-19 · feat/win-gate-tmp · tip after the seat's plan commit)

**Builder: Claude Sonnet 5, a subagent in `<worktrees>/win-gate-tmp`.** Lane class: gate. Read `must-meet.md` here first (the adversary's amended plan; `plan-attack.md` holds its reasons). Requirements first: add the rows `must-meet.md` lists as `planned` in the right feature table of `REQUIREMENTS.md`, run `npm run req:tree`, and bump the R-291 leaf-total literal in `packages/nana-pack/tests/requirements-tree.test.mjs` (three spots) by the rows you add; then the tagged tests; then the code; flip each row to `implemented` when its test passes. Run `npm run map` after adding or moving a module and commit the map. Do not run the full suite and do not push; the seat does both. Do not edit `HANDOFF.md` or `docs/sessions/`.

---

# Lane win-gate-tmp: build brief 1 (feat/win-gate-tmp, tip after the seat's plan commit)

Read `docs/reviews/win-gate-tmp-2026-10-19/must-meet.md` first. Rows R-1430 to R-1433 are already in `REQUIREMENTS.md` FEAT-006 after R-962 as `planned`; the plan commit also regenerated `docs/requirements-tree.md` and set the leaf total in `packages/nana-pack/tests/requirements-tree.test.mjs` to 1,219. Take no other row ID. Do not edit R-962.

**Commit 1: the tests only.** Add four checks to `packages/nana-pack/tests/lane-write-guard.test.mjs` with these exact titles, each with `// req: R-143x` directly above its `check(` call, inserted while NANA_WORKTREE_ROOT is set, before the "empty worktree root" check:
- R-1430 `/tmp is a temporary root on macOS and Linux and not on Windows`
- R-1431 `a temp file named through another spelling of the temp folder is allowed`
- R-1432 `a lane file named through another spelling of the lane folder is allowed`
- R-1433 `home, at-sign and file URL targets are judged where pi writes them`

Follow the must-meet test shapes:
- Spelling pairs (case, OS spelling, link) run in both directions; a junction on win32 for the link pair.
- Non-vacuity: before each spelling sub-check, a sibling-folder target under the same env must be refused. If it is allowed, or the pair's two spellings are equal strings, print one SKIP line with the reason; it never counts as PASS.
- Temp variable: TEMP plus TMP on win32, TMPDIR elsewhere. For R-1432 point it at a sibling folder.
- R-1433: outside target is a never-created folder at the lane's filesystem root; build file URLs only with `url.pathToFileURL(p).href`; assert the outside folder still does not exist after the check.
- Restore HOME, USERPROFILE, the temp variables and NANA_WORKTREE_ROOT after each check. Write no file outside the test's own temp fixtures.

On macOS, R-1431, R-1432 and R-1433 must FAIL and R-1430 must pass. Commit the test file alone; the seat pushes it for Windows CI run 1, so it must not contain the fix.

**Commit 2: the fix** in `packages/nana-pack/extensions/nana-gate.ts`:
1. Import `resolveToolPath` from `../lib/gate-paths.ts`; `realOut` starts from `path.resolve(cwd, resolveToolPath(target, cwd))`.
2. One local `real(p)`: `fs.realpathSync.native(p)`, falling back to `fs.realpathSync(p)` when native throws. Use it for the target ancestor, the lane root and the temp roots.
3. Temp roots: `[os.tmpdir()]` on win32, `[os.tmpdir(), "/tmp"]` elsewhere.
Then: flip R-1430 to R-1433 to `implemented` with their tests as evidence; update the lane-guard paragraph of `packages/nana-pack/README.md` (about line 211): /tmp counts only on macOS and Linux, targets are judged as pi resolves them (`~`, `@`, `file://`) in each folder's spelling on disk, TMP is not read when it differs from TEMP. If you change the test's `@purpose`, run `npm run map`.

**Wrong code to try** (change the code, never the assertion; record each):
(a) native realpath on the roots only: R-1431 and R-1432 fail. (b) lane root left on JS realpath: R-1432 fails. (c) /tmp dropped everywhere: R-1430 fails on macOS. (d) `path.resolve(cwd, target)` kept: R-1433 fails. (e) refuse every `~`, `@`, `file://` target: R-1433 fails. Keeping /tmp on win32 and a lowercase compare instead of native show only on Windows; the seat checks those on CI.

**Do not:** touch the nine existing checks (Ubuntu's symlink-escape red stays); import `lib/real-path.mjs`; widen roots to TMP; edit HANDOFF.md; push.

## Done
- `node packages/nana-pack/tests/lane-write-guard.test.mjs`: 13 PASS on macOS (9 old, 4 new), no control SKIP.
- `gate-corpus`, `gate-policy-paths`, `gate-status` and `requirements-tree` tests: counts unchanged.
- `npm run map:check`, `npm run readme:check`, `node scripts/requirements-trace.mjs` clean; `npm run test:locked` green on commit 2.

## Report (at most 10 lines; first line `VERDICT: DONE | PARTIAL | BLOCKED`)
Both SHAs; lane-write-guard PASS/FAIL/SKIP lines on macOS for commits 1 and 2; wrong-code results (a) to (e); README lines changed; suite summary line with its check count; anything not done.
