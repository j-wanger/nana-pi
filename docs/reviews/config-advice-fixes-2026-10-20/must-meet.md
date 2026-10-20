# config-advice-fixes: the config line's repair fits every backslash error, and the producer never throws (plan, 2026-10-20)

Feature: FEAT-001 · Keep goals and priorities in view (R-2091 lives in FEAT-015 · Diagnose the active environment)

**Feature.** Sometimes the user nana-pack.json fails on a backslash escape. Then both runtimes' config line and doctor's row give a repair that fits the cause and name no config key. A pasted D:\umbrella or c:\users path gets forward slashes, and a gate pattern gets the backslash written as two. The objective producer also returns its internal-error marker instead of throwing when it gets no settings object.

**Class: install, hook or gate.** The lane changes what the objective hook prints and what pi's nana-objective extension injects, through lib/objective.ts and lib/json-text.mjs. Through json-text it also changes doctor's pi nana-pack.json row. It needs seat wrong-code pairs and the land reviewer, or seat-land.md when the roster prints land: seat. It also needs one independent check and install-check.mjs on macOS before nana-land. The precedent is win-config-json-path: same files, same class.

**Threat model.** Honest variation is in scope:
- a pasted Windows path with any first escape letter in either case
- a bad escape in any key, such as a gate pattern or journal.path
- a BOM or CRLF
- Node 22 and Node 24
- the three CI legs

A forged config is out of scope, and so is a hand-built settings object outside the tests.

**Today (probed on main 385c633f in a temp copy, temp HOME).**
- Node 22.22.2 gives `Bad Unicode escape in JSON at position 10 (line 1 column 11)` for `{"p":"D:\umbrella"}` and for `c:\users\x`. `C:\x`, `\x41` and a gate pattern's `rm\s+` give `Bad escaped character …`. The planner saw the same wording on Node 24.18.0.
- BACKSLASH_JSON_ERROR does not match the Unicode wording, so jsonParseFailure returns manual.
- Take `{ "objective": { "path": "D:\umbrella-zq7\OBJECTIVE.md" } }`. The hook and pi print `… at line 1, column 31. Repair the JSON by hand. Tell the user before spending.`, and doctor shows the same detail as ✗. A lowercase `c:\users\…` path behaves the same way.
- Take `{ "gate": { "extraPatterns": ["rm\s+-rf-zq7"] } }`. The hook, pi and doctor all say `Write objective.path with forward slashes …`. That names a key the error is not in, and forward slashes are the wrong fix for a regex.
- produceObjective(cwd, undefined) and produceObjective(cwd, null) throw `Cannot read properties of undefined/null (reading 'configFailure')` from the catch branch.
- When produce fails inside, the block shows the heading, then the config line, then the internal-error marker. That is correct, but no check reaches the branch: the earlier lane's pair M18 survived.

**Design.**
1. json-text.mjs: BACKSLASH_JSON_ERROR also matches `Bad Unicode escape in JSON`. A contract comment records the V8 wording and the rows R-1971, R-1972, R-2090 and R-2091.
2. json-text.mjs: FORWARD_SLASH_ADVICE becomes "Write paths in this file with forward slashes and any other backslash as two, because JSON reads a single backslash as an escape." Its provenance is `chosen`: it names no key, and its doubling clause is the fix for a regex (R-2092). The module exports it, and also exports MANUAL_JSON_ADVICE with the provenance "contract value, R-1971 and R-1972". The constant names and the repair kind "forward-slash" stay as they are.
3. objective.ts: configFailureLine reads `o?.configFailure`. The module re-exports the two advice names beside CONFIG_FAILURE_PREFIX, following doctor-detail's existing import precedent.
4. objective-golden and doctor-detail import the two names and drop their retyped literals. The R-1971 and R-1972 checks keep their titles.
5. Left untouched: the hook launcher, bin/nana-objective.mjs, the extension, config.ts, doctor.mjs and both READMEs. The pack README bullet ("forward-slash advice for a backslash error") and the root README's step 7 stay true. The text of R-1971 and R-1972 stays the same.

| ID | Row | Test (file::title) | Red today |
|---|---|---|---|
| R-2090 | IF the user-scope nana-pack.json does not parse because a backslash before a u does not start a four-hex-digit Unicode escape, as in a pasted D:\umbrella or c:\users path, THEN the config-failure line that the Claude Code hook prints and pi injects shall give the forward-slash repair rather than the manual JSON repair, with no text from the file. | `packages/nana-pack/tests/objective-golden.test.mjs::a pasted path with a backslash before u: both runtimes give the forward-slash repair, never file text` | Probed: FAIL under W0. Both runtimes say "Repair the JSON by hand." |
| R-2091 | IF the user-scope nana-pack.json does not parse because a backslash before a u does not start a four-hex-digit Unicode escape, THEN doctor's pi nana-pack.json row shall read ✗ with the forward-slash repair rather than the manual JSON repair, with no text from the file. | `packages/nana-setup/tests/doctor-detail.test.mjs::doctor gives the forward-slash repair for a pasted path with a backslash before u, never the file's text` | Probed: FAIL under W0 ([false,false]). |
| R-2092 | IF the user-scope nana-pack.json does not parse because of a bad escape outside objective.path, such as in a gate pattern, THEN the config-failure line that the Claude Code hook prints and pi injects shall tell the user to write the backslash as two and name no nana-pack.json key. | `packages/nana-pack/tests/objective-golden.test.mjs::a bad escape in a gate pattern: both runtimes tell the user to write the backslash as two and name no config key` | Probed: FAIL under W0. The line names objective.path and has no doubling clause. |
| R-2093 | IF the objective producer is called with no settings object, THEN it shall return the objective heading and an OBJECTIVE UNAVAILABLE internal-error marker instead of throwing. | `packages/nana-pack/tests/objective-golden.test.mjs::produceObjective with no settings object returns the internal-error marker, never throws` | Probed: undefined and null both throw on main. |
| R-2094 | IF the objective producer fails inside while its settings carry a config failure, THEN its block shall show the config-failure line between the heading and the OBJECTIVE UNAVAILABLE internal-error marker. | `packages/nana-pack/tests/objective-golden.test.mjs::an internal producer error keeps the config-failure line before the internal-error marker` | A pin: green today. Probed: FAIL under W1 (M18). |

**Fixtures.**
- R-2090 and R-2091 use `{ "objective": { "path": "D:\umbrella-zq7\OBJECTIVE.md" } }` and `{ "objective": { "path": "c:\users\me\umbrella-zq7\OBJECTIVE.md" } }`, both written with String.raw.
- R-2092 uses `{ "gate": { "extraPatterns": ["rm\s+-rf-zq7"] } }`. On the line's text after the displayed file, its check requires /backslash as two\b/ and that no NanaPackConfig key matches as a whole word.
- R-2093 calls the producer with undefined and with null.
- R-2094 passes a throwing `path` getter plus configFailure {file, line: 3, column: 7, repair: "manual"}.
- No check is skipped: every case can exist on every leg.

**Wrong code (probed in a temp copy; each one turns red only the checks named here).**
- W0, main's product code plus the two exports: R-2090, R-2091, R-2092 and R-2093.
- W1, the catch branch drops the config line: R-2094.
- W2, the advice names journal.path: R-2092.
- W3, no Unicode wording in the classifier: R-2090 and R-2091.
- W4, `o.configFailure`: R-2093.
- W5, "Write paths with forward slashes because …": R-2092.
- W6, the classifier fixed but the advice still names objective.path: R-2092.
- W7, every parse error gets the forward-slash repair: the existing R-1971 and R-1972 checks.

**Prototype (adversary's temp copy).**
- objective-golden: 1278 PASS in 28 s. doctor-detail: 71 PASS.
- requirements-trace exits 0, with 0 rows off EARS form and 1282 implemented rows, all traced.
- requirements-tree --check passes after --write.
- map:check reports 0 problems, and readme:check reports 0 problems over 718 claims.

## Known limits (residuals)
- R-2092's check reads the phrase "backslash as two". A reword that keeps the meaning but drops the phrase fails the check, so a reword changes the row and the check together.
- R-2092's key list is typed from NanaPackConfig. A key added to the config later is not covered until someone adds it to the list.
- A pasted path whose escapes are all valid (\b \f \n \r \t \/ or \uXXXX) still parses silently into a wrong path. This is an existing residual.
- A raw control character that no backslash caused still gets the forward-slash repair, a classification inherited from the earlier lane.
- R-2093 is a contract fix that no user sees: neither runtime can pass a missing settings object today.
- Doctor's row carries the reworded advice only through the shared constant. No check reads doctor's row for a key name or the doubling clause.
- Node 24's wording was probed by the planner on macOS only. The adversary re-probed Node 22 only, and CI runs Node 22 on all three legs.
- This lane closes four HANDOFF residuals marked "Config line (win-config-json-path …)": the internal-error block, the bad Unicode escape, the objective path named in the advice, and the throw without settings. The seat removes them in the reviewed change and updates the "fails two checks loudly" wording-change residual to four.