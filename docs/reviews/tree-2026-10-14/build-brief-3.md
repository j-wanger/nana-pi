# Lane tree — build brief 3 (2026-10-14 · feat/tree · tip 81027f3)

**Builder: Claude Sonnet 5.** Final review round 1: astra LAND, sol SEND-BACK with one MUST (`sol-r1.md` and
`astra-r1.md` in the seat's records; quoted below). Fix these three items only; build briefs 1 and 2's rules all hold.
Both reviewers will then read only the change since `81027f3`.

1. **sol's MUST — count fenced rows as the rail does.** `scripts/requirements-tree.mjs:406-412`:
   `countRequirementRowLines` skips lines inside code fences, but the trace rail counts every line `requirementRowId`
   recognises, fenced or not, and main's checker reported a fenced row as misplaced. "An honest flat ledger containing a
   fenced row now reports a smaller inventory" — one normal row plus one fenced row reports `1 requirement rows`. Count
   every `requirementRowId` line, fenced included, for both R-1159's count and R-1160's no-row check; leave
   `checkTree`'s handling of a fenced row in a tree ledger as main has it. Update the comment above the function. Test in
   `requirements-tree.test.mjs`, `// req: R-1159` above it, red first:
   `R-1159: a flat ledger's count includes a requirement row inside a code fence, as the rail counts it`
   (one table row plus one fenced row → `2 requirement rows`).
2. **astra's SHOULD — one source for the organization section.** "How this file is organized" is written four times:
   both branches of `templates/python/template/REQUIREMENTS.md.jinja` (`:75`, `:106`) and of
   `templates/typescript/template/REQUIREMENTS.md.jinja` (`:73`, `:104`). The repo rule (`AGENTS.md` Layout) makes
   `templates/_shared/` the single source of anything more than one consumer emits. Move the block, byte for byte, to
   `templates/_shared/requirements-organization.md` and pull it in with the same Jinja `include` form the Part G block
   uses; every render stays byte-identical to `81027f3`'s (prove it by rendering all four modes before and after and
   diffing). Test in `templates-render.test.mjs` beside the R-581 include checks, `// req: R-1153` above it:
   `${language} ${mode}: REQUIREMENTS.md's organization section comes from the one shared source`.
3. **astra's SHOULD — no outline in projects.** `packages/nana-pack/skills/requirements/SKILL.md:126` says "Before
   changing a row, find it in the outline's shared-requirements index." Projects have no outline. Replace it with:
   "Before changing a row, find every feature that lists it: in nana-pi, the outline's shared-requirements index; in a
   project with no outline, search the ledger for its ID." Keep every phrase T5 and T7 check.

Do not change any row's text; add the two new titles to R-1159's and R-1153's evidence. Do not touch `CHANGE.md`, the
seat scripts, `HANDOFF.md` or `docs/sessions/`.

## Done
`node docs/reviews/tree-2026-10-14/seat-titles.mjs 1` → `0 missing`;
`node docs/reviews/tree-2026-10-14/acceptance.mjs > docs/reviews/tree-2026-10-14/acceptance-output.txt 2>&1` →
`0 mismatch(es)`; `npm run test:locked` (0 failed); `npm run map:check`; `npm run readme:check`;
`node scripts/requirements-tree.mjs --check`; `npm run template:accept`. Commit, push. No CI wait is needed.

## Report
≤ 15 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: the commits; each item with the red you saw first (or the
render diff for item 2); the `test:locked` summary line; the last line of each seat output.
