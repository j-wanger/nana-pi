# Merge build 1 — technical record

VERDICT: DONE

## Merge and preservation

- Branch: `feat/curation-merge-chain`.
- First parent: `33b72899d631e11a47d6eb387c6d296d1ed3bf0e`.
- First merged main: `a66c0602d027b79ca170d463e05fc46402128374`.
- First merge commit: `965d62f0d0d4b3c8eb321b650a75e63861ed3039`.
- The shared origin/main ref advanced during final-tip checks to `99fd0d18dc68bc7282e56275efe1ea972e210070`. A second merge incorporates it; both merges applied without conflicts.
- All thirteen named checks passed on the first merge. The final diff-stat equality check then failed (exit 1) because the main ref had advanced, not because lane files changed. The second merge repeats generators and checks against the newer main.
- `git fetch origin`: exit 0. `git merge --no-commit --no-ff origin/main`: exit 0.
- Conflicts: none. No overlapping main/lane change required manual reapplication.
- All non-lane files match main, including main's deletions. The final diff stat is recorded separately.
- The three lane modules and two test files retain their pre-merge bytes. Main had not changed them since the branch base.
- R-3698 through R-3702 remain unchanged. SUB-027 moves under FEAT-040; all 18 existing rows match main verbatim.
- The pack README retains the chain paragraph. The known-bug skip line remains unchanged; no known bug was fixed in this merge.
- Both generators ran successfully. The regenerated code map matches main; the requirements outline records the lane's tree move.

## Files and verification

Lane files: `REQUIREMENTS.md`, `docs/requirements-tree.md`, `docs/known-bugs/FEAT-040.md`, `packages/nana-pack/README.md`, the three modules and two tests listed in `merge-1-preservation.txt`, and this review folder.

- `npm run map`: exit 0.
- `node scripts/requirements-tree.mjs --write`: exit 0.
- Seven named test commands: each exit 0; see `merge-1-tests.txt`.
- `npm run map:check`, `npm run readme:check`, `node scripts/requirements-trace.mjs`, `node scripts/requirements-tree.mjs --check`, `node scripts/known-bugs.mjs --root .`: each exit 0; see `merge-1-checks.txt`.
- The known-bugs check reports one existing size note, not a failure. The trace reports 2232 implemented rows traced by tests.
- Identity scan runs after explicit staging. Final-tip checks repeat after committing without changing tracked files.
- No new tests, test edits, mutation pairs or tunables: this build only merges main. Prior lane mutation evidence remains in `wrong-code.txt`.

## Departures and limits

- From the older merge precedent: no push and no archive edit, because this brief expressly forbids both. No heading-count test replacement was needed.
- Two merge commits rather than one: the shared remote-tracking ref advanced during verification. The second merge restores the required diff against current origin/main.
- From Revision 2: none. Its read-side chain implementation and separate absorbed set are preserved without new behavior.
- Merge commits cannot use path-limited commit mode; paths are staged explicitly and the merge commits the resolved index with a message file under the shell temporary directory.
- Two preservation-command attempts failed before a successful run: shell backslash parsing (exit 1), then the default Node child-process buffer (exit 1). Neither changed product files. The successful check used a larger buffer.
- Logs replace the checkout path with `<repo>` before staging.
- No full suite, push, CI access, GitHub API call, real owner store access, stored credential access or new model session. CI remains the suite.
- The session's stale-install notice remains for the seat; installation was outside this merge brief.
