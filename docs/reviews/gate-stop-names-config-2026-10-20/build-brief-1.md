Build brief — gate-stop-names-config (Feature: FEAT-011 · Keep policy changes safe and recoverable)
Worktree ~/nana-pi-wt/gate-stop-names-config, branch feat/gate-stop-names-config from main (72abe19a or newer). Follow packages/nana-pack/prompts/builder-preamble.md. Lane class: install, hook or gate. Threat model: honest hand-edit mistakes in; forged configs out.
Run single test files only (node --experimental-strip-types <file>). Never run the full suite; other lanes hold the machine's suite lock. Never edit HANDOFF.md or docs/sessions/.

What to change
1. REQUIREMENTS.md, FEAT-011 table: add R-2360..R-2364 as untested with the must-meet text. Flip each to implemented with its evidence when its test passes.
2. packages/nana-pack/lib/config.ts:
   - Import CONFIG_FAILURE_PREFIX and configFailureDetail from ./json-text.mjs.
   - Add ONE module-local builder (no export) beside gateStopReason:
     `${scope} nana-pack.json does not parse: ${configFailureDetail(displayPath(file), failure).slice(CONFIG_FAILURE_PREFIX.length).replace(/\.$/, "")}`
     Do not re-implement the place format or the advice choice. Drop the period because nana-gate appends ". Recovery: ...".
   - In loadConfig, use it in the user stop branch when user.jsonFailure is set and in the project stop branch when pr.jsonFailure is set. Otherwise keep gateStopReason exactly.
   - Put no parser message in it. Do not touch json-text.mjs, nana-gate.ts, the catch-all stop or loadUserObjective.
   - Update the @outputs header line only if it no longer holds.
3. New tests. Put each `// req: R-nnn` marker DIRECTLY above its `check("title", …` call, with the title's opening quote on the same line as `check(`. The trace scanner fails CI otherwise.
   - config-gate-fallback.test.mjs, new section (f), after (e). Use freshHome() + freshProcess() and assert on the bash reason. Import FORWARD_SLASH_ADVICE and MANUAL_JSON_ADVICE from ../lib/json-text.mjs; never retype the advice.
     - R-2360: String.raw`{"objective":{"path":"C:\Users\demo\notes\OBJECTIVE.md"}}`. Assert all of these: block; the reason starts with "nana-gate: user nana-pack.json does not parse"; it includes the cfg path, `line L, column C` and `${FORWARD_SLASH_ADVICE} Recovery:` (this pins that no double period appears); it lacks "gate block is malformed". Derive L and C from JSON.parse of the fixture with jsonErrorPlace, not a literal.
     - R-2361: the file's TRAILING fixture. Assert MANUAL_JSON_ADVICE present and FORWARD_SLASH_ADVICE absent.
     - R-2362: a 0-byte file. Assert MANUAL_JSON_ADVICE and no " at line ".
     - R-2363: '{"gate": zq7oops}'. Assert the reason lacks "zq7" and lacks '{"gate"'. Do NOT use a long word: V8 truncates it, and the check goes green on main.
   - config-project-gate-fallback.test.mjs, R-2364, new block before process.exit. Use a valid USER_CFG and project(String.raw`{"handoff":{"path":"C:\Users\demo\HANDOFF.md"}}`). Assert: block; the "nana-gate: project nana-pack.json does not parse" prefix; P.file; `line 1, column N`; `${FORWARD_SLASH_ADVICE} Recovery:`.
   - All five are cross-platform. No skip.
4. Existing checks that go red on text alone (measured: 17 in four files).
   - Point them at a parse-form regex and keep their block assertions. Keep every rowed title unchanged: b ×5 (R-064) and "control: both malformed → the user stop wins" (R-068).
   - The checks: config-gate-fallback (b) ×6; config-project-gate-fallback 1 ×5, 2, 3, the R-068 control; config-normalize, the two trailing-comma checks; gate-survives-mutation 4b.
   - Switch the R-067 mid-session `!PSTOP` clause to the parse regex.
   - Leave every valid-JSON leaf check ("gate block is malformed") exactly as it is.
5. packages/nana-pack/README.md: in the Malformed config bullet only, add the parse-form stop for both scopes. Say its place and repair match the objective's config-failure line, with no place when the parser reports none. Two in-flight lanes edit other parts of this README.
6. Run npm run req:tree, then npm run map:check (npm run map if the header changed), npm run readme:check, and node --experimental-strip-types scripts/requirements-trace.mjs.

Wrong code to try (revert each after it goes red):
- Today's text for parse failures → R-2360..R-2364 red.
- The parse builder for every stop → R-064 "c:" checks and gate-corpus R-049 red.
- Pass {...failure, repair: flipped} → R-2360 and R-2361 red.
- Pass {repair: failure.repair} (place dropped) → R-2360 and R-2364 red.
- Keep the advice's final period → R-2360 and R-2364 red.
- Append the parser message → R-2363 red.
- Project branch reads user.jsonFailure, or labels itself "user" → R-2364 red.
- Raw file instead of displayPath → config-display-text "path shown escaped" red.

Done: the five new checks pass. These pass as single files: the four edited files, config-display-text, bounded-read, gate-corpus, agent-dir-hostile, agent-dir-config, objective-golden and pack-config-utf16. The trace scanner, map:check and readme:check are clean. Rows are flipped with evidence.
Report (≤ 10 lines): files changed; new and edited check titles; each wrong code with the check it turned red; single-file results; any deviation from this brief.

## Seat amendments (re-check on main 9552afb1)

- Base the branch on main 9552afb1. `lib/config.ts`, `lib/json-text.mjs` and the four test files you edit are unchanged since the plan's base, so every line and title above still holds.
- Step 5 is out of date. The README lanes it calls in-flight have landed. The Malformed config bullet is still at about lines 535–556. Change only that bullet. Later slate lanes edit other paragraphs of this README, so whoever lands second merges main.
- `extensions/nana-gate.ts` changed on main for temp roots and rm outside the working folder. Its stop line is unchanged (`nana-gate: ${gate.stopReason}. Recovery: …`). Still leave the file alone.
- config-normalize's two trailing-comma checks read `cfg.gate.stopReason` directly, not the gate's block reason. Their parse regex starts `^user nana-pack\.json does not parse: ` (or `^project …`) with no `nana-gate: ` prefix. It ends at the advice with no final period and no Recovery suffix. Measured: `user nana-pack.json does not parse: <file> at line 3, column 37. Repair the JSON by hand`.
- Keep the existing STOP and PSTOP constants. Add a separate parse regex beside them. These checks keep today's text and must stay on the old regex:
  - the leaf checks in config-gate-fallback (c) and (d), and "malformed gate leaf" in config-project-gate-fallback
  - "U2-B: dangling project nana-pack.json symlink …" (an unreadable file, not a parse failure)
  - config-normalize's leaf-matrix checks
- Also run `config-handlers-malformed` and `gate-rm-outside` as single files. Both must stay green.
- Report the PASS count of each edited file. Measured baseline on 9552afb1 (macOS):
  - config-gate-fallback: 38, plus your new (f) checks
  - config-project-gate-fallback: 27, plus R-2364's check
  - config-normalize: 23, unchanged
  - gate-survives-mutation: 38, unchanged
- Keep `lib/json-text.mjs` unedited. It is the one shared parse-failure helper, and knowledge-sources-unparseable imports from it too.
- This lane can land in any slot. If another slate lane lands first, merge main, then run `npm run req:tree` again. Also run `npm run map` again if the config.ts header changed. Every slate lane edits REQUIREMENTS.md, docs/requirements-tree.md and docs/code-map.md.

## Cross-lane fixes (the seat's check of all nine amendments)

- After any merge of main, run both `npm run map` and `npm run req:tree`, whether or not config.ts's header changed.
- Your new json-text imports in config-gate-fallback and config-project-gate-fallback change their map entries.
- knowledge-sources-unparseable also adds a caller to json-text.mjs's map entry. Never merge docs/code-map.md by hand.

## Seat (2026-10-20 ~16:45 EDT, after the re-check)

- Builder: pi-worker --lane gate-stop-names-config --lane-size larger (the roster's larger-lane builder, pi gpt-5.6-sol). The owner kept pi sol for larger lanes after power mode; ignore any line above that calls the builder an open question or names a Claude builder.
- Reviews: Claude Opus 5.5 is the final reviewer and pi gpt-6-astra the land reviewer; the seat lands when every reviewer says LAND (the owner's standing rule since 2026-10-20).
- Run single test files only, never the full suite: eight other builders share this machine, and the seat runs the locked suite at land.
- Branch: from main 9552afb1. Land order across the slate (each later lane merges main before its final review): knowledge-sources-unparseable, lifecycle-compaction-reason, gate-stop-names-config, review-launch-win-paths, shared-memory-index-cap, project-odd-seeds, verifier-pipe-commit-match, win-hook-variant-loop, claude-config-dir.
- No push; no HANDOFF.md, docs/sessions/ or docs/reviews/ edits; commit with explicit paths.
