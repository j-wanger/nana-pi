**MUST 1 — FIXED.** `packages/nana-pack/lib/gate-shell.ts:255–265` limits informational options to option position and gives explicit stdin indicators precedence. Both reported bypasses now reach the floor. Receiver-matching regression coverage is at `packages/nana-pack/tests/gate-corpus.test.mjs:137–146`.

**MUST 2 — FIXED.**
- Bounds and interpreter residual: `packages/nana-pack/README.md:229–245`.
- Both-scope external repair/deletion recovery: that README `:143–147` and `AGENTS.md:150–154`.
- Published label: `apps/desk/README.md:235–237`, matching `apps/desk/public/app.js:2120`.

**Option-position assessment:** The deliberate strictness does produce ordinary false positives: `cat data.json | python3 -m json.tool -` is floor although stdin supplies JSON, not executable code. Likewise, `-s` passed to a shell script is treated as an interpreter flag. Nonblocking conservative over-gating; carry explicitly.
`--` does not defeat explicit indicators: scanning stops there, but the independent indicator scan does not. Bare `bash --` remains floor; `python3 -- --version` names a script, so its ALLOW is appropriate. No new `--`-based floor bypass found.

**Uncapped union — CONFIRMED.** `packages/nana-pack/extensions/nana-gate.ts:81–82` unions denies; `:243–244` stores that union back into the per-cwd baseline and ADOPTED map. `packages/nana-pack/lib/config.ts:488–501` compiles without re-capping. The union can exceed 200 through successive observed tightenings; session adoption resets the baseline.

Assessment is source-based; the 2,996-check run and probe equivalence are seat-reported, not independently rerun here.

SCORE: 9/10
MUST:
CARRY: Conservative stdin false positives; incomplete interpreter-option modelling; uncapped deny accumulation, regex/large-command work; computed policy-path misses and live post-edit exposure; advisory load-path/later-handler limitations.
VERDICT: LAND
