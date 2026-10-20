# knowledge-pull-fail-open-pin: build brief 1

Feature: FEAT-004 · Retrieve relevant context with provenance
Class: ordinary. Threat model: honest variation (macOS, Linux, Windows on Node 22; a child that crashes after printing, prints nothing or whitespace, hangs, or is missing; a large paste); forgery out.
Read the must-meet in this folder first. Builder: Claude Sonnet subagent, worktree feat/knowledge-pull-fail-open-pin on main.

## Change
1. packages/nana-knowledge/tests/extension.test.mjs
   - Import fileURLToPath and pathToFileURL from node:url.
   - Beside REBUILD_DEADLINE_MS add `STUB_LATE_MS = 10000` with a `// chosen:` reason (five times the extension's 2 s deadline).
   - Put `// req: R-896` above the four existing checks the must-meet names. Titles unchanged.
   - New block (4b) between checks 4 and 5: a temp tree under td with extensions/, lib/, bin/; copy the extension and lib/tokenize.ts into it; write `{"type":"module"}` as its package.json; import the copy once and register its handler. Cases in this order, each with its own session id: missing (no stub written yet), control (prints a block, exits 0), non-zero (prints a block, exitCode 3), silent, whitespace only, late (prints a block after STUB_LATE_MS). Escape listeners on before the cases, off after; a handler rejection counts as an escape. One NOTE line with per-case ms. Then the two checks below.
   - Put `// req: R-234` above "5b: a child whose callback never fires still yields null".
   - Header @effects: add the copied extension tree and the stub CLIs it spawns.
2. packages/nana-knowledge/tests/hook.test.mjs: after "CLI hook emits no stderr warning noise", the seal check, then the behaviour check. spawnSync the CLI twice with env NODE_NO_WARNINGS=1 and NANA_KNOWLEDGE_HOME=home, fresh session ids, a padded payload of exactly hook.STDIN_MAX_BYTES bytes and one byte more; one NOTE line. Only the seal carries the 256 * 1024 literal.
3. REQUIREMENTS.md: R-228, R-234, R-895, R-896 to implemented; evidence = the checks below. Text unchanged. No new row.
4. `npm run map`; commit docs/code-map.md.
Never commit a change under packages/nana-knowledge/extensions, lib or bin. If a check reds on today's code, stop and report.

## Tests (exact titles; `check("…"` on the line under its marker)
- extension.test.mjs::R-234: a pi pull child that exits non-zero, prints nothing, outlives the deadline or is missing injects nothing
- extension.test.mjs::R-895: a pi pull child that exits non-zero, prints nothing, outlives the deadline or is missing throws nothing out of the handler
- hook.test.mjs::R-228: seal: STDIN_MAX_BYTES is 256 KB
- hook.test.mjs::R-228: the hook command reads a payload of exactly STDIN_MAX_BYTES and cuts one byte more, printing nothing
- Markers only: the 5b null check (R-234); checks 2, 2, 3 and 4 (R-896).

## Wrong code to try (temp HOME; restore each file with git checkout after each)
W1 `if (err && !String(stdout ?? "").trim())`. W2 drop `.trim()`. W3 the handler returns a message when text is null. W4 `if (err) { done(null); throw err; }`. W6 the handler's own timer no longer calls done(null). W7 TIMEOUT_MS 60000. W10 the default export calls `makePull({ timeoutMs: 60000 })`. H1 cap 512 KB. H2 drop the break. H3 `>=`. H4 push the chunk before the cap test. P1 drop `source: "pi"`. P2 a constant session id. Expect each to red the check the must-meet names. W5 (drop the stdin error listener) stays green: record it.
Before committing, `git diff --quiet -- packages/nana-knowledge/extensions packages/nana-knowledge/lib packages/nana-knowledge/bin` exits 0.

## Done
- Both test files pass alone. `node scripts/requirements-trace.mjs` exits 0. map:check and readme:check are green. `npm run req:tree` leaves no diff.
- Every wrong version reds its check (W5 recorded green).
- Committed and pushed. The seat reads the Windows leg.

## Report (at most 10 lines)
Tip; PASS counts per file before and after; NOTE lines; wrong-code table (variant, check that went red); trace, map and readme results; anything that surprised you.