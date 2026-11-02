Feature: FEAT-040 · Make and keep memory

Lane curation-merge-chain. Class: ordinary. Builder: pi-worker (small lane). Build session 1. This build runs on the reference Windows 11 laptop; shell commands run in PowerShell or Git Bash, and Node is on PATH.

Build to the plan of record, `docs/reviews/curation-merge-chain-2026-11-02/plan.md`. Its "Revision 2" section, written after the pi adversary's `plan-attack.md` and the seat's review text, overrides the sections above it, including Design and Must-meet. Build rows R-3698 to R-3702 and must-meet M1 to M5 exactly as Revision 2 says. Requirements first: rows, then tagged tests, then code.

Why this lane exists: memory-curation review round 1 found that a merge chain brings back a record the owner already merged away. Plan Revision 2 quotes the finding.

Threat model: honest variation in how owners and clones produce events is in scope: chains of any length, two clones syncing in either order, tied stamps, retirements anywhere in a chain, profile retracts mixed in. Hand-forged event files are out.

Standing authorization: when a Precedent file has a private helper this lane needs, export it from its own module (never copy, never move it) and report each export as a departure.

## Constraints

- Edit only these:
  - `packages/nana-pack/lib/profile-store.mjs`;
  - `packages/nana-pack/bin/nana-curate.mjs`;
  - `packages/nana-pack/lib/memory-curation.mjs`;
  - `packages/nana-pack/tests/memory-curation.test.mjs`, and `packages/nana-pack/tests/profile-store-guards.test.mjs` only to add new checks (R-3233's check stays byte-identical);
  - `packages/nana-pack/README.md`, the accepting paragraph only (Revision 2 item 7);
  - `REQUIREMENTS.md`: the new rows, and moving the SUB-027 section with its rows unchanged from under FEAT-043 to under FEAT-040;
  - `docs/known-bugs/FEAT-040.md`: append exactly one line, "- Memory curation (memory-curation, review round 1): a skip covers only one owner turn.";
  - the generated files through their generators (`npm run map`, `node scripts/requirements-tree.mjs --write`);
  - the lane folder;
  - an export under the standing authorization only.
- Never read a real owner profile or memory store, and never run `nana-profile`, `nana-curate` or `nana-memory` against one. Fixtures are synthetic, in the OS temp folder, as the existing tests do.
- Never read, print or use a stored credential. No GitHub API calls.
- No committed text names a person or a machine path.

## Show your work

Save each in `docs/reviews/curation-merge-chain-2026-11-02/`:
- `wrong-code.txt`: each new check run against main's code (fails, naming the assertion) and against yours (passes); plus M2 against a direct-only absorbed set and M3 against a rule that never restores on retract, each failing;
- `build-1-green.txt`: `node packages/nana-pack/tests/memory-curation.test.mjs`, `node packages/nana-pack/tests/profile-store-guards.test.mjs`, `node packages/nana-pack/tests/profile-store.test.mjs`, `node packages/nana-pack/tests/profile-sync.test.mjs`, `node packages/nana-pack/tests/memory-shaping.test.mjs`, `node packages/nana-pack/tests/memory-replay.test.mjs`, `node packages/nana-pack/tests/test-runner.test.mjs`, `node packages/nana-pack/tests/requirements-tree.test.mjs`.

## Done when

- M1 to M5 hold. R-3698 to R-3702 are `implemented` with backticked `file::title` evidence.
- These are green:
  - the test files above;
  - `npm run map:check`;
  - `npm run readme:check`;
  - `node scripts/requirements-trace.mjs`;
  - `node scripts/requirements-tree.mjs --check`;
  - `node scripts/known-bugs.mjs --root .`;
  - `node scripts/identity-scan.mjs --root .` after `git add`.
- `node scripts/lane-class.mjs --root . --base origin/main` prints `ordinary`.
- Commit explicit paths on `feat/curation-merge-chain`.

Report:
- the rows;
- the liveness and `absorbed` code, and each reader you changed;
- each existing-test edit with its reason;
- each wrong-code run with its named assertion;
- any export made under the standing authorization;
- each departure from the Precedent and from the review's suggested fix.

Commit, do not push, and stop. Report the full tip.

## Precedent

- `packages/nana-pack/lib/profile-store.mjs`: `effectiveState` (around 80-121) and `show` with its conflict lines (122-130).
- `packages/nana-pack/bin/nana-curate.mjs`: the accept path (77-97).
- `packages/nana-pack/lib/memory-curation.mjs`: `staleProposal`, `pendingQueue`, `sizeLine`, `renderQueue`.
- `packages/nana-pack/tests/memory-curation.test.mjs`: the fixtures, the command runner and the accept checks (around 90-120).
- `packages/nana-pack/tests/profile-store-guards.test.mjs`: the R-3233 check (69-90) and its two-clone fixture.
