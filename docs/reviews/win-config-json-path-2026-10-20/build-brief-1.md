# Build brief: win-config-json-path (install/hook/gate lane; block R-1970 to R-1979; this lane uses R-1970 to R-1972)

**Builder.** A pi gpt-5.6-sol builder, started through pi-worker. It works in `<worktrees>/win-config-json-path` on feat/win-config-json-path, from main 6bc2f727 or newer. Follow packages/nana-pack/prompts/builder-preamble.md, and read must-meet.md in this folder first. Run single test files only. Never edit HANDOFF.md or docs/sessions/. Never add a typed leaf total.

## Change, in order
1. REQUIREMENTS.md: append R-1970 and R-1971 to the FEAT-001 table. Put R-1972 in the FEAT-015 table after R-1586. Use the must-meet text and status `untested`. Then run `npm run req:tree`.
2. Tests: copy each title exactly. Put each `// req:` marker directly above a one-line `check("title", …`. Fixtures (a), (b) and (c) come from the must-meet. Each test asserts with the exported prefix name, never its literal.
   - fresh-machine.test.mjs (R-1970), at the end. Take every `` `{…}` `` code span in windowsEntries[6]; there must be at least one.
     - JSON.parse each span. Its objective.path must start with `~/` and hold no backslash.
     - objectivePath(cfg.objective) from lib/objective.ts must equal objectiveTarget(resolveLayout(), cfg) from lib/steps.mjs.
     - The resolved path must lie strictly inside os.homedir().
   - objective-golden.test.mjs (R-1971), before the final cleanup. For each fixture, make `world({ config: false })` and write the fixture to the user nana-pack.json. Use cwd `<home>/elsewhere`.
     - Get the hook text with `await golden(label, w, cwd, () => {})`, which adds the R-018 checks, then get the pi text with runPi.
     - The check passes only when both texts hold exactly one line that starts with the exported prefix.
     - That line names displayPath(file). It shows `line 2, column 48` for (a) and (b), and no `line <digit>` for (c). It includes `forward slash`.
     - Both texts keep `governing: <w.umbrellaFile>` and CHARGE.
     - Neither text holds `umbrella-zq7`, `Bad escaped` or `Unexpected token`.
   - doctor-detail.test.mjs (R-1972), directly after the R-1586 check, not at the tail. Use layoutWith("file") and write each fixture to layout.piPackConfig.
     - The `pi nana-pack.json` row must be `fail`.
     - Its detail names layout.piPackConfig and the place (no `line <digit>` for c), and includes `forward slash`.
     - It holds none of the three banned strings.
3. Code, per must-meet Design 2 to 6. Files: lib/json-text.mjs, lib/config.ts, lib/objective.ts, packages/nana-setup/lib/doctor.mjs and packages/nana-pack/README.md. Update the six-tag headers you touch, then run `npm run map`.
4. README.md: change Windows step 7 only, and keep it one line. No `Run`, `then` or `expect` may sit directly before a code span.
5. Flip each row to `implemented` when its check passes.

## Wrong code to try (break the code, never the assertion; each must turn a check red)
- W1: the README example uses single backslashes. Red: R-1970 (probed).
- W2: the README example is `C:/Users/you/umbrella/OBJECTIVE.md`, or uses doubled backslashes. Red: R-1970 (probed).
- W3: loadConfig does not attach configFailure; only loadUserObjective does. Red: R-1971 (probed), plus BYTE-IDENTICAL.
- W4: the line, or doctor's detail, shows the parser's message instead of line and column. Red: R-1971 or R-1972.
- W5: doctor parses without the BOM strip. Red: R-1972 (probed).
- W6: the place is read from `at position N`. Red: R-1971 (probed) and R-1972.
- W7: an unparseable config reads as enabled:false, so nothing prints. Red: R-1971.
- W8: readConfigFile drops its BOM strip. Red: R-1971 (probed).

## Regression files
- Pack: objective-injection, config-normalize, config-display-text, config-gate-fallback, config-handlers-malformed, writing-injection, bounded-read, agent-dir-hostile.
- Setup: install, relative-agent-dir, readme-rehearsal.
- Then run `npm run readme:check`, `npm run map:check` and `node scripts/requirements-trace.mjs`.

## Done
- Three rows read implemented, and their three checks pass.
- W1 to W8 each turned a check red.
- Every regression file and check is green.
- The hook still exits 0.

## Do not
- Edit bin/nana-objective.mjs, extensions/nana-objective.ts, lib/steps.mjs or readPiPackConfig.
- Change the gate stop text, readConfigFile's problem strings, doctor's text for a missing or unreadable file, or the macOS step 7.
- Add a journal event or a second read of nana-pack.json.
- Spell a pi launch as spawn with a quoted "pi" in any .mjs file.

## Report (at most 10 lines)
- The tip SHA.
- Each row's status and its PASS line.
- W1 to W8, red or green.
- Each regression file's exit code, plus the readme, map and trace results.
- Any change from the design, and why.
- Any new residuals.