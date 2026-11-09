# Records move: post-baseline folders

Feature: FEAT-031. Rows changed: R-3929, R-3934. No IDs added.

The checker judges only baseline folders. Protected folders retain their existing missing-folder and byte-preservation checks. Unprotected baseline folders must be absent. Later folders are allowed without a lane-name list.

## Regression and mutation pair

`folders created after the pre-move commit pass` creates and commits `docs/reviews/packs-win-skip/record.md` after pinning a synthetic baseline. With the original code (the obvious wrong implementation), the case fails; the runner exits 1. With the baseline-membership guard, it passes; the touched run exits 0. Assertions were not inverted. See `records-move-followup-red.log` and `records-move-followup-tests.log` in this folder.

## Existing tests changed

- M1 now rejects and removes the baseline `ci-packs-2026-11-08` folder instead of exempting it.
- The policy seal no longer pins open-lane names; commit and cutoff assertions remain.
- Memory-run M4 removes the obsolete `openLane` import and exemption. Its synthetic baseline selection already restricts candidates to baseline folders.

The removed exported function had only two callers: the checker and memory-run M4. Both were updated. No shared helper was copied. The checker remains the precedent; no departures.

## Commands before commit

- `node scripts/test.mjs records-move`: 1, original implementation; 4 checks pass and 2 fail, including the new regression.
- `node scripts/test.mjs records-move test-packs memory-run`: 0; 8 files, 50 checks pass.
- `npm test -- --pack=land --jobs=4`: 0; 72 files, 2419 checks pass, 6 skip.
- `node scripts/records-move.mjs`: 0; 126 protected, 0 problems.
- `npm run map:check`: 0.
- `npm run readme:check`: 0.
- `node scripts/requirements-trace.mjs`: 0.
- `node scripts/requirements-tree.mjs --check`: 0.

Long command output is in the sibling `records-move-followup-*.log` files. Trace warning paths were normalized to repository-relative paths.

Tests were searched for the removed policy sentence, clause and identifiers. No obsolete `openLane` or `openLanes` references remain in tests. No paths or files were renamed or removed. The old plan and evidence remain historical records.

The complete FEAT-031 known-bug file was read. None of its listed bugs is touched; no known-bug lines were changed. The brief's post-baseline-folder failure is fixed.

CI covers the full suite per AGENTS.md; no local full-suite fallback, Windows run, push or CI read was performed. No test files were added or removed. No open questions.
