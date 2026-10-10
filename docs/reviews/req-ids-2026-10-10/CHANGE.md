# Change declaration — four-digit requirement IDs

*Lane `req-ids` · branch `feat/req-ids` · worktree `~/nana-pi-wt/req-ids` · based on `feat/req-tree`
at `c4332ec` (the requirements tree: reviewed, waiting for Jake's acceptance; this lane lands after
it) · 2026-10-10. Feature: **FEAT-028 · Maintain requirement identity and trace links** (CAP-07).
Order: why → plan → Fable consult → sol plan review (item `req-ids-plan`) → build (pi luna) → seat
verification → sol build review (item `req-ids`) → astra land review → Jake accepts.*

## 1. Why

Jake, 2026-10-10: "ok lets first update the requirements id range to be 4 digits."

The trace rail reads exactly three digits (`[RG]-\d{3}`), in rows and in `req:` markers, in both
project templates. nana-pi has five three-digit R IDs left (R-295–R-299; R-241 is reserved). The
next change that adds requirements would run out. Worse, the failure is silent: a row written
`| R-1000 |` is skipped by both rails without an error, so an `untested`, `planned` or `violated`
row would vanish from every check while the suite stays green. Open question 9 has tracked this
since 2026-10-04 ("the seat's call"); the audit's issue C18 confirmed it.

**Observable outcome.**
1. A row or marker may use `R-1000` to `R-9999` (and `G-1000` to `G-9999`); every existing
   three-digit ID stays valid and unchanged. Nothing is renumbered.
2. A four-digit ID with a leading zero (`R-0123`) is not an ID: it would alias `R-123`.
3. A line that looks like a requirement row but cannot be read as one fails the rail, naming the
   line, instead of vanishing. This also closes open question 9's declared "missing closing pipe"
   class.
4. Lists of IDs the rail prints are in number order, so `R-1000` comes after `R-999`, not before
   `R-200`.
5. The same holds in rendered TypeScript and Python projects at the next template tag.

## 2. Requirement delta

Added to FEAT-028, after R-294 — the first four-digit IDs, allocated in order:

| ID | Requirement (final) |
|---|---|
| R-1000 | The trace rail shall accept as a requirement ID an `R` or a `G`, a hyphen, and either three digits or four digits that do not start with zero, in REQUIREMENTS.md rows and in `req:` markers. |
| R-1001 | WHEN a line in REQUIREMENTS.md starts with a pipe and an `R-` or `G-` token followed by digits but the trace rail cannot read it as a requirement row, the rail shall fail, naming the line. |
| R-1002 | Every list of requirement IDs the trace rail prints shall be ordered by prefix, then by number. |

Changed: none of the existing rows. The ledger intro's ID paragraph records the new allocation, and
open question 9 is marked closed (§4). Retired: none.

Existing obligations that still apply: the rail's marker, cite and status checks; G-013–G-015
(form); R-287–R-294 (the tree checker must see every row the rail sees); R-756 (Part G mirror);
R-649 (`req:rows`); the template acceptance gate for template changes.

Proposed shares (Jake decides): R-1000 and R-1001 also apply to FEAT-014 "Create or adopt a project
workspace", because every rendered project carries this rail and starts reading its own IDs with it.

## 3. Scope

**In.**
- The rail, both languages: `templates/typescript/template/tests/requirements-trace.ts` (ID and ROW
  grammar; near-miss rows fail; numeric ordering; error text naming the format; export `ID` and `ROW`
  so nana-pi's own tools reuse one grammar) and `templates/python/template/tests/conftest.py`
  (the same, in Python).
- Their self-tests: `templates/typescript/template/tests/requirements-trace.test.ts.jinja`,
  `templates/python/template/tests/test_requirements_trace.py.jinja` — fixtures for four-digit
  acceptance, leading-zero rejection, a five-digit ID, a missing closing pipe, and order.
- One sentence in both template ledgers' "ID blocks" line: after `R-999` the next ID is `R-1000`.
- nana-pi: `scripts/requirements-trace.mjs` (re-export `ID`, `ROW` from the rail);
  `scripts/requirements-tree.mjs` (use the rail's grammar instead of its own `\d{3}` copy; the
  outline range parser and both compressors accept four digits, including a range that crosses
  `R-999` to `R-1000`); `packages/nana-pack/tests/requirements-trace.test.mjs` (pins R-1000–R-1002 on
  fixtures through nana-pi's shim); `packages/nana-pack/tests/requirements-tree.test.mjs` (a
  four-digit row is placed, checked and rendered); the tests that carry their own three-digit
  patterns and would silently weaken: `templates-render.test.mjs` (G-row and adopt checks),
  `templates-update.test.mjs`, `requirement-rows.test.mjs`.
- `REQUIREMENTS.md`: the three rows in FEAT-028; the intro's ID paragraph; open question 9 closed.
- Regenerated: `docs/requirements-tree.md`, `docs/code-map.md` if a header changes.

**NOT.** Renumbering any ID; any other row's cells; the tree structure (no new feature, no move);
the shares (they are Jake's call, listed for checkpoint 2, applied in a follow-up if he agrees);
`aml-desk`'s hand copy of the rail and `basketball-geek`'s rendered copy (other repos: follow-ups);
indented row lines (still a declared limitation); five-digit IDs; skills and READMEs whose `R-nnn`
wording stays true.

**Allowlist.** The files named under In, plus `docs/reviews/req-ids-2026-10-10/` builder reports.
Seat-owned: this declaration, the seat's verify script, `HANDOFF.md`, session archives.

## 4. Design

**Grammar.** `ID = /^[RG]-(?:\d{3}|[1-9]\d{3})$/`; a row is `| <ID> | … |` with exactly four cells
as today. The rail exports `ID` and `ROW`; nana-pi's tree checker imports them through the shim, so
the two can never drift. Python uses the same pattern.

**Near-miss rows (R-1001).** A line matching `^\|\s*[RG]-\d+` that the row parser does not accept
(bad digits, leading zero, five digits, missing closing pipe, wrong cell count) is a rail problem
naming file and line. Today such a line is skipped silently by the TypeScript rail (and, for a
missing closing pipe, read by the Python one — so the two rails disagree; after this change both
fail it).

**Order (R-1002).** Every sorted ID list in both rails sorts by prefix (R before G), then numerically.

**Ledger edits.** Intro ID paragraph: "…, R-287–R-294 consumed 2026-10-09 and 2026-10-10 (the
requirements tree), R-295–R-299 stay unused; from 2026-10-10 new rows take four-digit IDs in order
from R-1000 (R-1000–R-1002: the four-digit grammar), and a row's home is its feature heading, not its
number." Open question 9 is prefixed "(closed 2026-10-10: four-digit IDs, R-1000–R-1002)".

**Template release.** The rail is template-owned: after the merge, CI's release job cuts the next
patch tag. Rendered projects pick it up with `uvx copier update`.

## 5. Verification (doneWhen, from the worktree)

1. `npm run req:tree`, `npm run map`, `npm run map:check`.
2. `npm run test:locked` → exit 0.
3. Commit, then `npm run template:accept` → exit 0 (renders both languages and runs their suites).
4. Mutation pairs (code or scratch copies, red then green): the rail's ID pattern back to three
   digits → the four-digit fixture fails (R-1000); a leading-zero four-digit ID accepted → its
   rejection test fails (R-1000); the near-miss check removed → the five-digit and missing-pipe
   fixtures fail (R-1001); lexical sort restored → the order fixture fails (R-1002); the tree
   checker's own `\d{3}` restored → its four-digit test fails.
5. The seat's script `seat-verify-ids.sh`, pasted verbatim.

## 6. Checkpoint 2 (Jake, about 10 minutes)

What changed in one paragraph; the three new rows; the two proposed shares to rule on; the follow-ups
for the other two repos; the review verdicts. Lands after the requirements tree.

## 7. Follow-ups (not in this lane)

- `aml-desk`: its hand copy of the rail reads `^R-\d{3}$` — a hand edit in its own session.
- `basketball-geek`: `uvx copier update` to the new tag.
- The two shares, if Jake agrees.
