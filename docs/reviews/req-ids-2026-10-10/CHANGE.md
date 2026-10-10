# Change declaration — four-digit requirement IDs

*Lane `req-ids` · branch `feat/req-ids` · worktree `~/nana-pi-wt/req-ids` · based on `feat/req-tree`
at `c4332ec` (the requirements tree: reviewed, waiting for Jake's acceptance; this lane lands after
it) · 2026-10-10. Feature: **FEAT-028 · Maintain requirement identity and trace links** (CAP-07).
Order: why → plan → Fable consult (`fable-consult.md`) → sol plan review (item `req-ids-plan`; r1–r3 adjudicated in `sol-plan-r1-response.md`, `sol-plan-r2-response.md` and `sol-plan-r3-response.md`) → build (pi luna) → seat
verification → sol build review (item `req-ids`) → astra land review → Jake accepts.*

## 1. Why

Jake, 2026-10-10: "ok lets first update the requirements id range to be 4 digits."

The trace rail reads exactly three digits (`[RG]-\d{3}`), in rows and in `req:` markers, in both
project templates. nana-pi has five usable three-digit R IDs left (R-295–R-299; R-241 is reserved and R-373–R-375 are tombstones). The
next change that adds requirements would run out. Worse, the failure is silent: a row written
`| R-1000 |` is skipped by both rails without an error, so an `untested`, `planned` or `violated`
row would vanish from every check while the suite stays green. Open question 9 has tracked this
since 2026-10-04 ("the seat's call"); the audit's issue C18 confirmed it.

**Observable outcome.**
1. A row or marker may use `R-1000` to `R-9999` (and `G-1000` to `G-9999`); every existing
   three-digit ID stays valid and unchanged. Nothing is renumbered.
2. A four-digit ID with a leading zero (`R-0123`) is not an ID: it would alias `R-123`.
3. A line that looks like a requirement row but cannot be read as one fails the rail, naming the
   file and line, instead of vanishing. This also closes open question 9's declared "missing closing
   pipe" class.
4. The same holds in rendered TypeScript and Python projects at the next template tag, and nana-pi's
   own suite pins both rails.

## 2. Requirement delta

Added to FEAT-028, after R-294 — the first four-digit IDs, allocated in order (both pinned on the TypeScript AND the Python rail in nana-pi's own suite):

| ID | Requirement (final) |
|---|---|
| R-1000 | The trace rail shall accept as a requirement ID an `R` or a `G`, a hyphen, and either three ASCII digits or four ASCII digits that do not start with zero, in REQUIREMENTS.md rows and in `req:` markers. |
| R-1001 | WHEN a line in REQUIREMENTS.md or REQUIREMENTS-general.md starts at column zero with a pipe, optional spaces and `R-` or `G-` followed by a non-space character, and is not a requirement row, the trace rail shall fail, naming the file and line. |

A **requirement row** is a column-zero line with an opening and a closing pipe, exactly four cells,
and an ID matching R-1000. Both rails read it the same way (build r1–r3 fixes, sol and astra build
r1–r2): lines split only at LF ("\n"); one byte-order mark at the start of a file is ignored;
whitespace means ONE explicit list in both rails — the union of JavaScript's and Python's own (tab,
LF, VT, FF, CR, U+001C–U+001F, space, U+0085, U+00A0, U+1680, U+2000–U+200A, U+2028, U+2029,
U+202F, U+205F, U+3000, U+FEFF) — and it is ignored around cells, before the ID and after the
closing pipe, so CRLF ledgers read. A marker's ID list splits on runs of that whitespace and
commas. The rule is context-free, like the rail's row reading today: a candidate
inside a fenced example or in an unrelated table counts too (the rail already reads a valid row
there as a real row). Checked locally on 2026-10-10: every candidate line in nana-pi's ledger
(1,012), the shared Part G file (22), both template ledgers, aml-desk's (365) and basketball-geek's
(165) is a valid row, so no existing ledger trips it.

**Compatibility break, declared in full:** the candidate prefix (`|`, optional whitespace, `R-` or
`G-` and a non-whitespace character at column zero) is reserved on EVERY line of the two ledger
files. Three things that pass today fail after this change, naming the line: a row missing its
closing pipe (read today by the Python rail, skipped by the TypeScript one); a character outside the
whitespace list after the closing pipe (U+200B, a letter); and any non-row line that starts with
the prefix — a fenced example, an unrelated table, prose. Residual: a character outside the list
between the opening pipe and the ID (U+200B) makes the line neither a row nor a candidate in either
rail. None exists in any ledger checked (§2).
The template ledgers' ID line says so and tells authors to indent such an example or spell its
first cell another way.

Changed: none of the existing rows. The ledger intro's ID paragraph records the new allocation, and
open question 9 is marked closed (§4). Retired: none.

Existing obligations that still apply: the rail's marker, cite and status checks; G-013–G-015
(form); R-287–R-294 (the tree checker must see every row the rail sees); R-756 (Part G mirror);
R-649 (`req:rows`); the template acceptance gate for template changes.

Proposed shares (Jake decides): R-1000 and R-1001 also apply to FEAT-014 "Create or adopt a project
workspace": both ship in every rendered project's rail and govern how it reads its own ledger
(sol r1: excluding R-1001 was inconsistent).

Not a row (Fable: cosmetic): the rails sort ID lists as text, so `R-1000` prints before `R-200` in a
problem list. Declared residual; the tree outline already orders numerically.

## 3. Scope

**In.**
- The rail, both languages: `templates/typescript/template/tests/requirements-trace.ts` and
  `templates/python/template/tests/conftest.py` — the grammar with ASCII `[0-9]` (Python's `\d`
  matches any Unicode digit); the requirement-row definition above (closing pipe required in both);
  the near-miss reader over each RAW file before the Part G merge, naming `<file>:<line>`; error text
  naming the format; the TypeScript rail exports `ID`.
- Their self-tests, shipped to rendered projects (unmarked in adoption mode, marked in scaffold mode):
  `templates/typescript/template/tests/requirements-trace.test.ts.jinja`,
  `templates/python/template/tests/test_requirements_trace.py.jinja` — the matrix in §5.
- Both template ledgers' ID line: after `R-999` the next ID is `R-1000`; four digits never start with
  zero; a row needs its closing pipe; a line starting `| R-` or `| G-` is always read as a row, so
  indent an example that would.
- Wording that describes the grammar as three digits: `README.md:49`, `packages/nana-pack/skills/scaffold-py/SKILL.md:17`,
  `packages/nana-pack/skills/scaffold-ts/SKILL.md:18`, `packages/nana-pack/skills/spec/SKILL.md:16`,
  `packages/nana-pack/skills/requirements/SKILL.md:68` — "R-nnn" becomes wording that allows three
  or four digits; examples like `R-001` stay.
- nana-pi: `scripts/requirements-trace.mjs` (re-export `ID`); `scripts/requirements-tree.mjs` (build
  its row-prefix pattern from the rail's `ID`, keeping a prefix match; the `Also applies:` share
  validator (:197) uses `ID` too, so `Also applies: R-1000` is valid when R-1000 is a row elsewhere;
  the range parser and both compressors accept four digits, including a range crossing `R-999` to
  `R-1000`).
- Tests that carry their own three-digit patterns (sol r1: these would silently weaken, since R-1000
  allows `G-1000`): `packages/nana-pack/tests/templates-render.test.mjs` (:167, :188, :196, :611,
  :612, :614), `packages/nana-pack/tests/templates-update.test.mjs` (:108, :109),
  `packages/nana-pack/tests/requirements-tree.test.mjs` (:72, :75) — use the rail's exported `ID` or
  the same ASCII pattern. `requirement-rows.test.mjs:80` stays (it reads only R-001–R-019 on purpose).
- `packages/nana-pack/tests/requirements-trace.test.mjs`: pins R-1000 and R-1001 through the shim on
  the TypeScript rail AND on the Python rail (`uvx pytest` against the template conftest, skip-gated
  when `uvx` is absent, as `templates-update.test.mjs` runs rendered Python).
- `REQUIREMENTS.md`: the two rows in FEAT-028; the intro's ID paragraph; open question 9 closed.
- Regenerated: `docs/requirements-tree.md`, `docs/code-map.md` if a header changes.

**NOT.** Renumbering any ID; any other row's cells; the tree structure (no new feature, no move);
the shares (Jake's call at checkpoint 2, applied in a follow-up); the rails' text sorting;
`aml-desk`'s and `basketball-geek`'s rails (other repos); indented row lines (a declared limitation);
five-digit IDs. **Frozen exceptions** (historical lane tools, never rerun on new ledgers, records
not rewritten): `docs/reviews/ears-form-2026-10-04/apply-batch.mjs`, and `move.mjs`, `prove.mjs`,
`seat-attacks.mjs`, `seat-verify-b.sh` under `docs/reviews/req-tree-2026-10-09/`.

**Allowlist.** The files named under In, plus builder reports in `docs/reviews/req-ids-2026-10-10/`.
Seat-owned: this declaration, `fable-consult.md`, `seat-verify-ids.mjs`, `HANDOFF.md`, session archives.

## 4. Design

**Grammar.** `ID = /^[RG]-(?:[0-9]{3}|[1-9][0-9]{3})$/` (ASCII digits in both languages); a row is `| <ID> | … |` with exactly four cells
as today. The rail exports `ID`; nana-pi's tree checker builds its own row-PREFIX pattern from it
(the tree uses a prefix match to recognize row-shaped lines), so the two can never drift. Python
uses the same pattern.

**Near-miss rows (R-1001).** Each rail reads every ledger file it loads — `REQUIREMENTS.md`, and
`REQUIREMENTS-general.md` where present — as RAW text, before the Part G merge. A line matching
`^\|\s*[RG]-\S` that is not a requirement row (as defined in §2) is a problem naming
`<file>:<line>`. A wrong cell count already throws in both rails and stays as it is.

**Ledger edits.** Intro ID paragraph: "…, R-287–R-294 consumed 2026-10-09 and 2026-10-10 (the
requirements tree), R-295–R-299 stay unused; from 2026-10-10 new rows take four-digit IDs in order
from R-1000 (R-1000 and R-1001: the four-digit grammar), and a row's home is its feature heading, not its
number." Open question 9 is prefixed "(closed 2026-10-10: four-digit IDs, R-1000 and R-1001)".

**Template release.** The rail is template-owned: after the merge, CI's release job cuts the next
patch tag. Rendered projects pick it up with `uvx copier update`.

**Stacked base and landing (sol r1–r2, and Jake's 2026-10-10 land rule).** The lane's parent is the
tree branch's tip `c4332ec`, whose only commit after the tree's last review (`eeeca20`, astra LAND)
is that review's own record. Jake ruled that nothing reaches main unless an independent reviewer
accepted it, and a review cannot accept its own record. So the tree lands at `eeeca20`, and that
record commit lands WITH this lane: this lane's final review covers `git diff eeeca20..<tip>`, the
record included. (sol r2 proposed landing the tree at `c4332ec`; that would land an unreviewed
commit, so the seat declines it with this reason.) The same pattern holds for this lane: its own
final review record rides the next change. If the tree branch changes before it lands, this lane
rebases onto the accepted tree tip, regenerates, reruns every check and gets the changed diff
reviewed.

## 5. Verification (doneWhen, from the worktree)

1. `npm run req:tree`, `npm run map`, `npm run map:check`.
2. `npm run test:locked` → exit 0.
3. Commit, then `npm run template:accept` → exit 0 (renders both languages and runs their suites).
4. The test matrix, in BOTH rails (TypeScript fixtures through nana-pi's shim and the template
   self-test; Python through the template self-test and nana-pi's skip-gated pytest run):
   accepted — `R-1000` and `G-1000` rows; `R-1000` and `G-1000` in markers; a four-digit row traced
   by its marker. Rejected, each naming its exact file and line — a leading-zero ID (`R-0123`), a
   five-digit ID, non-ASCII digits (`R-１２３`), a missing closing pipe, a candidate inside a fenced
   example, an `R-` candidate in an unrelated table (`| R-squared |`) and a `G-` one
   (`| G-squared |`); each in `REQUIREMENTS.md` AND in `REQUIREMENTS-general.md` (with a general
   file present). Markers refused in both languages — a leading-zero, a five-digit and a
   non-ASCII-digit ID — each with the `bad requirement id` diagnostic naming the marker's
   `<file>:<line>` (so a marker accepted as an ID but naming no row cannot pass for the wrong
   reason). The tree checker: four-digit rows placed,
   counted and rendered, and another feature's `Also applies: R-1000` accepted.
   Mutation pairs (code or scratch copies, red then green): the ID pattern back to three digits; `\d`
   instead of `[0-9]` in Python (the non-ASCII fixture goes green wrongly → red test); the near-miss
   reader removed, or run on merged text only (the general-file fixtures fail); the ID grammar's G
   branch disabled; the near-miss candidate's G branch disabled (`[RG]` → `R`: the `| G-squared |`
   fixtures fail); the tree checker's own `\d{3}` restored.
5. The seat's script `seat-verify-ids.mjs`, pasted verbatim. It compares every result with what is
   wanted and exits 1 on any mismatch; a Python run skipped for want of `uvx` counts as a mismatch,
   because both rows claim both rails.

## 6. Checkpoint 2 (Jake, about 10 minutes)

What changed in one paragraph; the two new rows; the one proposed share to rule on; the follow-ups
for the other two repos; the review verdicts. Lands after the requirements tree.

## 7. Follow-ups (not in this lane)

- `aml-desk`: its hand copy of the rail reads `^R-\d{3}$` (highest ID R-610): a hand edit in its own
  session, no urgency.
- `basketball-geek`: it sits at template `v0.4.0` with the older pytest-marker rail (`@pytest.mark.req`,
  R-only). Taking the new tag is a marker migration plus Part G's arrival, not a plain
  `copier update`: its own change, in its own session.
- The share, if Jake agrees.
- The rails' text sorting (cosmetic).
