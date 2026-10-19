# bom-pack-config — build brief 1

Feature: FEAT-015 · Diagnose the active environment

**Builder.** The roster's larger builder through `pi-worker --lane-size larger`, in `<worktrees>/bom-pack-config` on `feat/bom-pack-config`. Follow packages/nana-pack/prompts/builder-preamble.md. Read docs/reviews/bom-pack-config-2026-10-19/must-meet.md first. Row IDs R-1580 to R-1586 only. Never edit HANDOFF.md or docs/sessions/. Run single test files only; the seat runs the locked full suite.

**Requirements first.** Add R-1580 to R-1586 as `planned` at the end of FEAT-015's table, after R-399. Run `npm run req:tree`. Set the R-291 leaf total in packages/nana-pack/tests/requirements-tree.test.mjs (title and both numbers) to the total `node scripts/requirements-trace.mjs` prints: 1,278 on today's main, so 1,285 with these rows.

**Tests, red first.** Titles exactly as the must-meet gives them; `check("title", …` on the line directly under `// req:`. Build every fixture with `JSON.stringify`, then prefix `"﻿"`.
- DD R-1580: ONE layout (the detail names the config path). Write the CRLF file without the mark, run doctor, keep the three rows; rewrite it with the mark, run again. objective.path is an existing file, projectFile GOALS.md. Assert status and detail equal AND the unmarked `pi nana-pack.json` row is ✓, so equal failures cannot pass.
- DD R-1586: three fixtures, each with absolute journal.path and projectFile GOALS.md: two leading marks; a mark right after `{`; one mark then `{ nope`. For each, doctor's `pi nana-pack.json` row is ✗ and `adoptionSettings()` returns `<agentDir>/nana-journal.jsonl` and OBJECTIVE.md. Set PI_CODING_AGENT_DIR to the layout's piHome around that call; restore it.
- IN R-1581: block 9's pattern, fresh home, marked file whose objective.path is an existing file. Run install. Assert no nana-objective.md, `not needed — objective.path already points at`, and the file byte-identical, mark kept.
- PJ R-1582: marked user file with one postEdit command; `project <dir> --home`. Assert no .pi/nana-pack.json and stdout matches `would shadow them here`.
- PJ R-1583: marked project file with one real command; `--check` prints `✓ post-edit commands … 1 effective`.
- AR R-1584: run the HOOK. Use a FRESH root that only the configured journal records, never the default journal, so a fallback to the default cannot satisfy the check. Remove the agent dir's nana-pack.json afterwards.
- AP R-1585: three cases, each in a fresh repo (one report per root per day): journal.enabled false; absolute journal.path; projectFile GOALS.md with GOALS.md at the root. In EVERY case count that root's `directory_unadopted` lines in BOTH the configured journal and `<HOME>/.pi/agent/nana-journal.jsonl`. Expect 0/0, 1 configured/0 default, 0/0. Today each marked case writes 1 to the default. Restore `cfg()` afterwards.

**Change.**
1. New packages/nana-pack/lib/json-text.mjs with the six-tag header (effects none; errors: JSON.parse's SyntaxError). Export `parseJsonText(text)` returning `JSON.parse(text.startsWith("﻿") ? text.slice(1) : text)`. Write the escape, never the raw character.
2. Use it in steps.mjs `readPiPackConfig`, adoption.mjs `adoptionSettings` and project.mjs `checkProject`'s project-file parse; keep each catch and fallback.
3. `npm run map` and commit the map. No README change; no line of doctor.mjs.

**Wrong code to try** (restore each):
- `/^﻿+/`, `text.trim()`, or removing every U+FEFF in parseJsonText: R-1586.
- readPiPackConfig returns `{}` on a parse failure: R-1586.
- readPiPackConfig left raw: R-1580, R-1581, R-1582.
- adoptionSettings left raw: R-1584, R-1585.
- project.mjs's project-file parse left raw: R-1583.

**Done.** Each new test red before the change and green after; the five edited test files plus requirements-tree.test.mjs pass whole; `npm run map:check` and `npm run readme:check` pass; the trace shows 0 problems and `ears: 0`; every row implemented; everything committed.

**Report (at most 10 lines).** Commit SHAs; red-then-green per title; each wrong-code item and the test it turned red; existing tests edited and why; the trace summary line; open doubts.
