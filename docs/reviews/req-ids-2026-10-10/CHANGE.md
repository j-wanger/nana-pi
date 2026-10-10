# Change declaration — four-digit requirement IDs

*Lane `req-ids` · branch `feat/req-ids` · worktree `~/nana-pi-wt/req-ids` · based on `feat/req-tree`
at `c4332ec` (the requirements tree: reviewed, waiting for Jake's acceptance; this lane lands after
it) · 2026-10-10. Feature: **FEAT-028 · Maintain requirement identity and trace links** (CAP-07).
Order: why → plan → Fable consult (`fable-consult.md`) → sol plan review (item `req-ids-plan`) → build (pi luna) → seat
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
| R-1000 | The trace rail shall accept as a requirement ID an `R` or a `G`, a hyphen, and either three digits or four digits that do not start with zero, in REQUIREMENTS.md rows and in `req:` markers. |
| R-1001 | WHEN a line in REQUIREMENTS.md or REQUIREMENTS-general.md starts with a pipe and an `R-` or `G-` token followed by digits but the trace rail cannot read it as a requirement row, the rail shall fail, naming the file and line. |

Changed: none of the existing rows. The ledger intro's ID paragraph records the new allocation, and
open question 9 is marked closed (§4). Retired: none.

Existing obligations that still apply: the rail's marker, cite and status checks; G-013–G-015
(form); R-287–R-294 (the tree checker must see every row the rail sees); R-756 (Part G mirror);
R-649 (`req:rows`); the template acceptance gate for template changes.

Proposed share (Jake decides): R-1000 also applies to FEAT-014 "Create or adopt a project workspace":
the template ledger's ID sentence and every rendered project's rail follow it. R-1001 is not shared
(project setup never writes a near-miss line).

Not a row (Fable: cosmetic): the rails sort ID lists as text, so `R-1000` prints before `R-200` in a
problem list. Declared residual; the tree outline already orders numerically.

## 3. Scope

**In.**
- The rail, both languages: `templates/typescript/template/tests/requirements-trace.ts` (the ID and
  ROW grammar; the near-miss reader; error text naming the format; export `ID` so nana-pi's tools
  build on one grammar) and `templates/python/template/tests/conftest.py` (the same).
- Their self-tests, which ship to rendered projects unmarked:
  `templates/typescript/template/tests/requirements-trace.test.ts.jinja`,
  `templates/python/template/tests/test_requirements_trace.py.jinja` — four-digit acceptance,
  leading-zero rejection, a five-digit ID, a missing closing pipe; each near-miss case with a
  `REQUIREMENTS-general.md` beside the project ledger, as every rendered project has.
- One sentence in both template ledgers' "ID blocks" line: after `R-999` the next ID is `R-1000`.
- nana-pi: `scripts/requirements-trace.mjs` (re-export `ID`); `scripts/requirements-tree.mjs` (build
  its row-prefix pattern from the rail's `ID` instead of its own `\d{3}` copy, keeping it a prefix
  match; the outline range parser and both compressors accept four digits, including a range that
  crosses `R-999` to `R-1000`); `packages/nana-pack/tests/requirements-trace.test.mjs` (pins R-1000
  and R-1001 on the TypeScript rail through the shim, with general-file fixtures, and on the Python
  rail with `uvx pytest` against the template conftest, skip-gated when `uvx` is absent, the way
  `templates-update.test.mjs` already runs rendered Python); `packages/nana-pack/tests/requirements-tree.test.mjs`
  (a four-digit row is placed, checked and rendered).
- `REQUIREMENTS.md`: the two rows in FEAT-028; the intro's ID paragraph; open question 9 closed.
- Regenerated: `docs/requirements-tree.md`, `docs/code-map.md` if a header changes.

**NOT.** Renumbering any ID; any other row's cells; the tree structure (no new feature, no move);
the share (Jake's call at checkpoint 2, applied in a follow-up); the rails' text sorting; tests whose
fixtures can never hold a four-digit ID (`templates-render`, `templates-update`, `requirement-rows`);
`aml-desk`'s and `basketball-geek`'s rails (other repos); indented row lines (a declared limitation);
five-digit IDs; skills and READMEs whose `R-nnn` wording stays true.

**Allowlist.** The files named under In, plus builder reports in `docs/reviews/req-ids-2026-10-10/`.
Seat-owned: this declaration, `fable-consult.md`, `seat-verify-ids.mjs`, `HANDOFF.md`, session archives.

## 4. Design

**Grammar.** `ID = /^[RG]-(?:\d{3}|[1-9]\d{3})$/`; a row is `| <ID> | … |` with exactly four cells
as today. The rail exports `ID`; nana-pi's tree checker builds its own row-PREFIX pattern from it
(the tree uses a prefix match to recognize row-shaped lines), so the two can never drift. Python
uses the same pattern.

**Near-miss rows (R-1001).** Each rail reads every ledger file it loads — `REQUIREMENTS.md`, and
`REQUIREMENTS-general.md` where present — as RAW text, before the Part G merge, and reports any line
matching `^\|\s*[RG]-\d+` that its row parser does not accept (bad digits, a leading zero, five
digits, a missing closing pipe), naming `<file>:<line>`. Today the TypeScript rail skips such lines
silently and the Python rail reads a missing-pipe row; a wrong cell count already throws in both and
stays as it is. Fable's sweep found no such line in nana-pi's ledger, the shared Part G file, or
the aml-desk and basketball-geek ledgers, so no existing ledger trips it.

**Ledger edits.** Intro ID paragraph: "…, R-287–R-294 consumed 2026-10-09 and 2026-10-10 (the
requirements tree), R-295–R-299 stay unused; from 2026-10-10 new rows take four-digit IDs in order
from R-1000 (R-1000 and R-1001: the four-digit grammar), and a row's home is its feature heading, not its
number." Open question 9 is prefixed "(closed 2026-10-10: four-digit IDs, R-1000 and R-1001)".

**Template release.** The rail is template-owned: after the merge, CI's release job cuts the next
patch tag. Rendered projects pick it up with `uvx copier update`.

## 5. Verification (doneWhen, from the worktree)

1. `npm run req:tree`, `npm run map`, `npm run map:check`.
2. `npm run test:locked` → exit 0.
3. Commit, then `npm run template:accept` → exit 0 (renders both languages and runs their suites).
4. Mutation pairs (code or scratch copies, red then green): the rail's ID pattern back to three
   digits → the four-digit fixtures fail, TypeScript and Python (R-1000); a leading-zero four-digit
   ID accepted → its rejection fixture fails (R-1000); the near-miss reader removed, or run only on
   the merged text → the five-digit, leading-zero and missing-pipe fixtures fail, including the one
   with a general file present (R-1001); the tree checker's own `\d{3}` restored → its four-digit
   test fails.
5. The seat's script `seat-verify-ids.mjs`, pasted verbatim.

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
