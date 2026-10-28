VERDICT: DONE

# issues-home · build 4 technical record

This spend serves the shared-toolkit objective: reliable resume decisions and next actions.
The build fixes all seven brief items. No new requirement rows, tests or sealed tunables were added.
Commit: the single build-4 fix commit containing this record; the worker's closing report names its hash.

## Items, files and rows

| Brief item | Files / existing test title | Closure |
|---|---|---|
| 1. Pointer forms, R-2970 | `packages/nana-pack/lib/handoff-issues.mjs:22`; `packages/nana-pack/tests/handoff-issues.test.mjs::R-2970: only list-free issue pointers opt in and legacy bytes stay unchanged` | Backticks, bold, single and double quotes, comma, colon and semicolon suffixes now parse. Each form runs with LF and CRLF, trailing space/tab and no final newline. Existing explicit legacy-byte and no-read checks remain. |
| 2. Next placement, R-2972 | `packages/nana-pack/tests/handoff-issues.test.mjs::R-2972: issue titles appear once within caps with blocking then next then asks` | Exact `Next (2):` block contains local and remote next titles. The ask block cannot contain `[next]`. Existing order and once-only checks remain. No production placement change was needed. |
| 3. Probe failures, R-2973 | `packages/nana-pack/tests/handoff-issues.test.mjs::R-2973: issue failures name cause time and URL without losing Next or check` | Empty list then failed probe names `gh failed`; empty list then `Bot` names `unreadable output`; an injected spent clock names `timeout` and proves no probe starts. Each keeps Next/check and forbids `none found`. No production probe change was needed. |
| 4a. Carry destination, R-682 | `packages/nana-setup/claude/rules/nana-soul.md:37`, `templates/_shared/working-under-nana-pi.md:17`, `AGENTS.md:85`; `packages/nana-pack/tests/templates-render.test.mjs::soul continuity rule records carry before reports and session boundaries` | All three surfaces say `under Next or Open for the owner`. The changed sentence has 19 words. The byte-equality check remains green. |
| 4b. Runnable maker, A-084 | `REQUIREMENTS.md:175` | Maker names `node "$HOME/nana-pi/scripts/identity-scan.mjs" --stdin --root "$HOME/nana-pi"`, matching the rule. |
| 4c. Missing root, R-2976 | `scripts/identity-scan.mjs:168`; `packages/nana-pack/tests/identity-scan.test.mjs::R-2976: stdin scan prints only hit indices and counts with clean hit and bad-use exits` | Missing directory exits 2 with and without `--stdin`; no stdout. The CLI now rejects a missing/non-directory root in its bad-use path before invoking git. |
| 4d. Blank line, R-2973 | `packages/nana-pack/lib/frontier-summary.mjs:61`; R-2973 title above | When no local Next item remains, a failure is followed by exactly one blank line and the check. Legacy spacing is untouched. |

`REQUIREMENTS.md` changed first, then the tagged tests, then production code.
Rows R-2970, R-2972, R-2973, R-2976 and R-682 gained the brief's explicit clauses; evidence titles are unchanged.

## Wrong-code pairs

All mutations broke code, never assertions. Temporary mutations were restored before the green targeted run.
Full wrong-code output: `build4-red.txt` and `build4-pairs.txt`.

| Pair | Wrong implementation / observed result | Restored implementation |
|---|---|---|
| Pointer suffixes | Original restrictive URL regex fails R-2970. | Expanded delimiter class passes. |
| Next placement | `if (false)` sends next titles to asks; R-2972 fails its exact Next-block assertion. | Existing next dispatch passes. |
| Probe nonzero | Returning empty items on probe failure fails R-2973's one-failure-line assertion. | Existing failure dispatch passes. |
| Probe unknown type | Disabling the non-User guard fails R-2973's one-failure-line assertion. | Existing type guard passes. |
| Probe spent budget | Disabling the remaining-budget guard fails R-2973's no-probe assertion. | Existing budget guard passes. |
| Missing root | Changing the outer CLI error exit to 1 fails R-2976 for missing roots. | Exit 2 plus explicit root validation passes. |
| Carry destination | Original three rule sentences fail the updated R-682 pin. | Restored destination sentence passes. |
| Failure spacing | Original unconditional blank append fails R-2973's exact blank-line assertion. | Conditional append passes. |

The initial targeted run exited 1 for R-2970, R-2973 spacing and R-682.
The combined wrong-placement/bad-use run exited 1 for R-2972 and R-2976.
Each of the three probe mutation runs exited 1 at R-2973.
All eight pairs are green after restoration, in `build4-targeted.txt` (228 checks) and the full suite.

## Existing tests edited

- `handoff-issues.test.mjs`: extends only R-2970, R-2972 and R-2973 as brief 4 directs. No titles or declarations changed.
- `identity-scan.test.mjs`: extends only R-2976 with both missing-root CLI forms, each child bounded at 10 seconds.
- `templates-render.test.mjs`: moves the R-682 sentence pin with the requested rule change; the old literal becomes false.

All three files were named by the original forecast and this build's brief/precedent.
No test was deleted. No other existing test changed.
The handoff harness still awaits each case under its existing per-case limit.
Fixtures remain in OS temp directories. No suite test runs, imports or copies a seat script.

## Precedent, departures and known bugs

All brief-4 precedent files were read before design. The parser, rendering and bad-use paths remain in their existing modules.
`readHandoffIssues` is imported for the spent-budget seam; no helper was copied or moved.
No departure from the named implementation precedents was needed.

One observed difference from the brief: the starting missing-root command already exited 2 on this checkout.
The top-level catch provided that status. The fix makes bad-root use explicit and adds the missing pin rather than claiming an exit change.

Full-suite output stayed on screen as required; `build4-suite.txt` records its summary rather than redirecting the command.
Generated evidence replaces local checkout/home prefixes with `<lane>`/`<home>` and trims trailing whitespace; other block text is retained.
This matches build 3's evidence treatment and avoids publishing a local identity through tool paths.
The earlier build-3 install failure is closed by the required environment-clean install run; no gate or installer code changed.
No listed known bug was fixed or altered. No protected HANDOFF, known-bug file or session archive was edited.

## Commands and exit codes

- `npm run map:impact -- packages/nana-pack/lib/handoff-issues.mjs packages/nana-pack/lib/frontier-summary.mjs scripts/identity-scan.mjs` → 0, before code edits.
- `node scripts/test.mjs --verbose handoff-issues identity-scan templates-render` → 1 against original code/rules; `build4-red.txt`.
- `node scripts/test.mjs --verbose handoff-issues identity-scan` → 1 with wrong placement and bad-use exit; `build4-pairs.txt`.
- `node scripts/test.mjs --verbose handoff-issues` → 1 for each of three separate probe mutations; `build4-pairs.txt`.
- `node scripts/test.mjs --verbose handoff-issues identity-scan templates-render frontier-summary frontier-golden hook-deadlines rulings` → 0; 8 files, 228 passing checks; `build4-targeted.txt`.
- `npm run test:locked` → 0 twice, plain foreground commands, output on screen, one machine lock per run; final run includes normalized staged evidence; `build4-suite.txt`.
- `npm run map:check` → 0; 453 modules, 0 problems; `build4-map.txt`. Map entries did not change, so regeneration was unnecessary.
- `npm run readme:check` → 0; 781 claims, 0 problems; `build4-rails.txt`.
- `node --experimental-strip-types scripts/requirements-trace.mjs` → 0; 2089 rows, 1847 traced, 0 off-form; `build4-rails.txt`.
- `node scripts/requirements-tree.mjs --root .` → 0; 0 problems; `build4-rails.txt`.
- `node scripts/known-bugs.mjs --root .` → 0; names=0, sizes=0; `build4-rails.txt`.
- `node scripts/identity-scan.mjs` → 0; findings=0; `build4-rails.txt`.
- `env -u NANA_WORKTREE_ROOT node packages/nana-setup/bin/install-check.mjs` → 0, once locally on macOS; all 18 top-level checks pass; `build4-install-check.txt`.
- Working-gh producer: `NANA_ROLE= node packages/nana-pack/bin/nana-frontier-summary.mjs --cwd . --limit-ms 5000` → 0; exact block in `build4-block-working.txt` (3 Next, 27 asks).
- Absent-gh producer through `NANA_CI_RECORDS_GH_COMMAND` with a nonexistent executable → 0; exact block in `build4-block-absent.txt` (failure and check separated by one blank line).
- `node scripts/lane-class.mjs --root . --files <changed implementation paths>` → 0: `hook: packages/nana-pack/lib/frontier-summary.mjs — directly imported by packages/nana-pack/bin/nana-frontier-summary.mjs`.
- Initial staged evidence checks caught trailing log whitespace (exit 2) and local home paths (identity exit 1); both are closed by evidence normalization.
- `git diff --cached --check` → 0 after normalization.
- `node scripts/identity-scan.mjs` with all 4447 files staged → 0; findings=0.

229 files: 227 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8605 pass, 0 fail, 44 skip · 565.0s

## Original must-meets and seals retained

The nine original title pins remain green:

1. `handoff-issues.test.mjs::R-2970: only list-free issue pointers opt in and legacy bytes stay unchanged`
2. `handoff-issues.test.mjs::R-2971: one pinned gh call filters author and labels and warns at the cap`
3. `handoff-issues.test.mjs::R-2972: issue titles appear once within caps with blocking then next then asks`
4. `handoff-issues.test.mjs::R-2973: issue failures name cause time and URL without losing Next or check`
5. `packages/nana-setup/tests/hook-deadlines.test.mjs::R-2974: late-start objective hook keeps Next timeout and check lines when gh hangs`
6. `handoff-issues.test.mjs::R-2975: worker and reviewer paths never invoke gh`
7. `identity-scan.test.mjs::R-2976: stdin scan prints only hit indices and counts with clean hit and bad-use exits`
8. `handoff-issues.test.mjs::R-2977: real HANDOFF Next and Open sections are pointer-only`
9. `handoff-issues.test.mjs::R-2978: GitHub issue artifacts require the sealed location shape and register this issue set`

Unqualified test paths above are under `packages/nana-pack/tests/`.
R-2979's three seal tests remain unchanged. Definitions/provenance remain in `packages/nana-pack/lib/frontier-summary-config.mjs`:

- Lines 31–32: 1500 ms read limit, chosen 2026-10-28 from the 0.90 s warm maximum across 15 calls per CI OS, run 40693949252, with 1.6-times margin. Covers cold macOS/Linux, not cold Windows.
- Lines 33–34: 250 ms write reserve, chosen 2026-10-28 for render/write within the measured 2500 ms launcher cap.
- Lines 35–36: fetch cap 100, chosen 2026-10-28 as three times the migrated 30-issue set, rounded up.

## Not done

No live model session or subagent was started. No unrelated bug was fixed.
No push or new CI run was requested in brief 4; Windows execution and final review/land remain seat work.
The inherited migration notices remain: issues and replies are public, and adopted projects show stale shared guidance until `nana-setup project` refreshes it.
