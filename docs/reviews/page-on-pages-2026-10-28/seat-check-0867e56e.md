# page-on-pages · seat check of build 1 (0867e56e), 2026-10-28

Four checkers, each working read-only in a fresh clone at 0867e56e: the CI run on a bare runner, the public content, the report's behaviour for must-meets 2 to 5, and the rows, artifacts and workflow safety. Every MUST and SHOULD went to a separate verifier told to refute it; one was refuted.

## What works

- The page builds on a fresh clone with no `node_modules` and no local state: exit 0, about 1.4 s, 2.2 MB. Every import is `node:*` or relative.
- The identity scan reads its four word digests from the tracked `identity-scan.config.json`, so the CI step is a real check. A known hit exits 1.
- gh needs nothing beyond `issues: read`. With no gh, or gh not signed in, the page shows one unavailable line and still builds.
- Every link and asset works under the `/nana-pi/` sub-path.
- The runner-built page adds nothing beyond committed files, git metadata and public issue titles: no home path, hostname, email, session id or token. The owner handle appears only in the public repo URL.
- With live issues: 27 asks (25 optional, 2 parked) and 3 next items, each linked; the one owner issue with neither label is left out.
- The trace, tree, map, readme, known-bugs and identity checks are green in a clean clone, and so are the three touched test files.

## MUST

1. **configure-pages runs without a pages permission** (`.github/workflows/pages.yml:35`). The build job grants only `contents: read` and `issues: read`, and `actions/configure-pages@v5` calls the Pages site API. Two public repos report this exact split failing with "Resource not accessible by integration". A failed build skips upload and deploy, so the page would never publish. The R-2980 test pins the same permission block. Inferred from the action's source and public reports; no workflow ran. Fix: delete the step, whose outputs this page never uses.

## SHOULD

2. **A failed issue read shows "Asks: 0" in the Overview** (`scripts/product-report.mjs:981`). The failure line appears only on the Decisions view, so a rate limit or outage publishes a first screen saying nothing needs the owner.
3. **The must-meet 2 and 5 tests check the model, not the drawn page.** A wrong version with five changes passed all 95 checks: asks drawn with kind "ask", the failure paragraph deleted, the cap note always shown, Overview counts from HANDOFF, and the issue fields on every page. R-2981 and R-2984 claim the label and the drawn failure line.
4. **Must-meet 4 is not met.** For a project with list asks, main's code and this build give different bytes: the data is identical, but Decisions draws each title inside a span and drops the Ask line of an ask with an empty body. The R-2983 test builds the branch twice and compares it with itself.
5. **R-1012 still promises identical pages at one commit.** For nana-pi the page now also depends on the open issue list and its read outcome, including the elapsed milliseconds of a failed read.
6. **A suite test calls the live GitHub API** (`product-report.test.mjs:1074-1076`, the R-2450 case). It builds a fixture from the real HANDOFF, which points to issues, without a stub reader.
7. **R-1014's reader line now describes the public page** but binds to A-045, the land copy, through `scripts/deliverables.mjs:476-479`.
8. **The tests use the literal `30_000`** instead of importing `CI_READ_TIMEOUT_MS`.
9. **The workflow test has gaps** (`pages-workflow.test.mjs:30, 39`). The event guard misses a `run: |` block; the upload check matches `path: site2`.

Refuted: a removed FEAT-039 line on refused lands. Its harm is already on record in the same file.

## NOTE (the seat records these as known bugs)

- A transferred issue's title stays on the page until the next event; `transferred` is not a trigger.
- An issue with an unreadable creation date stops the whole page with a HANDOFF error.
- The Since date of every migrated ask is the migration day, 2026-10-28.
- A failed issue read prints nothing in the CI log.
- Blocking asks are not listed first.
- The public page loads Google Fonts, so each visitor's browser contacts a third party.
- The report's catch path would put a raw error message on the page; today the reader never throws.
- Anyone who opens an issue on the public repo starts a build and deploy; the deploy queue keeps one pending run.
