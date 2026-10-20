# win-config-json-path: a Windows path pasted into nana-pack.json no longer silently drops the objective (plan, adversary-amended, 2026-10-20)

Feature: FEAT-001 · Keep goals and priorities in view (R-1972 lives in FEAT-015 · Diagnose the active environment)

**Feature.** A Windows owner who follows the root README's step 7 writes a nana-pack.json that parses. When the user nana-pack.json does not parse, both runtimes' objective block and doctor's pi nana-pack.json row name the file, the error's line and column, and the forward-slash repair. Neither shows file text. Today the Claude Code seat silently shows the default objective file's lines.

**Class: install/hook/gate.** The lane changes what the objective hook and the pi nana-objective extension print, lib/config.ts (read by every pack extension, the gate included) and doctor. It needs the seat's wrong-code pairs, the land reviewer (or seat-land.md when the roster prints land: seat), one independent check, and install-check.mjs on macOS before nana-land.

**Threat model.** In scope is honest variation: a path pasted with single backslashes, an unquoted path, a byte-order mark, CRLF, the three CI legs, and Node 22 and 24. A forged config is out of scope.

**Today (probed on 2cd533d9, temp home; through 6bc2f727 no lane file changed except the pack README).**
- Claude Code hook: prints the default nana-objective.md block with no notice. loadUserObjective reads an unparseable file as no blocks.
- pi: prints the same block. loadConfig sets the gate stop, so every gated tool is blocked.
- doctor: `✗ pi nana-pack.json missing or unparseable: <path>`.
- V8 on Node 22.22.2 and 24.22.0 alike: `Bad escaped character in JSON at position 49 (line 2 column 48)`. An unquoted path gives `Unexpected token 'C', …"{ "path": C:/umbrell"… is not valid JSON`. That quotes the file, so no new surface may show the parser's message.

**Design.**
1. README Windows step 7 stays one list line. It adds: write the path with forward slashes, because JSON reads a single backslash as an escape. It says `~/` is the user folder, and it gives one example: `{ "objective": { "projectFile": "OBJECTIVE.md", "path": "~/umbrella/OBJECTIVE.md" } }` (the seed plus a path). No `Run`, `then` or `expect` may sit directly before a code span. `~/` is the only form that objectivePath and doctor's objectiveTarget resolve alike on every leg. On macOS and Linux, `C:/...` resolves under the agent dir.
2. lib/json-text.mjs: `jsonErrorPlace(error)` returns `{line, column}` from V8's trailing `(line L column C)`, or null. It never returns message text. The pattern is a named constant with a contract note.
3. lib/config.ts: when the text does not parse after the existing BOM strip, readConfigFile records the place. From that same single read, loadConfig and loadUserObjective then add `configFailure: {file, line, column}` to the objective settings. Valid, missing and unreadable files give today's objects. The hook and the extension are not edited. Both already pass these settings to produceObjective, so R-018 holds by construction.
4. lib/objective.ts: ObjectiveSettings gains an optional `configFailure`. produce() puts one line first after the heading, so it also shows beside an UNAVAILABLE marker. The line starts with an exported prefix next to MARKER_PREFIX. It names displayPath(file), then `line L, column C` when known, then the forward-slash repair and "Tell the user before spending."
5. lib/doctor.mjs: when readPiPackConfig returns null and the file reads but does not parse once one BOM is removed, the detail names the file, the place when known, and the forward-slash repair. The repair is by hand, because install never rewrites the file. The row stays ✗ (R-1586). A missing or unreadable file keeps today's text. A local helper gets jsonErrorPlace through doctor's existing json-text import. steps.mjs is not edited.
6. packages/nana-pack/README.md objective contract: one bullet for the new line.

| ID | Row | Test (file::title) | Red today |
|---|---|---|---|
| R-1970 | The root README's Windows fresh-machine objective step shall show a nana-pack.json example that parses as JSON and whose objective.path starts with ~/, holds no backslash and resolves to the same path inside the home folder in the objective producer and in doctor. | `packages/nana-setup/tests/fresh-machine.test.mjs::Windows step 7 shows a nana-pack.json example that parses as JSON and whose objective.path resolves inside the home folder alike in the pack and in doctor` | Probed: FAIL `[]`. Step 7 has no JSON example. |
| R-1971 | IF the user-scope nana-pack.json is read but is not valid JSON once one leading byte-order mark is removed, THEN the objective block that the Claude Code hook prints and pi injects shall keep its objective lines and add one line that names the file, the parse error's line and column when the parser reports them, and the forward-slash repair, with no text from the file. | `packages/nana-pack/tests/objective-golden.test.mjs::unparseable user nana-pack.json: both runtimes keep the objective and add one line naming the file, the line and column, and the forward-slash repair, never file text` | Probed: FAIL. No config line on any fixture. In (a) a broken file holds enabled:false, and the block still prints. |
| R-1972 | IF the user-scope nana-pack.json is read but is not valid JSON once one leading byte-order mark is removed, THEN doctor's pi nana-pack.json row shall read ✗ and name the file, the parse error's line and column when the parser reports them, and the forward-slash repair, with no text from the file. | `packages/nana-setup/tests/doctor-detail.test.mjs::doctor names an unparseable nana-pack.json's file, the error's line and column and the forward-slash repair, never the file's text` | Probed: FAIL. The detail is only `missing or unparseable: <path>`. |

**Fixtures** (all three tests use the same three):
- (a) `{\n  "objective": { "enabled": false, "path": "C:\Users\me\umbrella-zq7\OBJECTIVE.md" }\n}\n` gives line 2, column 48.
- (b) is (a) with a BOM and CRLF, and gives the same place.
- (c) `{ "objective": { "path": C:/umbrella-zq7/OBJECTIVE.md } }` reports no place.

**Green evidence.** A prototype in a temp clone turned all three checks green, and 13 regression files stayed green. The readme check found 0 problems, and the rehearsal plans no command for step 7. No test is skipped, because every case can exist on every leg.

**Changes from the seat's plan.** The failure now rides in the objective settings from config.ts's one read. The plan's second read, its hook and extension edits, its steps.mjs edit and R-1973 (the guard for that read) are dropped. R-1973 stays unused.

## Known limits (residuals)
- V8 gives no place for an unexpected token or an empty file. The line then names no place.
- The place format is V8's message, not a contract. A Node that drops the suffix turns R-1971 and R-1972 red there. That failure is loud.
- Out of scope: the gate stop prefix "gate block is malformed". The stop reason, pi's config warning and the journal still quote up to 120 characters of V8's message, and for an unexpected token that is file text.
- The adoption hook still falls back silently. An unreadable user config (a folder, a permission error) still gets no config line.
- A pasted path whose escapes are all valid JSON, such as `D:\temp\new`, parses into a wrong path. R-014 then reports it missing.
- objectivePath expands `~/` only, not `~\`. The macOS step 7 is unchanged.
- While the config does not parse, doctor's pi objective file row judges the default file. Doctor's summary still says to run install (the doctor-fix-line lane owns that).
- This lane closes HANDOFF's "Windows checklist (readme-windows-checklist, review): step 7's config option…" residual. The seat removes that line in the reviewed change.