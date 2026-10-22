Feature: FEAT-014 · Create or adopt a project workspace. Lane biome-pin, row R-2559. Class: ordinary. Builder: pi-worker (small lane). One build, an urgent fix that ships alone: main's suite is red because Biome 2.6 formats Markdown and YAML and the TypeScript template takes any 2.x.

Work in ~/nana-pi-wt/biome-pin on feat/biome-pin. The plan of record is `docs/reviews/biome-pin-2026-10-22/must-meet.md`: read what broke, D1 to D3, the row, the test, the tunable and the known limits first, then `plan-attack.md`. Follow packages/nana-pack/prompts/builder-preamble.md. Never edit HANDOFF.md, docs/known-bugs/, docs/sessions/, packages/nana-pack/rules/ or docs/reviews/. No push. Other lanes build in parallel; keep your ledger edits to FEAT-014's rows.

1. `templates/typescript/template/package.json.jinja`: `"@biomejs/biome": "2.5.15"` (D1). In `packages/nana-pack/skills/adopt-ts/SKILL.md` step 4, the sentence on missing devDependencies says to add each at the exact version the rendered `package.json` names, through their package manager (D1, adversary M1).
2. `packages/nana-pack/tests/templates-render.test.mjs` (D2): parse the rendered `package.json` once; that read feeds R-2559 and the TypeScript probe and check, which run `pnpm dlx @biomejs/biome@<that version>`; the check keeps its title, its skip and its comment's meaning (update the comment's command text). Add R-2559's test with the must-meet's exact title and `// req:` marker, doing what "What the test does" says, the scaffold and the adopt render both; it spells 2.5.15 once.
3. Add R-2559 to FEAT-014 after its last row with the must-meet's text, `implemented`, and evidence. `npm run req:tree` regenerates the outline and prints 0 problems.
4. Run the changed test file (it must pass with templates-render's Biome check green, not skipped, on this Mac), `npm run map`, `npm run map:check`, `npm run readme:check`, `node scripts/requirements-trace.mjs`, then `npm run test:locked` before your commit. Try these wrong versions, see each go red, then restore: the caret range back; the adopt render alone on `^2.0.0`; the version read from the wrong key; the check without the version. Commit with explicit paths.

Seat check: `node docs/reviews/biome-pin-2026-10-22/seat-titles.mjs 1` must print `0 missing`.

Done:
- A fresh TypeScript scaffold pins Biome 2.5.15 and passes the check run with that version; the full suite is green.
- map:check, req:tree, readme:check and the trace are green; the seat check prints `0 missing`; the work is committed.

Report (at most 8 lines after the VERDICT line): the commit sha; the wrong versions and results; templates-render's result line; the full suite's summary line; seat-check status.
