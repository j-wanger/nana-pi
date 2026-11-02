# Plan: builder-drop-study (2026-11-03, revision 2 after plan-attack.md)

Lane `builder-drop-study`, worktree `~/nana-pi-wt/builder-drop-study`, branch `feat/builder-drop-study`, base
`origin/main` `6ad0b67c`. Second half of the split recorded in `builder-drop`'s plan
(`origin/feat/builder-drop:docs/reviews/builder-drop-2026-11-02/plan.md`, "Lane 2 outline" and its last section).

Lane class: `ordinary` (`node scripts/lane-class.mjs --root . --files apps/bench/drop-study.mjs,apps/bench/lib/drop-draw.mjs,apps/bench/lib/drop-manifest.mjs,apps/bench/lib/drop-score.mjs,apps/bench/lib/drop-verdict.mjs,apps/bench/lib/drop-power.mjs,apps/bench/lib/drop-baseline.mjs,apps/bench/lib/replay-journal.mjs,apps/bench/test/drop-study.test.mjs,apps/bench/studies/builder-drop-2026-11-03/PREREG.md,apps/bench/studies/builder-drop-2026-11-03/study.json,apps/bench/studies/builder-drop-2026-11-03/pilot/study.json,apps/bench/studies/builder-drop-2026-11-03/main/study.json,apps/bench/studies/builder-drop-2026-11-03/baseline.json,apps/bench/README.md,REQUIREMENTS.md,docs/known-bugs/FEAT-045.md,docs/code-map.md,docs/requirements-tree.md,docs/sessions/2026-10.md,docs/reviews/builder-drop-study-2026-11-03/error-baseline.md`, re-run for revision 2).
One final reviewer, the roster's reviewer. No wrong-code pairs, no land reviewer, no install check.

**Dependency.** This lane consumes the harness that `builder-drop` is building now (`replay grade`, `replay run`,
`replay rows`, `replay errors`, the arm and grading-manifest formats, the spend journal). The build starts after
`builder-drop` lands, or merges main as its first step once it does. It changes one harness file,
`lib/replay-journal.mjs`, so admission reads one study-wide budget (A12).

Stakes: this lane spends nothing, but it fixes every rule the paid rounds are judged by: about USD 33 for the pilot,
then up to USD 400 in all. A rule changed after data is seen, or a grader that certifies a broken check, wastes the
whole spend and is hard to undo. The harms, in order:
- a check counted as fail-to-pass because the grader broke, or because a later review widened it;
- a verdict that leans on missing runs or on a test whose assumptions do not hold;
- treatment money spent on a round that cannot decide;
- spend past USD 400 across rounds;
- a registration edited after the pilot;
- private session text in git.

IDs: FEAT-045 (opened by `builder-drop`), rows R-3610 to R-3618, with R-3619 spare, all from the block that plan
reserved. Artifacts are A-102 and A-103. A grep over `~/nana-pi-wt/*/docs/reviews/*/plan.md` and `REQUIREMENTS.md`
on 2026-11-03 found claims up to A-101, R-3579, the builder-drop block R-3600 to R-3619 and R-3640 to R-3648
elsewhere. The seat may move the range at merge time.

## Purpose

Agreed reading (owner, 2026-11-02): "go ahead with the drop test whenever theres a free lane, our goal is to craft the
builder (and eventually every role)'s context with craft and design ... without it, we lack understanding of what
context matters, which really drives the memory and knowledge pull design as well". Current priority: "craft each
role's context by design, builder first, measured by drop tests". The same day: "we should track build time, tokens
spent, tool-calls, and the regular evals thats used for evaluating agents for these builds" and "also need to track
error types in the build process, failed tool calls vs syntax failures, vs failures that would be saved by precedents
etc".

The owner's study decisions, taken by the seat with an astra consult (builder-drop plan, last section, and
`owner-consult-astra.md` there):
- a control-only pilot of 10 lanes × 2 runs, about USD 33;
- then, only if the pilot passes, 10 lanes × 3 arms × 3 repeats, about USD 205, under a USD 400 hard cap;
- an 80% power threshold for both planned decisions, registered before the pilot with the corrected verdict rule;
- headroom under the cap for a one-turn overshoot;
- a tool-list arm that removes three listings (skills listing, `tools` section, `docs` section), not tool access;
- the builder pinned to openai-codex gpt-6.1-sol, thinking medium, for the whole study.

This lane's feature, as one falsifiable sentence:

> Before any paid run, commit a pre-registration that fixes which past lanes are replayed, which landed checks grade a
> replay, how a run scores, how missing runs count, which valid test gives each verdict, when treatment money may be
> spent and what the whole study may spend, with an audited baseline of past builds' error classes; every rule is a
> deterministic function tested on synthetic fixtures.

The report's first line, fixed now: "Verdicts apply only to the drawn eligible landed lanes, replayed in the replay
environment by gpt-6.1-sol medium; the pilot shows the replay is feasible, not that it matches production."

Evidence today (counts only, read 2026-11-03 from `.git/nana/build-records.jsonl` and `land-records.jsonl`):
- 80 lanes have build records, and 53 landed.
- 50 landed lanes have a first build from `build-brief-1.md`.
- By slot, those 50 split into 25 small builds (gpt-6-luna) and 25 larger builds (23 gpt-6.1-sol, 2 gpt-5.6-sol).
- 48 of the 50 first builds ended `ok` in one attempt, and 2 ended `failed`.

**What revision 2 makes plain.** With a test that is valid for bounded, varying lane effects (A9), `no harm seen` at
a 0.2 margin needs far more runs than USD 400 buys. The Hoeffding half-width alone is 0.316 at 10 lanes × 3 repeats,
0.223 at 20 × 3 and 0.155 at 25 × 5. This is computed, not measured: the bound depends only on the run count. The
power gate (A10) will therefore stop after the pilot unless the owner changes the design. As the seat directed, the
default stays: run the pilot, which buys replay feasibility, cost per run and control variance, then stop and bring
the owner a priced grid. The first owner question below is that decision.

## Assumptions

- A1. Harness interfaces, as `builder-drop`'s plan names them, not built yet. The builder's first step, before any
  test, is an interface check. It reads the landed harness README, `replay.mjs` help and the named exports, and
  records each mismatch in its report. The harness wins on names. A difference that changes what a must-meet proves
  goes back to the seat. Assumed:
  - `replay grade --manifest <grading.json> --tree <clone> --out <private>` marks each check `pass`, `fail`,
    `not-run`, `grader-broken` or `grader-incompatible`. It refuses an overlay hash mismatch and waits while the
    machine is busy.
  - The manifest holds the overlay files with hashes, check ids `<file>#<line>#<occurrence>`, each check's rows and
    weight, its class (`f2p` or `p2p`), the public interface and the volatile-span masks.
  - `replay run --study <dir> --out <private>` reads `<dir>/study.json` (model, thinking, arms, repeats, lanes,
    allowance, kill limit, cap, schedule seed). It journals `start` before spawning and refuses an uncommitted
    pre-registration.
  - `replay rows` yields one row per tuple with the builder-drop T5 fields.
  - The error classifier behind `replay errors` is an importable library function. This lane imports it and copies
    nothing.
  - The harness schedule interleaves arms within each lane and repeat, in seeded order. A9's `needed` test relies on
    this. If the harness orders runs otherwise, the builder adds the interleave through `study.json`'s schedule, or
    reports it.
- A2. Population. A candidate lane needs all of these:
  - its earliest build record names `build-brief-1.md`;
  - a land record ends `landed`, before this lane's registration commit;
  - it is not a FEAT-045 lane.

  Start tip is the first build's `tip`. First-build end tip is that build's `end` tip. Land tip is the landed
  attempt's `tip`. A candidate is eligible when all of these hold:
  - the anatomy store (A-092) holds attempt 0;
  - model labels (A-098) cover its non-oversize units, which the lessons arm needs;
  - its brief exists at the start tip;
  - its manifest validates (A5).

  Each step's exclusions are counted with a reason.
- A3. The draw is stratified by first-build slot: 5 `small`, 5 `larger`. Each stratum is put in one seeded order
  (`plan.mjs` `rng`/`shuffle`), and lanes are taken in order until 5 are eligible. Skipped lanes are listed. The pilot
  and main rounds use the same lanes. Strata are descriptive; inference pools lanes.
- A4. Manifest scope is frozen to what the first build was asked (attack 2).
  - Frozen text: the brief and the plan it names are read with `git show <start tip>:<path>`. The text must be at the
    start tip, not at a later revision; a lane without it is excluded as `brief not frozen`.
  - Rows: every `R-nnn` or `R-nnnn` the frozen brief names, including ranges written `R-a to R-b`, plus the frozen
    plan's must-meet rows.
  - Checks: calls named by the repo's `CALL_NAMES` (`test`, `it`, `check`, from `scripts/requirements-trace.mjs`), in
    test files the land changed, found through `scanSource`. Stacked markers give one check several rows.
  - Same-row widening: a check is kept only when its body at the land tip equals its body at the first-build end tip,
    after CRLF and whitespace are normalized. A check that review added, or that review strengthened, is excluded as
    `changed after first build`, even under the same row and path.
  - Interface: each named import, with module and export, from a non-test module, and each CLI subcommand a test
    spawns (`node <path> <word>`). Every one must exist at the start tip, or be named in the frozen brief or plan by
    path and by export or subcommand word. Otherwise the check is excluded as `interface not in brief`.
  - Justification: the manifest records, for each kept check, the frozen file and line where its row is stated. The
    seat spot-audits one lane per stratum by hand and records the result in the lane folder.
  - Helpers: a changed file under a test root that a non-test file imports holds production logic, and the checks
    that use it are excluded.
  - Weights: each row weighs 1, shared equally by its checks. A check under two rows takes a share in each.
- A5. Regression set (attack 4). Usable success needs preserved behaviour, so each manifest also registers `p2p`
  checks from test files the lane did not change. These are the test files that the start tip's code map shows
  importing, within two hops, a non-test module the lane changed. They are ordered by hop count and then path, and
  capped at `regressionFiles` files. Every check in them that passes at the start tip and twice at the land tip is a
  required `p2p` check. So is every passing check in a changed file that existed at the start tip.
- A6. Validation outcome table (attack 3), run through `replay grade`. The tips are graded once at the start, twice at
  the land, and once at the first-build end for A15. Infrastructure outcomes are retried once; a second
  infrastructure outcome is final.

  | Start tip | Land tip, both runs | Result |
  |---|---|---|
  | `fail` (assertion, or a missing named module or export) | `pass` | `f2p` |
  | `pass` | `pass` | `p2p` |
  | `not-run` | `pass` | excluded: `start not-run` (cause unshown) |
  | `grader-broken` or `grader-incompatible` | any | excluded: `grader fault at start` |
  | any | anything but `pass` in either run | excluded: `fails at land` or `flaky` |

  A manifest with no `f2p` check left is invalid. A file-level `grader-broken` at the land tip after the retry makes
  the whole manifest `unvalidated`, never valid. Validation spends no money and obeys the harness busy rule.
- A7. Run score (attack 4). Usable success is 0 when any of these happens:
  - a required `p2p` check is `fail` or `not-run`. A crash before regression checks run is the build's fault, because
    the same file passed twice on the land tip;
  - the outcome is not `settled`.

  Otherwise it is the row-weighted `f2p` pass fraction, held as an exact BigInt rational. A run is `missing` when any
  of these holds; there is no third state:
  - a check is `grader-broken` or `grader-incompatible`;
  - the outcome is `leak-suspect`, `harness: prompt-mismatch`, `aborted: busy` or `interrupted`;
  - the tuple never ran.
- A8. Missing outcomes (attack 1). The report reconciles rows against every registered tuple (lane × arm × repeat),
  including cap-truncated and never-started tuples. Each decision is computed on its own adversarial completion:
  - for `needed`, a missing control run scores 0 and a missing treatment run scores 1;
  - for `no harm seen`, a missing control run scores 1 and a missing treatment run scores 0.

  A lane with no graded run in an arm gets that arm wholly completed this way. Both tests below are monotone in each
  lane difference: the sign-flip p value does not rise when one difference rises, and the Hoeffding bound moves with
  the mean. The adversarial completion is therefore the worst admissible completion, and a verdict that holds there
  holds under every completion. A complete-case line prints too, marked descriptive.
- A9. Inference (attack 5). All inference is conditional on the drawn lanes; the runs are the random part. Lane
  difference D = control mean − treatment mean, in [−1, 1]; harm is positive.
  - `needed`: one-sided exact sign-flip on lane differences (`signFlip`, imported) at α. The null is that dropping the
    kind changes nothing within any lane. Under that null, with runs independent given lane and arm and arms
    interleaved within each lane and repeat (A1), each lane's control and treatment runs can swap places. D is then
    symmetric about 0, and sign-flipping is exact. A rejection means dropping the kind changed outcomes in the harm
    direction, not that the mean harm passes a stated size.
  - `no harm seen`: a one-sided Hoeffding bound on the conditional mean harm. Each of the 2·L·R runs is an
    independent bounded term, with range 1/(L·R) in the mean. That gives UCB = observed mean harm +
    sqrt(ln(1/α') / (L·R)), and `no harm seen` holds when UCB < margin. It needs only independence and bounds, so
    varying and skewed lane effects do not break it.
  - Holm across the two kinds, separately for each decision. Holm is valid under any dependence, including the
    shared control.
  - The sign-flip test is not used for the margin, and the noisy-control step of revision 1 is removed: valid tests
    lose power under noise rather than produce false verdicts.
- A10. Verdict order per kind, first match wins:
  1. `undecided: too few lanes` when fewer than `minLanes` lanes have any graded control and treatment run;
  2. `undecided: control unfit` when the complete-case control mean is below the pilot bar's mean;
  3. `needed` (A9, on the `needed` completion);
  4. `no harm seen` (A9, on the `no harm seen` completion);
  5. `undecided: insufficient precision`.

  Missing runs need no step of their own; they are already priced in by A8. `better without` prints as exploratory.
  The report also prints the observed mean harm and the Hoeffding interval.
- A11. Treatment gate (attack 6). `gate` prints `treatment: go` only when the pilot bar holds and the power simulation
  passes. The pilot bar is control mean usable success of at least 0.5, and at least 60% of lanes with one resolved
  control run. It is a feasibility bar only. The simulation, seeded:
  - Control level per simulated lane: drawn from Beta(s + ½, n − s + ½), Jeffreys, over that pilot lane's resolved
    runs. A lane with 2 of 2 is not deterministic. For grids above 10 lanes, lanes are resampled with replacement.
  - Dependence: each lane-repeat block shares a logit shock N(0, τ²) across its arms. The scenarios are
    τ ∈ {0, 0.5, 1.0} (chosen to cover none, moderate and strong shared failure or drift).
  - Harm: proportional, p_t = p_c·(1 − r_i), with r_i drawn evenly in [0, 2r] and capped at 1. r is set by bisection
    so that the achieved mean harm over the simulated lanes equals h. If h cannot be reached, the scenario prints
    `harm unreachable` and fails.
  - Joint: both kinds are simulated together with one shared control and decided through Holm. The scenarios are
    (A harm h, B harm 0) and the swap. Power is P(`needed` for the harmed kind) and P(`no harm seen` for the
    unharmed kind).
  - Pass: the Wilson lower bound of each power, over `powerSims` draws, is at least 0.8 in every τ scenario.
  - Output: a priced grid over lanes {10, 15, 20, 25, 40} and repeats {3, 5}, with power by decision and the run
    count and cost at the pilot's measured cost per run. It also gives a `needed`-only column.

  On `stop`, the seat brings the grid to the owner; nothing grows by itself.
- A12. One budget across rounds (attack 7). The study has one private root. Every round (smoke, pilot, main and
  reviews) writes its harness folder under it. This lane changes `replay-journal.mjs` admission. Before each tuple or
  review, it sums every journal under the root: spent, reserved and unknown cost charged at full allowance. It admits
  only when that sum plus the allowance stays within `admissionCap`. Then `admissionCap` = `totalCap` (USD 400) −
  `overshootBound`. Here `overshootBound` is the larger of two figures, each computed from its model registry entry:
  - the builder's worst single turn: context window × input price + max output × output price;
  - the reviewer's worst single call.

  On pi's registry entry for gpt-6.1-sol (272k context, 128k output, USD 2 and USD 10 per million), the builder turn
  is about USD 1.82. The builder confirms the openai-codex entry. Rounds run one at a time; a root lock (the harness
  folder lock, held on the root) refuses a second. A folder outside the root is the residual named below.
- A13. Registration order. `PREREG.md`, the root `study.json`, the generated pilot and main study files and every
  manifest land in this lane's reviewed change, before the pilot spends anything. `report` refuses rows whose first
  journal `start` precedes the registration commit, or whose manifest hashes differ from the committed ones.
  Amendments are dated at the foot of `PREREG.md`, as `catch-ledger-2026-09-28/PREREG.md` does. An amendment after
  pilot rows exist marks every verdict `exploratory: amended after data`. Main rows from a round the gate did not
  pass print `exploratory: gate not passed`.
- A14. Measures the owner asked for, all deterministic and descriptive except the primary.
  - Per arm: resolved; pass@1 as c/n; pass^3; cost per resolved run.
  - Medians and paired lane medians of wall time, total tokens, turns, tool calls by tool and pulls.
  - Retries and compactions; grader-error, missing and leak-suspect rates; reviewer MUST counts on the reviewed
    subset.
  - Error classes by layer, each with its exposure: per 100 tool calls and per settled run, beside raw counts and the
    outcome mix. A build that dies early cannot look like fewer errors.

  Arm differences in error classes are named "observed error-count difference" (attack 9). The study has no precedent
  arm, so nothing is called "saved by precedent". `precedent-touch` stays marked `proxy, not causal`. Continuous
  measures print no p value.
- A15. Fidelity (attack 8). The report carries the inventory of differences from the historical build: pinned model
  and thinking against the original, sandbox, no remote, no lane watcher, gate and post-edit at start-tip versions,
  restored retry and compaction settings. It also prints, per lane, the historical first build's own usable success
  (A6 grades its end tip with the same manifest) beside the replay control mean. The pilot bar is called feasibility.
  The scope line claims no production transfer.
- A16. Error baseline and audit (attack 9).
  - Baseline: the harness classifier counts each class over the first attempts of every build with a build record,
    per build, with its exposure and the unclassified rate.
  - Audit sheet: `auditSize` raw tool calls, seeded and stratified. It holds classifier-positive calls of each class,
    failed calls the classifier left unclassified, calls with an expected nonzero exit (such as a red test before
    code), and successful calls. No class is shown on the sheet.
  - Labelling: a fresh read-only Claude session labels the sheet, run by the seat. `audit-score` prints per-class
    precision and recall.
  - Reading rule: a class is read in the study only when it has at least `minClassEvents` baseline events, precision
    of at least `minPrecision` and recall of at least `minRecall`. Otherwise it prints `unreliable` or
    `too rare to read`.
  - All of this happens before any replay error count is read. Only counts reach git.
- A17. Sealed values, all registered choices, live in the root `study.json` with a `provenance` object. One seal test
  per value names the row it governs.
  - Model `openai-codex/gpt-6.1-sol`, thinking `medium`.
  - Pilot: 10 lanes, 2 repeats, control only. Main: 10 lanes, 3 repeats, arms control, no-tool-list
    (`dropSections`: skills, tools, docs) and no-lessons (`dropLabel`: lessons). One reviewed repeat per lane and
    arm.
  - Allowance USD 3.23 (p90 of 70 gpt-6.1-sol high builds, build records 2026-11-02); kill limit USD 6 (above the
    recorded maximum, 5.17); reviewer cap USD 1.50; `totalCap` USD 400.
  - α 0.05 one-sided; margin 0.2; harm of interest 0.2; power threshold 0.8; `powerSims` 2000; the τ scenarios.
  - Pilot bar 0.5 and 60%; `minLanes` 8; `regressionFiles` 15 (chosen: a few minutes of grading per run).
  - Draw, schedule, power and audit seeds; strata 5/5.
  - `minClassEvents` 20, `auditSize` 120, `minPrecision` 0.8, `minRecall` 0.7. These are chosen: enough audited calls
    for about ten per class, and the bar the anatomy labeller used for agreement.

  `overshootBound` is derived from the registry, not sealed. Its formula is pinned instead.
- A18. Privacy. Clones, test output, streams, the audit sheet and its answers and rows stay in private folders outside
  any checkout, guarded by `privateFolder`. Committed files hold only lane names, tips, paths, check ids, hashes,
  counts and rule text, all from the public repo. Each generated file passes `node scripts/identity-scan.mjs` before
  commit.

## Open choices

- O1. Module split as forecast. `drop-study.mjs` is a thin CLI with `draw`, `manifest`, `validate`, `register`,
  `gate`, `report`, `budget`, `baseline`, `audit-sheet` and `audit-score`. Each `lib/drop-*.mjs` has one purpose. The
  builder may merge two small modules.
- O2. The `no harm seen` bound. Hoeffding was picked for validity with nothing else assumed. A betting confidence
  sequence (Waudby-Smith and Ramdas 2023) adapts to low variance and would be tighter. Its guarantee for an average
  of varying lane means needs an argument this lane cannot check cheaply, so it is not used. A later study may
  register it with that argument.
- O3. Layout follows the harness (A1). If `run` reads one `study.json` per folder, `register` generates `pilot/` and
  `main/` from the root file, and T7 asserts the committed files equal the output.
- O4. Exact text of rows R-3610 to R-3618, each no wider than its test.

## Questions for the owner

The owner is away until 07:00 EST. The seat decides with an astra consult. Each default is the one this planner
defends.

Question: The valid `no harm seen` test cannot reach 80% power within USD 400 (half-width 0.316 at 10 × 3, against a 0.2 margin); what happens?
Default: run the pilot (about USD 33), let the gate print `treatment: stop`, and bring the owner the priced grid, including a `needed`-only design and the run counts `no harm seen` would need.
What the default gains and misses: the pilot buys replay feasibility, cost per run and control variance, which every later option needs; it misses an earlier answer, since registering `needed` as the only powered decision now could let treatment start right after the pilot.
Cost of a wrong guess: hard to undo; any treatment round spent without a decidable test must be paid again.
If answered otherwise: the gate's decision list in `study.json` and its seal change, and PREREG's power section changes; no other code changes.

Question: What harm counts as "no harm seen", and what harm must `needed` detect?
Default: one size for both, 0.2 usable-success points.
What the default gains and misses: one registered number keeps the two decisions symmetric and the grid finite; it misses a 0.1 harm (one row in ten lost), which a 0.1 margin would catch at about four times the runs.
Cost of a wrong guess: hard to undo; it is fixed before the pilot, and changing it after data makes every verdict exploratory.
If answered otherwise: `margin` and `harmOfInterest` in `study.json` and their seals change.

Question: Should the draw be stratified by first-build slot (5 small, 5 larger)?
Default: yes, 5 and 5, in one seeded order per stratum.
What the default gains and misses: the drawn lanes span both lane sizes, so the 25 small luna lanes cannot decide the result alone; it misses proportional weighting if strata later differ in size.
Cost of a wrong guess: easy to undo before registration; hard after the pilot.
If answered otherwise: the strata quota in `study.json` changes; T1's fixture keeps its shape.

## Feature

Feature: FEAT-045 · Test which builder context changes builds

This lane adds rows R-3610 to R-3618 to FEAT-045 (opened by `builder-drop`) and two artifact lines:
- `A-102 · builder drop study registration · repo file: apps/bench/studies/builder-drop-2026-11-03/ (PREREG.md,
  study.json, pilot/ and main/ study files, manifests/) · manual: the seat runs node apps/bench/drop-study.mjs register
  before the final review round`. Read by: `code: apps/bench/replay.mjs` (`run`), `apps/bench/drop-study.mjs`
  (`gate`, `report`, `budget`).
- `A-103 · builder error-class baseline and audit counts · repo file:
  apps/bench/studies/builder-drop-2026-11-03/baseline.json, with the readable summary in
  docs/reviews/builder-drop-study-2026-11-03/error-baseline.md · manual: the seat runs node apps/bench/drop-study.mjs
  baseline and audit-score`. Read by: `code: apps/bench/drop-study.mjs` (`report` reads which classes are readable and
  compares replay rates with the baseline).

Commands this lane adds (forecast; flags follow the harness):
```
node apps/bench/drop-study.mjs draw        --repo <repo> --contexts <store> --labels <labels> --study <dir>
node apps/bench/drop-study.mjs manifest    --repo <repo> --lane <lane> --out <private>
node apps/bench/drop-study.mjs validate    --repo <repo> --manifest <file> --out <private>
node apps/bench/drop-study.mjs register    --study <dir>
node apps/bench/drop-study.mjs budget      --study <dir> --root <private-root>
node apps/bench/drop-study.mjs gate        --study <dir> --root <private-root>
node apps/bench/drop-study.mjs report      --study <dir> --root <private-root>
node apps/bench/drop-study.mjs baseline    --repo <repo> --sessions <root> --out <file>
node apps/bench/drop-study.mjs audit-sheet --sessions <root> --study <dir> --out <private>
node apps/bench/drop-study.mjs audit-score --sheet <private> --answers <private>
```

## Threat model

In scope, honest variation in our own tools' output:
- build and land records with retries, refused lands, dead pids, torn lines and several briefs per lane;
- briefs naming rows singly, as ranges, or not at all;
- briefs committed after the first build started;
- tests with no marker, stacked markers, duplicate or dynamic titles, `check(...)` calls and review-strengthened
  bodies;
- helpers changed beside tests; tests importing new modules, exports or subcommands;
- grader faults at either tip, and checks that flake, pass at start or fail at land;
- runs that stall, crash before regression checks, hit the ceiling, abort busy, are interrupted, are leak-suspect or
  never start because the cap binds;
- lanes whose repeats all succeed or all fail, and pilots with zero variance;
- provider drift and correlated failures;
- null costs and interrupted reviewer calls;
- a classifier that misses or mislabels events, and a labeller reply that fails its schema.

Out of scope, deliberate forgery: hand-edited records, rows, journals or manifests; tests written to pass at start on
purpose; a builder gaming the replay. A finding outside this model is a residual. Named residuals:
- The gate is procedural: `replay run` does not read `gate`. The seat obeys `treatment: stop`, and `report` marks main
  rows from a failed gate exploratory.
- A harness folder started outside the study root escapes the shared budget. `budget` lists every folder under the
  root, so the seat can check.
- Interface naming by path and word in the frozen brief is textual. A brief that describes a module without naming it
  loses that lane's checks, and the flow counts show this.
- Same-row widening is caught only when review changed the check's body. A check whose body is unchanged but whose
  helper data changed outside the helper rule is not caught.
- Inference is conditional on the drawn lanes; nothing is claimed about unlanded lanes or builds before 2026-10-22.

## Precedent

- `apps/bench/lib/plan.mjs` (`rng`, `shuffle`, `fileSha`, `readJsonl`, `studyFingerprint`): seeded orders for the
  draw, schedule and power simulation, manifest hashes, torn-tail reads of rows. Imported.
- `apps/bench/lib/catch-stats.mjs` (`seededSample`, `cohensKappa`): the seeded audit draw and agreement. Imported.
- `apps/bench/lib/anatomy-measures.mjs` (`drawLabelSample`, `agreementLabels`) and `apps/bench/lib/anatomy-labels.mjs`:
  a blind private sheet, then counts-only agreement. Followed for `audit-sheet` and `audit-score`.
- `packages/nana-pack/lib/memory-replay.mjs` (`signFlip` on exact `{n, d}` BigInt rationals; `decideReplay`'s fixed
  verdict words and `exploratory`/`confirmatory` marks): `signFlip` imported for `needed`; the printing followed.
- `packages/nana-pack/lib/outcome-meter.mjs` (`wilson`): resolved-rate intervals and the Monte Carlo lower bound in
  the gate. Imported.
- `packages/nana-pack/lib/build-records.mjs` (`readBuildLedger`, `buildRecordsPath`) and
  `packages/nana-pack/lib/land-records.mjs` (`readLandLedger`, `landRecordsPath`): candidates and the three tips.
  Imported.
- `templates/typescript/template/tests/requirements-trace.ts` (`scanSource`, `ID`) with `CALL_NAMES` from
  `scripts/requirements-trace.mjs`, imported the way that script imports them: checks to rows, using the repo's real
  call names and ID form.
- `scripts/code-map.mjs` (`--impact`) and `scripts/requirement-rows.mjs` (`candidateRows`): the regression set's
  importing test files and the helper rule, read from the start tip's map. Followed.
- `apps/bench/lib/anatomy-sessions.mjs`: attempt grouping for the baseline. Imported.
- `apps/bench/aggregate.mjs`: a report from recorded rows without re-running. Followed for `report`.
- `apps/bench/studies/catch-ledger-2026-09-28/PREREG.md`: committed before data, with STOP rules and dated amendments.
  Grounding for the registration's sections and amendment rule, not a format to copy.
- `apps/bench/test/anatomy-labels.test.mjs` and `apps/bench/test/integration.test.mjs`: the `test()` wrapper,
  synthetic stores, stub runners and sentinel-privacy checks. Followed in `apps/bench/test/drop-study.test.mjs`.
- none on main yet: `apps/bench/replay.mjs`, `lib/replay-grade.mjs`, `lib/replay-errors.mjs` and
  `lib/replay-journal.mjs` are on `feat/builder-drop`, unbuilt. This lane imports them once landed (A1). It changes
  only `replay-journal.mjs` admission (A12), the one move: admission reads a root instead of one folder.
- none: Holm correction, Hoeffding bound and Beta draws. A search of `apps`, `packages` and `scripts` found none.
  Each is a few lines in `drop-verdict.mjs` or `drop-power.mjs`.

Map searches run: "seeded stratified draw of lanes", "pre-registration committed study verdict", "power simulation
sign flip", "exact paired sign flip test", "validate hidden tests fail to pass on base and pass on landed tip", "req
marker above test call trace", "error class counts over pi sessions", "build record ledger lanes landed", "seal test
pins study value". From the results I took:
- `plan.mjs`;
- `requirements-trace.mjs` and `requirement-rows.mjs`;
- `build-records.mjs` and `land-records.mjs`;
- `anatomy-sessions.mjs`.

`memory-replay.mjs`, `catch-stats.mjs`, `outcome-meter.mjs` and `code-map.mjs --impact` came from my own list. No
search found a power simulation, a fail-to-pass validator, a Holm correction or a concentration bound.

## Outside precedent

SWE-bench (MIT), borrow. Its harness validates each task by running tests before and after the gold patch:
- a test that fails before and passes after is FAIL_TO_PASS;
- a test that passes both times is PASS_TO_PASS, and it includes regression tests outside the changed files;
- a task with no FAIL_TO_PASS test is dropped;
- a task is resolved only when every FAIL_TO_PASS and PASS_TO_PASS test passes.

This lane takes that validation (A6) and the regression requirement (A5, A7). It adds a second land run against
flakes, treats grader faults as their own outcome, and freezes scope to the first brief. It does not adopt the Docker
images.

Other public references:
- Hoeffding (1963), borrow: the margin bound in A9.
- Waudby-Smith and Ramdas (2023), betting confidence sequences, skip for now (O2).
- OSF and AsPredicted pre-registration templates (CC-BY), borrow as a section checklist for `PREREG.md`.
- `simr` (R, GPL-2), skip the code, borrow the method: power by running the real analysis on simulated data.
- The CONSORT non-inferiority extension, borrow: `no harm seen` is a margin bound reported with its interval.
- Chen et al. 2021 (pass@k, human-eval, MIT), τ-bench (pass^k, MIT), Kapoor et al. 2024 (cost per resolved task) and
  SWE-agent (trajectory length, MIT): the measures in A14.

## Must-meet

Nine tests, one row each, in `apps/bench/test/drop-study.test.mjs`. That is one over eight, because the attack split
the spend cap from the registration. They run on synthetic fixtures: git repos with three tips, build and land
records, briefs, tests in the repo's real styles, harness-shaped rows and journals, and a stub `replay grade`. No test
calls a model or spends. All run on macOS, Linux and the Windows CI leg. Fixtures use real-form IDs (`R-901`,
`R-9001`). Seal tests are extra, one per A17 value, each naming the row it governs.

- T1 (R-3610). The draw is seeded, stratified and accounted for. WHEN `draw` reads build and land records, it shall
  form candidates by A2, order each stratum by the seed, take lanes in order until the quota is eligible, and print the
  selection flow with a reason count per step. Proves: the replayed lanes are fixed by rule, and every lane left out
  says why. Pins:
  - the same seed gives the same draw, and another seed changes it;
  - excluded with their reasons: a `build-brief-2.md` first build, a refused-only lane, a lane landed after
    registration, a FEAT-045 lane and a brief absent at the start tip;
  - a lane with no attempt 0 and one with an unlabelled unit are skipped, and the next in order fills the quota;
  - a short stratum prints `draw: stratum short <slot>` and exits nonzero;
  - the flow counts equal the fixture's.
- T2 (R-3611). A manifest grades only what the first build was asked, and keeps regressions. WHEN `manifest` builds a
  lane's manifest, it shall apply A4 and A5. Proves: later review scope cannot enter by matching rows or paths, and
  preserved behaviour is required. Pins:
  - a frozen brief naming `R-901 to R-903` and `R-9007` keeps checks under R-902 and R-9007 and excludes R-9009;
  - a `check(...)` call and an `it(...)` call are both found;
  - stacked markers give one check two rows, each weighted;
  - a dynamic-title test gets a stable id;
  - a check under a named row whose body changed after the first-build end tip is excluded `changed after first
    build`;
  - a test importing a new export from an existing module that the brief does not name is excluded;
  - a test spawning an unnamed new subcommand is excluded, and a named one is kept;
  - a brief edited after the start tip is read in its start-tip form;
  - an unchanged test file importing a changed module within two hops joins the regression set, and the cap holds;
  - a production-imported test helper excludes its checks.
- T3 (R-3612). Validation cannot certify a broken grader. WHEN `validate` grades the three tips, it shall classify
  every check by A6's table. Proves: only a demonstrated task failure at the start and two passes at the land make a
  check fail-to-pass. Pins, with a stub grader, every row of the table at both tips:
  - `fail` then pass, pass, gives `f2p`;
  - `pass` at all three gives `p2p`;
  - `not-run` at start is excluded;
  - `grader-broken` once then `pass` on retry is kept;
  - `grader-broken` twice is excluded;
  - `grader-incompatible` at start is excluded;
  - a missing named export at start gives `f2p`;
  - a land flake is excluded;
  - a file-level land fault makes the manifest `unvalidated`;
  - a manifest with no `f2p` is `invalid`.
- T4 (R-3613). A run's score requires preserved behaviour, and the owner's measures exist per arm. WHEN `report`
  scores rows, it shall apply A7 and print A14's measures with exposure. Proves: breaking or skipping existing
  behaviour scores 0, rows weigh equally, and the agent evals, time, tokens, tool calls and error classes are reported.
  Pins:
  - a run passing every `f2p` but failing an unchanged-file regression scores 0;
  - a crash before the `p2p` checks run scores 0;
  - a row passing 1 of its 4 checks and a row passing its 1 check score `{n: 5n, d: 8n}`;
  - a `grader-broken` run is `missing`, not 0;
  - pass@1, pass^3 and cost per resolved run equal hand-computed values;
  - errors per 100 tool calls print beside raw counts;
  - a sentinel in private fields is absent from the output;
  - the first line is the scope sentence.
- T5 (R-3614). Verdicts are valid and survive missing runs. WHEN `report` decides a kind, it shall reconcile the
  registered schedule, complete each decision adversarially by A8, and apply A9 and A10. Proves: no verdict leans on
  missing or flattering data, and each test holds its error rate where its assumptions hold. Pins:
  - one fixture per verdict;
  - missing runs in both arms, with uniform imputation significant, give the adversarial result instead;
  - a cap-truncated schedule and a wholly missing lane count as adversarial;
  - over 200 seeded random datasets, raising any one lane difference never raises the sign-flip p value;
  - Holm with two kinds: p 0.02 and 0.04 both give `needed`, and p 0.03 and 0.04 give neither;
  - a seeded false-positive check, 2000 datasets per scenario:
    - at the margin boundary (mean harm exactly 0.2) with skewed lane harms and unequal lane variances,
      `no harm seen` is returned at no more than α plus three Monte Carlo standard errors;
    - with no effect, `needed` stays within the same tolerance;
  - fractional differences reach `signFlip` as BigInt rationals.
- T6 (R-3615). Treatment money waits for a realistic power gate. WHEN `gate` reads the pilot rows, it shall check the
  pilot bar and run A11's simulation through the same decision code as `report`. Proves: the study cannot buy
  treatment runs it cannot decide, under realistic pilot uncertainty and dependence. Pins:
  - a pilot below the 0.5 mean prints `treatment: stop` naming `pilot bar`;
  - a zero-variance pilot and an all-success pilot both run, and the all-success lanes vary in the simulated
    controls;
  - a weak-control pilot prints `harm unreachable`;
  - the achieved mean harm printed equals h within the bisection tolerance;
  - a strong-effect fixture prints `go`, and a noisy one prints `stop` with the grid;
  - the same seed gives the same table;
  - on identical synthetic datasets, the gate's simulated decisions equal `report`'s decisions.
- T7 (R-3616). The registration is committed, consistent and earlier than any spend. WHEN `register` or `report`
  runs, it shall check that `PREREG.md`'s registered-values table equals `study.json`, that the generated round files
  equal the committed ones, and that manifest hashes equal the committed files. It shall apply A13's markings.
  Proves: one registration, fixed before data, governs every verdict. Pins:
  - against the real committed study folder, the table, `study.json` and generated files agree;
  - a changed margin refuses with `register: PREREG differs: margin`;
  - an edited manifest refuses naming it;
  - rows older than the registration commit give `register: rows predate registration`;
  - an amendment after pilot rows marks verdicts `exploratory: amended after data`.
- T8 (R-3617). One cap binds every round. WHEN the harness admits a tuple or review under a study root, it shall sum
  every journal under that root and admit only within `admissionCap` (A12). Proves: smoke, pilot, main and reviews in
  separate folders cannot together pass USD 400 beyond one turn's overshoot. Pins:
  - a pilot folder that spent USD 60 leaves the main folder room for only `admissionCap − 60`, and the next tuple past
    it is refused, naming the budget;
  - an interrupted tuple's partial spend and a null-cost run's full allowance count in the sum;
  - a second round started while one runs is refused by the root lock;
  - `overshootBound` equals the registry formula on a fixture model entry;
  - `budget` lists every folder under the root with its spend.
- T9 (R-3618). Error classes are baselined and audited before replay counts are read. WHEN `baseline` reads a
  sessions folder with build records, it shall count classes over first attempts per build through the imported
  classifier, with exposure and the unclassified rate. WHEN `audit-sheet` and `audit-score` run, they shall draw A16's
  stratified raw-call sheet without classes and print per-class precision and recall and the reading rule's result.
  Proves: error types are measured the same way in past builds and in replays, with known accuracy, including misses.
  Pins:
  - exact counts on a fixture with two builds, one with two attempts, where attempt 2 is not counted;
  - the sheet holds successful, expected-nonzero and unclassified calls, with no class name or sentinel text;
  - the same seed gives the same sheet;
  - an answers file with a missing id is refused whole;
  - hand-made answers give exact precision and recall;
  - a class below `minRecall` prints `unreliable`;
  - the committed `baseline.json` holds only counts, class names and build counts.

Expected changes outside the new files (a forecast, not a limit):
- `REQUIREMENTS.md`: R-3610 to R-3618 under FEAT-045; A-102 and A-103 with Made by and Read by lines; CAP-08's
  deliverables.
- `apps/bench/lib/replay-journal.mjs`: root-wide admission (A12). The harness's own spend tests must stay green.
- `apps/bench/README.md`: a "Builder drop study" section naming the subcommands, the registration rule, the gate,
  the shared budget and its overshoot bound, and how to test, plus the Layout block. Every command it names must run.
- `docs/code-map.md` and `docs/requirements-tree.md`, regenerated.
- `docs/sessions/2026-10.md`: one entry, newest first, as the repo files November entries today.

Grep tests and checkers for the bench README's Layout block and the CAP-08 deliverables lines before editing them.
`scripts/test.mjs` skips `apps/bench/studies/`, so committed manifests are never collected as tests. The only
existing tests expected to change are harness spend tests, if root admission changes a message.

## Seat steps before the final round (free; counts only; identity scan before each commit)

1. Merge main after `builder-drop` lands. Confirm the builder's A1 interface report.
2. Run `drop-study draw`, `manifest` and `validate` on the real repo with private clones, then `register`. Commit
   `study.json`, the round files, `manifests/` and the generated sections of `PREREG.md`. Spot-audit one manifest
   per stratum by hand (A4). Validation runs the drawn lanes' tests at four grades per lane, plus retries, and waits
   under the busy rule. The seat starts no build meanwhile.
3. Run `drop-study baseline` over `~/.pi/agent/sessions` into `baseline.json` and `error-baseline.md`. Then run
   `audit-sheet`, one fresh read-only Claude labeller on the private sheet, and `audit-score`. Counts go in the lane
   folder.
4. Run `review-ledger keep`, then the final review on the exact tip.

## After the land (seat)

1. Smoke run under the study root. Restate the cost from its measured spend.
2. Pilot: `replay run --study .../pilot --out <root>/pilot --go`, 20 runs, about USD 33.
3. Run `drop-study gate`. On `stop`, which A9's bound makes likely, report YOUR CALL to the owner with the priced
   grid. On `go`, run the main round under the same root.
4. Run `drop-study report` after the rounds. The results write-up is its own lane, since nothing is written after a
   land.

## Disposition of the attack (plan-attack.md)

- 1 MUST (missing outcomes): taken. Rows are reconciled against every registered tuple, including cap-truncated and
  wholly missing lanes. Each decision is computed on its own adversarial completion (missing control 0 and treatment
  1 for `needed`; the reverse for `no harm seen`). Monotonicity makes that completion the worst admissible one, and
  T5 tests the property (A8).
- 2 MUST (first-brief scope): taken. The brief and plan are frozen at the start tip. A check is kept only when its
  body is unchanged since the first-build end tip. The interface includes exports and CLI subcommands, and each check
  records its justification line. T2 has same-row and same-path counterexamples (A4).
- 3 MUST (broken grader): taken. A6 has a full outcome table with one retry. Only `fail` at the start is a task
  failure, and a missing named module or export counts as `fail`. `not-run`, `grader-broken` and
  `grader-incompatible` at the start exclude the check. T3 pins every outcome at both tips.
- 4 MUST (preserved behaviour): taken. A registered regression set comes from unchanged test files by map impact. A
  required `p2p` that fails or does not run scores 0. Grader faults are `missing` and handled by A8 (A5, A7, T4).
- 5 MUST (valid inference): taken. `needed` keeps the sign-flip test, justified under the within-lane sharp null with
  interleaved arms (A1, A9). The margin test moves to a Hoeffding bound that needs only independence and bounds. T5
  checks false-positive rates at the margin with skewed effects and unequal variances. The revision-1 noisy-control
  step is removed. A consequence is stated plainly in Purpose: `no harm seen` cannot reach 80% power within the cap.
- 6 MUST (power realism): taken. The simulation uses Jeffreys Beta lane levels, lane resampling, shared block shocks
  over three τ scenarios and proportional harm calibrated by bisection to the achieved mean. It prints
  `harm unreachable` when a target cannot be reached and decides both kinds jointly through Holm. The gate passes on
  the Wilson lower bound in every scenario, and T6 has zero-variance and all-success fixtures (A11).
- 7 MUST (one cap): taken. One private study root holds every round. Harness admission sums all journals under it,
  and a root lock allows one round at a time. `overshootBound` comes from the model registry's worst single turn
  (about USD 1.82 for the builder), so USD 400 is a hard cap up to that stated bound (A12, T8).
- 8 SHOULD (fidelity): taken. A15 restores the inventory and grades the historical first build with the same
  manifest beside the replay control. The pilot bar is renamed feasibility, and the scope line drops any production
  claim.
- 9 SHOULD (error audit): taken. The audit samples raw calls, including successes, expected nonzero results and
  unclassified events. It reports precision and recall, with a reading rule per class. Differences are called
  "observed error-count difference", and every count carries its exposure (A14, A16, T9).
- 10 SHOULD (trace contract and machinery pins): taken. Fixtures use real-form IDs, the repo's `CALL_NAMES` including
  `check`, stacked markers, multi-row checks and dynamic titles. T6 now asserts that the gate and `report` decide
  identically on the same data instead of counting calls. Seals cover only registered choices (A17); the derived
  overshoot bound is pinned by formula, not sealed.
- Seat note (session file): the forecast now names `docs/sessions/2026-10.md` everywhere, as the repo does today.

## Owner questions — decided by the seat (2026-11-03)

The owner, away until 07:00 EST, said: "make your best judgment and then consult with pi Astra when you need me". The first-round question is the one astra already answered for the harness lane (`owner-consult-astra.md` in `docs/reviews/builder-drop-2026-11-02/` on feat/builder-drop): pilot first, register an 80% power threshold, and stop before treatment spend when the gate fails. This plan's defaults follow that answer: the pilot runs (about USD 33), the gate is expected to stop it, and the seat brings the owner a priced grid. The other defaults stand. The owner can reverse any of this at 07:00, before the pilot spends.
