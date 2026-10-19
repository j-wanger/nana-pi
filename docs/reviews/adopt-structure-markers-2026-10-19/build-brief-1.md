# Build brief — adopt-structure-markers

Feature: FEAT-014 · Create or adopt a project workspace
Lane class: ordinary. A Claude Sonnet subagent builds it under `packages/nana-pack/prompts/builder-preamble.md`, in the lane worktree on `feat/adopt-structure-markers`. Run single test files only. Never edit HANDOFF.md or docs/sessions/.

## Change
1. **REQUIREMENTS.md.** Add R-1780, R-1781 and R-1782 (text in the must-meet) at the end of the SUB-018 table as `untested`. Flip each to `implemented`, with `file::title` evidence, once its test passes. Leave R-741 and R-849 unchanged.
2. **packages/nana-pack/skills/adopt-structure/SKILL.md, step 4 only.**
   - Keep "VERBATIM", the four `../../../../templates/_shared/` mentions and the sentence "Only when this canonical path is absent on disk may you render a throwaway scaffold" (R-591).
   - Leave the `uvx copier` lines and the name-is-data paragraph untouched (R-929).
   - Add a ```markdown fence of three lines: the begin marker, one placeholder line for the shared file's contents, and the end marker. No blank line goes inside it.
   - Say that the agent writes the lines inside the fence, not the fence. Say that the markers let `nana-setup project <dir>` refresh the section and let `--check` read ✓.
   - Add re-adoption guidance that uses the exact phrases "replace that copy with the marked block" and "never add a second copy". It covers these points:
     - the copy runs from its `## Working under nana-pi` heading through the last line that came from the shared file;
     - the project's own lines after it stay below the end marker;
     - when the end is unclear, show the owner and ask;
     - when the markers are already there, replace only the lines between them;
     - projects adopted before the markers existed are fixed the same way.
   - Fallback: both `node -e` lines print from the start of the begin-marker line through the end of the end-marker line, and nothing after it.
     - Use the search strings `'nana:working-under-nana-pi begin'` and `'nana:working-under-nana-pi end'`, never `'<!--…'`.
     - Outside the readFileSync argument, use no `$`, backtick, `%` or `"`, no `!` except before `=`, and no backslash except in `\n`.
     - The prose says the line prints the marked block.
     - A shape that works: `const b=s.indexOf('…begin'),e=s.indexOf('…end'),n=s.indexOf('\n',e);if(b!==-1&&e>b)process.stdout.write(s.slice(s.lastIndexOf('\n',b)+1,n===-1?s.length:n+1))`.
3. **packages/nana-setup/tests/entry-guidance.test.mjs.**
   - Import WORKING_BEGIN, WORKING_END and agentsStub from `../lib/project.mjs` by name. Write no marker literals.
   - Add the three tests (shapes in the must-meet). Put `// req: R-178x` directly above a one-line `check("title", …`.
   - Reuse the file's temp `root` (in subfolders) and `--home`. Do all of it before the existing rmSync.
   - Widen @purpose and @inputs by one clause each, naming the shared file and the project lib.
4. **Regenerate.** Run `npm run req:tree` and `npm run map`. Then `npm run map:check` and `npm run readme:check` must be green.

## Tests (single files)
- `node packages/nana-setup/tests/entry-guidance.test.mjs`
- `node packages/nana-setup/tests/project.test.mjs` (the R-591, R-929 and R-592 skill pins). If it stops at its pi trust-store import, report that; the pins come after the import.
- `node packages/nana-pack/tests/skill-claims.test.mjs`
- `node scripts/requirements-trace.mjs`: rows R-1780 to R-1782 implemented, and `ears: 0 rows off form`
- If you add a new backticked path or command to the skill, also run `node packages/nana-pack/tests/templates-render.test.mjs` (needs uvx copier).

## Wrong code to try (each must turn the named test red; revert it afterwards)
- A blank line under the begin marker in the fence turns R-1780 red.
- A misspelt end marker in the fence turns R-1780 red.
- The search string `'<!-- nana:working-under-nana-pi begin'` in the bash line turns R-1782 red (shell-special `!`).
- One line sliced from the begin line to the end of the file turns R-1782 red (the trailing section is printed).
- `\\n` in place of `\n` in the bash line turns R-1782 red.
- Deleting "never add a second copy" turns R-1781 red.
- Deleting the "Only when this canonical path is absent on disk …" sentence turns R-591 red in project.test.mjs.

## Done
- R-1780 to R-1782 are implemented, the three tests pass, and each wrong-code case above turned its test red.
- project.test.mjs, skill-claims.test.mjs, map:check, readme:check and the trace are green.
- The diff touches only SKILL.md, entry-guidance.test.mjs, REQUIREMENTS.md, docs/requirements-tree.md and docs/code-map.md.

## Report (10 lines or fewer)
Verdict; commit sha; for each row, the test title PASS and its wrong-code red; the other single-file runs; map, readme and trace results; files touched; residuals.