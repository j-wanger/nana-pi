# Review brief, round 3 of 3: nana-pi audit fixes (reviewer: gpt-5.6-sol)

This is the LAST round. Your r1 (`sol-r1.md`, BLOCK 6) and r2 (`sol-r2.md`, BLOCK 7) are in this
folder. The seat fixed r2's two MUSTs in the commit just before this brief (see its message).

1. `map:impact`. The generator (`templates/typescript/template/scripts/code-map.mjs`) and
   `docs/code-map.md.jinja` now print the form without `--`, and nana-pi's `docs/code-map.md` is
   regenerated. Render a fresh TypeScript project, run `pnpm map`, and run the command exactly
   as each of its docs prints it. In nana-pi, run the root README's `npm run map:impact --
   <file>` and the map's `npm run map:impact <file>`. Do all of them work?
2. The pack README Handoff bullet (~L593–597): is the store now described truthfully for the
   default and for a configured `handoff.path`?
3. Any defect these two edits introduced.

At the cap, separate (a) what must block landing from (b) residuals to record. Give the smallest
fix for each (a) and a one-line residual for each (b).

Answer with the full review as your final message; do not write it to a file. End with
`VERDICT: LAND` or `VERDICT: BLOCK` and a score out of 10.
