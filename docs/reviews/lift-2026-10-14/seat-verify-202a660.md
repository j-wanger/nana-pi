# Seat's independent check of build 2 (2026-10-15, at 202a660)

MUST 1. The proof does not account for every input line (R-1163, "carries every other input line … once; adds only lines the mapping declares"). It checks lines under each mapping `from` heading and the first `head.through` lines by position. It never checks the tail, lines outside any declared region, or extra lines. Reproduced on the lifted basketball-geek copy: a committed mapping with `head.through: 1` (true value 4) let `--write` delete the 3-line intro, with the proof clean and exit 0. `validateMapping` never requires `head.through` to end just before an old heading (§3.2). On aml-desk, dropping the 42-line Open questions body passes `proveLift` in both modes; so do a dropped Deliberate omissions bullet, a duplicated kept section and an appended stray line.

MUST 2. `--verify` never runs the proof, mapping validation or pin check (R-1168, "with a passing proof"). `runVerify` only compares the applied output to HEAD (`scripts/requirements-lift.mjs:773-774`). Reproduced: a mapping missing R-136, committed with its matching 164-row ledger, gives `--verify HEAD~1: matches HEAD`, exit 0, against a 165-row base. The reviewer's check passes a lost row.

MUST 3. In default mode, check 9 is not built as planned (§3.5: "kind, level, label and source line" from the input alone). The derived sequence takes ids, levels and parents from the input, but labels and purposes from the mapping, and never compares `from` lines. These all pass `proveLift(fromDefault)` on aml-desk, basketball-geek and trading-zone: a label stripped of "1. ", two sections swapped (label, from and rows), and a changed purpose.

MUST 4. Rows R-1163, R-1164 and R-1168 are marked implemented, but the suite does not pin several of their clauses. Each mutation below, run on a scratch copy against requirements-lift.test.mjs, reds 0 tests:
- the proof's derived-sequence check, its mapping-sequence check, the reserved R-row rule, the G-row subgroup rule, check 8, the whole line-accounting check (`proseMatches`), the stray-line check and the blank-line check;
- the `--write` re-read before rename (T12 edits the ledger before the run, so the HEAD diff refuses, not the re-read, as its own comment admits);
- `--verify`'s ledger and mapping git checks;
- the validator's unterminated-last-row rule.

T6 has 15 tampers, not the 19 brief 1 requires. Missing: CAP-90 nesting, the split capability, a blank line dropped from a re-laid leaf, and a section's lines out of order. Its prose tampers all hit the head region. Only the seat acceptance tampers CAP-90, and that is not a suite test.

Notes
- (3) holds. Dry runs give aml-desk 6/41/2, basketball-geek (both copies) 1/9/0, and trading-zone CAP-01, CAP-90, CAP-02 with FEAT-005–011 under CAP-02. An independent check found 365/165/197 rows byte-identical, 0 checker problems and no prose missing. `--write`, commit, `--verify` exit 0 in scratch repos.
- (4) holds. A capability move, a merge, three moved rows and a proposed feature apply, prove, write and pass `--verify`; tree check 0. The merge of FEAT-002 into FEAT-001 prints no move line (R-1162), so the owner's plan hides it.
- (5) The listed refusals fire with named reasons and exit 1, and a BOM mapping is accepted. A mapping with `rows` as a string, or `tree` as an object, crashes with a TypeError stack trace (exit 1, nothing written), against @errors' "never a crash".
- (5) In default mode, an unterminated last row after a mid-file Open questions is refused by the proof as "row R-002 appears 0 time(s)", not with the named fix.
- (2) Gate refusals all fire with named reasons: git missing, unborn HEAD, untracked ledger, a dirty second worktree (named, lane ledger unchanged), untracked or changed mapping. Bytes written always equal the bytes proved, but MUST 1 limits what "proved" means.
- (6) holds. `canonical()` covers the repository top, `--root`, the ledger, the mapping and the worktree dirs. Making it identity reds 18 tests; an uncanonical repository root reds the new subfolder-path test. CI run 38743661592 at 202a660 shows the Windows lift file at 28 pass.
- (6) Other legs of that run fail outside this lane: nana-knowledge ×11 on Windows, lane-write-guard symlink on Ubuntu. I did not check whether main fails the same way.
- (7) holds. Nothing changed in templates/, packages/nana-setup/, product-report or the five pi skills. The tree module gains only the four exports. Rows R-1162–R-1169 match §2 text exactly.
- The skill says a hand-built partial tree "takes `--emit-mapping`". The tool refuses `--emit-mapping` on yokai-world, and on any flat shape the default refuses (the plan's §3.7 and R-1167 contradict each other). That path ends in a hand-written mapping, which is where MUST 1 bites.
- The T4 trailing space sits inside a cell, so a mutation that trims line-end whitespace reds nothing; the proof still catches it. Verify's missing `./` and the null-status-as-clean mutation are equivalent under the current code.

Scripts and repros are in /private/tmp/claude-501/-Users-jwang-nana-pi/dea1c010-278e-4392-a90f-df947a3a8b71/scratchpad/lift-mutate-verify/ (tamper.mjs, mutate.mjs, m1–m3.json, repos/headcut, repos/verify-droprow).
