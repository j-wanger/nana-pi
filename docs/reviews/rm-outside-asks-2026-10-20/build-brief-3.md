# rm-outside-asks — build brief 3

**Builder:** the larger-lane builder (pi sol) in `~/nana-pi-wt/rm-outside-asks`, branch `feat/rm-outside-asks`, on top of the current tip (the seat committed notes after build 2). Rules: the builder preamble, but run single test files only, never the full suite. No push; no `HANDOFF.md`, `docs/sessions/` or `docs/reviews/` edits.

## Why
Round 1 on 31e85b5d: pi gpt-6-astra said LAND; Claude Opus 5.5 said SEND-BACK with one MUST. CI run 39460770013 at 490bb78b: the Ubuntu leg fails `gate-rm-outside.test.mjs` 6 pass, 3 fail, where main's Linux leg is green. The fixture root F is `tmpDir(os.tmpdir())`, which on Linux sits under `/tmp`. Build 2's `gateTempRoots()` counts `/tmp`, so F/home, F/outside and F/x are inside a temp root and the real handler rightly lets them run. The three handler cases build 2 added therefore pass on macOS only:
- R-2330's detection-pass case `echo $(rm "<F>/outside/detected")` gives no reason;
- R-2331's `rm ~/x` and `rm -f $HOME/x` give no reason;
- R-2335's `(cd sub/deep && true); rm ../../x` gives no reason.
The module-level cases pass because they inject their own temp roots. The product needs no change for this.

Opus SHOULD 3: `gateTempRoots()` adds `/tmp` on darwin and linux only, where main's `laneWriteHit` added it on every platform but win32. That narrows the lane write guard on other POSIX systems.

## Do, nothing else
1. In `tests/gate-rm-outside.test.mjs`, make those three handler cases use targets that lie outside every temp root on every layout, including Linux where `os.tmpdir()` is `/tmp`. Use the never-created filesystem-root outside path R-2330 already uses (`<fs root>/nana-rm-outside-<random>/…`) for the detection-pass case; for the cd case, a relative target whose `../` steps reach the filesystem root and then that never-created folder; for the home cases, point HOME and USERPROFILE at a never-created folder outside every temp root for those calls only (and restore them), keeping the gate's own config where the other handler checks find it. Create nothing outside F. Rows stay unchanged.
2. In `extensions/nana-gate.ts`, `gateTempRoots()` adds `/tmp` on every platform except win32, as main's lane write guard did. R-2338's text stays.
3. Prove the Linux layout on this Mac: run `TMPDIR=/tmp npm test -- packages/nana-pack/tests/gate-rm-outside.test.mjs` (then `os.tmpdir()` is `/tmp`, as on Linux) and the plain `npm test -- packages/nana-pack/tests/gate-rm-outside.test.mjs`; both must pass 9. Show the first run red on the current tip before your change.
4. Each of the three changed cases must still fail under its pair's wrong code in `docs/reviews/rm-outside-asks-2026-10-20/seat-mutate.mjs` (G2 for the detection case, G5 for the home cases, G6 for the cd case); read the table, do not edit it. Show those three reds under both TMPDIR settings.
5. Run alone, default TMPDIR: `gate-rm-inside`, `gate-corpus`, `lane-write-guard`, `gate-survives-mutation`; `node scripts/requirements-trace.mjs` (exit 0), `npm run -s map:check`, `npm run -s readme:check`.
6. Commit with explicit paths.

**Report** (8 lines or fewer, VERDICT first): commit; each command's exit and counts, the TMPDIR=/tmp runs included; the red-under-wrong-code results.
