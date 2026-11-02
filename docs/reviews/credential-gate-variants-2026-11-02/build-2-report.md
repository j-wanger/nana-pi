# Build 2 technical record

Feature: FEAT-006 · Launch builders with execution limits

Merged origin/main a66c0602d027b79ca170d463e05fc46402128374. Outside this lane's existing changed paths, the merged files match origin/main. Generated code map and requirements outline were regenerated.

## Change

- `REQUIREMENTS.md`: clarified R-3663's quoted PowerShell corpus and R-3667's argument-only placeholder scope. No new rows or shares.
- `packages/nana-pack/extensions/nana-gate.ts`: preserve whitespace in the exposed command word; retain the existing placeholder map for arguments.
- `packages/nana-pack/tests/credential-gate.test.mjs`: added the four requested quoted commands to the existing blocked corpus. M4 now aggregates refusals, following M1's existing pattern, rather than stopping at the first missing refusal. No existing expectation was removed or weakened. Existing M2 checks the same corpus with no role on both tools.
- No new tunable or helper. No precedent departure: retain the gate's placeholder and the credential test's corpus/role/tool harness. Read the session precedent for the credential-strip behavior; no session archive was authored.

## Wrong-code pair

`build-2-wrong-code.txt`: the unchanged sealing implementation returns no refusal for all four additions, for worker and reviewer on both tools (16 missing refusals); M4 fails, exit 1. After the argument-only fix the same test passes, exit 0. Assertions are unchanged between the red and green runs.

## Verification

- `node scripts/test.mjs credential-gate credential-strip gate-survives-mutation gate-corpus test-runner context-anatomy config-gate-fallback requirements-trace known-bugs`: exit 0; 10 files, 457 pass, 0 fail, 0 skip. Includes the existing parallel runner test selected by the test-runner substring. Output: `build-2-green.txt`.
- `npm run map`, `npm run req:tree`: each exit 0 (`build-2-generators.txt`).
- `npm run map:check`, `npm run readme:check`, `node scripts/requirements-tree.mjs --check`, `node scripts/known-bugs.mjs --root .`, `node scripts/requirements-trace.mjs`: each exit 0 (`build-2-checks.txt`).
- `node scripts/identity-scan.mjs --root .` after explicit-path staging: initially exit 1 on generated local path diagnostics; replaced the worktree path by `<worktree>` in the two logs, staged them again, then exit 0 with findings=0.
- Seat mutation runner on d26d69302ebdb73e7b33977b1cde57f6ceb8dafe: exit 0; all six pairs red, none survived (`build-2-seat-mutate.txt`). All named titles are red; V2 and V6 also fail M4.

## Limits and departures

An attempted `node scripts/test.mjs --help` probe unexpectedly started an unfiltered run because the runner does not implement help. The command timed out after 30 seconds; no full-suite result is claimed. The locked full suite was not run. CI remains the suite; no CI was read and nothing was pushed.

The merge commit uses explicit-path staging for authored files; git requires the merge commit itself to omit path arguments. Main's merge-selected paths were already staged by git.

No known-bug fix was attempted. The credential gate's direct-text-only and advisory-load-path limits remain, as does the credential-gate-variants long-command performance note. No stored credential, model session, GitHub API, issue, or prohibited temp directory was used.
