# Lane tree — build brief 1 (2026-10-14 · feat/tree · worktree ~/nana-pi-wt/tree · base main 484329c)

**Builder: Claude Sonnet 5.5** (format lane: it changes the ledger format every new project inherits). The contract
is `CHANGE.md` in this folder, frozen at `afb4c01` after sol plan r3 LAND — read ALL of it, including the "Seat
revision", "Plan review r1", "r2" and "r3" sections at the end: R-1160 (a shared `ledgerReadProblem` that the checker
command and the report both call) and R-1161 (near-miss tree headings) were added there, R-1157 lost its refusal
clause, and the leaf total is the base + 12. The owner's words it serves are in §1 and §6. Threat model (§1): honest
variation in scope, including CRLF, a BOM and a UTF-16 file from Windows PowerShell 5.1; forgery out. New IDs:
R-1150–R-1161 only; R-1162–R-1169 stay unused.

## Build in this order
1. Rows (§2 text exactly, one `shall` each, under the headings §2 names), then
   `node scripts/requirements-tree.mjs --write` and R-291's literal (the base total + 12; 1,125 at this base).
2. The tests, by exact title (§5 T1–T15, each with its `// req:` line directly above the check call), run against the
   base code first so every new check is seen red; commit them.
3. The checker (§3.2 and the r1 section): CRLF in `parseLedger`, `ledgerReadProblem`, R-1159's one-line no-tree
   problem, R-1161's near-miss scan in `checkTree` over the whole ledger (not only when there is no tree), `--root <dir>`
   resolved against the cwd. Then the report's one `ledgerReadProblem` call (§3.3) — nothing else in the report.
4. The seeds and Part G (§3.1: CAP-90, FEAT-900, SUB-900–SUB-904), the six skills (§3.4, with the flat-ledger
   carve-out), the README lines §4 names. Regenerate the outline and the code map.

## Rules
Wrong code first for every new check; a mutation breaks code or shipped text, never an assertion. No suite test runs,
imports or copies a seat script (`acceptance.mjs`, `seat-titles.mjs`, `probes/`). Do not touch: `CHANGE.md`, the seat
scripts, the research and fact-check files, `HANDOFF.md`, `docs/sessions/`, and everything in §3.5 (the shared working
section, AGENTS.md, CLAUDE.md, nana-soul, `copier.yml`, both rails, `packages/nana-setup/**`, the pack's bin list,
`handoff-asks.mjs`, the rest of the report, `template.html`, both main guards, nana-pi's tree headings, the assessments
store). Never write in another project's folder; tests use temp folders. Commit with explicit paths; message file under
`$TMPDIR`; end each message with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## Done — do not report DONE until all of these pass on your last commit
`node docs/reviews/tree-2026-10-14/seat-titles.mjs 1` → `0 missing` (26 at launch);
`node docs/reviews/tree-2026-10-14/acceptance.mjs > docs/reviews/tree-2026-10-14/acceptance-output.txt 2>&1` → every
case passes except the three marked `(f, seat item)` (HANDOFF and the session entry, which the seat writes); 135 build
cases fail at launch (`acceptance-launch.txt`); the run takes about 100 seconds and needs copier through `uvx`;
`npm run test:locked` (0 failed); `npm run map:check`; `npm run readme:check`; `node scripts/requirements-tree.mjs --check`;
`npm run template:accept`. Commit the acceptance output. Push the branch and open a DRAFT pull request "tree (draft, for
CI)" (pre-approved). When its CI run completes, read the Windows job log once
(`gh api repos/j-wanger/nana-pi/actions/jobs/<job id>/logs`) and report T8–T11, T13, T14 and T15 there. No Windows claim
lands that CI did not show; a red one is BLOCKED with its log lines.

## Report
≤ 35 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each row and the title that pins it, with the red
you saw first; the CI run ID with those Windows results; the `test:locked` summary line; the last lines of each seat
output; the one claim most likely wrong.
