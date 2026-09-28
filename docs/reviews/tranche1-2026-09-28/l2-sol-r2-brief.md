# Review brief — lane L2 round 2 of 3 (gpt-5.6-sol) — confirm the fold

Your r1 (`l2-sol-r1.md`) BLOCKed: 3 HIGH, 2 MED, 1 LOW. Two worker rounds followed (`l2-worker-r2.md` commit `cbfd70c`, `l2-worker-r3.md` commit `a24f2bd`). Worktree `~/nana-pi-wt/l2`; clean diff vs main `l2-r3.patch`.

**Seat rulings you must judge as rulings, not re-litigate as findings:**
- **HIGH #2 (policy-file bypass via shell text) — NOT patched, by ruling.** Chasing shell-computed paths with more scanner patterns is an arms race text inspection cannot win. Instead the claim was narrowed and your confirmed bypass list is published verbatim in the README/AGENTS/header as a named residual, with the structural mitigation stated (a policy write never loosens the gate in the session that made it; it is a cross-session escalation) and the closer named (OS sandbox / container layer). **Judge: is the published claim now TRUE and complete, is your bypass list represented faithfully, and is the mitigation claim accurate?**
- **MED #4 (project-scope `.claude/**`) — kept, overruling you.** Project `.claude/settings.json` carries hooks that execute code and Jake's repos have them; reverting would leave a demonstrated hole. Declared in the README as a ratified expansion. **Judge: is the declaration honest and is anything else silently expanded?**
- **MED #5 (desk label) — the seat changed `apps/desk/public/app.js:2120` itself** to "allow (exempt matching segment; not the floor)". **Judge the wording.**
- **LOW #6 → the worker first added a per-call `node:vm` watchdog; the seat SUBTRACTED it** (it blocked a benign 4 MB command and could fail-closed on a GC pause) and moved the check to a once-per-load probe in `config.ts` beside `compileRegexes`, caching per pattern. **Judge the replacement**: is load-time probing sound, is dropping a pattern with a `config_invalid` diagnostic the right failure mode, and is the worker's own residual (polynomial regexes and blow-ups outside the three probe shapes are undetected and unbounded per call) correctly stated?

**HIGH #1 (appetite overrun):** accepted retroactively — you judged the contract genuinely needed ~800–900 LOC. The process rule now requires a mid-flight CHECKPOINT on crossing the ceiling (lane template amended). No code action.
**HIGH #3 (floor gaps):** fixed in r2 — 23 rows that failed on r1 now BLOCK, each under an allow pattern that would otherwise exempt it.

Seat-verified (don't re-run): `npm test` → 64 files, 2986 checks, exit 0; both probe scripts byte-identical to r1 output (94 BLOCK / 16 ALLOW, every dangerous row blocked); `node:vm` no longer imported by the gate.

Judge, ≤45 lines: (1) each r1 finding FIXED / PARTIAL / NOT FIXED / RULED, with the line; (2) NEW defects introduced by r2 or r3 — especially the load-time probe (false drops of legitimate patterns? per-process cache poisoning? behavior when a pattern is dropped mid-list?) and the floor additions (any benign command newly floored? re-run the ALLOW rows); (3) your CARRY list for the astra land ruling. End with `VERDICT: LAND` or `VERDICT: BLOCK`.
