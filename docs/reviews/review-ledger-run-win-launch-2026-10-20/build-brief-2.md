# Build brief 2 · review-ledger-run-win-launch

Feature: as build 1 (the review launcher). Class: install, hook or gate (the land and review tools). Same builder, worktree and branch; the tip includes the seat's merge of main 0305bc8d and its pairs records. Threat model unchanged.

## Why a second build

1. **R-2254 passed on Windows.** CI run 39417461129 at 6ec2cf0e printed, on the Windows leg, `PASS Windows: review-ledger run starts an npm-style .cmd reviewer found on PATH with its arguments and stdin unchanged and records a round` (review-launch.test.mjs 5 pass there; win32-launch.test.mjs 15 pass). That is the proof the row's `req-candidate` marker waited for.
2. **A real test gap (the seat's pair M1 survived).** Deleting the `platform !== "win32"` gate in the launch resolver, so the Windows route runs everywhere, turns nothing red. No check runs a bare reviewer name that PATH finds (claude, codex) through `review-ledger run` on macOS or Linux; every test names `process.execPath`, an absolute path, or `pi`. With that gate gone, `review-ledger run -- claude` would be refused there as "not on PATH" — and that is exactly how the seat launches its Claude reviewers. Main starts such a name by name; pin it.
3. **The README's Windows example writes the review into the reviewed tree.** `packages/nana-pack/README.md` (about line 196) shows `--out out.md`, a relative path; run from the reviewed repo it writes into the tree and admission warns. The bash example above it uses `"$scratch/out.md"`.

## Change

1. `packages/nana-pack/tests/review-launch.test.mjs`: change `// req-candidate: R-2254 (Windows only; becomes req: when the Windows CI leg passes it)` to `// req: R-2254`, on its own line directly above the line that runs that check. Keep the off-Windows branch a real skip (it already prints SKIP and runs no check). `REQUIREMENTS.md` R-2254: status `implemented`, evidence the exact check title with its file. Do not change its text.
2. New row in `REQUIREMENTS.md` beside R-2250..R-2254:
   `| R-2255 | WHERE the platform is not win32, WHEN the review command's first word is a bare name that PATH finds, review-ledger run shall start that command by name and record its review-shaped output as a round. | untested | — |`
   and one new check in `packages/nana-pack/tests/review-launch.test.mjs` for it, off win32 only (a real skip on win32): put an executable stub reviewer (a `#!/bin/sh` script that reads stdin and prints a review-shaped answer ending `VERDICT: LAND`) under a made-up bare name in a temp folder, put that folder first on PATH for the run, and run `review-ledger run --item … --tree <temp repo> --out <temp file> -- <bare name> <args>` with a temp HOME, as the file's other runs do. Pass only when it exits 0, `--out` holds the stub's answer, and the temp ledger records one round with verdict LAND. `// req: R-2255` on its own line directly above the `check(` call. Flip the row to implemented once it passes. Then `npm run req:tree` and `npm run map`.
3. `packages/nana-pack/README.md`, the Windows example: write `--out` under a scratch folder outside the reviewed tree, matching the bash example (for example `--out "$env:TEMP\out.md"` or a `$scratch` variable defined in the example). Keep `npm run readme:check` green.
4. Change nothing else. Do not edit HANDOFF.md or docs/sessions/.

## Run (single files only; no full suite, no loops of a test file)

- `node packages/nana-pack/tests/review-launch.test.mjs` on macOS: R-2250..R-2253 and R-2255 PASS; R-2254 prints SKIP and no PASS line.
- Wrong code to try, restored after each: delete the resolver's `platform !== "win32"` gate so the Windows route runs everywhere — R-2255 must turn red; make the non-win32 path refuse a bare name — R-2255 red.
- `node packages/nana-pack/tests/review-ledger.test.mjs` and `node packages/nana-pack/tests/win32-launch.test.mjs`: green. `node scripts/requirements-trace.mjs`, `npm run map:check`, `npm run readme:check`, `node --experimental-strip-types packages/nana-pack/tests/requirements-tree.test.mjs`: all exit 0.

## Report (10 lines or fewer)

DONE or BLOCKED, the tip SHA, the files changed, and which check each wrong version turned red.
