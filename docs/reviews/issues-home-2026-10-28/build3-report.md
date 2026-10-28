# issues-home · build 3 technical record

VERDICT: PARTIAL

All requested code and documentation fixes are complete. The locked full suite passed.
The single required local install rehearsal failed at `pi post-edit`.
Its retained fixture record reports that the write hit the inherited `NANA_WORKTREE_ROOT` boundary.
No gate behavior or unrelated install code was changed to make that rehearsal pass.
The seat must resolve the rehearsal environment before this lane can be DONE.

This spend serves the shared-toolkit objective and the priority to remove unnecessary ceremony.

## Files, rows and closures

No new requirement rows, test declarations, or tunable numbers were added.
`REQUIREMENTS.md` changed first, then the tagged tests, then production code.

| Brief item | Files / existing test title | Evidence |
|---|---|---|
| 1. Public posting rule | `packages/nana-setup/claude/rules/nana-soul.md:37`, `templates/_shared/working-under-nana-pi.md:17`, `AGENTS.md:85`; R-682 | `templates-render.test.mjs::soul continuity rule records carry before reports and session boundaries` pins the same six issue sentences on all three surfaces. Each sentence is under 25 words. It names the executable Node form, scan before hand-check, four-word limit, public replies and delete-never-edit. |
| 2. Organization owners | `packages/nana-pack/lib/handoff-issues.mjs:39`; R-2973 | `handoff-issues.test.mjs::R-2973: issue failures name cause time and URL without losing Next or check` feeds `[]`, then `Organization`. The second host-qualified API call consumes only the remaining read budget. It also pins elapsed time across both calls and no stderr guessing. |
| 3. Pointer-only suite policy | `AGENTS.md:154`; R-2977 | The HANDOFF writing section now explains that list items fail the suite because GitHub issues hold them. Existing R-2977 still checks both actual sections. |
| 4a. Legacy bytes and no read | `handoff-issues.test.mjs::R-2970: only list-free issue pointers opt in and legacy bytes stay unchanged` | A plain Open paragraph and a file with no Open section but an issues URL elsewhere match explicit legacy bytes. An injected reader throws if invoked, and the fake-gh log stays unchanged. |
| 4b. Output shapes | `handoff-issues.test.mjs::R-2973: issue failures name cause time and URL without losing Next or check` | An object and a row with null labels each yield exactly one failure line, local Next and the check line. |
| 4c. Exact labels | `handoff-issues.test.mjs::R-2971: one pinned gh call filters author and labels and warns at the cap` | `task`, `asks` and `Ask` never reach the block. |
| 5. No false emptiness | R-2973 above; `packages/nana-pack/lib/frontier-summary.mjs:59` | Missing and failed reads print no `none found`, with and without local Next items. |
| 5. Optional before parked | `handoff-issues.test.mjs::R-2972: issue titles appear once within caps with blocking then next then asks` | Reversed network order displays optional before parked, using imported `ASK_KIND_ORDER`. |
| 5. Useful shared timeout | `packages/nana-pack/lib/gh-runner.mjs:46`; R-2974 | The shared result says `gh timed out after 123 ms` in the injected case. Land and CI-records consumers keep using that shared function. |
| 5. Real slow gh outside hook case | R-2973 above | Its timeout fixture actually starts a sleeping fake gh with budget remaining; the log proves one process started. |
| 5. Frontier-only limit / no default | `hook-deadlines.test.mjs::R-2974: late-start objective hook keeps Next timeout and check lines when gh hangs` | Captures all four producer argv forms; only frontier gets `--limit-ms`. Observes the actual default runner's spawn options: no timeout property. |
| 5. No echoed stdin word | `identity-scan.test.mjs::R-2976: stdin scan prints only hit indices and counts with clean hit and bad-use exits` | Clean stdout and stderr are empty; hit stdout is exact. No input word appears on either stream. |
| 5. Framing and effects | `packages/nana-pack/extensions/nana-frontier-summary.ts:6`, `packages/nana-pack/lib/frontier-summary-config.mjs:20`; R-2972 | Header names gh process/network effects. Issues framing lives beside `FRONTIER_DATA_NOTE` and has an exact-value assertion in R-2972. |
| 5. Tabs | `packages/nana-pack/lib/gh-runner.mjs`, `packages/nana-pack/tests/handoff-issues.test.mjs` | Leading code indentation now uses tabs. |
| 5. Trailing slash | R-2970 above | `/issues/` works alongside plain, angle-bracket, Markdown and query forms, with CRLF, trailing spaces/tabs and no final newline. |

`packages/nana-pack/README.md` now documents the bounded owner-type probe, exact labels, optional/parked order, trailing slash and failure output.
`docs/code-map.md` was regenerated.

## Must-meet titles retained

All paths below are relative to the repository root.

1. `packages/nana-pack/tests/handoff-issues.test.mjs::R-2970: only list-free issue pointers opt in and legacy bytes stay unchanged`
2. `packages/nana-pack/tests/handoff-issues.test.mjs::R-2971: one pinned gh call filters author and labels and warns at the cap`
3. `packages/nana-pack/tests/handoff-issues.test.mjs::R-2972: issue titles appear once within caps with blocking then next then asks`
4. `packages/nana-pack/tests/handoff-issues.test.mjs::R-2973: issue failures name cause time and URL without losing Next or check`
5. `packages/nana-setup/tests/hook-deadlines.test.mjs::R-2974: late-start objective hook keeps Next timeout and check lines when gh hangs`
6. `packages/nana-pack/tests/handoff-issues.test.mjs::R-2975: worker and reviewer paths never invoke gh`
7. `packages/nana-pack/tests/identity-scan.test.mjs::R-2976: stdin scan prints only hit indices and counts with clean hit and bad-use exits`
8. `packages/nana-pack/tests/handoff-issues.test.mjs::R-2977: real HANDOFF Next and Open sections are pointer-only`
9. `packages/nana-pack/tests/handoff-issues.test.mjs::R-2978: GitHub issue artifacts require the sealed location shape and register this issue set`

## Seals and precedent

No numeric seal changed. Definitions and provenance remain in `packages/nana-pack/lib/frontier-summary-config.mjs`:

- Lines 31–32: read limit 1500 ms. Chosen 2026-10-28: 1.6 times the 0.90 s warm maximum across 15 calls per CI OS in run 40693949252. Covers cold macOS/Linux at 1.31/1.27 s, not cold Windows at 6.39 s.
- Lines 33–34: write reserve 250 ms. Chosen 2026-10-28 for render/write within the measured 2500 ms launcher cap.
- Lines 35–36: fetch cap 100. Chosen 2026-10-28: three times the migrated 30-issue set, rounded up.
- Line 20: issues framing is now a configured vocabulary value. R-2972 pins the exact existing wording; its mutation goes red.

The three R-2979 seal titles remain unchanged and green.
All named precedent files were read before design.
No helper was copied or moved in this build; `ASK_KIND_ORDER`, `ghResult`, `ghDefault` and `readHandoffIssues` are imported from their existing homes.

Named departures:

- The original one-command assumption becomes one list call plus one type probe only after an empty list. Brief 3 explicitly requires it for real gh's organization behavior.
- R-2974 spies on Node's spawn boundary using `syncBuiltinESMExports`, restoring it in `finally`. The no-default-timeout pin must observe absent spawn options without waiting for a default deadline.
- Live block evidence replaces the machine-local checkout prefix with `<lane>`, rather than publishing a home directory. Other block bytes, issue order and measured failure time are retained.
- The full-suite output stayed on screen as explicitly required; its summary is recorded below rather than redirecting that run.

The legacy block's known limits, synchronous pi read, alternate-project pointer behavior, command-seam name and product-page ask count remain unchanged.
No known-bug entry was edited or fixed outside the brief.
`HANDOFF.md`, known-bug files and session archives were not edited.

## Existing tests edited

- `handoff-issues.test.mjs`: extended R-2970–R-2973 assertions and temporary fake-gh responses; all other changes are tab indentation. Brief 3 explicitly names this file. R-2975 and R-2977–R-2979 behavior assertions are unchanged.
- `templates-render.test.mjs`: replaced the now-false R-682 old wording pin. Named in the original forecast and brief 3.
- `identity-scan.test.mjs`: strengthened R-2976's no-echo predicate and clean-stream assertion. Named in the original forecast and brief 3.
- `hook-deadlines.test.mjs`: extended R-2974 for producer argv, default runner options and timeout detail. Its injected list response is nonempty so its original list-budget assertion still measures only list calls. Named in the original forecast and brief 3.

No test was deleted. No test assertion was inverted for mutation proof.
Async cases remain awaited with per-case limits. Fixtures and mutation trees live in OS temp directories, never the running repository.

## Commands and exit codes

- Initial targeted wrong-code run: `npm test -- handoff-issues.test templates-render.test identity-scan.test hook-deadlines.test` → 1. See `build3-red.txt`.
- Manual temporary-tree mutation runner: `node /tmp/issues-home-build3-pairs.mjs` → 0; 17/17 code mutations red at the intended tagged check. See `build3-pairs.txt`.
- `npm run map` → 0; see `build3-map.txt`.
- `npm test -- handoff-issues.test identity-scan.test templates-render.test hook-deadlines.test hook-producers.test frontier-summary.test frontier-golden.test ci-records.test land.test land-ci-records.test` → 0; 11 files, 308 checks passed. See `build3-targeted.txt`.
- `npm run test:locked` → 0, foreground, on-screen, one machine lock.
- `npm run map:check` → 0; 450 modules, 0 problems.
- `npm run readme:check` → 0; 776 claims, 0 problems.
- `node --experimental-strip-types scripts/requirements-trace.mjs` → 0; 2079 rows, 1837 traced, 0 off-form rows.
- `node scripts/requirements-tree.mjs --root .` → 0; 0 problems.
- `node scripts/known-bugs.mjs` → 2 (missing required root); corrected `node scripts/known-bugs.mjs --root .` → 0.
- `node scripts/identity-scan.mjs` → 0; findings=0.
- `node packages/nana-setup/bin/install-check.mjs` → 1, run once on macOS. Seventeen items passed; `pi post-edit` failed. See `build3-install-check.txt`.
- Producer with working gh: `NANA_ROLE= node packages/nana-pack/bin/nana-frontier-summary.mjs --cwd . --limit-ms 5000` → 0. Three Next titles and 27 asks. See `build3-block-working.txt`.
- Producer with absent gh through the command seam → 0. One named failure, no false empty lists, check retained. See `build3-block-absent.txt`.

228 files: 226 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8593 pass, 0 fail, 44 skip · 565.9s

## Not done

The local install check is not green. Its fixture's write result names the inherited lane boundary, not an issue-reader failure.
No unrelated gate or installer fix was attempted, and no second local rehearsal was run.
The seat owns resolving that carry before land; this report records it without editing the protected HANDOFF.
Review and land remain seat work. CI results for the committed revision are reported separately after its run finishes.
