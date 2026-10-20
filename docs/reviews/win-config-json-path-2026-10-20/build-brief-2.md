# win-config-json-path — build brief 2

Same worktree and branch (tip 7445837e: build 1 at 82ed4542 plus the seat's wrong-code table). Class: install, hook or gate. Rows: R-1970 to R-1979 only; next free ID R-1973 (the plan left it unused) then R-1974. Follow packages/nana-pack/prompts/builder-preamble.md. Single test files only (no full or locked suite); do not push; do not edit HANDOFF.md or docs/sessions/.

## What the seat's checks found on 82ed4542
The independent check HOLDS over nine probes. Three seat pairs survived (record seat-mutate-output-82ed4542.txt):
- **M17 survived:** the line is dropped beside an OBJECTIVE UNAVAILABLE marker. Every R-1971 fixture has a readable default objective file, so a broken config together with an unavailable objective file is never checked. Plan Design 4 says the line shows there too.
- **M23 survived:** doctor reports a missing or unreadable nana-pack.json as unparseable. No test reads doctor's detail for a missing or unreadable file. Plan Design 5 says that text stays as today.
- M18 (the line dropped from produceObjective's internal-error block) also survived. Leave it as a declared limit.

The independent check also found one known bug. The repair sentence always gives the forward-slash advice, in both the objective line and doctor. That is wrong for an empty file, a trailing comma or truncated JSON (probe 3: empty file, `{ "objective": {`, a trailing comma).

## Change
1. **M17.** Add one case to R-1971's check, or a new row R-1973 with its own check if R-1971 would grow wider than its test. A broken user nana-pack.json plus an objective file that cannot be read. Both runtimes print the UNAVAILABLE marker AND the config line, with no file text. Show it red under M17's wrong code (the table's anchor).
2. **M23.** Add a check (new row R-1974, or extend R-1972 if it stays one shall). Doctor's pi nana-pack.json detail for a missing file and for an unreadable one (a folder at the path) keeps main's `missing or unparseable` text and reads ✗. Show it red under M23's wrong code.
3. **Advice by error kind.** Keep the forward-slash repair only for errors that come from a backslash in a string: V8's bad escaped character and bad control character errors. Classify internally from the error. Never print its message. For any other parse error, the line says to repair the JSON by hand at the place shown, or with no place when none is known. Both the objective line and doctor use one shared helper, so R-018's byte identity holds. Extend R-1971 and R-1972's fixtures, or add one row, so a trailing-comma file is checked for the other advice.

## Done
objective-golden, doctor-detail, fresh-machine, config-normalize, objective-injection and bounded-read each green alone. Each new or extended check red on 82ed4542's product code. Trace, `npm run map:check`, `npm run readme:check` and `node scripts/requirements-tree.mjs --check` exit 0. Run `node docs/reviews/win-config-json-path-2026-10-20/seat-mutate.mjs M17 M23` once: both must now be red. Do not edit the seat's table.

## Report (≤ 8 lines)
VERDICT; commit; the two advice sentences' exact text; new or extended rows with red-then-green evidence; M17 and M23 results; files changed.
