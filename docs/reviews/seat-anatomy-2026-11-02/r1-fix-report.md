# Round 1 fixes — FEAT-042

## Closures

- MUST / R-3641: only assistant work, owner turns, tool results, queues and prompt hooks close the start window. The realistic boundary-to-snapshot fixture includes every attachment in the review's order, plus model. It pins two segments, standing payload throughout the compact segment, and no missing-start exclusions. LF/CRLF, trailing spaces/tabs and missing-final-newline variants pass.
- SHOULD 1: chose precise measurement wording rather than overriding the start-window contract. `apps/bench/README.md` and `seat-counts.md` say startup/clear instructions and snapshots after the first owner prompt count as turn payload. Missing-system means absent within the start window only.
- SHOULD 2 / R-3640: imported `desiredHooks` from `packages/nana-setup/lib/settings.mjs`; status labels are never retyped. Existing filename policy and shared-memory markers remain fallbacks. Commandless additional context uses the immediately preceding same-event hook's kind, subject to compatible invocation ids; an orphan remains hook-other.

## Files and rows

- `REQUIREMENTS.md`: narrowed/extended existing R-3640 and R-3641; no new IDs, features or tunables.
- `apps/bench/lib/anatomy-seat.mjs`: close-event predicate, imported status recognition, local preceding-hook attribution.
- `apps/bench/test/anatomy-seat.test.mjs`: two new tagged fixture tests required by this brief. Each public SessionStart label has a case, including commandless context; orphan case included.
- Existing assertion edited: R-3643 objective total adds nine chars because the existing `unsettled` additional-context payload now belongs to its preceding objective hook. No other existing assertion changed; no test deleted.
- `apps/bench/README.md`: start-window measurement limits.
- `docs/code-map.md`: regenerated import graph.
- `docs/reviews/seat-anatomy-2026-11-02/seat-counts.md`: regenerated real-transcript counts with the lane adapter and reportSlots directly in memory. Fourteen sessions, 72 segments. No transcript text, owner text or session ids were written or printed.
- Round-1 evidence files live beside this report.

## Mutation pairs

| Test | Wrong code | Wrong exit | Fixed exit | Evidence |
|---|---|---:|---:|---|
| R-3641 realistic compact attachment order | Original close-on-non-standing implementation | 1 | 0 | r1-wrong-code.txt, r1-seat-tests.txt |
| R-3640 public labels and commandless attribution | Original filename-only implementation | 1 | 0 | r1-wrong-code.txt, r1-seat-tests.txt |
| Same R-3640 test | New status recognition retained, preceding-hook attribution removed from code | 1 | 0 | r1-wrong-inheritance.txt, r1-seat-tests.txt |

No assertion was inverted. The original red run preceded implementation. Every async case is awaited under the existing per-case limit. Fixtures write only OS-temp directories. No suite test runs, imports or copies a seat script.

## Commands and exits

All commands below exited 0 except the intentional wrong-code runs (1).

- `npm run map:impact -- apps/bench/lib/anatomy-seat.mjs apps/bench/lib/anatomy-config.mjs` (before code edits).
- `node scripts/test.mjs anatomy-seat.test.mjs anatomy.test.mjs anatomy-labels.test.mjs memory-making.test.mjs memory-shaping.test.mjs memory-replay.test.mjs writing-trial-extractor.test.mjs`: 8 files, 142 checks passed. The filename selector also includes context-anatomy.test.mjs.
- `node apps/bench/test/anatomy-seat.test.mjs`: 13/13 checks.
- `SEAT_RECORD_GOLDEN="$TMPDIR/seat-anatomy-r1-golden.json" node apps/bench/test/anatomy-seat.test.mjs`, then `cmp "$TMPDIR/seat-anatomy-r1-golden.json" docs/reviews/seat-anatomy-2026-11-02/builder-golden.json`: byte-equal. The committed golden is unchanged.
- `node packages/nana-pack/tests/test-runner.test.mjs`.
- `npm run map`, `npm run map:check`, `npm run readme:check`.
- `NODE_NO_WARNINGS=1 node scripts/requirements-trace.mjs`.
- `NODE_NO_WARNINGS=1 node scripts/requirements-tree.mjs --check`.
- `node scripts/known-bugs.mjs --root .`.
- `node scripts/lane-class.mjs --root . --files apps/bench/lib/anatomy-seat.mjs,apps/bench/test/anatomy-seat.test.mjs,apps/bench/README.md,REQUIREMENTS.md`: ordinary.
- `git diff --check`.
- Real-count regeneration: `node "$TMPDIR/seat-anatomy-r1-counts.mjs"`. This one-off command imports `extractSeatContexts` and `reportSlots` from this lane, reads the canonical checkout's Claude project key, and renders counts only to seat-counts.md. It creates no private transcript store.
- `node scripts/identity-scan.mjs --root .` runs after staging.

## Precedent and limits

The existing streaming adapter, coalescing window, policy vocabulary, SLOT_MARKERS and public settings producer remain the precedents. No helper was copied or moved. The status source is imported through public desiredHooks, not extracted from private settings implementation. Departure: count regeneration calls the same public adapter/report functions in memory instead of the segment/store CLI, because this brief forbids writing transcript text.

No listed known bug was fixed or modified. No findings are claimed from function shares. The full suite is delegated to CI under AGENTS.md; no locked full suite or CI reader is run.

Not done: live `/context` comparison remains a seat-only task outside this fix brief. The previous private correction-label input was unavailable, so correction totals were not regenerated or inferred; the regenerated baseline explicitly states this limitation. No model sessions, subagents, GitHub issue operations or credential reads occurred.
