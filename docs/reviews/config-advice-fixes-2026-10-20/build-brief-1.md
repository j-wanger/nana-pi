# config-advice-fixes: build brief 1

Feature: FEAT-001 · Keep goals and priorities in view (R-2091 in FEAT-015). Class: install, hook or gate. This is a simple lane, built by a Claude Sonnet subagent that follows packages/nana-pack/prompts/builder-preamble.md.
- Build in worktree ~/nana-pi-wt/config-advice-fixes on feat/config-advice-fixes, based on main.
- Use rows R-2090 to R-2094.
- Run single test files only: no full suite and no locked suite.
- Do not push. Do not edit HANDOFF.md or docs/sessions/.

## Change
1. `packages/nana-pack/lib/json-text.mjs`:
   - BACKSLASH_JSON_ERROR also matches `Bad Unicode escape in JSON`. Add a contract comment above it: V8 wording, the same on Node 22 and 24; rows R-1971, R-1972, R-2090 and R-2091.
   - Export FORWARD_SLASH_ADVICE with exactly this text: "Write paths in this file with forward slashes and any other backslash as two, because JSON reads a single backslash as an escape." Its provenance comment: chosen; names no key; the doubling clause fixes a regex (R-2092).
   - Export MANUAL_JSON_ADVICE unchanged, with the provenance comment: contract value, R-1971 and R-1972.
   - Update @outputs so it names the two repair sentences. Keep the constant names and the repair kind "forward-slash".
2. `packages/nana-pack/lib/objective.ts`: configFailureLine reads `o?.configFailure`. Import the two advice names and re-export them beside CONFIG_FAILURE_PREFIX.
3. `packages/nana-pack/tests/objective-golden.test.mjs`:
   - Import both names from objective.ts and delete the two retyped literals.
   - Add the R-2090, R-2092, R-2093 and R-2094 checks after the R-1973 block, before the cleanup.
4. `packages/nana-setup/tests/doctor-detail.test.mjs`:
   - Import both names from objective.ts in place of the retyped literals.
   - Add the R-2091 check right after the R-1972 check.
5. `REQUIREMENTS.md`:
   - Add the five rows from must-meet.md verbatim. R-2090 and R-2092 to R-2094 go after R-1973, at the end of FEAT-001. R-2091 goes after R-1974 in FEAT-015.
   - Set each row to implemented only after its check passes.
   - Then run `npm run req:tree` and `npm run map`, and commit both outputs.
6. Do not edit the hook launcher, bin/nana-objective.mjs, the extension, config.ts, doctor.mjs or either README.

## Tests (each `// req: R-nnn` directly above a one-line `check("title", …`)
- R-2090, objective-golden::a pasted path with a backslash before u: both runtimes give the forward-slash repair, never file text
  - Use golden() plus runPi with world({ config: false }) over two String.raw fixtures: `{ "objective": { "path": "D:\umbrella-zq7\OBJECTIVE.md" } }` and the `c:\users\me\umbrella-zq7\OBJECTIVE.md` path.
  - Expect, per runtime: exactly one config line with the displayed file, ` at line 1, column N.`, FORWARD_SLASH_ADVICE and no MANUAL_JSON_ADVICE.
  - The default umbrella governs, and the text holds neither "zq7" nor "Bad Unicode".
- R-2092, objective-golden::a bad escape in a gate pattern: both runtimes tell the user to write the backslash as two and name no config key
  - Fixture: String.raw `{ "gate": { "extraPatterns": ["rm\s+-rf-zq7"] } }`. Expect one line per runtime, with no "zq7".
  - On the line's text after the displayed file, /backslash as two\b/ matches.
  - None of these keys matches as a whole word: gate, extraPatterns, allowPatterns, protectedPaths, stopReason, postEdit, commands, notify, enabled, headless, journal, path, handoff, staleAfterDays, objective, projectFile, receipts, dir.
- R-2093, objective-golden::produceObjective with no settings object returns the internal-error marker, never throws
  - Call it with undefined and with null, each inside try. Each call returns unavailable: true.
  - Each text starts with `${HEAD}\n\nOBJECTIVE UNAVAILABLE: internal error (`.
- R-2094, objective-golden::an internal producer error keeps the config-failure line before the internal-error marker
  - Settings: `{ get path() { throw new Error("forced producer failure") }, configFailure: { file, line: 3, column: 7, repair: "manual" } }`.
  - Split the text on a blank line into exactly three parts: HEAD; the config line (file, ` at line 3, column 7.` and MANUAL_JSON_ADVICE); then the marker naming "forced producer failure".
- R-2091, doctor-detail::doctor gives the forward-slash repair for a pasted path with a backslash before u, never the file's text
  - Run both u fixtures through diagnoseWithPi.
  - Expect ✗ (status fail), CONFIG_FAILURE_PREFIX, the file, ` at line 1, column N.` and FORWARD_SLASH_ADVICE.
  - Expect no MANUAL_JSON_ADVICE, no "zq7" and no "Bad Unicode".

## Wrong code to try (temporary edits; revert each one)
- W0, main's product code plus the two exports: R-2090, R-2091, R-2092 and R-2093 red.
- W1, the catch branch sets configFailure to null: R-2094 red.
- W2, the advice names journal.path: R-2092 red.
- W3, no Unicode wording in the classifier: R-2090 and R-2091 red.
- W4, `o.configFailure`: R-2093 red.
- W5, "Write paths with forward slashes because …": R-2092 red.
- W6, the advice still names objective.path: R-2092 red.
- W7, every parse error gets the forward-slash repair: R-1971 and R-1972 red.
- A table under docs/reviews must not spell a pi launch as `spawn("pi"`.

## Done
- objective-golden, doctor-detail, objective-injection, config-normalize, fresh-machine and config-display-text each pass when run alone.
- Each wrong code turns red exactly the checks named above.
- `node scripts/requirements-trace.mjs`, `npm run map:check`, `npm run readme:check` and `node scripts/requirements-tree.mjs --check` all exit 0.

## Report (≤ 10 lines)
- VERDICT and commit.
- The exact advice text.
- Each row with its wrong-code variant, its red result and its green result.
- The W5 to W7 results.
- Files changed and single-file pass counts.
- Anything left over.