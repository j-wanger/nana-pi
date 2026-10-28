# page-on-pages · plan (seat, 2026-10-28)

Feature: FEAT-039 · See the product and its decisions in one report

The seat wrote this plan from `$HOME/nana-pi/packages/nana-pack/prompts/planner.md`. One adversary attacks it next (`plan-attack.md` beside it). Plans get no review round.

## Purpose

The owner's agreed reading, in his words on 2026-10-28: "A, plus the product page which should then be linked to github issues and updated automatically". Given three readings of "updated automatically", he picked the first: "Yes 1 is the way to go". Reading 1 was a public GitHub Pages page, rebuilt by a GitHub workflow when an issue changes and when main is pushed.

What he gets:

- One page on his phone, always current, without the seat publishing it.
- Each open question and next item on that page links to its issue, where he answers it.
- The seat's hand-publish of each land's page retires.

## Assumptions (any may be wrong)

- A1. The page builds on a GitHub runner with no change to its inputs. The grounding built it from a fresh full clone: 2.2 MB in about 2 s. Absent clone stores already degrade to one line each.
- A2. **The public copy loses three things the land copy shows.** These are the runtime map, the suite records and the build records, which live only in this clone. Their lines read "no runtime data" or "age unknown: no readable record". The seat judges this acceptable for a first version, because the page's job here is features, deliverables and the owner's questions. **The owner may disagree.** A follow-up could feed the CI suite records in through a `workflow_run` trigger.
- A3. nana-land's CI gate is unaffected. It judges only workflows that ran for the tip (`land-ci.mjs:68-76`), and this workflow never runs on pull requests.
- A4. Nothing new becomes public. The page carries the repo's own text, commit subjects and the issues, which are all public already. The identity check still runs on the built page before upload, because the page renders text in new combinations.
- A5. Unverified: GitHub's soft limit of ten Pages builds an hour does not apply to deploys from Actions. The concurrency group bounds a burst either way: one run deploys and the newest waits.
- A6. This lane reuses issues-home's issue reader and gh runner under the second-caller ruling. So its build starts only after issues-home lands.

## Open choices

The builder decides each one and reports it, unless it is marked for the seat.

- O1. The workflow file name and job names. The seat's pick is `.github/workflows/pages.yml` with one build job and one deploy job.
- O2. Where next items show on the page. The seat's pick is a short "Next" block on the Overview, each line linking its issue.
- O3. How the report gets the issues. The seat's pick: when the HANDOFF opts in, the report calls issues-home's reader through its gh seam. That reader filters by the owner's author and the `ask` and `next` labels. No new CLI flag is needed.
- O4. For the seat: Pages gets enabled with the Actions source (`gh api -X POST repos/<owner>/<repo>/pages -f build_type=workflow`) just before the land. Approved under reading 1.

## Threat model

In scope is honest variation in our tools' output, files and environment:

- zero open issues, or more than the fetch cap;
- an issue opened by someone else, or without our labels;
- the issue read failing in CI: rate limit, an API outage or a bad token;
- a burst of issue events;
- a shallow checkout;
- Pages not yet enabled;
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
- `packages/nana-pack/lib/land-ci.mjs:36-76`: the land gate, read only, for A3.
- The issue reader and gh runner land with issues-home. The build brief names their paths once they are on main.

## Outside precedent

- GitHub's starter Pages workflow: `actions/configure-pages`, `actions/upload-pages-artifact` and `actions/deploy-pages`.

## Must-meet

Rows R-2980 to R-2989 are free for this lane. Each check carries its `// req:` marker directly above it.

1. **The workflow.** `.github/workflows/pages.yml` runs on a push to main, on issue events (opened, edited, closed, reopened, labeled, unlabeled, deleted) and on manual dispatch. It checks out with `fetch-depth: 0` and grants only `contents: read`, `issues: read`, `pages: write` and `id-token: write`. Its concurrency group never cancels a deploy in progress. A test reads the file and asserts each of these.
2. **Issues on the page.** For a HANDOFF that points to its issues, the page's asks come from the issue list. Each ask shows its title, its blocking, optional or parked label, and a link to its issue. The counts line counts them. A test feeds the reader an unfiltered list and checks that only owner-authored `ask` and `next` issues appear.
3. **Next items.** The page lists the open `next` issues, each linking to its issue.
4. **Unchanged without opt-in.** A project whose HANDOFF keeps list asks gets the same page bytes as before, and the issue reader is never called (R-1012's form).
5. **A failed read.** When the issue read fails, the page still builds and shows one line naming the cause. The workflow still deploys it.
6. **The identity gate.** The workflow runs `identity-scan --stdin` on the built page before the upload step, and a hit stops the run before upload. A test asserts the step order.
7. **The hand-publish retires.** The page's artifact entry names the CI maker and the workflow, and its park line and manual maker line go. The tree check stays green. HANDOFF drops the hand-publish sentence. FEAT-039's two hand-publish known-bug lines close.

Also in this change, with no new row:

- The pack README's product report section names the public page's address and says what the public copy lacks (A2).
- FEAT-039 gains one known-bug line for A2's missing ages.

## Expected changes to existing tests (forecast, not a limit)

- `product-report.test.mjs`: new cases for the issue path; R-1018 and R-1030 cases stay, for list asks.
- `requirements-deliverables.test.mjs` and the tree check: the counts line moves when A-045's maker changes.
- Any test that pins R-1014's manual or park line.

## Class and size

- Class: ordinary by AGENTS.md's definition. The lane adds a CI workflow and changes the report, but no hook, install step, gate policy or land and review tool. Once lane-class lands, the seat confirms this with `node scripts/lane-class.mjs --root . --files` on the planned files.
- Size: small, so `pi-worker --lane-size small --stall-secs 1200`.
- The claim most likely to be wrong: A2, that the owner accepts a public page without test ages.
