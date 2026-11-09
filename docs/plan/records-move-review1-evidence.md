# Records move: review 1 correction

Feature: FEAT-031. Changed rows: R-3928–R-3930. No new IDs.

## Closures

- M1: removed M1's live-repository assertion and moved records-move.test.mjs from land to module. The standalone command remains one-time move evidence, not a standing land restriction.
- S1: first-parent merge diffs now contribute recent changes. Restored the ten review folders requested in the brief from 5722fc03, byte for byte (143 tracked files).

Final baseline comparison: 136 kept folders; 212 removed folders, 3,288 files and 1,426,031 lines. Counts use git diff --numstat --diff-filter=D against 5722fc03. README and original evidence now distinguish corrected totals from historical counts.

## Tests and mutation pair

The existing M1 fixture now creates an old side-branch change merged after the cutoff. Its CRLF, trailing whitespace and no-final-newline loops also exercise merge-history parsing. No new tests or test files were added; none were deleted.

Wrong code: original git log --name-only, without merge diffs. `node scripts/test.mjs records-move` exited 1: M1 failed, five other cases passed. Correct code: --diff-merges=first-parent. The touched run exited 0: eight files, 50 checks passed. Assertions were not inverted.

Existing test edits: removed the live-repository assertion; extended M1's temporary fixture and expected protected set with a merge-only folder. Other assertions remain unchanged. The fixture uses the existing tmpDir helper and awaited per-case check harness.

## Commands before commit

All outputs are in sibling records-move-review1-*.log files.

- `node scripts/test.mjs records-move`: 1 against wrong code.
- `node scripts/test.mjs records-move test-packs memory-run`: 0; 8 files, 50 checks passed.
- `node scripts/records-move.mjs`: 0; 136 protected, 0 problems.
- `npm test -- --pack=land --jobs=4`: 0; 71 files passed; 2,413 checks passed, 6 skipped.
- `npm run map:check`: 0.
- `npm run readme:check`: 0.
- `node scripts/requirements-trace.mjs`: 0; 2,720 rows, 2,030 traced.
- `node scripts/requirements-tree.mjs --check`: 0; 0 problems.
- `git diff --check`: 0.

Removed text search: all removed nonempty lines from changed requirements, READMEs, test, config and checker were searched in test files; no matches (rg exit 1). No paths or filenames were removed or renamed in this correction.

## Boundaries

Read the named precedent scripts/records-move.mjs before design. Kept its existing Git runner, policy injection and diagnostics; no departures, new helpers, changed return contracts or changed callers. The impact report identified records-move and memory-run tests; both passed.

Read the whole FEAT-031 known-bug file. Added S2 (per-file hashing cost) and S3 (relative reference paths) as one line each. Neither is claimed fixed. No prior known-bug line was removed or edited.

CI covers the full suite per AGENTS.md. No full-suite fallback, Windows run, install check, push, CI read, issue action, credential access or model session was performed. No open questions.
