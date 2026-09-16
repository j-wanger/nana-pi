# Review brief — pi-side knowledge pull (round 2 of max 3)

You are an independent code reviewer. Read-only. This round verifies the fold of your round-1 findings (`sol-r1.md` in this directory — read it first) and looks for anything the fold broke. Same change, still uncommitted in `/Users/jwang/nana-pi` (`git diff` + untracked `packages/nana-knowledge/extensions/`, `tests/extension.test.mjs`).

## What was folded

- **A/BLOCK + F/HIGH** — `makePull` now arms a parent-side timer that resolves `null` at the deadline and then best-effort kills the child (SIGKILL); execFile's own `timeout` is kept with `killSignal: "SIGKILL"`. New test: a child that traps SIGTERM and blocks forever; the pull resolves near the deadline and the pid is dead shortly after.
- **A/MEDIUM** — the child runs on `process.execPath` only when its basename starts with `node`; otherwise the bare `"node"` from PATH (ENOENT → fail-open).
- **D/LOW** — the `prompt === ""` guard is gone; only the non-string guard remains.
- **C/MEDIUM + G/HIGH** — README: the bound is stated as "stops waiting after ~2 s, kill is best-effort"; a new bullet states the accumulation trade-off (one persistent ≤ 2000-char user-role message per fresh pull; compaction summarizes/drops; dedup means never re-pulled; no reinjection). Header comment updated to match.

## Dimensions

1. **Deadline is real.** Trace every path after the parent timer fires: can `resolve` be called twice, can the execFile callback run after `done(null)` and do anything harmful, is the timer cleared on the happy path so pi's loop does not hold an unref'd handle count, does `child.kill` throwing get swallowed, and does the new test actually prove the bound (a child that accepts SIGTERM would pass a weaker test — confirm it traps it).
2. **Runtime choice.** Is the `node`-basename check correct for `node`, `node.exe`, `nodejs`, versioned names (`node22`)? Does falling to PATH `"node"` fail open when absent on every platform (`execFile` ENOENT arrives in the callback, not as a throw)?
3. **Regression scan.** Anything the fold changed beyond the five items; `hook.test.mjs` and the pack suite untouched.
4. **Docs honesty.** README and header comment now say only what the code does.
5. **Residuals from r1 you still hold** (bun, overlap, maxBuffer, compaction): state each as CLOSED / RESIDUAL (one line) — do not reopen a residual as a BLOCK unless the fold made it worse.

## Files to read

- `/Users/jwang/nana-pi/packages/nana-knowledge/extensions/nana-knowledge.ts`
- `/Users/jwang/nana-pi/packages/nana-knowledge/tests/extension.test.mjs`
- `/Users/jwang/nana-pi/packages/nana-knowledge/README.md` (the pi section)
- `/Users/jwang/nana-pi/packages/nana-knowledge/lib/hook.ts`, `lib/tokenize.ts` (unchanged since r1 — confirm)

## Output

Per dimension: PASS or FINDING (severity BLOCK / HIGH / MEDIUM / LOW, file:line, failure scenario, smallest fix). Then the r1 residual list. End with `VERDICT: LAND` or `VERDICT: BLOCK` and a one-line reason. This is round 2 of a hard cap of 3: a LOW or MEDIUM that can ship as a documented residual should not block.
