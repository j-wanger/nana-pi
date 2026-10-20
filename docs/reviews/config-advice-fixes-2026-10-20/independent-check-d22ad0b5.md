# Independent check — config-advice-fixes at d22ad0b5 (2026-10-20)

VERDICT: HOLDS

Setup: a private clone at `$P=<tmp>/config-advice-fixes-check.83DGSO`, with `$P/lane` at d22ad0b5 and `$P/main` at 385c633f. Every probe ran with a temp HOME under `$P` and with PI_CODING_AGENT_DIR unset. This machine has only Node v22.22.2.

Must-meet tests:
- M1: `HOME=$P/home TMPDIR=$P/tmp node packages/nana-pack/tests/objective-golden.test.mjs` exits 0 with 1278 PASS and no FAIL. The R-2090, R-2092, R-2093 and R-2094 checks all PASS. HOLDS.
- M2: `node packages/nana-setup/tests/doctor-detail.test.mjs` exits 0 with 71 PASS. The new R-2091 check ("doctor gives the forward-slash repair … backslash before u") and the R-1972 check both PASS. HOLDS.

Probes:
1. `node probe/run.mjs $P/h-f1 f1.json` runs the Claude Code hook launcher and `bin/nana-objective.mjs`. The config is `{"objective":{"path":"C:\Users\ann\umbrella\OBJECTIVE.md"}}`. Both exit 0 and print the same output: `NANA-PACK CONFIG UNPARSEABLE: <H>/.pi/agent/nana-pack.json at line 1, column 30. Write paths in this file with forward slashes and any other backslash as two, … Tell the user before spending.` The objective lines are kept. HOLDS.
2. f2 is a lowercase `c:\users\ann\umbrella` path saved with a byte-order mark and CRLF line ends. V8 says `Bad Unicode escape … (line 3 column 18)`. The hook and the producer print the same line: `at line 3, column 18. Write paths in this file with forward slashes …`. There is no file text. HOLDS.
3. f3 is `"C:\new\umbrella\OBJECTIVE.md"`, where the first escape is valid and `\u` fails later. Main says `Repair the JSON by hand.` and the lane says `Write paths in this file …`. That one line is the only diff in the full hook stdout. HOLDS.
4. f4 is a gate allowPatterns entry `"^git\s+status"`. Main says `Write objective.path with forward slashes …` and the lane gives the advice with no key name and the doubling clause. That line is the only diff. HOLDS.
5. f5 is `{"journal":{"path":"D:\logs\nana.jsonl"}}`. The output is `… column 28. Write paths in this file with forward slashes and any other backslash as two …`. HOLDS.
6. f6 is a trailing comma, and f8 is a valid config with the gate regex written correctly as `rm\\s+`. Under `full.mjs`, the full hook stdout from main and from the lane is byte-identical for both. f6 says `Repair the JSON by hand.` and f8 shows `governing: <H>/umbrella-zq7/OBJECTIVE.md` plus the objective lines. Nothing main does today changed. HOLDS.
7. `node probe/doc.mjs $P/h-fN` runs doctor's diagnose with the pi stub. For f1–f4 the row is `{"status":"fail","label":"pi nana-pack.json","detail":"NANA-PACK CONFIG UNPARSEABLE: …/nana-pack.json at line 3, column 18. Write paths in this file …"}`. For f6 the detail ends `Repair the JSON by hand.` HOLDS.
8. `node probe/direct.mjs darwin|win32` calls produceObjective directly. Main throws `TypeError: Cannot read properties of undefined (reading 'configFailure')`, and the same for null. The lane returns the heading plus `OBJECTIVE UNAVAILABLE: internal error (TypeError … reading 'path')` with `unavailable: true` on both darwin and forced win32. On forced win32, a `C:\Users\ann\.pi\agent\nana-pack.json` failure prints the new advice. A failure with no place prints `… nana-pack.json. Repair the JSON by hand.` HOLDS.
9. I ran two mutants of my own on separate copies of the lane:
   - Dropping `|Bad Unicode escape in JSON` turns red only the R-2090 check in objective-golden and the R-2091 check in doctor-detail (`[false,false]`).
   - Putting the config line after the marker in the catch branch turns red only the R-2094 check.
   The tests catch both. HOLDS.
10. Ran in `$P/lane`, all exit 0:
    - `code-map.mjs --check` reports 0 problems.
    - `readme-check.mjs` reports 718 claims with 0 problems.
    - `requirements-tree.mjs --check` passes.
    - `requirements-trace.mjs` passes.

    `requirements-moved.mjs --base 385c633f` reports R-2090, R-2092, R-2093 and R-2094 as new under FEAT-001, and R-2091 as new under FEAT-015. HOLDS.
11. An inline call to `jsonParseFailure` and `configFailureDetail` covered five inputs:
    - An empty file gives `Repair the JSON by hand.` with no place.
    - `"caf\u00e9"` followed by `\q` gives the new advice at column 24.
    - An uppercase `\U` gives the new advice at column 10.
    - A byte-order mark followed by valid JSON parses.
    - A file cut off inside `\u00` gives the forward-slash advice at column 15 (known bug K2).
    HOLDS.
12. Harm check. After every probe, `git -C <worktrees>/config-advice-fixes rev-parse --short HEAD` is still d22ad0b5. `<repo>` is clean, and `$P/tmp` holds only node-compile-cache. The test files cleaned up their temp homes. I wrote nothing outside `$P`. HOLDS.

Findings (none is MUST):
- K1 (known bug, record keeping): at d22ad0b5 the lane does not change HANDOFF.md. HANDOFF still lists the four residuals this lane closes, at lines 619 and 621–623. Line 613 still says a wording change "fails two checks loudly". The plan says the seat updates these in the reviewed change. If the lane lands at this tip, those lines are false.
- K2 (known bug, minor): a file truncated inside a `\u` escape gets the forward-slash advice. It does name the right line and column. This sits beside the plan's raw-control-character residual.
- K3 (not verified): I did not run Node 24's error wording, because this machine has only Node 22.22.2. The planner saw the same wording on Node 24 on macOS.
- Note: the lane worktree holds an untracked `docs/reviews/config-advice-fixes-2026-10-20/seat-mutate.mjs`. I did not create it. `nana-land` may refuse to land while the source is not clean.

Probe scripts: `$P/probe/run.mjs`, `$P/probe/full.mjs`, `$P/probe/doc.mjs`, `$P/probe/direct.mjs`, and fixtures `$P/probe/f1.json`–`f8.json`.