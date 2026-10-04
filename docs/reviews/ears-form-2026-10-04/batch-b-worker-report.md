# Batch B worker report — EARS form split, Part B §14-26

Worker: Sonnet (build), worktree `~/nana-pi-wt/ears-b`, branch `feat/ears-b`, cut from main
`afc026a` (A3 landed, allowance 100). Spec: `bc-method-ruling.md` (the per-condition pins
rule), `design-ruling.md` §2 (the split rule), A3's record (`batch-a3-astra-r1.md`,
`batch-a3-astra-r2.md`, `batch-a3-seat-verify.md`). Commit: `b5c6c73`.

## apply-batch.mjs change (bc-method-ruling.md §7)

Three changes, nothing else:

1. **`pins`** on every mutation record: non-empty, checked as a plain substring of its OWN
   clause's `text` (never another clause's), one `must()` added inside the existing (g2)
   per-record `forEach` loop. Gated behind `batch.conditionRecords === true`, so A1-A3's
   mappings (which predate the field) replay unchanged.
2. **Read-list on stdout**, always printed (not gated): every implemented clause — origin or
   split-born — with its own sentence and the union of its records' `pins` quotes, grouped by
   origin, right after the merged list.
3. **`batch.untestedSentence`**: a per-batch mapping field read by `evidenceCell()` and check
   (h); default is the ORIGINAL literal (`"no test pins this clause"`), so `refusal-test.mjs`
   (which replays `batch-a2.json`, carrying no such field) stays green unchanged.

**Mutation proof**: a disposable copy of `batch-b.json` with one record's `pins` rewritten to
text absent from its clause's sentence → `apply-batch.mjs` exits 1 at the PRE-WRITE stage
(`mutation record #0 pins is missing, empty, or not a substring of the clause's own text:
R-204`), and `sha1sum` over `REQUIREMENTS.md` / `scripts/requirements-trace.mjs` /
`packages/nana-pack/tests/requirements-trace.test.mjs` confirmed byte-identical before and
after. Re-running the real mapping immediately after: `ALL CHECKS GREEN`, confirming no
corruption. `refusal-test.mjs` (the A2 tampered-mapping repro, unrelated to this change):
`REFUSAL TEST: ALL PASS`.

## Scope and method

47 off-form origins across three packages — knowledge pull (§14-18, 15 origins), stage
(§19-20, 10), installer (§21-26, 22) — matching `checkRepo().earsOffForm` filtered to
R-200–R-359 exactly. Every split-born row starts `untested`. A row (origin or split-born)
reaches `implemented` only when, for each condition and outcome its own sentence names, the
mapping carries a recorded EXECUTED red mutation whose `pins` quotes the words it covers — no
code-read, no isolated reproduction; a condition not covered in one pass is left or downgraded
to `untested`, never guessed into `implemented`.

Mutations were run directly against the real source tree in this worktree: edit, run the one
named test file, capture PASS/FAIL, revert the file, confirmed via `git status --porcelain`
clean between runs. ~120 mutation attempts across `packages/nana-knowledge/lib/*.ts`,
`packages/nana-stage/lib/{blocks.mjs,sign.mjs}`, `packages/nana-setup/lib/*.mjs`,
`packages/nana-setup/bin/nana-setup.mjs`, `packages/nana-setup/claude/hooks/nana-shared-memory.sh`,
and two SKILL.md files (`packages/nana-pack/skills/requirements`,
`packages/nana-pack/skills/adopt-structure` — markdown claims the tests read as literal text,
mutated the same way).

**Ten merges**, each recorded in `batch-b.json`'s `merged` array with its reason: R-304, R-315,
R-324, R-333, R-348 (partial — three of its five clauses stay split), R-349 (partial), R-351
(partial), R-354, R-355, R-358. Each is "one promise in two wordings," confirmed by execution —
a single mutation that turns both halves' citations red together, with no counter-mutation
found that breaks one half while the other holds. Two of the ten (R-324, R-354) still end up
`untested`: the merge resolves the FORM question (one `shall`), not the EVIDENCE question —
R-324's worktree-counting half and R-354's opt-in/idempotent/no-plist-otherwise halves have no
fresh red mutation this pass, so the row is left honest rather than overclaimed. A third,
unmerged origin, R-328, is untested for the same reason on its own retained clause: the one
mutation attempted against its "not already a repo" guard found no cited assertion that
actually depends on it (the existing cite proved to be about a different code path), while its
sibling new row (R-928, the nested-repo guard) is cleanly implemented.

## Rows: before → after

| | origins | split-born | total |
|---|---|---|---|
| implemented | 39 | 44 | 83 |
| untested | 8 | 9 | 17 |
| **total** | **47** | **53** | **100** |

93 `pins` records across the 83 implemented clauses (several clauses carry 2-3 records to
cover distinct named conditions; a few share one record as legitimate siblings, each
independently confirmed red).

Two origins (R-315, R-358) were already `untested` before this batch and carry no new
evidence — R-315's text is reworded to one `shall` (merged with its own `--yes` clause) and
stays `—`; R-358 keeps its pre-existing custom evidence string verbatim (`split from R-314
2026-10-02 (clause audit): no test pins this clause`), now attached to the merged one-`shall`
sentence. R-324's and R-354's downgrades read the default `"—"` (the origin's own untested
convention) — no custom per-row explanation, same as R-315's.

## Totals

- Verifier (`apply-batch.mjs batch-b.json --base main`): `ALL CHECKS GREEN`, exit 0, idempotent
  (`rows added: 0` on re-run).
- `refusal-test.mjs`: `REFUSAL TEST: ALL PASS`.
- Rail: `ears: 53 rows off form (allowance 53)`, exit 0. `EARS_ALLOWANCE` is 53
  (`scripts/requirements-trace.mjs`); both seals (`requirements-trace.test.mjs`'s title and
  comparison) read 53; G-013's evidence cell reads "53 rows off form 2026-10-04 ...".
- `requirements-trace.test.mjs`: 8/8 pass.
- `map:check`: 172 modules, 0 problems, exit 0.
- `npm test` (alone, confirmed no other `scripts/test.mjs` running first): 95 files — 93 PASS,
  1 FAIL, 1 SKIP; 5521 checks pass, 2 fail, 6 skip; 328.5s. The one failure,
  `packages/nana-pack/tests/readme-check.test.mjs` (5 problems: missing `node_modules`,
  missing `apps/bench/.ext`), is the worktree's pre-existing environmental gap — identical in
  kind and count to batch 0, A1, A2 and A3's own finding, not caused by this batch.

## Residual for 6b

17 untested rows this batch (8 origins, 9 split-born), each carrying either the standard
per-batch sentence or (R-358) its preserved pre-existing note. The three merge-but-untested
rows (R-324, R-328's own origin clause, R-354) are the most informative residual: the FORM
question (one promise, one `shall`) is settled by execution; the EVIDENCE question for their
remaining named conditions is explicitly left to 6b, not guessed.

C (§27-47, desk and bench, allowance 53 → 0) is next.
