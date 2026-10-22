# Lane seat-guide — build brief 1 (2026-10-14 · feat/seat-guide · worktree ~/nana-pi-wt/seat-guide · base main 484329c)

**Builder: Claude Sonnet 5.5.** The contract is `CHANGE.md` in this folder, INCLUDING its final "Base update" and "Plan
review r1" sections — sol plan r1 said LAND. The owner's request it implements (2026-10-13): "We also need to add instructions
on how to be a good seat, the opus seat on windows is checking the work done by the worker every turn". Threat model:
honest variation in scope (an edit that drops, duplicates or adds a guide bullet or drops the rule from a list; CRLF; a
stale Windows copy); forgery and a seat that ignores the rule out. New IDs: R-1140–R-1142 only; R-301 reworded as §2 says.

## Build in this order
1. Rows first (§2, text exactly as drafted; R-301's reword; evidence cells cite the §5 titles), then
   `node scripts/requirements-tree.mjs --write` and R-291's literal (base total + 3; 1,116 at this base).
2. The tests (§5 exact titles, each with its `// req:` line directly above the check call), run against the base code
   first so every new check is seen red; commit them.
3. The guide `packages/nana-setup/claude/rules/nana-seat.md`, byte-equal to `nana-seat.proposed.md`; `"nana-seat.md"`
   appended to `CLAUDE_RULES` (`packages/nana-setup/lib/steps.mjs:48`) and to the rule list in
   `packages/nana-setup/lib/state-manifest.mjs:59`; the pointer line, byte-equal to `pointer.proposed.txt`, right after the
   "Seat land review" bullet in `templates/_shared/working-under-nana-pi.md` and in `AGENTS.md`'s shared region (the region
   stays a byte copy of the template); one row in `packages/nana-setup/README.md` right after the nana-standards row;
   the existing manifest, dry-run label, uninstall and restore test inputs extended as §4 lists. Regenerate the code map.

## Rules
Wrong code first for every new check; a mutation breaks code or shipped text, never an assertion. No suite test runs,
imports or copies a seat script (`acceptance.mjs`, `seat-titles.mjs`, `sim-guide-v2.mjs`). Do not touch: `CHANGE.md`,
the two proposed files, the seat scripts, `HANDOFF.md`, `docs/sessions/`, `nana-soul.md`, `nana-standards.md`, the
writing rule, the runtime matrix, `ruleSource`, `doctor.mjs`, `uninstall.mjs`, `fsops.mjs`, `project.mjs`,
`install-check-config.mjs`, any pi extension, `.github/`, the desk, and anything under `~/.claude`. Never run
`nana-setup install` against your real home; tests use temp homes. Commit with explicit paths; message file under
`$TMPDIR`; end each message with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## Done — do not report DONE until all of these pass on your last commit
`node docs/reviews/seat-guide-2026-10-14/seat-titles.mjs 1` → `0 missing` (16 at launch);
`node docs/reviews/seat-guide-2026-10-14/acceptance.mjs > docs/reviews/seat-guide-2026-10-14/acceptance-output.txt 2>&1`
→ exit 0, `seat-guide acceptance: 0 mismatch(es)` (34 at launch; it requires a committed, clean tree);
`npm run test:locked` (0 failed); `npm run map:check`; `npm run readme:check`; `node scripts/requirements-tree.mjs --check`;
`npm run template:accept`; `node packages/nana-setup/bin/install-check.mjs` (this lane edits `packages/nana-setup/`).
Commit the acceptance output. Push the branch and open a DRAFT pull request "seat-guide (draft, for CI)" (pre-approved).
When its CI run completes, read the Windows job log once (`gh api repos/j-wanger/nana-pi/actions/jobs/<job id>/logs`)
and report the results of `seat-rule.test.mjs`, the R-350 title in `win32-degrade.test.mjs` and the two R-1142 titles —
then report; do not wait for another notification.

## Report
≤ 30 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each row and the title that pins it, with the red
you saw first; the CI run ID with those Windows results; the `test:locked` summary line; the last line of each seat
output; the one claim most likely wrong.
