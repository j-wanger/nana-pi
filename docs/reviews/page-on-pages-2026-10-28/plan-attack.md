# page-on-pages · plan attack (one adversary, 2026-10-28)

Verdict: the plan delivers the page, but its CI issue read inherits the hook's 1.5 s cap, and a failed read deploys an asks-less page. Counts: 1 MUST, 4 SHOULD, 7 NOTE.

Grounding: a `--no-local` clone of main f6604431, with origin set to the GitHub URL, built the page in 2.3 s (2.23 MB). The identity count on both the fresh and the local page is `[0,0,0,0]`. A4 holds on a runner.

## MUST

**M1. The CI read is capped for session start.** In issues-home, `handoff-issues.mjs` computes `budget = Math.min(ISSUES_READ_LIMIT_MS, …)`. Its config seals `ISSUES_READ_LIMIT_MS = 1500` and notes "covers cold macOS/Linux (1.31/1.27 s)". A runner's gh call is always cold, so the headroom is about 0.2 s. Must-meet 5 then deploys the degraded page over the last good one, so the public asks can flap to "unavailable (timeout)". O3's "no new CLI flag" leaves CI no budget of its own. **Fix:** the reader takes a ceiling parameter, and the report passes a CI budget. That is either `land-config.mjs:27` `CI_READ_TIMEOUT_MS` (30 s, the existing gh-in-CI budget) or a new sealed tunable with its pin. A must-meet pins the budget the report passes. Put this in the brief, because issues-home's code is unstable.

## SHOULD

**S1. A2 understates the loss, and the call is the owner's.** A model diff of the local and fresh builds shows that all 225 of 225 test files lose their run label. The whole "Did not pass" list becomes "no runtime data"; today it has 6 rows (R-1064, R-1058, R-1063, R-1330, R-1713, R-1340). This is test status, not just ages. Once the hand-publish retires, no copy the owner sees shows it. **Fix:** ask him before the build, with the one-word default "accept". Or keep the hand-publish until the `workflow_run` follow-up lands.

**S2. Must-meet 7 makes R-1014 a gap, and A-045 is unclear.** I simulated the edit in the scratch clone: A-045 moved to `CI record: ci: .github/workflows/pages.yml#github-pages`, and R-1014's manual and park lines were dropped. `requirements-tree.mjs --check` exits 0. The counts line moves from "21 of 21 made and read by code, 21 more parked" to "21 of 22 …, 20 more parked". R-1014 then shows as a gap on the owner's Overview. Yet its park reason, "no code reads or acts on the page", stays true. `test-locked.mjs:192` still writes the land copy at A-045's clone-store location. **Fix:** register the public page as a new artifact, `CI record: ci: .github/workflows/pages.yml#github-pages`. That name is upload-pages-artifact's and fits `CI_LOCATION` (`deliverables.mjs:146`). Keep or retire A-045 on purpose. Keep R-1014 parked with a new reason, and drop only the manual maker line.

**S3. Nothing stops a deploy from another branch.** GitHub's docs give workflow_dispatch's GITHUB_SHA as the "last commit on the specified branch". For github-pages they only "recommend that you add a deployment protection rule so that only the default branch can deploy". O4's API enable adds none. A dispatch on a lane branch would publish an unlanded page. It would also leave a pages run on the lane tip. `nana-land.mjs:168` queries by `head_sha=${tip}`, and `judgeRuns` judges every workflow it gets back (`land-ci.mjs:69-77`). **Fix:** give the deploy job `if: github.ref == 'refs/heads/main'` and pin it in must-meet 1. O4 may also set a branch policy.

**S4. The must-meet 1 and 6 tests pass on a broken workflow.** Four cases get through:
- No `GH_TOKEN: ${{ github.token }}` on the build step: gh refuses to run in Actions, and must-meet 5 ships "unavailable" on a green run.
- The scan step carries `continue-on-error` or `|| true`.
- The scan reads a path other than upload-pages-artifact's `path:`.
- A `${{ github.event.* }}` expression sits in a `run:` step. Outsiders' issue events start this job, which holds `pages: write` and `id-token: write`.

**Fix:** assert all four. Split permissions by job: the build job gets the two read scopes, and the deploy job gets the two write scopes. Nearer precedent: `packages/nana-pack/tests/ci-workflow.test.mjs:18-46` pins ci.yml's permissions, concurrency, fetch-depth and step order, and `ci.yml:115-117` has the concurrency group.

## NOTE

- **N1. A5 is verified.** GitHub's Pages limits page says the soft limit "does not apply if you build and publish your site with a custom GitHub Actions workflow".
- **N2. A3 holds, but the cite is wrong.** The filter by tip is `nana-land.mjs:168`, not `land-ci.mjs:68-76`. Push and issue runs carry main's HEAD, never an unlanded tip. `ci-records.mjs:117` filters by workflow path. The one exception is S3.
- **N3. The forecast misses three things.** One is `product-overview.test.mjs`, a caller map:impact lists. Another is the sealed five-block `OVERVIEW_BLOCKS` (`product-report.mjs:69-72`), which O2's Next block changes. The third is R-1012's input list, which needs the issue list.
- **N4. The opt-in fires at land too.** `test-locked.mjs:192` builds the land copy from the opted-in HANDOFF, so every land now calls gh. Say so, or skip the read there.
- **N5. The identity scan has a narrow blind spot.** The page's model is JSON with `<` written as `<` (`product-report.mjs:1025`). The scanner splits camel case only in letter-only tokens. So a word right after `<`, or a lowercase word after `\n` or `\t`, fuses with the escape letters and goes uncounted. Scanning the decoded model strings closes it.
- **N6. Two gaps in what the asks show.** The fetch cap is in the threat model, but no must-meet covers it; the reader returns `truncated`. The reader also drops `createdAt`, which the asks render as "since" (`:443` and the Overview). Say what both show.
- **N7. Smaller items.**
  - The owner's old copy stops updating, so the land report should give him the new address.
  - The page's "Issues" tab (the Broken block, `product-report.mjs:429`) will sit beside GitHub issues.
  - `FEAT-039.md:44` says CI writes no page, which becomes false.
  - The last Precedent entry starts with neither a path nor `none:`.

## Checked and sound

- These cited lines match the code: `ci.yml:2-8, :83`, `deliverables.mjs:25/:53/:63`, `REQUIREMENTS.md:1575/:2543/:2233-2236/:2777`, `handoff-asks.mjs:14-27`, `product-report.mjs:420/:443/:639` and `FEAT-039.md:42-43`.
- A1 holds, a burst stays bounded, and nothing runs before the land.
