# Brief 5: leak-guard, round 1 fixes

Feature: FEAT-041 · Shape each agent's context by role

Round 1 sent the lane back (the review record is kept in this folder). Fix these, and nothing else:

1. MUST: off Windows, the temp root matches only `realpathSync.native(tmpdir())` (on macOS `/private/var/folders/...`), not the given spelling `os.tmpdir()` (`/var/folders/...`). A lane commit holding `${os.tmpdir()}/x/log` scans clean and gets pushed. 48 tracked files today carry the short spelling. Match both the given and the real spelling of home and temp on every platform, not only win32. Add a test that injects a given and a real spelling that differ and expects one temp hit for text holding either.
2. SHOULD, fix now because it defeats the gate's purpose: the scan reads only the tip version of each file, so a leak in an earlier commit that a later commit removed still reaches the remote with the branch history. Scan every blob version the range introduces: each commit in `base..tip`, and each added or modified file at that commit. Report a hit with the commit's short hash beside the path. Add a test with a leak in commit 1 that commit 2 removes; it must be flagged.
3. NOTE, fix now (one line): when `--base` names a ref the tip doesn't descend from directly, scan from `git merge-base <base> <tip>`, so main's own later changes aren't scanned at the lane's older version. Say so in the CLI's usage text.

Keep R-3748 to R-3756's existing behaviour otherwise, and keep committed evidence repo-relative.

## Precedent
- `packages/nana-pack/lib/leak-scan.mjs` — the matcher and the range reader.
- `packages/nana-pack/tests/leak-scan.test.mjs` — the lane's tests.

Report: the tip, the tests run, and a mutation pair for each new test.
