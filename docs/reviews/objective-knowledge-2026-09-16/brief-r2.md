# Review brief — objective injection + knowledge pull, ROUND 2 of max 3 (verification of the round-1 folds)

You reviewed round 1: read `/Users/jwang/nana-pi/docs/reviews/objective-knowledge-2026-09-16/sol-r1.md` first (your findings A–H, VERDICT: BLOCK), then the round-1 brief `brief-r1.md` for the context. Read-only. Adversarial.

## What was folded (commits on nana-pi main: `fb52d71` nana-pack, `cc8642e` nana-knowledge; nana-agent-loop working tree for F)

- A: `packages/nana-pack/extensions/nana-objective.ts` — relative `objective.path` resolves against `~/.pi/agent/`, never cwd; `~` expands to home; absolute unchanged.
- B: `packages/nana-knowledge/bin/nana-knowledge.ts` — a 1500 ms `setTimeout(process.exit(0)).unref()` deadline armed BEFORE stdin is read; stdin capped at 256 KB; prompt sliced to 8 KB before tokenizing (`lib/hook.ts`); no-op `error` listener + `unref()` on the detached build spawn. NO worker/child architecture, by the owner's decision: synchronous SQLite work measured ~8 ms, the harness hook timeout is the outer bound for a synchronous stall. Judge whether that decision is sound, not whether a worker would be stronger.
- C: `packages/nana-knowledge/lib/build.ts` — atomic `openSync(..., "wx")` lock in every build path, pid-owner-only release, stale > 10 min reclaimed once; the hook just spawns and the builder fails fast on EEXIST. Temp-db swap deliberately skipped (WAL snapshots; comment at `build()`).
- D: `lib/hook.ts` — header now frames the block as untrusted DATA, never instructions; 2000-char cap after formatting.
- E: `nana-objective.ts` — `OBJECTIVE UNAVAILABLE: <cause> (<path>). Tell the user before spending.` injected for missing/empty/unreadable/in-workspace-symlink; truncation injects the capped text plus a `(truncated at 4000 chars)` line and journals `objective_pickup {truncated:true}` (the worker argued truncated ≠ unavailable — judge that); cached block cleared before the enabled check.
- F: `/Users/jwang/nana-agent-loop/app/scripts/review-round.mjs` (new, pure) + `pi-review.mjs` — round parsed from the basename for both `rN` and `round-N` conventions; ALL wrapper options (`--out`, knobs, `--over-cap`) parsed only from argv before `--`; tests `/Users/jwang/nana-agent-loop/app/tests/review-round.test.ts` on real corpus names.
- G: REJECTED by the owner — `pull.log` stays (it is the instrument that answers "is pulled knowledge ever used"; local-only under ~/.pi/agent). Do not re-raise unless you see a NEW harm.
- H: new tests — hung-stdin end-to-end (exit 0, empty output, measured 1570 ms, bound 1800 ms), malformed stdin, concurrent `wx` lock (exactly one winner), stale-lock reclaim, corpus-name round tests.
- Owner's folds: SKIP_DIRS += `raw`, `reviews`; STALE_MS 1 h; hook skips harness-notification prompts (`<system-reminder>`, `[SYSTEM NOTIFICATION`, `<task-notification>`).

## Files to read
`packages/nana-pack/extensions/nana-objective.ts`, `packages/nana-pack/lib/config.ts`, `packages/nana-pack/tests/objective-injection.test.mjs`, `packages/nana-knowledge/bin/nana-knowledge.ts`, `packages/nana-knowledge/lib/{hook,build,tokenize,query,parse,sources,paths,db}.ts`, `packages/nana-knowledge/tests/*.test.mjs`, `packages/nana-knowledge/README.md`, and in nana-agent-loop: `app/scripts/review-round.mjs`, `app/scripts/pi-review.mjs`, `app/tests/review-round.test.ts`.

## Output
Per round-1 finding A–H: CLOSED / STILL OPEN (with file:line and the concrete failure) / REGRESSED (a new defect introduced by the fold — these matter most). Then any NEW finding with severity. End with `VERDICT: LAND` or `VERDICT: BLOCK` and one line. Round 3 is the last round available; anything you leave for round 3 must be BLOCK-grade.
