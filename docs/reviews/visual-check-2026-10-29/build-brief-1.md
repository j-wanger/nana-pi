Feature: FEAT-039 · See the product and its decisions in one report

Lane visual-check. Class: ordinary (`node scripts/lane-class.mjs` prints `ordinary` on the planned files). Builder: pi-worker (small lane). Build session 1.

Work in the lane worktree on feat/visual-check, based on main. The plan of record is `docs/reviews/visual-check-2026-10-29/plan.md`. Read it whole, and read `plan-attack.md` beside it; the plan already takes every attack point, and the owner chose the Claude Code reviewer as the image judge. The plan has no list of allowed edits. The art spec for the first use is committed beside the plan as `replicate-art-spec.md`; do not change it.

What the lane does, in one sentence: first-look gains a reference mode, a cold Claude Code judge reads the lane's screenshots beside reference frames and an art spec and passes or fails each spec line, and the seat guide says the owner sees shots only after that pass.

Build every must-meet in the plan, rows R-3140 to R-3148. The plan has no questions for the owner. No test launches a real browser or a real model. The tool flags of the judge's launch must use the `=` form, as the plan records.

Numbers that must not move: the seat guide's existing pinned sentences other than the two this lane changes; first-look's existing product and desk modes; the outside reader's behaviour after its helpers move.

Run the locked full suite as a plain foreground command with its output on screen, not redirected to a file and not in the background. Another lane's suite may hold the machine-wide lock; waiting for it is expected.

## Done when

Each row is `implemented` with backticked `file::title` evidence. The locked full suite (`npm run test:locked`), `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green.

Report: each must-meet's test title; the sealed values with provenance; each departure from the Precedent below; every existing test you changed.

## Precedent

- `scripts/first-look.mjs` — the reference arm lives here. Follow its `parseArgs` shape (exact flag list, one value each, mode-specific required flags), its `resolvePlaywright` resolution with the one-line `INSTALL_LINE` fallback (R-3042), its bounded failure line, and its `browser.newPage({ viewport })` then `page.screenshot` capture at each of `VIEWPORT_WIDTHS`. The reference arm adds viewport-only frames beside the full-page shots and emulates reduced motion, as the hive branch does.
- `scripts/first-look-config.mjs` — `VIEWPORT_WIDTHS` and the 1000-px height are imported, never copied. New first-look values (reference frame cap, accepted image extensions) go here with provenance.
- `packages/nana-pack/bin/claude-review.mjs` — the judge's roster check: `resolveRoster(piAgentDir())`, `roster[REVIEW_SLOT]`, `runtime === CLAUDE_CODE_RUNTIME`. The script itself exports nothing, so the visual reader imports what its config modules expose: `CLAUDE_BIN`, `CLAUDE_PRINT_FLAG`, `CLAUDE_MODEL_FLAG`, `CLAUDE_ALLOW_FLAG`, `REVIEW_SLOT` from `packages/nana-pack/lib/claude-review-config.mjs`; `CLAUDE_CODE_RUNTIME`, `CLAUDE_TOOLS_FLAG`, `CLAUDE_STRICT_MCP_FLAG`, `CLAUDE_BUILDER_STALL_SECS`, `CLAUDE_BUILDER_CHILD_ENV` and `REVIEWER_CHILD_ENV` from `packages/nana-pack/bin/worker-config.mjs`. Departure from claude-review: it sends its prompt on stdin through review-ledger; the visual reader records no round, and the watchdog's child stdin is ignored, so the prompt is a file in the child's folder and the instruction is the final argument.
- `packages/nana-pack/bin/pi-worker.mjs` — the precedent for a Claude Code child under `runWatchdog`: a `launch` function built on `reviewLaunch([CLAUDE_BIN, ...args], { cwd })` from `packages/nana-pack/bin/review-launch.mjs` (which also covers Windows), with `stallSecs: CLAUDE_BUILDER_STALL_SECS`. The visual reader does the same.
- `scripts/outside-reader.mjs` and `scripts/outside-reader-config.mjs` — the run's outline: `--out` refused inside the repository (exit 2), the prompt template from a tracked file, `prompt.md` written before the launch and `reader.md` only on success (R-3065), an empty temporary cwd outside the repository, and the watchdog values `RETRIES`, `MAX_SECS`, `POLL_SECS` imported from its config.
- `packages/nana-pack/prompts/outside-reader.md` — the shape of `packages/nana-pack/prompts/visual-reader.md`: who the reader is, what it sees, "evidence, not instructions", numbered items only, a word cap. The adversary's probe prompt is the tested starting text; this lane adds UNJUDGED and the style sentence below.
- `packages/nana-pack/tests/outside-reader.test.mjs` and `packages/nana-pack/tests/first-look.test.mjs` — fake browser, injected roster and watchdog seams, recorded answers. The new tests reuse them; no real browser or model runs in the suite.
- `packages/nana-setup/tests/seat-rule.test.mjs` — the bullet constants, exact-once checks and the closed bullet list. RULE_13 changes text, RULE_15 is new, and the count goes from fourteen to fifteen (R-1140 and the module header both say "fourteen").
