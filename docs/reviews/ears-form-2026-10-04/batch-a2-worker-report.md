# Batch A2 worker report — EARS form split, Part A §5-9

Worker: Sonnet (build), worktree `~/nana-pi-wt/ears-a2`, branch `feat/ears-a2`, cut from main `6a2e372` (A1 landed).
Spec: `design-ruling.md` §2, `batch0-land-ruling.md` §5, A1's lessons. Mapping: `batch-a2.json`. Applier/verifier: `apply-batch.mjs`, extended this round with a mechanical mutation-record check (below).

Review history: astra r1 **BLOCK 6/10** (`batch-a2-astra-r1.md`) — 17 PINS/3 PARTIAL (exceeds the 2-PARTIAL threshold), both merges rejected, one lost IF condition, four code-read PARTIALs, five standalone-sentence SHOULDs. Fixed below; this is the resubmission.

## Commits

- First build: `6565cfe` (superseded by this round's fixes).
- This round: a new commit on `feat/ears-a2` (explicit paths: `REQUIREMENTS.md`, `scripts/requirements-trace.mjs`, `packages/nana-pack/tests/requirements-trace.test.mjs`, the other 14 touched test files, `docs/reviews/ears-form-2026-10-04/apply-batch.mjs`, `docs/reviews/ears-form-2026-10-04/batch-a2.json`, this report).

## New mechanical rule: mutation records

The seat tightened the standard: **an implemented split row is valid only if the mapping records an EXECUTED mutation that turned its cited assertion red** — a code-read is never enough. Made mechanical in `apply-batch.mjs`: every clause's mapping entry now carries a `mutations` array (`file`, `break`, `cite`, `result`); when the mapping sets top-level `mutationRecords: true`, the verifier refuses any `implemented` clause that lacks at least one entry with `result: "red"` whose `cite` is one of that clause's own citations, naming the row. **Smaller change chosen** (as asked): the check is gated behind the opt-in flag rather than applied unconditionally, so `batch-a1.json` (which predates the field and carries none) needs no retrofit — reconstructing A1's 37 origins' mutation evidence from its two prose review files would have been the larger change. Proved: removed R-110's `mutations` array in a disposable copy of `batch-a2.json` (left the worktree and real mapping untouched) and ran the verifier — `FAIL: implemented clause has no recorded red mutation (mutationRecords: true): R-110`, exit 1. Re-ran the real mapping immediately after: `ALL CHECKS GREEN`, confirming no corruption.

## Fixes for astra r1

1. **R-796, R-812, R-816 (MUST 1 — overclaimed citations).** Added astra's named assertions with markers and executed mutations: R-796 now also cites `handoff-artifact.test.mjs::custom path: no .gitignore beside it` (mutation: write a `.gitignore` beside the actual handoff file, not just the legacy repo path — red). R-812 reworded to its honest read-failure scope ("among an absent journal and one that exists but cannot be read, only the absent one shall be silent") and now also cites the two `ADOPTION UNAVAILABLE` assertions (dual-tagged with R-154). R-816 reworded to name its own condition and now also cites the deadline-timing assertion (dual-tagged with R-171; mutation: `NOTIFIER_TIMEOUT_MS` 8000→14500 — red).
2. **R-142, R-193 (MUST 2 — reject both merges).** Split properly. R-142 → R-142 (names the file; mutation: wrong filename in the custom-path branch only — red, default-store and legacy-absence cites stay green) + new **R-828** (says update in place; mutation: drop " in place" — red, shares the custom-path citation with R-142 where the implementation genuinely renders both facts in one literal, per astra's "shared citations are allowed"). R-193 → R-193, now **untested** (astra's own probe — read-but-discard the stranded file — left every cited assertion green; no assertion in this repo observes the read itself) + new **R-829**, implemented (the behavioural non-application; mutation: actually apply the stranded gate — red).
3. **R-803 (MUST 3).** Restored the governing condition: "IF the path cannot be addressed as written THEN the raw path shall not appear in the pointer." Same cite, same mutation (already scoped correctly to the unaddressable-path fixtures).
4. **R-806 (SHOULD).** Added `handoff-symlink.test.mjs::e: external handoff.md not overwritten`; mutation: narrow `reachedThroughSymlink` to the final component only — red (the parent-directory-link case astra named), the two final-component cites stay green.
5. **R-807, R-825, R-827 (SHOULD → downgraded).** Each had an astra-run probe that left every cited assertion green under a targeted mutation (case-fold `NANA_HANDOFF`; drop the stranded-existence check; add an ambient write during `install --pi-home`). Re-ran each myself; confirmed. All three dropped from `implemented` to `untested`.
6. **Standalone wording (SHOULD).** R-807, R-811, R-816, R-825, R-826, R-827, R-829 reworded to name their own input/condition/object instead of a sibling ("any other value" → "NANA_HANDOFF is unset, or set to a value other than the exact lowercase off"; "that name" → "the adoption predicate's chosen objective filename"; "a hung one"/"the deadline" → "WHEN the notifier hangs ... that same 8 s deadline"; "otherwise" → "WHEN the active config is present, or no stranded default config exists"; "the handler"/"that named reason" → "the gate's tool_call handler ... that same unresolvable-agent-dir reason").
7. **Re-checked every implemented split row against the new rule.** Nine origins that were code-read-only in round 1 (R-134, R-145, R-178, R-179, R-180, R-181, R-194, R-197, R-199) now each carry an executed, recorded mutation (e.g. R-134: disable the read-side symlink check — red, write-side stays green; R-178: drop `displayPath`'s `.toWellFormed()` — red, `finish()`'s backstop stays green; R-181: force-escape an em-dash only when `extra` is omitted — red, round-trip/astral cites stay green). R-819–R-823, R-826 (astra's own code-read findings) were re-run myself to produce first-party records rather than relying on astra's log.

## Off-form count

**Unchanged: 157 → 124.** Rejecting both merges adds 2 more new rows (35 instead of 33: R-795–R-829 plus R-880), but the off-form *reduction* is driven by origins resolved (still 33), not row count — a split row is on-form exactly like a merged one.

## Rows: before → after this round

- Before (first build): 66 total clauses (33 origins + 33 new rows, 2 merges) — 60 implemented, 6 untested.
- After (this round): 68 total clauses (33 origins + 35 new rows, 0 merges) — **58 implemented, 10 untested**. New untested: R-193 (own clause), R-807, R-825, R-827 (all downgraded per astra's probes, confirmed independently).

## Mutations run

**59 mutation records across 58 implemented clauses** (one clause, R-822, carries two). Every one is an executed edit-run-revert cycle in a disposable copy of the source (git-reverted after each run, confirmed clean via `git diff --stat`), not a code-read: round 1 had 24; this round added/replaced 28 more to close the nine code-read origins, fix the four overclaims, and cover R-142/R-193's new split halves. Representative examples beyond the round-1 set: R-134 (disable `reachedThroughSymlink` on the read path), R-145 (adoption reporter uses `canon` directly, never walks to the repo root), R-178 (`displayPath` drops `.toWellFormed()`), R-179 (`codeSpanSafe` stops refusing a backtick), R-180 (`locator` truncates over 1000 chars), R-181 (em-dash force-escaped only when `extra` omitted), R-194 (mismatch-note push unconditionally skipped), R-197 (unresolvable-agent-dir branch falls back to defaults instead of stopping), R-199 (`resolveLayout`'s no-flags branch ignores `PI_CODING_AGENT_DIR`), R-826 (gate returns `block: false` for an unusable policy), R-828 (drop " in place"), R-829 (apply the stranded gate instead of discarding it). Every record names the file, what was broken, which of the clause's own citations it targeted, and the observed result; `apply-batch.mjs` now checks this mechanically (see above).

## Sibling-cite list

**0** — no row's cite set equals its origin's or a sibling's (checked by the verifier).

## Verifier (`apply-batch.mjs --base main`)

`ALL CHECKS GREEN`, exit 0, idempotent (`rows added: 0` on the final re-run), including the new mutation-record check. To rebuild cleanly against astra's fully-corrected mapping, the worktree's A2 files were first reset to `main` (`git checkout main -- <files>`) and `apply-batch.mjs` re-run fresh — this round's commit therefore carries the complete corrected diff from `main`, not an incremental patch over the flawed first build. Two mechanical misses surfaced and were fixed before green: R-827's reworded text accidentally carried two `shall`s (fixed to one); R-138/R-193/R-194's pre-existing (pre-lane) markers on now-reassigned or now-untested citations needed explicit `markerEdits` (several were missing in the first pass of this round's fix; the rail's own `status X but N test(s) trace it` diagnostic caught each one before green).

## Totals (round 2, superseded by round 3 below)

- Rail: `ears: 124 rows off form (allowance 124)`, exit 0.
- `packages/nana-pack/tests/requirements-trace.test.mjs`: 8/8 pass, including `seal: EARS_ALLOWANCE is 124 (G-015)` and the R-757 equality seal.
- `map:check`: 172 modules, 0 problems, exit 0.
- All 17 touched test files re-run individually: exit 0, no FAIL lines; whitespace (tab-indentation) of every inserted/moved marker line re-checked and fixed to match surrounding style.
- `npm test` (alone, after confirming no other `scripts/test.mjs` was running): 95 files — 93 PASS, 1 FAIL, 1 SKIP; 5521 checks pass, 2 fail, 6 skip; 294.7s. The one failure, `packages/nana-pack/tests/readme-check.test.mjs`, is the worktree's pre-existing environmental gap (missing `node_modules` and `apps/bench/.ext`), identical in kind to A1's and batch 0's finding — not caused by this batch.

## Round 3: astra r2 fixes

Astra r2 **BLOCK 8/10** (`batch-a2-astra-r2.md`) — 19 PINS/1 PARTIAL (passes the bar), all 12 replayed records succeeded. One MUST (mechanical), two SHOULD.

1. **MUST — validate before writing.** `apply-batch.mjs`'s write-then-verify order meant a rejected mapping (astra's repro: drop R-110's `mutations`, reword its sentence) still left the rejected REQUIREMENTS.md edit on disk even though the process exited 1. Restructured: every check computable from the mapping and the in-memory computed text — mutation records (now validating **every** record's shape, not `some(valid)`), ID existence/block/placement, committed-cell text, the standard evidence sentence, assertion presence — now runs **before** any `writeFileSync`, using the already-computed `reqTextAfter`/`railTextAfter`/`railTestTextAfter`/marker-edit buffers instead of reading them back from disk. The two checks that genuinely need live files (the rail spawned as a child process; the whole-branch `git diff` against base, which reads the working tree) still run after the write, but now wrapped in a rollback: on any failure there, every touched file is rewritten to its exact pre-run bytes before exiting 1. Added `docs/reviews/ears-form-2026-10-04/refusal-test.mjs`: hashes every file the script can touch, builds astra's exact tampered mapping in a disposable temp copy, runs the verifier, and asserts non-zero exit with every hash unchanged — `node refusal-test.mjs` → `REFUSAL TEST: ALL PASS` (18 files checked).
2. **SHOULD — per-record shape validation.** The check now validates every entry in a clause's `mutations` array individually (non-empty `file`/`break`, `cite` a member of the clause's own `cites`, `result` exactly `"red"` or `"green"`) rather than accepting the clause once any one entry looked valid; a malformed record beside a valid one (astra's `{"file":"","break":"","cite":"unrelated","result":"red"}`) now fails, naming the clause and the record's index.
3. **SHOULD — R-796 still overclaimed the default-store case.** Astra's refined mutation (write the `.gitignore` only when `!custom`) left both cited files green — no test in this repo checks the actual default store directory (`~/.pi/agent/handoffs/`) for a stray `.gitignore`. Split: **R-796** now reads "No .gitignore shall be created beside a custom handoff.path," implemented, keeping its one custom-path citation and mutation. New **R-830**, untested, carries the default-store promise honestly (searched first: confirmed no existing assertion anywhere touches that directory). **R-112** regains the repo-local legacy `.gitignore` citation (`handoff-store.test.mjs::b: no .gitignore written into the repo`) it held before this lane — an independently provable sub-instance of "nothing shall be written into the repository," with its own mutation record.

### Rows: after round 3

69 total clauses (33 origins + 36 new rows) — **58 implemented, 11 untested** (R-830 added to the untested set; R-796 stays implemented, re-scoped).

## Totals (round 3, final)

- Verifier: `apply-batch.mjs --base main` → `ALL CHECKS GREEN`, exit 0, idempotent (`rows added: 0` on re-run).
- Refusal test: `node refusal-test.mjs` → `REFUSAL TEST: ALL PASS`, exit 0, non-zero exit from the tampered run, all 18 affected files byte-identical before/after.
- Rail: `ears: 124 rows off form (allowance 124)`, exit 0. Rail test: 8/8 pass.
- `map:check`: 172 modules, 0 problems, exit 0.
- All 17 touched test files re-run individually: exit 0, no FAIL lines.
- `npm test` (alone, after confirming no other `scripts/test.mjs` was running): 95 files — 93 PASS, 1 FAIL, 1 SKIP; 5521 checks pass, 2 fail, 6 skip; 294.4s. The one failure, `packages/nana-pack/tests/readme-check.test.mjs`, is the worktree's pre-existing environmental gap (missing `node_modules` and `apps/bench/.ext`) — unchanged across all three rounds, not caused by this batch.
