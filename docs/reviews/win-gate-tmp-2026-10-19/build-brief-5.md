# win-gate-tmp: build brief 5 — merge the clean-revision land tip

**Builder:** the larger-lane builder (pi sol) in `~/nana-pi-wt/win-gate-tmp`, branch `feat/win-gate-tmp`, tip `715b72f`. **Class:** gate. Rules: the builder preamble; single test files only, never the full suite; no push. You MAY edit `HANDOFF.md` and `docs/sessions/2026-10.md` in this build, only to resolve merge conflicts.

**Why.** Lanes land in order study-stop, gate-rm-workdir, clean-revision, then this lane; each is a fast-forward of main. `feat/clean-revision` at `a1ea491` is that order's last reviewed tip and contains gate-rm-workdir's change. Both this lane and gate-rm-workdir changed `packages/nana-pack/extensions/nana-gate.ts`, so `git merge a1ea491` stops on a conflict there. The seat aborted that merge; the tree is clean at `715b72f`.

**Do.**
1. `git merge --no-edit -m "Merge main a1ea491 (the clean-revision land tip, fast-forward of main) into feat/win-gate-tmp" a1ea491`.
2. Resolve `nana-gate.ts` so BOTH lanes' behaviour survives:
   - this lane: the lane write guard judges each edit/write target at the path pi writes (`~`, `@`, `file://` expanded), compares roots and targets by true on-disk spelling, and `/tmp` is a temp root on macOS and Linux only, never on Windows;
   - gate-rm-workdir: a recursive or forced rm of plain relative names strictly inside the working folder passes unasked through `lib/gate-rm-inside.ts` (its four-line hook into `nana-gate.ts`); every other rm form keeps its verdict.
   Read both sides' diffs against the merge base `ca27d86` first (`git diff ca27d86 715b72f -- packages/nana-pack/extensions/nana-gate.ts` and `git diff ca27d86 a1ea491 -- …`).
3. Other conflicts: `HANDOFF.md` and `docs/sessions/2026-10.md` keep both sides' lines (main's first in HANDOFF sections, this lane's session entry at the top); `packages/nana-pack/tests/requirements-tree.test.mjs`, `docs/requirements-tree.md` and `docs/code-map.md` take a1ea491's version, then run `npm run req:tree`, set R-291's leaf total (three spots) to the total `node scripts/requirements-trace.mjs` prints, run `npm run req:tree` again and `npm run map`.
4. Run alone, each must pass: `lane-write-guard`, `gate-rm-inside`, `gate-corpus`, `gate-survives-mutation`, `display-surfaces`, `path-spelling`, and the three requirement tests (`requirements-tree`, `requirements-trace`, `requirement-rows`); `npm run map:check` and `npm run readme:check` clean.
5. Commit the merge (explicit paths after resolving; `git commit --no-edit`).

**Report** (≤ 10 lines): VERDICT DONE or BLOCKED; the merge commit; how you resolved `nana-gate.ts` (which hunks from each side, and why both behaviours hold); each test file's pass count; anything you could not keep.
