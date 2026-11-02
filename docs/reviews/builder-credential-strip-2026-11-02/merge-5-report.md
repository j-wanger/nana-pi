# Merge build 5 technical record

VERDICT: DONE

Merged `origin/main` at `f6a475658217bed9cb58b9413dd21f35e8b11673` into `feat/builder-credential-strip`, from `23cb12196378ea039a8b5fe63412caeea49bc947`.

## Files and rows

The merge applied without conflicts. Every non-lane file is identical to origin/main, including main's deletions. The lane file set is the diff from the merge base to the pre-merge HEAD; the post-merge comparison found zero paths outside that set.

- `REQUIREMENTS.md`: R-3436, R-3437 and R-3660 through R-3667 retain the pre-merge lane bytes. Every other row matches main. No rows added or rewritten.
- `docs/code-map.md` and `docs/requirements-tree.md`: regenerated with their generators, never hand-merged.
- `docs/sessions/2026-10.md`: automatic merge preserves every whole entry from both parents; 260 entries from each parent, zero missing. November 3 remains before November 2. No narrative added or rewritten.
- All existing lane code, tests, READMEs, guidance, reviews and known-bug changes remain. Both lane known-bug files and every prior lane review file retain their pre-merge bytes.
- `merge-5-*.txt` and this record: local evidence in the lane review folder.

## Commands and exits

- `git merge --no-commit --no-ff origin/main`: 0.
- `npm run map`: 0.
- `npm run req:tree`: 0.
- `node scripts/test.mjs` with the six test paths below: 0.
  - `packages/nana-pack/tests/context-anatomy.test.mjs`
  - `packages/nana-pack/tests/credential-gate.test.mjs`
  - `packages/nana-pack/tests/credential-strip.test.mjs`
  - `packages/nana-pack/tests/rulings.test.mjs`
  - `packages/nana-pack/tests/worker-claude.test.mjs`
  - `packages/nana-pack/tests/worker-lane.test.mjs`
- Touched-test summary: 6 files pass; 134 checks pass, 0 fail, 3 skip.
- `npm run map:check`: 0.
- `npm run readme:check`: 0.
- `node scripts/requirements-trace.mjs`: 0.
- `node scripts/requirements-tree.mjs --check`: 0.
- `node scripts/known-bugs.mjs --root .`: 0.
- `node scripts/identity-scan.mjs --root .`: 0.
- Read-only preservation comparison: 0; no non-lane differences, every row agrees with its designated parent, every archive entry remains whole, prior reviews and known-bug files unchanged.

The first final-tip run passed every command except identity scan (exit 1): two newly tracked warning logs exposed absolute home paths. An evidence-only follow-up replaces those paths with `<lane>` in the saved trace and known-bugs logs. No product or test changes. All required checks run again on the corrected final commit before push; their final-tip results belong in the closing report.

## Precedent, known bugs and limits

Read the entire October archive and followed its merge pattern: whole entries, unrelated main deletions preserved, generated documents regenerated. No departure from that precedent. The brief's explicit preservation-and-order instruction authorizes the automatic archive merge; no manual archive edit occurred. No mapped code was edited, so no new impact analysis was needed.

Read the complete FEAT-006 known-bug file. This merge preserves, but fixes none of, the existing credential-strip lines: direct script access, child removal of controls, managed-policy precedence, no Claude text gate, advisory load path, old push ruling, invalid-count stack, out-of-scope launchers, recorded settings limits, command-name-only Claude recognition, incomplete direct-ledger README coverage and M5 phrase formatting. The prior land-review confirmation line also stays unchanged. The lane's existing FEAT-002 line removal remains; this merge introduces no further known-bug change.

Mutation pairs: none new or rerun; behavior is unchanged. No test added, edited or deleted. Earlier accepted wrong-code evidence remains intact.

Not run: locked full suite (CI covers it), install check (no setup or hook code changed), live model, subagent, GitHub issue operation or direct API call. No stored credential read, printed or used. The brief's explicit push instruction overrides this lane's shipped no-builder-push guidance for this merge only. Push uses plain git and stops on any credential failure. No CI run will be read.
