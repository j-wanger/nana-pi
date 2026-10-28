VERDICT: DONE

# issues-home · build 5 technical record

This spend serves the current priority: clearer owner decisions and continuity between sessions.
All seven points named in brief 5 are closed. No new rows, test declarations or sealed tunables were added.
Commit: the single build-5 fix commit containing this record; the closing report names its hash.

## Items, files and rows

| Item | Files / existing test title | Closure |
|---|---|---|
| 1. Posting and answers, R-682 | `packages/nana-setup/claude/rules/nana-soul.md:37`, `templates/_shared/working-under-nana-pi.md:17`, `AGENTS.md:85`; `templates-render.test.mjs::soul continuity rule records carry before reports and session boundaries` | The three surfaces share identical sentences under 25 words. Only the seat posts, from the owner's gh account. Builders and reviewers report questions. The rule names ask plus blocking/optional/parked, next, the blocking title default, scan exit 0, all five hand-check categories, public replies, delete-never-edit and reading comments before acting. HANDOFF destinations and the runnable scan remain. |
| 2. Builder Scope, R-682 | `packages/nana-pack/prompts/builder-preamble.md:8`; the same R-682 title | One Scope bullet bans creating, editing, commenting on or closing GitHub issues and directs questions to the report. R-682 pins the bullet in Scope. |
| 3a. Issue numbers, R-2972 | `packages/nana-pack/lib/frontier-summary.mjs:108`; `handoff-issues.test.mjs::R-2972: issue titles appear once within caps with blocking then next then asks` | Every issue renders its number before its cleaned title, including blocking asks and Next items. Existing caps, order and once-only behavior remain. |
| 3b. Untagged asks, R-2972 | `packages/nana-pack/lib/handoff-issues.mjs:55`; the same R-2972 title | Missing priority labels produce a null kind, ordered after parked asks and rendered `[no tag]`, using the legacy convention. Explicit optional asks remain optional. |
| 3c. Owner count, R-2972 | `packages/nana-pack/lib/frontier-summary.mjs:63-65`; the same R-2972 title | Open for the owner excludes blocking asks from its count. A blocking-only issue set says none found in the owner subsection while retaining Blocking. |
| 4. Label shape, R-2973 | `packages/nana-pack/lib/handoff-issues.mjs:38`; `handoff-issues.test.mjs::R-2973: issue failures name cause time and URL without losing Next or check` | String labels, null labels, objects without names and non-string names fail as unreadable output. The single cause/time/URL failure line retains local Next/check and never claims none found. |

Unqualified test paths above are under `packages/nana-pack/tests/`.
The requirement diff preceded tagged test edits, which preceded implementation.
R-682, R-2972 and R-2973 gained these clauses; their evidence titles are unchanged.

## Wrong-code pairs

`build5-red.txt` records the initial run against the unchanged implementation: exit 1, three failing checks (R-682, R-2972, R-2973).
Each later mutation changed code or an instruction, never an assertion; all were restored.

| Mutation | Red result / evidence | Green result |
|---|---|---|
| Remove the issue-number prefix | R-2972 fails; `build5-pair-numbers.txt`, exit 1 | Full suite and targeted run pass. |
| Count blocking asks under Open for the owner | R-2972 fails; `build5-pair-count.txt`, exit 1 | Full suite and targeted run pass. |
| Default an untagged ask to optional | R-2972 fails; `build5-pair-untagged.txt`, exit 1 | Full suite and targeted run pass. |
| Remove label-element shape validation | R-2973 fails; `build5-pair-shape.txt`, exit 1 | Full suite and targeted run pass. |
| Remove the builder issue ban | R-682 fails; `build5-pair-builder.txt`, exit 1 | Full suite and targeted run pass. |
| Allow posting after merely running the scan | R-682 fails; `build5-pair-scan.txt`, exit 1 | Full suite and targeted run pass. |

## Existing tests edited

- `templates-render.test.mjs`: R-682's old literal rule pin became false. It now pins the common paragraph and the builder's Scope bullet.
- `handoff-issues.test.mjs`: R-2972's title-only Next expectation became false. Its replacement pins issue numbers, untagged asks and the nonblocking owner count, including a blocking-only set. R-2973 gains the brief's label-element shape cases.

Both files are named by brief 5 and the original forecast. No other test changed or was deleted.
The existing async handoff harness still awaits every case under its per-case limit.
Fixtures remain in OS temp directories; no suite test runs, imports or copies a seat script.
No line-by-line reader changed. The inherited CRLF, trailing space/tab and no-final-newline pointer cases remain green.

## Precedent and known bugs

Every brief-5 precedent file was read before design. The reader's filter and rendering stay in their existing modules.
`ASK_KIND_ORDER` is imported from its existing configuration; no helper was copied or moved.
Null kinds reuse the legacy untagged convention. No implementation departure was needed.
No listed known bug was changed. No protected HANDOFF, known-bug file or session archive was edited.

The full-suite command ran in the foreground with output on screen, as the brief requires.
Its summary, rather than redirected output, is retained in `build5-suite.txt`, following build 4's evidence pattern.
Other long outputs are committed beside this record. Evidence replaces local checkout/home prefixes with `<lane>`/`<home>` and strips trailing log whitespace.
The real working-gh block is retained in `build5-block-working.txt`; only its local path is normalized.
The absent-gh block is in `build5-block-absent.txt`. Working gh returned 3 Next items and 27 asks, all numbered.

## Commands and exits

- `npm run map:impact -- packages/nana-pack/lib/handoff-issues.mjs packages/nana-pack/lib/frontier-summary.mjs` → 0, before code edits.
- `node scripts/test.mjs handoff-issues templates-render` → 1 against the original implementation; `build5-red.txt`.
- `node scripts/test.mjs handoff-issues` → 1 for each of four separate rendering/shape mutations; `build5-pair-*.txt`.
- `node scripts/test.mjs templates-render` → 1 for each of two separate instruction mutations; `build5-pair-*.txt`.
- `node scripts/test.mjs handoff-issues templates-render frontier-summary frontier-golden frontier-hook hook-deadlines worker-lane` → 0; 7 files, 265 passing checks; `build5-targeted.txt`.
- First `npm run test:locked` → 1. R-682 contained two shall clauses, making it off-form and also failing the row-lookup check. The row now has one shall clause. No allowance or test was changed.
- `node scripts/test.mjs requirement-rows requirements-trace` → 0; 66 passing checks after the row correction; `build5-requirements.txt`.
- Final `npm run test:locked` → 0; plain foreground, one machine lock, output on screen; `build5-suite.txt`.

229 files: 227 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8605 pass, 0 fail, 44 skip · 565.4s

- `npm run map:check` → 0; 453 modules, 0 problems; `build5-map.txt`. The map needs no regeneration: imports and headers did not change.
- `npm run readme:check` → 0; 781 claims, 0 problems; `build5-readme.txt`.
- `node --experimental-strip-types scripts/requirements-trace.mjs` → 0; 2089 rows, 1847 traced, 0 off-form; `build5-trace.txt`.
- `node scripts/requirements-tree.mjs --root .` → 0; 0 problems; `build5-tree.txt`.
- `node scripts/known-bugs.mjs --root .` → 0; names=0, sizes=0; `build5-known-bugs.txt`.
- `env -u NANA_WORKTREE_ROOT node packages/nana-setup/bin/install-check.mjs` → 0, once locally on macOS; all 18 checks pass; `build5-install-check.txt`.
- `NANA_ROLE= node packages/nana-pack/bin/nana-frontier-summary.mjs --cwd . --limit-ms 5000` → 0, real working gh; `build5-block-working.txt`.
- The same producer with `NANA_CI_RECORDS_GH_COMMAND` naming a missing executable → 0; `build5-block-absent.txt`.
- `node scripts/lane-class.mjs --root . --files <changed implementation paths>` → 0: `hook: packages/nana-pack/lib/frontier-summary.mjs — directly imported by packages/nana-pack/bin/nana-frontier-summary.mjs`.
- `node scripts/identity-scan.mjs` → 0 after staging the implementation and evidence; findings=0.
- `git diff --cached --check` → 0.

No implementation edits followed the passing full suite. Post-commit checks cover the committed implementation; their results appear in the closing report.

## Original seals retained

No seal changed. `packages/nana-pack/lib/frontier-summary-config.mjs:31-36` retains its provenance:
1500 ms covers the measured warm maximum with 1.6-times margin and cold macOS/Linux, not cold Windows;
250 ms reserves rendering/writing within the measured 2500 ms launcher cap;
100 issues is three times the migrated 30-issue set, rounded up. All three R-2979 pins remain green.

## Not done

No unrelated bug was fixed. No live issue was created, edited, commented on or closed.
No push or new CI run was requested; Windows execution and final review/land remain seat work.
Adopted projects need `nana-setup project` to refresh shared guidance; long-lived processes need reload/restart to read the updated library.
