# first-look · plan attack (adversary, 2026-10-29)

2 MUST, 4 SHOULD, 3 NOTE.

## MUST

M1. "Before" renders main's data with the tip's code. `generateReport` reads `TEMPLATE` from its own script folder (`scripts/product-report.mjs:32`) and inlines the importing copy's `renderInto`. A renderer or template change would show identical shots. Fix: check main out as a temporary detached worktree and run that checkout's `node scripts/product-report.mjs --root <wt> --out <tmp>` as a child. Test it with a fake main renderer that differs from the tip's.

M2. Must-meet 4 breaks R-1140. `seat-rule.test.mjs` pins exactly twelve bullets and no other. Fix: add R-1140 (thirteen rules) and `seat-rule.test.mjs` (`RULES` plus a carry check) to the plan. Check `planner-prompt.test.mjs:91`, which also reads the guide. Rebase on the in-flight pi-seat lane, because both lanes edit the guide.

## SHOULD

S1. Detection has no file list. The page is built from REQUIREMENTS.md, HANDOFF.md and suite records, which almost every lane edits. Read literally, every lane qualifies. Fix: declare one list of shape files as a `chosen` tunable: the report script, `scripts/product-report/`, and the desk's static files. Test against that list. State that data-only changes are excluded.

S2. Playwright will not resolve in a lane worktree. No `package.json` declares it, worktrees have no `node_modules`, and only the main checkout has a hand install. Must-meet 3 would fire on every real lane. Fix: try `PW_ROOT`, then the script's own require chain, then the main checkout (the parent of the git common dir). A browser binary missing at `launch` gets the same one-line degrade. CI and Windows always take that path, so test it.

S3. Use `locator('body').ariaSnapshot()` (Playwright 1.49+; the repo has 1.61.1). It costs the same as a text diff, it is the accessibility tree the owner named, and it removes A3.

S4. Pin the views and widths. The page has seven hash views (`product-report.mjs:388`), and "four shots" covers only one of them. The owner said 380 px; the plan says 390 px. Inject a fixed `readIssues` into both builds, and drop the Commit/dirty line from the diff. Otherwise unrelated changes show up as noise.

## NOTE

N1. While the desk is frozen, keep only the generic `--before/--after <url>` mode, which is free. Defer desk detection and starting two desks.

N2. The fake browser seam tests only the plumbing: the widths requested, the files written and the diff. The seat's first real run is the render evidence. Say that in the report.

N3. A pi seat cannot "send" files. Wording for both runtimes: "save the shots and diff outside git in the lane's review folder and point the owner to them". Saving them uncommitted keeps the "after" tree clean. Quote `--page product` in the sentence.
