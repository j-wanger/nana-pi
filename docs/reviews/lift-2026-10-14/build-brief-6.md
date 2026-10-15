# Lane lift — build brief 6 (2026-10-15 · feat/lift · tip after the seat's records commit)

**Builder: Claude Sonnet 5.** Build 5 holds: the independent recheck (`seat-verify-f6b34d4.md`) found no MUST — about
2,400 fuzzed lifts and regroups and the four real-ledger copies lost, duplicated, changed or invented nothing — and the
seat's runner caught 70 of 71 code breaks. Three small items remain, each failing safe today. Build briefs 1–5's rules
all hold (touched test files only, in the foreground, each tool call under 5 minutes; commit after each item).

1. **A test that cannot fail.** `packages/nana-pack/tests/requirements-lift.test.mjs:1539` checks
   `/line 2: carried prose starts with a field label/`, but the fixture's `Purpose:` intro line is line 3, so the head
   half of the field-label exemption is unpinned (the seat's pair T3/1 survived). Match the right line (`line 3:` or
   `("Purpose:")`), and show it red with the head half of the exemption removed.
2. **The adopt template's empty first-feature table is refused** (`verify-f6b34d4/adopt.md`, the adopt render's own
   shape: a `proposed` feature with an empty requirement table). The proof's matcher at
   `scripts/requirements-lift-proof.mjs:489` still drops any exact header and delimiter pair whether or not a row
   follows; the checker's one-line fix — add `&& isTableHeaderAt(regionBare, i)` there — made it write and verify
   lossless, with 400 fuzz cases clean. Apply it (or the equivalent), with a test, `// req: R-1163`, red first:
   `R-1163: an empty requirement table under a proposed feature is carried, header and delimiter included`.
3. **A crash where a refusal belongs.** `verify-f6b34d4/combo2.md` (base problems plus a level-3 section with no
   level-2 parent) hits a TypeError at `scripts/requirements-lift.mjs:336`, because the default mapping builder now runs
   after base problems are found. Name the problems instead (do not build the default when the base refusals already
   refuse, or guard the builder). Test, `// req: R-1167`, red first:
   `R-1167: a ledger with base problems and a subgroup with no feature above it is refused naming its problems, never a crash`.

Do not change any row's text; add the new titles to the cited rows' evidence. Do not touch `CHANGE.md`, the seat's
files in this folder, `HANDOFF.md` or `docs/sessions/`.

## Done
The touched test files green; `node docs/reviews/lift-2026-10-14/seat-titles.mjs 1` → `0 missing`;
`node docs/reviews/lift-2026-10-14/acceptance.mjs > docs/reviews/lift-2026-10-14/acceptance-output.txt 2>&1` → only the
seat's HANDOFF/session case misses; `node scripts/requirements-tree.mjs --check`; `node scripts/code-map.mjs --check`;
`npm run -s readme:check`. Commit, push.

## Report
≤ 12 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each item with the red you saw first; the touched
test files' summary lines; the last line of each seat output.
