Feature: FEAT-039 · See the product and its decisions in one report

Lane page-on-pages. Class: ordinary (`node scripts/lane-class.mjs --root . --files` on the planned files prints `ordinary`). Builder: pi-worker (small lane). Build session 1.

Work in the lane worktree on feat/page-on-pages. The seat merged main at cb7832da (merge aae8662a), which carries issues-home's issue reader. The plan of record is `docs/reviews/page-on-pages-2026-10-28/plan.md`. Read it whole, and read `plan-attack.md` beside it for the reasons behind each must-meet. The plan has no list of allowed edits; its test forecast is a forecast, not a limit. The owner accepted a public page without test results on 2026-10-28 (issue 243), so A2 is settled.

What the lane does, in one sentence: a GitHub Actions workflow builds the product page on every push to main and every issue change and publishes it on GitHub Pages, with the owner's open questions and next items read from the issues and linked.

Build must-meet 1 to 7 and the plan's "Also in this change" items. New requirement rows take IDs R-2980 to R-2989.

- The issue reader is `readHandoffIssues` in `packages/nana-pack/lib/handoff-issues.mjs`. Its budget is capped at the session-start limit (`ISSUES_READ_LIMIT_MS`, line 30). Give it a ceiling parameter whose default keeps today's behaviour, and have the report pass `CI_READ_TIMEOUT_MS` from `packages/nana-pack/lib/land-config.mjs:27` (must-meet 5).
- The deploy needs Pages turned on. The seat does that just before the land; your workflow test reads the file only. No test may call the network.
- The page is public. Run `node scripts/identity-scan.mjs` before your report, and keep home paths out of every evidence file you commit.

Run the locked full suite as a plain foreground command with its output on screen, not redirected to a file and not in the background. Another lane's suite may hold the machine-wide lock; waiting for it is expected.

## Done when

Each row is `implemented` with backticked `file::title` evidence, and the locked full suite (`npm run test:locked`), `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and the identity scan are green.

Report: each must-meet's test title; the workflow file as written; the page's Decisions and Overview text for this repo with real issues (run `npm run report` locally with gh working); each departure from the Precedent below with its reason; every existing test you changed and whether the forecast named it.

## Precedent

- `scripts/product-report.mjs`: `buildReport` and its asks model (lines 639-690 and 940-982 on main before this lane); the outbound link form near line 420 and the asks render near line 443.
- `packages/nana-pack/lib/handoff-issues.mjs`: `issuesPointer` and `readHandoffIssues`, the reader this lane reuses.
- `packages/nana-pack/lib/handoff-asks.mjs`: today's HANDOFF asks reader, which stays for projects that keep list asks.
- `packages/nana-pack/lib/land-config.mjs:27`: `CI_READ_TIMEOUT_MS`.
- `.github/workflows/ci.yml`: triggers, top-level `contents: read`, actions pinned by tag, `fetch-depth: 0`, and the release job's own permission and non-cancelling concurrency group.
- `packages/nana-pack/tests/ci-workflow.test.mjs`: the R-597 check that pins ci.yml; the new workflow test follows it.
- `scripts/deliverables.mjs`: the CI maker run and the CI record class with its `ci: .github/workflows/<workflow>.yml#<name>` shape.
- `REQUIREMENTS.md`: R-1014's maker, reader and park lines, and A-045.
- `docs/known-bugs/FEAT-039.md`: the hand-publish known bugs this lane closes.

## Outside precedent

- GitHub's starter Pages workflow: `actions/configure-pages`, `actions/upload-pages-artifact` and `actions/deploy-pages`.
