# Batch A2 worker report — EARS form split, Part A §5-9

Worker: Sonnet (build), worktree `~/nana-pi-wt/ears-a2`, branch `feat/ears-a2`, cut from main `6a2e372` (A1 landed).
Spec: `design-ruling.md` §2, `batch0-land-ruling.md` §5, A1's lessons (`batch-a1-astra-r1.md`, `batch-a1-astra-r2.md`). Mapping: `batch-a2.json`. Applier/verifier: `apply-batch.mjs` (reused unmodified from A1).

## Commit

One commit on `feat/ears-a2` (explicit paths: `REQUIREMENTS.md`, `scripts/requirements-trace.mjs`, `packages/nana-pack/tests/requirements-trace.test.mjs`, the 13 other touched test files, `docs/reviews/ears-form-2026-10-04/batch-a2.json`, this report).

## Scope

REQUIREMENTS.md Part A §5-9: handoff/compaction/the adoption signal, journal and session lifecycle, notify, the display renderer (S1/S2), agent-dir resolution (U2) — all in `packages/nana-pack`. 33 off-form origins.

## Off-form count

157 → 124 (§5-9 now zero off form; matches design-ruling.md's A2 ladder exactly).

## Rows added

33 new rows (R-795 to R-827 in the pack's continuation block, plus R-880 — the one new row split from R-248, which numerically sits in the knowledge block R-200-249 and so draws from the knowledge continuation R-880-909, not the pack's): **31 implemented**, **2 untested** (R-818 from R-173; R-880 from R-248). Plus 4 origins whose own first clause was re-judged `untested` on honest re-reading: R-138, R-166, R-173 (itself), R-248 (itself) — none were previously implemented, so these are not downgrades, they are the as-found status carried into the split.

## Merged

2 — **R-142** and **R-193**. In both, the implementation produces the two clauses' observable effects through one unconditional code path with no branch that could satisfy one half while breaking the other:
- R-142: `nana-handoff.ts`'s pickup block builds one literal `Source: … update ${loc.text} in place.` string from a single `loc` value. Every mutation tried (drop the custom path, keep "in place"; keep the path, drop "in place"; override `loc.text` at the source) turned the same two custom-path assertions red together.
- R-193: `lib/config.ts`'s `loadConfig`, when the active user file is absent, never reads the stranded default file at all (`// Never read it.`) and sets `gate` to built-in defaults in the same branch. No code path reads-but-ignores.

Both keep their original three pre-existing cites verbatim; no marker changes needed.

## One overclaim caught before judgement

R-166 ("a working OS notifier shall be used and no fallback shall be raised or journaled") had two pre-existing cites, both checking only the *absence* of a fallback. Mutation: commenting out every `darwinNotify`/`windowsNotify`/OSC-777 call site in `nana-notify.ts` (so the notifier is never invoked at all) left both cited assertions green — a pure no-op is indistinguishable from "a working notifier succeeded" under this fixture. R-166's own clause dropped to `untested`; the surviving clause ("no fallback … when the notifier works") kept both cites under new id R-815.

## Mutations run

24 actual edit-run-revert cycles in disposable copies of the source (git-reverted after each), confirming the cited test goes **red** for the targeted clause while the sibling clause's cites stay green:

| # | Clause(s) | File mutated | Result |
|---|---|---|---|
| 1 | R-110 vs R-795 | nana-handoff.ts (blank the body push) | red: R-110's cite; green: R-795's cites |
| 2 | R-112 vs R-796 | nana-handoff.ts (write `.pi/handoff.md`) | red: R-112's cite; green: R-796's |
| 3 | R-796 vs R-112 | nana-handoff.ts (write `.gitignore`) | red: R-796's cite; green: R-112's |
| 4 | R-113 vs R-797 | lib/adoption.mjs (`storePathFor` → constant key) | red: R-113's cites; green: R-797's |
| 5 | R-114 vs R-798 | nana-handoff.ts (push body in mismatch branch) | red: R-114's cite; green: R-798's |
| 6 | R-119 vs R-799 | nana-handoff.ts (suppress pickup-failed journal) | red: R-119's cite; green: R-799's |
| 7 | R-120 vs R-800/R-801 | nana-handoff.ts (rethrow after journal) | red: R-120's cite; green: R-800/R-801's |
| 8 | R-801 vs R-120/R-800 | nana-handoff.ts (atomicWrite pre-corrupt) | red: R-801's cite; green: R-120/R-800's |
| 9 | R-124 vs R-802 | nana-handoff.ts (push body in stale branch) | red: R-802's cite; green: R-124's |
| 10 | R-128 vs R-803 | nana-handoff.ts (append raw path after marked form) | red: R-803's cite (4/5 labels); green: R-128's |
| 11 | R-133 vs R-805 | nana-handoff.ts (temp litter before early return) | red: R-805's cite; green: R-133's |
| 12 | R-140 vs R-808 | nana-handoff.ts (push ancestor body text) | red: R-808's cite; green: R-140's |
| 13 | R-142 (merge, attempt 1) | nana-handoff.ts (drop "in place") | red: both custom-path cites together |
| 14 | R-142 (merge, attempt 2) | nana-handoff.ts (wrong path, keep "in place") | red: both custom-path cites together |
| 15 | R-145 vs R-809 | lib/adoption.mjs (`repoRootOf` → `isDir` not `present`) | red: R-809's cite; green: R-145's |
| 16 | R-148 vs R-810 | nana-handoff.ts (journal → merged `cfg.journal.path`) | red: R-810's cites (broader than minimal — also disturbed R-148's two, noted in the mapping) |
| 17 | R-150 vs R-811 | lib/adoption.mjs (loosen objectiveFile validation) | red: R-811's cite; green: R-150's |
| 18 | R-154 vs R-812 | bin/nana-adoption.mjs (swallow unreadable journal as `[]`) | red: R-154's cites; green: R-812's |
| 19 | R-156 vs R-813 | lib/display.mjs (`codeSpan` drops backticks) | red: R-156's cite; green: R-813's |
| 20 | R-163 vs R-814 | nana-lifecycle.ts (comment out `setStatus`) | red: R-163's cite; green: R-814's |
| 21 | R-166 vs R-815 | nana-notify.ts (no-op every notifier call site) | red: notify/journal checks for every OTHER clause (b/c/e/f-fail/g); green: R-815's two "working notifier" cites — the overclaim above |
| 22 | R-171 vs R-816 | nana-notify.ts (`NOTIFIER_TIMEOUT_MS` 8000→2000) | red: R-171's cite; green: R-816's |
| 23 | R-172 vs R-817 | nana-notify.ts (journal moved inside `hasUI` branch) | red: R-817's cite; green: R-172's |
| 24 | R-182 vs R-824 | lib/display.mjs (`"[unprintable]"` → `""`) | red: R-824's cite; green: R-182's (all 7 "never throws" checks) |

All 24 showed the intended red for their target clause. Two (16, 10) are noted as broader-than-minimal: the mutation also disturbed an adjacent clause's checks for reasons explained in the mapping's `assertion` field, not because the citation is wrong. The remaining 9 split origins (R-178, R-179, R-180, R-181, R-194, R-197, R-199, plus R-138's/R-166's/R-173's/R-248's untested halves) were resolved by direct reading: each cited pair already exercises a demonstrably different function or branch (e.g. `displayPath`/`displayText` vs. the separate `finish()` backstop; `codeSpan`'s refuse-side vs. its own cap-boundary render check; `loadConfig`'s own stop vs. the gate handler's separate block decision) — no fixture gap or shared-assertion risk was evident, so no live mutation was run for those; this is written, not pinned the same way the 24 above are.

## Sibling-cite list

**0** — no new row's cite set equals its origin's.

## Verifier (`apply-batch.mjs --base main`)

`ALL CHECKS GREEN`, exit 0, idempotent (`rows added: 0` on the final re-run). One mechanical miss and one marker-wiring gap were found and fixed mid-build: R-248's split child was first placed as R-804 (pack block) — the verifier correctly refused it, since R-248 numerically sits in the knowledge block (R-200-249) and must draw from knowledge's own continuation (R-880-909); refiled as R-880. Two origins (R-138, R-140) were missing the `markerEdits` that move their second clause's cites onto its new id — the rail's own diagnostic (`status X but N test(s) trace it`) caught this before the verifier's green; both fixed. A stray duplicate row left by the first (failed) apply attempt was removed by hand before re-verifying.

## Totals

- Rail: `ears: 124 rows off form (allowance 124)`, exit 0.
- `packages/nana-pack/tests/requirements-trace.test.mjs`: 8/8 pass, including `seal: EARS_ALLOWANCE is 124 (G-015)` and the R-757 equality seal.
- `map:check`: 172 modules, 0 problems, exit 0.
- All 16 touched test files re-run individually: exit 0, no FAIL lines.
- `npm test` (alone, after confirming no other `scripts/test.mjs` was running): 95 files — 93 PASS, 1 FAIL, 1 SKIP; 5521 checks pass, 2 fail, 6 skip; 299.1s. The one failure, `packages/nana-pack/tests/readme-check.test.mjs`, is the worktree's pre-existing environmental gap (`node scripts/readme-check.mjs --check` on this worktree reports the same 5 problems: missing `node_modules` and `apps/bench/.ext`), identical in kind to A1's and batch 0's finding — not caused by this batch.
