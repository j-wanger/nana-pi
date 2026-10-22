# Lane fresh-install — build brief 1 (2026-10-13 · feat/fresh-install · worktree ~/nana-pi-wt/fresh-install)

**Builder: pi gpt-6-luna** (small lane; every test named). Fresh session, THREE items. The contract is `CHANGE.md`
in this folder, including its last section "Plan review (2026-10-13)", which overrides §3/§5 where they differ
(the strict cutoff format, T1's every-line scan, R-1093's narrowed scope, R-1094's wording, one new title). Threat
model: honest variation in our tools' output in scope; deliberate forgery out. New IDs: R-1093–R-1096 only.

## Item 1 — the pin reader, the hint and the READMEs (R-1093, R-1094)
New `packages/nana-setup/lib/pi-pin.mjs` (six-tag header) as §3.2 and the plan-review section say: it reads
`PI_VERSION` and `PI_BEFORE` from `ci.yml`'s workflow env by name, accepts `PI_BEFORE` only as a valid UTC instant
of the form `YYYY-MM-DDTHH:MM:SSZ`, and otherwise yields the `<version>`/`<cutoff>` placeholders — never an empty
`--before=`. `PI_INSTALL_HINT` in `steps.mjs` is built from it. Each README command takes the cutoff and NOTHING
ELSE (a command that carries `--ignore-scripts` today keeps it; none gains it). Rows first; `npm run req:tree`.

## Item 2 — the bench fix line and the install check's failure diagnostics (R-1095, R-1096)
The bench's no-pi fix line names the pinned command (§3). The install check prints, after its result lines on any
FAIL, the `settings hooks:` line and the last pull-log record line as R-1096 says. The Git Bash lookup reads the
path variable under any letter case. Remove the two dead win32 doctor note labels as the declared retune of the
R-1081 pin (§3).

## Item 3 — the pinned evidence and the docs (R-1071, R-1075, R-1078, R-1079)
The tests §5 lists for those rows (pinning, not downgrading); R-1078's renamed title. `packages/nana-setup/README.md`
no longer says Windows hooks dispatch through or need Git Bash; `docs/reviews/cc-hooks-windows-2026-10-12/owner-windows-check.md`
step 2 is labelled PowerShell-only (nothing else on that page changes). The two R-1037 tests in
`doctor-runtime.test.mjs` gain `R-1093` in their markers.

## Rules
Wrong code first for every title (break the code, see it fail, restore — one break per title, record it). No suite
test runs, imports or copies a seat script. No test deletion except the renames §5 names. Do not touch `.github/`,
anything under `apps/desk/` except its README line, `CHANGE.md`, the seat scripts, `HANDOFF.md` or `docs/sessions/`.
Commit with explicit paths; message file under `$TMPDIR`. Keep gate-trigger text out of command strings.

## Done — do not report DONE until all of these pass on your last commit
`node docs/reviews/fresh-install-2026-10-13/seat-titles.mjs 1` → `0 missing` (23 missing at launch);
`SEAT_PWSH=/private/tmp/claude-501/-Users-example-nana-pi/dea1c010-278e-4392-a90f-df947a3a8b71/scratchpad/plan-fresh-install/pwsh/pwsh node docs/reviews/fresh-install-2026-10-13/acceptance.mjs > docs/reviews/fresh-install-2026-10-13/acceptance-output.txt 2>&1`
→ exit 0, `fresh-install acceptance: 0 mismatch(es)` (30/82 at launch — `acceptance-launch.txt`);
`npm run test:locked` (0 failed); `npm run map:check`; `npm run readme:check`;
`node scripts/requirements-tree.mjs --check`; the local install check `node packages/nana-setup/bin/install-check.mjs`
(every line PASS). Commit the outputs. Push and open a DRAFT pull request "fresh-install (draft, for CI)"
(pre-approved); when its CI run completes, report the macOS suite and both install-check jobs.

## Report
≤ 30 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each title with its red-under break; rows
changed and the clause each cited test pins; the `test:locked` summary line; the last line of each seat output;
the CI run ID with results; the one claim most likely wrong.
