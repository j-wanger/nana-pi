Feature: FEAT-011 · Keep policy changes safe and recoverable
Class: install, hook or gate (the pi gate's stop reason, built in packages/nana-pack/lib/config.ts and returned by the nana-gate extension). Full ladder: roster reviewer, land reviewer (or seat-land.md when the roster prints land: seat), the seat's wrong-code pairs, one independent check. Builder: Claude Sonnet subagent. Install-check not required (no nana-setup or hook file changes; the objective hook's import of config.ts is guarded by objective-golden).
Threat model: honest hand-edit mistakes in scope (a single backslash in a pasted Windows path, a trailing comma, an empty file, an unquoted word); BOM and UTF-16 bytes are already decoded by parseJsonBytes. A forged config is out of scope; whatever its text, the stop still blocks.

Feature sentence: WHEN a user-scope or nana-trusted project nana-pack.json does not parse and this process has loaded no valid policy for that file, the gate stops every gated tool with a reason that says the file does not parse, names the file, gives the line and column when the parser reports them, and gives the same repair advice as the objective config-failure line, with no text from the file. A parseable file with a bad gate block keeps today's "gate block is malformed" text.

Falsifiable on main (probe, 72abe19a): a user nana-pack.json holding only {"objective":{"path":"C:\Users\demo\notes\OBJECTIVE.md"}} stops every gated tool with "user nana-pack.json gate block is malformed — repair it (<file>:invalid JSON (Bad escaped character in JSON at position 25 (line 1 column 26)))". The file has no gate block, and the stop gives no repair advice. After the lane: "nana-gate: user nana-pack.json does not parse: <file> at line 1, column 26. <forward-slash advice> Recovery: ...".

Design (lib/config.ts only; json-text.mjs, nana-gate.ts and the objective hook unchanged):
- One module-local builder beside gateStopReason (not exported) that reuses the config-failure line:
  `${scope} nana-pack.json does not parse: ${configFailureDetail(displayPath(file), failure).slice(CONFIG_FAILURE_PREFIX.length).replace(/\.$/, "")}`
  The objective line, doctor and the gate share one place format and one advice choice. The final period is dropped because nana-gate appends ". Recovery: ...".
- In loadConfig's user and project stop branches, use it when user.jsonFailure / pr.jsonFailure is set; otherwise call gateStopReason unchanged.
- No parser message in this stop. gateStopReason, the catch-all stop, the last-valid fallback and the user-wins order stay as they are.
- Pack README, Malformed config bullet (both scopes): document the parse form beside today's form.

| Row | Requirement (EARS) | Test file::title | Red today |
|---|---|---|---|
| R-2360 | IF the user-scope nana-pack.json does not parse at process start because a path outside the gate block holds a single backslash, THEN the gate's stop reason shall say the file does not parse and give the file, the line and column, and the forward-slash repair advice of the config-failure line, never that the gate block is malformed. | packages/nana-pack/tests/config-gate-fallback.test.mjs::f: a single backslash in a path outside the gate block — the stop says the file does not parse, with line, column and the forward-slash repair | Probe: "gate block is malformed ... invalid JSON (Bad escaped character ... (line 1 column 26))", no advice. |
| R-2361 | IF the user-scope nana-pack.json does not parse at process start because of a trailing comma, THEN the gate's stop reason shall say the file does not parse and give the manual JSON repair rather than the forward-slash repair. | packages/nana-pack/tests/config-gate-fallback.test.mjs::f: a trailing comma — the stop says the file does not parse, with the manual JSON repair | Probe: "gate block is malformed ... Expected double-quoted property name ...", no advice. |
| R-2362 | IF the user-scope nana-pack.json is empty at process start, THEN the gate's stop reason shall say the file does not parse and give the manual JSON repair with no line or column. | packages/nana-pack/tests/config-gate-fallback.test.mjs::f: an empty file — the stop says the file does not parse, with the manual JSON repair and no line or column | Probe, 0-byte: "gate block is malformed ... (Unexpected end of JSON input)". |
| R-2363 | IF the user-scope nana-pack.json does not parse at process start, THEN the gate's stop reason shall carry no text from the file. | packages/nana-pack/tests/config-gate-fallback.test.mjs::f: an unparseable file — the stop carries no text from the file | Probe with {"gate": zq7oops}: today's stop quotes `"{"gate": zq7oops}"`. (The plan's UNQUOTED_WORD_IN_FILE is truncated by V8 to UNQUOTED_W, so its word clause was green on main.) |
| R-2364 | IF a nana-trusted project's .pi/nana-pack.json does not parse at process start because of a single backslash while the user-scope file is valid, THEN the gate's stop reason shall say the project file does not parse and give the project file, the line and column, and the forward-slash repair advice. | packages/nana-pack/tests/config-project-gate-fallback.test.mjs::parse: a trusted project file with a single backslash — the stop says the project file does not parse, with line, column and the forward-slash repair | Probe: FAIL on main ("project ... gate block is malformed"), PASS on the sketch. |

All five run on every platform with no skip. The V8 messages are the same on Node 22 and 24, and displayPath leaves a normal Windows temp path unchanged; the existing raw-path STOP regexes already pass on the Windows leg.

Neighbour guards (existing, stay green, no new rows):
- Valid-JSON bad-leaf cases keep the old text, so "parse text for every stop" fails: the R-064 "c:" checks, gate-corpus R-049 and config-normalize R-081.
- R-188: config-display-text section 2 sends a parse failure through the stop under a hostile HOME ("one line, no control", "path shown escaped"). Probe: a raw path instead of displayPath turns both red.
- R-063, R-064 b, R-067, R-068, R-773: the stop still blocks every gated class and the last valid policy is kept mid-session. Only their text regexes change.

Measured churn (both sketches, single files): 17 existing checks in four files go red on text alone. config-gate-fallback 6 (b ×5 R-064, "b: the reason names the problem (invalid JSON)"); config-project-gate-fallback 8 (1 ×5, 2, 3, R-068 control); config-normalize 2 (trailing-comma checks); gate-survives-mutation 1 (4b). The R-067 mid-session `!PSTOP` clause goes vacuous, so point it at the parse regex.

Known limits (residuals):
- Unreadable files keep today's text: EACCES, EISDIR, FIFO, a dangling symlink, over the 1 MiB cap.
- A parseable non-object top level ([] or null) keeps today's text.
- Some V8 errors report no place (an unquoted word, end of input). Those stops name the file with no line or column, as the objective line does.
- The config_invalid warning and its journal line still carry the parser message (at most 120 chars), which can quote file text.
- A mid-session parse failure keeps the last valid policy and shows no stop (unchanged).
- The gate stop now follows configFailureDetail's shape (prefix first, final period). A later change to that shape must rerun these five checks.
Seat note: a seat wrong-code script under docs/reviews must not spell a pi launch as a literal spawn("pi" (knowledge-home-isolation scans for it).