Feature: FEAT-039 · See the product and its decisions in one report

Lane hive-render. Class: ordinary. Builder: pi-worker (larger lane). Build session 3, on the tip of build 2.

The plan of record is still `docs/reviews/hive-render-2026-10-29/plan.md`. Build 2 passed the seat's side-by-side check against the reference: full-page scene, monochrome structures, chapter rail, voice tabs, one card, the phone picker. Keep all of it.

## 1. Merge main and do the swap

The component-audit lane landed on main first, so this lane is the second lander. Merge `origin/main` into this branch. Resolve conflicts in generated files by regenerating them (`npm run -s req:tree`, `node scripts/code-map.mjs --write`); resolve known-bug files and session notes as a union.

Then do the swap exactly as the plan's "The swap" section lists, steps 1 to 5, with row R-3139 pinning it. `scripts/hive-page.mjs` imports `checkComponentData` from `scripts/component-contract.mjs` (on main after the merge); it does not copy it.

## 2. Draw the real audit

The real audit has 23 components, 15 workflow and 8 governance, where the fixture has five. Render the real output of `node scripts/component-audit.mjs --out <file>` through `hive-page --serve --data <file>` and make it read as well as build 2 did:
- every component gets its own structure, with workflow structures in the centre and governance in the ring;
- labels stay legible and do not pile on each other at 1280 px; the rail lists all 23 chapters and scrolls inside itself when it must;
- the statuses (sound, partial, absent, gap) stay visible as in build 2: absent as empty foundations, gap as dark or unfinished.

## 3. One fix in the card

In the technical voice, paths and row IDs wrap mid-word in the body font (for example `packages/nana-` then `setup/...`). Set paths and IDs in the monospace face, as the reference does for its code names, and let them break only at `/`.

## Show your work

After the suite is green, capture the real-data page at 380 and 1280 px with motion off: the overview, the library chapter in all three voices, one governance chapter, and one absent chapter. Put the shots beside build 2's shots and the reference frames at `/private/tmp/nana-3dmk-ref/` (never commit them) and judge each line of `replicate-art-spec.md` again, pass or fail with one reason. Fix and re-capture up to three rounds.

Run the locked full suite as a plain foreground command with its output on screen.

## Notes for this build

Append these lines to `docs/known-bugs/FEAT-039.md`, each as one line:
- Component audit (component-audit, final review): "sound" means no planned or violated row and no anchor, not that someone checked the component; 18 of 23 are sound while their features hold many known-bug lines.
- Component audit (component-audit, final review): absent components have no parts, so the stale count counts every commit and names them stale after 20 commits anywhere.
- Component audit (component-audit, final review): the library component cites only the dated measurement, not the FEAT-003 known-bug line the plan named.
- Component audit (component-audit, CI): the R-3104 activity test exceeded its 20 s case limit once on the Windows runner; a rerun passed.

## Done when

The rows stay `implemented` with backticked `file::title` evidence, R-3139 included. The locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green, and the contract and fixture match their sealed sha256.

Report: the screenshot folder; the spec table; every row or test you changed; each departure from the Precedent.

## Precedent

- `.github/workflows/pages.yml`: the Pages build job and its existing product page and hive steps.
- `scripts/hive-page.mjs`: build 1's copy and `--data` handling.
- `apps/hive/text-layer.mjs`: build 2's cards and voices.
- `apps/hive/layout.mjs`: build 2's structure placement.
