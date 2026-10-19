# Build brief — win-stale-copies

Feature: FEAT-015 · Diagnose the active environment. Class: install, hook or gate. Threat model: honest variation in scope; deliberate forgery out (see must-meet). Worktree `~/nana-pi-wt/win-stale-copies` on `feat/win-stale-copies`. Follow `packages/nana-pack/prompts/builder-preamble.md`. Single test files only. Never edit HANDOFF.md or docs/sessions/. Committed text names no machine path and no owner; say "the owner".

## Change
1. REQUIREMENTS.md: add R-1600..R-1605 under FEAT-015 as `planned`, word for word from the must-meet. Then tests, then code.
2. New `packages/nana-setup/lib/stale-copies-config.mjs` (six-tag header): stale prefix `[nana:install] INSTALL STALE:`, unavailable prefix `[nana:install] STALE-COPY CHECK UNAVAILABLE:`, pi section key `nana-install-stale`. Each has a `chosen` provenance comment.
3. New leaf `packages/nana-setup/lib/stale-copies.mjs`. It imports only fs, path, ./paths.mjs, ../../nana-pack/lib/display.mjs and the config. Never steps.mjs or doctor.mjs, because pi loads it.
   - Move `linkOk` here verbatim and export it.
   - `staleNotice(labels)`: returns "" for an empty list, else one line. The line has the prefix, the labels joined by ", ", "— tell the user; they fix it with", and the code span of `node "<path.join(pkgRoot,'bin','nana-setup.mjs')>" install`. If codeSpan refuses, it uses the words `nana-setup install`.
4. `lib/doctor.mjs`: delete the local linkOk and import it from stale-copies.mjs. Change nothing else.
5. New CLI `packages/nana-setup/bin/stale-copies.mjs`. It ignores `--cwd` and uses `resolveLayout()` with no options. It walks CLAUDE_RULES with linkOk and ruleSource. It walks CLAUDE_SKILLS with doctor's `skillLinkState`, skipping NEW_CLAUDE_SKILLS on win32. It uses doctor's exact labels (`rule <name>`, `skill <name>`) and prints staleNotice or nothing.
6. `lib/hook-producer.mjs`: add a `stale-copies` launcher whose marker is the unavailable prefix plus ` checker failed (<cli>).\n`. Fix the header's "nana-pack producer" wording.
7. `claude/hooks/nana-adoption.mjs`: after the adoption call, run `runHookProducer(hookProducerConfig("stale-copies", repo))`. Keep @purpose to one sentence.
8. `packages/nana-pack/extensions/nana-rulings.ts`, at session_start, only when buildBlock returned rulings text: stale = `!linkOk(<agentDir>/nana-rulings.md, fileURLToPath(new URL("../rules/nana-rulings.md", import.meta.url)))`. At before_agent_start, when stale, set `sections[<key>] = staleNotice(["pi nana-rulings.md"])`. Never alter RULINGS_SECTION, and never throw. Update the header.
9. Run `npm run req:tree` and `npm run map`. Set the R-291 total in `packages/nana-pack/tests/requirements-tree.test.mjs` to what `node scripts/requirements-trace.mjs` prints. In packages/nana-setup/README.md, add one line under "Update nana-pi" and one tests-table row. In packages/nana-pack/README.md, add one line on the rulings stale section.

## Tests
- One new file, `packages/nana-setup/tests/stale-copies.test.mjs`, for all six rows. Put each `// req:` line directly above a `check("title", …` on one line.
- Use the fixtures in the must-meet. Install with `nana-setup install --home H`. Doctor rows come from in-process `diagnose(resolveLayout({ home: H }))` under `withPiStub`, with NANA_SETUP_PLATFORM set and restored around win32 cases.
- R-1602 compares the hook's labels with doctor's failed `rule `/`skill ` rows minus `rule nana-personal.md`. It also requires that set to be non-empty in the broken install.
- R-1604 and R-1605 drive the extension's handlers with `{ agentDir: H/.pi/agent }` and compare with doctor's `pi nana-rulings.md` row.
- The command check compares with `realpathSync` of the test's own pkgRoot.
- R-1603 injects `run` results for a spawn error, a signal and exit 1.
- POSIX cases print SKIP on win32 with the reason. Import every constant by name. Never write a shipped file.

## Wrong code to try (each must turn a test red)
- A bytes-only comparison in the CLI or the extension: R-1602 and R-1604 (POSIX byte-equal files).
- A realpath-only check on win32: R-1601 and R-1605.
- Always printing the line: R-1601 and R-1605.
- Skipping the skills walk: R-1602.
- Checking NEW_CLAUDE_SKILLS on win32: R-1601.
- A CLI that throws at start: R-1601.
- A launcher that writes nothing, or the adoption marker: R-1603.
- Appending the line to RULINGS_SECTION: R-1410 (existing).
- Omitting the command: R-1600 and R-1604.

## Done
- R-1600..R-1605 are `implemented`.
- Each of these passes run alone: stale-copies, hook-producers, rulings-install, skills-and-standards, win32-degrade, doctor-detail, install-check (nana-setup), rulings and requirements-tree (nana-pack).
- The trace, `npm run map:check` and `npm run readme:check` are green.
- The adoption hook's wall time is measured on a temp home before and after.

## Report (at most 10 lines)
Commit SHA · rows flipped · each test file with PASS/FAIL/SKIP counts · trace total and R-291 value · map:check and readme:check · hook ms before/after · any wrong-code mutant that stayed green · any doctor.mjs line changed beyond the linkOk move · anything not done.