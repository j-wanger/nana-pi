# Seat's checks of build 5 (2026-10-15, at f6b34d4)

## Independent recheck

No MUSTs: no line or row is lost, duplicated, changed or invented with exit 0 at f6b34d4. One SHOULD: the adopt template's empty first-feature table is now refused (note 2).

1. **(1) Yes, lossless.** `tbl4`, `tbl4a` and `fence`: `--write` and `--verify` both exit 0, and only the heading and field lines change. `tbl4c` with no mapping writes byte-identical. Three `tbl4c` regroups (row moved into the owner-table feature, merge, CAP prose moved into a feature) all write and verify, and the owner tables are kept. A padded header, a `:--` delimiter, a `| Tests |` header and rows with no header all get the exact header, flat and tree with a mapping.
2. **(2) SHOULD: an empty requirement table under a proposed feature is now refused.** The message is "FEAT-001: prose … missing, reordered, stray, or duplicated". This is the adopt template's own shape (`p/adopt.md`, rendered with adopt=True; also `p/treepass.md`). At 9eadde0 that ledger wrote and verified with exit 0 but silently dropped the empty header and delimiter, a 2-line loss the last check missed.
   - Cause: the proof's matcher at `requirements-lift-proof.mjs:489` still drops any exact header and delimiter pair, whether or not a row follows.
   - Fix tried in a scratch copy, one line: add `&& isTableHeaderAt(regionBare, i)`. The adopt ledger then writes and verifies lossless, and 400 fuzz cases show 0 bad. None of the 49 local ledgers has this shape.
3. **(2) The other shapes are not misclassified.** A blank line before the first row is refused at both tips, so it is old and fails closed: in-place mode writes a second header and the count catches it. Fake IDs (R-01, G-1, R-0001) are carried lossless. An empty 4-column table followed by a requirement table is lossless. A fenced example containing a sample row is refused as "row inside a code fence".
4. **(3) Fuzz: 600 default lifts (566 accepted) and 600 regroups (554 accepted), 0 bad.** I updated the independent count to brief 5's next-non-blank-row rule. A second 600+600 run with extra shapes also shows 0 bad. Extra shapes: empty 4-column table, fenced header, ID-headed non-requirement table, fake IDs, padded owner table with a blank line.
5. **(3) The four real ledgers are clean.** Rows 365, 171, 165 and 197 are byte-identical. The independent count finds 0 missing, 0 extra and equal blank lines. Write, commit and `--verify` pass on all four. The outputs are byte-identical to 9eadde0's.
6. **(4) Yes, one refusal names every base problem.** yokai-world now reports only the tree-shape problem (line 1447, G-001); line 50 is exempt. `b/combo.md` names the duplicate row, the fenced row, the level-4 heading, the setext heading and both field labels in one run. `b/neartree.md` names the duplicate row, the field label and the tree shape.
7. **(4) Small regression, fails closed: `b/combo2.md` now crashes.** It has base problems plus a level-3 section with no level-2 parent. It hits a TypeError at `requirements-lift.mjs:336` instead of naming its problems; 9eadde0 named them. The default mapping builder now runs after base problems are found, which exposes that old crash. Exit is 1 and nothing is written.
8. **(4) The flat intro split is not material.** A flat ledger's intro field line is still refused, as T22 pins. With that check turned off in a scratch copy, the line is carried verbatim in the head and verifies, so the refusal is false. It still fails closed, and none of the 5 flat local ledgers has a field-labelled line.
9. **Claim most likely wrong:** that the item 2 refusal matters in practice. It depends on someone lifting a freshly adopted ledger before its first feature gets rows.

Scratch files are in `/private/tmp/claude-501/-Users-jwang-nana-pi/dea1c010-278e-4392-a90f-df947a3a8b71/scratchpad/lift-mutate5-verify/`: `fuzz5.mjs`, `fuzz-acct.mjs`, `p/`, `b/`, `treefix/` (the one-line fix). The lane worktree is untouched and clean at f6b34d4.

## Mutation runner

RESULT: 70/71 red (46 exactly their named titles, 6 with a named title green, 21 with an unnamed red), 1 survived [T3/1]

The single survivor is a real gap: the head half of the field-label exemption is not pinned, because the new test looks for the wrong line number.

**SURVIVED line (full run, verbatim):**
GREEN T3/1 the head half of the field-label exemption removed — SURVIVED; named but GREEN: "R-1167: one refusal names every base problem, and a field-labelled line in the head or tail is not one"; 0 FAIL total (1 file changed, 1 insertion(+), 1 deletion(-))

**ANCHOR-MISS:** none in the full run. The dry run before the fix had one (verbatim):
ANCHOR-MISS 5/5 Open questions becomes a feature — scripts/requirements-lift.mjs: anchor occurs 3× (want 2) — "h.level === 2 && KEPT_SECTIONS.includes(h.label)"

**Re-anchor:**
- 5/5: anchor narrowed to `(h) => h.level === 2 && KEPT_SECTIONS.includes(h.label)`, times 2. That hits the same two default-mapping sites as before (lift :273, :340). Build 5's new `structuralTailLines` (lift :234) uses the same filter text and is deliberately left unmutated. 5/5 went RED on its named title.

**New pairs, all at tip f6b34d4, all on `requirements-lift.test.mjs`:**
- T1: `isTableHeaderAt` returns true in both lift and proof. RED on its title. The split variants T1/1 (lift only) and T1/2 (proof only) are also each RED on it.
- T2: base refusals are printed alone and return before the later stage again. RED on its title.
- T3: the whole exemption line is removed. RED on its title, through the tail check only.
- T3/1: head half removed. SURVIVED.
- T3/2: tail half removed. RED.
- T4/1 to T4/4: `--verify`'s mapping-blob NUL (:991), encoding (:993), JSON (:996) and version (:998) refusals, one pair each. All four RED on the extended R-1168 title, each with 1 FAIL total.

**Judgement on T3/1:** it is not an equivalent mutant; the test is wrong.
- `requirements-lift.test.mjs:1539` checks `/line 2: carried prose starts with a field label/`. The fixture's `Purpose:` intro line is line 3 ("# fixture requirements", "", "Purpose: …").
- T3's FAIL detail shows the lift printing `line 3: carried prose starts with a field label ("Purpose:")` while reporting `noHeadField=true`. So the head check can never fail.
- Fix: match `line 3:` or `("Purpose:")` in that check. Until then, the head half of the exemption is unpinned and the R-1167 title overclaims on "head".

**Other non-exact REDs worth a look:**
- 3/10 crashed the test file with ENOENT before its named title (T31) ran. It still counts as RED.
- 5/1 reds unnamed titles only; its named title was not reached.

The lane worktree is untouched (`git status` clean), and the scratch worktree was removed.

Files:
- /private/tmp/claude-501/-Users-jwang-nana-pi/dea1c010-278e-4392-a90f-df947a3a8b71/scratchpad/lift-mutate5/seat-mutate.mjs (edited copy, with DECLARED (j) recording the build 5 changes)
- /private/tmp/claude-501/-Users-jwang-nana-pi/dea1c010-278e-4392-a90f-df947a3a8b71/scratchpad/lift-mutate5/run.txt (full run log)
- /private/tmp/claude-501/-Users-jwang-nana-pi/dea1c010-278e-4392-a90f-df947a3a8b71/scratchpad/lift-mutate5/logs/ (per-pair test output)
- /private/tmp/claude-501/-Users-jwang-nana-pi/dea1c010-278e-4392-a90f-df947a3a8b71/scratchpad/lift-mutate5/dry1.txt, dry2.txt (dry runs before and after the edits)
