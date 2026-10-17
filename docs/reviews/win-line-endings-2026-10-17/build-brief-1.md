# Lane win-line-endings — build brief 1 (2026-10-17 · feat/win-line-endings · tip after the seat's plan commit)

**Builder: Claude Sonnet 5**, a subagent in this worktree. The second Windows fix lane under the owner's feature-first
ruling: build the feature to its must-meet tests and nothing more.

**What to build.** `must-meet.md` in this folder is the plan of record: the design paragraph, rows R-1320 to R-1322, the
must-meet tests LE1 to LE3 (exact titles in `seat-titles.mjs`) and LE4, the Windows CI evidence. The triage behind it is
`docs/reviews/windows-fixes-2026-10-17/rows.json` (read the entries for ci-workflow, code-map, requirements-tree,
entry-guidance, templates-render, product-report and mutation-runner) and `plan.md` §2 L2.
1. `.gitattributes`: add `* text=auto eol=lf`; keep its fixtures line.
2. The TypeScript template (`templates/typescript/template/scripts/code-map.mjs`, `scripts/readme-check.mjs`,
   `tests/requirements-trace.ts`): split lines on `/\r?\n/` wherever they split on `"\n"`, and make any line-end match
   tolerate a trailing `\r`. Check the Python template's equivalents with the same test and change them only if it fails.
3. `packages/nana-pack/lib/mutation-runner.mjs`: `-c core.autocrlf=false` on the scratch `git worktree add` and on the
   reset. Gate `mutation-runner.test.mjs`'s fake-npm sub-case to POSIX with a printed reason.
4. LE1 is a new test file, `packages/nana-pack/tests/line-endings.test.mjs` (six-tag header; clones into a temp folder
   only). LE2 joins `templates-render.test.mjs` beside its render checks (it needs the same copier render; follow how
   that file renders and skips when copier is missing). LE3 joins `mutation-runner.test.mjs`.
A product-report or other test that splits on `"\n"` and still fails under a CRLF clone after step 1 gets `/\r?\n/`;
list each such edit.

**Order.** Rows first (`planned`), then the checks with `// req:` markers, red before the code, then the code. Rows
flip to `implemented` with their titles in the Evidence cell. R-291's leaf total moves by three.

**Rules.** Work only in this worktree. Run only the test files you touch, in the foreground
(`node scripts/test.mjs <file>`), each tool call under 5 minutes; never the full suite or a background command. No
test writes this checkout: clones, renders and fixture repositories go under the test's temp folder. Never write the
real home folder, `~/.claude` or `~/.pi`; never write a person's name or a provider or machine name; never write
`process.env.PI_CODING_AGENT_DIR` or end a line with `PI_CODING_AGENT_DIR`. Write the must-meet checks and no other new
test; edit an existing check only where this change makes it false, and list each edit. Do not touch `HANDOFF.md`,
`docs/sessions/` or the seat's files. Commit with explicit paths, prefix `win-line-endings: `, ending
`Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`; push to `origin feat/win-line-endings` after each commit.

## Done
The touched test files green on macOS. A line-ending rehearsal: `git clone -q -c core.autocrlf=true <this worktree>
<a temp folder>`, then in that clone run `node scripts/test.mjs` on each LE4 file; all green.
`node docs/reviews/win-line-endings-2026-10-17/seat-titles.mjs 1` → `0 missing`; `npm run req:tree` then
`node scripts/requirements-tree.mjs --check`; `node scripts/code-map.mjs --check`; `npm run -s readme:check`;
`node scripts/requirements-trace.mjs`. The seat then opens a draft pull request and reads the Windows leg.

## Report
≤ 15 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; the touched files' summary lines on macOS and in
the line-ending clone; the last line of each Done command; each existing check you edited and why; the one claim most
likely wrong on Windows.
