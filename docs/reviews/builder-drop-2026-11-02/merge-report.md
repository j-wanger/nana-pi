# Builder-drop merge record

## Scope

Merged main at `68a616bc35605e23d93955e8b40262e27115b843` into the lane. The shared origin/main reference advanced from the brief's `5e7b779ba85eed00892c1c0963ee8af1d6d85350` during validation; the unfinished first merge was aborted and replaced with the newer merge.

Preserved lane rows R-3600–R-3607, code, READMEs, replay test, review folder and session entry. No requirement wording or product behavior changed. No known-bug line was authored or removed by this merge; incoming main's known-bug files are byte-identical to main.

## Resolution and precedent

- Took `packages/nana-pack/tests/requirements-tree.test.mjs` wholly from main. No heading-count pin remains in the lane diff. Main's derived R-288/R-1158 checks pass with FEAT-045.
- Kept both README additions whole: main's seat anatomy and this lane's replay section.
- Kept main's complete session entries and the lane's complete replay entry in newest-first date order. No new narrative entry was written.
- Regenerated `docs/code-map.md` with `npm run map` and `docs/requirements-tree.md` with `npm run req:tree`.
- `merge-preservation.txt` records that every tracked difference from main belongs to the original lane file set, the tree test equals main, and the session entries are whole and newest first.

Departure: changed the existing replay test's root allocation from direct `fs.mkdtempSync` to the existing `tmpDir` export from `apps/bench/test/tmp-dir.mjs`. The required runner source check failed on the lane's direct call. Its assertion stayed unchanged. This is fixture lifecycle alignment only, not replay behavior. No new tests, rows, tunables or mutation pairs were added. The impact command was run after this small edit rather than before it.

## Evidence

- Initial required tests: exit 1; runner had 52 pass, 1 fail, naming the direct temporary-directory call (`merge-tests.txt`).
- Final filtered run: `npm test -- apps/bench packages/nana-pack/tests/test-locked.test.mjs packages/nana-pack/tests/requirements-tree.test.mjs packages/nana-pack/tests/test-runner.test.mjs`, exit 0. 21 files: 20 PASS, 0 FAIL, 1 SKIP; checks: 994 pass, 0 fail, 1 skip (`merge-tests-green.txt`). The optional study-task dependency is absent.
- Direct tree test and runner test: exit 0 each (`merge-tree-test.txt`, `merge-runner-test.txt`).
- Map generation, tree generation, map check, README check, requirements trace, tree check, known-bugs check, identity scan and preservation: exit 0 each, in the corresponding `merge-*.txt` files.
- Correct known-bugs invocation: `node scripts/known-bugs.mjs --root .`. An initial unsupported `--check` invocation returned usage and exit 2; corrected invocation passes.
- Preservation probe initially needed a larger output buffer for the archive; corrected read-only probe passes.
- `node scripts/lane-class.mjs --root . --files apps/bench/README.md,apps/bench/test/replay.test.mjs,docs/code-map.md,docs/requirements-tree.md,docs/sessions/2026-10.md`: ordinary, exit 0.
- Unstaged `git diff --check`: exit 0. The staged merge whitespace check returned 2 on main's inherited review logs and blank EOF; those files were preserved. The lane-only committed check also returned 2 on captured PASS lines' trailing spaces; no source whitespace change was made.
- After staging the new logs, the identity scan detected local paths in Node's module-type warnings in the trace and known-bugs logs. Re-ran those two commands with `NODE_NO_WARNINGS=1`; both checks and the staged-file identity scan pass. The merge commit's evidence was amended to remove those warnings from the recorded logs.

## Not done

No locked full suite, paid replay, model session, review launch, credential access or issue operation. CI covers the suite; the builder pushes and does not inspect CI. Named checks will be repeated on the committed tip before push.
