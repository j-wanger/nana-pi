Feature: FEAT-006 · Launch builders with execution limits

Lane credential-gate-variants. Class: hook (the gate floor; the seat runs wrong-code pairs after the build). Builder: pi-worker (small lane). Build session 1. This build runs on the reference Windows 11 laptop; shell commands run in PowerShell or Git Bash, and Node is on PATH. The branch is based on `origin/feat/builder-credential-strip` 7d5f8ea4, not main.

Build to the plan of record, `docs/reviews/credential-gate-variants-2026-11-02/plan.md`. Its "Revision 2" section, written after the pi adversary's `plan-attack.md`, overrides the sections above it. Take O1 (wide helper names) and O2 (merge the four helper patterns into two) as defaulted. Build rows R-3685 (M1) and R-3686 (M2) and update R-3667's seal and evidence, exactly as the plan says. Requirements first: rows, then tagged tests, then code.

Why this lane exists: the builder-credential-strip round 3 final review found four close variants of the credential-helper read still allowed under `NANA_ROLE` worker or reviewer. The plan's Purpose lists them.

Threat model: honest variation in how a builder or reviewer spells a credential-helper read is in scope. Deliberate evasion is out; the gate is advisory and the environment strip is the real control.

Standing authorization: when a Precedent file has a private helper this lane needs, export it from its own module (never copy, never move it) and report each export as a departure.

## Constraints

- Edit only these:
  - `packages/nana-pack/lib/credential-gate-config.mjs`;
  - `packages/nana-pack/extensions/nana-gate.ts`, only the credential floor's word join (lines 150-153);
  - `packages/nana-pack/tests/credential-gate.test.mjs`;
  - `REQUIREMENTS.md`;
  - `docs/known-bugs/FEAT-006.md`: append exactly one line, "- Builder credential strip (credential-gate-variants, plan attack): a whole-gate probe on a very long command took over 30 s; the cause is unmeasured, and the new helper patterns alone match 80,025 chars in about 1 ms.";
  - the generated files through their generators (`npm run map`, `node scripts/requirements-tree.mjs --write`);
  - the lane folder;
  - an export under the standing authorization only.
- Never run a real credential command: no `git credential*`, no `git-credential-*`, no `gh auth`. Test only through the gate in-process, as the existing test does.
- Never read, print or use a stored credential. No GitHub API calls.
- No committed text names a person or a machine path.

## Show your work

Save each in `docs/reviews/credential-gate-variants-2026-11-02/`:
- `wrong-code.txt`: M1 and M2 run against the branch base's code (the old narrow patterns and plain space join), naming each failing case;
- `build-1-green.txt`: `node packages/nana-pack/tests/credential-gate.test.mjs`, `node packages/nana-pack/tests/credential-strip.test.mjs`, `node packages/nana-pack/tests/gate-survives-mutation.test.mjs`, `node packages/nana-pack/tests/test-runner.test.mjs`, and every other gate test file whose name starts with `gate-` or `config-gate`.

## Done when

- M1 and M2 hold, for both roles and both tools, and every form stays allowed with no role. R-3685 and R-3686 are `implemented` with backticked `file::title` evidence. R-3667's seal pins the new list and the placeholder.
- These are green:
  - the test files above;
  - `npm run map:check`;
  - `npm run readme:check`;
  - `node scripts/requirements-trace.mjs`;
  - `node scripts/requirements-tree.mjs --check`;
  - `node scripts/known-bugs.mjs --root .`;
  - `node scripts/identity-scan.mjs --root .` after `git add`.
- Commit explicit paths on `feat/credential-gate-variants`.

Report:
- the rows;
- the new patterns and the join change;
- each existing-test edit with its reason;
- each wrong-code run with its failing cases;
- any export made under the standing authorization;
- each departure from the Precedent.

Commit, do not push, and stop. Report the full tip.

## Precedent

- `packages/nana-pack/lib/credential-gate-config.mjs`: `CREDENTIAL_PATTERNS`. Patterns 1 and 2 carry the global-option prefix to reuse.
- `packages/nana-pack/extensions/nana-gate.ts`: the credential floor (147-155).
- `packages/nana-pack/lib/gate-shell.ts`: `tokens` (131), with its quoted-word preservation.
- `packages/nana-pack/tests/credential-gate.test.mjs`: the `blocked` and `allowed` lists, M4 and the M7 seal.
- `docs/reviews/builder-credential-strip-2026-11-02/r3-reviewer-5c2162a3.md`: the four variants.
