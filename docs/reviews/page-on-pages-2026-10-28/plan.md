# page-on-pages · plan (seat, 2026-10-28; revised after one adversary pass)

Feature: FEAT-039 · See the product and its decisions in one report

The seat wrote this plan from `$HOME/nana-pi/packages/nana-pack/prompts/planner.md`. One adversary attacked it (`plan-attack.md` beside it: 1 MUST, 4 SHOULD, 7 NOTE). The seat took every finding; the revision notes at the end say where each went. Plans get no review round.

## Purpose

The owner's agreed reading, in his words on 2026-10-28: "A, plus the product page which should then be linked to github issues and updated automatically". Given three readings of "updated automatically", he picked the first: "Yes 1 is the way to go". Reading 1 was a public GitHub Pages page, rebuilt by a GitHub workflow when an issue changes and when main is pushed.

What he gets:

- One page on his phone, always current, without the seat publishing it.
- Each open question and next item on that page links to its issue, where he answers it.
- The seat's hand-publish of each land's page retires.

## Assumptions (any may be wrong)

- A1. The page builds on a GitHub runner with no change to its inputs. The grounding built it from a fresh full clone: 2.2 MB in about 2 s. Absent clone stores already degrade to one line each.
- A2. **The public copy shows no test results.** The runtime map, the suite records and the build records live only in this clone. Built on a runner, all 225 test files lose their pass or fail label, and the "Did not pass" list (6 rows today) reads "no runtime data". Ages read "age unknown". **The owner accepted on 2026-10-28 (issue 243).** Accept means the public page carries features, deliverables and his questions, and test status stays on the land copy the seat reads. The other answer keeps the hand-publish until a follow-up feeds the CI suite records in.
- A3. nana-land's CI gate is unaffected. It asks only for runs at the tip's SHA (`nana-land.mjs:168`) and judges the workflows returned (`land-ci.mjs:69-77`). Push and issue runs carry main's head, never a lane tip. Only a manual dispatch on a lane branch could leave a run there, and must-meet 1 stops its deploy.
- A4. Nothing new becomes public. The page carries the repo's own text, commit subjects and the issues, which are all public already. The identity check still runs on the built page before upload, because the page renders text in new combinations.
- A5. Verified by the adversary from GitHub's Pages limits page: the soft limit of ten builds an hour "does not apply if you build and publish your site with a custom GitHub Actions workflow". The concurrency group bounds a burst anyway.
- A6. This lane reuses issues-home's issue reader and gh runner under the second-caller ruling. So its build starts only after issues-home lands.
- A7. The land copy reads the issues too. `test-locked.mjs:192` builds it from the same HANDOFF, so every land now makes one gh call under the CI budget. A failed call there prints its one line and never fails the land.

## Open choices

The builder decides each one and reports it, unless it is marked for the seat.

- O1. The workflow file name and job names. The seat's pick is `.github/workflows/pages.yml` with one build job and one deploy job.
- O2. Where next items show on the page. The seat's pick is the Decisions tab, under the asks, each line linking its issue. The sealed Overview blocks (`product-report.mjs:69-72`) stay as they are.
- O3. How the report gets the issues. The seat's pick: when the HANDOFF opts in, the report calls issues-home's reader through its gh seam. That reader filters by the owner's author and the `ask` and `next` labels. The reader gains a ceiling parameter (must-meet 5). No new CLI flag is needed.
- O4. For the seat: Pages gets enabled with the Actions source (`gh api -X POST repos/<owner>/<repo>/pages -f build_type=workflow`) just before the land, with a deployment branch policy of main only. Approved under reading 1.

## Threat model

In scope is honest variation in our tools' output, files and environment:

- zero open issues, or more than the fetch cap;
- an issue opened by someone else, or without our labels, including a title written to break a shell step;
- the issue read failing in CI: rate limit, an API outage or a bad token;
- a burst of issue events;
- a shallow checkout;
- Pages not yet enabled;
- a manual dispatch on a lane branch;
- an identity word reaching the built page through an issue title;
- a project whose HANDOFF keeps list asks, which must render exactly as today.

Deliberate forgery is out: a forged author or labels, or a malicious workflow change. A finding outside this model is a residual.

## Precedent

- `scripts/product-report.mjs:639-690, :940-982`: `buildReport`, its inputs and the asks model; `:420` is the existing outbound link form; `:443` renders the asks.
- `packages/nana-pack/lib/handoff-asks.mjs:14-27`: today's HANDOFF asks reader, which stays for projects that keep list asks.
- `.github/workflows/ci.yml:2-8, :83`: triggers, top-level `contents: read`, actions pinned by tag, `fetch-depth: 0`.
- `scripts/deliverables.mjs:25, :53, :63`: the CI maker run and the CI record class with its `ci: .github/workflows/<workflow>.yml#<name>` shape; `REQUIREMENTS.md:1575` (A-022) and `:2543` (A-034) are entries in that class.
- `REQUIREMENTS.md:2233-2236` and `:2777`: R-1014's maker, reader and park lines and A-045, which this lane rewrites.
- `docs/known-bugs/FEAT-039.md:42-43`: the hand-publish known bugs this lane closes.
- `packages/nana-pack/bin/nana-land.mjs:168` and `packages/nana-pack/lib/land-ci.mjs:69-77`: the land gate, read only, for A3.
- `packages/nana-pack/tests/ci-workflow.test.mjs:18-46`: the R-597 check that pins ci.yml's triggers, permissions, concurrency, fetch depth and step order. The new workflow test follows it.
- `.github/workflows/ci.yml:113-117`: a job with its own write permission and a concurrency group that never cancels.
- `packages/nana-pack/lib/land-config.mjs:27`: `CI_READ_TIMEOUT_MS`, the existing gh budget in CI.
- none: the issue reader and gh runner land with issues-home, and the build brief names their paths once they are on main.

## Outside precedent

- GitHub's starter Pages workflow: `actions/configure-pages`, `actions/upload-pages-artifact` and `actions/deploy-pages`.

## Must-meet

Rows R-2980 to R-2989 are free for this lane. Each check carries its `// req:` marker directly above it.

1. **The workflow.** `.github/workflows/pages.yml` runs on a push to main, on issue events (opened, edited, closed, reopened, labeled, unlabeled, deleted) and on manual dispatch. The test reads the file, in R-597's form, and asserts:
   - the build job checks out with `fetch-depth: 0`, holds only `contents: read` and `issues: read`, and sets `GH_TOKEN: ${{ github.token }}` on the step that builds the page;
   - the deploy job holds only `pages: write` and `id-token: write`, and runs only when `github.ref == 'refs/heads/main'`;
   - the concurrency group never cancels a deploy in progress;
   - no `run:` step contains a `${{ github.event` expression.
2. **Issues on the page.** For a HANDOFF that points to its issues, the page's asks come from the issue list. Each ask shows its title, its blocking, optional or parked label, its "since" date from the issue's creation date, and a link to its issue. The counts line counts them. A test feeds the reader an unfiltered list and checks that only owner-authored `ask` and `next` issues appear. When the list reaches the fetch cap, the page says it may be longer.
3. **Next items.** The page lists the open `next` issues, each linking to its issue.
4. **Unchanged without opt-in.** A project whose HANDOFF keeps list asks gets the same page bytes as before, and the issue reader is never called (R-1012's form).
5. **The CI budget and a failed read.** The issue reader takes a ceiling parameter. The report passes `CI_READ_TIMEOUT_MS`, not the session-start limit, and a test pins the value it passes. When the read still fails, the page builds and shows one line naming the cause, and the workflow deploys it.
6. **The identity gate.** The workflow runs `identity-scan --stdin` on the same file the upload step publishes, before that step, with no `continue-on-error` and no `|| true`. A hit stops the run before upload. The must-meet 1 test asserts the order, the path and the absence of both escapes.
7. **The public page is its own artifact, and the hand-publish retires.** A new artifact entry registers the public page in the CI record class at `ci: .github/workflows/pages.yml#github-pages`, made by CI and read by a person. A-045, the land copy, stays as it is. R-1014 drops its manual maker line and stays parked, with its reason reworded. The tree check stays green and its counts line gains one artifact. HANDOFF drops the hand-publish sentence. FEAT-039's two hand-publish known-bug lines close, and its line 44, which says CI writes no page, is reworded.

Also in this change, with no new row:

- The pack README's product report section names the public page's address and says what the public copy lacks (A2).
- FEAT-039 gains one known-bug line for A2's missing test results, which the owner accepted.
- FEAT-039 gains one known-bug line for N5's residual: the identity scan reads the page's escaped JSON, so a word fused to an escape goes uncounted. Issue titles pass the name check before posting.

## Expected changes to existing tests (forecast, not a limit)

- `product-report.test.mjs`: new cases for the issue path; R-1018 and R-1030 cases stay, for list asks.
- `requirements-deliverables.test.mjs` and the tree check: the counts line moves when A-045's maker changes.
- Any test that pins R-1014's manual or park line.
- `product-overview.test.mjs`, which map impact lists as a caller, and R-1012's input list, which gains the issue list.
- `ci-workflow.test.mjs` stays as it is; the new workflow gets its own check.

## Class and size

- Class: ordinary by AGENTS.md's definition. The lane adds a CI workflow and changes the report, but no hook, install step, gate policy or land and review tool. Once lane-class lands, the seat confirms this with `node scripts/lane-class.mjs --root . --files` on the planned files.
- Size: small, so `pi-worker --lane-size small --stall-secs 1200`.
- The claim most likely to be wrong: A2, that the owner accepts a public page without test results.

## Revision notes (seat, after the attack)

- **MUST, the CI budget:** the reader gains a ceiling parameter, and the report passes `CI_READ_TIMEOUT_MS`, pinned by must-meet 5. The brief repeats it, because issues-home's code is still being built.
- **SHOULD findings, all taken:**
  - **A2:** restated as lost test results and put to the owner as issue 243, default accept.
  - **Registry:** the public page gets its own artifact entry; A-045 stays; R-1014 stays parked (must-meet 7).
  - **Branch:** the deploy job runs only on main, pinned in must-meet 1; O4 adds a main-only branch policy.
  - **Workflow tests:** the token, the escapes, the scanned path and event expressions are asserted, and permissions split by job (must-meets 1 and 6).
- **NOTE findings, all taken:**
  - A5 is verified; A3's cite is fixed.
  - The forecast names the overview test and R-1012's inputs, and O2 keeps the sealed Overview blocks.
  - A7 says each land now makes one gh call.
  - The identity blind spot is a known-bug line, as a residual.
  - The fetch cap and the "since" date are in must-meet 2.
  - The land report gives the new address. FEAT-039's line 44 is reworded. The last Precedent entry now opens with `none:`.
  - The page's "Issues" tab keeps its name for now. The reviewer may judge whether it confuses.
