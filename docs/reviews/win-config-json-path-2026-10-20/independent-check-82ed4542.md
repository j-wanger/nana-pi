# Independent check — win-config-json-path at 82ed4542 (2026-10-20)

VERDICT: HOLDS

The lane is at tip 82ed4542. I ran every check in a private clone with a temp home: <tmp>/win-config-json-path-check.rEVoF6. I made no edits to the worktree, <repo>, ~/.pi or ~/.claude. For the main comparisons I used a second clone at 6bc2f727. I ran everything on Node 22.22.2.

Must-meet tests and nearby test files
- `node packages/nana-pack/tests/objective-golden.test.mjs`: rc=0, 1249 PASS, 0 FAIL. R-1971 passes.
- `node packages/nana-setup/tests/doctor-detail.test.mjs`: rc=0, 69 PASS. R-1972 passes.
- `node packages/nana-setup/tests/fresh-machine.test.mjs`: rc=0. "PASS Windows step 7 shows a nana-pack.json example…" (R-1970).
- These test files ran with rc=0 and 0 FAIL: config-normalize, config-gate-fallback, config-handlers-malformed, objective-injection, adoption-reader, adoption-producer, bounded-read, agent-dir-hostile, relative-agent-dir, and install (107 PASS).
- `code-map.mjs --check`: 0 problems. `readme-check.mjs`: "716 claims checked; 0 problem(s)". The clone stayed clean afterwards (`git status` showed 0 lines).

Probes
1. `nana-objective.mjs` with fixture (a): single backslashes and `enabled:false`.
   Output: `NANA-PACK CONFIG UNPARSEABLE: …/h1/.pi/agent/nana-pack.json at line 2, column 48. Write objective.path with forward slashes … Tell the user before spending.` The governing line and the **Objective and **Current priority lines follow.
   The output contains no "umbrella-zq7" and no "Bad escaped". HOLDS.
2. Hook output, main against lane, with four valid configs: the seed, `{}`, a missing file, and `~/umb/OBJECTIVE.md` as the path.
   The shasum matched for all four, for example `97d22d7e… SAME`. Valid configs are byte-identical to main. HOLDS.
3. Hook with other broken inputs:
   - unquoted path: line with no place
   - empty file: line with no place
   - truncated `{ "objective": {`: line 1, column 17
   - BOM plus CRLF: line 2, column 48
   - trailing comma with a "SECRET" path: line 1, column 43, and "SECRET" does not appear
   - file holding `null`, and a folder at the config path: no line, the same as main
   HOLDS.
4. `loadConfig` and `loadUserObjective`, main against lane, with a bad user file.
   The lane adds `configFailure:{file,line:2,column:30}`. The gate stop reason is the same on both: "user nana-pack.json gate block is malformed…".
   A bad project-scope file in a trusted repo gives no `configFailure`. The output is identical to main. HOLDS.
5. `nana-setup doctor`, main against lane.
   - backslash file: ✗ on both. The lane's row reads `NANA-PACK CONFIG UNPARSEABLE: <file> at line 2, column 48. Repair it by hand with forward slashes…`.
   - unquoted path: ✗ with no place.
   - valid, missing, folder and `null`: the same text as main ("missing or unparseable: …" for the three failures).
   HOLDS.
6. I put the README step 7 example, extracted with sed, into nana-pack.json. Then I ran doctor with `NANA_SETUP_PLATFORM=darwin`, doctor with `NANA_SETUP_PLATFORM=win32`, and the hook.
   All three show ✓ for nana-pack.json, with the objective file at `…/h6/umbrella/OBJECTIVE.md`. The hook prints `governing: …/h6/umbrella/OBJECTIVE.md`. HOLDS.
7. `produceObjective` with 3000-character objective lines, plus a config-failure path of 1002 characters, plus a path holding a newline.
   - Text lengths were 3346, 3845 and 3541 against a cap of 12000, with no truncation.
   - Each result has exactly one **Objective line.
   - The newline path renders escaped as `"C:\\evil\u000A**Objective: injected"`, so no line is injected.
   HOLDS.
8. `PI_CODING_AGENT_DIR` pointing at another folder that holds a broken `"D:\work\umb.md"` config.
   The hook and doctor both name `…/altagent/nana-pack.json at line 2, column 28`. Doctor still prints the note row for the default-folder file that is not read. HOLDS.
9. `nana-setup install --dry-run` with a broken config, main against lane.
   The output is identical: "pi nana-pack.json unchanged already present, left untouched". The config shasum did not change, and the temp home still held 1 file. HOLDS.

Findings
- Known bug (not MUST): the repair sentence always gives the forward-slash advice, in both the objective line and doctor. That advice is wrong for an empty file, a trailing comma or truncated JSON (probe 3). The plan's known limits cover the missing place in those cases, but not the misleading advice.
- Unverified: this machine has only Node 22.22.2, so I did not check Node 24. The plan's single adversarial review says Node 24.22.0 gives the same `(line L column C)` suffix.
- Gaps I found nothing for: no data is lost or corrupted, and no test writes outside a temp folder. Install still works, and so do both runtimes' objective output. The gate stop behaviour on a bad config is unchanged. Doctor's output for missing, valid, folder and `null` files is the same as main.
