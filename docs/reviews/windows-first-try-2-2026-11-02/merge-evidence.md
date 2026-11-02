# Merge build evidence

Merged origin/main at 6ad0b67c7b2ed3270332552db4b960228b726265 without behavior changes.

## Files and rows

- Kept R-3540 and R-3541, both test helper modules, both changed test files and the existing review folder.
- Regenerated docs/code-map.md and docs/requirements-tree.md with their generators.
- Recorded four round 1 notes in docs/known-bugs/FEAT-031.md and the replaced-history note in docs/known-bugs/FEAT-013.md.
- Added one newest-first session entry in docs/sessions/2026-10.md. Every pre-existing entry is byte-identical to origin/main.
- All files outside the lane's scope match origin/main. No README difference remains against main; this build made no README edit.
- No new requirement, test, tunable or mutation pair. No existing test edit in this build. Earlier test edits remain unchanged: golden retries and stricter control; R-1713 diagnostic state.
- Precedent: followed the latest session entry's short-sentence style, newest first. No departure.

## Commands

All successful commands below exited 0; full output is in merge-*.log beside this record.

- npm run map
- npm run req:tree
- npm test -- packages/nana-pack/tests/objective-golden.test.mjs packages/nana-setup/tests/hooks-win32-exec.test.mjs — 2 files: 1 PASS, 0 FAIL, 1 SKIP; 1280 checks passed. Windows-only execution is left to CI.
- npm run map:check
- npm run readme:check
- node scripts/requirements-trace.mjs
- node scripts/requirements-tree.mjs --check
- node scripts/known-bugs.mjs --root .
- node scripts/identity-scan.mjs --root .
- nana-writing <temporary file containing only the new session entry> — no findings.
- git diff --check
- Preservation comparison — unrelated changed files: 0; existing session entries byte-identical.

An initial preservation comparison exited 1 because git show's output exceeded Node's default buffer; the rerun with an 8 MiB buffer passed. The first writing pass found one passive sentence; the active rewrite passed. Help probes were not checks: nana-writing treated --help as a missing file, and requirements-tree --help exited 2 with usage.

The post-commit identity scan initially exited 1 on absolute checkout paths in two newly tracked warning logs. Those paths are now redacted as <worktree>. The known-bugs check exits 0 with one report-only FEAT-013 size note (51,503 bytes, 205 lines).

CI covers the full suite. No locked full suite, model session, seat script, GitHub issue write or prohibited temp-path write ran. Known bugs remain open; this build only records the five specified review notes.
