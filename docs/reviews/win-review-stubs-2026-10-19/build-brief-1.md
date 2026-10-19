# win-review-stubs — build brief 1

Feature: FEAT-007 · Review a specific revision independently. Lane class: ordinary.
- Builder: a Claude Sonnet subagent in the lane worktree on `feat/win-review-stubs`, following
  `packages/nana-pack/prompts/builder-preamble.md`. Start after unread-verdict-loud lands, from that main.
- Read `docs/reviews/win-review-stubs-2026-10-19/must-meet.md` first. Run single test files only.
- Do not edit `HANDOFF.md`, `docs/sessions/`, `tests/fake-pi.mjs` or any product code. Do not change the four marked
  check titles; rows cite them.

## Change
1. `REQUIREMENTS.md`, FEAT-007 SUB-008: add R-1680, R-1681, R-1682 directly after R-1106, and R-1683 directly after R-139.
   Use the must-meet row text exactly. Status `implemented` once the row's check passes. Evidence: the row's one
   backticked `file::title`.
2. `packages/nana-pack/tests/review-standard.test.mjs`:
   - Replace `if (process.platform === "win32") { skip ×3 } else {` with a plain block. Import `writeFakePi` from `./fake-pi.mjs`.
   - win32: `writeFakePi(stubBin, body)`. The CommonJS body writes `process.env.STUB_MARKER` when set and prints
     `VERDICT: LAND`. POSIX keeps today's sh stub.
   - Control: add `&& fs.existsSync(resDir(control.home))`. Retitle it "control: a pack copy with the review standard
     present exits 0, starts the stub and creates the reservation folder".
   - Remove the unused `skip`. Fix the header (`@inputs`; drop "POSIX only" from `@effects`) and the block comment.
   - Markers: `// req: R-1106 R-1680`, `… R-1681`, `… R-1682`, each directly above its `check("title", …` line.
3. `packages/nana-pack/tests/handoff-writer-role.test.mjs`:
   - Remove the win32 SKIP. Root the block at `fs.realpathSync(tmpDir(...))`. Put the stub in a `stub-bin` folder under
     it: win32 uses `writeFakePi`; POSIX keeps unread-verdict-loud's sh line as landed. Both print
     `stub NANA_HANDOFF=<value or unset>`, then `VERDICT: LAND`.
   - Make a one-commit scratch git repo under that root with its own name (`repo` is taken at module scope). Copy
     review-standard's `git(...)` helper and its `-c user.*` and `commit.gpgsign=false` flags. Pass it as pi-review's `cwd`.
     Keep `--out` outside that repo.
   - Marker: `// req: R-139 R-1683`. Update the header (`@inputs`, `@effects`: the scratch repo, the per-platform stub).
4. Regenerate: `npm run req:tree`, `npm run map`. While the R-291 leaf-total literal exists on main, set all three
   occurrences (title, `leafTotal ===` comparison, message) to the total `node scripts/requirements-trace.mjs` prints.

## Tests (cwd `packages/nana-pack`)
- `node tests/review-standard.test.mjs`
- `node --experimental-strip-types tests/handoff-writer-role.test.mjs`
- `node tests/requirements-tree.test.mjs`
- From the repo root: `node scripts/requirements-trace.mjs`, `npm run map:check`, `npm run readme:check`,
  `node scripts/requirements-tree.mjs --check`

## Wrong code to try (revert each; record the FAIL line)
1. `bin/pi-watchdog.mjs`: drop `NANA_HANDOFF: 'off'` from the spawn env. WS4 FAILs.
2. `bin/pi-review.mjs`: in the review-standard catch, replace the write and `process.exit(1)` with `reviewStandardText = 'x'`.
   WS1 and WS2 FAIL.
3. `bin/pi-review.mjs`: `if (!reviewStandardText.trim())` becomes `if (false)`. WS3 FAILs.
4. The review-standard POSIX stub stops writing `STUB_MARKER`. The control FAILs.
5. The test's `resDir` names `review-ledger.reservation` (no s). The control FAILs while WS1 to WS3 still pass.

## Done
- macOS: review-standard 7 pass, 0 skip. handoff-writer-role 7 pass, 0 skip.
- Neither file contains "POSIX shell stub" or a platform skip around these checks.
- The trace is green and its total is 4 higher. Tree, map and README checks are green. The leaf total is set.
- Seat, on the Windows CI leg of the lane's pull request: both files show 7 pass, 0 skip.

## Report (≤ 10 lines)
1. Tip sha and the files changed.
2. macOS pass/skip counts for both files.
3. Each wrong code's FAIL line, one line each.
4. The trace summary line, the tree, map and README results, and the leaf total set.
5. Any deviation from this brief, with the reason.