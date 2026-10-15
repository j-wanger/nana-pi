# Lane lift — build brief 2 (2026-10-15 · feat/lift · tip df50eff)

**Builder: Claude Sonnet 5.** Build 1 passes every check on macOS: the seat's `npm run test:locked` (144 files, 0
failed), acceptance 136/136, titles 0 missing. CI run 38738434830 on the Windows leg fails `requirements-lift.test.mjs`
11 pass / 17 fail. Build brief 1's rules all hold, with the changes below.

## 1. The Windows path bug
Every `--write`/`--verify` case refuses there with a path like
`../../../../../../../RUNNER~1/AppData/Local/Temp/nana-test-…/t8-15/proj/REQUIREMENTS.md is untracked`. The temp folder
reaches the lift in its 8.3 short form (`RUNNER~1`) while `git rev-parse --show-toplevel` returns the long form, so
`relative(repoRoot, ledgerPath)` (`scripts/requirements-lift.mjs:712`, `:716`, `:740`, `:746`; the top-level read at
`:613`; the prefix read at `:595`) climbs out of the repository. Canonicalise every path before comparing or relating it:
`realpathSync.native` on win32 (the roster lane's rule for lane paths), `realpathSync` elsewhere, applied to the
repository top level, `--root`, the ledger and the mapping. Check the worktree scan the same way (the
"second worktree" case also fails there). Prove it on macOS with a test that reaches the lift through a path spelled
differently from git's (a symlinked temp folder: `--root` through the link, git's top level real) — `// req: R-1164`:
`R-1164: --write and --verify relate the ledger and mapping to the repository when --root is spelled differently from git's top level`
— red first on today's code.

## 2. Do not run the full suite
Build 1 stalled for nine hours waiting on its own background `test:locked`. This time run only the touched test files
(`node scripts/test.mjs packages/nana-pack/tests/requirements-lift.test.mjs` and any other file you touch), the title
check and the acceptance; commit; push. The seat runs the full suite and reads CI.

## 3. Notes are the seat's
Build 1 edited `HANDOFF.md` and `docs/sessions/2026-10.md`, which brief 1 reserved for the seat. Revert both to
`1588f92`'s content in one commit (`git checkout 1588f92 -- HANDOFF.md docs/sessions/2026-10.md`); the seat writes the
notes before the final round. Acceptance's seat items may then read red; that is expected.

## Report
≤ 15 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: the commits; the red you saw first for the new test; the
touched test files' summary lines; the last line of the title check and of acceptance.
