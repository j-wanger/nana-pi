# Lane brief template + reviewer role catalog (DRAFT 2026-09-28)

*Answer to Jake's 2026-09-28 pushback: lanes drift and overbuild because they have a goal and a done-check but no SIZE, and reviewers are assigned by model, not by what they are told to look for. A lane is a sprint-shaped unit: short, scoped, budget-capped, with roles chosen from the lane's objective. First use: tranche-1 lane L1. Status: draft until it has run three lanes and the role tags have been read.*

## 1. Lane brief (every headless worker gets exactly this shape)

```
# Lane <id> — <one-line goal>            (date · repo · branch/worktree)

## Goal            what is TRUE when the lane is done (outcome, not design)
## Appetite        --max-budget-usd N · advisory ceiling: ≤F files / ≤L LOC changed
                   If the contract needs more than the appetite: STOP, commit what is
                   green, report what it would take. Never expand the scope to fit.
## doneWhen        the exact command(s) that must pass, run from <dir>
## NOT             explicit out-of-scope list (the things a capable worker would be
                   tempted to also fix) — touching one is a scope defect, not initiative
## Allowlist       files the lane may edit · files it must not touch
## Constraints     host/platform facts that shape the design (from the arch contract)
## Roles           builder: <model> · reviewers: <role: model, dimensions> · land: <role: model>
## Rules           foreground only; kill only own PIDs; commit on branch, no push;
                   smallest change that passes; a `/goal` line when the trial is on
## Report          ≤40 lines: commits · doneWhen output · before/after for each fix ·
                   residuals · scope check ("I touched nothing outside the allowlist;
                   diff --stat attached") · the one claim most likely wrong · VERDICT: DONE
```

## 2. Reviewer role catalog (assign by objective and blast radius, not by habit)

| Role | Asks | Dimensions it owns | Typical model |
|---|---|---|---|
| **scope** | Did the lane stay inside the contract? | allowlist respected · NOT-list untouched · smallest-change (could a smaller diff pass doneWhen?) · appetite honored · any new mechanism faces the subtraction test | sol (cheap, every lane) |
| **adversarial** | Can I break it? | executed probes, not reasoning · negative cases · concurrency / interrupt / malformed input · gate-survives-after mutation for permission surfaces · tests assert invariants not implementation | sol or astra by blast radius |
| **feel** | Does it work for the person? | screenshot walk / play-through for surfaces; the reviewer's first two complaints are Jake's first two complaints; evidence-grade check for research | Opus (different lineage from the builder is not required here) |
| **domain expert** (Jake 2026-09-28) | Is it RIGHT for the domain? | **grounded, never parametric**: the brief carries the corpus to judge against and the reviewer cites it — AML: FINTRAC STR frame, the red-flag grammar, the aml-wiki articles that apply; games: the-hive DESIGN docs + persona rows, "in the game's own words"; UX: the nana design system (Claude Design) tokens, the desk Contract notes, general UX heuristics. Where the corpus has no answer the reviewer says so; the gap goes to the wiki. Placement: at the CONTRACT (before build) and at FEEL (the artifact a human consumes: the case report, a played battle, the screenshot walk) — not at slice code review | Opus 5.5 or astra + persona + corpus |
| **compatibility** | What else speaks the old contract? | documented features broken (name them + replacement contract) · other callers · win32 · upgrade coupling · README/contract notes updated where the consumer reads them | sol |
| **land ruler** | Should this merge, and what does it change upstream? | integration on the merged tree · contract amendments declared · residuals priced by cost-of-error · which review claims were verified by the seat | astra (contract/permission surfaces) or Opus 5.5 (ordinary) |

Rules that come with the catalog:
- A reviewer **reports, never edits the artifact**; it may suggest a repair. The builder (or a fold worker) applies it.
- Every accepted finding is tagged `[role]` in the adjudication file. After five lanes the seat reads which roles caught unique classes and prunes the rest (the instrument Jake asked for; sol B5 in the 09-27 review).
- Evidence labels on findings — **executed / cited / concern** — require adjudication; they never auto-permit or forbid a BLOCK (astra r1 D4).
- Three rounds per item, all roles included; the seat rules after r3.

## 3. Role assignment by lane type (defaults; override in the brief)

| Lane type | Reviewers | Land |
|---|---|---|
| Permission / lifecycle / context injection (gate, config, handoff, hooks) | scope + adversarial (executed probes) + compatibility | astra |
| Tooling / runner / scripts | scope + adversarial | Opus 5.5 |
| User-facing surface | scope + feel (screenshot walk BEFORE hardening) + **UX domain expert** on the contract and the walk | Opus 5.5; Jake's feel verdict gates hardening |
| Product contract (aml-desk, the-hive, …) | **domain expert** (AML / game design, grounded) + scope | astra |
| Research / docs | scope + feel (evidence-grade, refuted ledger) + domain expert where a wiki exists | astra for contracts, else none |
| Upgrade (dependency bump) | compatibility + adversarial | Opus 5.5 |

## 4. What this replaces

The generic review brief ("correctness, tests, cross-platform, VERDICT") used through 09-28. Its dimensions survive inside the roles; what changes is that **scope** is a first-class dimension everywhere and the set is derived from the lane.
