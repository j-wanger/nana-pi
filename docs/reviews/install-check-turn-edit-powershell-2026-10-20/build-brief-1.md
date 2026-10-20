# Build brief 1 · install-check-turn-edit-powershell
Feature: FEAT-015 · Diagnose the active environment. Class: ordinary. Base: main at cdf4b098 or newer. Read must-meet.md first.

## Change
1. REQUIREMENTS.md: add R-2000 to R-2004 as `planned` directly after R-1796, texts from must-meet.md. Flip each to implemented with its test cite when its test passes. Run `npm run req:tree`.
2. lib/install-check-config.mjs: add PI_TURN_EDIT and PI_TURN_POWERSHELL directly after PI_TURN, provenance beside every value. Build the check source and the exit text from the sealed exit code. Leave PI_TURN, SAMPLE_INPUTS, HOOKS and SPAWN_TIMEOUT_MS untouched.
3. lib/install-check.mjs:
   - Under okay(install), merge the post-edit command into `<home>/.pi/agent/nana-pack.json` as the design says: plain object only, a non-object postEdit replaced, every other top-level key kept. The run is `"<process.execPath>" -e "<source>" <placeholder>`.
   - On PI_TURN_POWERSHELL.platforms, put the tool list before the mapped PI_TURN arguments.
   - Export pure judgePiPostEdit({record, token}) and judgePiPowerShell({record}); each FAIL detail names the first missing condition.
   - Print `pi post-edit` after `pi turn`, then `pi powershell gate` on the PowerShell platforms only; a timed-out turn reports `timeout`.
4. lib/install-check-turn.mjs: one assistant message with bash, then write, then powershell only when pi.getActiveTools() includes the sealed tool. Write content: the user message that starts with SAMPLE_INPUTS.prompt, or "". Keep request 2. Update the header.
5. packages/nana-setup/README.md, Install check paragraph: the change the design describes.
6. tests/install-check.test.mjs (insert the new checks directly after the `pin R-1790 to R-1796` check):
   - Extend passingTurnRecord(token) with a write result built from the sealed names (lead, exit text, token) and a powershell gate-block result. Keep the bash result FIRST: R-1792's test indexes toolResults[0].
   - Five checks and one pin. Put each `// req: R-200n` directly above `check("<exact title>", ...`, title on one line.
   - R-2000: seed `{objective:{projectFile:"OBJECTIVE.md"},notify:{enabled:false}}` through spawnOverride on install; capture the file at the turn spawn. Assert the other keys deepEqual, exactly one command, the match hits the sealed file and misses `other.txt` and `<file>.bak`, and the run includes process.execPath. Then substitute the placeholder as nana-post-edit does on the HOST (process.platform win32: `"%NANA_PI_FILE%"` with NANA_PI_FILE=<temp file> in the env; else `"<temp file>"`), run spawnSync(cmd, {shell:true}), and assert stdout === the file's text and status === the sealed code.
   - R-2001: seeds none, `{ not json`, `[]`; afterwards absent, byte-equal, byte-equal.
   - R-2002: judge cases, and one line per run on linux and win32.
   - R-2003: win32 with pi.exe, args.slice(0,2) equals the tool list and the rest equals the mapped PI_TURN.args plus the prompt; win32 with pi.cmd, the cmd line has the quoted tool list before "--offline"; linux and darwin carry no `--tools`.
   - R-2004: judge cases; win32 prints one line; linux and darwin print none.
   - Header @effects: the file now starts a process.
7. Run `npm run map`, `npm run map:check`, `npm run readme:check` and `node scripts/requirements-trace.mjs`.

## Tests (single files only)
`node packages/nana-setup/tests/install-check.test.mjs`, `node packages/nana-setup/tests/readme-rehearsal.test.mjs`, `node packages/nana-setup/tests/fresh-machine.test.mjs`. Then once on macOS: `env -u NANA_WORKTREE_ROOT node packages/nana-setup/bin/install-check.mjs` (the lane write boundary blocks the fixture write otherwise). pi-subagents may FAIL offline; say so.

## Wrong code to try (each must turn its test red; revert each)
- R-2000: drop the placeholder from the run, OR use the match `.*`, OR write `{postEdit}` alone, OR a source that exits 0.
- R-2001: write the block when the file is missing or does not parse.
- R-2002: accept a write result without the token, OR one marked isError, OR one that says `exited 1`.
- R-2003: prepend the tool list on every platform, OR omit it on win32.
- R-2004: print the line on linux or darwin, OR accept a powershell result not marked as an error.

## Done
- The five checks and the pin pass; every other check in the file stays green with no edit to an existing check.
- Each row is implemented with its cite; map, readme and trace checks are green; the README paragraph is updated.
- The macOS install check prints PASS pi turn and PASS pi post-edit.
- HANDOFF.md and docs/sessions are not edited.

## Report (at most 10 lines)
Tip SHA; PASS and FAIL counts per test file; each wrong code and the check it turned red; the macOS install-check pi lines; any deviation with its reason; any open question.
