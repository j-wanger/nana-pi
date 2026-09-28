# Review brief — lane U: pi 0.84.4 → 0.87.1 (gpt-5.6-sol, round 1) — roles: compatibility + adversarial

Read-only. Worktree `~/nana-pi-wt/u`, branch `lane/pi-upgrade-0.87`, commit `6c4d01d`. Diff: `~/nana-pi/docs/reviews/tranche1-2026-09-28/u-r1.patch`. Worker report: `u-worker-r1.md`. Brief the worker had: `pi-upgrade-brief.md`. The globally installed pi is now 0.87.1 (`$(npm root -g)/@earendil-works/pi-coding-agent`; docs under `docs/`, source under `dist/`).

Seat-verified (don't re-run): `pi --version` = 0.87.1; `npm test` in the worktree (result in the seat's hands by the time you finish).

**Compatibility role** — what else speaks the old contract?
C1. Every pi contract nana-pi relies on: list each import/event/format the desk, bench and pack use (`apps/desk/pi-session.mjs`, `server.mjs`, `apps/bench/lib/usage.mjs`, `run.mjs`, `packages/nana-pack/extensions/*.ts`) and confirm against 0.87.1 source/docs that it is unchanged or that the diff handles the change. Name anything the worker missed (e.g. `TranscriptContext` 0.86 breaking change — who consumes it? `shouldStopAfterTurn` removal — any user?).
C2. Documented contracts: desk README "Dependencies" + "Contract notes", bench README, pack README, root README (still says 0.84.4 at lines ~49/55 — outside the worker's allowlist; the seat will fix; say if anything else is stale). `PI_MIN_VERSION` left at 0.84.4 in two files: right call or not?
C3. Bench study pins (`pinnedPiVersion` 0.84.4) now abort re-runs: acceptable by design, or does a study need a documented re-pin path?
C4. The live desk service still runs 0.84.4 in memory until restart: any state (session files written by 0.87.1 pi children) it could misread before the restart?

**Adversarial role** — try to break it.
A1. Run `node --experimental-strip-types apps/desk/test/pi-087-entries.test.mjs` and read the fixture: does it exercise real 0.87.1 `SessionManager` output (as claimed) or a hand-written shape? Disable the fix mentally: which checks fail, and do they cover `usage`, `context_edit` AND `role:"system"` entries at branch head and mid-branch?
A2. `isPiBookkeeping` in `server.mjs`: can hiding these entries break active-branch tracing when the LAST entry is a `context_edit` (worker says it still traces through them — verify by reading the code path).
A3. Bench `usage.mjs`: cache-warm `entry_appended` spend added to run tokens — double counting risk with assistant-message usage? Read the accounting path and the 6 new checks.
A4. The `subagent-render` e2e flake (1 fail then 3 passes; `sessionFile: null`): read the test; is there a plausible causal path from the diff, or from 0.87.1 timing (cache warming during idle)?
A5. Live smoke: the brief's command hung on an open stdin pipe; worker used `</dev/null`. Does anything in nana-pack or the desk spawn `pi -p` with an inherited stdin that will now hang on 0.87.1? (`apps/desk/server.mjs` spawns `pi --mode rpc`; `packages/nana-knowledge` and `pi-review.mjs` spawn pi.)

End with findings (severity-sorted, `file:line`), residuals to carry, `VERDICT: LAND` or `VERDICT: BLOCK`. Round 1 of 3.
