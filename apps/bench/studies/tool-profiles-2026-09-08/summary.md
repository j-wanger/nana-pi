# tool-profiles-2026-09-08 — summary

Runs recorded: **1**. Generated 2026-09-09T04:07:08.289Z.

**Success** = the deterministic checker passed AND pi exited 0 AND the stream reached `agent_settled` with no dangling tool calls.
**Denominator** = decided runs only: grader errors, harness errors and blocked runs are reported but never counted as model failures.
**Spend** = the run's own tokens PLUS any nested LLM tokens an extension reported. No run was ever retried.

## ⚠ Integrity

- **131 scheduled tuple(s) missing** (study incomplete): code-bugfix|lean-code|0, code-bugfix|research|0, code-bugfix|pi-defaults|0, code-bugfix|lean-code-hinted|0, code-guard|lean-code-hinted|0, code-guard|pi-defaults|0, code-guard|lean-code|0, code-guard|research|0 …

## Family `code` — 1 shared task(s)

| profile | success | median of task medians | total of task medians | wall median (s) | cold/warm | retries | nested unknown | tool mix |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| pi-defaults | 1/1 (100%) | 5292 | 5292 | 7.84 | 1/0 | 0 | 0 | bash:1 |

Per-task successes (the decision rule reads these):

| profile | code-define-small |
|---|---:|
| pi-defaults | 1/1 |

## Per task × profile

| family | task | profile | n | states | success | spend median | IQR | spend/success | own | nested | wall (s) | turns | cacheRead med | tool mix |
|---|---|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| code | code-define-small | pi-defaults | 1 | ok:1 | 1/1 | 5292 | 0 | 5292 | 5292 | 0 | 7.84 | 2 | 0 | bash:1 |

Apply the decision rule in `DESIGN.md` to these numbers; this file computes them and stops there.

