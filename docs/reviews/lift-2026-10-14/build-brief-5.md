# Lane lift — build brief 5 (2026-10-15 · feat/lift · tip after the seat's records commit)

**Builder: Claude Sonnet 5.** Build 4 holds: the seat's mutation runner at `9eadde0` caught 60 of 60 code breaks with
none surviving, and the independent check (`seat-verify-9eadde0.md`) ran about 600 default lifts and 600 regroups —
CRLF, BOM, mixed endings, fences, owner sections — with no line lost but one. This short pass closes that one and two
pinning gaps. Build briefs 1–4's rules all hold: run only the touched test files, in the foreground, each tool call
under 5 minutes; never `test:locked`, the seat's runner, or anything that waits on a background job. Commit after each
item. The repro inputs are in `verify-9eadde0/` (copies of the checker's scratch files; `run.sh` names scratch paths —
read it for the steps, do not run it).

1. **A plain 4-column table loses its header (MUST 1).** A table that is not a requirement table — e.g.
   `| Term | Meaning | Source | Since |` under a `#` Part, or a section holding only such a table — loses its header and
   delimiter lines, and `--write` and `--verify` both exit 0 (`verify-9eadde0/tbl4.md` flat, `tbl4c.md` tree-form).
   The writer (`scripts/requirements-lift.mjs:636`, prose mode), the region matcher (`scripts/requirements-lift-proof.mjs:438`)
   and the count (`proof:562`) all drop any 4-cell header and delimiter pair. Treat a header/delimiter pair as a
   requirement-table header only when the next non-blank line is a requirement row (`requirementRowId`); every other
   table's lines are ordinary carried lines, kept and counted. Test, `// req: R-1163`, red first on today's code:
   `R-1163: a 4-column table that holds no requirement row keeps its header and delimiter lines, flat and tree-form`
2. **Pin the write gate and the mapping-mode heading check (MUST 2).** With the `--write` proof gate removed (G4),
   `verify-9eadde0/map-emptypurpose.json` writes a ledger that fails the tree check; with the mapping-mode heading-sequence
   check removed (P6b), `map-nolabel.json` writes `## FEAT-050 · undefined`. Both exit 0 today only when the check is
   gone — add one test each that reds when its check is removed, `// req: R-1163` and `// req: R-1164`:
   `R-1164: --write refuses a mapping whose output fails the proof, writing nothing` and
   `R-1163: a mapping node with no label is refused by the mapping-mode heading check`.
3. **Name every problem (R-1167, SHOULD).** The carried-field-label refusal fires on head and tail lines, which are
   carried verbatim and harmless (yokai-world line 50; nana-pi's own ledger line 64), and the run stops at the first
   refusal stage. Exempt head and tail lines from the field-label refusal, and run every base refusal stage so one run
   names every problem (capped at `PROBLEM_LINE_CAP`). Test, `// req: R-1167`:
   `R-1167: one refusal names every base problem, and a field-labelled line in the head or tail is not one`.
4. **`--verify`'s own copies of the mapping-file refusals** (NUL, encoding, version, invalid JSON — copied in by build
   4 §B) are not pinned by any test. Add the four cases to the `--verify` test under its existing title or one new
   title, `// req: R-1168`.
5. **A fenced table example inside a section is refused** (`verify-9eadde0/fence.md`; fail-closed, not a loss). If the
   fix is the same rule as item 1 (a fenced block is carried as is), apply it with a test; otherwise list it in the
   report and leave it.

Do not change any row's text; add new titles to the cited rows' evidence. Do not touch `CHANGE.md`, the seat's files in
this folder, `HANDOFF.md` or `docs/sessions/`.

## Done
The touched test files green; `node docs/reviews/lift-2026-10-14/seat-titles.mjs 1` → `0 missing`;
`node docs/reviews/lift-2026-10-14/acceptance.mjs > docs/reviews/lift-2026-10-14/acceptance-output.txt 2>&1` → only the
seat's HANDOFF/session case misses (item 3 should clear the yokai-world case); `node scripts/requirements-tree.mjs --check`;
`node scripts/code-map.mjs --check`; `npm run -s readme:check`. Commit, push.

## Report
≤ 20 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each item with the red you saw first; the touched
test files' summary lines; the last line of each seat output; the one claim most likely wrong.
