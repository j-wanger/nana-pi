# Build 1: anatomy-label-check

VERDICT: PARTIAL

The eight must-meets and three seals pass. The protected known-bugs folder remains unchanged: the lane instructions prohibit editing it, while the Build section requests five additions there. The seat must resolve that conflict and record the carries below. No private store, filled private sheet or model endpoint was read.

## Files and rows

- `REQUIREMENTS.md`: R-3399–R-3406 added under FEAT-042, no shares or artifact reader declarations changed. All eight rows are implemented; R-3401 and R-3404 also cite their seals.
- `apps/bench/test/anatomy-labels.test.mjs`: eight tagged must-meets and three tagged seal cases appended. Existing test bodies and assertions are unchanged. The imports and module purpose include the readers.
- `apps/bench/lib/anatomy-measures.mjs`: shared distinct-key index, pure model-label transform, both share views, residual counts, dual-source sample, model agreement, per-key weights, disputed weights and deduplicated pooling.
- `apps/bench/lib/anatomy-labels.mjs`: imports the moved distinct-key helper; resume and the new read-only reader share per-row validation. The reader owns A-098's file reads, so existing reader declarations remain correct.
- `apps/bench/lib/anatomy-config.mjs`: seals 15, 60 and 40 with provenance.
- `apps/bench/lib/anatomy.mjs`, `apps/bench/anatomy.mjs`: value flags, boolean heavy flag, shared reader dispatch, fixed diagnostics and input header.
- `apps/bench/README.md`: commands, output fields, weights, denominators, privacy, partial-store behavior and interpretation notice.
- `docs/code-map.md`, `docs/requirements-tree.md`: regenerated.
- This folder's text logs: synthetic red/green and repository check evidence.

## Precedent

All named precedent files were read, including Part 1's measurement instructions, `plan.mjs`, `catch-stats.mjs`, both anatomy test files and `outcome-score.mjs`.

The implementation follows the defaults: `distinctUnits` moved into measures; labels owns `readLabels`; CLI imports it; κ and seeded order use the existing catch-stats exports. The legacy report is reused after a pure label transform. The existing `pair`, `sheet` and `counts` helpers remain private in their owning module and are reused there.

The moved distinct-key index also retains occurrences, normalized emptiness, representative rule label and safe parts in memory. This extension supplies all readers from one key computation, rather than copying normalization or maintaining another index. None of those private fields enters printed objects.

Departure: the five requested known-bug additions were not made because the lane scope explicitly prohibits editing `docs/known-bugs/`. No behavioral departure from the plan defaults is intended. Unlabelled keys on partial stores are omitted from sheets and counted, as documented; reports retain them as `unlabelled`.

## Wrong-code pairs

1. Base implementation rejects model-label reader flags and has no seals → final tests against archived HEAD dependencies: exit 1, 19/30 passing, all eight new must-meets and all three seals red (`wrong-main.txt`). The first run preceded implementation. A repeat with the corrected fixtures again failed all eleven new cases.
2. Current-context-first representative chars instead of the valid stored-id representative → R-3402 red, exit 1, 29/30 (`wrong-representative.txt`). Shared stored-id blind text fixes the code; the assertion stays unchanged, final 30/30 green.

3. Treating an unterminated whitespace-only final line as a torn JSON row → R-3405 red, exit 1, 29/30 (`wrong-blank-tail.txt`). Comparing parsed rows with nonempty lines fixes the code; real torn rows still refuse, and the final case is green.

The R-3399 fixture correction avoids a synthetic cwd substring colliding with its branch. The R-3402 unflagged oracle compares JSON values, so omitted undefined build metadata does not create a false failure. Neither correction changes an old test.

## Commands and exits

| Command | Exit | Evidence |
| --- | --- | --- |
| `node apps/bench/test/anatomy-labels.test.mjs` | 0 | `build-tests.txt`: 30/30 |
| `node apps/bench/test/anatomy.test.mjs` | 0 | `legacy-tests.txt`: 9/9 |
| `npm run map` | 0 | `map-write.txt`: 574 modules |
| `npm run map:check` | 0 | `map-check.txt`: 0 problems |
| `npm run readme:check` | 0 | `readme-check.txt`: 1060 claims, 0 problems |
| `node --experimental-strip-types scripts/requirements-trace.mjs` | 0 | `trace-check.txt`: 2408 rows, 2153 traced, 0 off form |
| `npm run req:tree` | 0 | `tree-write.txt` |
| `node scripts/requirements-tree.mjs --root .` | 0 | `tree-check.txt`, including deliverables |
| `node scripts/known-bugs.mjs --root .` | 0 | `known-bugs-check.txt`: names=0 sizes=0 |
| `node --experimental-strip-types packages/nana-pack/tests/requirements-deliverables.test.mjs` | 0 | `deliverables-check.txt` |
| Title citations via imported `scanSource` over the eight affected rows | 0 | `title-check.txt`: 11 checked; 0 missing |
| `node scripts/identity-scan.mjs --root .` | 0 | `identity-check.txt`: 0 findings |
| `node scripts/lane-class.mjs --root . --files <changed-code-paths>` | 0 | `lane-class.txt`: ordinary |

An initial tree generation refused the blank line separating new rows from the feature table; removing that blank line fixed placement. An initial whole-repository archive exceeded the process buffer; the repeated red run archived only the actual library dependencies and temp helper. Neither failure was treated as a green check.

The title check, identity scan and lane classification are recorded separately. All required checks are rerun on the committed tip before push. CI covers the full suite; the local locked suite is intentionally not run. No CI run is awaited or read.

## Known bugs touched and remaining work

The readers make the rule-share and rare-function measurement gaps testable; they do not close those two known bugs. Closure requires the seat's ordered private measurements and bars. The unmatched-brief and three assembly bugs are untouched. Resume's validation uses the shared predicate without changing repair, fingerprint, folder creation or manifest-count behavior.

The seat must record these five Part 1 carries after resolving the protected-folder conflict:

- `label --resume` repairs a torn tail by rewriting `labels.jsonl` in place, so a kill during the rewrite can lose rows.
- The effort and order-seed fingerprint refusals, and resume's checkout refusal, have no test.
- `label --resume` does not compare input-store counts with the manifest.
- `label --resume` on a missing folder creates an empty folder before refusing.
- Only a unit's own worktree path is masked; another build's path or a home path inside its text can reach the model.

The builder did not run the seat measurement, label sheets, interpret real shares, remove known bugs, launch other model sessions, modify HANDOFF or session archives, or write either protected temporary reference folder. The draft PR leaves review and CI to the seat.
