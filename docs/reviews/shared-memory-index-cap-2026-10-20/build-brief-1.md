# Build brief: shared-memory-index-cap

Feature: FEAT-003 · Index and connect existing knowledge sources. Lane class: install, hook or gate (Claude Code hook).
Builder: Claude Sonnet subagent in ~/nana-pi-wt/shared-memory-index-cap on feat/shared-memory-index-cap, based on current main.
Follow packages/nana-pack/prompts/builder-preamble.md. Never edit HANDOFF.md or docs/sessions/. Threat model: honest variation (growth, long descriptions, CRLF, astral text) is in scope; a hostile index is out.

## Change
1. Add `packages/nana-setup/lib/shared-memory-config.mjs` with the six-tag header and @effects none.
   - Export `SHARED_MEMORY_OUTPUT_BUDGET = 9000`. Provenance comment: hooks doc, plain stdout capped at 10,000 chars measured whole, read 2026-10-20; chosen 1,000-char margin; the unit is JS string length.
   - Export `SHARED_MEMORY_TRIM_MARK = "…"` with the comment "chosen: one character that reads as a cut".
2. In `packages/nana-setup/claude/hooks/nana-shared-memory.mjs`, replace only the output block (lines 90-92).
   - The fixed part is the header line plus the note line; the entries are the `- [` lines. If all of it fits the budget (`<=`), write today's exact text.
   - Otherwise split each entry into a head (`^- \[[^\]]*\]\([^)]*\)`, else the whole line) and a description. Reserve the fold line with both counts set to n.
   - Binary-search the largest common description length L that fits. Cut a longer description to `slice(0, L)` plus the mark, one unit shorter if the cut would end on a high surrogate.
   - If L = 0 overflows, keep the longest leading run that fits at L = 0.
   - Last line: `[nana:shared-memory] index shortened to fit the hook output cap: <s> of <n> entries shortened, <d> left out; full index: <idx>`. Keep the template beside HEADER.
   - Update @outputs. Leave self-heal and error handling untouched.
3. New test file `packages/nana-setup/tests/shared-memory-budget.test.mjs` with a six-tag header. Copy the harness from shared-memory-hook.test.mjs (tmpDir, temp HOME and USERPROFILE, CLAUDE_PROJECT_DIR set). Use made-up names in paths.
   - Write exactly the seven checks and the fixtures A-E the must-meet names.
   - Take each over-budget fixture's entry count from the imported budget, at about 1.5x overflow. Put no size literal in a title.
   - R-2341 must also assert at least one whole and one shortened line, and the fill bound.
   - R-2344 must check the s, n, d tokens in order before the index path, on D and on B.
   - Each `// req: R-234x` line sits directly above its `check("R-234x: …", …` call. The title's opening quote stays on the same line as `check(`. Never split them; that broke CI in slate 22.
4. In REQUIREMENTS.md under FEAT-003, add R-2340 to R-2346 after R-872 with the must-meet text verbatim. Status is `implemented`; evidence is `packages/nana-setup/tests/shared-memory-budget.test.mjs::<title>`.
5. In packages/nana-setup/README.md, add one bullet to the two-tier auto-memory list. It says the budget in `lib/shared-memory-config.mjs` sits below Claude Code's 10,000-char hook output cap, that the longest descriptions are cut first, that trailing entries drop only when titles overflow, and that a fold line follows. Add a test-table row for the new file. Name no machine path and no owner.
6. Run `npm run map` and `npm run req:tree`. Add no typed leaf total.

## Run: single files only. Never the full suite; other lanes hold the suite lock.
- `node packages/nana-setup/tests/shared-memory-budget.test.mjs`, `shared-memory-hook.test.mjs`, `shared-memory-input.test.mjs`, `hooks-closed-output.test.mjs`, `install.test.mjs` (all under packages/nana-setup/tests/)
- `npm run map:check`, `npm run readme:check`, `node scripts/requirements-trace.mjs`

## Wrong code to try (each must turn at least one new check red; restore it after)
- W1: drop trailing whole lines and never shorten. Expect R-2341 red.
- W2: no surrogate back-off. Expect R-2342 red (U+FFFD).
- W3: always reserve fold room. Expect R-2345 red.
- W4: `<` for `<=`. Expect R-2345 red.
- W5: titles only when over budget. Expect R-2341 red.
- W6: cut every description by one fraction. Expect R-2341 red.
- W7: `out.slice(0, BUDGET)`. Expect R-2341 and R-2344 red.
- W8: omit the left-out count. Expect R-2344 red.
- W9: use L/2 instead of the largest L. Expect R-2341 red (fill bound).

## Done
All seven new checks PASS. The listed existing files pass. map:check, readme:check and trace are green. W1-W9 were each seen red, then restored.

## Report (10 lines or fewer)
Commit; pass/fail per file; output length on A and D; W1-W9 red/green table; files touched; anything left undone.

## Seat amendments (re-check on main 9552afb1)

- Branch from main 9552afb1 or later. Every lane the plan saw in flight has landed, and none changed the hook, its two lib imports, its test files or tests/tmp-dir.mjs. The brief's line numbers still hold.
- Leave the Claude-folder lines (the `claudeHome`, `shared` and `idx` assignments, lines 35-37) untouched, and add no folder resolver of your own. The claude-config-dir lane owns that rule and may later import a shared resolver there. If main gains that import before your final merge, keep it.
- Use only R-2340 to R-2346. R-2350 onward belong to other planned lanes.
- Two planned knowledge lanes may add FEAT-003 rows after R-1915 and after R-208. If a merge brings them in, keep both sides, then re-run `npm run map` and `npm run req:tree`.
- In packages/nana-setup/README.md, change only the two-tier auto-memory list (one new bullet at its end) and the Tests table (one row directly after the `tests/shared-memory-input.test.mjs` row).
- The claude-config-dir lane edits the README's `--claude-home` usage line, the paragraph after the relative PI_CODING_AGENT_DIR paragraph, and the Tests paragraph text. Leave those lines alone.
- In the new test, put `import { tmpDir } from "./tmp-dir.mjs";` on a line of its own, exactly as written, and never call `mkdtempSync`. R-917's repo-wide source check rejects any other form. A combined import line broke a lane's CI on 2026-10-20.
- Build every hook run's environment from scratch, as the copied harness does: PATH, HOME, USERPROFILE and CLAUDE_PROJECT_DIR only. Never spread `process.env`. A Claude Code session can pass CLAUDE_CONFIG_DIR, or NANA_SHARED_MEMORY_DIR, to its children. Fixture C's empty-index run would then read a real index and learn the wrong header length.
- Land order: no wait. This lane lands when its reviews clear, ahead of the claude-config-dir lane.

## Cross-lane fixes (the seat's check of all nine amendments)

- Put the new config import on its own line directly after the `readHookInput` import (line 13). Leave lines 9-12 unchanged. claude-config-dir adds its import above the project-key import, so the two merge clean.
- After any merge of main, run `npm run map` and `npm run req:tree` again. Never merge those two files by hand.

## Seat (2026-10-20 ~16:45 EDT, after the re-check)

- Builder: pi-worker --lane shared-memory-index-cap --lane-size larger (the roster's larger-lane builder, pi gpt-5.6-sol). The owner kept pi sol for larger lanes after power mode; ignore any line above that calls the builder an open question or names a Claude builder.
- Reviews: Claude Opus 5.5 is the final reviewer and pi gpt-6-astra the land reviewer; the seat lands when every reviewer says LAND (the owner's standing rule since 2026-10-20).
- Run single test files only, never the full suite: eight other builders share this machine, and the seat runs the locked suite at land.
- Branch: from main 9552afb1. Land order across the slate (each later lane merges main before its final review): knowledge-sources-unparseable, lifecycle-compaction-reason, gate-stop-names-config, review-launch-win-paths, shared-memory-index-cap, project-odd-seeds, verifier-pipe-commit-match, win-hook-variant-loop, claude-config-dir.
- No push; no HANDOFF.md, docs/sessions/ or docs/reviews/ edits; commit with explicit paths.
