# review-launch-win-paths: build brief 1

Feature: FEAT-007 · Review a specific revision independently
You are the builder. Follow packages/nana-pack/prompts/builder-preamble.md. Work in `~/nana-pi-wt/review-launch-win-paths` on `feat/review-launch-win-paths`. Never edit HANDOFF.md or docs/sessions/. New rows take IDs only from R-2430 to R-2439.
Run single test files only, never the full suite: other lanes hold the machine's suite lock. Never loop a test file.
Before editing, run `npm run map:impact -- packages/nana-pack/bin/review-launch.mjs packages/nana-pack/bin/review-ledger.mjs packages/nana-pack/lib/win-command.mjs`.

## Change
1. `packages/nana-pack/lib/win-command.mjs`: add `export` to the existing `defaultExists`, and name it in the header's @outputs. Change nothing else.
2. `packages/nana-pack/bin/review-launch.mjs`: import `defaultExists` and use it as the default of the `exists` option. In the path branch, when the lower-cased extension is `.cmd` or `.bat`, set `resolved = path.win32.resolve(cwd, word)`. If `exists(resolved)` is false, return `{ refused: \`no file at ${resolved}\` }`. Otherwise call `winCommand(word, args, { comspec })` as today, with the word as written. Do not check `.exe`, `.com` or extensionless paths. Update @effects and @errors.
3. `packages/nana-pack/bin/review-ledger.mjs`: delete the call before `admit`. Call `const launch = reviewLaunch(child, { cwd: adm.res.cwd });` just above `if (launch.refused)`. Change nothing else.
4. REQUIREMENTS.md: add R-2430, R-2431 and R-2432 after R-2255 (FEAT-007 / SUB-008), with the exact text from must-meet.md. R-2430 and R-2431 become `implemented` with their test. R-2432 is `untested` with the evidence `written; Windows-leg-only`. Do not edit R-2250 to R-2255.
5. `packages/nana-pack/README.md`, the Windows paragraph ending "takes a command containing `\`, `/` or `:` as a path.": add one sentence. A relative path is read from the reviewed tree, and a `.cmd` or `.bat` path that names no file there is refused with the cannot-start line before cmd.exe starts.
6. Run `npm run req:tree` and `npm run map`, then commit both outputs.

## Tests (packages/nana-pack/tests/review-launch.test.mjs)
- R-2252's fixture: add `put("C:\\s p\\stub.bat", "@echo off\r\n");`. Do not change its assertions.
- R-2430 and R-2431: add these after R-2253's check, with the titles from must-meet.md.
  - Put `C:\tree\tools\review.cmd` in the map.
  - R-2430: resolve `C:\tools\reviewr.cmd`, `C:\tools\Reviewr.BAT` and `tools\review.cmd` with the default cwd. Each must return a refusal with no command. The refusal must contain `C:\tools\reviewr.cmd`, `C:\tools\Reviewr.BAT` and `C:\work\tools\review.cmd` respectively, compared case-insensitively.
  - R-2431: call `reviewLaunch(["tools\\review.cmd", "-p"], { ...winOpts, cwd: "C:\\tree" })`. Expect `matchesShape(result, cmdShape("tools\\review.cmd", ["-p"]))`.
- R-2432: Windows only, in the R-2254 style. Write `if (process.platform !== "win32") console.log(\`SKIP ${title} — Windows leg only\`); else {…}`, and inside the else spell the title literally in the check call.
  - Set up a `makeRepo` tree and commit `tools\review.cmd` (`@echo off\r\necho VERDICT: LAND\r\n`) into it. Write the same text to `<temp>\other dir\review.cmd` only.
  - Run review-ledger with cwd `temp` and a fresh HOME. Run (a): `--tree <repo>` and `-- tools\review.cmd`. Expect exit 0 and one round for its item.
  - Run (b): `-- "other dir\review.cmd"`. Expect exit 1. Stderr must hold `review-ledger: cannot start other dir\review.cmd: `. --out must start with `cannot start other dir\review.cmd: ` and contain `path.join(repo, "other dir", "review.cmd")`, compared case-insensitively. Expect no reservation file and no round for that item.
  - Marker: `// req-candidate: R-2432 (Windows only; becomes req: when the Windows CI leg passes it)`.
- Trace rule: each `// req: R-nnn` (or req-candidate) line sits directly above a `check("title", …` call. The title's opening quote is on the same line as `check(`. Never split them; a split broke CI before.

## Wrong code to try (revert each one; do not commit them)
Try each, then confirm the named check goes red:
- `exists(word)` unresolved: R-2431.
- Resolve against `process.cwd()`: R-2430 and R-2431.
- Refuse every `.cmd`/`.bat`: R-2252 and R-2431.
- Case-sensitive extension: R-2430.
- Refusal without the path: R-2430.
- Check extensionless and `.exe` paths too: R-2252.

## Done
- `node packages/nana-pack/tests/review-launch.test.mjs` passes on macOS, and R-2432 prints SKIP and counts no PASS.
- Each of `review-ledger.test.mjs`, `win-command.test.mjs`, `win32-launch.test.mjs` and `requirements-trace.test.mjs` (under packages/nana-pack/tests) passes when run alone.
- `npm run map:check` and `npm run readme:check` are green, and the tree and map are regenerated and committed.
- There is no inline tunable, no new module and no typed leaf total.

## Report (10 lines or fewer)
Give the commit and the files changed. Give each new title with PASS or SKIP. List the wrong-code results, naming which check went red. Give the map, readme and tree status, and anything you could not do.

## Seat amendments (re-check on main 9552afb1)

- Base the lane on main 9552afb1 or later. Every file, function, line and current-behaviour claim in this brief still holds there; no landed lane touched review-launch.mjs, review-ledger.mjs, win-command.mjs or review-launch.test.mjs, and the pack README paragraph is still line 284.
- The three red-today probes were re-run on 9552afb1. R-2430's three cases still return a cmd.exe launch. R-2431 still passes today, so it remains a guard.
- In R-2432, give run (a) and run (b) different `--item` values. Then "one round for its item" and "no reservation and no round for that item" each read their own item.
- Commit `tools\review.cmd` into the R-2432 repo with the test file's own `git` helper, which sets a user name and email. A plain `git commit` has no identity on the CI Windows runner (inferred) and would fail there.
- `packages/nana-setup/lib/pi-invocation.mjs` (landed with win-pi-launch-orphan) now imports `piLaunch` and `winCommand`, so map:impact lists it upstream of win-command.mjs. Adding `export` to `defaultExists` does not change it. Do not edit it, and you need no nana-setup test.
- Two other planned lanes, gate-stop-names-config and verifier-pipe-commit-match, also edit packages/nana-pack/README.md in other paragraphs. Add your sentence at the end of the line-284 paragraph only. Do not rewrap or touch the lines around it.
- REQUIREMENTS.md, docs/code-map.md and docs/requirements-tree.md are shared with every lane. Insert R-2430 to R-2432 directly after R-2255 and touch no other row. Run `npm run req:tree` and `npm run map` last, after every other edit. If main has moved when the seat merges it, regenerate both files. Never merge them by hand.
- No land-order constraint: this lane shares no function with any planned lane, waits on none, and no lane waits on it.

## Seat (2026-10-20 ~16:45 EDT, after the re-check)

- Builder: pi-worker --lane review-launch-win-paths --lane-size larger (the roster's larger-lane builder, pi gpt-5.6-sol). The owner kept pi sol for larger lanes after power mode; ignore any line above that calls the builder an open question or names a Claude builder.
- Reviews: Claude Opus 5.5 is the final reviewer and pi gpt-6-astra the land reviewer; the seat lands when every reviewer says LAND (the owner's standing rule since 2026-10-20).
- Run single test files only, never the full suite: eight other builders share this machine, and the seat runs the locked suite at land.
- Branch: from main 9552afb1. Land order across the slate (each later lane merges main before its final review): knowledge-sources-unparseable, lifecycle-compaction-reason, gate-stop-names-config, review-launch-win-paths, shared-memory-index-cap, project-odd-seeds, verifier-pipe-commit-match, win-hook-variant-loop, claude-config-dir.
- No push; no HANDOFF.md, docs/sessions/ or docs/reviews/ edits; commit with explicit paths.
