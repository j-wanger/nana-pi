# Change declaration — regroup-shares: the lift carries each feature's `Also applies:` line, changes one only where the mapping declares it, and proves the count

*Lane `regroup-shares` · `feat/regroup-shares` · `~/nana-pi-wt/regroup-shares`, from `main` `e451c90` (lift landed) · 2026-10-15 · seat draft 2 (two fact-checks folded in, last
section), not reviewed. Rows: R-1181 to R-1183 in FEAT-028 after R-1168 (held for this lane by the regroup plan, `~/nana-pi-wt/regroup/docs/reviews/regroup-2026-10-15/CHANGE.md`
at `1066464`, `:4`, `:56-58`); R-1167 reworded; no tree change. Class GATE (it changes what the lift may write into another project's contract file): two plan-review rounds.
Builder: Sonnet (riskier lane, `HANDOFF.md:25`). No `packages/nana-setup/` or hook change, so no install check. Stakes: high blast, reversible by revert but silent without a
proof — a dropped share loses no row, only a blast-radius link no checker can see missing. Evidence: the regroup corpus's `research-lift-api.md` (A); this seat's probe on a
ledger copy (scratch `plan-shares/base-dry.*`); the fact-checks `plan-shares/factcheck-repo.md` and `factcheck-proof.md`. Cites at `e451c90`: bare `:n` =
`scripts/requirements-lift.mjs`; `proof:` = `scripts/requirements-lift-proof.mjs`; `tree:` = `scripts/requirements-tree.mjs`; `test:` =
`packages/nana-pack/tests/requirements-lift.test.mjs`; regroup `:n` = the regroup plan at `1066464`. "Ran" = run on a copy; INFERRED = not read or run.*

## 1. Why

Jake, 2026-10-10 (`docs/reviews/req-tree-2026-10-09/CHANGE-B.md:10-13`): "we should allow multiple features pointing to the same requirements, those requirements are potentially
high impact high blast radius". Jake, 2026-10-14: the lift is the tool, an agent's regroup with his approval gives the real tree (`HANDOFF.md:29`).
- **The gap.** `baseRefusals` refuses every unfenced `Also applies:` line outside a field block, the head and the tail (`:221-226`), and neither `fieldBlockAt` copy holds one
  (`:160-173`, proof:98-111). T22b pins the refusal in six modes (test:1303-1388). Ran today: the dry run on a copy of nana-pi's ledger exits 1 with 31 problem lines, every one
  a share line (`line 84` first). Ran (fact-check): a share line in the head or under `## Open questions` exits 0 today, carried as prose.
- **Why a proof, not just a carry.** A share names the rows a feature depends on (`REQUIREMENTS.md:24-25`); the tree check sees a bad share, never a missing one (tree:194-205).
  A §5c Ran: with the refusal lifted and no recount, a mapping that omitted FEAT-001's eight shares exited 0, proved clean and printed nothing.
- **Users.** nana-pi only. aml-desk, basketball-geek, trading-zone and yokai-world hold no `Also applies:` text at all (grep on their working copies today; regroup `:22-23`).
  nana-pi's own lift has a second blocker this lane leaves alone: its 22 G rows sit in FEAT-033, and the validator demands each in its seed subgroup (`:532-536`; A §3, Ran).
  This lane moves them only on a copy, as A1's precondition; nana-pi's ledger is not changed. Where they go is a later lane's question (regroup residual 7, `:237-238`).

**Threat model.** In scope: honest variation in our tools' output and users' files — a share line with no space after a comma, CRLF or mixed endings, a share line after its
feature's table (the tree parser accepts it, tree:84-97), a fenced, head, kept-section or closing-heading line starting `Also applies:`, a fence closer underlined by `---` above
a share line, a share line ending the file with no line break, an agent's mapping that forgets `also_applies`, merges, a feature demoted to a subgroup, a row moved into the
feature that shares it, a stale mapping. Out: deliberate forgery — a mapping or ledger built to fool the proof, a lying git.

## 2. Requirement delta

R-1181 to R-1183 are held by the regroup plan (regroup `:56-58`) and appear nowhere at HEAD (regroup `:39`; seat grep at `e451c90`: 0 hits). One `shall` per row; each starts `planned`.

| ID | Change | Text |
|---|---|---|
| R-1181 | added, FEAT-028 after R-1168 | WHEN the lift applies a mapping, it shall write after each feature's `Status:` line one `Also applies:` line holding the shares, as the tree parser reads them, of the old feature headings that the feature and its subgroups name, less its `shares_dropped` and plus its `shares_added`, or no line when none remain, copying the old line byte-identical, line ending included, when that line is the feature's only source of shares and the feature declares no change. |
| R-1182 | added, FEAT-028 | The lift's proof shall fail when an output feature's shares differ from those its named old feature headings carry in the input less its declared `shares_dropped` plus its declared `shares_added`, each side read as the tree parser reads it and never from `also_applies`, or when its line accounting, which counts each copied share line as a carried input line, finds one missing, changed or added. |
| R-1183 | added, FEAT-028 | WHEN run with `--mapping <file>` and neither `--write` nor `--verify`, the lift shall print before the proof line one line per share a feature's `shares_added` or `shares_dropped` declares, naming the feature, the row and `added` or `dropped`, and no line for a share carried unchanged. |
| R-1167 | reworded | Two clauses change; the rest stays byte for byte (`REQUIREMENTS.md:1347`). |

**R-1167 diff.** Ledger clause: `an \`Also applies:\` line,` → `an \`Also applies:\` line, fenced, head and tail lines included, other than a feature heading's first as the tree
parser reads it, or that first line with no line ending,`. Mapping clause, inserted before `or a row under a \`proposed\` or \`retired\` feature`: `a feature whose \`also_applies\`
differs from the shares it carries less its \`shares_dropped\` plus its \`shares_added\`, a dropped share it does not carry, an added share it already carries or that names no row,
an old feature heading with shares named by a capability or the tail,`. The ledger clause says exactly what §3.1's code refuses. Evidence: T22b's title leaves (its six modes now
lift or refuse under T7 and T8); T7 and T8 join. T22 keeps its title and stays green: a flat ledger has no feature heading, so its share line is still refused, and T22 asserts
the line number, not the wording (test:1299). Leaf total 1,136 → **1,139** (`requirements-tree.test.mjs:40`); **1,151** once the regroup lane's 12 rows land too (regroup `:58`).

## 3. Design

**3.1 Which line is a share line: one reader.** A feature's share line is exactly `parseLedger(text)`'s FEAT heading `alsoAppliesLines[0]` (tree:84-97): the first unfenced
`Also applies:` line in the heading's span, which runs to the next heading the tree parser sees. Neither the lift nor the proof adds a finder. The lift already passes
`parseLedger`'s result into `baseRefusals` (`:907`, `:911`, `:1067`, `:1073`), and the proof imports `parseLedger` (proof:13); R-1163 bars only the lift module from the proof.
- **Lift:** `baseRefusals` checks `Also applies:` lines before its fence (`:221`) and head/tail (`:224`) skips. It refuses every one that is not some feature heading's
  `alsoAppliesLines[0]`: `line N: "Also applies:" is not a feature heading's first share line as the tree checker reads it`. So a fenced, head, kept-section, closing-heading,
  subgroup, capability or second line is refused, and every line in a flat ledger. An accepted line with no line ending is refused too: `line N: the share line has no line
  ending (end the file with a line break first)`, as the unterminated-row rule words it (`:357-364`, `:564-582`). `sectionBody` (`:674`, `:683`) skips the accepted line.
- **Proof:** reads the same `alsoAppliesLines[0]` on both sides; no `shareLineAt`. Its `fieldBlockAt` (proof:98-111) is unchanged, so the accounting counts the line (§3.4c).
- **Why one reader (Ran, `probe/fence`).** A fence closer underlined by `---` is a plain setext heading to the tree parser (tree:52 has no fenced-previous-line guard), but not
  to the lift (`:86`) or the proof (proof:62). A share line under it belongs to no feature for the tree checker, which passes the file. Two finders let that share be invented
  or lost at exit 0; one reader refuses it. Other lines that mention `Also applies:` mid-line (nana-pi's 25, 53, 1334, 1347) start no line and stay prose.

**3.2 The mapping declares every change.** Two optional keys per feature, arrays of row IDs, shape-checked beside `also_applies` (`:438-441`, `:453`). Values illustrative;
lines at `e451c90`:
```json
{ "id": "FEAT-005", "status": "active", "also_applies": ["R-641", "R-781"], "shares_added": ["R-781"], "from": [{ "line": 291, "heading": "## FEAT-005 · Communicate decisions clearly" }], … }
{ "id": "FEAT-033", "status": "active", "shares_dropped": ["R-756"], "from": [{ "line": 1535, "heading": "## FEAT-033 · Adopt explicit engineering standards" }], … }
```
- `also_applies` stays the result: the identity writes it (`:383`), and the regroup lane reads it. `lift` stays 1, so a mapping without the keys behaves as today.
- **Carried(F)** = the share IDs of the old feature headings named in F's `from` and in its subgroups' `from`, first seen first, with no repeats. A merge carries the union; a
  demoted feature's shares go to the feature holding its subgroup (A §8 case 1).
- **Validator (R-1167).** `also_applies`, as a set, must equal carried less `shares_dropped` plus `shares_added`. Each missing share is one problem: `FEAT-001: share R-021
  (line 84) is missing from also_applies; declare it in shares_dropped`. Each extra one reads `…declare it in shares_added`. A dropped share must be carried. An added share
  must be a ledger row that is not carried. An old feature heading with a share line named by a capability or `tail.from` is refused, naming its line. Under a capability
  its share line would vanish. The tail copies its lines verbatim (`:756`), which the proof's tail prose match already refuses; the validator names the cause first.
- **No implicit drop.** A row moved into the feature that shares it fails the tree check ("is homed in this feature", tree:201) until the mapping declares the drop (A §5c Ran).

**3.3 The writer (R-1181).** At `:740`, a feature is **kept** when it has exactly one source share line and declares neither key. A kept feature gets that line's raw
segment, its own bytes and ending. Any other feature gets the line generated from `also_applies` with the input's first line ending (lift S10), or no line when it is empty.
A kept line that sat after its table in the input moves up to the field lines, bytes unchanged. nana-pi's 31 lines all sit right after `Status:` (census, `factcheck-repo.md`),
so its identity moves none.

**3.4 The proof (R-1182).** Three edits read the input and the mapping's declarations, never `also_applies`, and take each share line from `parseLedger` (§3.1), so a writer
bug cannot pass by agreeing with the mapping:
- (a) `expectedProseFor` (proof:430-452) skips an old feature heading's share line, as it skips its field block. Today the output's region loop drops share lines from prose
  (proof:489) while the expectation keeps them: the in-place mismatch.
- (b) **Recount.** For each mapping feature, the output feature's shares, read by the tree parser, equal carried less the declared drops plus the declared adds, as a set.
  The problem names the feature and each missing and extra ID. On a regenerated feature, (b) is the only guard: (c) sets its lines aside.
- (c) **Accounting** (proof:540-608). A share line stays a counted line on both sides, so a kept line must reappear byte for byte, like any carried line. Only a regenerated
  feature's source lines (input side) and its new line (output side) are set aside. So an undeclared drop reads "1 missing", an undeclared add "1 unaccounted extra". A
  sharing heading under a capability loses its line, and that reads "1 missing" too. A separate landing check would duplicate (c), so there is none (subtraction).
- **Existence** is already proof check 7: an added share naming no row fails the tree check's "does not exist" (proof:410; tree:198). No new code. A §5b's heading-tuple
  edit is not needed either: (b) covers it from the input.

**3.5 The plan (R-1183).** After the move lines (`:978`), before the proof line (`:980`): `FEAT-005: share R-781 added`, `FEAT-033: share R-756 dropped`, in mapping order. A
failing proof still prints them, then exits 1, as move lines do. `--verify` runs the same validator, apply and proof (`:1095-1099`), so it needs no change of its own.

**3.6 What NOT to do.** No change to the tree checker (its fence-closer setext heading stays, residual 6), the G-row rule (`:532-536`), the default mapping (flat ledgers still
refuse shares), the git gate, `MAPPING_FORMAT`, the proof's summary line, the requirements skill (neither plan names the new keys there yet, residual 4), `packages/nana-setup/**`,
nana-pi's own ledger beyond §2's rows, or any other project. No automatic drop; no share inferred from row moves.

## 4. Scope

**In.** `scripts/requirements-lift.mjs`: `baseRefusals`' share check over `parsed` (§3.1), two shape keys, the validator's share checks, the writer's kept copy, the plan's
share lines, and the code comments that say shares are refused. `scripts/requirements-lift-proof.mjs`: §3.4 (a) to (c) over `parseLedger`'s share lines.
`requirements-lift.test.mjs` (T1 to T8; T22b removed); `requirements-tree.test.mjs` (T9). `REQUIREMENTS.md` (three rows, R-1167), regenerated `docs/requirements-tree.md` and
`docs/code-map.md`, `HANDOFF.md:63`'s share sentence, `docs/sessions/2026-10.md`, and the corpus `docs/reviews/regroup-shares-2026-10-15/` (`seat-titles.mjs` lists T22b's title
as GONE). If this lane lands second: `scripts/requirements-regroup.mjs`'s `PROPOSAL_KEYS` and `requirements-regroup.test.mjs` (T10).
**NOT.** §3.6; nana-pi's own regroup; where nana-pi's G rows go; downstream ledgers.
**Overlap.** The regroup lane (12 rows) edits `detectMoves` and the plan loop (`:605-635`, `:978`), `requirements-lift.test.mjs`, FEAT-028's table and the R-291 literal
(regroup `:143-144`). Whichever lands second merges main, puts its FEAT-028 rows after the other's, sets the literal to **1,151**, and re-runs both suites. The regroup checker
refuses a key outside its level's `PROPOSAL_KEYS` (R-1177; regroup `:50`, `:104-105`). So the second lander also adds `shares_added` and `shares_dropped` to the feature level
and writes T10: this lane if regroup has landed, else the regroup lane's merge, with T10's title verbatim. `~/nana-pi-wt/land` is stale and outside both.

## 5. Verification

Exact titles under `// req:` lines, red before the code, frozen in `seat-titles.mjs` (DONE = `0 missing`). Fixtures are built in each test; nana-pi's live ledger never enters
the suite. Git repos are temp folders pinning `core.autocrlf=false`. **`requirements-lift.test.mjs`:**
- T1 · `// req: R-1181` · `R-1181: the identity mapping of a tree-form ledger with shares writes each Also applies line byte-identical, LF, CRLF, mixed-ending, BOM and no-space lists included, and a line after its table moves up with its bytes kept`
- T2 · `// req: R-1181` · `R-1181: a feature merged with another, or demoted to a subgroup, carries the shares of every old feature heading it names to the feature that holds it`
- T3 · `// req: R-1181` · `R-1181: --write lifts a committed ledger with shares through a committed mapping that declares a drop and an add, and --verify with --mapping passes it`
- T4 · `// req: R-1182` · `R-1182: the proof names an undeclared dropped share, an undeclared added share, a share lost beside a declared drop, a changed byte in a kept share line, a kept line moved to another feature, a kept line copied under a capability and an added share naming no input row`
  (seven tampers through `applyMapping` and `proveLift` directly, as the lift's T6; the true output gives none. The third: FEAT-001 declares `shares_dropped: ["R-021"]` and its
  `also_applies` also lacks R-022, so the feature is regenerated and only recount (b) can name R-022.)
- T5 · `// req: R-1182` · `R-1182: a declared drop and a declared add prove, and a row moved into the feature that shares it proves only with that share declared dropped`
- T6 · `// req: R-1183` · `R-1183: a mapping's dry run prints one line per declared added or dropped share before the proof line, and none for a kept, merged or demoted feature's shares`
- T7 · `// req: R-1167` · `R-1167: an Also applies line that is not a feature heading's first as the tree checker reads it (a second one, one under a capability or subgroup, in the head, a kept section or the closing heading's span, a fenced one, one under a fence closer underlined by ---) and a share line with no line ending are refused naming the line in the dry run, --emit-mapping, --write and --verify`
  (shapes: `probe/fence` from `factcheck-proof.md`; `fc/ht-head` and `fc/ht-tail` from `factcheck-repo.md` W1; `probe/unterm`. T7 asserts §3.1's two new wordings, so every
  case is red at HEAD: the head, tail and fenced lines exit 0 there, and the rest are refused with the old wording.)
- T8 · `// req: R-1167` · `R-1167: a mapping that drops or adds a share without declaring it, declares a drop it does not carry or an add it carries or of an unknown row, names a sharing feature heading in a capability or the tail, or holds shares_added as a string is refused, each named, and --write and --verify leave the ledger unchanged`
- Removed: T22b, `R-1167: a tree-form ledger with an Also applies line in a feature's field block is refused, in every mode, never silently dropped` (test:1386).
**`requirements-tree.test.mjs`:** T9 · `// req: R-291` · `R-291: every real heading's committed IDs survive expansion and leaf counts total 1,139` (from 1,136, `:40`; 1,151 after both lanes).
**`requirements-regroup.test.mjs` (the second lander writes it):** T10 · `// req: R-1177` · `R-1177: a proposal whose feature declares shares_added and shares_dropped holds no unknown key and passes the regroup checker`
(built on that suite's passing proposal; red while `PROPOSAL_KEYS` lacks either key).

**Wrong code first.** Each pair edits code, never an assertion, and must red exactly the named titles (N/N in `seat-mutate.mjs`). 34 pairs; row 6's two run in the second lander.

| # | Wrong code | Reds |
|---|---|---|
| 1 | share line read by a lift finder, not `parseLedger` / base refusal of the first share line restored / identity stops writing `also_applies` / writer regenerates a kept line / kept copy takes the first line ending / a demoted feature's shares dropped / a merge keeps only its first source's shares / the kept test ignores declarations | T7 (fence closer) / T1, T2, T3, T5, T6, T8 / T1 and each test built from an emitted identity / T1 / T1 / T2 / T2 / T3, T5 |
| 2 | proof: recount skipped / recount derives expected from `also_applies` / accounting sets aside every feature's share line / accounting sets aside none / `expectedProseFor` keeps the share line | T4 (moved line, declared drop) / T4 (declared drop) / T4 (changed byte) / T2, T3, T5, T6 / T1 to T6 |
| 3 | validator accepts: an undeclared drop / an undeclared add / a drop it does not carry / an add it carries / an add of an unknown row / a sharing heading under a capability / … in the tail / a second share line / a share under a capability or subgroup / a string `shares_added` (crash) / a fenced line / a head line / a kept-section or closing-heading line / an unterminated share line | T8 ×7 / T7 ×2 / T8 / T7 ×4 |
| 4 | plan omits dropped lines / omits added lines / prints a line for merged shares / prints after the proof line | T6 ×4 |
| 5 | three rows added without the literal update | T9 |
| 6 | `PROPOSAL_KEYS` lacks `shares_added` / lacks `shares_dropped` | T10 ×2 |

T8 asserts the validator's own wording, so a validator pair reds even though the proof would still refuse. Kept green: the rest of the lift suite, T22 included.

**Seat acceptance** (copies in the seat's scratch, never in the repo; A0 seen failing at the base).
- **A0 (Ran today).** Copy of nana-pi's ledger at `e451c90`: dry run exits 1, 31 lines, all share lines (`plan-shares/base-dry.err`).
- **A1, G rows first: a test precondition on a copy.** The identity on nana-pi is refused on the G-row rule, not on shares (A §3). A scratch script builds it from the exported
  `buildIdentityMapping` and moves the 22 G rows to SUB-900 to SUB-904 (5/8/3/3/3) in the copy's mapping; nana-pi's ledger is not touched. It must exit 0. Its diff holds
  only the G rows leaving FEAT-033, the CAP-90 block and blank-line changes where FEAT-033's table is re-laid (fact-check lab: 78 changed lines, 3 of them blank).
  `grep '^Also applies:'` must be equal on both sides (31 lines). FEAT-028, FEAT-029 and FEAT-032's G shares must still pass the tree check.
- **A2, round trip.** Commit A1's output in a scratch git repo. `--emit-mapping` gives the identity. The `--mapping` dry run proves with no move or share line, `--write` leaves the
  bytes equal (`cmp`), and `--verify <base> --mapping` exits 0.
- **A3, declared drop and add.** From A2's identity: FEAT-033 `shares_dropped: ["R-756"]`; FEAT-005 `shares_added: ["R-781"]` (home FEAT-011, `docs/requirements-tree.md:292`).
  The dry run prints exactly those two share lines and the proof line. Exactly two lines change: FEAT-033's line goes, FEAT-005's reads `Also applies: R-641, R-781`. The tree
  check finds 0 problems. Then R-756 (home FEAT-028, `:362`) moves into FEAT-033: refused naming "is homed in this feature" without the drop, exit 0 with it.
- **A4, undeclared drop.** A2's identity with FEAT-001's `also_applies` removed and no declaration: exit 1, eight problems naming FEAT-001 and R-021 to R-819, and the ledger
  is unchanged after `--write`. A3's output with FEAT-001's line deleted, given to `proveLift`, names FEAT-001 and "1 missing".
- **Suite:** `npm run test:locked`, `map:check`, `readme:check`, `node scripts/requirements-tree.mjs --check`, `node scripts/requirements-trace.mjs`, and an empty merge-base diff on
  §3.6's files. Windows: CI's Git Bash leg runs after the land and is non-blocking.

**The claim most likely wrong:** that the lift's line indices and `parseLedger`'s line numbers name the same line in every honest ledger, since §3.1 joins them. Both strip one
BOM; the lift splits after `\n` (`:47-50`) and the tree parser on `\r?\n` (tree:61), so a lone `\r` breaks neither (Read, not Ran). T1's CRLF, mixed and BOM fixtures test
it. Next to try: a lone `\r` inside a row above a share line.

## 6. Decisions and residuals (each becomes one HANDOFF line)

**Jake.** No question is open in this plan. On a real regroup every share add and drop stays the owner's call (`REQUIREMENTS.md:34-37`): the plan prints each declared one, a
merge or demotion shows through its move line (`:619`), and the owner's yes comes before `--write`.
**Seat decisions (declared, not asked).** S1 Per-feature `shares_added` and `shares_dropped`; `also_applies` stays the result. S2 No implicit drop, even for a self-homed share
(A §5c's exception not taken: one rule, every drop printed). S3 Shares follow their old heading to the feature that names it or holds its subgroup. S4 A sharing heading named
by a capability or the tail is refused. S5 Kept = one source, no declaration: a byte copy. S6 `lift` stays 1; the proof's summary line is unchanged. S7 A regenerated line is
compared as a set; order carries no meaning. S8 Existence rests on proof check 7; a share's landing rests on (c). S9 R-1163 and R-1166 keep their text: a share line is a field line the mapping replaces
(R-1163), not one of R-1166's "other lines" of a named heading. S10 One share reader, `parseLedger`'s first line per feature heading; every other `Also applies:` line and an
unterminated share line are refused. S11 The lane that lands second adds the two keys to `PROPOSAL_KEYS` and writes T10.
**Residuals and carries.**
1. Shares follow the heading, not the rows. A regroup that moves all of a feature's rows to a new feature and retires the old heading leaves its shares on the retired heading,
   unless it declares a drop and an add. The tree check has no rule against shares on a retired feature (tree:172-207). The regroup packet shows each feature's shares.
2. A share line after its table moves up to the field lines; the prose around it stays in place.
3. The lift's `Purpose:` and `Status:` finder stays fence-unaware (`:166-171`); the share line is the tree parser's, which is fence-aware.
4. Neither plan names `shares_added` and `shares_dropped` in the skill's regroup paragraph or packet, nor reads the plan's share lines there; a later lane adds them.
5. HANDOFF line, written before the final round: `HANDOFF.md:63`'s share sentence becomes "the lift carries shares and changes one only where the mapping declares it".
6. The tree parser makes a fence closer underlined by `---` a setext heading (tree:52); the lift and proof do not (`:86`, proof:62). A share line under it is refused here;
   fixing tree:52 belongs to a tree-checker lane.
7. For the later lane that regroups nana-pi: where its 22 G rows go (regroup residual 7). This lane moves them only on a copy (A1) and never changes nana-pi's ledger.

## Seat revision (2026-10-15)

1. One share reader (proof MUST): a share line is `parseLedger`'s FEAT `alsoAppliesLines[0]`; no new finder in lift or proof; every other `Also applies:` line is refused (§3.1, R-1167, T7).
2. Recount independence pinned: T4's seventh tamper (a share lost beside a declared drop) and pair "recount derives expected from `also_applies`"; R-1182 says "never from `also_applies`".
3. Unterminated share line (proof SHOULD 2): refused naming "end the file with a line break first", in R-1167 and T7.
4. Repo WRONGs: literal 1,151 with both lanes; second lander adds the keys to `PROPOSAL_KEYS` and T10; regroup cites at `1066464`; A1 allows blank-line changes; §1 says what `:221-226` skip.
5. G rows: A1 moves them on a copy only, as a test precondition; the line for Jake is removed; where they go is a later lane's question (residual 7).
6. Not taken this round: the proof check's lower findings (empty-key meaning, R-1183 under `--write`, the summary's inserted count, repeats and ranges in the new keys).

## Seat amendment (2026-10-15): R-1181 one shall

The independent verifier found that §2's R-1181 carried two `shall`s ("it shall write … and shall copy …"). A row is one EARS sentence with one `shall`
(requirements skill, `SKILL.md:9`; §2's own "One `shall` per row"), and the seat acceptance's §2 harness case read it red (`[2,1,1]`). §2 now holds the one-`shall`
text below; every clause stays, "byte-identical, line ending included" and "only source of shares and the feature declares no change" among them. The meaning
is unchanged: the copy is still the write's form for a kept feature, with the same condition.
- Old: WHEN the lift applies a mapping, it shall write after each feature's `Status:` line one `Also applies:` line holding the shares, as the tree parser reads them, of
  the old feature headings that the feature and its subgroups name, less its `shares_dropped` and plus its `shares_added`, or no line when none remain, and shall copy
  the old line byte-identical, line ending included, when that line is the feature's only source of shares and the feature declares no change.
- New: WHEN the lift applies a mapping, it shall write after each feature's `Status:` line one `Also applies:` line holding the shares, as the tree parser reads them, of
  the old feature headings that the feature and its subgroups name, less its `shares_dropped` and plus its `shares_added`, or no line when none remain, copying the old
  line byte-identical, line ending included, when that line is the feature's only source of shares and the feature declares no change.
