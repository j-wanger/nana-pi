# Seat's checks of build 3 (2026-10-15, at 0dc5d1d)

## Independent check

MUST 1. A is not closed: the proof takes its line regions from the mapping instead of building them from the input. It never checks that every input heading after head.through is named. It also drops any line that starts with a field label, wherever that line sits in a region. Repros on scratch copies of the lifted basketball-geek at 0dc5d1d:
- (a) A passing tree with an owner's `## Notes` or `### Notes` section and prose. The no-mapping dry run shows a clean proof. `--write` deletes 4 lines and exits 0. `--verify HEAD~1` then refuses with "not named", so write and verify disagree.
- (b) A feature body line `Outcome: measured 2026-09-02, cache hit 94%.` (a `Purpose:` line behaves the same). It is deleted by the no-mapping `--write` and by a hand regroup (`--emit-mapping` → edit → `--mapping --write`). The proof is clean and `--verify` passes. R-1167 promises a refusal for carried prose starting with a field label, but `baseRefusals` only scans ledgers with no tree heading. yokai-world line 50 is such a line under `## The product`. I infer that a hand mapping naming that heading in a node would lose it; I did not run one.
- (c) Default mode: a builder or mapping that leaves a kept section out of tail.keep. The proof is CLEAN on work-project, basketball-geek and trading-zone with `## Deliberate omissions` gone. `--write` never runs `validateMapping` on a built mapping, so the proof is the only guard.

MUST 2. D is not closed: the fixes for MUSTs 1–3 are mostly unpinned. Each mutation below, on a scratch copy at 0dc5d1d, reds 0 tests in requirements-lift.test.mjs:
- Proof: all tail accounting (tail prose, kept verbatim, kept missing, closing missing), together and one at a time. These are the exact MUST 1 repros: dropped Open questions body, appended stray line, duplicated kept section.
- Proof and validator: head.through removed from both at once (the headcut repro).
- `main`: the `--write` proof gate deleted. It is reachable: a validated mapping with an empty purpose is refused only by the proof, and I confirmed that refusal.
- Check 9 reverted to borrowing label and purpose from the mapping (MUST 3's original bug), plus the from-line compare, the mapping-mode heading sequence, the BOM check, `matchProse`'s trailing-stray rule and the proof's own head.through check.
- `--verify`: the proof, pin, shape and fromDefault steps. Only validation is pinned, by the missing-R-003 test.
- Validator: never-named (R-1167's test title says "named twice or never"). Possibly equivalent because other checks catch them: duplicate node, row listed twice, heading text, proposed holds rows. Also unpinned: the mapping U+FFFD and line-break checks, and the shape checks for tail, tail.keep, from, head.through and features.
- `main` bypassing `writeLedgerAtomic`, or passing it a fresh re-read. T12's race is real for the helper only, not for `--write`.

Overall, 29 of 77 working mutations survive. Rows R-1163, R-1164, R-1167 and R-1168 are still marked implemented beyond what is pinned.

Notes
- Prior repros at 0dc5d1d are closed:
  - headcut: refused on head.through.
  - verify-droprow: `--verify` refuses with "row R-136 is missing from the mapping".
  - MUST 3 tampers (prefix stripped, sections swapped, purpose changed): caught on all three ledgers.
  - Dropped Open questions body, dropped kept line, duplicated kept section, stray appended line: caught in both modes.
  - New middle and tail tampers (prose dropped, duplicated or moved, a blank dropped, a stray fence in a node, a stray line before or after the closing heading, kept sections swapped, closing heading retyped): all caught.
- These pass both the proof and the tree check:
  - the whole tail moved before CAP-01 (region order is never checked);
  - a stray fenced block between the head and the first node (all fenced lines are pre-marked consumed);
  - a second `Purpose:` line in a node, and an extra header pair after a table;
  - any number of extra blank lines;
  - a changed CAP Outcome (check 9 does not compare outcomes).
- E1 is partly open. `tail.keep: [null]`, `also_applies: "FEAT-002"`, `rows: ["R-001–"]` and a reversed range each crash with a stack trace. Exit is 1 and nothing is written.
- E2 holds and is pinned: the merge prints `## FEAT-002 · 2. Cache and persistence -> FEAT-001`. E3 holds and is pinned. E4 holds: the skill now says a partial tree needs a hand fix or a hand-written mapping.
- `--verify` skips the mapping-file NUL, encoding, version, U+FFFD and line-break checks and the ledger's base refusals.
- Real ledgers hold:
  - Plans: work-project 6/41/2; basketball-geek (both copies) 1/9/0; trading-zone CAP-01, CAP-90, CAP-02 with FEAT-005–011 under CAP-02.
  - An independent check finds 365/171/165/197 rows byte-identical, 0 checker problems and no prose missing.
  - `--write`, commit, then `--verify HEAD~1` exit 0 on all four.
  - A hand regroup of lifted basketball-geek (a merge, 3 moved rows, a capability move, a proposed feature) writes, passes `--verify` and leaves 0 tree problems.

Scratch files are in /private/tmp/claude-501/-Users-example-nana-pi/dea1c010-278e-4392-a90f-df947a3a8b71/scratchpad/lift-mutate3-verify/:
- `tamper3.mjs`, `ident.mjs`, `idrun.sh`, `builderbug.mjs`, `shapes.mjs`
- `muts.mjs`/`mut-all.txt` and `muts2.mjs`/`mut2-out-*.txt` (mutation lists and results)
- `repos/` (id-*, regroup-outcome, gate-reach, verify-droprow, headcut)

## Mutation runner and survivor judgements

RESULT: the whole table ran at 0dc5d1d and exited 0. 57 of 59 pairs went red, there were no ANCHOR-MISS lines, and 2 survived (2/4 and 2/11). 2/4 is a new survivor, and its re-anchor is faithful. 2/11 and 2/4 are both real test gaps. 4/2 is now red: its earlier survival was caused by the runner's folder name.

**RESULT line (verbatim)**
`RESULT: 57/59 red (38 exactly their named titles, 5 with a named title green, 16 with an unnamed red), 2 survived [2/4, 2/11]`

**SURVIVED lines (verbatim). There are no ANCHOR-MISS lines.**
`GREEN 2/4 proof skips blank lines in an in-place leaf — SURVIVED; named but GREEN: "R-1163: the proof names a dropped row, a changed byte, a stripped CR, a new row-shaped line, a reordered leaf, a lost prose line, prose moved to another node, a dropped blank line and two swapped lines in an in-place leaf, and, with no mapping, a leaf's rows and a section's lines out of input order"; 0 FAIL total (1 file changed, 4 insertions(+), 1 deletion(-))`
`GREEN 2/11 proof lets an unterminated last row gain an ending — SURVIVED; named but GREEN: "R-1163: the proof names a dropped row, a changed byte, a stripped CR, a new row-shaped line, a reordered leaf, a lost prose line, prose moved to another node, a dropped blank line and two swapped lines in an in-place leaf, and, with no mapping, a leaf's rows and a section's lines out of input order"; 0 FAIL total (1 file changed, 1 insertion(+), 1 deletion(-))`

**Runner changes (copy only; the lane worktree was not touched)**
- **Scratch folder:** it is now `fs.mkdtempSync(path.join(os.tmpdir(), "lift-seat-mutate-"))`. The default tip is 0dc5d1d, and a new note (h) records the re-anchors. After the run, no scratch worktree remains in `git worktree list` and the lane status is clean.
- **2/3:** it now turns off every stray-line check the build-3 proof has. `matchProse` skips any non-matching line, between expected lines and at the end, and marks it consumed (proof :380, :384). The whole-output stray scan at :450 is `if (false)`. Result: RED.
- **2/4:** the same in-place rule (`IN_PLACE`) is now anchored on `matchProse` at :405-406, and blank lines are filtered from an in-place leaf's expected prose. Result: GREEN (SURVIVED).
- **2/5:** same anchor. In-place leaves compare sorted expected prose with the region's `{seg, idx}` entries sorted by `seg`. Result: RED.
- **2/7:** same anchor. Blank lines are filtered from a re-laid leaf's expected prose. Result: RED.
- **3/4:** `if (false && !reread.equals(provedBuf))` in `writeLedgerAtomic` (lift :673). Result: RED on T12.

I also checked whether the 2/3 change was too broad. Each half on its own still reds T6. With only the `matchProse` half, T6 fails on "prose moved to another node". With only the whole-output scan off, T6 fails on "two swapped lines".

**Survivor judgements**

**2/11 is a real gap, not equivalent.** Build 3 added a check at proof :262 that fires only when the output's last line is terminated. T6's tamper (test :340) puts the gained ending at end of file, and the T6 pattern accepts that check's message. So check 3's own refusal at :254 is never asserted.
- **Counterexample:** a gained ending followed by more output that stays unterminated. I took T6's unterminated fixture with the default mapping emitted before `--write`; the untampered output proves clean. I tampered it as `uOut + "\n\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|"`.
- **Result:** the original proof gives exactly one problem, `row R-001: output bytes differ from the input (terminator or content)`. The 2/11-mutated proof gives zero problems.
- **Missing assertion:** add this tamper to T6 and assert `/row R-001: output bytes differ from the input/`.
- **Second issue:** T6's own unterminated probe (`uMap`, test :337-340) uses the identity mapping of the already lifted ledger. Against the flat input, the untampered output already shows 4 unrelated problems, so the probe is not a single-fault test. It should emit the mapping before `--write`.

**4/2 is now RED, and its earlier survival was caused by the runner.** T25 checks the ANSI case with `named(rAnsi, 14)` (test :1119), which matches the whole word "14" anywhere on a stderr line. The old scratch sat under `…/lift-2026-10-14/work-…`, so the path itself contained "14". With the round-trip check dropped, the refusal reads `…/map-ansi.json: a string holds U+FFFD (invalid text)`, with no line number. In a path without "14", T25 fails, and this run shows it red.
- **The gap is still real:** the U+FFFD check reads only string values, never object keys. I wrote an ASCII default mapping plus one extra key `"café"` in latin1, so byte 0xE9 is the file's only non-UTF-8 byte.
- **Result:** the original refuses with `map-key.json:57: bytes are not valid UTF-8 (an ANSI or other single-byte encoding)`. The mutated code accepts it, and `--write` exits 0 and rewrites the ledger.
- **Missing assertions:** T25 should match the check's own wording at its position, `map-ansi.json:${ansiMapLine}: bytes are not valid UTF-8`, not the number anywhere on the line. T25 also needs a case where the only bad byte is in a key. The T22 helper at :959 uses the same pattern; I infer it has the same weakness but did not test it.

**2/4 (new) is a real gap.** The mutated proof does detect in-place leaves: FEAT-001 and FEAT-002 both report `__inPlace` as true, and the baseline is clean. T6's "a dropped blank line" tamper (test :316, `"fixture.\n\n# CAP"`) removes line 4, which is in the head. The head check catches it, not any leaf check, although the T6 title says "in an in-place leaf".
- **Result:** I dropped each blank line of T6's lifted output in turn. For lines 8, 12, 17, 21 and 25, the original refuses (`FEAT-001: prose from its old section(s) is missing, reordered, stray, or duplicated`, or the CAP-01/FEAT-002 variant). The 2/4-mutated proof returns zero problems.
- **Missing assertion:** drop line 17, the blank after R-002 and before `## FEAT-002`, and assert `/FEAT-001: prose from its old section\(s\) is missing/`.

**One side finding, outside this task.** I gave a ledger ending in an unterminated row a mapping with an empty capability after the last leaf. The validator accepted it, because its rule checks only the last feature or subgroup and the tail. The writer then joined the new heading onto that row's line, with no line break between them. The proof refused it, but only with the generic `row R-002 appears 0 time(s)` and not the named fix.

Files:
- Runner copy: /private/tmp/claude-501/-Users-example-nana-pi/dea1c010-278e-4392-a90f-df947a3a8b71/scratchpad/lift-mutate3/seat-mutate.mjs (original kept as seat-mutate-orig.mjs)
- Run output: /private/tmp/claude-501/-Users-example-nana-pi/dea1c010-278e-4392-a90f-df947a3a8b71/scratchpad/lift-mutate3/seat-mutate-output.txt (console in seat-mutate-console.txt)
- Survivor probes: /private/tmp/claude-501/-Users-example-nana-pi/dea1c010-278e-4392-a90f-df947a3a8b71/scratchpad/lift-mutate3/probe211b.mjs, probe24.mjs, probe42b.mjs, probe42-test.txt
