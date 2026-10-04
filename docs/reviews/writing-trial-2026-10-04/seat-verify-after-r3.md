# Seat verification after astra r3 (the cap) — 2026-10-04

astra r3 was BLOCK 8/10 on three items. The worker fixed them in `eae2f76`. There is no fourth round. The seat re-ran astra's own probes against `eae2f76`:

| astra r3 item | Probe | Result |
|---|---|---|
| MUST 1 UTF-8 tail | `buildBlock()` on 4003 ASCII + € + text; 4002 ASCII + 😀 + text; 4003 ASCII + 0xff + text; 0xff inside the window | 4000-char block, no U+FFFD · 4000-char block, no U+FFFD · REFUSED "not valid UTF-8" · REFUSED "not valid UTF-8" |
| r2 MUST 1 resources (regression) | 64 MiB rule under `--max-old-space-size=32`; FIFO with an 8 s alarm | 4000-char block, exit 0 · refused at once, "not a regular file (a FIFO)", exit 0 |
| MUST 2 base prompt | read `writing-injection.test.mjs:317–376` | A distinctive sentinel base, the objective and the writing block are each asserted once, in order, through the real pi 1.0.2 runner (`emitBeforeAgentStart`). The worker reports that astra's "BASE" mutation turns both stub and real tests red. |
| MUST 3 rows | `shall` count per branch row | R-742 to R-755, R-301 and R-376: one `shall` each, all `implemented`. The read ceiling moved to R-755. |

The worktree's `npm test` reads 90 PASS and 1 FAIL. The failure is `readme-check.test.mjs`, from the known worktree-only gap (no root node_modules, no apps/bench/.ext). It passes on main.
