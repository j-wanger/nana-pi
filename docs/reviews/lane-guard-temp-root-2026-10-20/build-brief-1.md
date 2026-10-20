# lane-guard-temp-root: build brief (simple: Claude Sonnet subagent)
Feature: FEAT-006 · Launch builders with execution limits. Class: install, hook or gate (pi extension nana-gate).
Rows: R-2270 to R-2273 are new. R-1430 and R-1431 get narrowed text.
Work in ~/nana-pi-wt/lane-guard-temp-root on feat/lane-guard-temp-root, branched from current main. Follow packages/nana-pack/prompts/builder-preamble.md. Never edit HANDOFF.md or docs/sessions/. Run single test files only, through the runner.

## Change
1. REQUIREMENTS.md, FEAT-006.
   - Add R-2270 to R-2273 right after R-1433. Use the must-meet text exactly.
   - R-2270 to R-2272 are `implemented`. Each cites `packages/nana-pack/tests/lane-write-guard.test.mjs::<title>`.
   - R-2273 is `untested`, with evidence `written; Windows-leg-only (req-candidate; flip after the Windows CI leg passes)`.
   - Replace the Requirement text of R-1430 and R-1431 with the narrowed text. Keep their status and evidence.
   - Run `npm run req:tree`.
2. packages/nana-pack/extensions/nana-gate.ts, `laneWriteHit` only.
   - `resolve = (p) => { try { return real(p) } catch { return path.resolve(p) } }`
   - `home = resolve(os.homedir())`
   - Candidates: `[os.tmpdir()]`, plus `process.env.TMP` on win32 when it is set. Map each through resolve.
   - Drop a candidate when `path.parse(t).root === t || within(home, t)`.
   - `allowed = [root, ...kept, ...(win32 ? [] : [resolve("/tmp")])]`.
   - Keep the reason text and the module header. Touch no other function.
3. packages/nana-pack/tests/lane-write-guard.test.mjs. Add four blocks after the R-1433 block, before `process.env.NANA_WORKTREE_ROOT = "";`.
   - The import-time line sets HOME and USERPROFILE to homeFixture, not worktree. Leave R-1433's own swaps alone.
   - Helpers:
     - `reasonOf(t)` returns the handler's `.reason`, or "" when allowed.
     - `refused(t)` means the reason includes "lane write boundary". `allowed(t)` means the reason is "".
     - `laneFile = worktree/lane-ok-<pid>.txt`.
   - Every block requires laneFile allowed under each temp setting. Each restores HOME, USERPROFILE and the temp vars in `finally`.
   - R-2270:
     - Call `setTempVars(path.parse(worktree).root)`. Require `<root>/nana-lane-guard-root-<pid>/x.txt` refused, and that folder not created.
     - On win32, take the first existing root from D:\ to Z:\ whose drive differs from the worktree's and homeFixture's. Set the temp vars to it and require a target under it refused.
     - If no such root exists, print `SKIP <title> (second drive): no second drive root` for that part only.
   - R-2271: skip with outsideSkipReason when `!outsideAvailable`.
     - Set HOME and USERPROFILE to `outside`.
     - Make a link to `outside` in homeFixture: a junction on win32, a dir symlink elsewhere.
     - For the temp vars set to each of `outside`, `path.dirname(outside)` and the link, require `outside/r2271-home-<pid>/x.txt` refused.
   - R-2272: use the same skip.
     - Set HOME and USERPROFILE to `outside`. Set the temp vars to `outside/AppData/Local/Temp`, created with mkdir -p.
     - Require a file there allowed and `outside/r2272-sibling-<pid>/x.txt` refused.
   - R-2273: use the marker `// req-candidate: R-2273 (Windows only; becomes req: when the Windows CI leg passes it)`.
     - Off win32, give the check a real skip reason: "the differing-TMP case is a Windows one: on macOS and Linux Node reads TMPDIR first".
     - On win32, use folders A and B under homeFixture, the root R = path.parse(worktree).root, and rootT = R/nana-lane-guard-root-<pid>/x.txt.
     - (a) TEMP=A, TMP=B: files in A and B allowed.
     - (b) TEMP=R, TMP=B: the B file allowed, rootT refused.
     - (c) TEMP=A, TMP=R: rootT refused.
     - (d) TEMP=A, TMP=homeFixture: homeFixture/r2273-home-<pid>/x.txt refused.
   - Put each `check("title", ...` on the line directly under its marker.
4. packages/nana-pack/README.md, the "Lane launches set..." paragraph.
   - Say the gate counts `os.tmpdir()`, and on Windows `TMP` too.
   - Say a temp folder that resolves to a drive root, the home folder or a folder above home does not count.
   - Delete the "known gap" TMP sentence.
   - Put no example drive or home path in backticks.

## Seat amendment (cross-lane check, 2026-10-20): one shared temp-root module
rm-outside-asks (this slate, built after this lane lands) needs the same temp-folder rule. Do not keep the rule inline in `laneWriteHit`:
- Add a new module `packages/nana-pack/lib/gate-temp-roots.ts` with the six-tag header and named exports only. Not in gate-paths.ts, which has another purpose.
- Export `acceptedTempRoots({ platform, env, home, tmpdir })`: the accepted temp roots after the root and home exclusions (`os.tmpdir()`, plus TMP on win32; `/tmp` stays a separate POSIX rule in laneWriteHit). It must work without NANA_WORKTREE_ROOT, take its inputs injected, never throw, and resolve each path with `lib/real-path`'s `realPath` (falling back to `path.resolve`), not nana-gate's private `real()`, so both gate lanes compare paths the same way.
- Export the exclusion test (a drive or filesystem root, the home folder, or a folder above home) and one containment helper (`within(parent, child)` on `path.relative`) for rm-outside-asks to import. Leave gate-rm-inside.ts alone.
- `laneWriteHit` calls `acceptedTempRoots`. Add the module to the code map (`npm run map`).
- A small unit test of `acceptedTempRoots` in the same test file is welcome but not a must-meet row.

## Wrong code to try (report each result)
- P1: drop the home clause. Expect R-2271 red.
- P3: test home in both directions. Expect R-2272 red.
- P4: compare to home by equality only. Expect R-2271 red.
- P5: discard on unresolved strings. Expect R-2271 red.
- P8: also drop a temp folder that contains the root. Expect R-962 "temporary output remains allowed" red.
- P2: drop the root clause. Expect it to stay green on macOS; note that.
- P6 and P7 go red only on Windows. The seat runs them on the Windows CI leg.

## Done
- `npm test -- lane-write-guard.test.mjs` is green. Never run the file with bare node: it builds fixtures under HOME.
- With main's nana-gate.ts swapped in, R-2270 and R-2271 FAIL.
- `node scripts/requirements-trace.mjs` shows ears 0 off form. `npm run -s map:check` and `npm run -s readme:check` are green. The tree is regenerated.

## Report (10 lines or fewer)
Commit; diffstat; the runner line for the file; the red-on-main result for R-2270 and R-2271; one line per wrong-code pair; trace, map and readme results; anything left open.