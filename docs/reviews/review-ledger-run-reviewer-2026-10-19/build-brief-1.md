# Lane review-ledger-run-reviewer — build brief 1 (feat/review-ledger-run-reviewer)

Feature: FEAT-007 · Review a specific revision independently. Class: install, hook or gate (review tool).
**Builder:** pi gpt-5.6-sol via `pi-worker --lane review-ledger-run-reviewer`, in `<worktrees>/review-ledger-run-reviewer`, branched from main AFTER unread-verdict-loud lands. Read `must-meet.md` here first: its row text, titles and test shapes are binding. Rows R-1720 to R-1723 only. Single test files only; the seat runs the full suite and pushes for Windows CI. Never edit HANDOFF.md or docs/sessions/.

**Commit 1: rows and tests, no fix.**
- REQUIREMENTS.md, FEAT-007 · SUB-008 after R-974: add R-1720 to R-1723 as `planned`. Run `npm run req:tree`. If `packages/nana-pack/tests/requirements-tree.test.mjs` still holds the R-291 leaf-total literal, set it to the total `node scripts/requirements-trace.mjs` prints; if leaf-total-drop has landed, skip this.
- `packages/nana-pack/tests/review-ledger.test.mjs`, right after the R-971 check: R-1720 then R-1721, each `// req:` line directly above its `check("title", …` line.
- `packages/nana-pack/tests/win32-launch.test.mjs`, Windows section, after "Windows: a refused launch writes its reason to --out": R-1722 then R-1723 (reuse `record`, `readRecord`, `reviewTree`, `rawArgs`, `installedEntry`, `voltaEnv`); add both titles to `WINDOWS_TITLES`; name review-ledger.mjs in the header's @inputs and @effects.
- On macOS expect R-1720 FAIL, R-1721 PASS, both Windows titles SKIP. The trace reports the four marked `planned` rows at this commit only. Commit the tests alone.

**Commit 2: the fix.**
1. `bin/worker-config.mjs`: export `REVIEWER_CHILD_ENV = Object.freeze({ NANA_ROLE: 'reviewer', NANA_HANDOFF: 'off' })` under `// contract: R-1720, R-974`; add it to @outputs.
2. `bin/review-ledger.mjs`: import `piLaunch` from `./pi-watchdog.mjs`, and `PI_BIN_NAME` and `REVIEWER_CHILD_ENV` from `./worker-config.mjs`. Before `admit`: when `child[0] === PI_BIN_NAME`, `launch = piLaunch(child.slice(1), { cwd: process.cwd() })`; on `launch.refused`, `die(\`pi launch refused: ${launch.refused}\`)`. Otherwise `{ command: child[0], args: child.slice(1) }`. Spawn `launch.command, launch.args` with `env: { ...process.env, ...REVIEWER_CHILD_ENV }`. Update @inputs, @effects and @errors. Nothing else.
3. `bin/pi-review.mjs`: `childEnv: { ...REVIEWER_CHILD_ENV, NANA_REVIEW_ROOT: tempRoot }` plus the import; nothing else.
4. `packages/nana-pack/README.md`: (a) "Any other launcher": add one sentence: run starts its command with `NANA_ROLE=reviewer` and `NANA_HANDOFF=off` as pi-review does, and a first word `pi` the way pi-review starts pi. (b) Windows paragraph: replace "`review-ledger run -- pi …` is not covered: it still starts its command by name." with: `review-ledger run -- pi …` starts pi the same way; any other command starts by name, so a `.exe`/`.com` starts and a `.cmd`/`.bat` does not. (c) "Non-writer role" bullet: "`pi-review` sets it for every child" → "`pi-review` and `review-ledger run` set it for every child".
5. `packages/nana-knowledge/README.md`, "Launcher roles get nothing": "(every pi-review child)" → "(every pi-review or review-ledger run child)".
6. REQUIREMENTS.md: flip R-1720 to R-1723 to `implemented` (the trace rail refuses a marked `planned` row); R-1722 and R-1723 evidence adds "Windows leg only; SKIP on macOS and Linux". In R-1125's evidence, replace "review-ledger run still starts its command by name, so review-ledger run -- pi … is not covered on Windows." with "review-ledger run -- pi … starts pi this way too (R-1721 to R-1723)."
7. Run `npm run map` and `npm run req:tree`; commit both with the fix.

**Wrong code to try** (break code, never an assertion; record each result): (a) `env: { ...REVIEWER_CHILD_ENV, ...process.env }` → R-1720 red. (b) set only `NANA_ROLE` → R-1720 red. (c) `env: REVIEWER_CHILD_ENV` without `process.env` → R-1721 red on macOS (adversary probed: ENOENT). (d) `piLaunch(…, { platform: 'win32' })` on every platform → R-1721 red on macOS (probed: "pi is not on PATH"). Windows only, for the seat on CI: by-name spawn (R-1721, R-1722), winCommand through cmd.exe (R-1722), refusal after `admit` with no `release` (R-1723).

**Do not:** touch `lib/win-command.mjs` or `bin/pi-watchdog.mjs`; add a `.cmd` path for other commands; inject the review standard; append `--name`; edit any other existing check; push.

## Done
- `node packages/nana-pack/tests/review-ledger.test.mjs`: no FAIL, both new titles PASS, exit 0 (about 2.5 minutes).
- `node packages/nana-pack/tests/win32-launch.test.mjs`: the forced-win32 titles PASS as before; the 2 new titles SKIP on macOS.
- `immutable-review.test.mjs` (R-974), `handoff-writer-role.test.mjs` (R-139) and `requirements-tree.test.mjs` PASS.
- `npm run map:check` and `npm run readme:check` exit 0; `node scripts/requirements-trace.mjs` reports 0 problems and ears 0.

## Report (at most 10 lines; first line `VERDICT: DONE | PARTIAL | BLOCKED`)
Both SHAs; the four titles' PASS/FAIL/SKIP lines on macOS at commits 1 and 2; wrong-code results (a) to (d); README lines changed in both READMEs; each Done check's summary line with its exit code; anything not done.