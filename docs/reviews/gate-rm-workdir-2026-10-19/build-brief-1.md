# Lane gate-rm-workdir: build brief 1 (feat/gate-rm-workdir, based on current main)

**Builder: Claude Sonnet, a subagent in `~/nana-pi-wt/gate-rm-workdir`.** Lane class: gate. Read `docs/reviews/gate-rm-workdir-2026-10-19/must-meet.md` first. Take only R-1490 to R-1496 (R-1497 to R-1499 stay unused). Run single test files only; the seat runs the full suite and pushes. Do not edit `HANDOFF.md` or `docs/sessions/`.

**Commit 1: rows, tests and retargets (no product code).**
1. Add R-1490 to R-1496 as `planned` at the end of FEAT-010's table in `REQUIREMENTS.md`, text exactly as in must-meet; run `npm run req:tree`; raise the R-291 leaf total in `packages/nana-pack/tests/requirements-tree.test.mjs` (three spots) by 7.
2. New `packages/nana-pack/tests/gate-rm-inside.test.mjs` with the six-tag header and gate-corpus's harness: real registered handler, temp HOME via `tmpDir` (set HOME and USERPROFILE), headless ctx, one interactive `ui` for R-1490 that counts dialogs. Seven checks, titles exactly as in must-meet, `// req: R-149x` directly above each `check(`, cases from Test shapes. Links: `fs.symlinkSync(target, at, process.platform === "win32" ? "junction" : "dir")`. No `.git` at the cwd top. The R-1492 case-variant spellings run only when `fs.existsSync(path.join(CWD, "AGENTDIR"))`; say why in a comment. Restore PI_CODING_AGENT_DIR after each agent case. On failure, print the cases that got the wrong verdict.
3. Retarget the existing checks this change makes false. Keep every title; delete nothing:
   - `gate-corpus.test.mjs`: BUILTINS `rm -fr x`, `rm -Rf x`, `rm -r -f x`, `rm --recursive x`, `rm --force x` and L2_BLOCK `rm -R x` get target `../x`; the headless-reason call `rm -rf build` becomes `rm -rf ../build`; the allow-cap entry `"^rm -rf build$"` becomes `"^rm -rf \\.\\./build$"`, and its run becomes `rm -rf ../build`; the three interactive runs become `rm -rf ../build`.
   - `gate-survives-mutation.test.mjs`: every `bash("rm -rf build|node_modules|dist")` becomes the `../` form; every allow entry `^rm -rf node_modules$` or `^rm -rf build$` becomes `^rm -rf \.\./…$`, in BASE, the three writeJson lists, both `cfg2` writes and the `allowAdded?.includes(...)` check.
   - `display-surfaces.test.mjs`: `rm -rf ${"a".repeat(500)}` becomes `rm -rf ../${"a".repeat(500)}` (inferred: on Windows a 500-character name reads as missing and would pass).
   On macOS expect: gate-rm-inside R-1490 FAIL, the other six PASS; gate-corpus 227, gate-survives-mutation 38, display-surfaces 181 PASS.

**Commit 2: the code.**
1. New `packages/nana-pack/lib/gate-rm-inside.ts`, steps 1 to 7 of must-meet Design. Six-tag header, `@effects disk`, named constants `PLAIN_RM` and `RM_FLAG` with the comment `contract: R-1490, R-1494`; import `piAgentDir` from `./gate-paths.ts` and `realPath` from `./real-path.mjs` (no local realpath helper); one `inside(child, parent)` helper on `path.relative` that tests `..` plus `path.sep`; step 6 checks both directions on realPath spellings; it never throws.
2. `packages/nana-pack/extensions/nana-gate.ts`: the import, the `tool` parameter of `commandHit`, the one line after the floor loop, and `event.toolName` at the caller. Nothing else in the file.
3. `packages/nana-pack/README.md`: one bullet right after "Gate is fail-closed headless" naming the exempt form, what still asks, and Known limits 1 to 3, 5 and 6. Add "(except the plain in-directory form below)" after the built-in `rm` forms.
4. Flip R-1490 to R-1496 to `implemented` with evidence `packages/nana-pack/tests/gate-rm-inside.test.mjs::<title>`; run `npm run map` and commit the map.

**Wrong code to try** (break the code, never the assertion; record which check goes red): (a) drop the link check: R-1493. (b) check only the first target: R-1491. (c) accept any non-space word: R-1494. (d) exempt each segment of a compound: R-1494. (e) `return null` from `commandHit` instead of clearing the danger: R-1496. (f) ignore the tool: R-1494. (g) drop the home and root guard: R-1495. (h) match `.git` exactly instead of the dot rule: R-1492. (i) let an empty target through: R-1491. (j) drop the `.git` holder check: R-1492. (k) drop the dot-named cwd guard: R-1495. (l) drop the agent-folder check: R-1492. (m) check only that the target holds the agent folder, not that it lies inside it: R-1492. (n) compare the typed spelling instead of realPath: R-1492 on macOS.

**Do not:** change `lib/gate-shell.ts`, `lib/gate-paths.ts`, `lib/real-path.mjs`, `segmentDanger`, `rmDanger`, the floor, allow logic or any other check; make plain `rm` or `rm -f` ask; touch PowerShell handling; push; run the full suite.

## Done
- gate-rm-inside: 7 PASS on macOS at commit 2; at commit 1 only R-1490 fails.
- gate-corpus 227, gate-survives-mutation 38, display-surfaces 181, gate-status 23, plus lane-write-guard, gate-policy-paths, gate-self-protection, pipe-guard and requirements-tree: all PASS, counts unchanged.
- `npm run map:check`, `npm run readme:check` and `node scripts/requirements-trace.mjs` are clean.

## Report (at most 10 lines; first line `VERDICT: DONE | PARTIAL | BLOCKED`)
Both SHAs; the gate-rm-inside PASS/FAIL lines at commits 1 and 2; wrong-code results (a) to (n); each retargeted check by file and title; README lines changed; the neighbour files' counts; anything not done.
