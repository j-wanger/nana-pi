# Lane req-tree — continuation 2: close sol build-review r1 (SEND-BACK 5/10)   (2026-10-09 · feat/req-tree)

Contract unchanged (`CHANGE.md`, `build-brief.md`, approved commit
`6b9202a501a7fe03dfc834ab34cdfc212f6d92ce`). sol's review is `sol-build-r1.md` beside this brief —
read it in full. The move itself passed every byte attack; the findings are in
`scripts/requirements-tree.mjs`, its test, and the generated outline. The seat accepts all five.

## Fix
1. **Every Markdown heading is a boundary** (sol MUST 1–3). The parser must treat every ATX heading
   (`#` to `######`), not only CAP/FEAT/SUB, as:
   - R-287: a heading that is not FEAT or SUB ends the current feature/subgroup; a row after it is
     outside a feature until the next FEAT/SUB heading.
   - R-288: any heading between a CAP/FEAT/SUB heading and its `Purpose:` line is a violation.
   - R-290: an unrelated heading at level ≤ a tree heading's level closes that tree heading, so a
     FEAT after an unrelated level-1 heading has no capability parent.
   Note the legitimate non-tree headings: `# nana-pi requirements`, `## How this file is organized`,
   `## Purpose and outcomes`, `# Open questions and deliberate omissions`, `## Open questions`,
   `## Deliberate omissions`; none holds rows, so the real ledger must stay green.
   Add sol's three demonstrated fixtures, each failing under the old code and passing the new:
   a row under the closing ordinary heading (R-287); a level-4 heading between a capability and its
   `Purpose:` (R-288); an unrelated level-1 heading between CAP-01 and FEAT-001 (R-290).
2. **Keep ID prefixes in the outline** (sol MUST 4). `compressRowIds` must preserve `R-`/`G-` and
   compress runs per prefix. FEAT-033 must read its G rows as `G-001–G-022`. Add a fixture with
   both prefixes, and an assertion on the real outline that FEAT-033's IDs include `G-001` and no
   `R-001` (R-001 lives in FEAT-001). Extend the R-291 field check so a prefix error fails it.
3. **Parent headings report their real size** (sol SHOULD 5). A capability, and a feature with
   subgroups, shows the total rows beneath it (e.g. `Rows: 167`); row IDs stay listed where the
   rows sit, and a parent line says `IDs: listed below` instead of `IDs: —`. Pin the aggregate in
   the R-291 field check (a parent's count equals the sum of its children's plus its direct rows).
4. Mutation pairs for each new check (break the code, see the new fixture go red, restore green).
5. `npm run req:tree`, `npm run map`, `npm run map:check`, the proof (must still exit 0 — the ledger
   must not change), then `npm run test:locked`.

## Rules
Same doneWhen, NOT, allowlist and frozen inputs as `build-brief.md`; this brief is frozen too.
Report ≤ 40 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits, each finding with the
fixture that pins it and its red/green, the prove summary line, the suite summary line, the one
claim most likely wrong.
