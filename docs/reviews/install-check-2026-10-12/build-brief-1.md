# Lane install-check — build brief 1 (2026-10-12 · feat/install-check · worktree ~/nana-pi-wt/install-check)

**Builder: pi gpt-6-luna** — the owner's measurement lane (cc-hooks-windows is built by Claude Sonnet 5.5);
the seat records wall clock and rounds to land for each.

**The contract is `CHANGE.md` in this folder** (sol plan r3 LAND 100/100 after r1 82 and r2 78; read
`sol-plan-r1.md`, `sol-plan-r2.md` for why). Threat model: honest variation in hosted runners and
machines in scope; deliberate forgery out. Lane class: CI workflow shape. Build all of it.

## Pinned output (the seat's acceptance script reads exactly this)
Each item prints ONE line that starts with `PASS `, `FAIL ` or `XFAIL `, then its label, optionally
` — <detail>`. Labels, exactly: `install`, `pi-subagents`, `pi list nana-pack`, `pi list nana-knowledge`,
`pi session`, `hook set`, `hook objective`, `hook adoption`, `hook shared memory`,
`hook verifier pipe (Bash)`, `hook verifier pipe (PowerShell)` (win32 only), `hook knowledge pull`,
`doctor`. The first lines (before any item line) name the resolved `pi`, `node` and, on win32, Git Bash
paths, one per line, each containing the absolute path.

## What to build (each item maps to CHANGE.md)
1. **Rows first** (§2): R-1070–R-1084 as listed (one `shall` each), R-597 reworded, R-1032's pin moved;
   statuses honest (rows proven only on the Windows leg stay `untested` until that run is read).
   `npm run req:tree`. New IDs ONLY from R-1070–R-1089.
2. **`packages/nana-setup/lib/install-check-config.mjs`** (sealed values with provenance: the hook table
   with its form columns, the allowed keys, the override list, the known-red list as
   `{ item, code, owner, expires }` entries, the doctor note list, the sample inputs),
   **`lib/install-check.mjs`** (one spawn function for every child, the steps of §3 in order, the
   dispatch simulation, reporting with the R-1080 rule and an injectable clock), **`bin/install-check.mjs`**.
3. **`.github/workflows/ci.yml`**: the `install-check` job before `suite:` on `macos-latest` and
   `windows-latest`, no `continue-on-error`, `run: node packages/nana-setup/bin/install-check.mjs`,
   `timeout-minutes: 20`, release `needs: [suite, install-check]`; `ci-workflow.test.mjs` as §4 lists.
4. **Tests**: `packages/nana-setup/tests/install-check.test.mjs`, pure with an injected spawn and clock,
   every case §5 lists (shape and mapping, dispatch form both directions, environment with the recording
   spawn over every child, install command line, doctor, `pi list` parsing, pi launch, platform, reporting
   with wrong-code, expired and unexpected-pass cases, the pins). Each test carries its `// req:` marker.
5. **Docs**: the "Install check" section in `packages/nana-setup/README.md` (what it proves and does
   not prove, the win32 steps); every sentence true of the code. Do not edit `HANDOFF.md` or
   `docs/sessions/`.

## Rules
- **Wrong code first** for every case. Mutation pairs (§5, 1–27) break the CODE, never an assertion.
- **No suite test may run, import or copy a seat script** (`acceptance.mjs` in this folder).
- No test writes the repository, the real `~/.claude`, `~/.pi` or `~/.local`; the check itself writes only
  inside its temporary home — the seat's acceptance compares the real home before and after.
- Do NOT touch the cc-hooks-windows lane's files (`settings.mjs`, `steps.mjs`, `doctor.mjs`, the hook
  scripts, `pipe-guard.mjs`, R-1050–R-1069). That lane lands first; this lane merges main after it.
- Fix the class, not the instance. Commit with explicit paths; message file under `$TMPDIR`. Keep
  gate-trigger text out of command strings.

## Then
`npm run req:tree`, `npm run map`, `npm run map:check`, `npm run readme:check`, `npm run test:locked`,
commit; then from the worktree root on this Mac:
`node docs/reviews/install-check-2026-10-12/acceptance.mjs > docs/reviews/install-check-2026-10-12/acceptance-output.txt 2>&1`
(must exit 0 with `install-check acceptance: 0 mismatch(es)`; it fails 25 of 30 at launch —
`acceptance-launch.txt`). Commit the output. Then push the branch and open a DRAFT pull request against
`main` titled "install-check (draft, for CI)" (no approval needed — the owner, 2026-10-11); wait for its CI run
and report both `install-check` jobs' item lines verbatim with the run ID (poll no faster than every 60 s).
The Windows job is expected red-first until cc-hooks-windows lands: report which lines FAIL or XFAIL.

## Report
≤ 40 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; files; each row and the clause its
cited test pins; mutation pairs red/green; the `test:locked` summary line and total checks; the LAST TWO
LINES of `acceptance-output.txt` verbatim; both CI jobs' item lines verbatim with the run ID; scope check
(`git diff --stat <the commit that adds this brief>..HEAD`); the one claim most likely wrong.
