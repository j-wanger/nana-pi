Feature: FEAT-031 · Run checks reliably and without contaminating work

Lane ledger-heading-count. Class: ordinary. Builder: pi-worker (small lane). Build session 1. This build runs on the reference Windows 11 laptop; shell commands run in PowerShell or Git Bash, and Node is on PATH.

Build to the plan of record, `docs/reviews/ledger-heading-count-2026-11-02/plan.md` (revision 2). It has taken the pi adversary's attack in `plan-attack.md`. Take its Open choices as written. Build rows R-3680 and R-3681 and must-meet M1 to M3 exactly as its Must-meet section says. Requirements first: rows, then the checks, then the evidence.

Why this lane exists: two checks in `packages/nana-pack/tests/requirements-tree.test.mjs` pin the real ledger's heading count as the literal `76` (lines 28 and 383). Every lane that adds a CAP, FEAT or SUB heading therefore fails CI until its brief bumps it.

Threat model: honest variation in the ledger and the parser is in scope (new, reordered or CRLF headings; a parser that drops, merges or misnumbers a heading). Deliberate forgery is out.

Standing authorization: when a Precedent file has a private helper this lane needs, export it from its own module (never copy, never move it) and report each export as a departure.

## Constraints

- Edit only these:
  - `packages/nana-pack/tests/requirements-tree.test.mjs`;
  - `REQUIREMENTS.md`;
  - the generated files through their generators (`npm run map`, `node scripts/requirements-tree.mjs --write`);
  - the lane folder;
  - an export added to `scripts/requirements-tree.mjs` under the standing authorization only.
- Keep both check titles. Every other check in the test file stays byte-identical. The only change to a req line is the appended row ID.
- Parser mutations are uncommitted copies, restored afterwards. Confirm `git status` shows no `scripts/` change except an authorized export before you commit.
- Never read, print or use a stored credential. No GitHub API calls.
- No committed text names a person or a machine path.

## Show your work

Save each in `docs/reviews/ledger-heading-count-2026-11-02/`:
- `m1-win32.txt`;
- `m2-win32.txt`;
- `m3-win32.txt`: the grep showing no heading-count literal remains;
- `build-1-green.txt`: `node scripts/test.mjs packages/nana-pack/tests/requirements-tree.test.mjs`.

## Done when

- M1 to M3 hold. R-3680 and R-3681 are `implemented` with backticked `file::title` evidence.
- These are green:
  - `npm run map:check`;
  - `npm run readme:check`;
  - `node scripts/requirements-trace.mjs`;
  - `node scripts/requirements-tree.mjs --check`;
  - `node scripts/known-bugs.mjs --root .`;
  - `node scripts/identity-scan.mjs --root .`.
- `node scripts/lane-class.mjs --root . --base origin/main` prints `ordinary`.
- Commit explicit paths on `feat/ledger-heading-count`.

Report:
- the rows;
- the oracle and comparison code;
- each M1 and M2 run with its named assertion lines;
- any export made under the standing authorization;
- each departure from the Precedent.

Push the branch and stop.

## Precedent

- `packages/nana-pack/tests/requirements-tree.test.mjs`: the R-288 check (28), the R-1158 block (378-386), `check`, `crlf`, and the `REQ_TREE_LEDGER_PATH` override (22).
- `scripts/requirements-tree.mjs`: `parseLedger`, `checkTree`, and the heading regex (18).
- `packages/nana-pack/tests/requirements-moved.test.mjs`: another test over the real ledger.
