Feature: FEAT-039 · See the product and its decisions in one report

Lane hive-render. Class: ordinary (`node scripts/lane-class.mjs` prints `ordinary` on the planned files). Builder: pi-worker (larger lane). Build session 1.

Work in the lane worktree on feat/hive-render, based on main. The plan of record is `docs/reviews/hive-render-2026-10-29/plan.md`. Read it whole, and read `plan-attack.md` beside it; the plan already takes every attack point. The plan has no list of allowed edits. A sibling lane builds at the same time against the same frozen data contract; read the plan's Shared data contract section and add `docs/components/contract.json` and `docs/components/fixture.json` byte for byte with the sealed sha256 values it names. Do not change the contract; if you find you need to, stop and report it.

What the lane does, in one sentence: a separate static page renders a low-poly animated 3D hive of nana-pi's components from the shared data contract, with a pixel fallback, a component rail and a card per component.

Build every must-meet in the plan, rows R-3120 to R-3133. The owner's questions are posted as issues 262 and 263; build on the defaults.

After the suite is green, run the page for real: `--serve` it, open it in the repo's Playwright at 380 and 1280 px, wait for the ready mark with motion off, and save four screenshots (3D and pixel at both widths) to a temp folder outside the repo. Report where they are and what the text layer says about the renderer.

Run the locked full suite as a plain foreground command with its output on screen, not redirected to a file and not in the background. Another lane's suite may hold the machine-wide lock; waiting for it is expected.

## Done when

Each row is `implemented` with backticked `file::title` evidence. The locked full suite (`npm run test:locked`), `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green, and the two contract files match their sealed sha256.

Report: each must-meet's test title; the sealed values with provenance; each departure from the Precedent below; every existing test you changed.

## Precedent

- `apps/desk/public/desk-client.mjs`: a browser ES module whose core takes no DOM ids and is tested from Node (`apps/desk/test/live-feel.test.mjs`). Follow it for `layout.mjs`, `camera.mjs`, `text-layer.mjs` and `pixel.mjs`.
- `apps/desk/server.mjs`: loopback-only bind and path containment for a static folder. Follow it for `--serve`; do not import it (A11).
- `scripts/product-report.mjs`: the `--out` CLI shape, atomic writes and refusing bad input with a named line. Its Pages step is the one the hive step sits after.
- `scripts/product-report/template.html`: light and dark colour tokens and type for the cards, so the two public pages look related.
- `scripts/first-look.mjs`: its existing URL mode (`--page desk --before <url> --after <url>`) already captures a served page at both sealed widths. Reuse that path for the hive, with no merge-base worktree logic. Whether the mode keeps the `desk` name with a hive switch or becomes `--page url` is the builder's call; it reports the choice and keeps `--page desk` working.
- `scripts/playwright-resolve.mjs`: the one way to find Playwright and print its install line.
- `packages/nana-pack/tests/pages-workflow.test.mjs`: the workflow text checks R-3130 extends; R-2980 and R-2985 stay green unchanged.
- `code-map.config.json`: roots, `ignore` and the `exempt` reasons, the nearest shape for keeping vendored code out of the six-tag header rule.
- `readme-check.config.json`: where a new README joins the README contract.
- `npm run map:search` results taken: `apps/desk/server.mjs` and `apps/desk/apps.mjs` for loopback serving, `scripts/first-look.mjs` for browser capture, `apps/desk/public/desk-client.mjs` for a tested browser module, `packages/nana-pack/lib/rulings-config.mjs` for the sealed-config style.
