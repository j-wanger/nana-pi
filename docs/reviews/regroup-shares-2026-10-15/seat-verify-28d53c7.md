# Seat's checks of build 1 (2026-10-16, at 28d53c7)

MUST 1 (R-1182; this fails the build's own mutation gate, it does not change ledger behaviour): R-1182's clause "never from `also_applies`" is not pinned. Repro: in `scripts/requirements-lift-proof.mjs` recount 6b, change `new Set(wantedSharesOf(node, shareInfo))` to `new Set(node.also_applies ?? [])`. `requirements-lift.test.mjs` then exits 0 with every title PASS, so §5 row 2's pair "recount derives expected from `also_applies`" survives. Cause: T4's third tamper sets `f2.also_applies = ["R-001","R-005"]`. §5 requires that `also_applies` also lack the lost share. Fix: use `["R-001"]` there, so only the recount from declarations can name R-005.
MUST 2 (R-1167/T8; same class): T8's matchers also accept the wording from the proof and the tree check, not only the validator's, against §5's "T8 asserts the validator's own wording". Three §5 row-3 pairs survive with the suite green, each made by turning one validator check into `if (false)`: "an add it already carries" (`if (carried.includes(a))`), "an add of an unknown row" (`else if (!realRowIds.has(a))`) and "sharing heading named by the tail" (the `tail: names old feature heading` push). The command line still exits 1 in all three, because the proof or tree check refuses, so no ledger is harmed. But the gate needs every pair red, and R-1167 is marked implemented while these three clauses are unpinned.
No exit-0 lost, duplicated, retargeted or invented share was found, and no non-first `Also applies:` line was accepted:
- 34 hand probes. Placements: before Purpose, between Purpose and Status, after the table with and without a blank, fenced, head, kept section, closing heading, capability, subgroup, a second line, under a fence closer underlined by `---`, HTML comment, indented, lone CR, CR-CR-LF, CRLF+BOM, tab, empty line, trailing comma, unterminated. Regroups: merge, a merged pair sharing one row, demote, swapped IDs, a shared row moved into the feature that shares it, drops and adds, a declared drop hiding an undeclared one, empty arrays, repeats in all three keys. Each run either exited 0 with shares matching my own reader and the kept bytes, or exited 1 naming the problem, through the dry run, `--write` and `--verify`.
- Fuzz: 600 random lifts and regroups over two seeds. 546 exited 0 with 0 mismatches against my own reader, and 1,149 kept lines were byte-checked. All 54 refusals were for expected reasons (a forgotten declaration, or a share left on its own feature's row).
- nana-pi copy, A1 (identity, 22 G rows moved to SUB-900–904 as 5/8/3/3/3): dry run and `--write` exit 0. The diff is 78 lines (55+/23-). All 31 share lines are byte-equal and in order, the tree check finds 0 problems, and FEAT-028/029/032 keep their G shares.
- A2: `--emit-mapping`, then the identity `--mapping` dry run with no move or share line, then `--write` (cmp equal), then `--verify` with and without the mapping all exit 0.
- Earlier lift guarantees: I reran 35 of the lift's own mutation pairs on 28d53c7 in a scratch copy (1/1–1/8, 2/1–2/12, M, 3/4, 3/5, 3/11, 4/1, 4/9–4/11, 4/14, 4/17, T1, T3, E1, W1, U1). 35 of 35 went red and none survived. The four pairs where a named title stays green (1/5, 1/7, 1/8, 2/9) did the same in the lift's own run.
- My versions of this lane's §5 pairs: 21 went red (recount skipped; accounting sets aside all or none; kept test ignores declarations; demote or merge loses shares; kept line re-ended; share line kept as prose; plan lines omitted, extra or late; validator undeclared drop, drop not carried, capability; fenced, head, second or unterminated line accepted; identity stops writing `also_applies`). The 4 survivors are the ones in the MUSTs.
- Rows: R-1181 (amended, one `shall`), R-1182 and R-1183 match §2 exactly and sit right after R-1168. R-1167 equals the base plus §2's two clause edits. The lift suite shows 63 PASS, the tree suite passes, and R-291 reads 1,139.
- Note: with two input features sharing one ID, both lift and proof look shares up by ID, so the last one's shares count for both. Validator messages then mislead, but the line accounting gave exit 1 in every combination I tried.
- Note (pre-existing kind of false refusal): a `---` or `===` line right under a feature heading turns the moved share line into a setext heading. Status already does the same today. The run exits 1, so nothing passes silently.
Files are in /private/tmp/claude-501/-Users-example-nana-pi/dea1c010-278e-4392-a90f-df947a3a8b71/scratchpad/shares-mutate-verify/: `nm/run.mjs` and `nm/*.log` (this lane's pairs), `mut/out-{a,b,c}.txt` (rerun lift pairs), `fuzz/fuzz.mjs`, `adv/p1.mjs`, `adv/p2.mjs`, `a1/a1.mjs`.

---

RESULT: 31/36 red (23 exactly their named titles, 2 with a named title or case green, 6 with an unnamed red), 5 survived [2/2, 3/4, 3/5, 3/7, B2/2], 2 skipped (second lander)

The run exited 0. Both baselines were green: the lift tests had 63 PASS and the tree tests had 89 PASS. Every anchor applied. The scratch worktree is gone, and the lane worktree is still clean at 28d53c7.

**SURVIVED lines (verbatim)**
```
GREEN 2/2 proof: recount derives expected from also_applies — SURVIVED; FAIL detail names 0/1 expected cases (GREEN: "share lost beside a declared drop"); named but GREEN: T4; 0 FAIL total (1 file changed, 1 insertion(+), 1 deletion(-))
GREEN 3/4 validator accepts an add it carries — SURVIVED; FAIL detail names 0/1 expected cases (GREEN: "a declared add it already carries"); named but GREEN: T8; 0 FAIL total (1 file changed, 1 insertion(+), 1 deletion(-))
GREEN 3/5 validator accepts an add of an unknown row — SURVIVED; FAIL detail names 0/1 expected cases (GREEN: "a declared add of an unknown row"); named but GREEN: T8; 0 FAIL total (1 file changed, 1 insertion(+), 1 deletion(-))
GREEN 3/7 validator accepts a sharing heading in the tail — SURVIVED; FAIL detail names 0/1 expected cases (GREEN: "a sharing feature heading named by the tail"); named but GREEN: T8; 0 FAIL total (1 file changed, 1 insertion(+), 1 deletion(-))
GREEN B2/2 validator accepts a repeated ID in shares_added — SURVIVED; FAIL detail names 0/1 expected cases (GREEN: "a repeated ID in shares_added"); named but GREEN: T8; 0 FAIL total (1 file changed, 1 deletion(-))
```
**ANCHOR-MISS lines:** none.

**Why the five survived.** The test is too weak in each case; the code is not wrong. I confirmed this by running each mutant on a copy of the tip and reading its dry-run error output.
- **2/2:** T4's "share lost beside a declared drop" changes only the output (test:1432). Its mapping's `also_applies` is the honest `["R-001","R-005"]` (test:1416). So a recount built from `also_applies` still names R-005 at test:1457. §5 says that tamper's `also_applies` must also lack the share, and the test does not build it that way.
- **3/4 and B2/2:** the proof's tree check still refuses, saying `FEAT-002 Also applies: R-001 is listed more than once` (B2/2: `FEAT-001 … R-002 …`). T8's checks at test:1618 and test:1624 only look for the feature and row ID, so they accept that message.
- **3/5:** the tree check refuses with `FEAT-001 Also applies: R-999 does not exist`, which test:1619's check accepts.
- **3/7:** the proof refuses with `tail: prose from its old section(s) is missing…`, which matches test:1621's `/tail/i`.
- So §5's claim that "T8 asserts the validator's own wording" does not hold for test:1618, 1619, 1621 and 1624.

**Pairs that red, but not exactly what §5 names**
- **1/2:** T5 is named but stays green. T5 calls `applyMapping` and `proveLift` directly and never reaches the base refusals.
- **2/1:** "kept line moved to another feature" stays green, because the line accounting catches it. The pair reds T4 through the undeclared drop, the undeclared add and the share lost beside a declared drop.
- **Unnamed reds:**
  - 1/4: T2, T5, T6. The no-space line `R-001,R-004` is regenerated as `R-001, R-004`, and the proof's accounting catches it.
  - 1/5: T2, T6, through the demote fixture's CRLF line.
  - 1/6 and 1/7: T6, which has its own merge and demote cases.
  - 1/8: T4, T6.
  - 2/4: T4, because T4's control case is regenerated.
- These suggest §5's named sets are too narrow. They do not show bad mutations.

**Declared corrections** (printed as DECLARED lines in the output file)
- (a) Each "/"-separated variant runs alone as "row/k". 32 of §5's 34 pairs run. Row 6's two are skipped because `scripts/requirements-regroup.mjs` is absent at merge-base e451c90.
- (b) 1/1: a fence-aware finder on the lift side replaces `parseLedger`'s first share line in both `shareLineRefusals` and the lift's `shareInfoOf`.
- (c) 1/2 puts back the base's `Also applies` field-label refusal.
- (d) 1/3: I read "each test built from an emitted identity" as T2, T3 and T6, plus T1. I left out T4 and T5 (they call the functions directly) and T8 (its cases are refusals either way).
- (e) 1/6 and 1/7 edit only the lift's shared carry helpers. The proof's copies are untouched.
- (f) 1/8 and B1 edit only the writer's kept test in `shareLineFor`.
- (g) Row 2 edits only the proof (exact edits listed in the file).
- (h) Row 3's refusal pairs edit `shareLineRefusals`. The validator pairs each disable one push.
- (i) 4/3 prints "FEAT: share R added" for each share a merged feature carries that its first source lacks. 4/4 moves the share loop after the summary line.
- (j) 5/1 adds R-1184 to R-1186 after R-1183 and regenerates the outline with `node scripts/requirements-tree.mjs --write`.
- (k) The brief's two clarifications became pairs:
  - B1: an empty `shares_added: []` or `shares_dropped: []` is read as a change.
  - B2/1 to B2/3: the validator accepts a repeated ID in each of the three lists.
- (l) Where §5 names a case in parentheses, and for every row-3 and B2 pair, the targeted case label must appear in T4's, T7's or T8's own FAIL detail.

**Code that contradicts a row**
- No behaviour I read contradicts R-1167 or R-1181 to R-1183.
- Two comments still say shares are refused in every ledger form, which contradicts R-1181 and R-1167's reworded clause. §4 put those comments in scope.
  - `/Users/example/nana-pi-wt/regroup-shares/scripts/requirements-lift.mjs:155-157` (the comment above `fieldBlockAt`)
  - `/Users/example/nana-pi-wt/regroup-shares/scripts/requirements-lift.mjs:1199-1200` (in the verify path)
- The code refuses a repeated ID in the share lists (`shareProblems`' repeat check, lift :674 and :683-685), but R-1167's text does not list that refusal. This is a gap in the row rather than a contradiction.

Files are in `/private/tmp/claude-501/-Users-example-nana-pi/dea1c010-278e-4392-a90f-df947a3a8b71/scratchpad/shares-mutate/`:
- `seat-mutate.mjs` (the runner)
- `seat-mutate-output.txt` (full output)
- `logs/` (each pair's test output)
- `verify/why.mjs` (the cause check for the survivors)
