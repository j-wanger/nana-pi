# Build brief: pack-config-agent-dir-pins (ordinary lane; block R-2110 to R-2119, none used)

**Builder.** A Claude Sonnet subagent. It works in `<worktrees>/pack-config-agent-dir-pins` on feat/pack-config-agent-dir-pins, from main 385c633f or newer. Follow packages/nana-pack/prompts/builder-preamble.md, and read must-meet.md first. Run single test files only. Never edit HANDOFF.md or docs/sessions/. Never add a typed leaf total.

## Change, in order
1. `packages/nana-pack/tests/agent-dir-config.test.mjs`
   - Imports to add:
     - createRequire and syncBuiltinESMExports from node:module
     - loadUserObjective, beside loadConfig
     - adoptionSettings from ../lib/adoption.mjs
     - the default export of ../extensions/nana-roster-notice.ts
   - Add a helper `opened(run)`:
     - On the CommonJS fs, wrap openSync, readFileSync, open, readFile and createReadStream, plus promises.open and promises.readFile.
     - Each wrapper records String(arg0) unless arg0 is a number.
     - Call syncBuiltinESMExports, then await run(). In `finally`, restore every original and sync again.
     - Match paths by path.resolve equality, lowercased on win32.
   - Put both blocks after the FORMS loop and before the missing-dir loop. The stranded file is `<HOME>/.pi/agent/nana-pack.json`.
   - R-193 block:
     - Set PI_CODING_AGENT_DIR to a fresh empty `<HOME>/r193-agent`. Use a UI ctx with notify, select, setStatus and a no-op setWidget, and session id r193.
     - Inside opened(), call these:
       - loadConfig(ctx)
       - loadUserObjective()
       - adoptionSettings()
       - the roster-notice extension's session_start with `{reason: "startup"}`
       - one gate decision for `zorble now`
     - Pass needs all four: the stranded file exists; a UI note names it; no recorded path is it; the active nana-pack.json was recorded.
   - R-825 block: give each sub-case its own active dir and session id. Count the UI notes and `config_agent_dir_mismatch` lines in `<dir>/nana-journal.jsonl` that one loadConfig adds (after minus before). For (iii), dir is the default dir.
     - (i) A relocated empty dir, with the stranded file renamed away. Restore it in `finally`.
     - (ii) A relocated dir that holds `{}`, with the stranded file present.
     - (iii) PI_CODING_AGENT_DIR unset.
     - Pass means every count is 0.
2. `packages/nana-pack/tests/config-handlers-malformed.test.mjs`, before `process.exit`
   - Variants: gate = 7, notify = 7, handoff = 7, objective = 7, journal.path = 7.
   - Each variant gets a fresh HOME, USERPROFILE and cwd holding a.ts. Its user file holds the variant plus `postEdit.commands` `[{match "\\.ts$", run 'node -e "process.exit(1)"'}]`. Register EXT fresh, with a headless ctx and its own session id.
   - Fire session_start `{reason: "startup"}`, then tool_result for a successful edit of `<cwd>/a.ts`.
   - post-edit passes when a returned content holds `[nana-post-edit] 1 check(s) failed`.
   - lifecycle passes when the agent dir's journal holds an `"event":"session_start"` line.
   - Pass = lifecycle passes in every variant, and post-edit passes in every variant except gate = 7. Add a comment: a stopped gate blocks every edit in pi.
   - Add `// req: R-781` directly above the existing `${label}: objective text or OBJECTIVE UNAVAILABLE marker injected` check.
3. Headers: keep each @purpose to one sentence covering the new pins. Add the new imports to @inputs. Add the fs wrapping and the checker child to @effects. Then run `npm run map`.
4. REQUIREMENTS.md:
   - Set R-193, R-825 and R-781 to `implemented`, with the cites as Evidence and the row text unchanged.
   - Start R-781's Evidence with: `Declared limitation: notify, handoff, writing and roster-notice output under a malformed config is not asserted (R-083 pins that their handlers do not throw; nana-rulings reads no config).` Then give both cites.
   - Run `npm run req:tree`; expect no diff.

**Titles.** Copy each exactly, with `check("title", …` on one line directly under its marker.
- R-193: `with no active nana-pack.json, the stranded default file is announced but never opened`
- R-825: `no mismatch note or journal line when the active config is present or no default config is stranded`
- R-781: `with an unrelated block malformed, post-edit still feeds back its check's failure and lifecycle still journals the session start`

## Wrong code to try (break lib, bin or extension code, never the assertion; revert each)
- W1: in loadConfig's no-user-file branch, add `try { fs.readFileSync(stranded) } catch {}`. Red: R-193.
- W2: in the same place, add `try { readBounded(stranded) } catch {}`. Red: R-193.
- W3: loadUserObjective reads the default file when the active one is absent. Red: R-193.
- W8: resolveRoster reads `<homedir>/.pi/agent/nana-pack.json` when the active file is absent. Red: R-193.
- W9: adoptionSettings reads the default file when the active one is absent. Red: R-193.
- W4: drop `&& fs.existsSync(stranded)`. Red: R-825.
- W5: push the mismatch note even when the active file is present. Red: R-825.
- W6: lifecycle's log returns when `loadConfig(ctx).gate.stopReason` is set. Red: R-781.
- W7: in loadConfig, `const u = user.problems.length ? {} : user.blocks`. Red: R-781.

**Regression files:** agent-dir-config, agent-dir-hostile, agent-dir-parity, config-handlers-malformed, config-normalize, config-gate-fallback, objective-golden, post-edit-status, lifecycle-reload, roster-notice, adoption-producer. Then run `npm run readme:check`, `npm run map:check` and `node scripts/requirements-trace.mjs`.

## Done
The three rows read implemented, and their checks PASS. W1 to W9 each turned its check red and were reverted. Every regression file and check is green. The diff touches only the two test files, REQUIREMENTS.md and docs/code-map.md. Do not edit lib/, bin/ or extensions/, add a test file, or spell a pi launch as spawn with a quoted "pi".

## Report (at most 10 lines)
Tip SHA; each row's status and PASS line; W1 to W9 red or green; each regression file's exit code; readme, map and trace results; any change from this brief and why; new residuals.