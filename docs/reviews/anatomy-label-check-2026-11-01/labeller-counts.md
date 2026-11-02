# Builder-context labels — counts (2026-11-01)

Store: the builder-anatomy private store (11,019 distinct units). Labels: `claude-opus-5-5`, medium effort, prompt SHA-256 `422f2aa3…aad52`, labels SHA-256 `4f7dceec…158797`. Counts only; no unit text or key leaves the private folders. Labeller A's subagent transcripts persist under `~/.claude/projects`, outside git.

## Runs

- Canary (Part 1 runner, Sonnet): 3 labels, 0 unclassified, `~/.claude/projects` file count unchanged, USD 0.008. Opus canary: 3 labels, 0 unclassified, USD 0.015.
- Sonnet low-effort run: 11,019 of 11,019 labelled after one resume at the per-run cap; USD 11.56.
- Opus medium-effort run (owner, 2026-11-01): 11,019 of 11,019 labelled, 0 unclassified, 0 unsent, 276 calls, USD 16.50, plus an aborted first start of a few dollars.

## Step 3 — fixed check set (builder-anatomy sheet 2, 146 non-oversize units, 4 oversize left out)

| Labels | model:a κ | model:b κ | model:consensus κ (n 128) | Bars (consensus ≥ 0.6, b ≥ 0.7) |
|---|---|---|---|---|
| Sonnet, low | 0.56 | 0.54 | 0.60 | fail |
| Opus, medium | 0.73 | 0.73 | 0.79 | pass |

On this sheet labeller A was Sonnet and B the roster's land model through pi; A and B agree at κ 0.86.

## Steps 4 and 5 — Opus labels

Labeller A on the new sheets was a Claude Code subagent on Sonnet, not Opus, because Opus became the label model (departure from Part 1's A1). Labeller B: the roster's land model through pi, ten units a call.

- Heavy sheet (278 keys with at least 60 occurrences): model:a κ 0.60, model:b 0.63, model:consensus 0.71 (n 219); A and B agree at κ 0.74. Weighted agreement, occurrences / occurrences × chars: model:consensus 0.80 / 0.79, model:b 0.75 / 0.73. Bar 0.85: **fail**.
- Rare sheet: 287 units drawn over ids by seed `anatomy-labeller-2026-11-01`; pooled with sheet 2 into 381 distinct keys (15 overlap).

## Step 6 — bars and the owner's ruling

The weighted bar fails, so under the plan no share is a finding. The owner ruled on 2026-11-01: count shares only for the functions that pass every per-function bar with a reliable count, each with its disputed heavy weight beside it; the other six are not yet measurable.

| Function | Pooled keys | model:consensus κ | model:b κ | Mark |
|---|---|---|---|---|
| constraints | 64 | 0.88 | 0.75 | reliable — finding |
| precedent | 37 | 0.87 | 0.70 | reliable — finding |
| lessons | 57 | 0.82 | 0.74 | reliable — finding |
| output contract | 55 | 0.93 | 0.81 | reliable — finding |
| method | 91 | 0.71 | 0.67 | not measurable (b) |
| task | 70 | 0.66 | 0.59 | not measurable (b) |
| knowledge | 65 | 0.68 | 0.56 | not measurable (b) |
| feedback | 35 | 0.67 | 0.66 | not measurable (b) |
| tools | 26 | 0.58 | 0.58 | indicative count; fails |
| purpose | 25 | 0.51 | 0.55 | indicative count; fails |

## Step 7 — shares (Opus labels, whole store)

Findings, per occurrence (what builders received) and per distinct text (what varies), units / chars, with the heavy-sheet occurrences where Opus and labeller B disagree, and where A and B disagree:

| Function | Occurrence units % | Occurrence chars % | Distinct units % | Distinct chars % | Disputed occurrences, model vs B / A vs B |
|---|---|---|---|---|---|
| constraints | 13.07 | 17.61 | 11.13 | 10.20 | 11,092 / 7,383 |
| lessons | 6.57 | 10.31 | 10.47 | 9.11 | 2,198 / 156 |
| output contract | 5.20 | 2.97 | 5.71 | 4.46 | 5,284 / 3,922 |
| precedent | 0.63 | 0.74 | 6.64 | 3.70 | 144 / 177 |

`unsorted` holds 5.32% of occurrences; `unlabelled` 0. The other six functions' shares stay in the private report and are not findings.

Read: builders receive constraints far more often than any finding function, precedent text is varied but rarely repeated, and output contracts are short.
