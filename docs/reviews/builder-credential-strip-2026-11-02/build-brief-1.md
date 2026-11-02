Feature: FEAT-006 · Launch builders with execution limits

Lane builder-credential-strip. Class: gate (`claude-review.mjs`, a review tool; also `nana-gate.ts` and `pi-worker.mjs`). Builder: pi-worker (larger lane). Build session 1. This build runs on the reference Windows 11 laptop; shell commands run in PowerShell or Git Bash, and Node is on PATH.

Build to the plan of record, `docs/reviews/builder-credential-strip-2026-11-02/plan.md` (revision 2). It has taken the pi adversary's attack in `plan-attack.md`, and the decision is recorded in `consult.md`. Take its Open choices as written. Build R-3436 and R-3437 amendments, rows R-3660 to R-3667, and must-meet M1 to M8 exactly as its Must-meet section says.

Threat model: honest variation in our tools and machines is in scope. That covers:
- Git Credential Manager and osxkeychain;
- inherited config in either environment form;
- askpass programs;
- pi and Claude Code builders, and every reviewer entry point;
- a builder that, trying to finish its brief, reaches for a credential.

A builder deliberately defeating the controls is out of scope.

## Build

1. Amend R-3436 and R-3437, then add R-3660 to R-3667 to the FEAT-006 table.
2. Then the tagged tests, written before the code. Run each new check against main's code and record the red output in `docs/reviews/builder-credential-strip-2026-11-02/build-1-red.txt`.
3. Then the code, the gate floor, the preamble, rulings, AGENTS and shared-template wording, and the README note.
4. Grep every test and checker for the literals this change breaks (the preamble's push lines, the 2026-11-01 ruling text, report-shape wording) before limiting edits.
5. Add the FEAT-006 residual lines named in the plan's Threat model.
6. Add one session entry at the top of `docs/sessions/2026-10.md`, newest first.

## Constraints

- **Never read, print or use a real stored credential.** Do not run `git credential fill`, `get` or `approve` against the real machine configuration, do not run `gh auth token`, and do not call any GitHub API. Every credential test uses a temporary fixture helper and fixture askpass program in a temporary HOME, and checks for a fixture value only.
- **Do not push.** This lane adds the rule that builders do not push. Commit, and report the branch and the tip.
- Never edit the real `~/.pi/agent` files or the real git config. Tests use temporary agent dirs and HOMEs.
- New values are named constants with `chosen` or contract provenance, pinned by one seal each.
- Shared-marker parity: edit the shared working-pattern source in `templates/_shared/`, then bring `AGENTS.md`'s marker region into line, the way the existing parity test requires.
- Generated files are allowed and required: `npm run map` and `node scripts/requirements-tree.mjs --write`.
- No committed text names a person or a machine path.

## Show your work

Save each in `docs/reviews/builder-credential-strip-2026-11-02/`:
- `build-1-red.txt` and `build-1-green.txt`;
- `m8-win32.txt`, recording:
  - the fixture run through the installed launchers, as M8 says;
  - `node packages/nana-setup/bin/install-check.mjs` and its exit;
  - the touched tests.

## Done when

- M1 to M7 hold. The amended and new rows are `implemented`, with backticked `file::title` evidence.
- These are green:
  - every touched test file;
  - `npm run map:check`;
  - `npm run readme:check`;
  - `node scripts/requirements-trace.mjs`;
  - `node scripts/requirements-tree.mjs --check`;
  - `node scripts/known-bugs.mjs --root .`;
  - `nana-writing` on the session entry and the README note;
  - `node scripts/identity-scan.mjs --root .`.
- Do not run the locked full suite; CI is the suite, after the seat pushes.
- Commit explicit paths on `feat/builder-credential-strip`. Do not push.

Report:
- the branch and the tip's full SHA;
- every row, check and constant changed;
- the red and green results;
- M8's results;
- the install-check exit;
- which preamble line was replaced (builder-credentials' line, or line 34);
- each departure from the Precedent.

## Precedent

- `packages/nana-pack/bin/pi-watchdog.mjs`: `runWatchdog`'s spawn and `childEnv` merge.
- `packages/nana-pack/bin/pi-worker.mjs`: the `childEnv` assignments, `CLAUDE_BUILDER_CHILD_ENV`, and the Claude settings env.
- `packages/nana-pack/lib/claude-settings-carry.mjs`: the sealed settings env carry.
- `packages/nana-pack/bin/claude-review.mjs`: the settings and the ledger spawn.
- `packages/nana-pack/bin/review-ledger.mjs`: the model spawn.
- `packages/nana-pack/bin/pi-review.mjs`: the watchdog launch.
- `packages/nana-pack/extensions/nana-gate.ts`: `PROTECTED_PATHS` as the floor form, and `segHit`.
- `packages/nana-pack/tests/gate-corpus.test.mjs`: the command corpus.
- `packages/nana-pack/prompts/builder-preamble.md`: the push and report lines.
- `packages/nana-pack/rules/nana-rulings.md`: the 2026-11-01 ruling.
- `packages/nana-pack/tests/worker-lane.test.mjs` and `packages/nana-pack/tests/rulings.test.mjs`: the R-3436 and R-3437 pins.
- `templates/_shared/working-under-nana-pi.md`: the shared working pattern.
