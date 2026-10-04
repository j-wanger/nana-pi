# pi 1.0 adoption — roles (declared 2026-10-04)

Jake, at session start: "use sonnet as worker, astra for reviewer, and fable for landing/architecture".

| Role | Who | How it runs |
|---|---|---|
| Seat | Opus 5.5 (this Claude Code session) | briefs, verifies claims mechanically, integrates, commits, reports |
| Workers (audit, diagnosis, research, build) | Sonnet | Claude Code `Agent` subagents, `model: "sonnet"` |
| Reviewer | gpt-6-astra | `pi-review --item <slug> --role review --model gpt-6-astra …`, cap 3 rounds per item |
| Architecture + landing rulings | Fable | Claude Code `Agent` subagent, `model: "fable"`, read-only |

Lanes: (A) pi 0.87.1 → 1.0.2 compatibility + adoption · (C) subagents: several at once, main agent stays free · (R) Karpathy on X, recent.
