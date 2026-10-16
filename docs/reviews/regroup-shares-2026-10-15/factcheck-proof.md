# Fact-check: the proof design in plan-shares/CHANGE.md (seat draft 1)

*Adversarial check of §3 and §5 at `e451c90`. Bare `:n` = `scripts/requirements-lift.mjs`, `proof:` = `scripts/requirements-lift-proof.mjs`, `tree:` =
`scripts/requirements-tree.mjs`. Ran = run here on scratch fixtures (`plan-shares/probe/`); INFERRED = reasoned from the read code and the plan, not run.*

**Verdict: SEND-BACK, one MUST and two SHOULDs.** The recount (§3.4b) is the right idea. But the plan has three share readers that disagree on a real
shape (Ran), and the test plan does not pin the recount's independence from `also_applies`. Every plan cite I checked holds.

## Top three

**1. MUST: the three share readers disagree, so a share can be lost or invented with exit 0.** The plan's own "claim most likely wrong" is already false (Ran).
- Fixture `probe/fence/REQUIREMENTS.md` puts a fenced block, then `---`, then `Also applies: R-001` after FEAT-002's table. The tree parser registers a plain
  setext heading at the fence closer (line 25). tree:52 has no fenced-previous-line guard, but the lift's copy has one (:86), and so does the proof's (proof:62).
- Ran: `parseLedger` gives FEAT-002 `alsoApplies: []`, and `checkTree` finds 0 problems: it is a passing tree. Today's lift refuses only line 27 (:226). It
  raises no setext refusal for line 25 (:199), so the lift sees no heading there.
- After the plan (INFERRED), line 27 is FEAT-002's first share line to the lift's finder and to the proof's `shareLineAt`, but not to the tree parser. The
  outcome depends on which reader each step uses, and the plan does not say:
  - (a) Carried comes from the finders, and the owner's mapping sets `also_applies: ["R-001"]` (an agent reading the text would). The line is kept and moved
    up, the output tree gains a share, the recount agrees with `shareLineAt`, and the run exits 0. No share line is printed: **invented**.
  - (b) Carried comes from `parseLedger` (empty), so the feature is regenerated with no line. `sectionBody` still skips line 27 (field block, :674/:683), and
    the proof sets the same line aside (§3.4c) and skips it in (a). The recount reads {} = {}, and the run exits 0: **line silently lost**.
  - (c) Identity run, with Carried from the lift's finder: refused, telling the owner to "declare it in shares_dropped" for a share the tree checker says
    does not exist.
- Fix (a subtraction): delete both new finders. A share line is exactly `parseLedger(...).headings[FEAT].alsoAppliesLines[0]`. The lift already passes
  `parsed` into `baseRefusals` (:911, :1064, :1070), and the proof already imports `parseLedger` (proof:13). R-1163 bars only lift-module imports. Every
  other `Also applies:` line stays refused at :226. Add the fence-closer-then-`---` shape to T1 and T7.

**2. SHOULD: the recount's independence from `also_applies` is not pinned for the declared-drop case.** The design already handles "a declared drop that
also drops an undeclared one": the validator names it (§3.2), and recount (b) reads the input and the declarations. The verification does not pin it.
- A feature that declares a key is regenerated, so (c) sets its lines aside on both sides (§3.4c). Recount (b) is then the proof's only guard on that
  feature's shares.
- The mutation table reds "recount skipped" only through T4's moved-line tamper (§5 row 2). Every other T4 tamper hits a kept feature, where (c) catches it.
- No tamper runs `applyMapping` and `proveLift` on a feature that declares `shares_dropped: [R-021]` and also loses R-022 from `also_applies`. No pair mutates
  "recount reads `also_applies`", which is the exact bug §3.4's first sentence rules out.
- A Sonnet build that computes the recount from `also_applies`, plus any validator slip, ships a lost share at exit 0. Add that T4 tamper, and add the pair
  "recount derives expected from `also_applies`" so that it reds the tamper.

**3. SHOULD: an unterminated last share line breaks R-1181's byte copy.** This shape is in the threat model: a share line after its table, on a file with no
final newline.
- Ran: `probe/unterm/REQUIREMENTS.md` ends with `Also applies: R-001` and no line ending. It is a passing tree (0 problems), and today's lift refuses line 23.
- INFERRED after the plan: the kept segment has no `\n` (:47-51) and moves above the body. It eats the next segment's ending, or glues onto the table
  header (:763 joins the segments raw).
- The run fails closed with misleading problems: FEAT-002's prose is missing (proof:494), the last line gains an ending (proof:317), and line accounting
  reports 1 missing and 1 extra. The identity of a passing tree exits 1, and R-1181's "line ending included" cannot hold.
- Fix: refuse, naming the line and "end the file with a line break first", as the unterminated-row rule does (:357-364, :564-582). Put the refusal in
  R-1167 and in a T7 case.

## The asked scenarios (exit 0 reachable only through issues 1 and 2)
| Case | Result | Why |
|---|---|---|
| Share line in the field block or in the body | Holds, apart from issue 1 | Both are the tree's first share line in the span (tree:94-97); a kept body line moves up, bytes kept (S5) |
| CRLF or mixed endings | Holds | A kept copy keeps its raw segment, and (c) compares raw segments (proof:597-600). A regenerated line uses the first line's ending (:712) and is set aside |
| A share naming a range | Fails closed | tree:97 never expands a range, and tree:198 says "does not exist", so the input tree check (:945) or proof check 7 refuses. Gap: the shape of the new keys is unstated. Reusing `checkRows` (:426-437) admits ranges, so refuse ranges in all three keys |
| A share to a row the mapping moves | Holds | A move into the feature or its subgroup reads "is homed in this feature" (tree:178-179, :201) until a drop is declared. IDs are stable and rows byte-identical (proof:300-311), so no share points at a wrong row |
| A merge of two features that share the same row | Holds, late | The union gives {R-9}. An agent that joins both lists gets `["R-9","R-9"]`. That passes the set validator (§3.2), the writer writes it (:740), and the run dies at tree:199 after the plan prints. The validator should refuse repeats |
| A declared drop that also drops an undeclared one | Holds in design, unpinned | See issue 2 |
| A share line under a plain `## Open questions` named into a feature | Holds | Exempt at :224 and :235. It lands in the feature's span and is caught by recount (b), because the tree unions every line, and by tree:187 |

## Guarantees the lift already pins
- **Rows byte-identical:** kept. Check 3 (proof:300-311) is untouched, and no share path rewrites a row segment (INFERRED from :716-727).
- **Input-derived line count:** kept for kept lines. A regenerated feature's lines leave the byte count and rest on the set recount (S7). The recount's input
  derivation is now load-bearing, which is why issue 2 matters.
- **Worktree scan:** untouched (:826-850; §3.6 lists the git gate).

## Lower findings
- §6 says "the plan prints each one", but S3 moves a share to another feature on a merge or demotion with no share line. T6 asserts none is printed. Only
  `detectMoves`'s merge line shows it (:619). Say so in §6, or print the transfer.
- "Declares neither key" is undefined for `shares_added: []`. If a present key counts, the feature is regenerated: its bytes are rewritten and nothing is printed. Define it as "non-empty".
- R-1183 says "neither `--write` nor `--verify`", but the plan block also prints under `--write` (:966-980). Narrow the row or extend it.
- The summary counts kept share lines as "inserted" and not as carried prose, because (a) shrinks `expected` (proof:495, :610). §6 S6 calls the summary unchanged.

## Cites checked (all hold)
:160-173, :226, :383, :438-441, :453, :532-536, :674, :683, :740, :756, :978-980, :1095-1099; proof:98-111, :410, :430-452, :489, :540-608;
tree:84-97, :187, :194-205; test:1386 (the T22b title).
