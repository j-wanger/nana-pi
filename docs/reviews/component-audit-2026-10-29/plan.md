# Plan: component-audit (2026-10-29)

Worktree `~/nana-pi-wt/component-audit`, branch `feat/component-audit`, based on main `a2ad3f21`. A parallel lane, hive-render, renders this lane's data; the two share the data contract below.

Revision 1 takes the adversary's attack in `plan-attack.md` in full: 4 MUST, 5 SHOULD, 3 NOTE. The NOTEs are residuals (see Residuals). Rows are R-3100 to R-3110; R-3119 is reserved for the swap if this lane does it.

## Purpose

The owner's agreed reading (2026-10-29), after studying https://3dmk.com/: "Reading 1 is good, but I dont see why we cant start the rendering lane in parallel and start building the assets, the data behind should be swappable; … goal should be eventually replacing the product page, for now it can be a separate page, the audit should initiate conversations on a potential memory or whatever component redesign, we also need homes for things we have that their implementations do not, e.g the more complete governance and control piece".

Earlier in the same request: "the components or composition we should consider their split, I think it may help identify gaps in our agentic workflows, such as memory, I dont think our current memory system is very robust or scalable"; "nana-pi only first".

This lane makes the data behind the hive: a tracked, checked model of nana-pi's components. Each component names its parts by real path, the features it serves, a status with evidence, and, for a real gap, a conversation starter. Governance and control pieces get their own homes. The seat turns the conversation starters into `ask` issues, memory first.

## Assumptions

- A1. Feature placement: the rows go in FEAT-039 (see Questions). The owner's "eventually replacing the product page" makes the component map that feature's successor view, and placing rows there changes no tree heading. What may be wrong: FEAT-039 already holds 106 rows and 126 known-bug lines.
- A2. The audit is hand judgement over checked facts. Metaphor lines, gap sentences and asks are written by the builder. A status is chosen by the builder but must pass the status rules below, so it rests on an anchor, not an opinion. Paths, IDs, feature labels, row counts and activity are checked or derived, never trusted from the hand source.
- A3. A cited path must be tracked at HEAD. The check follows `trackedAtHead` in `packages/nana-pack/lib/brief-precedent.mjs`, so an untracked file in the worktree fails. A folder counts when a tracked file sits under it.
- A4. `recentCommits` counts first-parent commits on main in a window ending at HEAD's commit time, not the wall clock, so a build at one commit is repeatable. `nana-land` merges fast-forward only, so lane commits sit on main one by one; the count is commits, not lands. The field says so in its name.
- A5. `inFlight` reads remote-tracking refs `refs/remotes/origin/feat/*` not contained in main. In CI, `actions/checkout` with `fetch-depth: 0` fetches every branch. Locally the refs are as fresh as the last fetch; that is honest variation and the README says so.
- A6. Pages builds only on pushes to main and issue events (`.github/workflows/pages.yml`), so the public counts move only then.
- A7. A measured fact may be tracked as a `measured` anchor only as a date and counts: no path outside the repo, no name, no memory content. The memory component carries the 2026-10-29 measurement (Memory today, line 2) this way. Anything more specific stays out of tracked files; the seat may add it to the issue body after the identity scan and a hand check.
- A8. No new npm dependency. The validator is hand-written against the contract rules; there is no JSON Schema library.
- A9. The audit names no person. It cites the study site by URL only, never its author.
- A10. The proposed split below is a starting list, not a sealed one. The builder may merge or split a component when the evidence says so, and reports each change from the list. No test pins a component id, so a later merge needs no test edit.
- A11. The staleness line and the coverage lines are report-only: they print named lines and do not fail the check. Failing would block unrelated lanes whenever a busy part moves; the lines make drift visible at every run instead.
- A12. `auditedAt` is the commit the builder read when it wrote that component, normally the lane's base or an earlier build commit. It cannot be the commit that adds it.

## Open choices

- O1. The exact component list, metaphor lines and statuses, inside the status rules.
- O2. How `--asks` formats the issue title (it must stay one line, under 25 words, and name the component).
- O3. Whether `--check` and `--out` share one in-memory build (recommended) or two passes.
- O4. Where the check runs in the suite: a test calling the check on the tracked tree (recommended, like the tree check), or a separate npm script the suite invokes.

## Questions for the owner

Question: Which gaps get a redesign conversation now?
Default: memory first, then at most two more components the audit rates `gap` with an ask, each one `ask` issue labelled `optional`.
What the default gains and misses: three focused talks the owner can answer this week; misses a smaller gap that may matter more than the second or third.
Cost of a wrong guess: easy to undo: the seat closes an issue or posts more from the same audit text.
If answered otherwise: the seat posts the number the owner names, from the same `--asks` output.

Question: Do both lanes' rows go in FEAT-039, or in a new feature for the component map?
Default: FEAT-039, rows R-3100 onward for this lane and R-3120 onward for hive-render.
What the default gains and misses: no tree change and the page lands in the feature it may replace; misses a clean known-bug file and count for the map.
Cost of a wrong guess: easy to undo: moving rows to a new feature later is an approved regroup, and row IDs never change.
If answered otherwise: the seat creates the new feature heading under CAP-07 with the owner's label before the build, and both briefs name it.

## Feature

Feature: FEAT-039 · See the product and its decisions in one report

Lane class: `ordinary` (`node scripts/lane-class.mjs --root . --files docs/components/contract.json,docs/components/fixture.json,docs/components/nana-pi.json,scripts/component-contract.mjs,scripts/component-audit.mjs,scripts/component-audit-config.mjs,packages/nana-pack/tests/component-audit.test.mjs,REQUIREMENTS.md,docs/requirements-tree.md,docs/code-map.md,package.json,README.md,docs/known-bugs/FEAT-039.md,HANDOFF.md`, run 2026-10-29 on main).

Size: medium, at its upper end after revision 1. About 450 to 650 lines of code and tests (status rules, staleness and coverage added), plus a hand source of about 20 components whose evidence and anchors the builder must look up. Small builder (`pi-worker --lane-size small`) is enough; use larger if the first build's evidence is thin.

Rows: R-3100 to R-3110 used, R-3111 to R-3118 spare, R-3119 reserved for the swap if this lane does it. Artifact ID: A-086 (hive-render takes A-087).

## Threat model

In scope: honest variation in our own tools' output and in the repo. A renamed or deleted part path, a feature relabelled or regrouped in `REQUIREMENTS.md`, stale remote-tracking refs, a shallow clone, a gap sentence that names a person by mistake. Each must fail the check or the identity scan by name, or be stated as a limit.

Out of scope: deliberate forgery, such as a hand source that cites a real path for a false claim, or edited git history. Review catches a false claim; the check only proves the citation exists. A finding outside this model is a residual and goes in the known-bug file.

## Memory today

This is the evidence the memory component and its ask rest on. Each line cites a path, a row or a dated measurement. The adversary checked every claim against code and this machine on 2026-10-29; lines marked inferred are still to be confirmed by the builder.

1. Shared tier. `~/.claude/nana-memory/shared` is a folder of markdown memories with one `MEMORY.md` index. The Claude Code SessionStart hook `packages/nana-setup/claude/hooks/nana-shared-memory.mjs` prints that index at every session start, under a fixed budget of 9,000 characters (`packages/nana-setup/lib/shared-memory-config.mjs`, R-2340 to R-2345).
2. The index is already over that budget. Measured 2026-10-29: 80 entries in about 16,700 characters. The hook cuts every description and its fold line reads "80 of 80 entries shortened". The agent sees titles and description stubs, not the index as written.
3. Whole entries start to drop at about 125 entries, when the titles alone overflow (R-2343, `docs/known-bugs/FEAT-003.md`). New entries go at the end, so the newest drop first.
4. The hook also heals the `shared/` link inside each project's memory folder (R-348, R-871, R-872, R-933 to R-935; artifact A-053). The project tier itself is Claude Code's own auto-memory folder per project.
5. Writes are made by the model at its own discretion, as rule text tells it (`packages/nana-setup/claude/rules/nana-soul.md`, "Memory discipline"). Inside nana-pi, no code writes, dedups, expires, checks contradictions in or reviews a memory entry.
6. Outside the repo, this machine's Claude Code config also runs a separate memory MCP server with consolidate, contradict, prune and verify tools. Nothing in nana-pi installs, configures or reads it. The memory ask names it as prior art to evaluate or rule out; the tracked audit does not cite its location.
7. Reach. pi sessions, builders and reviewers get no shared memory (the runtime table in `AGENTS.md`). A Claude Code builder has auto-memory off on purpose (R-2654, `CLAUDE_BUILDER_CHILD_ENV` in `packages/nana-pack/bin/worker-config.mjs`), so that part is a decision, not a gap. Inferred: `claude-review` runs `claude -p` without memory isolation, so a Claude Code reviewer likely gets the shared index while a pi reviewer does not. Builder sessions get no knowledge pull (R-285, ruling 2026-10-09).
8. Knowledge pull. `packages/nana-knowledge` keeps an FTS5/BM25 index over roots listed in `sources.json` and returns pointers at prompt time (FEAT-003, FEAT-004). The adversary confirmed the live index holds no path under `~/.claude`, so memory is never searched by relevance.
9. Tracked, reviewed records that act as memory: rulings (`packages/nana-pack/rules/nana-rulings.md`), known-bug files (`docs/known-bugs/`), `HANDOFF.md` with its issues, `docs/sessions/`, and `REQUIREMENTS.md`.

So the gap, as evidence: memory lives untracked on one machine and nobody reviews it. Its index is already cut to stubs at every session start and will start dropping the newest entries at about 125. Nothing searches it by relevance, and whether a reviewer sees it depends on which runtime reviews. The tracked records are reviewed and durable but are not memory the agent consults by relevance. The memory component's status must pass the status rules like any other: its anchors are the FEAT-003 known-bug line and the 2026-10-29 measurement.

## Proposed split

A starting list; see A10. Each entry is `id · metaphor · main parts · features`. The builder checks every path and ID and writes the status, gap and evidence.

Workflow:

- `compass` · direction kept in view · `packages/nana-pack/bin/nana-objective.mjs`, `packages/nana-pack/bin/nana-frontier-summary.mjs`, `HANDOFF.md` · FEAT-001, FEAT-002
- `queue` · open questions and next items as issues · `packages/nana-pack/lib/handoff-issues.mjs`, `packages/nana-pack/lib/ask-shape.mjs` · FEAT-002, FEAT-005
- `library` · a library the agent reads before it guesses (memory and knowledge) · `packages/nana-setup/claude/hooks/nana-shared-memory.mjs`, `packages/nana-knowledge/`, `docs/known-bugs/` · FEAT-003, FEAT-004
- `drafting-table` · plans and briefs before building · `packages/nana-pack/prompts/planner.md`, `scripts/lane-class.mjs`, `packages/nana-pack/lib/brief-precedent.mjs` · FEAT-006
- `workshop` · builders make one lane at a time · `packages/nana-pack/bin/pi-worker.mjs`, `packages/nana-pack/bin/pi-watchdog.mjs` · FEAT-006
- `tool-belt` · skills and commands the agent carries · `packages/nana-pack/skills/`, `packages/nana-pack/extensions/` · FEAT-014, FEAT-025
- `eyes` · a real browser that looks at the page · `scripts/first-look.mjs`, `scripts/outside-reader.mjs`, `scripts/playwright-resolve.mjs` · FEAT-039
- `notice-board` · the product page · `scripts/product-report.mjs`, `.github/workflows/pages.yml` · FEAT-039
- `setup` · one command brings nana to a machine · `packages/nana-setup/` · FEAT-013, FEAT-015, FEAT-018
- `release-route` · templates ship only after acceptance · `scripts/template-release.mjs`, `scripts/template-acceptance.mjs`, `.github/workflows/ci.yml` · FEAT-019, FEAT-031
- `desk` · a control room over sessions · `apps/desk/` · FEAT-016, FEAT-020 to FEAT-024 (frozen by ruling 2026-10-10; say so in the gap)
- `lab` · experiments with costed evidence · `apps/bench/` · FEAT-034 to FEAT-038
- `stage` · signed blocks for focused apps · `packages/nana-stage/` · FEAT-025 to FEAT-027
- Absent (3dmk has, nana-pi lacks): `key-cabinet` (secrets) and `night-shift` (unattended multi-lane orchestration). The second is absent by ruling (two lanes build at most, an independent reviewer per land); its gap sentence says so and it carries no ask.

Governance homes, one component each, `kind: "governance"`. This is the starting list; R-3105 pins only that governance homes exist, not these ids:

- `rulings` · `packages/nana-pack/rules/nana-rulings.md`, `packages/nana-pack/extensions/nana-rulings.ts` · FEAT-001
- `review-ladder` · `packages/nana-pack/bin/pi-review.mjs`, `packages/nana-pack/bin/claude-review.mjs`, `packages/nana-pack/bin/review-round.mjs`, `packages/nana-pack/prompts/review-standard.md` · FEAT-007
- `land-gate` · `packages/nana-pack/bin/nana-land.mjs` · FEAT-008
- `requirement-contract` · `REQUIREMENTS.md`, `scripts/requirements-trace.mjs`, `scripts/requirements-tree.mjs` · FEAT-028
- `code-map` · `scripts/code-map.mjs`, `code-map.config.json` · FEAT-029
- `command-gate` · `packages/nana-pack/extensions/nana-gate.ts` and its `packages/nana-pack/lib/gate-*.ts` · FEAT-009, FEAT-010, FEAT-011
- `identity-scan` · `scripts/identity-scan.mjs` · FEAT-002
- `writing-rule` · `packages/nana-pack/rules/nana-writing.md`, `packages/nana-pack/bin/nana-writing.mjs` · FEAT-005

The builder may add other homes it finds (lane class, known-bug files, trust decisions) and reports them.

## Shared data contract

This section is word-for-word the same in the component-audit and hive-render plans.

Owner: the component-audit lane. Only that lane, or a later lane in its name, changes the contract, the fixture or the validator. The hive-render lane reads them.

Frozen: version 1, exactly as written below, is frozen for both builds. Neither lane changes a field, an enum, a rule or a fixture value. A need for a change goes to a follow-up lane that bumps `version`, and the builder that finds the need reports it instead of making it.

Files. Both lanes add these two files, byte-identical, each written as `JSON.stringify(value, null, 2) + "\n"` from the literals below:

- `docs/components/contract.json` (sha256 `ea48a6136c4fc7b77d1a1d949d08cf8a23795560f4623e9a0318a253dd2de39e`)
- `docs/components/fixture.json` (sha256 `09d305725ce77b4d6e1aa2cb035bce06bd4c7274fa571bfb5b51714278363ebd`)

Git merges two identical additions cleanly, so either lane may land first. Each lane's reviewer checks both hashes. A byte difference shows up as a merge conflict at the second land, which is the loud failure wanted.

```js
const contract = {
  contract: "nana-components",
  version: 1,
  kinds: ["workflow", "governance"],
  statuses: ["sound", "partial", "gap", "absent"],
  documentFields: ["contract", "version", "project", "components"],
  componentFields: ["id", "name", "metaphor", "kind", "parts", "features", "status", "gap", "ask", "evidence", "activity"],
  featureFields: ["id", "label", "rows", "implemented"],
  askFields: ["question", "default", "gains", "cost", "otherwise"],
  activityFields: ["recentCommits", "inFlight"],
};
const fixture = {
  contract: "nana-components",
  version: 1,
  project: "fixture",
  components: [
    { id: "workshop", name: "Workshop", metaphor: "A workshop where builders make one lane at a time", kind: "workflow",
      parts: ["packages/nana-pack/bin/pi-worker.mjs", "packages/nana-pack/bin/pi-watchdog.mjs"],
      features: [{ id: "FEAT-006", label: "Launch builders with execution limits", rows: 10, implemented: 9 }],
      status: "sound", gap: null, ask: null,
      evidence: ["packages/nana-pack/bin/pi-worker.mjs", "FEAT-006"], activity: { recentCommits: 3, inFlight: 1 } },
    { id: "library", name: "Library", metaphor: "A library the agent reads before it guesses", kind: "workflow",
      parts: ["packages/nana-setup/claude/hooks/nana-shared-memory.mjs", "packages/nana-knowledge/lib/query.ts"],
      features: [
        { id: "FEAT-003", label: "Index and connect existing knowledge sources", rows: 8, implemented: 6 },
        { id: "FEAT-004", label: "Retrieve relevant context with provenance", rows: 4, implemented: 4 },
      ],
      status: "gap", gap: "Fixture gap: the shared index is printed whole under a cap, so the newest entries drop first.",
      ask: { question: "Fixture question: should memory move from a printed index to a searched store?", default: "keep the printed index",
        gains: "Fixture: no new moving part; misses entries past the cap.", cost: "easy to undo", otherwise: "Fixture: plan a searched-store lane." },
      evidence: ["packages/nana-setup/lib/shared-memory-config.mjs", "R-2343"], activity: { recentCommits: 0, inFlight: 0 } },
    { id: "key-cabinet", name: "Key cabinet", metaphor: "A locked cabinet for secrets", kind: "workflow",
      parts: [], features: [], status: "absent", gap: "Fixture gap: no component holds secrets.", ask: null,
      evidence: ["AGENTS.md"], activity: { recentCommits: 0, inFlight: 0 } },
    { id: "review-hall", name: "Review hall", metaphor: "A hall where a different reviewer reads each revision", kind: "governance",
      parts: ["packages/nana-pack/bin/pi-review.mjs", "packages/nana-pack/bin/review-round.mjs"],
      features: [{ id: "FEAT-007", label: "Review a specific revision independently", rows: 12, implemented: 11 }],
      status: "partial", gap: "Fixture gap: the review round is pinned, the reviewer's reading is not.", ask: null,
      evidence: ["packages/nana-pack/bin/pi-review.mjs", "FEAT-007"], activity: { recentCommits: 2, inFlight: 0 } },
    { id: "land-gate", name: "Land gate", metaphor: "A gate that opens only for a reviewed revision", kind: "governance",
      parts: ["packages/nana-pack/bin/nana-land.mjs"],
      features: [{ id: "FEAT-008", label: "Integrate and clean up reviewed changes", rows: 0, implemented: 0 }],
      status: "sound", gap: null, ask: null,
      evidence: ["packages/nana-pack/bin/nana-land.mjs", "FEAT-008"], activity: { recentCommits: 5, inFlight: 0 } },
  ],
};
writeFileSync("contract.json", JSON.stringify(contract, null, 2) + "\n");
writeFileSync("fixture.json", JSON.stringify(fixture, null, 2) + "\n");
```

Rules. The validator `checkComponentData(data, contract)` in `scripts/component-contract.mjs` (component-audit lane) returns a list of problem strings, empty when the document is valid:

1. The document's keys are exactly `documentFields`; `contract` is `"nana-components"`; `version` equals the contract's `version`; `project` is a non-empty string; `components` is a non-empty array.
2. Each component's keys are exactly `componentFields`. `id` matches `^[a-z][a-z0-9-]*$` and is unique. `name` and `metaphor` are non-empty strings. `kind` is one of `kinds`; `status` is one of `statuses`.
3. `parts` is an array of repo-relative paths (forward slashes, no leading `/`, no `..` segment). It is empty exactly when `status` is `absent`.
4. `features` is an array of objects whose keys are exactly `featureFields`: `id` matches `^FEAT-\d{3}$`, `label` is a non-empty string, `rows` is an integer of at least 0, and `implemented` is an integer from 0 to `rows`.
5. `gap` is `null` exactly when `status` is `sound`; otherwise it is a non-empty string.
6. `ask` is `null`, or an object whose keys are exactly `askFields`, each a non-empty string (the planner's five ask lines). `ask` is `null` when `status` is `sound`.
7. `evidence` is a non-empty array. Each item is a repo-relative path or an ID matching `^(R-\d{3,4}|G-\d{3}|FEAT-\d{3}|CAP-\d{2})$`.
8. `activity` has exactly `activityFields`, each an integer of at least 0. `recentCommits` counts commits on main inside the activity window that touch a part; `inFlight` counts unmerged `origin/feat/*` branches that touch a part.
9. Component order is display order. Whether a path or ID exists is the audit's check, not the contract's, because the page cannot see the repo.

Where the data lives and how the page loads it:

- The real audit is the tracked hand source `docs/components/nana-pi.json` (component-audit lane). It holds judgement only: features are FEAT IDs, and there is no `activity` key. `node scripts/component-audit.mjs --out <file>` writes the contract-shaped document, adding each feature's label and row counts from `REQUIREMENTS.md` and each component's activity from git. That output is built at Pages build time and never tracked, because activity changes with every commit.
- The page is `apps/hive/` (hive-render lane). It loads `components.json` from its own folder with `fetch("components.json")`, and is always served over http: GitHub Pages at `<pages root>/hive/`, or `node scripts/hive-page.mjs --serve` on loopback. It is never opened as a file URL, because browsers refuse ES module and fetch loads from `file://`.
- `node scripts/hive-page.mjs --out site/hive [--data <file>]` (hive-render lane) copies `apps/hive/` and writes `site/hive/components.json` from `--data`, defaulting to the fixture. Until the swap, it checks only `contract` and `version` against `contract.json`.

The swap. Neither lane knows it is second until the other lands. The second lane to land then merges main, does the swap in its own branch, and takes another review round on that change before it lands. The swap is:

1. In `.github/workflows/pages.yml`, the Pages build job runs `node scripts/component-audit.mjs --out "$RUNNER_TEMP/components.json"` before the hive step, and the hive step passes `--data "$RUNNER_TEMP/components.json"`.
2. `scripts/hive-page.mjs` refuses data that `checkComponentData` rejects, importing the validator rather than copying it, with one line naming the first problem.
3. `packages/nana-pack/tests/pages-workflow.test.mjs` and `packages/nana-pack/tests/hive-page.test.mjs` change to match, and the identity scan of `site/hive/components.json` stays.
4. One row pins the swap: R-3119 if component-audit does it, R-3139 if hive-render does. Its sentence: "WHEN the Pages build job runs, it shall build the hive's data with `component-audit --out` and pass it to `hive-page --data`, which shall refuse data that `checkComponentData` rejects."
5. The A-086 entry gains `Read by: A-086 · code: scripts/hive-page.mjs`, and any park line on it goes.

## Hand source

`docs/components/nana-pi.json` is the frozen contract's document minus the derived fields, plus two audit-only keys per component. Its document keys are `contract`, `version`, `project` (`"nana-pi"`) and `components`. Each component has:

- the contract's `id`, `name`, `metaphor`, `kind`, `parts`, `status`, `gap`, `ask` and `evidence`;
- `features` as a list of FEAT IDs only, with no labels or counts;
- no `activity` key;
- `auditedAt`: the full commit hash the builder read when it wrote the component (A12);
- `anchors`: a list, each item one of three kinds. A known-bug line is `docs/known-bugs/<file>.md:<line>`, where that line starts with `- `. A row is an `R-nnnn` ID whose status is `planned`, `untested` or `violated`. A measured fact is `measured <YYYY-MM-DD>: <counts>` (A7).

`--out` drops `auditedAt` and `anchors`, adds each anchor's file or row ID to `evidence` once, and fills the derived fields. The page never sees the audit-only keys, so the frozen contract stays unchanged.

## Status rules

The check tests each rule and names the component and the rule it breaks:

- `sound`: no anchors, and no cited feature holds a row whose status is `planned` or `violated`.
- `partial`: tracked parts and at least one anchor.
- `gap`: at least one anchor and a non-null ask, the named need to talk about.
- `absent`: no parts and a gap sentence, as the contract already says. An anchor is optional.

So a status can change only when its evidence changes. A later lane that fixes memory removes the anchors, sets `sound`, and edits no test.

## Planned files

- New: `docs/components/contract.json`, `docs/components/fixture.json` (shared, byte-identical, frozen), `docs/components/nana-pi.json` (hand source), `scripts/component-contract.mjs` (validator and contract reader), `scripts/component-audit.mjs` (`--check`, `--out <file>`, `--asks`), `scripts/component-audit-config.mjs` (sealed values), `packages/nana-pack/tests/component-audit.test.mjs`.
- Changed: `REQUIREMENTS.md` (FEAT-039 rows R-3100 to R-3110, artifact A-086 with its maker and reader), `docs/requirements-tree.md` (regenerated), `docs/code-map.md` (regenerated), `package.json` (a `components` script for `--check`, if O4 picks a script), `README.md` (one paragraph naming the audit and its commands, which the readme check then verifies, and saying a folder part makes `recentCommits` read busy), `docs/known-bugs/FEAT-039.md` (including the residuals below), `HANDOFF.md`, `docs/sessions/`.
- Not touched: `.github/workflows/pages.yml`, `scripts/hive-page.mjs` and anything under `apps/hive/`, unless this lane lands second and does the swap in the shared contract.

Artifact entry, real at this lane's land: `Artifact: A-086 · component audit · tracked: docs/components/nana-pi.json · manual: an agent writes it by hand; npm test fails on a missing path, ID or broken status rule`. Reader: `Read by: A-086 · code: scripts/component-audit.mjs`, whose `--out` and `--asks` turn it into page data and issue text. If the reviewer rules that this lane's own command is not a reader, the builder writes `Parked: A-086 · since <land date>: the hive page reads it after the swap` instead. The swap then adds the hive reader and removes any park line.

Merge forecast: both lanes append rows to the FEAT-039 table and both regenerate the outline and code map. The second lane to land resolves those by keeping both blocks and regenerating. The two shared JSON files merge cleanly when their bytes match. The swap timing is in the shared contract.

## Precedent

- `scripts/requirements-tree.mjs`: take `parseLedger` and `readRequirementRows` for feature labels, row counts, row statuses and the set of known IDs. Import them; do not parse `REQUIREMENTS.md` again.
- `scripts/product-report.mjs`: the nearest per-feature status count, and the injected git runner pattern. Reuse any exported helper rather than copying.
- `packages/nana-pack/lib/brief-precedent.mjs`: `trackedAtHead` for "a cited path exists" (A3).
- `scripts/deliverables.mjs`: the nearest checker that turns a cited path not tracked at HEAD into a named problem line.
- `scripts/known-bugs.mjs`: how known-bug files are read, for checking that a known-bug anchor points at a `- ` line.
- `scripts/code-map.mjs`: `repoGraph`, as `scripts/lane-class.mjs` imports it, for the list of mapped modules the coverage lines compare against.
- `packages/nana-pack/lib/ask-shape.mjs`: `ASK_LABELS` for the five ask labels `--asks` prints, and `parseAskBody` for the round-trip test. Import the labels; never retype them.
- `scripts/requirements-moved.mjs`: `defaultGit` and `MAX_GIT_BUFFER` for the bounded, injected git runner the activity and staleness counts use.
- `packages/nana-pack/lib/release-status.mjs`: read-only git queries over refs, the nearest shape for the in-flight branch count.
- `scripts/first-look-config.mjs` and `scripts/outside-reader-config.mjs`: the sealed-config file with provenance beside each value.
- `scripts/identity-scan.mjs`: the scan R-3106's test pipes `--asks` through, and the seat runs again before posting.
- `packages/nana-pack/tests/first-look.test.mjs`: the test file layout for a `scripts/` tool tested from `packages/nana-pack/tests`.
- `npm run map:search` results taken: `scripts/requirements-moved.mjs` and `scripts/deliverables.mjs` for row and claim checks, `packages/nana-pack/lib/real-path.mjs` (not needed: paths are repo-relative and checked against git, not the file system), `packages/nana-pack/lib/rulings-config.mjs` for the sealed-config style.

## Outside precedent

Backstage software catalog (Apache-2.0), its `catalog-info.yaml` entity model of Component and System with a kind, an owner and a lifecycle field: borrow. Take one entry per component with a kind and a status, and parts named by location. Skip the YAML, plugins, ownership and the service it runs in.

Other public reference: https://3dmk.com/ for the chapter split and the one-line metaphor per chapter. It states no licence and no code is taken. Cite the URL only, never its author.

## Must-meet

Each test sits in `packages/nana-pack/tests/component-audit.test.mjs` with its `// req:` marker directly above it.

1. R-3100 · The check on the tracked tree passes, and fails naming each cited path. Proves: every path in `parts` and `evidence` of `docs/components/nana-pi.json` is tracked at HEAD. Pins: `--check` exits 0 on the tracked tree; on a temporary copy with one part and one evidence path renamed, it exits 1 and prints one line per missing path naming the component id and the path.
2. R-3101 · Unknown IDs fail by name. Proves: every FEAT ID in `features` and every R, G, FEAT or CAP ID in `evidence` exists in `REQUIREMENTS.md`. Pins: a source citing `FEAT-999` and `R-9999` fails with one line each naming the component and the ID.
3. R-3102 · The validator follows the frozen contract rules. Proves: `checkComponentData` accepts `docs/components/fixture.json` and the `--out` document built from the tracked source, and rejects each rule break by name. Pins: one case per contract rule 1 to 8 (missing key, unknown kind, unknown status, wrong version, duplicate id, `absent` with parts, non-`sound` without a gap, `sound` with an ask, `implemented` above `rows`, negative activity), each returning a problem naming the field.
4. R-3103 · Derived values are never hand-written. Proves: `--out` fills each feature's `label`, `rows` and `implemented` from `REQUIREMENTS.md`, drops `auditedAt` and `anchors`, and the check refuses a hand source that carries feature objects or an `activity` key. Pins: on a small fixture ledger, a component citing one feature gets that feature's heading label and its row and implemented counts exactly; a source with `activity` fails naming the component.
5. R-3104 · Activity is counted from git at HEAD. Proves: `recentCommits` counts first-parent main commits within the window before HEAD's commit time that touch a part; `inFlight` counts `refs/remotes/origin/feat/*` branches not contained in main whose diff from their merge base touches a part. Pins: in a temporary git repository with fixed commit dates, an old commit and an unrelated commit are not counted, a recent one touching a part is, and one unmerged feat branch touching a part gives `inFlight: 1` while a merged one gives 0.
6. R-3105 · The audit has both kinds, and governance has a home. Proves: the tracked audit holds at least one `workflow` component and at least one `governance` component with tracked parts. Pins: the test asserts those two facts and nothing about which ids or statuses exist.
7. R-3106 · Asks come out ready to post. Proves: `--asks` prints one block per component with a non-null ask, in audit order, each a one-line title followed by a body in the five planner labels from `ASK_LABELS`, and nothing else; the output passes the identity scan. Pins: `parseAskBody` reads each printed body back to the same five values as the source; the tracked audit's `--asks` output piped to `scripts/identity-scan.mjs --stdin` exits 0; a source with no asks prints nothing and exits 0.
8. R-3107 · Sealed values keep provenance. Proves: the activity window (chosen 14 days), the staleness limit, the hand-source path and the contract path are each defined once in `scripts/component-audit-config.mjs` with provenance. Pins: one test reads each value and its provenance comment; other tests import the names.
9. R-3108 · Each status follows its rule. Proves: the check applies the four status rules and the three anchor kinds. Pins: one failing case each for `sound` with an anchor, `sound` citing a feature with a `planned` row, `partial` with no anchor, `gap` with no ask, a known-bug anchor whose line does not start with `- `, a row anchor whose status is `implemented` or `retired`, and a malformed `measured` anchor; each prints the component, the rule and the anchor; the tracked audit passes.
10. R-3109 · Stale audits are named. Proves: `auditedAt` must be a full commit hash that is an ancestor of HEAD, and the check prints one `stale:` line for each component whose parts have more than the sealed staleness limit of commits since it. Pins: in a temporary repository, a component past the limit is named with its commit count and the check still exits 0; one at the limit is not named; a hash that is not an ancestor fails naming the component; with git history missing, one note says staleness was not measured.
11. R-3110 · Code no component claims is listed. Proves: the check prints each mapped module that lies under no component's `parts` as an `unclaimed:` line, then one count line. Pins: with a fixture map of three modules and parts covering one, it prints the other two and `unclaimed: 2 of 3 mapped modules`; the exit code does not change.

The staleness limit is chosen, not measured: 20 commits, about three lanes at this repo's usual three to eight commits per lane. The builder seals it with that reason.

## Seat hand-off

The builder never posts. It writes each conversation starter as an `ask` in the hand source, and `--asks` prints them.

Before the build, the seat posts this plan's two owner questions as one `ask` issue labelled `optional`, as the seat rule says for plans. Both are easy to undo, so the build starts on the defaults.

After every reviewer says LAND, the seat runs `node scripts/component-audit.mjs --asks` on the reviewed tip. Within the number the owner's answer to the first question allows, memory first, the seat:

1. passes each title and body through `node "$HOME/nana-pi/scripts/identity-scan.mjs" --stdin --root "$HOME/nana-pi"` again and posts only when it exits 0;
2. hand-checks names, handles, hostnames, work references and project names;
3. may add one line from this machine to the memory body (A7), such as the memory MCP server's tool list, and re-runs the scan;
4. posts one issue labelled `ask` and `optional`, from the owner's gh account, and lists any failed post and its reason in the report.

No posting waits on a new commit, so nothing is written after the land. R-3106's scan in the suite means a scan failure is found before LAND, not after.

## Residuals

The builder writes these as known-bug lines in `docs/known-bugs/FEAT-039.md`:

- N1. R-3101 accepts a retired row as evidence. Only a row anchor rejects `retired` (R-3108).
- N2. The shared files' hashes are checked by the reviewers, not by a one-line sha256 test.
- N3. A folder part such as `packages/nana-setup/` makes `recentCommits` read busy all the time. The README says so.

## Expected test changes

A forecast, not a limit: `packages/nana-pack/tests/requirements-tree.test.mjs` or the suite's tree check sees new rows and the regenerated outline; the readme check sees the new README paragraph. No existing test asserts on `docs/components/`.
