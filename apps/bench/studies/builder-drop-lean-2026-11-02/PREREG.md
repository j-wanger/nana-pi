# Pre-registration: builder-drop lean pilot, tool-list arm (2026-11-02)

Written and committed before any paid run. Counts only; no prompt, test or reply text lives here.

## Question

When a builder's first build is replayed with the tool-list listing removed from its system prompt, does it pass
visibly fewer of the landed lane's fail-to-pass checks than the same replay with full context?

The control is a re-run inside the replay harness, not the original build. Results apply only to these five lanes,
replayed in this harness with this model.

## Arms

- `control`: the recorded first-attempt context, rendered by `replay.mjs` with its declared substitutions.
- `no-tool-list`: `dropSections: ["tools", "skills", "docs"]`. The harness removes those three system-prompt
  sections whole: the pi tool listing, the skills listing and the pi docs pointer (about 22,000 characters per lane).
  Callable tool schemas are not removed (README, "Section cuts remove listings, not callable tool schemas").
  The recorded added-tools block is not rendered into the prompt in either arm.

The lessons arm was planned first. It cannot run without a harness change: `dropLabel` needs a model label on every
unit, and the labeller skips units over 3,000 characters, which every stored context has (the skills listing).

## Lanes

First builds of landed lanes, from the anatomy context store, whose first build committed work and whose landed test
files give at least 5 fail-to-pass checks. Candidates were probed in order of size; posting-rule (1 check),
first-look (2) and page-on-pages (2) were dropped; issue-watch was valid but not needed.

| Lane | Fail-to-pass | Pass-to-pass |
|---|---|---|
| component-audit | 6 | 0 |
| visual-check | 12 | 14 |
| page-needs-you | 83 | 11 |
| keep-movement | 8 | 172 |
| memory-shaper | 15 | 94 |

Manifest rule: overlay = the lane's own (first-parent, non-merge) changed test files at the land tip. A check is
fail-to-pass when it passes on two land-tip runs, is declared by the first build's end tip, and is `fail` (not
`not-run`) at the start tip. It is pass-to-pass when it passes at start and on both land runs. Every manifest was
checked with `replay.mjs grade`: start tip all fail-to-pass `fail`, land tip all `pass`, status `graded`.
Manifests and overlays stay private, outside git; `study.json` points at them by relative path.

## Design

- Model: openai-codex `gpt-6.1-sol`, thinking medium (the roster's builder); pi 1.4.0.
- 5 lanes x 2 arms x 2 repeats = 20 runs, plus one smoke run. Order: the harness's seeded schedule (seed 20261102).
- Allowance and kill limit USD 6 per run; hard cap USD 45 for everything in the output folder.
- No review step.

## Measures

Primary: fail-to-pass checks passed per run. Recorded alongside: pass-to-pass checks passed, build wall time,
tokens, cost, tool calls, turns, retries, compactions, outcome and the harness's error classes.

## Reading rule (fixed now)

Per lane and arm, the lane score is the mean fail-to-pass checks passed over that arm's graded runs. An arm's total
is the sum of its lane scores. A lane is "worse" when the drop arm's lane score is strictly below control's.

- "The tool list matters" if the drop arm's total is at least 2 below control's AND the drop arm is worse in at least
  3 of the 5 lanes.
- "No visible effect" otherwise.

Graded runs include builds that stalled, hit the ceiling or the kill limit; they score what they passed. Runs that are
`grader-broken`, `grader-incompatible`, `leak-suspect`, `harness: prompt-mismatch`, `aborted: busy`, `interrupted`
or never started are excluded from means and listed. If a lane has no graded run in either arm, the verdict is
"undecided" rather than either reading.

## Limits

Five lanes with two repeats cannot detect small effects; "no visible effect" is not "no effect". page-needs-you
holds 83 of the 124 fail-to-pass checks, so the summed total leans on it; the 3-of-5 lane count guards against
that one lane deciding alone. No inferential test is run.
