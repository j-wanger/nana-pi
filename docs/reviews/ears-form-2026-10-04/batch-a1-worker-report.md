# Batch A1 worker report — EARS form split, Part A §1-4

Worker: Sonnet (build), worktree `~/nana-pi-wt/ears-a1`, branch `feat/ears-a1`, cut from main `3d7072b`.
Spec: `design-ruling.md` §2, `batch0-land-ruling.md` §5. Mapping: `batch-a1.json`. Applier/verifier: `apply-batch.mjs` (new, reusable by A2/A3/B/C).

## Commit

One commit on `feat/ears-a1`, explicit paths (REQUIREMENTS.md, `scripts/requirements-trace.mjs`, `packages/nana-pack/tests/requirements-trace.test.mjs`, the 15 marker-edited test files, `apply-batch.mjs`, `batch-a1.json`, this report).

## Off-form count

- Before: **194** rows off form.
- After: **157** rows off form. §1-4 (the batch's own sections) at **zero** off form.
- Matches design-ruling.md's planned 194 → 157 exactly.

## Rows added

37 origins → 37 new rows (R-758 to R-794): **32 implemented** (each cites a test read directly, with the real assertion that fails if the clause breaks), **5 untested** (R-759, R-761, R-771, R-777, R-794) carrying the standard evidence sentence. One origin's status was re-judged down on split (R-097's "no deadline" clause: the one cited test can't distinguish "no deadline" from "a deadline long enough not to matter here").

## Merged

1 — **R-050**: "shall be kept and enforced" and "shall not police the owner's own regex" are one promise proven by the same single existing test; splitting would hand the new row the origin's exact cite set (the sibling-cite failure shape the lane exists to catch).

## Sibling-cite list

**0** — no new row's cite set duplicates its origin's.

## Verifier (`apply-batch.mjs`)

`ALL CHECKS GREEN`, exit 0, and idempotent (a second run reports 0 rows added, still green). Every §5 checklist item passed: ids present and placed correctly inside the pack's declared continuation block (R-756–R-879), committed cells match the mapping, rail re-run clean, `ears:`/seals/G-013/G-015 carry 157, no sibling-cite duplicates. `git diff` over every touched test file shows only `// req:` marker-line edits plus the one sanctioned seal literal in `requirements-trace.test.mjs` — no assertion moved.

## Totals

- `node scripts/requirements-trace.mjs`: `ears: 157 rows off form (allowance 157)`, exit 0.
- `npm run map:check`: 172 modules, 0 problems, exit 0.
- `npm run readme:check`: 544 claims, 5 problems (all pre-existing environmental: missing `node_modules`/`apps/bench/.ext`), exit 0.
- `npm test`: 95 files — 93 PASS, 1 FAIL (`readme-check.test.mjs`, the same environmental cause), 1 SKIP; 5521 checks pass, 2 fail, 6 skip; exit 1 (the known environmental failure only — every batch-touched file passes).
