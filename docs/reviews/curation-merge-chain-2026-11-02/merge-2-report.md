# Merge build 2 — technical record

VERDICT: DONE

## Merge inspection and resolution

- Branch: `feat/curation-merge-chain`.
- Previous merge: `965d62f0d0d4b3c8eb321b650a75e63861ed3039`, merging `a66c0602d027b79ca170d463e05fc46402128374`.
- Resumed merge: first parent `965d62f0d0d4b3c8eb321b650a75e63861ed3039`, second parent `99fd0d18dc68bc7282e56275efe1ea972e210070`.
- Startup `git status`, `git diff --cached --stat` and `git log -1 MERGE_HEAD`: exit 0 each. Git reported all conflicts fixed, still merging.
- The staged incoming changes were the newer credential-gate lane and generated documentation. No unmerged entries existed. The prior builder recorded both merges as conflict-free; no conflict was repaired here.
- Every staged non-lane file equals MERGE_HEAD, including main's deletions. The three lane modules and two lane tests equal baseline `33b72899` byte-for-byte.
- SUB-027 remains under FEAT-040. All 18 existing rows retain main's text; R-3698 through R-3702 retain lane text. The README paragraph and existing skip known-bug line remain.
- No manual reapplication, abort or fetch was needed: the staged merge was trusted after comparison and origin/main equals MERGE_HEAD.
- Startup also contained interrupted edits to three merge-1 evidence files and the untracked build-2 brief. These remain in this review folder and are included in the resumed merge.

## Files, rows and evidence

Lane-only diff: `merge-2-diff-stat.txt`. Preservation proof: `merge-2-preservation.txt`.
Product files retained: `REQUIREMENTS.md`, `docs/requirements-tree.md`, `docs/known-bugs/FEAT-040.md`, `packages/nana-pack/README.md`, `packages/nana-pack/lib/profile-store.mjs`, `packages/nana-pack/lib/memory-curation.mjs`, `packages/nana-pack/bin/nana-curate.mjs`, `packages/nana-pack/tests/memory-curation.test.mjs`, `packages/nana-pack/tests/profile-store-guards.test.mjs`, and this review folder. The code-map generator leaves `docs/code-map.md` equal to main.

- No new rows, tests, test edits, tunables or behavior. No new mutation pairs; prior lane wrong-code evidence remains in `wrong-code.txt`.
- No known bug fixed. The existing FEAT-040 skip limitation is preserved, not changed. Incoming main's FEAT-006 known-bug file is unchanged from MERGE_HEAD.
- `npm run map`, `node scripts/requirements-tree.mjs --write`: exit 0 each; `merge-2-generators.txt`.
- Seven tests, sequentially: `node packages/nana-pack/tests/<name>.test.mjs`, with names `memory-curation`, `profile-store-guards`, `profile-store`, `profile-sync`, `memory-shaping`, `test-runner`, `requirements-tree`: exit 0 each; `merge-2-tests.txt`.
- `npm run map:check`, `npm run readme:check`, `node scripts/requirements-trace.mjs`, `node scripts/requirements-tree.mjs --check`, `node scripts/known-bugs.mjs --root .`: exit 0 each; `merge-2-checks.txt`.
- Identity scan runs after explicit staging. All thirteen named checks repeat on the final commit without changing tracked files; their exact results and full tip are in the final response.
- Extra `git diff --cached --check`: exit 2, inherited whitespace in incoming main's credential-gate review evidence. Those non-lane files remain identical to main rather than being cleaned here.

## Departures and omissions

- Older precedent's push and archive edit are superseded by this brief: neither performed. No heading-count test replacement needed.
- Merge commits reject path-limited commit mode. Explicit paths are staged; the merge commits that index using a message file under the shell temporary directory.
- No implementation departure: the existing read-side chain fix and separate absorbed set remain unchanged.
- No full suite (CI covers it), push, CI read, model session, owner store access, credential access or GitHub API call.
- The stale installed rulings notice remains for the seat. Installation is outside this merge brief.
