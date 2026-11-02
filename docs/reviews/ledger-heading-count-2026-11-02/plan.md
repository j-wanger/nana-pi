# ledger-heading-count — plan (revision 2)

Revision 2 takes every finding in `plan-attack.md` (a pi adversary on gpt-6-astra, read-only: 2 MUST, 3 SHOULD).

Feature: FEAT-031 · Run checks reliably and without contaminating work

Lane class (`node scripts/lane-class.mjs --root . --files packages/nana-pack/tests/requirements-tree.test.mjs,REQUIREMENTS.md,docs/requirements-tree.md`): `ordinary`.

## Purpose

The seat's words (2026-11-02):

> packages/nana-pack/tests/requirements-tree.test.mjs R-288 and R-1158 pin the real ledger's heading count as a literal (76 → 77 → 78...), so every lane that adds a FEAT or SUB heading fails CI on all three systems until its brief says to bump it (hit by seat-memory-push, memory-curation, builder-drop tonight). Goal: those checks stay as strict about the real ledger (every heading has a Purpose line; the CRLF copy parses identically) without a literal that every new feature must edit.

This is a fix. It restores the FEAT-031 contract that the suite judges behaviour, not a value every unrelated change must edit. That covers R-288's real-ledger check and R-1158's real-ledger CRLF check.

### Evidence

- `requirements-tree.test.mjs:28`: `actual.parsed.headings.length === 76 && actual.parsed.headings.every((h) => h.purpose.length > 0)`.
- `requirements-tree.test.mjs:383`: `selfLedgerCrlf.problems.length === 0 && selfLedgerCrlf.parsed.headings.length === 76`.
- At 5bb48872 the parser finds 76 headings: level 1 CAP 8, level 2 FEAT 43, level 3 SUB 25. An independent line scan of `REQUIREMENTS.md` for `^#{1,3} (CAP|FEAT|SUB)-` finds the same 76.

## Assumptions

- A1: the literal does two jobs. It catches a parser that drops headings, so the `every(...)` purpose check would not pass vacuously over too few. It catches a CRLF parse that loses headings. Both jobs can be done against the ledger's own headings instead.
- A2: a heading is a line that starts with one to three `#`, a space, and `CAP-`, `FEAT-` or `SUB-` followed by digits. That is the form `docs/requirements-tree.md` and the tree checker use. The builder confirms it against `parseLedger` and states any heading form the scan would miss.

## Open choices

- O1: the R-288 oracle. Default:
  - A small helper in the test file scans the raw ledger lines for the heading form in A2, collecting each heading's ID and 1-based line. The scan stays test-local and deliberately broader than the parser's recognition regex (`scripts/requirements-tree.mjs:18`), so the two do not share a blind spot (attack SHOULD 5). It never imports a parser helper.
  - The check requires the parser's headings to equal the scan's, as ID and line pairs in order, with at least one heading of each level present.
  - Every parsed heading must still have a non-empty purpose.

  Stricter than a count: a parser that drops one heading and gains another still fails. The all-level presence check is an emptiness guard only. It does not prove the real ledger was read, because `REQ_TREE_LEDGER_PATH` accepts any file (attack SHOULD 4); the file's other real-ledger checks reject a small fixture.
- O2 (attack MUST 2 and SHOULD 3): the R-1158 real-ledger part.
  - Derive the LF text explicitly, as `ledger.replace(/\r\n/g, "\n")`, and the CRLF text from that LF text, so a Windows CRLF checkout cannot compare CRLF with CRLF.
  - The CRLF parse must equal the LF parse completely: `assert.deepStrictEqual` on the whole parsed object (every heading field, including `label`, `parent`, `rows`, `status`, `statusLines`, `alsoAppliesLines`, `firstMarkdownTableLine` and capability-field locations), and on the problem lists.
  - The synthetic two-feature fixture half of the check is unchanged.
- O3: no new production code. If the scan needs a helper the tree script already has privately, the standing authorization below applies.

## Questions for the owner

None.

## Threat model

In scope: honest variation in the ledger and the parser:
- new CAP, FEAT or SUB headings;
- reordered headings;
- CRLF checkouts;
- a parser change that drops, merges or misnumbers headings.

The checks must still fail for a dropped heading, a missing purpose, or a CRLF parse that differs.

Out of scope: deliberate forgery, such as a heading written to evade both the scan and the parser.

Residuals:
- A heading form that both the scan and the parser miss would go unseen. A2's statement of the form is the guard.

## Precedent

- `packages/nana-pack/tests/requirements-tree.test.mjs` — the two checks (28, 381-385), `check`, and the `crlf` helper the R-1158 block uses.
- `scripts/requirements-tree.mjs` — `parseLedger` and `checkTree` (heading fields: `level`, `id`, `line`, `purpose`).
- `packages/nana-pack/tests/requirements-moved.test.mjs` — another test over the real ledger. The builder confirms it pins no heading literal.

## Outside precedent

- none: a test oracle change inside one file. Looked at Node's assert (`deepStrictEqual`), which the builder may use for the pair comparison.

## Must-meet

Rows R-3680 and R-3681 go in the FEAT-031 table in `REQUIREMENTS.md` first. Each is tagged on its check by appending to the check's existing req line. Both checks keep their titles. Each changed check fails against a mutated parser, recorded in the lane folder.

- **M1 · R-3680** — The real-ledger heading check shall compare the parser's headings with the ledger's own heading lines, by ID and line, and shall need no edit when a heading is added. Pins:
  - R-288's check passes at the tip.
  - **The no-edit proof (attack MUST 1).** A temporary copy of the ledger gains one valid feature: an unused FEAT ID under an existing capability, a `Purpose:` line, `Status: active`, and one table row with an unused R- ID. Run through `REQ_TREE_LEDGER_PATH`, the two named R-288 assertions pass. Record their exact PASS lines, separately from the outline checks, which compare against the committed outline and are expected to fail for that copy; say so in the record. Never use whole-file exit status as the evidence.
  - **Mutations** (attack SHOULD 5), each in an uncommitted copy and restored, each recording its exact diff and the named assertion that fails:
    - the parser drops exactly one FEAT heading, so all three levels stay present;
    - the parser reports one heading's line off by one, with the count unchanged;
    - one purpose line in a ledger copy is blanked.
  - Each run is recorded in `m1-win32.txt`.
- **M2 · R-3681** — The real-ledger CRLF check shall require the CRLF copy's complete parse and problem list to equal the LF copy's, both derived from LF-normalized text, with no literal count. Pins:
  - R-1158's check passes at the tip, on an LF checkout and on a CRLF copy given through `REQ_TREE_LEDGER_PATH`;
  - it fails when the parser is mutated, in an uncommitted copy, to keep a trailing `\r` in one non-ID field (for example `statusLines` or a label);
  - recorded in `m2-win32.txt`.
- **M3 (evidence)** — No `=== 76` (or any heading-count literal) remains in the test file; grep output recorded. Every other check in the file stays byte-identical.

Expected changes (a forecast, not a limit):
- `packages/nana-pack/tests/requirements-tree.test.mjs`;
- `REQUIREMENTS.md`, `docs/requirements-tree.md`, and the generated code map if it changes.
