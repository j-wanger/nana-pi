# Merge build 4 technical record

VERDICT: DONE

Merged `origin/main` at `68a616bc35605e23d93955e8b40262e27115b843` into `feat/builder-credential-strip`, from lane tip `3dbb388b`.

## Files and rows

- `REQUIREMENTS.md`: preserved the lane's R-3436, R-3437 and R-3660 through R-3667 exactly. Every other row matches main, including main's R-1140 revision. No new requirement or behavior.
- `packages/nana-pack/bin/pi-worker.mjs`: retained main's shared `workerEnv` and `prepareWorker` functions. Applied the imported credential controls to the existing plain and lane builder boundaries. Main's role launches remain unchanged.
- `packages/nana-pack/rules/nana-rulings.md`: retained main's role-slot ruling and the lane's replacement CI ruling.
- `packages/nana-pack/tests/worker-claude.test.mjs`: moved the existing expected credential-env spread after the Bash timeout keys. Main's shared environment builder changed JSON insertion order. The two failing checks compare serialized objects; all expected keys, values and assertions remain unchanged. No test added or deleted.
- `docs/sessions/2026-10.md`: kept all entries whole and placed November 3 before November 2. No entry added or rewritten.
- `docs/code-map.md` and `docs/requirements-tree.md`: regenerated, not hand-merged.
- This review folder: merge evidence and report. All other incoming files retain main's bytes. The lane's existing READMEs, code, tests, known-bug lines and reviews remain.

## Evidence

Commands and standalone exits:

- `git merge --no-commit --no-ff origin/main`: 1, expected conflicts; resolved rows, shared launcher, rulings and generated map.
- `npm run map`: 0; `npm run req:tree`: 0.
- `node scripts/code-map.mjs --impact packages/nana-pack/bin/pi-worker.mjs`: 0. Departure: this was run after conflict resolution, not before it; this build preserves two existing implementations rather than designing behavior.
- `node scripts/test.mjs` with `context-anatomy`, `credential-gate`, `credential-strip`, `rulings`, `worker-claude` and `worker-lane` test paths: initially 1 (two key-order expectations), then 0. Final summary: 6 files pass, 134 checks pass, 0 fail, 3 checks skip.
- `npm run map:check`: 0.
- `npm run readme:check`: 0.
- `node scripts/requirements-trace.mjs`: 0.
- `node scripts/requirements-tree.mjs --check`: 0.
- `node scripts/known-bugs.mjs --root .`: 0; existing report-only FEAT-013 size notice remains.
- `node scripts/identity-scan.mjs --root .`: 0.
- Preservation comparison: 0; no non-lane file differs from main. All 258 prior-lane archive entries and 259 main entries remain whole, with 0 missing. Both lane known-bug files retain their prior bytes.
- `git diff --check` before staging: 0. `git diff --cached --check` after staging: 2, from inherited main review-record whitespace. Those files remain identical to main; this build does not clean them.
- `nana-writing --report`: checked. Its technical-path, identifier and report-shape findings stay because this brief requires those reproducibility fields; this technical record is outside the owner-prose rule.

Long outputs are the `merge-4-*.txt` files beside this report. Final-tip seat checks are repeated after the merge commit and reported in the final response.

## Precedent and limits

The October archive's earlier merge records establish the pattern: retain whole entries, preserve unrelated main deletions and regenerate both derived documents. This build follows that pattern. The brief specifically authorizes merging and ordering the archive; no narrative text was edited. No helper copied or moved.

Mutation pairs: none new or rerun; no new test or behavior in this merge. Earlier accepted mutation evidence remains in this folder. No known bug was fixed. Existing credential-strip residuals, including direct-ledger Claude recognition, incomplete README coverage and M5's phrase formatting, remain unchanged. Both known-bug files were preserved, not edited.

No locked full suite, install check, live model, subagent, issue operation, stored credential read or direct GitHub API call. CI covers the full suite. This brief's explicit push-and-stop instruction overrides the lane's newly shipped no-builder-push guidance for this merge build only. Push uses plain git; a credential failure stops the build.
