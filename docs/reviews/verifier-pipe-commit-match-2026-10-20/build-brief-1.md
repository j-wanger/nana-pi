# verifier-pipe-commit-match — build brief 1

Feature: FEAT-010 · Guard risky commands and protected resources
Lane class: install, hook or gate. Threat model: honest spelling variation is in scope. Deliberate evasion is out, and the sandbox is the boundary.
Builder: pi gpt-5.6-sol through `pi-worker --lane verifier-pipe-commit-match`. Work in `~/nana-pi-wt/verifier-pipe-commit-match` on `feat/verifier-pipe-commit-match`, from main 72abe19a or newer. Follow `packages/nana-pack/prompts/builder-preamble.md`. Never edit HANDOFF.md or docs/sessions/. Read must-meet.md first: its Design is the spec.

Hard rules
- Run single test files only (`node <file>`). Never run the full suite: other lanes hold this machine's suite lock.
- Each `// req:` marker sits on the line directly above its `check(` call.
- The title's opening quote or backtick sits on the same line as `check(`, as in ``check(`discarded status: ${name}`, …``. A split broke CI in slate 22.
- No inline tunables or vocabularies, and no typed leaf total. Every module keeps its six-tag header.
- No pipe before `&&` or a commit in your own shell commands.

Change
1. `packages/nana-pack/lib/pipe-guard.mjs`: build Design exactly. That covers the finder (left neighbours include the backtick), the reader, the two exposures and the named constants with `// contract: R-2351`. The reader has three parts:
   - after a separator, a closer, `fi`, `done` or `esac` is passed over and the scan goes on;
   - `$?` counts only in the next command;
   - `then`, `do` and the keyword closers apply to bash only.
   Keep it linear. Compute the exposures on live text only, so powerShellSpans does not change. Update `@purpose`.
2. `REQUIREMENTS.md`, in FEAT-010 after R-984: add rows R-2350–R-2357 word for word from must-meet.
   - R-982 becomes `retired`, with this Evidence: "superseded by R-2350–R-2354, 2026-10-20: a pipeline whose status `;` or a newline discards no longer asks".
   - In R-1064, replace "whose command masks a test's exit code through a live pipe" with "whose command the shared verifier-pipe predicate asks on". Leave its evidence cell to the seat.
3. `pipe-guard.test.mjs`: add four tables with must-meet's cases: `discarded status:` (R-2350), `consumed status:` (R-2351), `git spelling:` (R-2352) and `not a commit:` (R-2353). Add the R-2357 check beside the R-983 handler checks. The old table keeps `predicate table: ${name}` under `// req: R-2354`.
4. Move every case whose pipe must stay live from `;` or a newline to `&&`. Put the `&&` right after the pipeline that holds the pipe. Where a masking construct holds the pipe, put the `&&` inside the construct, as in `# npm test | x &&\ngit commit -m x`. The cases:
   - pipe-guard.test.mjs: the R-2354 and R-1062 tables, the R-983 PowerShell check (line 160), and the precedence check (line 166, which becomes `rm -rf /tmp/x | cat && git commit -m done`).
   - pipe-guard-pwsh-oracle.test.mjs: the R-1733–R-1739 cases, including the R-1734 negative and "pipeline before single-quoted assignment".
   - verifier-pipe.test.mjs: the R-1054 and R-1062 decideHook cases, and the malformedShape command.
   - hooks-win32-exec.test.mjs: lines 175 and 180.
5. `packages/nana-setup/lib/install-check-config.mjs`: set `SAMPLE_INPUTS.verifier.powershellHit` to `npm test | Select-Object -Last 5 && git commit -m x`, with provenance "chosen 2026-10-20: a `;` no longer asks (R-2350)". At install-check.test.mjs line 286, read that name instead of the literal.
6. `verifier-pipe.test.mjs`:
   - Add the R-2355 check through `invokeInstalledHook`, using must-meet's two Bash events.
   - Add the R-2356 check: both README guard lines match /a `;` or a newline/, /does not prompt/, /`git\.exe`/ and /path/.
   - Move the marker at line 198 from R-982 to R-2354.
7. Both README "Verifier-pipe guard" lines: replace "pipelines output before `git commit`" with the read-status rule. Keep every phrase the R-985 and R-2354 checks match.
8. Run `npm run map` and `npm run req:tree`, then commit docs/code-map.md and docs/requirements-tree.md.

Tests to run, one file at a time
- Pack tests: pipe-guard, pipe-guard-pwsh-oracle, gate-corpus, requirements-trace.
- Setup tests: verifier-pipe, install-check, hooks-closed-output.
- `npm run map:check` and `npm run readme:check`.
- hooks-win32-exec skips off Windows. pwsh is absent here, so the span oracle runs only on CI.

Wrong code to try. Revert after each.
1. Today's rule (any live pipe asks) → R-2350 and R-2357.
2. `$?` read anywhere later → R-2350 (`echo "check $?"` case).
3. Only `&&` reads → R-2351.
4. No `then`/`do` reader → R-2351.
5. No errexit reader → R-2351.
6. No `$?` reader → R-2351.
7. No `"$?"` exposure → R-2351.
8. A closer, `fi` or `done` after a separator ends the scan as discarded → R-2351 (`{ P; } 2>&1 &&`, `done &&`).
9. `2>&1` or `|&` read as background → R-2351.
10. No `.exe` in the finder, or a case-sensitive finder → R-2352.
11. No backtick neighbour → R-2352.
12. No quoted-word exposure, or exposure refused on any `$` → R-2352.
13. A `\bgit` boundary or a `git\S*` finder → R-2353.
14. No leading pipefail exemption → R-2354.
15. liveText returns its input unmasked in both dialects → every negative whose quote, comment, heredoc or string hides its pipe turns red. List each one that stays green, with the reason.
16. In nana-gate.ts, let the pipe reason replace an existing hit → the R-983 precedence check turns red.

Done when:
- every file above passes, and map:check and readme:check pass;
- the trace reports 0 problems;
- two commands of about 64 KB before `; git commit`, one pipeline of 16 000 pipes and 8 000 one-pipe pipelines, are each judged in under 100 ms;
- the pipe-guard PASS count is recorded (it was 84 on main).

Report (10 lines or fewer): commits; files; rows; the PASS count per file run; each wrong-code pair → red or not; the timing lines; deviations and what was not done.

## Seat amendments (re-check on main 9552afb1)

- Branch from main 9552afb1. Lanes that landed since planning did not touch pipe-guard.mjs, its two test files, verifier-pipe.test.mjs, hooks-win32-exec.test.mjs, install-check-config.mjs or install-check.test.mjs. So every line number this brief cites for those files still holds.
- The seat launches this build with `pi-worker --lane verifier-pipe-commit-match --lane-size larger`. Without `--lane-size larger`, the roster starts its plain builder instead of sol.
- pipe-guard.test.mjs still prints 84 PASS on main. rm-outside-asks has landed, so no other lane's count needs a change. Record this lane's new count only.
- lane-guard-temp-root has landed, so the land order is already met.
- rm-outside-asks appended R-2330 to R-2338 at the end of FEAT-010. Put R-2350 to R-2357 right after R-984 as planned, and leave those rows alone.
- R-1064, from the cross-lane check, overrides step 2's "leave its evidence cell to the seat":
  - Once its commands move to `&&`, the Windows run in its evidence no longer covers them.
  - Set its status to `untested` and its Evidence to `written; Windows leg only (commands moved to && 2026-10-20)`.
  - Change all three `// req: R-1064` markers in hooks-win32-exec.test.mjs (lines 178, 181 and 184) to `// req-candidate: R-1064 (Windows only; becomes req: when the Windows CI leg passes it)`.
  - Change all three: the trace flags an untested row that any `req:` marker still traces.
  - Leave the R-1058 markers as they are. The seat flips R-1064 back after the Windows leg passes.
- Setup README: the "Verifier-pipe guard" line is now line 65, not 64.
- Setup README, line 50: also rewrite the hooks-table sentence "asks before a pipeline precedes `git commit` without active `pipefail`" to the read-status rule. This change makes it false, and no check pins it.
- install-check.test.mjs already imports the config as `installConfig` (line 18). At line 286, read `installConfig.SAMPLE_INPUTS.verifier.powershellHit`.
- Step 4 also covers negatives. A negative whose pipe is hidden by a quote, comment, heredoc or string also moves from `;` or a newline to `&&`. Then it stays null because the pipe is hidden, not because the status is discarded. An example is "typographic double-quoted pipe" in pipe-guard-pwsh-oracle.test.mjs.
- Wrong-code pair 16: the pipe-reason assignment in nana-gate.ts is now at lines 368-369. On main, the `&&` form `rm -rf /tmp/x | cat && git commit -m done` still gets the dangerous-command reason, so the precedence check stays meaningful.
- gate-shell.ts now exports `base`, which lower-cases a name and strips `.exe`. Do not import it into pipe-guard.mjs. The Claude Code verifier hook reaches pipe-guard.mjs through plain .mjs files only, and a .ts import would put type stripping on that hook's path. Keep the finder inside pipe-guard.mjs.
- Merge notes: gate-stop-names-config edits the pack README's Malformed config bullet and nana-gate.ts, and claude-config-dir edits the setup README. Both are text merges only. After any merge of main, rerun `npm run map` and `npm run req:tree`.

## Cross-lane fixes (the seat's check of all nine amendments)

- Correct the merge note: gate-stop-names-config edits lib/config.ts and four config test files, not nana-gate.ts. No slate lane edits nana-gate.ts, so pair 16's lines 368-369 stay as cited.
- Other builders run on this machine at the same time. If a 100 ms timing line misses, rerun that file alone before changing code, and report both runs.

## Seat (2026-10-20 ~16:45 EDT, after the re-check)

- Builder: pi-worker --lane verifier-pipe-commit-match --lane-size larger (the roster's larger-lane builder, pi gpt-5.6-sol). The owner kept pi sol for larger lanes after power mode; ignore any line above that calls the builder an open question or names a Claude builder.
- Reviews: Claude Opus 5.5 is the final reviewer and pi gpt-6-astra the land reviewer; the seat lands when every reviewer says LAND (the owner's standing rule since 2026-10-20).
- Run single test files only, never the full suite: eight other builders share this machine, and the seat runs the locked suite at land.
- Branch: from main 9552afb1. Land order across the slate (each later lane merges main before its final review): knowledge-sources-unparseable, lifecycle-compaction-reason, gate-stop-names-config, review-launch-win-paths, shared-memory-index-cap, project-odd-seeds, verifier-pipe-commit-match, win-hook-variant-loop, claude-config-dir.
- No push; no HANDOFF.md, docs/sessions/ or docs/reviews/ edits; commit with explicit paths.
