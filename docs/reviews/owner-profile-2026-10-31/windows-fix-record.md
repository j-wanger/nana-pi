# Build 1 — Windows guard correction

## Commit and scope

Follow-up to `51686792` within the same build. The first hosted run failed on a real cross-platform defect, not the brief's known R-3104 timeout. No unchanged-job retry was used.

CI run: https://github.com/j-wanger/nana-pi/actions/runs/41231916784

- macOS suite: success.
- Linux suite: success.
- All four macOS/Windows floor/ceiling install checks: success.
- Windows suite: failure. All seven profile behavior tests hit `profile refused: linked worktree` from an ordinary temp checkout.
- Failure excerpts and counts: `ci-51686792-windows.txt`.

The guard compared resolved path strings, but Git for Windows can return equivalent git-directory paths through different short/long/case spellings. The corrected guard resolves both paths through the existing exported `canonicalCwd`, then compares them with the native `path.relative`. Different physical directories still refuse. This follows nana-handoff's shared canonical-path precedent rather than copying its helper.

## Every changed file, row and test

- `REQUIREMENTS.md`: R-3231 now explicitly accepts an enabled main checkout through equivalent git-directory spellings. Its implemented status and evidence title are unchanged. No new row or test was added.
- `packages/nana-pack/tests/profile-store.test.mjs::only a seat on an enabled machine may write`: strengthen the existing positive main-checkout assertion with a temp junction/symlink alias. An injected git result returns the alias for the git directory and the physical path for the common directory. The test still runs real local git for the save and sync. The link is unlinked in `finally` before temp cleanup. This new assertion models the platform variation on every host without repository writes.
- `packages/nana-pack/bin/nana-profile.mjs`: import `canonicalCwd` from `lib/adoption.mjs` and compare physical git directories, not their spelling.
- `docs/code-map.md`: regenerated for the extra public-helper import.
- Review records: this file, the linked first-run CI excerpts, the last-tip local suite record for the first commit, and the red/green/final-suite logs below.

## Wrong-code pair

The strengthened existing test ran against the uncorrected command first:

- `node packages/nana-pack/tests/profile-store.test.mjs` → exit 1. Exactly the write-eligibility test fails with the reproduced linked-worktree refusal. `wrong-windows-alias.txt`.
- After importing the existing canonical-path helper, the same command → exit 0. All eighteen tests pass. `windows-alias-fixed.txt`.

No assertion was inverted. The change repairs the code's path-identity comparison. No other must-meet or seal changed.

## Commands and suite

- `npm run map:impact -- packages/nana-pack/bin/nana-profile.mjs` → 0, before changing the module.
- `npm run map` → 0 (`map-windows-fix.txt`).
- `npm run req:tree` → 0 (`tree-windows-fix.txt`).
- `npm run test:locked` on first commit `51686792` → 0, foreground (`full-suite-tip-51686792.txt`).
- `npm run test:locked` on the corrected tree → 0, foreground (`full-suite-windows-fix.txt`).

```text
244 files: 242 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8785 pass, 0 fail, 44 skip · 631.6s
```

The final response names the correction commit, last-tip checks, draft PR and finished hosted run. The original build record still carries the complete row/test list, shape-copy provenance, sample run, departures and later-slice carry. This correction introduces no additional precedent departure or known-bug fix.
